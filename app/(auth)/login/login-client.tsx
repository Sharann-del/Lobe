"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AuthForm } from "@/components/auth/AuthForm";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { isOnboardingComplete } from "@/lib/auth/onboarding";
import { safeAuthNextParam } from "@/lib/auth/redirects";
import { useAuth, useUser } from "@/lib/hooks";

export function LoginClient() {
  const router = useRouter();
  const { signInWithPassword, signInWithMagicLink, resetPassword } = useAuth();
  const { user, profile, loading, refreshProfile } = useUser();
  const profileRefreshAttempted = useRef(false);

  const [mode, setMode] = useState<"password" | "magic">("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [resetEmail, setResetEmail] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("error") === "auth") {
      setError("Something went wrong signing you in. Try again.");
    }
  }, []);

  useEffect(() => {
    if (loading || !user) {
      profileRefreshAttempted.current = false;
      return;
    }

    const next = safeAuthNextParam(
      new URLSearchParams(window.location.search).get("next")
    );

    if (isOnboardingComplete(profile, user.user_metadata)) {
      /* Full navigation so `app/page.tsx` runs on the server and can redirect to the workspace. */
      window.location.assign(next);
      return;
    }

    if (profile === null && !profileRefreshAttempted.current) {
      profileRefreshAttempted.current = true;
      void refreshProfile();
      return;
    }

    router.replace("/onboarding");
  }, [loading, user, profile, router, refreshProfile]);

  const handlePasswordLogin = useCallback(async () => {
    setError(null);
    setMessage(null);
    setPending(true);
    const { error: err } = await signInWithPassword(email, password);
    setPending(false);
    if (err) {
      setError(err.message);
      return;
    }

    const supabase = createClient();
    const {
      data: { user: signedIn },
    } = await supabase.auth.getUser();
    const row = await refreshProfile();

    const next = safeAuthNextParam(
      new URLSearchParams(window.location.search).get("next")
    );

    if (isOnboardingComplete(row, signedIn?.user_metadata ?? {})) {
      window.location.assign(next);
    } else {
      router.replace("/onboarding");
    }
  }, [email, password, signInWithPassword, router, refreshProfile]);

  const handleMagicLink = useCallback(async () => {
    setError(null);
    setMessage(null);
    setPending(true);
    const { error: err } = await signInWithMagicLink(email);
    setPending(false);
    if (err) {
      setError(err.message);
      return;
    }
    setMessage("Check your email for a sign-in link.");
  }, [email, signInWithMagicLink]);

  const handleReset = useCallback(async () => {
    setError(null);
    setMessage(null);
    setPending(true);
    const { error: err } = await resetPassword(resetEmail || email);
    setPending(false);
    if (err) {
      setError(err.message);
      return;
    }
    setMessage("If an account exists, we sent a reset link.");
    setShowForgot(false);
  }, [resetPassword, resetEmail, email]);

  if (loading) {
    return (
      <p
        className="text-sm text-[var(--text-secondary)]"
        style={{ fontSize: "0.875rem", color: "#888888" }}
      >
        Loading…
      </p>
    );
  }

  if (user) {
    return (
      <p className="text-sm text-[var(--text-secondary)]">Redirecting…</p>
    );
  }

  return (
    <AuthForm
      title="Sign in"
      description="Welcome back to Lobe."
      footer={
        <p className="text-center text-sm text-[var(--text-secondary)]">
          No account?{" "}
          <Link
            href="/signup"
            className="text-[var(--text-primary)] underline-offset-2 hover:underline"
          >
            Sign up
          </Link>
        </p>
      }
    >
      <div className="flex rounded-[var(--radius-sm)] border border-[var(--border-default)] p-0.5">
        <button
          type="button"
          onClick={() => {
            setMode("password");
            setError(null);
            setMessage(null);
          }}
          className={`flex-1 rounded-[3px] py-1.5 text-xs font-medium transition-colors duration-fast ${
            mode === "password"
              ? "bg-[var(--bg-3)] text-[var(--text-primary)]"
              : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
          }`}
        >
          Password
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("magic");
            setError(null);
            setMessage(null);
          }}
          className={`flex-1 rounded-[3px] py-1.5 text-xs font-medium transition-colors duration-fast ${
            mode === "magic"
              ? "bg-[var(--bg-3)] text-[var(--text-primary)]"
              : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
          }`}
        >
          Magic link
        </button>
      </div>

      <Input
        type="email"
        autoComplete="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      {mode === "password" ? (
        <Input
          type="password"
          autoComplete="current-password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      ) : null}

      {error ? (
        <p
          className="text-sm text-[var(--color-red)]"
          role="alert"
        >
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="text-sm text-[var(--text-secondary)]">{message}</p>
      ) : null}

      {mode === "password" ? (
        <>
          <Button
            type="button"
            className="w-full"
            disabled={pending}
            onClick={() => void handlePasswordLogin()}
          >
            Sign in
          </Button>
          <button
            type="button"
            onClick={() => {
              setShowForgot((v) => !v);
              setResetEmail(email);
            }}
            className="w-full text-left text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
          >
            Forgot password?
          </button>
          {showForgot ? (
            <div className="space-y-2 border-t border-[var(--border-subtle)] pt-4">
              <Input
                type="email"
                placeholder="Email for reset"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
              />
              <Button
                type="button"
                variant="outline"
                className="w-full"
                size="sm"
                disabled={pending}
                onClick={() => void handleReset()}
              >
                Send reset link
              </Button>
            </div>
          ) : null}
        </>
      ) : (
        <Button
          type="button"
          className="w-full"
          disabled={pending}
          onClick={() => void handleMagicLink()}
        >
          Email me a link
        </Button>
      )}
    </AuthForm>
  );
}
