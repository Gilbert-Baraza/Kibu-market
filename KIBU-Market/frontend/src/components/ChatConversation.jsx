import { useEffect } from "react";

function ChatConversation({
  product,
  messages,
  draftMessage,
  onDraftChange,
  onSendMessage,
  onBack,
  threadRef,
  mobile = false,
}) {
  useEffect(() => {
    if (!threadRef?.current) {
      return;
    }

    threadRef.current.scrollTop = threadRef.current.scrollHeight;
  }, [messages, threadRef]);

  const sellerInitials = product.seller.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);

  const headerClassName = mobile ? "mobile-chat-header" : "chat-header";
  const backButtonClassName = mobile ? "mobile-chat-back" : "chat-close";
  const threadClassName = mobile ? "chat-thread mobile-chat-thread" : "chat-thread";
  const composerClassName = mobile
    ? "chat-composer mobile-chat-composer"
    : "chat-composer";

  return (
    <>
      <div className={headerClassName}>
        <button
          type="button"
          className={backButtonClassName}
          onClick={onBack}
          aria-label={mobile ? "Back to product details" : "Close chat panel"}
        >
          {mobile ? "Back" : "Hide chat"}
        </button>
        <div className="chat-seller">
          <span className="chat-avatar">{sellerInitials}</span>
          <div>
            <strong>{product.seller.name}</strong>
            <span>{product.seller.status}</span>
          </div>
        </div>
      </div>

      <div className={threadClassName} ref={threadRef}>
        <div className="chat-pill">Chat about {product.title}</div>
        {messages.map((message) => (
          <div
            key={message.id}
            className={
              message.sender === "buyer"
                ? "chat-bubble chat-bubble-user"
                : "chat-bubble chat-bubble-seller"
            }
          >
            <p>{message.text}</p>
            <span>{message.time}</span>
          </div>
        ))}
      </div>

      <div className={composerClassName}>
        <input
          type="text"
          value={draftMessage}
          onChange={(event) => onDraftChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              onSendMessage();
            }
          }}
          placeholder={`Message ${product.seller.name.split(" ")[0]}...`}
        />
        <button type="button" className="chat-send" onClick={onSendMessage}>
          Send
        </button>
      </div>
    </>
  );
}

export default ChatConversation;
