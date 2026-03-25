"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useAuthStore } from "@/store/useStore";
import { authService } from "@/services/authService";
import { useTranslations } from "next-intl";
import { useCurrency } from "@/hooks/useCurrency";
import {
  BuildingStorefrontIcon,
  BanknotesIcon,
  ClockIcon,
  CalendarDaysIcon,
  FunnelIcon,
  ArrowPathIcon
} from "@heroicons/react/24/outline";

interface Restaurant {
  id: string;
  name: string;
  address: string;
  currency?: string;
}

interface ShiftReport {
  id: string;
  cashierName: string;
  openedAt: string;
  closedAt: string | null;
  status: 'OPEN' | 'CLOSED';
  sales: {
    total: number;
    cash: number;
    card: number;
    qr: number;
  };
  cashDrawer: {
    opening: number;
    closing: number | null;
    expected: number;
    variance: number;
  };
  transactionCount: number;
}

export default function ReportsPage() {
  const { user } = useAuthStore();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [shifts, setShifts] = useState<ShiftReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ totalSales: 0, totalShifts: 0, netVariance: 0 });
  const tDashboard = useTranslations('dashboard');
  const tCommon = useTranslations('common');
  const tReports = useTranslations('dashboard.reportsPage');


  // Currency hook for formatting
  const { formatCurrency } = useCurrency(selectedRestaurant?.currency);

  useEffect(() => {
    if (user?.vendorProfile?.id) {
      fetchRestaurants();
    }
  }, [user]);

  useEffect(() => {
    if (selectedRestaurant) {
      fetchShiftReports(selectedRestaurant.id);
    } else {
      setShifts([]);
      setStats({ totalSales: 0, totalShifts: 0, netVariance: 0 });
    }
  }, [selectedRestaurant]);

  const fetchRestaurants = async () => {
    try {
      const token = await authService.getAccessToken();
      if (!token) return;
      const res = await fetch(`/api/restaurants?vendorId=${user?.vendorProfile?.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setRestaurants(data);
        if (data.length === 1) setSelectedRestaurant(data[0]);
      }
    } catch (error) {
      console.error("Error fetching restaurants:", error);
    }
  };

  const fetchShiftReports = async (restaurantId: string) => {
    setLoading(true);
    try {
      const token = await authService.getAccessToken();
      if (!token) return;
      const res = await fetch(`/api/reports/shifts?restaurantId=${restaurantId}&pageSize=20`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const response = await res.json();

      if (response.data) {
        setShifts(response.data);

        // Calculate summary stats
        const totalSales = response.data.reduce((sum: number, shift: ShiftReport) => sum + shift.sales.total, 0);
        const netVariance = response.data.reduce((sum: number, shift: ShiftReport) => sum + shift.cashDrawer.variance, 0);
        setStats({
          totalSales,
          totalShifts: response.meta.total,
          netVariance
        });
      }
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6 bg-gray-50 min-h-screen">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              {tReports('title')}
            </h1>
            <div className="h-1 w-12 bg-gradient-to-r from-[#f97316] to-[#dc2626] rounded-full mt-1"></div>
            <p className="text-gray-500 text-sm mt-1">{tReports('subtitle')}</p>
          </div>

          {/* Restaurant Selector */}
          <div className="relative min-w-[250px] group">
            <select
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#f97316] appearance-none cursor-pointer hover:border-[#f97316] transition-all duration-200"
              value={selectedRestaurant?.id || ""}
              onChange={(e) => {
                const r = restaurants.find(r => r.id === e.target.value);
                setSelectedRestaurant(r || null);
              }}
            >
              <option value="">{tReports('selectRestaurant')}</option>
              {restaurants.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
            <BuildingStorefrontIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          </div>
        </div>

        {selectedRestaurant ? (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Total Revenue Card */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between relative overflow-hidden group hover:shadow-md transition-shadow">
                <div className="absolute top-0 left-0 w-full h-1  opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div>
                  <p className="text-gray-500 text-sm font-medium uppercase tracking-wider">{tDashboard('totalRevenue')}</p>
                  <h3 className="text-3xl font-bold text-gray-800 mt-2">{formatCurrency(stats.totalSales)}</h3>
                  <p className="text-xs text-gray-400 mt-1">{tReports('basedOnRecentShifts')}</p>
                </div>
                <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <BanknotesIcon className="w-6 h-6 text-[#f97316]" />
                </div>
              </div>

              {/* Total Shifts Card */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between relative overflow-hidden group hover:shadow-md transition-shadow">
                <div className="absolute top-0 left-0 w-full h-1 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div>
                  <p className="text-gray-500 text-sm font-medium uppercase tracking-wider">{tReports('totalShifts')}</p>
                  <h3 className="text-3xl font-bold text-gray-800 mt-2">{stats.totalShifts}</h3>
                  <p className="text-xs text-gray-400 mt-1">{tReports('recordedShifts')}</p>
                </div>
                <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ClockIcon className="w-6 h-6 text-[#f97316]" />
                </div>
              </div>

              {/* Cash Variance Card */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between relative overflow-hidden group hover:shadow-md transition-shadow">
                <div className="absolute top-0 left-0 w-full h-1 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div>
                  <p className="text-gray-500 text-sm font-medium uppercase tracking-wider">{tReports('netVariance')}</p>
                  <h3 className={`text-3xl font-bold mt-2 ${stats.netVariance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatCurrency(stats.netVariance)}
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">{tReports('cashDrawerDiscrepancy')}</p>
                </div>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform ${stats.netVariance < 0 ? 'bg-red-50' : 'bg-green-50'}`}>
                  <FunnelIcon className={`w-6 h-6 ${stats.netVariance < 0 ? 'text-red-600' : 'text-green-600'}`} />
                </div>
              </div>
            </div>

            {/* Shift History Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                <h2 className="font-bold text-gray-700 flex items-center gap-2">
                  <CalendarDaysIcon className="w-5 h-5" />
                  {tReports('history')}
                </h2>
                <button
                  onClick={() => selectedRestaurant && fetchShiftReports(selectedRestaurant.id)}
                  className="p-2 hover:bg-white rounded-lg transition-colors text-gray-500 hover:text-[#f97316]"
                  title={tReports('refresh')}
                >
                  <ArrowPathIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 font-semibold text-gray-600">{tDashboard('status')}</th>
                      <th className="px-6 py-3 font-semibold text-gray-600">{tReports('ended')}</th>
                      <th className="px-6 py-3 font-semibold text-gray-600">{tReports('cashier')}</th>
                      <th className="px-6 py-3 font-semibold text-gray-600 text-right">{tDashboard('totalSales')}</th>
                      <th className="px-6 py-3 font-semibold text-gray-600 text-right">{tDashboard('cash')}</th>
                      <th className="px-6 py-3 font-semibold text-gray-600 text-right">{tReports('cards')}</th>
                      <th className="px-6 py-3 font-semibold text-gray-600 text-right">{tDashboard('variance')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#f97316]"></div>
                          <p className="mt-2 text-sm">{tReports('loadingShifts')}</p>
                        </td>
                      </tr>
                    ) : shifts.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-gray-500 italic">
                          {tReports('noShiftHistory')}
                        </td>
                      </tr>
                    ) : (
                      shifts.map((shift) => (
                        <tr key={shift.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${shift.status === 'OPEN'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                              }`}>
                              {shift.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-600">
                            {shift.closedAt
                              ? new Date(shift.closedAt).toLocaleDateString() + ' ' + new Date(shift.closedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                              : <span className="text-green-600 font-medium">{tReports('activeNow')}</span>
                            }
                          </td>
                          <td className="px-6 py-4 font-medium text-gray-900">{shift.cashierName}</td>
                          <td className="px-6 py-4 text-right font-bold text-gray-900">{formatCurrency(shift.sales.total)}</td>
                          <td className="px-6 py-4 text-right text-gray-600">{formatCurrency(shift.sales.cash)}</td>
                          <td className="px-6 py-4 text-right text-gray-600">{formatCurrency(shift.sales.card)}</td>
                          <td className={`px-6 py-4 text-right font-medium ${(shift.cashDrawer.variance || 0) < 0 ? 'text-red-500' : 'text-green-600'
                            }`}>
                            {shift.status === 'CLOSED' ? formatCurrency(shift.cashDrawer.variance) : '-'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Footer / Pagination Placeholder */}
              <div className="p-4 border-t border-gray-200 bg-gray-50 text-xs text-center text-gray-500">
                {tReports('showingRecent', { count: shifts.length })}
              </div>
            </div>
          </>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl shadow-md border border-gray-100 text-center h-[500px] relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-50/30 to-red-50/30 opacity-50"></div>
            <div className="bg-orange-50 p-6 rounded-full mb-6 relative z-10 group-hover:scale-110 transition-transform duration-500">
              <BuildingStorefrontIcon className="w-16 h-16 text-[#f97316]" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 relative z-10">{tReports('selectRestaurant')}</h3>
            <p className="text-gray-500 mt-2 max-w-sm relative z-10 font-medium">
              {tReports('selectPrompt')}
            </p>

          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
