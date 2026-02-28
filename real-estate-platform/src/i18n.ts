import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';

export const locales = ['ar', 'en'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'ar';

export const localeConfig = {
  ar: {
    label: 'العربية',
    dir: 'rtl' as const,
    flag: '🇸🇦',
    dateLocale: 'ar-SA',
  },
  en: {
    label: 'English',
    dir: 'ltr' as const,
    flag: '🇬🇧',
    dateLocale: 'en-SA',
  },
};

export default getRequestConfig(async ({ locale }) => {
  if (!locales.includes(locale as Locale)) notFound();

  return {
    messages: (await import(`../messages/${locale}.json`)).default,
    timeZone: 'Asia/Riyadh',
    now: new Date(),
  };
});
