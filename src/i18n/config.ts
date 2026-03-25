export type Locale = 'en' | 'ru' | 'tr' | 'az' | 'ar';

export const locales: Locale[] = ['en', 'ru', 'tr', 'az', 'ar'];
export const defaultLocale: Locale = 'en';

export const localeLabels: Record<Locale, string> = {
  en: 'English',
  ru: 'Русский',
  tr: 'Türkçe',
  az: 'Azərbaycanca',
  ar: 'العربية',
};

export const isRTL = (locale: Locale): boolean => locale === 'ar';
