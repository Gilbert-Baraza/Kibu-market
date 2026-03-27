function SearchBar({ query, onQueryChange, resultCount, totalCount }) {
  return (
    <section className="search-shell">
      <div className="search-copy">
        <span className="section-label">Quick search</span>
        <h2>What are you looking for today?</h2>
        <p className="search-meta">
          Showing {resultCount} of {totalCount} listings across campus.
        </p>
      </div>
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search for phones, calculators, shoes..."
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
        />
        <button type="button">Search</button>
      </div>
    </section>
  );
}

export default SearchBar;
