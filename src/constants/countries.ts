/**
 * Countries list with their associated currencies
 * This is used for restaurant currency selection
 */

export interface CountryConfig {
  code: string; // ISO country code (e.g., "US", "PK", "GB")
  name: string; // Country name
  currencyCode: string; // Currency code (e.g., "USD", "PKR", "GBP")
}

export const COUNTRIES: CountryConfig[] = [
  { code: "US", name: "United States", currencyCode: "USD" },
  { code: "PK", name: "Pakistan", currencyCode: "PKR" },
  { code: "GB", name: "United Kingdom", currencyCode: "GBP" },
  { code: "CA", name: "Canada", currencyCode: "USD" },
  { code: "AU", name: "Australia", currencyCode: "USD" },
  { code: "DE", name: "Germany", currencyCode: "EUR" },
  { code: "FR", name: "France", currencyCode: "EUR" },
  { code: "IT", name: "Italy", currencyCode: "EUR" },
  { code: "ES", name: "Spain", currencyCode: "EUR" },
  { code: "NL", name: "Netherlands", currencyCode: "EUR" },
  { code: "BE", name: "Belgium", currencyCode: "EUR" },
  { code: "AT", name: "Austria", currencyCode: "EUR" },
  { code: "CH", name: "Switzerland", currencyCode: "EUR" },
  { code: "SE", name: "Sweden", currencyCode: "EUR" },
  { code: "NO", name: "Norway", currencyCode: "EUR" },
  { code: "DK", name: "Denmark", currencyCode: "EUR" },
  { code: "FI", name: "Finland", currencyCode: "EUR" },
  { code: "IE", name: "Ireland", currencyCode: "EUR" },
  { code: "PT", name: "Portugal", currencyCode: "EUR" },
  { code: "GR", name: "Greece", currencyCode: "EUR" },
  { code: "PL", name: "Poland", currencyCode: "EUR" },
  { code: "CZ", name: "Czech Republic", currencyCode: "EUR" },
  { code: "HU", name: "Hungary", currencyCode: "EUR" },
  { code: "RO", name: "Romania", currencyCode: "EUR" },
  { code: "BG", name: "Bulgaria", currencyCode: "EUR" },
  { code: "HR", name: "Croatia", currencyCode: "EUR" },
  { code: "SK", name: "Slovakia", currencyCode: "EUR" },
  { code: "SI", name: "Slovenia", currencyCode: "EUR" },
  { code: "LT", name: "Lithuania", currencyCode: "EUR" },
  { code: "LV", name: "Latvia", currencyCode: "EUR" },
  { code: "EE", name: "Estonia", currencyCode: "EUR" },
  { code: "IN", name: "India", currencyCode: "USD" },
  { code: "CN", name: "China", currencyCode: "USD" },
  { code: "JP", name: "Japan", currencyCode: "USD" },
  { code: "KR", name: "South Korea", currencyCode: "USD" },
  { code: "SG", name: "Singapore", currencyCode: "USD" },
  { code: "MY", name: "Malaysia", currencyCode: "USD" },
  { code: "TH", name: "Thailand", currencyCode: "USD" },
  { code: "ID", name: "Indonesia", currencyCode: "USD" },
  { code: "PH", name: "Philippines", currencyCode: "USD" },
  { code: "VN", name: "Vietnam", currencyCode: "USD" },
  { code: "AE", name: "United Arab Emirates", currencyCode: "USD" },
  { code: "SA", name: "Saudi Arabia", currencyCode: "USD" },
  { code: "AZ", name: "Azerbaijan", currencyCode: "AZN" },
  { code: "EG", name: "Egypt", currencyCode: "USD" },
  { code: "ZA", name: "South Africa", currencyCode: "USD" },
  { code: "NG", name: "Nigeria", currencyCode: "USD" },
  { code: "KE", name: "Kenya", currencyCode: "USD" },
  { code: "BR", name: "Brazil", currencyCode: "USD" },
  { code: "MX", name: "Mexico", currencyCode: "USD" },
  { code: "AR", name: "Argentina", currencyCode: "USD" },
  { code: "CL", name: "Chile", currencyCode: "USD" },
  { code: "CO", name: "Colombia", currencyCode: "USD" },
  { code: "PE", name: "Peru", currencyCode: "USD" },
  { code: "NZ", name: "New Zealand", currencyCode: "USD" },
];

/**
 * Get country config by country code
 */
export function getCountryByCode(
  countryCode: string
): CountryConfig | undefined {
  return COUNTRIES.find((country) => country.code === countryCode);
}

/**
 * Get currency code for a country
 */
export function getCurrencyByCountry(countryCode: string): string {
  const country = getCountryByCode(countryCode);
  return country?.currencyCode || "USD";
}

/**
 * Get all countries as an array
 */
export function getAllCountries(): CountryConfig[] {
  return COUNTRIES;
}
