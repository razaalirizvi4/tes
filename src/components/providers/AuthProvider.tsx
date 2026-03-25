"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/useStore";

const AUTH_STORAGE_KEY = "auth-storage";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const clearUser = useAuthStore((s) => s.clearUser);

  useEffect(() => {
    const clearAuthState = () => {
      clearUser();
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(AUTH_STORAGE_KEY);
      }
      useAuthStore.persist.clearStorage();
    };

    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        clearAuthState();
      }
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || session === null) {
        clearAuthState();
      }
    });

    return () => subscription.unsubscribe();
  }, [clearUser]);

  return <>{children}</>;
}
