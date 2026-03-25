'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Line } from 'react-chartjs-2';
import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from 'chart.js';
import { useAuthStore } from '@/store/useStore';
import { useCurrency } from '@/hooks/useCurrency';
import { formatCurrency as formatCurrencyUtil } from '@/utils/currency';
import { useTranslations } from 'next-intl';
import {
  ArrowPathIcon,
  BanknotesIcon,
  ClockIcon,
  TruckIcon,
  ShoppingBagIcon,
  UserIcon,
} from '@heroicons/react/24/outline';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

type DashboardRange = 'TODAY' | '7D' | '30D';

type ApiOrder = {
  id: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  restaurant?: {
    id: string;
    name: string;
    vendorId?: string;
    currency?: string | null;
  };
  user?: { id: string; name: string | null; email: string };
  orderItems?: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
    menuItem?: { id: string; image?: string | null; label?: string | null };
  }>;
};

type Restaurant = { id: string; name: string; currency?: string | null };

const ORDER_STATUS = {
  cancelled: 'CANCELLED',
  delivered: 'DELIVERED',
  outForDelivery: 'OUT_FOR_DELIVERY',
  pickupConfirmed: 'PICKUP_CONFIRMED',
  preparing: 'PREPARING',
  pending: 'PENDING',
  confirmed: 'CONFIRMED',
  readyForPickup: 'READY_FOR_PICKUP',
} as const;

const isActiveOrderStatus = (status: string) =>
  status !== ORDER_STATUS.delivered && status !== ORDER_STATUS.cancelled;

const isActiveDeliveryStatus = (status: string) =>
  status === ORDER_STATUS.outForDelivery || status === ORDER_STATUS.pickupConfirmed;

function getRangeStart(range: DashboardRange): Date {
  const now = new Date();
  const start = new Date(now);
  if (range === 'TODAY') {
    start.setHours(0, 0, 0, 0);
    return start;
  }
  const days = range === '7D' ? 7 : 30;
  start.setDate(now.getDate() - (days - 1));
  start.setHours(0, 0, 0, 0);
  return start;
}

