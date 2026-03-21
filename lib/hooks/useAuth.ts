"use client";

import type { AuthError } from "@supabase/supabase-js";
import { useCallback } from "react";
import { getAuthCallbackUrl } from "@/lib/auth/redirects";
import { createClient } from "@/lib/supabase/client";

export type AuthActionResult = {
  error: AuthError | null;
};

export type SignUpResult = AuthActionResult & {
  needsEmailConfirmation: boolean;
};

export interface UseAuthReturn {
  signInWithPassword(
    email: string,
    password: string
  ): Promise<AuthActionResult>;
  signInWithMagicLink(email: string): Promise<AuthActionResult>;
  signUp(
    email: string,
    password: string,
    fullName: string
  ): Promise<SignUpResult>;
  signOut(): Promise<AuthActionResult>;
  resetPassword(email: string): Promise<AuthActionResult>;
}

export function useAuth(): UseAuthReturn {
  const signInWithPassword = useCallback(
    async (email: string, password: string): Promise<AuthActionResult> => {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    },
    []
  );

  const signInWithMagicLink = useCallback(
    async (email: string): Promise<AuthActionResult> => {
      const supabase = createClient();
      const origin =
        typeof window !== "undefined" ? window.location.origin : "";
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: getAuthCallbackUrl(origin, "/onboarding"),
        },
      });
      return { error };
    },
    []
  );

  const signUp = useCallback(
    async (
      email: string,
      password: string,
      fullName: string
    ): Promise<SignUpResult> => {
      const supabase = createClient();
      const origin =
        typeof window !== "undefined" ? window.location.origin : "";
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: getAuthCallbackUrl(origin, "/onboarding"),
        },
      });
      const needsEmailConfirmation =
        !error && Boolean(data.user) && !data.session;
      return { error, needsEmailConfirmation };
    },
    []
  );

  const signOut = useCallback(async (): Promise<AuthActionResult> => {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();
    return { error };
  }, []);

  const resetPassword = useCallback(
    async (email: string): Promise<AuthActionResult> => {
      const supabase = createClient();
      const origin =
        typeof window !== "undefined" ? window.location.origin : "";
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: getAuthCallbackUrl(origin, "/login"),
      });
      return { error };
    },
    []
  );

  return {
    signInWithPassword,
    signInWithMagicLink,
    signUp,
    signOut,
    resetPassword,
  };
}
