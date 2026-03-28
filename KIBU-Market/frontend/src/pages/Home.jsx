import { Suspense, lazy, startTransition, useDeferredValue, useEffect, useRef, useState } from "react";
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import SearchBar from "../components/SearchBar";
import ProductList from "../components/ProductList";
import initialProducts from "../data/products";
import MessagesScreen from "../components/MessagesScreen";
import MyListingsScreen from "../components/MyListingsScreen";
import UserProfileScreen from "../components/UserProfileScreen";
import ToastViewport from "../components/ToastViewport";

const ProductModal = lazy(() => import("../components/ProductModal"));
const SellItemForm = lazy(() => import("../components/SellItemForm"));
const AuthScreen = lazy(() => import("../components/AuthScreen"));

const SESSION_STORAGE_KEY = "kibu-market-session-user";
const USERS_STORAGE_KEY = "kibu-market-users";

const defaultAccount = {
  id: "campus-seller",
  name: "Campus Seller",
  email: "seller@kibu.ac.ke",
  phone: "0700000000",
  campus: "Kibabii University",
  bio: "Student seller sharing useful finds, study essentials, and room upgrades around campus.",
  password: "campus123",
};

function readStoredJson(key, fallbackValue) {
  try {
    const storedValue = window.localStorage.getItem(key);
    return storedValue ? JSON.parse(storedValue) : fallbackValue;
  } catch {
    return fallbackValue;
  }
}

