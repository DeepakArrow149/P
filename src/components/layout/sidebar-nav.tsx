'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { NavItem } from '@/config/nav';
import { cn } from '@/lib/utils';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  sidebarMenuButtonVariants, 
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { LucideIcon } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton'; 

interface SidebarNavProps {
  items: NavItem[];
}

const getIsActive = (href: string | undefined, currentPathname: string | null): boolean => {
  if (typeof currentPathname !== 'string' || !href || href === '#') {
    return false;
  }
  if (href === '/') {
    return currentPathname === href;
  }
  return currentPathname === href || currentPathname.startsWith(`${href}/`);
};

const getInitialActiveAccordion = (pathname: string | null, navItems: NavItem[]): string | undefined => {
  if (!pathname) return undefined;
  for (const item of navItems) {
    if (item.children?.length) {
      const isParentActive = item.children.some(child => getIsActive(child.href, pathname));
      if (isParentActive) {
        return item.title;
      }
    }
  }
  return undefined;
};


const SidebarMenuSkeletonItem: React.FC<{ showIcon: boolean; isSubItem?: boolean }> = ({ showIcon, isSubItem }) => {
  return (
    <div
      data-sidebar="menu-skeleton"
      className={cn(
        sidebarMenuButtonVariants({ variant: 'default', size: 'default' }),
        "gap-2 text-sidebar-foreground/50 pointer-events-none",
        isSubItem && "h-7 text-xs pl-7" // Adjusted for sub-item skeleton
      )}
    >
      {showIcon && <Skeleton className="h-4 w-4 rounded-sm bg-sidebar-foreground/10 flex-shrink-0" />}
      {!showIcon && <div style={{ width: '1rem', height: '1rem', flexShrink: 0 }} />} {/* Placeholder for icon space */}
      <Skeleton className="h-4 flex-grow rounded-sm bg-sidebar-foreground/10" /> {/* Text skeleton */}
    </div>
  );
};


export function SidebarNav({ items }: SidebarNavProps) {
  const currentPathname = usePathname();
  const { setOpenMobile } = useSidebar();
  
  const [isMounted, setIsMounted] = useState(false);
  const [activeAccordionValue, setActiveAccordionValue] = useState<string | undefined>(undefined);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && currentPathname) {
        setActiveAccordionValue(getInitialActiveAccordion(currentPathname, items));
    }
  }, [isMounted, currentPathname, items]);


  if (!items?.length) {
    return null;
  }

  const renderSkeleton = !isMounted;

  if (renderSkeleton) {
    return (
      <SidebarMenu>
        {items.map((item, index) => {
          const Icon = item.icon as LucideIcon;
          if (item.children?.length) {
            return (
              <div key={`${item.title}-${index}-accordion-skeleton`} className="px-2 py-0 w-full">
                <div
                  className={cn(
                    sidebarMenuButtonVariants({ variant: 'default', size: 'default' }),
                    "flex items-center justify-between w-full",
                    "gap-2 text-sidebar-foreground/50 pointer-events-none"
                  )}
                >
                  <div className="flex items-center gap-2">
                    {Icon && <Skeleton className="h-4 w-4 rounded-sm bg-sidebar-foreground/10 flex-shrink-0" />}
                    {!Icon && <div style={{width: '1rem', height: '1rem', flexShrink: 0}} />} 
                    <Skeleton className="h-4 w-3/4 rounded-sm bg-sidebar-foreground/10" />
                  </div>
                  <Skeleton className="h-4 w-4 rounded-sm bg-sidebar-foreground/10 flex-shrink-0" />
                </div>
              </div>
            );
          }
          return (
            <SidebarMenuItem key={`${item.title}-${index}-item-skeleton`} className="px-2">
               <SidebarMenuSkeletonItem showIcon={!!Icon} />
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    );
  }
  
  const handleLinkClick = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) { 
      setOpenMobile(false);
    }
  };
  
  return (
    <SidebarMenu>
      {items.map((item, index) => {
        const Icon = item.icon as LucideIcon;
        const isItemEffectivelyActive = getIsActive(item.href, currentPathname);

        if (item.children?.length) {
          const isParentEffectivelyActive = item.children.some(child => getIsActive(child.href, currentPathname));
          
          return (
            <Accordion 
              key={`${item.title}-${index}-accordion`}
              type="single" 
              collapsible 
              className="w-full px-2"
              value={activeAccordionValue} 
              onValueChange={(value) => setActiveAccordionValue(value || undefined)}
            >
              <AccordionItem value={item.title} className="border-b-0">
                <AccordionTrigger 
                  className={cn(
                    "flex items-center justify-between w-full p-2 rounded-md text-sm hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    isParentEffectivelyActive ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : "text-sidebar-foreground",
                    "[&[data-state=open]>svg]:text-sidebar-primary" 
                  )}
                >
                  <div className="flex items-center gap-2">
                    {Icon && <Icon className="h-4 w-4" />}
                    <span className="truncate">{item.title}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-0 pl-4 pt-1">
                  <SidebarMenuSub>
                    {item.children.map((child, childIndex) => {
                      const ChildIcon = child.icon as LucideIcon;
                      const isChildEffectivelyActive = getIsActive(child.href, currentPathname);
                      return (
                        <SidebarMenuSubItem key={`${child.title}-${childIndex}-subitem`}>
                          <Link href={child.href || '#'} passHref legacyBehavior={false}>
                             <SidebarMenuSubButton
                                asChild 
                                isActive={isChildEffectivelyActive}
                                onClick={handleLinkClick}
                                className="gap-2"
                              >
                                {/* Changed inner <a> to <span> */}
                                <span className="flex items-center gap-2 w-full">
                                  {ChildIcon && <ChildIcon className="h-4 w-4" />}
                                  <span className="truncate">{child.title}</span>
                                </span>
                              </SidebarMenuSubButton>
                          </Link>
                        </SidebarMenuSubItem>
                      );
                    })}
                  </SidebarMenuSub>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          );
        }

        return (
          <SidebarMenuItem key={`${item.title}-${index}-item`} className="px-2">
            <Link href={item.href || '#'} passHref legacyBehavior={false}> 
              <SidebarMenuButton
                asChild 
                isActive={isItemEffectivelyActive}
                onClick={() => {
                    handleLinkClick();
                    setActiveAccordionValue(undefined); 
                }}
                tooltip={item.title}
                className="gap-2"
              >
                {/* Changed inner <a> to <span> */}
                <span className="flex items-center gap-2 w-full"> 
                  {Icon && <Icon className="h-4 w-4" />}
                  <span className="truncate">{item.title}</span>
                </span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}
