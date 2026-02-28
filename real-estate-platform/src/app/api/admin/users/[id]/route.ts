import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/utils';

// ============================================
// PATCH /api/admin/users/[id] - Update user role or active status
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

    // Prevent admin from modifying their own role
    if (id === authUser.userId) {
      return NextResponse.json(errorResponse('Cannot modify your own account'), { status: 400 });
    }

    const body = await req.json();
    const updateData: Record<string, unknown> = {};

    if (body.role !== undefined) {
      if (!['USER', 'ADMIN'].includes(body.role)) {
        return NextResponse.json(errorResponse('Invalid role'), { status: 400 });
      }
      updateData.role = body.role;
    }

    if (body.isActive !== undefined) {
      updateData.isActive = Boolean(body.isActive);
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json(successResponse(user, 'User updated'), { status: 200 });
  } catch (error) {
    console.error('[ADMIN USERS PATCH ERROR]', error);
    return NextResponse.json(errorResponse('Internal server error'), { status: 500 });
  }
}

// ============================================
// DELETE /api/admin/users/[id] - Delete user
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

    if (id === authUser.userId) {
      return NextResponse.json(errorResponse('Cannot delete your own account'), { status: 400 });
    }

    await prisma.user.delete({ where: { id } });

    return NextResponse.json(successResponse(null, 'User deleted'), { status: 200 });
  } catch (error) {
    console.error('[ADMIN USERS DELETE ERROR]', error);
    return NextResponse.json(errorResponse('Internal server error'), { status: 500 });
  }
}
