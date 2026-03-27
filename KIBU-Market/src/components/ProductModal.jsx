import { useEffect, useRef, useState } from "react";

function ProductModal({ product, isSaved, onClose, onSaveToggle }) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [draftMessage, setDraftMessage] = useState("");
  const [messages, setMessages] = useState(product.messages ?? []);
  const modalRef = useRef(null);
  const chatThreadRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        if (isChatOpen) {
          setIsChatOpen(false);
          return;
        }
        onClose();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isChatOpen, onClose]);

  useEffect(() => {
    setMessages(product.messages ?? []);
    setDraftMessage("");
    setIsChatOpen(false);
  }, [product]);

  useEffect(() => {
    if (!isChatOpen) {
      return;
    }

    if (modalRef.current) {
      modalRef.current.scrollTop = 0;
    }

    if (chatThreadRef.current) {
      chatThreadRef.current.scrollTop = chatThreadRef.current.scrollHeight;
    }
  }, [isChatOpen, messages]);

  const handleSendMessage = () => {
    const trimmedMessage = draftMessage.trim();
    if (!trimmedMessage) {
      return;
    }

    setMessages((currentMessages) => [
      ...currentMessages,
      {
        id: `local-${Date.now()}`,
        sender: "buyer",
        text: trimmedMessage,
        time: "Now",
      },
    ]);
    setDraftMessage("");
  };

  const handlePrimaryClose = () => {
    if (isChatOpen) {
      setIsChatOpen(false);
      return;
    }

    onClose();
  };

  const handleOpenChat = () => {
    setIsChatOpen(true);
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        ref={modalRef}
        className={isChatOpen ? "product-modal chat-open" : "product-modal"}
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className={isChatOpen ? "modal-close modal-close-back" : "modal-close"}
          onClick={handlePrimaryClose}
          aria-label={isChatOpen ? "Go back to product details" : "Close product details"}
        >
          {isChatOpen ? "Back" : "Close"}
        </button>

        <div className="modal-media">
          <img src={product.image} alt={product.title} className="modal-image" />
        </div>

        <div className="modal-content">
          <div className="modal-topline">
            <span className="product-category">{product.category}</span>
            <p className="price">KES {product.price.toLocaleString()}</p>
          </div>

          <h2 id="product-modal-title">{product.title}</h2>
          <p className="modal-location">{product.location}</p>
          <p className="modal-description">{product.description}</p>

          <div className="modal-tags">
            {product.tags?.map((tag) => (
              <span key={tag} className="modal-tag">
                {tag}
              </span>
            ))}
          </div>

          <div className="modal-meta-grid">
            <div>
              <strong>Seller response</strong>
              <span>Usually replies within a day</span>
            </div>
            <div>
              <strong>Meetup point</strong>
              <span>{product.location}</span>
            </div>
            <div>
              <strong>Payment</strong>
              <span>M-Pesa or cash on meetup</span>
            </div>
            <div>
              <strong>Listing status</strong>
              <span>Available right now</span>
            </div>
          </div>

          {!isChatOpen ? (
            <div className="modal-actions">
              <button
                type="button"
                className={isSaved ? "secondary-btn modal-save active" : "secondary-btn modal-save"}
                onClick={() => onSaveToggle(product.id)}
              >
                {isSaved ? "Saved for later" : "Save item"}
              </button>
              <button
                type="button"
                className="primary-btn"
                onClick={handleOpenChat}
              >
                Contact seller
              </button>
            </div>
          ) : null}
        </div>

        {isChatOpen ? (
          <aside className="chat-panel">
            <div className="chat-header">
              <div className="chat-seller">
                <span className="chat-avatar">
                  {product.seller.name
                    .split(" ")
                    .map((part) => part[0])
                    .join("")
                    .slice(0, 2)}
                </span>
                <div>
                  <strong>{product.seller.name}</strong>
                  <span>{product.seller.status}</span>
                </div>
              </div>
              <button
                type="button"
                className="chat-close"
                onClick={() => setIsChatOpen(false)}
                aria-label="Close chat panel"
              >
                Hide chat
              </button>
            </div>

            <div className="chat-thread" ref={chatThreadRef}>
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

            <div className="chat-composer">
              <input
                type="text"
                value={draftMessage}
                onChange={(event) => setDraftMessage(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    handleSendMessage();
                  }
                }}
                placeholder={`Message ${product.seller.name.split(" ")[0]}...`}
              />
              <button type="button" className="chat-send" onClick={handleSendMessage}>
                Send
              </button>
            </div>
          </aside>
        ) : null}
      </div>

      {isChatOpen ? (
        <div
          className="mobile-chat-sheet"
          role="dialog"
          aria-modal="true"
          aria-labelledby="mobile-chat-title"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="mobile-chat-header">
            <button
              type="button"
              className="mobile-chat-back"
              onClick={() => setIsChatOpen(false)}
              aria-label="Back to product details"
            >
              Back
            </button>
            <div className="chat-seller">
              <span className="chat-avatar">
                {product.seller.name
                  .split(" ")
                  .map((part) => part[0])
                  .join("")
                  .slice(0, 2)}
              </span>
              <div>
                <strong id="mobile-chat-title">{product.seller.name}</strong>
                <span>{product.seller.status}</span>
              </div>
            </div>
          </div>

          <div className="chat-thread mobile-chat-thread" ref={chatThreadRef}>
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

          <div className="chat-composer mobile-chat-composer">
            <input
              type="text"
              value={draftMessage}
              onChange={(event) => setDraftMessage(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  handleSendMessage();
                }
              }}
              placeholder={`Message ${product.seller.name.split(" ")[0]}...`}
            />
            <button type="button" className="chat-send" onClick={handleSendMessage}>
              Send
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default ProductModal;
