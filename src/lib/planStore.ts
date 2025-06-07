
// src/lib/planStore.ts
import type { Task, VerticalTask, UnscheduledOrder, VerticalTaskDailyData, SchedulableResource, PlanData, PlanInfo } from '@/components/plan-view/types';
import { format, addDays, parseISO, differenceInDays as fnsDifferenceInDays, eachDayOfInterval as fnsEachDayOfInterval } from 'date-fns';
import { mockLearningCurves } from './learningCurveTypes';
import { calculateDailyProduction } from './learningCurve';

// Re-export types for consumers
export type { PlanData, PlanInfo }; 

// Helper functions moved to the top
const differenceInDaysLocal = (dateStr1: string, dateStr2: string): number => {
  const date1 = parseISO(dateStr1);
  const date2 = parseISO(dateStr2);
  if (isNaN(date1.getTime()) || isNaN(date2.getTime())) return 0;
  return Math.round((date2.getTime() - date1.getTime()) / (1000 * 60 * 60 * 24));
};

const eachDayOfIntervalLocal = (startStr: string, endStr: string): Date[] => {
  const start = parseISO(startStr);
  const end = parseISO(endStr);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return [];
  return Array.from({ length: fnsDifferenceInDays(end, start) + 1 }, (_, i) => addDays(start, i));
};


const generateVerticalTaskDailyDataForStore = (
  startDateStr: string,
  endDateStr: string,
  styleCode: string,
  quantity: number,
  learningCurveId?: string
): VerticalTaskDailyData[] => {
  const start = parseISO(startDateStr);
  const end = parseISO(endDateStr);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return [];
  const duration = Math.max(1, fnsDifferenceInDays(end, start) + 1);

  let dailyProductionPlan: { date: string, capacity: number, efficiency: number }[] = [];
  const learningCurve = learningCurveId ? mockLearningCurves.find(lc => lc.id === learningCurveId) : undefined;

  if (learningCurve && learningCurve.smv > 0) {
    dailyProductionPlan = calculateDailyProduction(
      learningCurve.points,
      learningCurve.smv,
      learningCurve.workingMinutesPerDay,
      learningCurve.operatorsCount,
      duration,
      start
    );
  } else {
    const dates = fnsEachDayOfInterval({ start, end });
    const numDaysForTask = Math.max(1, dates.length);
    const avgQtyPerDay = numDaysForTask > 0 ? Math.round(quantity / numDaysForTask) : quantity;
    dailyProductionPlan = dates.map((date) => ({
      date: format(date, 'yyyy-MM-dd'),
      capacity: avgQtyPerDay,
      efficiency: 100
    }));
  }

  const totalCalculatedCapacity = dailyProductionPlan.reduce((sum, day) => sum + day.capacity, 0);
  const adjustmentFactor = totalCalculatedCapacity > 0 && quantity > 0 ? quantity / totalCalculatedCapacity : 1;
  let cumulativeQty = 0;
  const adjustedDailyData: VerticalTaskDailyData[] = dailyProductionPlan.map(dayPlan => {
    const adjustedQty = Math.max(0, Math.round(dayPlan.capacity * adjustmentFactor));
    cumulativeQty += adjustedQty;
    return {
      date: dayPlan.date,
      styleCode: styleCode,
      plannedQty: adjustedQty,
      efficiency: dayPlan.efficiency,
      cumulativeQty: cumulativeQty,
    };
  });

  if (adjustedDailyData.length > 0 && quantity !== cumulativeQty && cumulativeQty > 0) {
    const finalDifference = quantity - cumulativeQty;
    adjustedDailyData[adjustedDailyData.length - 1].plannedQty = Math.max(0, adjustedDailyData[adjustedDailyData.length - 1].plannedQty + finalDifference);
    cumulativeQty = 0;
    for (let i = 0; i < adjustedDailyData.length; i++) {
      cumulativeQty += adjustedDailyData[i].plannedQty;
      adjustedDailyData[i].cumulativeQty = cumulativeQty;
    }
  }
  return adjustedDailyData;
};

