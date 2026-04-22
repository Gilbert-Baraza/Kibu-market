export function parseListingFilters(query) {
  const {
    search,
    category,
    condition,
    location,
    status = "active",
    minPrice,
    maxPrice,
    seller,
    sort = "latest",
    page = 1,
    limit = 12,
  } = query;

  const filters = {};

  if (status) {
    filters.status = status;
  }

  if (category) {
    filters.category = category;
  }

  if (condition) {
    filters.condition = condition;
  }

  if (seller) {
    filters.seller = seller;
  }

  if (location) {
    filters.location = { $regex: location, $options: "i" };
  }

  if (search) {
    filters.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
      { category: { $regex: search, $options: "i" } },
      { location: { $regex: search, $options: "i" } },
    ];
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    filters.price = {};

    if (minPrice !== undefined) {
      filters.price.$gte = Number(minPrice);
    }

    if (maxPrice !== undefined) {
      filters.price.$lte = Number(maxPrice);
    }
  }

  const sortMap = {
    latest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    price_asc: { price: 1, createdAt: -1 },
    price_desc: { price: -1, createdAt: -1 },
    title_asc: { title: 1 },
    title_desc: { title: -1 },
  };

  return {
    filters,
    sort: sortMap[sort] || sortMap.latest,
    page: Math.max(1, Number(page) || 1),
    limit: Math.min(50, Math.max(1, Number(limit) || 12)),
  };
}