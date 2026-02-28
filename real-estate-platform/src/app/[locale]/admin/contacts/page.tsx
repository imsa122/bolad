'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLocale } from 'next-intl';
import {
  MessageSquare, Loader2, Mail, MailOpen,
  CheckCheck, Trash2, ChevronDown, Phone,
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface Contact {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  status: 'UNREAD' | 'READ' | 'REPLIED';
  createdAt: string;
}

export default function AdminContactsPage() {
  const locale = useLocale() as 'ar' | 'en';
  const isRTL = locale === 'ar';

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [expanded, setExpanded] = useState<number | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  const fetchContacts = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await axios.get('/api/admin/contacts', {
        params: { status: statusFilter || undefined, limit: 50 },
      });
      if (data.success) {
        setContacts(data.data?.data || []);
        setTotal(data.data?.total || 0);
      }
    } catch {
      toast.error(locale === 'ar' ? 'فشل تحميل الرسائل' : 'Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, locale]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const updateStatus = async (id: number, status: 'UNREAD' | 'READ' | 'REPLIED') => {
    setUpdatingId(id);
    try {
      await axios.patch(`/api/admin/contacts/${id}`, { status });
      setContacts((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status } : c))
      );
      toast.success(locale === 'ar' ? 'تم تحديث الحالة' : 'Status updated');
    } catch {
      toast.error(locale === 'ar' ? 'فشل التحديث' : 'Update failed');
    } finally {
      setUpdatingId(null);
    }
  };

  const deleteContact = async (id: number) => {
    setDeletingId(id);
    try {
      await axios.delete(`/api/admin/contacts/${id}`);
      setContacts((prev) => prev.filter((c) => c.id !== id));
      setTotal((t) => t - 1);
      if (expanded === id) setExpanded(null);
      toast.success(locale === 'ar' ? 'تم حذف الرسالة' : 'Message deleted');
    } catch {
      toast.error(locale === 'ar' ? 'فشل الحذف' : 'Delete failed');
    } finally {
      setDeletingId(null);
      setConfirmDelete(null);
    }
  };

  const handleExpand = async (contact: Contact) => {
    if (expanded === contact.id) {
      setExpanded(null);
      return;
    }
    setExpanded(contact.id);
    // Auto-mark as read when opened
    if (contact.status === 'UNREAD') {
      await updateStatus(contact.id, 'READ');
    }
  };

  const statusConfig = {
    UNREAD: {
      class: 'bg-blue-100 text-blue-700',
      label: { ar: 'غير مقروء', en: 'Unread' },
      icon: Mail,
    },
    READ: {
      class: 'bg-gray-100 text-gray-600',
      label: { ar: 'مقروء', en: 'Read' },
      icon: MailOpen,
    },
    REPLIED: {
      class: 'bg-emerald-100 text-emerald-700',
      label: { ar: 'تم الرد', en: 'Replied' },
      icon: CheckCheck,
    },
  };

  const unreadCount = contacts.filter((c) => c.status === 'UNREAD').length;

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark-900 flex items-center gap-2">
            {locale === 'ar' ? 'الرسائل والاستفسارات' : 'Messages & Inquiries'}
            {unreadCount > 0 && (
              <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-500 text-white text-xs font-bold rounded-full">
                {unreadCount}
              </span>
            )}
          </h1>
          <p className="text-dark-500 text-sm mt-1">
            {total} {locale === 'ar' ? 'رسالة' : 'messages'}
          </p>
        </div>

        {/* Status Filter */}
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="appearance-none ps-4 pe-8 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
          >
            <option value="">{locale === 'ar' ? 'جميع الرسائل' : 'All Messages'}</option>
            <option value="UNREAD">{locale === 'ar' ? 'غير مقروء' : 'Unread'}</option>
            <option value="READ">{locale === 'ar' ? 'مقروء' : 'Read'}</option>
            <option value="REPLIED">{locale === 'ar' ? 'تم الرد' : 'Replied'}</option>
          </select>
          <ChevronDown className="absolute end-2 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400 pointer-events-none" />
        </div>
      </div>

      {/* Messages List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="bg-white rounded-2xl p-8 flex items-center justify-center shadow-sm border border-gray-100">
            <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
          </div>
        ) : contacts.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
            <MessageSquare className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-dark-400">
              {locale === 'ar' ? 'لا توجد رسائل' : 'No messages found'}
            </p>
          </div>
        ) : (
          contacts.map((contact) => {
            const sc = statusConfig[contact.status];
            const StatusIcon = sc.icon;
            const isExpanded = expanded === contact.id;
            const isUpdating = updatingId === contact.id;
            const isDeleting = deletingId === contact.id;

            return (
              <div
                key={contact.id}
                className={cn(
                  'bg-white rounded-2xl shadow-sm border transition-all',
                  contact.status === 'UNREAD'
                    ? 'border-blue-200 shadow-blue-50'
                    : 'border-gray-100'
                )}
              >
                {/* Message Header */}
                <div
                  className="flex items-start gap-4 p-4 cursor-pointer hover:bg-gray-50 rounded-2xl transition-colors"
                  onClick={() => handleExpand(contact)}
                >
                  {/* Avatar */}
                  <div className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold',
                    contact.status === 'UNREAD'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-600'
                  )}>
                    {contact.name.charAt(0).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <p className={cn(
                          'text-sm font-semibold',
                          contact.status === 'UNREAD' ? 'text-dark-900' : 'text-dark-700'
                        )}>
                          {contact.name}
                        </p>
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-lg font-medium ${sc.class}`}>
                          <StatusIcon className="w-3 h-3" />
                          {sc.label[locale]}
                        </span>
                      </div>
                      <span className="text-xs text-dark-400 flex-shrink-0">
                        {formatDate(contact.createdAt, locale)}
                      </span>
                    </div>
                    <p className="text-xs text-dark-400 mt-0.5" dir="ltr">{contact.email}</p>
                    <p className={cn(
                      'text-sm mt-1 truncate',
                      contact.status === 'UNREAD' ? 'text-dark-800 font-medium' : 'text-dark-600'
                    )}>
                      {contact.subject}
                    </p>
                    {!isExpanded && (
                      <p className="text-xs text-dark-400 mt-0.5 truncate">{contact.message}</p>
                    )}
                  </div>

                  {/* Expand icon */}
                  <ChevronDown className={cn(
                    'w-4 h-4 text-dark-400 flex-shrink-0 transition-transform mt-1',
                    isExpanded && 'rotate-180'
                  )} />
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-gray-100 pt-4">
                    {/* Contact details */}
                    <div className="flex flex-wrap gap-4 mb-4 text-sm">
                      <a
                        href={`mailto:${contact.email}`}
                        className="flex items-center gap-1.5 text-primary-600 hover:text-primary-700"
                        dir="ltr"
                      >
                        <Mail className="w-4 h-4" />
                        {contact.email}
                      </a>
                      {contact.phone && (
                        <a
                          href={`tel:${contact.phone}`}
                          className="flex items-center gap-1.5 text-primary-600 hover:text-primary-700"
                          dir="ltr"
                        >
                          <Phone className="w-4 h-4" />
                          {contact.phone}
                        </a>
                      )}
                    </div>

                    {/* Full message */}
                    <div className="bg-gray-50 rounded-xl p-4 mb-4">
                      <p className="text-sm text-dark-700 leading-relaxed whitespace-pre-wrap">
                        {contact.message}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Reply via email */}
                      <a
                        href={`mailto:${contact.email}?subject=Re: ${encodeURIComponent(contact.subject)}`}
                        onClick={() => updateStatus(contact.id, 'REPLIED')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 text-white text-xs rounded-lg hover:bg-primary-700 transition-colors"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        {locale === 'ar' ? 'رد عبر البريد' : 'Reply via Email'}
                      </a>

                      {/* Mark as replied */}
                      {contact.status !== 'REPLIED' && (
                        <button
                          onClick={() => updateStatus(contact.id, 'REPLIED')}
                          disabled={isUpdating}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-700 text-xs rounded-lg hover:bg-emerald-200 transition-colors disabled:opacity-50"
                        >
                          {isUpdating ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <CheckCheck className="w-3.5 h-3.5" />
                          )}
                          {locale === 'ar' ? 'تم الرد' : 'Mark Replied'}
                        </button>
                      )}

                      {/* Mark as unread */}
                      {contact.status !== 'UNREAD' && (
                        <button
                          onClick={() => updateStatus(contact.id, 'UNREAD')}
                          disabled={isUpdating}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-700 text-xs rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50"
                        >
                          <Mail className="w-3.5 h-3.5" />
                          {locale === 'ar' ? 'تعيين كغير مقروء' : 'Mark Unread'}
                        </button>
                      )}

                      {/* Delete */}
                      {confirmDelete === contact.id ? (
                        <div className="flex items-center gap-1 ms-auto">
                          <button
                            onClick={() => deleteContact(contact.id)}
                            disabled={isDeleting}
                            className="px-2.5 py-1.5 text-xs bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
                          >
                            {isDeleting ? <Loader2 className="w-3 h-3 animate-spin" /> : (locale === 'ar' ? 'تأكيد الحذف' : 'Confirm Delete')}
                          </button>
                          <button
                            onClick={() => setConfirmDelete(null)}
                            className="px-2.5 py-1.5 text-xs bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
                          >
                            {locale === 'ar' ? 'إلغاء' : 'Cancel'}
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDelete(contact.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-500 text-xs rounded-lg hover:bg-red-100 transition-colors ms-auto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          {locale === 'ar' ? 'حذف' : 'Delete'}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
