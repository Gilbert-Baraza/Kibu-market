import ProductCard from "./ProductCard";

function ProductList({ products, savedItems, onSaveToggle, onViewDetails }) {
  if (products.length === 0) {
    return (
      <div className="empty-state">
        <span className="section-label">No matches</span>
        <h3>Nothing fits that search yet.</h3>
        <p>
          Try a different keyword or switch categories to explore more campus
          listings.
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
