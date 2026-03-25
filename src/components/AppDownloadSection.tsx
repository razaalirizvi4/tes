/* eslint-disable @typescript-eslint/no-unused-vars */
import { useTranslations } from "next-intl"
import { FaApple, FaGooglePlay } from "react-icons/fa"

function generateBlob(seed: number): string {
    const randomPoint = () => {
      const theta = seed * 2 * Math.PI
      const r = 0.5 + 0.3 * Math.sin(theta)
      return [50 + r * Math.cos(theta) * 50, 50 + r * Math.sin(theta) * 50]
    }
  
    const points = Array.from({ length: 8 }, (_, i) => randomPoint())
    return `M${points.map((p) => p.join(",")).join("L")}Z`
  }
  

export default function AppDownloadSection() {
  const t = useTranslations("appDownload");

  return (
    <section className="relative py-20 overflow-hidden bg-gradient-to-b from-white to-gray-600/40">
      {/* Background blobs */}
      <div className="absolute inset-0 z-0">
        <svg
          className="absolute top-0 right-0 w-96 h-96 text-orange-100 opacity-50 transform translate-x-1/2 -translate-y-1/2"
          viewBox="0 0 100 100"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path fill="currentColor" d={generateBlob(0.3)} />
        </svg>
        <svg
          className="absolute bottom-0 left-0 w-96 h-96 text-orange-100 opacity-50 transform -translate-x-1/2 translate-y-1/2"
          viewBox="0 0 100 100"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path fill="currentColor" d={generateBlob(0.8)} />
        </svg>
      </div>

      <div className="container relative z-10 mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between">
          {/* Mobile placeholder */}
          <div className="w-full md:w-1/2 mb-12 md:mb-0">
            <div className="relative mx-auto w-64 h-[500px] bg-gradient-to-b from-gray-800 to-gray-700 rounded-[3rem] shadow-xl overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-20 bg-black rounded-t-[3rem]"></div>
              <div className="absolute bottom-0 left-0 right-0 h-20 bg-black rounded-b-[3rem]"></div>
              <div className="absolute inset-2 bg-white rounded-[2.5rem] overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center text-4xl font-bold text-primary">
                  Food App
                </div>
              </div>
            </div>
          </div>

          {/* Text and buttons */}
          <div className="w-full md:w-1/2 text-center md:text-start">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4 sm:mb-6 text-gray-800 leading-tight">
              {t("getAppNow")}
            </h2>
            <p className="text-lg md:text-xl text-gray-600 mb-6 md:mb-8 max-w-lg mx-auto md:ms-0">
              {t("appDescription")}
            </p>
            <div className="flex flex-col sm:flex-row justify-center md:justify-start gap-4 w-full sm:w-auto">
              <button className="flex items-center justify-center px-6 py-3 md:px-8 bg-primary text-white rounded-full hover:opacity-90 transition duration-300 w-full sm:w-auto">
                <FaApple className="w-5 h-5 md:w-6 md:h-6 me-2" />
                <span className="text-sm md:text-base">{t("appStore")}</span>
              </button>
              <button className="flex items-center justify-center px-6 py-3 md:px-8 bg-primary text-white rounded-full hover:opacity-90 transition duration-300 w-full sm:w-auto">
                <FaGooglePlay className="w-5 h-5 md:w-6 md:h-6 me-2" />
                <span className="text-sm md:text-base">{t("googlePlay")}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

