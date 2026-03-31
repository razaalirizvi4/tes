"use client";
import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { useRestaurantStore } from '@/store/useRestaurantStore';
import { Restaurant } from '@/types';
import SearchBar from '@/components/SearchBar';
import axios from 'axios';
import { getDistance } from '../utils/haversineDistance';
import { useRestaurantRadius } from '@/hooks/useRestaurantRadius';
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { useCurrency } from "@/hooks/useCurrency";
import { formatCurrency as formatCurrencyUtil } from "@/utils/currency";
import { useTranslations } from "next-intl";
import { Link as LocaleLink } from "@/i18n/navigation";
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid';
import { MdLocalFlorist, MdShoppingBag, MdShoppingBasket, MdRestaurant, MdBakeryDining, MdStorefront } from "react-icons/md";

const STORE_TYPE_CONFIG: Record<string, { icon: any; label: string }> = {
  ALL: { icon: MdRestaurant, label: 'All' },
  RESTAURANT: { icon: MdRestaurant, label: 'Restaurants' },
  GROCERY: { icon: MdShoppingBasket, label: 'Groceries' },
  FLOWER_SHOP: { icon: MdLocalFlorist, label: 'Flowers' },
  PHARMACY: { icon: MdStorefront, label: 'Pharmacy' },
  BAKERY: { icon: MdBakeryDining, label: 'Patisserie' },
  GENERAL: { icon: MdShoppingBag, label: 'General' },
};

const getCategoryConfig = (cat: string) =>
  STORE_TYPE_CONFIG[cat] ?? { icon: MdStorefront, label: cat };

