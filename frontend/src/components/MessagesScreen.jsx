import { useEffect, useMemo, useRef, useState } from "react";
import ChatConversation from "./ChatConversation";
import SmartImage from "./SmartImage";

const MESSENGER_THEME_STORAGE_KEY = "kibu-market-messenger-theme";
const MOBILE_BREAKPOINT = 720;

function getStoredMessengerTheme() {
  try {
    const value = window.localStorage.getItem(MESSENGER_THEME_STORAGE_KEY);
    return value === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

function getConversationRole(thread, currentUser) {
  if (!currentUser) {
    return "buying";
  }

  return String(thread.sellerId) === String(currentUser.id) ? "selling" : "buying";
}

function getRoleBadgeLabel(role) {
  return role === "selling" ? "Selling" : "Buying";
}

function getRoleContextLabel(role) {
  return role === "selling" ? "You are selling this item" : "You are buying this item";
}

function getOtherParticipantName(thread, role) {
  return role === "selling" ? thread.buyerName : thread.sellerName;
}

function getOtherParticipantId(thread, role) {
  return role === "selling" ? thread.buyerId : thread.sellerId;
}

function getEmptyStateCopy(activeFilter, hasSearch) {
  if (hasSearch) {
    return {
      label: "No matches",
      title: "No conversations found.",
      description: "Try a different product name or participant search.",
    };
  }

  if (activeFilter === "buying") {
    return {
      label: "No buying chats",
      title: "You are not buying anything yet.",
      description: "When you message a seller, those conversations will appear here.",
    };
  }

  if (activeFilter === "selling") {
    return {
      label: "No selling chats",
      title: "You are not selling anything yet.",
      description: "Buyer conversations for your listings will show up here.",
    };
  }

  return {
    label: "No messages",
    title: "You have no messages yet.",
    description: "Start a conversation from any listing and it will appear in this inbox.",
  };
}

function getThreadUnreadCount(thread, role) {
  if (!thread?.id) {
    return 0;
  }

  if (thread.unreadCounts) {
    return role === "selling"
      ? Number(thread.unreadCounts.seller ?? 0)
      : Number(thread.unreadCounts.buyer ?? 0);
  }

  return Number(thread.unreadCount ?? 0);
}

function getPresenceLabel(thread, isOnline) {
  if (isOnline) {
    return "online";
  }

  return thread.productStatus === "sold" ? "Listing sold" : "offline";
}

function MessagesScreen({
  products,
  threads,
  currentUser,
  onBack,
  onSendMessage,
  onMarkThreadRead,
  onJoinConversation,
  onLeaveConversation,
  onTypingStart,
  onTypingStop,
  typingByConversation = {},
  onlineUserIds = [],
  initialProductId = null,
  isSending = false,
  hasMoreThreads = false,
  onLoadMoreThreads,
  messagePaginationByThread = {},
  isLoadingOlderMessages = false,
  onLoadOlderMessages,
}) {
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [draftMessage, setDraftMessage] = useState("");
  const [selectedKey, setSelectedKey] = useState(initialProductId ? `product-${initialProductId}` : null);
  const [messengerTheme, setMessengerTheme] = useState(getStoredMessengerTheme);
  const [isMobileLayout, setIsMobileLayout] = useState(() => window.innerWidth <= MOBILE_BREAKPOINT);
  const [showMobileChat, setShowMobileChat] = useState(Boolean(initialProductId));
  const [pendingOutgoingMessage, setPendingOutgoingMessage] = useState(null);
  const threadRef = useRef(null);
  const pendingReadThreadIdRef = useRef(null);
  const typingConversationIdRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    try {
      window.localStorage.setItem(MESSENGER_THEME_STORAGE_KEY, messengerTheme);
    } catch {
      // ignore storage issues and keep the in-memory theme
    }
  }, [messengerTheme]);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= MOBILE_BREAKPOINT;
      setIsMobileLayout(mobile);
      if (!mobile) {
        setShowMobileChat(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const productMap = useMemo(
    () => Object.fromEntries(products.map((product) => [String(product.id), product])),
    [products],
  );

  const onlineSet = useMemo(() => new Set(onlineUserIds.map(String)), [onlineUserIds]);

  const availableThreads = useMemo(
    () =>
      threads
        .map((thread) => {
          const product = thread.product ?? productMap[String(thread.productId)] ?? null;
          if (!product) {
            return null;
          }

          const role = getConversationRole(thread, currentUser);
          const otherParticipantId = getOtherParticipantId(thread, role);
          const isOtherParticipantOnline = onlineSet.has(String(otherParticipantId));

          return {
            ...thread,
            key: `thread-${thread.id}`,
            product,
            role,
            roleLabel: getRoleBadgeLabel(role),
            roleContextLabel: getRoleContextLabel(role),
            otherParticipantName: getOtherParticipantName(thread, role),
            otherParticipantId,
            isOtherParticipantOnline,
            presenceLabel: getPresenceLabel(thread, isOtherParticipantOnline),
          };
        })
        .filter(Boolean),
    [currentUser, onlineSet, productMap, threads],
  );

  const initialProductThread = useMemo(() => {
    if (!initialProductId) {
      return null;
    }

    const existingThread = availableThreads.find(
      (thread) => String(thread.product.id) === String(initialProductId),
    );
    if (existingThread) {
      return existingThread;
    }

    const product = productMap[String(initialProductId)];
    if (!product) {
      return null;
    }

    return {
      id: null,
      key: `product-${product.id}`,
      productId: product.id,
      buyerId: currentUser?.id ?? "",
      sellerId: product.seller?.id ?? "",
      buyerName: currentUser?.name ?? "You",
      sellerName: product.seller?.name ?? "Campus Seller",
      unreadCount: 0,
      unreadCounts: { buyer: 0, seller: 0 },
      messages: [],
      updatedAt: null,
      productStatus: product.listingState ?? "active",
      product,
      role: "buying",
      roleLabel: "Buying",
      roleContextLabel: "You are buying this item",
      otherParticipantName: product.seller?.name ?? "Campus Seller",
      otherParticipantId: product.seller?.id ?? "",
      isOtherParticipantOnline: onlineSet.has(String(product.seller?.id ?? "")),
      presenceLabel: onlineSet.has(String(product.seller?.id ?? "")) ? "online" : "Ready to chat",
    };
  }, [availableThreads, currentUser?.id, currentUser?.name, initialProductId, onlineSet, productMap]);

  const allThreads = useMemo(() => {
    if (!initialProductThread) {
      return availableThreads;
    }

    const alreadyIncluded = availableThreads.some(
      (thread) => thread.key === initialProductThread.key,
    );
    return alreadyIncluded ? availableThreads : [initialProductThread, ...availableThreads];
  }, [availableThreads, initialProductThread]);

  const filteredThreads = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    return allThreads.filter((thread) => {
      const matchesFilter =
        activeFilter === "all" ||
        (activeFilter === "buying" && thread.role === "buying") ||
        (activeFilter === "selling" && thread.role === "selling");

      if (!matchesFilter) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const haystack = [
        thread.product.title,
        thread.otherParticipantName,
        thread.lastMessage,
        thread.messages[thread.messages.length - 1]?.text ?? "",
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    });
  }, [activeFilter, allThreads, searchQuery]);

  const selectedThread =
    filteredThreads.find((thread) => thread.key === selectedKey) ??
    filteredThreads.find((thread) => String(thread.product.id) === String(initialProductId)) ??
    filteredThreads[0] ??
    null;
  const selectedThreadMessages = useMemo(() => {
    if (!selectedThread) {
      return [];
    }

    const messages = [...selectedThread.messages];

    if (
      pendingOutgoingMessage &&
      pendingOutgoingMessage.threadKey === selectedThread.key
    ) {
      messages.push({
        id: pendingOutgoingMessage.id,
        sender: selectedThread.role === "selling" ? "seller" : "buyer",
        text: pendingOutgoingMessage.text,
        time: "Now",
        createdAt: new Date().toISOString(),
        deliveryStatus: "sending",
        isRead: false,
      });
    }

    return messages;
  }, [pendingOutgoingMessage, selectedThread]);

  useEffect(() => {
    if (!selectedThread?.id || !onMarkThreadRead) {
      pendingReadThreadIdRef.current = null;
      return;
    }

    const unreadCount = getThreadUnreadCount(selectedThread, selectedThread.role);
    if (unreadCount <= 0 || pendingReadThreadIdRef.current === selectedThread.id) {
      return;
    }

    pendingReadThreadIdRef.current = selectedThread.id;

    Promise.resolve(onMarkThreadRead(selectedThread.id)).finally(() => {
      if (pendingReadThreadIdRef.current === selectedThread.id) {
        pendingReadThreadIdRef.current = null;
      }
    });
  }, [onMarkThreadRead, selectedThread]);

  useEffect(() => {
    if (!selectedThread?.id || !onJoinConversation) {
      return undefined;
    }

    const shouldJoin = !isMobileLayout || showMobileChat;
    if (!shouldJoin) {
      return undefined;
    }

    onJoinConversation(selectedThread.id);

    return () => {
      onLeaveConversation?.(selectedThread.id);
    };
  }, [isMobileLayout, onJoinConversation, onLeaveConversation, selectedThread?.id, showMobileChat]);

  useEffect(() => () => {
    if (typingTimeoutRef.current) {
      window.clearTimeout(typingTimeoutRef.current);
    }

    if (typingConversationIdRef.current) {
      onTypingStop?.(typingConversationIdRef.current);
    }
  }, [onTypingStop]);

  const unreadCounts = {
    all: allThreads.reduce(
      (count, thread) => count + getThreadUnreadCount(thread, thread.role),
      0,
    ),
    buying: allThreads
      .filter((thread) => thread.role === "buying")
      .reduce((count, thread) => count + getThreadUnreadCount(thread, thread.role), 0),
    selling: allThreads
      .filter((thread) => thread.role === "selling")
      .reduce((count, thread) => count + getThreadUnreadCount(thread, thread.role), 0),
  };

  const stopTypingForConversation = (conversationId) => {
    if (!conversationId || typingConversationIdRef.current !== conversationId) {
      return;
    }

    if (typingTimeoutRef.current) {
      window.clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    typingConversationIdRef.current = null;
    onTypingStop?.(conversationId);
  };

  const handleDraftChange = (value) => {
    setDraftMessage(value);

    if (!selectedThread?.id) {
      return;
    }

    if (!value.trim()) {
      stopTypingForConversation(selectedThread.id);
      return;
    }

    if (typingConversationIdRef.current !== selectedThread.id) {
      typingConversationIdRef.current = selectedThread.id;
      onTypingStart?.(selectedThread.id);
    }

    if (typingTimeoutRef.current) {
      window.clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = window.setTimeout(() => {
      stopTypingForConversation(selectedThread.id);
    }, 1200);
  };

  const handleSend = async () => {
    const trimmedMessage = draftMessage.trim();
    if (!trimmedMessage || !selectedThread) {
      return;
    }

    const recipientId = selectedThread.role === "selling"
      ? selectedThread.buyerId
      : selectedThread.sellerId;

    const pendingMessageId = `pending-${Date.now()}`;
    setPendingOutgoingMessage({
      id: pendingMessageId,
      threadKey: selectedThread.key,
      text: trimmedMessage,
    });

    try {
      const result = await onSendMessage({
        threadId: selectedThread.id,
        productId: selectedThread.product.id,
        recipientId,
        text: trimmedMessage,
      });

      if (result?.ok) {
        stopTypingForConversation(selectedThread.id);
        setDraftMessage("");
        if (result.thread?.id) {
          setSelectedKey(`thread-${result.thread.id}`);
        }
      }
    } finally {
      setPendingOutgoingMessage((current) =>
        current?.id === pendingMessageId ? null : current,
      );
    }
  };

  const emptyState = getEmptyStateCopy(activeFilter, Boolean(searchQuery.trim()));
  const showThreadList = !isMobileLayout || !showMobileChat;
  const showChatPanel = !isMobileLayout || showMobileChat;
  const activeTypingState = selectedThread?.id ? typingByConversation[selectedThread.id] : null;
  const selectedThreadPagination = selectedThread?.id ? messagePaginationByThread[selectedThread.id] : null;

  return (
    <section className={`messages-screen messenger-shell messenger-theme-${messengerTheme}`}>
      <div className="messenger-frame">
        {showThreadList ? (
          <aside className="messenger-sidebar">
            <div className="messenger-sidebar-header">
              <div>
                <span className="messenger-kicker">Marketplace chat</span>
                <h2>Chats</h2>
              </div>
              <div className="messenger-header-actions">
                <button
                  type="button"
                  className="messenger-theme-toggle-icon-only"
                  onClick={() => setMessengerTheme((current) => current === "dark" ? "light" : "dark")}
                  aria-label={`Switch to ${messengerTheme === "dark" ? "light" : "dark"} chat background`}
                  title={`Switch to ${messengerTheme === "dark" ? "light" : "dark"} chat background`}
                >
                  {messengerTheme === "dark" ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 3a6 6 0 1 0 9 9 9 9 0 1 1-9-9z" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="4" />
                      <path d="M12 2v2" />
                      <path d="M12 20v2" />
                      <path d="m4.93 4.93 1.41 1.41" />
                      <path d="m17.66 17.66 1.41 1.41" />
                      <path d="M2 12h2" />
                      <path d="M20 12h2" />
                      <path d="m6.34 17.66-1.41 1.41" />
                      <path d="m19.07 4.93-1.41 1.41" />
                    </svg>
                  )}
                </button>
                <button type="button" className="messenger-back-btn" onClick={onBack}>
                  Back
                </button>
              </div>
            </div>

            <label className="messenger-search">
              <span className="messenger-search-icon" aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search or start a new conversation"
              />
            </label>

            <div className="messenger-filter-row" role="tablist" aria-label="Inbox filter">
              {[
                { id: "all", label: "All" },
                { id: "buying", label: "Buying" },
                { id: "selling", label: "Selling" },
              ].map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  className={activeFilter === filter.id ? "messenger-filter active" : "messenger-filter"}
                  onClick={() => setActiveFilter(filter.id)}
                >
                  <span>{filter.label}</span>
                  {unreadCounts[filter.id] > 0 ? (
                    <span className="inbox-badge">{unreadCounts[filter.id]}</span>
                  ) : null}
                </button>
              ))}
            </div>

            <div className="messenger-thread-list">
              {filteredThreads.length > 0 ? (
                filteredThreads.map((thread) => {
                  const lastMessage = thread.messages[thread.messages.length - 1] ?? null;
                  const unreadCount = getThreadUnreadCount(thread, thread.role);

                  return (
                    <button
                      key={thread.key}
                      type="button"
                      className={
                        thread.key === selectedKey
                          ? "messenger-thread active"
                          : "messenger-thread"
                      }
                      onClick={() => {
                        setSelectedKey(thread.key);
                        setDraftMessage("");
                        if (isMobileLayout) {
                          setShowMobileChat(true);
                        }
                      }}
                    >
                      <SmartImage
                        src={thread.product.imageVariants?.chat ?? thread.product.image}
                        alt={thread.product.title}
                        className="messenger-thread-avatar"
                      />
                      <div className="messenger-thread-content">
                        <div className="messenger-thread-line">
                          <strong>{thread.otherParticipantName}</strong>
                          <span className="messenger-thread-time">{lastMessage?.time ?? "New"}</span>
                        </div>
                        <div className="messenger-thread-line messenger-thread-line-meta">
                          <span className="messenger-thread-product">
                            {thread.roleLabel} • {thread.product.title}
                          </span>
                          {unreadCount > 0 ? (
                            <span className="messenger-unread-dot" aria-label={`${unreadCount} unread messages`} />
                          ) : null}
                        </div>
                        <div className="messenger-thread-line messenger-thread-line-preview">
                          <p>{lastMessage?.text ?? "Start the conversation about this item."}</p>
                          <span className={thread.productStatus === "sold" ? "messenger-status sold" : "messenger-status"}>
                            {thread.productStatus === "sold" ? "Sold" : "Active"}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })
              ) : (
                <EmptyInboxState {...emptyState} compact dark={messengerTheme === "dark"} />
              )}
            </div>

            {hasMoreThreads ? (
              <div className="load-more-wrap messenger-load-more-wrap">
                <button type="button" className="secondary-btn load-more-btn" onClick={onLoadMoreThreads} disabled={!hasMoreThreads}>
                  Load more conversations
                </button>
              </div>
            ) : null}
          </aside>
        ) : null}

        {showChatPanel ? (
          <div className="messenger-chat-wrap">
            {selectedThread ? (
              <ChatConversation
                product={selectedThread.product}
                messages={selectedThreadMessages}
                draftMessage={draftMessage}
                onDraftChange={handleDraftChange}
                onSendMessage={handleSend}
                onBack={isMobileLayout ? () => setShowMobileChat(false) : onBack}
                threadRef={threadRef}
                isSending={isSending}
                role={selectedThread.role}
                roleLabel={selectedThread.roleLabel}
                roleContextLabel={selectedThread.roleContextLabel}
                otherParticipantName={selectedThread.otherParticipantName}
                productStatus={selectedThread.productStatus}
                presenceLabel={selectedThread.presenceLabel}
                typingLabel={activeTypingState?.userName ?? ""}
                mobile={isMobileLayout}
                hasOlderMessages={Boolean(selectedThreadPagination?.hasNextPage)}
                isLoadingOlderMessages={isLoadingOlderMessages}
                onLoadOlderMessages={() => onLoadOlderMessages?.(selectedThread.id)}
              />
            ) : (
              <div className="messenger-chat-panel messenger-chat-empty">
                <EmptyInboxState {...emptyState} dark={messengerTheme === "dark"} />
              </div>
            )}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function EmptyInboxState({ label, title, description, compact = false, dark = false }) {
  return (
    <div className={dark
      ? compact
        ? "empty-state empty-state-compact empty-state-dark"
        : "empty-state empty-state-dark"
      : compact
        ? "empty-state empty-state-compact"
        : "empty-state"}
    >
      <span className="section-label">{label}</span>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

export default MessagesScreen;
