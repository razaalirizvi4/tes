"use client";
import { isRTL, type Locale } from "@/i18n/config";
import { useAuthStore } from "@/store/useStore";
import {
    BanknotesIcon,
    BuildingStorefrontIcon,
    ChartBarIcon,
    ClipboardDocumentListIcon,
    Cog8ToothIcon,
    HomeIcon,
    MapIcon,
    QuestionMarkCircleIcon,
    ShoppingCartIcon,
    TruckIcon,
    UserGroupIcon,
    XMarkIcon,
} from "@heroicons/react/24/outline";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import LanguageSelectorDialog from "../LanguageSelectorDialog";

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const Sidebar = ({ isOpen, setIsOpen }: SidebarProps) => {
  const pathname = usePathname();
  const { user } = useAuthStore((state) => state);
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const vendorId = !isSuperAdmin ? user?.vendorProfile?.id : undefined;
  const [orderCount, setOrderCount] = useState(0);
  const isOrdersPage = pathname === "/dashboard/orders";
  const t = useTranslations("dashboard");
  const locale = useLocale();
  const rtl = isRTL(locale as Locale);

  const sidebarItems = [
    { name: t("dashboard"), href: "/dashboard", icon: HomeIcon },
    { name: t("orders"), href: "/dashboard/orders", icon: ShoppingCartIcon },
    { name: t("pos"), href: "/dashboard/pos", icon: BanknotesIcon },
    {
      name: t("restaurants"),
      href: "/dashboard/restaurants",
      icon: BuildingStorefrontIcon,
    },
    { name: t("users"), href: "/dashboard/users", icon: UserGroupIcon },
    { name: t("drivers"), href: "/dashboard/drivers", icon: TruckIcon },
    { name: t("liveTracking"), href: "/dashboard/tracking", icon: MapIcon },
    { name: t("reports"), href: "/dashboard/reports", icon: ChartBarIcon },
    {
      name: t("dispatch"),
      href: "/dashboard/Dispatch",
      icon: ClipboardDocumentListIcon,
    },
    {
      name: t("settings"),
      href: "/dashboard/settings",
      icon: Cog8ToothIcon,
    },
  ];

  const fetchOrderCount = useCallback(async () => {
    if (!isSuperAdmin && !vendorId) {
      setOrderCount(0);
      return;
    }

    try {
      const params = new URLSearchParams({
        page: "1",
        pageSize: "1",
        status: "PENDING",
      });

      if (!isSuperAdmin && vendorId) {
        params.append("vendorId", vendorId);
      }

      const response = await fetch(`/api/orders?${params.toString()}`);
      const result = await response.json();
      const total =
        result?.meta?.total ?? (Array.isArray(result) ? result.length : 0);
      setOrderCount(total);
    } catch (error) {
      console.error("Error fetching order count:", error);
      setOrderCount(0);
    }
  }, [isSuperAdmin, vendorId]);

  useEffect(() => {
    fetchOrderCount();
    const interval = setInterval(fetchOrderCount, 30000);

    return () => {
      clearInterval(interval);
    };
  }, [fetchOrderCount]);

  const showOrderBadge = !isOrdersPage && orderCount > 0;
  const badgeLabel = orderCount > 99 ? "99+" : orderCount.toString();

  const renderNavItem = (item: (typeof sidebarItems)[0], className = "") => {
    const isActive = pathname === item.href;
    const Icon = item.icon;
    const shouldShowBadge = item.href === "/dashboard/orders" && showOrderBadge;

    return (
      <Link href={item.href} key={item.name}>
        <div
          className={`flex items-center space-x-3 rtl:space-x-reverse px-4 py-3 rounded-lg cursor-pointer transition-colors ${isActive
            ? "bg-primary-50 text-primary-600"
            : "text-gray-600 hover:bg-gray-200"
            } ${className}`}
        >
          <div className="relative">
            <Icon className="h-5 w-5" />
            {shouldShowBadge && (
              <span className="absolute -top-1.5 -right-1.5 rtl:-left-1.5 rtl:right-auto w-4 h-4  rounded-full bg-red-500 text-white text-[10px] font-semibold text-center leading-4">
                {badgeLabel}
              </span>
            )}
          </div>
          <span className="font-medium text-sm">{item.name}</span>
        </div>
      </Link>
    );
  };

  return (
    <>
      {/* Mobile/Tablet Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 xl:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

    <div
        className={`fixed inset-y-0 start-0 z-50 w-64 bg-gray-50 border-e border-gray-200 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : (rtl ? "translate-x-full" : "-translate-x-full")
        } xl:translate-x-0 xl:fixed xl:top-0 xl:h-screen pt-4 flex flex-col`}
      >
        <div className="flex flex-col h-full">
          {/* Logo & Close Button */}
          <div className="flex justify-between items-center px-4 md:px-8 mb-4">
            <div className="flex justify-start">
              <Image
                src="/images/fiestaa-logo-inline.png"
                alt="Fiestaa Logo"
                width={160}
                height={70}
                className="object-contain"
              />
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="lg:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto">
          <nav className="p-4 space-y-1">
            {sidebarItems
              .filter((item) => {
                // Only show Settings, Users, and Drivers for SUPER_ADMIN
                if (item.href === "/dashboard/settings" || item.href === "/dashboard/users" || item.href === "/dashboard/drivers") {
                  return isSuperAdmin;
                }
                // Only show POS and Orders for vendors, not for SUPER_ADMIN
                if (item.href === "/dashboard/pos" || item.href === "/dashboard/orders") {
                  return !isSuperAdmin;
                }
                return true;
              })
              .map((item) => renderNavItem(item))}
          </nav>

          {/* Support Section */}
          <div className="p-4 mt-4">
            <div className="px-4 mb-1">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {t("support")}
              </h3>
            </div>
            <div className="space-y-1">
              <Link href="/dashboard/help-center">
                <div className="flex items-center space-x-3 rtl:space-x-reverse px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-200 cursor-pointer">
                  <QuestionMarkCircleIcon className="h-5 w-5" />
                  <span className="font-medium text-sm">{t("helpCenter")}</span>
                </div>
              </Link>
            </div>
            <div className="px-4 mb-1 mt-4">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {t("language")}
              </h3>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600">
                <div className="flex-shrink-0">
                  <LanguageSelectorDialog />
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
    </>
  );
};

export default Sidebar;
