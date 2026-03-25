"use client";

import { isRTL, type Locale } from "@/i18n/config";
import { Link, useRouter } from "@/i18n/navigation";
import { authService } from "@/services/authService";
import { useRestaurantStore } from "@/store/useRestaurantStore";
import { useAuthStore, useCartStore } from "@/store/useStore";
import { ShoppingCartIcon } from "@heroicons/react/24/outline";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AiOutlineUser } from "react-icons/ai";
import { BiSolidFoodMenu } from "react-icons/bi";
import {
  FaAddressCard,
  FaCashRegister,
  FaShippingFast,
  FaSignOutAlt,
  FaStore,
  FaTachometerAlt,
  FaUser,
} from "react-icons/fa";
import { MdLocationOn } from "react-icons/md";
import AccountButton from "../AccountButton";
import CartSidebar from "../cart/CartSidebar";
import LocationSelector from "../LocationSelector";

export default function Header() {
  const pathname = usePathname();
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");
  const tDashboard = useTranslations("dashboard");
  const tHeader = useTranslations("header");
  const [isScrolled, setisScrolled] = useState(false);
  const locale = useLocale();
  const rtl = isRTL(locale as Locale);

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const { items, clearCart } = useCartStore();
  const [toogle, setToggle] = useState(false);
  const router = useRouter();

  const [isAuthChecked, setIsAuthChecked] = useState(false);

  useEffect(() => {
    setIsAuthChecked(true);
  }, []);

  // Check for flag to open cart after navigation (for reorder functionality)
  useEffect(() => {
    const shouldOpenCart = localStorage.getItem("openCartAfterNav");
    if (shouldOpenCart === "true") {
      // Small delay to ensure page has loaded
      const timer = setTimeout(() => {
        setIsCartOpen(true);
        localStorage.removeItem("openCartAfterNav");
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [pathname, setIsCartOpen]);

  // const [selectedCity, setSelectedCity] = useState(() =>
  //   typeof window !== "undefined" ? localStorage.getItem("selectedCity") || "" : ""
  // );

  // const [selectedArea, setSelectedArea] = useState(() =>
  //   typeof window !== "undefined" ? localStorage.getItem("selectedArea") || "" : ""
  // );

  const [selectedCity, setSelectedCity] = useState("");
  const [selectedArea, setSelectedArea] = useState("");
  const [isReady, setIsReady] = useState(false); // To track if the state is ready

  const { isAuthenticated, user } = useAuthStore((state) => state);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const toggleProfileBar = () => {
    setToggle(!toogle);
  };

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: PointerEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setToggle(false);
      }
    }

    document.addEventListener("pointerdown", handleClickOutside);
    return () => {
      document.removeEventListener("pointerdown", handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    clearCart();
    await authService.signOut();
  };

  const toggleLocationModal = () => {
    setIsLocationModalOpen(!isLocationModalOpen);
  };

  const handleLocationSelect = (city: string, area: string) => {
    setSelectedCity(city); // Update the selected city
    setSelectedArea(area);
    localStorage.setItem("selectedCity", city);
    localStorage.setItem("selectedArea", area);
    useRestaurantStore.getState().setLocation(city, area);

    setIsLocationModalOpen(false); // Close the modal

    // If user is on a restaurant details page, redirect to restaurants list
    if (pathname.startsWith("/restaurants/") && pathname !== "/restaurants") {
      router.push("/restaurants");
    }
  };

  useEffect(() => {
    // Don't show location modal on dashboard pages
    if (pathname.includes("/dashboard")) {
      setIsLocationModalOpen(false);
      return;
    }

    // Don't show location modal for VENDOR or SUPER_ADMIN
    if (isAuthenticated && user) {
      if (user.role === "VENDOR" || user.role === "SUPER_ADMIN") {
        setIsLocationModalOpen(false); // Close modal if it's open
        return;
      }
    }

    // For other users, show modal if no city is saved
    const savedCity = localStorage.getItem("selectedCity");
    if (!savedCity) {
      setIsLocationModalOpen(true);
    }
  }, [pathname, isAuthenticated, user?.role]);

  useEffect(() => {
    // Set values from localStorage only after the component is mounted
    const savedCity = localStorage.getItem("selectedCity");
    const savedArea = localStorage.getItem("selectedArea");
    setSelectedCity(savedCity || "");
    setSelectedArea(savedArea || "");
    setIsReady(true); // Mark the state as ready after loading from localStorage
  }, []);

  const getRoleBasedItems = () => {
    // const isDashboardPage = pathname.startsWith("/dashboard");
    const baseItems = [
      {
        label: tCommon("profile"),
        icon: <FaUser className="w-4 h-4" />,
        action: () => router.push("/profile?section=profile"),
      },
    ];

    // Only customers should see these (excluding SUPER_ADMIN)
    if (user?.role !== "VENDOR" && user?.role !== "DRIVER" && user?.role !== "SUPER_ADMIN") {
      baseItems.push(
        {
          label: tDashboard("orders"),
          icon: <BiSolidFoodMenu className="w-4 h-4" />,
          action: () => router.push("/profile?section=orders"),
        },
        {
          label: t("addresses"),
          icon: <FaAddressCard className="w-4 h-4" />,
          action: () => router.push("/profile?section=addresses"),
        }
      );
    }

    // Add vendor-specific options
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

      // Add Orders item for SUPER_ADMIN
      if (user?.role === "SUPER_ADMIN") {
        baseItems.push({
          label: tDashboard("orders"),
          icon: <BiSolidFoodMenu className="w-4 h-4" />,
          action: () => router.push("/dashboard/orders"),
        });
      }
    }

    // Add POS for both Vendor and Admins
    if (user?.role === "VENDOR" || ["ADMIN", "SUPER_ADMIN"].includes(user?.role ?? "")) {
      baseItems.push({
        label: tDashboard("pos"),
        icon: <FaCashRegister className="w-4 h-4" />,
        action: () => router.push("/dashboard/pos"),
      });
    }

    // Logout button (always present)
    baseItems.push({
      label: t("logout"),
      icon: <FaSignOutAlt className="w-4 h-4" />,
      action: handleLogout,
    });

    return baseItems;
  };

  const dropdownItems = getRoleBasedItems();
  let bgColor;
  const isDashboardPage = pathname.includes("/dashboard");
  if (pathname === "/" && !isScrolled) {
    bgColor = "rgba(255, 255, 255, 0.9)"; // Transparent black on home
  } else if (pathname === "/" && isScrolled) {
    bgColor = "rgba(255, 255, 255, 1)"; // Darker black when scrolled on home
  } else {
    bgColor = "#FFFFFF"; // White for other pages
  }

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;

      setisScrolled(scrollTop > window.innerHeight);
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Hide header on auth pages - now with locale prefix (e.g., /en/auth/login)
  const isAuthPage = /^\/(en|ru|tr|az|ar)\/auth\/(login|signup|forgot-password|reset-password|verify-email)/.test(pathname);
  if (isAuthPage) {
    return null;
  }

  // Hide the global Header on Dashboard pages for mobile devices (so DashboardLayout's mobile header handles the menu)
  // Note: Since `window` is only available on the client side, we use a CSS class approach to hide it instead of conditionally returning null.

  // Determine custom header classes for Dashboard on Desktop
  const dashboardHeaderClass = isDashboardPage 
    ? `hidden lg:block lg:w-[calc(100%-16rem)] ${rtl ? 'lg:right-64 lg:left-auto' : 'lg:left-64'} bg-gray-50 !shadow-none !border-b !border-gray-200` 
    : '';

  return (
    <>
      {!isAuthChecked ? null : (
        <header
          className={`${!isDashboardPage ? bgColor : ''} fixed top-0 z-40 w-full shadow-md py-2 md:py-3 transition-all duration-300 ${dashboardHeaderClass} ${isDashboardPage ? 'bg-gray-50' : ''}`}
          style={{
            backgroundColor: isDashboardPage ? '#f9fafb' : bgColor, // Rely on className for dashboard
            backdropFilter: isScrolled && pathname === "/" ? "blur(10px)" : "none",
          }}  
        >
          <nav className="mx-auto container px-4 md:px-8">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4 md:gap-6 flex-shrink-0">
                {/* Hide FoodApp logo for VENDOR and SUPER_ADMIN */}
                {user?.role !== "VENDOR" && user?.role !== "SUPER_ADMIN" && (
                  <Link
                    href="/"
                    prefetch={false}
                  >
                    <div className=" flex justify-center">
                      <Image
                        src="/images/fiestaa-logo.png"
                        alt="Fiestaa Logo"
                        width={60}
                        height={20}
                        objectFit="cover"
                        className="object-cover"
                      />
                    </div>
                  </Link>
                )}

                {!isDashboardPage && (
                  /* Deliver to section */
                  <div
                    className="flex items-center text-center gap-2 ms-2 md:ms-10 cursor-pointer"
                    onClick={toggleLocationModal}
                  >
                    <MdLocationOn className="text-primary w-6 h-6 md:w-7 md:h-7 bg-white border border-primary rounded-full p-1 font-bold block flex-shrink-0" />
                    <div className="flex flex-col md:flex-row md:items-center text-start md:text-center md:gap-2">
                      <span className="text-gray-700 text-xs md:text-sm hidden sm:block">{tHeader("deliverTo")} </span>
                      {!selectedCity || !isReady ? (
                        <span className="font-medium">
                          <span className="text-primary-400">{tHeader("selectLocation")}</span>
                        </span>
                      ) : (
                        <span className="text-primary-400 font-medium whitespace-nowrap overflow-visible">
                          {selectedArea && `${selectedArea},`} {selectedCity}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Authentication and Cart Section */}
              <div className="flex gap-4 md:gap-8 flex-shrink-0">
                <div className="flex items-center gap-4 md:gap-6">

                  {isAuthenticated ? (
                    <>
                      <div className="relative flex items-center gap-4 ">
                        {/* {display customer name if available} */}
                        {user?.name && (
                          <span className="text-gray-700  font-medium  text-sm  md:text-base   hidden md:block">
                            {tHeader('hello', { name: user.name })}
                          </span>
                        )}
                        <div
                          onClick={toggleProfileBar}
                          className="relative p-2 bg-white cursor-pointer hover:bg-primary text-primary border border-primary hover:text-white rounded-full  block"
                        >

                          <AiOutlineUser className="h-5 w-5 " />

                          {/* <span className="font-medium text-white text-sm md:text-base  hidden md:block">
                            {user?.name}
                          </span> */}
                        </div>

                        {toogle && (
                          <div
                            ref={dropdownRef}
                            className={`absolute top-12 ${rtl ? 'left-0' : 'right-0'} z-50`}
                          >
                            <AccountButton
                              dropdownItems={dropdownItems}
                              user={user}
                              onItemClick={() => setToggle(false)}
                            />
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <Link href="/auth/login">
                        <div className="bg-primary hover:bg-primary-600 flex items-center justify-center gap-1 px-3 py-1.5 md:px-4 md:py-2 rounded-full whitespace-nowrap">
                          <span className="text-white font-medium text-xs md:text-sm">
                            {t("login")}
                          </span>
                          <span className="text-white hidden text-xs md:text-sm lg:inline">
                            /
                          </span>
                          <span className="text-white font-medium text-xs md:text-sm hidden lg:inline">
                            {t("signup")}
                          </span>
                        </div>
                      </Link>
                    </>
                  )}
                  {/* Hide cart icon for VENDOR and SUPER_ADMIN */}
                  {user?.role !== "VENDOR" && user?.role !== "SUPER_ADMIN" && (
                    <div className="flex items-center gap-5 bg-white rounded-full text-primary font-bold">
                      <button
                        onClick={() => setIsCartOpen(true)}
                        className="relative p-2 hover:bg-primary border border-primary hover:text-white rounded-full block"
                      >
                        <ShoppingCartIcon className="h-5 w-5 " />
                        {totalItems > 0 && (
                          <span className="absolute -top-1 -right-1 bg-primary text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">
                            {totalItems}
                          </span>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </nav>
        </header>
      )}

      {/* Location Selector Modal */}
      {isLocationModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div
            className="bg-white rounded-3xl shadow-lg p-4 md:p-6 w-full max-w-md mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <LocationSelector
              onLocationSelected={handleLocationSelect}
              setIsLocationModalOpen={setIsLocationModalOpen}
              initialCity={selectedCity}
              initialArea={selectedArea}
            />
          </div>
        </div>
      )}

      <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      {/* Hide mobile cart bottom bar for VENDOR and SUPER_ADMIN */}
      {totalItems > 0 && user?.role !== "VENDOR" && user?.role !== "SUPER_ADMIN" && (
        <div className="bg-primary-600 flex justify-between px-5 items-center h-[60px] fixed bottom-[0px] w-full z-20 md:hidden">
          <div className=" flex items-center  gap-2 font-medium text-white">
            <span>{tHeader("itemsSelected")} </span>
            <span className=" bg-white text-black text-[10px] md:text-xs w-5 h-5 md:w-6 md:h-6 flex items-center justify-center rounded-full">
              {totalItems}
            </span>
          </div>

          <button
            className="text-white font-medium"
            onClick={() => setIsCartOpen(true)}
          >
            {tHeader("showCart")}
          </button>
        </div>
      )}
    </>
  );
}
