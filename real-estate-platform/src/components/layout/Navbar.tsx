'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { Menu, X, Globe, ChevronDown, Home, Building2, Phone, LogIn, LogOut, LayoutDashboard, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';

export default function Navbar() {
  const t = useTranslations('nav');
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, isAdmin, logout } = useAuth() || { 
    user: null, 
    isAuthenticated: false, 
    isAdmin: false, 
    logout: async () => {} 
  };

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isUserOpen, setIsUserOpen] = useState(false);

  const isRTL = locale === 'ar';

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const switchLocale = (newLocale: string) => {
    const segments = pathname.split('/');
    segments[1] = newLocale;
    router.push(segments.join('/'));
    setIsLangOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    toast.success(locale === 'ar' ? 'تم تسجيل الخروج بنجاح' : 'Logged out successfully');
    router.push(`/${locale}`);
    setIsUserOpen(false);
  };

  const navLinks = [
    { href: `/${locale}`, label: t('home'), icon: Home },
    { href: `/${locale}/properties`, label: t('properties'), icon: Building2 },
    { href: `/${locale}/contact`, label: t('contact'), icon: Phone },
  ];

  return (
    <nav
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        isScrolled
          ? 'bg-white shadow-md py-2'
          : 'bg-transparent py-4'
      )}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href={`/${locale}`} className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-primary-700 rounded-lg flex items-center justify-center group-hover:bg-primary-600 transition-colors">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div className="hidden sm:block">
              <p className={cn(
                'font-bold text-lg leading-tight transition-colors',
                isScrolled ? 'text-primary-900' : 'text-white'
              )}>
                {locale === 'ar' ? 'عقارات السعودية' : 'Saudi Real Estate'}
              </p>
              <p className={cn(
                'text-xs transition-colors',
                isScrolled ? 'text-primary-600' : 'text-primary-200'
              )}>
                {locale === 'ar' ? 'منصتك العقارية الأولى' : 'Your Premier Property Platform'}
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                  pathname === link.href
                    ? 'bg-primary-600 text-white'
                    : isScrolled
                    ? 'text-dark-700 hover:bg-primary-50 hover:text-primary-700'
                    : 'text-white/90 hover:bg-white/10 hover:text-white'
                )}
              >
                <link.icon className="w-4 h-4" />
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right Side Actions */}
          <div className="hidden md:flex items-center gap-2">
            {/* Language Switcher */}
            <div className="relative">
              <button
                onClick={() => setIsLangOpen(!isLangOpen)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                  isScrolled
                    ? 'text-dark-700 hover:bg-gray-100'
                    : 'text-white/90 hover:bg-white/10'
                )}
              >
                <Globe className="w-4 h-4" />
                <span>{locale === 'ar' ? 'AR' : 'EN'}</span>
                <ChevronDown className={cn('w-3 h-3 transition-transform', isLangOpen && 'rotate-180')} />
              </button>
              {isLangOpen && (
                <div className="absolute top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-100 overflow-hidden z-50"
                  style={{ [isRTL ? 'left' : 'right']: 0 }}>
                  <button
                    onClick={() => switchLocale('ar')}
                    className={cn(
                      'flex items-center gap-2 w-full px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors',
                      locale === 'ar' && 'bg-primary-50 text-primary-700 font-medium'
                    )}
                  >
                    🇸🇦 العربية
                  </button>
                  <button
                    onClick={() => switchLocale('en')}
                    className={cn(
                      'flex items-center gap-2 w-full px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors',
                      locale === 'en' && 'bg-primary-50 text-primary-700 font-medium'
                    )}
                  >
                    🇬🇧 English
                  </button>
                </div>
              )}
            </div>

            {/* Auth Buttons */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserOpen(!isUserOpen)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                    isScrolled
                      ? 'text-dark-700 hover:bg-gray-100'
                      : 'text-white/90 hover:bg-white/10'
                  )}
                >
                  <div className="w-7 h-7 bg-primary-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {user?.name.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className="max-w-[100px] truncate">{user?.name || 'User'}</span>
                  <ChevronDown className={cn('w-3 h-3 transition-transform', isUserOpen && 'rotate-180')} />
                </button>
                {isUserOpen && (
                  <div className="absolute top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-100 overflow-hidden z-50 min-w-[160px]"
                    style={{ [isRTL ? 'left' : 'right']: 0 }}>
                    {isAdmin && (
                      <Link
                        href={`/${locale}/admin`}
                        onClick={() => setIsUserOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors text-dark-700"
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        {t('dashboard')}
                      </Link>
                    )}
                    <Link
                      href={`/${locale}/properties/new`}
                      onClick={() => setIsUserOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors text-dark-700"
                    >
                      <Building2 className="w-4 h-4" />
                      {locale === 'ar' ? 'إضافة عقار' : 'Add Property'}
                    </Link>
                    <Link
                      href={`/${locale}/profile`}
                      onClick={() => setIsUserOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors text-dark-700"
                    >
                      <User className="w-4 h-4" />
                      {t('profile')}
                    </Link>
                    <hr className="border-gray-100" />
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-sm hover:bg-red-50 text-red-600 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      {t('logout')}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href={`/${locale}/auth/login`}
                  className={cn(
                    'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                    isScrolled
                      ? 'text-primary-700 hover:bg-primary-50'
                      : 'text-white/90 hover:bg-white/10'
                  )}
                >
                  <LogIn className="w-4 h-4" />
                  {t('login')}
                </Link>
                <Link
                  href={`/${locale}/auth/register`}
                  className="flex items-center gap-1.5 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-all shadow-sm"
                >
                  {t('register')}
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={cn(
              'md:hidden p-2 rounded-lg transition-colors',
              isScrolled ? 'text-dark-700 hover:bg-gray-100' : 'text-white hover:bg-white/10'
            )}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-3 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden animate-slide-down">
            <div className="p-3 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                    pathname === link.href
                      ? 'bg-primary-600 text-white'
                      : 'text-dark-700 hover:bg-gray-50'
                  )}
                >
                  <link.icon className="w-4 h-4" />
                  {link.label}
                </Link>
              ))}
            </div>
            <hr className="border-gray-100" />
            <div className="p-3 space-y-1">
              <div className="flex gap-2">
                <button
                  onClick={() => { switchLocale('ar'); setIsMenuOpen(false); }}
                  className={cn('flex-1 py-2 rounded-lg text-sm font-medium transition-colors',
                    locale === 'ar' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-dark-700')}
                >
                  🇸🇦 العربية
                </button>
                <button
                  onClick={() => { switchLocale('en'); setIsMenuOpen(false); }}
                  className={cn('flex-1 py-2 rounded-lg text-sm font-medium transition-colors',
                    locale === 'en' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-dark-700')}
                >
                  🇬🇧 English
                </button>
              </div>
              {isAuthenticated ? (
                <>
                  {isAdmin && (
                    <Link href={`/${locale}/admin`} onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium text-dark-700 hover:bg-gray-50">
                      <LayoutDashboard className="w-4 h-4" /> {t('dashboard')}
                    </Link>
                  )}
                  <Link href={`/${locale}/properties/new`} onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium text-dark-700 hover:bg-gray-50">
                    <Building2 className="w-4 h-4" /> {locale === 'ar' ? 'إضافة عقار' : 'Add Property'}
                  </Link>
                  <button onClick={handleLogout}
                    className="flex items-center gap-2 w-full px-4 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50">
                    <LogOut className="w-4 h-4" /> {t('logout')}
                  </button>
                </>
              ) : (
                <div className="flex gap-2">
                  <Link href={`/${locale}/auth/login`} onClick={() => setIsMenuOpen(false)}
                    className="flex-1 py-2.5 text-center rounded-lg text-sm font-medium border border-primary-600 text-primary-600 hover:bg-primary-50">
                    {t('login')}
                  </Link>
                  <Link href={`/${locale}/auth/register`} onClick={() => setIsMenuOpen(false)}
                    className="flex-1 py-2.5 text-center rounded-lg text-sm font-medium bg-primary-600 text-white hover:bg-primary-700">
                    {t('register')}
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
