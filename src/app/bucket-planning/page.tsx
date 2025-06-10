'use client';

import * as React from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Archive, CalendarIcon, ChevronLeft, ChevronRight, Package, GripVertical, Edit3, SaveAll, Trash2, RotateCcw, ListChecks, ChevronDown, Factory, Users, Target, TrendingUp, AlertTriangle, CheckCircle, Clock, Layers, Filter } from 'lucide-react';
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

// Enhanced mock orders with grouping and priority data for better bucket planning
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
  priority: 'high' | 'medium' | 'low';
  complexity: 'simple' | 'medium' | 'complex';
  groupCategory: 'volume' | 'specialty' | 'finishing' | 'assembly';
  estimatedHours: number;
  requirements: string[];
}[] = [
  { 
    id: 'BUCKET-ORD-001', 
    orderNameBase: 'Nike Basic Tee Run', 
    style: 'Men\'s Basic Crew Neck T-Shirt', 
    productType: 'Tops', 
    quantity: 2500, 
    requestedShipDate: format(addDays(new Date(), 28), 'yyyy-MM-dd'), 
    imageHint: 'tshirt apparel', 
    learningCurveId: 'lc-simple-tee', 
    preferredStartDate: format(addDays(new Date(), 3), 'yyyy-MM-dd'), 
    buyer: 'Nike Apparel', 
    reason: 'Q3 Replenishment',
    priority: 'high',
    complexity: 'simple',
    groupCategory: 'volume',
    estimatedHours: 180,
    requirements: ['Cotton fabric', 'Screen printing', 'Standard packaging']
  },
  { 
    id: 'BUCKET-ORD-002', 
    orderNameBase: 'Adidas Jacket Order', 
    style: 'Women\'s Waxed Cotton Jacket', 
    productType: 'Outerwear', 
    quantity: 500, 
    requestedShipDate: format(addDays(new Date(), 55), 'yyyy-MM-dd'), 
    imageHint: 'jacket fashion', 
    learningCurveId: 'lc-complex-jacket', 
    preferredStartDate: format(addDays(new Date(), 8), 'yyyy-MM-dd'), 
    buyer: 'Adidas Group', 
    reason: 'New Collection Launch',
    priority: 'medium',
    complexity: 'complex',
    groupCategory: 'specialty',
    estimatedHours: 320,
    requirements: ['Waxed cotton', 'Waterproof zippers', 'Custom labels']
  },
  { 
    id: 'BUCKET-ORD-003', 
    orderNameBase: 'Zara Polo Bulk', 
    style: 'Men\'s Pique Polo Shirt', 
    productType: 'Tops', 
    quantity: 8000, 
    requestedShipDate: format(addDays(new Date(), 40), 'yyyy-MM-dd'), 
    imageHint: 'polo shirt', 
    learningCurveId: 'lc-standard-polo', 
    preferredStartDate: format(addDays(new Date(), 5), 'yyyy-MM-dd'), 
    buyer: 'Zara (Inditex)', 
    reason: 'High Volume Stock',
    priority: 'high',
    complexity: 'medium',
    groupCategory: 'volume',
    estimatedHours: 240,
    requirements: ['Pique cotton', 'Embroidered logo', 'Bulk packaging']
  },
  { 
    id: 'BUCKET-ORD-004', 
    orderNameBase: 'H&M Cap Promo', 
    style: 'Unisex Baseball Cap', 
    productType: 'Accessories', 
    quantity: 1200, 
    requestedShipDate: format(addDays(new Date(), 18), 'yyyy-MM-dd'), 
    imageHint: 'cap headwear', 
    learningCurveId: 'lc-very-fast', 
    preferredStartDate: format(addDays(new Date(), 1), 'yyyy-MM-dd'), 
    buyer: 'H&M Group', 
    reason: 'Promotional Campaign',
    priority: 'medium',
    complexity: 'simple',
    groupCategory: 'assembly',
    estimatedHours: 96,
    requirements: ['Cotton twill', 'Adjustable strap', 'Embroidered logo']
  },
  { 
    id: 'BUCKET-ORD-005', 
    orderNameBase: 'Nike Maxi Dress', 
    style: 'Women\'s Floral Maxi Dress', 
    productType: 'Dresses', 
    quantity: 900, 
    requestedShipDate: format(addDays(new Date(), 33), 'yyyy-MM-dd'), 
    imageHint: 'dress floral', 
    learningCurveId: 'lc-moderate-dress', 
    preferredStartDate: format(addDays(new Date(), 6), 'yyyy-MM-dd'), 
    buyer: 'Nike Apparel', 
    reason: 'Summer Collection',
    priority: 'low',
    complexity: 'medium',
    groupCategory: 'finishing',
    estimatedHours: 280,
    requirements: ['Floral print fabric', 'Elastic waistband', 'Quality finishing']
  },
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

// Enhanced helper functions for grouping and styling
const getEnhancedOrderData = (orderId: string) => {
  return initialBaseOrdersRaw.find(order => order.id === orderId);
};

const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
  switch (priority) {
    case 'high': return 'bg-red-100 text-red-800 border-red-200';
    case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'low': return 'bg-green-100 text-green-800 border-green-200';
  }
};

