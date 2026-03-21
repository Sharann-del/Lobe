"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { AuthForm } from "@/components/auth/AuthForm";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { isOnboardingComplete } from "@/lib/auth/onboarding";
import { safeAuthNextParam } from "@/lib/auth/redirects";
import { useAuth, useUser } from "@/lib/hooks";

export function SignupClient() {
  const router = useRouter();
  const { signUp } = useAuth();
  const { user, profile, loading, refreshProfile } = useUser();
  const profileRefreshAttempted = useRef(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (loading || !user) {
      profileRefreshAttempted.current = false;
      return;
    }

    const next = safeAuthNextParam(
      new URLSearchParams(window.location.search).get("next")
    );

    if (isOnboardingComplete(profile, user.user_metadata)) {
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

  const handleSignup = useCallback(async () => {
    setError(null);
    setMessage(null);
    setPending(true);
    const { error: err, needsEmailConfirmation } = await signUp(
      email,
      password,
      fullName
    );
    setPending(false);
    if (err) {
      setError(err.message);
      return;
    }
    if (needsEmailConfirmation) {
      setMessage(
        "Check your email to confirm your account, then sign in to continue."
      );
      return;
    }
    router.refresh();
    router.push("/onboarding");
  }, [email, password, fullName, signUp, router]);

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
      title="Create account"
      description="Start building your second brain."
      footer={
        <p className="text-center text-sm text-[var(--text-secondary)]">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-[var(--text-primary)] underline-offset-2 hover:underline"
          >
            Sign in
          </Link>
        </p>
      }
    >
      <Input
        autoComplete="name"
        placeholder="Full name"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
      />
      <Input
        type="email"
        autoComplete="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <Input
        type="password"
        autoComplete="new-password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      {error ? (
        <p className="text-sm text-[var(--color-red)]" role="alert">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="text-sm text-[var(--text-secondary)]">{message}</p>
      ) : null}

      <Button
        type="button"
        className="w-full"
        disabled={pending || Boolean(message)}
        onClick={() => void handleSignup()}
      >
        Sign up
      </Button>
    </AuthForm>
  );
}
