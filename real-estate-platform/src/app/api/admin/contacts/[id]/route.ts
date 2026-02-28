import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/utils';

// ============================================
// PATCH /api/admin/contacts/[id] - Update contact status
// ============================================
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return NextResponse.json(errorResponse('Unauthorized'), { status: 401 });
    if (authUser.role !== 'ADMIN') return NextResponse.json(errorResponse('Forbidden'), { status: 403 });

    const id = parseInt(params.id);
    if (isNaN(id)) return NextResponse.json(errorResponse('Invalid ID'), { status: 400 });

    const body = await req.json();
    const { status } = body;

    if (!['UNREAD', 'READ', 'REPLIED'].includes(status)) {
      return NextResponse.json(errorResponse('Invalid status'), { status: 400 });
    }

    const contact = await prisma.contact.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json(successResponse(contact, 'Contact updated'), { status: 200 });
  } catch (error) {
    console.error('[ADMIN CONTACTS PATCH ERROR]', error);
    return NextResponse.json(errorResponse('Internal server error'), { status: 500 });
  }
}

// ============================================
// DELETE /api/admin/contacts/[id] - Delete contact message
// ============================================
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return NextResponse.json(errorResponse('Unauthorized'), { status: 401 });
    if (authUser.role !== 'ADMIN') return NextResponse.json(errorResponse('Forbidden'), { status: 403 });

    const id = parseInt(params.id);
    if (isNaN(id)) return NextResponse.json(errorResponse('Invalid ID'), { status: 400 });

    await prisma.contact.delete({ where: { id } });

    return NextResponse.json(successResponse(null, 'Contact deleted'), { status: 200 });
  } catch (error) {
    console.error('[ADMIN CONTACTS DELETE ERROR]', error);
    return NextResponse.json(errorResponse('Internal server error'), { status: 500 });
  }
}
