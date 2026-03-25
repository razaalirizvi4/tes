"use client";
import Loader from "@/components/Loader";
import { useAuthStore, useOrderStore, useCartStore } from "@/store/useStore";
import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { FaBoxOpen, FaCalendarAlt, FaStore, FaMapMarkerAlt, FaCreditCard, FaRedo } from "react-icons/fa"; // Icons for visual enhancement
import { Order as OrderType } from "@/types";
import { useTranslations } from "next-intl";
import { useCurrency } from "@/hooks/useCurrency";
import { formatCurrency as formatCurrencyUtil } from "@/utils/currency";
import { supabaseClient, RealtimeChannel, DatabaseOrder } from "@/lib/supabaseClient";

// Extended Order type with restaurant information from API
interface OrderWithRestaurant extends OrderType {
  restaurant?: {
    id: string;
    name: string;
    currency?: string | null;
    coverImage?: string | null;
  };
}


function UserOrders() {
  const { user } = useAuthStore();
  const { fetchOrders, isLoading, updateOrder, addOrder } = useOrderStore();
  const orders = useOrderStore((state) => state.orders); // Directly subscribe to orders
  const { formatCurrency: formatCurrencyGlobal } = useCurrency();
  const router = useRouter();
  const { clearCart, setRestaurant, addItem } = useCartStore();
  const tOrder = useTranslations("order");
  const tCommon = useTranslations("common");

  // Helper function to format currency with restaurant-specific currency
  // Uses currency directly from order.restaurant.currency if available
  const formatCurrency = (amount: number | string | null | undefined, restaurantCurrency?: string | null) => {
    if (restaurantCurrency) {
      return formatCurrencyUtil(amount, restaurantCurrency);
    }
    return formatCurrencyGlobal(amount);
  };

  // State for tracking which order is being reordered
  const [reorderingOrderId, setReorderingOrderId] = useState<string | null>(null);

  // Supabase Realtime channel reference
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Fetch orders when user ID changes
  useEffect(() => {
    if (!user?.id) return;
    fetchOrders();
  }, [user?.id, fetchOrders]);

  // Supabase Realtime subscription for order status updates
  useEffect(() => {
    if (!user?.id) return;

    console.log("🔌 Initializing Supabase Realtime subscription for user orders...");

    // Subscribe to UPDATE and INSERT events on the Order table
    // Note: We subscribe to all events and filter by userId in the handler
    // This is more reliable than using table filters which may have casing issues
    const channel = supabaseClient
      .channel(`user-orders-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "Order",
        },
        async (payload) => {
          const updatedOrderData = payload.new as DatabaseOrder;

          // Only process if this order belongs to the current user
          if (updatedOrderData.userId === user.id) {

            // Fetch full order details with all relations (restaurant, orderItems, etc.)
            try {
              const response = await fetch(`/api/orders?orderId=${updatedOrderData.id}`);
              if (response.ok) {
                const fullOrder = await response.json();
                // Update only this specific order in the store (smooth update, no page reload)
                updateOrder(updatedOrderData.id, fullOrder);
              } else {
                // Fallback: refetch all orders if single order fetch fails
                fetchOrders();
              }
            } catch (error) {
              console.error("Error fetching order details:", error);
              fetchOrders();
            }
          } else {
            console.log("⚠️ Order does not belong to current user, ignoring");
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "Order",
        },
        async (payload) => {
          const newOrderData = payload.new as DatabaseOrder;


          // Only process if this order belongs to the current user
          if (newOrderData.userId === user.id) {

            // Fetch full order details with all relations (restaurant, orderItems, etc.)
            try {
              const response = await fetch(`/api/orders?orderId=${newOrderData.id}`);
              if (response.ok) {
                const fullOrder = await response.json();
                // Add new order to the beginning of the list (smooth update, no page reload)
                addOrder(fullOrder);
              } else {
                fetchOrders();
              }
            } catch (error) {
              console.error("Error fetching order details:", error);
              // Fallback: refetch all orders on error
              fetchOrders();
            }
          } else {
            console.log("⚠️ New order does not belong to current user, ignoring");
          }
        }
      )
      .subscribe((status, err) => {
        if (status === "SUBSCRIBED") {
          console.log("✅ Successfully subscribed to user orders table UPDATE and INSERT events");
        } else if (status === "CHANNEL_ERROR") {
          console.error("❌ Error subscribing to user orders table:", err);
        } else if (status === "TIMED_OUT") {
          console.error("❌ Subscription timed out");
        } else if (status === "CLOSED") {
          console.log("🔌 Subscription closed");
        } else {
          console.log("🔄 Subscription status:", status);
        }
      });

    channelRef.current = channel;

    // Cleanup: unsubscribe when component unmounts or user changes
    return () => {
      console.log("🔌 Unsubscribing from Supabase Realtime...");
      if (channelRef.current) {
        supabaseClient.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user?.id, fetchOrders, updateOrder, addOrder]);


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 border border-yellow-400';
      case 'CONFIRMED': return 'bg-blue-100 text-blue-800 border border-blue-400';
      case 'PREPARING': return 'bg-purple-100 text-purple-800 border border-purple-400';
      case 'OUT_FOR_DELIVERY': return 'bg-indigo-100 text-indigo-800 border border-indigo-400';
      case 'DELIVERED': return 'bg-green-100 text-green-800 border border-green-400';
      case 'CANCELLED': return 'bg-red-100 text-red-800 border border-red-400';
      default: return 'bg-gray-100 text-gray-800 border border-gray-400';
    }
  };

  // Handle reorder functionality
  const handleReorder = async (e: React.MouseEvent, order: OrderWithRestaurant) => {
    e.stopPropagation(); // Prevent navigation to order details

    if (!order.restaurant?.id) {
      console.error("Restaurant information is missing");
      return;
    }

    if (!order.orderItems || order.orderItems.length === 0) {
      console.error("No order items to reorder");
      return;
    }

    setReorderingOrderId(order.id); // Set loading state

    try {
      // Check if cart has items from a different restaurant
      const currentCart = useCartStore.getState();
      if (currentCart.restaurant?.id && currentCart.restaurant.id !== order.restaurant.id) {
        // Clear cart if it has items from a different restaurant
        clearCart();
      }

      // Set the restaurant in cart
      setRestaurant({
        id: order.restaurant.id,
        name: order.restaurant.name || "Restaurant",
      });

      // Add all order items to cart
      for (const orderItem of order.orderItems) {
        if (orderItem.menuItemId) {
          // Use menuItem data if available, otherwise fallback to orderItem data
          const itemName = orderItem.menuItem?.label || orderItem.name || "Unknown Item";
          const itemImage = orderItem.menuItem?.image || null;

          await addItem({
            id: "", // Cart item ID will be generated
            menuItemId: orderItem.menuItemId,
            quantity: orderItem.quantity,
            price: orderItem.price,
            name: itemName,
            image: itemImage,
            restaurantId: order.restaurant.id,
            restaurantName: order.restaurant.name || "Restaurant",
          });
        }
      }

      // Set flag to open cart sidebar after navigation
      if (typeof window !== "undefined") {
        localStorage.setItem("openCartAfterNav", "true");
      }

      // Navigate to restaurant page
      router.push(`/restaurants/${order.restaurant.id}`);
    } catch (error) {
      console.error("Error reordering:", error);
      setReorderingOrderId(null); // Reset loading state on error
    }
  };


  // Categorize orders into active and past
  const activeOrderStatuses = ['PENDING', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY'];
  const pastOrderStatuses = ['DELIVERED', 'CANCELLED'];

  const activeOrders = orders.filter((order: OrderWithRestaurant) =>
    activeOrderStatuses.includes(order.status)
  );
  const pastOrders = orders.filter((order: OrderWithRestaurant) =>
    pastOrderStatuses.includes(order.status)
  );

  // Render order card component
  const renderOrderCard = (order: OrderWithRestaurant) => (
    <div
      onClick={() => router.push(`/order-confirmation/${order.id}`)}
      className="shadow-lg rounded-xl p-6 bg-white border border-gray-100  transition-shadow duration-300 cursor-pointer"
    >
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-6 pb-4 border-b border-gray-200">
        <div className="flex items-start gap-4 mb-4 md:mb-0">
          {order.restaurant?.coverImage ? (
            <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 relative">
              <Image
                src={order.restaurant.coverImage}
                alt={order.restaurant.name || 'Restaurant'}
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div className="bg-primary/10 p-3 rounded-lg">
              <FaStore className="text-primary text-2xl" />
            </div>
          )}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              {order.restaurant && (
                <div className="flex items-center gap-2 text-gray-700">
                  <span className="font-semibold text-base">{order.restaurant.name}</span>
                </div>
              )}
              <span className={`px-3 py-1.5 text-xs font-semibold rounded-lg ${getStatusColor(order.status)}`}>
                {order.status === 'PENDING' ? tOrder('orderPending') :
                  order.status === 'CONFIRMED' ? tOrder('orderConfirmed') :
                    order.status === 'PREPARING' ? tOrder('preparingOrder') :
                      order.status === 'OUT_FOR_DELIVERY' ? tOrder('outForDelivery') :
                        order.status === 'DELIVERED' ? tOrder('orderDelivered') :
                          order.status === 'CANCELLED' ? tOrder('orderCancelled') :
                            order.status.replace(/_/g, ' ')}
              </span>

            </div>
            <div className="flex items-center gap-4 text-gray-600 text-sm flex-wrap">
              <span className="flex items-center gap-1">
                <FaCalendarAlt className="text-primary" />
                {new Date(order.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
              {order.deliveryAddress && (
                <>
                  <span className="h-4 w-px bg-gray-300"></span>
                  <span className="flex items-center gap-1">
                    <FaMapMarkerAlt className="text-primary" />
                    <span className="truncate max-w-[200px]">{order.deliveryAddress}</span>
                  </span>
                </>
              )}
              {order.paymentMethod && (
                <>
                  <span className="h-4 w-px bg-gray-300"></span>
                  <span className="flex items-center gap-1">
                    <FaCreditCard className="text-primary" />
                    {order.paymentMethod}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-2xl font-bold text-gray-700">{formatCurrency(order.totalAmount, order.restaurant?.currency)}</span>
          <span className="text-xs text-gray-500 mt-1">{tOrder("totalAmountLabel")}</span>
        </div>
      </div>

      {/* Order Items Section */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">{tOrder("orderItemsLabel")}</h4>
        {order?.orderItems?.map((item) => (
          <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div className="flex flex-col flex-1">
              <span className="font-medium text-gray-900">{item.menuItem?.label || tOrder('unknownItem')}</span>
              <span className="text-gray-600 text-sm mt-1">
                {tOrder('quantityLabel')} {item.quantity} × {formatCurrency(item.price, order.restaurant?.currency)}
              </span>
            </div>
            <span className="text-primary font-medium text-base ml-4">
              {formatCurrency(item.quantity * item.price, order.restaurant?.currency)}
            </span>
          </div>
        ))}
        {/* Reorder Button */}
        {order.restaurant?.id && (
          <div className="flex justify-end mt-4">
            <button
              onClick={(e) => handleReorder(e, order)}
              disabled={reorderingOrderId !== null}
              className="flex items-center gap-2 hover:bg-primary-400 border border-primary-400  text-primary-400 hover:text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FaRedo className="text-sm" />
              <span>{tOrder("reorderItems")}</span>
            </button>
          </div>
        )}
      </div>

      {/* Special Instructions */}
      {order.specialInstructions && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border-l-4 border-primary">
          <p className="text-sm text-gray-700">
            <span className="font-semibold">{tOrder("specialInstructionsLabel")} </span>
            {order.specialInstructions}
          </p>
        </div>
      )}
    </div>
  );

  if (isLoading) {
    return <Loader fullScreen message={tOrder("loadingOrders")} />;
  }

  return (
    <>
      {reorderingOrderId && (
        <Loader fullScreen message={tOrder("addingToCart")} />
      )}
      <div className="p-5 max-w-4xl mx-auto">
        <h3 className="text-3xl font-bold   text-center">{tOrder("yourOrders")}</h3>
        <p className="text-gray-600 text-center mb-8">{tOrder("trackHistory")}</p>

        {!orders.length ? (
          <div className="flex flex-col justify-center items-center h-64 text-gray-500">
            <FaBoxOpen className="text-6xl mb-4 text-gray-300" />
            <p className="text-lg font-medium">{tOrder("noOrders")}</p>
            <p className="text-sm text-gray-400 mt-2">{tOrder("startOrdering")}</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Active Orders Section */}
            {activeOrders.length > 0 && (
              <div className="space-y-6">
                <h4 className="text-2xl font-bold text-gray-800">{tOrder("activeOrders")}</h4>
                {activeOrders.map((order: OrderWithRestaurant) => (
                  <React.Fragment key={order.id}>{renderOrderCard(order)}</React.Fragment>
                ))}
              </div>
            )}

            {/* Past Orders Section */}
            {pastOrders.length > 0 && (
              <div className="space-y-6">
                <h4 className="text-2xl font-bold text-gray-800">{tOrder("pastOrders")}</h4>
                {pastOrders.map((order: OrderWithRestaurant) => (
                  <React.Fragment key={order.id}>{renderOrderCard(order)}</React.Fragment>
                ))}
              </div>
            )}

            {/* Show message if no orders in either category */}
            {activeOrders.length === 0 && pastOrders.length === 0 && (
              <div className="flex flex-col justify-center items-center h-64 text-gray-500">
                <FaBoxOpen className="text-6xl mb-4 text-gray-300" />
                <p className="text-lg font-medium">{tOrder("noOrders")}</p>
                <p className="text-sm text-gray-400 mt-2">{tOrder("startOrdering")}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

export default UserOrders;
