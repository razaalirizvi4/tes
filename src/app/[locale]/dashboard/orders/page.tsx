"use client";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import ReceiptModal from "@/components/pos/ReceiptModal";
import { useCurrency } from "@/hooks/useCurrency";
import {
  DatabaseOrder,
  RealtimeChannel,
  supabaseClient,
} from "@/lib/supabaseClient";
import { ExtendedOrderItem, OrderWithDetails } from "@/services/orderService";
import { useAuthStore } from "@/store/useStore";
import { formatCurrency as formatCurrencyUtil } from "@/utils/currency";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { format } from "date-fns";
import { notFound } from "next/navigation";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  FaBoxOpen,
  FaCheck,
  FaHome,
  FaMotorcycle,
  FaStore,
  FaTimesCircle
} from "react-icons/fa";

import { useTranslations } from "next-intl";
import {
  MdAccessTime,
  MdRestaurant
} from "react-icons/md";

const ORDER_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PREPARING",
  "READY_FOR_PICKUP",
  "PICKUP_CONFIRMED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
];

const PAGE_SIZE = 10;

interface Restaurant {
  id: string;
  name: string;
}

// Extended type to include currency and optional driver from API
interface OrderWithCurrency extends Omit<OrderWithDetails, 'orderItems' | 'restaurant' | 'user'> {
  orderItems: ExtendedOrderItem[];
  restaurant: {
    id: string;
    name: string;
    vendorId: string;
    currency?: string | null;
  };
  user: {
    phoneNumber: string | null;
    name: string | null;
    email: string;
  };
  driver?: {
    id: string;
    user: { name: string | null; email: string };
  } | null;
}

