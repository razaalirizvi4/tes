'use client';
import React, { useEffect, useState, useCallback } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { GoogleMap, InfoWindow, Marker, useJsApiLoader } from '@react-google-maps/api';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/store/useStore';
import Link from 'next/link';
import {
  FaCheck,
  FaHome,
  FaMotorcycle,
  FaStore,
  FaBoxOpen,
  FaTimesCircle,
} from 'react-icons/fa';
import { MdAccessTime, MdRestaurant } from 'react-icons/md';

interface Driver {
  id: string;
  name: string;
  phoneNumber: string | null;
  location: { lat: number; lng: number } | null;
  status: string;
  order: string | null;
  orderId: string | null;
  orderStatus: string | null;
  eta: string | null;
}

interface RestaurantLocation {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

const mapContainerStyle = {
  width: '100%',
  height: '600px'
};

const center = {
  lat: 31.5204,
  lng: 74.3587
};

// Rider map marker icon paths (resolved to full URL at runtime so Google Maps can load them)
const RIDER_ICON_PATH = '/icons/rider-motorcycle.svg';
const RIDER_ICON_SELECTED_PATH = '/icons/rider-motorcycle-selected.svg';

const LiveTracking = () => {
  const tDashboard = useTranslations('dashboard');
  const tCommon = useTranslations('common');
  const user = useAuthStore((s) => s.user);
  const vendorId = user?.role !== 'SUPER_ADMIN' ? user?.vendorProfile?.id : undefined;

  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [driverAddresses, setDriverAddresses] = useState<Record<string, string>>({});
  const [restaurantLocations, setRestaurantLocations] = useState<RestaurantLocation[]>([]);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: ['places']
  });

  // Normalize any backend status variants into the UI's expected order-status values.
  // Some endpoints use ACCEPTED/PICKED_UP while UI expects CONFIRMED/PICKUP_CONFIRMED.
  const normalizeOrderStatus = (status: string | null | undefined): string | null => {
    if (!status) return null;
    switch (status) {
      case 'ACCEPTED':
        return 'CONFIRMED';
      case 'PICKED_UP':
        return 'PICKUP_CONFIRMED';
      case 'READY':
        return 'READY_FOR_PICKUP';
      case 'DELIVERING':
      case 'ON_THE_WAY':
        return 'OUT_FOR_DELIVERY';
      default:
        return status;
    }
  };

  const getOrderStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'Pending';
      case 'CONFIRMED':
        return 'Accepted';
      case 'PREPARING':
        return 'Preparing';
      case 'READY_FOR_PICKUP':
        return 'Ready for pickup';
      case 'PICKUP_CONFIRMED':
        return 'Picked up';
      case 'OUT_FOR_DELIVERY':
        return 'On the way';
      case 'DELIVERED':
        return 'Delivered';
      case 'CANCELLED':
        return 'Cancelled';
      case 'ACCEPTED':
        return 'Accepted';
      case 'PICKED_UP':
        return 'Picked up';
      default:
        return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'PENDING':
        return MdAccessTime;
      case 'CONFIRMED':
      case 'ACCEPTED':
        return FaCheck;
      case 'PREPARING':
        return MdRestaurant;
      case 'READY_FOR_PICKUP':
      case 'READY':
        return FaStore;
      case 'PICKUP_CONFIRMED':
      case 'PICKED_UP':
        return FaBoxOpen;
      case 'OUT_FOR_DELIVERY':
      case 'DELIVERING':
      case 'ON_THE_WAY':
        return FaMotorcycle;
      case 'DELIVERED':
        return FaHome;
      case 'CANCELLED':
        return FaTimesCircle;
      default:
        return MdRestaurant;
    }
  };

  const getStatusColorClasses = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'PENDING':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'CONFIRMED':
      case 'ACCEPTED':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'PREPARING':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'READY_FOR_PICKUP':
      case 'READY':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'PICKUP_CONFIRMED':
      case 'PICKED_UP':
        return 'bg-teal-100 text-teal-800 border-teal-200';
      case 'OUT_FOR_DELIVERY':
      case 'DELIVERING':
      case 'ON_THE_WAY':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'DELIVERED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Fetch real drivers from API
  useEffect(() => {
    const fetchDrivers = async (isInitial = false) => {
      try {
        // Only show loading state on initial load
        if (isInitial) {
          setIsLoading(true);
        }

        const response = await fetch('/api/drivers');
        if (!response.ok) {
          throw new Error('Failed to fetch drivers');
        }
        const data = await response.json();

        // Map API data to component format
        const mappedDrivers: Driver[] = data.map((driver: {
          id: string;
          status: string;
          currentLat: number | null;
          currentLng: number | null;
          documents?: { phoneNumber?: string | null } | null;
          user?: { name?: string | null; email?: string | null };
          activeOrder?: { id: string; status?: string } | null;
        }) => ({
          id: driver.id,
          name: driver.user?.name || driver.user?.email || 'Unknown Driver',
          phoneNumber: driver.documents?.phoneNumber ?? null,
          location: driver.currentLat && driver.currentLng
            ? { lat: driver.currentLat, lng: driver.currentLng }
            : null,
          status: driver.status === 'ONLINE'
            ? (driver.activeOrder ? 'Delivering' : 'Available')
            : driver.status,
          order: driver.activeOrder?.id
            ? `#${driver.activeOrder.id.slice(-5).toUpperCase()}`
            : null,
          orderId: driver.activeOrder?.id ?? null,
          orderStatus: normalizeOrderStatus(driver.activeOrder?.status ?? null),
          eta: null,
        }));

        // Filter out drivers without location data for map display
        // But keep them in the list
        setDrivers(mappedDrivers);
        setLastUpdated(new Date());
        setError(null);
      } catch (err) {
        console.error('Error fetching drivers:', err);
        setError('Failed to load drivers. Please try again.');
      } finally {
        if (isInitial) {
          setIsLoading(false);
        }
      }
    };

    // Initial fetch
    fetchDrivers(true);

    // Refresh driver data every 5 minutes (300000ms)
    const interval = setInterval(() => fetchDrivers(false), 300000);
    return () => clearInterval(interval);
  }, []);

  // Fetch vendor restaurants for map
  useEffect(() => {
    if (!vendorId) return;
    const fetchRestaurants = async () => {
      try {
        const res = await fetch(`/api/restaurants?vendorId=${vendorId}`);
        if (!res.ok) return;
        const data = await res.json();
        const list = Array.isArray(data) ? data : [];
        setRestaurantLocations(
          list
            .filter((r: { latitude?: number; longitude?: number }) => r.latitude != null && r.longitude != null)
            .map((r: { id: string; name: string; latitude: number; longitude: number }) => ({
              id: r.id,
              name: r.name,
              lat: r.latitude,
              lng: r.longitude,
            }))
        );
      } catch {
        // ignore
      }
    };
    fetchRestaurants();
  }, [vendorId]);

  // Reverse geocode driver locations via /api/geocode (same as LocationSelector) – Nominatim response
  const reverseGeocodeFromApi = useCallback(async (lat: number, lng: number): Promise<string> => {
    try {
      const res = await fetch(`/api/geocode?lat=${lat}&lon=${lng}`);
      if (!res.ok) return '';
      const data = await res.json();
      const address = data?.address;
      if (!address || typeof address !== 'object') {
        return data?.display_name || '';
      }
      const area =
        address.road ||
        address.village ||
        address.suburb ||
        address.neighbourhood ||
        address.subdistrict ||
        '';
      const city =
        address.city ||
        address.town ||
        address.municipality ||
        address.state_district ||
        address.county ||
        address.state ||
        '';
      if (area && city) return `${area}, ${city}`;
      if (city) return city;
      if (area) return area;
      return data?.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    } catch {
      return '';
    }
  }, []);

  useEffect(() => {
    if (drivers.length === 0) return;
    const withLocation = drivers.filter((d) => d.location != null) as (Driver & { location: { lat: number; lng: number } })[];
    let cancelled = false;
    const update: Record<string, string> = {};
    const run = async () => {
      for (const driver of withLocation) {
        if (cancelled) return;
        const addr = await reverseGeocodeFromApi(driver.location.lat, driver.location.lng);
        if (cancelled) return;
        update[driver.id] = addr || `${driver.location.lat.toFixed(6)}, ${driver.location.lng.toFixed(6)}`;
      }
      if (!cancelled) setDriverAddresses((prev) => ({ ...prev, ...update }));
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [drivers, reverseGeocodeFromApi]);

  if (!isLoaded) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-gray-500">{tCommon('loading')}</div>
        </div>
      </DashboardLayout>
    );
  }

  // Calculate map center based on driver locations or use default
  const driversWithLocation = drivers.filter(d => d.location !== null);
  const mapCenter = driversWithLocation.length > 0
    ? {
      lat: driversWithLocation.reduce((sum, d) => sum + (d.location?.lat || 0), 0) / driversWithLocation.length,
      lng: driversWithLocation.reduce((sum, d) => sum + (d.location?.lng || 0), 0) / driversWithLocation.length,
    }
    : center;

  // Rider map marker icon (use google.maps API when available so Marker accepts it)
  const getRiderMarkerIcon = (selected: boolean) => {
    const path = selected ? RIDER_ICON_SELECTED_PATH : RIDER_ICON_PATH;
    const url = typeof window !== 'undefined' ? `${window.location.origin}${path}` : path;
    const size = selected ? 44 : 36;
    const anchor = size / 2;
    if (typeof window !== 'undefined' && (window as { google?: typeof google }).google) {
      const g = (window as { google: typeof google }).google.maps;
      return {
        url,
        scaledSize: new g.Size(size, size),
        anchor: new g.Point(anchor, anchor),
      };
    }
    // Google Maps Marker expects google.maps.Icon types; if Maps isn't available yet, skip custom icon.
    return undefined;
  };

  const getRestaurantMarkerIcon = () => {
    if (typeof window === 'undefined' || !(window as { google?: typeof google }).google) return undefined;
    const googleMaps = (window as { google: typeof google }).google.maps;
    return {
      path: googleMaps.SymbolPath.CIRCLE,
      scale: 10,
      fillColor: '#2563EB',
      fillOpacity: 1,
      strokeColor: '#fff',
      strokeWeight: 2,
    };
  };

  const filteredDrivers = drivers.filter((driver) => {
    const matchesStatus =
      statusFilter === 'ALL'
        ? true
        : statusFilter === 'AVAILABLE'
          ? (driver.status === 'Available' || driver.status === 'ONLINE')
          : statusFilter === 'DELIVERING'
            ? (driver.status === 'Delivering' || driver.status === 'OUT_FOR_DELIVERY')
            : true;

    const lowerSearch = searchTerm.toLowerCase();
    const matchesSearch =
      !lowerSearch ||
      driver.name.toLowerCase().includes(lowerSearch) ||
      (driver.order && driver.order.toLowerCase().includes(lowerSearch));

    return matchesStatus && matchesSearch;
  });

  const secondsSinceUpdate = lastUpdated
    ? Math.floor((Date.now() - lastUpdated.getTime()) / 1000)
    : null;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">{tDashboard('liveTracking')}</h1>
            <p className="text-sm text-gray-500 mt-1">
              Monitor all active deliveries in real time.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-1 text-[11px] font-medium text-green-700 border border-green-100">
                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                LIVE
              </span>
              {secondsSinceUpdate !== null && (
                <span>
                  Last updated {secondsSinceUpdate}s ago
                </span>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-gray-500">{tCommon('loading')}</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Active drivers / orders list */}
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-white rounded-lg shadow p-4 space-y-3 sticky top-20">
                <div className="flex flex-col gap-3">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Search by driver or order ID..."
                  />
                  <div className="flex items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setStatusFilter('ALL')}
                      className={`rounded-full px-3 py-1 border text-xs ${statusFilter === 'ALL'
                        ? 'bg-primary-50 text-primary-700 border-primary-100'
                        : 'bg-white text-gray-600 border-gray-200'
                        }`}
                    >
                      All
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatusFilter('AVAILABLE')}
                      className={`rounded-full px-3 py-1 border text-xs ${statusFilter === 'AVAILABLE'
                        ? 'bg-green-50 text-green-700 border-green-100'
                        : 'bg-white text-gray-600 border-gray-200'
                        }`}
                    >
                      Available
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatusFilter('DELIVERING')}
                      className={`rounded-full px-3 py-1 border text-xs ${statusFilter === 'DELIVERING'
                        ? 'bg-amber-50 text-amber-700 border-amber-100'
                        : 'bg-white text-gray-600 border-gray-200'
                        }`}
                    >
                      On delivery
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">
                    {filteredDrivers.length} active drivers · {driversWithLocation.length} with live location
                  </p>
                </div>
              </div>

              <div
                className="space-y-3 max-h-[420px] overflow-y-auto pr-1"
                style={{ minHeight: '200px' }}
              >
                {drivers.length === 0 ? (
                  <div className="p-4 bg-white rounded-lg shadow text-center text-gray-500">
                    {tCommon('noItems')}
                  </div>
                ) : filteredDrivers.length === 0 ? (
                  <div className="p-4 bg-white rounded-lg shadow text-center text-gray-500 text-sm">
                    No drivers match your filters.
                  </div>
                ) : (
                  filteredDrivers.map((driver) => (
                    <div
                      key={driver.id}
                      className={`p-4 bg-white rounded-lg shadow cursor-pointer transition-colors border ${selectedDriver?.id === driver.id ? 'border-primary-500 ring-2 ring-primary-100' : 'border-transparent'
                        }`}
                      onClick={() => setSelectedDriver(driver)}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center space-x-3">
                          <span
                            className={`flex items-center justify-center w-8 h-8 rounded-full border-2 flex-shrink-0 ${
                              selectedDriver?.id === driver.id
                                ? 'bg-white border-primary-500 text-primary-600'
                                : 'bg-gray-50 border-transparent text-green-600'
                            }`}
                          >
                            <FaMotorcycle className="w-4 h-4" />
                          </span>
                          <div>
                            <h3 className="font-medium text-sm">{driver.name}</h3>
                            <p className="text-xs text-gray-500">
                              {tCommon('status')}: {driver.status}
                            </p>
                          </div>
                        </div>
                        {driver.order && (
                          <span className="inline-flex items-center rounded-full bg-gray-50 px-2 py-1 text-[11px] font-medium text-gray-700 border border-gray-200">
                            {driver.order}
                          </span>
                        )}
                      </div>
                      <div className="mt-2 text-xs text-gray-600 space-y-1">
                        {driver.location ? (
                          <div className="pt-2 border-t border-gray-200">
                            <p className="text-[11px] text-gray-500 flex items-center gap-1">
                              <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              <span className="break-words">
                                {driverAddresses[driver.id] !== undefined
                                  ? driverAddresses[driver.id]
                                  : 'Resolving location…'}
                              </span>
                            </p>
                          </div>
                        ) : (
                          <p className="text-[11px] text-gray-400 mt-1">{tDashboard('locationUnavailable')}</p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Map */}
            <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-4 relative">
              {driversWithLocation.length === 0 ? (
                <div className="flex items-center justify-center h-[600px] text-gray-500 text-sm">
                  No drivers with location data available
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
                    <div className="bg-white/90 backdrop-blur rounded-md px-3 py-1.5 shadow text-xs text-gray-700 border border-gray-200">
                      {selectedDriver
                        ? `${selectedDriver.name} · ${selectedDriver.status}`
                        : 'Select a driver to focus on their route'}
                    </div>
                    <div className="bg-white/90 backdrop-blur rounded-md px-3 py-1.5 shadow text-[11px] text-gray-600 border border-gray-200">
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-1">
                          <FaMotorcycle className="w-4 h-4 text-green-600" aria-hidden />
                          <span>Rider</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="h-2 w-2 rounded-full bg-blue-600" />
                          <span>Restaurant</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <GoogleMap
                    mapContainerStyle={mapContainerStyle}
                    center={mapCenter}
                    zoom={13}
                  >
                    {restaurantLocations.map((rest) => (
                      <Marker
                        key={rest.id}
                        position={{ lat: rest.lat, lng: rest.lng }}
                        title={rest.name}
                        icon={getRestaurantMarkerIcon()}
                      />
                    ))}
                    {driversWithLocation.map(driver => (
                      <Marker
                        key={driver.id}
                        position={driver.location!}
                        title={driver.name}
                        onClick={() => {
                          setSelectedDriver(driver);
                          setSelectedMarkerId(driver.id);
                        }}
                        icon={getRiderMarkerIcon(selectedDriver?.id === driver.id)}
                      >
                        {selectedMarkerId === driver.id && (
                          <InfoWindow
                            onCloseClick={() => setSelectedMarkerId(null)}
                          >
                            <div className="p-2">
                              <h3 className="font-semibold text-sm mb-1">{driver.name}</h3>
                              <p className="text-xs text-gray-600 mb-1">Status: {driver.status}</p>
                              {driver.order && (
                                <p className="text-xs text-gray-600 mb-1">Order: {driver.order}</p>
                              )}
                              <p className="text-xs text-gray-500 mt-1">
                                {driverAddresses[driver.id] ?? `${driver.location!.lat.toFixed(6)}, ${driver.location!.lng.toFixed(6)}`}
                              </p>
                            </div>
                          </InfoWindow>
                        )}
                      </Marker>
                    ))}
                  </GoogleMap>
                </div>
              )}
            </div>

            {/* Order / driver detail panel */}
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-white rounded-lg shadow p-4 h-full flex flex-col">
                {selectedDriver ? (
                  <>
                    <div className="pb-3 border-b border-gray-100">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <h2 className="text-base font-semibold text-gray-900">Rider details</h2>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {selectedDriver.order ? `Active order ${selectedDriver.order}` : 'No active order'}
                          </p>
                        </div>
                        {selectedDriver.status && (
                          <span className="inline-flex items-center rounded-full bg-gray-50 px-2 py-1 text-[11px] font-medium text-gray-700 border border-gray-200">
                            {selectedDriver.status}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="pt-3">
                      <h3 className="text-sm font-semibold text-gray-900">Rider</h3>
                      <p className="text-sm text-gray-700 mt-1">{selectedDriver.name}</p>
                      <div className="mt-2">
                        <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
                          Phone number
                        </p>
                        <p className="text-sm text-gray-700 mt-0.5">
                          {selectedDriver.phoneNumber ? selectedDriver.phoneNumber : 'Not available'}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4">
                      <h3 className="text-sm font-semibold text-gray-900">
                        Delivery Status
                      </h3>
                      {selectedDriver.orderStatus ? (
                        <div className={`mt-1 inline-flex items-center gap-2 rounded-full px-3 py-1.5 border ${getStatusColorClasses(
                          normalizeOrderStatus(selectedDriver.orderStatus) ?? selectedDriver.orderStatus
                        )}`}>
                          {(() => {
                            const normalizedStatus =
                              normalizeOrderStatus(selectedDriver.orderStatus) ?? selectedDriver.orderStatus;
                            const StatusIcon = getStatusIcon(normalizedStatus);
                            return <StatusIcon className="h-4 w-4" />;
                          })()}
                          <span className="text-sm">
                            {getOrderStatusLabel(
                              normalizeOrderStatus(selectedDriver.orderStatus) ?? selectedDriver.orderStatus
                            )}
                          </span>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-700 mt-1">No active order</p>
                      )}
                    </div>

                    <div className="mt-6">
                      <div className="grid grid-cols-2 gap-3">
                        {selectedDriver.phoneNumber ? (
                          <a
                            href={`tel:${selectedDriver.phoneNumber}`}
                            className="w-full inline-flex justify-center items-center rounded-md bg-primary-600 px-3 py-2 text-xs font-medium text-white hover:bg-primary-700"
                          >
                            Contact rider
                          </a>
                        ) : (
                          <button
                            type="button"
                            disabled
                            className="w-full inline-flex justify-center items-center rounded-md bg-gray-200 px-3 py-2 text-xs font-medium text-gray-600 cursor-not-allowed"
                            title="No phone number available"
                          >
                            Contact rider
                          </button>
                        )}

                        <Link
                          href={{
                            pathname: 'help-center',
                            query: {
                              type: 'rider',
                              driverId: selectedDriver.id,
                              orderId: selectedDriver.orderId ?? undefined,
                            },
                          }}
                          className="w-full inline-flex justify-center items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                        >
                          Report
                        </Link>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center text-sm text-gray-500">
                    <p className="font-medium text-gray-700 mb-1">
                      No driver selected
                    </p>
                    <p className="text-xs text-gray-500">
                      Choose a driver from the list to view live tracking details and status timeline.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
export default LiveTracking;
