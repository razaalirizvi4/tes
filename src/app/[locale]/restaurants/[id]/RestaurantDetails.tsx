"use client";

import Breadcrumb from "@/components/Breadcrumb";
import AddonSelector from "@/components/menu/AddonSelector";
import { useCurrency } from "@/hooks/useCurrency";
import { isRTL, type Locale } from "@/i18n/config";
import { useRestaurantStore } from "@/store/useRestaurantStore";
import { useCartStore } from "@/store/useStore";
import { MenuItem, Restaurant, SelectedAddon, SpicyLevel } from "@/types";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { FaSearch } from "react-icons/fa";
import { IoMdAdd, IoMdClose, IoMdRemove } from "react-icons/io";
import { MdOutlineDelete } from "react-icons/md";
import Skeleton from "react-loading-skeleton"; // Import Skeleton
import "swiper/css";
import "swiper/css/navigation";
import { Navigation } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { Swiper as SwiperType } from "swiper/types";

// Chili Icon Component
const ChiliIcon = ({ level }: { level: SpicyLevel }) => {
  const getChiliCount = () => {
    switch (level) {
      case 'MILD':
        return 1;
      case 'MEDIUM':
        return 2;
      case 'HOT':
        return 3;
      default:
        return 0;
    }
  };

  const count = getChiliCount();
  if (count === 0) return null;

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: count }).map((_, index) => (
        <Image
          key={index}
          src="/images/menu/chilli.png"
          alt={`${level} spicy`}
          width={16}
          height={16}
          className="object-contain"
          aria-label={`${level} spicy`}
        />
      ))}
    </div>
  );
};

