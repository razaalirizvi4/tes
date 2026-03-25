import { type Locale } from './config';

export interface LanguageCountry {
  code: string;
  name: string;
  flag: string;
}

export interface LanguageInfo {
  locale: Locale;
  name: string;
  nativeName: string;
  countries: LanguageCountry[];
}

export const languagesData: LanguageInfo[] = [
  {
    locale: 'en',
    name: 'English',
    nativeName: 'English',
    countries: [
      { code: 'US', name: 'United States', flag: '🇺🇸' },
      { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
      { code: 'CA', name: 'Canada', flag: '🇨🇦' },
      { code: 'AU', name: 'Australia', flag: '🇦🇺' },
      { code: 'NZ', name: 'New Zealand', flag: '🇳🇿' },
      { code: 'IE', name: 'Ireland', flag: '🇮🇪' },
      { code: 'SG', name: 'Singapore', flag: '🇸🇬' },
    ],
  },
  {
    locale: 'ru',
    name: 'Russian',
    nativeName: 'Русский',
    countries: [
      { code: 'RU', name: 'Russia', flag: '🇷🇺' },
      { code: 'BY', name: 'Belarus', flag: '🇧🇾' },
      { code: 'KZ', name: 'Kazakhstan', flag: '🇰🇿' },
      { code: 'UA', name: 'Ukraine', flag: '🇺🇦' },
      { code: 'MD', name: 'Moldova', flag: '🇲🇩' },
      { code: 'LV', name: 'Latvia', flag: '🇱🇻' },
    ],
  },
  {
    locale: 'tr',
    name: 'Turkish',
    nativeName: 'Türkçe',
    countries: [
      { code: 'TR', name: 'Turkey', flag: '🇹🇷' },
      { code: 'CY', name: 'Cyprus', flag: '🇨🇾' },
      { code: 'DE', name: 'Germany', flag: '🇩🇪' },
      { code: 'NL', name: 'Netherlands', flag: '🇳🇱' },
      { code: 'FR', name: 'France', flag: '🇫🇷' },
      { code: 'AT', name: 'Austria', flag: '🇦🇹' },
    ],
  },
  {
    locale: 'az',
    name: 'Azerbaijani',
    nativeName: 'Azərbaycanca',
    countries: [
      { code: 'AZ', name: 'Azerbaijan', flag: '🇦🇿' },
      { code: 'TR', name: 'Turkey', flag: '🇹🇷' },
      { code: 'IR', name: 'Iran', flag: '🇮🇷' },
      { code: 'GE', name: 'Georgia', flag: '🇬🇪' },
      { code: 'RU', name: 'Russia', flag: '🇷🇺' },
    ],
  },
  {
    locale: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    countries: [
      { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦' },
      { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪' },
      { code: 'EG', name: 'Egypt', flag: '🇪🇬' },
      { code: 'QA', name: 'Qatar', flag: '🇶🇦' },
      { code: 'KW', name: 'Kuwait', flag: '🇰🇼' },
      { code: 'BH', name: 'Bahrain', flag: '🇧🇭' },
      { code: 'OM', name: 'Oman', flag: '🇴🇲' },
      { code: 'JO', name: 'Jordan', flag: '🇯🇴' },
      { code: 'LB', name: 'Lebanon', flag: '🇱🇧' },
      { code: 'SY', name: 'Syria', flag: '🇸🇾' },
    ],
  },
];
