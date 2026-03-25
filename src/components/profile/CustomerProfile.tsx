/* eslint-disable @next/next/no-img-element */
"use client";

import { OrderWithDetails } from "@/types/order";
import { UserData } from "@/types/user";
import { useState } from "react";
import { useTranslations } from "next-intl";

interface CustomerProfileProps {
  user: UserData;
  recentOrders: OrderWithDetails[];
}

export default function CustomerProfile({ user, recentOrders }: CustomerProfileProps) {
  const [activeTab, setActiveTab] = useState("orders");
  const tCommon = useTranslations("common");
  const tAuth = useTranslations("auth");
  const tProfile = useTranslations("profile");

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900">
          {tCommon("personalInfo")}
        </h3>

        <div className="flex items-center justify-center h-10 w-10 rounded-full bg-gray-500 overflow-hidden">
          {user && user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt="User Avatar"
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-base font-semibold text-white flex items-center justify-center">
              {user?.name ? user.name.charAt(0).toUpperCase() : "?"}
            </span>
          )}
        </div>

        <div className="mt-4 border-t border-gray-200 pt-4">
          <dl className="divide-y divide-gray-200">
            <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium text-gray-500">{tAuth("name")}</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {user.name || tCommon("notProvided")}
              </dd>
            </div>
            <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium text-gray-500">{tAuth("email")}</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {user.email}
              </dd>
            </div>
            <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium text-gray-500">{tCommon("joinedDate")}</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {new Date(user.createdAt).toLocaleDateString()}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {["orders", "favorites"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`${activeTab === tab
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm capitalize`}
              >
                {tProfile(tab as "orders" | "favorites")}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-4">
          {activeTab === "orders" && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {tProfile("recentOrders")}
              </h3>
              <ul>
                {recentOrders.map((order) => (
                  <ul key={order.id} className="mt-4">
                    {order?.orderItems?.map((item) => (
                      <li key={item.id} className="flex justify-between">
                        <div className="mt-2  flex flex-col text-sm">
                          <span className=" font-medium">{item.menuItem.label}</span>
                          <span className=" text-gray-600">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <span>
                          {item.quantity} x{" "}
                          <span className=" text-primary font-medium">
                            ${item.price}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                ))}
              </ul>
            </div>
          )}

          {activeTab === "favorites" && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {tProfile("favoriteRestaurants")}
              </h3>
            </div>
          )}
        </div>
      </div>

      {user.addresses && user.addresses.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900">{tProfile("savedAddresses")}</h3>
          <div className="mt-4 border-t border-gray-200 pt-4">
            <ul className="divide-y divide-gray-200">
              {user.addresses.map((address) => (
                <li key={address.id} className="py-4">
                  <div className="flex justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {address.label}
                      </p>
                      <p className="text-sm text-gray-500">
                        {address.streetAddress}, {address.city}, {address.state}{" "}
                        {address.zipCode}
                      </p>
                    </div>
                    {address.isDefault && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {tProfile("defaultAddress")}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
