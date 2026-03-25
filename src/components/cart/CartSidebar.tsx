"use client";

import Loader from "@/components/Loader";
import { useCurrency } from "@/hooks/useCurrency";
import { isRTL, type Locale } from "@/i18n/config";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useRestaurantStore } from "@/store/useRestaurantStore";
import { useCartStore } from "@/store/useStore";
import { formatCurrency as formatCurrencyUtil } from "@/utils/currency";
import { MinusIcon, PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_DELIVERY_CHARGES = 2.99; // Default delivery charges if restaurant doesn't have one set

export default function CartSidebar({ isOpen, onClose }: CartSidebarProps) {
  const tCart = useTranslations("cart");
  const tOrder = useTranslations("order");
  const tCommon = useTranslations("common");

  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const rtl = isRTL(locale as Locale);
  const { items, addItem, removeOneItem, removeItem, clearCart, restaurant } =
    useCartStore();
  const { selectedRestaurant } = useRestaurantStore();
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isNavigatingRef = useRef(false);
  const { formatCurrency: formatCurrencyGlobal } = useCurrency();
  const [deliveryCharges, setDeliveryCharges] = useState<number>(
    DEFAULT_DELIVERY_CHARGES
  );
  const [restaurantCurrency, setRestaurantCurrency] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Helper function to format currency with restaurant-specific currency
  const formatCurrency = (amount: number | string | null | undefined) => {
    if (restaurantCurrency) {
      return formatCurrencyUtil(amount, restaurantCurrency);
    }
    return formatCurrencyGlobal(amount);
  };

  // Reset loading state when we reach checkout page
  useEffect(() => {
    if (pathname === "/checkout") {
      setIsLoading(false);
      isNavigatingRef.current = false;
    }
  }, [pathname]);

  // Reset loading when sidebar closes, but only if we're not navigating to checkout
  useEffect(() => {
    if (!isOpen && pathname !== "/checkout" && !isNavigatingRef.current) {
      setIsLoading(false);
    }
  }, [isOpen, pathname]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      // Prevent background scrolling
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      // Restore background scrolling
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  // Get delivery charges and currency from selectedRestaurant first, then fallback to API
  useEffect(() => {
    // First, try to get from selectedRestaurant (immediate, no loading)
    if (selectedRestaurant) {
      setDeliveryCharges(
        selectedRestaurant.deliveryCharges ?? DEFAULT_DELIVERY_CHARGES
      );
      setRestaurantCurrency(selectedRestaurant.currency || null);
      return;
    }

    // If selectedRestaurant is not available, fetch from API
    const fetchRestaurantDeliveryCharges = async () => {
      if (!restaurant?.id) {
        setDeliveryCharges(DEFAULT_DELIVERY_CHARGES);
        setRestaurantCurrency(null);
        return;
      }

      try {
        const response = await fetch(`/api/restaurants/${restaurant.id}`);
        if (response.ok) {
          const data = await response.json();
          const restaurantData = data.restaurant;
          // Use restaurant's delivery charges if set, otherwise use default
          setDeliveryCharges(
            restaurantData.deliveryCharges ?? DEFAULT_DELIVERY_CHARGES
          );
          // Set restaurant currency
          setRestaurantCurrency(restaurantData.currency || null);
        } else {
          setDeliveryCharges(DEFAULT_DELIVERY_CHARGES);
          setRestaurantCurrency(null);
        }
      } catch (error) {
        console.error("Error fetching restaurant delivery charges:", error);
        setDeliveryCharges(DEFAULT_DELIVERY_CHARGES);
        setRestaurantCurrency(null);
      }
    };

    if (isOpen && restaurant?.id) {
      fetchRestaurantDeliveryCharges();
    }
  }, [selectedRestaurant, restaurant?.id, isOpen]);

  const calculateTotal = () => {
    return items.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const calculateTotalWithDelivery = () => {
    return calculateTotal() + deliveryCharges;
  };

  const handleCheckout = async () => {
    isNavigatingRef.current = true;
    setIsLoading(true);
    // Close sidebar first, then navigate
    onClose();
    // Small delay to ensure loader is visible before navigation
    await new Promise(resolve => setTimeout(resolve, 100));
    router.push("/checkout");
  };

  const handleRemoveItem = (id: string, quantity: number) => {
    if (quantity === 1) {
      removeItem(id);
    } else {
      removeOneItem(id);
    }
  };

  return (
    <>
      {isLoading && <Loader fullScreen message={tOrder('loadingCheckout')} />}
      <div
        className={`fixed inset-0 z-50 flex ${rtl ? 'justify-start' : 'justify-end'} transition-opacity duration-300 ease-in-out ${isOpen ? "bg-black/40" : "opacity-0 pointer-events-none bg-transparent"
          }`}
      >
        <div
          ref={sidebarRef}
          className={`h-full w-full sm:w-96 bg-white shadow-xl transform transition-all duration-300 ease-in-out p-4 flex flex-col overflow-auto ${isOpen ? "translate-x-0" : (rtl ? "-translate-x-full" : "translate-x-full")
            }`}
        >
          {/* Header */}
          <div className="flex justify-between items-center border-b pb-4">
            <h2 className="text-lg font-semibold text-center sm:text-start">
              {tCart('yourCart')}
            </h2>
            <div className="flex items-center gap-4">
              {items.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-gray-500 hover:text-red-500 text-sm"
                >
                  {tCart('clearCart')}
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200"
              >
                <XMarkIcon className="h-5 w-5 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto mt-4 space-y-2">
            {items.length === 0 ? (
              <div className="text-center text-gray-500 mt-12 text-base">
                {tCart('empty')}
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 border  p-2 rounded-lg "
                >
                  {/* Item Image */}
                  <div className="relative w-18 h-18 flex-shrink-0 rounded-lg overflow-hidden bg-gray-200">
                    <Image
                      src={item.image || "/images/food-placeholder.jpg"}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  {/* Item Details */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm ">{item.name}</h3>
                    
                    {/* Display Selected Addons in Cart */}
                    {item.selectedAddons && item.selectedAddons.length > 0 && (
                      <ul className="text-xs text-gray-500 mt-1 mb-2 space-y-0.5">
                        {item.selectedAddons.map((addon) => (
                          <li key={`${addon.groupId}-${addon.optionId}`}>
                            + {addon.optionName}
                          </li>
                        ))}
                      </ul>
                    )}

                    <div className="flex items-center gap-1 mt-2">
                      <button
                        onClick={() =>
                          handleRemoveItem(item.id, item.quantity)
                        }
                        className="bg-white text-gray-800 p-1 rounded-full border border-gray-200 transition-all duration-300 ease-in-out  hover:text-primary hover:scale-110 shadow-sm whitespace-nowrap"
                      >
                        <MinusIcon className="h-4 w-4 text-gray-700" />
                      </button>
                      <span className="text-xs font-semibold text-gray-800 bg-white px-[5px] border border-gray-200 py-[2px] rounded-full shadow-sm min-w-[24px] text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => addItem({ ...item, quantity: 1 })}
                        className="bg-white text-gray-700 p-1 rounded-full border border-gray-200 transition-all duration-300 ease-in-out hover:bg-white hover:text-primary hover:scale-110 shadow-sm flex-shrink-0"
                      >
                        <PlusIcon className="h-4 w-4" />
                      </button>
                    </div>

                  </div>
                  <p className="text-gray-600 mt-auto">{formatCurrency(item.price)}</p>
                  {/* Quantity Controls */}

                </div>
              ))
            )}
            {items.length > 0 && (
              <div className="justify-center mb-auto flex flex-row items-center mt-4">
                <button
                  onClick={onClose}
                  className="mb-auto text-sm font-medium flex flex-row items-center gap-2 hover:text-primary transition-colors"
                >
                  <PlusIcon className="h-4 w-4" /> {tCart('addMoreItems')}
                </button>
              </div>
            )}
          </div>


          {/* Footer */}
          {items.length > 0 && (
            <div className="border-t pt-4 space-y-1">
              <div className="flex justify-between text-base">
                <span className="font-semibold">{tCart('subtotal')}:</span>
                <span>{formatCurrency(calculateTotal())}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-500">
                <span>{tCart('deliveryFee')}:</span>
                <span>{formatCurrency(deliveryCharges)}</span>
              </div>
              <div className="flex justify-between text-xl py-2 font-bold">
                <span>{tCart('total')}:</span>
                <span>{formatCurrency(calculateTotalWithDelivery())}</span>
              </div>
              <button
                onClick={handleCheckout}
                disabled={isLoading}
                className="w-full bg-primary hover:bg-primary-600 text-white py-3 rounded-full hover:bg-primary-dark transition-all duration-200 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? tCommon('loading') : tOrder('checkout')}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
