
// src/components/plan-view/UnplannedListDialog.tsx
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileText, Package, Users, CalendarDays, Hash, Settings, Printer, Layers, XSquare, CheckSquare, Trash2, PlusCircle } from 'lucide-react';
import type { UnscheduledOrder } from './types';
import { format, parseISO } from 'date-fns';

interface UnplannedListDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  unscheduledOrders: UnscheduledOrder[];
  onLoadSelectedOrders: (orderIds: string[]) => void;
  onConfigure: () => void;
}

export function UnplannedListDialog({
  isOpen,
  onOpenChange,
  unscheduledOrders,
  onLoadSelectedOrders,
  onConfigure,
}: UnplannedListDialogProps) {
  const [selectedOrderIds, setSelectedOrderIds] = React.useState<Set<string>>(new Set());
  const [selectedOrderForHistory, setSelectedOrderForHistory] = React.useState<UnscheduledOrder | null>(null);

  const handleSelectOrder = (orderId: string, isSelected: boolean) => {
    setSelectedOrderIds(prev => {
      const newSet = new Set(prev);
      if (isSelected) {
        newSet.add(orderId);
      } else {
        newSet.delete(orderId);
      }
      return newSet;
    });
    const order = unscheduledOrders.find(o => o.id === orderId);
    if (order && isSelected) {
        setSelectedOrderForHistory(order);
    } else if (selectedOrderForHistory?.id === orderId && !isSelected) {
        setSelectedOrderForHistory(null);
    } else if (!isSelected && selectedOrderIds.size > 0) { // Check current selectedOrderIds size, not newSet yet
        const firstSelectedId = Array.from(selectedOrderIds).find(id => id !== orderId); // Find another selected if current one is deselected
        if (firstSelectedId) {
            setSelectedOrderForHistory(unscheduledOrders.find(o => o.id === firstSelectedId) || null);
        } else {
             setSelectedOrderForHistory(null);
        }
    } else if (selectedOrderIds.size === 0 && !isSelected) { // If last item is deselected
        setSelectedOrderForHistory(null);
    }
  };


  const handleLoadClick = () => {
    onLoadSelectedOrders(Array.from(selectedOrderIds));
    setSelectedOrderIds(new Set());
    setSelectedOrderForHistory(null);
  };

  const handleDeallocateClick = () => {
    // Placeholder for deallocate functionality
    alert(`Deallocate clicked for orders: ${Array.from(selectedOrderIds).join(', ')}`);
  };

  const handlePrintClick = () => {
    alert('Print clicked');
  };
  
  React.useEffect(() => {
    if (!isOpen) {
      setSelectedOrderIds(new Set());
      setSelectedOrderForHistory(null);
    }
  }, [isOpen]);


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="flex items-center justify-between">
            Unplanned Order List
            <DialogClose asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <XSquare className="h-5 w-5" />
              </Button>
            </DialogClose>
          </DialogTitle>
          {/* <DialogDescription>Select orders to load onto the planning board or manage.</DialogDescription> */}
        </DialogHeader>

        <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-0 overflow-hidden">
          {/* Left Panel - Order Table */}
          <div className="md:col-span-2 flex flex-col border-r p-3 overflow-hidden">
            <div className="flex items-center gap-2 mb-3">
              <Button size="sm" variant="outline" onClick={() => alert("Select All/None logic to be implemented")}>
                <CheckSquare className="mr-2 h-4 w-4" /> Select Orders
              </Button>
              <Button size="sm" onClick={handleLoadClick} disabled={selectedOrderIds.size === 0}>
                <PlusCircle className="mr-2 h-4 w-4" /> Load Orders ({selectedOrderIds.size})
              </Button>
              <Button size="sm" variant="destructive" onClick={handleDeallocateClick} disabled={selectedOrderIds.size === 0}>
                <Trash2 className="mr-2 h-4 w-4" /> Deallocate
              </Button>
              <Button size="sm" variant="outline" onClick={handlePrintClick}>
                <Printer className="mr-2 h-4 w-4" /> Print
              </Button>
               <Button size="sm" variant="outline" onClick={onConfigure} className="ml-auto">
                <Settings className="mr-2 h-4 w-4" /> Configure
              </Button>
            </div>
            <ScrollArea className="flex-grow border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10 p-2"><Checkbox disabled title="Select all" /></TableHead>
                    <TableHead className="min-w-[100px]">Order Code</TableHead>
                    <TableHead className="min-w-[120px]">Product (Style)</TableHead>
                    <TableHead className="min-w-[100px]">Customer</TableHead>
                    <TableHead className="min-w-[100px]">Req. Date</TableHead>
                    <TableHead className="min-w-[80px] text-right">Quantity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {unscheduledOrders.length > 0 ? (
                    unscheduledOrders.map(order => (
                      <TableRow key={order.id} 
                                data-state={selectedOrderIds.has(order.id) ? "selected" : ""}
                                onClick={() => handleSelectOrder(order.id, !selectedOrderIds.has(order.id))}
                                className="cursor-pointer"
                      >
                        <TableCell className="p-2">
                          <Checkbox
                            checked={selectedOrderIds.has(order.id)}
                            onCheckedChange={(checked) => handleSelectOrder(order.id, !!checked)}
                            onClick={(e) => e.stopPropagation()} // Prevent row click from toggling checkbox twice
                          />
                        </TableCell>
                        <TableCell className="font-medium">{order.id}</TableCell>
                        <TableCell>{order.style}</TableCell>
                        <TableCell>{order.buyer}</TableCell>
                        <TableCell>{order.requestedShipDate ? format(parseISO(order.requestedShipDate), 'dd-MMM-yy') : 'N/A'}</TableCell>
                        <TableCell className="text-right">{order.quantity.toLocaleString()}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                        No unscheduled orders found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>

          {/* Right Panel - Production History & Preview */}
          <div className="flex flex-col overflow-hidden p-3">
            <div className="flex-grow border rounded-md p-3 mb-3 overflow-y-auto">
              <h3 className="text-md font-semibold mb-2 sticky top-0 bg-card py-1">
                Production history for: {selectedOrderForHistory?.style || <span className="italic text-muted-foreground">Select an order</span>}
              </h3>
              {selectedOrderForHistory ? (
                <p className="text-sm text-muted-foreground">Production history details for {selectedOrderForHistory.id} will appear here. (Mock)</p>
                // Placeholder for actual history list
              ) : (
                <p className="text-sm text-muted-foreground text-center pt-4">Select an order from the list to view its production history.</p>
              )}
            </div>
            <div className="flex-shrink-0 border rounded-md p-3 h-40">
              <div className="flex items-center mb-2">
                <Checkbox id="show-load-preview" />
                <Label htmlFor="show-load-preview" className="ml-2 text-sm">Show load preview image</Label>
              </div>
              <div className="bg-muted h-24 flex items-center justify-center rounded">
                {selectedOrderForHistory?.imageHint ? (
                    <img src={`https://placehold.co/100x80.png?text=${selectedOrderForHistory.style.substring(0,10)}`} alt="Preview" className="max-h-full max-w-full object-contain" data-ai-hint={selectedOrderForHistory.imageHint} />
                ) : (
                    <Package className="h-12 w-12 text-muted-foreground" />
                )}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="p-3 border-t flex items-center justify-between w-full">
            <div className="text-xs text-muted-foreground">
                {selectedOrderIds.size} orders selected. Total Qty: {
                    unscheduledOrders
                        .filter(o => selectedOrderIds.has(o.id))
                        .reduce((sum, o) => sum + o.quantity, 0)
                        .toLocaleString()
                }
            </div>
            <div className="text-xs text-muted-foreground">
                {unscheduledOrders.length} total new jobs in list.
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
