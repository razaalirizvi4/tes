import type { ReactNode } from "react";
import "./globals.css";

// Root layout must define <html> and <body>
// Locale-specific logic lives in [locale]/layout.tsx
export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
