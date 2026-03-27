function Hero({ onSellClick, onBrowseClick }) {
  return (
    <section className="hero">
      <div className="hero-content">
        <div className="hero-badge">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
          <span>#1 Campus Marketplace</span>
        </div>
        
        <h1 className="hero-title">
          Buy & Sell
          <br />
          <span className="hero-title-accent">Around Campus</span>
        </h1>
        
        <p className="hero-description">
          The easiest way to find student deals. Phones, books, furniture, and more - all from verified students on your campus.
        </p>

      
      </div>

    </section>
  );
}

export default Hero;
