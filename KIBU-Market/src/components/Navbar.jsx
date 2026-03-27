function Navbar({ onHomeClick, onSellClick, onLoginClick }) {
  return (
    <nav className="navbar">
      <button type="button" className="logo logo-button" onClick={onHomeClick}>
        <span className="logo-mark">KM</span>
        <span className="logo-text">
          <strong>Kibu Market</strong>
          <small>Campus finds, close by</small>
        </span>
      </button>
      <div className="nav-links">
        <button type="button" className="nav-link-button" onClick={onHomeClick}>
          Home
        </button>
        <button type="button" className="nav-link-button" onClick={onSellClick}>
          Sell Item
        </button>
        <button type="button" className="nav-link-button" onClick={onLoginClick}>
          Login
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
