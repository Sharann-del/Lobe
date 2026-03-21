import { type NextRequest } from "next/server";
import { redirectOAuthCodeToCallback } from "@/lib/auth/middleware-code-redirect";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const codeRedirect = redirectOAuthCodeToCallback(request);
  if (codeRedirect) {
    return codeRedirect;
  }
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Never run auth middleware on Next internals (chunks, HMR, RSC, fonts from /_next).
     * Running on those paths can break dev refresh and cause unstyled HTML.
     */
    "/((?!_next/|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)",
  ],
};
