'use client';

import * as React from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Archive, CalendarIcon, ChevronLeft, ChevronRight, Package, GripVertical, Edit3, SaveAll, Trash2, RotateCcw, ListChecks, ChevronDown } from 'lucide-react';
import { addDays, format, eachDayOfInterval, parseISO, differenceInDays } from 'date-fns';
import type { SchedulableResource, VerticalTask, VerticalTaskDailyData, UnscheduledOrder as PlanViewUnscheduledOrder, Task } from '@/components/plan-view/types';
import { calculateDailyProduction } from '@/lib/learningCurve';
import { mockLearningCurves } from '@/lib/learningCurveTypes';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import type { VariantProps } from 'class-variance-authority';
import { badgeVariants } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { mockLinesData, type MockLine } from '@/lib/mockData';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
  loadPlan as loadPlanFromStore,
  getAvailablePlans as getAvailablePlansFromStore,
  savePlan as savePlanToStore,
  renamePlanInStore,
  deletePlanFromStore,
  generatePlanId as generateNewPlanId,
  DEFAULT_PLAN_ID as BUCKET_DEFAULT_PLAN_ID, // Using the specific default for bucket
  DEFAULT_PLAN_NAME as BUCKET_DEFAULT_PLAN_NAME,
  type PlanData as BucketPlanData,
  type PlanInfo as BucketPlanInfo,
} from '@/lib/planStore';

const LOCALSTORAGE_KEY_ACTIVE_BUCKET_PLAN_ID = 'trackTechActiveBucketPlanId_v1';

const initialResources: SchedulableResource[] = mockLinesData.map((line: MockLine) => ({
  id: line.id,
  name: line.lineName,
  capacity: line.capacity || 0,
}));

// Updated mock orders for Bucket Planning
const initialBaseOrdersRaw: { 
  id: string; 
  orderNameBase: string; 
  style: string; 
  productType: string;
  quantity: number; 
  requestedShipDate: string; 
  imageHint: string; 
  learningCurveId: string; 
  preferredStartDate: string; 
  buyer: string; 
  reason: string; 
}[] = [
  { id: 'BUCKET-ORD-001', orderNameBase: 'Nike Basic Tee Run', style: 'Men\'s Basic Crew Neck T-Shirt', productType: 'Tops', quantity: 2500, requestedShipDate: format(addDays(new Date(), 28), 'yyyy-MM-dd'), imageHint: 'tshirt apparel', learningCurveId: 'lc-simple-tee', preferredStartDate: format(addDays(new Date(), 3), 'yyyy-MM-dd'), buyer: 'Nike Apparel', reason: 'Q3 Replenishment' },
  { id: 'BUCKET-ORD-002', orderNameBase: 'Adidas Jacket Order', style: 'Women\'s Waxed Cotton Jacket', productType: 'Outerwear', quantity: 500, requestedShipDate: format(addDays(new Date(), 55), 'yyyy-MM-dd'), imageHint: 'jacket fashion', learningCurveId: 'lc-complex-jacket', preferredStartDate: format(addDays(new Date(), 8), 'yyyy-MM-dd'), buyer: 'Adidas Group', reason: 'New Collection Launch' },
  { id: 'BUCKET-ORD-003', orderNameBase: 'Zara Polo Bulk', style: 'Men\'s Pique Polo Shirt', productType: 'Tops', quantity: 8000, requestedShipDate: format(addDays(new Date(), 40), 'yyyy-MM-dd'), imageHint: 'polo shirt', learningCurveId: 'lc-standard-polo', preferredStartDate: format(addDays(new Date(), 5), 'yyyy-MM-dd'), buyer: 'Zara (Inditex)', reason: 'High Volume Stock' },
  { id: 'BUCKET-ORD-004', orderNameBase: 'H&M Cap Promo', style: 'Unisex Baseball Cap', productType: 'Accessories', quantity: 1200, requestedShipDate: format(addDays(new Date(), 18), 'yyyy-MM-dd'), imageHint: 'cap headwear', learningCurveId: 'lc-very-fast', preferredStartDate: format(addDays(new Date(), 1), 'yyyy-MM-dd'), buyer: 'H&M Group', reason: 'Promotional Campaign' },
  { id: 'BUCKET-ORD-005', orderNameBase: 'Nike Maxi Dress', style: 'Women\'s Floral Maxi Dress', productType: 'Dresses', quantity: 900, requestedShipDate: format(addDays(new Date(), 33), 'yyyy-MM-dd'), imageHint: 'dress floral', learningCurveId: 'lc-moderate-dress', preferredStartDate: format(addDays(new Date(), 6), 'yyyy-MM-dd'), buyer: 'Nike Apparel', reason: 'Summer Collection' },
];


