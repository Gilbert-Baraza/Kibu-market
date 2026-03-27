import ProductCard from "./ProductCard";

function ProductList({ products, savedItems, onSaveToggle, onViewDetails }) {
  if (products.length === 0) {
    return (
      <div className="empty-state">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.3-4.3"/>
          <line x1="8" y1="11" x2="14" y2="11"/>
        </svg>
        <span className="section-label">No matches</span>
        <h3>Nothing fits that search yet.</h3>
        <p>
          Try a different keyword or switch categories to explore more campus listings.
        </p>
      </div>
    );
  }

  return (
    <div className="product-list">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          isSaved={savedItems.includes(product.id)}
          onSaveToggle={onSaveToggle}
          onViewDetails={onViewDetails}
        />
      ))}
    </div>
  );
}

export default ProductList;
