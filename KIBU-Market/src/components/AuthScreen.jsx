import { useState } from "react";

const loginState = {
  email: "",
  password: "",
};

const signupState = {
  name: "",
  email: "",
  phone: "",
  password: "",
};

function AuthScreen({ mode, onModeChange, onBack }) {
  const [loginForm, setLoginForm] = useState(loginState);
  const [signupForm, setSignupForm] = useState(signupState);
  const [message, setMessage] = useState("");

  const isLogin = mode === "login";

  const handleLoginChange = (event) => {
    const { name, value } = event.target;
    setLoginForm((current) => ({ ...current, [name]: value }));
  };

  const handleSignupChange = (event) => {
    const { name, value } = event.target;
    setSignupForm((current) => ({ ...current, [name]: value }));
  };

  const handleLoginSubmit = (event) => {
    event.preventDefault();
    setMessage(`Welcome back, ${loginForm.email}. Your account is ready.`);
    setLoginForm(loginState);
  };

  const handleSignupSubmit = (event) => {
    event.preventDefault();
    setMessage(`Account created for ${signupForm.name}. You can now start selling.`);
    setSignupForm(signupState);
  };

  return (
    <section className="auth-screen">
      <div className="auth-shell">
        <div className="auth-panel auth-copy">
          <span className="section-label">Account access</span>
          <h1>{isLogin ? "Welcome back to Kibu Market" : "Create your student marketplace account"}</h1>
          <p>
            {isLogin
              ? "Log in to manage your listings, saved items, and campus chats in one place."
              : "Sign up to post items, chat with buyers, and keep track of everything you sell around campus."}
          </p>

          <div className="auth-highlights">
            <div>
              <strong>Quick listing control</strong>
              <span>Edit posts, prices, and pickup points anytime.</span>
            </div>
            <div>
              <strong>Buyer chats</strong>
              <span>Keep every product conversation organized and easy to find.</span>
            </div>
            <div>
              <strong>Student-first flow</strong>
              <span>Built for nearby handoffs, fast replies, and simple payments.</span>
            </div>
          </div>
        </div>

        <div className="auth-panel auth-form-panel">
          <div className="sell-page-actions auth-topbar">
            <button type="button" className="secondary-btn" onClick={onBack}>
              Back to marketplace
            </button>
          </div>

          <div className="auth-switcher" role="tablist" aria-label="Authentication mode">
            <button
              type="button"
              className={isLogin ? "filter-chip active" : "filter-chip"}
              onClick={() => onModeChange("login")}
            >
              Login
            </button>
            <button
              type="button"
              className={!isLogin ? "filter-chip active" : "filter-chip"}
              onClick={() => onModeChange("signup")}
            >
              Sign up
            </button>
          </div>

          {isLogin ? (
            <form className="auth-form" onSubmit={handleLoginSubmit}>
              <label className="form-field">
                <span>Email address</span>
                <input
                  required
                  type="email"
                  name="email"
                  value={loginForm.email}
                  onChange={handleLoginChange}
                  placeholder="name@studentmail.com"
                />
              </label>

              <label className="form-field">
                <span>Password</span>
                <input
                  required
                  type="password"
                  name="password"
                  value={loginForm.password}
                  onChange={handleLoginChange}
                  placeholder="Enter your password"
                />
              </label>

              <button type="submit" className="primary-btn auth-submit">
                Log in
              </button>
            </form>
          ) : (
            <form className="auth-form" onSubmit={handleSignupSubmit}>
              <label className="form-field">
                <span>Full name</span>
                <input
                  required
                  name="name"
                  value={signupForm.name}
                  onChange={handleSignupChange}
                  placeholder="Your full name"
                />
              </label>

              <label className="form-field">
                <span>Email address</span>
                <input
                  required
                  type="email"
                  name="email"
                  value={signupForm.email}
                  onChange={handleSignupChange}
                  placeholder="name@studentmail.com"
                />
              </label>

              <label className="form-field">
                <span>Phone number</span>
                <input
                  required
                  name="phone"
                  value={signupForm.phone}
                  onChange={handleSignupChange}
                  placeholder="07xx xxx xxx"
                />
              </label>

              <label className="form-field">
                <span>Password</span>
                <input
                  required
                  type="password"
                  name="password"
                  value={signupForm.password}
                  onChange={handleSignupChange}
                  placeholder="Create a password"
                />
              </label>

              <button type="submit" className="primary-btn auth-submit">
                Create account
              </button>
            </form>
          )}

          {message ? <p className="form-success">{message}</p> : null}
        </div>
      </div>
    </section>
  );
}

export default AuthScreen;
