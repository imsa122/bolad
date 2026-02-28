'use client';

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import type { Property, PropertyFilters, PaginatedResponse } from '@/types';

interface PropertiesState {
  properties: Property[];
  pagination: PaginatedResponse<Property>['pagination'] | null;
  isLoading: boolean;
  error: string | null;
}

export function useProperties(initialFilters?: PropertyFilters) {
  const [filters, setFilters] = useState<PropertyFilters>(initialFilters || {});
  const [state, setState] = useState<PropertiesState>({
    properties: [],
    pagination: null,
    isLoading: true,
    error: null,
  });

  const fetchProperties = useCallback(async (currentFilters: PropertyFilters) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const params = new URLSearchParams();
      Object.entries(currentFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.set(key, String(value));
        }
      });

      const { data } = await axios.get(`/api/properties?${params.toString()}`);
      if (data.success) {
        setState({
          properties: data.data.data,
          pagination: data.data.pagination,
          isLoading: false,
          error: null,
        });
      }
    } catch (err) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: 'Failed to load properties',
      }));
    }
  }, []);

  useEffect(() => {
    fetchProperties(filters);
  }, [filters, fetchProperties]);

  const updateFilters = useCallback((newFilters: Partial<PropertyFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters, page: 1 }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({ page: 1, limit: 12 });
  }, []);

  const goToPage = useCallback((page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  }, []);

  return {
    ...state,
    filters,
    updateFilters,
    resetFilters,
    goToPage,
    refetch: () => fetchProperties(filters),
  };
}

export function useProperty(id: number) {
  const [property, setProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchProperty = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const { data } = await axios.get(`/api/properties/${id}`);
        if (data.success) {
          setProperty(data.data);
        } else {
          setError('Property not found');
        }
      } catch {
        setError('Failed to load property');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProperty();
  }, [id]);

  return { property, isLoading, error };
}
