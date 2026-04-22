import { useState } from "react";
import SmartImage from "./SmartImage";

function getUserInitials(name) {
  const parts = String(name ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) {
    return "KM";
  }

  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("");
}

function Navbar({
  onHomeClick,
  onMyListingsClick,
  onProfileClick,
  onSignInClick,
  onSellClick,
  onLogoutClick,
  onMessagesClick,
  currentUser,
  messageCount = 0,
  className = "",
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleNavAction = (callback) => {
    setIsMobileMenuOpen(false);
    callback();
  };

  const userInitials = getUserInitials(currentUser?.name);

  return (
    <nav className={className ? `navbar ${className}` : "navbar"}>
      <div className="navbar-container">
        <div className="navbar-brand-group">
          <button
            type="button"
            className="logo"
            onClick={() => handleNavAction(onHomeClick)}
          >
            <div className="logo-icon">
              <SmartImage src="/Kibu logo.png" alt="Kibu Market logo" className="brand-logo" loading="eager" />
            </div>
            <div className="logo-text">
              <span className="logo-name">KIBU MARKET</span>
              <span className="logo-tagline">Campus Marketplace</span>
            </div>
          </button>

          <button
            type="button"
            className="nav-link nav-home-link"
            onClick={() => handleNavAction(onHomeClick)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            <span>Home</span>
          </button>
        </div>

        <button
          type="button"
          className={isMobileMenuOpen ? "mobile-menu-toggle active" : "mobile-menu-toggle"}
          onClick={() => setIsMobileMenuOpen((current) => !current)}
          aria-label="Toggle navigation menu"
          aria-expanded={isMobileMenuOpen}
        >
          <span />
          <span />
          <span />
        </button>

        <div className={isMobileMenuOpen ? "nav-actions mobile-open" : "nav-actions"}>
          <button
            type="button"
            className="nav-link nav-mobile-only"
            onClick={() => handleNavAction(onHomeClick)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            <span>Home</span>
          </button>

          <button
            type="button"
            className="nav-link nav-link-icon"
            onClick={() => handleNavAction(onMessagesClick)}
          >
            <span className="nav-icon-wrap">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              {messageCount > 0 ? (
                <span className="nav-badge">{messageCount}</span>
              ) : null}
            </span>
            <span className="nav-link-copy">
              <span>Messages</span>
            </span>
          </button>

          {currentUser ? (
            <button
              type="button"
              className="nav-link"
              onClick={() => handleNavAction(onMyListingsClick)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 11l3 3L22 4" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
              <span>My Listings</span>
            </button>
          ) : null}

          {currentUser ? (
            <button
              type="button"
              className="nav-link nav-mobile-only"
              onClick={() => handleNavAction(onProfileClick)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              <span>Profile</span>
            </button>
          ) : null}

          <button
            type="button"
            className="cta-button"
            onClick={() => handleNavAction(onSellClick)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            <span>Sell Now</span>
          </button>

          {currentUser ? (
            <button
              type="button"
              className="nav-user-chip"
              aria-label={`Open profile for ${currentUser.name}`}
              onClick={() => handleNavAction(onProfileClick)}
            >
              <span className="nav-user-avatar">{userInitials}</span>
              <span className="nav-user-copy">
                <strong>{currentUser.name}</strong>
                <small>Student account</small>
              </span>
            </button>
          ) : (
            <button
              type="button"
              className="nav-user-chip nav-signin-chip"
              onClick={() => handleNavAction(onSignInClick)}
            >
              <span className="nav-user-avatar">IN</span>
              <span className="nav-user-copy">
                <strong>Sign In</strong>
                <small>Access messages and selling</small>
              </span>
            </button>
          )}

          {currentUser ? (
            <button
              type="button"
              className="nav-link nav-link-logout"
              onClick={() => handleNavAction(onLogoutClick)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              <span>Logout</span>
            </button>
          ) : null}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
