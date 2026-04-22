import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import UserProfileScreen from "../UserProfileScreen";

describe("UserProfileScreen flows", () => {
  test("submits valid profile edits and keeps saved and posted items visible", async () => {
    const user = userEvent.setup();
    const onUpdateProfile = vi.fn();
    const currentUser = {
      id: "user-1",
      name: "Brian Wekesa",
      email: "brian@kibu.test",
      phone: "0712345678",
      campus: "Kibabii University",
      bio: "Student seller sharing useful finds around campus every week.",
    };
    const products = [
      {
        id: "listing-1",
        title: "Bed and Mattress",
        price: 6500,
        image: "https://example.com/bed.jpg",
        seller: { id: "user-1" },
        listingState: "active",
      },
      {
        id: "listing-2",
        title: "Scientific Calculator",
        price: 1200,
        image: "https://example.com/calculator.jpg",
        seller: { id: "seller-2" },
        listingState: "active",
      },
    ];

    render(
      <UserProfileScreen
        products={products}
        savedItems={["listing-2"]}
        userProfile={currentUser}
        currentUser={currentUser}
        onBack={vi.fn()}
        onUpdateProfile={onUpdateProfile}
        onViewListing={vi.fn()}
      />,
    );

    expect(screen.getByText(/1 saved/i)).toBeInTheDocument();
    expect(screen.getByText(/1 listings/i)).toBeInTheDocument();
    expect(screen.getByText(/scientific calculator/i)).toBeInTheDocument();
    expect(screen.getByText(/bed and mattress/i)).toBeInTheDocument();

    const nameInput = screen.getByLabelText(/full name/i);
    const phoneInput = screen.getByLabelText(/phone/i);
    const bioInput = screen.getByLabelText(/bio/i);

    fireEvent.change(nameInput, { target: { value: "Brian Wekesa Updated" } });
    fireEvent.change(phoneInput, { target: { value: "0799999999" } });
    fireEvent.change(bioInput, {
      target: {
        value:
          "Student seller sharing useful finds around campus with fast replies and honest descriptions.",
      },
    });

    await user.click(screen.getByRole("button", { name: /save profile/i }));

    expect(onUpdateProfile).toHaveBeenCalledTimes(1);
    expect(onUpdateProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Brian Wekesa Updated",
        phone: "0799999999",
      }),
    );
  });
});
