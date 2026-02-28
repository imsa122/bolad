import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { apiLimiter, rateLimitResponse } from '@/lib/rate-limit';
import { successResponse, errorResponse, getPaginationMeta } from '@/lib/utils';

// ============================================
// GET /api/properties/my - Get current user's properties
// ============================================
export async function GET(req: NextRequest) {
  const { success, reset } = apiLimiter.check(req);
  if (!success) return rateLimitResponse(reset);

  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json(errorResponse('Unauthorized'), { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { userId: authUser.userId };

    const [properties, total] = await Promise.all([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (prisma.property as any).findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (prisma.property as any).count({ where }),
    ]);

    const parsedProperties = properties.map((p: Record<string, unknown>) => ({
      ...p,
      images: typeof p.images === 'string' ? JSON.parse(p.images as string) : p.images,
      amenities: typeof p.amenities === 'string' ? JSON.parse(p.amenities as string) : p.amenities,
      price: Number(p.price),
      area: Number(p.area),
    }));

    return NextResponse.json(
      successResponse({
        data: parsedProperties,
        pagination: getPaginationMeta(total, page, limit),
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('[MY PROPERTIES ERROR]', error);
    return NextResponse.json(errorResponse('Internal server error'), { status: 500 });
  }
}
