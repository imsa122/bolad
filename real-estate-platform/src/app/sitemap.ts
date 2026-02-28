import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  // Static pages for both locales
  const staticPages = ['', '/properties', '/contact', '/auth/login', '/auth/register'];
  const locales = ['ar', 'en'];

  const staticRoutes: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    for (const page of staticPages) {
      staticRoutes.push({
        url: `${baseUrl}/${locale}${page}`,
        lastModified: new Date(),
        changeFrequency: page === '' ? 'daily' : 'weekly',
        priority: page === '' ? 1.0 : 0.8,
      });
    }
  }

  // Dynamic property pages
  let propertyRoutes: MetadataRoute.Sitemap = [];
  try {
    const properties = await prisma.property.findMany({
      where: { status: 'AVAILABLE' },
      select: { id: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
      take: 1000,
    });

    propertyRoutes = properties.flatMap((property) =>
      locales.map((locale) => ({
        url: `${baseUrl}/${locale}/properties/${property.id}`,
        lastModified: property.updatedAt,
        changeFrequency: 'weekly' as const,
        priority: 0.9,
      }))
    );
  } catch {
    // Return static routes only if DB is unavailable
  }

  return [...staticRoutes, ...propertyRoutes];
}
