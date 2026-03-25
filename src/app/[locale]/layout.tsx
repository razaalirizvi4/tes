import { AuthProvider } from "@/components/providers/AuthProvider";
import { isRTL, type Locale } from "@/i18n/config";
import { routing } from "@/i18n/routing";
import { Analytics } from "@vercel/analytics/next";
import type { Metadata } from "next";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { Inter } from "next/font/google";
import { notFound } from "next/navigation";
import { Toaster } from "react-hot-toast";
import { LayoutClient } from "./layout-client";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "FoodApp - Order Delicious Food Online",
  description: "Fast and reliable food delivery service",
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const dir = isRTL(locale as Locale) ? "rtl" : "ltr";

  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      <AuthProvider>
        <div className={`${inter.variable} font-sans antialiased`} dir={dir} data-locale={locale}>
          <Toaster position="top-center" />
          <div className="min-h-screen flex flex-col">
            <LayoutClient>{children}</LayoutClient>
            <Analytics />
          </div>
        </div>
      </AuthProvider>
    </NextIntlClientProvider>
  );
}
