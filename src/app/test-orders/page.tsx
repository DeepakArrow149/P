'use client';

import React, { useEffect, useState } from 'react';

interface ApiOrderData {
  id: string;
  order_reference: string;
  product: string;
  status: string;
}

export default function TestOrdersPage() {
  const [orderCount, setOrderCount] = useState(0);
  const [orders, setOrders] = useState<ApiOrderData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch('/api/orders');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        console.log('API Response:', result);
        
        if (result.success && result.data) {
          setOrders(result.data);
          setOrderCount(result.data.length);
        } else {
          throw new Error('Invalid API response format');
        }      } catch (err) {
        console.error('Error fetching orders:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, []);

  if (isLoading) {
    return <div className="p-8">Loading orders...</div>;
  }

  if (error) {
    return <div className="p-8 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Order Count Test</h1>
      <p className="text-lg">Total Orders: <strong>{orderCount}</strong></p>
      
      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-3">Order References:</h2>
        <ul className="space-y-1 max-h-96 overflow-y-auto">
          {orders.map((order, index) => (
            <li key={order.id || index} className="border-b pb-1">
              <span className="font-mono text-sm">{order.order_reference}</span> - 
              <span className="ml-2 text-sm text-gray-600">{order.product}</span> - 
              <span className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded">{order.status}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
