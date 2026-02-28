'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Loader2, Building2, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import { registerSchema, type RegisterInput } from '@/lib/validations';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

export default function RegisterPage() {
  const t = useTranslations('auth.register');
  const locale = useLocale() as 'ar' | 'en';
  const router = useRouter();
  const { register: registerUser } = useAuth();
  const isRTL = locale === 'ar';

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterInput) => {
    setIsLoading(true);
    try {
      // registerUser returns data.data: { user, token, requiresEmailVerification, autoVerified, otpSent, devOtp? }
      const result = await registerUser(data);

      if (result?.autoVerified) {
        // ── No email service configured — user is auto-verified ──
        toast.success(
          locale === 'ar'
            ? 'تم إنشاء الحساب والتحقق منه بنجاح! يمكنك تسجيل الدخول الآن 🎉'
            : 'Account created and verified! You can now log in 🎉',
          { duration: 4000 }
        );
        router.push(`/${locale}/auth/login?verified=1`);
      } else if (result?.requiresEmailVerification) {
        // ── Redirect to OTP verification page ──
        toast.success(
          locale === 'ar'
            ? 'تم إنشاء الحساب! يرجى التحقق من بريدك الإلكتروني 📧'
            : 'Account created! Please verify your email 📧',
          { duration: 4000 }
        );
        const email = encodeURIComponent(data.email);
        router.push(`/${locale}/auth/verify-email?email=${email}`);
      } else {
        // Fallback: no verification required
        toast.success(
          locale === 'ar' ? 'تم إنشاء الحساب بنجاح! مرحباً بك 🎉' : 'Account created successfully! Welcome 🎉'
        );
        router.push(`/${locale}`);
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } }; message?: string };
      toast.error(
        error.response?.data?.error ||
        error.message ||
        (locale === 'ar' ? 'حدث خطأ ما، يرجى المحاولة مرة أخرى' : 'Something went wrong, please try again')
      );
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = (hasError?: boolean) =>
    cn(
      'w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all',
      hasError ? 'border-red-400 bg-red-50' : 'border-gray-200'
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800 flex items-center justify-center p-4" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 end-1/4 w-96 h-96 bg-primary-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 start-1/4 w-96 h-96 bg-primary-400/10 rounded-full blur-3xl" />
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
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-dark-900 mb-2">{t('title')}</h1>
            <p className="text-dark-500 text-sm">{t('subtitle')}</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-1.5">{t('name')}</label>
              <input
                type="text"
                {...register('name')}
                placeholder={locale === 'ar' ? 'الاسم الكامل' : 'Full Name'}
                className={inputClass(!!errors.name)}
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-1.5">{t('email')}</label>
              <input
                type="email"
                {...register('email')}
                placeholder="example@email.com"
                dir="ltr"
                className={inputClass(!!errors.email)}
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-1.5">
                {t('phone')} <span className="text-dark-400 text-xs">({locale === 'ar' ? 'اختياري' : 'optional'})</span>
              </label>
              <input
                type="tel"
                {...register('phone')}
                placeholder="+966 5X XXX XXXX"
                dir="ltr"
                className={inputClass(!!errors.phone)}
              />
              {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-1.5">{t('password')}</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  placeholder="••••••••"
                  className={cn(inputClass(!!errors.password), 'pe-12')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-1.5">{t('confirmPassword')}</label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  {...register('confirmPassword')}
                  placeholder="••••••••"
                  className={cn(inputClass(!!errors.confirmPassword), 'pe-12')}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-600 transition-colors"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Terms */}
            <p className="text-xs text-dark-400 text-center">
              {locale === 'ar'
                ? 'بالتسجيل، أنت توافق على شروط الاستخدام وسياسة الخصوصية'
                : 'By registering, you agree to our Terms of Service and Privacy Policy'}
            </p>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center justify-center gap-2 w-full py-3.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <UserPlus className="w-5 h-5" />
              )}
              {isLoading
                ? (locale === 'ar' ? 'جاري إنشاء الحساب...' : 'Creating account...')
                : t('submit')}
            </button>
          </form>

          {/* Login Link */}
          <p className="text-center text-sm text-dark-500 mt-6">
            {t('hasAccount')}{' '}
            <Link
              href={`/${locale}/auth/login`}
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              {t('login')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
