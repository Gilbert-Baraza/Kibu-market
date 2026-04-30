import { useRef, useState, useEffect, useCallback } from "react";
import SmartImage from "./SmartImage";

/**
 * CompactTrendingCarousel
 *
 * Mobile-first, compact horizontal carousel with auto-scroll.
 * Optimized for small screens: landscape-style cards (wider than tall),
 * minimal vertical space, smooth 60fps scroll.
 *
 * UX improvements:
 * - Reduced height (~190px) increases viewport density → more listings visible
 * - Auto-scroll (3.5s interval) passively surfaces items without user effort
 * - Scroll-snap + swipe gestures feel native on touch devices
 * - Clean card surface focuses on image + price (key conversion drivers)
 * - Partial next-card peek hints at horizontal scrollability
 * - Pauses on interaction → respects user intent
 */

export function TrendingCarousel({ items = [], className = "" }) {
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

  // Auto-scroll: advances by one card width every 3.5s
  const startAutoScroll = useCallback(() => {
    stopAutoScroll();
    autoScrollInterval.current = setInterval(() => {
      if (!scrollRef.current || isPaused) return;
      const cardWidth = 320; // approx width + gap
      const el = scrollRef.current;
      const nextScroll = el.scrollLeft + cardWidth;
      const maxScroll = el.scrollWidth - el.clientWidth;
      if (nextScroll >= maxScroll) {
        // Loop back to start smoothly
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

  // Pause on interaction
  const handleInteractionStart = useCallback(() => {
    setIsPaused(true);
    stopAutoScroll();
  }, [stopAutoScroll]);

  const handleInteractionEnd = useCallback(() => {
    setIsPaused(false);
    // Resume after brief delay
    setTimeout(() => {
      startAutoScroll();
    }, 4000);
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
    return `₦${num.toLocaleString()}`;
  };

  return (
    <section className={`compact-trending ${className}`} aria-label="Trending listings">
      {/* Fade overlays - subtle hints */}
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
          >
            {/* Image container - fixed aspect ratio 4:3 */}
            <div className="compact-media">
              <SmartImage
                src={item.images?.[0] || item.image}
                alt={item.title || "Product"}
                className="compact-image"
              />
              {item.isTrending && (
                <span className="compact-badge" aria-label="Trending">
                  🔥
                </span>
              )}
              {item.popularThisWeek && (
                <span className="compact-badge compact-badge-alt" aria-label="Popular">
                  ⭐
                </span>
              )}
            </div>

            {/* Content */}
            <div className="compact-body">
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
          </article>
        ))}
      </div>
    </section>
  );
}
