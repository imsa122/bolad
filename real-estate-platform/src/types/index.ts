// ============================================
// USER TYPES
// ============================================
export type Role = 'USER' | 'ADMIN';

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  phone?: string | null;
  avatar?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: Role;
}

export interface JWTPayload {
  userId: number;
  email: string;
  role: Role;
  iat?: number;
  exp?: number;
}

// ============================================
// PROPERTY TYPES
// ============================================
export type PropertyType = 'SALE' | 'RENT';
export type PropertyStatus = 'AVAILABLE' | 'SOLD' | 'RENTED' | 'PENDING';

export interface Property {
  id: number;
  title_ar: string;
  title_en: string;
  description_ar: string;
  description_en: string;
  price: number;
  city: string;
  address_ar?: string | null;
  address_en?: string | null;
  type: PropertyType;
  status: PropertyStatus;
  bedrooms: number;
  bathrooms: number;
  area: number;
  latitude?: number | null;
  longitude?: number | null;
  images: string[];
  amenities: string[];
  featured: boolean;
  views: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PropertyFilters {
  city?: string;
  type?: PropertyType;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  status?: PropertyStatus;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'price' | 'createdAt' | 'views';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// ============================================
// BOOKING TYPES
// ============================================
export type BookingType = 'VISIT' | 'INQUIRY' | 'PURCHASE' | 'RENTAL';
export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';

export interface Booking {
  id: number;
  propertyId: number;
  userId: number;
  bookingType: BookingType;
  status: BookingStatus;
  message?: string | null;
  visitDate?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  property?: Property;
  user?: Omit<User, 'password'>;
}

// ============================================
// CONTACT TYPES
// ============================================
export type ContactStatus = 'UNREAD' | 'READ' | 'REPLIED';

export interface Contact {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  subject: string;
  message: string;
  status: ContactStatus;
  createdAt: Date;
}

// ============================================
// API RESPONSE TYPES
// ============================================
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  errors?: Record<string, string[]>;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
  refreshToken?: string;
}

// ============================================
// FORM TYPES
// ============================================
export interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone?: string;
}

export interface LoginFormData {
  email: string;
  password: string;
}

export interface PropertyFormData {
  title_ar: string;
  title_en: string;
  description_ar: string;
  description_en: string;
  price: number;
  city: string;
  address_ar?: string;
  address_en?: string;
  type: PropertyType;
  status: PropertyStatus;
  bedrooms: number;
  bathrooms: number;
  area: number;
  latitude?: number;
  longitude?: number;
  amenities?: string[];
  featured?: boolean;
}

export interface BookingFormData {
  propertyId: number;
  bookingType: BookingType;
  message?: string;
  visitDate?: string;
}

export interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

// ============================================
// NAVIGATION TYPES
// ============================================
export interface NavItem {
  label: string;
  href: string;
  icon?: string;
  children?: NavItem[];
}

// ============================================
// LOCALE TYPES
// ============================================
export type Locale = 'ar' | 'en';

export interface LocaleConfig {
  locale: Locale;
  dir: 'rtl' | 'ltr';
  label: string;
  flag: string;
}
