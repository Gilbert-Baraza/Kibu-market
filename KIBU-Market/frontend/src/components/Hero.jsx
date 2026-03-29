import { useEffect, useRef, useState } from "react";

function formatPrice(value) {
  return `KES ${Number(value ?? 0).toLocaleString()}`;
}

function Hero({
  products = [],
  onBrowseClick,
  onSellClick,
}) {
  const heroProducts = products.slice(0, 3);
  const activeSellers = new Set(
    products.map((product) => String(product.seller?.id ?? "")).filter(Boolean),
  ).size;
  const carouselRef = useRef(null);
  const isProgrammaticScrollRef = useRef(false);
  const scrollReleaseRef = useRef(0);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined" || heroProducts.length <= 1) {
      return undefined;
    }

    const mediaQuery = window.matchMedia("(max-width: 720px)");
    let intervalId = 0;

    const restartAutoplay = () => {
      window.clearInterval(intervalId);

      if (!mediaQuery.matches) {
        return;
      }

      intervalId = window.setInterval(() => {
        setActiveIndex((currentIndex) => (currentIndex + 1) % heroProducts.length);
      }, 3600);
    };

    const handleMediaChange = () => {
      restartAutoplay();
    };

    restartAutoplay();
    mediaQuery.addEventListener("change", handleMediaChange);

    return () => {
      window.clearInterval(intervalId);
      mediaQuery.removeEventListener("change", handleMediaChange);
    };
  }, [heroProducts.length]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const container = carouselRef.current;
    const mediaQuery = window.matchMedia("(max-width: 720px)");

    if (!container || !mediaQuery.matches) {
      return;
    }

    const targetCard = container.children[activeIndex];
    if (targetCard instanceof HTMLElement) {
      window.clearTimeout(scrollReleaseRef.current);
      isProgrammaticScrollRef.current = true;

      const nextLeft = targetCard.offsetLeft;

      container.scrollTo({
        left: nextLeft,
        behavior: "smooth",
      });

      scrollReleaseRef.current = window.setTimeout(() => {
        isProgrammaticScrollRef.current = false;
      }, 450);
    }

    return () => {
      window.clearTimeout(scrollReleaseRef.current);
    };
  }, [activeIndex]);

  const moveCarousel = (direction) => {
    if (heroProducts.length <= 1) {
      return;
    }

    setActiveIndex((currentIndex) => {
      if (direction === "previous") {
        return (currentIndex - 1 + heroProducts.length) % heroProducts.length;
      }

      return (currentIndex + 1) % heroProducts.length;
    });
  };

  const handleCarouselScroll = () => {
    if (typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia("(max-width: 720px)");
    const container = carouselRef.current;

    if (!mediaQuery.matches || !container) {
      return;
    }

    if (isProgrammaticScrollRef.current) {
      return;
    }

    const children = Array.from(container.children);
    if (children.length === 0) {
      return;
    }

    const containerCenter = container.scrollLeft + container.clientWidth / 2;
    let closestIndex = 0;
    let closestDistance = Number.POSITIVE_INFINITY;

    children.forEach((child, index) => {
      const cardCenter = child.offsetLeft + child.clientWidth / 2;
      const distance = Math.abs(cardCenter - containerCenter);

      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    setActiveIndex(closestIndex);
  };

  return (
    <section className="hero hero-marketplace">
      <div className="hero-content">
        <div className="hero-badge">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          <span>Campus marketplace, reimagined</span>
        </div>

        <h1 className="hero-title">
          Buy & Sell
          <br />
          <span className="hero-title-accent">Around Campus</span>
        </h1>

        <p className="hero-description">
          Discover trusted student deals on phones, books, hostel essentials, and furniture.
          List something in minutes or message a seller right away.
        </p>

        <div className="hero-actions">
          <button type="button" className="primary-btn" onClick={onBrowseClick}>
            Browse Items
          </button>
          <button type="button" className="secondary-btn" onClick={onSellClick}>
            Sell an Item
          </button>
        </div>

        <div className="hero-stats">
          <div className="stat">
            <span className="stat-value">{products.length}+</span>
            <span className="stat-label">items listed</span>
          </div>
          <div className="stat-divider" />
          <div className="stat">
            <span className="stat-value">{activeSellers}+</span>
            <span className="stat-label">active sellers</span>
          </div>
          <div className="stat-divider" />
          <div className="stat">
            <span className="stat-value">24/7</span>
            <span className="stat-label">student chat</span>
          </div>
        </div>
      </div>

      <div className="hero-visual hero-market-preview" aria-label="Trending campus listings">
        <div className="hero-preview-shell">
          <div className="hero-preview-header">
            <div>
              <span className="section-label">Trending this week</span>
              <h3>Popular around campus</h3>
            </div>
            <div className="hero-preview-toolbar">
              <span className="hero-preview-chip">Fast replies</span>
              {heroProducts.length > 1 ? (
                <div className="hero-preview-carousel-controls" aria-label="Hero product carousel controls">
                  <button
                    type="button"
                    className="hero-preview-control"
                    onClick={() => moveCarousel("previous")}
                    aria-label="Previous hero product"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    className="hero-preview-control"
                    onClick={() => moveCarousel("next")}
                    aria-label="Next hero product"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                </div>
              ) : null}
            </div>
          </div>

          <div
            ref={carouselRef}
            className="hero-preview-list"
            onScroll={handleCarouselScroll}
          >
            {heroProducts.map((product) => (
              <article key={product.id} className="hero-preview-card">
                <img src={product.image} alt={product.title} loading="lazy" decoding="async" />
                <div className="hero-preview-copy">
                  <span>{product.category}</span>
                  <strong>{product.title}</strong>
                  <p>{product.location}</p>
                </div>
                <div className="hero-preview-meta">
                  <strong>{formatPrice(product.price)}</strong>
                  <small>{product.listingState === "sold" ? "Sold" : "Active"}</small>
                </div>
              </article>
            ))}
          </div>

          {heroProducts.length > 1 ? (
            <div className="hero-preview-dots" aria-label="Hero product carousel position">
              {heroProducts.map((product, index) => (
                <button
                  key={`hero-dot-${product.id}`}
                  type="button"
                  className={index === activeIndex ? "hero-preview-dot active" : "hero-preview-dot"}
                  onClick={() => setActiveIndex(index)}
                  aria-label={`Show hero product ${index + 1}`}
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export default Hero;
