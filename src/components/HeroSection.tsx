"use client";
import React, { useEffect, useState } from "react";
import LocationSearch from "./LocationSearch";
import Image from "next/image";
import { SlLocationPin } from "react-icons/sl";
import { useTranslations } from "next-intl";
import { locationService } from "@/services/locationService";
import toast from "react-hot-toast";

function HeroSection() {
  const [selectedcity, setSelectedCity] = useState("");
  const t = useTranslations("hero");

  const handleUseCurrentLocation = async () => {
    try {
      const coordinates = await locationService.getCurrentLocation();
      const location = await locationService.getAddressFromCoordinates(
        coordinates
      );
      if (location && location.city) {
        setSelectedCity(location.city);
      }
    } catch {
      toast.error("Failed to get current location");
    } finally {
    }
  };

  useEffect(() => {
    handleUseCurrentLocation();
  }, []);
  return (
    <section className=" relative min-h-screen hero-section">
      <div className="px-10 relative py-24">
        <div className="flex flex-col lg:flex-row lg:flex-nowrap gap-12 lg:items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <SlLocationPin className="text-primary font-bold" size={22} />
              <span className=" text-gray-500 font-semibold">
                {selectedcity ? selectedcity : "Lahore"}
              </span>
            </div>

            <div className="space-y-8  flex-1">
              <h1 className="text-5xl md:text-6xl font-bold leading-tight text-gray-900">
                {t('title')}
              </h1>
              <p className="text-xl text-gray-600">
                {t('subtitle')}
              </p>

              <LocationSearch />
            </div>
          </div>

          {/* Image Section */}
          <div className="relative flex-1">
            <div className="relative w-full h-[500px] sm:h-[600px]">
              <Image
                src="/main.png"
                alt="Delicious Food"
                fill
                className="object-contain"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
