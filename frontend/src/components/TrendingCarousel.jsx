import { useRef, useState, useEffect, useCallback } from "react";
import SmartImage from "./SmartImage";

export function TrendingCarousel({ items = [], className = "", onProductClick }) {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const autoScrollInterval = useRef(null);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 8);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 8);
  }, []);

  const startAutoScroll = useCallback(() => {
    stopAutoScroll();
    autoScrollInterval.current = setInterval(() => {
      if (!scrollRef.current || isPaused) return;
      const cardWidth = 320;
      const el = scrollRef.current;
      const nextScroll = el.scrollLeft + cardWidth;
      const maxScroll = el.scrollWidth - el.clientWidth;
      if (nextScroll >= maxScroll) {
        el.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        el.scrollBy({ left: cardWidth, behavior: "smooth" });
      }
    }, 3500);
  }, [isPaused]);

  const stopAutoScroll = useCallback(() => {
    if (autoScrollInterval.current) {
      clearInterval(autoScrollInterval.current);
      autoScrollInterval.current = null;
    }
  }, []);

  const handleInteractionStart = useCallback(() => {
    setIsPaused(true);
    stopAutoScroll();
  }, [stopAutoScroll]);

  const handleInteractionEnd = useCallback(() => {
    setIsPaused(false);
    setTimeout(() => startAutoScroll(), 4000);
  }, [startAutoScroll]);

  useEffect(() => {
    startAutoScroll();
    return () => stopAutoScroll();
  }, [startAutoScroll, stopAutoScroll]);

  if (!items || items.length === 0) {
    return null;
  }

  const formatTitle = (title) => {
    if (!title) return "";
    return title.length > 42 ? `${title.slice(0, 42)}…` : title;
  };

  const formatPrice = (price) => {
    if (price == null) return "";
    const num = Number(price);
    if (Number.isNaN(num)) return "";
    return `KES ${Math.round(num).toLocaleString()}`;
  };

  return (
    <section className={`compact-trending ${className}`} aria-label="Trending listings">
      <div className="trending-label-row">
        <span className="trending-label">🔥 Trending this week</span>
      </div>

      <div className="trending-fade-left" data-visible={canScrollLeft} aria-hidden="true" />
      <div className="trending-fade-right" data-visible={canScrollRight} aria-hidden="true" />

      <div
        ref={scrollRef}
        className="compact-track"
        onScroll={checkScroll}
        onTouchStart={handleInteractionStart}
        onMouseDown={handleInteractionStart}
        onTouchEnd={handleInteractionEnd}
        onMouseUp={handleInteractionEnd}
        onMouseLeave={handleInteractionEnd}
        role="region"
        aria-roledescription="carousel"
        tabIndex={0}
      >
        {items.map((item, idx) => (
          <article
            key={item.id ?? `item-${idx}`}
            className="compact-card"
            role="group"
            aria-label={`${item.title || "Item"}, ${formatPrice(item.price)}`}
            onClick={() => onProductClick?.(item)}
            tabIndex={0}
          >
            <div className="compact-media">
              <SmartImage
                src={item.images?.[0] || item.image}
                alt={item.title || "Product"}
                className="compact-image"
              />
              {(item.isTrending || item.popularThisWeek) && (
                <div className="compact-content">
                  <h3 className="compact-title" title={item.title}>
                    {formatTitle(item.title)}
                  </h3>
                  <p className="compact-price">{formatPrice(item.price)}</p>
                  {item.location && (
                    <p className="compact-location" title={item.location}>
                      {item.location}
                    </p>
                  )}
                </div>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
