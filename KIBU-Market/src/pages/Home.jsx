import { startTransition, useDeferredValue, useRef, useState } from "react";
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import SearchBar from "../components/SearchBar";
import ProductList from "../components/ProductList";
import ProductModal from "../components/ProductModal";
import SellItemForm from "../components/SellItemForm";
import AuthScreen from "../components/AuthScreen";
import initialProducts from "../data/products";

function Home() {
  const [products, setProducts] = useState(initialProducts);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [sortBy, setSortBy] = useState("latest");
  const [savedItems, setSavedItems] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activePage, setActivePage] = useState("market");
  const [authMode, setAuthMode] = useState("login");
  const listingsSectionRef = useRef(null);

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
    setSavedItems((currentItems) =>
      currentItems.includes(productId)
        ? currentItems.filter((id) => id !== productId)
        : [...currentItems, productId],
    );
  };

  const openSellPage = () => {
    setActivePage("sell");
  };

  const openLoginPage = () => {
    setAuthMode("login");
    setActivePage("auth");
  };

  const openSignupPage = () => {
    setAuthMode("signup");
    setActivePage("auth");
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
    requestAnimationFrame(() => {
      scrollToListings();
    });
  };

  return (
    <div className="page-shell">
      <div className="page-glow page-glow-left" />
      <div className="page-glow page-glow-right" />
      <Navbar
        onHomeClick={scrollToListings}
        onSellClick={openSellPage}
        onLoginClick={openLoginPage}
      />
      <main>
        {activePage === "sell" ? (
          <SellItemForm onAddItem={handleAddItem} onBack={scrollToListings} />
        ) : activePage === "auth" ? (
          <AuthScreen
            mode={authMode}
            onModeChange={setAuthMode}
            onBack={scrollToListings}
            onSignupClick={openSignupPage}
          />
        ) : (
          <>
            <Hero
              savedCount={savedItems.length}
              onSellClick={openSellPage}
              onBrowseClick={scrollToListings}
            />
            <SearchBar
              query={query}
              onQueryChange={handleSearchChange}
              resultCount={visibleProducts.length}
              totalCount={products.length}
            />

            <section className="products-section" ref={listingsSectionRef}>
              <div className="section-heading">
                <div>
                  <span className="section-label">Fresh listings</span>
                  <h2>Latest items around campus</h2>
                </div>
                <p>
                  Browse student-to-student deals on essentials, tech, and room
                  setup finds.
                </p>
              </div>
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
        <ProductModal
          product={selectedProduct}
          isSaved={savedItems.includes(selectedProduct.id)}
          onClose={() => setSelectedProduct(null)}
          onSaveToggle={handleSaveToggle}
        />
      ) : null}
    </div>
  );
}

export default Home;
