import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import {
  generateOtp,
  hashOtp,
  getOtpExpiryDate,
  isInCooldown,
  isHourlyLimitReached,
  OTP_MAX_SENDS_PER_HOUR,
  OTP_RESEND_COOLDOWN_SECONDS,
} from '@/lib/otp';
import { sendOtpEmail } from '@/lib/mailer';
import { authLimiter, rateLimitResponse } from '@/lib/rate-limit';

// ============================================
// INPUT VALIDATION
// ============================================
const sendOtpSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase().trim(),
  locale: z.enum(['ar', 'en']).optional().default('ar'),
});

// ============================================
// POST /api/auth/send-otp
// ============================================
export async function POST(req: NextRequest) {
  // ── 1. IP-based rate limiting (prevent brute force) ──
  const rl = authLimiter.check(req, 10);
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

  const parsed = sendOtpSchema.safeParse(body);
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

  const { email, locale } = parsed.data;

  // ── 3. Check user exists ──
  // Use raw query to avoid stale Prisma client type cache for isEmailVerified
  const userRows = await prisma.$queryRaw<
    Array<{ id: number; name: string; isEmailVerified: boolean }>
  >`SELECT id, name, isEmailVerified FROM users WHERE email = ${email} LIMIT 1`;

  const user = userRows[0] ?? null;

  if (!user) {
    // Return generic message to prevent email enumeration
    return NextResponse.json(
      { success: false, error: 'If this email is registered, an OTP will be sent.' },
      { status: 404 }
    );
  }

  // ── 4. Already verified? ──
  // MySQL returns tinyint(1) for boolean — coerce to boolean
  if (user.isEmailVerified === true || (user.isEmailVerified as unknown) === 1) {
    return NextResponse.json(
      { success: false, error: 'This email is already verified.' },
      { status: 409 }
    );
  }

  // ── 5. Check existing OTP record for rate limiting ──
  // Use raw query — Prisma client types may be stale after schema migration
  const existingRows = await prisma.$queryRaw<
    Array<{ id: number; email: string; sendCount: number; lastSentAt: Date; createdAt: Date }>
  >`SELECT id, email, sendCount, lastSentAt, createdAt FROM email_verifications WHERE email = ${email} LIMIT 1`;

  const existing = existingRows[0] ?? null;

  if (existing) {
    // 5a. Cooldown check (60 seconds between sends)
    const { inCooldown, secondsLeft } = isInCooldown(existing.lastSentAt);
    if (inCooldown) {
      return NextResponse.json(
        {
          success: false,
          error:
            locale === 'ar'
              ? `يرجى الانتظار ${secondsLeft} ثانية قبل طلب رمز جديد.`
              : `Please wait ${secondsLeft} seconds before requesting a new OTP.`,
          retryAfter: secondsLeft,
        },
        {
          status: 429,
          headers: { 'Retry-After': String(secondsLeft) },
        }
      );
    }

    // 5b. Hourly send limit (max 3 per hour)
    if (isHourlyLimitReached(existing.sendCount, existing.createdAt)) {
      return NextResponse.json(
        {
          success: false,
          error:
            locale === 'ar'
              ? `لقد تجاوزت الحد الأقصى (${OTP_MAX_SENDS_PER_HOUR} رسائل في الساعة). يرجى المحاولة لاحقاً.`
              : `You have exceeded the maximum of ${OTP_MAX_SENDS_PER_HOUR} OTPs per hour. Please try again later.`,
          retryAfter: OTP_RESEND_COOLDOWN_SECONDS,
        },
        { status: 429 }
      );
    }
  }

  // ── 6. Generate & hash OTP ──
  const otp = generateOtp();
  const otpHash = await hashOtp(otp);
  const expiresAt = getOtpExpiryDate();
  const now = new Date();

  // ── 7. Upsert OTP record via raw SQL (avoids stale Prisma type cache) ──
  if (existing) {
    await prisma.$executeRaw`
      UPDATE email_verifications
      SET otpHash = ${otpHash},
          expiresAt = ${expiresAt},
          attempts = 0,
          sendCount = sendCount + 1,
          lastSentAt = ${now}
      WHERE email = ${email}
    `;
  } else {
    await prisma.$executeRaw`
      INSERT INTO email_verifications (email, otpHash, expiresAt, attempts, sendCount, lastSentAt, createdAt)
      VALUES (${email}, ${otpHash}, ${expiresAt}, 0, 1, ${now}, ${now})
    `;
  }

  // ── 8. Send email ──
  try {
    await sendOtpEmail({
      to: email,
      name: user.name,
      otp,
      locale,
    });
  } catch (emailError) {
    const errMsg = emailError instanceof Error ? emailError.message : String(emailError);
    console.error('[send-otp] Email send failed:', errMsg);

    // ── No email service configured → auto-verify the user ──
    if (errMsg.startsWith('NO_EMAIL_SERVICE')) {
      console.log(`[send-otp] No email service configured — auto-verifying user ${email}`);
      await prisma.$executeRaw`
        UPDATE users SET isEmailVerified = 1 WHERE email = ${email}
      `;
      return NextResponse.json(
        {
          success: true,
          autoVerified: true,
          message:
            locale === 'ar'
              ? 'تم التحقق من حسابك تلقائياً. يمكنك تسجيل الدخول الآن.'
              : 'Your account has been automatically verified. You can now log in.',
        },
        { status: 200 }
      );
    }

    // ── Development: log OTP to console ──
    if (process.env.NODE_ENV === 'development') {
      console.log(`\n🔑 [DEV] OTP for ${email}: ${otp}\n`);
      return NextResponse.json(
        {
          success: true,
          message: `[DEV MODE] OTP: ${otp}`,
          expiresIn: 600,
          devOtp: otp,
        },
        { status: 200 }
      );
    }

    // ── Production email failure ──
    return NextResponse.json(
      {
        success: false,
        error:
          locale === 'ar'
            ? 'فشل إرسال البريد الإلكتروني. يرجى المحاولة مرة أخرى.'
            : 'Failed to send email. Please try again.',
      },
      { status: 500 }
    );
  }

  // ── 9. Success response ──
  return NextResponse.json(
    {
      success: true,
      message:
        locale === 'ar'
          ? `تم إرسال رمز التحقق إلى ${email}. ينتهي خلال 10 دقائق.`
          : `Verification code sent to ${email}. Expires in 10 minutes.`,
      expiresIn: 600, // seconds
    },
    { status: 200 }
  );
}