// Carousel component for restaurant images
const RestaurantImageCarousel = ({ images, restaurantName }: { images: string[], restaurantName: string }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handlePrevious = (e: React.MouseEvent) => {
    e.preventDefault();
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="relative h-full w-full">
      <Image
        src={images[currentIndex]}
        alt={restaurantName}
        fill
        className="object-cover"
      />
      {images.length > 1 && (
        <>
          <button
            onClick={handlePrevious}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 z-10 transition-all"
            aria-label="Previous image"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={handleNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 z-10 transition-all"
            aria-label="Next image"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.preventDefault();
                  setCurrentIndex(index);
                }}
                className={`w-2 h-2 rounded-full transition-all ${index === currentIndex ? 'bg-white' : 'bg-white/50'
                  }`}
                aria-label={`Go to image ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

interface Props {
  initialData: Restaurant[];
}

export default function RestaurantList({ initialData }: Props) {
  const t = useTranslations("restaurant");
  const tCommon = useTranslations("common");
  const [allRestaurants, setAllRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const categoryScrollRef = useRef<HTMLDivElement>(null);
  const [canScroll, setCanScroll] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [numDots, setNumDots] = useState(0);

  const checkScroll = () => {
    const el = categoryScrollRef.current;
    if (el) {
      const maxScroll = el.scrollWidth - el.clientWidth;
      const isOverflowing = maxScroll > 0;
      setCanScroll(isOverflowing);

      if (isOverflowing) {
        const pages = Math.ceil(el.scrollWidth / el.clientWidth);
        setNumDots(pages);
        setScrollProgress(el.scrollLeft / maxScroll);
      }
    }
  };

  useEffect(() => {
    const timer = setTimeout(checkScroll, 100);
    window.addEventListener('resize', checkScroll);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', checkScroll);
    };
  }, [allRestaurants]);

  const handleScrollDots = () => {
    checkScroll();
  };

  const handleDotClick = (index: number) => {
    const el = categoryScrollRef.current;
    if (el) {
      const target = index * el.clientWidth;
      el.scrollTo({ left: target, behavior: 'smooth' });
    }
  };

  const formatCategoryLabel = (cat: string) => {
    if (cat === 'ALL') return tCommon('all') || 'All';
    return getCategoryConfig(cat).label;
  };

  const { selectedCity, selectedArea, restaurants, setRestaurants } = useRestaurantStore();
  const { radius: restaurantRadius, isLoading: isRadiusLoading } = useRestaurantRadius();
  const { formatCurrency: formatCurrencyGlobal } = useCurrency();

  // Helper function to format currency with restaurant-specific currency
  const formatCurrency = (amount: number | string | null | undefined, restaurantCurrency?: string | null) => {
    if (restaurantCurrency) {
      return formatCurrencyUtil(amount, restaurantCurrency);
    }
    return formatCurrencyGlobal(amount);
  };

  // Fetch the location of the selected city/area using server-side geocoding API
  const fetchCityCoordinates = async (city: string, area: string) => {
    try {
      const response = await axios.get(
        `/api/geocode?city=${encodeURIComponent(city)}&area=${encodeURIComponent(area)}`
      );

      if (response.data && response.data.lat && response.data.lon) {
        return {
          lat: response.data.lat,
          lon: response.data.lon,
        };
      }

      console.error("No results found for the given city and area.");
      return { lat: null, lon: null };
    } catch (error) {
      console.error("Error fetching city coordinates:", error);
      return { lat: null, lon: null };
    }
  };

  // Initialize and filter restaurants - wait for radius to load first
  useEffect(() => {
    if (!initialData) return;

    // Wait for radius to load before processing restaurants
    if (isRadiusLoading) {
      setLoading(true);
      // Clear restaurants while waiting for radius to prevent showing stale data
      setRestaurants([]);
      setAllRestaurants([]);
      return;
    }

    setLoading(true);

    // Prepare restaurants with menu items
    const preparedRestaurants = initialData.map((newRestaurant) => ({
      ...newRestaurant,
      menuItems: newRestaurant.menuItems || [],
    }));

    const selectedArea = localStorage.getItem('selectedArea') || '';
    const selectedCity = localStorage.getItem('selectedCity') || '';

    // If city and area are selected, filter by location
    if (selectedCity && selectedArea) {
      // Filter the restaurants based on proximity to the selected city/area
      const filterRestaurantsByLocation = async () => {
        const { lat, lon } = await fetchCityCoordinates(selectedCity, selectedArea);

        if (!lat || !lon) {
          console.error("Invalid city or area coordinates.");
          // Fallback to showing all restaurants if geocoding fails
          setAllRestaurants(preparedRestaurants);
          setRestaurants(preparedRestaurants);
          setLoading(false);
          return;
        }

        // Filter restaurants by proximity using configurable radius
        const nearbyRestaurants = preparedRestaurants.filter((restaurant) => {
          if (!restaurant.latitude || !restaurant.longitude) {
            console.warn(`Restaurant ${restaurant.name} is missing coordinates.`);
            return false;
          }

          const distance = getDistance(lat, lon, restaurant.latitude, restaurant.longitude);

          return distance <= restaurantRadius; // Use configurable radius from settings
        });

        // Update the restaurants in the state
        setAllRestaurants(nearbyRestaurants);
        setRestaurants(nearbyRestaurants);
        setLoading(false);
      };

      filterRestaurantsByLocation();
    } else {
      // If no city/area selected, show all restaurants from initialData
      setAllRestaurants(preparedRestaurants);
      setRestaurants(preparedRestaurants);
      setLoading(false);
    }
  }, [initialData, selectedCity, selectedArea, restaurantRadius, isRadiusLoading, setRestaurants]);

  useEffect(() => {
    let filtered = allRestaurants;

    if (selectedCategory !== "ALL") {
      filtered = filtered.filter(r => (r.storeType || "RESTAURANT") === selectedCategory);
    }

    if (searchQuery.trim()) {
      filtered = filtered.filter(({ name, cuisineType, area }) =>
        [name, cuisineType, area].some((field) =>
          field?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }

    setRestaurants(filtered);
  }, [allRestaurants, searchQuery, selectedCategory, setRestaurants]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const categories = ["ALL", ...Array.from(new Set(initialData.map(r => r.storeType || "RESTAURANT"))).filter(Boolean)].sort();

  const formatCategoryName = (category: string) => {
    if (category === "ALL") return tCommon('all') || "All";
    return category
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  return (
    <div>
      <div className="my-10">
        <SearchBar placeholder={tCommon('search')} onSearch={handleSearch} />
      </div>

      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-8xl mx-auto px-4 sm:px-8">
          <div className="py-5">
            {/* Scrollable tiles */}
            <div
              ref={categoryScrollRef}
              onScroll={handleScrollDots}
              className="flex overflow-x-auto justify-start xl:justify-center w-full pb-2 gap-2 md:gap-3 items-center snap-x snap-mandatory"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {categories.map((cat) => {
                const config = getCategoryConfig(cat);
                const isActive = selectedCategory === cat;
                const Icon = config.icon;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    aria-pressed={isActive}
                    className={`snap-start flex-shrink-0 flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${isActive
                      ? 'bg-primary text-white hover:bg-[#85251d]'
                      : 'bg-[#eeeeee] text-gray-800 hover:bg-[#e2e2e2]'
                      }`}
                  >
                    <Icon className="w-6 h-6 flex-shrink-0" />
                    <span className="text-base tracking-wide whitespace-nowrap">
                      {formatCategoryLabel(cat)}
                    </span>
                  </button>
                );
              })}
            </div>

            {canScroll && numDots > 1 && (
              <div className="flex justify-center gap-2 mt-4 w-full">
                {Array.from({ length: numDots }).map((_, idx) => {
                  const isActive = Math.round(scrollProgress * (numDots - 1)) === idx;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleDotClick(idx)}
                      className={`h-2 rounded-full transition-all duration-300 ${isActive ? 'bg-primary w-6' : 'bg-gray-300 w-2 hover:bg-gray-400'
                        }`}
                      aria-label={`Go to section ${idx + 1}`}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {loading ? ( // Show skeletons while loading
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="rounded-lg shadow-md overflow-hidden">
              <div className="relative h-48 bg-gray-300">
                <Skeleton height="100%" />
              </div>
              <div className="p-4">
                <Skeleton width="80%" height={24} />
                <Skeleton width="60%" height={16} className="mt-2" />
                <Skeleton width="100%" height={14} className="mt-2" />
                <Skeleton width="50%" height={14} className="mt-2" />
              </div>
            </div>
          ))}
        </div>
      ) : restaurants.length === 0 ? (
        <p className="text-center text-gray-500 text-lg">
          {t('noRestaurants')}
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {restaurants.map((restaurant) => {
            const images = restaurant.coverImagesList && restaurant.coverImagesList.length > 0
              ? restaurant.coverImagesList
              : restaurant.coverImage
                ? [restaurant.coverImage]
                : ["/images/restaurant-placeholder.jpg"];

            return (
              <LocaleLink key={restaurant.id} href={`/restaurants/${restaurant.id}`} className="block group">
                <div className="rounded-lg shadow-md overflow-hidden transition-transform duration-200 hover:scale-105">
                  <div className="relative h-48">
                    {images.length > 1 ? (
                      <RestaurantImageCarousel images={images} restaurantName={restaurant.name} />
                    ) : (
                      <Image
                        src={images[0]}
                        alt={restaurant.name}
                        fill
                        className="object-cover"
                      />
                    )}
                    {restaurant.rating && (
                      <div className="absolute top-2 right-2 bg-primary/70 border text-white border-white px-2 py-1 rounded-full text-sm font-semibold z-20">
                        ⭐️ {restaurant.rating}
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h2 className="text-xl font-semibold mb-2 text-primary">{restaurant.name}</h2>
                    <p className="text-gray-600 mb-2">{restaurant.cuisineType}</p>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>📍 {restaurant.area}</span>
                      <span>🕒 {restaurant.deliveryTime}</span>
                    </div>
                    <div className="mt-2 text-sm text-gray-500">
                      {t('minimumOrder')}: {formatCurrency(restaurant.minimumOrder ?? '0', restaurant.currency)}
                    </div>
                  </div>
                </div>
              </LocaleLink>
            );
          })}
        </div>
      )}
    </div>
  );
}
