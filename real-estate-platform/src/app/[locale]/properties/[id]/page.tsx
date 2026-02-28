import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import {
  Bed, Bath, Maximize2, MapPin, Eye, Calendar, Hash,
  Phone, ArrowLeft, ArrowRight, CheckCircle2, User
} from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { formatPrice, formatArea, formatDate, getImageUrl, getPropertyTypeLabel, getPropertyStatusLabel } from '@/lib/utils';
import PropertyCard from '@/components/properties/PropertyCard';
import BookingForm from '@/components/properties/BookingForm';
import dynamic from 'next/dynamic';
import type { Property } from '@/types';

// ── Owner type ──────────────────────────────────────────────────
type PropertyOwner = { id: number; name: string; phone: string | null };
type PropertyWithOwner = Property & { owner?: PropertyOwner | null };

// Dynamically import client-only components
const ShareButtons = dynamic(() => import('@/components/properties/ShareButtons'), {
  ssr: false,
  loading: () => <div className="h-12 bg-gray-100 rounded-xl animate-pulse" />,
});

// Dynamically import map to avoid SSR issues
const PropertyMap = dynamic(() => import('@/components/maps/PropertyMap'), {
  ssr: false,
  loading: () => <div className="h-80 bg-gray-100 rounded-2xl animate-pulse" />,
});

type Props = { params: { locale: string; id: string } };

async function getProperty(id: number): Promise<PropertyWithOwner | null> {
  try {
    const property = await prisma.property.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true, phone: true } },
      },
    });
    if (!property) return null;
    return {
      ...property,
      images: typeof property.images === 'string' ? JSON.parse(property.images) : (property.images as string[]),
      amenities: typeof property.amenities === 'string' ? JSON.parse(property.amenities) : (property.amenities as string[]),
      price: Number(property.price),
      area: Number(property.area),
    } as PropertyWithOwner;
  } catch {
    return null;
  }
}

async function getSimilarProperties(property: Property): Promise<Property[]> {
  try {
    const similar = await prisma.property.findMany({
      where: {
        id: { not: property.id },
        city: property.city,
        type: property.type,
        status: 'AVAILABLE',
      },
      take: 3,
      orderBy: { createdAt: 'desc' },
    });
    return similar.map((p) => ({
      ...p,
      images: typeof p.images === 'string' ? JSON.parse(p.images) : (p.images as string[]),
      amenities: typeof p.amenities === 'string' ? JSON.parse(p.amenities) : (p.amenities as string[]),
      price: Number(p.price),
      area: Number(p.area),
    })) as Property[];
  } catch {
    return [];
  }
}

export async function generateMetadata({ params: { locale, id } }: Props): Promise<Metadata> {
  const property = await getProperty(parseInt(id));
  if (!property) return { title: 'Property Not Found' };

  const title = locale === 'ar' ? property.title_ar : property.title_en;
  const description = locale === 'ar' ? property.description_ar : property.description_en;
  const image = property.images?.[0];

  return {
    title,
    description: description.slice(0, 160),
    openGraph: {
      title,
      description: description.slice(0, 160),
      images: image ? [{ url: getImageUrl(image), width: 1200, height: 630 }] : [],
      type: 'website',
    },
  };
}

