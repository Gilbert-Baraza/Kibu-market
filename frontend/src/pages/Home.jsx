import {
  Suspense,
  lazy,
  startTransition,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Navbar from "../components/Navbar";
import SearchBar from "../components/SearchBar";
import ProductList from "../components/ProductList";
import MessagesScreen from "../components/MessagesScreen";
import MyListingsScreen from "../components/MyListingsScreen";
import UserProfileScreen from "../components/UserProfileScreen";
import ToastViewport from "../components/ToastViewport";
import PaginationControls from "../components/PaginationControls";
import AuthScreen from "../components/AuthScreen";
import { TrendingCarousel } from "../components/TrendingCarousel";
import { ApiError, apiClient, normalizeThread, sessionStore } from "../api/client";
import { useSocket } from "../hooks/useSocket";

const ProductModal = lazy(() => import("../components/ProductModal"));
const SellItemForm = lazy(() => import("../components/SellItemForm"));

const SAVED_ITEMS_STORAGE_KEY = "kibu-market-saved-items";
const LISTINGS_PAGE_LIMIT = 12;
const THREADS_PAGE_LIMIT = 10;
const MESSAGES_PAGE_LIMIT = 20;
const SAVED_ITEMS_PAGE_LIMIT = 6;
const DEFAULT_PAGINATION = {
  page: 1,
  limit: LISTINGS_PAGE_LIMIT,
  total: 0,
  totalPages: 1,
  hasNextPage: false,
  hasPrevPage: false,
};

function readStoredJson(key, fallbackValue) {
  try {
    const storedValue = window.localStorage.getItem(key);
    return storedValue ? JSON.parse(storedValue) : fallbackValue;
  } catch {
    return fallbackValue;
  }
}

function sortProductsByLatest(products) {
  return [...products].sort((a, b) => {
    const left = a.createdAt ? new Date(a.createdAt).getTime() : Number(a.id) || 0;
    const right = b.createdAt ? new Date(b.createdAt).getTime() : Number(b.id) || 0;
    return right - left;
  });
}

function getThreadSortTime(thread) {
  const lastMessage = thread.messages?.[thread.messages.length - 1];
  const value = thread.updatedAt ?? lastMessage?.createdAt ?? null;
  const timestamp = value ? new Date(value).getTime() : 0;
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function sortThreadsByLatest(threads) {
  return [...threads].sort((a, b) => getThreadSortTime(b) - getThreadSortTime(a));
}

function createPaginationState(overrides = {}) {
  return { ...DEFAULT_PAGINATION, ...overrides };
}

function mergeUniqueMessages(currentMessages = [], incomingMessages = []) {
  const messageMap = new Map();

  [...currentMessages, ...incomingMessages].forEach((message) => {
    if (!message?.id) {
      return;
    }

    messageMap.set(String(message.id), message);
  });

  return Array.from(messageMap.values()).sort((left, right) => {
    const leftTime = left.createdAt ? new Date(left.createdAt).getTime() : 0;
    const rightTime = right.createdAt ? new Date(right.createdAt).getTime() : 0;
    return leftTime - rightTime;
  });
}

function applyReadReceiptToMessages(messages = [], { readMessageIds = [], readerId } = {}) {
  if (!Array.isArray(messages) || messages.length === 0 || readMessageIds.length === 0) {
    return messages;
  }

  const normalizedReaderId = readerId ? String(readerId) : "";
  const readMessageIdSet = new Set(readMessageIds.map((id) => String(id)));

  return messages.map((message) => {
    if (!readMessageIdSet.has(String(message.id))) {
      return message;
    }

    const nextReadBy = normalizedReaderId && !message.readBy.includes(normalizedReaderId)
      ? [...message.readBy, normalizedReaderId]
      : message.readBy;

    return {
      ...message,
      readBy: nextReadBy,
      isRead: true,
    };
  });
}

function applyReadReceiptToThread(thread, receipt) {
  if (!thread) {
    return thread;
  }

  return {
    ...thread,
    messages: applyReadReceiptToMessages(thread.messages, receipt),
  };
}

function mergeProductsWithThreads(products, threads) {
  const productMap = new Map(products.map((product) => [String(product.id), { ...product }]));

  threads.forEach((thread) => {
    if (thread.product && !productMap.has(String(thread.product.id))) {
      productMap.set(String(thread.product.id), {
        ...thread.product,
        messages: [...thread.messages],
      });
    }

    const targetProduct = productMap.get(String(thread.productId));
    if (targetProduct) {
      if (thread.product) {
        Object.assign(targetProduct, thread.product);
      }
      targetProduct.messages = [...thread.messages];
    }
  });

  return Array.from(productMap.values());
}

function replaceProduct(products, nextProduct) {
  const nextProducts = products.some((product) => String(product.id) === String(nextProduct.id))
    ? products.map((product) =>
        String(product.id) === String(nextProduct.id) ? nextProduct : product,
      )
    : [nextProduct, ...products];

  return sortProductsByLatest(nextProducts);
}

function mergeProductCollections(existingProducts, incomingProducts) {
  const productMap = new Map(existingProducts.map((product) => [String(product.id), product]));

  incomingProducts.forEach((product) => {
    if (!product?.id) {
      return;
    }

    productMap.set(String(product.id), {
      ...(productMap.get(String(product.id)) ?? {}),
      ...product,
    });
  });

  return Array.from(productMap.values());
}

function updateSellerRatingForProduct(product, sellerId, nextRating) {
  if (!product?.seller || String(product.seller.id) !== String(sellerId)) {
    return product;
  }

  return {
    ...product,
    seller: {
      ...product.seller,
      rating: nextRating,
    },
  };
}

function updateSellerRatingForThread(thread, sellerId, nextRating) {
  if (!thread?.product) {
    return thread;
  }

  return {
    ...thread,
    product: updateSellerRatingForProduct(thread.product, sellerId, nextRating),
  };
}

function upsertThread(currentThreads, incomingThread, { messageMode = "preserve" } = {}) {
  if (!incomingThread?.id) {
    return currentThreads;
  }

  const existingThread = currentThreads.find((thread) => thread.id === incomingThread.id);
  if (!existingThread) {
    return sortThreadsByLatest([
      {
        ...incomingThread,
        messages: incomingThread.messages ?? [],
      },
      ...currentThreads,
    ]);
  }

  let nextMessages = existingThread.messages ?? [];

  if (messageMode === "replace") {
    nextMessages = incomingThread.messages?.length ? incomingThread.messages : existingThread.messages;
  } else if (messageMode === "append") {
    nextMessages = mergeUniqueMessages(existingThread.messages, incomingThread.messages);
  } else {
    nextMessages = incomingThread.messages?.length
      ? mergeUniqueMessages(existingThread.messages, incomingThread.messages)
      : existingThread.messages;
  }

  const mergedThread = {
    ...existingThread,
    ...incomingThread,
    product: incomingThread.product ?? existingThread.product,
    messages: nextMessages,
  };

  return sortThreadsByLatest(
    currentThreads.map((thread) => (thread.id === mergedThread.id ? mergedThread : thread)),
  );
}

function isAbortError(error) {
  return error?.name === "AbortError" || error?.code === 20;
}

function isRateLimitError(error) {
  return error instanceof ApiError && error.status === 429;
}

function getThreadUnreadCountForUser(thread, currentUser) {
  if (!currentUser || !thread) {
    return 0;
  }

  const isSeller = String(thread.sellerId) === String(currentUser.id);
  if (thread.unreadCounts) {
    return isSeller
      ? Number(thread.unreadCounts.seller ?? 0)
      : Number(thread.unreadCounts.buyer ?? 0);
  }

  return Number(thread.unreadCount ?? 0);
}

function Home() {
  const [products, setProducts] = useState([]);
  const [marketProducts, setMarketProducts] = useState([]);
  const [threads, setThreads] = useState([]);
  const [productsPagination, setProductsPagination] = useState(createPaginationState());
  const [threadsPagination, setThreadsPagination] = useState(createPaginationState({ limit: THREADS_PAGE_LIMIT }));
  const [messagePaginationByThread, setMessagePaginationByThread] = useState({});
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [sortBy, setSortBy] = useState("latest");
  const [savedItems, setSavedItems] = useState(() =>
    readStoredJson(SAVED_ITEMS_STORAGE_KEY, []),
  );
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activePage, setActivePage] = useState("market");
  const [selectedMessageProductId, setSelectedMessageProductId] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [bootstrapError, setBootstrapError] = useState("");
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);
  const [isListingSubmitting, setIsListingSubmitting] = useState(false);
  const [listingSubmitStatusMessage, setListingSubmitStatusMessage] = useState("");
  const [pendingActionId, setPendingActionId] = useState(null);
  const [isMessageSending, setIsMessageSending] = useState(false);
  const [onlineUserIds, setOnlineUserIds] = useState([]);
  const [typingByConversation, setTypingByConversation] = useState({});
  const [isLoadingMoreThreads, setIsLoadingMoreThreads] = useState(false);
  const [isLoadingOlderMessages, setIsLoadingOlderMessages] = useState(false);
  const [savedItemsPage, setSavedItemsPage] = useState(1);
  const listingsSectionRef = useRef(null);
  const hasInitializedListingFiltersRef = useRef(false);
  const socketToken = sessionStore.getToken();

  useEffect(() => {
    if (toasts.length === 0) {
      return undefined;
    }

    const timers = toasts.map((toast) =>
      window.setTimeout(() => {
        setToasts((currentToasts) => currentToasts.filter((item) => item.id !== toast.id));
      }, 3200),
    );

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [toasts]);

  useEffect(() => {
    window.localStorage.setItem(SAVED_ITEMS_STORAGE_KEY, JSON.stringify(savedItems));
  }, [savedItems]);

  useEffect(() => {
    if (activePage !== "messages") {
      return undefined;
    }

    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
    };
  }, [activePage]);

  useEffect(() => {
    setSavedItemsPage(1);
  }, [savedItems.length]);

  useEffect(() => {
    const controller = new AbortController();

    const loadAppData = async () => {
      setIsBootstrapping(true);
      setBootstrapError("");

      const token = sessionStore.getToken();

      try {
        const [productsPage, fetchedUser, threadsPage] = await Promise.all([
          apiClient.getProductsPage({ signal: controller.signal, page: 1, limit: LISTINGS_PAGE_LIMIT }),
          token
            ? apiClient.getCurrentUser(controller.signal).catch((error) => {
                if (error instanceof ApiError && error.status === 401) {
                  sessionStore.clear();
                  return null;
                }

                throw error;
              })
            : Promise.resolve(null),
          token
            ? apiClient.getThreadsPage({ signal: controller.signal, page: 1, limit: THREADS_PAGE_LIMIT }).catch((error) => {
                if (error instanceof ApiError && error.status === 401) {
                  sessionStore.clear();
                  return { items: [], pagination: createPaginationState({ limit: THREADS_PAGE_LIMIT }) };
                }

                if (isRateLimitError(error)) {
                  return {
                    items: [],
                    pagination: createPaginationState({ limit: THREADS_PAGE_LIMIT }),
                    rateLimited: true,
                    error,
                  };
                }

                throw error;
              })
            : Promise.resolve({ items: [], pagination: createPaginationState({ limit: THREADS_PAGE_LIMIT }) }),
        ]);

        setCurrentUser(fetchedUser);
        setMarketProducts(productsPage.items);
        setThreads(sortThreadsByLatest(threadsPage.items));
        setThreadsPagination(threadsPage.pagination ?? createPaginationState({ limit: THREADS_PAGE_LIMIT, total: threadsPage.items.length }));
        setProducts(mergeProductsWithThreads(productsPage.items, threadsPage.items));
        setProductsPagination(productsPage.pagination ?? createPaginationState({ total: productsPage.items.length }));
        setMessagePaginationByThread({});

        if (threadsPage.rateLimited) {
          showToast({
            type: "error",
            title: "Messages temporarily limited",
            message: threadsPage.error?.message ?? "Chat requests are being rate limited right now.",
          });
        }
      } catch (error) {
        if (controller.signal.aborted || isAbortError(error)) {
          return;
        }

        setBootstrapError(
          error instanceof Error
            ? error.message
            : "We could not connect to the marketplace API.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsBootstrapping(false);
        }
      }
    };

    loadAppData();

    return () => {
      controller.abort();
    };
  }, []);

  const showToast = ({ type = "success", title, message }) => {
    const toast = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type,
      title,
      message,
    };

    setToasts((currentToasts) => {
      const duplicateToast = currentToasts.find((item) =>
        item.type === toast.type &&
        item.title === toast.title &&
        item.message === toast.message,
      );

      if (duplicateToast) {
        return currentToasts.map((item) =>
          item.id === duplicateToast.id ? { ...item, id: toast.id } : item,
        );
      }

      return [...currentToasts, toast];
    });
  };

  const applyThreadUpdate = (incomingThread, options, receipt) => {
    if (!incomingThread?.id) {
      return;
    }

    setThreads((currentThreads) => {
      const nextThreads = upsertThread(currentThreads, incomingThread, options);
      const hydratedThreads = receipt?.readMessageIds?.length
        ? nextThreads.map((thread) =>
            thread.id === incomingThread.id ? applyReadReceiptToThread(thread, receipt) : thread,
          )
        : nextThreads;
      setProducts((currentProducts) => mergeProductsWithThreads(currentProducts, hydratedThreads));
      return hydratedThreads;
    });
  };

  const removeTypingState = (conversationId) => {
    if (!conversationId) {
      return;
    }

    setTypingByConversation((currentState) => {
      if (!currentState[conversationId]) {
        return currentState;
      }

      const nextState = { ...currentState };
      delete nextState[conversationId];
      return nextState;
    });
  };

  const {
    isConnected: isSocketConnected,
    isOnline: isBrowserOnline,
    joinConversation,
    leaveConversation,
    sendMessage: sendSocketMessage,
    markConversationRead: markConversationReadSocket,
    startTyping,
    stopTyping,
  } = useSocket({
    enabled: Boolean(currentUser && socketToken),
    token: socketToken,
    onPresenceSync: (payload) => {
      setOnlineUserIds(Array.isArray(payload?.userIds) ? payload.userIds : []);
    },
    onPresenceUpdate: (payload) => {
      const userId = payload?.userId;
      if (!userId) {
        return;
      }

      setOnlineUserIds((currentIds) => {
        const normalizedId = String(userId);
        const hasUser = currentIds.some((id) => String(id) === normalizedId);

        if (payload.isOnline) {
          return hasUser ? currentIds : [...currentIds, userId];
        }

        return currentIds.filter((id) => String(id) !== normalizedId);
      });
    },
    onTypingUpdate: (payload) => {
      const conversationId = payload?.conversationId;
      if (!conversationId) {
        return;
      }

      if (!payload.isTyping) {
        removeTypingState(conversationId);
        return;
      }

      if (String(payload.userId) === String(currentUser?.id)) {
        return;
      }

      setTypingByConversation((currentState) => ({
        ...currentState,
        [conversationId]: {
          userId: payload.userId,
          userName: payload.userName ?? "Someone",
        },
      }));
    },
    onConversationUpdated: (payload) => {
      if (!payload?.conversation) {
        return;
      }

      applyThreadUpdate(normalizeThread(payload.conversation), { messageMode: "preserve" });
    },
    onConversationReadUpdate: (payload) => {
      if (!payload?.conversation) {
        return;
      }

      const nextThread = normalizeThread(payload.conversation);
      applyThreadUpdate(nextThread, { messageMode: "replace" }, payload);
      removeTypingState(nextThread.id);
    },
    onMessageNew: (payload) => {
      if (!payload?.conversation) {
        return;
      }

      const nextThread = normalizeThread(payload.conversation);
      applyThreadUpdate(nextThread, { messageMode: "append" });
      removeTypingState(nextThread.id);
    },
    onError: (message) => {
      if (typeof window !== "undefined" && window.navigator.onLine === false) {
        return;
      }

      showToast({
        type: "error",
        title: "Real-time chat error",
        message,
      });
    },
  });

  const deferredQuery = useDeferredValue(query);
  const isSidebarlessPage =
    activePage === "market" ||
    activePage === "messages" ||
    activePage === "sell" ||
    activePage === "my-listings" ||
    activePage === "profile" ||
    activePage === "login" ||
    activePage === "signup";
  const categories = useMemo(
    () => ["All", ...new Set(marketProducts.map((product) => product.category).filter(Boolean))],
    [marketProducts],
  );
  const unreadMessageCount = useMemo(
    () =>
      threads.reduce(
        (count, thread) => count + getThreadUnreadCountForUser(thread, currentUser),
        0,
      ),
    [currentUser, threads],
  );

  const sortByToApiSort = (value) => {
    switch (value) {
      case "price-low":
        return "price_asc";
      case "price-high":
        return "price_desc";
      case "title":
        return "title_asc";
      default:
        return "latest";
    }
  };

  const loadProductsPage = async ({ page = 1, signal } = {}) => {
    const result = await apiClient.getProductsPage({
      signal,
      page,
      limit: LISTINGS_PAGE_LIMIT,
      search: deferredQuery.trim() || undefined,
      category: activeCategory === "All" ? undefined : activeCategory,
      sort: sortByToApiSort(sortBy),
      status: "active",
    });

    setMarketProducts(result.items);
    setProducts((currentProducts) => mergeProductsWithThreads(mergeProductCollections(currentProducts, result.items), threads));
    setProductsPagination(result.pagination ?? createPaginationState({ total: result.items.length }));
  };

  useEffect(() => {
    if (!hasInitializedListingFiltersRef.current) {
      hasInitializedListingFiltersRef.current = true;
      return;
    }

    const controller = new AbortController();

    loadProductsPage({ page: 1, signal: controller.signal }).catch((error) => {
      if (controller.signal.aborted || isAbortError(error)) {
        return;
      }

      showToast({
        type: "error",
        title: "Listings unavailable",
        message: error instanceof Error ? error.message : "We could not refresh marketplace results.",
      });
    });

    return () => controller.abort();
  }, [activeCategory, deferredQuery, sortBy]);

  const normalizedQuery = deferredQuery.trim().toLowerCase();
  const visibleProducts = marketProducts;
  const savedProducts = products.filter((product) => savedItems.includes(product.id));
  const savedItemsPagination = createPaginationState({
    page: savedItemsPage,
    limit: SAVED_ITEMS_PAGE_LIMIT,
    total: savedProducts.length,
    totalPages: Math.max(1, Math.ceil(savedProducts.length / SAVED_ITEMS_PAGE_LIMIT)),
    hasPrevPage: savedItemsPage > 1,
    hasNextPage: savedItemsPage < Math.max(1, Math.ceil(savedProducts.length / SAVED_ITEMS_PAGE_LIMIT)),
  });
  const pagedSavedProducts = savedProducts.slice(
    (savedItemsPage - 1) * SAVED_ITEMS_PAGE_LIMIT,
    savedItemsPage * SAVED_ITEMS_PAGE_LIMIT,
  );

  const handleSearchChange = (nextValue) => {
    startTransition(() => {
      setQuery(nextValue);
    });
  };

  const handleListingsPageChange = async (page) => {
    try {
      await loadProductsPage({ page });
      listingsSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (error) {
      showToast({
        type: "error",
        title: "Listings unavailable",
        message: error instanceof Error ? error.message : "We could not change the marketplace page.",
      });
    }
  };

  const dismissToast = (toastId) => {
    setToasts((currentToasts) => currentToasts.filter((toast) => toast.id !== toastId));
  };

  const handleSaveToggle = (productId) => {
    const product = products.find((item) => item.id === productId);
    const isSaved = savedItems.includes(productId);

    setSavedItems((currentItems) =>
      isSaved
        ? currentItems.filter((id) => id !== productId)
        : [...currentItems, productId],
    );

    if (product) {
      showToast({
        type: "success",
        title: isSaved ? "Removed from saved items" : "Saved item",
        message: isSaved
          ? `${product.title} was removed from your saved items.`
          : `${product.title} was added to your saved items.`,
      });
    }
  };

  const requireSellerSession = (nextPage) => {
    if (currentUser) {
      setSelectedProduct(null);
      setActivePage(nextPage);
      return true;
    }

    setSelectedProduct(null);
    setActivePage("login");
    showToast({
      type: "error",
      title: "Sign in required",
      message: "Please sign in to access seller tools, messages, and account pages.",
    });
    return false;
  };

  const openSellPage = () => {
    requireSellerSession("sell");
  };

  const loadSellerListings = async () => {
    if (!currentUser) {
      return;
    }

    try {
      const myProducts = await apiClient.getMyProducts();
      setProducts((currentProducts) => mergeProductCollections(currentProducts, myProducts));
    } catch {
      // Keep existing catalog if seller listings refresh fails.
    }
  };

  const openMyListingsPage = async () => {
    if (!requireSellerSession("my-listings")) {
      return;
    }

    await loadSellerListings();
  };

  const openProfilePage = async () => {
    if (!requireSellerSession("profile")) {
      return;
    }

    await loadSellerListings();
  };

  const openMessagesPage = () => {
    if (!requireSellerSession("messages")) {
      return;
    }

    setSelectedProduct(null);
  };

  const openMessagesForProduct = (product) => {
    if (!requireSellerSession("messages")) {
      return;
    }

    setSelectedMessageProductId(product.id);
    setSelectedProduct(null);
    setActivePage("messages");
  };

  const scrollToListings = () => {
    setSelectedMessageProductId(null);
    setActivePage("market");
    listingsSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleAddItem = async (item, imageFiles = []) => {
    setIsListingSubmitting(true);
    setListingSubmitStatusMessage(
      imageFiles.length > 0
        ? `Uploading ${imageFiles.length} image${imageFiles.length === 1 ? "" : "s"} and preparing your listing...`
        : "Publishing your listing...",
    );
    const publishStageTimeout = imageFiles.length > 0
      ? window.setTimeout(() => {
          setListingSubmitStatusMessage("Finalizing your listing and making it visible in the marketplace...");
        }, 1800)
      : null;

    try {
      const createdProduct = await apiClient.createProduct(item, imageFiles);

      setProducts((currentProducts) => replaceProduct(currentProducts, createdProduct));
      setMarketProducts((currentProducts) => replaceProduct(currentProducts, createdProduct));
      setActiveCategory("All");
      setSortBy("latest");
      setQuery("");
      setActivePage("market");
      setSelectedProduct(createdProduct);
      showToast({
        type: "success",
        title: "Listing posted",
        message: `${createdProduct.title} is now live in the marketplace.`,
      });
      requestAnimationFrame(() => {
        scrollToListings();
      });

      return { ok: true };
    } catch (error) {
      showToast({
        type: "error",
        title: "Listing failed",
        message:
          error instanceof Error
            ? error.message
            : "We could not publish your listing right now.",
      });
      return { ok: false };
    } finally {
      if (publishStageTimeout) {
        window.clearTimeout(publishStageTimeout);
      }
      setListingSubmitStatusMessage("");
      setIsListingSubmitting(false);
    }
  };

  const handleDeleteListing = async (productId) => {
    const productToDelete = products.find((product) => product.id === productId);
    setPendingActionId(`${productId}:delete`);

    try {
      await apiClient.deleteProduct(productId);
      setProducts((currentProducts) =>
        currentProducts.filter((product) => product.id !== productId),
      );
      setMarketProducts((currentProducts) =>
        currentProducts.filter((product) => product.id !== productId),
      );
      setThreads((currentThreads) =>
        currentThreads.filter((thread) => String(thread.productId) !== String(productId)),
      );

      if (selectedProduct?.id === productId) {
        setSelectedProduct(null);
      }

      if (productToDelete) {
        showToast({
          type: "success",
          title: "Listing deleted",
          message: `${productToDelete.title} was removed from your listings.`,
        });
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Delete failed",
        message:
          error instanceof Error
            ? error.message
            : "We could not delete that listing right now.",
      });
    } finally {
      setPendingActionId(null);
    }
  };

  const getListingStatusLabel = (listingState) => {
    switch (listingState) {
      case "draft":
        return "Draft";
      case "paused":
        return "Paused";
      case "sold":
        return "Sold";
      default:
        return "Active";
    }
  };

  const handleChangeListingStatus = async (productId, nextStatus) => {
    const targetProduct = products.find((product) => product.id === productId);
    if (!targetProduct || targetProduct.listingState === nextStatus) {
      return;
    }

    setPendingActionId(`${productId}:status`);

    try {
      const updatedProduct = await apiClient.updateProduct(productId, {
        listingState: nextStatus,
      });

      setProducts((currentProducts) => replaceProduct(currentProducts, updatedProduct));
      setMarketProducts((currentProducts) => replaceProduct(currentProducts, updatedProduct));

      showToast({
        type: "success",
        title: `Listing moved to ${getListingStatusLabel(nextStatus).toLowerCase()}`,
        message: `${updatedProduct.title} is now ${getListingStatusLabel(nextStatus).toLowerCase()}.`,
      });
    } catch (error) {
      showToast({
        type: "error",
        title: "Status update failed",
        message:
          error instanceof Error
            ? error.message
            : "We could not update the listing status.",
      });
    } finally {
      setPendingActionId(null);
    }
  };

  const handleUpdateListing = async (productId, updates, imageFile) => {
    setPendingActionId(`${productId}:update`);

    try {
      const nextImageFiles = Array.isArray(imageFile)
        ? imageFile.filter(Boolean).slice(0, 3)
        : imageFile
          ? [imageFile]
          : [];
      const uploadedImageUrls = await apiClient.uploadFiles(nextImageFiles);
      const updatedProduct = await apiClient.updateProduct(productId, {
        ...updates,
        ...(uploadedImageUrls.length > 0 ? { images: uploadedImageUrls } : {}),
      });

      setProducts((currentProducts) => replaceProduct(currentProducts, updatedProduct));
      setMarketProducts((currentProducts) => replaceProduct(currentProducts, updatedProduct));

      if (selectedProduct?.id === productId) {
        setSelectedProduct(updatedProduct);
      }

      showToast({
        type: "success",
        title: "Listing updated",
        message: `${updatedProduct.title} was updated successfully.`,
      });
      return { ok: true };
    } catch (error) {
      showToast({
        type: "error",
        title: "Update failed",
        message:
          error instanceof Error
            ? error.message
            : "We could not update that listing right now.",
      });
      return { ok: false };
    } finally {
      setPendingActionId(null);
    }
  };

  const handleUpdateProfile = async (nextProfile) => {
    if (!currentUser) {
      return;
    }

    try {
      const updatedUser = await apiClient.updateProfile(nextProfile);
      setCurrentUser(updatedUser);
      setProducts((currentProducts) =>
        currentProducts.map((product) =>
          product.seller?.id === currentUser.id
            ? {
                ...product,
                seller: {
                  ...product.seller,
                  id: updatedUser.id,
                  name: updatedUser.name,
                  phone: updatedUser.phone,
                  email: updatedUser.email,
                },
              }
            : product,
        ),
      );
      setThreads((currentThreads) =>
        currentThreads.map((thread) =>
          thread.product?.seller?.id === currentUser.id
            ? {
                ...thread,
                product: thread.product
                  ? {
                      ...thread.product,
                      seller: {
                        ...thread.product.seller,
                        id: updatedUser.id,
                        name: updatedUser.name,
                        phone: updatedUser.phone,
                        email: updatedUser.email,
                      },
                    }
                  : thread.product,
              }
            : thread,
        ),
      );
      showToast({
        type: "success",
        title: "Profile saved",
        message: "Your profile details were updated successfully.",
      });
    } catch (error) {
      showToast({
        type: "error",
        title: "Profile update failed",
        message:
          error instanceof Error
            ? error.message
            : "We could not save your profile right now.",
      });
    }
  };

  const handleReviewCreated = ({ product, review }) => {
    const reviewSeller = review?.sellerId;
    const sellerId = reviewSeller?.id ?? reviewSeller?._id ?? product?.seller?.id;
    const nextRating = reviewSeller?.rating;

    if (!sellerId || !nextRating) {
      return;
    }

    setProducts((currentProducts) =>
      currentProducts.map((item) => updateSellerRatingForProduct(item, sellerId, nextRating)),
    );
    setMarketProducts((currentProducts) =>
      currentProducts.map((item) => updateSellerRatingForProduct(item, sellerId, nextRating)),
    );
    setThreads((currentThreads) =>
      currentThreads.map((thread) => updateSellerRatingForThread(thread, sellerId, nextRating)),
    );
    setSelectedProduct((currentProduct) =>
      updateSellerRatingForProduct(currentProduct, sellerId, nextRating),
    );
  };

  const handleSignup = async (signupForm) => {
    setIsAuthSubmitting(true);

    try {
      const { user } = await apiClient.signup({
        name: signupForm.name.trim(),
        email: signupForm.email.trim().toLowerCase(),
        phone: signupForm.phone.trim(),
        password: signupForm.password,
      });

      setCurrentUser(user);
      setThreads([]);
      setOnlineUserIds([]);
      setTypingByConversation({});
      setActivePage("market");
      showToast({
        type: "success",
        title: "Account created",
        message: `Welcome to Kibu Market, ${user.name}.`,
      });
      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : "We could not create that account.",
      };
    } finally {
      setIsAuthSubmitting(false);
    }
  };

  const handleLogin = async (loginForm) => {
    setIsAuthSubmitting(true);

    try {
      const { user } = await apiClient.login({
        email: loginForm.email.trim().toLowerCase(),
        password: loginForm.password,
      });
      const nextThreadsPage = await apiClient.getThreadsPage({ page: 1, limit: THREADS_PAGE_LIMIT });

      setCurrentUser(user);
      setThreads(sortThreadsByLatest(nextThreadsPage.items));
      setThreadsPagination(nextThreadsPage.pagination ?? createPaginationState({ limit: THREADS_PAGE_LIMIT, total: nextThreadsPage.items.length }));
      setProducts((currentProducts) => mergeProductsWithThreads(currentProducts, nextThreadsPage.items));
      setMessagePaginationByThread({});
      setTypingByConversation({});
      setActivePage("market");
      showToast({
        type: "success",
        title: "Signed in",
        message: `Welcome back, ${user.name}.`,
      });
      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : "We could not sign you in with those details.",
      };
    } finally {
      setIsAuthSubmitting(false);
    }
  };

  const handleLogout = async () => {
    if (!currentUser) {
      return;
    }

    const userName = currentUser.name;

    try {
      await apiClient.logout();
    } catch {
      sessionStore.clear();
    }

    setCurrentUser(null);
    setMarketProducts([]);
    setThreads([]);
    setThreadsPagination(createPaginationState({ limit: THREADS_PAGE_LIMIT }));
    setProductsPagination(createPaginationState());
    setMessagePaginationByThread({});
    setOnlineUserIds([]);
    setTypingByConversation({});
    setSelectedMessageProductId(null);
    setActivePage("market");
    setSelectedProduct(null);
    showToast({
      type: "success",
      title: "Signed out",
      message: `${userName} has been signed out.`,
    });
  };

  const handleJoinConversation = async (threadId) => {
    if (!threadId) {
      return { ok: false };
    }

    try {
      let joinedThread = null;
      if (isSocketConnected) {
        const response = await joinConversation(threadId);
        if (response?.conversation) {
          joinedThread = normalizeThread(response.conversation);
          applyThreadUpdate(joinedThread, { messageMode: "replace" });
        }
      }

      const messagePage = await apiClient.getThreadMessagesPage(threadId, { page: 1, limit: MESSAGES_PAGE_LIMIT });
      applyThreadUpdate({ id: threadId, messages: messagePage.items }, { messageMode: "replace" });
      setMessagePaginationByThread((current) => ({
        ...current,
        [threadId]: messagePage.pagination ?? createPaginationState({ limit: MESSAGES_PAGE_LIMIT, total: messagePage.items.length }),
      }));
      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : "We could not open that conversation right now.",
      };
    }
  };

  const handleLeaveConversation = async (threadId) => {
    if (!threadId || !isSocketConnected) {
      return;
    }

    try {
      await leaveConversation(threadId);
    } catch {
      // Ignore navigation-time leave failures.
    }
  };

  const handleLoadMoreThreads = async () => {
    if (!threadsPagination.hasNextPage || isLoadingMoreThreads) {
      return;
    }

    setIsLoadingMoreThreads(true);

    try {
      const nextPage = await apiClient.getThreadsPage({
        page: threadsPagination.page + 1,
        limit: THREADS_PAGE_LIMIT,
      });

      setThreads((currentThreads) => sortThreadsByLatest([...currentThreads, ...nextPage.items]));
      setThreadsPagination(nextPage.pagination ?? threadsPagination);
    } catch (error) {
      showToast({
        type: "error",
        title: "Conversations unavailable",
        message: error instanceof Error ? error.message : "We could not load more conversations.",
      });
    } finally {
      setIsLoadingMoreThreads(false);
    }
  };

  const handleLoadOlderMessages = async (threadId) => {
    const pagination = messagePaginationByThread[threadId];
    if (!threadId || !pagination?.hasNextPage || isLoadingOlderMessages) {
      return;
    }

    setIsLoadingOlderMessages(true);

    try {
      const nextPage = await apiClient.getThreadMessagesPage(threadId, {
        page: pagination.page + 1,
        limit: pagination.limit || MESSAGES_PAGE_LIMIT,
      });

      applyThreadUpdate({ id: threadId, messages: nextPage.items }, { messageMode: "append" });
      setMessagePaginationByThread((current) => ({
        ...current,
        [threadId]: nextPage.pagination ?? pagination,
      }));
    } catch (error) {
      showToast({
        type: "error",
        title: "Messages unavailable",
        message: error instanceof Error ? error.message : "We could not load older messages.",
      });
    } finally {
      setIsLoadingOlderMessages(false);
    }
  };

  const handleMarkThreadRead = async (threadId) => {
    try {
      const readResult = isSocketConnected
        ? await markConversationReadSocket(threadId)
        : await apiClient.markThreadRead(threadId);
      const updatedThread = applyReadReceiptToThread(
        isSocketConnected
          ? normalizeThread(readResult.conversation)
          : readResult.thread,
        readResult,
      );

      applyThreadUpdate(updatedThread, { messageMode: "replace" }, readResult);
      removeTypingState(threadId);

      return { ok: true, thread: updatedThread };
    } catch (error) {
      return {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : "We could not update that conversation.",
      };
    }
  };

  const handleSendMessage = async ({ threadId, productId, recipientId, text }) => {
    if (currentUser?.id && String(recipientId) === String(currentUser.id)) {
      showToast({
        type: "error",
        title: "Message blocked",
        message: "You can't send a message to your own listing.",
      });
      return { ok: false };
    }

    setIsMessageSending(true);

    try {
      const updatedThread = isSocketConnected
        ? normalizeThread(
            (
              await sendSocketMessage({
                conversationId: threadId,
                productId,
                recipientId,
                text,
              })
            ).conversation,
          )
        : await apiClient.sendMessage({
            threadId,
            productId,
            recipientId,
            text,
          });

      applyThreadUpdate(updatedThread, {
        messageMode: threadId ? "append" : "replace",
      });

      return { ok: true, thread: updatedThread };
    } catch (error) {
      showToast({
        type: "error",
        title: "Message not sent",
        message:
          error instanceof Error
            ? error.message
            : "We could not send your message right now.",
      });
      return { ok: false };
    } finally {
      setIsMessageSending(false);
    }
  };

  const handleTypingStart = async (conversationId) => {
    if (!conversationId || !isSocketConnected) {
      return;
    }

    try {
      await startTyping(conversationId);
    } catch {
      // Ignore transient typing errors.
    }
  };

  const handleTypingStop = async (conversationId) => {
    if (!conversationId || !isSocketConnected) {
      return;
    }

    try {
      await stopTyping(conversationId);
    } catch {
      // Ignore transient typing errors.
    }
  };

  return (
    <div className="page-shell">
      <div className="page-glow page-glow-left" />
      <div className="page-glow page-glow-right" />
      <Navbar
        className={activePage === "messages" ? "messages-navbar" : ""}
        onHomeClick={scrollToListings}
        onMyListingsClick={openMyListingsPage}
        onProfileClick={openProfilePage}
        onSignInClick={() => setActivePage("login")}
        onSellClick={openSellPage}
        onLogoutClick={handleLogout}
        onMessagesClick={openMessagesPage}
        currentUser={currentUser}
        messageCount={unreadMessageCount}
      />
      {isBrowserOnline ? null : <OfflineBanner />}
      <main className={activePage === "messages" ? "page-main messages-main" : "page-main"}>
        <div
          className={
            activePage === "messages"
              ? "app-layout messages-layout chat-layout"
              : isSidebarlessPage
                ? "app-layout content-layout"
                : "app-layout"
          }
        >
          {isSidebarlessPage
            ? null
            : (
            <aside className="desktop-side-menu" aria-label="Desktop navigation">
            <div className="desktop-side-menu-card">
              <div className="desktop-side-menu-header">
                <span className="section-label">Navigate</span>
                <h2>Workspace</h2>
                <p>Move quickly between your marketplace pages.</p>
              </div>

              <nav className="desktop-side-nav">
                <button
                  type="button"
                  className={activePage === "market" ? "desktop-side-link active" : "desktop-side-link"}
                  onClick={scrollToListings}
                >
                  <span className="desktop-side-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                      <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                  </span>
                  <span className="desktop-side-copy">
                    <strong>Home</strong>
                    <small>Browse the latest campus listings</small>
                  </span>
                </button>

                <button
                  type="button"
                  className={activePage === "messages" ? "desktop-side-link active" : "desktop-side-link"}
                  onClick={openMessagesPage}
                >
                  <span className="desktop-side-icon desktop-side-icon-with-badge">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                    {unreadMessageCount > 0 ? (
                      <span className="desktop-side-badge">{unreadMessageCount}</span>
                    ) : null}
                  </span>
                  <span className="desktop-side-copy">
                    <strong>Messages</strong>
                    <small>Open your buying and selling chats</small>
                  </span>
                </button>

                <button
                  type="button"
                  className={activePage === "my-listings" ? "desktop-side-link active" : "desktop-side-link"}
                  onClick={openMyListingsPage}
                >
                  <span className="desktop-side-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 11l3 3L22 4" />
                      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                    </svg>
                  </span>
                  <span className="desktop-side-copy">
                    <strong>My Listings</strong>
                    <small>Manage the items you are selling</small>
                  </span>
                </button>

                <button
                  type="button"
                  className={activePage === "profile" ? "desktop-side-link active" : "desktop-side-link"}
                  onClick={openProfilePage}
                >
                  <span className="desktop-side-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 12c2.761 0 5-2.239 5-5S14.761 2 12 2 7 4.239 7 7s2.239 5 5 5z" />
                      <path d="M4 22c0-4.418 3.582-8 8-8s8 3.582 8 8" />
                    </svg>
                  </span>
                  <span className="desktop-side-copy">
                    <strong>Profile</strong>
                    <small>Update your account and saved items</small>
                  </span>
                </button>
              </nav>

              <div className="desktop-side-summary">
                <div>
                  <span>{productsPagination.total}</span>
                  <small>Total items</small>
                </div>
                <div>
                  <span>{savedItems.length}</span>
                  <small>Saved items</small>
                </div>
              </div>
            </div>
            </aside>
          )}

          <div className={activePage === "messages" ? "app-content messages-content chat-content" : "app-content"}>
            {bootstrapError ? (
              <div className="empty-state">
                <span className="section-label">API unavailable</span>
                <h3>We could not load live marketplace data.</h3>
                <p>{bootstrapError}</p>
              </div>
            ) : activePage === "sell" ? (
              <Suspense fallback={<PageLoader label="Loading seller tools..." />}>
                <SellItemForm
                  onAddItem={handleAddItem}
                  onBack={scrollToListings}
                  currentUser={currentUser}
                  isSubmitting={isListingSubmitting}
                  submitStatusMessage={listingSubmitStatusMessage}
                />
              </Suspense>
            ) : activePage === "my-listings" ? (
              <MyListingsScreen
                products={products}
                currentUser={currentUser}
                onBack={scrollToListings}
                onCreateListing={openSellPage}
                onViewListing={setSelectedProduct}
                onDeleteListing={handleDeleteListing}
                onChangeListingStatus={handleChangeListingStatus}
                onUpdateListing={handleUpdateListing}
                pendingActionId={pendingActionId}
              />
            ) : activePage === "profile" ? (
              <UserProfileScreen
                key={currentUser?.id ?? "profile"}
                products={products}
                savedItems={savedItems}
                savedProducts={pagedSavedProducts}
                savedItemsPagination={savedItemsPagination}
                onSavedItemsPageChange={setSavedItemsPage}
                userProfile={currentUser}
                currentUser={currentUser}
                onBack={scrollToListings}
                onUpdateProfile={handleUpdateProfile}
                onViewListing={setSelectedProduct}
              />
            ) : activePage === "messages" ? (
              <MessagesScreen
                products={products}
                threads={threads}
                currentUser={currentUser}
                onBack={scrollToListings}
                initialProductId={selectedMessageProductId}
                onSendMessage={handleSendMessage}
                onMarkThreadRead={handleMarkThreadRead}
                onJoinConversation={handleJoinConversation}
                onLeaveConversation={handleLeaveConversation}
                onTypingStart={handleTypingStart}
                onTypingStop={handleTypingStop}
                typingByConversation={typingByConversation}
                onlineUserIds={onlineUserIds}
                isSending={isMessageSending}
                hasMoreThreads={threadsPagination.hasNextPage}
                onLoadMoreThreads={handleLoadMoreThreads}
                messagePaginationByThread={messagePaginationByThread}
                isLoadingOlderMessages={isLoadingOlderMessages}
                onLoadOlderMessages={handleLoadOlderMessages}
              />
            ) : activePage === "login" || activePage === "signup" ? (
              <Suspense fallback={<PageLoader label="Loading account page..." />}>
                <AuthScreen
                  key={activePage}
                  mode={activePage}
                  onModeChange={setActivePage}
                  onBack={scrollToListings}
                  onLogin={handleLogin}
                  onSignup={handleSignup}
                  isSubmitting={isAuthSubmitting}
                />
              </Suspense>
            ) : (
              <>
                {isBootstrapping ? (
                  <MarketSkeleton />
                ) : (
                  <>
                    <section className="products-section" ref={listingsSectionRef}>
                      <SearchBar
                        query={query}
                        onQueryChange={handleSearchChange}
                        resultCount={visibleProducts.length}
                        totalCount={productsPagination.total}
                        categories={categories}
                        activeCategory={activeCategory}
                        onCategoryChange={setActiveCategory}
                        sortBy={sortBy}
                        onSortChange={setSortBy}
                      />

                        <TrendingCarousel
                          items={visibleProducts.filter((p) => {
                            const isActive = !p.listingState || p.listingState === "active";
                            const hasImage = !!p.image || !!(p.images && p.images[0]);
                            const hasPrice = p.price != null && !Number.isNaN(Number(p.price));
                            return isActive && hasImage && hasPrice;
                          }).slice(0, 10).map((p, idx) => ({
                            ...p,
                            isTrending: idx < 3,
                            popularThisWeek: idx >= 3 && idx < 6,
                          }))}
                          onProductClick={setSelectedProduct}
                        />

                       <ProductList
                         key={`${activeCategory}-${sortBy}-${normalizedQuery}-${visibleProducts.length}`}
                         products={visibleProducts}
                         savedItems={savedItems}
                         onSaveToggle={handleSaveToggle}
                         onViewDetails={setSelectedProduct}
                         onQuickChat={openMessagesForProduct}
                       />
                       <PaginationControls
                         pagination={productsPagination}
                         onPageChange={handleListingsPageChange}
                         label="listings"
                        />
                      </section>

                      <button type="button" className="mobile-sell-fab" onClick={openSellPage}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="12" y1="5" x2="12" y2="19" />
                          <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        Sell
                      </button>
                   </>
                )}
              </>
            )}
          </div>
        </div>
      </main>
      {selectedProduct ? (
        <Suspense fallback={<PageLoader label="Loading item details..." compact />}>
          <ProductModal
            key={`${selectedProduct.id}-${selectedProduct.image}`}
            product={selectedProduct}
            isSaved={savedItems.includes(selectedProduct.id)}
            currentUser={currentUser}
            onClose={() => setSelectedProduct(null)}
            onSaveToggle={handleSaveToggle}
            onContactSeller={openMessagesForProduct}
            onReviewCreated={handleReviewCreated}
            onNotify={showToast}
          />
        </Suspense>
      ) : null}
      <ToastViewport toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

function PageLoader({ label, compact = false }) {
  return (
    <div className={compact ? "page-loader page-loader-compact" : "page-loader"}>
      <div className="page-loader-spinner" aria-hidden="true" />
      <p>{label}</p>
    </div>
  );
}

function OfflineBanner() {
  return (
    <div className="offline-banner-shell" role="status" aria-live="polite" aria-atomic="true">
      <div className="offline-banner">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M2 8.82A15 15 0 0 1 22 8.82" />
          <path d="M5 12.86a10 10 0 0 1 14 0" />
          <path d="M8.5 16.43a5 5 0 0 1 7 0" />
          <line x1="12" y1="20" x2="12.01" y2="20" />
          <line x1="2" y1="2" x2="22" y2="22" />
        </svg>
        <span>You're offline. Chat and marketplace actions will reconnect automatically.</span>
      </div>
    </div>
  );
}

function MarketSkeleton() {
  return (
    <div className="market-skeleton-shell" aria-hidden="true">
      <section className="products-section">
        <div className="search-container market-skeleton-search">
          <div className="skeleton-line skeleton-search" />
        </div>
        <div className="market-skeleton-chips">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={`chip-${index}`} className="skeleton-line skeleton-chip" />
          ))}
        </div>
        <div className="product-list market-skeleton-grid">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={`card-${index}`} className="market-skeleton-card">
              <div className="skeleton-block skeleton-card-image" />
              <div className="market-skeleton-card-copy">
                <div className="skeleton-line skeleton-mini-title" />
                <div className="skeleton-line skeleton-mini-copy" />
                <div className="skeleton-line skeleton-mini-copy skeleton-mini-copy-short" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default Home;

