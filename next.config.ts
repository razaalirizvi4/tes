import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  reactStrictMode: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "fvgzojsefkkerdlrvuuu.supabase.co", // Your actual Supabase domain
        port: "",
        pathname: "/storage/v1/object/public/restaurent-cover/**",
      },
      {
        protocol: "https",
        hostname: "fvgzojsefkkerdlrvuuu.supabase.co", // Your actual Supabase domain
        port: "",
        pathname: "/storage/v1/object/public/menu-images/**",
      },
      {
        protocol: "https",
        hostname: "scjgzyihzhgjcwofphbr.supabase.co", // Supabase domain for restaurant cover images
        port: "",
        pathname: "/storage/v1/object/public/restaurent-cover/**", // Correct pattern for restaurant cover images in Supabase
      },

      {
        protocol: "https",
        hostname: "scjgzyihzhgjcwofphbr.supabase.co", // Supabase domain for restaurant cover images
        port: "",
        pathname: "/storage/v1/object/public/menu-images/**", // Correct pattern for restaurant cover images in Supabase
      },

      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "ui-avatars.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "source.unsplash.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "em-cdn.eatmubarak.pk",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "via.placeholder.com", // Add placeholder domain here
        port: "",
        pathname: "/**", // Allow any path under this domain
      },
      {
        protocol: "https",
        hostname: "cdn.squaremeal.co.uk",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "www.tntmagazine.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "encrypted-tbn0.gstatic.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "dynamic-media-cdn.tripadvisor.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "pepenerorestaurant.co.uk",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "media-cdn.tripadvisor.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.deliveryhero.io",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default withNextIntl(nextConfig);
