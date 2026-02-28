import { Suspense } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { Building2, TrendingUp, Users, Award, ArrowLeft, ArrowRight, CheckCircle2, Phone } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import PropertyCard from '@/components/properties/PropertyCard';
import type { Property } from '@/types';

type Props = { params: { locale: string } };

export async function generateMetadata({ params: { locale } }: Props): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'seo.home' });
  return {
    title: t('title'),
    description: t('description'),
    openGraph: {
      title: t('title'),
      description: t('description'),
      images: [{ url: '/images/og-home.jpg', width: 1200, height: 630 }],
    },
  };
}

async function getFeaturedProperties(): Promise<Property[]> {
  try {
    // First try to get featured properties
    const featured = await prisma.property.findMany({
      where: { featured: true, status: 'AVAILABLE' },
      take: 6,
      orderBy: { createdAt: 'desc' },
    });

    // If we have 6 featured, return them
    if (featured.length >= 6) {
      return featured.map((p) => ({
        ...p,
        images: typeof p.images === 'string' ? JSON.parse(p.images) : (p.images as string[]),
        amenities: typeof p.amenities === 'string' ? JSON.parse(p.amenities) : (p.amenities as string[]),
        price: Number(p.price),
        area: Number(p.area),
      })) as Property[];
    }

    // Otherwise, fill remaining slots with most recent available properties
    const featuredIds = featured.map((p) => p.id);
    const remaining = 6 - featured.length;

    const recent = await prisma.property.findMany({
      where: {
        status: 'AVAILABLE',
        id: { notIn: featuredIds.length > 0 ? featuredIds : [-1] },
      },
      take: remaining,
      orderBy: { createdAt: 'desc' },
    });

    const combined = [...featured, ...recent];

    return combined.map((p) => ({
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

async function getStats() {
  try {
    const [totalProperties, totalUsers] = await Promise.all([
      prisma.property.count({ where: { status: 'AVAILABLE' } }),
      prisma.user.count({ where: { role: 'USER' } }),
    ]);
    return { totalProperties, totalUsers };
  } catch {
    return { totalProperties: 500, totalUsers: 2000 };
  }
}

export default async function HomePage({ params: { locale } }: Props) {
  const t = await getTranslations({ locale, namespace: 'home' });
  const tc = await getTranslations({ locale, namespace: 'common' });
  const isRTL = locale === 'ar';
  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  const [featuredProperties, stats] = await Promise.all([
    getFeaturedProperties(),
    getStats(),
  ]);

  const whyUsFeatures = [
    {
      key: 'trusted',
      icon: Award,
      color: 'bg-blue-50 text-blue-600',
    },
    {
      key: 'expert',
      icon: Users,
      color: 'bg-emerald-50 text-emerald-600',
    },
    {
      key: 'support',
      icon: Phone,
      color: 'bg-purple-50 text-purple-600',
    },
    {
      key: 'best_price',
      icon: TrendingUp,
      color: 'bg-gold-50 text-gold-600',
    },
  ] as const;

  // JSON-LD Structured Data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    name: locale === 'ar' ? 'عقارات السعودية' : 'Saudi Real Estate',
    description: t('hero.subtitle'),
    url: process.env.NEXT_PUBLIC_APP_URL,
    areaServed: 'Saudi Arabia',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'SA',
      addressLocality: 'Riyadh',
    },
  };

  return (
    <>
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ============================================
          HERO SECTION
          ============================================ */}
      <section className="hero-section min-h-screen flex items-center relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 start-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 end-10 w-96 h-96 bg-primary-300 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 py-32 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white px-4 py-2 rounded-full text-sm font-medium mb-8 animate-fade-in">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              {locale === 'ar' ? 'المنصة العقارية الأولى في المملكة' : 'Saudi Arabia\'s Premier Real Estate Platform'}
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight animate-fade-in-up">
              {t('hero.title')}
            </h1>

            {/* Subtitle */}
            <p className="text-lg md:text-xl text-white/80 mb-10 max-w-2xl mx-auto leading-relaxed animate-fade-in-up animate-delay-100">
              {t('hero.subtitle')}
            </p>

            {/* Search Bar */}
            <div className="bg-white rounded-2xl p-2 shadow-2xl max-w-2xl mx-auto flex gap-2 animate-fade-in-up animate-delay-200">
              <input
                type="text"
                placeholder={t('hero.searchPlaceholder')}
                className="flex-1 px-4 py-3 text-dark-700 bg-transparent focus:outline-none text-sm"
                dir={isRTL ? 'rtl' : 'ltr'}
              />
              <Link
                href={`/${locale}/properties`}
                className="flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium text-sm transition-all shadow-sm"
              >
                {t('hero.searchButton')}
                <ArrowIcon className="w-4 h-4" />
              </Link>
            </div>

            {/* Quick Filters */}
            <div className="flex flex-wrap justify-center gap-3 mt-6 animate-fade-in-up animate-delay-300">
              {[
                { label: locale === 'ar' ? 'للبيع' : 'For Sale', href: `/${locale}/properties?type=SALE` },
                { label: locale === 'ar' ? 'للإيجار' : 'For Rent', href: `/${locale}/properties?type=RENT` },
                { label: locale === 'ar' ? 'الرياض' : 'Riyadh', href: `/${locale}/properties?city=${locale === 'ar' ? 'الرياض' : 'Riyadh'}` },
                { label: locale === 'ar' ? 'جدة' : 'Jeddah', href: `/${locale}/properties?city=${locale === 'ar' ? 'جدة' : 'Jeddah'}` },
              ].map((filter) => (
                <Link
                  key={filter.label}
                  href={filter.href}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white rounded-full text-sm transition-all"
                >
                  {filter.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-20 max-w-3xl mx-auto animate-fade-in-up animate-delay-400">
            {[
              { value: stats.totalProperties.toLocaleString(locale === 'ar' ? 'ar-SA' : 'en'), label: t('hero.stats.properties'), icon: Building2 },
              { value: '12', label: t('hero.stats.cities'), icon: Building2 },
              { value: stats.totalUsers.toLocaleString(locale === 'ar' ? 'ar-SA' : 'en'), label: t('hero.stats.clients'), icon: Users },
              { value: '10+', label: t('hero.stats.years'), icon: Award },
            ].map((stat, i) => (
              <div key={i} className="text-center bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4">
                <p className="text-3xl font-bold text-white mb-1">{stat.value}</p>
                <p className="text-white/70 text-sm">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/50 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex items-start justify-center p-1">
            <div className="w-1.5 h-3 bg-white/50 rounded-full animate-pulse" />
          </div>
        </div>
      </section>

      {/* ============================================
          FEATURED PROPERTIES
          ============================================ */}
      <section className="section bg-gray-50">
        <div className="container mx-auto px-4">
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
            <div>
              <p className="text-primary-600 font-semibold text-sm mb-2 uppercase tracking-wider">
                {locale === 'ar' ? 'عقاراتنا المميزة' : 'Our Featured Properties'}
              </p>
              <h2 className="section-title">{t('featured.title')}</h2>
              <p className="section-subtitle mt-2">{t('featured.subtitle')}</p>
            </div>
            <Link
              href={`/${locale}/properties`}
              className="flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium text-sm transition-colors flex-shrink-0"
            >
              {t('featured.viewAll')}
              <ArrowIcon className="w-4 h-4" />
            </Link>
          </div>

          {/* Properties Grid */}
          <Suspense fallback={
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-card">
                  <div className="h-56 shimmer" />
                  <div className="p-5 space-y-3">
                    <div className="h-6 shimmer rounded w-3/4" />
                    <div className="h-4 shimmer rounded w-1/2" />
                    <div className="h-4 shimmer rounded w-full" />
                  </div>
                </div>
              ))}
            </div>
          }>
            {featuredProperties.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredProperties.map((property) => (
                  <PropertyCard key={property.id} property={property} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 text-dark-400">
                <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>{tc('noData')}</p>
              </div>
            )}
          </Suspense>

          {/* View All Button */}
          <div className="text-center mt-10">
            <Link href={`/${locale}/properties`} className="btn-primary">
              {t('featured.viewAll')}
              <ArrowIcon className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================
          WHY CHOOSE US
          ============================================ */}
      <section className="section bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <p className="text-primary-600 font-semibold text-sm mb-2 uppercase tracking-wider">
              {locale === 'ar' ? 'مميزاتنا' : 'Our Advantages'}
            </p>
            <h2 className="section-title">{t('whyUs.title')}</h2>
            <p className="section-subtitle mx-auto mt-2">{t('whyUs.subtitle')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {whyUsFeatures.map(({ key, icon: Icon, color }) => (
              <div key={key} className="card p-6 card-hover text-center group">
                <div className={`w-14 h-14 ${color} rounded-2xl flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-7 h-7" />
                </div>
                <h3 className="font-bold text-dark-800 text-lg mb-3">
                  {t(`whyUs.features.${key}.title`)}
                </h3>
                <p className="text-dark-500 text-sm leading-relaxed">
                  {t(`whyUs.features.${key}.desc`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================
          PROPERTY TYPES SECTION
          ============================================ */}
      <section className="section bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="section-title">
              {locale === 'ar' ? 'تصفح حسب النوع' : 'Browse by Type'}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {[
              {
                type: 'SALE',
                title: locale === 'ar' ? 'عقارات للبيع' : 'Properties for Sale',
                desc: locale === 'ar' ? 'اعثر على منزل أحلامك للتملك' : 'Find your dream home to own',
                color: 'from-primary-600 to-primary-800',
                href: `/${locale}/properties?type=SALE`,
              },
              {
                type: 'RENT',
                title: locale === 'ar' ? 'عقارات للإيجار' : 'Properties for Rent',
                desc: locale === 'ar' ? 'استأجر بأفضل الأسعار والمواقع' : 'Rent at the best prices and locations',
                color: 'from-gold-500 to-gold-700',
                href: `/${locale}/properties?type=RENT`,
              },
            ].map((item) => (
              <Link
                key={item.type}
                href={item.href}
                className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${item.color} p-8 text-white group hover:shadow-xl transition-all duration-300`}
              >
                <div className="absolute top-0 end-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 start-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
                <div className="relative z-10">
                  <Building2 className="w-10 h-10 mb-4 opacity-80" />
                  <h3 className="text-2xl font-bold mb-2">{item.title}</h3>
                  <p className="text-white/80 text-sm mb-4">{item.desc}</p>
                  <div className="flex items-center gap-2 text-sm font-medium">
                    {locale === 'ar' ? 'استعرض الآن' : 'Browse Now'}
                    <ArrowIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================
          CTA SECTION
          ============================================ */}
      <section className="section bg-gradient-to-br from-primary-900 to-primary-700 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 start-0 w-96 h-96 bg-white rounded-full -translate-y-1/2 -translate-x-1/2 blur-3xl" />
          <div className="absolute bottom-0 end-0 w-96 h-96 bg-primary-300 rounded-full translate-y-1/2 translate-x-1/2 blur-3xl" />
        </div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="max-w-2xl mx-auto">
            <div className="flex justify-center mb-6">
              {[...Array(5)].map((_, i) => (
                <CheckCircle2 key={i} className="w-6 h-6 text-gold-400 mx-0.5" />
              ))}
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('cta.title')}</h2>
            <p className="text-white/80 text-lg mb-8">{t('cta.subtitle')}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href={`/${locale}/contact`} className="btn-primary bg-white text-primary-700 hover:bg-gray-100">
                {t('cta.button')}
                <ArrowIcon className="w-4 h-4" />
              </Link>
              <Link href={`/${locale}/properties`} className="btn-outline border-white/30 text-white hover:bg-white/10">
                {locale === 'ar' ? 'استعرض العقارات' : 'Browse Properties'}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