export default async function PropertyDetailsPage({ params: { locale, id } }: Props) {
  const propertyId = parseInt(id);
  if (isNaN(propertyId)) notFound();

  const [property, t] = await Promise.all([
    getProperty(propertyId),
    getTranslations({ locale, namespace: 'properties.details' }),
  ]);

  if (!property) notFound();

  const similarProperties = await getSimilarProperties(property);
  const isRTL = locale === 'ar';
  const ArrowIcon = isRTL ? ArrowRight : ArrowLeft;

  // ── Owner contact info ──────────────────────────────────────────
  const owner = property.owner;
  // Normalize phone: strip non-digits, ensure starts with country code
  const rawPhone = owner?.phone?.replace(/\D/g, '') ?? '';
  const ownerPhone = rawPhone
    ? (rawPhone.startsWith('966') ? rawPhone : rawPhone.startsWith('0') ? `966${rawPhone.slice(1)}` : `966${rawPhone}`)
    : '966110000000'; // fallback to platform number
  const ownerPhoneDisplay = rawPhone
    ? `+${ownerPhone.slice(0, 3)} ${ownerPhone.slice(3, 5)} ${ownerPhone.slice(5, 9)} ${ownerPhone.slice(9)}`
    : '+966 11 000 0000';
  const ownerName = owner?.name ?? (locale === 'ar' ? 'المعلن' : 'Advertiser');
  const ownerInitials = ownerName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();

  const title = locale === 'ar' ? property.title_ar : property.title_en;
  const description = locale === 'ar' ? property.description_ar : property.description_en;
  const address = locale === 'ar' ? property.address_ar : property.address_en;

  // JSON-LD for property
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: title,
    description,
    url: `${process.env.NEXT_PUBLIC_APP_URL}/${locale}/properties/${property.id}`,
    image: property.images.map(getImageUrl),
    offers: {
      '@type': 'Offer',
      price: property.price,
      priceCurrency: 'SAR',
      availability: property.status === 'AVAILABLE'
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
    },
    address: {
      '@type': 'PostalAddress',
      addressLocality: property.city,
      addressCountry: 'SA',
    },
    numberOfRooms: property.bedrooms,
    floorSize: {
      '@type': 'QuantitativeValue',
      value: property.area,
      unitCode: 'MTK',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="min-h-screen bg-gray-50" dir={isRTL ? 'rtl' : 'ltr'}>
        {/* Breadcrumb */}
        <div className="bg-white border-b border-gray-100">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center gap-2 text-sm text-dark-500">
              <Link href={`/${locale}`} className="hover:text-primary-600 transition-colors">
                {locale === 'ar' ? 'الرئيسية' : 'Home'}
              </Link>
              <span>/</span>
              <Link href={`/${locale}/properties`} className="hover:text-primary-600 transition-colors">
                {locale === 'ar' ? 'العقارات' : 'Properties'}
              </Link>
              <span>/</span>
              <span className="text-dark-700 font-medium truncate max-w-xs">{title}</span>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Image Gallery */}
              <div className="bg-white rounded-2xl overflow-hidden shadow-card">
                {property.images.length > 0 ? (
                  <div className="grid grid-cols-1 gap-1">
                    {/* Main Image */}
                    <div className="relative h-80 md:h-96">
                      <Image
                        src={getImageUrl(property.images[0])}
                        alt={title}
                        fill
                        className="object-cover"
                        priority
                        sizes="(max-width: 1024px) 100vw, 66vw"
                      />
                      {/* Badges */}
                      <div className="absolute top-4 start-4 flex gap-2">
                        <span className={`px-3 py-1.5 rounded-lg text-sm font-bold text-white shadow-sm ${
                          property.type === 'SALE' ? 'bg-primary-600' : 'bg-gold-600'
                        }`}>
                          {getPropertyTypeLabel(property.type, locale as 'ar' | 'en')}
                        </span>
                        <span className={`px-3 py-1.5 rounded-lg text-sm font-bold text-white shadow-sm ${
                          property.status === 'AVAILABLE' ? 'bg-emerald-500' : 'bg-red-500'
                        }`}>
                          {getPropertyStatusLabel(property.status, locale as 'ar' | 'en')}
                        </span>
                      </div>
                    </div>
                    {/* Thumbnail Grid */}
                    {property.images.length > 1 && (
                      <div className="grid grid-cols-4 gap-1">
                        {property.images.slice(1, 5).map((img, i) => (
                          <div key={i} className="relative h-24">
                            <Image
                              src={getImageUrl(img)}
                              alt={`${title} ${i + 2}`}
                              fill
                              className="object-cover"
                              sizes="25vw"
                            />
                            {i === 3 && property.images.length > 5 && (
                              <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-bold text-lg">
                                +{property.images.length - 5}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-80 bg-gray-100 flex items-center justify-center">
                    <span className="text-gray-400 text-lg">
                      {locale === 'ar' ? 'لا توجد صور' : 'No images available'}
                    </span>
                  </div>
                )}
              </div>

              {/* Property Overview */}
              <div className="bg-white rounded-2xl p-6 shadow-card">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-dark-900 mb-2">{title}</h1>
                    <div className="flex items-center gap-1.5 text-dark-500">
                      <MapPin className="w-4 h-4 text-primary-500" />
                      <span>{address || property.city}</span>
                    </div>
                  </div>
                  <div className="text-end">
                    <p className="text-3xl font-bold text-primary-700">
                      {formatPrice(property.price, locale as 'ar' | 'en', property.type)}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-dark-400 text-sm justify-end">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" />
                        {property.views} {t('views')}
                      </span>
                      <span className="flex items-center gap-1">
                        <Hash className="w-3.5 h-3.5" />
                        {property.id}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-xl">
                  {property.bedrooms > 0 && (
                    <div className="text-center">
                      <Bed className="w-6 h-6 text-primary-500 mx-auto mb-1" />
                      <p className="text-xl font-bold text-dark-800">{property.bedrooms}</p>
                      <p className="text-xs text-dark-400">{locale === 'ar' ? 'غرف نوم' : 'Bedrooms'}</p>
                    </div>
                  )}
                  {property.bathrooms > 0 && (
                    <div className="text-center">
                      <Bath className="w-6 h-6 text-primary-500 mx-auto mb-1" />
                      <p className="text-xl font-bold text-dark-800">{property.bathrooms}</p>
                      <p className="text-xs text-dark-400">{locale === 'ar' ? 'حمامات' : 'Bathrooms'}</p>
                    </div>
                  )}
                  <div className="text-center">
                    <Maximize2 className="w-6 h-6 text-primary-500 mx-auto mb-1" />
                    <p className="text-xl font-bold text-dark-800">{formatArea(property.area, locale as 'ar' | 'en')}</p>
                    <p className="text-xs text-dark-400">{locale === 'ar' ? 'المساحة' : 'Area'}</p>
                  </div>
                  <div className="text-center">
                    <Calendar className="w-6 h-6 text-primary-500 mx-auto mb-1" />
                    <p className="text-sm font-bold text-dark-800">{formatDate(property.createdAt, locale as 'ar' | 'en')}</p>
                    <p className="text-xs text-dark-400">{t('postedOn')}</p>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="bg-white rounded-2xl p-6 shadow-card">
                <h2 className="text-xl font-bold text-dark-800 mb-4">{t('description')}</h2>
                <p className="text-dark-600 leading-relaxed whitespace-pre-line">{description}</p>
              </div>

              {/* Amenities */}
              {property.amenities.length > 0 && (
                <div className="bg-white rounded-2xl p-6 shadow-card">
                  <h2 className="text-xl font-bold text-dark-800 mb-4">{t('features')}</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {property.amenities.map((amenity, i) => (
                      <div key={i} className="flex items-center gap-2 text-dark-600 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        <span>{amenity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Map */}
              {property.latitude && property.longitude && (
                <div className="bg-white rounded-2xl p-6 shadow-card">
                  <h2 className="text-xl font-bold text-dark-800 mb-4">{t('location')}</h2>
                  <PropertyMap
                    latitude={property.latitude}
                    longitude={property.longitude}
                    title={title}
                    address={address || property.city}
                  />
                </div>
              )}

              {/* Similar Properties */}
              {similarProperties.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold text-dark-800 mb-5">{t('similar')}</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {similarProperties.map((p) => (
                      <PropertyCard key={p.id} property={p} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-5">
              {/* Price Card */}
              <div className="bg-white rounded-2xl p-6 shadow-card sticky top-24">
                <div className="text-center mb-5 pb-5 border-b border-gray-100">
                  <p className="text-3xl font-bold text-primary-700 mb-1">
                    {formatPrice(property.price, locale as 'ar' | 'en', property.type)}
                  </p>
                  <p className="text-dark-400 text-sm">{property.city}</p>
                </div>

                {/* Booking Form */}
                <BookingForm propertyId={property.id} locale={locale as 'ar' | 'en'} />

                {/* Owner Contact Card */}
                <div className="mt-5 pt-5 border-t border-gray-100">
                  {/* Owner Info */}
                  <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-xl">
                    <div className="w-11 h-11 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-sm">{ownerInitials}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-dark-800 truncate">{ownerName}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <User className="w-3 h-3 text-primary-500" />
                        <p className="text-xs text-primary-600 font-medium">
                          {locale === 'ar' ? 'المعلن' : 'Property Owner'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Phone Button */}
                  <a
                    href={`tel:+${ownerPhone}`}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-primary-50 transition-colors group mb-3"
                  >
                    <div className="w-9 h-9 bg-primary-100 group-hover:bg-primary-200 rounded-lg flex items-center justify-center transition-colors flex-shrink-0">
                      <Phone className="w-4 h-4 text-primary-600" />
                    </div>
                    <div>
                      <p className="text-xs text-dark-400">
                        {locale === 'ar' ? 'اتصل بالمعلن' : 'Call Advertiser'}
                      </p>
                      <p className="text-sm font-medium text-dark-700" dir="ltr">{ownerPhoneDisplay}</p>
                    </div>
                  </a>
                </div>

                {/* Share & WhatsApp Buttons */}
                <div className="mt-1">
                  <ShareButtons
                    title={title}
                    price={formatPrice(property.price, locale as 'ar' | 'en', property.type)}
                    city={property.city}
                    locale={locale as 'ar' | 'en'}
                    propertyId={property.id}
                    whatsappPhone={ownerPhone}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
