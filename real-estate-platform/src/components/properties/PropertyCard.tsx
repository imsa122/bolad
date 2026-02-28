'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { Bed, Bath, Maximize2, MapPin, Eye, Star, Building2 } from 'lucide-react';
import { cn, formatPrice, formatArea, getImageUrl, getPropertyTypeLabel } from '@/lib/utils';
import type { Property } from '@/types';

interface PropertyCardProps {
  property: Property;
  className?: string;
}

export default function PropertyCard({ property, className }: PropertyCardProps) {
  const locale = useLocale() as 'ar' | 'en';
  const t = useTranslations('properties.card');
  const [imgError, setImgError] = useState(false);

  const title = locale === 'ar' ? property.title_ar : property.title_en;
  const city = property.city;
  const mainImage = property.images?.[0];
  const hasImage = mainImage && !imgError;

  const statusColors = {
    AVAILABLE: 'bg-emerald-500',
    SOLD: 'bg-red-500',
    RENTED: 'bg-orange-500',
    PENDING: 'bg-yellow-500',
  };

  // Gradient backgrounds for placeholder based on property type
  const placeholderGradients = {
    SALE: 'from-primary-800 via-primary-700 to-primary-600',
    RENT: 'from-gold-700 via-gold-600 to-gold-500',
  };

  return (
    <Link
      href={`/${locale}/properties/${property.id}`}
      className={cn(
        'group block bg-white rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1',
        className
      )}
    >
      {/* Image Container */}
      <div className="relative h-56 overflow-hidden bg-gray-100">
        {hasImage ? (
          <Image
            src={getImageUrl(mainImage)}
            alt={title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            onError={() => setImgError(true)}
          />
        ) : (
          /* CSS Gradient Placeholder */
          <div
            className={cn(
              'absolute inset-0 bg-gradient-to-br flex flex-col items-center justify-center',
              placeholderGradients[property.type] || placeholderGradients.SALE
            )}
          >
            <Building2 className="w-14 h-14 text-white/40 mb-2" />
            <p className="text-white/60 text-xs font-medium">
              {locale === 'ar' ? 'صورة العقار' : 'Property Image'}
            </p>
          </div>
        )}

        {/* Overlay Badges */}
        <div className="absolute top-3 start-3 flex flex-col gap-1.5">
          {/* Type Badge */}
          <span
            className={cn(
              'px-2.5 py-1 rounded-lg text-xs font-bold text-white shadow-sm',
              property.type === 'SALE' ? 'bg-primary-600' : 'bg-gold-600'
            )}
          >
            {getPropertyTypeLabel(property.type, locale)}
          </span>

          {/* Featured Badge */}
          {property.featured && (
            <span className="flex items-center gap-1 px-2.5 py-1 bg-gold-500 rounded-lg text-xs font-bold text-white shadow-sm">
              <Star className="w-3 h-3 fill-white" />
              {t('featured')}
            </span>
          )}
        </div>

        {/* Status Badge */}
        <div className="absolute top-3 end-3">
          <span
            className={cn(
              'w-2.5 h-2.5 rounded-full block ring-2 ring-white',
              statusColors[property.status as keyof typeof statusColors] || 'bg-gray-400'
            )}
            title={property.status}
          />
        </div>

        {/* Views */}
        <div className="absolute bottom-3 end-3 flex items-center gap-1 bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-lg">
          <Eye className="w-3 h-3" />
          <span>{property.views}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Price */}
        <div className="mb-2">
          <p className="text-2xl font-bold text-primary-700">
            {formatPrice(property.price, locale, property.type)}
          </p>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-dark-800 text-base mb-2 line-clamp-1 group-hover:text-primary-700 transition-colors">
          {title}
        </h3>

        {/* Location */}
        <div className="flex items-center gap-1.5 text-dark-500 text-sm mb-4">
          <MapPin className="w-3.5 h-3.5 text-primary-500 flex-shrink-0" />
          <span className="truncate">{city}</span>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-100 pt-4">
          {/* Property Stats */}
          <div className="flex items-center justify-between text-dark-500 text-sm">
            {property.bedrooms > 0 && (
              <div className="flex items-center gap-1.5">
                <Bed className="w-4 h-4 text-primary-400" />
                <span>{property.bedrooms}</span>
                <span className="hidden sm:inline text-xs text-dark-400">{t('bedrooms')}</span>
              </div>
            )}
            {property.bathrooms > 0 && (
              <div className="flex items-center gap-1.5">
                <Bath className="w-4 h-4 text-primary-400" />
                <span>{property.bathrooms}</span>
                <span className="hidden sm:inline text-xs text-dark-400">{t('bathrooms')}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <Maximize2 className="w-4 h-4 text-primary-400" />
              <span>{formatArea(property.area, locale)}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