function calculateDurationWithLCForStore(order: UnscheduledOrder, resourceCapacity: number, startDate: Date, learningCurveId?: string): number {
    const learningCurveDef = learningCurveId ? mockLearningCurves.find(lc => lc.id === learningCurveId) : undefined;
    let estimatedDurationDays = 5;

    if (learningCurveDef && learningCurveDef.smv > 0 && order.quantity > 0) {
      const plan = calculateDailyProduction(
        learningCurveDef.points,
        learningCurveDef.smv,
        learningCurveDef.workingMinutesPerDay,
        learningCurveDef.operatorsCount,
        100, 
        startDate
      );
      let cumQty = 0;
      let duration = 0;
      for (const day of plan) {
        duration++;
        cumQty += day.capacity;
        if (cumQty >= order.quantity) break;
      }
      estimatedDurationDays = Math.max(1, duration);
    } else if (resourceCapacity > 0) {
      estimatedDurationDays = Math.max(1, Math.ceil(order.quantity / resourceCapacity));
    }
    return estimatedDurationDays;
}

const createDefaultAllocatedTask = (
  order: UnscheduledOrder,
  resourceId: string,
  startDate: Date,
  resourceCapacity: number
): { hTask: Task; vTask: VerticalTask } => {
  const taskId = `task-${order.id}-init`; 
  const estimatedDurationDays = calculateDurationWithLCForStore(order, resourceCapacity, startDate, order.learningCurveId);
  const startDateStr = format(startDate, 'yyyy-MM-dd');
  const endDateStr = format(addDays(startDate, Math.max(0, estimatedDurationDays - 1)), 'yyyy-MM-dd');

  const commonDetails = {
    id: taskId,
    resourceId: resourceId,
    startDate: startDateStr,
    endDate: endDateStr,
    color: 'bg-sky-500 text-white',
    displayColor: 'bg-sky-500 text-white',
    originalOrderDetails: { ...order },
    learningCurveId: order.learningCurveId,
  };

  const hTask: Task = {
    ...commonDetails,
    label: `${order.style} (${order.quantity})`,
  };

  const vTask: VerticalTask = {
    ...commonDetails,
    orderName: `${order.style} [${order.quantity}]`,
    imageHint: order.imageHint || 'apparel manufacturing',
    dailyData: generateVerticalTaskDailyDataForStore(startDateStr, endDateStr, order.style, order.quantity, order.learningCurveId),
  };
  return { hTask, vTask };
};

export const allMockOrdersForDefault: UnscheduledOrder[] = [
    { id: 'ORD-001', buyer: 'Nike Apparel', style: 'Men\'s Basic Crew Neck T-Shirt', productType: 'Tops', quantity: 1500, requestedShipDate: format(addDays(new Date(), 30), 'yyyy-MM-dd'), reason: 'New Season Stock', learningCurveId: 'lc-simple-tee', imageHint: 'tshirt apparel' },
    { id: 'ORD-002', buyer: 'Adidas Group', style: 'Women\'s Waxed Cotton Jacket', productType: 'Outerwear', quantity: 300, requestedShipDate: format(addDays(new Date(), 60), 'yyyy-MM-dd'), reason: 'Premium Collection', learningCurveId: 'lc-complex-jacket', imageHint: 'jacket outerwear' },
    { id: 'ORD-003', buyer: 'Zara (Inditex)', style: 'Men\'s Pique Polo Shirt', productType: 'Tops', quantity: 5000, requestedShipDate: format(addDays(new Date(), 45), 'yyyy-MM-dd'), reason: 'Bulk Order', learningCurveId: 'lc-standard-polo', imageHint: 'polo shirt' },
    { id: 'ORD-004', buyer: 'H&M Group', style: 'Unisex Baseball Cap', productType: 'Accessories', quantity: 800, requestedShipDate: format(addDays(new Date(), 20), 'yyyy-MM-dd'), reason: 'Urgent Promotional', learningCurveId: 'lc-very-fast', imageHint: 'cap headwear' },
    { id: 'ORD-005', buyer: 'Nike Apparel', style: 'Women\'s Floral Maxi Dress', productType: 'Dresses', quantity: 1200, requestedShipDate: format(addDays(new Date(), 35), 'yyyy-MM-dd'), reason: 'Stock Replenishment', learningCurveId: 'lc-moderate-dress', imageHint: 'dress floral' },
];
const defaultAllocatedOrders = allMockOrdersForDefault.slice(0, 4);


