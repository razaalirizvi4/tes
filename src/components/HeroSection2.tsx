"use client";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { Autoplay, Navigation, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

// Import Swiper styles
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import Header from "./layout/Header";

// import LocationSearch from "./LocationSearch";
import { useRouter } from "@/i18n/navigation";

export default function HeroSection2() {
  const router = useRouter();
  const t = useTranslations("hero");

  const slides = [
    {
      image:
        "https://images.unsplash.com/photo-1675257163553-7b47b4680636?q=80&w=1626&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      title: t("slides.juicyBurgers"),
      subtitle: t("slides.deliveredToDoorstep"),
    },
    {
      image:
        "https://images.unsplash.com/photo-1590947132387-155cc02f3212?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      title: t("slides.hotFreshPizza"),
      subtitle: t("slides.readyIn30Minutes"),
    },
    {
      image:
        "https://images.unsplash.com/photo-1611143669185-af224c5e3252?q=80&w=1632&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      title: t("slides.deliciousSushi"),
      subtitle: t("slides.experienceAuthenticFlavors"),
    },
  ];
  return (
    <div className="relative h-svh">
      <div className="">
        <Header />
      </div>

      <Swiper
        spaceBetween={30}
        centeredSlides={true}
        autoplay={{
          delay: 5000,
          disableOnInteraction: false,
        }}
        pagination={{
          clickable: true,
        }}
        navigation={true}
        modules={[Autoplay, Pagination, Navigation]}
        className="w-full h-full"
      >
        {slides.map((slide, index) => (
          <SwiperSlide key={index}>
            <div className="relative w-full h-full">
              <Image
                src={slide.image || "/placeholder.svg"}
                alt={slide.title}
                layout="fill"
                objectFit="cover"
                priority={index === 0}
              />

              <div className="absolute inset-0 bg-black bg-opacity-50" />

              <div className="container max-w-5xl mx-auto px-4 sm:px-6 md:px-8 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center text-white w-full flex flex-col items-center justify-center z-10 gap-3 sm:gap-4 md:gap-6 lg:gap-8">
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight lg:leading-tight text-white">
                  {t.rich('title', {
                    highlight: (chunks) => (
                      <span className="bg-gradient-to-r from-[#f97316] to-[#dc2626] bg-clip-text text-transparent">
                        {chunks}
                      </span>
                    )
                  })}
                </h1>
                <p className="text-sm sm:text-base md:text-lg lg:text-xl font-medium text-white/90 max-w-3xl">
                  {t('subtitle')}
                </p>

                <div className="flex flex-col items-center justify-center w-full mt-2 sm:mt-4 md:mt-6 gap-4 sm:gap-6 lg:gap-8 z-10">
                  <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl italic font-semibold shadow-text">
                    {slide.title}
                  </h2>
                  <button
                    onClick={() => router.push("/restaurants")}
                    className="bg-primary hover:bg-primary-600 text-white py-2.5 px-6 sm:px-8 md:py-3.5 md:px-10 text-base sm:text-lg md:text-xl font-semibold rounded-full transition-colors w-full sm:w-auto shadow-lg"
                  >
                    {t('cta')}
                  </button>
                </div>
              </div>

            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>

  );
}
