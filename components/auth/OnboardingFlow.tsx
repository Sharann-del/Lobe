"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { ThemeChoice } from "@/lib/auth/onboarding";
import {
  createWorkspaceWithUniqueSlug,
  slugifyWorkspaceName,
} from "@/lib/auth/workspace-slug";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types/database.types";
import { cn } from "@/lib/utils";

const USERNAME_RE = /^[a-zA-Z0-9_]{3,32}$/;

function applyThemeClass(theme: ThemeChoice): void {
  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
    return;
  }
  if (theme === "light") {
    root.classList.remove("dark");
    return;
  }
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  root.classList.toggle("dark", prefersDark);
}

export interface OnboardingFlowProps {
  userId: string;
  initialStep: number;
  initialUsername: string;
  initialWorkspace: string;
  initialTheme: ThemeChoice;
  refreshProfile: () => Promise<Profile | null>;
  onComplete?: () => void;
  className?: string;
}

export function OnboardingFlow({
  userId,
  initialStep,
  initialUsername,
  initialWorkspace,
  initialTheme,
  refreshProfile,
  onComplete,
  className,
}: OnboardingFlowProps) {
  const [step, setStep] = useState(initialStep);
  const [username, setUsername] = useState(initialUsername);
  const [workspaceName, setWorkspaceName] = useState(initialWorkspace);
  const [theme, setTheme] = useState<ThemeChoice>(initialTheme);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setStep(initialStep);
  }, [initialStep]);

  useEffect(() => {
    applyThemeClass(theme);
  }, [theme]);

  const goNext = useCallback(() => {
    setError(null);
    setStep((s) => s + 1);
  }, []);

  const handleUsername = useCallback(async () => {
    setError(null);
    const trimmed = username.trim().toLowerCase();
    if (!USERNAME_RE.test(trimmed)) {
      setError(
        "Username must be 3–32 characters: letters, numbers, and underscores only."
      );
      return;
    }
    setPending(true);
    const supabase = createClient();
    const { error: upErr } = await supabase
      .from("profiles")
      .update({ username: trimmed })
      .eq("id", userId);
    setPending(false);
    if (upErr) {
      if (upErr.code === "23505") {
        setError("That username is already taken.");
      } else {
        setError(upErr.message);
      }
      return;
    }
    await refreshProfile();
    goNext();
  }, [username, userId, goNext, refreshProfile]);

  const handleWorkspace = useCallback(async () => {
    setError(null);
    const name = workspaceName.trim();
    if (name.length < 2 || name.length > 64) {
      setError("Workspace name should be between 2 and 64 characters.");
      return;
    }
    setPending(true);
    const supabase = createClient();
    const { error: metaErr } = await supabase.auth.updateUser({
      data: { pending_workspace_name: name },
    });
    setPending(false);
    if (metaErr) {
      setError(metaErr.message);
      return;
    }
    goNext();
  }, [workspaceName, goNext]);

  const finish = useCallback(async () => {
    setError(null);
    setPending(true);
    const supabase = createClient();
    applyThemeClass(theme);
    const name = workspaceName.trim();

    const created = await createWorkspaceWithUniqueSlug(supabase, {
      name,
      baseSlug: slugifyWorkspaceName(name),
      userId,
    });
    if ("error" in created) {
      setPending(false);
      setError(created.error);
      return;
    }

    const { error: metaErr } = await supabase.auth.updateUser({
      data: {
        pending_workspace_name: name,
        theme_preference: theme,
        onboarding_completed: true,
      },
    });
    setPending(false);
    if (metaErr) {
      setError(metaErr.message);
      return;
    }
    onComplete?.();
    // Full navigation so the next request carries a refreshed session cookie after
    // `updateUser` (router.push alone often lands on `/` with a stale server session).
    window.location.assign(`/${created.slug}`);
  }, [theme, workspaceName, userId, onComplete]);

  return (
    <div
      className={cn(
        "w-full max-w-[420px] rounded-[var(--radius-md)] border border-[var(--border-default)]",
        "bg-[var(--bg-1)] p-8 shadow-[var(--shadow-md)]",
        className
      )}
    >
      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-[var(--text-tertiary)]">
        Step {step + 1} of 3
      </p>
      <h1 className="text-lg font-semibold text-[var(--text-primary)]">
        {step === 0 && "Choose a username"}
        {step === 1 && "Name your workspace"}
        {step === 2 && "Choose a theme"}
      </h1>
      <p className="mt-1.5 text-sm text-[var(--text-secondary)]">
        {step === 0 && "This is how others will find you in Lobe."}
        {step === 1 && "This becomes your first workspace in Lobe."}
        {step === 2 && "You can change this later in settings."}
      </p>

      {error ? (
        <p
          className="mt-4 rounded-[var(--radius-sm)] border border-[var(--color-red)]/40 bg-[var(--color-red-muted)] px-3 py-2 text-sm text-[var(--color-red)]"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <div className="mt-6 space-y-4">
        {step === 0 ? (
          <>
            <Input
              autoComplete="username"
              placeholder="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <Button
              type="button"
              className="w-full"
              disabled={pending}
              onClick={() => void handleUsername()}
            >
              Continue
            </Button>
          </>
        ) : null}

        {step === 1 ? (
          <>
            <Input
              placeholder="My workspace"
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
            />
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                disabled={pending}
                onClick={() => setStep(0)}
              >
                Back
              </Button>
              <Button
                type="button"
                className="flex-1"
                disabled={pending}
                onClick={() => void handleWorkspace()}
              >
                Continue
              </Button>
            </div>
          </>
        ) : null}

        {step === 2 ? (
          <>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {(
                [
                  { id: "dark" as const, label: "Dark" },
                  { id: "light" as const, label: "Light" },
                  { id: "system" as const, label: "System" },
                ] as const
              ).map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTheme(id)}
                  className={cn(
                    "rounded-[var(--radius-sm)] border px-3 py-3 text-sm font-medium transition-colors duration-fast",
                    theme === id
                      ? "border-[var(--border-strong)] bg-[var(--bg-3)] text-[var(--text-primary)]"
                      : "border-[var(--border-default)] bg-[var(--bg-2)] text-[var(--text-secondary)] hover:bg-[var(--bg-3)]"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                disabled={pending}
                onClick={() => setStep(1)}
              >
                Back
              </Button>
              <Button
                type="button"
                className="flex-1"
                disabled={pending}
                onClick={() => void finish()}
              >
                Finish
              </Button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