function formatDayLabel(d: Date) {
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

const DashboardHome = () => {
  const { user } = useAuthStore((s) => s);
  const tDashboard = useTranslations('dashboard');

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const vendorId = !isSuperAdmin ? user?.vendorProfile?.id : undefined;

  const [range, setRange] = useState<DashboardRange>('7D');
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const selectedRestaurant = useMemo(
    () => restaurants.find((r) => r.id === selectedRestaurantId) ?? null,
    [restaurants, selectedRestaurantId]
  );

  const { formatCurrency: formatCurrencyGlobal } = useCurrency();

  const formatCurrency = useCallback((amount: number | string | null | undefined) => {
    const currency = selectedRestaurant?.currency || orders[0]?.restaurant?.currency || null;
    if (currency) return formatCurrencyUtil(amount, currency);
    return formatCurrencyGlobal(amount);
  }, [formatCurrencyGlobal, orders, selectedRestaurant?.currency]);

  const fetchRestaurants = async () => {
    try {
      const params = new URLSearchParams();
      if (vendorId) params.set('vendorId', vendorId);
      const res = await fetch(`/api/restaurants?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch restaurants');
      const data = await res.json();
      const list: Restaurant[] = Array.isArray(data)
        ? data.map((r: { id: string; name: string; currency?: string | null }) => ({
            id: r.id,
            name: r.name,
            currency: r.currency ?? null,
          }))
        : [];
      setRestaurants(list);
      if (!isSuperAdmin && list.length === 1) {
        setSelectedRestaurantId(list[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchOrders = async () => {
    if (!isSuperAdmin && !vendorId) return;
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: '1',
        pageSize: '500',
      });

      if (!isSuperAdmin && vendorId) params.set('vendorId', vendorId);
      if (selectedRestaurantId) params.set('restaurantId', selectedRestaurantId);

      const res = await fetch(`/api/orders?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch orders');
      const payload = await res.json();
      const list: ApiOrder[] = Array.isArray(payload) ? payload : payload?.data ?? [];
      setOrders(list);
      setLastUpdated(new Date());
    } catch (e) {
      console.error(e);
      setOrders([]);
      setError('Unable to load dashboard data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurants();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendorId, isSuperAdmin]);

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendorId, isSuperAdmin, selectedRestaurantId]);

  const rangeStart = useMemo(() => getRangeStart(range), [range]);

  const scopedOrders = useMemo(() => {
    return orders.filter((o) => {
      const createdAt = new Date(o.createdAt);
      return createdAt >= rangeStart;
    });
  }, [orders, rangeStart]);

  const kpis = useMemo(() => {
    const nonCancelled = scopedOrders.filter((o) => o.status !== ORDER_STATUS.cancelled);
    const delivered = scopedOrders.filter((o) => o.status === ORDER_STATUS.delivered);
    const pending = scopedOrders.filter((o) => o.status === ORDER_STATUS.pending);
    const cancelled = scopedOrders.filter((o) => o.status === ORDER_STATUS.cancelled);
    const activeOrders = scopedOrders.filter((o) => isActiveOrderStatus(o.status));
    const activeDeliveries = scopedOrders.filter((o) => isActiveDeliveryStatus(o.status));

    const totalRevenue = delivered.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
    const orderCount = nonCancelled.length;
    const aov = orderCount > 0 ? totalRevenue / Math.max(delivered.length, 1) : 0;

    const uniqueCustomers = new Set(
      nonCancelled.map((o) => o.user?.id ?? o.user?.email ?? '').filter(Boolean)
    ).size;

    return {
      totalRevenue,
      orderCount,
      pendingCount: pending.length,
      cancelledCount: cancelled.length,
      uniqueCustomers,
      activeOrders: activeOrders.length,
      activeDeliveries: activeDeliveries.length,
      averageOrderValue: aov,
    };
  }, [scopedOrders]);

  const topItems = useMemo(() => {
    const byKey = new Map<
      string,
      {
        key: string;
        name: string;
        qty: number;
        revenue: number;
        restaurantName?: string;
        image?: string | null;
      }
    >();
    for (const order of scopedOrders) {
      if (order.status === ORDER_STATUS.cancelled) continue;
      for (const item of order.orderItems ?? []) {
        const key = item.menuItem?.id || item.name;
        const prev = byKey.get(key) ?? {
          key,
          name: item.name,
          qty: 0,
          revenue: 0,
          restaurantName: order.restaurant?.name,
          image: item.menuItem?.image ?? null,
        };
        const qty = Number(item.quantity) || 0;
        const price = Number(item.price) || 0;
        byKey.set(key, {
          ...prev,
          qty: prev.qty + qty,
          revenue: prev.revenue + qty * price,
          restaurantName: prev.restaurantName ?? order.restaurant?.name,
          image: prev.image ?? item.menuItem?.image ?? null,
        });
      }
    }
    return [...byKey.values()].sort((a, b) => b.qty - a.qty).slice(0, 6);
  }, [scopedOrders]);

  const chart = useMemo(() => {
    const start = new Date(rangeStart);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const days: Date[] = [];
    const cursor = new Date(start);
    while (cursor <= end) {
      days.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
      cursor.setHours(0, 0, 0, 0);
    }

    const labels = days.map(formatDayLabel);
    const revenueByDay = new Array(days.length).fill(0);
    const ordersByDay = new Array(days.length).fill(0);

    for (const order of scopedOrders) {
      const created = new Date(order.createdAt);
      const dayIdx = days.findIndex((d) =>
        d.getFullYear() === created.getFullYear() &&
        d.getMonth() === created.getMonth() &&
        d.getDate() === created.getDate()
      );
      if (dayIdx === -1) continue;
      if (order.status !== ORDER_STATUS.cancelled) ordersByDay[dayIdx] += 1;
      if (order.status === ORDER_STATUS.delivered) revenueByDay[dayIdx] += Number(order.totalAmount) || 0;
    }

    return {
      labels,
      revenueByDay,
      ordersByDay,
    };
  }, [rangeStart, scopedOrders]);

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      x: {
        display: false,
      },
      y: {
        display: false,
      },
    },
    elements: {
      line: {
        tension: 0.4,
      },
      point: {
        radius: 0,
      },
    },
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{tDashboard('dashboard') ?? 'Dashboard'}</h1>
            <div className="h-1 w-12 bg-gradient-to-r from-orange-500 to-red-600 rounded-full mt-1" />
            <p className="text-sm text-gray-500 mt-2">
              {tDashboard('overview') ?? 'Overview of your latest performance and orders.'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            {isSuperAdmin && (
              <select
                className="min-w-[220px] rounded-lg border border-gray-200 bg-white px-4 py-2 pr-10 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                value={selectedRestaurantId}
                onChange={(e) => setSelectedRestaurantId(e.target.value)}
              >
                <option value="">{tDashboard('allRestaurants') ?? 'All restaurants'}</option>
                {restaurants.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            )}

            <div className="flex items-center gap-2">
              <select
                className="min-w-[140px] rounded-lg border border-gray-200 bg-white px-4 py-2 pr-10 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                value={range}
                onChange={(e) => setRange(e.target.value as DashboardRange)}
              >
                <option value="TODAY">Daily</option>
                <option value="7D">Weekly</option>
                <option value="30D">Monthly</option>
              </select>

              <button
                type="button"
                onClick={fetchOrders}
                disabled={isLoading}
                className="inline-flex min-w-[120px] items-center justify-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 shadow-sm hover:bg-gray-50 disabled:opacity-60 whitespace-nowrap"
              >
                <ArrowPathIcon className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* KPI cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">
                {tDashboard('totalRevenue') ?? 'Total revenue'}
              </p>
              <h3 className="text-2xl font-bold text-gray-900 mt-2">
                {isLoading ? '—' : formatCurrency(kpis.totalRevenue)}
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                {range === 'TODAY' ? 'Since midnight' : `Since ${formatDayLabel(rangeStart)}`}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center">
              <BanknotesIcon className="w-6 h-6 text-orange-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">
                Orders
              </p>
              <h3 className="text-2xl font-bold text-gray-900 mt-2">
                {isLoading ? '—' : kpis.orderCount}
              </h3>
              <p className="text-xs text-gray-400 mt-1">Non-cancelled orders</p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
              <ShoppingBagIcon className="w-6 h-6 text-blue-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">
                Customers
              </p>
              <h3 className="text-2xl font-bold text-gray-900 mt-2">
                {isLoading ? '—' : kpis.uniqueCustomers}
              </h3>
              <p className="text-xs text-gray-400 mt-1">Unique in range</p>
            </div>
            <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center">
              <UserIcon className="w-6 h-6 text-emerald-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">
                Pending orders
              </p>
              <h3 className="text-2xl font-bold text-gray-900 mt-2">
                {isLoading ? '—' : kpis.pendingCount}
              </h3>
              <p className="text-xs text-gray-400 mt-1">Status = PENDING</p>
            </div>
            <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center">
              <ClockIcon className="w-6 h-6 text-amber-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">
                Cancelled orders
              </p>
              <h3 className="text-2xl font-bold text-gray-900 mt-2">
                {isLoading ? '—' : kpis.cancelledCount}
              </h3>
              <p className="text-xs text-gray-400 mt-1">Status = CANCELLED</p>
            </div>
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center">
              <TruckIcon className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        {/* Chart + Top items */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Revenue trend</h2>
                <p className="text-xs text-gray-500 mt-1">
                  {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
                </p>
              </div>
              <div className="text-xs text-gray-500">
                {selectedRestaurant ? selectedRestaurant.name : isSuperAdmin ? 'All restaurants' : ''}
              </div>
            </div>

            <div className="h-[320px]">
              <Line
                data={{
                  labels: chart.labels,
                  datasets: [
                    {
                      label: 'Revenue',
                      data: chart.revenueByDay,
                      borderColor: 'rgb(249, 115, 22)',
                      backgroundColor: 'rgba(249, 115, 22, 0.12)',
                      fill: true,
                    },
                  ],
                }}
                options={{
                  ...chartOptions,
                  scales: {
                    x: { display: true, grid: { display: false } },
                    y: { beginAtZero: true, ticks: { callback: (v) => String(v) } },
                  },
                }}
              />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Top selling items</h2>
            </div>

            {isLoading ? (
              <div className="text-sm text-gray-500">Loading…</div>
            ) : topItems.length === 0 ? (
              <div className="text-sm text-gray-500">No sales data in this range.</div>
            ) : (
              <div className="space-y-4">
                {topItems.map((item) => (
                  <div key={item.key} className="flex items-center gap-3">
                    {item.image ? (
                      // Use <img> instead of next/image to avoid remotePatterns config issues
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-10 w-10 rounded-lg object-cover bg-gray-100 border border-gray-200 flex-shrink-0"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-700 border border-gray-200 flex-shrink-0">
                        {item.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                      <p className="text-xs text-gray-500 truncate">
                        {item.restaurantName ?? ''}
                        {item.restaurantName ? ' · ' : ''}
                        {item.qty} sold
                      </p>
                    </div>
                    <div className="text-sm font-semibold text-gray-900">{formatCurrency(item.revenue)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DashboardHome;
