"use client";

import { useCallback, useEffect, useState } from "react";

type AuthState = {
  user: string | null;
  loading: boolean;
};

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
  });

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/me", { cache: "no-store" });
      if (!response.ok) throw new Error("unauthorized");
      const data = (await response.json()) as { user?: string };
      setState({ user: data.user ?? null, loading: false });
    } catch {
      setState({ user: null, loading: false });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }, []);

  return {
    user: state.user,
    loading: state.loading,
    refresh: load,
    logout,
  };
}
