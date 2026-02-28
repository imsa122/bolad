import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { bookingSchema } from '@/lib/validations';
import { apiLimiter, rateLimitResponse } from '@/lib/rate-limit';
import { successResponse, errorResponse, getPaginationMeta } from '@/lib/utils';

// ============================================
// GET /api/bookings - Get bookings (Admin: all, User: own)
// ============================================
export async function GET(req: NextRequest) {
  const { success, reset } = apiLimiter.check(req);
  if (!success) return rateLimitResponse(reset);

  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return NextResponse.json(errorResponse('Unauthorized'), { status: 401 });

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status') || undefined;
    const skip = (page - 1) * limit;

    const where = authUser.role === 'ADMIN'
      ? status ? { status: status as 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' } : {}
      : { userId: authUser.userId };

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          property: {
            select: {
              id: true,
              title_ar: true,
              title_en: true,
              city: true,
              type: true,
              price: true,
              images: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
        },
      }),
      prisma.booking.count({ where }),
    ]);

    // Parse property images
    const parsedBookings = bookings.map((b) => ({
      ...b,
      property: b.property
        ? {
            ...b.property,
            images: typeof b.property.images === 'string'
              ? JSON.parse(b.property.images)
              : b.property.images,
            price: Number(b.property.price),
          }
        : null,
    }));

    return NextResponse.json(
      successResponse({
        data: parsedBookings,
        pagination: getPaginationMeta(total, page, limit),
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('[BOOKINGS GET ERROR]', error);
    return NextResponse.json(errorResponse('Internal server error'), { status: 500 });
  }
}

// ============================================
// POST /api/bookings - Create booking (Authenticated)
// ============================================
export async function POST(req: NextRequest) {
  const { success, reset } = apiLimiter.check(req);
  if (!success) return rateLimitResponse(reset);

  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return NextResponse.json(errorResponse('Unauthorized'), { status: 401 });

    const body = await req.json();
    const validation = bookingSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        errorResponse('Validation failed', validation.error.flatten().fieldErrors as Record<string, string[]>),
        { status: 422 }
      );
    }

    const { propertyId, bookingType, message, visitDate } = validation.data;

    // Check property exists and is available
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      return NextResponse.json(errorResponse('Property not found'), { status: 404 });
    }

    if (property.status !== 'AVAILABLE') {
      return NextResponse.json(
        errorResponse('Property is not available for booking'),
        { status: 400 }
      );
    }

    // Check for duplicate pending booking
    const existingBooking = await prisma.booking.findFirst({
      where: {
        propertyId,
        userId: authUser.userId,
        status: 'PENDING',
      },
    });

    if (existingBooking) {
      return NextResponse.json(
        errorResponse('You already have a pending booking for this property'),
        { status: 409 }
      );
    }

    const booking = await prisma.booking.create({
      data: {
        propertyId,
        userId: authUser.userId,
        bookingType,
        message: message || null,
        visitDate: visitDate ? new Date(visitDate) : null,
        status: 'PENDING',
      },
      include: {
        property: {
          select: {
            id: true,
            title_ar: true,
            title_en: true,
            city: true,
            type: true,
            price: true,
          },
        },
      },
    });

    return NextResponse.json(
      successResponse(booking, 'Booking created successfully'),
      { status: 201 }
    );
  } catch (error) {
    console.error('[BOOKINGS POST ERROR]', error);
    return NextResponse.json(errorResponse('Internal server error'), { status: 500 });
  }
}
