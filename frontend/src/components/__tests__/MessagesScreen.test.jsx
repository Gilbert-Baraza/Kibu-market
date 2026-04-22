import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import MessagesScreen from "../MessagesScreen";

function setMobileViewport() {
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    writable: true,
    value: 390,
  });

  window.dispatchEvent(new Event("resize"));
}

describe("MessagesScreen mobile layout", () => {
  test("switches between thread list and active chat on mobile", async () => {
    setMobileViewport();

    const user = userEvent.setup();
    const currentUser = { id: "user-buyer", name: "Campus Buyer" };
    const products = [
      {
        id: "listing-1",
        title: "Office Chair",
        price: 4500,
        location: "Library",
        image: "https://example.com/chair.jpg",
        listingState: "active",
        seller: { id: "seller-1", name: "Engineer Jed" },
      },
    ];
    const threads = [
      {
        id: "thread-1",
        productId: "listing-1",
        product: products[0],
        buyerId: "user-buyer",
        sellerId: "seller-1",
        buyerName: "Campus Buyer",
        sellerName: "Engineer Jed",
        productStatus: "active",
        unreadCounts: { buyer: 0, seller: 1 },
        messages: [
          {
            id: "message-1",
            sender: "seller",
            text: "The chair is still available.",
            time: "10:30",
          },
        ],
      },
    ];

    render(
      <MessagesScreen
        products={products}
        threads={threads}
        currentUser={currentUser}
        onBack={vi.fn()}
        onSendMessage={vi.fn().mockResolvedValue({ ok: true })}
        onMarkThreadRead={vi.fn().mockResolvedValue({ ok: true })}
        onJoinConversation={vi.fn()}
        onLeaveConversation={vi.fn()}
        onTypingStart={vi.fn()}
        onTypingStop={vi.fn()}
      />,
    );

    expect(screen.getByPlaceholderText(/search or start a new conversation/i)).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/type a message to/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /engineer jed/i }));

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/type a message to engineer/i)).toBeInTheDocument();
    });

    expect(screen.queryByPlaceholderText(/search or start a new conversation/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /back to marketplace/i }));

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/search or start a new conversation/i)).toBeInTheDocument();
    });
  });
});
