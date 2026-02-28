import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { apiLimiter, rateLimitResponse } from '@/lib/rate-limit';
import { successResponse, errorResponse } from '@/lib/utils';

// ============================================
// GET /api/admin/users - List all users (Admin only)
// ============================================
export async function GET(req: NextRequest) {
  const { success, reset } = apiLimiter.check(req);
  if (!success) return rateLimitResponse(reset);

  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return NextResponse.json(errorResponse('Unauthorized'), { status: 401 });
    if (authUser.role !== 'ADMIN') return NextResponse.json(errorResponse('Forbidden'), { status: 403 });

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (role) where.role = role;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          phone: true,
          isActive: true,
          createdAt: true,
          _count: {
            select: { bookings: true },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json(
      successResponse({ data: users, total, page, limit }),
      { status: 200 }
    );
  } catch (error) {
    console.error('[ADMIN USERS GET ERROR]', error);
    return NextResponse.json(errorResponse('Internal server error'), { status: 500 });
  }
}
