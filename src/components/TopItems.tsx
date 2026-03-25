/* eslint-disable @next/next/no-img-element */
"use client";
import { useTranslations } from "next-intl";
import { useRef } from "react";
// Import Swiper React components
import { Swiper, SwiperSlide } from "swiper/react";
import { Swiper as SwiperType } from "swiper/types"; // Import the Swiper type

// Import Swiper styles
import "swiper/css";
import "swiper/css/effect-coverflow";
import "swiper/css/pagination";
// import { TiArrowLeft, TiArrowRight } from "react-icons/ti";
import { CiFries } from "react-icons/ci";
import {
    FaFish,
    FaHamburger,
    FaIceCream,
    FaLeaf,
    FaPizzaSlice,
} from "react-icons/fa";
// Import required modules
import { Autoplay, EffectCoverflow, Pagination } from "swiper/modules";

import Image from "next/image";
import checkenAndChips from "../../public/menue-images/43a98620-ffaa-11ed-b6b3-6970cc1cd666-chicken-n-chips_variant_0-2023-05-31115706.png";
import burgerimage from "../../public/menue-images/65428500-ea56-11ef-bf82-75f537a23a2b-Mighty_variant_0-2025-02-13220345.png";
import iceCreamImage from "../../public/menue-images/Blockchain (57).png";
import SushiImage from "../../public/menue-images/Blockchain (59).png";
import saladimage from "../../public/menue-images/Blockchain (61).png";
import pizzaimage from "../../public/menue-images/comment-faire-pizza-parfaite-maison-32.png";

export default function TopItems() {
  const swiperRef = useRef<SwiperType | null>(null);
  const t = useTranslations("topItems");

  const foodItems = [
    {
      image: pizzaimage,
      icon: <FaPizzaSlice />,
      label: t("pizza"),
      price: "20$",
    },
    {
      image: burgerimage,
      icon: <FaHamburger />,
      label: t("burger"),
      price: "15$",
    },
    {
      image: SushiImage,
      icon: <FaFish />,
      label: t("sushi"),
      price: "20$",
    },
    {
      image: iceCreamImage,
      icon: <FaIceCream />,
      label: t("iceCream"),
      price: "10$",
    },
    {
      image: checkenAndChips,
      icon: <CiFries />,
      label: t("fries"),
      price: "30$",
    },
    {
      image: saladimage,
      icon: <FaLeaf />,
      label: t("salad"),
      price: "10$",
    },
  ];

  // const handleNextSlide = () => {
  //   if (swiperRef.current) swiperRef.current.slideNext();
  // };

  // const handlePrevSlide = () => {
  //   if (swiperRef.current) swiperRef.current.slidePrev();
  // };

  return (
    <div className="relative container m-auto mt-12 md:mt-20 px-4 sm:px-6 lg:px-10 mb-10">
      <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-center mb-6 sm:mb-12 text-gray-800 leading-tight">
        {t('title')}
      </h2>
      
      <div className="swiper-container relative">
        {/* Add padding to container to prevent cut-off */}
        <div className="px-4 sm:px-8 lg:px-12">
          <Swiper
            onSwiper={(swiper) => (swiperRef.current = swiper)}
            loop={true}
            autoplay={{
              delay: 2500,
              disableOnInteraction: false,
            }}
            // Responsive breakpoints
            breakpoints={{
              320: {
                slidesPerView: 1,
                spaceBetween: 10,
              },
              640: {
                slidesPerView: 2,
                spaceBetween: 10,
              },
              768: {
                slidesPerView: 3,
                spaceBetween: 10,
              },
              1024: {
                slidesPerView: 4,
                spaceBetween: 10,
              },
              1280: {
                slidesPerView: 5,
                spaceBetween: 10,
              },
            }}
            coverflowEffect={{
              rotate: 50,
              stretch: 0,
              depth: 100,
              modifier: 1,
              slideShadows: true,
            }}
            pagination={false}
            modules={[EffectCoverflow, Pagination, Autoplay]}
            // Remove overflow-visible and add proper padding
            className="mySwiper"
          >
            {foodItems.map((item, index) => (
              <SwiperSlide key={index} className="py-6">
                {/* Add container padding and adjust hover scale */}
                <div className="overflow-hidden shadow-md h-64 sm:h-72 bg-white border border-gray-100 rounded-lg transform transition-transform duration-300 mx-1 sm:mx-2 relative">
                  <div className="relative w-full h-[65%] p-4">
                    <Image
                      src={item.image}
                      alt={item.label}
                      fill
                      style={{ objectFit: "contain", padding: "10px" }}
                      className="rounded-lg"
                    />
                  </div>
                  <div className="bg-primary-600 py-3 px-2 absolute bottom-0 rounded-lg rounded-tl-none rounded-tr-none w-full text-center">
                    <div className="flex gap-3 items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-white">{item.icon}</span>
                        <p className="font-medium text-white text-sm sm:text-base">
                          {item.label}
                        </p>
                      </div>
                      {/* <TiArrowRight size={20} className="text-white" /> */}
                    </div>
                  </div>
                  {/* <div className="absolute top-0 bg-primary px-3 py-1 rounded-md rounded-s-none rounded-t-none text-white shadow-lg text-sm">
                    {item.price}
                  </div> */}
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

        {/* Custom Navigation Buttons */}
        {/* <div className="flex justify-end mt-4 gap-3 px-4 sm:px-8 lg:px-12">
          <button
            onClick={handlePrevSlide}
            className="z-10 w-8 h-8 flex items-center justify-center bg-primary cursor-pointer hover:bg-primary-600 text-white rounded-full shadow-lg"
          >
            <TiArrowLeft size={20} className="text-white" />
          </button>
          <button
            onClick={handleNextSlide}
            className="z-10 w-8 h-8 flex items-center justify-center text-white bg-primary cursor-pointer hover:bg-primary-600 rounded-full shadow-lg"
          >
            <TiArrowRight size={20} className="text-white" />
          </button>
        </div> */}
      </div>
    </div>
  );
}
