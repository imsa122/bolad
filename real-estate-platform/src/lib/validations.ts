import { z } from 'zod';

// ============================================
// AUTH VALIDATIONS
// ============================================
export const registerSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .trim(),
  email: z
    .string()
    .email('Invalid email address')
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
  phone: z
    .string()
    .regex(/^\+?[0-9]{10,15}$/, 'Invalid phone number')
    .optional()
    .or(z.literal('')),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const loginSchema = z.object({
  email: z
    .string()
    .email('Invalid email address')
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(1, 'Password is required'),
});

// ============================================
// PROPERTY VALIDATIONS
// ============================================
export const propertySchema = z.object({
  title_ar: z
    .string()
    .min(3, 'Arabic title must be at least 3 characters')
    .max(255, 'Arabic title must be less than 255 characters')
    .trim(),
  title_en: z
    .string()
    .min(3, 'English title must be at least 3 characters')
    .max(255, 'English title must be less than 255 characters')
    .trim(),
  description_ar: z
    .string()
    .min(10, 'Arabic description must be at least 10 characters')
    .trim(),
  description_en: z
    .string()
    .min(10, 'English description must be at least 10 characters')
    .trim(),
  price: z
    .number()
    .positive('Price must be a positive number')
    .max(999999999, 'Price is too large'),
  city: z
    .string()
    .min(2, 'City is required')
    .max(100, 'City name is too long')
    .trim(),
  address_ar: z.string().max(500).optional().or(z.literal('')),
  address_en: z.string().max(500).optional().or(z.literal('')),
  type: z.enum(['SALE', 'RENT'], {
    errorMap: () => ({ message: 'Type must be SALE or RENT' }),
  }),
  status: z.enum(['AVAILABLE', 'SOLD', 'RENTED', 'PENDING']).default('AVAILABLE'),
  bedrooms: z
    .number()
    .int()
    .min(0, 'Bedrooms cannot be negative')
    .max(50, 'Too many bedrooms'),
  bathrooms: z
    .number()
    .int()
    .min(0, 'Bathrooms cannot be negative')
    .max(50, 'Too many bathrooms'),
  area: z
    .number()
    .positive('Area must be a positive number')
    .max(99999, 'Area is too large'),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
  amenities: z.array(z.string()).optional().default([]),
  featured: z.boolean().optional().default(false),
});

// For partial updates — relaxed min lengths, all fields optional
export const propertyUpdateSchema = z.object({
  title_ar: z.string().min(1, 'Arabic title cannot be empty').max(255).trim().optional(),
  title_en: z.string().min(1, 'English title cannot be empty').max(255).trim().optional(),
  description_ar: z.string().min(1, 'Arabic description cannot be empty').trim().optional(),
  description_en: z.string().min(1, 'English description cannot be empty').trim().optional(),
  price: z.number().positive('Price must be positive').max(999999999).optional(),
  city: z.string().min(1, 'City is required').max(100).trim().optional(),
  address_ar: z.string().max(500).optional().or(z.literal('')),
  address_en: z.string().max(500).optional().or(z.literal('')),
  type: z.enum(['SALE', 'RENT']).optional(),
  status: z.enum(['AVAILABLE', 'SOLD', 'RENTED', 'PENDING']).optional(),
  bedrooms: z.number().int().min(0).max(50).optional(),
  bathrooms: z.number().int().min(0).max(50).optional(),
  area: z.number().positive('Area must be positive').max(99999).optional(),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
  amenities: z.array(z.string()).optional(),
  featured: z.boolean().optional(),
});

// ============================================
// BOOKING VALIDATIONS
// ============================================
export const bookingSchema = z.object({
  propertyId: z
    .number()
    .int()
    .positive('Invalid property ID'),
  bookingType: z.enum(['VISIT', 'INQUIRY', 'PURCHASE', 'RENTAL'], {
    errorMap: () => ({ message: 'Invalid booking type' }),
  }),
  message: z
    .string()
    .max(1000, 'Message is too long')
    .optional()
    .or(z.literal('')),
  // Accept datetime-local format (2024-01-15T10:30) OR full ISO 8601 OR empty string
  visitDate: z
    .string()
    .refine(
      (val) => !val || !isNaN(Date.parse(val)),
      { message: 'Invalid date format' }
    )
    .optional()
    .or(z.literal('')),
});

// ============================================
// CONTACT VALIDATIONS
// ============================================
export const contactSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name is too long')
    .trim(),
  email: z
    .string()
    .email('Invalid email address')
    .toLowerCase()
    .trim(),
  phone: z
    .string()
    .regex(/^\+?[0-9]{10,15}$/, 'Invalid phone number')
    .optional()
    .or(z.literal('')),
  subject: z
    .string()
    .min(3, 'Subject must be at least 3 characters')
    .max(255, 'Subject is too long')
    .trim(),
  message: z
    .string()
    .min(10, 'Message must be at least 10 characters')
    .max(2000, 'Message is too long')
    .trim(),
});

// ============================================
// FILTER VALIDATIONS
// ============================================
export const propertyFilterSchema = z.object({
  city: z.string().optional(),
  type: z.enum(['SALE', 'RENT']).optional(),
  minPrice: z.coerce.number().positive().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  bedrooms: z.coerce.number().int().min(0).optional(),
  status: z.enum(['AVAILABLE', 'SOLD', 'RENTED', 'PENDING']).optional(),
  search: z.string().max(100).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(12),
  sortBy: z.enum(['price', 'createdAt', 'views']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ============================================
// TYPE EXPORTS
// ============================================
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type PropertyInput = z.infer<typeof propertySchema>;
export type PropertyUpdateInput = z.infer<typeof propertyUpdateSchema>;
export type BookingInput = z.infer<typeof bookingSchema>;
export type ContactInput = z.infer<typeof contactSchema>;
export type PropertyFilterInput = z.infer<typeof propertyFilterSchema>;