export const getDefaultPlanTasks = (): { horizontalTasks: Task[], verticalTasks: VerticalTask[] } => {
  // Return empty tasks since we've removed mock data dependencies
  // In a real implementation, this would fetch from the database
  return { horizontalTasks: [], verticalTasks: [] };
};

const { horizontalTasks: defaultHTasks, verticalTasks: defaultVTasks } = getDefaultPlanTasks();

export const DEFAULT_PLAN_DATA: PlanData = {
  horizontalTasks: defaultHTasks,
  verticalTasks: defaultVTasks,
  bucketScheduledTasks: [],
  bucketUnscheduledOrders: [],
};

const PLAN_INDEX_KEY = 'trackTechPlanIndex_v1';
const PLAN_DATA_PREFIX = 'trackTechPlanData_v1_';

export const getAvailablePlans = (): PlanInfo[] => {
  if (typeof window === 'undefined') return [{id: DEFAULT_PLAN_ID, name: DEFAULT_PLAN_NAME}];
  const indexJson = localStorage.getItem(PLAN_INDEX_KEY);
  let plans: PlanInfo[] = [];
  if (indexJson) {
    try {
      const parsedPlans = JSON.parse(indexJson);
      if (Array.isArray(parsedPlans)) {
        plans = parsedPlans.filter(p => p && typeof p.id === 'string' && typeof p.name === 'string');
      }
    } catch (e) {
      console.error("Error parsing plan index from localStorage:", e);
      plans = []; 
    }
  }

  if (!plans.find((p: PlanInfo) => p.id === DEFAULT_PLAN_ID)) {
      plans.push({id: DEFAULT_PLAN_ID, name: DEFAULT_PLAN_NAME});
  }
  if (!plans.find((p: PlanInfo) => p.id === BUCKET_DEFAULT_PLAN_ID)) {
      plans.push({id: BUCKET_DEFAULT_PLAN_ID, name: BUCKET_DEFAULT_PLAN_NAME});
  }
  return plans;
};

export const loadPlan = (planId: string): PlanData | null => {
  if (typeof window === 'undefined') {
      return planId === DEFAULT_PLAN_ID ? { ...DEFAULT_PLAN_DATA } : null;
  }
  const planDataJson = localStorage.getItem(`${PLAN_DATA_PREFIX}${planId}`);
  if (planDataJson) {
    try {
      const parsed = JSON.parse(planDataJson);
      const migrateResourceId = (task: any) => ({
        ...task,
        resourceId: task.resourceId || task.lineId,
        lineId: undefined, 
      });

      return {
        horizontalTasks: (parsed.horizontalTasks || []).map(migrateResourceId),
        verticalTasks: (parsed.verticalTasks || []).map(migrateResourceId),
        bucketScheduledTasks: (parsed.bucketScheduledTasks || []).map(migrateResourceId),
        bucketUnscheduledOrders: parsed.bucketUnscheduledOrders || [],
      };
    } catch (e) {
      console.error("Error parsing plan data from localStorage for planId:", planId, e);
      if (planId === DEFAULT_PLAN_ID) return { ...DEFAULT_PLAN_DATA };
      return null;
    }
  } else if (planId === DEFAULT_PLAN_ID) {
    return { ...DEFAULT_PLAN_DATA };
  }
  return null;
};

export const savePlan = (planId: string, planName: string, data: PlanData): PlanInfo | null => {
  if (typeof window === 'undefined') {
    console.error("Cannot save plan: localStorage not available.");
    return null;
  }
  
  const dataToStore = {
    ...data,
    horizontalTasks: (data.horizontalTasks || []).map(task => ({ ...task, resourceId: task.resourceId || (task as any).lineId, lineId: undefined })),
    verticalTasks: (data.verticalTasks || []).map(vt => ({...vt, resourceId: vt.resourceId || (vt as any).lineId, lineId: undefined })),
    bucketScheduledTasks: (data.bucketScheduledTasks || []).map(bst => ({...bst, resourceId: bst.resourceId || (bst as any).lineId, lineId: undefined })),
    bucketUnscheduledOrders: data.bucketUnscheduledOrders || [],
  };

  try {
    localStorage.setItem(`${PLAN_DATA_PREFIX}${planId}`, JSON.stringify(dataToStore));

    let planIndex = getAvailablePlans();
    const existingPlanInfoIndex = planIndex.findIndex(p => p.id === planId);

    if (existingPlanInfoIndex > -1) {
      planIndex[existingPlanInfoIndex].name = planName;
    } else {
      planIndex.push({ id: planId, name: planName });
    }
    localStorage.setItem(PLAN_INDEX_KEY, JSON.stringify(planIndex));
    return { id: planId, name: planName };
  } catch (error) {
    console.error("Error saving plan to localStorage:", error);
    return null;
  }
};

