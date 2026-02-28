import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { CheckCircle2, Calendar, Building2, ArrowLeft, ArrowRight, Phone, Mail } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { getServerAuthUser } from '@/lib/auth';
import { formatDate, formatPrice } from '@/lib/utils';

type Props = { params: { locale: string; id: string } };

export default async function BookingConfirmationPage({ params: { locale, id } }: Props) {
  const bookingId = parseInt(id);
  if (isNaN(bookingId)) notFound();

  const authUser = await getServerAuthUser();
  if (!authUser) notFound();

  const t = await getTranslations({ locale, namespace: 'booking' });
  const isRTL = locale === 'ar';
  const ArrowIcon = isRTL ? ArrowRight : ArrowLeft;

  let booking;
  try {
    booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        userId: authUser.userId,
      },
      include: {
        property: true,
        user: { select: { id: true, name: true, email: true, phone: true } },
      },
    });
  } catch {
    notFound();
  }

  if (!booking) notFound();

  const property = booking.property;
  const propertyTitle = locale === 'ar' ? property.title_ar : property.title_en;

  const bookingTypeLabel: Record<string, { ar: string; en: string }> = {
    VISIT: { ar: 'زيارة العقار', en: 'Property Visit' },
    INQUIRY: { ar: 'استفسار', en: 'Inquiry' },
    PURCHASE: { ar: 'شراء', en: 'Purchase' },
    RENTAL: { ar: 'إيجار', en: 'Rental' },
  };

  const statusConfig: Record<string, { class: string; label: { ar: string; en: string } }> = {
    PENDING: { class: 'bg-yellow-100 text-yellow-700 border-yellow-200', label: { ar: 'قيد الانتظار', en: 'Pending Review' } },
    CONFIRMED: { class: 'bg-emerald-100 text-emerald-700 border-emerald-200', label: { ar: 'مؤكد', en: 'Confirmed' } },
    CANCELLED: { class: 'bg-red-100 text-red-700 border-red-200', label: { ar: 'ملغي', en: 'Cancelled' } },
    COMPLETED: { class: 'bg-gray-100 text-gray-700 border-gray-200', label: { ar: 'مكتمل', en: 'Completed' } },
  };

  const sc = statusConfig[booking.status] || statusConfig.PENDING;

  return (
    <div className="min-h-screen bg-gray-50 py-12" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Back Button */}
        <Link
          href={`/${locale}/properties`}
          className="inline-flex items-center gap-2 text-dark-500 hover:text-primary-600 text-sm mb-8 transition-colors"
        >
          <ArrowIcon className="w-4 h-4" />
          {locale === 'ar' ? 'العودة للعقارات' : 'Back to Properties'}
        </Link>

        {/* Success Card */}
        <div className="bg-white rounded-3xl shadow-card overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-br from-primary-600 to-primary-800 p-8 text-center text-white">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold mb-2">{t('confirmation.title')}</h1>
            <p className="text-white/80">{t('confirmation.subtitle')}</p>
            <div className="mt-4 inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 text-sm">
              <span className="text-white/70">{locale === 'ar' ? 'رقم الحجز:' : 'Booking ID:'}</span>
              <span className="font-bold">#{booking.id.toString().padStart(6, '0')}</span>
            </div>
          </div>

          {/* Booking Details */}
          <div className="p-6 space-y-5">
            {/* Status */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <span className="text-sm font-medium text-dark-600">
                {locale === 'ar' ? 'حالة الطلب' : 'Request Status'}
              </span>
              <span className={`text-sm font-semibold px-3 py-1 rounded-full border ${sc.class}`}>
                {sc.label[locale as 'ar' | 'en']}
              </span>
            </div>

            {/* Property Info */}
            <div className="border border-gray-100 rounded-xl overflow-hidden">
              <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-100">
                <p className="text-xs font-semibold text-dark-500 uppercase tracking-wider">
                  {locale === 'ar' ? 'تفاصيل العقار' : 'Property Details'}
                </p>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <Building2 className="w-5 h-5 text-primary-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-dark-800">{propertyTitle}</p>
                    <p className="text-sm text-dark-500">{property.city}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-dark-500">{locale === 'ar' ? 'السعر' : 'Price'}</span>
                  <span className="font-semibold text-primary-700">
                    {formatPrice(Number(property.price), locale as 'ar' | 'en', property.type as 'SALE' | 'RENT')}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-dark-500">{locale === 'ar' ? 'نوع الطلب' : 'Request Type'}</span>
                  <span className="font-medium text-dark-700">
                    {bookingTypeLabel[booking.bookingType]?.[locale as 'ar' | 'en'] || booking.bookingType}
                  </span>
                </div>
              </div>
            </div>

            {/* Booking Info */}
            <div className="border border-gray-100 rounded-xl overflow-hidden">
              <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-100">
                <p className="text-xs font-semibold text-dark-500 uppercase tracking-wider">
                  {locale === 'ar' ? 'تفاصيل الحجز' : 'Booking Details'}
                </p>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-dark-500">{locale === 'ar' ? 'تاريخ الطلب' : 'Request Date'}</span>
                  <span className="font-medium text-dark-700">
                    {formatDate(booking.createdAt, locale as 'ar' | 'en')}
                  </span>
                </div>
                {booking.visitDate && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-primary-500" />
                    <span className="text-dark-500">{locale === 'ar' ? 'موعد الزيارة:' : 'Visit Date:'}</span>
                    <span className="font-medium text-dark-700">
                      {formatDate(booking.visitDate, locale as 'ar' | 'en')}
                    </span>
                  </div>
                )}
                {booking.message && (
                  <div className="text-sm">
                    <p className="text-dark-500 mb-1">{locale === 'ar' ? 'الرسالة:' : 'Message:'}</p>
                    <p className="text-dark-700 bg-gray-50 rounded-lg p-3">{booking.message}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Contact Info */}
            <div className="bg-primary-50 border border-primary-100 rounded-xl p-4">
              <p className="text-sm font-semibold text-primary-800 mb-3">
                {locale === 'ar' ? 'سنتواصل معك قريباً' : 'We will contact you soon'}
              </p>
              <div className="space-y-2">
                <a href="tel:+966110000000" className="flex items-center gap-2 text-sm text-primary-700 hover:text-primary-800">
                  <Phone className="w-4 h-4" />
                  <span dir="ltr">+966561201529</span>
                </a>
                <a href="mailto:info@realestate.sa" className="flex items-center gap-2 text-sm text-primary-700 hover:text-primary-800">
                  <Mail className="w-4 h-4" />
                  <span>info@realestate.sa</span>
                </a>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link
                href={`/${locale}/properties/${property.id}`}
                className="flex-1 flex items-center justify-center gap-2 py-3 border border-gray-200 text-dark-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                <Building2 className="w-4 h-4" />
                {locale === 'ar' ? 'عرض العقار' : 'View Property'}
              </Link>
              <Link
                href={`/${locale}/properties`}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-medium transition-colors"
              >
                {locale === 'ar' ? 'استعرض المزيد' : 'Browse More'}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
