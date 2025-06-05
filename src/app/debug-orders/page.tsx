'use client';

import React from 'react';
import { getAllOrders } from '@/lib/orderService';

export default function OrderDebugPage() {
  const [orders, setOrders] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchOrders = async () => {
      try {
        console.log('Starting to fetch orders...');
        const fetchedOrders = await getAllOrders();
        console.log('Fetched orders:', fetchedOrders);
        console.log('Order count:', fetchedOrders.length);
        setOrders(fetchedOrders);
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div style={{ padding: '20px' }}>
      <h1>Order Debug Page</h1>
      <p>Total orders: {orders.length}</p>
      
      <h2>Order References:</h2>
      <ul>
        {orders.map((order, index) => (
          <li key={order.id || index}>
            {order.orderReference} - {order.status} - {order.product}
          </li>
        ))}
      </ul>

      <h2>Raw Data (first 2 orders):</h2>
      <pre style={{ fontSize: '12px', overflow: 'auto', maxHeight: '400px' }}>
        {JSON.stringify(orders.slice(0, 2), null, 2)}
      </pre>
    </div>
  );
}
