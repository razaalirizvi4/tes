import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

// Protected routes configuration (without locale prefix)
const protectedRoutes: Record<string, string[]> = {
  "/profile": ["CUSTOMER", "VENDOR", "DRIVER", "ADMIN", "SUPER_ADMIN"],
  "/orders": ["CUSTOMER", "VENDOR", "DRIVER", "ADMIN", "SUPER_ADMIN"],
  "/dashboard/restaurants": ["VENDOR", "ADMIN", "SUPER_ADMIN"],
  "/dashboard/menu": ["VENDOR", "ADMIN", "SUPER_ADMIN"],
  "/dashboard/orders": ["VENDOR", "ADMIN", "SUPER_ADMIN"],
  "/dashboard/deliveries": ["DRIVER", "ADMIN", "SUPER_ADMIN"],
  "/dashboard/earnings": ["DRIVER", "ADMIN", "SUPER_ADMIN"],
  "/dashboard/users": ["VENDOR", "ADMIN", "SUPER_ADMIN"],
  "/dashboard/drivers": ["ADMIN", "SUPER_ADMIN"],
  "/dashboard/Dispatch": ["VENDOR", "ADMIN", "SUPER_ADMIN"],
  "/dashboard/settings": ["SUPER_ADMIN"],
  "/dashboard": ["VENDOR", "SUPER_ADMIN", "ADMIN"],
};

const roleRedirectPaths: Record<string, string> = {
  CUSTOMER: "/restaurants",
  VENDOR: "/dashboard/restaurants",
  DRIVER: "/dashboard/deliveries",
  ADMIN: "/dashboard/Dispatch",
  SUPER_ADMIN: "/dashboard",
};

const handleI18nRouting = createIntlMiddleware(routing);

// Initialize Supabase client
const createSupabaseClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
};

// Strip locale prefix from path to get the "logical" path
function stripLocalePrefix(pathname: string): string {
  for (const locale of routing.locales) {
    if (pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)) {
      return pathname.slice(`/${locale}`.length) || "/";
    }
  }
  return pathname;
}

export async function middleware(request: NextRequest) {
  // First, run the i18n middleware to handle locale routing
  const intlResponse = handleI18nRouting(request);

  const pathname = request.nextUrl.pathname;
  const path = stripLocalePrefix(pathname);

  try {
    const token = request.cookies.get("sb-access-token")?.value;

    // Allow home page access
    if (path === "/") {
      if (token) {
        try {
          const supabase = createSupabaseClient();
          const {
            data: { user },
            error,
          } = await supabase.auth.getUser(token);

          if (error || !user) {
            intlResponse.cookies.delete("sb-access-token");
            return intlResponse;
          }
        } catch {
          intlResponse.cookies.delete("sb-access-token");
          return intlResponse;
        }
      }
      return intlResponse;
    }

    // Check dashboard routes
    const isDashboardRoute = path.startsWith("/dashboard");
    if (isDashboardRoute && !token) {
      return redirectToLogin(request, pathname);
    }

    // Check if path needs protection
    if (
      !Object.keys(protectedRoutes).some((route) => path.startsWith(route))
    ) {
      return intlResponse;
    }

    // Protected route - require token
    if (!token) {
      return redirectToLogin(request, pathname);
    }

    // Verify session and get user role
    const supabase = createSupabaseClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      return redirectToLogin(request, pathname);
    }

    // Get user details from database
    const baseUrl = request.nextUrl.origin;
    const userResponse = await fetch(`${baseUrl}/api/users/${user.id}`, {
      cache: "no-store",
    });
    
    if (!userResponse.ok) {
      return redirectToLogin(request, pathname);
    }
    
    const userData = await userResponse.json();

    if (!userData || !userData.role) {
      return redirectToLogin(request, pathname);
    }

    // Check if user has required role
    const requiredRoles = findRequiredRoles(path);
    if (!requiredRoles.includes(userData.role)) {
      // Extract locale from pathname to preserve user's language preference
      const locale = pathname.split('/')[1];
      const redirectPath = roleRedirectPaths[userData.role] || "/restaurants";
      const fullRedirectPath = ['en', 'ru', 'tr', 'az', 'ar'].includes(locale) 
        ? `/${locale}${redirectPath}` 
        : redirectPath;
      return NextResponse.redirect(new URL(fullRedirectPath, request.url));
    }

    // Check approval status
    if (
      userData.approvalStatus === "PENDING" &&
      (userData.role === "DRIVER" || userData.role === "VENDOR")
    ) {
      // Extract locale from pathname to preserve user's language preference
      const locale = pathname.split('/')[1];
      const pendingPath = ['en', 'ru', 'tr', 'az', 'ar'].includes(locale) 
        ? `/${locale}/pending-approval` 
        : '/pending-approval';
      return NextResponse.redirect(new URL(pendingPath, request.url));
    }

    return intlResponse;
  } catch (error) {
    console.error("Middleware error:", error);

    if (path === "/") {
      return intlResponse;
    }
    return redirectToLogin(request, pathname);
  }
}

function findRequiredRoles(path: string): string[] {
  const matchingRoute = Object.entries(protectedRoutes).find(([route]) =>
    path.startsWith(route)
  );
  return matchingRoute ? matchingRoute[1] : [];
}

function redirectToLogin(request: NextRequest, pathname: string) {
  // Extract locale from pathname to preserve user's language preference
  const locale = pathname.split('/')[1];
  const loginPath = ['en', 'ru', 'tr', 'az', 'ar'].includes(locale) 
    ? `/${locale}/auth/login` 
    : '/auth/login';
  return NextResponse.redirect(new URL(loginPath, request.url));
}

export const config = {
  matcher: ["/((?!api|trpc|_next|_vercel|.*\\..*).*)"],
};
