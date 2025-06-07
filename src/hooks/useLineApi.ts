// src/hooks/useLineApi.ts
import { useState, useEffect, useCallback } from 'react';
import type { Line, CreateLineData, UpdateLineData, LineSearchParams } from '@/lib/lineRepository';

// Re-export types for components that need them
export type { Line, CreateLineData, UpdateLineData, LineSearchParams };

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: any;
  dataSource?: string;
  message?: string;
  count?: number;
}

interface UseLineApiReturn {
  lines: Line[];
  loading: boolean;
  error: string | null;
  dataSource: string | null;
  createLine: (data: CreateLineData) => Promise<Line | null>;
  updateLine: (id: string, data: UpdateLineData) => Promise<Line | null>;
  deleteLine: (id: string) => Promise<boolean>;
  getLine: (id: string) => Promise<Line | null>;
  searchLines: (params?: LineSearchParams) => Promise<void>;
  refreshLines: () => Promise<void>;
}

export function useLineApi(): UseLineApiReturn {
  const [lines, setLines] = useState<Line[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<string | null>(null);

  const handleError = useCallback((error: any, operation: string) => {
    console.error(`Error during ${operation}:`, error);
    const errorMessage = error?.message || `Failed to ${operation}`;
    setError(errorMessage);
    return null;
  }, []);

  const searchLines = useCallback(async (params: LineSearchParams = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const url = new URL('/api/lines', window.location.origin);
      
      // Add search parameters
      if (params.search) url.searchParams.set('search', params.search);
      if (params.unitId) url.searchParams.set('unitId', params.unitId);
      if (params.lineType) url.searchParams.set('lineType', params.lineType);
      if (params.limit) url.searchParams.set('limit', params.limit.toString());
      if (params.offset) url.searchParams.set('offset', params.offset.toString());

      const response = await fetch(url.toString());
      const result: ApiResponse<Line[]> = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || `HTTP ${response.status}`);
      }

      setLines(result.data || []);
      setDataSource(result.dataSource || null);
    } catch (err) {
      handleError(err, 'search lines');
      setLines([]);
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const refreshLines = useCallback(() => searchLines(), [searchLines]);

  const getLine = useCallback(async (id: string): Promise<Line | null> => {
    try {
      const response = await fetch(`/api/lines/${id}`);
      const result: ApiResponse<Line> = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || `HTTP ${response.status}`);
      }

      return result.data || null;
    } catch (err) {
      return handleError(err, 'get line');
    }
  }, [handleError]);

  const createLine = useCallback(async (data: CreateLineData): Promise<Line | null> => {
    try {
      const response = await fetch('/api/lines', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result: ApiResponse<Line> = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || `HTTP ${response.status}`);
      }

      const newLine = result.data;
      if (newLine) {
        setLines(prev => [...prev, newLine].sort((a, b) => a.lineCode.localeCompare(b.lineCode)));
        setDataSource(result.dataSource || null);
      }

      return newLine || null;
    } catch (err) {
      return handleError(err, 'create line');
    }
  }, [handleError]);

  const updateLine = useCallback(async (id: string, data: UpdateLineData): Promise<Line | null> => {
    try {
      const response = await fetch(`/api/lines/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result: ApiResponse<Line> = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || `HTTP ${response.status}`);
      }

      const updatedLine = result.data;
      if (updatedLine) {
        setLines(prev => 
          prev.map(line => line.id === id ? updatedLine : line)
            .sort((a, b) => a.lineCode.localeCompare(b.lineCode))
        );
        setDataSource(result.dataSource || null);
      }

      return updatedLine || null;
    } catch (err) {
      return handleError(err, 'update line');
    }
  }, [handleError]);

  const deleteLine = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/lines/${id}`, {
        method: 'DELETE',
      });

      const result: ApiResponse<void> = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || `HTTP ${response.status}`);
      }

      setLines(prev => prev.filter(line => line.id !== id));
      setDataSource(result.dataSource || null);
      return true;
    } catch (err) {
      handleError(err, 'delete line');
      return false;
    }
  }, [handleError]);
  // Load lines on mount
  useEffect(() => {
    searchLines();
  }, []); // Empty dependency array to only run once on mount

  return {
    lines,
    loading,
    error,
    dataSource,
    createLine,
    updateLine,
    deleteLine,
    getLine,
    searchLines,
    refreshLines,
  };
}
