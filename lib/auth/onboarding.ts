import type { User } from "@supabase/supabase-js";
import type { Profile } from "@/lib/types/database.types";

export type ThemeChoice = "dark" | "light" | "system";

export function parseThemePreference(value: unknown): ThemeChoice {
  if (value === "light" || value === "dark" || value === "system") {
    return value;
  }
  return "dark";
}

export function getInitialOnboardingStep(
  profile: Profile | null,
  metadata: User["user_metadata"]
): number {
  if (!profile?.username) {
    return 0;
  }
  const ws = metadata?.pending_workspace_name;
  if (typeof ws !== "string" || !ws.trim()) {
    return 1;
  }
  return 2;
}

export function isOnboardingComplete(
  profile: Profile | null,
  metadata: User["user_metadata"]
): boolean {
  return (
    !!profile?.username && metadata?.onboarding_completed === true
  );
}
