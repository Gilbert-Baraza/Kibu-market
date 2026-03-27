function Navbar({ onHomeClick, onSellClick, onLoginClick, savedCount = 0 }) {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <button type="button" className="logo" onClick={onHomeClick}>
          <div className="logo-icon">
            <img src="/Kibu logo.png" alt="Kibu Market logo" className="brand-logo" />
          </div>
          <div className="logo-text">
            <span className="logo-name">KIBU MARKET</span>
            <span className="logo-tagline">Campus Marketplace</span>
          </div>
        </button>

        <div className="nav-actions">
          <button type="button" className="nav-link" onClick={onHomeClick}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            <span>Home</span>
          </button>
          
          <button type="button" className="nav-link" onClick={onLoginClick}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            <span>Login</span>
          </button>

          <button type="button" className="cta-button" onClick={onSellClick}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            <span>Sell Now</span>
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
