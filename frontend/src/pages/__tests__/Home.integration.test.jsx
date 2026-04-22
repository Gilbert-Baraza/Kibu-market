import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";
import Home from "../Home";

vi.mock("../../hooks/useSocket", () => ({
  useSocket: () => ({
    isConnected: false,
    joinConversation: vi.fn(),
    leaveConversation: vi.fn(),
    sendMessage: vi.fn(),
    markConversationRead: vi.fn(),
    startTyping: vi.fn(),
    stopTyping: vi.fn(),
  }),
}));

const baseProduct = {
  id: "listing-1",
  title: "Calculus Textbook",
  price: 1800,
  category: "Books & Calculators",
  location: "Library steps",
  description: "Clean notes included and still in very good condition for exam prep.",
  tags: ["books", "math"],
  listingState: "active",
  image: "https://example.com/book.jpg",
  seller: {
    id: "seller-1",
    name: "Mercy Seller",
    phone: "0712345678",
    email: "mercy@kibu.test",
  },
  createdAt: "2026-03-30T08:00:00.000Z",
};

const signedInUser = {
  id: "user-1",
  name: "Brian Wekesa",
  email: "brian@kibu.test",
  phone: "0711111111",
  campus: "Kibabii University",
};

function createJsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

function normalizePath(url) {
  return new URL(url).pathname.replace(/^\/api/, "");
}

function parseRequestBody(body) {
  if (!body) {
    return undefined;
  }

  if (body instanceof FormData) {
    return body;
  }

  if (typeof body === "string") {
    return JSON.parse(body);
  }

  return body;
}

function setupApi({
  products = [baseProduct],
  currentUser = null,
  threads = [],
  loginUser = signedInUser,
  signupUser = signedInUser,
  createdProduct = null,
  createdThread = null,
} = {}) {
  const requests = [];

  global.fetch = vi.fn(async (input, init = {}) => {
    const method = (init.method ?? "GET").toUpperCase();
    const path = normalizePath(typeof input === "string" ? input : input.url);
    const body = parseRequestBody(init.body);

    requests.push({ method, path, body });

    if (method === "GET" && path === "/products") {
      return createJsonResponse({ data: products });
    }

    if (method === "GET" && path === "/auth/me") {
      if (!currentUser) {
        return createJsonResponse({ message: "Unauthorized" }, 401);
      }

      return createJsonResponse({ user: currentUser });
    }

    if (method === "GET" && path === "/threads") {
      return createJsonResponse({ data: threads });
    }

    if (method === "POST" && path === "/auth/login") {
      return createJsonResponse({
        token: "session-token",
        refreshToken: "refresh-token",
        accessTokenExpiresAt: "2099-01-01T00:00:00.000Z",
        user: loginUser,
      });
    }

    if (method === "POST" && path === "/auth/signup") {
      return createJsonResponse({
        token: "session-token",
        refreshToken: "refresh-token",
        accessTokenExpiresAt: "2099-01-01T00:00:00.000Z",
        user: signupUser,
      });
    }

    if (method === "POST" && path === "/uploads") {
      return createJsonResponse({
        url: "https://example.com/uploads/listing-primary.jpg",
      }, 201);
    }

    if (method === "POST" && path === "/products") {
      return createJsonResponse({
        data: createdProduct ?? {
          ...body,
          id: "listing-created",
          createdAt: "2026-03-31T09:00:00.000Z",
        },
      });
    }

    if (method === "POST" && path === "/threads") {
      return createJsonResponse({
        data: createdThread,
      });
    }

    throw new Error(`Unhandled request: ${method} ${path}`);
  });

  return { requests };
}

async function renderHome() {
  render(<Home />);
  await screen.findByRole("heading", { name: /fresh listings from campus sellers/i });
}

function getListingCard(title) {
  return screen.getByRole("button", { name: new RegExp(`view details for ${title}`, "i") });
}

beforeEach(() => {
  window.localStorage.clear();
  vi.restoreAllMocks();
  vi.stubGlobal("requestAnimationFrame", (callback) => {
    callback(0);
    return 1;
  });
  vi.stubGlobal("cancelAnimationFrame", () => {});
  vi.stubGlobal("crypto", {
    randomUUID: () => "test-uuid",
  });
});

