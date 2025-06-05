// src/hooks/useLineGroupApi.ts
import { useState, useCallback } from 'react';
import type { LineGroup, CreateLineGroupData, UpdateLineGroupData, LineGroupFilters } from '@/lib/interfaces';

export type { LineGroup, CreateLineGroupData, UpdateLineGroupData, LineGroupFilters };

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: any;
  dataSource?: string;
  count?: number;
  message?: string;
}

interface UseLineGroupApiReturn {
  lineGroups: LineGroup[];
  loading: boolean;
  error: string | null;
  dataSource: string | null;
  searchLineGroups: (params?: LineGroupFilters) => Promise<void>;
  createLineGroup: (data: CreateLineGroupData) => Promise<LineGroup | null>;
  updateLineGroup: (id: number, data: UpdateLineGroupData) => Promise<LineGroup | null>;
  deleteLineGroup: (id: number) => Promise<boolean>;
  getLineGroup: (id: number) => Promise<LineGroup | null>;
  refreshLineGroups: () => void;
}

export function useLineGroupApi(): UseLineGroupApiReturn {
  const [lineGroups, setLineGroups] = useState<LineGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<string | null>(null);

  const handleError = useCallback((error: any, operation: string) => {
    console.error(`Error during ${operation}:`, error);
    const errorMessage = error?.message || `Failed to ${operation}`;
    setError(errorMessage);
    return null;
  }, []);

  const searchLineGroups = useCallback(async (params: LineGroupFilters = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const url = new URL('/api/line-groups', window.location.origin);
        // Add search parameters
      if (params.search) url.searchParams.set('search', params.search);
      if (params.isActive !== undefined) url.searchParams.set('isActive', params.isActive.toString());
      // For backward compatibility
      if (params.active !== undefined) url.searchParams.set('isActive', params.active.toString());
      if (params.hasLines !== undefined) url.searchParams.set('hasLines', params.hasLines.toString());

      const response = await fetch(url.toString());
      const result: ApiResponse<LineGroup[]> = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || `HTTP ${response.status}`);
      }

      setLineGroups(result.data || []);
      setDataSource(result.dataSource || null);
    } catch (err) {
      handleError(err, 'search line groups');
      setLineGroups([]);
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const refreshLineGroups = useCallback(() => searchLineGroups(), [searchLineGroups]);

  const getLineGroup = useCallback(async (id: number): Promise<LineGroup | null> => {
    try {
      const response = await fetch(`/api/line-groups/${id}`);
      const result: ApiResponse<LineGroup> = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || `HTTP ${response.status}`);
      }

      return result.data || null;
    } catch (err) {
      return handleError(err, 'get line group');
    }
  }, [handleError]);

  const createLineGroup = useCallback(async (data: CreateLineGroupData): Promise<LineGroup | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/line-groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result: ApiResponse<LineGroup> = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || `HTTP ${response.status}`);
      }

      const newLineGroup = result.data!;
      setLineGroups(prev => [newLineGroup, ...prev]);
      setDataSource(result.dataSource || null);
      
      return newLineGroup;
    } catch (err) {
      return handleError(err, 'create line group');
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const updateLineGroup = useCallback(async (id: number, data: UpdateLineGroupData): Promise<LineGroup | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/line-groups/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result: ApiResponse<LineGroup> = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || `HTTP ${response.status}`);
      }

      const updatedLineGroup = result.data!;
      setLineGroups(prev => 
        prev.map(group => group.id === id ? updatedLineGroup : group)
      );
      setDataSource(result.dataSource || null);
      
      return updatedLineGroup;
    } catch (err) {
      return handleError(err, 'update line group');
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const deleteLineGroup = useCallback(async (id: number): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/line-groups/${id}`, {
        method: 'DELETE',
      });

      const result: ApiResponse<void> = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || `HTTP ${response.status}`);
      }

      setLineGroups(prev => prev.filter(group => group.id !== id));
      setDataSource(result.dataSource || null);
      
      return true;
    } catch (err) {
      handleError(err, 'delete line group');
      return false;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  return {
    lineGroups,
    loading,
    error,
    dataSource,
    searchLineGroups,
    createLineGroup,
    updateLineGroup,
    deleteLineGroup,
    getLineGroup,
    refreshLineGroups,
  };
}
