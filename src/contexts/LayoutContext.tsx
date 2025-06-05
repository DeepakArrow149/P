
'use client';

import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';

interface LayoutContextType {
  isMaximized: boolean;
  toggleMaximized: () => void;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export const LayoutProvider = ({ children }: { children: ReactNode }) => {
  const [isMaximized, setIsMaximized] = useState(false);
  
  const toggleMaximized = useCallback(() => {
    setIsMaximized(prev => !prev);
  }, []);

  return (
    <LayoutContext.Provider value={{ isMaximized, toggleMaximized }}>
      {children}
    </LayoutContext.Provider>
  );
};

export const useLayout = (): LayoutContextType => {
  const context = useContext(LayoutContext);
  if (context === undefined) {
    throw new Error('useLayout must be used within a LayoutProvider'); // Fixed the missing closing quote
  }
  return context;
};
