'use client';

import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { CalendarCheck, Loader2, CheckCircle, XCircle, Clock } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { formatDate } from '@/lib/utils';
import type { Booking } from '@/types';

export default function AdminBookingsPage() {
  const locale = useLocale() as 'ar' | 'en';
  const isRTL = locale === 'ar';

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  useEffect(() => {
    const fetchBookings = async () => {
      setIsLoading(true);
      try {
        const { data } = await axios.get('/api/bookings', {
          params: { status: statusFilter || undefined, limit: 50 },
        });
        // API returns { success, data: { data: [...], pagination: {} } }
        if (data.success) setBookings(data.data?.data || data.data || []);
      } catch {
        toast.error(locale === 'ar' ? 'فشل تحميل الحجوزات' : 'Failed to load bookings');
      } finally {
        setIsLoading(false);
      }
    };
    fetchBookings();
  }, [statusFilter, locale]);

  const updateStatus = async (id: number, status: string) => {
    setUpdatingId(id);
    try {
      await axios.patch(`/api/bookings/${id}`, { status });
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status: status as Booking['status'] } : b))
      );
      toast.success(locale === 'ar' ? 'تم تحديث الحالة' : 'Status updated');
    } catch {
      toast.error(locale === 'ar' ? 'فشل التحديث' : 'Update failed');
    } finally {
      setUpdatingId(null);
    }
  };

  const statusConfig: Record<string, { class: string; label: { ar: string; en: string }; icon: React.ElementType }> = {
    PENDING: { class: 'bg-yellow-100 text-yellow-700', label: { ar: 'قيد الانتظار', en: 'Pending' }, icon: Clock },
    CONFIRMED: { class: 'bg-emerald-100 text-emerald-700', label: { ar: 'مؤكد', en: 'Confirmed' }, icon: CheckCircle },
    CANCELLED: { class: 'bg-red-100 text-red-700', label: { ar: 'ملغي', en: 'Cancelled' }, icon: XCircle },
    COMPLETED: { class: 'bg-gray-100 text-gray-700', label: { ar: 'مكتمل', en: 'Completed' }, icon: CheckCircle },
  };

  const bookingTypeLabel: Record<string, { ar: string; en: string }> = {
    VISIT: { ar: 'زيارة', en: 'Visit' },
    INQUIRY: { ar: 'استفسار', en: 'Inquiry' },
    PURCHASE: { ar: 'شراء', en: 'Purchase' },
    RENTAL: { ar: 'إيجار', en: 'Rental' },
  };

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark-900">
            {locale === 'ar' ? 'إدارة الحجوزات' : 'Manage Bookings'}
          </h1>
          <p className="text-dark-500 text-sm mt-1">
            {bookings.length} {locale === 'ar' ? 'حجز' : 'bookings'}
          </p>
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
        >
          <option value="">{locale === 'ar' ? 'جميع الحالات' : 'All Statuses'}</option>
          <option value="PENDING">{locale === 'ar' ? 'قيد الانتظار' : 'Pending'}</option>
          <option value="CONFIRMED">{locale === 'ar' ? 'مؤكد' : 'Confirmed'}</option>
          <option value="CANCELLED">{locale === 'ar' ? 'ملغي' : 'Cancelled'}</option>
          <option value="COMPLETED">{locale === 'ar' ? 'مكتمل' : 'Completed'}</option>
        </select>
      </div>

      {/* Bookings List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-8 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
          </div>
        ) : bookings.length === 0 ? (
          <div className="p-12 text-center">
            <CalendarCheck className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-dark-400">
              {locale === 'ar' ? 'لا توجد حجوزات' : 'No bookings found'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-start px-4 py-3 text-xs font-semibold text-dark-500 uppercase tracking-wider">
                    {locale === 'ar' ? 'المستخدم' : 'User'}
                  </th>
                  <th className="text-start px-4 py-3 text-xs font-semibold text-dark-500 uppercase tracking-wider hidden md:table-cell">
                    {locale === 'ar' ? 'العقار' : 'Property'}
                  </th>
                  <th className="text-start px-4 py-3 text-xs font-semibold text-dark-500 uppercase tracking-wider hidden sm:table-cell">
                    {locale === 'ar' ? 'النوع' : 'Type'}
                  </th>
                  <th className="text-start px-4 py-3 text-xs font-semibold text-dark-500 uppercase tracking-wider">
                    {locale === 'ar' ? 'الحالة' : 'Status'}
                  </th>
                  <th className="text-start px-4 py-3 text-xs font-semibold text-dark-500 uppercase tracking-wider hidden lg:table-cell">
                    {locale === 'ar' ? 'التاريخ' : 'Date'}
                  </th>
                  <th className="text-start px-4 py-3 text-xs font-semibold text-dark-500 uppercase tracking-wider">
                    {locale === 'ar' ? 'الإجراءات' : 'Actions'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {bookings.map((booking) => {
                  const sc = statusConfig[booking.status] || statusConfig.PENDING;
                  const StatusIcon = sc.icon;
                  const isUpdating = updatingId === booking.id;

                  return (
                    <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-primary-700 font-bold text-xs">
                              {booking.user?.name?.charAt(0).toUpperCase() || '?'}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-dark-800 truncate">{booking.user?.name}</p>
                            <p className="text-xs text-dark-400 truncate">{booking.user?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <p className="text-sm text-dark-700 truncate max-w-[180px]">
                          {locale === 'ar'
                            ? booking.property?.title_ar
                            : booking.property?.title_en}
                        </p>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-lg">
                          {bookingTypeLabel[booking.bookingType]?.[locale] || booking.bookingType}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-medium ${sc.class}`}>
                          <StatusIcon className="w-3 h-3" />
                          {sc.label[locale]}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className="text-xs text-dark-400">
                          {formatDate(booking.createdAt, locale)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {booking.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => updateStatus(booking.id, 'CONFIRMED')}
                                disabled={isUpdating}
                                className="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors disabled:opacity-50 text-xs"
                                title={locale === 'ar' ? 'تأكيد' : 'Confirm'}
                              >
                                {isUpdating ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <CheckCircle className="w-4 h-4" />
                                )}
                              </button>
                              <button
                                onClick={() => updateStatus(booking.id, 'CANCELLED')}
                                disabled={isUpdating}
                                className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                title={locale === 'ar' ? 'إلغاء' : 'Cancel'}
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          {booking.status === 'CONFIRMED' && (
                            <button
                              onClick={() => updateStatus(booking.id, 'COMPLETED')}
                              disabled={isUpdating}
                              className="px-2.5 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors disabled:opacity-50"
                            >
                              {locale === 'ar' ? 'إتمام' : 'Complete'}
                            </button>
                          )}
                          {(booking.status === 'CANCELLED' || booking.status === 'COMPLETED') && (
                            <span className="text-xs text-dark-300">—</span>
                          )}
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
