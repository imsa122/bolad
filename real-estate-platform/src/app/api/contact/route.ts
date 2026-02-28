import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { contactSchema } from '@/lib/validations';
import { apiLimiter, rateLimitResponse } from '@/lib/rate-limit';
import { successResponse, errorResponse, getPaginationMeta } from '@/lib/utils';

// ============================================
// POST /api/contact - Submit contact form
// ============================================
export async function POST(req: NextRequest) {
  // DEV: 50/min | PROD: 5/min
  const contactLimit = process.env.NODE_ENV === 'development' ? 50 : 5;
  const { success, reset } = apiLimiter.check(req, contactLimit);
  if (!success) return rateLimitResponse(reset);

  try {
    const body = await req.json();
    const validation = contactSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        errorResponse('Validation failed', validation.error.flatten().fieldErrors as Record<string, string[]>),
        { status: 422 }
      );
    }

    const contact = await prisma.contact.create({
      data: validation.data,
    });

    return NextResponse.json(
      successResponse(contact, 'Message sent successfully'),
      { status: 201 }
    );
  } catch (error) {
    console.error('[CONTACT POST ERROR]', error);
    return NextResponse.json(errorResponse('Internal server error'), { status: 500 });
  }
}

// ============================================
// GET /api/contact - Get contacts (Admin only)
// ============================================
export async function GET(req: NextRequest) {
  const { success, reset } = apiLimiter.check(req);
  if (!success) return rateLimitResponse(reset);

  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return NextResponse.json(errorResponse('Unauthorized'), { status: 401 });
    if (authUser.role !== 'ADMIN') return NextResponse.json(errorResponse('Forbidden'), { status: 403 });

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status') || undefined;
    const skip = (page - 1) * limit;

    const where = status ? { status: status as 'UNREAD' | 'READ' | 'REPLIED' } : {};

    const [contacts, total] = await Promise.all([
      prisma.contact.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.contact.count({ where }),
    ]);

    return NextResponse.json(
      successResponse({
        data: contacts,
        pagination: getPaginationMeta(total, page, limit),
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('[CONTACT GET ERROR]', error);
    return NextResponse.json(errorResponse('Internal server error'), { status: 500 });
  }
}
