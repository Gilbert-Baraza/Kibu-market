import { useEffect, useRef } from "react";

function ChatConversation({
  product,
  messages,
  draftMessage,
  onDraftChange,
  onSendMessage,
  onBack,
  threadRef,
  mobile = false,
  isSending = false,
  role = "buying",
  roleLabel = "Buying",
  roleContextLabel = "You are buying this item",
  otherParticipantName = "Campus Seller",
  productStatus = "active",
  presenceLabel = "Active listing",
  typingLabel = "",
}) {
  const isSelling = role === "selling";
  const firstName = otherParticipantName.split(" ")[0] ?? "them";
  const currentUserMessageRole = isSelling ? "seller" : "buyer";
  const hasInitializedScrollRef = useRef(false);
  const previousMessageCountRef = useRef(0);

  useEffect(() => {
    if (!threadRef?.current || hasInitializedScrollRef.current) {
      return;
    }

    threadRef.current.scrollTop = threadRef.current.scrollHeight;
    previousMessageCountRef.current = messages.length;
    hasInitializedScrollRef.current = true;
  }, [messages.length, threadRef]);

  useEffect(() => {
    if (!hasInitializedScrollRef.current) {
      return;
    }

    const lastMessage = messages[messages.length - 1] ?? null;
    const hasNewMessage = messages.length > previousMessageCountRef.current;
    const isIncomingMessage =
      lastMessage?.sender && lastMessage.sender !== currentUserMessageRole;

    if (hasNewMessage && isIncomingMessage && threadRef?.current) {
      threadRef.current.scrollTo({
        top: threadRef.current.scrollHeight,
        behavior: "smooth",
      });
    }

    previousMessageCountRef.current = messages.length;
  }, [currentUserMessageRole, messages, threadRef]);

  return (
    <section className="messenger-chat-panel">
      <header className={mobile ? "messenger-chat-header mobile-chat-header" : "messenger-chat-header"}>
        <div className="messenger-chat-profile">
          <button
            type="button"
            className={mobile ? "mobile-chat-back messenger-mobile-back" : "messenger-mobile-back"}
            onClick={onBack}
            aria-label="Back to marketplace"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          <div className="messenger-avatar-shell">
            <img src={product.image} alt={product.title} className="messenger-chat-avatar" />
            <span className="messenger-presence-dot" />
          </div>

          <div className="messenger-profile-copy">
            <strong>{otherParticipantName}</strong>
            <span>{presenceLabel}</span>
          </div>
        </div>

        <div className="messenger-chat-actions">
          <span className={isSelling ? "role-badge selling" : "role-badge buying"}>{roleLabel}</span>
          <span className={productStatus === "sold" ? "messenger-status sold" : "messenger-status"}>
            {productStatus === "sold" ? "Sold" : "Active"}
          </span>
        </div>
      </header>

      <div className="messenger-product-strip">
        <div className="messenger-product-copy">
          <span className="messenger-product-kicker">{roleContextLabel}</span>
          <strong>{product.title}</strong>
          <p>{product.location} • KES {Number(product.price ?? 0).toLocaleString()}</p>
        </div>
      </div>

      <div className={mobile ? "messenger-chat-thread mobile-chat-thread" : "messenger-chat-thread"} ref={threadRef}>
        <div className="messenger-day-pill">{roleContextLabel}</div>

        {messages.length > 0 ? messages.map((message) => {
          const isCurrentUser = message.sender === currentUserMessageRole;

          return (
            <div
              key={message.id}
              className={isCurrentUser ? "messenger-bubble-row mine" : "messenger-bubble-row"}
            >
              <div className={isCurrentUser ? "messenger-bubble mine" : "messenger-bubble"}>
                {!isCurrentUser ? <span className="messenger-bubble-author">{otherParticipantName}</span> : null}
                <p>{message.text}</p>
                <span className="messenger-bubble-time">{message.time}</span>
              </div>
            </div>
          );
        }) : (
          <div className="messenger-empty-thread-card">
            <span className="messenger-empty-emoji">💬</span>
            <strong>Start the conversation</strong>
            <p>Ask {firstName} about the item, pickup, or price.</p>
          </div>
        )}
      </div>

      {typingLabel ? (
        <div className="messenger-typing-indicator">{typingLabel} is typing...</div>
      ) : null}

      <div className={mobile ? "messenger-composer mobile-chat-composer" : "messenger-composer"}>
        <button type="button" className="messenger-composer-icon" aria-label="Add attachment">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
        <button type="button" className="messenger-composer-icon" aria-label="Insert emoji">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M8 15s1.5 2 4 2 4-2 4-2" />
            <line x1="9" y1="9" x2="9.01" y2="9" />
            <line x1="15" y1="9" x2="15.01" y2="9" />
          </svg>
        </button>
        <input
          type="text"
          value={draftMessage}
          onChange={(event) => onDraftChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              onSendMessage();
            }
          }}
          disabled={isSending}
          placeholder={`Type a message to ${firstName}...`}
        />
        <button type="button" className="messenger-send" onClick={onSendMessage} disabled={isSending}>
          {isSending ? "Sending..." : "Send"}
        </button>
      </div>
    </section>
  );
}

export default ChatConversation;