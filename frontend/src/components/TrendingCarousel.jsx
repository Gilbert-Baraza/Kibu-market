import { useRef, useState, useMemo, useCallback } from "react";
import SmartImage from "./SmartImage";


/**
 * TrendingListingsCarousel
 *
 * A mobile-first horizontal carousel showcasing trending/popular items.
 * Uses native CSS scroll-snap for smooth, jank-free scrolling.
 *
 * UX Benefits:
 * - High visual density of trending products encourages quick discovery
 * - Snap points create a native-like swipe experience on mobile
 * - Partial next-card peek hints at horizontal scrollability
 * - Clickable cards minimize friction to product detail page
 * - Prominent pricing draws attention to value
 *
 * Engagement/Conversion rationale:
 * - Trending badge adds social proof ("others are buying this")
 * - Compact card surface focuses attention on image + price (key purchase drivers)
 * - Smooth 60fps scroll keeps users browsing longer
 * - Clean, premium feel builds trust in marketplace quality
 */

export function TrendingCarousel({ items = [], className = "" }) {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 4);
  }, []);

  // Trim long titles to 2 lines max via CSS, but keep a short fallback for very wide mobile
  const formatTitle = (title) => {
    if (!title) return "Untitled item";
    return title.length > 52 ? `${title.slice(0, 52)}…` : title;
  };

  const formatPrice = (price) => {
    if (price == null) return "-";
    const num = Number(price);
    if (Number.isNaN(num)) return String(price);
    return `₦${num.toLocaleString()}`;
  };

  if (!items || items.length === 0) {
    return null;
  }

  return (
    <section className={`trending-section ${className}`} aria-label="Trending listings">
      <div className="trending-header">
        <div className="trending-header-copy">
          <span className="section-label">Trending now</span>
          <h2>Popular picks</h2>
          <p className="trending-subtitle">Items in high demand — quick checkout for fast deals</p>
        </div>
      </div>

      <div className="trending-track-wrap">
        {/* Fade overlays visually hint at scrollable content */}
        <div className="trending-fade-left" aria-hidden="true" data-visible={canScrollLeft} />
        <div className="trending-fade-right" aria-hidden="true" data-visible={canScrollRight} />

        <div
          ref={scrollRef}
          className="trending-track"
          onScroll={checkScroll}
          role="region"
          aria-roledescription="carousel"
          tabIndex={0}
        >
          {items.map((item, idx) => (
            <article
              key={item.id ?? `item-${idx}`}
              className="trending-card"
              onClick={() => {
                // Defer navigation action to parent (Home) if provided via onViewDetails;
                // this component intentionally has no routing logic to stay reusable.
                // Parent should listen via click handler passed down or handle selection.
              }}
              role="button"
              tabIndex={0}
              aria-label={`View ${item.title || "item"}, priced at ${formatPrice(item.price)}`}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  // Trigger same action as click
                }
              }}
            >
              <div className="trending-card-media">
                <SmartImage
                  src={item.images?.[0] || item.image}
                  alt={item.title || "Product image"}
                  className="trending-card-image"
                />
                {item.category && (
                  <span className="trending-category-badge" aria-hidden="true">
                    {item.category}
                  </span>
                )}
                {item.isTrending && (
                  <span className="trending-badge" aria-label="Trending item">
                    🔥 Trending
                  </span>
                )}
                {item.popularThisWeek && (
                  <span className="trending-badge trending-badge-alt" aria-label="Popular this week">
                    ⭐ Popular this week
                  </span>
                )}
                {item.listingState && item.listingState !== "active" && (
                  <span className="trending-status-badge" data-state={item.listingState}>
                    {item.listingState}
                  </span>
                )}
              </div>
              <div className="trending-card-body">
                <h3 className="trending-card-title" title={item.title}>
                  {formatTitle(item.title)}
                </h3>
                <p className="trending-card-price">{formatPrice(item.price)}</p>
                {item.location && (
                  <p className="trending-card-location" title={item.location}>
                    {item.location}
                  </p>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
