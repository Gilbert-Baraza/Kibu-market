import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import Navbar from "../Navbar";

describe("Navbar mobile navigation", () => {
  test("opens the mobile menu with the expected navigation links for signed-in users", async () => {
    const user = userEvent.setup();
    const callbacks = {
      onHomeClick: vi.fn(),
      onMessagesClick: vi.fn(),
      onMyListingsClick: vi.fn(),
      onProfileClick: vi.fn(),
      onSellClick: vi.fn(),
      onLogoutClick: vi.fn(),
      onSignInClick: vi.fn(),
    };

    render(
      <Navbar
        {...callbacks}
        currentUser={{ name: "Brian Wekesa" }}
        messageCount={3}
      />,
    );

    await user.click(screen.getByRole("button", { name: /toggle navigation menu/i }));

    expect(screen.getAllByRole("button", { name: /home/i }).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /messages/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /my listings/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^profile$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sell now/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /logout/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^profile$/i }));
    expect(callbacks.onProfileClick).toHaveBeenCalledTimes(1);
  });
});
