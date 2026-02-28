import crypto from 'crypto';
import bcrypt from 'bcryptjs';

// ============================================
// CONSTANTS
// ============================================
export const OTP_LENGTH = 6;
export const OTP_EXPIRY_MINUTES = 10;
export const OTP_EXPIRY_MS = OTP_EXPIRY_MINUTES * 60 * 1000;
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_MAX_SENDS_PER_HOUR = 3;
export const OTP_RESEND_COOLDOWN_SECONDS = 60;
export const OTP_BCRYPT_ROUNDS = 10; // Lower than password (12) for speed — OTPs are short-lived

// ============================================
// GENERATE SECURE OTP
// ============================================
/**
 * Generates a cryptographically secure 6-digit OTP.
 * Uses crypto.randomInt which is CSPRNG-backed (not Math.random).
 * Range: 100000–999999 (always 6 digits, no leading zeros).
 */
export function generateOtp(): string {
  const otp = crypto.randomInt(100_000, 1_000_000); // [100000, 999999]
  return otp.toString();
}

// ============================================
// HASH OTP
// ============================================
/**
 * Hashes the OTP using bcrypt before storing in DB.
 * OTP is NEVER stored in plain text.
 */
export async function hashOtp(otp: string): Promise<string> {
  return bcrypt.hash(otp, OTP_BCRYPT_ROUNDS);
}

// ============================================
// VERIFY OTP
// ============================================
/**
 * Constant-time comparison via bcrypt.compare.
 * Prevents timing attacks.
 */
export async function verifyOtp(plainOtp: string, hashedOtp: string): Promise<boolean> {
  return bcrypt.compare(plainOtp, hashedOtp);
}

// ============================================
// EXPIRY HELPERS
// ============================================
export function getOtpExpiryDate(): Date {
  return new Date(Date.now() + OTP_EXPIRY_MS);
}

export function isOtpExpired(expiresAt: Date): boolean {
  return new Date() > expiresAt;
}

// ============================================
// RATE LIMIT HELPERS
// ============================================
/**
 * Check if the resend cooldown has passed (60 seconds).
 */
export function isInCooldown(lastSentAt: Date): { inCooldown: boolean; secondsLeft: number } {
  const elapsed = Date.now() - lastSentAt.getTime();
  const cooldownMs = OTP_RESEND_COOLDOWN_SECONDS * 1000;
  if (elapsed < cooldownMs) {
    return {
      inCooldown: true,
      secondsLeft: Math.ceil((cooldownMs - elapsed) / 1000),
    };
  }
  return { inCooldown: false, secondsLeft: 0 };
}

/**
 * Check if the hourly send limit has been reached.
 * sendCount resets when a new OTP record is created (after expiry).
 */
export function isHourlyLimitReached(sendCount: number, createdAt: Date): boolean {
  const hourMs = 60 * 60 * 1000;
  const withinHour = Date.now() - createdAt.getTime() < hourMs;
  return withinHour && sendCount >= OTP_MAX_SENDS_PER_HOUR;
}

// ============================================
// FORMAT OTP FOR DISPLAY (email template)
// ============================================
/**
 * Formats OTP with a space in the middle for readability: "123 456"
 */
export function formatOtpForDisplay(otp: string): string {
  return `${otp.slice(0, 3)} ${otp.slice(3)}`;
}
