import { routing } from './routing';
import { cookies } from 'next/headers';
import { redirect as nextRedirect } from 'next/navigation';

/**
 * Get the current locale from cookies or default
 */
export async function getCurrentLocale(): Promise<string> {
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get('NEXT_LOCALE');
  
  if (localeCookie && routing.locales.includes(localeCookie.value as typeof routing.locales[number])) {
    return localeCookie.value;
  }
  
  return routing.defaultLocale;
}

/**
 * Create a locale-aware redirect function
 * This handles redirects while preserving the current locale
 */
export async function createLocaleRedirect() {
  const locale = await getCurrentLocale();
  
  return (path: string) => {
    // If the path already starts with a locale, just redirect to it
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    
    // Check if path already contains a locale
    const hasLocale = routing.locales.some(
      (l) => normalizedPath === `/${l}` || normalizedPath.startsWith(`/${l}/`)
    );
    
    if (hasLocale) {
      nextRedirect(normalizedPath);
    } else {
      nextRedirect(`/${locale}${normalizedPath}`);
    }
  };
}

/**
 * Redirect to a specific path with a given locale
 */
export async function redirectToLocale(path: string, locale?: string) {
  const targetLocale = locale || await getCurrentLocale();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  nextRedirect(`/${targetLocale}${normalizedPath}`);
}

/**
 * Redirect to the root of the current locale
 */
export async function redirectToHome() {
  const locale = await getCurrentLocale();
  nextRedirect(`/${locale}`);
}

/**
 * Redirect to the login page with locale
 */
export async function redirectToLogin(redirectTo?: string) {
  const locale = await getCurrentLocale();
  const loginPath = `/${locale}/auth/login`;
  
  if (redirectTo) {
    nextRedirect(`${loginPath}?redirect=${encodeURIComponent(redirectTo)}`);
  } else {
    nextRedirect(loginPath);
  }
}

/**
 * Redirect to the dashboard with locale
 */
export async function redirectToDashboard() {
  const locale = await getCurrentLocale();
  nextRedirect(`/${locale}/dashboard`);
}

/**
 * Redirect to restaurants page with locale
 */
export async function redirectToRestaurants() {
  const locale = await getCurrentLocale();
  nextRedirect(`/${locale}/restaurants`);
}

/**
 * Redirect to cart page with locale
 */
export async function redirectToCart() {
  const locale = await getCurrentLocale();
  nextRedirect(`/${locale}/cart`);
}

/**
 * Redirect to checkout page with locale
 */
export async function redirectToCheckout() {
  const locale = await getCurrentLocale();
  nextRedirect(`/${locale}/checkout`);
}

/**
 * Get the localized path (add locale prefix if not present)
 */
export function getLocalizedPath(path: string, locale?: string): string {
  const targetLocale = locale || routing.defaultLocale;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  
  // Check if path already contains a locale
  const hasLocale = routing.locales.some(
    (l) => normalizedPath === `/${l}` || normalizedPath.startsWith(`/${l}/`)
  );
  
  if (hasLocale) {
    return normalizedPath;
  }
  
  return `/${targetLocale}${normalizedPath}`;
}

/**
 * Check if a path is a locale-aware path (has locale prefix)
 */
export function hasLocalePrefix(path: string): boolean {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return routing.locales.some(
    (l) => normalizedPath === `/${l}` || normalizedPath.startsWith(`/${l}/`)
  );
}

/**
 * Get locale from path if present
 */
export function getLocaleFromPath(path: string): string | null {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const segments = normalizedPath.split('/').filter(Boolean);
  
  if (segments.length > 0 && routing.locales.includes(segments[0] as typeof routing.locales[number])) {
    return segments[0];
  }
  
  return null;
}

/**
 * Replace locale in path with a new locale
 */
export function replaceLocale(path: string, newLocale: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const currentLocale = getLocaleFromPath(normalizedPath);
  
  if (currentLocale) {
    return normalizedPath.replace(`/${currentLocale}`, `/${newLocale}`);
  }
  
  return `/${newLocale}${normalizedPath}`;
}
