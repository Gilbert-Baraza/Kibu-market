import { useEffect, useMemo, useRef, useState } from "react";

function ProductModal({
  product,
  products,
  isSaved,
  onClose,
  onSaveToggle,
  onContactSeller,
  onReportListing,
  onBlockSeller,
  onSelectRelatedProduct,
}) {
  const modalRef = useRef(null);
  const [activeImage, setActiveImage] = useState(product.image);
  const [shareMessage, setShareMessage] = useState("");
  const [isSellerExpanded, setIsSellerExpanded] = useState(false);

  const galleryImages = useMemo(
    () => (product.gallery?.length ? product.gallery : [product.image]),
    [product],
  );
  const sellerListings = useMemo(
    () => products.filter((item) => item.seller?.id === product.seller?.id),
    [product.seller?.id, products],
  );
  const activeSellerListings = sellerListings.filter(
    (item) => item.listingState !== "sold",
  );
  const soldSellerListings = sellerListings.filter(
    (item) => item.listingState === "sold",
  );
  const sellerConversations = sellerListings.filter(
    (item) => (item.messages?.length ?? 0) > 0,
  );
  const sellerResponseThreads = sellerConversations.filter((item) => {
    const messages = item.messages ?? [];
    const firstBuyerIndex = messages.findIndex((message) => message.sender === "buyer");

    if (firstBuyerIndex === -1) {
      return messages.some((message) => message.sender === "seller");
    }

    return messages
      .slice(firstBuyerIndex + 1)
      .some((message) => message.sender === "seller");
  });
  const sellerResponseRate = sellerConversations.length
    ? Math.round((sellerResponseThreads.length / sellerConversations.length) * 100)
    : 100;
  const sellerProfile = {
    rating: product.seller.rating ?? "4.8",
    joined: product.seller.joined ?? "Campus seller",
    listings: `${activeSellerListings.length} active listings`,
    activeCount: activeSellerListings.length,
    soldCount: soldSellerListings.length,
    responseRate: `${sellerResponseRate}%`,
  };
  const relatedProducts = useMemo(
    () =>
      products
        .filter(
          (item) =>
            item.id !== product.id &&
            (item.category === product.category ||
              item.location === product.location),
        )
        .slice(0, 3),
    [product, products],
  );
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
  const getListingStatusMessage = (listingState) => {
    switch (listingState) {
      case "draft":
        return "Saved as draft and hidden from buyers";
      case "paused":
        return "Temporarily hidden from buyers";
      case "sold":
        return "Marked as sold";
      default:
        return "Available right now";
    }
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  useEffect(() => {
    setActiveImage(galleryImages[0]);
    setShareMessage("");
    setIsSellerExpanded(false);
  }, [galleryImages, product]);

  const handleShare = async () => {
    const shareText = `${product.title} - KES ${product.price.toLocaleString()} at ${product.location}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: product.title,
          text: shareText,
        });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareText);
        setShareMessage("Listing details copied.");
        window.setTimeout(() => setShareMessage(""), 1800);
      }
    } catch {
      setShareMessage("Unable to share right now.");
      window.setTimeout(() => setShareMessage(""), 1800);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        ref={modalRef}
        className="product-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="modal-close"
          onClick={onClose}
          aria-label="Close product details"
        >
          Close
        </button>

        <div className="modal-media">
          <img
            src={activeImage}
            alt={product.title}
            className="modal-image"
            loading="eager"
            decoding="async"
            sizes="(max-width: 767px) 100vw, 40vw"
          />
          {galleryImages.length > 1 ? (
            <div className="modal-gallery">
              {galleryImages.map((image, index) => (
                <button
                  key={`${product.id}-${index}`}
                  type="button"
                  className={
                    image === activeImage
                      ? "modal-thumb active"
                      : "modal-thumb"
                  }
                  onClick={() => setActiveImage(image)}
                >
                  <img src={image} alt={`${product.title} view ${index + 1}`} />
                </button>
              ))}
            </div>
          ) : null}
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
              <span>{getListingStatusMessage(product.listingState)}</span>
            </div>
          </div>

          <section className="seller-profile-section">
            <button
              type="button"
              className={isSellerExpanded ? "seller-profile-card expanded" : "seller-profile-card"}
              onClick={() => setIsSellerExpanded((current) => !current)}
              aria-expanded={isSellerExpanded}
            >
              <div className="seller-profile-header">
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
              <div className="seller-profile-meta">
                <div>
                  <strong>{sellerProfile.rating}</strong>
                  <span>Seller rating</span>
                </div>
                <div>
                  <strong>{sellerProfile.joined}</strong>
                  <span>Profile note</span>
                </div>
                <div>
                  <strong>{sellerProfile.listings}</strong>
                  <span>Marketplace activity</span>
                </div>
              </div>
              <span className="seller-profile-link">
                {isSellerExpanded ? "Hide seller details" : "View seller details"}
              </span>
            </button>

            {isSellerExpanded ? (
              <div className="seller-expanded-panel">
                <div className="seller-stats-grid">
                  <div className="seller-stat-card">
                    <strong>{sellerProfile.activeCount}</strong>
                    <span>Active listings</span>
                  </div>
                  <div className="seller-stat-card">
                    <strong>{sellerProfile.soldCount}</strong>
                    <span>Items sold</span>
                  </div>
                  <div className="seller-stat-card">
                    <strong>{sellerProfile.responseRate}</strong>
                    <span>Response rate</span>
                  </div>
                </div>

                <div className="seller-listings-preview">
                  <div className="related-items-heading">
                    <span className="section-label">Seller activity</span>
                    <h3>More from {product.seller.name}</h3>
                  </div>
                  <div className="seller-mini-list">
                    {sellerListings.slice(0, 3).map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className={
                          item.id === product.id
                            ? "seller-mini-card active"
                            : "seller-mini-card"
                        }
                        onClick={() => onSelectRelatedProduct(item)}
                      >
                        <img src={item.image} alt={item.title} className="seller-mini-image" />
                        <div className="seller-mini-copy">
                          <strong>{item.title}</strong>
                          <span>
                            {item.listingState === "active"
                              ? `KES ${item.price.toLocaleString()}`
                              : getListingStatusLabel(item.listingState)}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </section>

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
              onClick={() => onContactSeller(product)}
            >
              Contact seller
            </button>
            <button type="button" className="secondary-btn" onClick={handleShare}>
              Share listing
            </button>
          </div>
          {shareMessage ? <p className="share-feedback">{shareMessage}</p> : null}

          <section className="trust-actions-section">
            <div className="related-items-heading">
              <span className="section-label">Trust tools</span>
              <h3>Stay safe when meeting a seller</h3>
            </div>
            <div className="safety-tips-list">
              <div className="safety-tip-card">
                <strong>Meet in a public place</strong>
                <span>Choose visible campus spots like the main gate, library entrance, or cafeteria.</span>
              </div>
              <div className="safety-tip-card">
                <strong>Confirm the item first</strong>
                <span>Check the condition, accessories, and serial details before paying.</span>
              </div>
              <div className="safety-tip-card">
                <strong>Bring a friend if needed</strong>
                <span>For high-value deals, share your meetup plan and avoid isolated locations.</span>
              </div>
            </div>

            <div className="trust-action-buttons">
              <button
                type="button"
                className="secondary-btn"
                onClick={() => onReportListing(product)}
              >
                Report listing
              </button>
              <button
                type="button"
                className="danger-btn"
                onClick={() => onBlockSeller(product)}
              >
                Block user
              </button>
            </div>
          </section>

          {relatedProducts.length > 0 ? (
            <section className="related-items-section">
              <div className="related-items-heading">
                <span className="section-label">Related items</span>
                <h3>Similar picks nearby</h3>
              </div>
              <div className="related-items-grid">
                {relatedProducts.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="related-item-card"
                    onClick={() => onSelectRelatedProduct(item)}
                  >
                    <img src={item.image} alt={item.title} className="related-item-image" />
                    <div className="related-item-copy">
                      <strong>{item.title}</strong>
                      <span>KES {item.price.toLocaleString()}</span>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default ProductModal;
