export function buildPagination(page, limit, total) {
  const safePage = Number(page) || 1;
  const safeLimit = Number(limit) || 12;
  const totalPages = Math.max(1, Math.ceil(total / safeLimit));

  return {
    page: safePage,
    limit: safeLimit,
    total,
    totalPages,
    hasNextPage: safePage < totalPages,
    hasPrevPage: safePage > 1,
  };
}