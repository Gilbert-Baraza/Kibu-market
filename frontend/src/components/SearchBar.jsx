function SearchBar({ query, onQueryChange }) {
  return (
    <section className="search-section marketplace-search">
      <div className="search-container">
        <div className="search-controls">
          <div className="search-input-wrapper search-input-pill">
            <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="text"
              placeholder="Search phones, calculators, books, beds..."
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
      </div>
    </section>
  );
}

export default SearchBar;
