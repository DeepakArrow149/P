
'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { GitCommitVertical, Paperclip, UserCircle, Edit3, CheckCircle, PlusCircle as PlusCircleIcon } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

// Mirroring DisplayOrder from order-list/page.tsx for prop consistency
interface DisplayOrderForLog {
  id: string;
  orderNo?: string;
  buyer?: string;
  styleName?: string;
  quantity?: number;
  product?: string;
  customer?: string;
  status?: string;
}

interface LogEntry {
  id: string;
  timestamp: Date;
  user: string;
  action: string;
  description: string;
  details?: Record<string, { oldValue?: string; newValue?: string }>;
  icon?: LucideIcon;
  iconColor?: string;
}

interface OrderLogDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  order: DisplayOrderForLog | null;
}

const generateMockLogEntries = (order: DisplayOrderForLog | null): LogEntry[] => {
  if (!order) return [];
  const now = new Date();
  const logEntries: LogEntry[] = [];

  logEntries.push({
    id: 'log1',
    timestamp: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 5, 10, 30),
    user: 'Planner Alpha',
    action: 'Order Created',
    description: `Order ${order.orderNo || order.id} created with initial quantity ${order.quantity?.toLocaleString() || 'N/A'}.`,
    icon: PlusCircleIcon,
    iconColor: 'text-green-100', // For icon within colored circle
  });

  logEntries.push({
    id: 'log2',
    timestamp: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 3, 14, 15),
    user: 'Merchandiser X',
    action: 'Status Update',
    description: `Status changed from 'Provisional' to 'Confirmed'.`,
    details: { Status: { oldValue: 'Provisional', newValue: 'Confirmed' } },
    icon: CheckCircle,
    iconColor: 'text-blue-100',
  });
  
  if (order.quantity && order.quantity > 0) {
    logEntries.push({
      id: 'log3',
      timestamp: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2, 9, 0),
      user: 'Planner Beta',
      action: 'Quantity Adjusted',
      description: `Quantity updated for style ${order.styleName || 'Unknown Style'}.`,
      details: { Quantity: { oldValue: (order.quantity - 200 > 0 ? order.quantity - 200 : 50).toLocaleString(), newValue: (order.quantity).toLocaleString() } },
      icon: Edit3,
      iconColor: 'text-orange-100',
    });
  }


  logEntries.push({
    id: 'log4',
    timestamp: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 16, 45),
    user: 'System',
    action: 'Attachment Added',
    description: 'PO Scan document.pdf attached.',
    icon: Paperclip,
    iconColor: 'text-gray-100',
  });

  return logEntries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()); // Sort descending
};

export function OrderLogDialog({ isOpen, onOpenChange, order }: OrderLogDialogProps) {
  const [logEntries, setLogEntries] = React.useState<LogEntry[]>([]);

  React.useEffect(() => {
    if (isOpen && order) {
      setLogEntries(generateMockLogEntries(order));
    }
  }, [isOpen, order]);

  if (!order) return null;

  const orderIdentifier = order.orderNo || order.id;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl md:max-w-3xl lg:max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader className="border-b pb-4 px-6 pt-6">
          <DialogTitle className="text-xl">Log History for Order: {orderIdentifier}</DialogTitle>
          <DialogDescription>
            Buyer: {order.customer || order.buyer || 'N/A'} | Style: {order.product || order.styleName || 'N/A'} | Qty: {order.quantity?.toLocaleString() || 'N/A'}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-grow px-6 py-4">
          {logEntries.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No log entries available for this order.</p>
          ) : (
            <div className="relative pl-2"> {/* Added padding for the line start */}
              {/* Vertical Timeline Line */}
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border z-0"></div>

              {logEntries.map((entry, index) => {
                const IconComponent = entry.icon || Edit3;
                const iconCircleBg = 
                    entry.action === 'Order Created' ? 'bg-green-500' :
                    entry.action === 'Status Update' ? 'bg-blue-500' :
                    entry.action === 'Quantity Adjusted' ? 'bg-orange-500' :
                    entry.action === 'Attachment Added' ? 'bg-gray-500' :
                    'bg-primary';

                return (
                  <div key={entry.id} className="flex items-start mb-6 relative z-10">
                    {/* Date and User Icon Column */}
                    <div className="flex flex-col items-center mr-4 w-20 flex-shrink-0 text-right">
                       <div className="text-xs text-muted-foreground whitespace-nowrap">
                        {format(entry.timestamp, 'dd MMM')}
                      </div>
                      <div className="text-[10px] text-muted-foreground/80 whitespace-nowrap">
                        {format(entry.timestamp, 'HH:mm a')}
                      </div>
                       <div className="mt-1 flex items-center text-xs text-muted-foreground" title={`User: ${entry.user}`}>
                         <UserCircle className="h-3 w-3 mr-1 opacity-70" /> 
                         <span className="truncate">{entry.user.split(' ')[0]}</span>
                       </div>
                    </div>

                    {/* Timeline Dot/Icon on the Line */}
                    <div className="absolute left-6 top-1 transform -translate-x-1/2 bg-background p-0.5 rounded-full">
                      <div className={cn("w-3 h-3 rounded-full flex items-center justify-center", iconCircleBg)}>
                        <IconComponent className={cn("h-2 w-2", entry.iconColor || 'text-primary-foreground')} />
                      </div>
                    </div>
                    
                    {/* Content Card */}
                    <div className="ml-8 flex-1 bg-card p-3 rounded-md border border-border shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start">
                        <h4 className="font-semibold text-sm text-foreground">{entry.action}</h4>
                        {/* Can add specific status here if needed from entry.details */}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 mb-1.5">{entry.description}</p>
                      {entry.details && (
                        <div className="mt-1.5 space-y-0.5">
                          {Object.entries(entry.details).map(([field, values]) => (
                            <div key={field} className="text-xs">
                              <span className="font-medium text-muted-foreground">{field}: </span>
                              {values.oldValue && <span className="line-through text-destructive/80">{values.oldValue}</span>}
                              {values.oldValue && values.newValue && <span className="mx-1 text-muted-foreground/70">→</span>}
                              {values.newValue && <span className="text-green-600 font-medium">{values.newValue}</span>}
                              {!values.oldValue && !values.newValue && <span>(Details not specified)</span>}
                            </div>
                          ))}
                        </div>
                      )}
                      {entry.action === 'Attachment Added' && <Paperclip className="h-3 w-3 mt-1.5 text-muted-foreground inline-block" />}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <DialogFooter className="p-4 border-t flex-shrink-0">
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
