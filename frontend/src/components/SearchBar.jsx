function getCategoryIcon(category) {
  switch (String(category).toLowerCase()) {
    case "all":
      return "grid";
    case "electronics":
      return "device";
    case "books":
      return "book";
    case "furniture":
      return "home";
    case "fashion":
    case "clothing":
      return "spark";
    case "hostel":
    case "hostel items":
      return "home";
    default:
      return "tag";
  }
}

function CategoryIcon({ type }) {
  if (type === "device") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="7" y="2" width="10" height="20" rx="2" />
        <line x1="11" y1="18" x2="13" y2="18" />
      </svg>
    );
  }

  if (type === "book") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    );
  }

  if (type === "home") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 10.5 12 3l9 7.5" />
        <path d="M5 9.5V21h14V9.5" />
      </svg>
    );
  }

  if (type === "spark") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m12 3 1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3Z" />
      </svg>
    );
  }

  if (type === "tag") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m20.59 13.41-7.18 7.18a2 2 0 0 1-2.82 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82Z" />
        <line x1="7" y1="7" x2="7.01" y2="7" />
      </svg>
    );
  }

  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}

function getSummaryText({ query, resultCount, totalCount }) {
  const hasQuery = query.trim().length > 0;
  const safeResultCount = Math.max(0, Number(resultCount) || 0);
  const safeTotalCount = Math.max(safeResultCount, Number(totalCount) || 0);

  if (hasQuery && safeTotalCount > safeResultCount) {
    return `Showing ${safeResultCount} of ${safeTotalCount} matching listings`;
  }

  if (hasQuery) {
    return `${safeResultCount} matching listing${safeResultCount === 1 ? "" : "s"} on campus`;
  }

  return `${safeTotalCount} active listing${safeTotalCount === 1 ? "" : "s"} ready to browse`;
}

function SearchBar({
  query,
  onQueryChange,
  resultCount = 0,
  totalCount = 0,
  categories = [],
  activeCategory = "All",
  onCategoryChange,
  sortBy = "latest",
  onSortChange,
}) {
  const visibleCount = Math.max(0, Number(resultCount) || 0);
  const summaryText = getSummaryText({ query, resultCount, totalCount });

  return (
    <section className="search-section marketplace-search">
      <div className="search-container">
        <div className="market-header-row">
          <div className="market-header-copy">
            <span className="market-header-kicker">Campus marketplace</span>
            <p className="market-header-summary">{summaryText}</p>
          </div>
          <span className="search-results-pill" aria-live="polite">
            {visibleCount} item{visibleCount === 1 ? "" : "s"}
          </span>
        </div>

        <div className="search-controls">
          <div className="search-input-wrapper search-input-pill">
            <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="text"
              placeholder="Search phones, beds, books..."
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              className="search-input"
            />
            {query ? (
              <button
                type="button"
                className="search-clear"
                onClick={() => onQueryChange("")}
                aria-label="Clear search"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            ) : null}
          </div>
        </div>

        <div className="market-controls">
          <div className="category-filter" aria-label="Filter by category">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                className={category === activeCategory ? "filter-chip active" : "filter-chip"}
                onClick={() => onCategoryChange(category)}
              >
                <span className="filter-chip-icon">
                  <CategoryIcon type={getCategoryIcon(category)} />
                </span>
                <span>{category}</span>
              </button>
            ))}
          </div>

          <div className="market-toolbar">
            <label className="sort-control">
              <span>Sort</span>
              <select value={sortBy} onChange={(event) => onSortChange(event.target.value)}>
                <option value="latest">Latest</option>
                <option value="price-low">Price: low to high</option>
                <option value="price-high">Price: high to low</option>
                <option value="title">Alphabetical</option>
              </select>
            </label>
          </div>
        </div>
      </div>
    </section>
  );
}

export default SearchBar;
