
// Use client directive because SidebarProvider and other ShadCN UI components use client-side features
"use client"; 

import type { ReactNode } from 'react';
import React from 'react'; 
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset,
  SidebarRail,
  sidebarMenuButtonVariants, 
} from '@/components/ui/sidebar';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { navConfig } from '@/config/nav';
import { Toaster } from "@/components/ui/toaster";
import { Button } from '@/components/ui/button';
import { LogOut, Settings, PanelLeft, Maximize2, Minimize2 } from 'lucide-react'; 
import { Skeleton } from '@/components/ui/skeleton'; 
import { cn } from '@/lib/utils';
import { useLayout } from '@/contexts/LayoutContext';


export function AppLayout({ children }: { children: ReactNode }) {
  const [isMounted, setIsMounted] = React.useState(false);
  const { isMaximized } = useLayout();

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <SidebarProvider defaultOpen={true}>
      {!isMaximized && isMounted ? (
        <Sidebar collapsible="icon" variant="sidebar" side="left" className="border-r border-sidebar-border z-50"> {/* Increased z-index for main sidebar */}
          <SidebarRail />
          <SidebarHeader className="p-4 border-b border-sidebar-border">
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-primary">
                <path d="M3 6C6.5 6 9 2 12 5C15 2 17.5 6 21 6"/>
                <path d="M3 12C6.5 12 9 8 12 11C15 8 17.5 12 21 12"/>
                <path d="M3 18C6.5 18 9 14 12 17C15 14 17.5 18 21 18"/>
              </svg>
              <div className="text-xl font-semibold text-sidebar-foreground group-data-[collapsible=icon]:hidden">
                Track Tech
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent className="p-0">
            <SidebarNav items={navConfig} />
          </SidebarContent>
          <SidebarFooter className="p-2 mt-auto border-t border-sidebar-border">
            <Button variant="ghost" className="w-full justify-start gap-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:justify-center">
              <LogOut className="h-4 w-4" />
              <span className="group-data-[collapsible=icon]:hidden">Logout</span>
            </Button>
          </SidebarFooter>
        </Sidebar>
      ) : !isMaximized && !isMounted ? (
        <div className="hidden md:flex flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border flex-shrink-0 h-svh z-50" style={{width: 'var(--sidebar-width, 16rem)'}}>
           <div className="p-4 border-b border-sidebar-border h-[65px] flex items-center flex-shrink-0">
             <Skeleton className="h-8 w-8 mr-2 bg-sidebar-foreground/10 rounded" />
             <Skeleton className="h-6 w-3/4 bg-sidebar-foreground/10 rounded" />
           </div>
           <div className="p-2 flex-1 overflow-y-auto"> 
            {navConfig.map((item, index) => (
                <div key={`${item.title}-${index}-skeleton`} className={cn(sidebarMenuButtonVariants({variant: 'default', size: 'default'}), "gap-2 text-sidebar-foreground/50 pointer-events-none mb-1 w-full")}> 
                    {item.icon && <Skeleton className="h-4 w-4 bg-sidebar-foreground/10 rounded-sm flex-shrink-0" />}
                    {!item.icon && <div style={{width: '1rem', height: '1rem', flexShrink:0}} />}
                    <Skeleton className="h-4 flex-grow bg-sidebar-foreground/10 rounded-sm" /> 
                </div>
            ))}
           </div>
           <div className="p-2 mt-auto border-t border-sidebar-border flex-shrink-0">
             <Skeleton className="h-10 w-full bg-sidebar-foreground/10 rounded-md" />
           </div>
        </div>
      ) : null}

      <SidebarInset className={cn(
        "flex flex-col",
        isMaximized && "md:ml-0" // Ensure no margin when maximized
      )}>
        {!isMaximized && (
            <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 lg:h-[60px] lg:px-6 flex-shrink-0">
            <SidebarTrigger /> 
            <div className="flex-1">
                {/* Breadcrumbs or page title could go here */}
            </div>
            <Button variant="ghost" size="icon">
                <Settings className="h-5 w-5" />
                <span className="sr-only">Settings</span>
            </Button>
            </header>
        )}
        <main className={cn(
            "flex-1 flex flex-col overflow-hidden", // Main area handles its own overflow
             isMaximized ? "p-0" : "p-4 lg:p-6" // No padding when maximized
        )}>
          {children}
        </main>
      </SidebarInset>
      <Toaster />
    </SidebarProvider>
  );
}