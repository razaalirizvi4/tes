"use client";
import { useEffect } from "react";
import { useRouter } from "@/i18n/navigation";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/useStore";
import { useTranslations } from "next-intl";

export default function AuthCallback() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const tMessages = useTranslations("messages");

  useEffect(() => {
    const handleCallback = async () => {
      const hash = window.location.hash;
      if (hash) {
        const params = new URLSearchParams(hash.replace("#", ""));
        const access_token = params.get("access_token");
        const refresh_token = params.get("refresh_token");

        if (access_token && refresh_token) {
          try {
            const response = await fetch("/api/callback", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ access_token, refresh_token }),
            });

            if (!response.ok) {
              throw new Error("Failed to authenticate user");
            }

            const res = await response.json();
            await supabase.auth.setSession({ access_token, refresh_token });

            setUser({
              id: res.user.id,
              email: res.user.email,
              name: res.user.name,
              role: res.user.role,
              approvalStatus: res.approvalStatus,
              avatarUrl: res.user?.avatarUrl || null,
              createdAt: new Date(res.user?.createdAt),
              updatedAt: new Date(res.user?.updatedAt),
              addresses: [],
              orders: [],
            });

            // Redirect based on user role
            const userRole = res.user.role;
            if (userRole === 'SUPER_ADMIN') {
              router.push("/dashboard");
            } else if (userRole === 'VENDOR') {
              router.push("/dashboard/restaurants");
            } else {
              // For other roles (CUSTOMER, DRIVER, etc.), redirect to home
              router.push("/");
            }
          } catch (error) {
            console.error("Error handling callback:", error);
            router.push("/auth/login?error=callback");
          }
        }
      }
    };

    handleCallback();
  }, [router, setUser]);
  return <div>{tMessages("loading")}</div>;
}
