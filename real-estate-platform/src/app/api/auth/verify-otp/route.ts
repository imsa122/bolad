import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import {
  verifyOtp,
  isOtpExpired,
  OTP_MAX_ATTEMPTS,
} from '@/lib/otp';
import { authLimiter, rateLimitResponse } from '@/lib/rate-limit';

// ============================================
// INPUT VALIDATION
// ============================================
const verifyOtpSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase().trim(),
  otp: z
    .string()
    .length(6, 'OTP must be exactly 6 digits')
    .regex(/^\d{6}$/, 'OTP must contain only digits'),
  locale: z.enum(['ar', 'en']).optional().default('ar'),
});

// ============================================
// Raw SQL types (avoids stale Prisma client type cache)
// ============================================
interface OtpRecord {
  id: number;
  email: string;
  otpHash: string;
  expiresAt: Date;
  attempts: number;
  sendCount: number;
  lastSentAt: Date;
  createdAt: Date;
}

// ============================================
// POST /api/auth/verify-otp
// ============================================
export async function POST(req: NextRequest) {
  // ── 1. IP-based rate limiting ──
  const rl = authLimiter.check(req, 20);
  if (!rl.success) return rateLimitResponse(rl.reset);

  // ── 2. Parse & validate body ──
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  const parsed = verifyOtpSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: 'Validation failed',
        errors: parsed.error.flatten().fieldErrors,
      },
      { status: 422 }
    );
  }

  const { email, otp, locale } = parsed.data;
  const isAr = locale === 'ar';

  // ── 3. Fetch OTP record via raw SQL ──
  const records = await prisma.$queryRaw<OtpRecord[]>`
    SELECT id, email, otpHash, expiresAt, attempts, sendCount, lastSentAt, createdAt
    FROM email_verifications
    WHERE email = ${email}
    LIMIT 1
  `;
  const record = records[0] ?? null;

  // Generic error — don't reveal whether email exists or OTP was sent
  const invalidError = {
    success: false,
    error: isAr
      ? 'رمز التحقق غير صحيح أو منتهي الصلاحية.'
      : 'Invalid or expired verification code.',
  };

  if (!record) {
    return NextResponse.json(invalidError, { status: 400 });
  }

  // ── 4. Check attempt limit BEFORE verifying (prevent brute force) ──
  if (record.attempts >= OTP_MAX_ATTEMPTS) {
    // Delete the exhausted record
    await prisma.$executeRaw`
      DELETE FROM email_verifications WHERE email = ${email}
    `;

    return NextResponse.json(
      {
        success: false,
        error: isAr
          ? `تم تجاوز الحد الأقصى للمحاولات (${OTP_MAX_ATTEMPTS}). يرجى طلب رمز جديد.`
          : `Maximum attempts (${OTP_MAX_ATTEMPTS}) exceeded. Please request a new OTP.`,
        requiresNewOtp: true,
      },
      { status: 429 }
    );
  }

  // ── 5. Check expiry ──
  if (isOtpExpired(record.expiresAt)) {
    // Clean up expired record
    await prisma.$executeRaw`
      DELETE FROM email_verifications WHERE email = ${email}
    `;
    return NextResponse.json(
      {
        success: false,
        error: isAr
          ? 'انتهت صلاحية رمز التحقق. يرجى طلب رمز جديد.'
          : 'Verification code has expired. Please request a new OTP.',
        requiresNewOtp: true,
      },
      { status: 400 }
    );
  }

  // ── 6. Increment attempt count BEFORE verifying (timing-safe) ──
  await prisma.$executeRaw`
    UPDATE email_verifications
    SET attempts = attempts + 1
    WHERE email = ${email}
  `;

  // ── 7. Constant-time OTP comparison (bcrypt.compare) ──
  const isValid = await verifyOtp(otp, record.otpHash);

  if (!isValid) {
    const attemptsLeft = OTP_MAX_ATTEMPTS - (record.attempts + 1);
    return NextResponse.json(
      {
        success: false,
        error: isAr
          ? `رمز التحقق غير صحيح. المحاولات المتبقية: ${attemptsLeft}`
          : `Invalid verification code. Attempts remaining: ${attemptsLeft}`,
        attemptsLeft: Math.max(0, attemptsLeft),
      },
      { status: 400 }
    );
  }

  // ── 8. OTP is valid — mark user as verified & delete OTP record ──
  // Use raw SQL to avoid stale Prisma type cache for isEmailVerified
  await prisma.$executeRaw`
    UPDATE users SET isEmailVerified = TRUE WHERE email = ${email}
  `;
  await prisma.$executeRaw`
    DELETE FROM email_verifications WHERE email = ${email}
  `;

  // ── 9. Success ──
  return NextResponse.json(
    {
      success: true,
      message: isAr
        ? 'تم التحقق من بريدك الإلكتروني بنجاح! يمكنك الآن تسجيل الدخول.'
        : 'Email verified successfully! You can now log in.',
    },
    { status: 200 }
  );
}
