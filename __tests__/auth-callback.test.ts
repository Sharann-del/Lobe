/**
 * @jest-environment node
 *
 * Route handlers use Web API globals (Request, Response) available in Node 18+.
 */
import { GET } from "@/app/auth/callback/route";

// ── next/server ──────────────────────────────────────────────────────────────
const mockRedirect = jest.fn((url: string) => ({ url }));

jest.mock("next/server", () => ({
  NextResponse: {
    redirect: (url: string) => mockRedirect(url),
  },
}));

// ── @/lib/supabase/server ─────────────────────────────────────────────────────
const mockExchangeCode = jest.fn();

jest.mock("@/lib/supabase/server", () => ({
  createClient: () => ({
    auth: { exchangeCodeForSession: mockExchangeCode },
  }),
}));

// ── Helpers ──────────────────────────────────────────────────────────────────
function makeRequest(params: Record<string, string>) {
  const url = new URL("http://localhost/auth/callback");
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return new Request(url.toString());
}

// ── Suite ────────────────────────────────────────────────────────────────────
describe("GET /auth/callback", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Part of test 3: redirects correctly after email-link confirmation
  it("exchanges the code and redirects to the next path on success", async () => {
    mockExchangeCode.mockResolvedValue({ error: null });

    await GET(makeRequest({ code: "valid-code-123", next: "/onboarding" }));

    expect(mockExchangeCode).toHaveBeenCalledWith("valid-code-123");
    expect(mockRedirect).toHaveBeenCalledWith(
      "http://localhost/onboarding"
    );
  });

  it("redirects to /login?error=auth when no code is present", async () => {
    await GET(makeRequest({}));

    expect(mockExchangeCode).not.toHaveBeenCalled();
    expect(mockRedirect).toHaveBeenCalledWith(
      "http://localhost/login?error=auth"
    );
  });

  it("redirects to /login?error=auth when code exchange fails", async () => {
    mockExchangeCode.mockResolvedValue({ error: { message: "invalid code" } });

    await GET(makeRequest({ code: "bad-code" }));

    expect(mockRedirect).toHaveBeenCalledWith(
      "http://localhost/login?error=auth"
    );
  });

  it("falls back to '/' when the next param is missing", async () => {
    mockExchangeCode.mockResolvedValue({ error: null });

    await GET(makeRequest({ code: "valid-code-123" }));

    expect(mockRedirect).toHaveBeenCalledWith("http://localhost/");
  });

  it("ignores unsafe next params and falls back to '/'", async () => {
    mockExchangeCode.mockResolvedValue({ error: null });

    await GET(
      makeRequest({ code: "valid-code-123", next: "//evil.com/steal" })
    );

    expect(mockRedirect).toHaveBeenCalledWith("http://localhost/");
  });
});
