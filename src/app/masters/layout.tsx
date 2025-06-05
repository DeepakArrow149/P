import type { ReactNode } from 'react';

export default function MastersLayout({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-6">
      {/* You can add specific layout elements for all master pages here if needed */}
      {/* For example, a sub-navigation or context bar for masters */}
      {children}
    </div>
  );
}
