import { useEffect, useRef, useState } from "react";
import ProductCard from "./ProductCard";

function ProductList({
  products,
  savedItems,
  onSaveToggle,
  onViewDetails,
  onQuickChat,
}) {
  const listRef = useRef(null);
  const [columnCount, setColumnCount] = useState(1);
  const [visibleRows, setVisibleRows] = useState(3);

  useEffect(() => {
    const updateColumnCount = () => {
      if (!listRef.current) {
        return;
      }

      const computedStyle = window.getComputedStyle(listRef.current);
      const templateColumns = computedStyle.gridTemplateColumns
        .split(" ")
        .filter(Boolean);
      const nextColumnCount = Math.max(1, templateColumns.length);

      setColumnCount(nextColumnCount);
    };

    updateColumnCount();
    window.addEventListener("resize", updateColumnCount);

    return () => {
      window.removeEventListener("resize", updateColumnCount);
    };
  }, []);

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

  const visibleCount = columnCount * visibleRows;
  const visibleProducts = products.slice(0, visibleCount);
  const hasMoreProducts = products.length > visibleCount;
  const isCurrentChunkFull = visibleProducts.length === visibleCount;

  return (
    <>
      <div className="product-list" ref={listRef}>
        {visibleProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            isSaved={savedItems.includes(product.id)}
            onSaveToggle={onSaveToggle}
            onViewDetails={onViewDetails}
            onQuickChat={onQuickChat}
          />
        ))}
      </div>

      {hasMoreProducts && isCurrentChunkFull ? (
        <div className="load-more-wrap">
          <button
            type="button"
            className="secondary-btn load-more-btn"
            onClick={() => setVisibleRows((currentRows) => currentRows + 3)}
          >
            Load more items
          </button>
        </div>
      ) : null}
    </>
  );
}

export default ProductList;
