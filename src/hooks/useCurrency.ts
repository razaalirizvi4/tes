"use client";

import { useEffect, useState } from "react";
import { formatCurrency } from "@/utils/currency";
import { getCurrencyConfig } from "@/constants/currency";

/**
 * Hook to fetch and use currency setting
 * Uses restaurant currency if provided, otherwise falls back to global currency setting
 * Uses centralized currency configuration from @/constants/currency
 * @param restaurantCurrency - Optional restaurant-specific currency code
 * @returns Object containing currency code, symbol, config, and formatCurrency function
 */
export function useCurrency(restaurantCurrency?: string | null) {
  const [currencyCode, setCurrencyCode] = useState<string>("USD");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // If restaurant currency is provided, use it directly
    if (restaurantCurrency) {
      setCurrencyCode(restaurantCurrency);
      setIsLoading(false);
      return;
    }

    // Otherwise, fetch global currency setting
    const fetchCurrency = async () => {
      try {
        const response = await fetch("/api/settings");
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data?.defaultCurrency) {
            setCurrencyCode(result.data.defaultCurrency);
          }
        }
      } catch (error) {
        console.error("Error fetching currency:", error);
        // Default to USD if fetch fails
        setCurrencyCode("USD");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCurrency();
  }, [restaurantCurrency]);

  const currencyConfig = getCurrencyConfig(currencyCode);

  return {
    currencyCode,
    currencySymbol: currencyConfig.symbol,
    currencyName: currencyConfig.name,
    currencyConfig,
    formatCurrency: (
      amount: number | string | null | undefined,
      decimals: number = 2
    ) => formatCurrency(amount, currencyCode, decimals),
    isLoading,
  };
}
