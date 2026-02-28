'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarDays, Loader2, LogIn } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { bookingSchema, type BookingInput } from '@/lib/validations';
import { useAuth } from '@/hooks/useAuth';
import type { Locale } from '@/types';

interface BookingFormProps {
  propertyId: number;
  locale: Locale;
}

export default function BookingForm({ propertyId, locale }: BookingFormProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isRTL = locale === 'ar';

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BookingInput>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      propertyId: Number(propertyId),
      bookingType: 'VISIT',
      message: '',
      visitDate: '',
    },
  });

  const onSubmit = async (formData: BookingInput) => {
    if (!isAuthenticated) {
      router.push(`/${locale}/auth/login?redirect=/${locale}/properties/${propertyId}`);
      return;
    }

    setIsSubmitting(true);
    try {
      // Convert visitDate from datetime-local format to ISO string if present
      const visitDateISO =
        formData.visitDate && formData.visitDate !== ''
          ? new Date(formData.visitDate).toISOString()
          : undefined;

      const payload = {
        propertyId: Number(propertyId),
        bookingType: formData.bookingType,
        message: formData.message || undefined,
        visitDate: visitDateISO,
      };

      const { data: response } = await axios.post('/api/bookings', payload);

      if (response.success) {
        toast.success(
          locale === 'ar'
            ? '✅ تم إرسال طلب الحجز بنجاح! سنتواصل معك قريباً.'
            : '✅ Booking request sent successfully! We will contact you soon.'
        );
        reset();
        router.push(`/${locale}/booking/${response.data.id}`);
      } else {
        toast.error(response.error || (locale === 'ar' ? 'حدث خطأ ما' : 'Something went wrong'));
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string }; status?: number } };
      const status = error.response?.status;
      const msg = error.response?.data?.error;

      if (status === 401) {
        toast.error(locale === 'ar' ? 'يجب تسجيل الدخول أولاً' : 'Please sign in first');
        router.push(`/${locale}/auth/login?redirect=/${locale}/properties/${propertyId}`);
      } else if (status === 409) {
        toast.error(
          locale === 'ar'
            ? 'لديك طلب حجز معلق لهذا العقار بالفعل'
            : 'You already have a pending booking for this property'
        );
      } else {
        toast.error(
          msg ||
            (locale === 'ar'
              ? 'حدث خطأ ما، يرجى المحاولة مرة أخرى'
              : 'Something went wrong, please try again')
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="h-10 bg-gray-100 animate-pulse rounded-xl" />
        <div className="h-10 bg-gray-100 animate-pulse rounded-xl" />
        <div className="h-10 bg-gray-100 animate-pulse rounded-xl" />
        <div className="h-12 bg-gray-100 animate-pulse rounded-xl" />
      </div>
    );
  }

  // Not authenticated — show login prompt
  if (!isAuthenticated) {
    return (
      <div className="text-center py-4" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="w-14 h-14 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-3">
          <CalendarDays className="w-7 h-7 text-primary-500" />
        </div>
        <p className="text-dark-700 font-medium mb-1">
          {locale === 'ar' ? 'احجز موعد زيارة' : 'Book a Visit'}
        </p>
        <p className="text-dark-500 text-sm mb-4">
          {locale === 'ar'
            ? 'يجب تسجيل الدخول أولاً لحجز موعد'
            : 'You must be logged in to book a visit'}
        </p>
        <Link
          href={`/${locale}/auth/login?redirect=/${locale}/properties/${propertyId}`}
          className="flex items-center justify-center gap-2 w-full py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-medium transition-all"
        >
          <LogIn className="w-4 h-4" />
          {locale === 'ar' ? 'تسجيل الدخول للحجز' : 'Sign In to Book'}
        </Link>
        <Link
          href={`/${locale}/auth/register`}
          className="flex items-center justify-center gap-2 w-full py-2.5 mt-2 border border-primary-200 text-primary-600 hover:bg-primary-50 rounded-xl text-sm font-medium transition-all"
        >
          {locale === 'ar' ? 'إنشاء حساب جديد' : 'Create New Account'}
        </Link>
      </div>
    );
  }

  // Authenticated — show booking form
  return (
    <form onSubmit={handleSubmit(onSubmit)} dir={isRTL ? 'rtl' : 'ltr'} className="space-y-4">
      {/* Hidden propertyId — REQUIRED for Zod validation to pass */}
      <input
        type="hidden"
        {...register('propertyId', { valueAsNumber: true })}
        value={propertyId}
      />

      {/* Booking Type */}
      <div>
        <label className="block text-sm font-medium text-dark-700 mb-1.5">
          {locale === 'ar' ? 'نوع الطلب' : 'Request Type'}
        </label>
        <select
          {...register('bookingType')}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
        >
          <option value="VISIT">{locale === 'ar' ? 'زيارة العقار' : 'Property Visit'}</option>
          <option value="INQUIRY">{locale === 'ar' ? 'استفسار' : 'Inquiry'}</option>
          <option value="PURCHASE">{locale === 'ar' ? 'شراء' : 'Purchase'}</option>
          <option value="RENTAL">{locale === 'ar' ? 'إيجار' : 'Rental'}</option>
        </select>
        {errors.bookingType && (
          <p className="text-red-500 text-xs mt-1">{errors.bookingType.message}</p>
        )}
      </div>

      {/* Visit Date */}
      <div>
        <label className="block text-sm font-medium text-dark-700 mb-1.5">
          {locale === 'ar' ? 'تاريخ الزيارة (اختياري)' : 'Visit Date (optional)'}
        </label>
        <input
          type="datetime-local"
          {...register('visitDate')}
          min={new Date().toISOString().slice(0, 16)}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        {errors.visitDate && (
          <p className="text-red-500 text-xs mt-1">{errors.visitDate.message}</p>
        )}
      </div>

      {/* Message */}
      <div>
        <label className="block text-sm font-medium text-dark-700 mb-1.5">
          {locale === 'ar' ? 'رسالة إضافية (اختياري)' : 'Additional Message (optional)'}
        </label>
        <textarea
          {...register('message')}
          rows={3}
          placeholder={
            locale === 'ar'
              ? 'أضف أي تفاصيل أو استفسارات...'
              : 'Add any details or inquiries...'
          }
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
        />
        {errors.message && (
          <p className="text-red-500 text-xs mt-1">{errors.message.message}</p>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="flex items-center justify-center gap-2 w-full py-3.5 bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white rounded-xl text-sm font-medium transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            {locale === 'ar' ? 'جاري الإرسال...' : 'Sending...'}
          </>
        ) : (
          <>
            <CalendarDays className="w-4 h-4" />
            {locale === 'ar' ? 'احجز موعد' : 'Book a Visit'}
          </>
        )}
      </button>
    </form>
  );
}
