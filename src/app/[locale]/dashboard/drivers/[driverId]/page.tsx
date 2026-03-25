'use client'
import { Driver, Order } from "@prisma/client";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import Map from "./Map";


export default function DriverDetailsPage({ params }: { params: Promise<{ driverId: string }> }) {
  const [driver, setDriver] = useState<Driver & { user: { name: string; email: string } } | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Set up polling for location updates
  useEffect(() => {
    const fetchDriverData = async () => {
      try {
        const response = await fetch(`/api/drivers/${(await params).driverId}`);
        if (!response.ok) throw new Error('Failed to fetch driver details');
        const data = await response.json();
        setDriver(data);
      } catch (error) {
        console.error('Error:', error);
        toast.error('Failed to load driver details');
      }
    };

    fetchDriverData();
    
    // Poll for updates every 10 seconds if driver is online
    const interval = setInterval(() => {
      if (driver?.status === 'ONLINE' || driver?.status === 'BUSY') {
        fetchDriverData();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [driver?.status, params]);

  // Fetch initial orders
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch(`/api/orders?driverId=${(await params).driverId}`);
        if (!response.ok) throw new Error('Failed to fetch orders');
        const data = await response.json();
        setOrders(data);
      } catch (error) {
        console.error('Error:', error);
        toast.error('Failed to load orders');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [params]);

  const handleStatusChange = async (status: string) => {
    try {
      const response = await fetch(`/api/drivers/${(await params).driverId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) throw new Error('Failed to update status');
      
      const updatedDriver = await response.json();
      setDriver(updatedDriver);
      toast.success('Status updated successfully');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to update status');
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <p>Loading driver details...</p>
      </div>
    );
  }

  if (!driver) {
    return (
      <div className="p-6">
        <p>Driver not found</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Driver Info */}
        <div className="md:col-span-2 bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-2xl font-semibold">{driver.user.name}</h1>
              <p className="text-gray-600">{driver.user.email}</p>
            </div>
            <div>
              <select
                value={driver.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
              >
                <option value="ONLINE">Online</option>
                <option value="OFFLINE">Offline</option>
                <option value="BUSY">Busy</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Vehicle Type</h3>
              <p className="mt-1">{driver.vehicleType}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Total Orders</h3>
              <p className="mt-1">{driver.totalOrders}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Rating</h3>
              <p className="mt-1">{driver.rating ? `${driver.rating.toFixed(1)}/5` : 'N/A'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Last Active</h3>
              <p className="mt-1">
                {driver.lastLocation 
                  ? new Date(driver.lastLocation).toLocaleString()
                  : 'Never'}
              </p>
            </div>
          </div>

          {/* Location Map */}
          <div className="h-[400px] rounded-lg overflow-hidden">
            {driver.currentLat && driver.currentLng ? (
              <Map
                lat={driver.currentLat}
                lng={driver.currentLng}
                driverName={driver.user.name || 'Driver'}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-100">
                <p className="text-gray-500">Location not available</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Orders</h2>
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="border-b pb-4 last:border-b-0">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">Order #{order.id.slice(-6)}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    order.status === 'DELIVERED' 
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {order.status}
                  </span>
                </div>
                <p className="text-sm mt-2">{order.deliveryAddress}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}