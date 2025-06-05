import type { Metadata } from 'next';
import { Inter as FontSans } from 'next/font/google'; // Using Inter as a common sans-serif font
import './globals.css';
import { cn } from '@/lib/utils';
import { AppLayout } from '@/components/layout/app-layout';
import { LayoutProvider } from '@/contexts/LayoutContext';

const fontSans = FontSans({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'Track Tech',
  description: 'Production Planning and Scheduling for Apparel Industry',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning={true} 
        className={cn(
          'min-h-screen bg-background font-sans antialiased',
          fontSans.variable
        )}
      >
        <LayoutProvider>
          <AppLayout>{children}</AppLayout>
        </LayoutProvider>
      </body>
    </html>
  );
}