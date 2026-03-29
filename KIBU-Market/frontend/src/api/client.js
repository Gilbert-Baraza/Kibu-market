const DEFAULT_API_BASE_URL = "http://localhost:4000/api";
const AUTH_TOKEN_KEY = "kibu-market-auth-token";

export class ApiError extends Error {
  constructor(message, { status, payload } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status ?? null;
    this.payload = payload ?? null;
  }
}

function trimTrailingSlash(value) {
  return String(value ?? "").replace(/\/+$/, "");
}

function getApiBaseUrl() {
  return trimTrailingSlash(import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL);
}

function readJson(value, fallbackValue) {
  try {
    return value ? JSON.parse(value) : fallbackValue;
  } catch {
    return fallbackValue;
  }
}

function getStoredAuthToken() {
  return window.localStorage.getItem(AUTH_TOKEN_KEY);
}

function setStoredAuthToken(token) {
  if (!token) {
    window.localStorage.removeItem(AUTH_TOKEN_KEY);
    return;
  }

  window.localStorage.setItem(AUTH_TOKEN_KEY, token);
}

function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}

function formatMessageTime(value) {
  if (!value) {
    return "Now";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("en-KE", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function normalizeUser(user) {
  if (!user) {
    return null;
  }

  return {
    id: user.id ?? user._id ?? user.userId ?? "",
    name: user.name ?? user.fullName ?? "Campus Seller",
    email: user.email ?? "",
    phone: user.phone ?? user.phoneNumber ?? "",
    campus: user.campus ?? user.school ?? "Kibabii University",
    bio:
      user.bio ??
      "Student seller sharing useful finds, study essentials, and room upgrades around campus.",
    status: user.status ?? user.presence ?? "Active on Kibu Market",
    rating: user.rating,
    joined: user.joined ?? user.createdAt,
  };
}

export function normalizeMessage(message) {
  const senderRole =
    message.senderRole ??
    message.senderType ??
    message.sender ??
    (message.isFromSeller ? "seller" : "buyer");
  const readBy = ensureArray(message.readBy).map((entry) => {
    if (typeof entry === "string") {
      return entry;
    }

    return entry?.id ?? entry?._id ?? entry?.userId ?? "";
  }).filter(Boolean);
  const isRead =
    Boolean(message.isRead ?? message.read ?? message.readAt) ||
    readBy.length > 1;

  return {
    id: message.id ?? message._id ?? crypto.randomUUID(),
    sender: senderRole === "seller" ? "seller" : "buyer",
    text: message.text ?? message.body ?? message.message ?? "",
    time: formatMessageTime(message.createdAt ?? message.updatedAt ?? message.time),
    createdAt: message.createdAt ?? message.updatedAt ?? null,
    readBy,
    isRead,
  };
}

function normalizeSeller(product) {
  const seller = normalizeUser(product.seller ?? product.owner ?? product.user);

  return {
    id: seller?.id ?? "",
    name: seller?.name ?? "Campus Seller",
    phone: seller?.phone ?? "",
    email: seller?.email ?? "",
    status:
      product.seller?.status ??
      product.owner?.status ??
      seller?.status ??
      "Active on Kibu Market",
    rating: product.seller?.rating ?? seller?.rating,
    joined: product.seller?.joined ?? seller?.joined,
  };
}

export function normalizeProduct(product) {
  return {
    id: product.id ?? product._id ?? product.productId ?? crypto.randomUUID(),
    title: product.title ?? product.name ?? "Untitled listing",
    price: Number(product.price ?? 0),
    category: product.category ?? "General",
    location: product.location ?? product.pickupLocation ?? "Campus",
    description: product.description ?? "",
    tags: ensureArray(product.tags),
    listingState: product.listingState ?? product.status ?? "active",
    image:
      product.image ??
      product.imageUrl ??
      product.coverImage ??
      "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=900&q=80",
    gallery: ensureArray(product.gallery ?? product.images ?? product.imageUrls),
    seller: normalizeSeller(product),
    createdAt: product.createdAt ?? product.updatedAt ?? null,
    messages: ensureArray(product.messages).map(normalizeMessage),
  };
}

export function normalizeThread(thread) {
  const product = thread.product ? normalizeProduct(thread.product) : null;
  const buyer = normalizeUser(thread.buyer);
  const seller = normalizeUser(thread.seller);
  const unreadCounts = {
    buyer: Number(thread.unreadCounts?.buyer ?? 0),
    seller: Number(thread.unreadCounts?.seller ?? 0),
  };

  return {
    id: thread.id ?? thread._id ?? crypto.randomUUID(),
    productId:
      thread.productId ??
      thread.listingId ??
      thread.product?.id ??
      thread.product?._id ??
      "",
    product,
    buyerId: thread.buyerId ?? buyer?.id ?? "",
    sellerId: thread.sellerId ?? seller?.id ?? thread.product?.seller?.id ?? "",
    buyerName: thread.buyerName ?? buyer?.name ?? "Interested buyer",
    sellerName: thread.sellerName ?? seller?.name ?? product?.seller?.name ?? "Campus Seller",
    unreadCounts,
    unreadCount: Number(thread.unreadCount ?? unreadCounts.buyer ?? 0),
    messages: ensureArray(thread.messages ?? thread.items).map(normalizeMessage),
    updatedAt: thread.updatedAt ?? thread.lastMessageAt ?? null,
    productStatus: thread.productStatus ?? thread.product?.status ?? product?.listingState ?? "active",
  };
}

async function parseResponse(response) {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  return response.text();
}

async function request(path, { method = "GET", body, headers, token, signal } = {}) {
  const isFormData = body instanceof FormData;
  const authToken = token ?? getStoredAuthToken();
  const nextHeaders = new Headers(headers ?? {});

  if (!isFormData && body !== undefined) {
    nextHeaders.set("Content-Type", "application/json");
  }

  nextHeaders.set("Accept", "application/json");

  if (authToken) {
    nextHeaders.set("Authorization", `Bearer ${authToken}`);
  }

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    method,
    headers: nextHeaders,
    body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
    signal,
  });

  const payload = await parseResponse(response);

  if (!response.ok) {
    const message =
      payload?.message ??
      payload?.error ??
      `Request failed with status ${response.status}.`;

    throw new ApiError(message, {
      status: response.status,
      payload,
    });
  }

  return payload;
}

function unwrapList(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  if (Array.isArray(payload?.items)) {
    return payload.items;
  }

  return [];
}

function unwrapEntity(payload) {
  return payload?.data ?? payload?.item ?? payload?.user ?? payload?.product ?? payload;
}

function unwrapToken(payload) {
  return payload?.token ?? payload?.accessToken ?? payload?.data?.token ?? null;
}

export const sessionStore = {
  getToken: getStoredAuthToken,
  setToken: setStoredAuthToken,
  clear() {
    setStoredAuthToken(null);
  },
  getApiBaseUrl,
  readCachedJson(key, fallbackValue) {
    return readJson(window.localStorage.getItem(key), fallbackValue);
  },
};

export const apiClient = {
  async login(credentials) {
    const payload = await request("/auth/login", {
      method: "POST",
      body: credentials,
    });

    const token = unwrapToken(payload);
    if (token) {
      setStoredAuthToken(token);
    }

    return {
      token,
      user: normalizeUser(unwrapEntity(payload)),
    };
  },
  async signup(payload) {
    const response = await request("/auth/signup", {
      method: "POST",
      body: payload,
    });

    const token = unwrapToken(response);
    if (token) {
      setStoredAuthToken(token);
    }

    return {
      token,
      user: normalizeUser(unwrapEntity(response)),
    };
  },
  async getCurrentUser(signal) {
    const payload = await request("/auth/me", { signal });
    return normalizeUser(unwrapEntity(payload));
  },
  async updateProfile(updates) {
    const payload = await request("/users/me", {
      method: "PATCH",
      body: updates,
    });
    return normalizeUser(unwrapEntity(payload));
  },
  async getProducts(signal) {
    const payload = await request("/products", { signal });
    return unwrapList(payload).map(normalizeProduct);
  },
  async createProduct(product) {
    const payload = await request("/products", {
      method: "POST",
      body: product,
    });
    return normalizeProduct(unwrapEntity(payload));
  },
  async updateProduct(productId, updates) {
    const payload = await request(`/products/${productId}`, {
      method: "PATCH",
      body: updates,
    });
    return normalizeProduct(unwrapEntity(payload));
  },
  async deleteProduct(productId) {
    await request(`/products/${productId}`, {
      method: "DELETE",
    });
  },
  async getThreads(signal) {
    const payload = await request("/threads", { signal });
    return unwrapList(payload).map(normalizeThread);
  },
  async getThreadMessages(threadId, signal) {
    const payload = await request(`/threads/${threadId}/messages`, { signal });
    return unwrapList(payload).map(normalizeMessage);
  },
  async markThreadRead(threadId) {
    const payload = await request(`/threads/${threadId}/read`, {
      method: "PATCH",
    });
    return normalizeThread(unwrapEntity(payload));
  },
  async sendMessage({ threadId, productId, recipientId, text }) {
    const payload = await request(threadId ? `/threads/${threadId}/messages` : "/threads", {
      method: "POST",
      body: threadId
        ? { text }
        : {
            productId,
            recipientId,
            text,
          },
    });

    return normalizeThread(unwrapEntity(payload));
  },
  async uploadFile(file) {
    const formData = new FormData();
    formData.append("file", file);

    const payload = await request("/uploads", {
      method: "POST",
      body: formData,
    });

    return payload?.url ?? payload?.data?.url ?? payload?.file?.url ?? "";
  },
};
