import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { apiLimiter, rateLimitResponse } from '@/lib/rate-limit';
import { successResponse, errorResponse } from '@/lib/utils';

type RouteParams = { params: { id: string } };

// ============================================
// PATCH /api/bookings/[id] - Update booking status (Admin only)
// ============================================
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const { success, reset } = apiLimiter.check(req);
  if (!success) return rateLimitResponse(reset);

  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return NextResponse.json(errorResponse('Unauthorized'), { status: 401 });
    if (authUser.role !== 'ADMIN') return NextResponse.json(errorResponse('Forbidden'), { status: 403 });

    const id = parseInt(params.id);
    if (isNaN(id)) return NextResponse.json(errorResponse('Invalid booking ID'), { status: 400 });

    const body = await req.json();
    const { status } = body;

    const validStatuses = ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        errorResponse('Invalid status. Must be one of: PENDING, CONFIRMED, CANCELLED, COMPLETED'),
        { status: 422 }
      );
    }

    const existing = await prisma.booking.findUnique({ where: { id } });
    if (!existing) return NextResponse.json(errorResponse('Booking not found'), { status: 404 });

    const updated = await prisma.booking.update({
      where: { id },
      data: { status },
      include: {
        property: {
          select: { id: true, title_ar: true, title_en: true, city: true },
        },
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json(
      successResponse(updated, 'Booking status updated successfully'),
      { status: 200 }
    );
  } catch (error) {
    console.error('[BOOKING PATCH ERROR]', error);
    return NextResponse.json(errorResponse('Internal server error'), { status: 500 });
  }
}

// ============================================
// DELETE /api/bookings/[id] - Cancel booking (User: own, Admin: any)
// ============================================
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const { success, reset } = apiLimiter.check(req);
  if (!success) return rateLimitResponse(reset);

  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return NextResponse.json(errorResponse('Unauthorized'), { status: 401 });

    const id = parseInt(params.id);
    if (isNaN(id)) return NextResponse.json(errorResponse('Invalid booking ID'), { status: 400 });

    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking) return NextResponse.json(errorResponse('Booking not found'), { status: 404 });

    // Users can only cancel their own bookings
    if (authUser.role !== 'ADMIN' && booking.userId !== authUser.userId) {
      return NextResponse.json(errorResponse('Forbidden'), { status: 403 });
    }

    await prisma.booking.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    return NextResponse.json(
      successResponse(null, 'Booking cancelled successfully'),
      { status: 200 }
    );
  } catch (error) {
    console.error('[BOOKING DELETE ERROR]', error);
    return NextResponse.json(errorResponse('Internal server error'), { status: 500 });
  }
}
