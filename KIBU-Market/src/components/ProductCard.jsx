function ProductCard({ product, isSaved, onSaveToggle, onViewDetails }) {
  return (
    <div className="product-card">
      <div className="product-image-wrap">
        <img src={product.image} alt={product.title} className="product-image" />
        <button
          type="button"
          className={isSaved ? "save-button active" : "save-button"}
          onClick={() => onSaveToggle(product.id)}
          aria-label={isSaved ? "Remove from saved items" : "Save item"}
        >
          {isSaved ? "Saved" : "Save"}
        </button>
      </div>
      <div className="product-info">
        <div className="product-topline">
          <span className="product-category">{product.category}</span>
          <p className="price">KES {product.price.toLocaleString()}</p>
        </div>
        <h3>{product.title}</h3>
        <p className="product-location">{product.location}</p>
        <p className="product-description">{product.description}</p>
        <button
          type="button"
          className="card-link"
          onClick={() => onViewDetails(product)}
        >
          View details
        </button>
      </div>
    </div>
  );
}

export default ProductCard;
