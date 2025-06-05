import { useState, useCallback } from 'react';
import type { LineCapacity, CreateLineCapacityData, UpdateLineCapacityData, LineCapacityFilters } from '@/lib/interfaces';

export type { LineCapacity, CreateLineCapacityData, UpdateLineCapacityData, LineCapacityFilters };

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: any;
  dataSource?: string;
  count?: number;
  message?: string;
}

interface UseLineCapacityApiReturn {
  lineCapacities: LineCapacity[];
  loading: boolean;
  error: string | null;
  dataSource: string | null;
  searchLineCapacities: (params?: LineCapacityFilters) => Promise<void>;
  createLineCapacity: (data: CreateLineCapacityData) => Promise<LineCapacity | null>;
  updateLineCapacity: (id: number, data: UpdateLineCapacityData) => Promise<LineCapacity | null>;
  deleteLineCapacity: (id: number) => Promise<boolean>;
  getLineCapacity: (id: number) => Promise<LineCapacity | null>;
  refreshLineCapacities: () => void;
}

export function useLineCapacityApi(): UseLineCapacityApiReturn {
  const [lineCapacities, setLineCapacities] = useState<LineCapacity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<string | null>(null);

  const handleError = useCallback((error: any, operation: string) => {
    console.error(`Error during ${operation}:`, error);
    const errorMessage = error?.message || `Failed to ${operation}`;
    setError(errorMessage);
    return null;
  }, []);

  const searchLineCapacities = useCallback(async (params: LineCapacityFilters = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const url = new URL('/api/line-capacities', window.location.origin);
        // Add search parameters
      if (params.search) url.searchParams.set('search', params.search);
      if (params.lineId) url.searchParams.set('lineId', params.lineId);
      if (params.buyer) url.searchParams.set('buyer', params.buyer);
      if (params.isActive !== undefined) url.searchParams.set('isActive', params.isActive.toString());
      // For backward compatibility
      if (params.active !== undefined) url.searchParams.set('isActive', params.active.toString());
      if (params.effectiveDate) url.searchParams.set('effectiveDate', params.effectiveDate.toISOString());

      const response = await fetch(url.toString());
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result: ApiResponse<LineCapacity[]> = await response.json();
      
      if (result.success && result.data) {
        setLineCapacities(result.data);
        setDataSource(result.dataSource || 'unknown');
      } else {
        throw new Error(result.error || 'Failed to fetch line capacities');
      }
    } catch (error) {
      handleError(error, 'search line capacities');
      setLineCapacities([]);
      setDataSource(null);
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const createLineCapacity = useCallback(async (data: CreateLineCapacityData): Promise<LineCapacity | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/line-capacities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result: ApiResponse<LineCapacity> = await response.json();
      
      if (result.success && result.data) {
        // Refresh the list
        await searchLineCapacities();
        return result.data;
      } else {
        throw new Error(result.error || 'Failed to create line capacity');
      }
    } catch (error) {
      handleError(error, 'create line capacity');
      return null;
    } finally {
      setLoading(false);
    }
  }, [handleError, searchLineCapacities]);

  const updateLineCapacity = useCallback(async (id: number, data: UpdateLineCapacityData): Promise<LineCapacity | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/line-capacities/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result: ApiResponse<LineCapacity> = await response.json();
      
      if (result.success && result.data) {
        // Refresh the list
        await searchLineCapacities();
        return result.data;
      } else {
        throw new Error(result.error || 'Failed to update line capacity');
      }
    } catch (error) {
      handleError(error, 'update line capacity');
      return null;
    } finally {
      setLoading(false);
    }
  }, [handleError, searchLineCapacities]);

  const deleteLineCapacity = useCallback(async (id: number): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/line-capacities/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result: ApiResponse<void> = await response.json();
      
      if (result.success) {
        // Refresh the list
        await searchLineCapacities();
        return true;
      } else {
        throw new Error(result.error || 'Failed to delete line capacity');
      }
    } catch (error) {
      handleError(error, 'delete line capacity');
      return false;
    } finally {
      setLoading(false);
    }
  }, [handleError, searchLineCapacities]);

  const getLineCapacity = useCallback(async (id: number): Promise<LineCapacity | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/line-capacities/${id}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result: ApiResponse<LineCapacity> = await response.json();
      
      if (result.success && result.data) {
        return result.data;
      } else {
        throw new Error(result.error || 'Failed to get line capacity');
      }
    } catch (error) {
      handleError(error, 'get line capacity');
      return null;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const refreshLineCapacities = useCallback(() => {
    searchLineCapacities();
  }, [searchLineCapacities]);

  return {
    lineCapacities,
    loading,
    error,
    dataSource,
    searchLineCapacities,
    createLineCapacity,
    updateLineCapacity,
    deleteLineCapacity,
    getLineCapacity,
    refreshLineCapacities,
  };
}
