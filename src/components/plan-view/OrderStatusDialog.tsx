
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
import { Printer, CheckSquare, XSquare, Info, BarChartHorizontalBig, AlertOctagon, Package, Clock } from 'lucide-react';
import type { Task, VerticalTask } from './types';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'; // Added TooltipProvider

interface OrderStatusDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | VerticalTask | null;
}

interface OperationStage {
  name: string;
  total: number;
  made: number;
  waiting: number; // WIP
  overdue: number;
}

const getMockProgressData = (orderTotalQuantity: number): OperationStage[] => {
  // Simple mock: distribute progress somewhat randomly, ensure overdue fits
  const stages = ["CUT", "INPUT", "SEW", "FINISH", "PACK", "SHIP"];
  return stages.map((stageName, index) => {
    let made = 0;
    let waiting = 0;
    let overdue = 0;

    if (index === 0) { // CUT
      made = Math.floor(orderTotalQuantity * 0.6);
      waiting = Math.floor(orderTotalQuantity * 0.2);
      overdue = Math.floor(orderTotalQuantity * 0.05);
    } else if (index === 1) { // INPUT
      made = Math.floor(orderTotalQuantity * 0.4);
      waiting = Math.floor(orderTotalQuantity * 0.3);
      overdue = Math.floor(orderTotalQuantity * 0.1);
    } else if (index === 2) { // SEW
        made = Math.floor(orderTotalQuantity * 0.2);
        waiting = Math.floor(orderTotalQuantity * 0.1);
        overdue = 0;
    }
     // Ensure made + waiting + overdue <= total (for bar logic)
    if (made + waiting + overdue > orderTotalQuantity) {
        const excess = (made + waiting + overdue) - orderTotalQuantity;
        if (overdue >= excess) overdue -= excess;
        else if (waiting >= excess - overdue) waiting -= (excess - overdue);
        else made -= (excess - overdue - waiting);
        made = Math.max(0, made);
        waiting = Math.max(0, waiting);
        overdue = Math.max(0, overdue);
    }


    return {
      name: stageName,
      total: orderTotalQuantity,
      made,
      waiting,
      overdue,
    };
  });
};

export function OrderStatusDialog({ isOpen, onOpenChange, task }: OrderStatusDialogProps) {
  if (!task) return null;

  const orderIdentifier = 'originalOrderDetails' in task && task.originalOrderDetails
    ? `${task.originalOrderDetails.buyer}::${task.originalOrderDetails.style} (${task.originalOrderDetails.productType || 'N/A'}) ${task.originalOrderDetails.quantity}`
    : ('label' in task ? task.label : task.orderName);

  const totalQuantity = task.originalOrderDetails?.quantity || 0;
  const mockProgress = getMockProgressData(totalQuantity);

  const getBarSegmentWidth = (value: number, total: number) => {
    if (total === 0) return '0%';
    return `${Math.max(0, Math.min(100, (value / total) * 100))}%`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl md:max-w-4xl lg:max-w-5xl max-h-[90vh] flex flex-col">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="text-xl flex items-center justify-between">
            <span className="truncate">Order Status: {orderIdentifier}</span>
            <div className="flex items-center gap-2">
              {/* <Button variant="outline" size="sm"><Info className="mr-2 h-4 w-4" />Order Details</Button> */}
              <Button variant="outline" size="sm"><Printer className="mr-2 h-4 w-4" />Print</Button>
              <DialogClose asChild>
                <Button variant="ghost" size="icon"><XSquare className="h-5 w-5" /></Button>
              </DialogClose>
            </div>
          </DialogTitle>
          {/* <DialogDescription>
            Detailed operation-wise progress for the selected order.
          </DialogDescription> */}
        </DialogHeader>

        <ScrollArea className="flex-grow py-4 pr-2">
          <div className="space-y-5">
            {mockProgress.map((stage) => (
              <div key={stage.name} className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-sm">{stage.name}</span>
                  <span className="text-xs text-muted-foreground">Total: {stage.total.toLocaleString()}</span>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="w-full h-6 bg-yellow-300 rounded flex overflow-hidden relative shadow-inner border border-yellow-400">
                        {/* Made (Green) */}
                        <div
                          className="h-full bg-green-500 transition-all duration-300 ease-out"
                          style={{ width: getBarSegmentWidth(stage.made, stage.total) }}
                        />
                        {/* Waiting/WIP (Cyan/Blue) */}
                        <div
                          className="h-full bg-cyan-400 transition-all duration-300 ease-out"
                          style={{ width: getBarSegmentWidth(stage.waiting, stage.total) }}
                        />
                        {/* Overdue (Red) - Positioned after Waiting */}
                        <div
                          className="h-full bg-red-500 transition-all duration-300 ease-out"
                          style={{ width: getBarSegmentWidth(stage.overdue, stage.total) }}
                        />
                         {/* Text overlays - carefully positioned */}
                        <div className="absolute inset-0 flex items-center pointer-events-none text-[10px] font-medium">
                          {stage.made > 0 && (
                            <div className="h-full flex items-center justify-center px-1 bg-green-500 text-white" style={{ width: getBarSegmentWidth(stage.made, stage.total) }}>
                              <span className="truncate">{stage.made}</span>
                            </div>
                          )}
                          {stage.waiting > 0 && (
                            <div className="h-full flex items-center justify-center px-1 bg-cyan-400 text-black" style={{ width: getBarSegmentWidth(stage.waiting, stage.total) }}>
                               <span className="truncate">{stage.waiting}</span>
                            </div>
                          )}
                           {stage.overdue > 0 && (
                            <div className="h-full flex items-center justify-center px-1 bg-red-500 text-white" style={{ width: getBarSegmentWidth(stage.overdue, stage.total) }}>
                               <span className="truncate">{stage.overdue}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="bg-popover text-popover-foreground p-2 rounded shadow-lg text-xs">
                      <p>Stage: {stage.name}</p>
                      <p>Made: {stage.made.toLocaleString()}</p>
                      <p>Waiting/WIP: {stage.waiting.toLocaleString()}</p>
                      <p>Overdue: {stage.overdue.toLocaleString()}</p>
                      <p>Total for Stage: {stage.total.toLocaleString()}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="border-t pt-4 mt-auto">
          <DialogTitle className="text-sm font-semibold mb-2">Legend</DialogTitle>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-2 text-xs">
            <div className="flex items-center"><div className="w-3 h-3 rounded-sm bg-green-500 mr-1.5"></div>Made</div>
            <div className="flex items-center"><div className="w-3 h-3 rounded-sm bg-cyan-400 mr-1.5"></div>Waiting/WIP</div>
            <div className="flex items-center"><div className="w-3 h-3 rounded-sm bg-yellow-300 mr-1.5 border border-yellow-400"></div>Total</div>
            <div className="flex items-center"><div className="w-3 h-3 rounded-sm bg-red-500 mr-1.5"></div>Overdue</div>
            <div className="flex items-center"><div className="w-3 h-3 rounded-sm bg-purple-500 mr-1.5"></div>Mark Complete</div>
            <div className="flex items-center"><div className="w-3 h-3 rounded-sm bg-amber-700 mr-1.5"></div>WIP Invalid</div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
