'use client';

import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import PropertyForm from '@/components/admin/PropertyForm';
import type { Property } from '@/types';

export default function EditPropertyPage() {
  const locale = useLocale() as 'ar' | 'en';
  const router = useRouter();
  const params = useParams();
  const propertyId = params.id as string;
  const isRTL = locale === 'ar';
  const ArrowIcon = isRTL ? ArrowRight : ArrowLeft;

  const [property, setProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!propertyId) return;
    fetchProperty();
  }, [propertyId]);

  const fetchProperty = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await axios.get(`/api/properties/${propertyId}`);
      if (data.success) {
        setProperty(data.data);
      } else {
        setError(locale === 'ar' ? 'العقار غير موجود' : 'Property not found');
      }
    } catch {
      setError(locale === 'ar' ? 'فشل تحميل بيانات العقار' : 'Failed to load property data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuccess = (updatedProperty: Property) => {
    toast.success(locale === 'ar' ? 'تم تحديث العقار بنجاح' : 'Property updated successfully');
    router.push(`/${locale}/admin/properties`);
  };

  const handleCancel = () => {
    router.push(`/${locale}/admin/properties`);
  };

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleCancel}
          className="flex items-center gap-2 text-dark-500 hover:text-dark-800 transition-colors text-sm"
        >
          <ArrowIcon className="w-4 h-4" />
          {locale === 'ar' ? 'العودة للعقارات' : 'Back to Properties'}
        </button>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-dark-900">
          {locale === 'ar' ? 'تعديل العقار' : 'Edit Property'}
        </h1>
        {property && (
          <p className="text-dark-500 text-sm mt-1">
            {locale === 'ar' ? property.title_ar : property.title_en}
          </p>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-3" />
            <p className="text-dark-500 text-sm">
              {locale === 'ar' ? 'جاري تحميل بيانات العقار...' : 'Loading property data...'}
            </p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <p className="text-dark-700 font-medium mb-2">{error}</p>
          <div className="flex gap-3 mt-4">
            <button
              onClick={fetchProperty}
              className="px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors"
            >
              {locale === 'ar' ? 'إعادة المحاولة' : 'Try Again'}
            </button>
            <button
              onClick={handleCancel}
              className="px-4 py-2 border border-gray-200 text-dark-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              {locale === 'ar' ? 'العودة' : 'Go Back'}
            </button>
          </div>
        </div>
      )}

      {/* Property Form */}
      {!isLoading && !error && property && (
        <PropertyForm
          property={property}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
}
