'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Loader2, Building2, LogIn, CheckCircle2, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import { loginSchema, type LoginInput } from '@/lib/validations';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

// ── Inner component uses useSearchParams — must be inside Suspense ──
function LoginContent() {
  const t = useTranslations('auth.login');
  const locale = useLocale() as 'ar' | 'en';
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const isRTL = locale === 'ar';

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const redirect = searchParams.get('redirect') || `/${locale}`;
  const isVerified = searchParams.get('verified') === '1';

  // Show success toast when redirected from email verification
  useEffect(() => {
    if (isVerified) {
      toast.success(
        locale === 'ar'
          ? '✅ تم التحقق من بريدك الإلكتروني! يمكنك الآن تسجيل الدخول.'
          : '✅ Email verified! You can now sign in.',
        { duration: 5000 }
      );
    }
  }, [isVerified, locale]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true);
    try {
      const result = await login(data.email, data.password);
      toast.success(locale === 'ar' ? 'تم تسجيل الدخول بنجاح!' : 'Logged in successfully!');

      if (result.user.role === 'ADMIN') {
        router.push(`/${locale}/admin`);
      } else {
        router.push(redirect);
      }
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast.error(
        error.message === 'Request failed with status code 401'
          ? (locale === 'ar' ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة' : 'Invalid email or password')
          : (locale === 'ar' ? 'حدث خطأ ما' : 'Something went wrong')
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800 flex items-center justify-center p-4" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 start-1/4 w-96 h-96 bg-primary-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 end-1/4 w-96 h-96 bg-primary-400/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href={`/${locale}`} className="inline-flex items-center gap-2 group">
            <div className="w-12 h-12 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl flex items-center justify-center group-hover:bg-white/20 transition-colors">
              <Building2 className="w-7 h-7 text-white" />
            </div>
            <div className="text-start">
              <p className="text-white font-bold text-xl">
                {locale === 'ar' ? 'عقارات السعودية' : 'Saudi Real Estate'}
              </p>
              <p className="text-white/60 text-xs">
                {locale === 'ar' ? 'منصتك العقارية الأولى' : 'Your Premier Property Platform'}
              </p>
            </div>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          {/* Email Verified Banner */}
          {isVerified && (
            <div className="flex items-center gap-3 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl mb-6 animate-fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
              <p className="text-sm text-emerald-700 font-medium">
                {locale === 'ar'
                  ? 'تم التحقق من بريدك الإلكتروني بنجاح! سجّل دخولك الآن.'
                  : 'Email verified successfully! Sign in below.'}
              </p>
            </div>
          )}

          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-dark-900 mb-2">{t('title')}</h1>
            <p className="text-dark-500 text-sm">{t('subtitle')}</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-1.5">{t('email')}</label>
              <input
                type="email"
                {...register('email')}
                placeholder="example@email.com"
                dir="ltr"
                className={cn(
                  'w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all',
                  errors.email ? 'border-red-400 bg-red-50' : 'border-gray-200'
                )}
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-dark-700">{t('password')}</label>
                <Link href={`/${locale}`} className="text-xs text-primary-600 hover:text-primary-700">
                  {t('forgot')}
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  placeholder="••••••••"
                  className={cn(
                    'w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all pe-12',
                    errors.password ? 'border-red-400 bg-red-50' : 'border-gray-200'
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center justify-center gap-2 w-full py-3.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-sm mt-2"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <LogIn className="w-5 h-5" />
              )}
              {isLoading
                ? (locale === 'ar' ? 'جاري تسجيل الدخول...' : 'Signing in...')
                : t('submit')}
            </button>
          </form>

          {/* Register Link */}
          <p className="text-center text-sm text-dark-500 mt-6">
            {t('noAccount')}{' '}
            <Link
              href={`/${locale}/auth/register`}
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              {t('register')}
            </Link>
          </p>

          {/* Verify Email Link */}
          <div className="mt-4 text-center">
            <Link
              href={`/${locale}/auth/verify-email`}
              className="inline-flex items-center gap-1.5 text-xs text-dark-400 hover:text-primary-600 transition-colors"
            >
              <Mail className="w-3.5 h-3.5" />
              {locale === 'ar' ? 'لم تتحقق من بريدك الإلكتروني بعد؟' : "Haven't verified your email yet?"}
            </Link>
          </div>

          {/* Demo Credentials */}
          <div className="mt-5 p-4 bg-gray-50 rounded-xl border border-gray-100">
            <p className="text-xs font-medium text-dark-600 mb-2">
              {locale === 'ar' ? '🔑 بيانات تجريبية:' : '🔑 Demo Credentials:'}
            </p>
            <div className="space-y-1 text-xs text-dark-500" dir="ltr">
              <p><strong>Admin:</strong> admin@realestate.sa / Admin@123456</p>
              <p><strong>User:</strong> user@realestate.sa / User@123456</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Fallback ──
function LoginFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800 flex items-center justify-center">
      <Loader2 className="w-10 h-10 text-white animate-spin" />
    </div>
  );
}

// ── Default export wraps with Suspense (required for useSearchParams in App Router) ──
export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginContent />
    </Suspense>
