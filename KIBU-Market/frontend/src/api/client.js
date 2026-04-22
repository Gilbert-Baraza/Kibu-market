import { buildGalleryVariants, buildImageVariants } from "../utils/imageVariants.js";
const DEFAULT_API_BASE_URL = "http://localhost:4000/api";
const AUTH_TOKEN_KEY = "kibu-market-auth-token";
const REFRESH_TOKEN_KEY = "kibu-market-refresh-token";
const ACCESS_TOKEN_EXPIRES_AT_KEY = "kibu-market-access-token-expires-at";
const ACCESS_TOKEN_REFRESH_BUFFER_MS = 15 * 1000;

let refreshSessionPromise = null;

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

function getStoredRefreshToken() {
  return window.localStorage.getItem(REFRESH_TOKEN_KEY);
}

function getStoredAccessTokenExpiresAt() {
  return window.localStorage.getItem(ACCESS_TOKEN_EXPIRES_AT_KEY);
}

function setStoredSession({ token, refreshToken, accessTokenExpiresAt } = {}) {
  if (token) {
    window.localStorage.setItem(AUTH_TOKEN_KEY, token);
  } else {
    window.localStorage.removeItem(AUTH_TOKEN_KEY);
  }

  if (refreshToken) {
    window.localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  } else {
    window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  }

  if (accessTokenExpiresAt) {
    window.localStorage.setItem(ACCESS_TOKEN_EXPIRES_AT_KEY, accessTokenExpiresAt);
  } else {
    window.localStorage.removeItem(ACCESS_TOKEN_EXPIRES_AT_KEY);
  }
}