const mapRawOrdersToUnscheduled = (rawOrders: typeof initialBaseOrdersRaw): PlanViewUnscheduledOrder[] => {
  return rawOrders.map(ro => ({
    id: ro.id,
    buyer: ro.buyer,
    style: ro.style,
    productType: ro.productType,
    quantity: ro.quantity,
    requestedShipDate: ro.requestedShipDate,
    reason: ro.reason,
    learningCurveId: ro.learningCurveId,
    imageHint: ro.imageHint,
  }));
};

function generateVerticalTaskDailyDataWithOverflow(
  startDateStr: string,
  maxEndDateStr: string,
  styleCode: string,
  quantityToPlan: number,
  learningCurveId?: string,
  resourceDailyCapacity?: number 
): { dailyPlanSegment: VerticalTaskDailyData[], remainingQuantity: number, actualEndDateStr: string } {

  const start = parseISO(startDateStr);
  const maxEnd = parseISO(maxEndDateStr);
  const maxDuration = Math.max(1, differenceInDays(maxEnd, start) + 1);

  const learningCurve = learningCurveId ? mockLearningCurves.find(lc => lc.id === learningCurveId) : undefined;

  let potentialDailyProductionPlan: { date: string, capacity: number, efficiency: number }[];
  if (learningCurve && learningCurve.smv > 0) {
    potentialDailyProductionPlan = calculateDailyProduction(
      learningCurve.points,
      learningCurve.smv,
      learningCurve.workingMinutesPerDay,
      learningCurve.operatorsCount,
      maxDuration,
      start
    );
  } else {
    const defaultDailyProd = resourceDailyCapacity || quantityToPlan;
    const avgQtyPerDay = maxDuration > 0
        ? Math.min(defaultDailyProd, Math.max(1, Math.round(quantityToPlan / maxDuration)), quantityToPlan)
        : Math.min(defaultDailyProd, quantityToPlan);

    potentialDailyProductionPlan = eachDayOfInterval({start, end: maxEnd}).map(d => ({
      date: format(d, 'yyyy-MM-dd'),
      capacity: Math.round(avgQtyPerDay),
      efficiency: 100
    }));
  }

  const dailyPlanSegment: VerticalTaskDailyData[] = [];
  let cumulativeQtyPlannedInSegment = 0;
  let lastDatePlanned = startDateStr;

  for (let i = 0; i < potentialDailyProductionPlan.length; i++) {
    if (cumulativeQtyPlannedInSegment >= quantityToPlan) break;

    const dayPotential = potentialDailyProductionPlan[i];
    const qtyForThisDayFromLC = dayPotential.capacity;

    const qtyCapByResource = resourceDailyCapacity !== undefined 
                                      ? Math.min(qtyForThisDayFromLC, resourceDailyCapacity)
                                      : qtyForThisDayFromLC;

    const qtyToPlanForOrderThisDay = Math.min(qtyCapByResource, quantityToPlan - cumulativeQtyPlannedInSegment);

    if (qtyToPlanForOrderThisDay <= 0) {
      if (cumulativeQtyPlannedInSegment < quantityToPlan && dailyPlanSegment.length > 0) {
      } else if (dailyPlanSegment.length === 0) {
        lastDatePlanned = dayPotential.date;
      }
      if (cumulativeQtyPlannedInSegment >= quantityToPlan) break;
      continue;
    }

    cumulativeQtyPlannedInSegment += qtyToPlanForOrderThisDay;

    dailyPlanSegment.push({
      date: dayPotential.date,
      styleCode: styleCode,
      plannedQty: qtyToPlanForOrderThisDay,
      efficiency: dayPotential.efficiency,
      cumulativeQty: cumulativeQtyPlannedInSegment,
    });
    lastDatePlanned = dayPotential.date;

    if (cumulativeQtyPlannedInSegment >= quantityToPlan) break;
  }

  const remainingQuantity = quantityToPlan - cumulativeQtyPlannedInSegment;

  return {
    dailyPlanSegment,
    remainingQuantity: Math.max(0, remainingQuantity),
    actualEndDateStr: dailyPlanSegment.length > 0 ? lastDatePlanned : startDateStr
  };
}

