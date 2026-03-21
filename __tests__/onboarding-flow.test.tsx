import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OnboardingFlow } from "@/components/auth/OnboardingFlow";
import type { Profile } from "@/lib/types/database.types";

// ── @/lib/supabase/client ────────────────────────────────────────────────────
const mockEq = jest.fn();
const mockUpdate = jest.fn(() => ({ eq: mockEq }));
const mockFrom = jest.fn(() => ({ update: mockUpdate }));
const mockUpdateUser = jest.fn();

jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: mockFrom,
    auth: { updateUser: mockUpdateUser },
  }),
}));

// ── @/lib/auth/workspace-slug ─────────────────────────────────────────────────
const mockCreateWorkspace = jest.fn();

jest.mock("@/lib/auth/workspace-slug", () => ({
  createWorkspaceWithUniqueSlug: (
    ...args: Parameters<typeof mockCreateWorkspace>
  ) => mockCreateWorkspace(...args),
  slugifyWorkspaceName: (name: string) =>
    name.toLowerCase().replace(/\s+/g, "-"),
}));


// ── Helpers ──────────────────────────────────────────────────────────────────
function makeProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    id: "user-1",
    email: "alice@example.com",
    full_name: null,
    avatar_url: null,
    username: null,
    created_at: "",
    updated_at: "",
    ...overrides,
  };
}

const BASE_PROPS = {
  userId: "user-1",
  initialStep: 0,
  initialUsername: "",
  initialWorkspace: "",
  initialTheme: "dark" as const,
  refreshProfile: jest.fn(),
};

// ── Suite ────────────────────────────────────────────────────────────────────
describe("OnboardingFlow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── Test 5a ────────────────────────────────────────────────────────────────
  it("saves the username to the database and advances to the workspace step", async () => {
    const user = userEvent.setup();
    const refreshProfile = jest
      .fn()
      .mockResolvedValue(makeProfile({ username: "alice" }));
    mockEq.mockResolvedValue({ error: null });

    render(<OnboardingFlow {...BASE_PROPS} refreshProfile={refreshProfile} />);

    expect(screen.getByText("Choose a username")).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText("username"), "alice");
    await user.click(screen.getByRole("button", { name: "Continue" }));

    await waitFor(() => {
      // Correct table and payload
      expect(mockFrom).toHaveBeenCalledWith("profiles");
      expect(mockUpdate).toHaveBeenCalledWith({ username: "alice" });
      expect(mockEq).toHaveBeenCalledWith("id", "user-1");
      // Profile is refreshed
      expect(refreshProfile).toHaveBeenCalled();
      // Step advances to workspace
      expect(screen.getByText("Name your workspace")).toBeInTheDocument();
    });
  });

  it("shows a validation error for an invalid username", async () => {
    const user = userEvent.setup();

    render(<OnboardingFlow {...BASE_PROPS} />);

    // "ab" is only 2 characters — fails the 3–32 rule
    await user.type(screen.getByPlaceholderText("username"), "ab");
    await user.click(screen.getByRole("button", { name: "Continue" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Username must be 3–32 characters"
      );
    });
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  // ── Test 5b ────────────────────────────────────────────────────────────────
  it("saves the workspace name to user metadata and advances to the theme step", async () => {
    const user = userEvent.setup();
    mockUpdateUser.mockResolvedValue({ error: null });

    render(
      <OnboardingFlow
        {...BASE_PROPS}
        initialStep={1}
        initialUsername="alice"
        refreshProfile={jest.fn()}
      />
    );

    expect(screen.getByText("Name your workspace")).toBeInTheDocument();

    await user.type(
      screen.getByPlaceholderText("My workspace"),
      "Acme Corp"
    );
    await user.click(screen.getByRole("button", { name: "Continue" }));

    await waitFor(() => {
      expect(mockUpdateUser).toHaveBeenCalledWith({
        data: { pending_workspace_name: "Acme Corp" },
      });
      expect(screen.getByText("Choose a theme")).toBeInTheDocument();
    });
  });

  it("shows a validation error when the workspace name is too short", async () => {
    const user = userEvent.setup();

    render(
      <OnboardingFlow
        {...BASE_PROPS}
        initialStep={1}
        initialUsername="alice"
        refreshProfile={jest.fn()}
      />
    );

    // Single character — below the 2-char minimum
    await user.type(screen.getByPlaceholderText("My workspace"), "X");
    await user.click(screen.getByRole("button", { name: "Continue" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Workspace name should be between 2 and 64 characters"
      );
    });
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });

  // Note: window.location.assign is non-configurable in jsdom 26 so we verify
  // the workspace creation call and user-metadata update instead of the
  // actual navigation URL.
  it("creates the workspace and marks onboarding complete on finish", async () => {
    const user = userEvent.setup();
    mockUpdateUser.mockResolvedValue({ error: null });
    mockCreateWorkspace.mockResolvedValue({ slug: "acme-corp" });

    render(
      <OnboardingFlow
        {...BASE_PROPS}
        initialStep={2}
        initialUsername="alice"
        initialWorkspace="Acme Corp"
        refreshProfile={jest.fn()}
      />
    );

    expect(screen.getByText("Choose a theme")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Finish" }));

    await waitFor(() => {
      expect(mockCreateWorkspace).toHaveBeenCalled();
      // Onboarding metadata is persisted before navigation
      expect(mockUpdateUser).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ onboarding_completed: true }),
        })
      );
    });
  });
});
