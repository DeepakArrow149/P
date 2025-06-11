import type { Metadata } from 'next';
import { Inter as FontSans } from 'next/font/google'; // Using Inter as a common sans-serif font
import './globals.css';
import { cn } from '@/lib/utils';
import { AppLayout } from '@/components/layout/app-layout';
import { LayoutProvider } from '@/contexts/LayoutContext';
import { WebVitalsProvider } from '@/components/providers/web-vitals-provider';

const fontSans = FontSans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap', // Optimize font loading
  preload: true,
});

export const metadata: Metadata = {
  title: 'Track Tech',
  description: 'Production Planning and Scheduling for Apparel Industry',
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#4DB6AC',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body
        suppressHydrationWarning={true} 
        className={cn(
          'min-h-screen bg-background font-sans antialiased',
          fontSans.variable
        )}
      >
        <WebVitalsProvider />
        <LayoutProvider>
          <AppLayout>{children}</AppLayout>
        </LayoutProvider>
      </body>
    </html>
  );
}