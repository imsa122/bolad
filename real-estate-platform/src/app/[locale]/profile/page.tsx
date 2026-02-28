'use client';

import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import {
  User, Mail, Shield, Building2, BookOpen, LogOut, Loader2,
  Edit2, Eye, Trash2, Plus, Clock, CheckCircle, XCircle, AlertCircle,
  Home
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface UserBooking {
  id: number;
  bookingType: string;
  status: string;
  createdAt: string;
  property: {
    id: number;
    title_ar: string;
    title_en: string;
    city: string;
    price: number;
    type: string;
  };
}

interface MyProperty {
  id: number;
  title_ar: string;
  title_en: string;
  city: string;
  price: number;
  type: string;
  status: string;
  bedrooms: number;
  area: number;
  images: string[];
  lastEditedAt?: string;
  createdAt: string;
}

type Tab = 'bookings' | 'properties';

export default function ProfilePage() {
  const locale = useLocale() as 'ar' | 'en';
  const router = useRouter();
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const isRTL = locale === 'ar';

  const [activeTab, setActiveTab] = useState<Tab>('bookings');
  const [bookings, setBookings] = useState<UserBooking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [myProperties, setMyProperties] = useState<MyProperty[]>([]);
  const [propertiesLoading, setPropertiesLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(`/${locale}/auth/login`);
    }
  }, [isLoading, isAuthenticated, locale, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchBookings();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated && activeTab === 'properties') {
      fetchMyProperties();
    }
  }, [isAuthenticated, activeTab]);

  const fetchBookings = async () => {
    try {
      const { data } = await axios.get('/api/bookings');
      if (data.success) {
        setBookings(data.data?.data || []);
      }
    } catch {
      // Silently fail
    } finally {
      setBookingsLoading(false);
    }
  };

  const fetchMyProperties = async () => {
    setPropertiesLoading(true);
    try {
      const { data } = await axios.get('/api/properties/my');
      if (data.success) {
        setMyProperties(data.data?.data || []);
      }
    } catch {
      toast.error(isRTL ? 'فشل تحميل عقاراتك' : 'Failed to load your properties');
    } finally {
      setPropertiesLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    toast.success(locale === 'ar' ? 'تم تسجيل الخروج بنجاح' : 'Logged out successfully');
    router.push(`/${locale}`);
  };

  const handleDeleteProperty = async (id: number) => {
    const confirmed = window.confirm(
      isRTL
        ? 'هل أنت متأكد من حذف هذا العقار؟ لا يمكن التراجع عن هذا الإجراء.'
        : 'Are you sure you want to delete this property? This action cannot be undone.'
    );
    if (!confirmed) return;

    setDeletingId(id);
    try {
      await axios.delete(`/api/properties/${id}`);
      setMyProperties((prev) => prev.filter((p) => p.id !== id));
      toast.success(isRTL ? 'تم حذف العقار بنجاح' : 'Property deleted successfully');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error.response?.data?.error || (isRTL ? 'فشل حذف العقار' : 'Failed to delete property'));
    } finally {
      setDeletingId(null);
    }
  };

  const canEditProperty = (property: MyProperty): boolean => {
    if (!property.lastEditedAt) return true;
    const timeSince = Date.now() - new Date(property.lastEditedAt).getTime();
    return timeSince >= 24 * 60 * 60 * 1000;
  };

  const getNextEditTime = (property: MyProperty): string => {
    if (!property.lastEditedAt) return '';
    const nextEdit = new Date(new Date(property.lastEditedAt).getTime() + 24 * 60 * 60 * 1000);
    return nextEdit.toLocaleString(isRTL ? 'ar-SA' : 'en-US');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED': case 'AVAILABLE': return 'bg-green-100 text-green-700';
      case 'PENDING': return 'bg-yellow-100 text-yellow-700';
      case 'CANCELLED': case 'SOLD': case 'RENTED': return 'bg-red-100 text-red-700';
      case 'COMPLETED': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, { ar: string; en: string }> = {
      PENDING: { ar: 'قيد المراجعة', en: 'Pending' },
      CONFIRMED: { ar: 'مؤكد', en: 'Confirmed' },
      CANCELLED: { ar: 'ملغي', en: 'Cancelled' },
      COMPLETED: { ar: 'مكتمل', en: 'Completed' },
      AVAILABLE: { ar: 'متاح', en: 'Available' },
      SOLD: { ar: 'مباع', en: 'Sold' },
      RENTED: { ar: 'مؤجر', en: 'Rented' },
    };
    return labels[status]?.[locale] || status;
  };

  const getBookingTypeLabel = (type: string) => {
    const labels: Record<string, { ar: string; en: string }> = {
      VISIT: { ar: 'زيارة', en: 'Visit' },
      INQUIRY: { ar: 'استفسار', en: 'Inquiry' },
      PURCHASE: { ar: 'شراء', en: 'Purchase' },
      RENTAL: { ar: 'إيجار', en: 'Rental' },
    };
    return labels[type]?.[locale] || type;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!isAuthenticated || !user) return null;

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-dark-900">
            {isRTL ? 'الملف الشخصي' : 'My Profile'}
          </h1>
          <p className="text-dark-500 mt-1">
            {isRTL ? 'إدارة معلوماتك وعقاراتك وحجوزاتك' : 'Manage your info, properties and bookings'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Sidebar ── */}
          <div className="lg:col-span-1 space-y-4">
            {/* Profile Card */}
            <div className="bg-white rounded-2xl shadow-card p-6">
              <div className="flex flex-col items-center text-center mb-6">
                <div className="w-20 h-20 bg-primary-600 rounded-full flex items-center justify-center text-white text-3xl font-bold mb-4">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <h2 className="text-xl font-bold text-dark-900">{user.name}</h2>
                <span className={cn(
                  'mt-2 px-3 py-1 rounded-full text-xs font-medium',
                  user.role === 'ADMIN'
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-primary-100 text-primary-700'
                )}>
                  {user.role === 'ADMIN'
                    ? (isRTL ? 'مدير النظام' : 'Administrator')
                    : (isRTL ? 'مستخدم' : 'User')}
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm text-dark-600">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Mail className="w-4 h-4 text-dark-500" />
                  </div>
                  <span className="truncate">{user.email}</span>
                </div>
                {user.role === 'ADMIN' && (
                  <div className="flex items-center gap-3 text-sm text-dark-600">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Shield className="w-4 h-4 text-purple-600" />
                    </div>
                    <span>{isRTL ? 'صلاحيات المدير' : 'Admin Privileges'}</span>
                  </div>
                )}
              </div>

              <div className="mt-6 space-y-2">
                {user.role === 'ADMIN' && (
                  <button
                    onClick={() => router.push(`/${locale}/admin`)}
                    className="flex items-center justify-center gap-2 w-full py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-medium transition-colors"
                  >
                    <Shield className="w-4 h-4" />
                    {isRTL ? 'لوحة التحكم' : 'Admin Dashboard'}
                  </button>
                )}
                <button
                  onClick={() => router.push(`/${locale}/properties/new`)}
                  className="flex items-center justify-center gap-2 w-full py-2.5 bg-primary-50 hover:bg-primary-100 text-primary-700 rounded-xl text-sm font-medium transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  {isRTL ? 'إضافة عقار جديد' : 'Add New Property'}
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center justify-center gap-2 w-full py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-sm font-medium transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  {isRTL ? 'تسجيل الخروج' : 'Logout'}
                </button>
              </div>
            </div>

            {/* Stats Card */}
            <div className="bg-white rounded-2xl shadow-card p-5">
              <h3 className="text-sm font-semibold text-dark-700 mb-4">
                {isRTL ? 'إحصائياتي' : 'My Stats'}
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-primary-50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-primary-700">{myProperties.length}</p>
                  <p className="text-xs text-primary-600 mt-0.5">{isRTL ? 'عقاراتي' : 'Properties'}</p>
                </div>
                <div className="bg-gold-50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-gold-700">{bookings.length}</p>
                  <p className="text-xs text-gold-600 mt-0.5">{isRTL ? 'حجوزاتي' : 'Bookings'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Main Content ── */}
          <div className="lg:col-span-2">
            {/* Tabs */}
            <div className="flex bg-white rounded-2xl shadow-card p-1.5 mb-4">
              <button
                onClick={() => setActiveTab('bookings')}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all',
                  activeTab === 'bookings'
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'text-dark-600 hover:bg-gray-50'
                )}
              >
                <BookOpen className="w-4 h-4" />
                {isRTL ? 'حجوزاتي' : 'My Bookings'}
                {bookings.length > 0 && (
                  <span className={cn(
                    'text-xs px-1.5 py-0.5 rounded-full',
                    activeTab === 'bookings' ? 'bg-white/20 text-white' : 'bg-primary-100 text-primary-700'
                  )}>
                    {bookings.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('properties')}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all',
                  activeTab === 'properties'
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'text-dark-600 hover:bg-gray-50'
                )}
              >
                <Home className="w-4 h-4" />
                {isRTL ? 'عقاراتي' : 'My Properties'}
                {myProperties.length > 0 && (
                  <span className={cn(
                    'text-xs px-1.5 py-0.5 rounded-full',
                    activeTab === 'properties' ? 'bg-white/20 text-white' : 'bg-primary-100 text-primary-700'
                  )}>
                    {myProperties.length}
                  </span>
                )}
              </button>
            </div>

            {/* ── Bookings Tab ── */}
            {activeTab === 'bookings' && (
              <div className="bg-white rounded-2xl shadow-card p-6">
                <div className="flex items-center gap-2 mb-6">
                  <BookOpen className="w-5 h-5 text-primary-600" />
                  <h3 className="text-lg font-bold text-dark-900">
                    {isRTL ? 'حجوزاتي' : 'My Bookings'}
                  </h3>
                </div>

                {bookingsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
                  </div>
                ) : bookings.length === 0 ? (
                  <div className="text-center py-12">
                    <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-dark-500 font-medium">
                      {isRTL ? 'لا توجد حجوزات بعد' : 'No bookings yet'}
                    </p>
                    <p className="text-dark-400 text-sm mt-1">
                      {isRTL ? 'تصفح العقارات وقم بحجز زيارة' : 'Browse properties and book a visit'}
                    </p>
                    <button
                      onClick={() => router.push(`/${locale}/properties`)}
                      className="mt-4 px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-medium transition-colors"
                    >
                      {isRTL ? 'تصفح العقارات' : 'Browse Properties'}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {bookings.map((booking) => (
                      <div
                        key={booking.id}
                        className="border border-gray-100 rounded-xl p-4 hover:border-primary-200 hover:bg-primary-50/30 transition-all cursor-pointer"
                        onClick={() => router.push(`/${locale}/properties/${booking.property.id}`)}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-dark-900 truncate">
                              {isRTL ? booking.property.title_ar : booking.property.title_en}
                            </h4>
                            <p className="text-sm text-dark-500 mt-0.5">{booking.property.city}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-xs bg-gray-100 text-dark-600 px-2 py-0.5 rounded-full">
                                {getBookingTypeLabel(booking.bookingType)}
                              </span>
                              <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', getStatusColor(booking.status))}>
                                {getStatusLabel(booking.status)}
                              </span>
                            </div>
                          </div>
                          <div className="text-end flex-shrink-0">
                            <p className="font-bold text-primary-700">
                              {Number(booking.property.price).toLocaleString()} {isRTL ? 'ر.س' : 'SAR'}
                            </p>
                            <p className="text-xs text-dark-400 mt-1">
                              {new Date(booking.createdAt).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US')}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── My Properties Tab ── */}
            {activeTab === 'properties' && (
              <div className="bg-white rounded-2xl shadow-card p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <Home className="w-5 h-5 text-primary-600" />
                    <h3 className="text-lg font-bold text-dark-900">
                      {isRTL ? 'عقاراتي' : 'My Properties'}
                    </h3>
                  </div>
                  <Link
                    href={`/${locale}/properties/new`}
                    className="flex items-center gap-1.5 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-medium transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    {isRTL ? 'إضافة عقار' : 'Add Property'}
                  </Link>
                </div>

                {/* Edit cooldown notice */}
                <div className="mb-4 p-3 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-2 text-sm text-amber-700">
                  <Clock className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>
                    {isRTL
                      ? 'يمكنك تعديل كل عقار مرة واحدة كل 24 ساعة'
                      : 'You can edit each property once every 24 hours'}
                  </span>
                </div>

                {propertiesLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
                  </div>
                ) : myProperties.length === 0 ? (
                  <div className="text-center py-12">
                    <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-dark-500 font-medium">
                      {isRTL ? 'لم تضف أي عقارات بعد' : 'No properties added yet'}
                    </p>
                    <p className="text-dark-400 text-sm mt-1">
                      {isRTL ? 'أضف عقارك الأول الآن' : 'Add your first property now'}
                    </p>
                    <Link
                      href={`/${locale}/properties/new`}
                      className="inline-flex items-center gap-2 mt-4 px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-medium transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      {isRTL ? 'إضافة عقار' : 'Add Property'}
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {myProperties.map((property) => {
                      const canEdit = canEditProperty(property);
                      const nextEdit = !canEdit ? getNextEditTime(property) : '';
                      const thumbnail = property.images?.[0];

                      return (
                        <div
                          key={property.id}
                          className="border border-gray-100 rounded-xl p-4 hover:border-gray-200 transition-all"
                        >
                          <div className="flex items-start gap-4">
                            {/* Thumbnail */}
                            <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                              {thumbnail ? (
                                <img
                                  src={thumbnail}
                                  alt={isRTL ? property.title_ar : property.title_en}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Building2 className="w-8 h-8 text-gray-300" />
                                </div>
                              )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <h4 className="font-semibold text-dark-900 truncate">
                                    {isRTL ? property.title_ar : property.title_en}
                                  </h4>
                                  <p className="text-sm text-dark-500 mt-0.5">{property.city}</p>
                                </div>
                                <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0', getStatusColor(property.status))}>
                                  {getStatusLabel(property.status)}
                                </span>
                              </div>

                              <div className="flex items-center gap-3 mt-2 text-sm text-dark-600">
                                <span className="font-bold text-primary-700">
                                  {Number(property.price).toLocaleString()} {isRTL ? 'ر.س' : 'SAR'}
                                </span>
                                <span className="text-gray-300">•</span>
                                <span>{property.bedrooms} {isRTL ? 'غرف' : 'beds'}</span>
                                <span className="text-gray-300">•</span>
                                <span>{property.area} {isRTL ? 'م²' : 'm²'}</span>
                              </div>

                              {/* Cooldown indicator */}
                              {!canEdit && (
                                <div className="flex items-center gap-1.5 mt-2 text-xs text-amber-600">
                                  <Clock className="w-3.5 h-3.5" />
                                  <span>
                                    {isRTL
                                      ? `التعديل متاح في: ${nextEdit}`
                                      : `Edit available at: ${nextEdit}`}
                                  </span>
                                </div>
                              )}
                              {canEdit && property.lastEditedAt && (
                                <div className="flex items-center gap-1.5 mt-2 text-xs text-green-600">
                                  <CheckCircle className="w-3.5 h-3.5" />
                                  <span>{isRTL ? 'التعديل متاح الآن' : 'Edit available now'}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-50">
                            <Link
                              href={`/${locale}/properties/${property.id}`}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-dark-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              {isRTL ? 'عرض' : 'View'}
                            </Link>

                            {canEdit ? (
                              <Link
                                href={`/${locale}/properties/${property.id}/edit`}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                                {isRTL ? 'تعديل' : 'Edit'}
                              </Link>
                            ) : (
                              <button
                                disabled
                                title={isRTL ? `التعديل متاح في: ${nextEdit}` : `Edit available at: ${nextEdit}`}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-400 bg-gray-50 rounded-lg cursor-not-allowed"
                              >
                                <Clock className="w-3.5 h-3.5" />
                                {isRTL ? 'انتظر 24 ساعة' : 'Wait 24h'}
                              </button>
                            )}

                            <button
                              onClick={() => handleDeleteProperty(property.id)}
                              disabled={deletingId === property.id}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50 ms-auto"
                            >
                              {deletingId === property.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="w-3.5 h-3.5" />
                              )}
                              {isRTL ? 'حذف' : 'Delete'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
