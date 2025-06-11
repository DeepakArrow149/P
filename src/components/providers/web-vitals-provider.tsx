'use client';

import { useEffect } from 'react';
import { initWebVitalsMonitoring } from '@/lib/performance-monitor';

export function WebVitalsProvider() {
  useEffect(() => {
    // Initialize Web Vitals monitoring on the client side only
    initWebVitalsMonitoring();
  }, []);

  return null; // This component doesn't render anything
}
