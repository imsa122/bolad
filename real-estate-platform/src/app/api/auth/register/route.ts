import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { signToken, signRefreshToken } from '@/lib/jwt';
import { registerSchema } from '@/lib/validations';
import { authLimiter, rateLimitResponse } from '@/lib/rate-limit';
import { successResponse, errorResponse } from '@/lib/utils';
import { generateOtp, hashOtp, getOtpExpiryDate } from '@/lib/otp';
import { sendOtpEmail } from '@/lib/mailer';

export async function POST(req: NextRequest) {
  // Rate limiting
  const { success, remaining, reset } = authLimiter.check(req);
  if (!success) {
    return rateLimitResponse(reset);
  }

  try {
    const body = await req.json();

    // Validate input
    const validation = registerSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        errorResponse('Validation failed', validation.error.flatten().fieldErrors as Record<string, string[]>),
        { status: 422 }
      );
    }

    const { name, email, password, phone } = validation.data;

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        errorResponse('Email already registered'),
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user (isEmailVerified defaults to false per schema)
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone: phone || null,
        role: 'USER',
        // isEmailVerified defaults to false — omit to avoid stale Prisma type cache
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        createdAt: true,
      },
    });

    // ── Auto-send OTP for email verification ──
    let otpSent = false;
    let devOtp: string | undefined;
    let generatedOtp: string | undefined;

    try {
      generatedOtp = generateOtp();
      const otpHash = await hashOtp(generatedOtp);
      const expiresAt = getOtpExpiryDate();

      // Use raw SQL to avoid stale Prisma type cache for EmailVerification model
      const now = new Date();
      await prisma.$executeRaw`
        INSERT INTO email_verifications (email, otpHash, expiresAt, attempts, sendCount, lastSentAt, createdAt)
        VALUES (${email}, ${otpHash}, ${expiresAt}, 0, 1, ${now}, ${now})
      `;

      await sendOtpEmail({ to: email, name, otp: generatedOtp, locale: 'ar' });
      otpSent = true;

      if (process.env.NODE_ENV === 'development') {
        devOtp = generatedOtp;
        console.log(`\n🔑 [DEV] Registration OTP for ${email}: ${generatedOtp}\n`);
      }
    } catch (otpError) {
      // OTP send failure is non-fatal — user can request resend
      console.error('[REGISTER] OTP send failed:', otpError);
      // In dev mode, always expose the OTP even if email failed
      if (process.env.NODE_ENV === 'development' && generatedOtp) {
        devOtp = generatedOtp;
        console.log(`\n🔑 [DEV] Registration OTP for ${email}: ${generatedOtp} (email send failed — using dev fallback)\n`);
      }
    }

    // Generate tokens
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role as 'USER' | 'ADMIN',
    };

    const token = signToken(tokenPayload);
    const refreshToken = signRefreshToken(tokenPayload);

    // Build response — include OTP verification redirect info
    const responseData = {
      user,
      token,
      requiresEmailVerification: true,
      otpSent,
      ...(process.env.NODE_ENV === 'development' && devOtp ? { devOtp } : {}),
    };

    const response = NextResponse.json(
      successResponse(responseData, 'Account created successfully. Please verify your email.'),
      { status: 201 }
    );

    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

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
    console.error('[REGISTER ERROR]', error);
    return NextResponse.json(
      errorResponse('Internal server error'),
      { status: 500 }
    );
  }
}
