'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Search, SlidersHorizontal, X, ChevronDown } from 'lucide-react';
import { cn, SAUDI_CITIES } from '@/lib/utils';
import type { PropertyFilters } from '@/types';

interface FilterBarProps {
  filters: PropertyFilters;
  onFilterChange: (filters: Partial<PropertyFilters>) => void;
  onReset: () => void;
  totalResults?: number;
}

export default function FilterBar({ filters, onFilterChange, onReset, totalResults }: FilterBarProps) {
  const t = useTranslations('properties.filter');
  const ts = useTranslations('properties.sort');
  const locale = useLocale() as 'ar' | 'en';
  const isRTL = locale === 'ar';
  const [isExpanded, setIsExpanded] = useState(false);

  const bedroomOptions = [1, 2, 3, 4, 5, 6];

  const hasActiveFilters = !!(
    filters.city ||
    filters.type ||
    filters.minPrice ||
    filters.maxPrice ||
    filters.bedrooms
  );

  return (
    <div className="bg-white rounded-2xl shadow-card border border-gray-100" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Search Bar Row */}
      <div className="p-4 flex flex-col sm:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder={t('city')}
            value={filters.search || ''}
            onChange={(e) => onFilterChange({ search: e.target.value })}
            className="w-full ps-10 pe-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
          />
        </div>

        {/* Type Filter */}
        <div className="relative">
          <select
            value={filters.type || ''}
            onChange={(e) => onFilterChange({ type: (e.target.value as 'SALE' | 'RENT') || undefined })}
            className="appearance-none w-full sm:w-40 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white cursor-pointer"
          >
            <option value="">{t('allTypes')}</option>
            <option value="SALE">{t('sale')}</option>
            <option value="RENT">{t('rent')}</option>
          </select>
          <ChevronDown className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>

        {/* Sort */}
        <div className="relative">
          <select
            value={`${filters.sortBy || 'createdAt'}_${filters.sortOrder || 'desc'}`}
            onChange={(e) => {
              const [sortBy, sortOrder] = e.target.value.split('_');
              onFilterChange({
                sortBy: sortBy as 'price' | 'createdAt' | 'views',
                sortOrder: sortOrder as 'asc' | 'desc',
              });
            }}
            className="appearance-none w-full sm:w-44 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white cursor-pointer"
          >
            <option value="createdAt_desc">{ts('newest')}</option>
            <option value="createdAt_asc">{ts('oldest')}</option>
            <option value="price_asc">{ts('priceAsc')}</option>
            <option value="price_desc">{ts('priceDesc')}</option>
            <option value="views_desc">{ts('mostViewed')}</option>
          </select>
          <ChevronDown className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>

        {/* Toggle Advanced Filters */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all border',
            isExpanded || hasActiveFilters
              ? 'bg-primary-600 text-white border-primary-600'
              : 'bg-white text-dark-600 border-gray-200 hover:border-primary-300 hover:text-primary-600'
          )}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span className="hidden sm:inline">{t('title')}</span>
          {hasActiveFilters && (
            <span className="w-5 h-5 bg-white text-primary-600 rounded-full text-xs font-bold flex items-center justify-center">
              !
            </span>
          )}
        </button>
      </div>

      {/* Advanced Filters */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-100 pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* City */}
            <div>
              <label className="block text-xs font-medium text-dark-600 mb-1.5">{t('city')}</label>
              <div className="relative">
                <select
                  value={filters.city || ''}
                  onChange={(e) => onFilterChange({ city: e.target.value || undefined })}
                  className="appearance-none w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white cursor-pointer"
                >
                  <option value="">{t('allCities')}</option>
                  {SAUDI_CITIES.map((city) => (
                    <option key={city.en} value={locale === 'ar' ? city.ar : city.en}>
                      {locale === 'ar' ? city.ar : city.en}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Min Price */}
            <div>
              <label className="block text-xs font-medium text-dark-600 mb-1.5">{t('minPrice')}</label>
              <input
                type="number"
                placeholder="0"
                value={filters.minPrice || ''}
                onChange={(e) => onFilterChange({ minPrice: e.target.value ? Number(e.target.value) : undefined })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                min="0"
              />
            </div>

            {/* Max Price */}
            <div>
              <label className="block text-xs font-medium text-dark-600 mb-1.5">{t('maxPrice')}</label>
              <input
                type="number"
                placeholder="∞"
                value={filters.maxPrice || ''}
                onChange={(e) => onFilterChange({ maxPrice: e.target.value ? Number(e.target.value) : undefined })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                min="0"
              />
            </div>

            {/* Bedrooms */}
            <div>
              <label className="block text-xs font-medium text-dark-600 mb-1.5">{t('bedrooms')}</label>
              <div className="flex gap-1.5 flex-wrap">
                <button
                  onClick={() => onFilterChange({ bedrooms: undefined })}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-medium transition-all border',
                    !filters.bedrooms
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'bg-white text-dark-600 border-gray-200 hover:border-primary-300'
                  )}
                >
                  {t('allBedrooms')}
                </button>
                {bedroomOptions.map((num) => (
                  <button
                    key={num}
                    onClick={() => onFilterChange({ bedrooms: num })}
                    className={cn(
                      'w-9 h-8 rounded-lg text-xs font-medium transition-all border',
                      filters.bedrooms === num
                        ? 'bg-primary-600 text-white border-primary-600'
                        : 'bg-white text-dark-600 border-gray-200 hover:border-primary-300'
                    )}
                  >
                    {num}+
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Actions Row */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
            <div className="text-sm text-dark-500">
              {totalResults !== undefined && (
                <span>
                  <strong className="text-primary-700">{totalResults}</strong> {t('results')}
                </span>
              )}
            </div>
            {hasActiveFilters && (
              <button
                onClick={onReset}
                className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700 transition-colors"
              >
                <X className="w-4 h-4" />
                {t('reset')}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
