import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Produces a slug valid for `create_workspace_with_owner` (lowercase, hyphens).
 */
export function slugifyWorkspaceName(raw: string): string {
  const s = raw
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  if (s.length === 0) {
    return "workspace";
  }
  return s;
}

function randomSuffix(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  for (let i = 0; i < 4; i += 1) {
    out += chars[Math.floor(Math.random() * chars.length)]!;
  }
  return out;
}

/**
 * Tries `baseSlug`, then `baseSlug-xxxx` if the RPC reports a unique violation.
 */
export async function createWorkspaceWithUniqueSlug(
  supabase: SupabaseClient,
  params: { name: string; baseSlug: string; userId: string }
): Promise<{ slug: string } | { error: string }> {
  const attempts = [params.baseSlug];
  for (let i = 0; i < 5; i += 1) {
    attempts.push(`${params.baseSlug}-${randomSuffix()}`);
  }
  const tried = new Set<string>();
  for (const slug of attempts) {
    if (tried.has(slug)) {
      continue;
    }
    tried.add(slug);
    const { data, error } = await supabase.rpc("create_workspace_with_owner", {
      p_name: params.name,
      p_slug: slug,
      p_user_id: params.userId,
    });
    if (!error && data != null) {
      const row = Array.isArray(data) ? data[0] : data;
      if (row && typeof row === "object" && "slug" in row) {
        return { slug: String((row as { slug: string }).slug) };
      }
    }
    const code = error?.code;
    const msg = error?.message ?? "";
    if (
      code === "23505" ||
      msg.toLowerCase().includes("duplicate") ||
      msg.toLowerCase().includes("unique")
    ) {
      continue;
    }
    return { error: msg || "Could not create workspace." };
  }
  return { error: "Could not find an available workspace URL. Try a different name." };
}
