import { useEffect, useMemo, useRef, useState } from "react";
import ChatConversation from "./ChatConversation";

function MessagesScreen({ products, currentUser, onBack, initialThreadId = null }) {
  const [activeInbox, setActiveInbox] = useState("buyer");
  const [searchQuery, setSearchQuery] = useState("");
  const [draftMessage, setDraftMessage] = useState("");
  const [selectedThreadId, setSelectedThreadId] = useState(initialThreadId);
  const [readThreadIds, setReadThreadIds] = useState([]);
  const [threadMap, setThreadMap] = useState(() =>
    Object.fromEntries(
      products.map((product) => [product.id, product.messages ?? []]),
    ),
  );
  const threadRef = useRef(null);

  useEffect(() => {
    setThreadMap((currentThreads) => {
      const nextThreads = { ...currentThreads };

      products.forEach((product) => {
        if (!nextThreads[product.id]) {
          nextThreads[product.id] = product.messages ?? [];
        }
      });

      return nextThreads;
    });
  }, [products]);

  const allThreads = useMemo(
    () =>
      products
        .filter((product) => (threadMap[product.id]?.length ?? 0) > 0)
        .map((product) => ({
          ...product,
          threadMessages: threadMap[product.id] ?? [],
        })),
    [products, threadMap],
  );

  const buyerThreads = useMemo(
    () =>
      allThreads.filter((product) =>
        currentUser ? product.seller?.id !== currentUser.id : true,
      ),
    [allThreads, currentUser],
  );
  const sellerThreads = useMemo(
    () =>
      currentUser
        ? allThreads.filter((product) => product.seller?.id === currentUser.id)
        : [],
    [allThreads, currentUser],
  );

  const currentInboxThreads = activeInbox === "seller" ? sellerThreads : buyerThreads;
  const filteredThreads = currentInboxThreads.filter((product) => {
    const haystack = [
      product.title,
      product.seller.name,
      product.location,
      product.threadMessages[product.threadMessages.length - 1]?.text ?? "",
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(searchQuery.trim().toLowerCase());
  });

  useEffect(() => {
    const preferredThread =
      filteredThreads.find((product) => product.id === initialThreadId) ??
      filteredThreads.find((product) => product.id === selectedThreadId) ??
      filteredThreads[0] ??
      null;

    setSelectedThreadId(preferredThread?.id ?? null);
    setDraftMessage("");
  }, [filteredThreads, initialThreadId, selectedThreadId]);

  useEffect(() => {
    if (!selectedThreadId) {
      return;
    }

    setReadThreadIds((currentIds) =>
      currentIds.includes(selectedThreadId)
        ? currentIds
        : [...currentIds, selectedThreadId],
    );
  }, [selectedThreadId]);

  const getUnreadCount = (product, inbox) => {
    if (readThreadIds.includes(product.id)) {
      return 0;
    }

    const incomingSender = inbox === "seller" ? "buyer" : "seller";
    return (product.threadMessages ?? []).filter(
      (message) => message.sender === incomingSender,
    ).length;
  };

  const buyerUnreadCount = buyerThreads.reduce(
    (count, product) => count + getUnreadCount(product, "buyer"),
    0,
  );
  const sellerUnreadCount = sellerThreads.reduce(
    (count, product) => count + getUnreadCount(product, "seller"),
    0,
  );

  const selectedProduct =
    filteredThreads.find((product) => product.id === selectedThreadId) ?? null;
  const selectedMessages = selectedProduct
    ? threadMap[selectedProduct.id] ?? []
    : [];

  const handleSelectThread = (product) => {
    setSelectedThreadId(product.id);
    setDraftMessage("");
  };

  const handleSendMessage = () => {
    const trimmedMessage = draftMessage.trim();
    if (!trimmedMessage || !selectedProduct) {
      return;
    }

    const sender = activeInbox === "seller" ? "seller" : "buyer";
    setThreadMap((currentThreads) => ({
      ...currentThreads,
      [selectedProduct.id]: [
        ...(currentThreads[selectedProduct.id] ?? []),
        {
          id: `inbox-${Date.now()}`,
          sender,
          text: trimmedMessage,
          time: "Now",
        },
      ],
    }));
    setDraftMessage("");
  };

  return (
    <section className="messages-screen">
      <div className="messages-header">
        <div>
          <span className="section-label">Messages</span>
          <h2>Your conversations</h2>
        </div>
        <button type="button" className="secondary-btn" onClick={onBack}>
          Back to marketplace
        </button>
      </div>

      <div className="messages-toolbar">
        <div className="messages-tabs" role="tablist" aria-label="Inbox type">
          <button
            type="button"
            className={activeInbox === "buyer" ? "filter-chip active" : "filter-chip"}
            onClick={() => setActiveInbox("buyer")}
          >
            Buyer inbox
            {buyerUnreadCount > 0 ? (
              <span className="inbox-badge">{buyerUnreadCount}</span>
            ) : null}
          </button>
          <button
            type="button"
            className={activeInbox === "seller" ? "filter-chip active" : "filter-chip"}
            onClick={() => setActiveInbox("seller")}
          >
            Seller inbox
            {sellerUnreadCount > 0 ? (
              <span className="inbox-badge">{sellerUnreadCount}</span>
            ) : null}
          </button>
        </div>

        <label className="messages-search">
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search by item, seller, or message"
          />
        </label>
      </div>

      <div className="messages-layout">
        <aside className="messages-sidebar">
          {filteredThreads.map((product) => {
            const lastMessage =
              product.threadMessages[product.threadMessages.length - 1] ?? null;
            const unreadCount = getUnreadCount(product, activeInbox);

            return (
              <button
                key={product.id}
                type="button"
                className={
                  product.id === selectedThreadId
                    ? "message-thread-card active"
                    : "message-thread-card"
                }
                onClick={() => handleSelectThread(product)}
              >
                <img src={product.image} alt={product.title} className="message-thread-image" />
                <div className="message-thread-copy">
                  <div className="message-thread-heading">
                    <strong>{product.title}</strong>
                    <span className="message-thread-time">
                      {lastMessage?.time ?? ""}
                    </span>
                  </div>
                  <span>{product.seller.name}</span>
                  <div className="message-thread-preview">
                    <p>{lastMessage?.text ?? "No messages yet"}</p>
                    {unreadCount > 0 ? (
                      <span className="message-unread-badge">{unreadCount}</span>
                    ) : null}
                  </div>
                </div>
              </button>
            );
          })}

          {filteredThreads.length === 0 ? (
            <div className="empty-state">
              <span className="section-label">No matches</span>
              <h3>No conversations found.</h3>
              <p>Try a different search or switch inbox tabs.</p>
            </div>
          ) : null}
        </aside>

        <div className="messages-chat-panel">
          {selectedProduct ? (
            <ChatConversation
              product={selectedProduct}
              messages={selectedMessages}
              draftMessage={draftMessage}
              onDraftChange={setDraftMessage}
              onSendMessage={handleSendMessage}
              onBack={onBack}
              threadRef={threadRef}
            />
          ) : (
            <div className="empty-state">
              <span className="section-label">No chats</span>
              <h3>No conversations yet.</h3>
              <p>Once you start messaging sellers, your threads will appear here.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default MessagesScreen;