const getComplexityIcon = (complexity: 'simple' | 'medium' | 'complex') => {
  switch (complexity) {
    case 'simple': return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'medium': return <Clock className="h-4 w-4 text-yellow-500" />;
    case 'complex': return <AlertTriangle className="h-4 w-4 text-red-500" />;
  }
};

const getGroupIcon = (groupCategory: 'volume' | 'specialty' | 'finishing' | 'assembly') => {
  switch (groupCategory) {
    case 'volume': return <Factory className="h-4 w-4 text-blue-500" />;
    case 'specialty': return <Target className="h-4 w-4 text-purple-500" />;
    case 'finishing': return <Layers className="h-4 w-4 text-orange-500" />;
    case 'assembly': return <Users className="h-4 w-4 text-teal-500" />;
  }
};

const getGroupColor = (groupCategory: 'volume' | 'specialty' | 'finishing' | 'assembly') => {
  switch (groupCategory) {
    case 'volume': return 'border-l-blue-500 bg-blue-50/50';
    case 'specialty': return 'border-l-purple-500 bg-purple-50/50';
    case 'finishing': return 'border-l-orange-500 bg-orange-50/50';
    case 'assembly': return 'border-l-teal-500 bg-teal-50/50';
  }
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

  // Enhanced drag & drop state
  const [draggingOrderId, setDraggingOrderId] = React.useState<string | null>(null);
  const [dragOverCell, setDragOverCell] = React.useState<string | null>(null);
  
  // Group-wise filtering state
  const [groupFilters, setGroupFilters] = React.useState<{ [key: string]: boolean }>({
    'volume': true,
    'specialty': true,
    'finishing': true,
    'assembly': true,
  });
  const [expandedGroups, setExpandedGroups] = React.useState<{ [key: string]: boolean }>({
    'volume': true,
    'specialty': true,
    'finishing': true,
    'assembly': true,
  });

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

  // Group unscheduled orders by category
  const groupedUnscheduledOrders = React.useMemo(() => {
    const groups: { [key: string]: PlanViewUnscheduledOrder[] } = {
      volume: [],
      specialty: [],
      finishing: [],
      assembly: [],
    };

    unscheduledOrders.forEach(order => {
      const enhancedData = getEnhancedOrderData(order.id);
      if (enhancedData) {
        groups[enhancedData.groupCategory].push(order);
      }
    });

    return groups;
  }, [unscheduledOrders]); 

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
    setDraggingOrderId(order.id);
    
    // Add smooth animation effects
    const target = event.currentTarget;
    if (target) {
      target.style.transition = 'all 0.2s ease';
      target.style.transform = 'scale(0.95) rotate(2deg)';
      target.style.opacity = '0.8';
      target.style.zIndex = '1000';
    }
  };

  const handleDragEnd = (event: React.DragEvent<HTMLDivElement>) => {
    setDraggingOrderId(null);
    setDragOverCell(null);
    
    // Reset animation
    const target = event.currentTarget;
    if (target) {
      target.style.transform = '';
      target.style.opacity = '';
      target.style.zIndex = '';
      
      // Add bounce effect on successful drop
      setTimeout(() => {
        if (target) {
          target.style.transition = 'transform 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
          target.style.transform = 'scale(1.05)';
          setTimeout(() => {
            if (target) {
              target.style.transform = '';
            }
          }, 200);
        }
      }, 100);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLTableCellElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    const cellKey = `${event.currentTarget.dataset.date}-${event.currentTarget.dataset.resource}`;
    setDragOverCell(cellKey);
    
    // Enhanced visual feedback
    const target = event.currentTarget;
    if (target) {
      target.classList.add('bg-primary/20', 'border-primary/50', 'border-2', 'scale-105');
      target.style.transition = 'all 0.2s ease';
      target.style.boxShadow = '0 8px 25px rgba(59, 130, 246, 0.3)';
    }
  };

  const handleDragLeave = (event: React.DragEvent<HTMLTableCellElement>) => {
    setDragOverCell(null);
    const target = event.currentTarget;
    if (target) {
      target.classList.remove('bg-primary/20', 'border-primary/50', 'border-2', 'scale-105');
      target.style.boxShadow = '';
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLTableCellElement>, targetDate: string, targetResourceId: string) => { 
    event.preventDefault();
    setDragOverCell(null);
    
    const target = event.currentTarget;
    if (target) {
      target.classList.remove('bg-primary/20', 'border-primary/50', 'border-2', 'scale-105');
      target.style.boxShadow = '';
      
      // Add success animation
      target.style.transition = 'all 0.4s ease';
      target.style.background = 'rgba(34, 197, 94, 0.2)';
      setTimeout(() => {
        if (target) {
          target.style.background = '';
        }
      }, 800);
    }
    
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
        title="🪣 Bucket Planning - Manufacturing Control Center"
        description="Centralized control for all manufacturing factories and production lines. Each 'bucket' represents a container for unscheduled orders with visual capacity tracking - just like filling a physical bucket!"
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 shadow-lg">
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle className="flex items-center text-xl font-semibold">
                  <Archive className="mr-2 h-6 w-6 text-primary" />
                  Production Capacity Buckets
                </CardTitle>
                <CardDescription className="text-sm text-muted-foreground">
                   Plan: <span className="font-semibold">{activePlanName}</span>. Visual containers showing how 'full' each production line is - like water filling a bucket. Green = plenty of room, Red = overflowing!
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
                    <TableHead className="w-[200px] px-4 py-3">Production Line & Bucket Fill Level</TableHead> 
                    <TableHead className="text-right px-4 py-3">Bucket Capacity (pcs)</TableHead>
                    <TableHead className="px-4 py-3">Orders in Bucket</TableHead>
                    <TableHead className="px-4 py-3">Product Styles</TableHead>
                    <TableHead className="text-right px-4 py-3">Total Filled (pcs)</TableHead>
                    <TableHead className="text-right px-4 py-3">Space Remaining (pcs)</TableHead>
                    <TableHead className="text-center px-4 py-3">Bucket Status</TableHead>
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
                      <TableCell className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{row.resourceName}</span>
                          <div className="flex-1 min-w-[60px]">
                            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                              <div 
                                className={cn(
                                  "h-full rounded-full transition-all duration-300 animate-capacity-fill",
                                  row.totalQtyPlanned === 0 ? "bg-gray-300" :
                                  row.balanceCapacity < 0 ? "bg-gradient-to-r from-red-500 to-red-600" :
                                  (row.totalQtyPlanned / row.totalCapacity) >= 0.9 ? "bg-gradient-to-r from-yellow-500 to-orange-500" :
                                  (row.totalQtyPlanned / row.totalCapacity) >= 0.5 ? "bg-gradient-to-r from-blue-500 to-indigo-500" :
                                  "bg-gradient-to-r from-green-500 to-emerald-500"
                                )}
                                style={{ 
                                  width: `${Math.min(100, (row.totalQtyPlanned / row.totalCapacity) * 100)}%` 
                                }}
                              />
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground min-w-[35px] text-right">
                            {Math.round((row.totalQtyPlanned / row.totalCapacity) * 100)}%
                          </span>
                        </div>
                      </TableCell> 
                      <TableCell className="text-right px-4 py-3">{row.totalCapacity.toLocaleString()}</TableCell>
                      <TableCell
                        className={cn(
                          "max-w-[200px] truncate px-4 py-3 transition-all duration-200",
                          dragOverCell === `${row.date}-${row.resourceId}` ? "bg-primary/10 scale-102" : ""
                        )}
                        data-date={row.date}
                        data-resource={row.resourceId}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, row.date, row.resourceId)} 
                      >
                        {row.bookedOrders.map(bo => bo.orderId).join(', ') || <span className="text-muted-foreground">🪣 Drop orders into this bucket</span>}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate px-4 py-3">
                        {row.bookedOrders.map(bo => bo.style).join(', ') || '-'}
                      </TableCell>
                      <TableCell className="text-right px-4 py-3">{row.totalQtyPlanned.toLocaleString()}</TableCell>
                      <TableCell className={cn("text-right px-4 py-3", row.balanceCapacity < 0 ? "text-destructive font-semibold" : "")}>
                        {row.balanceCapacity.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-center px-4 py-3">
                        <Badge variant={getStatusBadgeVariant(row.status)}>
                          {row.status === 'Open' ? '🪣 Empty' : 
                           row.status === 'Partially Booked' ? '🪣 Filling' :
                           row.status === 'Full' ? '🪣 Full' :
                           row.status === 'Overbooked' ? '🪣 Overflow' : row.status}
                        </Badge>
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
          <CardHeader className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center text-xl font-semibold">
                  <Package className="mr-2 h-6 w-6 text-primary" /> 
                  Unscheduled Orders
                </CardTitle>
                <CardDescription className="text-sm text-muted-foreground">
                  🪣 Orders organized by production type. Drag them into the appropriate bucket containers above to schedule production.
                </CardDescription>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9">
                    <Filter className="mr-2 h-4 w-4" />
                    Filter
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {Object.entries(groupFilters).map(([group, enabled]) => (
                    <DropdownMenuItem
                      key={group}
                      onSelect={() => setGroupFilters(prev => ({ ...prev, [group]: !enabled }))}
                      className="flex items-center gap-2"
                    >
                      <input type="checkbox" checked={enabled} readOnly className="h-4 w-4" />
                      {group.charAt(0).toUpperCase() + group.slice(1)} Production
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent className="max-h-[700px] overflow-y-auto p-4">
            {Object.keys(groupedUnscheduledOrders).some(group => 
              groupFilters[group] && groupedUnscheduledOrders[group].length > 0
            ) ? (
              <div className="space-y-4">
                {Object.entries(groupedUnscheduledOrders).map(([groupKey, orders]) => {
                  if (!groupFilters[groupKey] || orders.length === 0) return null;
                  
                  const groupName = groupKey.charAt(0).toUpperCase() + groupKey.slice(1);
                  const isExpanded = expandedGroups[groupKey];
                  const totalQuantity = orders.reduce((sum, order) => sum + order.quantity, 0);
                  const avgEstimatedHours = orders.reduce((sum, order) => {
                    const enhanced = getEnhancedOrderData(order.id);
                    return sum + (enhanced?.estimatedHours || 0);
                  }, 0) / orders.length;

                  return (
                    <div key={groupKey} className={cn("border-l-4 rounded-lg p-4 transition-all duration-300", getGroupColor(groupKey as any))}>
                      <div 
                        className="flex items-center justify-between cursor-pointer mb-3"
                        onClick={() => setExpandedGroups(prev => ({ ...prev, [groupKey]: !isExpanded }))}
                      >
                        <div className="flex items-center gap-2">
                          {getGroupIcon(groupKey as any)}
                          <h3 className="font-semibold text-sm">{groupName} Production</h3>
                          <Badge variant="outline" className="text-xs">{orders.length} orders</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-xs text-muted-foreground">
                            {totalQuantity.toLocaleString()} pcs | ~{Math.round(avgEstimatedHours)}h avg
                          </div>
                          <ChevronDown className={cn("h-4 w-4 transition-transform", isExpanded ? "rotate-180" : "")} />
                        </div>
                      </div>
                      
                      {isExpanded && (
                        <div className="space-y-2 animate-group-expand">
                          {orders.map(order => {
                            const enhancedData = getEnhancedOrderData(order.id);
                            const isDragging = draggingOrderId === order.id;
                            
                            return (
                              <div
                                key={order.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, order)}
                                onDragEnd={handleDragEnd}
                                className={cn(
                                  "p-3 border rounded-lg shadow-sm cursor-grab bg-card transition-all duration-200 flex items-start gap-3",
                                  isDragging ? "animate-drag-start" : "hover:scale-[1.02] hover:shadow-md",
                                  "hover:border-primary/30 active:scale-95",
                                  dragOverCell && !isDragging ? "animate-drag-hover" : ""
                                )}
                              >
                                <GripVertical className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-2">
                                    <p className="font-semibold text-sm truncate">{order.id}</p>
                                    {enhancedData && (
                                      <>
                                        <Badge variant="outline" className={cn("text-xs border", getPriorityColor(enhancedData.priority))}>
                                          {enhancedData.priority}
                                        </Badge>
                                        <div title={`Complexity: ${enhancedData.complexity}`}>
                                          {getComplexityIcon(enhancedData.complexity)}
                                        </div>
                                      </>
                                    )}
                                  </div>
                                  <p className="text-sm font-medium text-foreground mb-1 truncate">{order.style}</p>
                                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                                    <div>Qty: {order.quantity.toLocaleString()}</div>
                                    <div>Ship: {format(parseISO(order.requestedShipDate), 'MMM dd')}</div>
                                    {enhancedData && (
                                      <>
                                        <div>Hours: {enhancedData.estimatedHours}h</div>
                                        <div>Buyer: {order.buyer}</div>
                                      </>
                                    )}
                                  </div>
                                  {enhancedData?.requirements && enhancedData.requirements.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-1">
                                      {enhancedData.requirements.slice(0, 2).map((req, idx) => (
                                        <Badge key={idx} variant="secondary" className="text-xs px-1 py-0">
                                          {req}
                                        </Badge>
                                      ))}
                                      {enhancedData.requirements.length > 2 && (
                                        <Badge variant="secondary" className="text-xs px-1 py-0">
                                          +{enhancedData.requirements.length - 2} more
                                        </Badge>
                                      )}
                                    </div>
                                  )}
                                  {order.learningCurveId && (
                                    <Badge variant="outline" className="mt-2 text-xs">
                                      LC: {mockLearningCurves.find(lc=>lc.id === order.learningCurveId)?.name || order.learningCurveId}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Package className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">All orders scheduled!</p>
                <p className="text-sm">Great job on completing the production plan.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6 shadow-lg rounded-lg">
        <CardHeader className="px-6 py-4">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Visual Guide & Instructions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          {/* Status Badges */}
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Capacity Status Indicators
            </h4>
            <div className="flex flex-wrap gap-x-6 gap-y-2 items-center">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">🪣 Empty</Badge>
                <span className="text-sm">Bucket ready for orders</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="default">🪣 Filling</Badge>
                <span className="text-sm">Some orders in bucket</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={getStatusBadgeVariant('Full')}>🪣 Full</Badge>
                <span className="text-sm">Bucket at capacity</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="destructive">🪣 Overflow</Badge>
                <span className="text-sm text-destructive">Bucket overflowing!</span>
              </div>
            </div>
          </div>

          {/* Utilization Colors */}
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Layers className="h-4 w-4 text-blue-500" />
              Utilization Progress Colors
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-2 rounded bg-gradient-to-r from-green-500 to-emerald-500"></div>
                <span className="text-sm">0-50% Available</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-2 rounded bg-gradient-to-r from-blue-500 to-indigo-500"></div>
                <span className="text-sm">50-90% Busy</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-2 rounded bg-gradient-to-r from-yellow-500 to-orange-500"></div>
                <span className="text-sm">90-100% Tight</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-2 rounded bg-gradient-to-r from-red-500 to-red-600"></div>
                <span className="text-sm">100%+ Overbooked</span>
              </div>
            </div>
          </div>

          {/* Priority & Complexity */}
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Target className="h-4 w-4 text-purple-500" />
              Order Priority & Complexity
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium mb-2">Priority Levels:</p>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-red-100 text-red-800 border-red-200">HIGH</Badge>
                    <span className="text-xs text-muted-foreground">Urgent orders</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">MEDIUM</Badge>
                    <span className="text-xs text-muted-foreground">Standard timeline</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-100 text-green-800 border-green-200">LOW</Badge>
                    <span className="text-xs text-muted-foreground">Flexible timing</span>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Complexity Icons:</p>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-xs text-muted-foreground">Simple - Standard process</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-yellow-500" />
                    <span className="text-xs text-muted-foreground">Medium - Some complexity</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <span className="text-xs text-muted-foreground">Complex - Advanced process</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Users className="h-4 w-4 text-teal-500" />
              🪣 How to Use Bucket Planning
            </h4>
            <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
              <li>🪣 Orders are organized by production group (Volume, Specialty, Finishing, Assembly)</li>
              <li>👆 Drag orders from grouped sections onto bucket cells for specific dates</li>
              <li>✨ Watch smooth animations and visual feedback during drag operations</li>
              <li>📊 Capacity bars show real-time bucket fill levels with color-coded status</li>
              <li>🔍 Use filters to show/hide specific production groups</li>
              <li>⚡ Orders consider quantity, learning curves, and daily bucket capacity</li>
              <li>📝 Partially scheduled orders remain in unscheduled list with updated quantities</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
