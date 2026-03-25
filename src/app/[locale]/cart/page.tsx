"use client";
import { useCartStore, useAuthStore } from "@/store/useStore";
import { toast } from "react-hot-toast";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link as LocaleLink, useRouter } from "@/i18n/navigation";

// Removed static MENU_ITEMS mock since prices come from cart logic now.

const DEFAULT_DELIVERY_CHARGES = 2.99;

export default function CartPage() {
  const router = useRouter();
  const t = useTranslations("cart");
  const tMessages = useTranslations("messages");
  const { items, removeItem, restaurant } = useCartStore();
  const { user } = useAuthStore();
  const [deliveryCharges, setDeliveryCharges] = useState<number>(
    DEFAULT_DELIVERY_CHARGES
  );
  const [isLoadingDeliveryCharges, setIsLoadingDeliveryCharges] =
    useState(false);

  useEffect(() => {
    if (user) {
      if (user.role === "VENDOR") {
        router.replace("/dashboard/restaurants");
      } else if (user.role === "SUPER_ADMIN") {
        router.replace("/dashboard/analytics");
      }
    }
  }, [user, router]);

  useEffect(() => {
    const fetchRestaurantDeliveryCharges = async () => {
      if (!restaurant?.id) {
        setDeliveryCharges(DEFAULT_DELIVERY_CHARGES);
        return;
      }

      setIsLoadingDeliveryCharges(true);
      try {
        const response = await fetch(`/api/restaurants/${restaurant.id}`);
        if (response.ok) {
          const data = await response.json();
          const restaurantData = data.restaurant;
          setDeliveryCharges(
            restaurantData.deliveryCharges ?? DEFAULT_DELIVERY_CHARGES
          );
        } else {
          setDeliveryCharges(DEFAULT_DELIVERY_CHARGES);
        }
      } catch (error) {
        console.error("Error fetching restaurant delivery charges:", error);
        setDeliveryCharges(DEFAULT_DELIVERY_CHARGES);
      } finally {
        setIsLoadingDeliveryCharges(false);
      }
    };

    fetchRestaurantDeliveryCharges();
  }, [restaurant?.id]);

  const calculateTotal = () => {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handleCheckout = () => {
    if (items.length === 0) {
      toast.error(t('empty'));
      return;
    }
    router.push("/checkout");
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">{t('yourCart')}</h1>

      {items.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">{t('empty')}</p>
          <LocaleLink
            href="/restaurants"
            className="text-primary hover:text-primary-600"
          >
            {t('continueShopping')}
          </LocaleLink>
        </div>
      ) : (
        <>
          <div className="space-y-4 mb-8">
            {items.map((item) => {
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm"
                >
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {item.name}
                    </h3>

                    {/* Show selected addons */}
                    {item.selectedAddons && item.selectedAddons.length > 0 && (
                      <ul className="text-sm text-gray-500 mt-1 mb-2 space-y-0.5">
                        {item.selectedAddons.map((addon) => (
                          <li key={`${addon.groupId}-${addon.optionId}`}>
                            + {addon.optionName}
                          </li>
                        ))}
                      </ul>
                    )}

                    <p className="text-gray-600">{t('quantity')}: {item.quantity}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="text-lg font-medium text-gray-900">
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-red-600 hover:text-red-700 text-sm font-medium"
                    >
                      {t('removeItem')}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-gray-50 p-6 rounded-lg">
            <div className="flex justify-between mb-4">
              <span className="text-gray-600">{t('subtotal')}</span>
              <span className="text-lg font-medium text-gray-900">
                ${calculateTotal().toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between mb-4">
              <span className="text-gray-600">{t('deliveryFee')}</span>
              <span className="text-lg font-medium text-gray-900">
                {isLoadingDeliveryCharges
                  ? tMessages('loading')
                  : `$${deliveryCharges.toFixed(2)}`}
              </span>
            </div>
            <div className="border-t pt-4">
              <div className="flex justify-between">
                <span className="text-lg font-medium text-gray-900">{t('total')}</span>
                <span className="text-xl font-bold text-gray-900">
                  ${(calculateTotal() + deliveryCharges).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-8 space-y-4">
            <button
              onClick={handleCheckout}
              className="w-full py-3 px-4 text-white bg-primary rounded-lg hover:bg-primary-600 font-medium"
            >
              {t('proceedCheckout')}
            </button>
            <LocaleLink
              href="/restaurants"
              className="w-full py-3 px-4 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium inline-block text-center"
            >
              {t('continueShopping')}
            </LocaleLink>
          </div>
        </>
      )}
    </div>
  );
}
