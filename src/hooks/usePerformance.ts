// Performance-related custom hooks for memory management and optimization
import React from 'react';

// Hook for proper cleanup and preventing memory leaks
export function useCleanup(cleanup: () => void): void {
  const cleanupRef = React.useRef(cleanup);
  cleanupRef.current = cleanup;
  
  React.useEffect(() => {
    return () => {
      cleanupRef.current();
    };
  }, []);
}

// Optimized event listener hook with automatic cleanup
export function useEventListener<T extends Event = Event>(
  eventName: string,
  handler: (event: T) => void,
  element: HTMLElement | Window | null = null,
  options?: AddEventListenerOptions
): void {
  const savedHandler = React.useRef<(event: T) => void>();
  
  React.useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);
  
  React.useEffect(() => {
    const targetElement = element || window;
    if (!targetElement?.addEventListener) return;
    
    const eventListener = (event: Event) => {
      if (savedHandler.current) {
        savedHandler.current(event as T);
      }
    };
    
    targetElement.addEventListener(eventName, eventListener, options);
    
    return () => {
      targetElement.removeEventListener(eventName, eventListener, options);
    };
  }, [eventName, element, options]);
}

// Intersection Observer hook with cleanup
export function useIntersectionObserver(
  elementRef: React.RefObject<HTMLElement>,
  callback: IntersectionObserverCallback,
  options?: IntersectionObserverInit
): IntersectionObserver | null {
  const [observer, setObserver] = React.useState<IntersectionObserver | null>(null);
  
  React.useEffect(() => {
    if (!elementRef.current) return;
    
    const obs = new IntersectionObserver(callback, options);
    obs.observe(elementRef.current);
    setObserver(obs);
    
    return () => {
      obs.disconnect();
      setObserver(null);
    };
  }, [elementRef, callback, options]);
  
  return observer;
}

// Debounced value hook for performance optimization
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);
  
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  
  return debouncedValue;
}

// Throttled callback hook
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastCall = React.useRef<number>(0);
  const lastCallTimer = React.useRef<NodeJS.Timeout>();
  
  const throttledCallback = React.useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      
      if (now - lastCall.current >= delay) {
        lastCall.current = now;
        callback(...args);
      } else {
        if (lastCallTimer.current) {
          clearTimeout(lastCallTimer.current);
        }
        
        lastCallTimer.current = setTimeout(() => {
          lastCall.current = Date.now();
          callback(...args);
        }, delay - (now - lastCall.current));
      }
    },
    [callback, delay]
  ) as T;
  
  return throttledCallback;
}

// Async data fetching with cleanup
export function useAsyncData<T>(
  asyncFunction: () => Promise<T>,
  dependencies: React.DependencyList = []
): {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
} {
  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<Error | null>(null);
  const isCancelledRef = React.useRef<boolean>(false);
  
  const fetchData = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    isCancelledRef.current = false;
    
    try {
      const result = await asyncFunction();
      if (!isCancelledRef.current) {
        setData(result);
      }
    } catch (err) {
      if (!isCancelledRef.current) {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    } finally {
      if (!isCancelledRef.current) {
        setLoading(false);
      }
    }
  }, dependencies);
  
  React.useEffect(() => {
    fetchData();
    
    return () => {
      isCancelledRef.current = true;
    };
  }, [fetchData]);
  
  const refetch = React.useCallback(() => {
    fetchData();
  }, [fetchData]);
  
  return { data, loading, error, refetch };
}

// Previous value hook for optimization comparisons
export function usePrevious<T>(value: T): T | undefined {
  const ref = React.useRef<T>();
  
  React.useEffect(() => {
    ref.current = value;
  });
  
  return ref.current;
}

// Render count hook for debugging
export function useRenderCount(componentName: string): number {
  const renderCount = React.useRef<number>(0);
  
  React.useEffect(() => {
    renderCount.current += 1;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔄 ${componentName} rendered ${renderCount.current} times`);
    }
  });
  
  return renderCount.current;
}

// Local storage hook with error handling
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void, () => void] {
  const [storedValue, setStoredValue] = React.useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });
  
  const setValue = React.useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        }
      } catch (error) {
        console.error(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, storedValue]
  );
  
  const removeValue = React.useCallback(() => {
    try {
      setStoredValue(initialValue);
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
      }
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);
  
  return [storedValue, setValue, removeValue];
}

// Optimized resize observer hook
export function useResizeObserver(
  elementRef: React.RefObject<HTMLElement>,
  callback: (entries: ResizeObserverEntry[]) => void
): void {
  const callbackRef = React.useRef(callback);
  callbackRef.current = callback;
  
  React.useEffect(() => {
    if (!elementRef.current) return;
    
    const resizeObserver = new ResizeObserver((entries) => {
      callbackRef.current(entries);
    });
    
    resizeObserver.observe(elementRef.current);
    
    return () => {
      resizeObserver.disconnect();
    };
  }, [elementRef]);
}
