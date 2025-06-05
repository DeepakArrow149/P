
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import type { MergeableOrderItem } from './types';
import { Merge, Save } from 'lucide-react';

interface MergeOrdersDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  originalTaskName: string;
  mergeableOrders: MergeableOrderItem[];
  onSubmit: (selectedIds: string[]) => void;
}

export function MergeOrdersDialog({
  isOpen,
  onOpenChange,
  originalTaskName,
  mergeableOrders,
  onSubmit,
}: MergeOrdersDialogProps) {
  const [selectedOrderIds, setSelectedOrderIds] = React.useState<Set<string>>(new Set());

  const handleCheckboxChange = (orderId: string, checked: boolean) => {
    setSelectedOrderIds(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(orderId);
      } else {
        newSet.delete(orderId);
      }
      return newSet;
    });
  };

  const handleSubmit = () => {
    onSubmit(Array.from(selectedOrderIds));
    setSelectedOrderIds(new Set()); // Reset selections after submit
  };

  React.useEffect(() => {
    if (!isOpen) {
      setSelectedOrderIds(new Set()); // Reset selections when dialog closes
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md md:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Merge className="mr-2 h-5 w-5 text-primary" />
            Merge Orders
          </DialogTitle>
          <DialogDescription>
            Select orders to merge with: <strong>{originalTaskName}</strong>.
            All selected orders must belong to the same buyer.
          </DialogDescription>
        </DialogHeader>

        {mergeableOrders.length === 0 ? (
          <div className="py-4 text-center text-muted-foreground">
            No other orders found for this buyer to merge with.
          </div>
        ) : (
          <ScrollArea className="max-h-[60vh] my-4 pr-4">
            <div className="space-y-3">
              {mergeableOrders.map((order) => (
                <div key={order.id} className="flex items-center space-x-3 p-3 border rounded-md hover:bg-muted/50">
                  <Checkbox
                    id={`merge-${order.id}`}
                    checked={selectedOrderIds.has(order.id)}
                    onCheckedChange={(checked) => handleCheckboxChange(order.id, !!checked)}
                  />
                  <Label htmlFor={`merge-${order.id}`} className="flex-1 cursor-pointer">
                    <div className="font-medium">{order.displayLabel}</div>
                    <div className="text-xs text-muted-foreground">
                      Type: {order.type === 'task' ? 'Scheduled Task' : 'Unscheduled Order'} | Qty: {order.quantity}
                    </div>
                  </Label>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        <DialogFooter className="pt-4">
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button type="button" onClick={handleSubmit} disabled={mergeableOrders.length === 0 || selectedOrderIds.size === 0}>
            <Save className="mr-2 h-4 w-4" />
            Merge Selected ({selectedOrderIds.size})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
