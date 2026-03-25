/**
 * Currency utility functions for formatting prices
 * Uses centralized currency configuration from @/constants/currency
 */

import { getCurrencySymbol } from "@/constants/currency";

/**
 * Formats a number as currency based on the currency code
 * @param amount - The amount to format (can be number or string)
 * @param currencyCode - The currency code (e.g., "USD", "EUR", "PKR")
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted currency string (e.g., "$10.99", "€10.99", "₨10.99")
 */
export function formatCurrency(
  amount: number | string | null | undefined,
  currencyCode: string = "USD",
  decimals: number = 2
): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) || 0 : amount || 0;
  const symbol = getCurrencySymbol(currencyCode);
  return `${symbol}${numAmount.toFixed(decimals)}`;
}

