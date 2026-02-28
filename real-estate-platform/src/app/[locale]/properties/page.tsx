'use client';

import { useTranslations, useLocale } from 'next-intl';
import { Building2, Loader2 } from 'lucide-react';
import PropertyCard from '@/components/properties/PropertyCard';
import FilterBar from '@/components/properties/FilterBar';
import { useProperties } from '@/hooks/useProperties';

export default function PropertiesPage() {
  const t = useTranslations('properties');
  const locale = useLocale() as 'ar' | 'en';
  const isRTL = locale === 'ar';

  const { properties, pagination, isLoading, error, filters, updateFilters, resetFilters, goToPage } =
    useProperties({ page: 1, limit: 12, status: 'AVAILABLE' });

  return (
    <div className="min-h-screen bg-gray-50" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Page Header */}
      <div className="page-header">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{t('title')}</h1>
          <p className="text-white/80 text-lg max-w-2xl mx-auto">{t('subtitle')}</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10">
        {/* Filter Bar */}
        <div className="mb-8">
          <FilterBar
            filters={filters}
            onFilterChange={updateFilters}
            onReset={resetFilters}
            totalResults={pagination?.total}
          />
        </div>

        {/* Results Count */}
        {!isLoading && pagination && (
          <div className="flex items-center justify-between mb-6">
            <p className="text-dark-500 text-sm">
              {locale === 'ar'
                ? `عرض ${properties.length} من ${pagination.total} عقار`
                : `Showing ${properties.length} of ${pagination.total} properties`}
            </p>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-card">
                <div className="h-56 shimmer" />
                <div className="p-5 space-y-3">
                  <div className="h-6 shimmer rounded w-3/4" />
                  <div className="h-4 shimmer rounded w-1/2" />
                  <div className="h-4 shimmer rounded w-full" />
                  <div className="flex gap-4 pt-2">
                    <div className="h-4 shimmer rounded w-16" />
                    <div className="h-4 shimmer rounded w-16" />
                    <div className="h-4 shimmer rounded w-20" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8 text-red-400" />
            </div>
            <p className="text-dark-500 mb-4">{error}</p>
            <button
              onClick={resetFilters}
              className="btn-primary"
            >
              {locale === 'ar' ? 'إعادة المحاولة' : 'Try Again'}
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && properties.length === 0 && (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <Building2 className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-xl font-semibold text-dark-700 mb-2">{t('noResults')}</h3>
            <p className="text-dark-400 mb-6">
              {locale === 'ar' ? 'جرب تغيير معايير البحث' : 'Try changing your search criteria'}
            </p>
            <button onClick={resetFilters} className="btn-primary">
              {locale === 'ar' ? 'إعادة تعيين الفلتر' : 'Reset Filters'}
            </button>
          </div>
        )}

        {/* Properties Grid */}
        {!isLoading && !error && properties.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-12">
                <button
                  onClick={() => goToPage(pagination.page - 1)}
                  disabled={!pagination.hasPrev}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-dark-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  {locale === 'ar' ? 'السابق' : 'Previous'}
                </button>

                {[...Array(pagination.totalPages)].map((_, i) => {
                  const page = i + 1;
                  const isCurrentPage = page === pagination.page;
                  const isNearCurrent = Math.abs(page - pagination.page) <= 2;
                  const isFirstOrLast = page === 1 || page === pagination.totalPages;

                  if (!isNearCurrent && !isFirstOrLast) {
                    if (page === 2 || page === pagination.totalPages - 1) {
                      return <span key={page} className="text-dark-400">...</span>;
                    }
                    return null;
                  }

                  return (
                    <button
                      key={page}
                      onClick={() => goToPage(page)}
                      className={`w-10 h-10 rounded-xl text-sm font-medium transition-all ${
                        isCurrentPage
                          ? 'bg-primary-600 text-white shadow-sm'
                          : 'border border-gray-200 text-dark-600 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}

                <button
                  onClick={() => goToPage(pagination.page + 1)}
                  disabled={!pagination.hasNext}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-dark-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  {locale === 'ar' ? 'التالي' : 'Next'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