describe("Home integration flows", () => {
  test("signs in from the auth screen and loads the user's session data", async () => {
    const user = userEvent.setup();
    const { requests } = setupApi({
      threads: [
        {
          id: "thread-1",
          productId: baseProduct.id,
          product: baseProduct,
          buyerId: signedInUser.id,
          sellerId: baseProduct.seller.id,
          buyerName: signedInUser.name,
          sellerName: baseProduct.seller.name,
          unreadCounts: { buyer: 1, seller: 0 },
          messages: [
            {
              id: "message-1",
              sender: "seller",
              text: "Still available if you want it.",
              createdAt: "2026-03-31T07:45:00.000Z",
            },
          ],
        },
      ],
    });

    await renderHome();

    await user.click(screen.getByRole("button", { name: /sign in/i }));
    await screen.findByRole("heading", { name: /welcome back/i });

    await user.type(screen.getByLabelText(/email address/i), "brian@kibu.test");
    await user.type(screen.getByLabelText(/^password$/i), "secret7");
    await user.click(screen.getByRole("button", { name: /^sign in$/i }));

    expect(await screen.findByText(/welcome back, brian wekesa\./i)).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: /open profile for brian wekesa/i })).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(window.localStorage.getItem("kibu-market-auth-token")).toBe("session-token");
    expect(requests.some((request) => request.method === "POST" && request.path === "/auth/login")).toBe(true);
    expect(requests.filter((request) => request.method === "GET" && request.path === "/threads")).toHaveLength(1);
  }, 10000);

  test("creates an account from the signup flow", async () => {
    const user = userEvent.setup();

    setupApi({
      signupUser: {
        ...signedInUser,
        name: "Jane Student",
        email: "jane@kibu.test",
      },
    });

    await renderHome();

    await user.click(screen.getByRole("button", { name: /sign in/i }));
    await screen.findByRole("heading", { name: /welcome back/i });
    await user.click(screen.getByRole("tab", { name: /sign up/i }));

    await user.type(screen.getByLabelText(/username/i), "Jane Student");
    await user.type(screen.getByLabelText(/email address/i), "jane@kibu.test");
    await user.type(screen.getByLabelText(/phone number/i), "0712345678");
    await user.type(screen.getByLabelText(/^password$/i), "secret7");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(await screen.findByText(/welcome to kibu market, jane student\./i)).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: /open profile for jane student/i })).toBeInTheDocument();
    expect(window.localStorage.getItem("kibu-market-auth-token")).toBe("session-token");
  });

  test("creates a listing through the sell flow", async () => {
    const user = userEvent.setup();
    const createdProduct = {
      ...baseProduct,
      id: "listing-2",
      title: "Graphing Calculator",
      price: 3200,
      location: "Admin block",
      description: "Works perfectly, comes with cover, and is ready for engineering classes.",
      seller: signedInUser,
      createdAt: "2026-03-31T09:00:00.000Z",
    };
    const { requests } = setupApi({
      currentUser: signedInUser,
      createdProduct,
    });

    window.localStorage.setItem("kibu-market-auth-token", "session-token");

    await renderHome();

    await user.click(screen.getAllByRole("button", { name: /sell now/i })[0]);
    await screen.findByRole("heading", { name: /post an item in a minute/i });

    await user.type(screen.getByLabelText(/item title/i), "Graphing Calculator");
    await user.type(screen.getByLabelText(/price/i), "3200");
    await user.type(screen.getByLabelText(/pickup location/i), "Admin block");
    await user.type(
      screen.getByLabelText(/description/i),
      "Works perfectly, comes with cover, and is ready for engineering classes.",
    );
    await user.type(screen.getByLabelText(/tags/i), "calculator, exam");
    await user.upload(
      screen.getByLabelText(/upload images/i),
      new File(["image-bytes"], "calculator.jpg", { type: "image/jpeg" }),
    );
    await user.click(screen.getByRole("button", { name: /publish listing/i }));

    expect(await screen.findByText(/graphing calculator is now live in the marketplace\./i)).toBeInTheDocument();
    expect(
      await screen.findByRole("button", { name: /view details for graphing calculator/i }),
    ).toBeInTheDocument();

    const createProductRequest = requests.find(
      (request) => request.method === "POST" && request.path === "/products",
    );
    expect(createProductRequest?.body).toEqual(
      expect.objectContaining({
        title: "Graphing Calculator",
        price: 3200,
        location: "Admin block",
        images: ["https://example.com/uploads/listing-primary.jpg"],
      }),
    );
  });

  test("starts a conversation from a listing and sends the first message", async () => {
    const user = userEvent.setup();
    const createdThread = {
      id: "thread-new",
      productId: baseProduct.id,
      product: baseProduct,
      buyerId: signedInUser.id,
      sellerId: baseProduct.seller.id,
      buyerName: signedInUser.name,
      sellerName: baseProduct.seller.name,
      unreadCounts: { buyer: 0, seller: 1 },
      updatedAt: "2026-03-31T10:30:00.000Z",
      messages: [
        {
          id: "message-new",
          sender: "buyer",
          text: "Hi, is this still available today?",
          createdAt: "2026-03-31T10:30:00.000Z",
        },
      ],
    };
    const { requests } = setupApi({
      currentUser: signedInUser,
      createdThread,
    });

    window.localStorage.setItem("kibu-market-auth-token", "session-token");

    await renderHome();

    const card = getListingCard("Calculus Textbook");
    await user.click(within(card).getByRole("button", { name: /chat/i }));

    expect(
      await screen.findByPlaceholderText(/type a message to mercy/i),
    ).toBeInTheDocument();

    await user.type(
      screen.getByPlaceholderText(/type a message to mercy/i),
      "Hi, is this still available today?",
    );
    await user.click(screen.getByRole("button", { name: /^send$/i }));

    expect(await screen.findAllByText(/hi, is this still available today\?/i)).not.toHaveLength(0);
    expect(screen.getByPlaceholderText(/type a message to mercy/i)).toBeInTheDocument();

    const sendMessageRequest = requests.find(
      (request) => request.method === "POST" && request.path === "/threads",
    );
    expect(sendMessageRequest?.body).toEqual({
      productId: baseProduct.id,
      recipientId: baseProduct.seller.id,
      text: "Hi, is this still available today?",
    });
  });

  test("saves an item from the marketplace and persists it locally", async () => {
    const user = userEvent.setup();

    setupApi();

    await renderHome();

    const card = getListingCard("Calculus Textbook");
    const saveButton = within(card).getByRole("button", { name: /save item/i });

    await user.click(saveButton);

    expect(await screen.findByText(/calculus textbook was added to your saved items\./i)).toBeInTheDocument();
    await waitFor(() => {
      expect(within(card).getByRole("button", { name: /remove from saved items/i })).toBeInTheDocument();
    });
    expect(window.localStorage.getItem("kibu-market-saved-items")).toContain(baseProduct.id);
  });
});




