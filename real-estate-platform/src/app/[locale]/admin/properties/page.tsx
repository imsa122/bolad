'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useLocale } from 'next-intl';
import { Plus, Pencil, Trash2, Eye, Search, Loader2, Building2 } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { formatPrice, getImageUrl } from '@/lib/utils';
import type { Property } from '@/types';

export default function AdminPropertiesPage() {
  const locale = useLocale() as 'ar' | 'en';
  const isRTL = locale === 'ar';

  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchProperties = useCallback(async () => {
    setIsLoading(true);
    try {
      // Pass status=ALL to get all properties regardless of status for admin
      const { data } = await axios.get('/api/properties', {
        params: { search, limit: 50, status: 'ALL' },
      });
      if (data.success) {
        // API returns { data: { data: [...], pagination: {...} } }
        setProperties(data.data?.data || data.data || []);
      }
    } catch {
      toast.error(locale === 'ar' ? 'فشل تحميل العقارات' : 'Failed to load properties');
    } finally {
      setIsLoading(false);
    }
  }, [search, locale]);

  useEffect(() => {
    const timer = setTimeout(fetchProperties, 300);
    return () => clearTimeout(timer);
  }, [fetchProperties]);

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm(
      locale === 'ar'
        ? 'هل أنت متأكد من حذف هذا العقار؟'
        : 'Are you sure you want to delete this property?'
    );
    if (!confirmed) return;

    setDeletingId(id);
    try {
      await axios.delete(`/api/properties/${id}`);
      toast.success(locale === 'ar' ? 'تم حذف العقار بنجاح' : 'Property deleted successfully');
      setProperties((prev) => prev.filter((p) => p.id !== id));
    } catch {
      toast.error(locale === 'ar' ? 'فشل حذف العقار' : 'Failed to delete property');
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { class: string; label: { ar: string; en: string } }> = {
      AVAILABLE: { class: 'bg-emerald-100 text-emerald-700', label: { ar: 'متاح', en: 'Available' } },
      SOLD: { class: 'bg-red-100 text-red-700', label: { ar: 'مباع', en: 'Sold' } },
      RENTED: { class: 'bg-blue-100 text-blue-700', label: { ar: 'مؤجر', en: 'Rented' } },
      PENDING: { class: 'bg-yellow-100 text-yellow-700', label: { ar: 'قيد المراجعة', en: 'Pending' } },
    };
    const s = map[status] || { class: 'bg-gray-100 text-gray-700', label: { ar: status, en: status } };
    return { class: s.class, label: s.label[locale] };
  };

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark-900">
            {locale === 'ar' ? 'إدارة العقارات' : 'Manage Properties'}
          </h1>
          <p className="text-dark-500 text-sm mt-1">
            {properties.length} {locale === 'ar' ? 'عقار' : 'properties'}
          </p>
        </div>
        <Link
          href={`/${locale}/admin/properties/new`}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-medium transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" />
          {locale === 'ar' ? 'إضافة عقار' : 'Add Property'}
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={locale === 'ar' ? 'البحث في العقارات...' : 'Search properties...'}
          className="w-full ps-10 pe-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-8 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
          </div>
        ) : properties.length === 0 ? (
          <div className="p-12 text-center">
            <Building2 className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-dark-400">
              {locale === 'ar' ? 'لا توجد عقارات' : 'No properties found'}
            </p>
            <Link
              href={`/${locale}/admin/properties/new`}
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              {locale === 'ar' ? 'أضف أول عقار' : 'Add First Property'}
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-start px-4 py-3 text-xs font-semibold text-dark-500 uppercase tracking-wider">
                    {locale === 'ar' ? 'العقار' : 'Property'}
                  </th>
                  <th className="text-start px-4 py-3 text-xs font-semibold text-dark-500 uppercase tracking-wider hidden md:table-cell">
                    {locale === 'ar' ? 'المدينة' : 'City'}
                  </th>
                  <th className="text-start px-4 py-3 text-xs font-semibold text-dark-500 uppercase tracking-wider hidden sm:table-cell">
                    {locale === 'ar' ? 'السعر' : 'Price'}
                  </th>
                  <th className="text-start px-4 py-3 text-xs font-semibold text-dark-500 uppercase tracking-wider">
                    {locale === 'ar' ? 'الحالة' : 'Status'}
                  </th>
                  <th className="text-start px-4 py-3 text-xs font-semibold text-dark-500 uppercase tracking-wider">
                    {locale === 'ar' ? 'الإجراءات' : 'Actions'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {properties.map((property) => {
                  const status = getStatusBadge(property.status);
                  const title = locale === 'ar' ? property.title_ar : property.title_en;
                  const mainImage = property.images?.[0];

                  return (
                    <tr key={property.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                            {mainImage ? (
                              <Image
                                src={getImageUrl(mainImage)}
                                alt={title}
                                width={48}
                                height={48}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Building2 className="w-5 h-5 text-gray-300" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-dark-800 truncate max-w-[200px]">{title}</p>
                            <p className="text-xs text-dark-400">
                              {property.type === 'SALE'
                                ? (locale === 'ar' ? 'للبيع' : 'For Sale')
                                : (locale === 'ar' ? 'للإيجار' : 'For Rent')}
                              {' · '}
                              {property.bedrooms > 0 && `${property.bedrooms} ${locale === 'ar' ? 'غرف' : 'beds'}`}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-sm text-dark-600">{property.city}</span>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className="text-sm font-medium text-primary-700">
                          {formatPrice(property.price, locale, property.type)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2.5 py-1 rounded-lg font-medium ${status.class}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Link
                            href={`/${locale}/properties/${property.id}`}
                            target="_blank"
                            className="p-1.5 text-dark-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                            title={locale === 'ar' ? 'عرض' : 'View'}
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <Link
                            href={`/${locale}/admin/properties/${property.id}/edit`}
                            className="p-1.5 text-dark-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title={locale === 'ar' ? 'تعديل' : 'Edit'}
                          >
                            <Pencil className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(property.id)}
                            disabled={deletingId === property.id}
                            className="p-1.5 text-dark-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            title={locale === 'ar' ? 'حذف' : 'Delete'}
                          >
                            {deletingId === property.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
