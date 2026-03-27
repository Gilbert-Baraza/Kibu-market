function ProductCard({ product, isSaved, onSaveToggle, onViewDetails }) {
  const handleViewDetails = () => {
    onViewDetails(product);
  };

  return (
    <article
      className="product-card"
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
        <img
          src={product.image}
          alt={product.title}
          className="product-image"
          loading="lazy"
          decoding="async"
          sizes="(max-width: 767px) 100vw, (max-width: 1279px) 50vw, 25vw"
        />
        <button
          type="button"
          className={`save-button ${isSaved ? 'active' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            onSaveToggle(product.id);
          }}
          aria-label={isSaved ? "Remove from saved items" : "Save item"}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </button>
        <div className="product-category-badge">{product.category}</div>
      </div>
      
      <div className="product-content">
        <div className="product-header">
          <h3 className="product-title">{product.title}</h3>
          <span className="product-price">KES {product.price.toLocaleString()}</span>
        </div>
        
        <div className="product-meta">
          <span className="product-location">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            {product.location}
          </span>
        </div>
        
        <p className="product-description">{product.description}</p>
        
        <div className="product-footer">
          <button
            type="button"
            className="view-details-btn"
            onClick={(event) => {
              event.stopPropagation();
              handleViewDetails();
            }}
          >
            View Details
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"/>
              <polyline points="12 5 19 12 12 19"/>
            </svg>
          </button>
        </div>
      </div>
    </article>
  );
}

export default ProductCard;
