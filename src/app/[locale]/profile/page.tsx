"use client";

import { Suspense, useEffect, useState } from "react";
import { useAuthStore } from "@/store/useStore";
import VendorProfile from "@/components/profile/VendorProfile";
import DriverProfile from "@/components/profile/DriverProfile";
import UserProfile from "@/components/profile/customer/UserProfile";
import { useSearchParams } from "next/navigation";
import UserOrders from "@/components/profile/customer/UserOrders";
import AddressPage from "../auth/address/page";
import Loading from "@/components/Loading";
import { useTranslations } from "next-intl";



export default function ProfilePage() {
  return (<Suspense>
    <ProfileComp></ProfileComp>
  </Suspense>)
}

function ProfileComp() {
  const t = useTranslations("profile");
  const searchParams = useSearchParams();

  const section = searchParams.get("section") || "profile"; // Default to "profile"
  const [loading, setLoading] = useState(true);

  // const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();


  useEffect(() => {
    if (user !== undefined) {
      // When user state is loaded, stop loading
      setLoading(false);
    }
  }, [user]);
  // Prevent rendering until we confirm if the user exists or not
  //  if (loading || user === undefined) {
  //   return (
  //     <div className="min-h-screen flex items-center justify-center bg-gray-100">
  //       <p className="text-gray-500">Loading profile...</p>
  //     </div>
  //   );
  // }

  if (!user) {
    return (
      <div style={{ width: "100%" }} className=" flex h-screen w-[100%] items-center justify-center   overflow-hidden">
        <Loading />
        {/* <div className="flex justify-center items-center h-screen text-lg">Loading...</div>; */}
      </div>
    );
  }


  const renderProfile = () => {
    switch (user?.role) {
      case "VENDOR":
        return <VendorProfile user={user} />;
      case "DRIVER":
        return <DriverProfile user={user} />;
      default:
        // return <CustomerProfile user={profileData} recentOrders={recentOrders} />;
        return CustomerProfile();

    }
  };

  const CustomerProfile = () => {
    switch (section) {
      case "profile":
        return <UserProfile user={user} userRole={user?.role ?? "guest"}
        />;
      case "orders":
        return <UserOrders />;
      case "addresses":
        return <AddressPage />;
      default:
        return <div className="text-center py-10">{t('pageNotFound')}</div>;
    }
  };

  return (

    <div className="min-h-screen mt-10 ">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className=" overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
            <div>
              {/* <h1 className="text-2xl font-bold text-gray-900">Profile</h1> */}
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                {user.role === "VENDOR"
                  ? t('vendorDashboard')
                  : user.role === "DRIVER"
                    ? t('driverDashboard')
                    : ""}
              </p>
            </div>
          </div>
          {renderProfile()}
        </div>
      </div>
    </div>
  );
}