// Carousel component for restaurant images
const RestaurantImageCarousel = ({ images, restaurantName }: { images: string[], restaurantName: string }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="relative h-full w-full">
      <Image
        src={images[currentIndex]}
        alt={restaurantName}
        fill
        className="object-cover "
      />
      {images.length > 1 && (
        <>
          <button
            onClick={handlePrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-3 z-10 transition-all"
            aria-label="Previous image"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-3 z-10 transition-all"
            aria-label="Next image"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-3 h-3 rounded-full transition-all ${index === currentIndex ? 'bg-white' : 'bg-white/50'
                  }`}
                aria-label={`Go to image ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

interface Props {
  initialData: Restaurant;
}

export default function RestaurantDetails({ initialData }: Props) {
  const { setSelectedRestaurant } = useRestaurantStore();
  const { items, addItem, removeOneItem, removeItem, setRestaurant } =
    useCartStore();
  const { formatCurrency } = useCurrency(initialData.currency);

  const [isLoading, setIsLoading] = useState(true); // Add loading state
  const swiperRef = useRef<SwiperType | null>(null);
  const [showPrevArrow, setShowPrevArrow] = useState(false);
  const [showNextArrow, setShowNextArrow] = useState(false);
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedAddons, setSelectedAddons] = useState<SelectedAddon[]>([]);
  const [specialInstructions, setSpecialInstructions] = useState("");
  const modalContentRef = useRef<HTMLDivElement>(null);
  const tCommon = useTranslations("common");
  const tRestaurant = useTranslations("restaurant");
  const tOrder = useTranslations("order");
  const tCart = useTranslations("cart");
  const locale = useLocale();
  const rtl = isRTL(locale as Locale);

  useEffect(() => {
    setSelectedRestaurant(initialData);
    setRestaurant({
      id: initialData.id,
      name: initialData.name,
      storeType: initialData.storeType,
    });
    setIsLoading(false); // Set loading to false when data is loaded
  }, [initialData, setSelectedRestaurant, setRestaurant]);

  const breadcrumbItems = [
    { label: tCommon("home"), href: "/" },
    // { label: cityName || "City", href: cityName ? "/restaurants" : undefined },
    { label: initialData.city },
    { label: tRestaurant("restaurantsList"), href: "/restaurants" },
    { label: initialData.name },
  ];

  const categories = useMemo(() => {
    return [
      ...new Set(initialData?.menuItems?.map((item) => item.category) ?? []),
    ];
  }, [initialData?.menuItems]);
  const [activeCategory, setActiveCategory] = useState(categories[0]); // Default to first category
  const [searchQuery, setSearchQuery] = useState(""); // Search query state

  const handleScrollToCategory = (category: string) => {
    setActiveCategory(category);

    const categorySection = document.getElementById(category);
    const offset = 140; // Adjust this value based on the height of your sticky navigation
    if (categorySection) {
      const top =
        categorySection.getBoundingClientRect().top +
        window.pageYOffset -
        offset;
      window.scrollTo({ top, behavior: "smooth" });
    }
  };

  const handleAddToCart = (menuItem: MenuItem, qty: number = 1, addons: SelectedAddon[] = [], instructions: string = "") => {
    const addonsTotal = addons.reduce((sum, addon) => sum + addon.priceAdjustment, 0);
    const finalPrice = menuItem.price + addonsTotal;

    addItem({
      menuItemId: menuItem.id!,
      quantity: qty,
      price: finalPrice,
      name: menuItem.label,
      image: menuItem.image,
      id: "",
      restaurantId: initialData.id,
      restaurantName: initialData.name,
      storeType: initialData.storeType || 'RESTAURANT',
      selectedAddons: addons,
      addonsTotal: addonsTotal,
      options: instructions ? { notes: instructions } : undefined
    });
  };

  const handleOpenModal = (menuItem: MenuItem) => {
    setSelectedMenuItem(menuItem);
    setQuantity(1);

    // Pre-select Default Addons
    const initialAddons: SelectedAddon[] = [];
    if (menuItem.addonGroups) {
      menuItem.addonGroups.forEach(({ addonGroup }) => {
        if (!addonGroup.isActive) return;
        addonGroup.options.forEach((opt) => {
          if (opt.isDefault && opt.isActive) {
            initialAddons.push({
              groupId: addonGroup.id,
              groupName: addonGroup.name,
              optionId: opt.id,
              optionName: opt.name,
              priceAdjustment: opt.priceAdjustment,
            });
          }
        });
      });
    }

    setSelectedAddons(initialAddons);
    setSpecialInstructions("");
  };

  const handleCloseModal = () => {
    setSelectedMenuItem(null);
    setQuantity(1);
    setSelectedAddons([]);
    setSpecialInstructions("");
  };

  const handleAddToCartFromModal = () => {
    if (selectedMenuItem) {
      // Check required addon groups
      const missingRequiredGroups = selectedMenuItem.addonGroups?.filter(({ addonGroup }) => {
        if (!addonGroup.isActive || !addonGroup.isRequired) return false;
        const hasSelection = selectedAddons.some(s => s.groupId === addonGroup.id);
        return !hasSelection;
      });

      if (missingRequiredGroups && missingRequiredGroups.length > 0) {
        toast.error(`Please select an option for: ${missingRequiredGroups.map(m => m.addonGroup.displayName || m.addonGroup.name).join(', ')}`);
        return;
      }

      handleAddToCart(selectedMenuItem, quantity, selectedAddons, specialInstructions);
      handleCloseModal();
    }
  };

  const calculateTotalPrice = () => {
    if (!selectedMenuItem) return 0;
    const basePrice = selectedMenuItem.price;
    const addonsPrice = selectedAddons.reduce((sum, addon) => sum + addon.priceAdjustment, 0);
    return (basePrice + addonsPrice) * quantity;
  };

  const handleRemoveFromCart = (
    label: string,
    menuItemId: string,
    quantity: number
  ) => {
    if (quantity === 1) {
      removeItem(menuItemId);
    } else {
      removeOneItem(menuItemId);
    }
    // toast.error(`Removed ${label} from cart`);
  };

  const getItemQuantity = (menuItemId: string) => {
    const item = items.find((i) => i.menuItemId === menuItemId);
    return item?.quantity || 0;
  };

  // Filter menu items based on search query
  const filteredMenuItems = useMemo(() => {
    return searchQuery
      ? (initialData.menuItems ?? []).filter(
        (item) =>
          item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
      : (initialData.menuItems ?? []);
  }, [searchQuery, initialData.menuItems]);

  // Get categories from filtered items when searching
  const displayCategories = useMemo(() => {
    return searchQuery
      ? [...new Set(filteredMenuItems.map((item) => item.category))]
      : categories;
  }, [searchQuery, filteredMenuItems, categories]);

  // Update arrow visibility when categories or search query changes
  useEffect(() => {
    if (swiperRef.current) {
      // Small delay to ensure Swiper has updated
      setTimeout(() => {
        if (swiperRef.current) {
          setShowPrevArrow(!swiperRef.current.isBeginning);
          setShowNextArrow(!swiperRef.current.isEnd);
          swiperRef.current.update();
        }
      }, 100);
    }
  }, [displayCategories, searchQuery]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (swiperRef.current) {
        swiperRef.current.update();
        setShowPrevArrow(!swiperRef.current.isBeginning);
        setShowNextArrow(!swiperRef.current.isEnd);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Determine which images to use
  const images = initialData.coverImagesList && initialData.coverImagesList.length > 0
    ? initialData.coverImagesList
    : initialData.coverImage
      ? [initialData.coverImage]
      : ["/images/restaurant-placeholder.jpg"];

  // Reset scroll position when modal opens
  useEffect(() => {
    if (modalContentRef.current && selectedMenuItem) {
      modalContentRef.current.scrollTop = 0;
    }
  }, [selectedMenuItem]);

  // Menu Item Modal Component
  const MenuItemModal = () => {
    if (!selectedMenuItem) return null;

    return (
      <div
        className="fixed rounded-xl  inset-0 bg-gray-800/70 z-50 flex items-center justify-center p-4"
        onClick={handleCloseModal}
      >
        <div
          className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Image with Close Button */}
          <div className="relative w-full h-64 md:h-80 flex-shrink-0">
            <Image
              src={selectedMenuItem.image || "/images/food-placeholder.jpg"}
              alt={selectedMenuItem.label}
              fill
              className="object-cover"
            />
            <button
              onClick={handleCloseModal}
              className="absolute top-4  right-4 bg-white rounded-full p-1 hover:bg-gray-100 transition-all shadow-lg z-10 w-8 h-8 flex items-center justify-center"
              aria-label="Close modal"
            >
              <IoMdClose className="w-5 h-5 text-black" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div
            ref={modalContentRef}
            className="flex-1 overflow-y-auto"
          >
            <div className="p-6">
              {/* Title and Price - Always visible at top of content */}
              <div className="flex justify-between items-start mb-2">
                <h2 className="text-2xl md:text-3xl font-bold">{selectedMenuItem.label}</h2>
                <span className="text-xl md:text-2xl font-semibold text-primary-600">
                  {formatCurrency(selectedMenuItem.price)}
                </span>
              </div>

              {/* Description */}
              {selectedMenuItem.description && (
                <p className="text-gray-600 text-sm md:text-base mb-6 leading-relaxed">
                  {selectedMenuItem.description}
                </p>
              )}

              {/* Dynamic Addons Component */}
              {selectedMenuItem.addonGroups && selectedMenuItem.addonGroups.length > 0 && (
                <div className="mb-6 pt-4 border-t border-gray-100">
                  <AddonSelector
                    addonGroups={selectedMenuItem.addonGroups}
                    selectedAddons={selectedAddons}
                    onSelectionChange={setSelectedAddons}
                    formatCurrency={(val) => formatCurrency(Number(val))}
                  />
                </div>
              )}

              {/* Special Instructions */}
              <div className="mb-6">
                <h3 className="text-base md:text-lg font-bold text-gray-800 mb-3">{tOrder("specialInstructions")}</h3>
                <textarea
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  placeholder={tOrder("specialInstructionsPlaceholder")}
                  className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm md:text-base text-start"
                  rows={4}
                />
              </div>
            </div>
          </div>

          {/* Fixed Footer with Quantity and Add to Cart */}
          <div className="flex-shrink-0 border-t border-gray-200 bg-white px-6 py-4">
            <div className="flex items-center justify-between">
              {/* Quantity Selector */}
              <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-2 py-1">
                <button
                  onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                  className="bg-transparent hover:bg-gray-200 text-gray-700 rounded p-1.5 transition-all"
                  aria-label="Decrease quantity"
                >
                  <IoMdRemove className="w-5 h-5" />
                </button>
                <span className="text-base font-semibold text-gray-800 min-w-[30px] text-center">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity((prev) => prev + 1)}
                  className="bg-transparent hover:bg-gray-200 text-gray-700 rounded p-1.5 transition-all"
                  aria-label="Increase quantity"
                >
                  <IoMdAdd className="w-5 h-5" />
                </button>
              </div>

              {/* Add to Cart Button */}
              <button
                onClick={handleAddToCartFromModal}
                className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold transition-all flex items-center gap-2 shadow-md"
              >
                {tRestaurant("addToCart")} | {formatCurrency(calculateTotalPrice())}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className=" w-full mx-auto">
      {/* Breadcrumb */}
      <div className="container mx-auto px-4 md:px-10 mt-16">
        <Breadcrumb items={breadcrumbItems} />
      </div>
      {/* Restaurant Image Section */}
      <div className="relative rounded-lg mt-4 h-[50vh]">
        {isLoading ? (
          <Skeleton height="100%" /> // Skeleton for image
        ) : images.length > 1 ? (
          <RestaurantImageCarousel images={images} restaurantName={initialData.name} />
        ) : (
          <Image
            src={images[0]}
            alt={initialData.name}
            fill
            className="object-cover"
          />
        )}
        <div className="absolute  bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-6 px-8">
          {isLoading ? (
            <>
              <Skeleton height={30} width="60%" />{" "}
              {/* Skeleton for restaurant name */}
              <Skeleton height={20} width="40%" /> {/* Skeleton for rating */}
            </>
          ) : (
            <div className="container mx-auto px-4 md:px-10 ">
              <h1 className="text-3xl font-bold text-white">
                {initialData.name}
              </h1>
              <div className="flex items-center text-white mt-2">
                <span className="mr-4">⭐️ {initialData.rating}</span>
                <span>💰 {tRestaurant("minimumOrder")}: {formatCurrency(initialData.minimumOrder ?? '0')}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Category Navigation with Search */}
      {categories.length > 0 && (
        <div className=" bg-white sticky top-18 pt-1 z-40 shadow-sm border-b border-gray-300">
          <div className="flex flex-col md:flex-row items-stretch md:items-center md:gap-4 px-4 md:px-8 container mx-auto border-gray-300 bg-white overflow-hidden">
            {/* Search Bar */}
            <div className="relative flex-shrink-0 w-full md:w-auto md:min-w-[300px]">
              <FaSearch className={`absolute ${rtl ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 text-gray-400 z-10 pointer-events-none`} />
              <input
                type="text"
                placeholder={tCommon('searchMenuItems') + "..."}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  // Reset active category when searching
                  if (e.target.value) {
                    setActiveCategory("");
                  } else if (categories.length > 0) {
                    setActiveCategory(categories[0]);
                  }
                }}
                style={{
                  outline: 'none',
                  border: 'none',
                  boxShadow: 'none',
                }}
                onFocus={(e) => {
                  e.target.style.outline = 'none';
                  e.target.style.border = 'none';
                  e.target.style.boxShadow = 'none';
                }}
                className="w-full pl-10 pr-10 py-3 text-black font-semibold text-sm tracking-wide relative transition-all duration-300 outline-none focus:outline-none focus:ring-0 focus:ring-offset-0 focus:shadow-none bg-transparent border-0 focus:border-0 hover:bg-gray-50"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    if (categories.length > 0) {
                      setActiveCategory(categories[0]);
                    }
                  }}
                  className={`absolute ${rtl ? 'left-3' : 'right-3'} top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600`}
                  aria-label="Clear search"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            {/* Category Buttons with Swiper */}
            <div className="relative flex-1 w-full md:w-auto px-10 overflow-hidden">
              <Swiper
                onSwiper={(swiper) => {
                  swiperRef.current = swiper;
                  // Update arrow visibility on init
                  setShowPrevArrow(!swiper.isBeginning);
                  setShowNextArrow(!swiper.isEnd);
                }}
                onSlideChange={(swiper) => {
                  // Update arrow visibility on slide change
                  setShowPrevArrow(!swiper.isBeginning);
                  setShowNextArrow(!swiper.isEnd);
                }}
                onResize={(swiper) => {
                  // Update arrow visibility on resize
                  setShowPrevArrow(!swiper.isBeginning);
                  setShowNextArrow(!swiper.isEnd);
                }}
                spaceBetween={0}
                slidesPerView="auto"
                allowTouchMove={true}
                navigation={{
                  nextEl: ".category-swiper-button-next",
                  prevEl: ".category-swiper-button-prev",
                }}
                modules={[Navigation]}
                className="category-swiper"
                watchOverflow={true}
                breakpoints={{
                  320: {
                    slidesPerView: "auto",
                    spaceBetween: 0,
                  },
                  768: {
                    slidesPerView: "auto",
                    spaceBetween: 0,
                  },
                }}
              >
                {displayCategories.map((category) => (
                  <SwiperSlide key={category} className="!w-auto">
                    <button
                      onClick={() => {
                        setActiveCategory(category);
                        setSearchQuery(""); // Clear search when clicking category
                        handleScrollToCategory(category);
                      }}
                      className={`px-7 py-3 text-black font-semibold text-sm hover:bg-gray-50 tracking-wide relative transition-all duration-300 whitespace-nowrap
                        ${activeCategory === category ? "  !text-primary border-b-2 bg-gray-50   border-black " : ""}`}
                    >
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </button>
                  </SwiperSlide>
                ))}
              </Swiper>
              {/* Custom Navigation Arrows */}
              {displayCategories.length > 0 && (
                <>
                  <button
                    className={`category-swiper-button-prev absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-white hover:bg-gray-100 text-gray-700 rounded-full p-1.5 shadow-md border border-gray-200 transition-all duration-300 hover:scale-110 disabled:opacity-30 disabled:cursor-not-allowed ${showPrevArrow ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                      }`}
                    aria-label="Previous categories"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    className={`category-swiper-button-next absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-white hover:bg-gray-100 text-gray-700 rounded-full p-1.5 shadow-md border border-gray-200 transition-all duration-300 hover:scale-110 disabled:opacity-30 disabled:cursor-not-allowed ${showNextArrow ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                      }`}
                    aria-label="Next categories"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {categories.length < 1 && (
        <h1 className=" text-center text-2xl">{tCommon('noItems')}</h1>
      )}
      {/* Search Results or Category Sections */}
      {searchQuery ? (
        // Show search results
        <div className="mb-10 container px-8 mx-auto mt-10 relative z-10">
          <h2 className="text-2xl font-bold mb-6 text-start">
            Search Results for &quot;{searchQuery}&quot;
          </h2>
          {filteredMenuItems.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">{tCommon('noItems')}</p>
            </div>
          ) : (
            <div className={`grid grid-cols-1 ${initialData.storeType === 'RESTAURANT' ? 'md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'} gap-6`}>
              {filteredMenuItems.map((item) => {
                const quantity = getItemQuantity(item.id!);
                if (initialData.storeType !== 'RESTAURANT') {
                  return (
                    <div
                      key={item.id}
                      className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 flex flex-col cursor-pointer hover:shadow-md transition-all group"
                      onClick={() => handleOpenModal(item)}
                    >
                      <div className="relative aspect-square w-full mb-3 overflow-hidden rounded-lg">
                        <Image
                          src={item.image || "/images/food-placeholder.jpg"}
                          alt={item.label}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-2 right-2 flex flex-col gap-2 z-10 items-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddToCart(item);
                            }}
                            className="bg-white text-primary-600 p-2 rounded-full shadow-lg hover:bg-primary-50 transition-colors"
                          >
                            <IoMdAdd className="w-5 h-5" />
                          </button>
                          {quantity > 0 && (
                            <div className="flex flex-col items-center bg-white rounded-full shadow-lg p-1">
                              <span className="text-xs font-bold py-1">{quantity}</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveFromCart(item.label, item.id!, quantity);
                                }}
                                className="text-gray-400 hover:text-red-500 p-1"
                              >
                                {quantity === 1 ? <MdOutlineDelete className="w-4 h-4" /> : <IoMdRemove className="w-4 h-4" />}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex-1 flex flex-col">
                        <span className="text-lg font-bold text-gray-900 leading-tight mb-1">{formatCurrency(item.price)}</span>
                        <h3 className="text-sm font-medium text-gray-700 line-clamp-2 mb-1">{item.label}</h3>
                        {item.unit && <span className="text-xs text-gray-400 mb-2">{item.unitQuantity} {item.unit}</span>}
                      </div>
                    </div>
                  );
                }
                return (
                  <div
                    key={item.id}
                    className="bg-white hover:bg-gray-100 hover:border-gray-200 rounded-lg shadow-sm border border-gray-200 p-4 flex gap-4 cursor-pointer"
                    onClick={() => handleOpenModal(item)}
                  >
                    <div className="flex-1 flex flex-col">
                      <h3 className="text-lg font-semibold mb-1 text-black">
                        {item.label}
                      </h3>
                      <span className="text-sm font-medium text-primary mb-1">
                        {formatCurrency(item.price)}
                      </span>
                      <p className="text-gray-600 flex-1 mt-1 line-clamp-2 leading-tight">{item.description}</p>
                      {item.spicy && (
                        <div className="flex items-center mt-1">
                          <ChiliIcon level={item.spicy} />
                        </div>
                      )}
                    </div>
                    <div className="relative w-32 h-32 flex-shrink-0">
                      <Image
                        src={item.image || "/images/food-placeholder.jpg"}
                        alt={item.label}
                        fill
                        className="object-cover rounded-lg"
                      />
                      <div className="absolute top-2 right-2 flex gap-2 z-10 items-center">
                        <div
                          className={`transition-all duration-500 ease-out flex items-center ${quantity > 0
                            ? "max-w-[50px] opacity-100 translate-x-0 overflow-visible"
                            : "max-w-0 opacity-0 -translate-x-4 overflow-hidden"
                            }`}
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveFromCart(
                                item.label,
                                item.id!,
                                quantity
                              );
                            }}
                            className="bg-white text-gray-800 p-1 rounded-full border border-gray-200 transition-all duration-300 ease-in-out  hover:text-primary hover:scale-110 shadow-lg whitespace-nowrap"
                            aria-label={quantity === 1 ? "Delete from cart" : "Remove from cart"}
                          >
                            {quantity === 1 ? (
                              <MdOutlineDelete className="w-5 h-5" />
                            ) : (
                              <IoMdRemove className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                        {quantity > 0 && (
                          <span className="text-sm font-semibold text-gray-800 bg-white px-[5px] py-[2px] rounded-full shadow-md min-w-[24px] text-center">
                            {quantity}
                          </span>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToCart(item);
                          }}
                          className="bg-white text-gray-700 p-1 rounded-full border border-gray-200 transition-all duration-300 ease-in-out hover:bg-white hover:text-primary hover:scale-110 shadow-lg flex-shrink-0"
                          aria-label="Add to cart"
                        >
                          <IoMdAdd className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        // Show category sections
        categories.map((category) => (
          <div key={category} id={category} className="mb-10 container px-8 mx-auto mt-10 relative z-10">
            <h2 className="text-2xl font-bold  mb-6 text-start">
              {isLoading ? <Skeleton width="50%" /> : category}
            </h2>
            <div className={`grid grid-cols-1 ${initialData.storeType === 'RESTAURANT' ? 'md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'} gap-6`}>
              {isLoading
                ? [...Array(3)].map((_, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-lg shadow-md p-4"
                  >
                    <Skeleton height={150} className="mb-4" />{" "}
                    {/* Skeleton for image */}
                    <Skeleton height={20} width="60%" className="mb-2" />{" "}
                    {/* Skeleton for label */}
                    <Skeleton height={10} className="mb-4" />{" "}
                    {/* Skeleton for description */}
                    <Skeleton height={20} width="40%" />{" "}
                    {/* Skeleton for price */}
                  </div>
                ))
                : (initialData.menuItems ?? [])
                  .filter((item) => item.category === category)
                  .map((item) => {
                    const quantity = getItemQuantity(item.id!);
                    if (initialData.storeType !== 'RESTAURANT') {
                      return (
                        <div
                          key={item.id}
                          className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 flex flex-col cursor-pointer hover:shadow-md transition-all group"
                          onClick={() => handleOpenModal(item)}
                        >
                          <div className="relative aspect-square w-full mb-3 overflow-hidden rounded-lg">
                            <Image
                              src={item.image || "/images/food-placeholder.jpg"}
                              alt={item.label}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute top-2 right-2 flex flex-col gap-2 z-10 items-center">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAddToCart(item);
                                }}
                                className="bg-white text-primary-600 p-2 rounded-full shadow-lg hover:bg-primary-50 transition-colors"
                              >
                                <IoMdAdd className="w-5 h-5" />
                              </button>
                              {quantity > 0 && (
                                <div className="flex flex-col items-center bg-white rounded-full shadow-lg p-1">
                                  <span className="text-xs font-bold py-1">{quantity}</span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRemoveFromCart(item.label, item.id!, quantity);
                                    }}
                                    className="text-gray-400 hover:text-red-500 p-1"
                                  >
                                    {quantity === 1 ? <MdOutlineDelete className="w-4 h-4" /> : <IoMdRemove className="w-4 h-4" />}
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex-1 flex flex-col">
                            <span className="text-lg font-bold text-gray-900 leading-tight mb-1">{formatCurrency(item.price)}</span>
                            <h3 className="text-sm font-medium text-gray-700 line-clamp-2 mb-1">{item.label}</h3>
                            {item.unit && <span className="text-xs text-gray-400 mb-2">{item.unitQuantity} {item.unit}</span>}
                          </div>
                        </div>
                      );
                    }
                    return (
                      <div
                        key={item.id}
                        className="bg-white hover:bg-gray-100 hover:border-gray-200 rounded-lg shadow-sm border border-gray-200 p-4 flex gap-4 cursor-pointer"
                        onClick={() => handleOpenModal(item)}
                      >
                        <div className="flex-1 flex flex-col">
                          <h3 className="text-lg font-semibold mb-1  text-black">
                            {item.label}
                          </h3>
                          <span className="text-sm  font-medium text-primary mb-1">
                            {formatCurrency(item.price)}
                          </span>
                          <p className="text-gray-600 flex-1 mt-1 line-clamp-2 leading-tight">{item.description}</p>
                          {item.spicy && (
                            <div className="flex items-center mt-1">
                              <ChiliIcon level={item.spicy} />
                            </div>
                          )}
                        </div>
                        <div className="relative w-32 h-32 flex-shrink-0">
                          <Image
                            src={item.image || "/images/food-placeholder.jpg"}
                            alt={item.label}
                            fill
                            className="object-cover rounded-lg"
                          />
                          <div className="absolute top-2 right-2 flex gap-2 z-10 items-center">
                            <div
                              className={`transition-all duration-500 ease-out flex items-center ${quantity > 0
                                ? "max-w-[50px] opacity-100 translate-x-0 overflow-visible"
                                : "max-w-0 opacity-0 -translate-x-4 overflow-hidden"
                                }`}
                            >
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveFromCart(
                                    item.label,
                                    item.id!,
                                    quantity
                                  );
                                }}
                                className="bg-white text-gray-800 p-1 rounded-full border border-gray-200 transition-all duration-300 ease-in-out  hover:text-primary hover:scale-110 shadow-lg whitespace-nowrap"
                                aria-label={quantity === 1 ? "Delete from cart" : "Remove from cart"}
                              >
                                {quantity === 1 ? (
                                  <MdOutlineDelete className="w-5 h-5" />

                                ) : (
                                  <IoMdRemove className="w-5 h-5" />
                                )}
                              </button>
                            </div>
                            {quantity > 0 && (
                              <span className="text-sm font-semibold text-gray-800 bg-white px-[5px] py-[2px] rounded-full shadow-md min-w-[24px] text-center">
                                {quantity}
                              </span>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddToCart(item);
                              }}
                              className="bg-white text-gray-700 p-1 rounded-full border border-gray-200 transition-all duration-300 ease-in-out hover:bg-white hover:text-primary hover:scale-110 shadow-lg flex-shrink-0"
                              aria-label="Add to cart"
                            >
                              <IoMdAdd className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
            </div>
          </div>
        ))
      )}
      {/* Menu Item Modal */}
      <MenuItemModal />
    </div>
  );
}
