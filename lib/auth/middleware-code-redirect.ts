import { NextResponse, type NextRequest } from "next/server";
import { resolvePostAuthNext } from "@/lib/auth/redirects";

/**
 * Email confirmation / OAuth sometimes lands on any allowed redirect URL with
 * `?code=`. Only `/auth/callback` exchanges it — forward so the session cookie is set.
 */
export function redirectOAuthCodeToCallback(
  request: NextRequest
): NextResponse | null {
  const url = request.nextUrl;
  if (url.pathname === "/auth/callback") {
    return null;
  }

  const code = url.searchParams.get("code");
  if (!code) {
    return null;
  }

  const next = resolvePostAuthNext(url.pathname, url.searchParams.get("next"));
  const callback = new URL("/auth/callback", url.origin);
  callback.searchParams.set("code", code);
  callback.searchParams.set("next", next);

  return NextResponse.redirect(callback);
}
