"use client";

import { useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Driver, Order } from "@/types";
import { toast } from "react-hot-toast";
import dynamic from "next/dynamic";
import { format } from "date-fns";
import { useTranslations } from "next-intl";
import DispatchMap from "./DispatchMap";

// Dummy data for drivers
const dummyDrivers: Driver[] = [
  {
    id: "driver-1",
    userId: "user-1",
    user: {
      id: "user-1",
      email: "john.driver@example.com",
      name: "John Smith",
      role: "DRIVER",
    },
    status: "ONLINE",
    currentLat: 40.7128,
    currentLng: -74.006,
    lastLocation: new Date(),
    rating: 4.8,
    totalOrders: 156,
    vehicleType: "CAR",
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date(),
  },
  {
    id: "driver-2",
    userId: "user-2",
    user: {
      id: "user-2",
      email: "sarah.driver@example.com",
      name: "Sarah Johnson",
      role: "DRIVER",
    },
    status: "ONLINE",
    currentLat: 40.758,
    currentLng: -73.9855,
    lastLocation: new Date(),
    rating: 4.9,
    totalOrders: 203,
    vehicleType: "BIKE",
    createdAt: new Date("2024-01-10"),
    updatedAt: new Date(),
  },
  {
    id: "driver-3",
    userId: "user-3",
    user: {
      id: "user-3",
      email: "mike.driver@example.com",
      name: "Mike Williams",
      role: "DRIVER",
    },
    status: "BUSY",
    currentLat: 40.7505,
    currentLng: -73.9934,
    lastLocation: new Date(),
    rating: 4.7,
    totalOrders: 98,
    vehicleType: "CAR",
    createdAt: new Date("2024-02-01"),
    updatedAt: new Date(),
  },
  {
    id: "driver-4",
    userId: "user-4",
    user: {
      id: "user-4",
      email: "emily.driver@example.com",
      name: "Emily Davis",
      role: "DRIVER",
    },
    status: "ONLINE",
    currentLat: 40.7282,
    currentLng: -74.0776,
    lastLocation: new Date(),
    rating: 4.6,
    totalOrders: 87,
    vehicleType: "BICYCLE",
    createdAt: new Date("2024-02-15"),
    updatedAt: new Date(),
  },
];

// Dummy data for pending orders
const dummyOrders: Order[] = [
  {
    id: "order-001",
    userId: "customer-1",
    restaurantId: "rest-1",
    status: "PENDING",
    totalAmount: 45.99,
    specialInstructions: "Please ring the doorbell",
    paymentMethod: "cod",
    deliveryAddress: "123 Main Street, New York, NY 10001",
    orderItems: [
      {
        id: "item-1",
        orderId: "order-001",
        menuItemId: "menu-1",
        quantity: 2,
        price: 12.99,
        name: "Burger Deluxe",
      },
      {
        id: "item-2",
        orderId: "order-001",
        menuItemId: "menu-2",
        quantity: 1,
        price: 20.01,
        name: "Pizza Margherita",
      },
    ],
    pickupLat: 40.7128,
    pickupLng: -74.006,
    dropoffLat: 40.758,
    dropoffLng: -73.9855,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "order-002",
    userId: "customer-2",
    restaurantId: "rest-2",
    status: "PENDING",
    totalAmount: 32.5,
    specialInstructions: "",
    paymentMethod: "card",
    deliveryAddress: "456 Park Avenue, New York, NY 10022",
    orderItems: [
      {
        id: "item-3",
        orderId: "order-002",
        menuItemId: "menu-3",
        quantity: 3,
        price: 10.83,
        name: "Chicken Wings",
      },
    ],
    pickupLat: 40.7505,
    pickupLng: -73.9934,
    dropoffLat: 40.7282,
    dropoffLng: -74.0776,
    createdAt: new Date(Date.now() - 15 * 60 * 1000),
    updatedAt: new Date(),
  },
  {
    id: "order-003",
    userId: "customer-3",
    restaurantId: "rest-1",
    status: "PENDING",
    totalAmount: 67.25,
    specialInstructions: "Extra spicy",
    paymentMethod: "cod",
    deliveryAddress: "789 Broadway, New York, NY 10003",
    orderItems: [
      {
        id: "item-4",
        orderId: "order-003",
        menuItemId: "menu-4",
        quantity: 1,
        price: 25.5,
        name: "Sushi Platter",
      },
      {
        id: "item-5",
        orderId: "order-003",
        menuItemId: "menu-5",
        quantity: 2,
        price: 20.875,
        name: "Ramen Bowl",
      },
    ],
    pickupLat: 40.7282,
    pickupLng: -74.0776,
    dropoffLat: 40.7128,
    dropoffLng: -74.006,
    createdAt: new Date(Date.now() - 5 * 60 * 1000),
    updatedAt: new Date(),
  },
  {
    id: "order-004",
    userId: "customer-4",
    restaurantId: "rest-3",
    status: "PENDING",
    totalAmount: 28.75,
    specialInstructions: "No onions",
    paymentMethod: "card",
    deliveryAddress: "321 5th Avenue, New York, NY 10016",
    orderItems: [
      {
        id: "item-6",
        orderId: "order-004",
        menuItemId: "menu-6",
        quantity: 2,
        price: 14.375,
        name: "Caesar Salad",
      },
    ],
    pickupLat: 40.758,
    pickupLng: -73.9855,
    dropoffLat: 40.7505,
    dropoffLng: -73.9934,
    createdAt: new Date(Date.now() - 30 * 60 * 1000),
    updatedAt: new Date(),
  },
];

