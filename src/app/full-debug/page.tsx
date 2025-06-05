'use client';

import React, { useState, useEffect } from 'react';
import { getAllOrders, type StoredOrder } from '@/lib/orderService';

export default function FullDebugPage() {
  const [step, setStep] = useState(1);
  const [logs, setLogs] = useState<string[]>([]);
  const [rawOrders, setRawOrders] = useState<StoredOrder[]>([]);
  const [error, setError] = useState<string | null>(null);

  const addLog = (message: string) => {
    console.log(message);
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testStep1 = async () => {
    addLog('=== STEP 1: Direct API Call ===');
    try {
      const response = await fetch('/api/orders');
      addLog(`API Response Status: ${response.status}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      addLog(`API Response Success: ${data.success}`);
      addLog(`API Orders Count: ${data.data?.length || 0}`);
      
      if (data.data && data.data.length > 0) {
        addLog(`First Order ID: ${data.data[0].id}`);
        addLog(`First Order Reference: ${data.data[0].order_reference}`);
        addLog(`First Order Product: ${data.data[0].product}`);
      }
      
      setStep(2);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      addLog(`API Error: ${errorMsg}`);
      setError(errorMsg);
    }
  };

  const testStep2 = async () => {
    addLog('=== STEP 2: OrderService Call ===');
    try {
      const orders = await getAllOrders();
      addLog(`OrderService Orders Count: ${orders.length}`);
      
      if (orders.length > 0) {
        addLog(`First Converted Order ID: ${orders[0].id}`);
        addLog(`First Converted Order Reference: ${orders[0].orderReference}`);
        addLog(`First Converted Order Product: ${orders[0].product}`);
        addLog(`First Converted Order Customer: ${orders[0].customer}`);
        addLog(`First Converted Order Status: ${orders[0].status}`);
      }
      
      setRawOrders(orders);
      setStep(3);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      addLog(`OrderService Error: ${errorMsg}`);
      setError(errorMsg);
    }
  };

  const testStep3 = () => {
    addLog('=== STEP 3: Data Transformation ===');
    
    const formattedOrders = rawOrders.map(o => {
      let orderQuantity = 0;
      if (o.poLines && Array.isArray(o.poLines)) {
        orderQuantity = o.poLines.reduce((sum, poLine) => {
          if (poLine.sizeQuantities && Array.isArray(poLine.sizeQuantities)) {
            return sum + poLine.sizeQuantities.reduce((itemSum, item) => itemSum + (item.quantity || 0), 0);
          }
          return sum;
        }, 0);
      }

      let firstDeliveryDate = 'N/A';
      if (o.deliveryDetails && o.deliveryDetails.length > 0 && o.deliveryDetails[0].deliveryDate) {
        try {
          const date = new Date(o.deliveryDetails[0].deliveryDate);
          firstDeliveryDate = date.toLocaleDateString();
        } catch (e) {
          addLog(`Invalid delivery date for order ${o.id}: ${o.deliveryDetails[0].deliveryDate}`);
        }
      }

      return {
        id: o.id!,
        orderNo: o.orderReference || 'N/A',
        buyer: o.customer || 'N/A', 
        styleName: o.product || 'N/A', 
        quantity: orderQuantity,
        shipDate: firstDeliveryDate,
        status: o.status || 'unknown',
        product: o.product,
        customer: o.customer,
      };
    });
    
    addLog(`Formatted Orders Count: ${formattedOrders.length}`);
    if (formattedOrders.length > 0) {
      addLog(`First Formatted Order: ${JSON.stringify(formattedOrders[0], null, 2)}`);
    }
    
    setStep(4);
  };

  useEffect(() => {
    addLog('=== DEBUG PAGE LOADED ===');
  }, []);

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-2xl font-bold mb-4">Full Debug Analysis</h1>
      
      <div className="mb-4 space-x-2">
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
          onClick={testStep1}
          disabled={step !== 1}
        >
          Step 1: Test API
        </button>
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
          onClick={testStep2}
          disabled={step !== 2}
        >
          Step 2: Test OrderService
        </button>
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
          onClick={testStep3}
          disabled={step !== 3 || rawOrders.length === 0}
        >
          Step 3: Test Transformation
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <strong>Error:</strong> {error}
        </div>
      )}

      <div className="bg-gray-100 p-4 rounded">
        <h2 className="font-semibold mb-2">Debug Logs:</h2>
        <div className="space-y-1 max-h-96 overflow-y-auto font-mono text-sm">
          {logs.map((log, index) => (
            <div key={index} className="whitespace-pre-wrap">{log}</div>
          ))}
        </div>
      </div>

      {rawOrders.length > 0 && (
        <div className="mt-6">
          <h2 className="font-semibold mb-2">Raw Orders Data:</h2>
          <div className="bg-white p-4 rounded border max-h-96 overflow-y-auto">
            <pre className="text-xs">{JSON.stringify(rawOrders.slice(0, 2), null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
