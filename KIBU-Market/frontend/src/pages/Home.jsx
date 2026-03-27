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

function Home() {
  const [products, setProducts] = useState(initialProducts);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [sortBy, setSortBy] = useState("latest");
  const [savedItems, setSavedItems] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activePage, setActivePage] = useState("market");
  const [selectedMessageThreadId, setSelectedMessageThreadId] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [userProfile, setUserProfile] = useState({
    name: "Campus Seller",
    email: "seller@kibu.ac.ke",
    phone: "0700 000 000",
    campus: "Kibabii University",
    bio: "Student seller sharing useful finds, study essentials, and room upgrades around campus.",
  });
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

  const deferredQuery = useDeferredValue(query);
  const categories = ["All", ...new Set(products.map((product) => product.category))];

  const normalizedQuery = deferredQuery.trim().toLowerCase();
  let visibleProducts = products.filter((product) => {
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

  const openSellPage = () => {
    setActivePage("sell");
  };

  const openLoginPage = () => {
    setActivePage("login");
  };

  const openMyListingsPage = () => {
    setSelectedProduct(null);
    setActivePage("my-listings");
  };

  const openProfilePage = () => {
    setSelectedProduct(null);
    setActivePage("profile");
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

  const openSignupPage = () => {
    setActivePage("signup");
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

  const handleToggleListingStatus = (productId) => {
    const targetProduct = products.find((product) => product.id === productId);
    const nextStatus = targetProduct?.listingState === "sold" ? "active" : "sold";

    setProducts((currentProducts) =>
      currentProducts.map((product) =>
        product.id === productId
          ? {
              ...product,
              listingState:
                product.listingState === "sold" ? "active" : "sold",
            }
          : product,
      ),
    );

    if (targetProduct) {
      showToast({
        type: "success",
        title: nextStatus === "sold" ? "Listing marked as sold" : "Listing reactivated",
        message:
          nextStatus === "sold"
            ? `${targetProduct.title} is now marked as sold.`
            : `${targetProduct.title} is active again.`,
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
    setUserProfile(nextProfile);
    showToast({
      type: "success",
      title: "Profile saved",
      message: "Your profile details were updated successfully.",
    });
  };

  return (
    <div className="page-shell">
      <div className="page-glow page-glow-left" />
      <div className="page-glow page-glow-right" />
      <Navbar
        onHomeClick={scrollToListings}
        onSellClick={openSellPage}
        onMyListingsClick={openMyListingsPage}
        onProfileClick={openProfilePage}
        onLoginClick={openLoginPage}
        onMessagesClick={openMessagesPage}
        messageCount={products.filter((product) => (product.messages?.length ?? 0) > 0).length}
      />
      <main>
        {activePage === "sell" ? (
          <Suspense fallback={<PageLoader label="Loading seller tools..." />}>
            <SellItemForm onAddItem={handleAddItem} onBack={scrollToListings} />
          </Suspense>
        ) : activePage === "my-listings" ? (
          <MyListingsScreen
            products={products}
            onBack={scrollToListings}
            onCreateListing={openSellPage}
            onViewListing={setSelectedProduct}
            onDeleteListing={handleDeleteListing}
            onToggleListingStatus={handleToggleListingStatus}
            onUpdateListing={handleUpdateListing}
          />
        ) : activePage === "profile" ? (
          <UserProfileScreen
            products={products}
            savedItems={savedItems}
            userProfile={userProfile}
            onBack={scrollToListings}
            onUpdateProfile={handleUpdateProfile}
            onViewListing={setSelectedProduct}
          />
        ) : activePage === "messages" ? (
          <MessagesScreen
            products={products}
            onBack={scrollToListings}
            initialThreadId={selectedMessageThreadId}
          />
        ) : activePage === "login" || activePage === "signup" ? (
          <Suspense fallback={<PageLoader label="Loading account page..." />}>
            <AuthScreen
              mode={activePage}
              onModeChange={setActivePage}
              onBack={scrollToListings}
              onSignupClick={openSignupPage}
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
              {/* <div className="section-heading">
                <span className="section-label">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                  Fresh Listings
                </span>
                <h2>Latest items around campus</h2>
                <p>
                  Browse student-to-student deals on essentials, tech, and room setup finds.
                </p>
              </div> */}

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