export default function DispatchPage() {
  const [activeDrivers] = useState<Driver[]>(dummyDrivers);
  const [pendingOrders, setPendingOrders] = useState<Order[]>(dummyOrders);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const tDashboard = useTranslations("dashboard");
  const tOrder = useTranslations("order");
  const tCart = useTranslations("cart");

  const assignOrderToDriver = async (orderId: string, driverId: string) => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Log assignment for debugging
      console.log(`Assigning order ${orderId} to driver ${driverId}`);

      // Update local state
      setPendingOrders((orders) => orders.filter((o) => o.id !== orderId));
      toast.success("Order assigned successfully");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to assign order");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ONLINE":
        return "bg-green-100 text-green-800";
      case "BUSY":
        return "bg-yellow-100 text-yellow-800";
      case "OFFLINE":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold">{tDashboard("dispatch")}</h1>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              <span className="font-medium">
                {activeDrivers.filter((d) => d.status === "ONLINE").length}
              </span>{" "}
              {tDashboard("drivers")}
            </div>
            <div className="text-sm text-gray-600">
              <span className="font-medium">{pendingOrders.length}</span>{" "}
              {tDashboard("pendingOrders")}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Active Drivers List */}
          <div className="lg:col-span-1 bg-white rounded-lg shadow-sm">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                {tDashboard("drivers")} ({activeDrivers.length})
              </h2>
            </div>
            <div className="p-4 space-y-3 max-h-[calc(100vh-250px)] overflow-y-auto">
              {activeDrivers.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  {tDashboard("noDriversFound")}
                </p>
              ) : (
                activeDrivers.map((driver) => (
                  <div
                    key={driver.id}
                    className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {driver.user.name || "Unknown Driver"}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {driver.vehicleType}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                          driver.status
                        )}`}
                      >
                        {driver.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-600 mt-2">
                      <span>
                        Orders:{" "}
                        <span className="font-medium">
                          {driver.totalOrders}
                        </span>
                      </span>
                      <span>
                        Rating:{" "}
                        <span className="font-medium">
                          {driver.rating?.toFixed(1) || "N/A"}
                        </span>
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Map View */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                {tDashboard("liveTracking")}
              </h2>
            </div>
            <div className="h-[calc(100vh-250px)] rounded-lg overflow-hidden">
              <DispatchMap
                drivers={activeDrivers}
                pendingOrders={pendingOrders}
                selectedOrder={selectedOrder}
                onOrderSelect={setSelectedOrder}
              />
            </div>
          </div>

          {/* Pending Orders List */}
          <div className="lg:col-span-1 bg-white rounded-lg shadow-sm">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                {tDashboard("pendingOrders")} ({pendingOrders.length})
              </h2>
            </div>
            <div className="p-4 space-y-3 max-h-[calc(100vh-250px)] overflow-y-auto">
              {pendingOrders.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  {tDashboard("noData")}
                </p>
              ) : (
                pendingOrders.map((order) => (
                  <div
                    key={order.id}
                    className={`border rounded-lg p-3 cursor-pointer transition-colors ${selectedOrder?.id === order.id
                        ? "border-primary-500 bg-primary-50"
                        : "border-gray-200 hover:bg-gray-50"
                      }`}
                    onClick={() => setSelectedOrder(order)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-medium text-gray-900">
                        {tOrder("orderNumber")} #{order.id.slice(-6)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(order.createdAt), "HH:mm")}
                      </p>
                    </div>
                    <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                      {order.deliveryAddress}
                    </p>
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-semibold text-gray-900">
                        ${order.totalAmount.toFixed(2)}
                      </p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const nearestDriver = activeDrivers.find(
                            (d) => d.status === "ONLINE"
                          );
                          if (nearestDriver) {
                            assignOrderToDriver(order.id, nearestDriver.id);
                          } else {
                            toast.error(tDashboard("noDriversFound"));
                          }
                        }}
                        className="px-3 py-1 text-xs font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 transition-colors"
                      >
                        {tDashboard("dispatch")}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Order Details Sidebar (if order is selected) */}
        {selectedOrder && (
          <div className="fixed right-6 top-24 w-96 bg-white rounded-lg shadow-lg border border-gray-200 px-6 py-4 max-h-[calc(100vh-120px)] overflow-y-auto z-50">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {tOrder("orderDetails")}
              </h2>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">
                  {tOrder("orderNumber")}
                </h3>
                <p className="text-sm text-gray-900">{selectedOrder.id}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">
                  {tOrder("deliveryAddress")}
                </h3>
                <p className="text-sm text-gray-900">
                  {selectedOrder.deliveryAddress}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">
                  {tOrder("orderItemsLabel")}
                </h3>
                <div className="mt-2 space-y-2">
                  {selectedOrder.orderItems.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-gray-700">
                        {item.quantity}x {item.name}
                      </span>
                      <span className="text-gray-900 font-medium">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              {selectedOrder.specialInstructions && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    {tOrder("specialInstructionsLabel")}
                  </h3>
                  <p className="text-sm text-gray-900">
                    {selectedOrder.specialInstructions}
                  </p>
                </div>
              )}
              <div className="pt-4 border-t border-gray-200">
                <div className="flex justify-between font-semibold text-gray-900">
                  <span>{tOrder("totalAmountLabel")}</span>
                  <span>${selectedOrder.totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
