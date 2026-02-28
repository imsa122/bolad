import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { signToken, signRefreshToken } from '@/lib/jwt';
import { loginSchema } from '@/lib/validations';
import { authLimiter, rateLimitResponse } from '@/lib/rate-limit';
import { successResponse, errorResponse } from '@/lib/utils';

export async function POST(req: NextRequest) {
  // Rate limiting
  const { success, reset } = authLimiter.check(req);
  if (!success) {
    return rateLimitResponse(reset);
  }

  try {
    const body = await req.json();

    // Validate input
    const validation = loginSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        errorResponse('Validation failed', validation.error.flatten().fieldErrors as Record<string, string[]>),
        { status: 422 }
      );
    }

    const { email, password } = validation.data;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Generic error to prevent user enumeration
    if (!user || !user.isActive) {
      return NextResponse.json(
        errorResponse('Invalid email or password'),
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        errorResponse('Invalid email or password'),
        { status: 401 }
      );
    }

    // Generate tokens
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role as 'USER' | 'ADMIN',
    };

    const token = signToken(tokenPayload);
    const refreshToken = signRefreshToken(tokenPayload);

    // Prepare user data (exclude password)
    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      avatar: user.avatar,
    };

    const response = NextResponse.json(
      successResponse({ user: userData, token }, 'Login successful'),
      { status: 200 }
    );

    // Set auth cookies
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });
    
    // Set a non-HTTP-only cookie for client-side auth state detection
    response.cookies.set('auth_state', 'authenticated', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    response.cookies.set('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('[LOGIN ERROR]', error);
    return NextResponse.json(
      errorResponse('Internal server error'),
      { status: 500 }
    );
  }
}
