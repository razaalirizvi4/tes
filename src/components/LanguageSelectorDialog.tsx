'use client';

import { type Locale } from '@/i18n/config';
import { languagesData } from '@/i18n/languages';
import { usePathname, useRouter } from '@/i18n/navigation';
import { GlobeAltIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useState, useTransition } from 'react';
import { createPortal } from 'react-dom';

export default function LanguageSelectorDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale() as Locale;
  const [isPending, startTransition] = useTransition();
  const t = useTranslations('footer');
  const tc = useTranslations('common');

  const currentLanguage = languagesData.find((lang) => lang.locale === locale);

  // Ensure we're mounted client-side before using createPortal
  useEffect(() => {
    setMounted(true);
  }, []);

  // Scroll Lock logic
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleLocaleChange = (newLocale: Locale) => {
    if (newLocale === locale) return;
    if (typeof window !== 'undefined') {
      localStorage.setItem('NEXT_LOCALE', newLocale);
    }
    startTransition(() => {
      router.replace(pathname, { locale: newLocale });
      setIsOpen(false);
    });
  };

  const modal = isOpen ? (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50"
      onClick={(e) => { if (e.target === e.currentTarget) setIsOpen(false); }}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col"
        dir={locale === 'ar' ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="border-b border-gray-100 px-6 py-5 flex items-start justify-between flex-shrink-0">
          <div className="flex-1 text-start">
            <h2 className="text-xl font-bold text-gray-900">{t('selectLanguageAndCountry')}</h2>
            <p className="text-sm text-gray-500 mt-1">{t('chooseLanguageRegion')}</p>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors ml-4 rtl:ml-0 rtl:mr-4 flex-shrink-0 mt-0.5"
          >
            <XMarkIcon className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto px-6 py-5 space-y-6 text-start">
          {languagesData.map((language) => (
            <div key={language.locale}>
              <h3
                className={`text-base font-semibold mb-3 flex items-center gap-2 ${
                  locale === language.locale ? 'text-blue-600' : 'text-gray-800'
                }`}
              >
                {language.nativeName}
                {locale === language.locale && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2.5 py-0.5 rounded-full font-medium">
                    {tc('current') || 'Current'}
                  </span>
                )}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {language.countries.map((country) => (
                  <button
                    key={country.code}
                    onClick={() => handleLocaleChange(language.locale)}
                    disabled={isPending || locale === language.locale}
                    className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border-2 transition-all min-h-[100px] ${
                      locale === language.locale
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/60'
                    } ${isPending ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <span className="text-2xl leading-none">{country.flag}</span>
                    <div className="text-[11px] sm:text-xs font-semibold text-gray-800 w-full text-center leading-tight">
                      {country.name}
                    </div>
                    <div className="text-[10px] text-gray-400 leading-none font-medium">
                      {country.code}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        disabled={isPending}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-black hover:bg-gray-800 transition-all text-sm font-medium text-white shadow-lg active:scale-95"
        aria-label={t('selectLanguage')}
      >
        <GlobeAltIcon className="w-4 h-4 text-white" />
        <span className="text-white">{currentLanguage?.name}</span>
      </button>

      {/* Modal rendered at document.body via portal — escapes sidebar's transform stacking context */}
      {mounted && createPortal(modal, document.body)}
    </>
  );
}
