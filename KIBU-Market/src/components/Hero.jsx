import heroImage from "../assets/hero.png";

function Hero({ savedCount, onSellClick, onBrowseClick }) {
  return (
    <section className="hero">
      <div className="hero-copy">
        <span className="eyebrow">Student marketplace</span>
        <h1>Buy and sell around campus without the hassle.</h1>
        <p>
          Discover affordable essentials from fellow students, from study gear
          to room upgrades, all posted nearby.
        </p>
        <div className="hero-actions">
          <button type="button" className="primary-btn" onClick={onBrowseClick}>
            Browse Items
          </button>
          <button type="button" className="secondary-btn" onClick={onSellClick}>
            Start Selling
          </button>
        </div>
        <div className="hero-stats">
          <div>
            <strong>200+</strong>
            <span>Weekly listings</span>
          </div>
          <div>
            <strong>24 hrs</strong>
            <span>Average response time</span>
          </div>
          <div>
            <strong>Nearby</strong>
            <span>Meetups around hostels</span>
          </div>
          <div>
            <strong>{savedCount}</strong>
            <span>Items saved for later</span>
          </div>
        </div>
      </div>

      <div className="hero-visual">
        <div className="hero-card">
          <img src={heroImage} alt="Students browsing marketplace listings" />
          <div className="hero-card-copy">
            <span>Trending this week</span>
            <strong>Laptops, calculators, sneakers</strong>
            <p>Popular picks moving fast across Kibabii hostels and nearby.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
