'use client';

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import type { AuthUser } from '@/types';

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export function useAuth() {
  // Initialize state based on auth_state cookie if available
  const initialAuthState = typeof window !== 'undefined' && 
    document.cookie.includes('auth_state=authenticated');
    
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: initialAuthState,
  });

  const fetchUser = useCallback(async () => {
    try {
      const { data } = await axios.get('/api/auth/me');
      if (data.success) {
        setState({
          user: data.data,
          isLoading: false,
          isAuthenticated: true,
        });
      } else {
        setState({ user: null, isLoading: false, isAuthenticated: false });
      }
    } catch {
      setState({ user: null, isLoading: false, isAuthenticated: false });
    }
  }, []);

  useEffect(() => {
    fetchUser();
    
    // Add event listener for storage changes (for cross-tab authentication)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth_logout' && e.newValue === 'true') {
        setState({ user: null, isLoading: false, isAuthenticated: false });
      } else if (e.key === 'auth_login' && e.newValue === 'true') {
        fetchUser();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [fetchUser]);

  const login = useCallback(
    async (email: string, password: string) => {
      const { data } = await axios.post('/api/auth/login', { email, password });
      if (data.success) {
        setState({
          user: data.data.user,
          isLoading: false,
          isAuthenticated: true,
        });
        return data.data;
      }
      throw new Error(data.error || 'Login failed');
    },
    []
  );

  const register = useCallback(
    async (formData: {
      name: string;
      email: string;
      password: string;
      confirmPassword: string;
      phone?: string;
    }) => {
      const { data } = await axios.post('/api/auth/register', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        phone: formData.phone,
      });
      if (data.success) {
        // Auto-login after registration: fetch user state
        await fetchUser();
        return data.data;
      }
      throw new Error(data.error || 'Registration failed');
    },
    [fetchUser]
  );

  const logout = useCallback(async () => {
    try {
      await axios.post('/api/auth/logout');
    } finally {
      setState({ user: null, isLoading: false, isAuthenticated: false });
    }
  }, []);

  const isAdmin = state.user?.role === 'ADMIN';

  return {
    ...state,
    isAdmin,
    login,
    register,
    logout,
    refetch: fetchUser,
  };
}
