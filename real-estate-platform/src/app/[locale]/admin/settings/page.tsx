'use client';

import { useState } from 'react';
import { useLocale } from 'next-intl';
import {
  Settings, Globe, Shield, Bell, Database,
  Save, Loader2, CheckCircle, Eye, EyeOff,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

export default function AdminSettingsPage() {
  const locale = useLocale() as 'ar' | 'en';
  const isRTL = locale === 'ar';

  const [activeTab, setActiveTab] = useState<'general' | 'security' | 'notifications' | 'system'>('general');
  const [isSaving, setIsSaving] = useState(false);
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);

  // General settings state
  const [siteName, setSiteName] = useState('عقارات السعودية | Saudi Real Estate');
  const [siteEmail, setSiteEmail] = useState('admin@realestate.sa');
  const [sitePhone, setSitePhone] = useState('+966500000000');
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  // Security settings state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Notification settings state
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [bookingAlerts, setBookingAlerts] = useState(true);
  const [contactAlerts, setContactAlerts] = useState(true);
  const [newUserAlerts, setNewUserAlerts] = useState(false);

  const handleSaveGeneral = async () => {
    setIsSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setIsSaving(false);
    toast.success(locale === 'ar' ? 'تم حفظ الإعدادات' : 'Settings saved');
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error(locale === 'ar' ? 'يرجى ملء جميع الحقول' : 'Please fill all fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(locale === 'ar' ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      toast.error(locale === 'ar' ? 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' : 'Password must be at least 8 characters');
      return;
    }
    setIsSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setIsSaving(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    toast.success(locale === 'ar' ? 'تم تغيير كلمة المرور' : 'Password changed successfully');
  };

  const tabs = [
    { id: 'general', label: { ar: 'عام', en: 'General' }, icon: Globe },
    { id: 'security', label: { ar: 'الأمان', en: 'Security' }, icon: Shield },
    { id: 'notifications', label: { ar: 'الإشعارات', en: 'Notifications' }, icon: Bell },
    { id: 'system', label: { ar: 'النظام', en: 'System' }, icon: Database },
  ] as const;

  const inputClass = 'w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all';

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-dark-900 flex items-center gap-2">
          <Settings className="w-6 h-6 text-primary-600" />
          {locale === 'ar' ? 'الإعدادات' : 'Settings'}
        </h1>
        <p className="text-dark-500 text-sm mt-1">
          {locale === 'ar' ? 'إدارة إعدادات المنصة' : 'Manage platform settings'}
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Tabs Sidebar */}
        <div className="lg:w-56 flex-shrink-0">
          <nav className="bg-white rounded-2xl shadow-sm border border-gray-100 p-2 space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all text-start',
                  activeTab === tab.id
                    ? 'bg-primary-600 text-white'
                    : 'text-dark-600 hover:bg-gray-50'
                )}
              >
                <tab.icon className="w-4 h-4 flex-shrink-0" />
                {tab.label[locale]}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="flex-1">
          {/* General Settings */}
          {activeTab === 'general' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
              <h2 className="text-lg font-semibold text-dark-900">
                {locale === 'ar' ? 'الإعدادات العامة' : 'General Settings'}
              </h2>

              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1.5">
                  {locale === 'ar' ? 'اسم الموقع' : 'Site Name'}
                </label>
                <input
                  type="text"
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1.5">
                  {locale === 'ar' ? 'البريد الإلكتروني' : 'Contact Email'}
                </label>
                <input
                  type="email"
                  value={siteEmail}
                  onChange={(e) => setSiteEmail(e.target.value)}
                  dir="ltr"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1.5">
                  {locale === 'ar' ? 'رقم الهاتف' : 'Phone Number'}
                </label>
                <input
                  type="tel"
                  value={sitePhone}
                  onChange={(e) => setSitePhone(e.target.value)}
                  dir="ltr"
                  className={inputClass}
                />
              </div>

              {/* Maintenance Mode */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <p className="text-sm font-medium text-dark-800">
                    {locale === 'ar' ? 'وضع الصيانة' : 'Maintenance Mode'}
                  </p>
                  <p className="text-xs text-dark-400 mt-0.5">
                    {locale === 'ar'
                      ? 'تعطيل الوصول العام للموقع مؤقتاً'
                      : 'Temporarily disable public access to the site'}
                  </p>
                </div>
                <button
                  onClick={() => setMaintenanceMode(!maintenanceMode)}
                  className={cn(
                    'relative w-12 h-6 rounded-full transition-colors',
                    maintenanceMode ? 'bg-red-500' : 'bg-gray-300'
                  )}
                >
                  <span className={cn(
                    'absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform',
                    maintenanceMode
                      ? (isRTL ? 'start-1' : 'translate-x-6')
                      : (isRTL ? 'start-7' : 'translate-x-1')
                  )} />
                </button>
              </div>

              <button
                onClick={handleSaveGeneral}
                disabled={isSaving}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors disabled:opacity-60"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {locale === 'ar' ? 'حفظ الإعدادات' : 'Save Settings'}
              </button>
            </div>
          )}

          {/* Security Settings */}
          {activeTab === 'security' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
              <h2 className="text-lg font-semibold text-dark-900">
                {locale === 'ar' ? 'إعدادات الأمان' : 'Security Settings'}
              </h2>

              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1.5">
                  {locale === 'ar' ? 'كلمة المرور الحالية' : 'Current Password'}
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPass ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className={cn(inputClass, 'pe-10')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="absolute end-3 top-1/2 -translate-y-1/2 text-dark-400"
                  >
                    {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1.5">
                  {locale === 'ar' ? 'كلمة المرور الجديدة' : 'New Password'}
                </label>
                <div className="relative">
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className={cn(inputClass, 'pe-10')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute end-3 top-1/2 -translate-y-1/2 text-dark-400"
                  >
                    {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1.5">
                  {locale === 'ar' ? 'تأكيد كلمة المرور' : 'Confirm New Password'}
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className={inputClass}
                />
              </div>

              <button
                onClick={handleChangePassword}
                disabled={isSaving}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors disabled:opacity-60"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                {locale === 'ar' ? 'تغيير كلمة المرور' : 'Change Password'}
              </button>

              {/* Security Info */}
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                <p className="text-sm font-medium text-blue-800 mb-2">
                  {locale === 'ar' ? '🔒 نصائح الأمان' : '🔒 Security Tips'}
                </p>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• {locale === 'ar' ? 'استخدم كلمة مرور قوية تحتوي على أحرف وأرقام ورموز' : 'Use a strong password with letters, numbers, and symbols'}</li>
                  <li>• {locale === 'ar' ? 'لا تشارك بيانات الدخول مع أحد' : 'Never share your login credentials'}</li>
                  <li>• {locale === 'ar' ? 'قم بتغيير كلمة المرور بانتظام' : 'Change your password regularly'}</li>
                </ul>
              </div>
            </div>
          )}

          {/* Notification Settings */}
          {activeTab === 'notifications' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
              <h2 className="text-lg font-semibold text-dark-900">
                {locale === 'ar' ? 'إعدادات الإشعارات' : 'Notification Settings'}
              </h2>

              {[
                {
                  key: 'emailNotifications',
                  value: emailNotifications,
                  setter: setEmailNotifications,
                  label: { ar: 'إشعارات البريد الإلكتروني', en: 'Email Notifications' },
                  desc: { ar: 'استقبال إشعارات عبر البريد الإلكتروني', en: 'Receive notifications via email' },
                },
                {
                  key: 'bookingAlerts',
                  value: bookingAlerts,
                  setter: setBookingAlerts,
                  label: { ar: 'تنبيهات الحجوزات', en: 'Booking Alerts' },
                  desc: { ar: 'إشعار عند إنشاء حجز جديد', en: 'Notify when a new booking is created' },
                },
                {
                  key: 'contactAlerts',
                  value: contactAlerts,
                  setter: setContactAlerts,
                  label: { ar: 'تنبيهات الرسائل', en: 'Contact Alerts' },
                  desc: { ar: 'إشعار عند استلام رسالة جديدة', en: 'Notify when a new message is received' },
                },
                {
                  key: 'newUserAlerts',
                  value: newUserAlerts,
                  setter: setNewUserAlerts,
                  label: { ar: 'تنبيهات المستخدمين الجدد', en: 'New User Alerts' },
                  desc: { ar: 'إشعار عند تسجيل مستخدم جديد', en: 'Notify when a new user registers' },
                },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <p className="text-sm font-medium text-dark-800">{item.label[locale]}</p>
                    <p className="text-xs text-dark-400 mt-0.5">{item.desc[locale]}</p>
                  </div>
                  <button
                    onClick={() => item.setter(!item.value)}
                    className={cn(
                      'relative w-12 h-6 rounded-full transition-colors flex-shrink-0',
                      item.value ? 'bg-primary-600' : 'bg-gray-300'
                    )}
                  >
                    <span className={cn(
                      'absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all',
                      item.value ? 'translate-x-6' : 'translate-x-1'
                    )} />
                  </button>
                </div>
              ))}

              <button
                onClick={handleSaveGeneral}
                disabled={isSaving}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors disabled:opacity-60"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {locale === 'ar' ? 'حفظ الإعدادات' : 'Save Settings'}
              </button>
            </div>
          )}

          {/* System Info */}
          {activeTab === 'system' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
              <h2 className="text-lg font-semibold text-dark-900">
                {locale === 'ar' ? 'معلومات النظام' : 'System Information'}
              </h2>

              {[
                { label: { ar: 'إصدار التطبيق', en: 'App Version' }, value: 'v1.0.0' },
                { label: { ar: 'إطار العمل', en: 'Framework' }, value: 'Next.js 14 (App Router)' },
                { label: { ar: 'قاعدة البيانات', en: 'Database' }, value: 'MySQL + Prisma ORM' },
                { label: { ar: 'المصادقة', en: 'Authentication' }, value: 'JWT + bcrypt' },
                { label: { ar: 'التخزين', en: 'Storage' }, value: 'Local File System' },
                { label: { ar: 'البيئة', en: 'Environment' }, value: process.env.NODE_ENV || 'development' },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <span className="text-sm text-dark-600">{item.label[locale]}</span>
                  <span className="text-sm font-medium text-dark-800 font-mono" dir="ltr">{item.value}</span>
                </div>
              ))}

              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                <p className="text-sm text-emerald-700">
                  {locale === 'ar' ? 'جميع الأنظمة تعمل بشكل طبيعي' : 'All systems are operational'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
