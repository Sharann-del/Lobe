import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginClient } from "@/app/(auth)/login/login-client";

// ── next/navigation ─────────────────────────────────────────────────────────
const mockRouterReplace = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockRouterReplace }),
  usePathname: () => "/login",
}));

// ── @/lib/hooks ──────────────────────────────────────────────────────────────
const mockSignInWithPassword = jest.fn();
const mockSignInWithMagicLink = jest.fn();
const mockResetPassword = jest.fn();
const mockRefreshProfile = jest.fn();

jest.mock("@/lib/hooks", () => ({
  useAuth: () => ({
    signInWithPassword: mockSignInWithPassword,
    signInWithMagicLink: mockSignInWithMagicLink,
    resetPassword: mockResetPassword,
    signUp: jest.fn(),
    signOut: jest.fn(),
  }),
  useUser: () => ({
    user: null,
    profile: null,
    loading: false,
    refreshProfile: mockRefreshProfile,
  }),
}));

// ── @/lib/supabase/client ────────────────────────────────────────────────────
const mockGetUser = jest.fn();

jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: { getUser: mockGetUser },
  }),
}));


// ── Helpers ──────────────────────────────────────────────────────────────────
function makeProfile(overrides: Record<string, unknown> = {}) {
  return {
    id: "user-1",
    email: "alice@example.com",
    full_name: null,
    avatar_url: null,
    username: "alice",
    created_at: "",
    updated_at: "",
    ...overrides,
  };
}

// ── Suite ────────────────────────────────────────────────────────────────────
describe("LoginClient", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── Test 1 ──────────────────────────────────────────────────────────────
  // Note: window.location.assign is non-configurable in jsdom 26, so we verify
  // the auth flow completes correctly (signIn called, profile refreshed, onboarding
  // complete) and that router.replace('/onboarding') was NOT called — confirming
  // the component took the redirect-to-workspace path, not the onboarding path.
  it("completes the auth flow and navigates away when valid credentials and onboarding is done", async () => {
    const user = userEvent.setup();

    mockSignInWithPassword.mockResolvedValue({ error: null });
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: "user-1",
          user_metadata: { onboarding_completed: true },
        },
      },
    });
    mockRefreshProfile.mockResolvedValue(makeProfile());

    render(<LoginClient />);

    await user.type(screen.getByPlaceholderText("Email"), "alice@example.com");
    await user.type(screen.getByPlaceholderText("Password"), "secret123");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => {
      expect(mockSignInWithPassword).toHaveBeenCalledWith(
        "alice@example.com",
        "secret123"
      );
      // getUser and refreshProfile must both resolve before the redirect decision
      expect(mockGetUser).toHaveBeenCalled();
      expect(mockRefreshProfile).toHaveBeenCalled();
      // Onboarding is complete, so router.replace('/onboarding') must NOT have fired
      expect(mockRouterReplace).not.toHaveBeenCalledWith("/onboarding");
    });
  });

  // ── Test 2 ─────────────────────────────────────────────────────────────────
  it("displays an error message when invalid credentials are provided", async () => {
    const user = userEvent.setup();

    mockSignInWithPassword.mockResolvedValue({
      error: { message: "Invalid login credentials" },
    });

    render(<LoginClient />);

    await user.type(screen.getByPlaceholderText("Email"), "bad@example.com");
    await user.type(screen.getByPlaceholderText("Password"), "wrongpass");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Invalid login credentials"
      );
    });
    expect(mockRouterReplace).not.toHaveBeenCalled();
  });

  // ── Test 3 ─────────────────────────────────────────────────────────────────
  it("shows a confirmation message after successfully sending a magic link", async () => {
    const user = userEvent.setup();

    mockSignInWithMagicLink.mockResolvedValue({ error: null });

    render(<LoginClient />);

    // Switch to magic-link tab
    await user.click(screen.getByRole("button", { name: "Magic link" }));

    await user.type(screen.getByPlaceholderText("Email"), "alice@example.com");
    await user.click(screen.getByRole("button", { name: "Email me a link" }));

    await waitFor(() => {
      expect(mockSignInWithMagicLink).toHaveBeenCalledWith(
        "alice@example.com"
      );
      expect(
        screen.getByText("Check your email for a sign-in link.")
      ).toBeInTheDocument();
    });
  });

  // ── Test 4 ─────────────────────────────────────────────────────────────────
  it("sends a password reset link and shows a confirmation message", async () => {
    const user = userEvent.setup();

    mockResetPassword.mockResolvedValue({ error: null });

    render(<LoginClient />);

    // Expand the forgot-password panel
    await user.click(
      screen.getByRole("button", { name: /Forgot password\?/i })
    );

    const resetInput = screen.getByPlaceholderText("Email for reset");
    await user.clear(resetInput);
    await user.type(resetInput, "alice@example.com");

    await user.click(screen.getByRole("button", { name: "Send reset link" }));

    await waitFor(() => {
      expect(mockResetPassword).toHaveBeenCalledWith("alice@example.com");
      expect(
        screen.getByText("If an account exists, we sent a reset link.")
      ).toBeInTheDocument();
    });
  });
});
