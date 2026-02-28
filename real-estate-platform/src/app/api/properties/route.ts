import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { propertySchema, propertyFilterSchema } from '@/lib/validations';
import { apiLimiter, rateLimitResponse } from '@/lib/rate-limit';
import { successResponse, errorResponse, getPaginationMeta } from '@/lib/utils';
import type { Prisma } from '@prisma/client';

// ============================================
// GET /api/properties - List properties with filters
// ============================================
export async function GET(req: NextRequest) {
  const { success, reset } = apiLimiter.check(req);
  if (!success) return rateLimitResponse(reset);

  try {
    const { searchParams } = new URL(req.url);

    // Read raw status before schema validation — 'ALL' bypasses the enum check
    const rawStatus = searchParams.get('status');
    const showAll = rawStatus === 'ALL';

    const filterValidation = propertyFilterSchema.safeParse({
      city: searchParams.get('city') || undefined,
      type: searchParams.get('type') || undefined,
      minPrice: searchParams.get('minPrice') || undefined,
      maxPrice: searchParams.get('maxPrice') || undefined,
      bedrooms: searchParams.get('bedrooms') || undefined,
      // Only pass status to schema if it's a valid enum value
      status: showAll ? undefined : (rawStatus || undefined),
      search: searchParams.get('search') || undefined,
      page: searchParams.get('page') || 1,
      limit: searchParams.get('limit') || 12,
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortOrder: searchParams.get('sortOrder') || 'desc',
    });

    if (!filterValidation.success) {
      return NextResponse.json(
        errorResponse('Invalid filter parameters'),
        { status: 422 }
      );
    }

    const { city, type, minPrice, maxPrice, bedrooms, status, search, page, limit, sortBy, sortOrder } =
      filterValidation.data;

    // Build where clause
    const where: Prisma.PropertyWhereInput = {};

    if (city) where.city = { contains: city };
    if (type) where.type = type;
    if (showAll) {
      // No status filter — admin sees all properties
    } else if (status) {
      where.status = status;
    } else {
      where.status = 'AVAILABLE'; // Default: public sees only available
    }
    if (bedrooms !== undefined) where.bedrooms = bedrooms;

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = minPrice;
      if (maxPrice) where.price.lte = maxPrice;
    }

    if (search) {
      where.OR = [
        { title_ar: { contains: search } },
        { title_en: { contains: search } },
        { city: { contains: search } },
        { address_ar: { contains: search } },
        { address_en: { contains: search } },
      ];
    }

    const skip = (page - 1) * limit;

    // Execute queries in parallel
    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.property.count({ where }),
    ]);

    // Parse JSON fields
    const parsedProperties = properties.map((p) => ({
      ...p,
      images: typeof p.images === 'string' ? JSON.parse(p.images) : p.images,
      amenities: typeof p.amenities === 'string' ? JSON.parse(p.amenities) : p.amenities,
      price: Number(p.price),
      area: Number(p.area),
    }));

    return NextResponse.json(
      successResponse({
        data: parsedProperties,
        pagination: getPaginationMeta(total, page, limit),
      }),
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      }
    );
  } catch (error) {
    console.error('[PROPERTIES GET ERROR]', error);
    return NextResponse.json(errorResponse('Internal server error'), { status: 500 });
  }
}

// ============================================
// POST /api/properties - Create property (Authenticated users)
// ============================================
export async function POST(req: NextRequest) {
  const { success, reset } = apiLimiter.check(req);
  if (!success) return rateLimitResponse(reset);

  try {
    const authUser = await getAuthUser(req);

    if (!authUser) {
      return NextResponse.json(errorResponse('Unauthorized'), { status: 401 });
    }

    // Allow both regular users and admins to create properties

    const body = await req.json();

    const validation = propertySchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        errorResponse('Validation failed', validation.error.flatten().fieldErrors as Record<string, string[]>),
        { status: 422 }
      );
    }

    const { amenities, ...data } = validation.data;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const property = await (prisma.property as any).create({
      data: {
        ...data,
        images: JSON.stringify(body.images || []),
        amenities: JSON.stringify(amenities || []),
        userId: authUser.userId, // Track property owner
      },
    });

    return NextResponse.json(
      successResponse(
        {
          ...property,
          images: JSON.parse(property.images as string),
          amenities: JSON.parse(property.amenities as string),
          price: Number(property.price),
          area: Number(property.area),
        },
        'Property created successfully'
      ),
      { status: 201 }
    );
  } catch (error) {
    console.error('[PROPERTIES POST ERROR]', error);
    return NextResponse.json(errorResponse('Internal server error'), { status: 500 });
  }
}
