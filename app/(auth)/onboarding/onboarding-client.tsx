"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { OnboardingFlow } from "@/components/auth/OnboardingFlow";
import { Spinner } from "@/components/ui/Spinner";
import {
  getInitialOnboardingStep,
  isOnboardingComplete,
  parseThemePreference,
} from "@/lib/auth/onboarding";
import {
  createWorkspaceWithUniqueSlug,
  slugifyWorkspaceName,
} from "@/lib/auth/workspace-slug";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/lib/hooks";

export function OnboardingClient() {
  const router = useRouter();
  const { user, profile, loading, refreshProfile } = useUser();
  const [codeForwarding, setCodeForwarding] = useState(false);

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("code");
    if (!code) {
      return;
    }
    setCodeForwarding(true);
    const url = new URL("/auth/callback", window.location.origin);
    url.searchParams.set("code", code);
    url.searchParams.set("next", "/onboarding");
    window.location.replace(url.toString());
  }, []);

  useEffect(() => {
    if (loading || codeForwarding) {
      return;
    }
    if (!user) {
      router.replace("/login");
      return;
    }
    if (!isOnboardingComplete(profile, user.user_metadata)) {
      return;
    }

    let cancelled = false;
    const go = async (): Promise<void> => {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("get_user_workspaces", {
        _user_id: user.id,
      });
      if (cancelled) {
        return;
      }
      if (error) {
        console.error("onboarding redirect: get_user_workspaces", error.message);
        router.replace("/");
        return;
      }
      const rows = (data ?? []) as { slug?: string }[];
      const slug = rows[0]?.slug;
      if (!slug) {
        const pending =
          typeof user.user_metadata.pending_workspace_name === "string"
            ? user.user_metadata.pending_workspace_name.trim()
            : "";
        if (pending.length >= 2) {
          const created = await createWorkspaceWithUniqueSlug(supabase, {
            name: pending,
            baseSlug: slugifyWorkspaceName(pending),
            userId: user.id,
          });
          if (!cancelled && "slug" in created) {
            window.location.replace(`/${created.slug}`);
            return;
          }
        }
        router.replace("/");
        return;
      }
      window.location.replace(`/${slug}`);
    };
    void go();
    return () => {
      cancelled = true;
    };
  }, [loading, codeForwarding, user, profile, router]);

  if (codeForwarding) {
    return (
      <div
        className="flex items-center gap-2 text-sm text-[var(--text-secondary)]"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          fontSize: "0.875rem",
          color: "#888888",
        }}
      >
        <Spinner size={18} />
        Completing sign-in…
      </div>
    );
  }

  if (loading) {
    return (
      <div
        className="flex items-center gap-2 text-sm text-[var(--text-secondary)]"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          fontSize: "0.875rem",
          color: "#888888",
        }}
      >
        <Spinner size={18} />
        Loading…
      </div>
    );
  }

  if (!user) {
    return (
      <div
        className="flex items-center gap-2 text-sm text-[var(--text-secondary)]"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          fontSize: "0.875rem",
          color: "#888888",
        }}
      >
        <Spinner size={18} />
        Redirecting to sign in…
      </div>
    );
  }

  if (isOnboardingComplete(profile, user.user_metadata)) {
    return null;
  }

  const meta = user.user_metadata;
  const initialWorkspace =
    typeof meta.pending_workspace_name === "string"
      ? meta.pending_workspace_name
      : "";

  return (
    <OnboardingFlow
      userId={user.id}
      initialStep={getInitialOnboardingStep(profile, meta)}
      initialUsername={profile?.username ?? ""}
      initialWorkspace={initialWorkspace}
      initialTheme={parseThemePreference(meta.theme_preference)}
      refreshProfile={refreshProfile}
    />
  );
}