export const renamePlanInStore = (planId: string, newName: string): boolean => {
  if (typeof window === 'undefined') return false;
  let planIndex = getAvailablePlans();
  const planInfo = planIndex.find(p => p.id === planId);
  if (planInfo) {
    planInfo.name = newName;
    try {
      localStorage.setItem(PLAN_INDEX_KEY, JSON.stringify(planIndex));
      return true;
    } catch (error) {
      console.error("Error saving renamed plan index to localStorage:", error);
      return false;
    }
  }
  return false;
};

export const deletePlanFromStore = (planId: string): boolean => {
  if (typeof window === 'undefined') return false;
  if (planId === DEFAULT_PLAN_ID || planId === BUCKET_DEFAULT_PLAN_ID) return false;
  try {
    localStorage.removeItem(`${PLAN_DATA_PREFIX}${planId}`);
    let planIndex = getAvailablePlans();
    planIndex = planIndex.filter(p => p.id !== planId);
    localStorage.setItem(PLAN_INDEX_KEY, JSON.stringify(planIndex));
    return true;
  } catch (error) {
    console.error("Error deleting plan from localStorage:", error);
    return false;
  }
};

export const generatePlanId = (): string => `plan_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

export const DEFAULT_PLAN_ID = 'plan_default';
export const DEFAULT_PLAN_NAME = 'Default Plan';
export const BUCKET_DEFAULT_PLAN_ID = 'bucket_plan_default';
export const BUCKET_DEFAULT_PLAN_NAME = 'Default Bucket Plan';


export const initializeDefaultPlan = () => {
  if (typeof window === 'undefined') return;
  
  getAvailablePlans(); 
  
  const defaultPlanDataExists = !!localStorage.getItem(`${PLAN_DATA_PREFIX}${DEFAULT_PLAN_ID}`);
  if (!defaultPlanDataExists) {
    savePlan(DEFAULT_PLAN_ID, DEFAULT_PLAN_NAME, { ...DEFAULT_PLAN_DATA });
  } else {
    const currentDefaultData = loadPlan(DEFAULT_PLAN_ID);
    if (!currentDefaultData || 
        !currentDefaultData.horizontalTasks || currentDefaultData.horizontalTasks.length === 0 || 
        !currentDefaultData.verticalTasks || currentDefaultData.verticalTasks.length === 0 || 
        currentDefaultData.bucketScheduledTasks === undefined || 
        currentDefaultData.bucketUnscheduledOrders === undefined ) {
       savePlan(DEFAULT_PLAN_ID, DEFAULT_PLAN_NAME, { ...DEFAULT_PLAN_DATA });
    }
  }

  const defaultBucketPlanDataExists = !!localStorage.getItem(`${PLAN_DATA_PREFIX}${BUCKET_DEFAULT_PLAN_ID}`);
  if (!defaultBucketPlanDataExists) {
      savePlan(BUCKET_DEFAULT_PLAN_ID, BUCKET_DEFAULT_PLAN_NAME, {
          horizontalTasks: [], 
          verticalTasks: [],   
          bucketScheduledTasks: [],
          bucketUnscheduledOrders: [],
      });
  }
};

if (typeof window !== 'undefined') {
  initializeDefaultPlan();
}

export const getAllTasksFromPlan = (planId: string): { horizontal: Task[], vertical: VerticalTask[] } => {
  const plan = loadPlan(planId);
  return {
    horizontal: plan?.horizontalTasks || [],
    vertical: plan?.verticalTasks || [],
  };
};
