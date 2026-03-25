"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useStore";
import TopItems from "@/components/TopItems";
import FeaturesSection from "@/components/FeaturesSection";
import AppDownloadSection from "@/components/AppDownloadSection";
import HeroSection2 from "@/components/HeroSection2";

import { useLocale } from 'next-intl';

export default function HomePage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const locale = useLocale();

  useEffect(() => {
    if (typeof window !== 'undefined' && locale) {
      localStorage.setItem('NEXT_LOCALE', locale);
    }
  }, [locale]);

  useEffect(() => {
    // Check for password reset hash fragments
    if (typeof window !== "undefined") {
      const hash = window.location.hash;
      if (hash) {
        const hashParams = new URLSearchParams(hash.replace("#", ""));
        const accessToken = hashParams.get("access_token");
        const type = hashParams.get("type");

        if (accessToken && type === "recovery") {
          router.replace(`/auth/reset-password${hash}`);
          return;
        }
      }
    }

    // Redirect vendor and super_admin users
    if (isAuthenticated && user && user.role) {
      if (user.role === "VENDOR") {
        router.replace("/dashboard/restaurants");
      } else if (user.role === "SUPER_ADMIN") {
        router.replace("/dashboard");
      }
    }
  }, [user, isAuthenticated, router]);

  return (
    <div className="bg-white">
      <HeroSection2 />
      <TopItems />
      <FeaturesSection />
      <AppDownloadSection />
    </div>
  );
}
