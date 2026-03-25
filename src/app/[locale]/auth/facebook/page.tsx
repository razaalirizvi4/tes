"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

const FacebookCallbackContent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    // Extract query parameters
    const error = searchParams?.get("error");
    const access_token = searchParams?.get("access_token");
    const user_id = searchParams?.get("user_id");

    // Handle error from Facebook login
    if (error) {
      console.error("Facebook login error:", error);
      return;
    }

    // Process access_token and user_id
    if (access_token) {
      console.log("Facebook access token:", access_token);
      console.log("User ID:", user_id);

      // Save token to localStorage
      localStorage.setItem("facebook_access_token", access_token);

      // Redirect user to the dashboard
      router.push("/dashboard");
    }
  }, [searchParams, router]);

  return (
    <div>
      <h2>Logging you in...</h2>
    </div>
  );
};

const FacebookCallback = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <FacebookCallbackContent />
    </Suspense>
  );
};

export default FacebookCallback;