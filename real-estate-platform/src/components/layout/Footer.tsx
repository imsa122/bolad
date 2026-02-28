import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { Building2, Phone, Mail, MapPin, Clock, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';

export default function Footer() {
  const t = useTranslations('footer');
  const tc = useTranslations('contact');
  const locale = useLocale();
  const isRTL = locale === 'ar';

  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { href: `/${locale}`, label: locale === 'ar' ? 'الرئيسية' : 'Home' },
    { href: `/${locale}/properties`, label: locale === 'ar' ? 'العقارات' : 'Properties' },
    { href: `/${locale}/properties?type=SALE`, label: locale === 'ar' ? 'للبيع' : 'For Sale' },
    { href: `/${locale}/properties?type=RENT`, label: locale === 'ar' ? 'للإيجار' : 'For Rent' },
    { href: `/${locale}/contact`, label: locale === 'ar' ? 'تواصل معنا' : 'Contact Us' },
  ];

  const services = [
    t('services_list.buy'),
    t('services_list.rent'),
    t('services_list.sell'),
    t('services_list.invest'),
    t('services_list.consult'),
  ];

  return (
    <footer className="bg-dark-900 text-white" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Main Footer */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand Column */}
          <div className="lg:col-span-1">
            <Link href={`/${locale}`} className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-bold text-lg leading-tight">
                  {locale === 'ar' ? 'عقارات السعودية' : 'Saudi Real Estate'}
                </p>
                <p className="text-xs text-gray-400">
                  {locale === 'ar' ? 'منصتك العقارية الأولى' : 'Your Premier Property Platform'}
                </p>
              </div>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              {t('description')}
            </p>
            {/* Social Links */}
            <div className="flex gap-3">
              {[
                { icon: Facebook, href: '#', label: 'Facebook' },
                { icon: Twitter, href: '#', label: 'Twitter' },
                { icon: Instagram, href: '#', label: 'Instagram' },
                { icon: Linkedin, href: '#', label: 'LinkedIn' },
              ].map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-9 h-9 bg-dark-700 hover:bg-primary-600 rounded-lg flex items-center justify-center transition-colors"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-lg mb-5 text-white">{t('quickLinks')}</h3>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-primary-400 text-sm transition-colors flex items-center gap-2"
                  >
                    <span className="w-1.5 h-1.5 bg-primary-500 rounded-full flex-shrink-0" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="font-semibold text-lg mb-5 text-white">{t('services')}</h3>
            <ul className="space-y-3">
              {services.map((service) => (
                <li key={service}>
                  <span className="text-gray-400 text-sm flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-gold-500 rounded-full flex-shrink-0" />
                    {service}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-semibold text-lg mb-5 text-white">{t('contact')}</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-primary-400 mt-0.5 flex-shrink-0" />
                <span className="text-gray-400 text-sm">{tc('info.address')}</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-primary-400 flex-shrink-0" />
                <a href={`tel:${tc('info.phone')}`} className="text-gray-400 hover:text-primary-400 text-sm transition-colors" dir="ltr">
                  {tc('info.phone')}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-primary-400 flex-shrink-0" />
                <a href={`mailto:${tc('info.email')}`} className="text-gray-400 hover:text-primary-400 text-sm transition-colors">
                  {tc('info.email')}
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-primary-400 mt-0.5 flex-shrink-0" />
                <span className="text-gray-400 text-sm">{tc('info.hours')}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-dark-700">
        <div className="container mx-auto px-4 py-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-gray-500 text-sm text-center">
              © {currentYear} {locale === 'ar' ? 'عقارات السعودية' : 'Saudi Real Estate'}. {t('rights')}.
            </p>
            <div className="flex items-center gap-4">
              <Link href={`/${locale}`} className="text-gray-500 hover:text-gray-300 text-xs transition-colors">
                {locale === 'ar' ? 'سياسة الخصوصية' : 'Privacy Policy'}
              </Link>
              <Link href={`/${locale}`} className="text-gray-500 hover:text-gray-300 text-xs transition-colors">
                {locale === 'ar' ? 'الشروط والأحكام' : 'Terms of Service'}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
