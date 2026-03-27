import { useEffect, useMemo, useRef, useState } from "react";

function ProductModal({
  product,
  products,
  isSaved,
  onClose,
  onSaveToggle,
  onContactSeller,
  onSelectRelatedProduct,
}) {
  const modalRef = useRef(null);
  const [activeImage, setActiveImage] = useState(product.image);
  const [shareMessage, setShareMessage] = useState("");

  const galleryImages = useMemo(
    () => (product.gallery?.length ? product.gallery : [product.image]),
    [product],
  );
  const sellerProfile = {
    rating: product.seller.rating ?? "4.8",
    joined: product.seller.joined ?? "Campus seller",
    listings: product.seller.listings ?? "12 active listings",
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
              <span>Available right now</span>
            </div>
          </div>

          <section className="seller-profile-card">
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
