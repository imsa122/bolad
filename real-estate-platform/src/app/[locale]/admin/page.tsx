'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { Building2, CalendarCheck, Users, MessageSquare, TrendingUp, Plus, Eye, ArrowRight, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import { formatPrice } from '@/lib/utils';
import dynamic from 'next/dynamic';

const AnalyticsCharts = dynamic(() => import('@/components/admin/AnalyticsCharts'), {
  ssr: false,
  loading: () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 h-48 shimmer" />
      ))}
    </div>
  ),
});

interface Stats {
  // Flat stat counters
  totalProperties: number;
  availableProperties: number;
  totalBookings: number;
  pendingBookings: number;
  totalUsers: number;
  totalContacts: number;
  // Recent data
  recentProperties: Array<{
    id: number;
    title_ar: string;
    title_en: string;
    price: number;
    type: string;
    status: string;
    city: string;
    createdAt: string;
  }>;
  recentBookings: Array<{
    id: number;
    bookingType: string;
    status: string;
    createdAt: string;
    property: { title_ar: string; title_en: string };
    user: { name: string; email: string };
  }>;
  // Chart data
  propertiesByType: Array<{ type: string; _count: { type: number } }>;
  propertiesByCity: Array<{ city: string; _count: { city: number } }>;
  bookingsByStatus: Array<{ status: string; _count: { status: number } }>;
  monthlyBookings: Array<{ month: string; count: number }>;
}

