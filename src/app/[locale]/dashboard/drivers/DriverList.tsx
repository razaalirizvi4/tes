'use client';

import { useState } from 'react';
import { Driver, DriverStatus } from '@/types';
import Link from 'next/link';

interface DriverListProps {
  initialDrivers: Driver[];
}

export default function DriverList({ initialDrivers }: DriverListProps) {
  const [drivers] = useState(initialDrivers);
  const [filter, setFilter] = useState<DriverStatus | 'ALL'>('ALL');

  const filteredDrivers = filter === 'ALL' 
    ? drivers 
    : drivers.filter(d => d.status === filter);

  const getStatusColor = (status: DriverStatus) => {
    switch (status) {
      case 'ONLINE':
        return 'bg-green-100 text-green-800';
      case 'OFFLINE':
        return 'bg-gray-100 text-gray-800';
      case 'BUSY':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div>
      <div className="p-4 border-b">
        <div className="flex space-x-2">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-3 py-1 rounded-full text-sm ${
              filter === 'ALL' ? 'bg-primary text-white' : 'bg-gray-100'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('ONLINE')}
            className={`px-3 py-1 rounded-full text-sm ${
              filter === 'ONLINE' ? 'bg-primary text-white' : 'bg-gray-100'
            }`}
          >
            Online
          </button>
          <button
            onClick={() => setFilter('OFFLINE')}
            className={`px-3 py-1 rounded-full text-sm ${
              filter === 'OFFLINE' ? 'bg-primary text-white' : 'bg-gray-100'
            }`}
          >
            Offline
          </button>
          <button
            onClick={() => setFilter('BUSY')}
            className={`px-3 py-1 rounded-full text-sm ${
              filter === 'BUSY' ? 'bg-primary text-white' : 'bg-gray-100'
            }`}
          >
            Busy
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Driver
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Vehicle
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rating
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Orders
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredDrivers.map((driver) => (
              <tr key={driver.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {driver.user.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {driver.user.email}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(driver.status)}`}>
                    {driver.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {driver.vehicleType}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {driver.rating ? driver.rating.toFixed(1) : 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {driver.totalOrders}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <Link href={`/dashboard/drivers/${driver.id}`} className="text-primary hover:text-primary-600 mr-4">
                    View
                  </Link>
                  <button className="text-red-600 hover:text-red-900">
                    Deactivate
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}