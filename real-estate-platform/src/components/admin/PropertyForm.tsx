'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Upload, X, Plus, Loader2 } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { propertySchema, type PropertyInput } from '@/lib/validations';
import { cn, SAUDI_CITIES } from '@/lib/utils';
import type { Property } from '@/types';

interface PropertyFormProps {
  property?: Property;
  onSuccess: (property: Property) => void;
  onCancel: () => void;
}

export default function PropertyForm({ property, onSuccess, onCancel }: PropertyFormProps) {
  const locale = useLocale() as 'ar' | 'en';
  const t = useTranslations('admin.properties');
  const isRTL = locale === 'ar';

  const [images, setImages] = useState<string[]>(property?.images || []);
  const [amenities, setAmenities] = useState<string[]>(property?.amenities || []);
  const [newAmenity, setNewAmenity] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PropertyInput>({
    resolver: zodResolver(propertySchema),
    defaultValues: property
      ? {
          title_ar: property.title_ar,
          title_en: property.title_en,
          description_ar: property.description_ar,
          description_en: property.description_en,
          price: property.price,
          city: property.city,
          address_ar: property.address_ar || '',
          address_en: property.address_en || '',
          type: property.type,
          status: property.status,
          bedrooms: property.bedrooms,
          bathrooms: property.bathrooms,
          area: property.area,
          latitude: property.latitude || undefined,
          longitude: property.longitude || undefined,
          featured: property.featured,
        }
      : {
          type: 'SALE',
          status: 'AVAILABLE',
          bedrooms: 3,
          bathrooms: 2,
          featured: false,
        },
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (images.length + files.length > 10) {
      toast.error(locale === 'ar' ? 'الحد الأقصى 10 صور' : 'Maximum 10 images allowed');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => formData.append('files', file));

      const { data } = await axios.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (data.success) {
        setImages((prev) => [...prev, ...data.data.urls]);
        toast.success(locale === 'ar' ? 'تم رفع الصور بنجاح' : 'Images uploaded successfully');
      }
    } catch {
      toast.error(locale === 'ar' ? 'فشل رفع الصور' : 'Failed to upload images');
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const addAmenity = () => {
    if (newAmenity.trim() && !amenities.includes(newAmenity.trim())) {
      setAmenities((prev) => [...prev, newAmenity.trim()]);
      setNewAmenity('');
    }
  };

  const removeAmenity = (index: number) => {
    setAmenities((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: PropertyInput) => {
    setIsSubmitting(true);
    try {
      const payload = { ...data, images, amenities };

      let response;
      if (property) {
        response = await axios.put(`/api/properties/${property.id}`, payload);
      } else {
        response = await axios.post('/api/properties', payload);
      }

      if (response.data.success) {
        toast.success(
          property
            ? (locale === 'ar' ? 'تم تحديث العقار بنجاح' : 'Property updated successfully')
            : (locale === 'ar' ? 'تم إضافة العقار بنجاح' : 'Property added successfully')
        );
        onSuccess(response.data.data);
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error.response?.data?.error || (locale === 'ar' ? 'حدث خطأ ما' : 'Something went wrong'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = (hasError?: boolean) =>
    cn(
      'w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all',
      hasError ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-white'
    );

  const labelClass = 'block text-sm font-medium text-dark-700 mb-1.5';
  const errorClass = 'text-red-500 text-xs mt-1';

  return (
    <form onSubmit={handleSubmit(onSubmit)} dir={isRTL ? 'rtl' : 'ltr'} className="space-y-8">
      {/* Titles */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-dark-800 mb-5 pb-3 border-b border-gray-100">
          {locale === 'ar' ? 'العنوان والوصف' : 'Title & Description'}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className={labelClass}>
              {locale === 'ar' ? 'العنوان بالعربية' : 'Arabic Title'} *
            </label>
            <input {...register('title_ar')} className={inputClass(!!errors.title_ar)} dir="rtl" />
            {errors.title_ar && <p className={errorClass}>{errors.title_ar.message}</p>}
          </div>
          <div>
            <label className={labelClass}>
              {locale === 'ar' ? 'العنوان بالإنجليزية' : 'English Title'} *
            </label>
            <input {...register('title_en')} className={inputClass(!!errors.title_en)} dir="ltr" />
            {errors.title_en && <p className={errorClass}>{errors.title_en.message}</p>}
          </div>
          <div>
            <label className={labelClass}>
              {locale === 'ar' ? 'الوصف بالعربية' : 'Arabic Description'} *
            </label>
            <textarea
              {...register('description_ar')}
              rows={4}
              className={inputClass(!!errors.description_ar)}
              dir="rtl"
            />
            {errors.description_ar && <p className={errorClass}>{errors.description_ar.message}</p>}
          </div>
          <div>
            <label className={labelClass}>
              {locale === 'ar' ? 'الوصف بالإنجليزية' : 'English Description'} *
            </label>
            <textarea
              {...register('description_en')}
              rows={4}
              className={inputClass(!!errors.description_en)}
              dir="ltr"
            />
            {errors.description_en && <p className={errorClass}>{errors.description_en.message}</p>}
          </div>
        </div>
      </div>

      {/* Property Details */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-dark-800 mb-5 pb-3 border-b border-gray-100">
          {locale === 'ar' ? 'تفاصيل العقار' : 'Property Details'}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <div>
            <label className={labelClass}>{locale === 'ar' ? 'السعر (ريال)' : 'Price (SAR)'} *</label>
            <input
              type="number"
              {...register('price', { valueAsNumber: true })}
              className={inputClass(!!errors.price)}
              min="0"
            />
            {errors.price && <p className={errorClass}>{errors.price.message}</p>}
          </div>
          <div>
            <label className={labelClass}>{locale === 'ar' ? 'المدينة' : 'City'} *</label>
            <select {...register('city')} className={inputClass(!!errors.city)}>
              <option value="">{locale === 'ar' ? 'اختر المدينة' : 'Select City'}</option>
              {SAUDI_CITIES.map((city) => (
                <option key={city.en} value={locale === 'ar' ? city.ar : city.en}>
                  {locale === 'ar' ? city.ar : city.en}
                </option>
              ))}
            </select>
            {errors.city && <p className={errorClass}>{errors.city.message}</p>}
          </div>
          <div>
            <label className={labelClass}>{locale === 'ar' ? 'نوع العقار' : 'Property Type'} *</label>
            <select {...register('type')} className={inputClass(!!errors.type)}>
              <option value="SALE">{locale === 'ar' ? 'للبيع' : 'For Sale'}</option>
              <option value="RENT">{locale === 'ar' ? 'للإيجار' : 'For Rent'}</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>{locale === 'ar' ? 'الحالة' : 'Status'}</label>
            <select {...register('status')} className={inputClass()}>
              <option value="AVAILABLE">{locale === 'ar' ? 'متاح' : 'Available'}</option>
              <option value="SOLD">{locale === 'ar' ? 'مباع' : 'Sold'}</option>
              <option value="RENTED">{locale === 'ar' ? 'مؤجر' : 'Rented'}</option>
              <option value="PENDING">{locale === 'ar' ? 'قيد المراجعة' : 'Pending'}</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>{locale === 'ar' ? 'غرف النوم' : 'Bedrooms'} *</label>
            <input
              type="number"
              {...register('bedrooms', { valueAsNumber: true })}
              className={inputClass(!!errors.bedrooms)}
              min="0"
            />
            {errors.bedrooms && <p className={errorClass}>{errors.bedrooms.message}</p>}
          </div>
          <div>
            <label className={labelClass}>{locale === 'ar' ? 'الحمامات' : 'Bathrooms'} *</label>
            <input
              type="number"
              {...register('bathrooms', { valueAsNumber: true })}
              className={inputClass(!!errors.bathrooms)}
              min="0"
            />
            {errors.bathrooms && <p className={errorClass}>{errors.bathrooms.message}</p>}
          </div>
          <div>
            <label className={labelClass}>{locale === 'ar' ? 'المساحة (م²)' : 'Area (m²)'} *</label>
            <input
              type="number"
              {...register('area', { valueAsNumber: true })}
              className={inputClass(!!errors.area)}
              min="0"
              step="0.01"
            />
            {errors.area && <p className={errorClass}>{errors.area.message}</p>}
          </div>
          <div>
            <label className={labelClass}>{locale === 'ar' ? 'خط العرض' : 'Latitude'}</label>
            <input
              type="number"
              {...register('latitude', { valueAsNumber: true })}
              className={inputClass()}
              step="any"
              placeholder="24.7136"
            />
          </div>
          <div>
            <label className={labelClass}>{locale === 'ar' ? 'خط الطول' : 'Longitude'}</label>
            <input
              type="number"
              {...register('longitude', { valueAsNumber: true })}
              className={inputClass()}
              step="any"
              placeholder="46.6753"
            />
          </div>
        </div>

        {/* Featured Toggle */}
        <div className="mt-5 flex items-center gap-3">
          <input
            type="checkbox"
            id="featured"
            {...register('featured')}
            className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
          />
          <label htmlFor="featured" className="text-sm font-medium text-dark-700 cursor-pointer">
            {locale === 'ar' ? 'عقار مميز (يظهر في الصفحة الرئيسية)' : 'Featured Property (shown on homepage)'}
          </label>
        </div>
      </div>

      {/* Images */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-dark-800 mb-5 pb-3 border-b border-gray-100">
          {t('images')}
        </h3>

        {/* Upload Area */}
        <label className={cn(
          'flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-all',
          isUploading
            ? 'border-primary-300 bg-primary-50'
            : 'border-gray-300 hover:border-primary-400 hover:bg-primary-50'
        )}>
          <input
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            onChange={handleImageUpload}
            className="hidden"
            disabled={isUploading || images.length >= 10}
          />
          {isUploading ? (
            <div className="flex items-center gap-2 text-primary-600">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">{locale === 'ar' ? 'جاري الرفع...' : 'Uploading...'}</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1 text-dark-400">
              <Upload className="w-6 h-6" />
              <span className="text-sm font-medium">{t('uploadImages')}</span>
              <span className="text-xs">{t('maxImages')}</span>
            </div>
          )}
        </label>

        {/* Image Preview Grid */}
        {images.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mt-4">
            {images.map((img, index) => (
              <div key={index} className="relative group aspect-square rounded-xl overflow-hidden bg-gray-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img} alt={`Property ${index + 1}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                {index === 0 && (
                  <div className="absolute bottom-1 left-1 bg-primary-600 text-white text-xs px-1.5 py-0.5 rounded">
                    {locale === 'ar' ? 'رئيسية' : 'Main'}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Amenities */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-dark-800 mb-5 pb-3 border-b border-gray-100">
          {locale === 'ar' ? 'المميزات والخدمات' : 'Amenities & Features'}
        </h3>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={newAmenity}
            onChange={(e) => setNewAmenity(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addAmenity())}
            placeholder={locale === 'ar' ? 'أضف ميزة...' : 'Add amenity...'}
            className={inputClass()}
          />
          <button
            type="button"
            onClick={addAmenity}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            {locale === 'ar' ? 'إضافة' : 'Add'}
          </button>
        </div>
        {amenities.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {amenities.map((amenity, index) => (
              <span
                key={index}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 text-primary-700 rounded-lg text-sm"
              >
                {amenity}
                <button
                  type="button"
                  onClick={() => removeAmenity(index)}
                  className="text-primary-400 hover:text-red-500 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2.5 border border-gray-200 text-dark-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          {locale === 'ar' ? 'إلغاء' : 'Cancel'}
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2 px-6 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {property
            ? (locale === 'ar' ? 'حفظ التغييرات' : 'Save Changes')
            : (locale === 'ar' ? 'إضافة العقار' : 'Add Property')}
        </button>
      </div>
    </form>
  );
}
