'use client';

import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { MdCancel } from 'react-icons/md';
import axios from 'axios';
import { useLocationStore } from '@/store/useStore';
import { locationService } from '@/services/locationService';
import { useRestaurantStore } from '@/store/useRestaurantStore';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

interface LocationSelectorProps {
  onLocationSelected: (city: string, area: string) => void;
  setIsLocationModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  initialCity?: string;
  initialArea?: string;
}

export default function LocationSelector({ onLocationSelected, setIsLocationModalOpen, initialCity = '', initialArea = '' }: LocationSelectorProps) {
  const t = useTranslations('location');
  // Initialize with props value only - localStorage will be synced in useEffect
  const [selectedCity, setSelectedCity] = useState(initialCity || '');
  const [selectedArea, setSelectedArea] = useState(initialArea || '');
  const [mounted, setMounted] = useState(false);

  const [loading] = useState(false);

  const { citiesAndAreas } = useLocationStore((state) => state);

  // Handle the use of current location
  const handleUseCurrentLocation = async () => {
    try {
      const coordinates = await locationService.getCurrentLocation();
      console.log(coordinates, "coordinates");

      const response = await axios.get(
        `/api/geocode?lat=${coordinates.latitude}&lon=${coordinates.longitude}`
      );

      if (!response.data || !response.data.address) {
        throw new Error("Invalid response from geolocation service");
      }

      const address = response.data.address;

      // Ensure we always get a valid city and area
      const area =
        address.road ||
        address.village ||
        address.suburb ||
        address.neighbourhood ||
        address.subdistrict ||
        "Unknown Area";

      const city =
        address.city ||
        address.town ||
        address.municipality ||
        address.state_district ||
        address.county ||
        address.state ||
        "Unknown City";

      console.log("Detected city:", city, "Detected area:", area);

      if (city === "Unknown City" || area === "Unknown Area") {
        toast.error(t('locationAccuracyError'));
      }

      setSelectedCity(city);
      setSelectedArea(area);
      onLocationSelected(city, area);
      useRestaurantStore.getState().setLocation(city, area);

      localStorage.setItem("selectedCity", city);
      localStorage.setItem("selectedArea", area);
    } catch (error) {
      toast.error(t('locationFetchError'));
      console.error("Error fetching address:", error);
    }
  };


  const handleSubmit = () => {
    if (!selectedCity) {
      toast.error(t('selectCityError'));
      return;
    }
    if (!selectedArea) {
      toast.error(t('selectAreaError'));
      return;
    }
    onLocationSelected(selectedCity, selectedArea);
  };



  const getCitiesAndAreas = async () => {
    try {
      // Fetch data from the API
      const response = await fetch('/api/locations');
      if (response.ok) {
        const data = await response.json();
        // Use Zustand store to update the state
        useLocationStore.getState().setCitiesAndAreas(data);
      } else {
        throw new Error('Failed to fetch cities and areas');
      }
    } catch (error) {
      console.error(error);
    }
  }


  useEffect(() => {
    getCitiesAndAreas()
  }, [])

  // Sync localStorage on mount (client-only to prevent hydration mismatch)
  useEffect(() => {
    const savedCity = localStorage.getItem('selectedCity') || initialCity;
    const savedArea = localStorage.getItem('selectedArea') || initialArea;
    setSelectedCity(savedCity);
    setSelectedArea(savedArea);
    setMounted(true);
  }, [initialCity, initialArea])


  return (
    <div className="flex  flex-col items-center p-6 max-w-[1400px] mx-auto relative">

      <div className="mb-4 flex justify-center">
        <Image
          src="/images/fiestaa-logo.png"
          alt="Fiestaa Logo"
          width={120}
          height={40}
          className="object-contain"
        />
      </div>


      {/* <h1 className="text-xl text-gray-800 font-bold mb-4">Select your order type</h1> */}
      {/* 
      <button className="bg-primary text-white font-medium px-8 py-2 rounded-full mb-4 hover:bg-primary-600 transition-colors">
        INSTANT
      </button> */}

      <h2 className="text-base font-medium mb-4">{t('selectLocation')}</h2>

      <button
        onClick={handleUseCurrentLocation}
        disabled={loading}
        className="flex text-sm items-center gap-2 bg-gray-200 px-6 py-2 rounded-full mb-4 hover:bg-gray-300 transition-colors"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        {loading ? t('gettingLocation') : t('useCurrentLocation')}
      </button>

      <div className="w-full space-y-4">
        {/* City Selector */}
        <select
          value={selectedCity}
          onChange={(e) => setSelectedCity(e.target.value)}
          className="w-full px-4 text-sm p-2 border border-primary rounded-full focus:outline-none focus:ring-0 focus:ring-white"
        >
          <option value="">{t('selectCity')}</option>
          {(citiesAndAreas ? Object.keys(citiesAndAreas) : []).map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>

        {/* Area Selector */}
        <select
          value={selectedArea}
          onChange={(e) => setSelectedArea(e.target.value)}
          disabled={!selectedCity}
          className="w-full p-2 px-4 text-sm border border-primary rounded-full focus:outline-none focus:ring-0 focus:ring-white disabled:bg-gray-100"
        >
          <option value="">{t('selectArea')}</option>
          {selectedCity &&
            (citiesAndAreas && citiesAndAreas[selectedCity] || []).map((area) => (
              <option key={area} value={area}>
                {area}
              </option>
            ))}
        </select>

        {/* Select Button */}
        <button
          disabled={!selectedCity || !selectedArea}
          onClick={handleSubmit}
          className="text-sm py-3 px-6 mx-auto flex items-center justify-center  bg-primary rounded-full text-white font-normal hover:bg-primary-600 transition-colors disabled:bg-gray-300"
        >
          {t('select')}
        </button>

        {/* Close Button */}
        <div className="absolute -top-5 right-0">
          <MdCancel
            onClick={() => setIsLocationModalOpen(false)}
            className="text-primary hover:text-primary-600 text-3xl cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
}
