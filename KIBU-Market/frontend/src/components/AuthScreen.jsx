import { useEffect, useState } from "react";
import {
  validateEmail,
  validatePhone,
  validateRequiredText,
} from "../utils/validation";

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

function AuthScreen({ mode, onModeChange, onBack, onLogin, onSignup }) {
  const [loginForm, setLoginForm] = useState(loginState);
  const [signupForm, setSignupForm] = useState(signupState);
  const [errors, setErrors] = useState({});
  const [submitMessage, setSubmitMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const isLogin = mode === "login";

  useEffect(() => {
    setErrors({});
    setSubmitMessage("");
    setShowPassword(false);
  }, [mode]);

  const validateLoginForm = (values) => ({
    email: validateEmail(values.email),
    password: validateRequiredText(values.password, "Password", 6),
  });

  const validateSignupForm = (values) => ({
    name: validateRequiredText(values.name, "Full name", 2),
    email: validateEmail(values.email),
    phone: validatePhone(values.phone),
    password: validateRequiredText(values.password, "Password", 6),
  });

  const handleLoginChange = (event) => {
    const { name, value } = event.target;
    setLoginForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
    setSubmitMessage("");
  };

  const handleSignupChange = (event) => {
    const { name, value } = event.target;
    setSignupForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
    setSubmitMessage("");
  };

  const handleLoginSubmit = (event) => {
    event.preventDefault();
    const nextErrors = validateLoginForm(loginForm);
    setErrors(nextErrors);
    setSubmitMessage("");

    if (Object.values(nextErrors).some(Boolean)) {
      return;
    }

    const result = onLogin?.(loginForm);

    if (result?.ok) {
      setLoginForm(loginState);
      return;
    }

    setSubmitMessage(result?.message ?? "We could not sign you in with those details.");
  };

  const handleSignupSubmit = (event) => {
    event.preventDefault();
    const nextErrors = validateSignupForm(signupForm);
    setErrors(nextErrors);
    setSubmitMessage("");

    if (Object.values(nextErrors).some(Boolean)) {
      return;
    }

    const result = onSignup?.(signupForm);

    if (result?.ok) {
      setSignupForm(signupState);
      return;
    }

    setSubmitMessage(result?.message ?? "We could not create that account.");
  };

  return (
    <section className="auth-screen">
      <div className="auth-container">
        <div className="auth-visual">
          <div className="auth-visual-content">
            <div className="auth-logo">
              <img src="/Kibu logo.png" alt="Kibu Market logo" className="brand-logo auth-brand-logo" />
            </div>
            <h2 className="auth-visual-title">
              {isLogin ? "Good to see you again" : "Join thousands of campus sellers"}
            </h2>
            <p className="auth-visual-description">
              {isLogin 
                ? "Access your dashboard and connect with other buyers and sellers across campus."
                : "Start selling items you no longer need and find amazing deals from fellow students."}
            </p>

            <div className="auth-features">
              <FeatureItem 
                icon={
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    <polyline points="9 12 11 14 15 10"/>
                  </svg>
                }
                title="Verified Student Accounts"
                description="Safe and trusted marketplace"
              />
              <FeatureItem 
                icon={
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                }
                title="Direct Campus Chat"
                description="Easy communication with buyers and sellers"
              />
              <FeatureItem 
                icon={
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="1" x2="12" y2="23"/>
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                  </svg>
                }
                title="Free to List"
                description="No fees, just great deals"
              />
            </div>

            <div className="auth-stats">
              <div className="auth-stat">
                <span className="auth-stat-value">500+</span>
                <span className="auth-stat-label">Active Students</span>
              </div>
              <div className="auth-stat-divider"></div>
              <div className="auth-stat">
                <span className="auth-stat-value">200+</span>
                <span className="auth-stat-label">Weekly Sales</span>
              </div>
              <div className="auth-stat-divider"></div>
              <div className="auth-stat">
                <span className="auth-stat-value">100%</span>
                <span className="auth-stat-label">Student Owned</span>
              </div>
            </div>
          </div>
        </div>

        <div className="auth-form-section">
          <button type="button" className="back-button" onClick={onBack}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"/>
              <polyline points="12 19 5 12 12 5"/>
            </svg>
            Back to marketplace
          </button>

          <div className="auth-form-container">
            <div className="auth-header">
              <h1 className="auth-title">
                {isLogin ? "Welcome back" : "Create account"}
              </h1>
              <p className="auth-subtitle">
                {isLogin 
                  ? "Sign in to your student marketplace account"
                  : "Join Kibu Market and start buying & selling on campus"}
              </p>
            </div>

            <div className="auth-tabs" role="tablist" aria-label="Authentication mode">
              <button
                type="button"
                className={`auth-tab ${isLogin ? 'active' : ''}`}
                onClick={() => onModeChange("login")}
                role="tab"
                aria-selected={isLogin}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                  <polyline points="10 17 15 12 10 7"/>
                  <line x1="15" y1="12" x2="3" y2="12"/>
                </svg>
                Login
              </button>
              <button
                type="button"
                className={`auth-tab ${!isLogin ? 'active' : ''}`}
                onClick={() => onModeChange("signup")}
                role="tab"
                aria-selected={!isLogin}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="8.5" cy="7" r="4"/>
                  <line x1="20" y1="8" x2="20" y2="14"/>
                  <line x1="23" y1="11" x2="17" y2="11"/>
                </svg>
                Sign up
              </button>
            </div>

            {isLogin ? (
              <form className="auth-form" onSubmit={handleLoginSubmit}>
                <FormField 
                  label="Email address" 
                  name="email" 
                  type="email" 
                  value={loginForm.email}
                  onChange={handleLoginChange}
                  placeholder="name@studentmail.com"
                  error={errors.email}
                  icon={
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                      <polyline points="22,6 12,13 2,6"/>
                    </svg>
                  }
                />

                <FormField 
                  label="Password" 
                  name="password" 
                  type={showPassword ? "text" : "password"}
                  value={loginForm.password}
                  onChange={handleLoginChange}
                  placeholder="Enter your password"
                  error={errors.password}
                  icon={
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  }
                  rightIcon={
                    <button 
                      type="button" 
                      className="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                          <line x1="1" y1="1" x2="23" y2="23"/>
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                      )}
                    </button>
                  }
                />

                <button type="submit" className="auth-submit-btn">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                    <polyline points="10 17 15 12 10 7"/>
                    <line x1="15" y1="12" x2="3" y2="12"/>
                  </svg>
                  Sign in
                </button>

                <button type="button" className="forgot-password">
                  Forgot password?
                </button>
              </form>
            ) : (
              <form className="auth-form" onSubmit={handleSignupSubmit}>
                <FormField 
                  label="Full name" 
                  name="name" 
                  value={signupForm.name}
                  onChange={handleSignupChange}
                  placeholder="Your full name"
                  error={errors.name}
                  icon={
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                  }
                />

                <FormField 
                  label="Email address" 
                  name="email" 
                  type="email"
                  value={signupForm.email}
                  onChange={handleSignupChange}
                  placeholder="name@studentmail.com"
                  error={errors.email}
                  icon={
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                      <polyline points="22,6 12,13 2,6"/>
                    </svg>
                  }
                />

                <FormField 
                  label="Phone number" 
                  name="phone" 
                  value={signupForm.phone}
                  onChange={handleSignupChange}
                  placeholder="07xx xxx xxx"
                  error={errors.phone}
                  icon={
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                    </svg>
                  }
                />

                <FormField 
                  label="Password" 
                  name="password" 
                  type={showPassword ? "text" : "password"}
                  value={signupForm.password}
                  onChange={handleSignupChange}
                  placeholder="Create a strong password"
                  error={errors.password}
                  icon={
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  }
                  rightIcon={
                    <button 
                      type="button" 
                      className="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                          <line x1="1" y1="1" x2="23" y2="23"/>
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                      )}
                    </button>
                  }
                />

                <button type="submit" className="auth-submit-btn">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="8.5" cy="7" r="4"/>
                    <line x1="20" y1="8" x2="20" y2="14"/>
                    <line x1="23" y1="11" x2="17" y2="11"/>
                  </svg>
                  Create account
                </button>

                <p className="terms-text">
                  By signing up, you agree to our <a href="#terms">Terms of Service</a> and <a href="#privacy">Privacy Policy</a>
                </p>
              </form>
            )}

            {submitMessage && (
              <div className="auth-error">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {submitMessage}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function FeatureItem({ icon, title, description }) {
  return (
    <div className="auth-feature">
      <div className="auth-feature-icon">{icon}</div>
      <div className="auth-feature-content">
        <h4 className="auth-feature-title">{title}</h4>
        <p className="auth-feature-description">{description}</p>
      </div>
    </div>
  );
}

function FormField({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
  icon,
  rightIcon,
  error,
}) {
  return (
    <div className="auth-form-field">
      <label htmlFor={name} className="auth-form-label">{label}</label>
      <div className="auth-input-wrapper">
        {icon && <div className="auth-input-icon">{icon}</div>}
        <input
          id={name}
          required
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`auth-input ${icon ? 'has-icon' : ''} ${error ? "auth-input-error" : ""}`}
          aria-invalid={Boolean(error)}
        />
        {rightIcon && <div className="auth-input-right">{rightIcon}</div>}
      </div>
      {error ? <small className="auth-field-error">{error}</small> : null}
    </div>
  );
}

export default AuthScreen;