interface BucketPlanningRow {
  date: string;
  resourceId: string; 
  resourceName: string; 
  totalCapacity: number;
  bookedOrders: Array<{ orderId: string; style: string; qtyPlannedOnThisDay: number, originalResourceId?: string }>; 
  totalQtyPlanned: number;
  balanceCapacity: number;
  status: 'Open' | 'Partially Booked' | 'Full' | 'Overbooked';
}

type StatusBadgeVariant = VariantProps<typeof badgeVariants>['variant'];

const getStatusBadgeVariant = (status: BucketPlanningRow['status']): StatusBadgeVariant => {
  switch (status) {
    case 'Open': return 'secondary';
    case 'Partially Booked': return 'default';
    case 'Full': return 'default';
    case 'Overbooked': return 'destructive';
    default: return 'outline';
  }
};

// Helper functions to convert between Task and VerticalTask
function convertTaskToVerticalTask(task: Task): VerticalTask {
  return {
    ...task,
    orderName: task.label, // Use label as orderName
    dailyData: task.dailyProductionPlan?.map(dp => ({
      date: dp.date,
      styleCode: task.originalOrderDetails?.style || 'Unknown',
      plannedQty: dp.capacity,
      efficiency: dp.efficiency,
      cumulativeQty: 0 // Will be calculated if needed
    })) || []
  };
}

function convertVerticalTaskToTask(verticalTask: VerticalTask): Task {
  return {
    ...verticalTask,
    label: verticalTask.orderName,
    dailyProductionPlan: verticalTask.dailyData.map(dd => ({
      date: dd.date,
      capacity: dd.plannedQty,
      efficiency: dd.efficiency || 1.0
    }))
  };
}

