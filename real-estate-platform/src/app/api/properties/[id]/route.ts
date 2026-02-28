import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { propertyUpdateSchema } from '@/lib/validations';
import { apiLimiter, rateLimitResponse } from '@/lib/rate-limit';
import { successResponse, errorResponse } from '@/lib/utils';

type RouteParams = { params: { id: string } };

const EDIT_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

function parseProperty(p: Record<string, unknown>) {
  return {
    ...p,
    images: typeof p.images === 'string' ? JSON.parse(p.images) : p.images,
    amenities: typeof p.amenities === 'string' ? JSON.parse(p.amenities) : p.amenities,
    price: Number(p.price),
    area: Number(p.area),
  };
}

// ============================================
// GET /api/properties/[id]
// ============================================
export async function GET(req: NextRequest, { params }: RouteParams) {
  const { success, reset } = apiLimiter.check(req);
  if (!success) return rateLimitResponse(reset);

  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(errorResponse('Invalid property ID'), { status: 400 });
    }

    const property = await prisma.property.findUnique({
      where: { id },
    });

    if (!property) {
      return NextResponse.json(errorResponse('Property not found'), { status: 404 });
    }

    // Increment view count (fire and forget)
    prisma.property.update({
      where: { id },
      data: { views: { increment: 1 } },
    }).catch(console.error);

    return NextResponse.json(
      successResponse(parseProperty(property as unknown as Record<string, unknown>)),
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120',
        },
      }
    );
  } catch (error) {
    console.error('[PROPERTY GET ERROR]', error);
    return NextResponse.json(errorResponse('Internal server error'), { status: 500 });
  }
}

// ============================================
// PUT /api/properties/[id] - Owner or Admin
// - Admins: can edit anytime
// - Owners (regular users): can edit once every 24 hours
// ============================================
export async function PUT(req: NextRequest, { params }: RouteParams) {
  const { success, reset } = apiLimiter.check(req);
  if (!success) return rateLimitResponse(reset);

  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return NextResponse.json(errorResponse('Unauthorized'), { status: 401 });

    const id = parseInt(params.id);
    if (isNaN(id)) return NextResponse.json(errorResponse('Invalid property ID'), { status: 400 });

    const existing = await prisma.property.findUnique({ where: { id } });
    if (!existing) return NextResponse.json(errorResponse('Property not found'), { status: 404 });

    // Cast to any to handle new fields before Prisma client regeneration
    const existingAny = existing as unknown as Record<string, unknown>;
    const isAdmin = authUser.role === 'ADMIN';
    const isOwner = existingAny.userId === authUser.userId;

    // Authorization: must be admin or the property owner
    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        errorResponse('Forbidden: You can only edit your own properties'),
        { status: 403 }
      );
    }

    // 24-hour cooldown for non-admin users
    const lastEditedAt = existingAny.lastEditedAt as Date | null;
    if (!isAdmin && lastEditedAt) {
      const timeSinceLastEdit = Date.now() - new Date(lastEditedAt).getTime();
      if (timeSinceLastEdit < EDIT_COOLDOWN_MS) {
        const remainingMs = EDIT_COOLDOWN_MS - timeSinceLastEdit;
        const remainingHours = Math.ceil(remainingMs / (1000 * 60 * 60));
        const remainingMinutes = Math.ceil(remainingMs / (1000 * 60));
        const nextEditAt = new Date(new Date(lastEditedAt).getTime() + EDIT_COOLDOWN_MS).toISOString();

        return NextResponse.json(
          {
            success: false,
            error: `يمكنك تعديل إعلانك مرة واحدة كل 24 ساعة. انتظر ${
              remainingHours > 1 ? `${remainingHours} ساعة` : `${remainingMinutes} دقيقة`
            }.`,
            error_en: `You can only edit your listing once every 24 hours. Please wait ${
              remainingHours > 1 ? `${remainingHours} hours` : `${remainingMinutes} minutes`
            }.`,
            cooldown: { remainingMs, remainingHours, remainingMinutes, nextEditAt },
          },
          { status: 429 }
        );
      }
    }

    const body = await req.json();
    const validation = propertyUpdateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        errorResponse('Validation failed', validation.error.flatten().fieldErrors as Record<string, string[]>),
        { status: 422 }
      );
    }

    const { amenities, ...data } = validation.data;

    // Non-admins cannot change featured status or role-restricted fields
    const updateData: Record<string, unknown> = { ...data };
    if (!isAdmin) {
      delete updateData.featured; // Only admins can set featured
    }

    if (amenities !== undefined) updateData.amenities = JSON.stringify(amenities);
    if (body.images !== undefined) updateData.images = JSON.stringify(body.images);

    // Track last edit time for non-admin users
    if (!isAdmin) {
      updateData.lastEditedAt = new Date();
    }

    const updated = await prisma.property.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(
      successResponse(
        parseProperty(updated as unknown as Record<string, unknown>),
        'Property updated successfully'
      ),
      { status: 200 }
    );
  } catch (error) {
    console.error('[PROPERTY PUT ERROR]', error);
    return NextResponse.json(errorResponse('Internal server error'), { status: 500 });
  }
}

// ============================================
// DELETE /api/properties/[id] - Admin or Owner
// ============================================
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const { success, reset } = apiLimiter.check(req);
  if (!success) return rateLimitResponse(reset);

  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return NextResponse.json(errorResponse('Unauthorized'), { status: 401 });

    const id = parseInt(params.id);
    if (isNaN(id)) return NextResponse.json(errorResponse('Invalid property ID'), { status: 400 });

    const existing = await prisma.property.findUnique({ where: { id } });
    if (!existing) return NextResponse.json(errorResponse('Property not found'), { status: 404 });

    const existingAny2 = existing as unknown as Record<string, unknown>;
    const isAdmin = authUser.role === 'ADMIN';
    const isOwner = existingAny2.userId === authUser.userId;

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        errorResponse('Forbidden: You can only delete your own properties'),
        { status: 403 }
      );
    }

    await prisma.property.delete({ where: { id } });

    return NextResponse.json(
      successResponse(null, 'Property deleted successfully'),
      { status: 200 }
    );
  } catch (error) {
    console.error('[PROPERTY DELETE ERROR]', error);
    return NextResponse.json(errorResponse('Internal server error'), { status: 500 });
  }
}