export default function AdminDashboard() {
  const locale = useLocale() as 'ar' | 'en';
  const isRTL = locale === 'ar';
  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await axios.get('/api/admin/stats');
        if (data.success) setStats(data.data);
      } catch {
        // Use mock data if API fails
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  const statCards = [
    {
      title: locale === 'ar' ? 'إجمالي العقارات' : 'Total Properties',
      value: stats?.totalProperties ?? 0,
      sub: `${stats?.availableProperties ?? 0} ${locale === 'ar' ? 'متاح' : 'available'}`,
      icon: Building2,
      color: 'bg-blue-50 text-blue-600',
      href: `/${locale}/admin/properties`,
    },
    {
      title: locale === 'ar' ? 'الحجوزات' : 'Bookings',
      value: stats?.totalBookings ?? 0,
      sub: `${stats?.pendingBookings ?? 0} ${locale === 'ar' ? 'قيد الانتظار' : 'pending'}`,
      icon: CalendarCheck,
      color: 'bg-emerald-50 text-emerald-600',
      href: `/${locale}/admin/bookings`,
    },
    {
      title: locale === 'ar' ? 'المستخدمون' : 'Users',
      value: stats?.totalUsers ?? 0,
      sub: locale === 'ar' ? 'مستخدم مسجل' : 'registered users',
      icon: Users,
      color: 'bg-purple-50 text-purple-600',
      href: `/${locale}/admin/users`,
    },
    {
      title: locale === 'ar' ? 'الرسائل' : 'Messages',
      value: stats?.totalContacts ?? 0,
      sub: locale === 'ar' ? 'رسالة واردة' : 'incoming messages',
      icon: MessageSquare,
      color: 'bg-gold-50 text-gold-600',
      href: `/${locale}/admin/contacts`,
    },
  ];

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      AVAILABLE: 'bg-emerald-100 text-emerald-700',
      SOLD: 'bg-red-100 text-red-700',
      RENTED: 'bg-blue-100 text-blue-700',
      PENDING: 'bg-yellow-100 text-yellow-700',
      CONFIRMED: 'bg-emerald-100 text-emerald-700',
      CANCELLED: 'bg-red-100 text-red-700',
      COMPLETED: 'bg-gray-100 text-gray-700',
    };
    return map[status] || 'bg-gray-100 text-gray-700';
  };

  const getStatusLabel = (status: string) => {
    const map: Record<string, { ar: string; en: string }> = {
      AVAILABLE: { ar: 'متاح', en: 'Available' },
      SOLD: { ar: 'مباع', en: 'Sold' },
      RENTED: { ar: 'مؤجر', en: 'Rented' },
      PENDING: { ar: 'قيد الانتظار', en: 'Pending' },
      CONFIRMED: { ar: 'مؤكد', en: 'Confirmed' },
      CANCELLED: { ar: 'ملغي', en: 'Cancelled' },
      COMPLETED: { ar: 'مكتمل', en: 'Completed' },
    };
    return map[status]?.[locale] || status;
  };

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark-900">
            {locale === 'ar' ? 'لوحة التحكم' : 'Dashboard'}
          </h1>
          <p className="text-dark-500 text-sm mt-1">
            {locale === 'ar' ? 'نظرة عامة على المنصة' : 'Platform overview'}
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((card) => (
          <Link
            key={card.title}
            href={card.href}
            className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`w-11 h-11 ${card.color} rounded-xl flex items-center justify-center`}>
                <card.icon className="w-5 h-5" />
              </div>
              <TrendingUp className="w-4 h-4 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            {isLoading ? (
              <div className="space-y-2">
                <div className="h-8 shimmer rounded w-16" />
                <div className="h-4 shimmer rounded w-24" />
              </div>
            ) : (
              <>
                <p className="text-3xl font-bold text-dark-900 mb-1">{card.value.toLocaleString()}</p>
                <p className="text-dark-500 text-sm">{card.title}</p>
                <p className="text-xs text-dark-400 mt-1">{card.sub}</p>
              </>
            )}
          </Link>
        ))}
      </div>

      {/* Recent Data */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Properties */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <h2 className="font-semibold text-dark-800">
              {locale === 'ar' ? 'أحدث العقارات' : 'Recent Properties'}
            </h2>
            <Link
              href={`/${locale}/admin/properties`}
              className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700"
            >
              {locale === 'ar' ? 'عرض الكل' : 'View All'}
              <ArrowIcon className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {isLoading ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 shimmer rounded-lg flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 shimmer rounded w-3/4" />
                    <div className="h-3 shimmer rounded w-1/2" />
                  </div>
                </div>
              ))
            ) : stats?.recentProperties?.length ? (
              stats.recentProperties.map((property) => (
                <div key={property.id} className="p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors">
                  <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-5 h-5 text-primary-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-dark-800 truncate">
                      {locale === 'ar' ? property.title_ar : property.title_en}
                    </p>
                    <p className="text-xs text-dark-400">
                      {formatPrice(property.price, locale, property.type as 'SALE' | 'RENT')} · {property.city}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-lg font-medium ${getStatusBadge(property.status)}`}>
                    {getStatusLabel(property.status)}
                  </span>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-dark-400 text-sm">
                {locale === 'ar' ? 'لا توجد عقارات' : 'No properties yet'}
              </div>
            )}
          </div>
        </div>

        {/* Recent Bookings */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <h2 className="font-semibold text-dark-800">
              {locale === 'ar' ? 'أحدث الحجوزات' : 'Recent Bookings'}
            </h2>
            <Link
              href={`/${locale}/admin/bookings`}
              className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700"
            >
              {locale === 'ar' ? 'عرض الكل' : 'View All'}
              <ArrowIcon className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {isLoading ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 shimmer rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 shimmer rounded w-3/4" />
                    <div className="h-3 shimmer rounded w-1/2" />
                  </div>
                </div>
              ))
            ) : stats?.recentBookings?.length ? (
              stats.recentBookings.map((booking) => (
                <div key={booking.id} className="p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors">
                  <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-emerald-600 font-bold text-sm">
                      {booking.user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-dark-800 truncate">{booking.user.name}</p>
                    <p className="text-xs text-dark-400 truncate">
                      {locale === 'ar' ? booking.property.title_ar : booking.property.title_en}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-lg font-medium ${getStatusBadge(booking.status)}`}>
                    {getStatusLabel(booking.status)}
                  </span>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-dark-400 text-sm">
                {locale === 'ar' ? 'لا توجد حجوزات' : 'No bookings yet'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Analytics Charts */}
      {!isLoading && stats && (
        <AnalyticsCharts
          propertiesByType={stats.propertiesByType ?? []}
          propertiesByCity={stats.propertiesByCity ?? []}
          bookingsByStatus={stats.bookingsByStatus ?? []}
          monthlyBookings={stats.monthlyBookings ?? []}
          locale={locale}
        />
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h2 className="font-semibold text-dark-800 mb-4">
          {locale === 'ar' ? 'إجراءات سريعة' : 'Quick Actions'}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: locale === 'ar' ? 'إضافة عقار' : 'Add Property', href: `/${locale}/admin/properties/new`, icon: Plus, color: 'bg-primary-50 text-primary-600 hover:bg-primary-100' },
            { label: locale === 'ar' ? 'العقارات' : 'Properties', href: `/${locale}/admin/properties`, icon: Building2, color: 'bg-blue-50 text-blue-600 hover:bg-blue-100' },
            { label: locale === 'ar' ? 'الحجوزات' : 'Bookings', href: `/${locale}/admin/bookings`, icon: CalendarCheck, color: 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' },
            { label: locale === 'ar' ? 'عرض الموقع' : 'View Site', href: `/${locale}`, icon: Eye, color: 'bg-gray-50 text-gray-600 hover:bg-gray-100' },
          ].map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-colors ${action.color}`}
            >
              <action.icon className="w-5 h-5" />
              <span className="text-xs font-medium text-center">{action.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
