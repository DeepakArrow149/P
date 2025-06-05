'use client';

import React, { useState, useEffect } from 'react';

export default function DebugApiPage() {
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Fetching from /api/orders...');
        const response = await fetch('/api/orders');
        console.log('Response status:', response.status);
        console.log('Response headers:', [...response.headers.entries()]);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('API Response:', data);
        console.log('Orders count:', data.data?.length || 0);
        
        setApiResponse(data);
      } catch (err) {
        console.error('Fetch error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">API Debug Page</h1>
      
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Status:</h2>
          <p>{loading ? 'Loading...' : 'Complete'}</p>
        </div>

        {error && (
          <div>
            <h2 className="text-lg font-semibold text-red-600">Error:</h2>
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {apiResponse && (
          <div>
            <h2 className="text-lg font-semibold">API Response:</h2>
            <div className="bg-gray-100 p-4 rounded">
              <p><strong>Success:</strong> {String(apiResponse.success)}</p>
              <p><strong>Orders Count:</strong> {apiResponse.data?.length || 0}</p>
              
              {apiResponse.data && apiResponse.data.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-semibold">First Order:</h3>
                  <pre className="text-xs overflow-x-auto bg-white p-2 rounded">
                    {JSON.stringify(apiResponse.data[0], null, 2)}
                  </pre>
                </div>
              )}
              
              <details className="mt-4">
                <summary className="cursor-pointer font-semibold">Full API Response</summary>
                <pre className="text-xs overflow-x-auto bg-white p-2 rounded mt-2 max-h-96 overflow-y-auto">
                  {JSON.stringify(apiResponse, null, 2)}
                </pre>
              </details>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
