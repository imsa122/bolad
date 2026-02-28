'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLocale } from 'next-intl';
import {
  Users, Loader2, Search, Shield, ShieldOff,
  UserCheck, UserX, Trash2, ChevronDown,
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
  phone: string | null;
  isActive: boolean;
  createdAt: string;
  _count: { bookings: number };
}

export default function AdminUsersPage() {
  const locale = useLocale() as 'ar' | 'en';
  const isRTL = locale === 'ar';

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await axios.get('/api/admin/users', {
        params: { search: search || undefined, role: roleFilter || undefined, limit: 50 },
      });
      if (data.success) {
        setUsers(data.data?.data || []);
        setTotal(data.data?.total || 0);
      }
    } catch {
      toast.error(locale === 'ar' ? 'فشل تحميل المستخدمين' : 'Failed to load users');
    } finally {
      setIsLoading(false);
    }
  }, [search, roleFilter, locale]);

  useEffect(() => {
    const timer = setTimeout(fetchUsers, 300);
    return () => clearTimeout(timer);
  }, [fetchUsers]);

  const updateUser = async (id: number, updates: { role?: string; isActive?: boolean }) => {
    setUpdatingId(id);
    try {
      const { data } = await axios.patch(`/api/admin/users/${id}`, updates);
      if (data.success) {
        setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...updates } as AdminUser : u)));
        toast.success(locale === 'ar' ? 'تم تحديث المستخدم' : 'User updated');
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error.response?.data?.error || (locale === 'ar' ? 'فشل التحديث' : 'Update failed'));
    } finally {
      setUpdatingId(null);
    }
  };

  const deleteUser = async (id: number) => {
    setDeletingId(id);
    try {
      await axios.delete(`/api/admin/users/${id}`);
      setUsers((prev) => prev.filter((u) => u.id !== id));
      setTotal((t) => t - 1);
      toast.success(locale === 'ar' ? 'تم حذف المستخدم' : 'User deleted');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error.response?.data?.error || (locale === 'ar' ? 'فشل الحذف' : 'Delete failed'));
    } finally {
      setDeletingId(null);
      setConfirmDelete(null);
    }
  };

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark-900">
            {locale === 'ar' ? 'إدارة المستخدمين' : 'Manage Users'}
          </h1>
          <p className="text-dark-500 text-sm mt-1">
            {total} {locale === 'ar' ? 'مستخدم' : 'users'}
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={locale === 'ar' ? 'بحث...' : 'Search...'}
              className="ps-9 pe-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 w-48"
            />
          </div>

          {/* Role Filter */}
          <div className="relative">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="appearance-none ps-4 pe-8 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
            >
              <option value="">{locale === 'ar' ? 'جميع الأدوار' : 'All Roles'}</option>
              <option value="USER">{locale === 'ar' ? 'مستخدم' : 'User'}</option>
              <option value="ADMIN">{locale === 'ar' ? 'مدير' : 'Admin'}</option>
            </select>
            <ChevronDown className="absolute end-2 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-8 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-dark-400">
              {locale === 'ar' ? 'لا يوجد مستخدمون' : 'No users found'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-start px-4 py-3 text-xs font-semibold text-dark-500 uppercase tracking-wider">
                    {locale === 'ar' ? 'المستخدم' : 'User'}
                  </th>
                  <th className="text-start px-4 py-3 text-xs font-semibold text-dark-500 uppercase tracking-wider hidden sm:table-cell">
                    {locale === 'ar' ? 'الدور' : 'Role'}
                  </th>
                  <th className="text-start px-4 py-3 text-xs font-semibold text-dark-500 uppercase tracking-wider hidden md:table-cell">
                    {locale === 'ar' ? 'الحجوزات' : 'Bookings'}
                  </th>
                  <th className="text-start px-4 py-3 text-xs font-semibold text-dark-500 uppercase tracking-wider hidden lg:table-cell">
                    {locale === 'ar' ? 'تاريخ التسجيل' : 'Joined'}
                  </th>
                  <th className="text-start px-4 py-3 text-xs font-semibold text-dark-500 uppercase tracking-wider">
                    {locale === 'ar' ? 'الحالة' : 'Status'}
                  </th>
                  <th className="text-start px-4 py-3 text-xs font-semibold text-dark-500 uppercase tracking-wider">
                    {locale === 'ar' ? 'الإجراءات' : 'Actions'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map((user) => {
                  const isUpdating = updatingId === user.id;
                  const isDeleting = deletingId === user.id;

                  return (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      {/* User Info */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            'w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold',
                            user.role === 'ADMIN'
                              ? 'bg-primary-100 text-primary-700'
                              : 'bg-gray-100 text-gray-600'
                          )}>
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-dark-800 truncate">{user.name}</p>
                            <p className="text-xs text-dark-400 truncate">{user.email}</p>
                            {user.phone && (
                              <p className="text-xs text-dark-300 truncate" dir="ltr">{user.phone}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className={cn(
                          'inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-medium',
                          user.role === 'ADMIN'
                            ? 'bg-primary-100 text-primary-700'
                            : 'bg-gray-100 text-gray-600'
                        )}>
                          {user.role === 'ADMIN'
                            ? (locale === 'ar' ? '🛡️ مدير' : '🛡️ Admin')
                            : (locale === 'ar' ? '👤 مستخدم' : '👤 User')}
                        </span>
                      </td>

                      {/* Bookings count */}
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-sm text-dark-600 font-medium">
                          {user._count.bookings}
                        </span>
                      </td>

                      {/* Joined date */}
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className="text-xs text-dark-400">
                          {formatDate(user.createdAt, locale)}
                        </span>
                      </td>

                      {/* Active status */}
                      <td className="px-4 py-3">
                        <span className={cn(
                          'inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-medium',
                          user.isActive
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-red-100 text-red-600'
                        )}>
                          {user.isActive
                            ? (locale === 'ar' ? 'نشط' : 'Active')
                            : (locale === 'ar' ? 'موقوف' : 'Inactive')}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        {confirmDelete === user.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => deleteUser(user.id)}
                              disabled={isDeleting}
                              className="px-2 py-1 text-xs bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
                            >
                              {isDeleting ? <Loader2 className="w-3 h-3 animate-spin" /> : (locale === 'ar' ? 'تأكيد' : 'Confirm')}
                            </button>
                            <button
                              onClick={() => setConfirmDelete(null)}
                              className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
                            >
                              {locale === 'ar' ? 'إلغاء' : 'Cancel'}
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            {/* Toggle Role */}
                            <button
                              onClick={() => updateUser(user.id, { role: user.role === 'ADMIN' ? 'USER' : 'ADMIN' })}
                              disabled={isUpdating}
                              title={user.role === 'ADMIN'
                                ? (locale === 'ar' ? 'تحويل لمستخدم' : 'Demote to User')
                                : (locale === 'ar' ? 'ترقية لمدير' : 'Promote to Admin')}
                              className="p-1.5 text-primary-500 hover:bg-primary-50 rounded-lg transition-colors disabled:opacity-50"
                            >
                              {isUpdating ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : user.role === 'ADMIN' ? (
                                <ShieldOff className="w-4 h-4" />
                              ) : (
                                <Shield className="w-4 h-4" />
                              )}
                            </button>

                            {/* Toggle Active */}
                            <button
                              onClick={() => updateUser(user.id, { isActive: !user.isActive })}
                              disabled={isUpdating}
                              title={user.isActive
                                ? (locale === 'ar' ? 'إيقاف الحساب' : 'Deactivate')
                                : (locale === 'ar' ? 'تفعيل الحساب' : 'Activate')}
                              className={cn(
                                'p-1.5 rounded-lg transition-colors disabled:opacity-50',
                                user.isActive
                                  ? 'text-orange-500 hover:bg-orange-50'
                                  : 'text-emerald-500 hover:bg-emerald-50'
                              )}
                            >
                              {user.isActive ? (
                                <UserX className="w-4 h-4" />
                              ) : (
                                <UserCheck className="w-4 h-4" />
                              )}
                            </button>

                            {/* Delete */}
                            <button
                              onClick={() => setConfirmDelete(user.id)}
                              title={locale === 'ar' ? 'حذف' : 'Delete'}
                              className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
