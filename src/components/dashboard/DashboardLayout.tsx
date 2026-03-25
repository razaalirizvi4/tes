'use client';

import { isRTL, type Locale } from '@/i18n/config';
import { useRouter } from "@/i18n/navigation";
import { authService } from "@/services/authService";
import { useAuthStore, useCartStore } from "@/store/useStore";
import { Bars3Icon, ShoppingCartIcon } from '@heroicons/react/24/outline';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useEffect, useRef, useState } from 'react';
import { AiOutlineUser } from "react-icons/ai";
import { BiSolidFoodMenu } from "react-icons/bi";
import { FaAddressCard, FaCashRegister, FaShippingFast, FaSignOutAlt, FaStore, FaTachometerAlt, FaUser } from "react-icons/fa";
import AccountButton from "../AccountButton";
import CartSidebar from "../cart/CartSidebar";
import Sidebar from './Sidebar';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const locale = useLocale();
  const rtl = isRTL(locale as Locale);
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");
  const tDashboard = useTranslations("dashboard");
  const tHeader = useTranslations("header");
  
  const { isAuthenticated, user } = useAuthStore((state) => state);
  const { items, clearCart } = useCartStore();
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close sidebar when pathname changes (e.g. on mobile navigation)
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  // Handle screen resize to close sidebar on desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1280) { // xl breakpoint
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Disable background scrolling when mobile/tablet sidebar is open
  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
    
    // CRITICAL: Cleanup must run when component unmounts OR when state changes
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [isSidebarOpen]);

  // Handle click outside for profile dropdown
  useEffect(() => {
    function handleClickOutside(event: PointerEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false);
      }
    }
    if (showProfileDropdown) {
      document.addEventListener("pointerdown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("pointerdown", handleClickOutside);
    };
  }, [showProfileDropdown]);

  const handleLogout = async () => {
    clearCart();
    await authService.signOut();
  };

  const getRoleBasedItems = () => {
    const baseItems = [
      {
        label: tCommon("profile"),
        icon: <FaUser className="w-4 h-4" />,
        action: () => router.push("/profile?section=profile"),
      },
    ];

    if (user?.role !== "VENDOR" && user?.role !== "DRIVER" && user?.role !== "SUPER_ADMIN") {
      baseItems.push(
        {
          label: tDashboard("orders"),
          icon: <BiSolidFoodMenu className="w-4 h-4" />,
          action: () => router.push("/profile?section=orders"),
        },
        {
          label: tDashboard("dashboard"),
          icon: <FaAddressCard className="w-4 h-4" />,
          action: () => router.push("/profile?section=addresses"),
        }
      );
    }

    if (user?.role === "VENDOR") {
      baseItems.push({
        label: t("myRestaurants"),
        icon: <FaStore className="w-4 h-4" />,
        action: () => router.push("/dashboard/restaurants"),
      });
    } else if (user?.role === "DRIVER") {
      baseItems.push({
        label: t("myDeliveries"),
        icon: <FaShippingFast className="w-4 h-4" />,
        action: () => router.push("/dashboard/deliveries"),
      });
    } else if (["ADMIN", "SUPER_ADMIN"].includes(user?.role ?? "")) {
      baseItems.push({
        label: tDashboard("dashboard"),
        icon: <FaTachometerAlt className="w-4 h-4" />,
        action: () => router.push("/dashboard"),
      });

      if (user?.role === "SUPER_ADMIN") {
        baseItems.push({
          label: tDashboard("orders"),
          icon: <BiSolidFoodMenu className="w-4 h-4" />,
          action: () => router.push("/dashboard/orders"),
        });
      }
    }

    if (user?.role === "VENDOR" || ["ADMIN", "SUPER_ADMIN"].includes(user?.role ?? "")) {
      baseItems.push({
        label: tDashboard("pos"),
        icon: <FaCashRegister className="w-4 h-4" />,
        action: () => router.push("/dashboard/pos"),
      });
    }

    baseItems.push({
      label: t("logout"),
      icon: <FaSignOutAlt className="w-4 h-4" />,
      action: handleLogout,
    });

    return baseItems;
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-gray-50">
      {/* Mobile/Tablet Top Header (only visible on small/medium screens to toggle sidebar) */}
      <div className="xl:hidden bg-gray-50 border-b border-gray-200 px-4 py-3 flex items-center justify-between fixed top-0 left-0 right-0 z-40 shadow-sm">
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="flex items-center space-x-2 rtl:space-x-reverse p-2 text-gray-500 hover:bg-gray-600 rounded-lg transition-colors"
        >
          <Bars3Icon className="w-6 h-6" />
        </button>

        <div className="flex items-center space-x-3 rtl:space-x-reverse">
          {isAuthenticated ? (
            <div className="relative">
              <button
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="p-2 bg-white cursor-pointer hover:bg-primary text-primary border border-primary hover:text-white rounded-full transition-colors"
              >
                <AiOutlineUser className="h-5 w-5" />
              </button>
              {showProfileDropdown && (
                <div ref={dropdownRef} className="absolute top-12 right-0 z-50">
                  <AccountButton
                    dropdownItems={getRoleBasedItems()}
                    user={user}
                    onItemClick={() => setShowProfileDropdown(false)}
                  />
                </div>
              )}
            </div>
          ) : (
            <Link href="/auth/login">
              <div className="bg-primary hover:bg-primary-600 flex items-center justify-center px-4 py-2 rounded-full whitespace-nowrap shadow-sm">
                <span className="text-white font-medium text-xs">
                  {t("login")}
                </span>
              </div>
            </Link>
          )}

          {user?.role !== "VENDOR" && user?.role !== "SUPER_ADMIN" && (
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 bg-white hover:bg-primary border border-primary text-primary hover:text-white rounded-full transition-colors"
            >
              <ShoppingCartIcon className="h-5 w-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-bold">
                  {totalItems}
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      <div className="flex">
        {/* Sidebar */}
        <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
        
        <div className="flex-1 min-w-0 flex flex-col xl:ps-64 bg-gray-50 min-h-screen max-w-full">
          {/* Main Content Area - padded top to clear the Fixed Headers */}
          <main className="flex-1 pt-20 xl:pt-24 px-4 md:px-8 pb-8">
            <div className="container mx-auto max-w-full">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
