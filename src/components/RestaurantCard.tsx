import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { useTranslations } from 'next-intl';

interface MenuItem {
  label: string;
  description: string;
  price: number;
  image: string;
  category: string;
}

interface RestaurantProps {
  id: string;
  name: string;
  chainName: string;
  cuisineType: string;
  rating: number;
  coverImage: string | null;
  coverImagesList?: string[] | null;
  address: string;
  segment: string;
  menuItems: MenuItem[];
}

export default function RestaurantCard({
  id,
  name,
  chainName,
  cuisineType,
  rating,
  coverImage,
  coverImagesList,
  address,
  segment,
  menuItems
}: RestaurantProps) {
  const t = useTranslations('restaurant');
  const displayName = chainName === 'Independent' ? name : chainName;
  const averagePrice = menuItems.reduce((sum, item) => sum + item.price, 0) / menuItems.length;
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const tCommon = useTranslations("common");

  // Determine which images to use
  const images = coverImagesList && coverImagesList.length > 0
    ? coverImagesList
    : coverImage
      ? [coverImage]
      : ['/images/restaurant-placeholder.jpg'];

  const hasMultipleImages = images.length > 1;

  const handlePrevious = (e: React.MouseEvent) => {
    e.preventDefault();
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <Link href={`/restaurants/${id}`} className="block group">
      <div className="bg-white rounded-lg shadow-md overflow-hidden transition-transform group-hover:scale-[1.02]">
        <div className="relative h-48">
          <Image
            src={images[currentImageIndex]}
            alt={name}
            fill
            className="object-cover"
          />
          {hasMultipleImages && (
            <>
              <button
                onClick={handlePrevious}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 z-10 transition-all"
                aria-label="Previous image"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={handleNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 z-10 transition-all"
                aria-label="Next image"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
                {images.map((_, index) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.preventDefault();
                      setCurrentImageIndex(index);
                    }}
                    className={`w-2 h-2 rounded-full transition-all ${index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                      }`}
                    aria-label={`Go to image ${index + 1}`}
                  />
                ))}
              </div>
            </>
          )}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
            <div className="flex items-center justify-between text-white">
              <span className="font-semibold">{segment}</span>
              <div className="flex items-center gap-1">
                <span className="text-yellow-400">★</span>
                <span>{rating.toFixed(1)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {displayName}
          </h3>

          <div className="text-sm text-gray-600 mb-2">
            {address}
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">{cuisineType}</span>
            <span className="text-primary font-medium">
              {t('avgPrice')} ${averagePrice.toFixed(2)}
            </span>
          </div>

          {menuItems.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-sm text-gray-500">
                {t('popular')} {menuItems[0].label}
              </p>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
