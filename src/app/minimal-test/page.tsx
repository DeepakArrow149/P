'use client';

import React, { useState, useEffect } from 'react';
import { getAllOrders, type StoredOrder } from '@/lib/orderService';

export default function MinimalOrderTest() {
  const [orders, setOrders] = useState<StoredOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Fetching orders...');
        const result = await getAllOrders();
        console.log('Got orders:', result.length);
        setOrders(result);      } catch (err) {
        console.error('Error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>Minimal Order Test</h1>
      
      <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#f0f0f0' }}>
        <p><strong>Status:</strong> {loading ? 'Loading...' : 'Complete'}</p>
        <p><strong>Error:</strong> {error || 'None'}</p>
        <p><strong>Order Count:</strong> {orders.length}</p>
      </div>

      {!loading && !error && (
        <div>
          <h2>Orders:</h2>
          {orders.length === 0 ? (
            <p>No orders found</p>
          ) : (
            <ul>
              {orders.slice(0, 5).map((order, index) => (
                <li key={order.id || index} style={{ marginBottom: '10px', padding: '5px', border: '1px solid #ccc' }}>
                  <strong>#{index + 1}</strong> - 
                  ID: {order.id} | 
                  Ref: {order.orderReference} | 
                  Product: {order.product} | 
                  Customer: {order.customer} | 
                  Status: {order.status}
                </li>
              ))}
              {orders.length > 5 && <li>... and {orders.length - 5} more orders</li>}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
