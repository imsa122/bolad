'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import PropertyForm from '@/components/admin/PropertyForm';
import type { Property } from '@/types';

export default function NewPropertyPage() {
  const locale = useLocale() as 'ar' | 'en';
  const router = useRouter();
  const isRTL = locale === 'ar';
  const ArrowIcon = isRTL ? ArrowRight : ArrowLeft;

  const handleSuccess = (property: Property) => {
    router.push(`/${locale}/admin/properties`);
  };

  const handleCancel = () => {
    router.push(`/${locale}/admin/properties`);
  };

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href={`/${locale}/admin/properties`}
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
