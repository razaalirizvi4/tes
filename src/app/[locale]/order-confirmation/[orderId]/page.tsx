"use client";
import Loader from "@/components/Loader";
import { useCurrency } from "@/hooks/useCurrency";
import { DatabaseOrder, RealtimeChannel, supabaseClient } from "@/lib/supabaseClient";
import { formatCurrency as formatCurrencyUtil } from "@/utils/currency";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { BiSolidFoodMenu } from "react-icons/bi";
import {
    FaCheck,
    FaHome,
    FaMotorcycle,
    FaStore,
    FaCalendarAlt
} from "react-icons/fa";
import { MdLocationOn, MdPayments, MdRestaurant } from "react-icons/md";

interface MenuItem {
  image: string;
  description: string;
}

interface OrderItem {
  name: string;
  price: number;
  quantity: number;
  menuItem: MenuItem;
  options?: any;
}

interface OrderDetailsProps {
  orderNumber: string;
  orderStatus: string;
  deliveryAddress: string;
  orderDate: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  deliveryCharge: number;
  FBRPOSCharge: number;
  totalAmount: number;
  paymentType: string;
  restaurantName: string;
  restaurantAddress: string;
  userName: string;
  userEmail: string;
  restaurantCurrency?: string | null;
  specialInstructions?: string | null;
  scheduledDate?: string | null;
  scheduledSlot?: string | null;
  estimatedDeliveryTime?: string | null;
  restaurantCoverImage?: string | null;
  restaurantCoverImagesList?: string[] | null;
  onCancelOrder?: () => Promise<void>;
  isCancelling?: boolean;
}

// Helper function to get progress step status
const getStepStatus = (currentStatus: string, stepStatus: string) => {
  const statusOrder = ["PENDING", "CONFIRMED", "PREPARING", "OUT_FOR_DELIVERY", "DELIVERED"];

  let normalizedCurrentStatus = currentStatus?.toUpperCase() || "";
  if (normalizedCurrentStatus === "READY_FOR_PICKUP" || normalizedCurrentStatus === "PICKUP_CONFIRMED") {
    normalizedCurrentStatus = "PREPARING";
  }

  const currentIndex = statusOrder.indexOf(normalizedCurrentStatus);
  const stepIndex = statusOrder.indexOf(stepStatus);

  if (stepIndex < currentIndex) return "completed";
  if (stepIndex === currentIndex) return "active";
  return "inactive";
};

// Calculate estimated delivery time
const getEstimatedDeliveryTime = (estimatedDeliveryTime?: string | null): string => {
  // Use restaurant's estimated delivery time or default
  return estimatedDeliveryTime || "25-35 min";
};

