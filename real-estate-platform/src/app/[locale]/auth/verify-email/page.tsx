'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Mail, CheckCircle2, RefreshCw, ArrowLeft, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import OtpInput from '@/components/auth/OtpInput';
import toast from 'react-hot-toast';

type Props = { params: { locale: string } };

// ── Inner component uses useSearchParams — must be inside Suspense ──
function VerifyEmailContent({ locale }: { locale: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const isRTL = locale === 'ar';
  const ArrowIcon = isRTL ? ArrowRight : ArrowLeft;

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState('');
  const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [expiresIn, setExpiresIn] = useState(600); // 10 minutes

  // ── Countdown timer for OTP expiry ──
  useEffect(() => {
    if (expiresIn <= 0 || verified) return;
    const timer = setInterval(() => {
      setExpiresIn((prev) => {
        if (prev <= 1) { clearInterval(timer); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [expiresIn, verified]);

  // ── Cooldown timer for resend ──
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) { clearInterval(timer); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // ── Redirect if no email ──
  useEffect(() => {
    if (!email) router.replace(`/${locale}/auth/register`);
  }, [email, locale, router]);


  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // ── Verify OTP ──
  const handleVerify = useCallback(async () => {
    if (otp.length !== 6) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, locale }),
      });
      const data = await res.json();

      if (data.success) {
        setVerified(true);
        toast.success(isRTL ? 'تم التحقق بنجاح!' : 'Email verified!');
        setTimeout(() => router.push(`/${locale}/auth/login?verified=1`), 2500);
      } else {
        setError(data.error || (isRTL ? 'رمز غير صحيح' : 'Invalid code'));
        if (data.attemptsLeft !== undefined) setAttemptsLeft(data.attemptsLeft);
        if (data.requiresNewOtp) {
          setOtp('');
          setExpiresIn(0);
        }
      }
    } catch {
      setError(isRTL ? 'حدث خطأ. يرجى المحاولة مرة أخرى.' : 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [otp, email, locale, isRTL, router]);

  // Auto-submit when all 6 digits entered
  useEffect(() => {
    if (otp.length === 6 && !loading && !verified) {
      handleVerify();
    }
  }, [otp, loading, verified, handleVerify]);

  // ── Resend OTP ──
  const handleResend = async () => {
    if (resending || cooldown > 0) return;
    setResending(true);
    setError('');
    setOtp('');

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, locale }),
      });
      const data = await res.json();

      if (data.success) {
        setExpiresIn(600);
        setAttemptsLeft(null);
        setCooldown(60);
        toast.success(isRTL ? 'تم إرسال رمز جديد!' : 'New OTP sent!');
      } else {
        if (data.retryAfter) setCooldown(data.retryAfter);
        setError(data.error || (isRTL ? 'فشل الإرسال' : 'Failed to resend'));
      }
    } catch {
      setError(isRTL ? 'حدث خطأ. يرجى المحاولة مرة أخرى.' : 'An error occurred.');
    } finally {
      setResending(false);
    }
  };

// ── Success State ──
  if (verified) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800 flex items-center justify-center p-4" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="bg-white rounded-3xl p-10 max-w-md w-full text-center shadow-2xl animate-fade-in">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-bold text-dark-900 mb-3">
            {isRTL ? 'تم التحقق بنجاح! 🎉' : 'Email Verified! 🎉'}
          </h1>
          <p className="text-dark-500 mb-6">
            {isRTL
              ? 'تم التحقق من بريدك الإلكتروني. جاري تحويلك لصفحة تسجيل الدخول...'
              : 'Your email has been verified. Redirecting to login...'}
          </p>
          <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
            <div className="bg-emerald-500 h-1.5 rounded-full animate-[progress_2.5s_linear_forwards]" style={{ width: '100%', animation: 'none', transition: 'width 2.5s linear' }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800 flex items-center justify-center p-4" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-700 to-primary-500 p-8 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">
            {isRTL ? 'تحقق من بريدك الإلكتروني' : 'Verify Your Email'}
          </h1>
          <p className="text-primary-100 text-sm">
            {isRTL ? 'أدخل رمز التحقق المرسل إلى' : 'Enter the verification code sent to'}
          </p>
          <p className="text-white font-semibold text-sm mt-1 break-all">{email}</p>
        </div>

        {/* Body */}
        <div className="p-8">
          {/* Expiry Timer */}
          <div className={`flex items-center justify-center gap-2 mb-6 text-sm font-medium ${
            expiresIn > 60 ? 'text-dark-500' : expiresIn > 0 ? 'text-amber-600' : 'text-red-500'
          }`}>
            <RefreshCw className={`w-4 h-4 ${expiresIn > 0 && expiresIn <= 60 ? 'animate-spin' : ''}`} />
            {expiresIn > 0
              ? (isRTL ? `ينتهي خلال ${formatTime(expiresIn)}` : `Expires in ${formatTime(expiresIn)}`)
              : (isRTL ? 'انتهت صلاحية الرمز' : 'Code expired')}
          </div>

          {/* OTP Input */}
          <div className="mb-6">
            <OtpInput
              value={otp}
              onChange={setOtp}
              disabled={loading || expiresIn === 0}
              hasError={!!error}
              isRTL={isRTL}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl mb-5 text-sm text-red-700 animate-fade-in">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <p>{error}</p>
                {attemptsLeft !== null && attemptsLeft > 0 && (
                  <p className="text-xs mt-1 text-red-500">
                    {isRTL ? `المحاولات المتبقية: ${attemptsLeft}` : `Attempts remaining: ${attemptsLeft}`}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Verify Button */}
          <button
            onClick={handleVerify}
            disabled={otp.length !== 6 || loading || expiresIn === 0}
            className="w-full py-3.5 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 mb-5"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                {isRTL ? 'جاري التحقق...' : 'Verifying...'}
              </>
            ) : (
              isRTL ? 'تحقق من الرمز' : 'Verify Code'
            )}
          </button>

          {/* Resend Section */}
          <div className="text-center">
            <p className="text-sm text-dark-400 mb-2">
              {isRTL ? 'لم تستلم الرمز؟' : "Didn't receive the code?"}
            </p>
            <button
              onClick={handleResend}
              disabled={resending || cooldown > 0}
              className="text-sm font-semibold text-primary-600 hover:text-primary-700 disabled:text-gray-400 transition-colors flex items-center gap-1.5 mx-auto"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
              {cooldown > 0
                ? (isRTL ? `إعادة الإرسال خلال ${cooldown}ث` : `Resend in ${cooldown}s`)
                : resending
                ? (isRTL ? 'جاري الإرسال...' : 'Sending...')
                : (isRTL ? 'إعادة إرسال الرمز' : 'Resend Code')}
            </button>
          </div>

          {/* Back Link */}
        <div className="mt-6 pt-5 border-t border-gray-100 text-center">
            <Link
              href={`/${locale}/auth/register`}
              className="inline-flex items-center gap-1.5 text-sm text-dark-400 hover:text-primary-600 transition-colors"
            >
              <ArrowIcon className="w-3.5 h-3.5" />
              {isRTL ? 'العودة إلى التسجيل' : 'Back to Register'}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Fallback while Suspense loads ──
function VerifyEmailFallback({ locale }: { locale: string }) {
  const isRTL = locale === 'ar';
  return (
    <div
      className="min-h-screen bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800 flex items-center justify-center p-4"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-12 flex flex-col items-center gap-4">
        <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
        <p className="text-dark-500 text-sm">
          {isRTL ? 'جاري التحميل...' : 'Loading...'}
        </p>
      </div>
    </div>
  );
}

// ── Default export wraps with Suspense (required for useSearchParams in App Router) ──
export default function VerifyEmailPage({ params: { locale } }: Props) {
  return (
    <Suspense fallback={<VerifyEmailFallback locale={locale} />}>
      <VerifyEmailContent locale={locale} />
    </Suspense>
  );
}
