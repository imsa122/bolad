'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import {
  LayoutDashboard,
  Building2,
  CalendarCheck,
  Users,
  MessageSquare,
  Settings,
  ChevronRight,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const t = useTranslations('admin.sidebar');
  const locale = useLocale();
  const pathname = usePathname();
  const isRTL = locale === 'ar';

  const navItems = [
    {
      href: `/${locale}/admin`,
      label: t('dashboard'),
      icon: LayoutDashboard,
      exact: true,
    },
    {
      href: `/${locale}/admin/properties`,
      label: t('properties'),
      icon: Building2,
    },
    {
      href: `/${locale}/admin/bookings`,
      label: t('bookings'),
      icon: CalendarCheck,
    },
    {
      href: `/${locale}/admin/users`,
      label: t('users'),
      icon: Users,
    },
    {
      href: `/${locale}/admin/contacts`,
      label: t('contacts'),
      icon: MessageSquare,
    },
    {
      href: `/${locale}/admin/settings`,
      label: t('settings'),
      icon: Settings,
    },
  ];

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-dark-700">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-white font-semibold text-sm">
              {locale === 'ar' ? 'لوحة التحكم' : 'Admin Panel'}
            </p>
            <p className="text-dark-400 text-xs">
              {locale === 'ar' ? 'عقارات السعودية' : 'Saudi Real Estate'}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="lg:hidden p-1.5 text-dark-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClose}
            className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group',
              isActive(item.href, item.exact)
                ? 'bg-primary-600 text-white shadow-sm'
                : 'text-dark-300 hover:bg-dark-700 hover:text-white'
            )}
          >
            <item.icon className={cn(
              'w-5 h-5 flex-shrink-0 transition-transform',
              isActive(item.href, item.exact) ? 'text-white' : 'text-dark-400 group-hover:text-white'
            )} />
            <span className="flex-1">{item.label}</span>
            <ChevronRight className={cn(
              'w-4 h-4 transition-all',
              isRTL && 'rotate-180',
              isActive(item.href, item.exact) ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'
            )} />
          </Link>
        ))}
      </nav>

      {/* Back to Site */}
      <div className="p-4 border-t border-dark-700">
        <Link
          href={`/${locale}`}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-dark-400 hover:text-white hover:bg-dark-700 transition-all"
        >
          <ChevronRight className={cn('w-4 h-4', !isRTL && 'rotate-180')} />
          {locale === 'ar' ? 'العودة للموقع' : 'Back to Site'}
        </Link>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-dark-900 min-h-screen flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 z-50 w-64 bg-dark-900 flex flex-col lg:hidden transition-transform duration-300',
          isRTL ? 'right-0' : 'left-0',
          isOpen
            ? 'translate-x-0'
            : isRTL
            ? 'translate-x-full'
            : '-translate-x-full'
        )}
      >
        <SidebarContent />
      </aside>
    </>
  );
}
