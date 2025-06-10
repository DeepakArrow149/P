"use client";

import { useState, useEffect, useCallback, useRef } from 'react';

// Types for dashboard data
interface DashboardKPIData {
  totalOrders: number;
  ordersCompletedToday: number;
  ordersInProgress: number;
  delayedOrders: number;
  upcomingOrders: number;
  activeProductionLines: number;
  totalOperators: number;
  lineEfficiency: number;
  totalOutput: number;
}

interface OrderData {
  id: string;
  order_reference: string;
  product: string;
  customer: string;
  buyer: string;
  status: string;
  contract_quantity: number;
  order_date: string;
  ship_date: string;
  assignedLine?: string;
}

interface BuyerData {
  id: string;
  code: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  isActive: boolean;
}

interface LineData {
  id: string;
  lineCode: string;
  lineName: string;
  unitId: string;
  lineType: string;
  defaultCapacity: number;
  notes?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  source?: string;
  error?: string;
}

export function useDashboardApi(autoRefreshInterval: number = 300000) { // 5 minutes default
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [buyers, setBuyers] = useState<BuyerData[]>([]);
  const [lines, setLines] = useState<LineData[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toISOString());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Generic API call function
  const apiCall = useCallback(async <T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> => {
    const response = await fetch(`/api${endpoint}`, {
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
  }, []);
  // Fetch all orders
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiCall<OrderData[]>('/orders');
      setOrders(response.data || []);
      setLastUpdated(new Date().toISOString());
      return response.data || [];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch orders';
      setError(errorMessage);
      console.error('Error fetching orders:', errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  // Fetch all buyers
  const fetchBuyers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiCall<BuyerData[]>('/buyers');
      setBuyers(response.data || []);
      setLastUpdated(new Date().toISOString());
      return response.data || [];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch buyers';
      setError(errorMessage);
      console.error('Error fetching buyers:', errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  // Fetch all lines
  const fetchLines = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiCall<LineData[]>('/lines');
      setLines(response.data || []);
      setLastUpdated(new Date().toISOString());
      return response.data || [];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch lines';
      setError(errorMessage);
      console.error('Error fetching lines:', errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  // Calculate KPI data from fetched data
  const calculateKPIData = useCallback((): DashboardKPIData => {
    const today = new Date().toISOString().split('T')[0];
    
    // Calculate order-related KPIs
    const totalOrders = orders.length;
    const ordersCompletedToday = orders.filter(order => 
      order.status === 'completed' && 
      order.ship_date && 
      order.ship_date.split('T')[0] === today
    ).length;
    
    const ordersInProgress = orders.filter(order => 
      order.status === 'in_progress' || order.status === 'scheduled'
    ).length;
    
    const delayedOrders = orders.filter(order => {
      if (!order.ship_date) return false;
      const shipDate = new Date(order.ship_date);
      return shipDate < new Date() && order.status !== 'completed';
    }).length;
    
    const upcomingOrders = orders.filter(order => {
      if (!order.ship_date) return false;
      const shipDate = new Date(order.ship_date);
      const weekFromNow = new Date();
      weekFromNow.setDate(weekFromNow.getDate() + 7);
      return shipDate <= weekFromNow && shipDate >= new Date() && order.status !== 'completed';
    }).length;

    // Calculate line-related KPIs
    const activeProductionLines = lines.length;
    
    // Mock calculated values (in real app, these would come from production data)
    const totalOperators = 156;
    const lineEfficiency = 87.5;
    const totalOutput = orders.reduce((sum, order) => sum + (order.contract_quantity || 0), 0);

    return {
      totalOrders,
      ordersCompletedToday,
      ordersInProgress,
      delayedOrders,
      upcomingOrders,
      activeProductionLines,
      totalOperators,
      lineEfficiency,
      totalOutput
    };
  }, [orders, lines]);
  // Fetch all dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch all data in parallel
      await Promise.all([
        fetchOrders(),
        fetchBuyers(),  
        fetchLines()
      ]);
      
      setLastUpdated(new Date().toISOString());
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch dashboard data';
      setError(errorMessage);
      console.error('Error fetching dashboard data:', errorMessage);
    } finally {
      setLoading(false);
    }
  }, [fetchOrders, fetchBuyers, fetchLines]);

  // Setup auto-refresh polling
  const startAutoRefresh = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    if (autoRefreshInterval > 0) {
      intervalRef.current = setInterval(() => {
        fetchDashboardData();
      }, autoRefreshInterval);
    }
  }, [autoRefreshInterval, fetchDashboardData]);

  const stopAutoRefresh = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Auto-fetch data on component mount and setup polling
  useEffect(() => {
    fetchDashboardData();
    startAutoRefresh();
    
    return () => {
      stopAutoRefresh();
    };
  }, [fetchDashboardData, startAutoRefresh, stopAutoRefresh]);  return {
    // Data
    orders,
    buyers,
    lines,
    kpiData: calculateKPIData(),
    
    // State
    loading,
    error,
    lastUpdated,
    
    // Actions
    fetchOrders,
    fetchBuyers,
    fetchLines,
    fetchDashboardData,
    refreshDashboard: fetchDashboardData,
    
    // Auto-refresh controls
    startAutoRefresh,
    stopAutoRefresh,
    
    // Metadata
    dataSource: 'database'
  };
}
