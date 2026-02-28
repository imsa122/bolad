import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { verifyToken, extractTokenFromHeader } from './jwt';
import type { JWTPayload, Role } from '@/types';

// ============================================
// GET AUTH USER FROM REQUEST (API Routes)
// ============================================
export async function getAuthUser(req: NextRequest): Promise<JWTPayload | null> {
  try {
    // Try Authorization header first
    const authHeader = req.headers.get('authorization');
    let token = extractTokenFromHeader(authHeader);

    // Fallback to cookie
    if (!token) {
      token = req.cookies.get('auth_token')?.value || null;
    }

    if (!token) return null;

    return verifyToken(token);
  } catch {
    return null;
  }
}

// ============================================
// GET AUTH USER FROM SERVER COMPONENT
// ============================================
export async function getServerAuthUser(): Promise<JWTPayload | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) return null;
    return verifyToken(token);
  } catch {
    return null;
  }
}

// ============================================
// REQUIRE AUTH (throws if not authenticated)
// ============================================
export async function requireAuth(req: NextRequest): Promise<JWTPayload> {
  const user = await getAuthUser(req);
  if (!user) {
    throw new Error('UNAUTHORIZED');
  }
  return user;
}

// ============================================
// REQUIRE ADMIN ROLE
// ============================================
export async function requireAdmin(req: NextRequest): Promise<JWTPayload> {
  const user = await requireAuth(req);
  if (user.role !== 'ADMIN') {
    throw new Error('FORBIDDEN');
  }
  return user;
}

// ============================================
// CHECK ROLE
// ============================================
export function hasRole(user: JWTPayload | null, role: Role): boolean {
  return user?.role === role;
}

export function isAdmin(user: JWTPayload | null): boolean {
  return user?.role === 'ADMIN';
}

// ============================================
// AUTH ERROR RESPONSES
// ============================================
export function createAuthErrorResponse(error: string) {
  if (error === 'UNAUTHORIZED' || error === 'TOKEN_EXPIRED' || error === 'INVALID_TOKEN') {
    return { status: 401, message: 'Unauthorized. Please login.' };
  }
  if (error === 'FORBIDDEN') {
    return { status: 403, message: 'Forbidden. Insufficient permissions.' };
  }
  return { status: 500, message: 'Authentication error.' };
}
