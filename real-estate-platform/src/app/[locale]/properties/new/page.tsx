'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import PropertyForm from '@/components/admin/PropertyForm';
import type { Property } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';
import toast from 'react-hot-toast';

export default function NewPropertyPage() {
  const locale = useLocale() as 'ar' | 'en';
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const isRTL = locale === 'ar';
  const ArrowIcon = isRTL ? ArrowRight : ArrowLeft;

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast.error(locale === 'ar' ? 'يجب تسجيل الدخول أولاً' : 'You must be logged in first');
      router.push(`/${locale}/auth/login?redirect=/${locale}/properties/new`);
    }
  }, [isAuthenticated, isLoading, locale, router]);

  // Don't render anything while checking authentication
  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const handleSuccess = (property: Property) => {
    router.push(`/${locale}/properties/${property.id}`);
  };

  const handleCancel = () => {
    router.push(`/${locale}/properties`);
  };

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="space-y-6 max-w-5xl mx-auto px-4 py-8 mt-16">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href={`/${locale}/properties`}
          className="p-2 text-dark-500 hover:text-dark-700 hover:bg-gray-100 rounded-xl transition-colors"
        >
          <ArrowIcon className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-dark-900">
            {locale === 'ar' ? 'إضافة عقار جديد' : 'Add New Property'}
          </h1>
          <p className="text-dark-500 text-sm mt-1">
            {locale === 'ar' ? 'أدخل تفاصيل العقار الجديد' : 'Enter the details for the new property'}
          </p>
        </div>
      </div>

      {/* Form */}
      <PropertyForm onSuccess={handleSuccess} onCancel={handleCancel} />
    </div>
  );
}
