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
import Hero from "../components/Hero";
import SearchBar from "../components/SearchBar";
import ProductList from "../components/ProductList";
import MessagesScreen from "../components/MessagesScreen";
import MyListingsScreen from "../components/MyListingsScreen";
import UserProfileScreen from "../components/UserProfileScreen";
import ToastViewport from "../components/ToastViewport";
import { ApiError, apiClient, normalizeThread, sessionStore } from "../api/client";
import { useSocket } from "../hooks/useSocket";

const ProductModal = lazy(() => import("../components/ProductModal"));
const SellItemForm = lazy(() => import("../components/SellItemForm"));
const AuthScreen = lazy(() => import("../components/AuthScreen"));

const SAVED_ITEMS_STORAGE_KEY = "kibu-market-saved-items";

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
  const [threads, setThreads] = useState([]);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [sortBy, setSortBy] = useState("latest");
  const [savedItems, setSavedItems] = useState(() =>
    readStoredJson(SAVED_ITEMS_STORAGE_KEY, []),
  );
  const [blockedSellerIds, setBlockedSellerIds] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activePage, setActivePage] = useState("market");
  const [selectedMessageProductId, setSelectedMessageProductId] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [bootstrapError, setBootstrapError] = useState("");
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);
  const [isListingSubmitting, setIsListingSubmitting] = useState(false);
  const [pendingActionId, setPendingActionId] = useState(null);
  const [isMessageSending, setIsMessageSending] = useState(false);
  const [onlineUserIds, setOnlineUserIds] = useState([]);
  const [typingByConversation, setTypingByConversation] = useState({});
  const listingsSectionRef = useRef(null);
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
    const controller = new AbortController();

    const loadAppData = async () => {
      setIsBootstrapping(true);
      setBootstrapError("");

      const token = sessionStore.getToken();

      try {
        const [fetchedProducts, fetchedUser, fetchedThreads] = await Promise.all([
          apiClient.getProducts(controller.signal),
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
            ? apiClient.getThreads(controller.signal).catch((error) => {
                if (error instanceof ApiError && error.status === 401) {
                  sessionStore.clear();
                  return [];
                }

                throw error;
              })
            : Promise.resolve([]),
        ]);

        setCurrentUser(fetchedUser);
        setThreads(sortThreadsByLatest(fetchedThreads));
        setProducts(mergeProductsWithThreads(fetchedProducts, fetchedThreads));
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

    setToasts((currentToasts) => [...currentToasts, toast]);
  };

  const applyThreadUpdate = (incomingThread, options) => {
    if (!incomingThread?.id) {
      return;
    }

    setThreads((currentThreads) => {
      const nextThreads = upsertThread(currentThreads, incomingThread, options);
      setProducts((currentProducts) => mergeProductsWithThreads(currentProducts, nextThreads));
      return nextThreads;
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
      applyThreadUpdate(nextThread, { messageMode: "preserve" });
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
      showToast({
        type: "error",
        title: "Real-time chat error",
        message,
      });
    },
  });

  const deferredQuery = useDeferredValue(query);
  const categories = useMemo(
    () => ["All", ...new Set(products.map((product) => product.category))],
    [products],
  );
  const unreadMessageCount = useMemo(
    () =>
      threads.reduce(
        (count, thread) => count + getThreadUnreadCountForUser(thread, currentUser),
        0,
      ),
    [currentUser, threads],
  );

  const normalizedQuery = deferredQuery.trim().toLowerCase();
  let visibleProducts = products.filter((product) => {
    if (blockedSellerIds.includes(product.seller?.id)) {
      return false;
    }

    if ((product.listingState ?? "active") !== "active") {
      return false;
    }

    const matchesCategory = activeCategory === "All" || product.category === activeCategory;
    const matchesQuery =
      normalizedQuery.length === 0 ||
      [product.title, product.category, product.location, ...(product.tags ?? [])]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);

    return matchesCategory && matchesQuery;
  });

  if (sortBy === "price-low") {
    visibleProducts = [...visibleProducts].sort((a, b) => a.price - b.price);
  } else if (sortBy === "price-high") {
    visibleProducts = [...visibleProducts].sort((a, b) => b.price - a.price);
  } else if (sortBy === "title") {
    visibleProducts = [...visibleProducts].sort((a, b) => a.title.localeCompare(b.title));
  } else {
    visibleProducts = sortProductsByLatest(visibleProducts);
  }

  const handleSearchChange = (nextValue) => {
    startTransition(() => {
      setQuery(nextValue);
    });
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

  const openMyListingsPage = () => {
    requireSellerSession("my-listings");
  };

  const openProfilePage = () => {
    requireSellerSession("profile");
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

  const handleAddItem = async (item, imageFile) => {
    setIsListingSubmitting(true);

    try {
      const uploadedImageUrl = imageFile ? await apiClient.uploadFile(imageFile) : "";
      const createdProduct = await apiClient.createProduct({
        ...item,
        image:
          uploadedImageUrl ||
          "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=900&q=80",
      });

      setProducts((currentProducts) => replaceProduct(currentProducts, createdProduct));
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
      const uploadedImageUrl = imageFile ? await apiClient.uploadFile(imageFile) : "";
      const updatedProduct = await apiClient.updateProduct(productId, {
        ...updates,
        ...(uploadedImageUrl ? { image: uploadedImageUrl } : {}),
      });

      setProducts((currentProducts) => replaceProduct(currentProducts, updatedProduct));

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
      const nextThreads = await apiClient.getThreads();

      setCurrentUser(user);
      setThreads(sortThreadsByLatest(nextThreads));
      setProducts((currentProducts) => mergeProductsWithThreads(currentProducts, nextThreads));
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

  const handleLogout = () => {
    if (!currentUser) {
      return;
    }

    const userName = currentUser.name;
    sessionStore.clear();
    setCurrentUser(null);
    setThreads([]);
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
      if (isSocketConnected) {
        const response = await joinConversation(threadId);
        if (response?.conversation) {
          const nextThread = normalizeThread(response.conversation);
          applyThreadUpdate(nextThread, { messageMode: "replace" });
          return { ok: true, thread: nextThread };
        }
      }

      const messages = await apiClient.getThreadMessages(threadId);
      applyThreadUpdate({ id: threadId, messages }, { messageMode: "replace" });
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

  const handleMarkThreadRead = async (threadId) => {
    try {
      const updatedThread = isSocketConnected
        ? normalizeThread((await markConversationReadSocket(threadId)).conversation)
        : await apiClient.markThreadRead(threadId);

      applyThreadUpdate(updatedThread, { messageMode: "preserve" });
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

  const handleReportListing = (reportedProduct) => {
    showToast({
      type: "success",
      title: "Listing reported",
      message: `${reportedProduct.title} has been flagged for review.`,
    });
  };

  const handleBlockSeller = (blockedProduct) => {
    const sellerId = blockedProduct.seller?.id;
    if (!sellerId) {
      return;
    }

    setBlockedSellerIds((currentIds) =>
      currentIds.includes(sellerId) ? currentIds : [...currentIds, sellerId],
    );
    setSelectedProduct(null);
    showToast({
      type: "success",
      title: "Seller blocked",
      message: `${blockedProduct.seller.name}'s listings will no longer appear in your marketplace feed.`,
    });
  };

  if (isBootstrapping) {
    return <PageLoader label="Connecting to the marketplace API..." />;
  }

  return (
    <div className="page-shell">
      <div className="page-glow page-glow-left" />
      <div className="page-glow page-glow-right" />
      <Navbar
        className={activePage === "messages" ? "messages-navbar" : ""}
        onHomeClick={scrollToListings}
        onSellClick={openSellPage}
        onLogoutClick={handleLogout}
        onMessagesClick={openMessagesPage}
        currentUser={currentUser}
        messageCount={unreadMessageCount}
      />
      <main className={activePage === "messages" ? "page-main messages-main" : "page-main"}>
        <div className={activePage === "messages" ? "app-layout messages-layout" : "app-layout"}>
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
                  <span>{products.length}</span>
                  <small>Total items</small>
                </div>
                <div>
                  <span>{savedItems.length}</span>
                  <small>Saved items</small>
                </div>
              </div>
            </div>
          </aside>

          <div className={activePage === "messages" ? "app-content messages-content" : "app-content"}>
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
                <Hero />

                <section className="products-section" ref={listingsSectionRef}>
                  <SearchBar
                    query={query}
                    onQueryChange={handleSearchChange}
                    resultCount={visibleProducts.length}
                    totalCount={products.length}
                  />

                  <div className="market-controls">
                    <div className="category-filter" aria-label="Filter by category">
                      {categories.map((category) => (
                        <button
                          key={category}
                          type="button"
                          className={
                            category === activeCategory ? "filter-chip active" : "filter-chip"
                          }
                          onClick={() => setActiveCategory(category)}
                        >
                          {category}
                        </button>
                      ))}
                    </div>

                    <label className="sort-control">
                      <span>Sort by</span>
                      <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                        <option value="latest">Latest</option>
                        <option value="price-low">Price: low to high</option>
                        <option value="price-high">Price: high to low</option>
                        <option value="title">Alphabetical</option>
                      </select>
                    </label>
                  </div>

                  <ProductList
                    key={`${activeCategory}-${sortBy}-${normalizedQuery}-${visibleProducts.length}`}
                    products={visibleProducts}
                    savedItems={savedItems}
                    onSaveToggle={handleSaveToggle}
                    onViewDetails={setSelectedProduct}
                  />
                </section>
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
            products={products}
            isSaved={savedItems.includes(selectedProduct.id)}
            onClose={() => setSelectedProduct(null)}
            onSaveToggle={handleSaveToggle}
            onContactSeller={openMessagesForProduct}
            onReportListing={handleReportListing}
            onBlockSeller={handleBlockSeller}
            onSelectRelatedProduct={setSelectedProduct}
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

export default Home;
