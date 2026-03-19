import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

interface AuthState {
  user: User | null;
  profile: { display_name: string; email: string; active?: boolean } | null;
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
    // Buscar perfil existente — usa .limit(1) pra evitar erro se houver duplicatas residuais
    const { data: profiles } = await supabase
      .from("profiles")
      .select("display_name, email, active")
      .eq("user_id", user.id)
      .limit(1);

    let profile = profiles && profiles.length > 0 ? profiles[0] : null;

    // Se não encontrou perfil, cria usando upsert para evitar duplicatas
    if (!profile) {
      const display_name =
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email?.split("@")[0] ||
        "";
      await supabase.from("profiles").upsert(
        {
          user_id: user.id,
          email: user.email,
          display_name,
          active: false,
        },
        { onConflict: "user_id" }
      );
      // Upsert para user_roles também
      await supabase.from("user_roles").upsert(
        { user_id: user.id, role: "user" },
        { onConflict: "user_id" }
      );
      profile = { display_name, email: user.email ?? "", active: false };
    }

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const isAdminByRole = (roles ?? []).some((r: { role: string }) => r.role === "admin");
    // Fallback: check by email in case user_roles query fails or missing entry
    const ADMIN_EMAILS = ["joaowinicius@nicolasgomesadv.com.br", "joao.winicius@nicolasgomesadv.com.br"];
    const isAdminByEmail = ADMIN_EMAILS.includes((user.email || "").toLowerCase());
    const isAdmin = isAdminByRole || isAdminByEmail;
    setState({
      user,
      profile,
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
