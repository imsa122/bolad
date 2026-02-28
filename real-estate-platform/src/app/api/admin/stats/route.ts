import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { apiLimiter, rateLimitResponse } from '@/lib/rate-limit';
import { successResponse, errorResponse } from '@/lib/utils';

// ============================================
// GET /api/admin/stats - Dashboard statistics
// ============================================
export async function GET(req: NextRequest) {
  const { success, reset } = apiLimiter.check(req);
  if (!success) return rateLimitResponse(reset);

  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return NextResponse.json(errorResponse('Unauthorized'), { status: 401 });
    if (authUser.role !== 'ADMIN') return NextResponse.json(errorResponse('Forbidden'), { status: 403 });

    // Date range for monthly bookings (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const [
      totalProperties,
      availableProperties,
      totalBookings,
      pendingBookings,
      totalUsers,
      totalContacts,
      recentBookings,
      recentProperties,
      propertiesByType,
      propertiesByCity,
      bookingsByStatus,
      recentMonthlyBookings,
    ] = await Promise.all([
      prisma.property.count(),
      prisma.property.count({ where: { status: 'AVAILABLE' } }),
      prisma.booking.count(),
      prisma.booking.count({ where: { status: 'PENDING' } }),
      prisma.user.count({ where: { role: 'USER' } }),
      prisma.contact.count(),
      prisma.booking.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          property: { select: { title_ar: true, title_en: true, city: true } },
          user: { select: { name: true, email: true } },
        },
      }),
      prisma.property.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title_ar: true,
          title_en: true,
          city: true,
          type: true,
          price: true,
          status: true,
          createdAt: true,
        },
      }),
      prisma.property.groupBy({
        by: ['type'],
        _count: { type: true },
      }),
      prisma.property.groupBy({
        by: ['city'],
        _count: { city: true },
        orderBy: { _count: { city: 'desc' } },
        take: 6,
      }),
      prisma.booking.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
      // Raw monthly bookings for the last 6 months
      prisma.booking.findMany({
        where: { createdAt: { gte: sixMonthsAgo } },
        select: { createdAt: true },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    // Aggregate monthly bookings into month buckets
    const monthlyMap: Record<string, number> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyMap[key] = 0;
    }
    for (const b of recentMonthlyBookings) {
      const d = new Date(b.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (key in monthlyMap) monthlyMap[key]++;
    }
    const monthlyBookings = Object.entries(monthlyMap).map(([month, count]) => ({ month, count }));

    return NextResponse.json(
      successResponse({
        // Flat stats (used by dashboard cards)
        totalProperties,
        availableProperties,
        totalBookings,
        pendingBookings,
        totalUsers,
        totalContacts,
        // Recent data (used by dashboard tables)
        recentBookings,
        recentProperties: recentProperties.map((p) => ({
          ...p,
          price: Number(p.price),
        })),
        // Chart data
        propertiesByType,
        propertiesByCity,
        bookingsByStatus,
        monthlyBookings,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('[ADMIN STATS ERROR]', error);
    return NextResponse.json(errorResponse('Internal server error'), { status: 500 });
  }
}