const OrdersPage = () => {
  const { user } = useAuthStore((state) => state);
  const { formatCurrency: formatCurrencyGlobal } = useCurrency();

  const tDashboard = useTranslations("dashboard");
  const tOrder = useTranslations("order");
  const tCart = useTranslations("cart");
  const tCommon = useTranslations("common");

  // Statuses where we show the assigned driver name (pickup confirmed or out for delivery)
  const DRIVER_NAME_STATUSES = ["PICKUP_CONFIRMED", "OUT_FOR_DELIVERY"];
  const showDriverNameForStatus = (status: string) =>
    DRIVER_NAME_STATUSES.includes(status);
  const getDriverDisplayName = (order: OrderWithCurrency) =>
    order.driver?.user?.name || order.driver?.user?.email || null;
  // For Driver column: show driver name only for PICKUP_CONFIRMED/OUT_FOR_DELIVERY when assigned, else "Not Assigned"
  const getDriverColumnDisplay = (order: OrderWithCurrency) =>
    showDriverNameForStatus(order.status) && getDriverDisplayName(order)
      ? getDriverDisplayName(order)
      : tDashboard("notAssigned");

  // Helper to get translated status
  const getStatusTranslation = (status: string) => {
    switch (status) {
      case "PENDING":
        return tDashboard("pending");
      case "CONFIRMED":
        return tDashboard("confirmed");
      case "PREPARING":
        return tDashboard("preparing");
      case "READY_FOR_PICKUP":
        return tDashboard("readyForPickup");
      case "PICKUP_CONFIRMED":
        return tDashboard("pickupConfirmed");
      case "OUT_FOR_DELIVERY":
        return tDashboard("outForDelivery");
      case "DELIVERED":
        return tDashboard("delivered");
      case "CANCELLED":
        return tDashboard("cancelled");
      default:
        return status;
    }
  };

  const isSuperAdmin = useAuthStore(
    (state) => state.user?.role === "SUPER_ADMIN"
  );

  const vendorId = !isSuperAdmin ? user?.vendorProfile?.id : undefined;
  const isVendor = Boolean(vendorId);
  const [accessChecked, setAccessChecked] = useState(false);

  useEffect(() => {
    setAccessChecked(true);
  }, []);

  // Helper function to format currency with restaurant-specific currency
  const formatCurrency = (amount: number | string | null | undefined, restaurantCurrency?: string | null) => {
    if (restaurantCurrency) {
      return formatCurrencyUtil(amount, restaurantCurrency);
    }
    return formatCurrencyGlobal(amount);
  };

  const [orders, setOrders] = useState<OrderWithCurrency[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithCurrency | null>(
    null
  );
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<unknown>(null);
  const [isFetchingReceipt, setIsFetchingReceipt] = useState(false);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const tVendor = useTranslations("vendor");

  // Supabase Realtime channel reference
  const channelRef = useRef<RealtimeChannel | null>(null);
  // Ref to track current page without causing re-subscriptions
  const pageRef = useRef(page);

  const orderBelongsToScope = useCallback(
    (order: OrderWithCurrency) => {
      if (isSuperAdmin) return true;
      return order.restaurant.vendorId === vendorId;
    },
    [isSuperAdmin, vendorId]
  );

  const fetchOrders = useCallback(
    async (pageToFetch = 1) => {
      if (!isSuperAdmin && !vendorId) return;

      setIsLoading(true);

      try {
        const params = new URLSearchParams({
          page: pageToFetch.toString(),
          pageSize: PAGE_SIZE.toString(),
        });

        if (!isSuperAdmin && vendorId) {
          params.append("vendorId", vendorId);
        }

        // Add restaurant filter for super admin
        if (isSuperAdmin && selectedRestaurantId) {
          params.append("restaurantId", selectedRestaurantId);
        }

        const response = await fetch(`/api/orders?${params.toString()}`);
        const result = await response.json();

        // Backend already filters by vendorId, so we can use the data directly
        const orders: OrderWithCurrency[] = Array.isArray(result)
          ? result
          : result?.data ?? [];

        setOrders(orders);

        if (result?.meta) {
          // Use backend pagination metadata
          setTotalOrders(result.meta.total ?? 0);
          setTotalPages(result.meta.totalPages ?? 1);
        } else {
          // Fallback for non-paginated responses
          setTotalOrders(orders.length);
          setTotalPages(1);
        }
      } catch (error) {
        console.error("Error fetching orders:", error);
        setOrders([]);
        setTotalOrders(0);
        setTotalPages(1);
      } finally {
        setIsLoading(false);
      }
    },
    [isSuperAdmin, vendorId, selectedRestaurantId]
  );
  /**
   * Fetch full order details by ID from the API
   * This is needed because Supabase Realtime only sends the raw row data without relations
   */
  const fetchOrderById = useCallback(
    async (orderId: string): Promise<OrderWithCurrency | null> => {
      try {
        const response = await fetch(`/api/orders?orderId=${orderId}`);
        if (!response.ok) {
          console.error("Failed to fetch order details:", response.statusText);
          return null;
        }
        const result = await response.json();
        // Handle both array and single object responses
        const order = Array.isArray(result) ? result[0] : result;
        return order as OrderWithCurrency;
      } catch (error) {
        console.error("Error fetching order details:", error);
        return null;
      }
    },
    []
  );

  /**
   * Supabase Realtime subscription for new orders (INSERT events) and order updates (UPDATE events)
   */
  useEffect(() => {
    if (!isSuperAdmin && !vendorId) return;

    console.log("🔌 Initializing Supabase Realtime subscription...");

    // Subscribe to INSERT and UPDATE events on the Order table
    const channel = supabaseClient
      .channel("orders-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "Order",
        },
        async (payload) => {
          const newOrderData = payload.new as DatabaseOrder;

          console.log("📦 New order INSERT event received:", newOrderData.id);
          console.log("📦 Order data:", newOrderData);

          // Fetch full order details with relations (user, restaurant, orderItems)
          const fullOrder = await fetchOrderById(newOrderData.id);

          if (!fullOrder) {
            console.error(
              "Failed to fetch full order details for:",
              newOrderData.id
            );
            return;
          }

          console.log("✅ Full order details fetched:", fullOrder.id);

          // Check if order belongs to current user's scope
          if (!orderBelongsToScope(fullOrder)) {
            console.log("⚠️ Order not in scope, ignoring:", fullOrder.id);
            return;
          }

          console.log("✅ Adding new order to UI smoothly:", fullOrder.id);

          // Update total orders count
          setTotalOrders((prev) => {
            const nextTotal = prev + 1;
            setTotalPages(Math.ceil(nextTotal / PAGE_SIZE));
            return nextTotal;
          });

          // Add new order to the beginning of the list (only if on page 1)
          // This ensures smooth addition without page reload
          if (pageRef.current === 1) {
            setOrders((prev) => {
              // Prevent duplicates
              const exists = prev.find((order) => order.id === fullOrder.id);
              if (exists) {
                console.log(
                  "⚠️ Order already exists in list, skipping:",
                  fullOrder.id
                );
                return prev;
              }

              const updatedOrders = [fullOrder, ...prev];
              // Keep only the first page worth of orders
              const trimmedOrders = updatedOrders.slice(0, PAGE_SIZE);
              console.log("✅ New order added smoothly to table:", fullOrder.id);
              return trimmedOrders;
            });
          } else {
            console.log("⚠️ New order received but not on page 1, skipping UI update");
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "Order",
        },
        async (payload) => {
          const updatedOrderData = payload.new as DatabaseOrder;
          const oldOrderData = payload.old as DatabaseOrder;

          console.log("🔄 Order UPDATE event received:", updatedOrderData.id);
          console.log("📊 Status changed from", oldOrderData.status, "to", updatedOrderData.status);

          // Fetch full order details with relations
          const fullOrder = await fetchOrderById(updatedOrderData.id);

          if (!fullOrder) {
            console.error(
              "Failed to fetch full order details for:",
              updatedOrderData.id
            );
            return;
          }

          // Check if order belongs to current user's scope
          if (!orderBelongsToScope(fullOrder)) {
            console.log("⚠️ Order not in scope, ignoring:", fullOrder.id);
            return;
          }

          console.log("✅ Updating order in UI smoothly:", fullOrder.id);

          // Update the order in the list if it exists (smooth update, no page reload)
          setOrders((prev) => {
            const orderIndex = prev.findIndex((order) => order.id === fullOrder.id);
            if (orderIndex !== -1) {
              // Order exists in current list, update it smoothly
              const updatedOrders = [...prev];
              updatedOrders[orderIndex] = fullOrder;
              console.log("✅ Order updated in table row:", fullOrder.id, "Status:", fullOrder.status);
              return updatedOrders;
            }
            // Order not in current list - might be on a different page
            // Check if it should be visible on current page based on filters
            console.log("⚠️ Order not in current page list, but update received:", fullOrder.id);
            return prev;
          });

          // If the selected order was updated, update it as well (smooth update in sidebar/modal)
          setSelectedOrder((prev) => {
            if (prev?.id === fullOrder.id) {
              console.log("✅ Selected order updated in sidebar/modal:", fullOrder.id);
              return fullOrder;
            }
            return prev;
          });
        }
      )
      .subscribe((status, err) => {
        if (status === "SUBSCRIBED") {
          console.log(
            "✅ Successfully subscribed to orders table INSERT and UPDATE events"
          );
        } else if (status === "CHANNEL_ERROR") {
          console.error("❌ Error subscribing to orders table:", err);
        } else if (status === "TIMED_OUT") {
          console.error("❌ Subscription timed out");
        } else if (status === "CLOSED") {
          console.log("🔌 Subscription closed");
        } else {
          console.log("🔄 Subscription status:", status);
        }
      });

    channelRef.current = channel;

    // Cleanup: unsubscribe when component unmounts or dependencies change
    return () => {
      console.log("🔌 Unsubscribing from Supabase Realtime...");
      if (channelRef.current) {
        supabaseClient.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [isSuperAdmin, vendorId, orderBelongsToScope, fetchOrderById]);

  // Fetch restaurants for super admin
  useEffect(() => {
    if (isSuperAdmin) {
      const fetchRestaurants = async () => {
        try {
          const response = await fetch("/api/restaurants");
          if (response.ok) {
            const data = await response.json();
            setRestaurants(
              data.map((r: Restaurant) => ({ id: r.id, name: r.name }))
            );
          }
        } catch (error) {
          console.error("Error fetching restaurants:", error);
        }
      };
      fetchRestaurants();
    }
  }, [isSuperAdmin]);

  // Update pageRef whenever page changes
  useEffect(() => {
    pageRef.current = page;
  }, [page]);

  useEffect(() => {
    setPage(1);
  }, [isSuperAdmin, vendorId, selectedRestaurantId]);

  useEffect(() => {
    if (!isSuperAdmin && !vendorId) return;
    fetchOrders(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, isSuperAdmin, vendorId, selectedRestaurantId]);

  // Handle status update from vendor (when vendor changes status via dropdown)
  // Note: When customer cancels, Supabase Realtime will automatically update via the subscription above
  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/orders`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderId, status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update order status");
      }

      const updatedOrder = await response.json();

      // Update UI optimistically (Supabase Realtime will also trigger an update, but this makes it instant)
      setOrders((prev) =>
        prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o))
      );

      if (selectedOrder?.id === orderId) {
        setSelectedOrder(updatedOrder);
      }

      console.log("✅ Order status updated by vendor:", orderId, "to", newStatus);
    } catch (error) {
      console.error("Error updating order status:", error);
      // Optionally show error toast/notification to user
    }
  };

  const handleFetchReceipt = async (orderId: string) => {
    setIsFetchingReceipt(true);
    try {
      const res = await fetch(`/api/pos/order/${orderId}/receipt`);
      const data = await res.json();
      if (res.ok) {
        setReceiptData(data);
        setIsReceiptModalOpen(true);
      } else {
        alert(data.error || "Receipt not found for this order");
      }
    } catch (error) {
      console.error("Error fetching receipt:", error);
    } finally {
      setIsFetchingReceipt(false);
    }
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-amber-100 text-amber-800";

      case "CONFIRMED":
        return "bg-blue-100 text-blue-800";

      case "PREPARING":
        return "bg-purple-100 text-purple-800";

      case "READY_FOR_PICKUP":
        return "bg-orange-100 text-orange-800";

      case "PICKUP_CONFIRMED":
        return "bg-teal-100 text-teal-800";

      case "OUT_FOR_DELIVERY":
        return "bg-indigo-100 text-indigo-800";

      case "DELIVERED":
        return "bg-green-100 text-green-800";

      case "CANCELLED":
        return "bg-red-100 text-red-800";

      default:
        return "bg-gray-100 text-gray-800";
    }
  };


  // Get status icon component
  const getStatusIcon = (status: string) => {
    switch (status?.toUpperCase()) {

      case "PENDING":
        return MdAccessTime; // waiting

      case "CONFIRMED":
        return FaCheck; // accepted

      case "PREPARING":
        return MdRestaurant; // cooking

      case "READY_FOR_PICKUP":
        return FaStore; // ready at store

      case "PICKUP_CONFIRMED":
        return FaBoxOpen; // picked up

      case "OUT_FOR_DELIVERY":
        return FaMotorcycle; // on the way

      case "DELIVERED":
        return FaHome; // completed

      case "CANCELLED":
        return FaTimesCircle; // cancelled

      default:
        return MdRestaurant;
    }
  };

  const handleRestaurantFilterChange = (restaurantId: string) => {
    setSelectedRestaurantId(restaurantId);
    setPage(1);
    setIsDropdownOpen(false);
    setSearchQuery("");
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setIsDropdownOpen(true);
  };

  const filteredRestaurants = restaurants.filter((restaurant) =>
    restaurant.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedRestaurantName =
    selectedRestaurantId === ""
      ? "All Restaurants"
      : restaurants.find((r) => r.id === selectedRestaurantId)?.name ||
      "All Restaurants";

  // Orders page is only for vendors; super admin and others see Not Found
  if (accessChecked && !isVendor) {
    notFound();
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
        setSearchQuery("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Prevent body scroll when modal is open on smaller screens
  useEffect(() => {
    if (selectedOrder) {
      const checkScreenSize = () => {
        if (window.innerWidth < 1660) {
          // Custom breakpoint is 1660px
          document.body.style.overflow = "hidden";
        } else {
          document.body.style.overflow = "";
        }
      };

      checkScreenSize();
      window.addEventListener("resize", checkScreenSize);

      return () => {
        document.body.style.overflow = "";
        window.removeEventListener("resize", checkScreenSize);
      };
    } else {
      document.body.style.overflow = "";
    }
  }, [selectedOrder]);

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex justify-between flex-wrap items-center mb-4">
          <h1 className="text-2xl font-semibold">{tDashboard("orders")}</h1>
          {isSuperAdmin && (
            <div className="flex items-center gap-2">
              <label
                htmlFor="restaurant-filter"
                className="text-sm font-medium text-gray-700"
              >
                {tDashboard("filterByStatus")}
              </label>
              <div className="relative" ref={dropdownRef}>
                <div className="relative">
                  <input
                    id="restaurant-filter"
                    type="text"
                    value={
                      isDropdownOpen ? searchQuery : selectedRestaurantName
                    }
                    onChange={handleSearchChange}
                    onFocus={() => setIsDropdownOpen(true)}
                    placeholder={tDashboard("searchRestaurants")}
                    className="block w-64 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border pr-10"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg
                      className="h-5 w-5 text-gray-400"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </div>
                {isDropdownOpen && (
                  <div className="absolute z-10 mt-1 w-64 bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                    <div
                      onClick={() => handleRestaurantFilterChange("")}
                      className={`cursor-pointer select-none relative py-2 px-4 hover:bg-indigo-50 ${selectedRestaurantId === ""
                        ? "bg-indigo-100 text-indigo-900"
                        : "text-gray-900"
                        }`}
                    >
                      <span className="block truncate font-medium">
                        {tDashboard("allRestaurants")}
                      </span>
                    </div>
                    {filteredRestaurants.length > 0 ? (
                      filteredRestaurants.map((restaurant) => (
                        <div
                          key={restaurant.id}
                          onClick={() =>
                            handleRestaurantFilterChange(restaurant.id)
                          }
                          className={`cursor-pointer select-none relative py-2 px-4 hover:bg-indigo-50 ${selectedRestaurantId === restaurant.id
                            ? "bg-indigo-100 text-indigo-900"
                            : "text-gray-900"
                            }`}
                        >
                          <span className="block truncate">
                            {restaurant.name}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="cursor-default select-none relative py-2 px-4 text-gray-500">
                        <span className="block truncate">
                          {tDashboard("noRestaurantsFound")}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="relative">
          {/* Order Details Overlay Modal for screens smaller than xl */}
          {selectedOrder && (
            <div className="custom-1660:hidden fixed inset-0 z-50 overflow-y-auto">
              {/* Backdrop */}
              <div
                className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
                onClick={() => setSelectedOrder(null)}
              ></div>
              {/* Modal Content */}
              <div className="flex min-h-full items-center justify-center p-4">
                <div className="relative w-full max-w-md bg-white rounded-lg shadow-xl transform transition-all">
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-lg font-semibold">{tOrder("orderDetails")}</h2>
                      <button
                        onClick={() => setSelectedOrder(null)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <XMarkIcon className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">
                          {tDashboard("customer")}
                        </h3>
                        <p className="mt-1">
                          {selectedOrder.user.name || selectedOrder.user.email}
                        </p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">
                          {tOrder("deliveryAddress")}
                        </h3>
                        <p className="mt-1 line-clamp-2 text-sm text-gray-900">
                          {selectedOrder.deliveryAddress}
                        </p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">
                          {tDashboard("phoneNumber")}
                        </h3>
                        <p className="mt-1 text-sm text-gray-900">
                          {selectedOrder.user.phoneNumber &&
                            selectedOrder.user.phoneNumber}
                        </p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">
                          {tDashboard("assignedDriver")}
                        </h3>
                        <p className="mt-1 flex items-center gap-1.5">
                          {showDriverNameForStatus(selectedOrder.status) && getDriverDisplayName(selectedOrder) ? (
                            <>
                              <FaMotorcycle className="text-gray-500 text-sm" />
                              {getDriverDisplayName(selectedOrder)}
                            </>
                          ) : (
                            <span className="text-gray-500">{tDashboard("notAssigned")}</span>
                          )}
                        </p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">
                          {tOrder("orderItemsLabel")}
                        </h3>
                        <div className="mt-2 space-y-2">
                          {selectedOrder.orderItems.map((item) => {
                            let parsedOptions: any[] = [];
                            try {
                              if (item.options) {
                                let rawOptions = typeof item.options === 'string' ? JSON.parse(item.options) : item.options;
                                // POS orders store addons in a structured object: { selectedAddons: [...] }
                                if (rawOptions && rawOptions.selectedAddons) {
                                  parsedOptions = rawOptions.selectedAddons;
                                } else if (Array.isArray(rawOptions)) {
                                  parsedOptions = rawOptions;
                                }
                              }
                            } catch (e) {
                              // ignore parse error logs
                            }
                            return (
                              <div key={item.id} className="text-sm">
                                <div className="flex justify-between">
                                  <span className="font-semibold">
                                    {item.quantity}x {item.name}
                                  </span>
                                  <span className="font-semibold">
                                    {formatCurrency(item.price * item.quantity, selectedOrder.restaurant?.currency)}
                                  </span>
                                </div>
                                {parsedOptions && parsedOptions.length > 0 && (
                                  <ul className="text-xs text-gray-500 ml-4 mt-0.5 space-y-0.5">
                                    {parsedOptions.map((opt: any, idx: number) => (
                                      <li key={idx}>+ {opt.optionName || opt.name || JSON.stringify(opt)}</li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      <div className="pt-4 border-t space-y-2">
                        {(() => {
                          const subtotal = selectedOrder.orderItems.reduce(
                            (sum, item) => sum + item.price * item.quantity,
                            0
                          );
                          const deliveryFee =
                            selectedOrder.totalAmount - subtotal;
                          return (
                            <>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">{tCart("subtotal")}</span>
                                <span>{formatCurrency(subtotal, selectedOrder.restaurant?.currency)}</span>
                              </div>
                              {deliveryFee > 0 && (
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-600">
                                    {tCart("deliveryFee")}
                                  </span>
                                  <span>{formatCurrency(deliveryFee, selectedOrder.restaurant?.currency)}</span>
                                </div>
                              )}
                            </>
                          );
                        })()}
                        <div className="flex justify-between font-medium pt-2 border-t">
                          <span>{formatCurrency(selectedOrder.totalAmount, selectedOrder.restaurant?.currency)}</span>
                        </div>
                      </div>
                          {selectedOrder.orderType === "POS" && (
                            <button
                              onClick={() => handleFetchReceipt(selectedOrder.id)}
                              disabled={isFetchingReceipt}
                              className="w-full mt-4 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 rtl:flex-row-reverse"
                            >
                              {isFetchingReceipt ? (
                                <span>{tCommon("loading")}</span>
                              ) : (
                                <>
                                  <span>🖨️</span>
                                  <span>{tDashboard("printReceipt")}</span>
                                </>
                              )}
                            </button>
                          )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Main content layout */}
          <div className="flex gap-6 flex-col xl:flex-row">
            <div className="flex-1 min-w-0">
              <div className="overflow-x-auto bg-white rounded-lg shadow">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-4 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {tDashboard("orderId")}
                      </th>
                      <th className="px-4 py-4 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {tDashboard("customer")}
                      </th>
                      <th className="px-4 py-4 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {tVendor("restaurant")}
                      </th>
                      <th className="px-4 py-4 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {tDashboard("date")}
                      </th>
                      <th className="px-4 py-4 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {tCart("total")}
                      </th>
                      <th className="px-4 py-4 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {tDashboard("status")}
                      </th>
                      <th className="px-4 py-4 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {tDashboard("driver")}
                      </th>
                      <th className="px-4 py-4 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {tDashboard("action")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {isLoading ? (
                      <tr>
                        <td
                          colSpan={8}
                          className="px-4 py-4 text-center text-sm text-gray-500"
                        >
                          {tOrder("loadingOrders")}
                        </td>
                      </tr>
                    ) : orders.length === 0 ? (
                      <tr>
                        <td
                          colSpan={8}
                          className="px-4 py-4 text-center text-sm text-gray-500"
                        >
                          {tOrder("noOrders")}
                        </td>
                      </tr>
                    ) : (
                      orders.map((order) => (
                        <tr
                          key={order.id}
                          className="hover:bg-gray-50 cursor-pointer"
                          onClick={() => setSelectedOrder(order)}
                        >
                          <td className="px-4 py-4 text-start whitespace-nowrap text-sm text-gray-900">
                            {order.id.slice(-5)}
                            {order.orderType === "POS" && (
                              <span className="ml-2 px-1.5 py-0.5 text-[10px] bg-blue-100 text-blue-700 rounded font-bold">
                                POS
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-4 text-start whitespace-nowrap text-sm text-gray-900">
                            {order.user.name || order.user.email}
                          </td>
                          <td className="px-4 py-4 text-start whitespace-nowrap text-sm text-gray-900">
                            {order.restaurant.name}
                          </td>
                          <td className="px-4 py-4 text-start whitespace-nowrap text-sm text-gray-900">
                            {format(
                              new Date(order.createdAt),
                              "MMM d, yyyy HH:mm"
                            )}
                          </td>
                          <td className="px-4 py-4 text-start whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(order.totalAmount, order.restaurant?.currency)}
                          </td>
                          <td className="px-4 py-2 text-start whitespace-nowrap">
                            <span
                              className={`px-2 py-2 inline-flex items-center gap-1.5 text-xs leading-5 font-semibold rounded-md ${getStatusColor(
                                order.status
                              )}`}
                            >
                              {(() => {
                                const StatusIcon = getStatusIcon(order.status);
                                return <StatusIcon className="text-sm" />;
                              })()}
                              {getStatusTranslation(order.status)}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-start whitespace-nowrap text-sm text-gray-900">
                            {showDriverNameForStatus(order.status) && getDriverDisplayName(order) ? (
                              <span className="flex items-center gap-1.5">
                                <FaMotorcycle className="text-gray-500 text-sm flex-shrink-0" />
                                {getDriverColumnDisplay(order)}
                              </span>
                            ) : (
                              <span className="text-gray-500">{getDriverColumnDisplay(order)}</span>
                            )}
                          </td>
                          <td className="px-4 py-2 text-start whitespace-nowrap text-sm text-gray-900" onClick={(e) => e.stopPropagation()}>
                            <select
                              value={order.status}
                              onChange={(e) =>
                                handleStatusUpdate(order.id, e.target.value)
                              }
                              className="block w-full min-w-[140px] rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white py-1.5 px-3 rtl:bg-[position:left_0.5rem_center] rtl:pl-8 rtl:pr-3"
                            >
                              {ORDER_STATUSES.map((status) => (
                                <option key={status} value={status}>
                                  {getStatusTranslation(status)}
                                </option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-4">
                <p className="text-sm text-gray-600">
                  Showing {totalOrders === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}-
                  {totalOrders === 0
                    ? 0
                    : Math.min(page * PAGE_SIZE, totalOrders)}{" "}
                  {tDashboard("orders").toLowerCase()}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                    disabled={page === 1}
                    className="px-4 py-2 text-sm border rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {tCommon("previous") ?? "Previous"}
                  </button>
                  <span className="text-sm text-gray-700">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() =>
                      setPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={page === totalPages}
                    className="px-4 py-2 text-sm border rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {tCommon("next") ?? "Next"}
                  </button>
                </div>
              </div>
            </div>

            {/* Sidebar for xl and larger screens */}
            {selectedOrder && (
              <div className="hidden custom-1660:block w-96 bg-white p-6 rounded-lg shadow flex-shrink-0">
                <div className="flex justify-between border-b border-gray-200 pb-4 items-center mb-4">
                  <h2 className="text-lg font-semibold">{tOrder("orderDetails")}</h2>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-600">
                      Customer
                    </h3>
                    <p className="mt-1 font-semibold">
                      {selectedOrder.user.name || selectedOrder.user.email}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-600">
                      Delivery Address
                    </h3>
                    <p className="mt-1 line-clamp-2 font-semibold text-gray-900">
                      {selectedOrder.deliveryAddress}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-600">
                      {tDashboard("phoneNumber")}
                    </h3>
                    <p className="mt-1 font-semibold">
                      {selectedOrder.user.phoneNumber &&
                        selectedOrder.user.phoneNumber}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-600">
                      {tDashboard("assignedDriver")}
                    </h3>
                    <p className="mt-1 font-semibold flex items-center gap-1.5">
                      {showDriverNameForStatus(selectedOrder.status) && getDriverDisplayName(selectedOrder) ? (
                        <>
                          <FaMotorcycle className="text-gray-500 text-sm" />
                          {getDriverDisplayName(selectedOrder)}
                        </>
                      ) : (
                        <span className="text-gray-500 font-normal">{tDashboard("notAssigned")}</span>
                      )}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-600">{tDashboard("items")}</h3>
                    <div className="mt-2 space-y-2">
                      {selectedOrder.orderItems.map((item) => {
                        let parsedOptions: any[] = [];
                        try {
                          if (item.options) {
                            let rawOptions = typeof item.options === 'string' ? JSON.parse(item.options) : item.options;
                            // POS orders store addons in a structured object: { selectedAddons: [...] }
                            if (rawOptions && rawOptions.selectedAddons) {
                              parsedOptions = rawOptions.selectedAddons;
                            } else if (Array.isArray(rawOptions)) {
                              parsedOptions = rawOptions;
                            }
                          }
                        } catch (e) {
                          // ignore parse error logs
                        }
                        return (
                          <div key={item.id} className="text-sm">
                            <div className="flex justify-between">
                              <span className="font-semibold">
                                {item.quantity}x {item.name}
                              </span>
                              <span className="font-semibold">
                                {formatCurrency(item.price * item.quantity, selectedOrder.restaurant?.currency)}
                              </span>
                            </div>
                            {parsedOptions && parsedOptions.length > 0 && (
                              <ul className="text-xs text-gray-500 ml-4 mt-0.5 space-y-0.5">
                                {parsedOptions.map((opt: any, idx: number) => (
                                  <li key={idx}>+ {opt.optionName || opt.name || JSON.stringify(opt)}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="pt-4 border-t space-y-2">
                    {(() => {
                      const subtotal = selectedOrder.orderItems.reduce(
                        (sum, item) => sum + item.price * item.quantity,
                        0
                      );
                      const deliveryFee = selectedOrder.totalAmount - subtotal;
                      return (
                        <>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">{tCart("subtotal")}</span>
                            <span className="font-semibold">
                              {formatCurrency(subtotal, selectedOrder.restaurant?.currency)}
                            </span>
                          </div>
                          {deliveryFee > 0 && (
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">
                                {tCart("deliveryFee")}
                              </span>
                              <span className="font-semibold">
                                {formatCurrency(deliveryFee, selectedOrder.restaurant?.currency)}
                              </span>
                            </div>
                          )}
                        </>
                      );
                    })()}
                    <div className="flex justify-between font-medium pt-2 border-t">
                      <span>{tOrder("totalAmountLabel")}</span>
                      <span>{formatCurrency(selectedOrder.totalAmount, selectedOrder.restaurant?.currency)}</span>
                    </div>
                  </div>
                  {selectedOrder.orderType === "POS" && (
                    <button
                      onClick={() => handleFetchReceipt(selectedOrder.id)}
                      disabled={isFetchingReceipt}
                      className="w-full mt-4 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 rtl:flex-row-reverse"
                    >
                      {isFetchingReceipt ? (
                        <span>{tCommon("loading")}</span>
                      ) : (
                        <>
                          <span>🖨️</span>
                          <span>{tDashboard("printReceipt")}</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <ReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        receiptData={receiptData}
        restaurantCurrency={selectedOrder?.restaurant?.currency}
      />
    </DashboardLayout>
  );
};


export default OrdersPage;