const OrderDetails: React.FC<OrderDetailsProps> = ({
  orderNumber,
  orderStatus,
  deliveryAddress,
  items,
  subtotal,
  deliveryCharge,
  totalAmount,
  paymentType,
  restaurantCurrency,
  specialInstructions,
  restaurantName,
  restaurantAddress,
  estimatedDeliveryTime,
  restaurantCoverImage,
  restaurantCoverImagesList,
  onCancelOrder,
  isCancelling,
  scheduledDate,
  scheduledSlot,
}) => {
  const { formatCurrency: formatCurrencyGlobal } = useCurrency();
  const tOrder = useTranslations("order");
  const tCommon = useTranslations("common");
  const tCart = useTranslations("cart");

  // Helper function to format currency with restaurant-specific currency
  const formatCurrency = (amount: number | string | null | undefined) => {
    if (restaurantCurrency) {
      return formatCurrencyUtil(amount, restaurantCurrency);
    }
    return formatCurrencyGlobal(amount);
  };

  // Normalize order status to uppercase for consistent comparison
  const normalizedStatus = orderStatus?.toUpperCase() || "";
  // Get status messages
  const getStatusMessage = () => {
    switch (normalizedStatus) {
      case "PENDING":
        return tOrder('pendingMessage');
      case "CONFIRMED":
        return tOrder('confirmedMessage');
      case "PREPARING":
      case "READY_FOR_PICKUP":
      case "PICKUP_CONFIRMED":
        return tOrder('preparingMessage');
      case "OUT_FOR_DELIVERY":
        return tOrder('deliveryMessage');
      case "DELIVERED":
        return tOrder('deliveredMessage');
      case "CANCELLED":
        return tOrder('cancelledMessage');
      default:
        return tOrder('onTheWayMessage');
    }
  };

  const getStatusTitle = () => {
    switch (normalizedStatus) {
      case "PENDING":
        return tOrder('orderPending');
      case "CONFIRMED":
        return tOrder('orderConfirmed');
      case "PREPARING":
      case "READY_FOR_PICKUP":
      case "PICKUP_CONFIRMED":
        return tOrder('preparingOrder');
      case "OUT_FOR_DELIVERY":
        return tOrder('outForDelivery');
      case "DELIVERED":
        return tOrder('orderDelivered');
      case "CANCELLED":
        return tOrder('orderCancelled');
      default:
        return tOrder('orderConfirmed');
    }
  };

  const estimatedTime = getEstimatedDeliveryTime(estimatedDeliveryTime);

  // Progress steps
  const steps = [
    { status: "PENDING", label: tOrder('orderPending'), icon: FaCheck },
    { status: "CONFIRMED", label: tOrder('orderConfirmed'), icon: MdRestaurant },
    { status: "PREPARING", label: tOrder('preparingOrder'), icon: BiSolidFoodMenu },
    { status: "OUT_FOR_DELIVERY", label: tOrder('orderOnWay'), icon: FaMotorcycle },
    { status: "DELIVERED", label: tOrder('orderDelivered'), icon: FaHome },
  ];

  // Get status-specific content for preparation section
  const getPreparationContent = () => {
    switch (normalizedStatus) {
      case "PENDING":
        return {
          icon: FaStore,
          title: tOrder('waitingForConfirmation'),
          description: tOrder('waitingDescription'),
        };
      case "CONFIRMED":
        return {
          icon: MdRestaurant,
          title: tOrder('orderConfirmed'),
          description: tOrder('confirmedMessage'),
        };
      case "PREPARING":
      case "READY_FOR_PICKUP":
      case "PICKUP_CONFIRMED":
        return {
          icon: BiSolidFoodMenu,
          title: tOrder('restaurantPreparing'),
          description: tOrder('sitTight'),
        };
      case "OUT_FOR_DELIVERY":
        return {
          icon: FaMotorcycle,
          title: tOrder('orderOnWay'),
          description: tOrder('orderOnWayDescription'),
        };
      default:
        return {
          icon: FaStore,
          title: tOrder('processingOrder'),
          description: tOrder('processingDescription'),
        };
    }
  };

  const preparationContent = getPreparationContent();
  const PreparationIcon = preparationContent.icon;

  // Get status icon for header
  const getStatusIcon = () => {
    switch (normalizedStatus) {
      case "PENDING":
        return FaCheck;
      case "CONFIRMED":
        return MdRestaurant;
      case "PREPARING":
      case "READY_FOR_PICKUP":
      case "PICKUP_CONFIRMED":
        return BiSolidFoodMenu;
      case "OUT_FOR_DELIVERY":
        return FaMotorcycle;
      case "DELIVERED":
        return FaHome;
      case "CANCELLED":
        return FaStore;
      default:
        return MdRestaurant;
    }
  };

  const StatusIcon = getStatusIcon();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <main className="max-w-6xl mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8 mt-20">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Status Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-primary-50 p-6 border-b border-pink-100">
              <div className="flex flex-col md:flex-row justify-between items-center md:items-center gap-4">
                <div className="text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary-400 text-white">
                      <StatusIcon className="text-lg" />
                    </span>
                    <h1 className="text-2xl font-bold text-gray-900">{getStatusTitle()}</h1>
                  </div>
                  <p className="text-gray-600">{getStatusMessage()}</p>
                </div>
                <div className="text-center md:text-right">
                  <p className="text-sm text-gray-600 uppercase tracking-wider font-medium">
                    {tOrder('estimatedDelivery')}
                  </p>
                  <div className="flex items-center justify-center md:justify-end gap-2">
                    <p className="text-3xl font-bold text-primary-400">{estimatedTime} </p>
                    <p className="mt-auto">{tOrder('minutes')}</p>
                  </div>
                </div>
              </div>
            </div>
            {scheduledDate && (
              <div className="bg-blue-50 p-4 border-b border-blue-100 flex items-center gap-3">
                <div className="bg-white p-2 rounded-full shadow-sm text-blue-600">
                  <FaCalendarAlt className="text-xl" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                    {tOrder('scheduledOrder')}
                  </h3>
                  <p className="text-sm font-bold text-gray-900">
                    {new Date(scheduledDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    {scheduledSlot && ` at ${scheduledSlot}`}
                  </p>
                </div>
              </div>
            )}
            <div className="p-6">
              {/* Desktop Progress Tracker */}
              <div className="hidden md:flex items-center justify-between relative w-full">
                <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-gray-200 -z-10"></div>
                {steps.map((step) => {
                  const stepStatus = getStepStatus(orderStatus, step.status);
                  const StepIcon = step.icon;
                  const isActive = stepStatus === "active";
                  const isCompleted = stepStatus === "completed";

                  return (
                    <div key={step.status} className="flex flex-col items-center bg-white px-2 z-10">
                      <div
                        className={`${isActive ? "w-10 h-10" : "w-8 h-8"} rounded-full ${isCompleted
                          ? "bg-green-500 text-white"
                          : isActive
                            ? "bg-primary-400 ring-4 ring-primary-200 text-white animate-pulse"
                            : "bg-gray-200 text-gray-400"
                          } flex items-center justify-center mb-2`}
                      >
                        <StepIcon className={isActive ? "text-lg" : "text-sm"} />
                      </div>
                      <span
                        className={`text-xs text-center ${isActive
                          ? "font-bold text-primary-400"
                          : isCompleted
                            ? "font-semibold text-green-500"
                            : "font-medium text-gray-400"
                          }`}
                      >
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
              {/* Mobile Progress Tracker */}
              <div className="md:hidden space-y-4">
                {steps.map((step) => {
                  const stepStatus = getStepStatus(orderStatus, step.status);
                  const StepIcon = step.icon;
                  const isActive = stepStatus === "active";
                  const isCompleted = stepStatus === "completed";

                  return (
                    <div key={step.status} className="flex items-center justify-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full ${isCompleted
                          ? "bg-green-500 text-white"
                          : isActive
                            ? "bg-primary-400 text-white"
                            : "bg-gray-200 text-gray-500"
                          } flex items-center justify-center ${isActive ? "" : "opacity-50"}`}
                      >
                        <StepIcon className="text-sm" />
                      </div>
                      <span
                        className={`font-medium ${isActive
                          ? "font-bold text-primary-400"
                          : isCompleted
                            ? "text-green-500"
                            : "text-gray-900"
                          }`}
                      >
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Restaurant Preparation Status */}
          {orderStatus !== "DELIVERED" && orderStatus !== "CANCELLED" && (
            <div className="bg-gray-50 rounded-xl shadow-sm border border-gray-100 p-0 overflow-hidden relative min-h-[300px] flex flex-col justify-center items-center">
              <div className="text-center p-8">
                <PreparationIcon className="text-6xl text-gray-300 mb-4 mx-auto" />
                <h3 className="text-lg font-medium text-gray-900">
                  {preparationContent.title}
                </h3>
                <p className="text-gray-500 text-sm max-w-xs mx-auto mt-2">
                  {preparationContent.description}
                </p>
              </div>
            </div>
          )}


        </div>

        {/* Right Column - Order Details */}
        <div className="space-y-6">
          {/* Order Details Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center justify-between">
              {tOrder('orderDetails')}
              <span className="text-xs font-normal px-2 py-1 bg-gray-100 rounded text-gray-600">
                #{orderNumber.slice(-5)}
              </span>
            </h2>
            <div className="flex items-start gap-3 mb-6 pb-6 border-b border-gray-100">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex-shrink-0 flex items-center justify-center text-gray-400 overflow-hidden relative">
                {(() => {
                  // Determine which image to use - same logic as Restaurants Management page
                  const images = restaurantCoverImagesList && restaurantCoverImagesList.length > 0
                    ? restaurantCoverImagesList
                    : restaurantCoverImage
                      ? [restaurantCoverImage]
                      : null;

                  if (images && images.length > 0) {
                    return (
                      <Image
                        src={images[0]}
                        alt={restaurantName}
                        fill
                        className="object-cover"
                      />
                    );
                  }
                  // Fallback to icon if no image available
                  return <FaStore className="text-xl" />;
                })()}
              </div>
              <div>
                <h3 className="font-bold text-sm text-gray-900">{restaurantName}</h3>
                <p className="text-xs text-gray-500 ">{restaurantAddress}</p>
                {/* <button className="text-xs text-primary-400 font-medium mt-2 flex items-center gap-1">
                  <FaPhone className="text-[14px]" /> Call Restaurant
                </button> */}
              </div>
            </div>
            <div className="space-y-4 mb-6">
              {items.map((item, index) => (
                <div key={index} className="flex gap-3">
                  <div className="w-6 font-bold text-sm text-gray-500 pt-1">{item.quantity}x</div>
                  <div className="flex-grow">
                    <div className="flex justify-between items-start">
                      <h4 className="text-sm font-medium text-gray-900">{item.name}</h4>
                      <span className="text-sm font-medium text-gray-600">
                        {formatCurrency(item.price * item.quantity)}
                      </span>
                    </div>
                    {item.menuItem.description && (
                      <p className="text-xs text-gray-500 mt-1">{item.menuItem.description}</p>
                    )}
                    {item.options && Array.isArray(item.options) && item.options.length > 0 && (
                      <div className="mt-1">
                        {item.options.map((addon: any, idx: number) => (
                          <p key={idx} className="text-xs text-gray-500">
                            + {addon.optionName}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-2 border-t border-gray-100 pt-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">{tCart('subtotal')}</span>
                <span className="text-gray-900">{formatCurrency(subtotal)}</span>
              </div>
              {deliveryCharge > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{tCart('deliveryFee')}</span>
                  <span className="text-gray-900">{formatCurrency(deliveryCharge)}</span>
                </div>
              )}
            </div>
            <div className="mt-4 pt-4 border-t border-dashed border-gray-200">
              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-900">{tCart('total')}</span>
                <span className="font-bold text-xl text-primary-400 ">{formatCurrency(totalAmount)}</span>
              </div>
              <div className="mt-2 flex items-center gap-2 text-xs text-gray-500 bg-gray-50 p-2 rounded">
                <MdPayments className="text-sm text-green-600" />
                {tOrder('payment')}: {paymentType}
              </div>
            </div>
            {orderStatus !== "DELIVERED" && orderStatus !== "OUT_FOR_DELIVERY" && orderStatus !== "CANCELLED" && orderStatus !== "PREPARING" && (
              <>
                <button
                  onClick={onCancelOrder}
                  disabled={isCancelling}
                  className="w-full mt-6 py-3 border border-red-300 rounded-lg text-sm font-medium text-red-700 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCancelling ? tOrder('cancelling') : tOrder('cancelOrder')}
                </button>
                <p className="text-[10px] text-center text-gray-400 mt-2">
                  {tOrder('cancellationNote')}
                </p>
              </>
            )}
          </div>

          {/* Delivery Address Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-bold text-sm text-gray-900 mb-3">{tOrder('deliveryAddress')}</h3>
            <div className="flex gap-3">
              <div className="mt-1">
                <MdLocationOn className="text-gray-400 text-xl" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{tCommon('home')}</p>
                <p className="text-sm text-gray-500 leading-relaxed">{deliveryAddress}</p>
                {specialInstructions && (
                  <p className="text-xs text-gray-400 mt-1">{tOrder('noteToRider')}: {specialInstructions}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default function OrderDetailsPage() {
  const tOrder = useTranslations("order");
  const [orderDetails, setOrderDetails] = useState<OrderDetailsProps | null>(
    null
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState<boolean>(false);

  const params = useParams();
  const orderId = params.orderId;

  // Supabase Realtime channel reference
  const channelRef = useRef<RealtimeChannel | null>(null);

  const fetchOrderDetails = useCallback(async () => {
    if (!orderId) return;

    try {
      const response = await fetch(`/api/orders/${orderId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch order details");
      }
      const data = await response.json();

      interface ApiOrderItem {
        name: string;
        price: number;
        quantity: number;
        menuItem: {
          image: string;
          description: string;
        };
      }

      const orderItems: OrderItem[] = data.orderItems.map(
        (item: any) => ({
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          options: item.options,
          menuItem: {
            image: item.menuItem.image,
            description: item.menuItem.description,
          },
        })
      );

      // Calculate subtotal from order items
      const subtotal = orderItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );

      // Calculate delivery charge as the difference between totalAmount and subtotal
      const deliveryCharge = data.totalAmount - subtotal;

      setOrderDetails({
        orderNumber: data.id,
        orderStatus: data.status,
        deliveryAddress: data.deliveryAddress,
        orderDate: new Date(data.createdAt).toLocaleDateString(),
        items: orderItems,
        subtotal: subtotal,
        tax: 0,
        deliveryCharge: deliveryCharge,
        FBRPOSCharge: 0,
        totalAmount: data.totalAmount,
        paymentType:
          data.paymentMethod === "cod"
            ? "Cash on Delivery"
            : data.paymentMethod?.toUpperCase() || "Cash on Delivery",
        restaurantName: data.restaurant.name,
        restaurantAddress: data.restaurant.address,
        userName: data.user.name || data.user.email,
        userEmail: data.user.email,
        restaurantCurrency: data.restaurant.currency || null,
        specialInstructions: data.specialInstructions || null,
        scheduledDate: data.scheduledDate || null,
        scheduledSlot: data.scheduledSlot || null,
        estimatedDeliveryTime: data.restaurant.deliveryTime || null,
        restaurantCoverImage: data.restaurant.coverImage || null,
        restaurantCoverImagesList: data.restaurant.coverImagesList || null,
      });
    } catch {
      setError("An error occurred while fetching order details");
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrderDetails();
  }, [fetchOrderDetails]);

  // Supabase Realtime subscription for order status updates
  useEffect(() => {
    if (!orderId) return;

    console.log("🔌 Initializing Supabase Realtime subscription for order:", orderId);

    // Subscribe to UPDATE events on the Order table
    // Note: We subscribe to all UPDATE events and filter by orderId in the handler
    // This is more reliable than using table filters which may have casing issues
    const channel = supabaseClient
      .channel(`order-${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "Order",
        },
        async (payload) => {
          const updatedOrderData = payload.new as DatabaseOrder;
          // Only process if this is the order we're viewing
          if (updatedOrderData.id === orderId) {
            // Refetch order details to get the latest data with all relations
            fetchOrderDetails();
          } else {
            console.log("⚠️ Order does not match current order, ignoring");
          }
        }
      )
      .subscribe((status, err) => {
        if (status === "SUBSCRIBED") {
          console.log("✅ Successfully subscribed to order table UPDATE events");
        } else if (status === "CHANNEL_ERROR") {
          console.error("❌ Error subscribing to order table:", err);
        } else if (status === "TIMED_OUT") {
          console.error("❌ Subscription timed out");
        } else if (status === "CLOSED") {
          console.log("🔌 Subscription closed");
        } else {
          console.log("🔄 Subscription status:", status);
        }
      });

    channelRef.current = channel;

    // Cleanup: unsubscribe when component unmounts or orderId changes
    return () => {
      console.log("🔌 Unsubscribing from Supabase Realtime...");
      if (channelRef.current) {
        supabaseClient.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [orderId, fetchOrderDetails]);

  // Cancel order handler
  const handleCancelOrder = useCallback(async () => {
    if (!orderId) return;

    // Check if order can be cancelled (only PENDING or CONFIRMED status)
    const currentStatus = orderDetails?.orderStatus?.toUpperCase();
    if (currentStatus && currentStatus !== "PENDING" && currentStatus !== "CONFIRMED") {
      alert("This order cannot be cancelled. Cancellation is only available before the restaurant starts preparing.");
      return;
    }

    // Confirm cancellation
    // if (!confirm("Are you sure you want to cancel this order?")) {
    //   return;
    // }

    setIsCancelling(true);
    try {
      const response = await fetch(`/api/orders`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderId, status: "CANCELLED" }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to cancel order");
      }

      // Update local state immediately
      if (orderDetails) {
        setOrderDetails({
          ...orderDetails,
          orderStatus: "CANCELLED",
        });
      }

      // Fetch latest order details
      await fetchOrderDetails();
    } catch (error) {
      console.error("Error cancelling order:", error);
      alert(error instanceof Error ? error.message : "Failed to cancel order. Please try again.");
    } finally {
      setIsCancelling(false);
    }
  }, [orderId, orderDetails, fetchOrderDetails]);

  if (loading) {
    return <Loader fullScreen message={tOrder('loadingOrderDetails')} />;
  }

  if (error) {
    return <div className="text-center py-8 text-red-600">{error}</div>;
  }

  if (!orderDetails) {
    return <div className="text-center py-8">{tOrder('orderNotFound')}</div>;
  }

  return (
    <OrderDetails
      {...orderDetails}
      onCancelOrder={handleCancelOrder}
      isCancelling={isCancelling}
    />
  );
}
