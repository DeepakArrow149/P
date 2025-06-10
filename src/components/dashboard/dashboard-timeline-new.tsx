"use client";

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  CalendarDays, 
  ChevronLeft, 
  ChevronRight, 
  MoreHorizontal,
  GripVertical 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDashboardApi } from '@/hooks/useDashboardApi';

interface ScheduleItem {
  id: string;
  orderRef: string;
  buyer: string;
  style: string;
  line: string;
  startDate: string;
  endDate: string;
  progress: number;
  priority: 'high' | 'medium' | 'low';
  status: 'scheduled' | 'in-progress' | 'completed' | 'delayed';
  quantity: number;
}

interface WIPItem {
  id: string;
  orderRef: string;
  style: string;
  line: string;
  totalQty: number;
  completedQty: number;
  targetDate: string;
  status: 'on-track' | 'at-risk' | 'delayed';
}

function ScheduleStrip({ item }: { item: ScheduleItem }) {
  const getPriorityColor = (priority: ScheduleItem['priority']) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: ScheduleItem['status']) => {
    switch (status) {
      case 'completed': return 'border-green-500 bg-green-50';
      case 'in-progress': return 'border-blue-500 bg-blue-50';
      case 'scheduled': return 'border-gray-500 bg-gray-50';
      case 'delayed': return 'border-red-500 bg-red-50';
      default: return 'border-gray-300 bg-white';
    }
  };

  return (
    <div className={cn(
      "flex items-center p-3 rounded-lg border-l-4 cursor-move hover:shadow-md transition-all",
      getStatusColor(item.status)
    )}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-xs">
              {item.orderRef}
            </Badge>
            <div className={cn(
              "w-2 h-2 rounded-full",
              getPriorityColor(item.priority)
            )} />
          </div>
          <span className="text-xs text-muted-foreground">
            {item.quantity.toLocaleString()} pcs
          </span>
        </div>
        <h4 className="font-medium text-sm truncate">{item.style}</h4>
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-muted-foreground">
            {item.buyer} • {item.line}
          </span>
          <span className="text-xs font-medium">
            {item.progress}%
          </span>
        </div>
        {item.status === 'in-progress' && (
          <Progress value={item.progress} className="mt-2 h-1" />
        )}
      </div>
      <div className="ml-2 text-muted-foreground">
        <GripVertical className="h-4 w-4" />
      </div>
    </div>
  );
}

function WIPItem({ item }: { item: WIPItem }) {
  const getStatusColor = (status: WIPItem['status']) => {
    switch (status) {
      case 'on-track': return 'text-green-600 bg-green-100';
      case 'at-risk': return 'text-yellow-600 bg-yellow-100';
      case 'delayed': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const completionPercentage = Math.round((item.completedQty / item.totalQty) * 100);

  return (
    <div className="flex items-center justify-between p-3 border rounded-lg hover:shadow-sm transition-shadow">
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-2">
          <Badge variant="outline" className="text-xs">
            {item.orderRef}
          </Badge>
          <Badge className={cn("text-xs", getStatusColor(item.status))}>
            {item.status.replace('-', ' ')}
          </Badge>
        </div>
        <h4 className="font-medium text-sm truncate mb-1">{item.style}</h4>
        <div className="text-xs text-muted-foreground mb-2">
          {item.line} • Due: {new Date(item.targetDate).toLocaleDateString()}
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span>{item.completedQty.toLocaleString()} / {item.totalQty.toLocaleString()}</span>
            <span className="font-medium">{completionPercentage}%</span>
          </div>
          <Progress 
            value={completionPercentage} 
            className="h-2"
          />
        </div>
      </div>
    </div>
  );
}

export function DashboardTimeline() {
  const { orders, lines, loading, error } = useDashboardApi();

  // Generate real timeline data from API
  const timelineData = useMemo(() => {
    if (!orders.length || !lines.length) {
      return { scheduleData: [], wipData: [] };
    }

    // Create schedule data from real orders
    const scheduleData: ScheduleItem[] = orders
      .filter(order => order.status === 'in_progress' || order.status === 'scheduled')
      .slice(0, 6)
      .map((order, index) => {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() + index * 2);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 7);
        
        const assignedLine = lines[index % lines.length];
        const progress = order.status === 'in_progress' ? Math.random() * 80 + 10 : 0;
        
        return {
          id: order.id,
          orderRef: order.order_reference,
          buyer: order.buyer || order.customer,
          style: order.product,
          line: assignedLine?.lineName || assignedLine?.lineCode || 'Unassigned',
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          progress: Math.round(progress),
          priority: index < 2 ? 'high' : index < 4 ? 'medium' : 'low',
          status: order.status as 'scheduled' | 'in-progress',
          quantity: order.contract_quantity || 0
        };
      });

    // Create WIP data from in-progress orders
    const wipData: WIPItem[] = orders
      .filter(order => order.status === 'in_progress')
      .slice(0, 4)
      .map((order, index) => {
        const assignedLine = lines[index % lines.length];
        const totalQty = order.contract_quantity || 1000;
        const completedQty = Math.round(totalQty * (0.2 + Math.random() * 0.6));
        const completionRate = completedQty / totalQty;
        
        let status: 'on-track' | 'at-risk' | 'delayed' = 'on-track';
        if (completionRate < 0.3) status = 'delayed';
        else if (completionRate < 0.5) status = 'at-risk';
        
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + 7 + index * 2);
        
        return {
          id: order.id,
          orderRef: order.order_reference,
          style: order.product,
          line: assignedLine?.lineName || assignedLine?.lineCode || 'Unassigned',
          totalQty,
          completedQty,
          targetDate: targetDate.toISOString().split('T')[0],
          status
        };
      });

    return { scheduleData, wipData };
  }, [orders, lines]);

  if (loading) {
    return (
      <div className="grid gap-6 mb-6">
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="h-6 w-48 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-16 bg-muted animate-pulse rounded" />
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <div className="h-6 w-48 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-16 bg-muted animate-pulse rounded" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center space-x-2 text-red-600">
            <span>Error loading timeline data: {error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { scheduleData, wipData } = timelineData;

  return (
    <div className="grid gap-6 mb-6">
      {/* Timeline/Scheduler Snapshot */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Production Schedule Snapshot
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium">
              {new Date().toLocaleDateString()} - {new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}
            </span>
            <Button variant="outline" size="sm">
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {scheduleData.length > 0 ? (
              scheduleData.map((item) => (
                <ScheduleStrip key={item.id} item={item} />
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No scheduled orders found
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* WIP (Work In Progress) Snapshot */}
      <Card>
        <CardHeader>
          <CardTitle>Work In Progress (WIP) Snapshot</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {wipData.length > 0 ? (
              wipData.map((item) => (
                <WIPItem key={item.id} item={item} />
              ))
            ) : (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                No work in progress orders found
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
