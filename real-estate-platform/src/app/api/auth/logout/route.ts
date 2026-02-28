import { NextResponse } from 'next/server';
import { successResponse } from '@/lib/utils';

export async function POST() {
  const response = NextResponse.json(
    successResponse(null, 'Logged out successfully'),
    { status: 200 }
  );

  // Clear auth cookies
  response.cookies.set('auth_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });

  // Clear the non-HTTP-only auth state cookie
  response.cookies.set('auth_state', '', {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });

  response.cookies.set('refresh_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });

  return response;
}
