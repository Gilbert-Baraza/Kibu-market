import SmartImage from "./SmartImage";
import SellerRatingBadge from "./SellerRatingBadge";

function formatRelativeTime(value) {
  if (!value) {
    return "Just now";
  }

  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) {
    return "Recently";
  }

  const diffMs = Date.now() - timestamp;
  if (diffMs <= 0) {
    return "Just now";
  }

  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  if (diffMinutes < 1) {
    return "Just now";
  }

  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);

  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }

  return new Intl.DateTimeFormat("en-KE", { month: "short", day: "numeric" }).format(timestamp);
}

function formatPrice(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) {
    return "KES --";
  }

  return `KES ${amount.toLocaleString("en-KE")}`;
}

function ProductCard({
  product,
  isSaved,
  onSaveToggle,
  onViewDetails,
  onQuickChat,
}) {
  const handleViewDetails = () => {
    onViewDetails(product);
  };

  const handleQuickChat = (event) => {
    event.stopPropagation();
    onQuickChat?.(product);
  };

  const getListingStatusLabel = (listingState) => {
    switch (listingState) {
      case "sold":
        return "Sold";
      default:
        return "Available";
    }
  };

  return (
    <article
      className="product-card marketplace-card"
      onClick={handleViewDetails}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleViewDetails();
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={`View details for ${product.title}`}
    >
      <div className="product-image-container">
        <SmartImage
          src={product.imageVariants?.card ?? product.image}
          alt={product.title}
          className="product-image"
          loading="lazy"
          decoding="async"
          sizes="(max-width: 767px) 50vw, (max-width: 1279px) 50vw, 25vw"
        />
        <button
          type="button"
          className={`save-button ${isSaved ? "active" : ""}`}
          onClick={(event) => {
            event.stopPropagation();
            onSaveToggle(product.id);
          }}
          aria-label={isSaved ? "Remove from saved items" : "Save item"}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>
        <div className="product-category-badge">{product.category ?? "Listing"}</div>
        <div className={`product-state-badge ${product.listingState ?? "active"}`}>
          {getListingStatusLabel(product.listingState)}
        </div>
      </div>

      <div className="product-content">
        <p className="product-price">{formatPrice(product.price)}</p>

        <h3 className="product-title">{product.title}</h3>

        {product.seller?.rating?.count > 0 && (
          <SellerRatingBadge
            average={product.seller.rating.average ?? 0}
            count={product.seller.rating.count ?? 0}
            size="small"
          />
        )}

        <div className="product-card-topline">
          <span className="product-location">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span>{product.location ?? "Campus pickup"}</span>
          </span>
          <span className="product-posted-time">{formatRelativeTime(product.createdAt)}</span>
        </div>

        <div className="product-footer product-footer-actions">
          <button
            type="button"
            className="view-details-btn"
            onClick={(event) => {
              event.stopPropagation();
              handleViewDetails();
            }}
          >
            View Item
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </button>
          {onQuickChat ? (
            <button
              type="button"
              className="product-icon-action"
              onClick={handleQuickChat}
              aria-label={`Chat about ${product.title}`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export default ProductCard;