function clearStoredSession() {
  setStoredSession({ token: null, refreshToken: null, accessTokenExpiresAt: null });
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
  const primaryImage =
    product.image ??
    product.imageUrl ??
    product.coverImage ??
    "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=900&q=80";
  const gallery = ensureArray(product.gallery ?? product.images ?? product.imageUrls);
  const normalizedGallery = gallery.length > 0 ? gallery : [primaryImage];

  return {
    id: product.id ?? product._id ?? product.productId ?? crypto.randomUUID(),
    title: product.title ?? product.name ?? "Untitled listing",
    price: Number(product.price ?? 0),
    category: product.category ?? "General",
    location: product.location ?? product.pickupLocation ?? "Campus",
    description: product.description ?? "",
    tags: ensureArray(product.tags),
    listingState: product.listingState ?? product.status ?? "active",
    image: primaryImage,
    imageVariants: product.imageVariants ?? buildImageVariants(primaryImage),
    gallery: normalizedGallery,
    galleryVariants: product.galleryVariants ?? buildGalleryVariants(normalizedGallery),
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

function unwrapEntity(payload) {
  return payload?.data ?? payload?.item ?? payload?.user ?? payload?.product ?? payload;
}

function unwrapToken(payload) {
  return payload?.token ?? payload?.accessToken ?? payload?.data?.token ?? null;
}

function unwrapRefreshToken(payload) {
  return payload?.refreshToken ?? payload?.data?.refreshToken ?? null;
}

function unwrapAccessTokenExpiresAt(payload) {
  return payload?.accessTokenExpiresAt ?? payload?.data?.accessTokenExpiresAt ?? null;
}

function extractSession(payload) {
  return {
    token: unwrapToken(payload),
    refreshToken: unwrapRefreshToken(payload),
    accessTokenExpiresAt: unwrapAccessTokenExpiresAt(payload),
  };
}

function isAuthRefreshRoute(path) {
  return path === "/auth/refresh";
}

function shouldRefreshAccessToken() {
  const accessToken = getStoredAuthToken();
  const accessTokenExpiresAt = getStoredAccessTokenExpiresAt();

  if (!accessToken || !accessTokenExpiresAt) {
    return false;
  }

  const expiresAt = new Date(accessTokenExpiresAt).getTime();
  if (!Number.isFinite(expiresAt)) {
    return false;
  }

  return expiresAt - Date.now() <= ACCESS_TOKEN_REFRESH_BUFFER_MS;
}

async function sendRequest(path, { method = "GET", body, headers, token, signal } = {}) {
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
  return { response, payload };
}

async function refreshStoredSession(signal) {
  const refreshToken = getStoredRefreshToken();
  if (!refreshToken) {
    throw new ApiError("Session refresh is not available.", { status: 401 });
  }

  if (!refreshSessionPromise) {
    refreshSessionPromise = (async () => {
      const { response, payload } = await sendRequest("/auth/refresh", {
        method: "POST",
        body: { refreshToken },
        signal,
        token: null,
      });

      if (!response.ok) {
        const message = payload?.message ?? payload?.error ?? "Session refresh failed.";
        clearStoredSession();
        throw new ApiError(message, { status: response.status, payload });
      }

      const nextSession = extractSession(payload);
      setStoredSession(nextSession);
      return nextSession;
    })().finally(() => {
      refreshSessionPromise = null;
    });
  }

  return refreshSessionPromise;
}

async function request(path, options = {}) {
  const shouldHandleRefresh = !options.skipAuthRefresh && !isAuthRefreshRoute(path);

  if (shouldHandleRefresh && shouldRefreshAccessToken() && getStoredRefreshToken()) {
    await refreshStoredSession(options.signal);
  }

  const { response, payload } = await sendRequest(path, options);

  if (
    response.status === 401 &&
    shouldHandleRefresh &&
    !options.hasRetriedAfterRefresh &&
    getStoredRefreshToken()
  ) {
    await refreshStoredSession(options.signal);
    return request(path, {
      ...options,
      hasRetriedAfterRefresh: true,
    });
  }

  if (!response.ok) {
    const message =
      payload?.message ??
      payload?.error ??
      `Request failed with status ${response.status}.`;

    if (response.status === 401) {
      clearStoredSession();
    }

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

function unwrapPagination(payload) {
  return payload?.pagination ?? null;
}

function normalizePagedOptions(optionsOrSignal, defaultLimit) {
  if (optionsOrSignal && typeof optionsOrSignal === "object" && "aborted" in optionsOrSignal) {
    return { signal: optionsOrSignal, page: 1, limit: defaultLimit };
  }

  return {
    signal: optionsOrSignal?.signal,
    page: optionsOrSignal?.page ?? 1,
    limit: optionsOrSignal?.limit ?? defaultLimit,
  };
}

export const sessionStore = {
  getToken: getStoredAuthToken,
  getRefreshToken: getStoredRefreshToken,
  getAccessTokenExpiresAt: getStoredAccessTokenExpiresAt,
  setToken(token) {
    setStoredSession({
      token,
      refreshToken: getStoredRefreshToken(),
      accessTokenExpiresAt: getStoredAccessTokenExpiresAt(),
    });
  },
  setSession: setStoredSession,
  clear: clearStoredSession,
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
      skipAuthRefresh: true,
    });

    setStoredSession(extractSession(payload));

    return {
      token: unwrapToken(payload),
      refreshToken: unwrapRefreshToken(payload),
      accessTokenExpiresAt: unwrapAccessTokenExpiresAt(payload),
      user: normalizeUser(unwrapEntity(payload)),
    };
  },
  async signup(payload) {
    const response = await request("/auth/signup", {
      method: "POST",
      body: payload,
      skipAuthRefresh: true,
    });

    setStoredSession(extractSession(response));

    return {
      token: unwrapToken(response),
      refreshToken: unwrapRefreshToken(response),
      accessTokenExpiresAt: unwrapAccessTokenExpiresAt(response),
      user: normalizeUser(unwrapEntity(response)),
    };
  },
  async refreshSession(signal) {
    const session = await refreshStoredSession(signal);
    return session;
  },
  async logout() {
    try {
      await request("/auth/logout", {
        method: "POST",
      });
    } finally {
      clearStoredSession();
    }
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
  async getProductsPage(optionsOrSignal = {}) {
    const { signal, page, limit, search, category, sort, status } = optionsOrSignal && typeof optionsOrSignal === "object" && !("aborted" in optionsOrSignal)
      ? optionsOrSignal
      : normalizePagedOptions(optionsOrSignal, 12);
    const params = new URLSearchParams({
      page: String(page ?? 1),
      limit: String(limit ?? 12),
    });
    if (search) { params.set("search", search); }
    if (category) { params.set("category", category); }
    if (sort) { params.set("sort", sort); }
    if (status) { params.set("status", status); }
    const payload = await request(`/products?${params.toString()}`, { signal });
    return {
      items: unwrapList(payload).map(normalizeProduct),
      pagination: unwrapPagination(payload),
    };
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
  async getMyProducts(signal) {
    const payload = await request("/products/mine", { signal });
    return unwrapList(payload).map(normalizeProduct);
  },
  async getThreads(signal) {
    const payload = await request("/threads", { signal });
    return unwrapList(payload).map(normalizeThread);
  },
  async getThreadsPage(optionsOrSignal = {}) {
    const { signal, page, limit } = normalizePagedOptions(optionsOrSignal, 10);
    const payload = await request(`/threads?page=${page}&limit=${limit}`, { signal });
    return {
      items: unwrapList(payload).map(normalizeThread),
      pagination: unwrapPagination(payload),
    };
  },
  async getThreadMessages(threadId, signal) {
    const payload = await request(`/threads/${threadId}/messages`, { signal });
    return unwrapList(payload).map(normalizeMessage);
  },
  async getThreadMessagesPage(threadId, optionsOrSignal = {}) {
    const { signal, page, limit } = normalizePagedOptions(optionsOrSignal, 20);
    const payload = await request(`/threads/${threadId}/messages?page=${page}&limit=${limit}`, { signal });
    return {
      items: unwrapList(payload).map(normalizeMessage),
      pagination: unwrapPagination(payload),
    };
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
  async uploadFiles(files = []) {
    const selectedFiles = Array.isArray(files) ? files.filter(Boolean).slice(0, 3) : [];
    if (selectedFiles.length === 0) {
      return [];
    }

    const formData = new FormData();
    for (const file of selectedFiles) {
      formData.append("files", file);
    }

    const payload = await request("/uploads", {
      method: "POST",
      body: formData,
    });

    return payload?.urls ?? payload?.data?.urls ?? [payload?.url ?? payload?.data?.url].filter(Boolean);
  },
};