function Home() {
  const [products, setProducts] = useState(initialProducts);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [sortBy, setSortBy] = useState("latest");
  const [savedItems, setSavedItems] = useState([]);
  const [blockedSellerIds, setBlockedSellerIds] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activePage, setActivePage] = useState("market");
  const [selectedMessageThreadId, setSelectedMessageThreadId] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [registeredUsers, setRegisteredUsers] = useState(() =>
    readStoredJson(USERS_STORAGE_KEY, [defaultAccount]),
  );
  const [currentUser, setCurrentUser] = useState(() =>
    readStoredJson(SESSION_STORAGE_KEY, null),
  );
  const listingsSectionRef = useRef(null);

  useEffect(() => {
    if (toasts.length === 0) {
      return undefined;
    }

    const timers = toasts.map((toast) =>
      window.setTimeout(() => {
        setToasts((currentToasts) => currentToasts.filter((item) => item.id !== toast.id));
      }, 3200),
    );

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [toasts]);

  useEffect(() => {
    window.localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(registeredUsers));
  }, [registeredUsers]);

  useEffect(() => {
    if (currentUser) {
      window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(currentUser));
      return;
    }

    window.localStorage.removeItem(SESSION_STORAGE_KEY);
  }, [currentUser]);

  const deferredQuery = useDeferredValue(query);
  const categories = ["All", ...new Set(products.map((product) => product.category))];

  const normalizedQuery = deferredQuery.trim().toLowerCase();
  let visibleProducts = products.filter((product) => {
    if (blockedSellerIds.includes(product.seller?.id)) {
      return false;
    }

    if ((product.listingState ?? "active") !== "active") {
      return false;
    }

    const matchesCategory =
      activeCategory === "All" || product.category === activeCategory;

    const matchesQuery =
      normalizedQuery.length === 0 ||
      [
        product.title,
        product.category,
        product.location,
        ...(product.tags ?? []),
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);

    return matchesCategory && matchesQuery;
  });

  if (sortBy === "price-low") {
    visibleProducts = [...visibleProducts].sort((a, b) => a.price - b.price);
  } else if (sortBy === "price-high") {
    visibleProducts = [...visibleProducts].sort((a, b) => b.price - a.price);
  } else if (sortBy === "title") {
    visibleProducts = [...visibleProducts].sort((a, b) =>
      a.title.localeCompare(b.title),
    );
  }

  const handleSearchChange = (nextValue) => {
    startTransition(() => {
      setQuery(nextValue);
    });
  };

  const handleSaveToggle = (productId) => {
    const product = products.find((item) => item.id === productId);
    const isSaved = savedItems.includes(productId);

    setSavedItems((currentItems) =>
      isSaved
        ? currentItems.filter((id) => id !== productId)
        : [...currentItems, productId],
    );

    if (product) {
      showToast({
        type: "success",
        title: isSaved ? "Removed from saved items" : "Saved item",
        message: isSaved
          ? `${product.title} was removed from your saved items.`
          : `${product.title} was added to your saved items.`,
      });
    }
  };

  const showToast = ({ type = "success", title, message }) => {
    const toast = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type,
      title,
      message,
    };

    setToasts((currentToasts) => [...currentToasts, toast]);
  };

  const dismissToast = (toastId) => {
    setToasts((currentToasts) => currentToasts.filter((toast) => toast.id !== toastId));
  };

  const requireSellerSession = (nextPage) => {
    if (currentUser) {
      setSelectedProduct(null);
      setActivePage(nextPage);
      return true;
    }

    setSelectedProduct(null);
    setActivePage("login");
    showToast({
      type: "error",
      title: "Sign in required",
      message: "Please sign in to access seller tools and account pages.",
    });
    return false;
  };

  const openSellPage = () => {
    requireSellerSession("sell");
  };

  const openLoginPage = () => {
    setActivePage("login");
  };

  const openMyListingsPage = () => {
    requireSellerSession("my-listings");
  };

  const openProfilePage = () => {
    requireSellerSession("profile");
  };

  const openMessagesPage = () => {
    setSelectedProduct(null);
    setActivePage("messages");
  };

  const openMessagesForProduct = (product) => {
    setSelectedMessageThreadId(product.id);
    setSelectedProduct(null);
    setActivePage("messages");
  };

  const scrollToListings = () => {
    setActivePage("market");
    listingsSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleAddItem = (item) => {
    const createdId = Date.now();
    const newProduct = {
      ...item,
      id: createdId,
    };

    setProducts((currentProducts) => [newProduct, ...currentProducts]);
    setActiveCategory("All");
    setSortBy("latest");
    setQuery("");
    setActivePage("market");
    setSelectedProduct(newProduct);
    showToast({
      type: "success",
      title: "Listing posted",
      message: `${newProduct.title} is now live in the marketplace.`,
    });
    requestAnimationFrame(() => {
      scrollToListings();
    });
  };

  const handleDeleteListing = (productId) => {
    const productToDelete = products.find((product) => product.id === productId);

    setProducts((currentProducts) =>
      currentProducts.filter((product) => product.id !== productId),
    );

    if (selectedProduct?.id === productId) {
      setSelectedProduct(null);
    }

    if (productToDelete) {
      showToast({
        type: "success",
        title: "Listing deleted",
        message: `${productToDelete.title} was removed from your listings.`,
      });
    }
  };

  const getListingStatusLabel = (listingState) => {
    switch (listingState) {
      case "draft":
        return "Draft";
      case "paused":
        return "Paused";
      case "sold":
        return "Sold";
      default:
        return "Active";
    }
  };

  const handleChangeListingStatus = (productId, nextStatus) => {
    const targetProduct = products.find((product) => product.id === productId);

    if (!targetProduct || targetProduct.listingState === nextStatus) {
      return;
    }

    setProducts((currentProducts) =>
      currentProducts.map((product) =>
        product.id === productId
          ? {
              ...product,
              listingState: nextStatus,
            }
          : product,
      ),
    );

    if (targetProduct) {
      showToast({
        type: "success",
        title: `Listing moved to ${getListingStatusLabel(nextStatus).toLowerCase()}`,
        message: `${targetProduct.title} is now ${getListingStatusLabel(nextStatus).toLowerCase()}.`,
      });
    }
  };

  const handleUpdateListing = (productId, updates) => {
    const targetProduct = products.find((product) => product.id === productId);

    setProducts((currentProducts) =>
      currentProducts.map((product) =>
        product.id === productId
          ? {
              ...product,
              ...updates,
            }
          : product,
      ),
    );

    if (selectedProduct?.id === productId) {
      setSelectedProduct((currentProduct) =>
        currentProduct
          ? {
              ...currentProduct,
              ...updates,
            }
          : currentProduct,
      );
    }

    if (targetProduct) {
      showToast({
        type: "success",
        title: "Listing updated",
        message: `${updates.title ?? targetProduct.title} was updated successfully.`,
      });
    }
  };

  const handleUpdateProfile = (nextProfile) => {
    if (!currentUser) {
      return;
    }

    const updatedUser = {
      ...currentUser,
      ...nextProfile,
    };

    setCurrentUser(updatedUser);
    setRegisteredUsers((currentAccounts) =>
      currentAccounts.map((account) =>
        account.id === currentUser.id
          ? {
              ...account,
              ...updatedUser,
            }
          : account,
      ),
    );
    setProducts((currentProducts) =>
      currentProducts.map((product) =>
        product.seller?.id === currentUser.id
          ? {
              ...product,
              seller: {
                ...product.seller,
                id: updatedUser.id,
                name: updatedUser.name,
                phone: updatedUser.phone,
              },
            }
          : product,
      ),
    );
    if (selectedProduct?.seller?.id === currentUser.id) {
      setSelectedProduct((currentProduct) =>
        currentProduct
          ? {
              ...currentProduct,
              seller: {
                ...currentProduct.seller,
                id: updatedUser.id,
                name: updatedUser.name,
                phone: updatedUser.phone,
              },
            }
          : currentProduct,
      );
    }
    showToast({
      type: "success",
      title: "Profile saved",
      message: "Your profile details were updated successfully.",
    });
  };

  const handleSignup = (signupForm) => {
    const normalizedEmail = signupForm.email.trim().toLowerCase();
    const emailInUse = registeredUsers.some((user) => user.email === normalizedEmail);

    if (emailInUse) {
      return {
        ok: false,
        message: "An account with that email already exists. Try signing in instead.",
      };
    }

    const createdUser = {
      id: normalizedEmail.replace(/[^a-z0-9]+/g, "-"),
      name: signupForm.name.trim(),
      email: normalizedEmail,
      phone: signupForm.phone.trim(),
      campus: "Kibabii University",
      bio: "New to Kibu Market and ready to buy or sell useful campus finds.",
      password: signupForm.password,
    };

    setRegisteredUsers((currentAccounts) => [...currentAccounts, createdUser]);
    setCurrentUser(createdUser);
    setActivePage("market");
    showToast({
      type: "success",
      title: "Account created",
      message: `Welcome to Kibu Market, ${createdUser.name}.`,
    });
    return { ok: true };
  };

  const handleLogin = (loginForm) => {
    const normalizedEmail = loginForm.email.trim().toLowerCase();
    const matchedUser = registeredUsers.find(
      (user) =>
        user.email === normalizedEmail && user.password === loginForm.password,
    );

    if (!matchedUser) {
      return {
        ok: false,
        message: "Incorrect email or password. Try the demo account seller@kibu.ac.ke / campus123.",
      };
    }

    setCurrentUser(matchedUser);
    setActivePage("market");
    showToast({
      type: "success",
      title: "Signed in",
      message: `Welcome back, ${matchedUser.name}.`,
    });
    return { ok: true };
  };

  const handleLogout = () => {
    if (!currentUser) {
      return;
    }

    const userName = currentUser.name;
    setCurrentUser(null);
    setActivePage("market");
    setSelectedProduct(null);
    showToast({
      type: "success",
      title: "Signed out",
      message: `${userName} has been signed out.`,
    });
  };

  const handleReportListing = (reportedProduct) => {
    showToast({
      type: "success",
      title: "Listing reported",
      message: `${reportedProduct.title} has been flagged for review.`,
    });
  };

  const handleBlockSeller = (blockedProduct) => {
    const sellerId = blockedProduct.seller?.id;

    if (!sellerId) {
      return;
    }

    setBlockedSellerIds((currentIds) =>
      currentIds.includes(sellerId) ? currentIds : [...currentIds, sellerId],
    );
    setSelectedProduct(null);
    showToast({
      type: "success",
      title: "Seller blocked",
      message: `${blockedProduct.seller.name}'s listings will no longer appear in your marketplace feed.`,
    });
  };

  return (
    <div className="page-shell">
      <div className="page-glow page-glow-left" />
      <div className="page-glow page-glow-right" />
      <Navbar
        onHomeClick={scrollToListings}
        onSellClick={openSellPage}
        onLogoutClick={handleLogout}
        onMessagesClick={openMessagesPage}
        currentUser={currentUser}
        messageCount={products.filter((product) => (product.messages?.length ?? 0) > 0).length}
      />
      <main>
        <div className="app-layout">
          <aside className="desktop-side-menu" aria-label="Desktop navigation">
            <div className="desktop-side-menu-card">
              <div className="desktop-side-menu-header">
                <span className="section-label">Navigate</span>
                <h2>Workspace</h2>
                <p>Move quickly between your marketplace pages.</p>
              </div>

              <nav className="desktop-side-nav">
                <button
                  type="button"
                  className={activePage === "market" ? "desktop-side-link active" : "desktop-side-link"}
                  onClick={scrollToListings}
                >
                  <span className="desktop-side-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                      <polyline points="9 22 9 12 15 12 15 22"/>
                    </svg>
                  </span>
                  <span className="desktop-side-copy">
                    <strong>Home</strong>
                    <small>Browse the latest campus listings</small>
                  </span>
                </button>

                <button
                  type="button"
                  className={activePage === "my-listings" ? "desktop-side-link active" : "desktop-side-link"}
                  onClick={openMyListingsPage}
                >
                  <span className="desktop-side-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 11l3 3L22 4"/>
                      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                    </svg>
                  </span>
                  <span className="desktop-side-copy">
                    <strong>My Listings</strong>
                    <small>Manage the items you are selling</small>
                  </span>
                </button>

                <button
                  type="button"
                  className={activePage === "profile" ? "desktop-side-link active" : "desktop-side-link"}
                  onClick={openProfilePage}
                >
                  <span className="desktop-side-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 12c2.761 0 5-2.239 5-5S14.761 2 12 2 7 4.239 7 7s2.239 5 5 5z"/>
                      <path d="M4 22c0-4.418 3.582-8 8-8s8 3.582 8 8"/>
                    </svg>
                  </span>
                  <span className="desktop-side-copy">
                    <strong>Profile</strong>
                    <small>Update your account and saved items</small>
                  </span>
                </button>
              </nav>

              <div className="desktop-side-summary">
                <div>
                  <span>{products.length}</span>
                  <small>Total items</small>
                </div>
                <div>
                  <span>{savedItems.length}</span>
                  <small>Saved items</small>
                </div>
              </div>
            </div>
          </aside>

          <div className="app-content">
            {activePage === "sell" ? (
              <Suspense fallback={<PageLoader label="Loading seller tools..." />}>
                <SellItemForm
                  onAddItem={handleAddItem}
                  onBack={scrollToListings}
                  currentUser={currentUser}
                />
              </Suspense>
            ) : activePage === "my-listings" ? (
              <MyListingsScreen
                products={products}
                currentUser={currentUser}
                onBack={scrollToListings}
                onCreateListing={openSellPage}
                onViewListing={setSelectedProduct}
                onDeleteListing={handleDeleteListing}
                onChangeListingStatus={handleChangeListingStatus}
                onUpdateListing={handleUpdateListing}
              />
            ) : activePage === "profile" ? (
              <UserProfileScreen
                products={products}
                savedItems={savedItems}
                userProfile={currentUser}
                currentUser={currentUser}
                onBack={scrollToListings}
                onUpdateProfile={handleUpdateProfile}
                onViewListing={setSelectedProduct}
              />
            ) : activePage === "messages" ? (
              <MessagesScreen
                products={products}
                currentUser={currentUser}
                onBack={scrollToListings}
                initialThreadId={selectedMessageThreadId}
              />
            ) : activePage === "login" || activePage === "signup" ? (
              <Suspense fallback={<PageLoader label="Loading account page..." />}>
                <AuthScreen
                  mode={activePage}
                  onModeChange={setActivePage}
                  onBack={scrollToListings}
                  onLogin={handleLogin}
                  onSignup={handleSignup}
                />
              </Suspense>
            ) : (
              <>
                <Hero
                  savedCount={savedItems.length}
                  onSellClick={openSellPage}
                  onMyListingsClick={openMyListingsPage}
                  onProfileClick={openProfilePage}
                  onBrowseClick={scrollToListings}
                  featuredProducts={products.slice(0, 3)}
                />

                <section className="products-section" ref={listingsSectionRef}>
                  <SearchBar
                    query={query}
                    onQueryChange={handleSearchChange}
                    resultCount={visibleProducts.length}
                    totalCount={products.length}
                    categories={categories}
                    activeCategory={activeCategory}
                    onCategoryChange={setActiveCategory}
                  />

                  <div className="market-controls">
                    <div className="category-filter" aria-label="Filter by category">
                      {categories.map((category) => (
                        <button
                          key={category}
                          type="button"
                          className={
                            category === activeCategory
                              ? "filter-chip active"
                              : "filter-chip"
                          }
                          onClick={() => setActiveCategory(category)}
                        >
                          {category}
                        </button>
                      ))}
                    </div>

                    <label className="sort-control">
                      <span>Sort by</span>
                      <select
                        value={sortBy}
                        onChange={(event) => setSortBy(event.target.value)}
                      >
                        <option value="latest">Latest</option>
                        <option value="price-low">Price: low to high</option>
                        <option value="price-high">Price: high to low</option>
                        <option value="title">Alphabetical</option>
                      </select>
                    </label>
                  </div>

                  <ProductList
                    products={visibleProducts}
                    savedItems={savedItems}
                    onSaveToggle={handleSaveToggle}
                    onViewDetails={setSelectedProduct}
                  />
                </section>
              </>
            )}
          </div>
        </div>
      </main>
      {selectedProduct ? (
        <Suspense fallback={<PageLoader label="Loading item details..." compact />}>
          <ProductModal
            product={selectedProduct}
            products={products}
            isSaved={savedItems.includes(selectedProduct.id)}
            onClose={() => setSelectedProduct(null)}
            onSaveToggle={handleSaveToggle}
            onContactSeller={openMessagesForProduct}
            onReportListing={handleReportListing}
            onBlockSeller={handleBlockSeller}
            onSelectRelatedProduct={setSelectedProduct}
          />
        </Suspense>
      ) : null}
      <ToastViewport toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

function PageLoader({ label, compact = false }) {
  return (
    <div className={compact ? "page-loader page-loader-compact" : "page-loader"}>
      <div className="page-loader-spinner" aria-hidden="true" />
      <p>{label}</p>
    </div>
  );
}

function TrustBadges() {
  return (
    <section className="trust-section">
      <div className="trust-container">
        <TrustCard 
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              <polyline points="9 12 11 14 15 10"/>
            </svg>
          }
          title="Verified Students"
          description="All sellers are verified university students"
        />
        <TrustCard 
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          }
          title="Quick Responses"
          description="Most sellers respond within 24 hours"
        />
        <TrustCard 
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          }
          title="Campus Pickup"
          description="Meet sellers at convenient campus locations"
        />
        <TrustCard 
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          }
          title="500+ Happy Users"
          description="Students love buying and selling here"
        />
      </div>
    </section>
  );
}

function TrustCard({ icon, title, description }) {
  return (
    <div className="trust-card">
      <div className="trust-icon">{icon}</div>
      <h3 className="trust-title">{title}</h3>
      <p className="trust-description">{description}</p>
    </div>
  );
}

export default Home;
