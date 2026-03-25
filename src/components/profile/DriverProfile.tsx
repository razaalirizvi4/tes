'use client';

import { UserData } from "@/types/user";
import { useTranslations } from "next-intl";

interface DriverProfileProps {
  user: UserData;
}

export default function DriverProfile({ user }: DriverProfileProps) {
  const tCommon = useTranslations("common");
  const tProfile = useTranslations("profile");
  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900">{tProfile("driverInfo")}</h3>
        <div className="mt-4 border-t border-gray-200 pt-4">
          <dl className="divide-y divide-gray-200">
            <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium text-gray-500">{tCommon("status")}</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                  ${user.driver?.status === 'ONLINE' ? 'bg-green-100 text-green-800' :
                    user.driver?.status === 'BUSY' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'}`}>
                  {user.driver?.status === 'ONLINE' ? tCommon('online') :
                    user.driver?.status === 'BUSY' ? tCommon('busy') :
                      tCommon('offline')}
                </span>
              </dd>
            </div>
            <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium text-gray-500">{tProfile("vehicleType")}</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {user.driver?.vehicleType || tCommon('notProvided')}
              </dd>
            </div>
            <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium text-gray-500">{tCommon("rating")}</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {user.driver?.rating ? `${user.driver.rating} / 5` : tCommon('noRatingsYet')}
              </dd>
            </div>
            <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium text-gray-500">{tProfile("totalOrders")}</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {user.driver?.totalOrders || 0}
              </dd>
            </div>
            <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium text-gray-500">{tProfile("approvalStatus")}</dt>
              <dd className="mt-1 text-sm sm:mt-0 sm:col-span-2">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                  ${user.approvalStatus === 'APPROVED' ? 'bg-green-100 text-green-800' :
                    user.approvalStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'}`}>
                  {user.approvalStatus}
                </span>
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {user.driver?.documents && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900">{tProfile("documents")}</h3>
          <div className="mt-4 border-t border-gray-200 pt-4">
            <dl className="divide-y divide-gray-200">
              {Object.entries(user.driver.documents).map(([key, value]) => (
                <div key={key} className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                  <dt className="text-sm font-medium text-gray-500">
                    {key.split(/(?=[A-Z])/).join(' ')}
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    <a href={value as string} target="_blank" rel="noopener noreferrer"
                      className="text-primary hover:text-primary-dark">
                      {tProfile("viewDocument")}
                    </a>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      )}
    </div>
  );
}