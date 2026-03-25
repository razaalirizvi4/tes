"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/Footer";
import { ReactNode } from "react";

export function LayoutClient({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  // Check for locale-based landing pages (e.g., /en, /ru, /tr, /az, /ar)
  const isLandingPage = pathname === "/" || pathname === "" || pathname.match(/^\/(en|ru|tr|az|ar)$/) !== null;
  const isDashboardPage = pathname.startsWith("/dashboard");

  return (
    <>
      {!isLandingPage && <Header />}
      <main className="flex-1">{children}</main>
      {!isDashboardPage && <Footer />}
    </>
  );
}
