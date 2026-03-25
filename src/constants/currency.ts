/**
 * Centralized currency configuration
 * This is the single source of truth for all currency-related data
 */

export interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
}

export const CURRENCIES: Record<string, CurrencyConfig> = {
  USD: {
    code: "USD",
    symbol: "$",
    name: "US Dollar",
  },
  EUR: {
    code: "EUR",
    symbol: "€",
    name: "Euro",
  },
  GBP: {
    code: "GBP",
    symbol: "£",
    name: "British Pound",
  },
  PKR: {
    code: "PKR",
    symbol: "₨. ",
    name: "Pakistani Rupee",
  },
  AZN: {
    code: "AZN",
    symbol: "₼",
    name: "Azerbaijani Manat",
  },
};

/**
 * Get currency symbol for a given currency code
 */
export function getCurrencySymbol(currencyCode: string = "USD"): string {
  return CURRENCIES[currencyCode]?.symbol || currencyCode;
}

/**
 * Get currency name for a given currency code
 */
export function getCurrencyName(currencyCode: string = "USD"): string {
  return CURRENCIES[currencyCode]?.name || currencyCode;
}

/**
 * Get full currency config for a given currency code
 */
export function getCurrencyConfig(
  currencyCode: string = "USD"
): CurrencyConfig {
  return CURRENCIES[currencyCode] || CURRENCIES.USD;
}

/**
 * Get all available currencies as an array
 */
export function getAllCurrencies(): CurrencyConfig[] {
  return Object.values(CURRENCIES);
}

/**
 * Get currency codes as an array
 */
export function getCurrencyCodes(): string[] {
  return Object.keys(CURRENCIES);
}
