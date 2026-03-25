"use client";
import type React from "react";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

// Mock data for location suggestions
const locations = [
  "New York, NY",
  "Los Angeles, CA",
  "Chicago, IL",
  "Houston, TX",
  "Phoenix, AZ",
  "Philadelphia, PA",
  "San Antonio, TX",
  "San Diego, CA",
  "Dallas, TX",
  "San Jose, CA",
];

export default function LocationSearch() {
  const [selectedLocation, setSelectedLocation] = useState("");
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const router = useRouter();
  const t = useTranslations("location");

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const filteredLocations =
    query === ""
      ? locations
      : locations.filter((location) =>
        location.toLowerCase().includes(query.toLowerCase())
      );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (listRef.current && !listRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value);
    setIsOpen(true);
  };

  const handleSelectLocation = (location: string) => {
    setSelectedLocation(location);
    setQuery(location);
    setIsOpen(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className="max-w-md ">
      <div className="flex items-center space-x-2">
        <div className="relative flex-grow">
          <input
            ref={inputRef}
            className="w-full py-3 pl-10 pr-4 text-gray-900 bg-white border border-primary rounded-full focus:border-none"
            placeholder={t("enterAddress")}
            value={query}
            onChange={handleInputChange}
            onFocus={() => setIsOpen(true)}
          />
          <svg
            className="absolute left-3 top-3.5 h-5 w-5 text-primary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>

          <button
            onClick={() => router.push("/restaurants")}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            className="px-2 py-2 top-[3px]  absolute right-3  tooltip text-primary "
          >
            <svg
              className="h-7 w-7  "
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </button>
          {showTooltip && (
            <div className="absolute top-1 right-6 -translate-x-1/2 mt-1 bg-black/60 text-white text-center py-1 px-2 rounded-md z-10">
              {t("search")}
            </div>
          )}

          {isOpen && (
            <ul
              ref={listRef}
              className="absolute z-10 w-full mt-1 bg-white shadow-lg max-h-60 overflow-auto scrollable-content rounded-t-[10px] "
            >
              {filteredLocations.map((location) => (
                <li
                  key={location}
                  className="cursor-default select-none relative py-2 pl-10 pr-4 rounded-full hover:bg-primary hover:text-white"
                  onClick={() => handleSelectLocation(location)}
                >
                  {location}
                  {location === selectedLocation && (
                    <svg
                      className="absolute left-3 top-3 h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
