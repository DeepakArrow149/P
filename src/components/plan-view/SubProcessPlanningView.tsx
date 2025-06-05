
// src/components/plan-view/SubProcessPlanningView.tsx
'use client';

import * as React from 'react';
import type { SubProcessOrder, SubProcessViewMode } from './types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { format, parseISO } from 'date-fns';
import { Save } from 'lucide-react';

interface SubProcessPlanningViewProps {
  orders: SubProcessOrder[];
  onUpdateOrder: (updatedOrder: SubProcessOrder) => void;
  onSavePlan: () => void;
  displayedDates?: Date[]; // Make it optional to handle initial undefined state
  viewType: SubProcessViewMode; 
}

export function SubProcessPlanningView({
  orders,
  onUpdateOrder,
  onSavePlan,
  displayedDates, // Can be undefined initially
  viewType
}: SubProcessPlanningViewProps) {
  
  const safeDisplayedDates = Array.isArray(displayedDates) ? displayedDates : [];

  const handleDailyTargetChange = (
    orderId: string,
    dateString: string,
    value: string
  ) => {
    const newQty = parseInt(value, 10);
    const orderToUpdate = orders.find(o => o.id === orderId);
    if (orderToUpdate) {
      const updatedDailyTargets = { ...orderToUpdate.dailyTargets };
      if (!isNaN(newQty) && newQty >= 0) {
        updatedDailyTargets[dateString] = newQty;
      } else {
        delete updatedDailyTargets[dateString]; 
      }
      onUpdateOrder({ ...orderToUpdate, dailyTargets: updatedDailyTargets });
    }
  };

  const calculateRowTotal = (order: SubProcessOrder): number => {
    return Object.values(order.dailyTargets).reduce((sum, qty) => sum + (Number(qty) || 0), 0);
  };

  const calculateColumnTotal = (dateString: string): number => {
    return orders.reduce((sum, order) => sum + (Number(order.dailyTargets[dateString]) || 0), 0);
  };
  
  const overallTotalPlanQty = orders.reduce((sum, order) => sum + order.totalPlanQty, 0);
  const overallTotalMadeQty = orders.reduce((sum, order) => sum + order.madeQty, 0);
  
  const overallTotalDailyTargets = safeDisplayedDates.length > 0 
    ? safeDisplayedDates.reduce((sum, date) => sum + calculateColumnTotal(format(date, 'yyyy-MM-dd')), 0)
    : 0;

  const filteredOrders = React.useMemo(() => {
    if (!viewType) return orders;
    return orders.filter(o => o.id.toLowerCase().includes(viewType.toLowerCase()));
  }, [orders, viewType]);


  return (
    <div className="flex flex-col h-full p-4 bg-card rounded-md shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-foreground">
          {viewType?.charAt(0).toUpperCase() + (viewType?.slice(1) || '')} View
        </h2>
        <Button onClick={onSavePlan} size="sm">
          <Save className="mr-2 h-4 w-4" /> Save {viewType} Plan
        </Button>
      </div>
      <ScrollArea className="flex-grow border rounded-md">
        <Table className="min-w-full">
          <TableHeader className="sticky top-0 bg-card z-10">
            <TableRow>
              <TableHead className="w-[100px] sticky left-0 bg-inherit z-20">Line</TableHead>
              <TableHead className="w-[120px] sticky left-[100px] bg-inherit z-20">Buyer</TableHead>
              <TableHead className="w-[150px] sticky left-[220px] bg-inherit z-20">Style</TableHead>
              <TableHead className="w-[120px]">PO</TableHead>
              <TableHead className="w-[80px]">Colour</TableHead>
              <TableHead className="w-[100px] text-right">Plan Qty</TableHead>
              <TableHead className="w-[110px]">Delivery</TableHead>
              <TableHead className="w-[100px] text-right bg-pink-100 dark:bg-pink-900/30">Made Qty</TableHead>
              <TableHead className="w-[100px] text-right">Balance</TableHead>
              <TableHead className="w-[100px] text-right bg-yellow-100 dark:bg-yellow-900/30">Backlog</TableHead>
              {safeDisplayedDates.map(date => (
                <TableHead key={format(date, 'yyyy-MM-dd')} className="w-[70px] text-center">
                  {format(date, 'MM-dd')}
                </TableHead>
              ))}
              <TableHead className="w-[90px] text-right sticky right-0 bg-inherit z-20 bg-cyan-100 dark:bg-cyan-900/30">Total Daily</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.map((order) => (
              <TableRow key={order.id} className="hover:bg-muted/50">
                <TableCell className="sticky left-0 bg-card z-10 font-medium">{order.line}</TableCell>
                <TableCell className="sticky left-[100px] bg-card z-10">{order.buyer}</TableCell>
                <TableCell className="sticky left-[220px] bg-card z-10">{order.style}</TableCell>
                <TableCell>{order.po}</TableCell>
                <TableCell>{order.colour}</TableCell>
                <TableCell className="text-right">{order.totalPlanQty.toLocaleString()}</TableCell>
                <TableCell>{format(parseISO(order.deliveryDate), 'dd-MM-yy')}</TableCell>
                <TableCell className="text-right bg-pink-50 dark:bg-pink-900/20">{order.madeQty.toLocaleString()}</TableCell>
                <TableCell className="text-right">{(order.totalPlanQty - order.madeQty).toLocaleString()}</TableCell>
                <TableCell className="text-right bg-yellow-50 dark:bg-yellow-900/20">{order.backlog.toLocaleString()}</TableCell>
                {safeDisplayedDates.map(date => {
                  const dateString = format(date, 'yyyy-MM-dd');
                  return (
                    <TableCell key={dateString} className="p-1">
                      <Input
                        type="number"
                        value={order.dailyTargets[dateString] || ''}
                        onChange={(e) => handleDailyTargetChange(order.id, dateString, e.target.value)}
                        className="h-8 text-xs text-center appearance-none [-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        placeholder="0"
                      />
                    </TableCell>
                  );
                })}
                <TableCell className="text-right font-semibold sticky right-0 bg-card z-10 bg-cyan-50 dark:bg-cyan-900/20">
                  {calculateRowTotal(order).toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
             {filteredOrders.length === 0 && (
                <TableRow>
                    <TableCell colSpan={10 + safeDisplayedDates.length + 1} className="h-24 text-center text-muted-foreground">
                        No orders found for {viewType || 'current'} view.
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
          {filteredOrders.length > 0 && safeDisplayedDates.length > 0 && (
            <TableFooter className="sticky bottom-0 bg-card z-10">
              <TableRow className="font-semibold bg-muted/80">
                <TableCell colSpan={5} className="sticky left-0 bg-inherit z-20 text-right">Totals:</TableCell>
                <TableCell className="text-right">{overallTotalPlanQty.toLocaleString()}</TableCell>
                <TableCell></TableCell> 
                <TableCell className="text-right bg-pink-100 dark:bg-pink-900/30">{overallTotalMadeQty.toLocaleString()}</TableCell>
                <TableCell className="text-right">{ (overallTotalPlanQty - overallTotalMadeQty).toLocaleString() }</TableCell>
                <TableCell className="text-right bg-yellow-100 dark:bg-yellow-900/30">{orders.reduce((sum, o) => sum + o.backlog, 0).toLocaleString()}</TableCell>
                {safeDisplayedDates.map(date => {
                  const dateString = format(date, 'yyyy-MM-dd');
                  return (
                    <TableCell key={`total-${dateString}`} className="text-center text-xs">
                      {calculateColumnTotal(dateString).toLocaleString()}
                    </TableCell>
                  );
                })}
                <TableCell className="text-right sticky right-0 bg-inherit z-20 bg-cyan-100 dark:bg-cyan-900/30">
                  {overallTotalDailyTargets.toLocaleString()}
                </TableCell>
              </TableRow>
            </TableFooter>
          )}
        </Table>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
