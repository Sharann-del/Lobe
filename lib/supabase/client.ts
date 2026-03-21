"use client";

import { createBrowserClient } from "@supabase/ssr";
import { env } from "@/lib/env";

/**
 * Untyped client: strict `Database` gen against `@supabase/supabase-js` v2.99
 * currently resolves `Schema` to `never` for this project’s hand-written types.
 * Re-enable `<Database>` after regenerating types from Supabase CLI.
 */
export function createClient() {
  return createBrowserClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
