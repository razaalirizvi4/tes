"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Link as LocaleLink, useRouter } from "@/i18n/navigation";
import { useAddressStore, useAuthStore, useCartStore, useOrderStore } from "@/store/useStore";
import { IoIosAddCircle } from "react-icons/io";
import { useTranslations } from "next-intl";

import toast from "react-hot-toast";
import { MdDelete, MdOutlineLocationOn, MdEdit, MdHome, MdWork } from "react-icons/md";
import AddressModal from "@/components/AddressModal";
import AddressForm from "@/components/AddressForm";
import { FaMoneyBillWave } from "react-icons/fa";
import { Address } from "@/types/user";
import { useCurrency } from "@/hooks/useCurrency";
import { formatCurrency as formatCurrencyUtil } from "@/utils/currency";
import { useRestaurantRadius } from "@/hooks/useRestaurantRadius";
import { getDistance } from "../utils/haversineDistance";
import Loader from "@/components/Loader";


export default function CheckoutPage() {
  const tOrder = useTranslations("order");
  const tCart = useTranslations("cart");
  const tCommon = useTranslations("common");
  const tMessages = useTranslations("messages");

  const { addresses, fetchAddresses, removeAddress, createAddress, updateAddress } =
    useAddressStore();
  const router = useRouter();
  const params = useParams();
  const locale = params?.locale as string || 'en';
  const { items, restaurant, clearCart } = useCartStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalAddressOpen, setIsModalAddressOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [selectedPayment, setSelectedPayment] = useState("COD"); // Default to Cash on Delivery

  const [selectedAddress, setSelectedAddress] = useState<{
    streetAddress: string;
    city: string;
    state: string;
    zipCode: string;
    id: string;
  } | null>(null);
  const [comment, setComment] = useState("");

  const { fetchOrders } = useOrderStore();
  const { formatCurrency: formatCurrencyGlobal } = useCurrency();
  const { radius: restaurantRadius } = useRestaurantRadius();

  const [deliveryCharges, setDeliveryCharges] = useState<number>(2.99); // Default delivery charges
  const [isLoadingDeliveryCharges, setIsLoadingDeliveryCharges] = useState(false);
  const [restaurantCurrency, setRestaurantCurrency] = useState<string | null>(null);
  const [restaurantLocation, setRestaurantLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [addressCoordinates, setAddressCoordinates] = useState<Record<string, { latitude: number; longitude: number } | null>>({});
  const [isGeocoding, setIsGeocoding] = useState<Record<string, boolean>>({});
  const tProfile = useTranslations("profile");
  // Helper function to format currency with restaurant-specific currency
  const formatCurrency = (amount: number | string | null | undefined) => {
    if (restaurantCurrency) {
      return formatCurrencyUtil(amount, restaurantCurrency);
    }
    return formatCurrencyGlobal(amount);
  };

  const handleSelectAddress = async (address: Address) => {
    // First, ensure address has coordinates
    if (!address.latitude || !address.longitude) {
      const coords = await geocodeAddress(address);
      if (!coords) {
        toast.error(tOrder('verifyLocationError'));
        return;
      }
    }

    // Only allow selection if address is within radius
    if (!isAddressWithinRadius(address)) {
      const coords = addressCoordinates[address.id] ||
        (address.latitude && address.longitude
          ? { latitude: address.latitude, longitude: address.longitude }
          : null);

      if (coords && restaurantLocation) {
        const distance = getDistance(
          restaurantLocation.latitude,
          restaurantLocation.longitude,
          coords.latitude,
          coords.longitude
        );
        toast.error(tOrder('distanceInfo', {
          distance: distance.toFixed(1),
          range: tOrder('beyondRadius', { radius: restaurantRadius })
        }));
      } else {
        toast.error(tOrder('beyondRadius', { radius: restaurantRadius }));
      }
      return;
    }
    setSelectedAddress(address); // Select only one address
  };

  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    null
  );
  const { user } = useAuthStore();

  // Redirect VENDOR and SUPER_ADMIN away from checkout page
  useEffect(() => {
    if (user) {
      if (user.role === "VENDOR") {
        router.replace("/dashboard/restaurants");
      } else if (user.role === "SUPER_ADMIN") {
        router.replace("/dashboard/analytics");
      }
    }
  }, [user, router]);

  // Fetch restaurant delivery charges, currency, and location
  useEffect(() => {
    const fetchRestaurantData = async () => {
      if (!restaurant?.id) {
        setDeliveryCharges(2.99); // Default
        setRestaurantCurrency(null);
        setRestaurantLocation(null);
        return;
      }

      setIsLoadingDeliveryCharges(true);
      try {
        const response = await fetch(`/api/restaurants/${restaurant.id}`);
        if (response.ok) {
          const data = await response.json();
          const restaurantData = data.restaurant;
          // Use restaurant's delivery charges if set, otherwise use default
          setDeliveryCharges(restaurantData.deliveryCharges ?? 2.99);
          // Set restaurant currency
          setRestaurantCurrency(restaurantData.currency || null);
          // Set restaurant location for distance calculation
          if (restaurantData.latitude && restaurantData.longitude) {
            setRestaurantLocation({
              latitude: restaurantData.latitude,
              longitude: restaurantData.longitude,
            });
          } else {
            setRestaurantLocation(null);
          }
        } else {
          setDeliveryCharges(2.99);
          setRestaurantCurrency(null);
          setRestaurantLocation(null);
        }
      } catch (error) {
        console.error("Error fetching restaurant data:", error);
        setDeliveryCharges(2.99);
        setRestaurantCurrency(null);
        setRestaurantLocation(null);
      } finally {
        setIsLoadingDeliveryCharges(false);
      }
    };

    fetchRestaurantData();
  }, [restaurant?.id]);

  // Geocode address if coordinates are missing
  const geocodeAddress = async (address: Address): Promise<{ latitude: number; longitude: number } | null> => {
    if (address.latitude && address.longitude) {
      return { latitude: address.latitude, longitude: address.longitude };
    }

    // Check if we already have coordinates cached
    if (addressCoordinates[address.id]) {
      return addressCoordinates[address.id];
    }

    // Check if already geocoding this address
    if (isGeocoding[address.id]) {
      return null;
    }

    setIsGeocoding(prev => ({ ...prev, [address.id]: true }));

    try {
      const fullAddress = `${address.streetAddress}, ${address.city}, ${address.state} ${address.zipCode}`;
      const response = await fetch(
        `/api/geocode?address=${encodeURIComponent(fullAddress)}`
      );

      if (response.ok) {
        const data = await response.json();
        if (data && data.lat && data.lon) {
          const coords = {
            latitude: parseFloat(data.lat),
            longitude: parseFloat(data.lon),
          };
          setAddressCoordinates(prev => ({ ...prev, [address.id]: coords }));
          setIsGeocoding(prev => ({ ...prev, [address.id]: false }));
          return coords;
        }
      }
    } catch (error) {
      console.error("Error geocoding address:", error);
    }

    setIsGeocoding(prev => ({ ...prev, [address.id]: false }));
    return null;
  };

  // Calculate if address is within delivery radius
  const isAddressWithinRadius = (address: Address): boolean => {
    if (!restaurantLocation) {
      return false; // Can't validate without restaurant location
    }

    // Use cached coordinates or address coordinates
    const coords = addressCoordinates[address.id] ||
      (address.latitude && address.longitude
        ? { latitude: address.latitude, longitude: address.longitude }
        : null);

    if (!coords) {
      return false; // Don't allow selection if coordinates are missing
    }

    const distance = getDistance(
      restaurantLocation.latitude,
      restaurantLocation.longitude,
      coords.latitude,
      coords.longitude
    );
    return distance <= restaurantRadius;
  };

  // Geocode all addresses that don't have coordinates
  useEffect(() => {
    const geocodeAddresses = async () => {
      if (!restaurantLocation || addresses.length === 0) return;

      for (const address of addresses) {
        const addr = address as Address;
        // Only geocode if coordinates are missing and not already geocoded
        if ((!addr.latitude || !addr.longitude) && !addressCoordinates[addr.id] && !isGeocoding[addr.id]) {
          await geocodeAddress(addr);
        }
      }
    };

    geocodeAddresses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addresses, restaurantLocation]);

  const calculateTotal = () => {
    return items.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const calculateTotalWithDelivery = () => {
    // If cart is empty, return 0 (no delivery charges)
    if (items.length === 0) {
      return 0;
    }
    return calculateTotal() + deliveryCharges;
  };

  // Check if a valid address is selected (within delivery radius)
  const isValidAddressSelected = () => {
    if (!selectedAddress) {
      return false;
    }
    return isAddressWithinRadius(selectedAddress as Address);
  };

  // Get icon component based on address label
  const getAddressIcon = (label: string, isWithinRadius: boolean) => {
    const baseClass = `text-2xl mr-2`;
    const colorClass = isWithinRadius ? "text-gray-700" : "text-red-500";
    const iconClass = `${baseClass} ${colorClass}`;

    switch (label.toLowerCase()) {
      case 'home':
        return <MdHome className={iconClass} />;
      case 'work':
        return <MdWork className={iconClass} />;
      case 'other':
      default:
        return <MdOutlineLocationOn className={iconClass} />;
    }
  };


  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setComment(e.target.value);
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (user === null) {
      router.push(`/${locale}/auth/login`); // Redirect to login
      return
    }

    if (!restaurant) {
      toast.error(tOrder('noRestaurantSelected'));
      return;
    }


    if (!selectedAddress) {
      toast.error(tOrder('selectAddressError'));
      return;
    }

    // Check if selected address is within delivery radius
    if (!isAddressWithinRadius(selectedAddress as Address)) {
      toast.error(tOrder('outOfRangeError', { radius: restaurantRadius }));
      return;
    }


    if (items.length === 0) {
      toast.error(tOrder('cartEmptyError'));
      return;
    }


    try {
      const { user } = useAuthStore.getState();
      if (!user) {
        throw new Error("User not authenticated");
      }
      setIsSubmitting(true);
      // const subtotal = calculateTotal();
      const total = calculateTotalWithDelivery(); // Include delivery charges
      // Create the delivery address string
      const deliveryAddressString = selectedAddress
        ? `${selectedAddress.streetAddress}, ${selectedAddress.city}, ${selectedAddress.state}, ${selectedAddress.zipCode}`
        : "";


      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          restaurantId: restaurant.id,
          items: items.map((item) => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            price: item.price,
            name: item.name,
            options: item.selectedAddons || [],
            addonsTotal: item.addonsTotal || 0,
          })),
          totalAmount: total, // Total includes delivery charges
          selectedAddress: deliveryAddressString,
          specialInstructions: comment || "",
          paymentMethod: selectedPayment, // Include special instructions (optional)
        }),
      });

      if (!response.ok) {
        const message = await response.json();
        throw new Error(message.error || "Failed to place order");
      }

      const apiDatat = await response.json();
      // toast.success('Order placed successfully!');



      const orderId = apiDatat?.id;


      // Redirect to order confirmation page with the orderId
      router.push(`/order-confirmation/${orderId}`);
    } catch (error) {
      console.error("Order creation error:", error);
      toast.error(tOrder('placeOrderError'));
    } finally {
      setIsSubmitting(false);
      clearCart();
      fetchOrders()
      // setLoading(false);

    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchAddresses(); // Fetch addresses when the user is available
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const handleClikRemoveAddress = (addressId: string) => {
    setSelectedAddressId(addressId);
    setIsModalOpen(true);
  };

  const handleEditAddress = (address: Address) => {
    setEditingAddress(address);
    setIsModalAddressOpen(true);
  };

  const handleUpdateAddress = async (addressData: Partial<Address>) => {
    if (!editingAddress) return;

    try {
      await updateAddress({ ...editingAddress, ...addressData } as Address);
      setIsModalAddressOpen(false);
      setEditingAddress(null);
      toast.success(tOrder('updateAddressSuccess'));
      // Refresh addresses to get updated coordinates
      await fetchAddresses();
    } catch (error) {
      toast.error(tOrder('updateAddressError'));
      console.error("Error updating address:", error);
    }
  };

  const confirmDelete = async () => {
    if (!selectedAddressId) return;

    try {
      await removeAddress(selectedAddressId);
      setIsModalOpen(false);
      toast.success(tOrder('deleteAddressSuccess'));
    } catch {
      toast.error(tOrder('deleteAddressError'));
    }
  };

  return (
    <>
      {isSubmitting && <Loader fullScreen message={tOrder('placingOrder')} />}
      <div className="min-h-screen bg-gray-100 p-4 mt-20 pt-10">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-primary mb-8">{tOrder('reviewAndCheckout')}</h1>
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="w-full lg:w-2/3 space-y-8">
              {/* Delivery Addresses */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold ">{tOrder('yourDeliveryAddresses')}</h2>
                  <button
                    onClick={() => {
                      if (!user || user == null) {
                        // Show login modal or alert
                        toast.error(tOrder('addAddressLoginError'))
                      } else {
                        // Open the add address modal
                        setEditingAddress(null);
                        setIsModalAddressOpen(true);
                      }
                    }}
                    className="flex items-center text-gray  transition-colors duration-200"
                  >
                    <IoIosAddCircle className="text-2xl mr-1 text-primary hover:text-primary-600" />
                    <span className=" text-gray-600">{tOrder('addNewAddress')}</span>
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {addresses?.map((address) => {
                    const addressObj = address as Address;
                    // Get coordinates (from cache, address, or geocode)
                    const coords = addressCoordinates[addressObj.id] ||
                      (addressObj.latitude && addressObj.longitude
                        ? { latitude: addressObj.latitude, longitude: addressObj.longitude }
                        : null);

                    const isWithinRadius = isAddressWithinRadius(addressObj);
                    const isGeocodingAddress = isGeocoding[addressObj.id];

                    const distance = restaurantLocation && coords
                      ? getDistance(
                        restaurantLocation.latitude,
                        restaurantLocation.longitude,
                        coords.latitude,
                        coords.longitude
                      )
                      : null;

                    return (
                      <div
                        onClick={() => !isGeocodingAddress && handleSelectAddress(address as Address)}
                        key={address.id}
                        className={`border p-4 rounded-lg ${isGeocodingAddress
                          ? "cursor-wait opacity-50"
                          : isWithinRadius
                            ? "cursor-pointer hover:shadow-md"
                            : "cursor-not-allowed opacity-60"
                          } ${selectedAddress?.id === address.id
                            ? "border-2 border-primary" // Highlight selected address
                            : isWithinRadius
                              ? "border-gray-200"
                              : "border-red-200 bg-red-50"
                          }`}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center">
                            {getAddressIcon(address.label || 'Other', isWithinRadius)}
                            <div className="flex items-center gap-2">
                              <p className="font-semibold">{address.label || tCommon('address')}</p>
                              {address.isDefault && (
                                <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full font-medium">
                                  {tProfile('defaultAddress')}
                                </span>
                              )}
                            </div>
                            {isGeocodingAddress && (
                              <span className="ml-2 px-2 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded-full font-medium">
                                {tOrder('verifying')}
                              </span>
                            )}
                            {!isGeocodingAddress && !isWithinRadius && coords && (
                              <span className="ml-2 px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded-full font-medium">
                                {tOrder('outOfRange')}
                              </span>
                            )}
                            {!isGeocodingAddress && !coords && (
                              <span className="ml-2 px-2 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded-full font-medium">
                                {tOrder('noLocation')}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <MdDelete
                              onClick={(e) => {
                                e.stopPropagation();
                                handleClikRemoveAddress(address.id);
                              }}
                              className="text-xl text-red-500 hover:text-red-700 cursor-pointer"
                            />
                            <MdEdit
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditAddress(address as Address);
                              }}
                              className="text-xl text-blue-500 hover:text-blue-700 cursor-pointer"
                            />
                          </div>
                        </div>
                        <p>{address.city}</p>
                        <p className="text-gray-500 text-sm">
                          {address.streetAddress}, {address.state} {address.zipCode}
                        </p>
                        {isGeocodingAddress && (
                          <p className="text-xs mt-1 text-yellow-600">
                            {tOrder('verifyingLocation')}
                          </p>
                        )}
                        {!isGeocodingAddress && distance !== null && (
                          <p className={`text-xs mt-1 ${isWithinRadius ? "text-gray-400" : "text-red-600 font-medium"}`}>
                            {tOrder('distanceInfo', {
                              distance: distance.toFixed(1),
                              range: isWithinRadius
                                ? tOrder('withinRadius', { radius: restaurantRadius })
                                : tOrder('beyondRadius', { radius: restaurantRadius })
                            })}
                          </p>
                        )}
                        {!isGeocodingAddress && !coords && (
                          <p className="text-xs mt-1 text-yellow-600">
                            {tOrder('verifyLocationError')}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Phone number */}

              {/* <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-primary mb-4">Mobile Number</h2>

              <PhoneInput
                value={phoneNumber}
                onChange={handleChangePhoneNumber}
                inputProps={{
                  name: "phone",
                  required: true,
                }}
                containerClass="w-full"
                inputClass="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
              />
            </div> */}


              {/* Special Instructions */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold    mb-4">{tOrder('specialInstructions')}</h2>
                <input
                  onChange={handleChange}
                  type="text"
                  placeholder={tOrder('specialInstructionsPlaceholder')}
                  className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                />
              </div>

              {/* Payment Method */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold    mb-4">{tOrder('selectPaymentMethod')}</h2>

                <div
                  onClick={() => {
                    setSelectedPayment("COD");
                  }}
                  className="flex items-center justify-between p-4 bg-white border border-primary rounded-lg shadow-sm cursor-pointer hover:bg-gray-50 transition duration-200"
                >
                  <div className="flex items-center gap-3">
                    <FaMoneyBillWave className="text-green-500 text-2xl" />
                    <span className="text-gray-700 font-medium">
                      {tOrder('cashOnDelivery')}
                    </span>
                  </div>
                  <input
                    type="radio"
                    checked={selectedPayment === "COD"}
                    readOnly
                    className="form-radio text-primary"
                  />
                </div>
              </div>
            </div>


            {/* Address Form in Modal */}
            <AddressModal
              isOpen={isModalAddressOpen}
              onClose={() => {
                setIsModalAddressOpen(false);
                setEditingAddress(null);
              }}
            >
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-gray-800">
                  {editingAddress ? tOrder('editAddress') : tOrder('addNewAddress')}
                </h2>
              </div>
              <AddressForm
                initialData={editingAddress || undefined}
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                onSubmit={editingAddress ? handleUpdateAddress : createAddress}
                closeModal={(isOpen) => {
                  setIsModalAddressOpen(isOpen);
                  if (!isOpen) setEditingAddress(null);
                }}
                onCancel={() => {
                  setIsModalAddressOpen(false);
                  setEditingAddress(null);
                }}
                submitLabel={editingAddress ? tCommon('save') : tCommon('save')}
              />
            </AddressModal>


            {/* Order Summary */}
            <div className="w-full lg:w-1/3">
              <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
                <h2 className="text-xl font-semibold   mb-2">{tCart('yourCart')}</h2>
                {restaurant && (
                  <p className="text-sm text-gray-600 mb-4">{restaurant.name}</p>
                )}
                <div className="space-y-4 mb-4">
                  {items.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      {tCart('empty')}
                    </div>
                  ) : (
                    items.map((item, index) => (
                      <div key={index} className="flex flex-col gap-1">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <p className="text-sm text-gray-500"> {item.quantity} x</p>
                            <p className="font-medium text-sm">{item.name}</p>
                          </div>
                          <p className=" text-sm">{formatCurrency(item.price * item.quantity)}</p>
                        </div>
                        {item.selectedAddons && item.selectedAddons.length > 0 && (
                          <div className="ml-8 mb-2">
                            {item.selectedAddons.map((addon, idx) => (
                              <p key={idx} className="text-xs text-gray-500">
                                + {addon.optionName}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600 text-sm">{tCart('subtotal')}</span>
                    <span className="font-medium text-sm">{formatCurrency(calculateTotal())}</span>
                  </div>
                  {items.length > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 text-sm">{tCart('deliveryFee')}</span>
                      <span className="font-medium text-sm">
                        {isLoadingDeliveryCharges ? tMessages('loading') : formatCurrency(deliveryCharges)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg pt-2 font-bold">
                    <span>{tOrder('grandTotal')}</span>
                    <span>{formatCurrency(calculateTotalWithDelivery())}</span>
                  </div>
                </div>


                <form onSubmit={handleSubmit} className=" rounded-lg pt-3">
                  <button
                    disabled={isSubmitting || items.length === 0 || !isValidAddressSelected()}
                    className={`w-full py-3 px-4 rounded-full mt-6 font-semibold transition-colors duration-200 ${isSubmitting || items.length === 0 || !isValidAddressSelected()
                      ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                      : "bg-primary text-white hover:bg-primary-600"
                      }`}
                  >
                    {isSubmitting ? tOrder('placingOrder') : items.length === 0 ? tOrder('cartIsEmpty') : !isValidAddressSelected() ? tOrder('selectValidAddress') : tOrder('placeOrder')}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>


        {/* Confirmation Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
              <h2 className="text-lg font-semibold text-gray-800">
                {tOrder('confirmDeletion')}
              </h2>
              <p className="text-gray-600 mt-2">
                {tOrder('confirmDeletionMessage')}
              </p>
              <div className="mt-4 flex justify-end gap-3">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                >
                  {tCommon('cancel')}
                </button>
                <button
                  onClick={() => confirmDelete()}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  {tCommon('delete')}
                </button>
              </div>
            </div>
          </div>
        )}


      </div>
    </>
  );
}
