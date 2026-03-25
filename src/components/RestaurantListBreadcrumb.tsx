"use client";

import { useEffect, useState } from "react";
import { useRestaurantStore } from "@/store/useRestaurantStore";
import Breadcrumb from "./Breadcrumb";
import { useTranslations } from "next-intl";

export default function RestaurantListBreadcrumb() {
  const { selectedCity } = useRestaurantStore();
  const tCommon = useTranslations("common");
  const tRestaurant = useTranslations("restaurant");
  const [cityName, setCityName] = useState("");

  useEffect(() => {
    const savedCity = localStorage.getItem("selectedCity");
    if (savedCity) {
      setCityName(savedCity);
    } else if (selectedCity) {
      setCityName(selectedCity);
    }
  }, [selectedCity]);

  const breadcrumbItems = [
    { label: tCommon("home"), href: "/" },
    { label: cityName || tCommon("city") },
    { label: tRestaurant("restaurantsList") },
  ];

  return <Breadcrumb items={breadcrumbItems} />;
}

