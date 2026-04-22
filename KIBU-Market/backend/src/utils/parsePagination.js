export function parsePagination(query, { defaultLimit = 12, maxLimit = 50 } = {}) {
  const page = Math.max(1, Number(query?.page) || 1);
  const limit = Math.min(maxLimit, Math.max(1, Number(query?.limit) || defaultLimit));

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
}
