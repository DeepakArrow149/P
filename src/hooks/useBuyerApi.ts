import { useState, useCallback } from 'react';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  details?: any;
}

interface BuyerData {
  id: string;
  buyerCode: string;
  buyerName: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  country?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface BuyerFormValues {
  buyerCode: string;
  buyerName: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  country?: string;
}

export const useBuyerApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiCall = useCallback(async <T>(
    url: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      const data: ApiResponse<T> = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchBuyers = useCallback(async (searchTerm?: string): Promise<BuyerData[]> => {
    const url = searchTerm 
      ? `/api/buyers?search=${encodeURIComponent(searchTerm)}`
      : '/api/buyers';
    
    const response = await apiCall<BuyerData[]>(url);
    return response.data || [];
  }, [apiCall]);

  const fetchBuyer = useCallback(async (id: string): Promise<BuyerData> => {
    const response = await apiCall<BuyerData>(`/api/buyers/${id}`);
    if (!response.data) {
      throw new Error('Buyer not found');
    }
    return response.data;
  }, [apiCall]);

  const createBuyer = useCallback(async (buyerData: BuyerFormValues): Promise<BuyerData> => {
    const response = await apiCall<BuyerData>('/api/buyers', {
      method: 'POST',
      body: JSON.stringify(buyerData),
    });
    
    if (!response.data) {
      throw new Error('Failed to create buyer');
    }
    return response.data;
  }, [apiCall]);

  const updateBuyer = useCallback(async (id: string, buyerData: BuyerFormValues): Promise<BuyerData> => {
    const response = await apiCall<BuyerData>(`/api/buyers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(buyerData),
    });
    
    if (!response.data) {
      throw new Error('Failed to update buyer');
    }
    return response.data;
  }, [apiCall]);

  const deleteBuyer = useCallback(async (id: string): Promise<void> => {
    await apiCall(`/api/buyers/${id}`, {
      method: 'DELETE',
    });
  }, [apiCall]);

  return {
    loading,
    error,
    fetchBuyers,
    fetchBuyer,
    createBuyer,
    updateBuyer,
    deleteBuyer,
  };
};
