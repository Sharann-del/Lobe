/**
 * OAuth / magic-link callback must only redirect to same-origin paths.
 */
export function safeAuthNextParam(next: string | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/";
  }
  return next;
}

export function getAuthCallbackUrl(origin: string, nextPath: string): string {
  const url = new URL("/auth/callback", origin);
  url.searchParams.set("next", safeAuthNextParam(nextPath));
  return url.toString();
}

/**
 * Where to send the user after OAuth/email `code` exchange.
 * Prefer explicit `next` query when present and safe; otherwise use pathname,
 * treating `/` as onboarding (common after email confirmation to Site URL).
 */
export function resolvePostAuthNext(
  pathname: string,
  explicitNext: string | null
): string {
  if (explicitNext) {
    return safeAuthNextParam(explicitNext);
  }
  if (pathname === "/" || pathname === "") {
    return "/onboarding";
  }
  return pathname;
}
