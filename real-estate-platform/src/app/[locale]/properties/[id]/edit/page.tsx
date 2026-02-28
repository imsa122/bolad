'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import axios from 'axios';
import toast from 'react-hot-toast';
import { ArrowRight, ArrowLeft, Clock, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

interface Property {
  id: number;
  title_ar: string;
  title_en: string;
  description_ar: string;
  description_en: string;
  price: number;
  city: string;
  address_ar?: string;
  address_en?: string;
  type: 'SALE' | 'RENT';
  status: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  latitude?: number;
  longitude?: number;
  images: string[];
  amenities: string[];
  lastEditedAt?: string;
}

const CITIES = ['الرياض', 'جدة', 'الدمام', 'مكة المكرمة', 'المدينة المنورة', 'الخبر', 'تبوك', 'أبها'];
const CITIES_EN = ['Riyadh', 'Jeddah', 'Dammam', 'Makkah', 'Madinah', 'Khobar', 'Tabuk', 'Abha'];

export default function EditPropertyPage() {
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const id = params.id as string;
  const isRTL = locale === 'ar';
  const ArrowIcon = isRTL ? ArrowRight : ArrowLeft;

  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cooldownInfo, setCooldownInfo] = useState<{
    remainingHours: number;
    remainingMinutes: number;
    nextEditAt: string;
  } | null>(null);
  const [form, setForm] = useState({
    title_ar: '',
    title_en: '',
    description_ar: '',
    description_en: '',
    price: '',
    city: '',
    address_ar: '',
    address_en: '',
    type: 'SALE' as 'SALE' | 'RENT',
    status: 'AVAILABLE',
    bedrooms: '',
    bathrooms: '',
    area: '',
    latitude: '',
    longitude: '',
  });
  const [images, setImages] = useState<string[]>([]);
  const [amenities, setAmenities] = useState<string[]>([]);
  const [newAmenity, setNewAmenity] = useState('');
  const [uploadingImages, setUploadingImages] = useState(false);

  useEffect(() => {
    fetchProperty();
  }, [id]);

  async function fetchProperty() {
    try {
      const res = await axios.get(`/api/properties/${id}`);
      const p: Property = res.data.data;
      setProperty(p);
      setForm({
        title_ar: p.title_ar,
        title_en: p.title_en,
        description_ar: p.description_ar,
        description_en: p.description_en,
        price: String(p.price),
        city: p.city,
        address_ar: p.address_ar || '',
        address_en: p.address_en || '',
        type: p.type,
        status: p.status,
        bedrooms: String(p.bedrooms),
        bathrooms: String(p.bathrooms),
        area: String(p.area),
        latitude: p.latitude ? String(p.latitude) : '',
        longitude: p.longitude ? String(p.longitude) : '',
      });
      setImages(p.images || []);
      setAmenities(p.amenities || []);
    } catch (err: unknown) {
      const error = err as { response?: { status?: number } };
      if (error.response?.status === 404) {
        toast.error(isRTL ? 'العقار غير موجود' : 'Property not found');
        router.push(`/${locale}/properties`);
      } else if (error.response?.status === 403) {
        toast.error(isRTL ? 'غير مصرح لك بتعديل هذا العقار' : 'You are not authorized to edit this property');
        router.push(`/${locale}/properties/${id}`);
      } else {
        toast.error(isRTL ? 'حدث خطأ في تحميل البيانات' : 'Failed to load property');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImages(true);
    const formData = new FormData();
    Array.from(files).forEach((file) => formData.append('files', file));

    try {
      const res = await axios.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const newUrls: string[] = res.data.data.urls;
      setImages((prev) => [...prev, ...newUrls]);
      toast.success(isRTL ? 'تم رفع الصور بنجاح' : 'Images uploaded successfully');
    } catch {
      toast.error(isRTL ? 'فشل رفع الصور' : 'Failed to upload images');
    } finally {
      setUploadingImages(false);
    }
  }

  function removeImage(url: string) {
    setImages((prev) => prev.filter((img) => img !== url));
  }

  function addAmenity() {
    if (newAmenity.trim() && !amenities.includes(newAmenity.trim())) {
      setAmenities((prev) => [...prev, newAmenity.trim()]);
      setNewAmenity('');
    }
  }

  function removeAmenity(item: string) {
    setAmenities((prev) => prev.filter((a) => a !== item));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setCooldownInfo(null);

    try {
      await axios.put(`/api/properties/${id}`, {
        ...form,
        price: parseFloat(form.price),
        bedrooms: parseInt(form.bedrooms),
        bathrooms: parseInt(form.bathrooms),
        area: parseFloat(form.area),
        latitude: form.latitude ? parseFloat(form.latitude) : undefined,
        longitude: form.longitude ? parseFloat(form.longitude) : undefined,
        images,
        amenities,
      });

      toast.success(isRTL ? 'تم تحديث العقار بنجاح' : 'Property updated successfully');
      router.push(`/${locale}/properties/${id}`);
    } catch (err: unknown) {
      const error = err as {
        response?: {
          status?: number;
          data?: {
            error?: string;
            error_en?: string;
            cooldown?: { remainingHours: number; remainingMinutes: number; nextEditAt: string };
          };
        };
      };

      if (error.response?.status === 429 && error.response.data?.cooldown) {
        setCooldownInfo(error.response.data.cooldown);
        const msg = isRTL
          ? error.response.data.error || 'يمكنك التعديل مرة واحدة كل 24 ساعة'
          : error.response.data.error_en || 'You can only edit once every 24 hours';
        toast.error(msg);
      } else if (error.response?.status === 403) {
        toast.error(isRTL ? 'غير مصرح لك بتعديل هذا العقار' : 'Not authorized to edit this property');
        router.push(`/${locale}/properties/${id}`);
      } else {
        toast.error(isRTL ? 'فشل تحديث العقار' : 'Failed to update property');
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!property) return null;

  return (
    <div className={`min-h-screen bg-gray-50 py-8 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href={`/${locale}/properties/${id}`}
            className="flex items-center gap-2 text-gray-600 hover:text-primary-600 transition-colors"
          >
            <ArrowIcon className="w-5 h-5" />
            <span>{isRTL ? 'العودة للعقار' : 'Back to Property'}</span>
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-card p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {isRTL ? 'تعديل العقار' : 'Edit Property'}
          </h1>
          <p className="text-gray-500 mb-6 text-sm">
            {isRTL
              ? 'يمكنك تعديل إعلانك مرة واحدة كل 24 ساعة'
              : 'You can edit your listing once every 24 hours'}
          </p>

          {/* Cooldown Warning */}
          {cooldownInfo && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
              <Clock className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-amber-800">
                  {isRTL ? 'فترة الانتظار' : 'Cooldown Period'}
                </p>
                <p className="text-amber-700 text-sm mt-1">
                  {isRTL
                    ? `يمكنك التعديل مجدداً في: ${new Date(cooldownInfo.nextEditAt).toLocaleString('ar-SA')}`
                    : `Next edit available at: ${new Date(cooldownInfo.nextEditAt).toLocaleString('en-US')}`}
                </p>
              </div>
            </div>
          )}

          {/* Last Edit Info */}
          {property.lastEditedAt && (
            <div className="mb-6 p-3 bg-blue-50 border border-blue-100 rounded-lg flex items-center gap-2 text-sm text-blue-700">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>
                {isRTL
                  ? `آخر تعديل: ${new Date(property.lastEditedAt).toLocaleString('ar-SA')}`
                  : `Last edited: ${new Date(property.lastEditedAt).toLocaleString('en-US')}`}
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Titles */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isRTL ? 'العنوان بالعربية *' : 'Title in Arabic *'}
                </label>
                <input
                  type="text"
                  required
                  value={form.title_ar}
                  onChange={(e) => setForm({ ...form, title_ar: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  dir="rtl"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isRTL ? 'العنوان بالإنجليزية *' : 'Title in English *'}
                </label>
                <input
                  type="text"
                  required
                  value={form.title_en}
                  onChange={(e) => setForm({ ...form, title_en: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  dir="ltr"
                />
              </div>
            </div>

            {/* Descriptions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isRTL ? 'الوصف بالعربية *' : 'Description in Arabic *'}
                </label>
                <textarea
                  required
                  rows={4}
                  value={form.description_ar}
                  onChange={(e) => setForm({ ...form, description_ar: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  dir="rtl"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isRTL ? 'الوصف بالإنجليزية *' : 'Description in English *'}
                </label>
                <textarea
                  required
                  rows={4}
                  value={form.description_en}
                  onChange={(e) => setForm({ ...form, description_en: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  dir="ltr"
                />
              </div>
            </div>

            {/* Price, Type, Status */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isRTL ? 'السعر (ريال) *' : 'Price (SAR) *'}
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isRTL ? 'نوع العقار *' : 'Property Type *'}
                </label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as 'SALE' | 'RENT' })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="SALE">{isRTL ? 'للبيع' : 'For Sale'}</option>
                  <option value="RENT">{isRTL ? 'للإيجار' : 'For Rent'}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isRTL ? 'الحالة *' : 'Status *'}
                </label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="AVAILABLE">{isRTL ? 'متاح' : 'Available'}</option>
                  <option value="PENDING">{isRTL ? 'قيد المراجعة' : 'Pending'}</option>
                  <option value="SOLD">{isRTL ? 'مباع' : 'Sold'}</option>
                  <option value="RENTED">{isRTL ? 'مؤجر' : 'Rented'}</option>
                </select>
              </div>
            </div>

            {/* City, Bedrooms, Bathrooms, Area */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isRTL ? 'المدينة *' : 'City *'}
                </label>
                <select
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  {CITIES.map((city, i) => (
                    <option key={city} value={city}>
                      {isRTL ? city : CITIES_EN[i]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isRTL ? 'غرف النوم *' : 'Bedrooms *'}
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={form.bedrooms}
                  onChange={(e) => setForm({ ...form, bedrooms: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isRTL ? 'دورات المياه *' : 'Bathrooms *'}
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={form.bathrooms}
                  onChange={(e) => setForm({ ...form, bathrooms: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isRTL ? 'المساحة (م²) *' : 'Area (m²) *'}
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={form.area}
                  onChange={(e) => setForm({ ...form, area: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Addresses */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isRTL ? 'العنوان التفصيلي (عربي)' : 'Detailed Address (Arabic)'}
                </label>
                <input
                  type="text"
                  value={form.address_ar}
                  onChange={(e) => setForm({ ...form, address_ar: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  dir="rtl"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isRTL ? 'العنوان التفصيلي (إنجليزي)' : 'Detailed Address (English)'}
                </label>
                <input
                  type="text"
                  value={form.address_en}
                  onChange={(e) => setForm({ ...form, address_en: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  dir="ltr"
                />
              </div>
            </div>

            {/* Coordinates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isRTL ? 'خط العرض (Latitude)' : 'Latitude'}
                </label>
                <input
                  type="number"
                  step="any"
                  value={form.latitude}
                  onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="24.7136"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isRTL ? 'خط الطول (Longitude)' : 'Longitude'}
                </label>
                <input
                  type="number"
                  step="any"
                  value={form.longitude}
                  onChange={(e) => setForm({ ...form, longitude: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="46.6753"
                />
              </div>
            </div>

            {/* Images */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {isRTL ? 'صور العقار' : 'Property Images'}
              </label>
              <div className="flex flex-wrap gap-3 mb-3">
                {images.map((url) => (
                  <div key={url} className="relative group">
                    <img
                      src={url}
                      alt="property"
                      className="w-24 h-24 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(url)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-primary-400 hover:text-primary-600 transition-colors">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={uploadingImages}
                />
                {uploadingImages
                  ? (isRTL ? 'جاري الرفع...' : 'Uploading...')
                  : (isRTL ? '+ إضافة صور' : '+ Add Images')}
              </label>
            </div>

            {/* Amenities */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {isRTL ? 'المميزات' : 'Amenities'}
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {amenities.map((item) => (
                  <span
                    key={item}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm"
                  >
                    {item}
                    <button
                      type="button"
                      onClick={() => removeAmenity(item)}
                      className="text-primary-400 hover:text-red-500 ml-1"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newAmenity}
                  onChange={(e) => setNewAmenity(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addAmenity())}
                  placeholder={isRTL ? 'أضف ميزة...' : 'Add amenity...'}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                />
                <button
                  type="button"
                  onClick={addAmenity}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm transition-colors"
                >
                  {isRTL ? 'إضافة' : 'Add'}
                </button>
              </div>
            </div>

            {/* Submit */}
            <div className="flex gap-3 pt-4 border-t border-gray-100">
              <button
                type="submit"
                disabled={saving || !!cooldownInfo}
                className="flex-1 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors"
              >
                {saving
                  ? (isRTL ? 'جاري الحفظ...' : 'Saving...')
                  : (isRTL ? 'حفظ التغييرات' : 'Save Changes')}
              </button>
              <Link
                href={`/${locale}/properties/${id}`}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium text-center"
              >
                {isRTL ? 'إلغاء' : 'Cancel'}
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
