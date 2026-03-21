"use client";

import type { Session, User } from "@supabase/supabase-js";
import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types/database.types";

export interface UseUserResult {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  /** Re-fetches profile for the current session user; returns the row (or null). */
  refreshProfile: () => Promise<Profile | null>;
}

async function fetchProfileRow(userId: string): Promise<Profile | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("useUser: profile fetch error", error.message);
    return null;
  }
  return data;
}

const PROFILE_RETRY_MS = 400;
const LOADING_STUCK_MS = 12_000;

export function useUser(): UseUserResult {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async (): Promise<Profile | null> => {
    try {
      const supabase = createClient();
      const {
        data: { user: current },
      } = await supabase.auth.getUser();
      if (!current) {
        setProfile(null);
        return null;
      }
      let row = await fetchProfileRow(current.id);
      if (!row) {
        await new Promise((r) => setTimeout(r, PROFILE_RETRY_MS));
        row = await fetchProfileRow(current.id);
      }
      setProfile(row);
      return row;
    } catch (e) {
      console.error("useUser: refreshProfile failed", e);
      setProfile(null);
      return null;
    }
  }, []);

  useEffect(() => {
    const ac = new AbortController();
    const supabase = createClient();

    function applySession(session: Session | null): void {
      if (ac.signal.aborted) return;
      const nextUser = session?.user ?? null;
      setUser(nextUser);
      if (!nextUser) {
        setProfile(null);
        return;
      }
      void (async () => {
        let row = await fetchProfileRow(nextUser.id);
        if (!row) {
          await new Promise((r) => setTimeout(r, PROFILE_RETRY_MS));
          row = await fetchProfileRow(nextUser.id);
        }
        if (!ac.signal.aborted) setProfile(row);
      })();
    }

    setLoading(true);

    const stuckTimer = setTimeout(() => {
      if (!ac.signal.aborted) {
        setLoading(false);
      }
    }, LOADING_STUCK_MS);

    void (async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (ac.signal.aborted) return;
        applySession(session);
      } catch (e) {
        console.error("useUser: getSession failed", e);
        if (!ac.signal.aborted) {
          setUser(null);
          setProfile(null);
        }
      } finally {
        clearTimeout(stuckTimer);
        if (!ac.signal.aborted) {
          setLoading(false);
        }
      }
    })();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (ac.signal.aborted) return;
      applySession(session);
    });

    return () => {
      ac.abort();
      clearTimeout(stuckTimer);
      subscription.unsubscribe();
    };
  }, []);

  return { user, profile, loading, refreshProfile };
}
