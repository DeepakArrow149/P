'use client';

import React, { useState, useEffect } from 'react';
import { getAllOrders, type StoredOrder } from '@/lib/orderService';

export default function SimpleOrderListPage() {
  const [orders, setOrders] = useState<StoredOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        console.log('Fetching orders...');
        const fetchedOrders = await getAllOrders();
        console.log('Fetched orders:', fetchedOrders);
        console.log('Orders count:', fetchedOrders.length);
        setOrders(fetchedOrders);      } catch (err) {
        console.error('Error fetching orders:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Simple Order List</h1>
        <p>Loading orders...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Simple Order List</h1>
        <p className="text-red-600">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Simple Order List</h1>
      <p className="mb-4">Total orders: {orders.length}</p>
      
      {orders.length === 0 ? (
        <p>No orders found.</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order, index) => (
            <div key={order.id || index} className="border p-4 rounded">
              <h3 className="font-semibold">Order {index + 1}</h3>
              <p><strong>ID:</strong> {order.id}</p>
              <p><strong>Reference:</strong> {order.orderReference || 'N/A'}</p>
              <p><strong>Product:</strong> {order.product || 'N/A'}</p>
              <p><strong>Customer:</strong> {order.customer || 'N/A'}</p>
              <p><strong>Status:</strong> {order.status || 'N/A'}</p>
              <p><strong>PO Lines:</strong> {order.poLines?.length || 0}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
