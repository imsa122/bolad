import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Locale } from '@/types';

// ============================================
// TAILWIND CLASS MERGER
// ============================================
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ============================================
// PRICE FORMATTER
// ============================================
export function formatPrice(price: number, locale: Locale = 'ar', type?: 'SALE' | 'RENT'): string {
  const formatted = new Intl.NumberFormat(locale === 'ar' ? 'ar-SA' : 'en-SA', {
    style: 'currency',
    currency: 'SAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);

  if (type === 'RENT') {
    return locale === 'ar' ? `${formatted} / شهر` : `${formatted} / month`;
  }

  return formatted;
}

// ============================================
// DATE FORMATTER
// ============================================
export function formatDate(date: Date | string, locale: Locale = 'ar'): string {
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SA' : 'en-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
}

// ============================================
// AREA FORMATTER
// ============================================
export function formatArea(area: number, locale: Locale = 'ar'): string {
  const formatted = new Intl.NumberFormat(locale === 'ar' ? 'ar-SA' : 'en-SA').format(area);
  return locale === 'ar' ? `${formatted} م²` : `${formatted} m²`;
}

// ============================================
// SLUG GENERATOR
// ============================================
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ============================================
// TRUNCATE TEXT
// ============================================
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}

// ============================================
// GET PROPERTY TITLE BY LOCALE
// ============================================
export function getLocalizedTitle(
  property: { title_ar: string; title_en: string },
  locale: Locale
): string {
  return locale === 'ar' ? property.title_ar : property.title_en;
}

export function getLocalizedDescription(
  property: { description_ar: string; description_en: string },
  locale: Locale
): string {
  return locale === 'ar' ? property.description_ar : property.description_en;
}

// ============================================
// API RESPONSE HELPERS
// ============================================
export function successResponse<T>(data: T, message?: string) {
  return {
    success: true,
    message,
    data,
  };
}

export function errorResponse(error: string, errors?: Record<string, string[]>) {
  return {
    success: false,
    error,
    errors,
  };
}

// ============================================
// PAGINATION HELPER
// ============================================
export function getPaginationMeta(total: number, page: number, limit: number) {
  const totalPages = Math.ceil(total / limit);
  return {
    total,
    page,
    limit,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

// ============================================
// IMAGE URL HELPER
// ============================================
export function getImageUrl(imagePath: string): string {
  if (!imagePath) return '/images/property-placeholder.jpg';
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  return imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
}

// ============================================
// PROPERTY TYPE LABEL
// ============================================
export function getPropertyTypeLabel(type: 'SALE' | 'RENT', locale: Locale): string {
  if (locale === 'ar') {
    return type === 'SALE' ? 'للبيع' : 'للإيجار';
  }
  return type === 'SALE' ? 'For Sale' : 'For Rent';
}

// ============================================
// PROPERTY STATUS LABEL
// ============================================
export function getPropertyStatusLabel(
  status: 'AVAILABLE' | 'SOLD' | 'RENTED' | 'PENDING',
  locale: Locale
): string {
  const labels: Record<string, Record<string, string>> = {
    ar: {
      AVAILABLE: 'متاح',
      SOLD: 'مباع',
      RENTED: 'مؤجر',
      PENDING: 'قيد المراجعة',
    },
    en: {
      AVAILABLE: 'Available',
      SOLD: 'Sold',
      RENTED: 'Rented',
      PENDING: 'Pending',
    },
  };
  return labels[locale][status] || status;
}

// ============================================
// CITIES LIST
// ============================================
export const SAUDI_CITIES = [
  { ar: 'الرياض', en: 'Riyadh' },
  { ar: 'جدة', en: 'Jeddah' },
  { ar: 'مكة المكرمة', en: 'Makkah' },
  { ar: 'المدينة المنورة', en: 'Madinah' },
  { ar: 'الدمام', en: 'Dammam' },
  { ar: 'الخبر', en: 'Khobar' },
  { ar: 'الظهران', en: 'Dhahran' },
  { ar: 'تبوك', en: 'Tabuk' },
  { ar: 'أبها', en: 'Abha' },
  { ar: 'نجران', en: 'Najran' },
  { ar: 'حائل', en: 'Hail' },
  { ar: 'القصيم', en: 'Qassim' },
];

export function getCityLabel(city: string, locale: Locale): string {
  const found = SAUDI_CITIES.find(
    (c) => c.ar === city || c.en === city
  );
  if (!found) return city;
  return locale === 'ar' ? found.ar : found.en;
}
