// Performance monitoring utilities for React components and operations
import React from 'react';

// Type declarations for web-vitals
interface WebVitalMetric {
  name: string;
  value: number;
  id: string;
}

// Type declarations for gtag (Google Analytics)
declare global {
  interface Window {
    gtag?: (
      command: 'event',
      eventName: string,
      parameters: {
        event_category: string;
        value: number;
        event_label: string;
      }
    ) => void;
  }
}

export class FrontendPerformanceMonitor {
  private static metrics: Map<string, number[]> = new Map();
  private static isEnabled = process.env.NODE_ENV === 'development';
  
  static startTiming(operation: string): () => void {
    if (!this.isEnabled) return () => {};
    
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      if (!this.metrics.has(operation)) {
        this.metrics.set(operation, []);
      }
      
      this.metrics.get(operation)!.push(duration);
      
      // Log slow operations (> 100ms)
      if (duration > 100) {
        console.warn(`🐌 Slow operation: ${operation} took ${duration.toFixed(2)}ms`);
      }
      
      // Log very slow operations (> 1000ms)
      if (duration > 1000) {
        console.error(`🚨 Very slow operation: ${operation} took ${duration.toFixed(2)}ms`);
      }
    };
  }
  
  static getAverageTime(operation: string): number {
    const times = this.metrics.get(operation);
    if (!times || times.length === 0) return 0;
    
    return times.reduce((sum, time) => sum + time, 0) / times.length;
  }
  
  static getMetrics(): Record<string, { avg: number; max: number; min: number; count: number }> {
    const result: Record<string, { avg: number; max: number; min: number; count: number }> = {};
    
    this.metrics.forEach((times, operation) => {
      if (times.length > 0) {
        result[operation] = {
          avg: this.getAverageTime(operation),
          max: Math.max(...times),
          min: Math.min(...times),
          count: times.length,
        };
      }
    });
    
    return result;
  }
  
  static logMetrics(): void {
    if (!this.isEnabled) return;
    
    console.group('📊 Frontend Performance Metrics');
    const metrics = this.getMetrics();
    
    Object.entries(metrics).forEach(([operation, stats]) => {
      console.log(
        `${operation}: avg=${stats.avg.toFixed(2)}ms, max=${stats.max.toFixed(2)}ms, min=${stats.min.toFixed(2)}ms, count=${stats.count}`
      );
    });
    
    console.groupEnd();
  }
  
  static clear(): void {
    this.metrics.clear();
  }
}

// React component performance wrapper
export function withPerformanceMonitoring<T extends Record<string, any>>(
  Component: React.ComponentType<T>,
  displayName: string
) {
  const WrappedComponent = React.memo((props: T) => {
    const endTiming = FrontendPerformanceMonitor.startTiming(`Render: ${displayName}`);
    
    React.useEffect(() => {
      endTiming();
    });
    
    return React.createElement(Component, props);
  });
  
  WrappedComponent.displayName = `WithPerformanceMonitoring(${displayName})`;
  return WrappedComponent;
}

// Hook for measuring component render time
export function useRenderPerformance(componentName: string): void {
  const renderStartTime = React.useRef<number>();
  
  // Start timing before render
  renderStartTime.current = performance.now();
  
  React.useEffect(() => {
    if (renderStartTime.current) {
      const renderTime = performance.now() - renderStartTime.current;
      
      if (renderTime > 16.67) { // Longer than 60fps frame
        console.warn(`⚠️ Slow render: ${componentName} took ${renderTime.toFixed(2)}ms`);
      }
    }
  });
}

// Web Vitals monitoring
export function initWebVitalsMonitoring(): void {
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
    // Simple web vitals monitoring without specific imports
    const logMetric = (metric: WebVitalMetric) => {
      console.log(`📈 Web Vital: ${metric.name} = ${metric.value}`);
      
      // Send to analytics if needed
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', metric.name, {
          event_category: 'Web Vitals',
          value: Math.round(metric.value),
          event_label: metric.id,
        });
      }
    };

    // Safely try to import and use web-vitals
    try {
      import('web-vitals').then((webVitals: any) => {
        // Try different function names based on version
        const vitalsToTrack = ['onCLS', 'onFID', 'onINP', 'onFCP', 'onLCP', 'onTTFB'];
        
        vitalsToTrack.forEach(vitalName => {
          if (typeof webVitals[vitalName] === 'function') {
            webVitals[vitalName](logMetric);
          }
        });
      }).catch(error => {
        console.error('Failed to load web-vitals:', error);
      });
    } catch (error) {
      console.error('Web vitals monitoring not available:', error);
    }
  }
}

// Memory usage monitoring
export function useMemoryMonitoring(): { memoryUsage: number; isHighUsage: boolean } {
  const [memoryUsage, setMemoryUsage] = React.useState<number>(0);
  
  React.useEffect(() => {
    if ('memory' in performance) {
      const checkMemory = () => {
        const memory = (performance as any).memory;
        const usage = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
        setMemoryUsage(usage);
        
        if (usage > 0.8) {
          console.warn(`🔥 High memory usage: ${(usage * 100).toFixed(1)}%`);
        }
      };
      
      const interval = setInterval(checkMemory, 5000); // Check every 5 seconds
      checkMemory(); // Initial check
      
      return () => clearInterval(interval);
    }
  }, []);
  
  return {
    memoryUsage,
    isHighUsage: memoryUsage > 0.8,
  };
}

// Bundle size analyzer (development only)
export function logBundleInfo(): void {
  if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
    // Log loaded scripts
    const scripts = Array.from(document.querySelectorAll('script[src]'));
    const totalSize = scripts.reduce((size, script) => {
      return size + (script.getAttribute('src')?.length || 0);
    }, 0);
    
    console.group('📦 Bundle Info');
    console.log(`Total scripts: ${scripts.length}`);
    console.log(`Estimated script URLs size: ${(totalSize / 1024).toFixed(2)}KB`);
    console.groupEnd();
  }
}
