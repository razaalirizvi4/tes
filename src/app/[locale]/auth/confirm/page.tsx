"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<string>("Verifying...");

  useEffect(() => {
    async function handleAuthRedirect() {
      if (typeof window !== "undefined") {
        // Check for token-based email confirmation (from Mailjet)
        const token = searchParams?.get("token");

        if (token) {
          setStatus("Confirming your email...");
          try {
            const response = await fetch(`/api/confirm-email?token=${encodeURIComponent(token)}`);
            const data = await response.json();

            if (response.ok && data.success) {
              // toast.success(data.message || "Email confirmed successfully!");
              setStatus(
                data.redirectTo === "/pending-approval"
                  ? "Email confirmed! Redirecting..."
                  : "Email confirmed! Redirecting to login..."
              );
              // Clean URL
              window.history.replaceState(null, "", window.location.pathname);
              // Clear any pending verification email from localStorage
              if (typeof window !== "undefined") {
                localStorage.removeItem("pendingVerificationEmail");
              }
              // Redirect based on user role
              const redirectPath = data.redirectTo || "/auth/login";
              setTimeout(() => {
                router.push(redirectPath);
              }, 2000);
              return;
            } else {
              // toast.error(data.error || "Failed to confirm email.");
              setStatus("Confirmation failed. Redirecting...");
              setTimeout(() => {
                router.push("/auth/login");
              }, 3000);
              return;
            }
          } catch (error) {
            console.error("Email confirmation error:", error);
            toast.error("An error occurred while confirming your email.");
            setStatus("Error occurred. Redirecting...");
            setTimeout(() => {
              router.push("/auth/login");
            }, 3000);
            return;
          }
        }

        // Handle Supabase OAuth callback (existing functionality)
        const hash = window.location.hash;
        const params = new URLSearchParams(hash.replace("#", "?"));

        const access_token = params.get("access_token");
        const refresh_token = params.get("refresh_token");

        if (access_token && refresh_token) {
          setStatus("Setting up your session...");
          // Set the session in Supabase
          await supabase.auth.setSession({
            access_token,
            refresh_token,
          });

          // 🔹 Clean URL (Remove tokens)
          window.history.replaceState(null, "", window.location.pathname);

          // Redirect after login
          router.push("/");
        } else {
          // No token and no OAuth tokens - redirect to login
          // setStatus("No confirmation found. Redirecting...");
          setTimeout(() => {
            router.push("/auth/login");
          }, 2000);
        }
      }
    }

    handleAuthRedirect();
  }, [router, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mb-4">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
        </div>
        <p className="text-gray-600">{status}</p>
      </div>
    </div>
  );
}

export default function AuthCallback() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          </div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}
