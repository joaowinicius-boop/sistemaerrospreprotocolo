import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

interface AuthState {
  user: User | null;
  profile: { display_name: string; email: string } | null;
  isAdmin: boolean;
  loading: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    isAdmin: false,
    loading: true,
  });

  const fetchUserData = useCallback(async (user: User) => {
    const [{ data: profile }, { data: roles }] = await Promise.all([
      supabase.from("profiles").select("display_name, email").eq("user_id", user.id).single(),
      supabase.from("user_roles").select("role").eq("user_id", user.id),
    ]);
    const isAdmin = (roles ?? []).some((r: { role: string }) => r.role === "admin");
    setState({
      user,
      profile: profile ?? { display_name: user.email?.split("@")[0] ?? "", email: user.email ?? "" },
      isAdmin,
      loading: false,
    });
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchUserData(session.user);
      } else {
        setState({ user: null, profile: null, isAdmin: false, loading: false });
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchUserData(session.user);
      } else {
        setState((s) => ({ ...s, loading: false }));
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchUserData]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return { ...state, signOut };
}
