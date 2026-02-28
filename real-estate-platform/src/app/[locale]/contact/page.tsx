'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Phone, Mail, MapPin, Clock, Loader2, Send, CheckCircle2 } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { contactSchema, type ContactInput } from '@/lib/validations';
import { cn } from '@/lib/utils';

export default function ContactPage() {
  const t = useTranslations('contact');
  const locale = useLocale() as 'ar' | 'en';
  const isRTL = locale === 'ar';
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = async (data: ContactInput) => {
    setIsSubmitting(true);
    try {
      await axios.post('/api/contact', data);
      setSubmitted(true);
      reset();
      toast.success(locale === 'ar' ? 'تم إرسال رسالتك بنجاح!' : 'Message sent successfully!');
    } catch {
      toast.error(locale === 'ar' ? 'فشل إرسال الرسالة' : 'Failed to send message');
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactInfo = [
    {
      icon: Phone,
      title: locale === 'ar' ? 'الهاتف' : 'Phone',
      value: '+966 561201529',
      href: 'tel:+966561201529',
      color: 'bg-blue-50 text-blue-600',
    },
    {
      icon: Mail,
      title: locale === 'ar' ? 'البريد الإلكتروني' : 'Email',
      value: 'Engmuhannad23@hotmail.com',
      href: 'mailto:Engmuhannad23@hotmail.com',
      color: 'bg-emerald-50 text-emerald-600',
    },
    {
      icon: MapPin,
      title: locale === 'ar' ? 'العنوان' : 'Address',
      value: locale === 'ar' ? 'الحمدانية, جدة،  المملكة العربية السعودية' : 'King Fahd Road, Riyadh, Saudi Arabia',
      href: '#',
      color: 'bg-red-50 text-red-500',
    },
    {
      icon: Clock,
      title: locale === 'ar' ? 'ساعات العمل' : 'Working Hours',
      value: locale === 'ar' ? 'الأحد - الخميس: 9ص - 6م' : 'Sun - Thu: 9AM - 6PM',
      href: '#',
      color: 'bg-purple-50 text-purple-600',
    },
  ];

  const inputClass = (hasError?: boolean) =>
    cn(
      'w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all',
      hasError ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-white'
    );

  return (
    <div className="min-h-screen bg-gray-50" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Page Header */}
      <div className="page-header">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{t('title')}</h1>
          <p className="text-white/80 text-lg max-w-2xl mx-auto">{t('subtitle')}</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Contact Info */}
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-dark-800 mb-2">{t('info.title')}</h2>
              <p className="text-dark-500 text-sm">{t('info.subtitle')}</p>
            </div>

            {contactInfo.map((item) => (
              <a
                key={item.title}
                href={item.href}
                className="flex items-start gap-4 p-4 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all group"
              >
                <div className={`w-11 h-11 ${item.color} rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                  <item.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-dark-400 mb-0.5">{item.title}</p>
                  <p className="text-sm font-medium text-dark-700">{item.value}</p>
                </div>
              </a>
            ))}

            {/* Social Links */}
            <div className="p-4 bg-white rounded-2xl shadow-sm border border-gray-100">
              <p className="text-sm font-medium text-dark-600 mb-3">
                {locale === 'ar' ? 'تابعنا على' : 'Follow Us On'}
              </p>
              <div className="flex gap-3">
                {['Twitter', 'Instagram', 'LinkedIn', 'WhatsApp'].map((social) => (
                  <a
                    key={social}
                    href="#"
                    className="w-9 h-9 bg-gray-100 hover:bg-primary-100 hover:text-primary-600 rounded-lg flex items-center justify-center text-dark-400 transition-colors text-xs font-bold"
                  >
                    {social.charAt(0)}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-card p-8">
              {submitted ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
                    <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-dark-800 mb-3">
                    {locale === 'ar' ? 'تم إرسال رسالتك!' : 'Message Sent!'}
                  </h3>
                  <p className="text-dark-500 mb-6">
                    {locale === 'ar'
                      ? 'شكراً لتواصلك معنا. سنرد عليك في أقرب وقت ممكن.'
                      : 'Thank you for contacting us. We will get back to you as soon as possible.'}
                  </p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="btn-primary"
                  >
                    {locale === 'ar' ? 'إرسال رسالة أخرى' : 'Send Another Message'}
                  </button>
                </div>
              ) : (
                <>
                  <h2 className="text-xl font-bold text-dark-800 mb-6">{t('form.title')}</h2>
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      {/* Name */}
                      <div>
                        <label className="block text-sm font-medium text-dark-700 mb-1.5">{t('form.name')} *</label>
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
                        <label className="block text-sm font-medium text-dark-700 mb-1.5">{t('form.email')} *</label>
                        <input
                          type="email"
                          {...register('email')}
                          placeholder="example@email.com"
                          dir="ltr"
                          className={inputClass(!!errors.email)}
                        />
                        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                      </div>
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-sm font-medium text-dark-700 mb-1.5">
                        {t('form.phone')} <span className="text-dark-400 text-xs">({locale === 'ar' ? 'اختياري' : 'optional'})</span>
                      </label>
                      <input
                        type="tel"
                        {...register('phone')}
                        placeholder="+966 5X XXX XXXX"
                        dir="ltr"
                        className={inputClass(!!errors.phone)}
                      />
                    </div>

                    {/* Subject */}
                    <div>
                      <label className="block text-sm font-medium text-dark-700 mb-1.5">{t('form.subject')} *</label>
                      <input
                        type="text"
                        {...register('subject')}
                        placeholder={locale === 'ar' ? 'موضوع الرسالة' : 'Message Subject'}
                        className={inputClass(!!errors.subject)}
                      />
                      {errors.subject && <p className="text-red-500 text-xs mt-1">{errors.subject.message}</p>}
                    </div>

                    {/* Message */}
                    <div>
                      <label className="block text-sm font-medium text-dark-700 mb-1.5">{t('form.message')} *</label>
                      <textarea
                        {...register('message')}
                        rows={5}
                        placeholder={locale === 'ar' ? 'اكتب رسالتك هنا...' : 'Write your message here...'}
                        className={inputClass(!!errors.message)}
                      />
                      {errors.message && <p className="text-red-500 text-xs mt-1">{errors.message.message}</p>}
                    </div>

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex items-center justify-center gap-2 w-full py-3.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
                    >
                      {isSubmitting ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                      {isSubmitting
                        ? (locale === 'ar' ? 'جاري الإرسال...' : 'Sending...')
                        : t('form.submit')}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
