import { useState, useEffect } from "react";

const DEFAULT_RADIUS = 10; // Default fallback radius in km

export const useRestaurantRadius = () => {
  const [radius, setRadius] = useState<number>(DEFAULT_RADIUS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRadius = async () => {
      try {
        const response = await fetch("/api/settings", {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache",
          },
        });
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data?.restaurantRadius != null) {
            const parsed = parseFloat(String(result.data.restaurantRadius));
            setRadius(isNaN(parsed) ? DEFAULT_RADIUS : parsed);
          } else {
            console.warn("Restaurant radius not found in response, using default:", DEFAULT_RADIUS);
            setRadius(DEFAULT_RADIUS);
          }
        } else {
          setRadius(DEFAULT_RADIUS);
        }
      } catch (error) {
        console.error("Error fetching restaurant radius:", error);
        setRadius(DEFAULT_RADIUS);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRadius();
  }, []);

  return { radius, isLoading };
};