export default function BucketPlanningPage() {
  const { toast } = useToast();
  const [currentStartDate, setCurrentStartDate] = React.useState<Date>(new Date());
  const [numDaysToShow, setNumDaysToShow] = React.useState<number>(7);
  const [resources, setResources] = React.useState<SchedulableResource[]>(initialResources); 
  const [scheduledTasks, setScheduledTasks] = React.useState<VerticalTask[]>([]);
  const [unscheduledOrders, setUnscheduledOrders] = React.useState<PlanViewUnscheduledOrder[]>(mapRawOrdersToUnscheduled(initialBaseOrdersRaw));

  const [activePlanId, setActivePlanId] = React.useState<string>(BUCKET_DEFAULT_PLAN_ID);
  const [activePlanName, setActivePlanName] = React.useState<string>(BUCKET_DEFAULT_PLAN_NAME);
  const [availablePlans, setAvailablePlans] = React.useState<BucketPlanInfo[]>([]);

  React.useEffect(() => {
    const storedPlans = getAvailablePlansFromStore();
    setAvailablePlans(storedPlans.length > 0 ? storedPlans : [{id: BUCKET_DEFAULT_PLAN_ID, name: BUCKET_DEFAULT_PLAN_NAME}]);
    const storedActiveId = localStorage.getItem(LOCALSTORAGE_KEY_ACTIVE_BUCKET_PLAN_ID) || BUCKET_DEFAULT_PLAN_ID;
    
    const planData = loadPlanFromStore(storedActiveId);
    const planInfo = storedPlans.find(p => p.id === storedActiveId);

    if (planData) {
      // Convert Task[] to VerticalTask[] when loading
      setScheduledTasks((planData.bucketScheduledTasks || []).map(convertTaskToVerticalTask));
      setUnscheduledOrders(planData.bucketUnscheduledOrders && planData.bucketUnscheduledOrders.length > 0 ? planData.bucketUnscheduledOrders : mapRawOrdersToUnscheduled(initialBaseOrdersRaw));
      setActivePlanId(planInfo?.id || BUCKET_DEFAULT_PLAN_ID);
      setActivePlanName(planInfo?.name || BUCKET_DEFAULT_PLAN_NAME);
    } else {
      setScheduledTasks([]);
      setUnscheduledOrders(mapRawOrdersToUnscheduled(initialBaseOrdersRaw));
      setActivePlanId(BUCKET_DEFAULT_PLAN_ID);
      setActivePlanName(BUCKET_DEFAULT_PLAN_NAME);
      if (storedActiveId !== BUCKET_DEFAULT_PLAN_ID) {
         localStorage.setItem(LOCALSTORAGE_KEY_ACTIVE_BUCKET_PLAN_ID, BUCKET_DEFAULT_PLAN_ID);
      }
    }
  }, []);

  React.useEffect(() => {
    localStorage.setItem(LOCALSTORAGE_KEY_ACTIVE_BUCKET_PLAN_ID, activePlanId);
  }, [activePlanId]);

  const refreshAvailablePlans = () => setAvailablePlans(getAvailablePlansFromStore());

  const handleSavePlan = () => {
    const planDataToSave: BucketPlanData = {
      horizontalTasks: [], 
      verticalTasks: [],   
      bucketScheduledTasks: scheduledTasks.map(convertVerticalTaskToTask), // Convert VerticalTask[] to Task[]
      bucketUnscheduledOrders: unscheduledOrders,
    };
    savePlanToStore(activePlanId, activePlanName, planDataToSave);
    refreshAvailablePlans();
    toast({ title: "Bucket Plan Saved", description: `Plan "${activePlanName}" saved.` });
  };

  const handleSavePlanAs = () => {
    const newName = prompt("Enter name for the new bucket plan:");
    if (newName && newName.trim() !== "") {
      const newPlanId = generateNewPlanId();
      const planDataToSave: BucketPlanData = {
        horizontalTasks: [], verticalTasks: [],
        bucketScheduledTasks: scheduledTasks.map(convertVerticalTaskToTask), // Convert VerticalTask[] to Task[]
        bucketUnscheduledOrders: unscheduledOrders,
      };
      const savedInfo = savePlanToStore(newPlanId, newName.trim(), planDataToSave);
      if (savedInfo) {
        setActivePlanId(savedInfo.id);
        setActivePlanName(savedInfo.name);
      }
      refreshAvailablePlans();
      toast({ title: "Bucket Plan Saved As", description: `Plan saved as "${newName.trim()}".` });
    }
  };
  
  const handleLoadPlan = (planIdToLoad: string) => {
    const planData = loadPlanFromStore(planIdToLoad);
    const planInfo = availablePlans.find(p => p.id === planIdToLoad);
    if (planData && planInfo) {
      // Convert Task[] to VerticalTask[] when loading
      setScheduledTasks((planData.bucketScheduledTasks || []).map(convertTaskToVerticalTask));
      setUnscheduledOrders(planData.bucketUnscheduledOrders && planData.bucketUnscheduledOrders.length > 0 ? planData.bucketUnscheduledOrders : mapRawOrdersToUnscheduled(initialBaseOrdersRaw));
      setActivePlanId(planInfo.id);
      setActivePlanName(planInfo.name);
      toast({ title: "Bucket Plan Loaded", description: `Plan "${planInfo.name}" loaded.` });
    } else {
      toast({ title: "Load Failed", description: "Could not load the selected bucket plan.", variant: "destructive" });
    }
  };

  const handleRenamePlan = () => {
    const currentPlan = availablePlans.find(p => p.id === activePlanId);
    const newName = prompt("Enter new plan name:", currentPlan?.name || "");
    if (newName && newName.trim() !== "") {
      if (renamePlanInStore(activePlanId, newName.trim())) {
        setActivePlanName(newName.trim());
        refreshAvailablePlans();
        toast({ title: "Plan Renamed", description: `Plan renamed to "${newName.trim()}".` });
      } else {
        toast({ title: "Rename Failed", variant: "destructive" });
      }
    }
  };
  
  const handleDeletePlan = () => {
    if (activePlanId === BUCKET_DEFAULT_PLAN_ID) {
      toast({ title: "Cannot Delete", description: "Default plan cannot be deleted.", variant: "destructive" });
      return;
    }
    if (confirm(`Are you sure you want to delete plan "${activePlanName}"? This cannot be undone.`)) {
      if (deletePlanFromStore(activePlanId)) {
        toast({ title: "Plan Deleted", variant: "destructive" });
        handleLoadPlan(BUCKET_DEFAULT_PLAN_ID); 
        refreshAvailablePlans();
      } else {
        toast({ title: "Delete Failed", variant: "destructive" });
      }
    }
  };

  const handleClearSchedule = () => {
    setScheduledTasks([]);
    setUnscheduledOrders(mapRawOrdersToUnscheduled(initialBaseOrdersRaw));
    toast({ title: 'Schedule Cleared', description: 'All tasks removed from buckets, unscheduled orders reset.' });
  };

  const displayedDates = React.useMemo(() => {
    return eachDayOfInterval({ start: currentStartDate, end: addDays(currentStartDate, numDaysToShow - 1) });
  }, [currentStartDate, numDaysToShow]);

  const bucketData = React.useMemo(() => {
    const data: BucketPlanningRow[] = [];
    displayedDates.forEach(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      resources.forEach(resource => { 
        const tasksOnThisResourceForThisDate = scheduledTasks.filter(
          task => task.resourceId === resource.id && task.dailyData.some(d => d.date === dateStr) 
        );

        let totalQtyPlannedOnThisDay = 0;
        const bookedOrdersDetails: BucketPlanningRow['bookedOrders'] = [];

        tasksOnThisResourceForThisDate.forEach(task => {
          const dailyDetail = task.dailyData.find(d => d.date === dateStr);
          if (dailyDetail && dailyDetail.plannedQty > 0) {
            totalQtyPlannedOnThisDay += dailyDetail.plannedQty;
            bookedOrdersDetails.push({
              orderId: task.id,
              style: task.originalOrderDetails?.style || task.orderName,
              qtyPlannedOnThisDay: dailyDetail.plannedQty,
              originalResourceId: task.originalOrderDetails?.id.startsWith(resource.id) ? undefined : task.originalOrderDetails?.id 
            });
          }
        });

        const balanceCapacity = resource.capacity - totalQtyPlannedOnThisDay;
        let status: BucketPlanningRow['status'] = 'Open';
        if (totalQtyPlannedOnThisDay > 0) {
          if (totalQtyPlannedOnThisDay >= resource.capacity) {
            status = totalQtyPlannedOnThisDay > resource.capacity ? 'Overbooked' : 'Full';
          } else {
            status = 'Partially Booked';
          }
        }

        data.push({
          date: dateStr,
          resourceId: resource.id, 
          resourceName: resource.name, 
          totalCapacity: resource.capacity,
          bookedOrders: bookedOrdersDetails,
          totalQtyPlanned: totalQtyPlannedOnThisDay,
          balanceCapacity: balanceCapacity,
          status: status,
        });
      });
    });
    return data;
  }, [displayedDates, resources, scheduledTasks]); 

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setCurrentStartDate(date);
    }
  };

  const handlePrevDays = () => {
    setCurrentStartDate(prev => addDays(prev, -numDaysToShow));
  };
  const handleNextDays = () => {
    setCurrentStartDate(prev => addDays(prev, numDaysToShow));
  };

  const handleDragStart = (event: React.DragEvent<HTMLDivElement>, order: PlanViewUnscheduledOrder) => {
    event.dataTransfer.setData('application/json', JSON.stringify(order));
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (event: React.DragEvent<HTMLTableCellElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    event.currentTarget.classList.add('bg-primary/20');
  };

  const handleDragLeave = (event: React.DragEvent<HTMLTableCellElement>) => {
    event.currentTarget.classList.remove('bg-primary/20');
  };

  const handleDrop = (event: React.DragEvent<HTMLTableCellElement>, targetDate: string, targetResourceId: string) => { 
    event.preventDefault();
    event.currentTarget.classList.remove('bg-primary/20');
    const draggedOrderData = event.dataTransfer.getData('application/json');
    if (!draggedOrderData) return;

    const draggedOrder: PlanViewUnscheduledOrder = JSON.parse(draggedOrderData);
    const targetResource = resources.find(r => r.id === targetResourceId); 
    if (!targetResource) {
      toast({ title: "Error", description: "Target resource not found.", variant: "destructive" }); 
      return;
    }

    const MAX_SEGMENT_DAYS_LOOKAHEAD = 30;
    const maxEndDateForSegment = format(addDays(parseISO(targetDate), MAX_SEGMENT_DAYS_LOOKAHEAD - 1), 'yyyy-MM-dd');

    const { dailyPlanSegment, remainingQuantity, actualEndDateStr } =
      generateVerticalTaskDailyDataWithOverflow(
        targetDate,
        maxEndDateForSegment,
        draggedOrder.style,
        draggedOrder.quantity,
        draggedOrder.learningCurveId,
        targetResource.capacity 
      );

    if (dailyPlanSegment.length === 0) {
      toast({ title: "Scheduling Failed", description: `Could not schedule any quantity for ${draggedOrder.id} on ${targetResource.name} starting ${targetDate}. Resource might be at full capacity or dates are problematic.`, variant: "destructive" });
      return;
    }

    const quantityPlannedInThisSegment = dailyPlanSegment.reduce((sum, day) => sum + day.plannedQty, 0);

    const newScheduledTask: VerticalTask = {
      id: `${draggedOrder.id}-sch-${Date.now()}`,
      resourceId: targetResource.id, 
      orderName: `${draggedOrder.style} [${quantityPlannedInThisSegment}] (Dragged)`,
      imageHint: draggedOrder.imageHint || 'apparel manufacturing',
      startDate: targetDate,
      endDate: actualEndDateStr,
      dailyData: dailyPlanSegment,
      color: 'bg-accent text-accent-foreground', 
      displayColor: 'bg-accent text-accent-foreground', 
      originalOrderDetails: { ...draggedOrder, quantity: quantityPlannedInThisSegment },
      learningCurveId: draggedOrder.learningCurveId,
    };

    setScheduledTasks(prev => [...prev, newScheduledTask]);

    if (remainingQuantity > 0) {
      setUnscheduledOrders(prev =>
        prev.map(o =>
          o.id === draggedOrder.id ? { ...o, quantity: remainingQuantity, reason: `Partial - ${quantityPlannedInThisSegment} on ${targetResource.name}` } : o
        ).filter(o => o.quantity > 0)
      );
      toast({ title: "Partially Scheduled", description: `${quantityPlannedInThisSegment} units of ${draggedOrder.id} scheduled. ${remainingQuantity} units remain unscheduled.` });
    } else {
      setUnscheduledOrders(prev => prev.filter(o => o.id !== draggedOrder.id));
      toast({ title: "Order Scheduled", description: `${draggedOrder.id} successfully scheduled.` });
    }
  };

  return (
    <>
      <PageHeader
        title="Bucket Planning"
        description="Visualize daily resource capacity allocation and booking status. Drag unscheduled orders to buckets."
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 shadow-lg">
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle className="flex items-center text-xl font-semibold">
                  <Archive className="mr-2 h-6 w-6 text-primary" />
                  Daily Resource Capacity Buckets
                </CardTitle>
                <CardDescription className="text-sm text-muted-foreground">
                   Plan: <span className="font-semibold">{activePlanName}</span>. Overview of capacities, booked orders, and balance.
                </CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                 <Select value={activePlanId} onValueChange={handleLoadPlan}>
                    <SelectTrigger className="h-9 w-full sm:w-[150px] text-xs">
                        <SelectValue placeholder="Select Plan" />
                    </SelectTrigger>
                    <SelectContent>
                        {availablePlans.map(plan => (
                        <SelectItem key={plan.id} value={plan.id}>{plan.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="h-9 w-full sm:w-auto">
                        <ListChecks className="mr-2 h-4 w-4" /> Plan Actions <ChevronDown className="ml-1 h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="shadow-lg rounded-md">
                        <DropdownMenuItem onSelect={handleSavePlan}><Archive className="mr-2 h-4 w-4" />Save Current Plan</DropdownMenuItem>
                        <DropdownMenuItem onSelect={handleSavePlanAs}><SaveAll className="mr-2 h-4 w-4" />Save Plan As...</DropdownMenuItem>
                        <DropdownMenuItem onSelect={handleRenamePlan}><Edit3 className="mr-2 h-4 w-4" />Rename Current Plan</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onSelect={handleDeletePlan} className="text-destructive focus:text-destructive cursor-pointer" disabled={activePlanId === BUCKET_DEFAULT_PLAN_ID}>
                          <Trash2 className="mr-2 h-4 w-4" />Delete Current Plan
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                 <Button variant="outline" size="sm" className="h-9 w-full sm:w-auto" onClick={handleClearSchedule}>
                    <RotateCcw className="mr-2 h-4 w-4" /> Clear Schedule
                </Button>
              </div>
            </div>
            <div className="mt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button variant="outline" size="icon" onClick={handlePrevDays} aria-label="Previous period">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={'outline'}
                      className={cn('w-full sm:w-[200px] h-9 justify-start text-left font-normal', !currentStartDate && 'text-muted-foreground')}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {currentStartDate ? format(currentStartDate, 'PPP') : <span>Pick a start date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={currentStartDate} onSelect={handleDateChange} initialFocus />
                  </PopoverContent>
                </Popover>
                <Button variant="outline" size="icon" onClick={handleNextDays} aria-label="Next period">
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Select value={numDaysToShow.toString()} onValueChange={(val) => setNumDaysToShow(parseInt(val))}>
                  <SelectTrigger className="w-full sm:w-[100px] h-9 text-xs">
                    <SelectValue placeholder="Show days" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 Days</SelectItem>
                    <SelectItem value="14">14 Days</SelectItem>
                    <SelectItem value="30">30 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px] sticky left-0 bg-card z-10 px-4 py-3">Date</TableHead>
                    <TableHead className="w-[150px] px-4 py-3">Resource</TableHead> 
                    <TableHead className="text-right px-4 py-3">Daily Cap. (pcs)</TableHead>
                    <TableHead className="px-4 py-3">Booked Task Part(s)</TableHead>
                    <TableHead className="px-4 py-3">Original Style(s)</TableHead>
                    <TableHead className="text-right px-4 py-3">Total Planned (pcs)</TableHead>
                    <TableHead className="text-right px-4 py-3">Balance Cap. (pcs)</TableHead>
                    <TableHead className="text-center px-4 py-3">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bucketData.length > 0 ? bucketData.map((row, index) => (
                    <TableRow key={`${row.date}-${row.resourceId}`} className="odd:bg-muted/50"> 
                      {index % resources.length === 0 && (
                         <TableCell rowSpan={resources.length} className="font-medium align-top sticky left-0 bg-card z-10 border-r px-4 py-3">
                          {format(parseISO(row.date), 'EEE, MMM dd')}
                         </TableCell>
                      )}
                      <TableCell className="px-4 py-3">{row.resourceName}</TableCell> 
                      <TableCell className="text-right px-4 py-3">{row.totalCapacity.toLocaleString()}</TableCell>
                      <TableCell
                        className="max-w-[200px] truncate px-4 py-3"
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, row.date, row.resourceId)} 
                      >
                        {row.bookedOrders.map(bo => bo.orderId).join(', ') || <span className="text-muted-foreground">- Drop Here -</span>}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate px-4 py-3">
                        {row.bookedOrders.map(bo => bo.style).join(', ') || '-'}
                      </TableCell>
                      <TableCell className="text-right px-4 py-3">{row.totalQtyPlanned.toLocaleString()}</TableCell>
                      <TableCell className={cn("text-right px-4 py-3", row.balanceCapacity < 0 ? "text-destructive font-semibold" : "")}>
                        {row.balanceCapacity.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-center px-4 py-3">
                        <Badge variant={getStatusBadgeVariant(row.status)}>{row.status}</Badge>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={8} className="h-24 text-center text-muted-foreground px-4 py-3">
                        No data available for the selected period.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg lg:col-span-1">
            <CardHeader  className="px-6 py-4">
                <CardTitle className="flex items-center text-xl font-semibold">
                    <Package className="mr-2 h-6 w-6 text-primary" /> Unscheduled Orders
                </CardTitle>
                <CardDescription className="text-sm text-muted-foreground">Drag these orders onto the bucket plan.</CardDescription>
            </CardHeader>
            <CardContent className="max-h-[600px] overflow-y-auto p-4">
                {unscheduledOrders.length > 0 ? (
                    <div className="space-y-3">
                        {unscheduledOrders.map(order => (
                            <div
                                key={order.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, order)}
                                className="p-3 border rounded-md shadow-sm cursor-grab bg-card hover:shadow-md active:shadow-lg active:bg-muted/50 flex items-start gap-2"
                            >
                                <GripVertical className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-semibold text-sm">{order.id} - {order.style}</p>
                                    <p className="text-xs text-muted-foreground">Qty: {order.quantity.toLocaleString()}, Ship: {format(parseISO(order.requestedShipDate), 'MMM dd')}</p>
                                    <p className="text-xs text-muted-foreground">Reason: {order.reason}</p>
                                    {order.learningCurveId && <Badge variant="outline" className="mt-1 text-xs">LC: {mockLearningCurves.find(lc=>lc.id === order.learningCurveId)?.name || order.learningCurveId}</Badge>}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-10 text-muted-foreground">
                        <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>All orders are scheduled!</p>
                    </div>
                )}
            </CardContent>
        </Card>
      </div>

      <Card className="mt-6 shadow-lg rounded-lg">
        <CardHeader className="px-6 py-4">
            <CardTitle className="text-lg font-semibold">Legend & Tips</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-6">
            <div className="flex flex-wrap gap-x-6 gap-y-2 items-center">
                <div className="flex items-center gap-2"><Badge variant="secondary">Open</Badge><span>Resource has full capacity.</span></div>
                <div className="flex items-center gap-2"><Badge variant="default">Partially Booked</Badge><span>Some capacity used.</span></div>
                <div className="flex items-center gap-2"><Badge variant={getStatusBadgeVariant('Full')}>Full</Badge><span>Capacity fully utilized.</span></div>
                <div className="flex items-center gap-2"><Badge variant="destructive">Overbooked</Badge><span className="text-destructive">Demand exceeds capacity!</span></div>
            </div>
             <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
              <li>Drag orders from "Unscheduled Orders" and drop them onto a resource's cell for a specific date.</li>
              <li>Orders are planned considering quantity, learning curve, and resource daily capacity.</li>
              <li>If an order cannot be fully scheduled, remaining quantity updates in the unscheduled list.</li>
            </ul>
        </CardContent>
       </Card>
    </>
  );
}
