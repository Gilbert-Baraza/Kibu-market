function PaginationControls({
  pagination,
  onPageChange,
  compact = false,
  label = "results",
}) {
  if (!pagination || pagination.totalPages <= 1) {
    return null;
  }

  return (
    <div className={compact ? "pagination-controls pagination-controls-compact" : "pagination-controls"}>
      <button
        type="button"
        className="secondary-btn"
        onClick={() => onPageChange(Math.max(1, pagination.page - 1))}
        disabled={!pagination.hasPrevPage}
      >
        Previous
      </button>
      <span className="pagination-summary">
        Page {pagination.page} of {pagination.totalPages} • {pagination.total} {label}
      </span>
      <button
        type="button"
        className="secondary-btn"
        onClick={() => onPageChange(Math.min(pagination.totalPages, pagination.page + 1))}
        disabled={!pagination.hasNextPage}
      >
        Next
      </button>
    </div>
  );
}

export default PaginationControls;
