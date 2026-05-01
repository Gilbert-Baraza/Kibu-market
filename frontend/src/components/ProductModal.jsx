import { useEffect, useMemo, useRef, useState } from "react";
import SmartImage from "./SmartImage";
import { buildGalleryVariants } from "../utils/imageVariants.js";
import SellerRatingBadge from "./SellerRatingBadge";
import RatingModal from "./RatingModal";
import { apiClient } from "../api/client";

function getRatingBlockedMessage(result) {
  if (typeof result?.message === "string" && result.message.trim()) {
    return result.message;
  }

  switch (result?.reason) {
    case "self":
      return "You cannot rate your own listing.";
    case "already_reviewed":
      return "You have already reviewed this seller for this listing.";
    case "no_conversation":
      return "You can rate a seller after chatting with them about this listing.";
    case "seller_not_found":
      return "This seller could not be found.";
    case "missing_ids":
      return "We could not confirm the seller or listing for this rating.";
    default:
      return "You cannot rate this seller right now.";
  }
}

function ProductModal({
  product,
  isSaved,
  currentUser,
  onClose,
  onSaveToggle,
  onContactSeller,
  onReviewCreated,
  onNotify,
}) {
  const modalRef = useRef(null);
  const [activeImage, setActiveImage] = useState(product.imageVariants?.detail ?? product.image);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const galleryImages = useMemo(() => {
    const images = product.gallery?.length ? product.gallery : [product.image];
    const variantList = product.galleryVariants?.length === images.length
      ? product.galleryVariants
      : buildGalleryVariants(images);

    return images.map((image, index) => ({
      original: image,
      variants: variantList[index],
      detail: variantList[index]?.detail ?? image,
      card: variantList[index]?.card ?? image,
    }));
  }, [product]);

  useEffect(() => {
    setActiveImage(product.imageVariants?.detail ?? product.image);
  }, [product]);

  const isSeller = currentUser?.id === product?.seller?.id;

  const handleRateSeller = async () => {
    const sellerId = product?.seller?.id;
    const listingId = product?.id;

    if (!sellerId || !listingId) {
      onNotify?.({
        type: "error",
        title: "Rating unavailable",
        message: "We could not confirm the seller or listing for this rating.",
      });
      return;
    }

    try {
      const result = await apiClient.canReview({
        sellerId,
        listingId,
      });
      if (result.canReview) {
        setShowRatingModal(true);
      } else {
        onNotify?.({
          type: "error",
          title: "Unable to rate seller",
          message: getRatingBlockedMessage(result),
        });
      }
    } catch (error) {
      onNotify?.({
        type: "error",
        title: "Rating unavailable",
        message:
          error instanceof Error
            ? error.message
            : "We could not check whether you can rate this seller right now.",
      });
    }
  };

  const handleSubmitReview = async ({ rating, comment }) => {
    setIsSubmittingReview(true);
    try {
      const review = await apiClient.createReview({
        sellerId: product.seller.id,
        listingId: product.id,
        rating,
        comment,
      });

      setShowRatingModal(false);
      onReviewCreated?.({ product, review });
      onNotify?.({
        type: "success",
        title: "Rating submitted",
        message: `Thanks for rating ${product.seller.name}.`,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "We could not submit your rating right now.";

      onNotify?.({
        type: "error",
        title: "Rating not submitted",
        message,
      });

      if (/already reviewed|cannot rate your own|chatting with them about this listing/i.test(message)) {
        setShowRatingModal(false);
      }
    } finally {
      setIsSubmittingReview(false);
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
          <SmartImage
            src={activeImage}
            alt={product.title}
            className="modal-image"
            loading="eager"
            decoding="async"
            sizes="(max-width: 767px) 100vw, 40vw"
          />
          {galleryImages.length > 1 ? (
            <div className="modal-gallery">
              {galleryImages.map((imageEntry, index) => (
                <button
                  key={`${product.id}-${index}`}
                  type="button"
                  className={
                    imageEntry.detail === activeImage
                      ? "modal-thumb active"
                      : "modal-thumb"
                  }
                  onClick={() => setActiveImage(imageEntry.detail)}
                >
                  <SmartImage
                    src={imageEntry.card}
                    alt={`${product.title} view ${index + 1}`}
                    loading="eager"
                  />
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

          <div className="modal-seller-info">
            <div className="seller-avatar">
              {product.seller.name
                .split(" ")
                .map((part) => part[0])
                .join("")
                .slice(0, 2)}
            </div>
            <div className="seller-details">
              <strong>{product.seller.name}</strong>
              {product.seller.rating?.count > 0 ? (
                <SellerRatingBadge
                  average={product.seller.rating.average}
                  count={product.seller.rating.count}
                  size="small"
                />
              ) : (
                <span className="no-reviews">No reviews yet</span>
              )}
            </div>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className={isSaved ? "secondary-btn modal-save active" : "secondary-btn modal-save"}
              onClick={() => onSaveToggle(product.id)}
            >
              {isSaved ? "Saved" : "Save"}
            </button>
            <button
              type="button"
              className="primary-btn"
              onClick={() => onContactSeller(product)}
            >
              Contact seller
            </button>
            {currentUser && !isSeller && product?.seller && (
              <button
                type="button"
                className="secondary-btn modal-rate"
                onClick={handleRateSeller}
              >
                Rate seller
              </button>
            )}
          </div>
        </div>
      </div>

      {showRatingModal && (
        <RatingModal
          sellerName={product.seller.name}
          listingTitle={product.title}
          onSubmit={handleSubmitReview}
          onClose={() => setShowRatingModal(false)}
          isLoading={isSubmittingReview}
        />
      )}
    </div>
  );
}

export default ProductModal;
