// src/app/plan-view/page.tsx
'use client';

import * as React from 'react';
import { PageHeader } from '@/components/page-header';
import { TimelineToolbar } from '@/components/plan-view/timeline-toolbar';
import TimelineGrid from '@/components/plan-view/timeline-grid';
import { VerticalScheduler } from '@/components/plan-view/vertical-scheduler';
import { HighLevelPlanningBoard } from '@/components/plan-view/HighLevelPlanningBoard';
import { LowLevelPlanningBoard } from '@/components/plan-view/LowLevelPlanningBoard';
import type { Resource, Task, DailyData, UnscheduledOrder, SchedulableResource, VerticalTask, TimelineViewMode, VerticalTaskDailyData as TaskDailyData, MergeableOrderItem, RotationMode, PushPullState, HolidayDetail, RowHeightLevel, SubProcessOrder, SearchFormValues, TnaPlan, SubProcessViewMode, EqualiseOrderOptions } from '@/components/plan-view/types';
import { RESOURCE_PANE_WIDTH, ROW_HEIGHT_CONFIG } from '@/components/plan-view/types';
import { addDays, format, startOfWeek, eachDayOfInterval, parseISO, differenceInDays as fnsDifferenceInDays, addBusinessDays, startOfHour, addHours, startOfMonth, endOfMonth, endOfWeek as dateFnsEndOfWeek, eachWeekOfInterval, addMonths as dateFnsAddMonths, getDaysInMonth, isSameDay as isTodayChecker, isSameHour, isSameMonth, getMonth, subWeeks, subDays, subMonths, endOfDay, startOfDay } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { SplitTaskDialog } from '@/components/plan-view/split-task-dialog';
import { MergeOrdersDialog } from '@/components/plan-view/MergeOrdersDialog';
import { calculateDailyProduction } from '@/lib/learningCurve';
import type { LearningCurveMaster } from '@/lib/learningCurveTypes';
import { mockLearningCurves } from '@/lib/learningCurveTypes';
import {
  loadPlan as loadPlanFromStore,
  getAvailablePlans as getAvailablePlansFromStore,
  savePlan as savePlanToStore,
  renamePlanInStore,
  deletePlanFromStore,
  generatePlanId,
  DEFAULT_PLAN_ID,
  DEFAULT_PLAN_NAME,
  type PlanData,
  type PlanInfo,
  initializeDefaultPlan,
  getDefaultPlanTasks,
  allMockOrdersForDefault,
  BUCKET_DEFAULT_PLAN_ID,
  BUCKET_DEFAULT_PLAN_NAME,
} from '@/lib/planStore';
import { getLineGroups, type LineGroup } from '@/lib/lineGroupStore';
import { OrderStatusDialog } from '@/components/plan-view/OrderStatusDialog';
import { PullForwardDialog, type PullForwardOptions as ActualPullForwardOptions } from '@/components/plan-view/PullForwardDialog';
import { ConsolidateStripsDialog, type ConsolidationOptions as ActualConsolidationOptions } from '@/components/plan-view/ConsolidateStripsDialog';
import { UnplannedListDialog } from '@/components/plan-view/UnplannedListDialog';
import { SearchToolDialog } from '@/components/plan-view/SearchToolDialog';
import { EqualiseOrderDialog } from '@/components/plan-view/EqualiseOrderDialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';
import { TargetDisplayPanel } from '@/components/plan-view/TargetDisplayPanel';
import { TimelineResourcePane } from '@/components/plan-view/timeline-resource-pane';
import { SubProcessPlanningView } from '@/components/plan-view/SubProcessPlanningView';
import { useLineApi } from '@/hooks/useLineApi';
import { useLineGroupApi } from '@/hooks/useLineGroupApi';


const LOCALSTORAGE_KEY_ACTIVE_PLAN_ID = 'trackTechActivePlanId_v2';
const LOCALSTORAGE_KEY_TIMELINE_VIEW_MODE = 'trackTechTimelineViewMode_v2';
const LOCALSTORAGE_KEY_ROW_HEIGHT_LEVEL = 'trackTechRowHeightLevel_v2';
const LOCALSTORAGE_KEY_SELECTED_RESOURCE_IDS = 'trackTechSelectedResourceIds_v1';
const LOCALSTORAGE_KEY_SUB_PROCESS_VIEW_MODE = 'trackTechSubProcessViewMode_v1';
const LOCALSTORAGE_KEY_ROTATION_MODE = 'trackTechRotationMode_v1';
const LOCALSTORAGE_KEY_HORIZONTAL_ZOOM_LEVEL = 'trackTechHorizontalZoomLevel_v1';
const LOCALSTORAGE_KEY_CALENDARS_DATA = 'trackTech_calendarsData_v2';

const ROTATION_COLORS = [
  'bg-gradient-to-br from-sky-500 to-sky-600 text-white shadow-sky-500/25', 
  'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-emerald-500/25', 
  'bg-gradient-to-br from-amber-500 to-amber-600 text-black shadow-amber-500/25',
  'bg-gradient-to-br from-rose-500 to-rose-600 text-white shadow-rose-500/25', 
  'bg-gradient-to-br from-fuchsia-500 to-fuchsia-600 text-white shadow-fuchsia-500/25', 
  'bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-indigo-500/25',
  'bg-gradient-to-br from-lime-500 to-lime-600 text-black shadow-lime-500/25', 
  'bg-gradient-to-br from-cyan-500 to-cyan-600 text-white shadow-cyan-500/25', 
  'bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-orange-500/25',
  'bg-gradient-to-br from-violet-500 to-violet-600 text-white shadow-violet-500/25', 
  'bg-gradient-to-br from-teal-500 to-teal-600 text-white shadow-teal-500/25', 
  'bg-gradient-to-br from-pink-500 to-pink-600 text-white shadow-pink-500/25',
];

// Helper functions moved to module scope
const generateInitialSchedulableResources = (lines: any[]): SchedulableResource[] => {
  return lines.map((line: any) => ({
   id: line.id, name: line.lineName, capacity: line.defaultCapacity || 0
  }));
};

const generateInitialHorizontalDisplayResources = (
    lineGroups: LineGroup[],
    allSchedulableLines: SchedulableResource[],
    currentTasks: Task[],
    planName: string
): Resource[] => {
  const resources: Resource[] = [];
  const planNameToDisplay = planName || DEFAULT_PLAN_NAME;
  resources.push({
    id: 'header-info', type: 'header', name: `Plan: ${planNameToDisplay}`,
    details: `${currentTasks.length} tasks loaded`, values: [],
  });

  const linesMap = new Map(allSchedulableLines.map(line => [line.id, line]));
  const assignedLineIdsInGroups = new Set(lineGroups.flatMap(group => group.lineIds));

  lineGroups.forEach(group => {
    resources.push({
      id: `group-${group.id}`,
      type: 'groupHeader',
      name: group.groupName,
      details: `Group: ${group.lineIds.length} lines`,
      lineCount: group.lineIds.length,
    });
    group.lineIds.forEach(lineId => {
      const line = linesMap.get(lineId);
      if (line) {
        const scheduledTasksOnLine = currentTasks.filter(task => task.resourceId === line.id).length;
        resources.push({
          id: line.id, type: 'unit', name: line.name, details: group.groupName,
          values: [line.capacity || 0, scheduledTasksOnLine], isExpandable: true, capacityPerDay: line.capacity || 0,
        });
      }
    });
  });

  const unassignedLines = allSchedulableLines.filter(line => !assignedLineIdsInGroups.has(line.id));
  if (unassignedLines.length > 0) {
    resources.push({
        id: 'group-unassigned',
        type: 'groupHeader',
        name: 'Unassigned Lines',
        details: `${unassignedLines.length} lines not in any group`,
        lineCount: unassignedLines.length,
    });
    unassignedLines.forEach(line => {
        const scheduledTasksOnLine = currentTasks.filter(task => task.resourceId === line.id).length;
        resources.push({
            id: line.id, type: 'unit', name: line.name, details: 'Unassigned',
            values: [line.capacity || 0, scheduledTasksOnLine], isExpandable: true, capacityPerDay: line.capacity || 0,
        });
    });
  }

  resources.push({
    id: 'holding-area',
    type: 'holding',
    name: 'Holding Area',
    details: 'For unscheduled or unassigned tasks',
    values: [0, currentTasks.filter(task => task.resourceId === 'holding-area').length],
    isExpandable: true,
    capacityPerDay: 0,
  });
  
  resources.push({
    id: 'subtotal-all-lines',
    type: 'subtotal',
    name: `Totals (${allSchedulableLines.length} Lines)`,
    details: `Total Capacity: ${allSchedulableLines.reduce((sum, line) => sum + (line.capacity || 0), 0).toLocaleString()} pcs/day`,
    subRowsData: [
      { type: 'Std. Capacity / Day', dailyValuesKey: 'totalCapacity' },
      { type: 'Calc. Load / Day', dailyValuesKey: 'calculatedLoad' },
    ],
  });

   if (resources.length === 1 && resources[0].id === 'header-info') { // Only header-info means no lines or groups
     resources.push({
      id: 'placeholder-no-lines', type: 'groupHeader', name: 'No Lines Configured',
      details: 'Please add lines in Masters.', lineCount: 0
    });
  }
  return resources;
};

const getBaseOrderId = (fullOrderId?: string): string => {
    if (!fullOrderId) return `unknown-${Date.now()}`;
    const baseIdMatch = fullOrderId.match(/^([A-Z0-9]+(?:[-_][A-Z0-9()]+)*?)(?:[-_](?:split[AB]?|sch|merged|init|eq\d*))?(?:[-_]\d+)*$/i);
    if (baseIdMatch && baseIdMatch[1]) {
        return baseIdMatch[1];
    }
    const simpleSplit = fullOrderId.split(/[-_](?:split|sch|merged|init|eq)/i);
    if (simpleSplit.length > 0) return simpleSplit[0];

    return fullOrderId;
};

const mockSubProcessOrders: SubProcessOrder[] = [
    { id: 'SPO-001-CUT', line: 'DG - Line 1', buyer: 'Nike Apparel', style: 'Men\'s Basic Crew Neck T-Shirt', po: 'PO-N01', colour: 'Blue', totalPlanQty: 1500, deliveryDate: format(addDays(new Date(), 10), 'yyyy-MM-dd'), madeQty: 200, balanceQty: 1300, backlog: 0, dailyTargets: { [format(addDays(new Date(), 2), 'yyyy-MM-dd')]: 100, [format(addDays(new Date(), 3), 'yyyy-MM-dd')]: 150 } },
    { id: 'SPO-002-EMB', line: 'DG - Line 2', buyer: 'Adidas Group', style: 'Women\'s Waxed Cotton Jacket', po: 'PO-A01', colour: 'Red', totalPlanQty: 300, deliveryDate: format(addDays(new Date(), 25), 'yyyy-MM-dd'), madeQty: 50, balanceQty: 250, backlog: 10, dailyTargets: { [format(addDays(new Date(), 5), 'yyyy-MM-dd')]: 50 } },
    { id: 'SPO-003-FIN', line: 'SH - Line 1', buyer: 'Zara (Inditex)', style: 'Men\'s Pique Polo Shirt', po: 'PO-Z01', colour: 'Green', totalPlanQty: 5000, deliveryDate: format(addDays(new Date(), 18), 'yyyy-MM-dd'), madeQty: 0, balanceQty: 5000, backlog: 0, dailyTargets: {} },
];

export default function PlanViewPage() {
  const { toast } = useToast();
  
  // API hooks for real data
  const { lines, searchLines } = useLineApi();
  const { lineGroups, searchLineGroups } = useLineGroupApi();
  
  // Initialize with server-safe default
  const serverSafeInitialDate = React.useMemo(() => startOfDay(parseISO("2024-01-01T00:00:00.000Z")), []);

  const [isClient, setIsClient] = React.useState(false);
  const [horizontalCurrentStartDate, setHorizontalCurrentStartDate] = React.useState<Date>(serverSafeInitialDate);
  const [verticalCurrentStartDate, setVerticalCurrentStartDate] = React.useState<Date>(serverSafeInitialDate);
  
  const [viewMode, setViewMode] = React.useState<'horizontal' | 'vertical'>('horizontal');
  const [timelineViewMode, setTimelineViewMode] = React.useState<TimelineViewMode>('weekly');
  const [horizontalZoomLevel, setHorizontalZoomLevel] = React.useState<number>(50);
  const [rotationMode, setRotationMode] = React.useState<RotationMode>('order');
  const [rowHeightLevel, setRowHeightLevel] = React.useState<RowHeightLevel>('medium');
  const [subProcessViewMode, setSubProcessViewMode] = React.useState<SubProcessViewMode>(null);
  const [activePlanId, setActivePlanId] = React.useState<string>(DEFAULT_PLAN_ID); 
  const [activePlanName, setActivePlanName] = React.useState<string>(DEFAULT_PLAN_NAME);
  const [expandedResourceId, setExpandedResourceId] = React.useState<string | null>(null);

  const initialTaskData = React.useMemo(() => {
    const { horizontalTasks: initialHTasks, verticalTasks: initialVTasks } = getDefaultPlanTasks();
    const scheduledBaseIds = new Set([
      ...initialHTasks.map(ht => getBaseOrderId(ht.originalOrderDetails?.id)),
      ...initialVTasks.map(vt => getBaseOrderId(vt.originalOrderDetails?.id)),
    ].filter(Boolean) as string[]);

    const initialUnscheduled = allMockOrdersForDefault.filter(order => !scheduledBaseIds.has(getBaseOrderId(order.id)));
    return { initialHTasks, initialVTasks, initialUnscheduled };
  }, []);

  const [rawHorizontalTasks, setRawHorizontalTasks] = React.useState<Task[]>(initialTaskData.initialHTasks);
  const [rawVerticalTasks, setRawVerticalTasks] = React.useState<VerticalTask[]>(initialTaskData.initialVTasks);
  const [unscheduledOrders, setUnscheduledOrders] = React.useState<UnscheduledOrder[]>(initialTaskData.initialUnscheduled);
  const [horizontalTasks, setHorizontalTasks] = React.useState<Task[]>([]); 
  const [verticalTasks, setVerticalTasks] = React.useState<VerticalTask[]>([]); 
  
  const [isSplitTaskDialogOpen, setIsSplitTaskDialogOpen] = React.useState(false);
  const [taskToSplit, setTaskToSplit] = React.useState<Task | VerticalTask | null>(null);
  const [isMergeOrdersDialogOpen, setIsMergeOrdersDialogOpen] = React.useState(false);
  const [taskToMerge, setTaskToMerge] = React.useState<Task | VerticalTask | null>(null);
  const [mergeableOrdersForDialog, setMergeableOrdersForDialog] = React.useState<MergeableOrderItem[]>([]);
  const [isOrderStatusDialogOpen, setIsOrderStatusDialogOpen] = React.useState(false);
  const [selectedTaskForStatus, setSelectedTaskForStatus] = React.useState<Task | VerticalTask | null>(null);
  const [isPullForwardDialogOpen, setIsPullForwardDialogOpen] = React.useState(false);
  const [isConsolidateStripsDialogOpen, setIsConsolidateStripsDialogOpen] = React.useState(false);
  const [isUnplannedListDialogOpen, setIsUnplannedListDialogOpen] = React.useState(false);
  const [isSearchToolDialogOpen, setIsSearchToolDialogOpen] = React.useState(false);
  const [isEqualiseOrderDialogOpen, setIsEqualiseOrderDialogOpen] = React.useState(false);
  const [taskToEqualise, setTaskToEqualise] = React.useState<Task | VerticalTask | null>(null);
  
  const [subProcessOrdersData, setSubProcessOrdersData] = React.useState<SubProcessOrder[]>(mockSubProcessOrders);
  
  const [pushPullState, setPushPullState] = React.useState<PushPullState>({ isActive: false, originTaskId: null, scope: null });
  const [holidaysMap, setHolidaysMap] = React.useState<Map<string, HolidayDetail>>(new Map());
  const [lineGroupsData, setLineGroupsData] = React.useState<LineGroup[]>([]);
  const [schedulableResources, setSchedulableResources] = React.useState<SchedulableResource[]>([]);
  
  const [selectedResourceIds, setSelectedResourceIds] = React.useState<string[]>([]);

  // Refs for scroll synchronization
  const resourcePaneVerticalScrollRef = React.useRef<HTMLDivElement>(null);
  const rightPaneHorizontalScrollRef = React.useRef<HTMLDivElement>(null);
  const schedulePaneVerticalScrollRef = React.useRef<HTMLDivElement>(null);
  const targetDisplayScheduleRef = React.useRef<HTMLDivElement>(null);
  const headerScrollRef = React.useRef<HTMLDivElement>(null);
  const isSyncingScroll = React.useRef(false);
  const taskCounterRef = React.useRef({ value: Date.now() });

  // Effect to set isClient to true after mount
  React.useEffect(() => {
    setIsClient(true);
  }, []);

  // Effect to initialize states from localStorage or set defaults once client-side
  React.useEffect(() => {
    if (isClient) {
      // Initialize date to today for client
      const clientToday = startOfDay(new Date());
      if (horizontalCurrentStartDate.getTime() === serverSafeInitialDate.getTime()) {
        setHorizontalCurrentStartDate(clientToday);
      }
      if (verticalCurrentStartDate.getTime() === serverSafeInitialDate.getTime()) {
        setVerticalCurrentStartDate(clientToday);
      }

      // Load settings from localStorage
      const storedTimelineViewMode = localStorage.getItem(LOCALSTORAGE_KEY_TIMELINE_VIEW_MODE) as TimelineViewMode | null;
      if (storedTimelineViewMode && ['hourly', 'daily', 'weekly', 'monthly'].includes(storedTimelineViewMode)) {
        setTimelineViewMode(storedTimelineViewMode);
      } else {
        setTimelineViewMode('weekly');
        localStorage.setItem(LOCALSTORAGE_KEY_TIMELINE_VIEW_MODE, 'weekly');
      }
      
      const storedRowHeightLevel = localStorage.getItem(LOCALSTORAGE_KEY_ROW_HEIGHT_LEVEL) as RowHeightLevel | null;
      if (storedRowHeightLevel && ['small', 'medium', 'large'].includes(storedRowHeightLevel)) {
        setRowHeightLevel(storedRowHeightLevel);
      } else {
        setRowHeightLevel('medium');
        localStorage.setItem(LOCALSTORAGE_KEY_ROW_HEIGHT_LEVEL, 'medium');
      }

      const storedRotationMode = localStorage.getItem(LOCALSTORAGE_KEY_ROTATION_MODE) as RotationMode | null;
      if (storedRotationMode && ['order', 'product', 'productType', 'customer', 'delivery'].includes(storedRotationMode)) {
        setRotationMode(storedRotationMode);
      } else {
        setRotationMode('order');
        localStorage.setItem(LOCALSTORAGE_KEY_ROTATION_MODE, 'order');
      }

      const storedZoomLevel = localStorage.getItem(LOCALSTORAGE_KEY_HORIZONTAL_ZOOM_LEVEL);
      if (storedZoomLevel) {
        setHorizontalZoomLevel(parseInt(storedZoomLevel, 10) || 50);
      } else {
        setHorizontalZoomLevel(50);
        localStorage.setItem(LOCALSTORAGE_KEY_HORIZONTAL_ZOOM_LEVEL, '50');
      }
      
      const storedSubProcessViewMode = localStorage.getItem(LOCALSTORAGE_KEY_SUB_PROCESS_VIEW_MODE) as SubProcessViewMode | null;
      if (storedSubProcessViewMode && ['cutting', 'embroidery', 'finishing', 'high-level-planning', 'low-level-planning'].includes(storedSubProcessViewMode)) {
        setSubProcessViewMode(storedSubProcessViewMode);
      } else {
        setSubProcessViewMode(null);
        localStorage.removeItem(LOCALSTORAGE_KEY_SUB_PROCESS_VIEW_MODE);
      }

      const storedSelectedResourceIds = localStorage.getItem(LOCALSTORAGE_KEY_SELECTED_RESOURCE_IDS);
      if (storedSelectedResourceIds) {
          try { 
            const parsedIds = JSON.parse(storedSelectedResourceIds);
            if (Array.isArray(parsedIds) && parsedIds.every(id => typeof id === 'string')) {
                 setSelectedResourceIds(parsedIds);
            }
          } catch (e) { console.error("Error parsing selectedResourceIds from localStorage:", e); setSelectedResourceIds([]); }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClient, serverSafeInitialDate]); // Only run on client mount

  // Load API data on component mount
  React.useEffect(() => {
    if (isClient) {
      searchLines();
      searchLineGroups({ isActive: true });
    }
  }, [isClient, searchLines, searchLineGroups]);

  // Update schedulable resources when lines data changes
  React.useEffect(() => {
    if (lines.length > 0) {
      const newResources = generateInitialSchedulableResources(lines);
      setSchedulableResources(newResources);
    }
  }, [lines]);

  // Update line groups data when lineGroups changes
  React.useEffect(() => {
    setLineGroupsData(lineGroups);
  }, [lineGroups]);

  const horizontalDisplayResources = React.useMemo(() => {
    if(!isClient) return []; // Important: Don't try to generate this on server or before client data is ready
    return generateInitialHorizontalDisplayResources(lineGroupsData, schedulableResources, rawHorizontalTasks, activePlanName);
  }, [isClient, schedulableResources, rawHorizontalTasks, activePlanName, lineGroupsData]);

  const getTimelineDisplayConfig = React.useCallback((
    currentDate: Date,
    view: TimelineViewMode,
    zoom: number
  ): { displayedUnits: Date[], unitCellWidth: number } => {
    let displayedUnitsArray: Date[] = [];
    let unitCellWidthBase = 40; 
    let rangeStart: Date;
    let rangeEnd: Date;
    
    if (isNaN(currentDate.getTime())) { // Fallback if currentDate is invalid
      currentDate = startOfDay(new Date());
    }
    const referenceDate = startOfDay(currentDate);

    switch (view) {
      case 'hourly':
        unitCellWidthBase = 25;
        rangeStart = startOfDay(referenceDate);
        rangeEnd = endOfDay(addDays(rangeStart, 1)); // Display 2 full days of hours
        break;
      case 'daily':
      case 'weekly':
      case 'monthly':
      default: 
        unitCellWidthBase = 40;
        rangeStart = startOfWeek(subWeeks(referenceDate, 8), { weekStartsOn: 1 }); // Approx 2 months back
        rangeEnd = dateFnsEndOfWeek(dateFnsAddMonths(referenceDate, 3), { weekStartsOn: 1 }); // Approx 3 months forward
        
        if (rangeStart > rangeEnd) { // Safety check
            rangeStart = startOfWeek(referenceDate, { weekStartsOn: 1 });
            rangeEnd = dateFnsEndOfWeek(referenceDate, { weekStartsOn: 1 });
        }
        break;
    }
        
    if (rangeStart && rangeEnd && rangeStart <= rangeEnd) {
        displayedUnitsArray = eachDayOfInterval({ start: rangeStart, end: rangeEnd });
    } else { // Further fallback
        const todayFallback = startOfDay(new Date());
        displayedUnitsArray = eachDayOfInterval({ start: startOfWeek(todayFallback, {weekStartsOn:1}), end: dateFnsEndOfWeek(todayFallback, {weekStartsOn:1}) });
    }
    
    if (view === 'hourly') {
        let hourlyUnits: Date[] = [];
        if (displayedUnitsArray.length > 0) {
            displayedUnitsArray.forEach(day => { 
                for (let hourOffset = 0; hourOffset < 24; hourOffset++) {
                    hourlyUnits.push(addHours(startOfDay(day), hourOffset));
                }
            });
            displayedUnitsArray = hourlyUnits;
        } else { // Fallback if daily units array was empty
            const todayForHourlyFallback = startOfDay(new Date());
            for (let hourOffset = 0; hourOffset < 48; hourOffset++) { // Default to 2 days of hours
                hourlyUnits.push(addHours(todayForHourlyFallback, hourOffset));
            }
            displayedUnitsArray = hourlyUnits;
        }
    }

    const calculatedUnitCellWidth = Math.max(5, unitCellWidthBase * (zoom / 50));
    return { 
        displayedUnits: displayedUnitsArray.length > 0 ? displayedUnitsArray : [startOfDay(new Date())], 
        unitCellWidth: calculatedUnitCellWidth 
    };
  }, [horizontalZoomLevel]); // Added horizontalZoomLevel


  const timelineDisplayConfig = React.useMemo(() => {
    if (!isClient) return { displayedUnits: [serverSafeInitialDate], unitCellWidth: 40 }; 
    return getTimelineDisplayConfig(horizontalCurrentStartDate, timelineViewMode, horizontalZoomLevel);
  }, [isClient, horizontalCurrentStartDate, timelineViewMode, getTimelineDisplayConfig, horizontalZoomLevel, serverSafeInitialDate]);

  const currentDisplayedUnits = timelineDisplayConfig.displayedUnits;
  const currentUnitCellWidth = timelineDisplayConfig.unitCellWidth;
  
  const [horizontalDailyData, setHorizontalDailyData] = React.useState<DailyData[]>([]);
  
  React.useEffect(() => {
    if (!isClient || viewMode !== 'horizontal' || subProcessViewMode || !currentDisplayedUnits || currentDisplayedUnits.length === 0 || !horizontalDisplayResources || horizontalDisplayResources.length === 0) {
      setHorizontalDailyData([]);
      return;
    }
    const newDailyData: DailyData[] = [];

    horizontalDisplayResources.forEach(resource => {
      if (resource.type === 'unit' || resource.type === 'holding') {
        currentDisplayedUnits.forEach(dateUnit => { 
            const dateKey = timelineViewMode === 'hourly' ? format(startOfHour(dateUnit), 'yyyy-MM-dd HH:00:00') : format(startOfDay(dateUnit), 'yyyy-MM-dd');
            let calculatedLoadForPeriod = 0;

            rawVerticalTasks.forEach(vTask => { 
                if (vTask.resourceId === resource.id) {
                    const dailyDetail = vTask.dailyData.find(d => {
                        if (!d.date) return false;
                        const taskDate = parseISO(d.date); 
                        if (isNaN(taskDate.getTime())) return false;

                        const unitStart = timelineViewMode === 'hourly' ? startOfHour(dateUnit) : startOfDay(dateUnit);
                        const unitEnd = timelineViewMode === 'hourly' ? addHours(unitStart, 1) : endOfDay(unitStart);
                        
                        return taskDate >= unitStart && taskDate < unitEnd;
                    });

                    if (dailyDetail && dailyDetail.plannedQty > 0) {
                        if (timelineViewMode === 'hourly') {
                            const lc = vTask.learningCurveId ? mockLearningCurves.find(l => l.id === vTask.learningCurveId) : undefined;
                            const workingMinutes = lc?.workingMinutesPerDay || mockLearningCurves[0]?.workingMinutesPerDay || 480;
                            const workHoursInDay = workingMinutes > 0 ? workingMinutes / 60 : 8;
                            
                            const dayEntryForTask = vTask.dailyData.find(d => d.date && isTodayChecker(parseISO(d.date), dateUnit));
                            if (dayEntryForTask) {
                                calculatedLoadForPeriod += dayEntryForTask.plannedQty / Math.max(1, workHoursInDay);
                            }
                        } else {
                            calculatedLoadForPeriod += dailyDetail.plannedQty;
                        }
                    }
                }
            });

            const schedulableRes = schedulableResources.find(r => r.id === resource.id);
            const baseCapacity = schedulableRes?.capacity || 0;

            let standardCapacityForPeriod = 0;
            if (timelineViewMode === 'hourly') {
                const lcForCapacity = mockLearningCurves[0]; 
                const workingMinutes = lcForCapacity?.workingMinutesPerDay || 480;
                const workHoursInDay = workingMinutes > 0 ? workingMinutes / 60 : 8;
                standardCapacityForPeriod = baseCapacity / Math.max(1, workHoursInDay);
            } else {
                standardCapacityForPeriod = baseCapacity;
            }

            newDailyData.push({
                date: dateKey,
                resourceId: resource.id,
                value: Math.round(standardCapacityForPeriod),
                calculatedLoad: Math.round(calculatedLoadForPeriod)
            });
        });
      }
    });
    setHorizontalDailyData(newDailyData);
  }, [rawVerticalTasks, isClient, viewMode, horizontalDisplayResources, timelineViewMode, subProcessViewMode, currentDisplayedUnits, schedulableResources]); 
  

  React.useEffect(() => {
    if (isClient) {
      const currentDateForHolidayLoading = subProcessViewMode ? horizontalCurrentStartDate : (viewMode === 'horizontal' ? horizontalCurrentStartDate : verticalCurrentStartDate);
      if (isNaN(currentDateForHolidayLoading.getTime())) return; // Don't run if date is invalid

      const currentYear = currentDateForHolidayLoading.getFullYear();
      const storedCalendarsDataJson = localStorage.getItem(LOCALSTORAGE_KEY_CALENDARS_DATA);
      let yearHolidays = new Map<string, HolidayDetail>();

      if (storedCalendarsDataJson) {
        try {
          const parsedEntries: [number, [string, HolidayDetail][]][] = JSON.parse(storedCalendarsDataJson);
          const allCalendars = new Map<number, Map<string, HolidayDetail>>();
          parsedEntries.forEach(([year, holidayEntriesArray]) => {
            allCalendars.set(year, new Map(holidayEntriesArray));
          });
          yearHolidays = allCalendars.get(currentYear) || new Map<string, HolidayDetail>();
          
          const referenceMonth = getMonth(currentDateForHolidayLoading);
          if (referenceMonth === 11 || (referenceMonth === 10 && timelineViewMode !== 'hourly')) { 
             const nextYearHolidays = allCalendars.get(currentYear + 1);
             if (nextYearHolidays) nextYearHolidays.forEach((val, key) => yearHolidays.set(key, val));
          }
          if (referenceMonth === 0 || (referenceMonth === 1 && timelineViewMode !== 'hourly')) { 
             const prevYearHolidays = allCalendars.get(currentYear - 1);
             if (prevYearHolidays) prevYearHolidays.forEach((val, key) => yearHolidays.set(key, val));
          }

        } catch (e) {
          console.error("Failed to parse calendarsData from localStorage for PlanView", e);
          yearHolidays = new Map();
        }
      }
      setHolidaysMap(yearHolidays);
    }
  }, [isClient, horizontalCurrentStartDate, verticalCurrentStartDate, viewMode, timelineViewMode, subProcessViewMode]);

  React.useEffect(() => {
    const valueToColorMap = new Map<string, string>();
    let colorIndex = 0;

    const getCategoryKey = (task: Task | VerticalTask): string => {
      if (!task.originalOrderDetails) return task.id; 
      switch (rotationMode) {
        case 'product': return task.originalOrderDetails.style || task.id;
        case 'productType': return task.originalOrderDetails.productType || task.originalOrderDetails.style || task.id;
        case 'customer': return task.originalOrderDetails.buyer || task.id;
        case 'delivery': return task.originalOrderDetails.requestedShipDate || task.id;
        case 'order': 
        default:
          return getBaseOrderId(task.originalOrderDetails.id) || task.id;
      }
    };

    const processTasks = <T extends Task | VerticalTask>(tasksToProcess: T[]): T[] => {
      valueToColorMap.clear(); 
      colorIndex = 0;

      return tasksToProcess.map(task => {
        const key = getCategoryKey(task);
        if (!valueToColorMap.has(key)) {
          valueToColorMap.set(key, ROTATION_COLORS[colorIndex % ROTATION_COLORS.length]);
          colorIndex++;
        }
        const finalDisplayColor = rotationMode === 'order' 
                                  ? (task.color || valueToColorMap.get(key)!) 
                                  : valueToColorMap.get(key)!;
        return { ...task, displayColor: finalDisplayColor };
      });
    };

    setHorizontalTasks(processTasks(rawHorizontalTasks));
    setVerticalTasks(processTasks(rawVerticalTasks));
  }, [rawHorizontalTasks, rawVerticalTasks, rotationMode]);
  
  const generateVerticalTaskDailyData = React.useCallback((
    startDateStr: string,
    endDateStr: string,
    styleCode: string,
    quantity: number,
    learningCurveId?: string
  ): TaskDailyData[] => {
    const start = parseISO(startDateStr);
    const end = parseISO(endDateStr);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
      console.warn(`Invalid date range for generateVerticalTaskDailyData: ${startDateStr} to ${endDateStr}`);
      return [];
    }
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
      const datesInRange = eachDayOfInterval({ start, end });
      const numDaysForTask = Math.max(1, datesInRange.length);
      const avgQtyPerDay = numDaysForTask > 0 ? Math.round(quantity / numDaysForTask) : quantity;
      dailyProductionPlan = datesInRange.map((date) => ({
        date: format(date, 'yyyy-MM-dd'),
        capacity: avgQtyPerDay,
        efficiency: 100
      }));
    }
    
    const totalCalculatedCapacity = dailyProductionPlan.reduce((sum, day) => sum + day.capacity, 0);
    const adjustmentFactor = totalCalculatedCapacity > 0 && quantity > 0 ? quantity / totalCalculatedCapacity : 1;
    let cumulativeQty = 0;
    const adjustedDailyData: TaskDailyData[] = dailyProductionPlan.map(dayPlan => {
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
  }, []);

  const calculateDurationWithLC = React.useCallback((
    order: UnscheduledOrder | undefined, 
    resourceCapacity: number, 
    startDate: Date, 
    learningCurveId?: string
  ): number => {
    if (!order || isNaN(startDate.getTime())) return 1;
    const learningCurveDef = learningCurveId ? mockLearningCurves.find(lc => lc.id === learningCurveId) : undefined;
    let estimatedDurationDays = 1;

    if (learningCurveDef && learningCurveDef.smv > 0 && order.quantity > 0) {
      const plan = calculateDailyProduction(
        learningCurveDef.points,
        learningCurveDef.smv,
        learningCurveDef.workingMinutesPerDay,
        learningCurveDef.operatorsCount,
        365, 
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
    } else if (resourceCapacity > 0 && order.quantity > 0) {
      estimatedDurationDays = Math.max(1, Math.ceil(order.quantity / resourceCapacity));
    } else if (order.quantity === 0) {
      estimatedDurationDays = 1;
    }
    return estimatedDurationDays;
  }, []);

  const generateTaskPlanWithCapacityConstraint = React.useCallback((
    orderOriginalDetails: UnscheduledOrder,
    resource: SchedulableResource,
    startDate: Date,
    currentHolidaysMap: Map<string, HolidayDetail> 
  ): { dailyPlanSegments: TaskDailyData[], actualEndDateStr: string } => {
    const { quantity, style: styleCode, learningCurveId } = orderOriginalDetails;
    const learningCurve = learningCurveId ? mockLearningCurves.find(lc => lc.id === learningCurveId) : undefined;
    
    let remainingQuantity = quantity;
    const dailyPlanSegments: TaskDailyData[] = [];
    let currentDateIterator = startOfDay(startDate);
    let actualEndDate = currentDateIterator;
    let orderProductionDayCounter = 0; 
    let cumulativeQtyPlanned = 0;
    let totalDaysLooped = 0; 

    while (remainingQuantity > 0 || (quantity === 0 && dailyPlanSegments.length === 0) ) { 
      totalDaysLooped++;
      if (totalDaysLooped > (365 * 3)) { 
          console.warn("Exceeded max planning duration (3 years) for task:", orderOriginalDetails.id);
          toast({title: "Planning Error", description: `Exceeded max planning duration for ${orderOriginalDetails.id}`, variant: "destructive"});
          break;
      }

      const currentDateStr = format(currentDateIterator, 'yyyy-MM-dd');
      const holidayDetail = currentHolidaysMap.get(currentDateStr);

      if (holidayDetail && holidayDetail.type === 'full') {
        if (dailyPlanSegments.length === 0 && quantity > 0) { 
            actualEndDate = currentDateIterator;
        }
        currentDateIterator = addDays(currentDateIterator, 1);
        continue; 
      }
      
      orderProductionDayCounter++; 

      let potentialOutputThisDay = resource.capacity; 

      if (learningCurve && learningCurve.smv > 0 && quantity > 0) { 
        const lcDailyPlan = calculateDailyProduction(
          learningCurve.points,
          learningCurve.smv,
          learningCurve.workingMinutesPerDay,
          learningCurve.operatorsCount,
          orderProductionDayCounter, 
          startOfDay(startDate) 
        );
        potentialOutputThisDay = lcDailyPlan[orderProductionDayCounter-1]?.capacity || resource.capacity;
      }

      const plannableCapacityThisDay = Math.min(potentialOutputThisDay, resource.capacity);
      const qtyToPlanThisDay = quantity > 0 ? Math.min(remainingQuantity, plannableCapacityThisDay) : 0;

      if (qtyToPlanThisDay > 0 || (quantity === 0 && dailyPlanSegments.length === 0) ) { 
        cumulativeQtyPlanned += qtyToPlanThisDay;
        dailyPlanSegments.push({
          date: currentDateStr,
          styleCode: styleCode,
          plannedQty: Math.round(qtyToPlanThisDay),
          efficiency: (learningCurve && learningCurve.smv > 0 && quantity > 0 && learningCurve.points.length > 0) 
                        ? (calculateDailyProduction(learningCurve.points, learningCurve.smv, learningCurve.workingMinutesPerDay, learningCurve.operatorsCount, orderProductionDayCounter, startOfDay(startDate)))[orderProductionDayCounter-1]?.efficiency 
                        : 100,
          cumulativeQty: Math.round(cumulativeQtyPlanned),
        });
        remainingQuantity -= qtyToPlanThisDay;
      }
      
      actualEndDate = currentDateIterator; 
      if (remainingQuantity <= 0 && quantity > 0) break; 
      if (quantity === 0 && dailyPlanSegments.length > 0) break; 

      currentDateIterator = addDays(currentDateIterator, 1);
    }
    
    if (dailyPlanSegments.length === 0 && quantity > 0) {
        dailyPlanSegments.push({
            date: format(startDate, 'yyyy-MM-dd'),
            styleCode,
            plannedQty: 0,
            cumulativeQty: 0,
            efficiency: 0
        });
        actualEndDate = startDate; 
    } else if (dailyPlanSegments.length === 0 && quantity === 0) {
        dailyPlanSegments.push({
            date: format(startDate, 'yyyy-MM-dd'),
            styleCode,
            plannedQty: 0,
            cumulativeQty: 0,
            efficiency: 100 
        });
        actualEndDate = startDate;
    }


    return {
      dailyPlanSegments,
      actualEndDateStr: format(actualEndDate, 'yyyy-MM-dd'),
    };
  }, [toast]); 

  const updateTaskInBothViews = React.useCallback((updatedTaskFull: Task | VerticalTask) => {
    const { id, resourceId, startDate, endDate, color, displayColor, learningCurveId, mergedOrderIds, originalOrderDetails, tnaPlan } = updatedTaskFull;

    const baseUpdate = {
      resourceId, startDate, endDate, color, displayColor, learningCurveId, mergedOrderIds,
      originalOrderDetails: originalOrderDetails ? { ...originalOrderDetails } : undefined,
      tnaPlan: tnaPlan ? { ...tnaPlan } : undefined,
    };

    setRawHorizontalTasks(currentTasks =>
      currentTasks.map(task =>
        task.id === id ?
        {
          ...task,
          ...baseUpdate,
          label: ('label' in updatedTaskFull && updatedTaskFull.label) ? updatedTaskFull.label : (originalOrderDetails?.style ? `${originalOrderDetails.style} (${originalOrderDetails.quantity})` : task.label)
        } as Task
        : task
      )
    ); 

    setRawVerticalTasks((currentVTasks) => { 
      return currentVTasks.map((vTask) => {
        if (vTask.id === id) {
          const currentOriginalOrder = originalOrderDetails || vTask.originalOrderDetails;
          if (!currentOriginalOrder) {
             return vTask; 
          }

          const dailyDataToUse = ('dailyData' in updatedTaskFull && updatedTaskFull.dailyData && updatedTaskFull.dailyData.length > 0)
            ? updatedTaskFull.dailyData
            : generateVerticalTaskDailyData(startDate, endDate, currentOriginalOrder.style, currentOriginalOrder.quantity, learningCurveId);

          const updatedTaskData = {
            ...vTask,
            ...baseUpdate,
            orderName: ('orderName' in updatedTaskFull && updatedTaskFull.orderName) ? updatedTaskFull.orderName : (currentOriginalOrder.style ? `${currentOriginalOrder.style} [${currentOriginalOrder.quantity}]` : vTask.orderName),
            imageHint: ('imageHint'in updatedTaskFull && updatedTaskFull.imageHint) ? updatedTaskFull.imageHint : vTask.imageHint || currentOriginalOrder.productType?.toLowerCase() || 'apparel manufacturing',
            dailyData: dailyDataToUse,
          };
          return updatedTaskData as VerticalTask;
        }
        return vTask;
      });
    }); 
  }, [generateVerticalTaskDailyData]); 

  const handleLoadPlanData = React.useCallback((planData: PlanData, planNameToSet: string) => {
    setRawHorizontalTasks(planData.horizontalTasks || []);
    setRawVerticalTasks(planData.verticalTasks || []);
    
    const scheduledBaseIds = new Set([
        ...(planData.horizontalTasks || []).map(ht => getBaseOrderId(ht.originalOrderDetails?.id)),
        ...(planData.verticalTasks || []).map(vt => getBaseOrderId(vt.originalOrderDetails?.id)),
        ...(planData.bucketScheduledTasks || []).map(bt => getBaseOrderId(bt.originalOrderDetails?.id))
    ].filter(Boolean) as string[]);

    const initialUnscheduled = allMockOrdersForDefault.filter(o => !scheduledBaseIds.has(getBaseOrderId(o.id)));
    setUnscheduledOrders(planData.bucketUnscheduledOrders && planData.bucketUnscheduledOrders.length > 0 ? planData.bucketUnscheduledOrders : initialUnscheduled);

    setActivePlanName(planNameToSet);
  }, []); 

  const handleActivePlanChange = React.useCallback((newPlanId: string, newPlanName: string) => {
    setActivePlanId(newPlanId);
    setActivePlanName(newPlanName);
  }, []);

  const isPastDay = React.useCallback((dateToCheck: Date): boolean => {
    if (!isClient || isNaN(dateToCheck.getTime())) return true; 
    const todayStart = startOfDay(new Date());
    return dateToCheck < todayStart;
  }, [isClient]);

  const isPastHour = React.useCallback((dateTimeToCheck: Date): boolean => {
    if (!isClient || isNaN(dateTimeToCheck.getTime())) return true;
    const now = new Date();
    const currentHourStart = startOfHour(now);
    return dateTimeToCheck < currentHourStart;
  }, [isClient]);

  const handleRotationModeChange = React.useCallback((newMode: RotationMode) => {
    setRotationMode(newMode);
  }, []);
  
  const handleTimelineViewModeChange = React.useCallback((newMode: TimelineViewMode) => {
    setTimelineViewMode(newMode);
  }, []);
  
  const handleDateChange = React.useCallback((newDateFromPicker: Date) => {
    if (isNaN(newDateFromPicker.getTime())) return;
    const newCleanDate = startOfDay(newDateFromPicker);

    if (subProcessViewMode) {
      const currentCleanHorizontalStartDate = startOfDay(horizontalCurrentStartDate);
      if (newCleanDate.getTime() !== currentCleanHorizontalStartDate.getTime()) {
        setHorizontalCurrentStartDate(newCleanDate);
      }
    } else if (viewMode === 'horizontal') {
      let adjustedStartDate = newCleanDate;
      if (timelineViewMode === 'weekly') adjustedStartDate = startOfWeek(newCleanDate, { weekStartsOn: 1 });
      else if (timelineViewMode === 'monthly') adjustedStartDate = startOfMonth(newCleanDate);
      
      const currentCleanHorizontalStartDate = startOfDay(horizontalCurrentStartDate);
      if (adjustedStartDate.getTime() !== currentCleanHorizontalStartDate.getTime()) {
        setHorizontalCurrentStartDate(adjustedStartDate);
      }
    } else { 
      const currentCleanVerticalStartDate = startOfDay(verticalCurrentStartDate);
      if (newCleanDate.getTime() !== currentCleanVerticalStartDate.getTime()) {
        setVerticalCurrentStartDate(newCleanDate);
      }
    }
  }, [subProcessViewMode, viewMode, horizontalCurrentStartDate, verticalCurrentStartDate, timelineViewMode]);
  
  const handleHorizontalZoomChange = React.useCallback((newZoom: number) => {
      setHorizontalZoomLevel(newZoom);
  }, []);

  const handleToggleExpandResource = React.useCallback((resourceId: string) => {
    setExpandedResourceId(prev => prev === resourceId ? null : resourceId);
  }, []);
  
  const handleToggleSelectedResource = React.useCallback((resourceId: string) => {
    setSelectedResourceIds(prevSelected => {
      const newSelected = prevSelected.includes(resourceId) ? prevSelected.filter(id => id !== resourceId) : [...prevSelected, resourceId];
      return newSelected;
    });
  }, []);
  
  const handleScheduleUnscheduledOrder = React.useCallback((orderId: string, targetResourceId: string, startDateString: string) => {
    const order = unscheduledOrders.find(o => o.id === orderId);
    if (!order) {
      toast({title: "Error Scheduling", description: `Order ${orderId} not found.`, variant: "destructive"});
      return;
    }
    
    const parsedStartDate = parseISO(startDateString);
    if (isNaN(parsedStartDate.getTime())) {
      toast({ title: "Error Scheduling", description: `Invalid start date: ${startDateString}`, variant: "destructive" });
      return;
    }

    if ((timelineViewMode === 'hourly' && isPastHour(parsedStartDate)) || (timelineViewMode !== 'hourly' && isPastDay(parsedStartDate))) {
        toast({ title: "Cannot Schedule", description: "Cannot schedule orders in past dates/hours.", variant: "destructive" });
        return;
    }
    const holidayInfo = holidaysMap.get(format(parsedStartDate, 'yyyy-MM-dd'));
    if (holidayInfo && holidayInfo.type === 'full') {
      toast({ title: "Cannot Schedule", description: "Cannot schedule task start on a full holiday.", variant: "destructive" });
      return;
    }

    const targetResource = schedulableResources.find(r => r.id === targetResourceId);
    if (!targetResource) {
        toast({ title: "Error Scheduling", description: `Target resource ${targetResourceId} not found.`, variant: "destructive" });
        return;
    }

    const { dailyPlanSegments, actualEndDateStr } = generateTaskPlanWithCapacityConstraint(order, targetResource, parsedStartDate, holidaysMap);
    
    const newTaskId = `task-${getBaseOrderId(order.id)}-sch-${taskCounterRef.current.value++}`;

    const commonDetails = {
      id: newTaskId,
      resourceId: targetResourceId,
      startDate: format(parsedStartDate, 'yyyy-MM-dd'),
      endDate: actualEndDateStr,
      color: 'bg-purple-500 text-white', 
      displayColor: 'bg-purple-500 text-white',
      originalOrderDetails: { ...order },
      learningCurveId: order.learningCurveId,
    };

    const newRawHorizontalTask: Task = {
      ...commonDetails,
      label: `${order.style} (${order.quantity})`,
    };
    const newRawVerticalTask: VerticalTask = {
      ...commonDetails,
      orderName: `${order.style} [${order.quantity}]`,
      imageHint: order.imageHint || order.productType?.toLowerCase() || 'apparel fashion',
      dailyData: dailyPlanSegments,
    };

    setRawHorizontalTasks(prevTasks => [...prevTasks, newRawHorizontalTask]);
    setRawVerticalTasks(prevVTasks => [...prevVTasks, newRawVerticalTask]);
    setUnscheduledOrders(prevOrders => prevOrders.filter(o => o.id !== orderId));
    toast({ title: "Order Scheduled", description: `Order ${order.id} scheduled as ${newTaskId}.` });
  }, [unscheduledOrders, timelineViewMode, isPastHour, isPastDay, holidaysMap, schedulableResources, toast, generateTaskPlanWithCapacityConstraint, taskCounterRef]);


  const handleHorizontalTaskUpdate = React.useCallback((taskId: string, newResourceId: string, newStartDateString: string, newEndDateStringFromResize: string) => {
    const sourceTaskForUpdate = rawHorizontalTasks.find(t => t.id === taskId);
    if (!sourceTaskForUpdate || !sourceTaskForUpdate.originalOrderDetails) {
      toast({ title: "Update Error", description: `Task ${taskId} original details not found.`, variant: "destructive" });
      return;
    }

    const parsedNewStartDate = parseISO(newStartDateString);
    if (isNaN(parsedNewStartDate.getTime())) {
      toast({ title: "Update Error", description: `Invalid start date: ${newStartDateString}`, variant: "destructive" });
      return;
    }
    if ((timelineViewMode === 'hourly' && isPastHour(parsedNewStartDate)) || (timelineViewMode !== 'hourly' && isPastDay(parsedNewStartDate))) {
      toast({ title: "Cannot Update", description: "Cannot move task to a past time.", variant: "destructive" });
      return;
    }
    const holidayInfo = holidaysMap.get(format(parsedNewStartDate, 'yyyy-MM-dd'));
    if (holidayInfo && holidayInfo.type === 'full') {
      toast({ title: "Cannot Update", description: "Cannot schedule task start on a full holiday.", variant: "destructive" });
      return;
    }
    
    const targetResource = schedulableResources.find(r => r.id === newResourceId);
    if (!targetResource) {
        toast({ title: "Update Error", description: `Target resource ${newResourceId} not found.`, variant: "destructive" });
        return;
    }
    
    const originalOrder = sourceTaskForUpdate.originalOrderDetails;
    let finalEndDateStr = newEndDateStringFromResize;
    let finalDailyPlanSegments: TaskDailyData[] = [];

    const { dailyPlanSegments, actualEndDateStr } = generateTaskPlanWithCapacityConstraint(
        originalOrder, targetResource, parsedNewStartDate, holidaysMap
    );
    finalEndDateStr = actualEndDateStr;
    finalDailyPlanSegments = dailyPlanSegments;
    
    const updatedTaskProps = { 
        ...sourceTaskForUpdate, 
        resourceId: newResourceId, 
        startDate: newStartDateString, 
        endDate: finalEndDateStr, 
    };
    
    // For VerticalTask, we need to ensure orderName is present
    const orderName: string = ('orderName' in sourceTaskForUpdate && typeof sourceTaskForUpdate.orderName === 'string') 
        ? sourceTaskForUpdate.orderName 
        : `${originalOrder?.style || 'Unknown'} [${originalOrder?.quantity || 0}]`;
    
    updateTaskInBothViews({ 
        ...updatedTaskProps, 
        orderName,
        dailyData: finalDailyPlanSegments 
    } as VerticalTask); 
    toast({ title: "Task Updated (H)", description: `Task ${getBaseOrderId(sourceTaskForUpdate.originalOrderDetails?.id || sourceTaskForUpdate.id)} moved/resized.` });
  }, [rawHorizontalTasks, timelineViewMode, isPastHour, isPastDay, holidaysMap, schedulableResources, toast, generateTaskPlanWithCapacityConstraint, updateTaskInBothViews]);

  const handleVerticalTaskUpdate = React.useCallback((taskId: string, newResourceId: string, newStartDateStr: string, newEndDateStrFromResize: string) => {
    const taskToUpdate = rawVerticalTasks.find(t => t.id === taskId);
     if (!taskToUpdate || !taskToUpdate.originalOrderDetails) {
      toast({ title: "Update Error", description: `Task ${taskId} or its details not found.`, variant: "destructive" });
      return;
    }
    const parsedNewStartDate = parseISO(newStartDateStr);
    if (isNaN(parsedNewStartDate.getTime())) {
      toast({ title: "Update Error", description: `Invalid start date: ${newStartDateStr}`, variant: "destructive" });
      return;
    }
    if (isPastDay(parsedNewStartDate) && !isTodayChecker(parsedNewStartDate, new Date())) { 
      toast({ title: "Cannot Update", description: "Cannot move task to a past date.", variant: "destructive" });
      return;
    }
    const holidayInfo = holidaysMap.get(newStartDateStr); 
    if (holidayInfo && holidayInfo.type === 'full') {
      toast({ title: "Cannot Update", description: "Cannot schedule task start on a full holiday.", variant: "destructive" });
      return;
    }

    const targetResource = schedulableResources.find(r => r.id === newResourceId);
    if (!targetResource) {
        toast({ title: "Update Error", description: `Target resource ${newResourceId} not found.`, variant: "destructive" });
        return;
    }

    const originalOrder = taskToUpdate.originalOrderDetails;
    const { dailyPlanSegments, actualEndDateStr } = generateTaskPlanWithCapacityConstraint(originalOrder, targetResource, parsedNewStartDate, holidaysMap);
    
    const updatedTaskProps = { 
        ...taskToUpdate, 
        resourceId: newResourceId, 
        startDate: newStartDateStr, 
        endDate: actualEndDateStr,
        dailyData: dailyPlanSegments 
    };
    updateTaskInBothViews(updatedTaskProps as VerticalTask); 
    toast({ title: 'Task Updated (V)', description: `Task ${getBaseOrderId(taskToUpdate.originalOrderDetails?.id || taskToUpdate.id)} moved/resized.` });
  }, [rawVerticalTasks, isPastDay, holidaysMap, schedulableResources, toast, generateTaskPlanWithCapacityConstraint, updateTaskInBothViews, isTodayChecker]);

  const handleUndoAllocation = React.useCallback((taskId: string) => {
    let orderToUnschedule: UnscheduledOrder | undefined;
    let taskLabelForToast: string | undefined;

    const hTask = rawHorizontalTasks.find(t => t.id === taskId);
    const vTask = rawVerticalTasks.find(vt => vt.id === taskId);
    const taskSource = hTask || vTask;

    if (taskSource && taskSource.originalOrderDetails) {
        orderToUnschedule = { ...taskSource.originalOrderDetails };
        taskLabelForToast = ('label' in taskSource && taskSource.label) ? taskSource.label : (('orderName' in taskSource && taskSource.orderName) ? taskSource.orderName : taskSource.id);
    }

    setRawHorizontalTasks(prevTasks => prevTasks.filter(t => t.id !== taskId));
    setRawVerticalTasks(prevVTasks => prevVTasks.filter(t => t.id !== taskId));

    if (orderToUnschedule) {
      const baseUnscheduledId = getBaseOrderId(orderToUnschedule.id);
      orderToUnschedule.id = baseUnscheduledId; 
      orderToUnschedule.reason = `Unloaded from plan (${new Date().toLocaleTimeString()})`;
      
      setUnscheduledOrders(prevUnscheduled => {
        const existingUnscheduledIndex = prevUnscheduled.findIndex(uo => getBaseOrderId(uo.id) === baseUnscheduledId);
        
        if (existingUnscheduledIndex > -1 && orderToUnschedule) {
            const updatedOrders = [...prevUnscheduled];
            if(updatedOrders[existingUnscheduledIndex].id !== orderToUnschedule.id && orderToUnschedule.quantity > 0) { 
                 updatedOrders[existingUnscheduledIndex].reason += `; another part also unloaded`;
                 updatedOrders[existingUnscheduledIndex].quantity += orderToUnschedule.quantity; 
            } else { 
                 updatedOrders[existingUnscheduledIndex] = orderToUnschedule;
            }
            updatedOrders[existingUnscheduledIndex].id = baseUnscheduledId; 
            return updatedOrders.sort((a,b) => (a.id || "").localeCompare(b.id || ""));
        } else if (orderToUnschedule) {
            if (!prevUnscheduled.some(uo => getBaseOrderId(uo.id) === baseUnscheduledId)) {
                 return [{...orderToUnschedule, id: baseUnscheduledId}, ...prevUnscheduled].sort((a,b) => (a.id || "").localeCompare(b.id || ""));
            } else { 
                const updatedUnscheduled = prevUnscheduled.map(uo => {
                    if (getBaseOrderId(uo.id) === baseUnscheduledId) {
                        return {...uo, reason: orderToUnschedule!.reason, quantity: uo.quantity + orderToUnschedule!.quantity, id: baseUnscheduledId};
                    }
                    return uo;
                });
                 if(!updatedUnscheduled.find(uo => getBaseOrderId(uo.id) === baseUnscheduledId)) {
                   updatedUnscheduled.push({...orderToUnschedule, id: baseUnscheduledId});
                }
                return updatedUnscheduled.sort((a,b) => (a.id || "").localeCompare(b.id || ""));
            }
        }
        return prevUnscheduled;
      });
      toast({ title: 'Order Unscheduled', description: `Order for style ${orderToUnschedule.style || taskLabelForToast} moved to unscheduled list.` });
    } else if (taskLabelForToast) {
      toast({ title: 'Undo Partial', description: `Task ${taskId} (${taskLabelForToast}) removed. Original details for unscheduling were incomplete.`, variant: "destructive" });
    } else {
      toast({ title: 'Undo Failed', description: `Task ${taskId} not found.`, variant: "destructive" });
    }
  }, [toast, rawHorizontalTasks, rawVerticalTasks]);

  const openSplitTaskDialog = React.useCallback((task: Task | VerticalTask) => {
    if (!task.originalOrderDetails || task.originalOrderDetails.quantity <= 1) {
      toast({ title: "Cannot Split Task", description: "Task quantity must be greater than 1 to split.", variant: "destructive" }); return;
    }
    setTaskToSplit(task); setIsSplitTaskDialogOpen(true);
  }, [toast]);

  const handleConfirmSplitTask = React.useCallback((enteredQuantity: number, splitMode: 'retain' | 'remove') => {
    if (!taskToSplit || !taskToSplit.originalOrderDetails) {
      toast({ title: "Split Error", description: "No task selected for splitting.", variant: "destructive"});
      setIsSplitTaskDialogOpen(false); setTaskToSplit(null);
      return;
    }
    const originalTask = taskToSplit;
    const originalTaskID = originalTask.id;
    
    // Add null safety check for originalOrderDetails
    if (!originalTask.originalOrderDetails) {
      toast({ title: "Split Error", description: "Task missing order details.", variant: "destructive"});
      setIsSplitTaskDialogOpen(false); setTaskToSplit(null);
      return;
    }
    
    const originalQty = originalTask.originalOrderDetails.quantity;
    const baseOriginalOrderId = getBaseOrderId(originalTask.originalOrderDetails.id);
    const styleCode = originalTask.originalOrderDetails.style;
    
    let quantityForFirstPart: number;
    let quantityForSecondPart: number;

    if (splitMode === 'retain') {
      quantityForFirstPart = enteredQuantity;
      quantityForSecondPart = originalQty - enteredQuantity;
    } else { 
      quantityForSecondPart = enteredQuantity;
      quantityForFirstPart = originalQty - enteredQuantity;
    }

    if (quantityForFirstPart <= 0 || quantityForSecondPart <= 0) {
      toast({ title: "Invalid Split Quantity", description: "Both parts must have a quantity greater than 0.", variant: "destructive" });
      setIsSplitTaskDialogOpen(false); setTaskToSplit(null); return;
    }

    const parsedOriginalStartDate = parseISO(originalTask.startDate);
    if (isPastDay(parsedOriginalStartDate) && !isTodayChecker(parsedOriginalStartDate, new Date())) {
        toast({ title: "Cannot Split", description: "Cannot split a task starting in the past.", variant: "destructive" });
        setIsSplitTaskDialogOpen(false); setTaskToSplit(null); return;
    }
    
    const targetResource = schedulableResources.find(r => r.id === originalTask.resourceId);
    if (!targetResource) {
        toast({ title: "Split Error", description: "Resource not found for task.", variant: "destructive" });
        setIsSplitTaskDialogOpen(false); setTaskToSplit(null); return;
    }

    const originalOrderDetailsForPart1: UnscheduledOrder = { ...originalTask.originalOrderDetails, id: `${baseOriginalOrderId}-splitA-${taskCounterRef.current.value++}`, quantity: quantityForFirstPart };
    const { dailyPlanSegments: dailyPlan1, actualEndDateStr: end1Str } = generateTaskPlanWithCapacityConstraint(originalOrderDetailsForPart1, targetResource, parsedOriginalStartDate, holidaysMap);
    
    const parsedEnd1Date = parseISO(end1Str);
    let start2Date = addDays(parsedEnd1Date, 1); 
    while(holidaysMap.get(format(start2Date, 'yyyy-MM-dd'))?.type === 'full' || (isPastDay(start2Date) && !isTodayChecker(start2Date, new Date()))) {
        start2Date = addDays(start2Date, 1);
    }
    
    const originalOrderDetailsForPart2: UnscheduledOrder = { ...originalTask.originalOrderDetails, id: `${baseOriginalOrderId}-splitB-${taskCounterRef.current.value++}`, quantity: quantityForSecondPart };
    const { dailyPlanSegments: dailyPlan2, actualEndDateStr: end2Str } = generateTaskPlanWithCapacityConstraint(originalOrderDetailsForPart2, targetResource, start2Date, holidaysMap);

    const baseColor = originalTask.color || 'bg-orange-500 text-white'; 
    const displayColor = originalTask.displayColor || baseColor; 
    const commonPartProps = { 
        resourceId: targetResource.id, color: baseColor, displayColor: displayColor, 
        learningCurveId: originalTask.learningCurveId, tnaPlan: originalTask.tnaPlan 
    };

    const newHTask1: Task = {
      id: originalOrderDetailsForPart1.id, 
      ...commonPartProps,
      label: `${styleCode} (S1-${quantityForFirstPart})`,
      startDate: originalTask.startDate, 
      endDate: end1Str,
      originalOrderDetails: originalOrderDetailsForPart1,
    };
    const newVTask1: VerticalTask = {
      id: originalOrderDetailsForPart1.id,
      ...commonPartProps,
      orderName: `${styleCode} [S1-${quantityForFirstPart}]`,
      imageHint: ('imageHint' in originalTask && originalTask.imageHint) ? originalTask.imageHint : originalTask.originalOrderDetails.productType?.toLowerCase(),
      startDate: originalTask.startDate,
      endDate: end1Str,
      dailyData: dailyPlan1,
      originalOrderDetails: originalOrderDetailsForPart1,
    };
    const newHTask2: Task = {
      id: originalOrderDetailsForPart2.id,
      ...commonPartProps,
      label: `${styleCode} (S2-${quantityForSecondPart})`,
      startDate: format(start2Date, 'yyyy-MM-dd'),
      endDate: end2Str,
      originalOrderDetails: originalOrderDetailsForPart2,
    };
    const newVTask2: VerticalTask = {
      id: originalOrderDetailsForPart2.id,
      ...commonPartProps,
      orderName: `${styleCode} [S2-${quantityForSecondPart}]`,
      imageHint: ('imageHint' in originalTask && originalTask.imageHint) ? originalTask.imageHint : originalTask.originalOrderDetails.productType?.toLowerCase(),
      startDate: format(start2Date, 'yyyy-MM-dd'),
      endDate: end2Str,
      dailyData: dailyPlan2,
      originalOrderDetails: originalOrderDetailsForPart2,
    };

    setRawHorizontalTasks(prev => [...prev.filter(t => t.id !== originalTaskID), newHTask1, newHTask2]);
    setRawVerticalTasks(prev => [...prev.filter(t => t.id !== originalTaskID), newVTask1, newVTask2]);
    toast({ title: "Task Split", description: `Task for style ${styleCode} split into quantities ${quantityForFirstPart} and ${quantityForSecondPart}.` });
    setIsSplitTaskDialogOpen(false); setTaskToSplit(null);
  }, [taskToSplit, holidaysMap, isPastDay, schedulableResources, toast, generateTaskPlanWithCapacityConstraint, isTodayChecker, taskCounterRef]);

  const handleOpenMergeDialog = React.useCallback((task: Task | VerticalTask) => {
    if (!task.originalOrderDetails?.buyer) {
      toast({ title: "Cannot Merge", description: "Task has no buyer information.", variant: "destructive" });
      return;
    }
    const buyer = task.originalOrderDetails.buyer;
    const mergeables: MergeableOrderItem[] = [];
    const allScheduledTasksMap = new Map<string, Task | VerticalTask>();
    rawHorizontalTasks.forEach(t => allScheduledTasksMap.set(t.id, t));
    rawVerticalTasks.forEach(t => { 
        if (!allScheduledTasksMap.has(t.id)) {
            allScheduledTasksMap.set(t.id, t);
        }
    });

    allScheduledTasksMap.forEach(scheduledTask => {
        if (scheduledTask.id !== task.id && scheduledTask.originalOrderDetails?.buyer === buyer) {
            mergeables.push({
                id: scheduledTask.id,
                displayLabel: `${('label' in scheduledTask ? scheduledTask.label : (scheduledTask as VerticalTask).orderName)} (Scheduled)`,
                type: 'task',
                buyer: scheduledTask.originalOrderDetails.buyer,
                quantity: scheduledTask.originalOrderDetails.quantity,
                style: scheduledTask.originalOrderDetails.style,
                productType: scheduledTask.originalOrderDetails.productType,
                taskDetails: scheduledTask, 
            });
        }
    });

    unscheduledOrders.forEach(uo => {
      if (uo.buyer === buyer) {
        mergeables.push({
          id: uo.id,
          displayLabel: `${uo.style} (${uo.quantity}) (Unscheduled)`,
          type: 'unscheduled_order',
          buyer: uo.buyer,
          quantity: uo.quantity,
          style: uo.style,
          productType: uo.productType,
          originalOrderDetails: uo, 
        });
      }
    });

    if (mergeables.length === 0) {
      toast({ title: "No Orders to Merge", description: `No other orders found for buyer ${buyer}.`, variant: "default" });
      return;
    }

    setTaskToMerge(task);
    setMergeableOrdersForDialog(mergeables);
    setIsMergeOrdersDialogOpen(true);
  }, [rawHorizontalTasks, rawVerticalTasks, unscheduledOrders, toast]);

  const handleConfirmMergeOrders = React.useCallback((selectedIdsToMerge: string[]) => {
    if (!taskToMerge || !taskToMerge.originalOrderDetails || selectedIdsToMerge.length === 0) {
      toast({ title: "Merge Cancelled", description: "No orders selected for merge or original task is invalid.", variant: "destructive" });
      setIsMergeOrdersDialogOpen(false);
      return;
    }

    const parsedOriginalStartDate = parseISO(taskToMerge.startDate);
    if (isPastDay(parsedOriginalStartDate) && !isTodayChecker(parsedOriginalStartDate, new Date())) {
        toast({ title: "Cannot Merge", description: "Cannot merge starting from a past date.", variant: "destructive" });
        setIsMergeOrdersDialogOpen(false); return;
    }
    const holidayInfoPrimary = holidaysMap.get(format(parsedOriginalStartDate, 'yyyy-MM-dd'));
    if (holidayInfoPrimary && holidayInfoPrimary.type === 'full') {
      toast({ title: "Cannot Merge", description: "Cannot start merged task on a full holiday.", variant: "destructive" });
      setIsMergeOrdersDialogOpen(false); return;
    }

    const targetResource = schedulableResources.find(r => r.id === taskToMerge.resourceId);
    if (!targetResource) {
      toast({ title: "Merge Error", description: "Resource for merge target not found.", variant: "destructive" });
      setIsMergeOrdersDialogOpen(false); return;
    }

    let totalQuantity = taskToMerge.originalOrderDetails.quantity;
    const mergedOrderDescriptions: string[] = [`${taskToMerge.originalOrderDetails.style} (${taskToMerge.originalOrderDetails.quantity})`];
    const mergedSourceItemIdsSet = new Set<string>([taskToMerge.id]);
    let primaryLearningCurveId = taskToMerge.learningCurveId;
    let earliestRequestedShipDate = taskToMerge.originalOrderDetails.requestedShipDate;
    let primaryTnaPlan = taskToMerge.tnaPlan; 
    const allMergedBaseOrderIds = new Set<string>([getBaseOrderId(taskToMerge.originalOrderDetails.id)]);


    selectedIdsToMerge.forEach(id => {
      const item = mergeableOrdersForDialog.find(mo => mo.id === id);
      if (item) {
        totalQuantity += item.quantity;
        mergedOrderDescriptions.push(`${item.style} (${item.quantity})`);
        mergedSourceItemIdsSet.add(item.id); 

        if (item.originalOrderDetails) {
            if (parseISO(item.originalOrderDetails.requestedShipDate) < parseISO(earliestRequestedShipDate)) {
                earliestRequestedShipDate = item.originalOrderDetails.requestedShipDate;
            }
            allMergedBaseOrderIds.add(getBaseOrderId(item.originalOrderDetails.id));
        }
        
        if (item.type === 'task' && item.taskDetails) {
          if (item.taskDetails.learningCurveId && !primaryLearningCurveId) primaryLearningCurveId = item.taskDetails.learningCurveId;
        } else if (item.type === 'unscheduled_order' && item.originalOrderDetails) {
           if (item.originalOrderDetails.learningCurveId && !primaryLearningCurveId) primaryLearningCurveId = item.originalOrderDetails.learningCurveId;
        }
      }
    });

    const mergedTaskOriginalDetails: UnscheduledOrder = {
      id: `merged-${Array.from(allMergedBaseOrderIds).slice(0,2).join('_')}-${taskCounterRef.current.value++}`,
      buyer: taskToMerge.originalOrderDetails.buyer,
      style: `MERGED (${allMergedBaseOrderIds.size}): ${mergedOrderDescriptions.slice(0,2).join('; ')}${mergedOrderDescriptions.length > 2 ? '...' : ''}`.substring(0,100), 
      productType: taskToMerge.originalOrderDetails.productType,
      quantity: totalQuantity,
      requestedShipDate: earliestRequestedShipDate,
      reason: 'Merged Order',
      learningCurveId: primaryLearningCurveId,
      imageHint: taskToMerge.originalOrderDetails.imageHint, 
    };

    const { dailyPlanSegments, actualEndDateStr } = generateTaskPlanWithCapacityConstraint(mergedTaskOriginalDetails, targetResource, parsedOriginalStartDate, holidaysMap);

    const mergedColor = 'bg-green-600 text-white'; 

    const commonMergedProps = {
        resourceId: targetResource.id, color: mergedColor, displayColor: mergedColor,
        originalOrderDetails: mergedTaskOriginalDetails, learningCurveId: primaryLearningCurveId,
        mergedOrderIds: Array.from(allMergedBaseOrderIds), 
        tnaPlan: primaryTnaPlan 
    };

    const newHTask: Task = {
      id: mergedTaskOriginalDetails.id, 
      ...commonMergedProps,
      label: mergedTaskOriginalDetails.style, 
      startDate: taskToMerge.startDate, 
      endDate: actualEndDateStr,
    };
    const newVTask: VerticalTask = {
      id: mergedTaskOriginalDetails.id,
      ...commonMergedProps,
      orderName: mergedTaskOriginalDetails.style,
      imageHint: mergedTaskOriginalDetails.imageHint || taskToMerge.originalOrderDetails.productType?.toLowerCase() || 'apparel collage',
      startDate: taskToMerge.startDate,
      endDate: actualEndDateStr,
      dailyData: dailyPlanSegments,
    };

    setRawHorizontalTasks(prev => [...prev.filter(t => !mergedSourceItemIdsSet.has(t.id)), newHTask]);
    setRawVerticalTasks(prev => [...prev.filter(t => !mergedSourceItemIdsSet.has(t.id)), newVTask]);
    setUnscheduledOrders(prev => prev.filter(uo => !mergedSourceItemIdsSet.has(uo.id)));

    toast({ title: "Orders Merged", description: `${mergedOrderDescriptions.length} orders/parts merged into a new task.` });
    setIsMergeOrdersDialogOpen(false); setTaskToMerge(null);
  }, [taskToMerge, holidaysMap, isPastDay, mergeableOrdersForDialog, schedulableResources, toast, generateTaskPlanWithCapacityConstraint, rawHorizontalTasks, rawVerticalTasks, unscheduledOrders, isTodayChecker, taskCounterRef]);
  
  const startPushPullMode = React.useCallback((taskId: string, scope: 'orderOnly' | 'linkedOrders') => {
    const originTask = rawHorizontalTasks.find(t => t.id === taskId) || rawVerticalTasks.find(vt => vt.id === taskId);
    if (!originTask || !originTask.originalOrderDetails) {
        toast({ title: "Error", description: "Cannot initiate Push/Pull. Original task details missing.", variant: "destructive" });
        return;
    }
    setPushPullState({ isActive: true, originTaskId: taskId, scope });
    toast({
      title: "Push/Pull Mode Activated",
      description: `Scope: ${scope === 'orderOnly' ? 'This order only' : 'All linked parts'}. Click target line & date. ESC to cancel.`,
      duration: 7000,
    });
  }, [rawHorizontalTasks, rawVerticalTasks, toast]);

  const cancelPushPullMode = React.useCallback(() => {
    setPushPullState({ isActive: false, originTaskId: null, scope: null });
    toast({ title: "Push/Pull Mode Cancelled", duration: 3000 });
   }, [toast]);

  const executePushPull = React.useCallback((
    originTaskId: string,
    currentScope: 'orderOnly' | 'linkedOrders',
    targetResourceId: string,
    targetDateString: string
  ) => {
    if (!originTaskId || !currentScope) { cancelPushPullMode(); return; }

    const originTaskDetails = rawHorizontalTasks.find(t => t.id === originTaskId) || rawVerticalTasks.find(vt => vt.id === originTaskId);

    if (!originTaskDetails || !originTaskDetails.originalOrderDetails) {
      toast({ title: "Error", description: "Original task for Push/Pull not found.", variant: "destructive" });
      cancelPushPullMode(); return;
    }
    const newStartDateObj = parseISO(targetDateString);
    if (isNaN(newStartDateObj.getTime()) || (isPastDay(newStartDateObj) && !isTodayChecker(newStartDateObj, new Date()))) {
        toast({ title: "Cannot Apply", description: "Cannot shift task(s) to a past/invalid date.", variant: "destructive" });
        cancelPushPullMode(); return;
    }
    const holidayInfo = holidaysMap.get(format(newStartDateObj, 'yyyy-MM-dd'));
    if (holidayInfo && holidayInfo.type === 'full') {
      toast({ title: "Cannot Apply", description: "Target start date for Push/Pull is a full holiday.", variant: "destructive" });
      cancelPushPullMode(); return;
    }
    const targetResource = schedulableResources.find(r => r.id === targetResourceId);
    if (!targetResource) {
        toast({ title: "Error", description: `Target resource ${targetResourceId} not found.`, variant: "destructive" });
        cancelPushPullMode(); return;
    }

    const baseOriginalId = getBaseOrderId(originTaskDetails.originalOrderDetails.id);
    let tasksToShiftDetails: { task: Task | VerticalTask, originalOrder: UnscheduledOrder }[] = [];

    if (currentScope === 'orderOnly') {
      tasksToShiftDetails.push({ task: originTaskDetails, originalOrder: originTaskDetails.originalOrderDetails });
    } else if (currentScope === 'linkedOrders') {
      const allScheduledTasksMap = new Map<string, Task | VerticalTask>();
      rawHorizontalTasks.forEach(t => allScheduledTasksMap.set(t.id, t));
      rawVerticalTasks.forEach(t => { if (!allScheduledTasksMap.has(t.id)) allScheduledTasksMap.set(t.id, t);});
      
      allScheduledTasksMap.forEach(t => {
        if (t.originalOrderDetails && getBaseOrderId(t.originalOrderDetails.id) === baseOriginalId) {
          tasksToShiftDetails.push({ task: t, originalOrder: t.originalOrderDetails });
        }
      });
    }
    tasksToShiftDetails.sort((a,b)=> parseISO(a.task.startDate).getTime() - parseISO(b.task.startDate).getTime() );
    
    let currentProcessingStartDate = newStartDateObj; 
    let affectedCount = 0;
    const updatedHTasksArray: Task[] = [];
    const updatedVTasksArray: VerticalTask[] = [];
    const shiftedTaskIds = new Set(tasksToShiftDetails.map(item => item.task.id));

    for (const { task, originalOrder } of tasksToShiftDetails) {
        affectedCount++;
        let validStartDateForThisTask = currentProcessingStartDate;
        while(holidaysMap.get(format(validStartDateForThisTask, 'yyyy-MM-dd'))?.type === 'full' || (isPastDay(validStartDateForThisTask) && !isTodayChecker(validStartDateForThisTask, new Date()))) {
            validStartDateForThisTask = addDays(validStartDateForThisTask, 1);
        }

        const { dailyPlanSegments, actualEndDateStr } = generateTaskPlanWithCapacityConstraint(originalOrder, targetResource, validStartDateForThisTask, holidaysMap);
        
        const commonUpdatedProps = { 
          ...task, 
          resourceId: targetResourceId, 
          startDate: format(validStartDateForThisTask, 'yyyy-MM-dd'),
          endDate: actualEndDateStr,
        };

        updatedHTasksArray.push({
            ...commonUpdatedProps,
            label: ('label' in task && task.label) ? task.label : `${originalOrder.style} (${originalOrder.quantity})`, 
        } as Task);
        
        updatedVTasksArray.push({
            ...commonUpdatedProps,
            orderName: ('orderName' in task && task.orderName) ? task.orderName : `${originalOrder.style} [${originalOrder.quantity}]`,
            imageHint: ('imageHint' in task && task.imageHint) ? task.imageHint : originalOrder.imageHint,
            dailyData: dailyPlanSegments,
        } as VerticalTask);

        currentProcessingStartDate = addDays(parseISO(actualEndDateStr), 1);
        while(holidaysMap.get(format(currentProcessingStartDate, 'yyyy-MM-dd'))?.type === 'full') {
            currentProcessingStartDate = addDays(currentProcessingStartDate, 1);
        }
    }

    setRawHorizontalTasks(prev => [...prev.filter(t => !shiftedTaskIds.has(t.id)), ...updatedHTasksArray]);
    setRawVerticalTasks(prev => [...prev.filter(t => !shiftedTaskIds.has(t.id)), ...updatedVTasksArray]);
    
    toast({ title: "Push/Pull Applied", description: `${affectedCount} task part(s) shifted to ${targetResource.name}.` });
    cancelPushPullMode();
  }, [rawHorizontalTasks, rawVerticalTasks, holidaysMap, isPastDay, schedulableResources, toast, cancelPushPullMode, generateTaskPlanWithCapacityConstraint, isTodayChecker]);

  const handleOpenOrderStatusDialog = React.useCallback((task: Task | VerticalTask) => {
    setSelectedTaskForStatus(task);
    setIsOrderStatusDialogOpen(true);
  }, []);

  const handleOpenPullForwardDialog = React.useCallback(() => setIsPullForwardDialogOpen(true), []);
  
  const handleExecutePullForward = React.useCallback((options: ActualPullForwardOptions) => {
    let effectiveStartDate: Date;
    let effectiveEndDate: Date | null = null;
    const today = startOfDay(new Date());

    switch (options.rangeType) {
      case 'currentDay':
        effectiveStartDate = startOfDay(horizontalCurrentStartDate);
        effectiveEndDate = startOfDay(horizontalCurrentStartDate);
        break;
      case 'currentWeek':
        effectiveStartDate = startOfWeek(horizontalCurrentStartDate, { weekStartsOn: 1 }); 
        effectiveEndDate = dateFnsEndOfWeek(horizontalCurrentStartDate, { weekStartsOn: 1 });
        break;
      case 'currentMonth':
        effectiveStartDate = startOfMonth(horizontalCurrentStartDate);
        effectiveEndDate = endOfMonth(horizontalCurrentStartDate);
        break;
      case 'entirePlan':
        const allCombinedTasks = [...rawHorizontalTasks, ...rawVerticalTasks].filter(t => t.originalOrderDetails);
        if(allCombinedTasks.length === 0) {
           toast({ title: "No Tasks", description: "No tasks available to pull forward.", variant: "default" });
           setIsPullForwardDialogOpen(false); return;
        }
        let minDate = parseISO(allCombinedTasks[0].startDate);
        let maxDate = parseISO(allCombinedTasks[0].endDate);
        allCombinedTasks.forEach(t => {
            const taskStart = parseISO(t.startDate);
            const taskEnd = parseISO(t.endDate);
            if (taskStart < minDate) minDate = taskStart;
            if (taskEnd > maxDate) maxDate = taskEnd;
        });
        effectiveStartDate = minDate;
        effectiveEndDate = maxDate;
        break;
      case 'dateRange':
        if (!options.fromDate || !options.toDate) {
          toast({ title: "Error", description: "Date range not specified for pull forward.", variant: "destructive" });
          setIsPullForwardDialogOpen(false); return;
        }
        effectiveStartDate = startOfDay(options.fromDate);
        effectiveEndDate = startOfDay(options.toDate);
        break;
      default:
        toast({ title: "Error", description: "Invalid range type for pull forward.", variant: "destructive" });
        setIsPullForwardDialogOpen(false); return;
    }

    if (effectiveStartDate < today) effectiveStartDate = today;
    if (effectiveEndDate && effectiveEndDate < effectiveStartDate) effectiveEndDate = effectiveStartDate; 

    let updatedHTasks = [...rawHorizontalTasks];
    let updatedVTasks = [...rawVerticalTasks];
    let tasksShiftedCount = 0;

    schedulableResources.forEach(resource => {
      const tasksOnResourceInRange = [...updatedHTasks, ...updatedVTasks]
          .filter(t => t.resourceId === resource.id && t.originalOrderDetails &&
                         !(parseISO(t.endDate) < effectiveStartDate || (effectiveEndDate && parseISO(t.startDate) > effectiveEndDate)))
          .sort((a, b) => parseISO(a.startDate).getTime() - parseISO(b.startDate).getTime()); 
      
      let lastAnchorDate = effectiveStartDate; 

      tasksOnResourceInRange.forEach(task => {
        if (!task.originalOrderDetails) return; 

        let newStartDateCandidate = lastAnchorDate;
        
        if (parseISO(task.startDate) > newStartDateCandidate) {
            newStartDateCandidate = parseISO(task.startDate);
        }
        if (newStartDateCandidate < effectiveStartDate) newStartDateCandidate = effectiveStartDate;
        if (isPastDay(newStartDateCandidate) && !isTodayChecker(newStartDateCandidate, new Date())) {
          newStartDateCandidate = today;
        }

        while(holidaysMap.get(format(newStartDateCandidate, 'yyyy-MM-dd'))?.type === 'full') {
            newStartDateCandidate = addDays(newStartDateCandidate, 1);
        }

        const { dailyPlanSegments, actualEndDateStr } = generateTaskPlanWithCapacityConstraint(
            task.originalOrderDetails, resource, newStartDateCandidate, holidaysMap
        );
        const newEndDate = parseISO(actualEndDateStr);

        if (format(newStartDateCandidate, 'yyyy-MM-dd') !== task.startDate || actualEndDateStr !== task.endDate || task.resourceId !== resource.id) {
          const commonUpdatedProps = {
            ...task,
            startDate: format(newStartDateCandidate, 'yyyy-MM-dd'),
            endDate: actualEndDateStr,
            resourceId: resource.id 
          };

          updatedHTasks = updatedHTasks.map(ht => ht.id === task.id ? { ...commonUpdatedProps, label: ('label' in task && task.label) ? task.label : `${task.originalOrderDetails?.style} (${task.originalOrderDetails?.quantity})` } as Task : ht);
          updatedVTasks = updatedVTasks.map(vt => vt.id === task.id ? { ...commonUpdatedProps, orderName: ('orderName' in task && task.orderName) ? task.orderName : `${task.originalOrderDetails?.style} [${task.originalOrderDetails?.quantity}]`, imageHint: ('imageHint' in task && task.imageHint) ? task.imageHint : task.originalOrderDetails?.imageHint, dailyData: dailyPlanSegments } as VerticalTask : vt);
          tasksShiftedCount++;
        }
        
        lastAnchorDate = addDays(newEndDate, 1);
        while(holidaysMap.get(format(lastAnchorDate, 'yyyy-MM-dd'))?.type === 'full') {
            lastAnchorDate = addDays(lastAnchorDate, 1);
        }
      });
    });

    if (tasksShiftedCount > 0) {
        setRawHorizontalTasks(updatedHTasks);
        setRawVerticalTasks(updatedVTasks);
        toast({ title: "Pull Forward Applied", description: `${tasksShiftedCount} task(s)/part(s) shifted to fill gaps.` });
    } else {
        toast({ title: "No Changes", description: "No tasks needed pulling forward within the selected range.", variant: "default" });
    }
    setIsPullForwardDialogOpen(false);
  }, [horizontalCurrentStartDate, rawHorizontalTasks, rawVerticalTasks, schedulableResources, holidaysMap, toast, generateTaskPlanWithCapacityConstraint, isPastDay, isTodayChecker]);

  const handleSetSubProcessViewMode = React.useCallback((mode: SubProcessViewMode) => {
    setSubProcessViewMode(mode);
  }, []);

  const handleSubProcessOrderUpdate = React.useCallback((updatedOrder: SubProcessOrder) => {
    setSubProcessOrdersData(prevOrders =>
      prevOrders.map(o => (o.id === updatedOrder.id ? updatedOrder : o))
    );
  }, []);

  const handleSubProcessSavePlan = React.useCallback(() => {
    console.log("Saving Sub-Process Plan Data:", subProcessOrdersData);
    toast({title: "Sub-Process Plan Saved", description: "Daily targets for the current sub-process view have been (conceptually) saved."});
  }, [subProcessOrdersData, toast]);

  const handleOpenConsolidateStripsDialog = React.useCallback(() => setIsConsolidateStripsDialogOpen(true), []);
  
  const handleApplyConsolidation = React.useCallback((options: ActualConsolidationOptions) => {
    console.log("Applying consolidation with options:", options);
    toast({ title: "Consolidation Applied (Placeholder)", description: `Consolidation by ${options.criteria} would be applied here.` });
    setIsConsolidateStripsDialogOpen(false);
  }, [toast]);

  const handleOpenUnplannedListDialog = React.useCallback(() => setIsUnplannedListDialogOpen(true), []);
  
  const handleLoadOrdersFromUnplannedList = React.useCallback((orderIdsToLoad: string[]) => {
    const ordersToSchedule = unscheduledOrders.filter(uo => orderIdsToLoad.includes(uo.id));
    if (ordersToSchedule.length === 0) {
        toast({ title: "No Orders Selected", description: "Please select orders from the list to load.", variant: "default"});
        return;
    }

    let currentSchedulingDate = startOfDay(new Date()); 
    if (isPastDay(currentSchedulingDate) && !isTodayChecker(currentSchedulingDate, new Date())) {
        currentSchedulingDate = addDays(startOfDay(new Date()), 1); 
    }
     while(holidaysMap.get(format(currentSchedulingDate, 'yyyy-MM-dd'))?.type === 'full' || (isPastDay(currentSchedulingDate) && !isTodayChecker(currentSchedulingDate, new Date()))) {
        currentSchedulingDate = addDays(currentSchedulingDate, 1);
    }

    let newHTasks: Task[] = [...rawHorizontalTasks];
    let newVTasks: VerticalTask[] = [...rawVerticalTasks];
    let remainingUnscheduled = [...unscheduledOrders];
    let scheduledCount = 0;

    const targetResource = schedulableResources.length > 0 ? schedulableResources[0] : null;
    if (!targetResource) {
        toast({ title: "No Resources", description: "No available lines to schedule orders onto.", variant: "destructive"});
        setIsUnplannedListDialogOpen(false);
        return;
    }

    ordersToSchedule.forEach(order => {
        let validStartDateForOrder = currentSchedulingDate;
        while(holidaysMap.get(format(validStartDateForOrder, 'yyyy-MM-dd'))?.type === 'full' || (isPastDay(validStartDateForOrder) && !isTodayChecker(validStartDateForOrder, new Date()))) {
            validStartDateForOrder = addDays(validStartDateForOrder, 1);
        }

        const { dailyPlanSegments, actualEndDateStr } = generateTaskPlanWithCapacityConstraint(order, targetResource, validStartDateForOrder, holidaysMap);
        
        const newTaskId = `task-${getBaseOrderId(order.id)}-loaded-${taskCounterRef.current.value++}`;
        
        const commonDetails = {
            id: newTaskId,
            resourceId: targetResource.id,
            startDate: format(validStartDateForOrder, 'yyyy-MM-dd'),
            endDate: actualEndDateStr,
            color: 'bg-teal-500 text-white', 
            displayColor: 'bg-teal-500 text-white',
            originalOrderDetails: { ...order },
            learningCurveId: order.learningCurveId,
        };

        newHTasks.push({ ...commonDetails, label: `${order.style} (${order.quantity})` });
        newVTasks.push({ ...commonDetails, orderName: `${order.style} [${order.quantity}]`, imageHint: order.imageHint, dailyData: dailyPlanSegments });
        
        remainingUnscheduled = remainingUnscheduled.filter(uo => uo.id !== order.id);
        currentSchedulingDate = addDays(parseISO(actualEndDateStr), 1);
        while(holidaysMap.get(format(currentSchedulingDate, 'yyyy-MM-dd'))?.type === 'full') {
            currentSchedulingDate = addDays(currentSchedulingDate, 1);
        }
        scheduledCount++;
    });

    setRawHorizontalTasks(newHTasks);
    setRawVerticalTasks(newVTasks);
    setUnscheduledOrders(remainingUnscheduled);

    toast({ title: "Orders Loaded", description: `${scheduledCount} order(s) loaded onto ${targetResource.name}.` });
    setIsUnplannedListDialogOpen(false);
  }, [unscheduledOrders, rawHorizontalTasks, rawVerticalTasks, schedulableResources, holidaysMap, toast, generateTaskPlanWithCapacityConstraint, isPastDay, isTodayChecker, taskCounterRef]);

  const handleConfigureUnplannedList = React.useCallback(() => {
    toast({ title: "Configure Unplanned List Clicked", description: "This would open further configuration options." });
  }, [toast]);

  const handleOpenSearchToolDialog = React.useCallback(() => setIsSearchToolDialogOpen(true), []);
  
  const handleSearchSubmit = React.useCallback((data: SearchFormValues) => {
    console.log("Search criteria submitted:", data);
    toast({ title: "Search Submitted", description: "Filtering logic not yet implemented. Check console for criteria."});
    setIsSearchToolDialogOpen(false);
  }, [toast]);

  const handleOpenEqualiseOrderDialog = React.useCallback((task: Task | VerticalTask) => {
    setTaskToEqualise(task);
    setIsEqualiseOrderDialogOpen(true);
  }, []);

  const handleConfirmEqualiseOrder = React.useCallback((originalTaskId: string, numberOfParts: number) => {
    const originalTask = rawHorizontalTasks.find(t => t.id === originalTaskId) || rawVerticalTasks.find(vt => vt.id === originalTaskId);
    if (!originalTask || !originalTask.originalOrderDetails || numberOfParts < 2) {
      toast({ title: "Equalise Error", description: "Invalid task or number of parts for equalisation.", variant: "destructive" }); return;
    }
    
    // Add null safety check for originalOrderDetails  
    if (!originalTask.originalOrderDetails) {
      toast({ title: "Equalise Error", description: "Task missing order details.", variant: "destructive"}); return;
    }
    
    const originalQty = originalTask.originalOrderDetails.quantity;
    const baseOriginalOrderId = getBaseOrderId(originalTask.originalOrderDetails.id);
    const styleCode = originalTask.originalOrderDetails.style;
    if (originalQty > 0 && numberOfParts > originalQty ) { 
      toast({ title: "Equalise Error", description: `Cannot split into more parts (${numberOfParts}) than quantity (${originalQty}).`, variant: "destructive"}); return;
    }

    const baseQtyPerPart = originalQty > 0 ? Math.floor(originalQty / numberOfParts) : 0;
    let remainderQty = originalQty > 0 ? originalQty % numberOfParts : 0;
    const quantitiesPerPart = Array(numberOfParts).fill(baseQtyPerPart).map((qty, index) => qty + (index < remainderQty ? 1 : 0));

    const newHTasksToAdd: Task[] = [];
    const newVTasksToAdd: VerticalTask[] = [];
    let currentProcessingStartDate = parseISO(originalTask.startDate); 

    if (isPastDay(currentProcessingStartDate) && !isTodayChecker(currentProcessingStartDate, new Date())) {
      toast({ title: "Equalise Error", description: "Cannot equalise a task starting in the past.", variant: "destructive" }); return;
    }
    
    const targetResource = schedulableResources.find(r => r.id === originalTask.resourceId);
    if (!targetResource) {
        toast({ title: "Equalise Error", description: "Resource for task not found.", variant: "destructive"}); return;
    }

    for (let i = 0; i < numberOfParts; i++) {
      const partQuantity = quantitiesPerPart[i];

      while(holidaysMap.get(format(currentProcessingStartDate, 'yyyy-MM-dd'))?.type === 'full' || (isPastDay(currentProcessingStartDate) && !isTodayChecker(currentProcessingStartDate, new Date()))) {
        currentProcessingStartDate = addDays(currentProcessingStartDate, 1);
      }

      const partOriginalOrderDetails: UnscheduledOrder = {
        ...originalTask.originalOrderDetails,
        id: `${getBaseOrderId(originalTask.originalOrderDetails.id)}-eq${i + 1}-${taskCounterRef.current.value++}`, 
        quantity: partQuantity,
      };

      const { dailyPlanSegments, actualEndDateStr } = generateTaskPlanWithCapacityConstraint(partOriginalOrderDetails, targetResource, currentProcessingStartDate, holidaysMap);
      const newTaskId = partOriginalOrderDetails.id;

      const commonDetails = {
        id: newTaskId,
        resourceId: targetResource.id,
        startDate: format(currentProcessingStartDate, 'yyyy-MM-dd'),
        endDate: actualEndDateStr,
        color: originalTask.color || 'bg-purple-500 text-white', 
        displayColor: originalTask.displayColor || originalTask.color || 'bg-purple-500 text-white',
        originalOrderDetails: partOriginalOrderDetails,
        learningCurveId: originalTask.learningCurveId,
        tnaPlan: originalTask.tnaPlan, 
      };

      newHTasksToAdd.push({ ...commonDetails, label: `${originalTask.originalOrderDetails.style} (EQ ${i + 1}/${numberOfParts} - ${partQuantity})` });
      newVTasksToAdd.push({ ...commonDetails, orderName: `${originalTask.originalOrderDetails.style} [EQ ${i + 1}/${numberOfParts} - ${partQuantity}]`,
        imageHint: ('imageHint' in originalTask && originalTask.imageHint) ? originalTask.imageHint : originalTask.originalOrderDetails.productType?.toLowerCase(),
        dailyData: dailyPlanSegments,
      });

      currentProcessingStartDate = addDays(parseISO(actualEndDateStr), 1);
    }

    setRawHorizontalTasks(prev => [...prev.filter(t => t.id !== originalTask.id), ...newHTasksToAdd]);
    setRawVerticalTasks(prev => [...prev.filter(vt => vt.id !== originalTask.id), ...newVTasksToAdd]);

    toast({ title: "Order Equalised", description: `Order for ${originalTask.originalOrderDetails.style} split into ${numberOfParts} parts.` });
    setTaskToEqualise(null); setIsEqualiseOrderDialogOpen(false);
  }, [rawHorizontalTasks, rawVerticalTasks, holidaysMap, isPastDay, schedulableResources, toast, generateTaskPlanWithCapacityConstraint, isTodayChecker, taskCounterRef]);

  // Wrapper for push/pull execution that matches timeline component interface
  const handlePushPullTargetSelected = React.useCallback((targetResourceId: string, targetDateString: string) => {
    if (pushPullState.originTaskId && pushPullState.scope) {
      executePushPull(pushPullState.originTaskId, pushPullState.scope, targetResourceId, targetDateString);
    }
  }, [pushPullState.originTaskId, pushPullState.scope, executePushPull]);

  // --- Effect for global event listeners (e.g., Escape key) ---
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && pushPullState.isActive) {
        cancelPushPullMode();
      }
    };
    if (isClient && pushPullState.isActive) { 
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [pushPullState.isActive, isClient, cancelPushPullMode]); 

  // --- Scroll Synchronization Logic ---
  const handleResourcePaneVerticalScroll = React.useCallback((event: React.UIEvent<HTMLDivElement>) => {
    if (isSyncingScroll.current || !schedulePaneVerticalScrollRef.current) return;
    
    const resourceScrollViewport = event.currentTarget; // This is the ScrollArea's viewport
    const scheduleScrollArea = schedulePaneVerticalScrollRef.current;
    const scheduleScrollViewport = scheduleScrollArea.querySelector<HTMLDivElement>('[data-radix-scroll-area-viewport]');


    if (scheduleScrollViewport && scheduleScrollViewport.scrollTop !== resourceScrollViewport.scrollTop) {
        isSyncingScroll.current = true;
        scheduleScrollViewport.scrollTop = resourceScrollViewport.scrollTop;
        requestAnimationFrame(() => { isSyncingScroll.current = false; });
    }
  }, []);

  const handleScheduleVerticalScroll = React.useCallback((scrollTopValue: number) => {
    if (isSyncingScroll.current || !resourcePaneVerticalScrollRef.current) return;
    
    const resourceScrollArea = resourcePaneVerticalScrollRef.current;
    const resourceScrollViewport = resourceScrollArea.querySelector<HTMLDivElement>('[data-radix-scroll-area-viewport]');
    
    if (resourceScrollViewport && resourceScrollViewport.scrollTop !== scrollTopValue){
        isSyncingScroll.current = true;
        resourceScrollViewport.scrollTop = scrollTopValue;
        requestAnimationFrame(() => { isSyncingScroll.current = false; });
    }
  }, []);

  const currentDisplayStartDateForToolbar = subProcessViewMode ? horizontalCurrentStartDate : (viewMode === 'horizontal' ? horizontalCurrentStartDate : verticalCurrentStartDate);
  
  const currentConfiguredHeights = ROW_HEIGHT_CONFIG[rowHeightLevel] || ROW_HEIGHT_CONFIG.medium;
  const combinedHeaderStaticHeight = React.useMemo(() => {
    const targetPanelH = selectedResourceIds.length > 0 ? currentConfiguredHeights.targetUnit * (selectedResourceIds.length + 1) : 0;
    const timelineHeaderH = currentConfiguredHeights.headerUnit * 2;
    return targetPanelH + timelineHeaderH;
  }, [rowHeightLevel, selectedResourceIds.length, currentConfiguredHeights]);
  
  // --- Mouse Wheel Horizontal Scrolling for Calendar Grid ---
  React.useEffect(() => {
    const scrollAreaElement = rightPaneHorizontalScrollRef.current;
    if (!scrollAreaElement || !isClient) return;

    const handleWheel = (event: WheelEvent) => {
      if (event.deltaY !== 0 && Math.abs(event.deltaY) > Math.abs(event.deltaX)) { // Prioritize vertical wheel for horizontal scroll
        event.preventDefault();
        scrollAreaElement.scrollLeft += event.deltaY * 1.5; // Adjust multiplier for sensitivity
      } else if (event.deltaX !== 0) { // Handle explicit horizontal scroll
        event.preventDefault();
        scrollAreaElement.scrollLeft += event.deltaX;
      }
    };

    scrollAreaElement.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      scrollAreaElement.removeEventListener('wheel', handleWheel);
    };
  }, [isClient, rightPaneHorizontalScrollRef]);


  if (!isClient) {
    return (
      <div className="flex flex-col h-full w-full overflow-hidden">
        <PageHeader title="Track Tech - Production Planning" />
        <div className="flex items-center justify-between p-2 border-b bg-card sticky top-0 z-40 h-14 flex-shrink-0 shadow">
          <span className="text-muted-foreground">Loading Toolbar...</span>
        </div>
        <div className="flex flex-1 min-h-0 overflow-hidden">
          <div className={`w-[${RESOURCE_PANE_WIDTH}px] flex-shrink-0 h-full flex flex-col bg-card border-r border-border shadow-lg`}>
            <div 
              className="p-2 border-b border-border bg-muted/50 text-xs font-semibold sticky top-0 z-10 flex-shrink-0 flex items-center justify-center"
              style={{ height: combinedHeaderStaticHeight || (ROW_HEIGHT_CONFIG.medium.headerUnit * 2) }}
            >
              Resources
            </div>
            <div className="flex-grow p-4 text-muted-foreground">Loading resources...</div>
          </div>
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading Planning Board...</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-full w-full overflow-hidden"> {/* Ensure full height and width, prevent PlanViewPage from scrolling */}
      <PageHeader title="Track Tech - Production Planning" />
      <TimelineToolbar
        currentStartDate={currentDisplayStartDateForToolbar}
        onDateChange={handleDateChange}
        zoomLevel={horizontalZoomLevel}
        onZoomChange={handleHorizontalZoomChange}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        timelineViewMode={timelineViewMode}
        onTimelineViewModeChange={setTimelineViewMode}
        rotationMode={rotationMode}
        onRotationModeChange={setRotationMode}
        rowHeightLevel={rowHeightLevel}
        onRowHeightLevelChange={setRowHeightLevel}
        currentHorizontalTasks={rawHorizontalTasks}
        currentVerticalTasks={rawVerticalTasks}
        onLoadPlan={handleLoadPlanData}
        activePlanId={activePlanId}
        onActivePlanChange={handleActivePlanChange}
        onOpenPullForwardDialog={handleOpenPullForwardDialog}
        subProcessViewMode={subProcessViewMode}
        onSetSubProcessViewMode={handleSetSubProcessViewMode}
        onOpenConsolidateStripsDialog={handleOpenConsolidateStripsDialog}
        onOpenUnplannedListDialog={handleOpenUnplannedListDialog}
        onOpenSearchToolDialog={handleOpenSearchToolDialog}
      />

      {/* Main Content Area Below Toolbar */}
      <div className="flex flex-1 min-h-0 overflow-hidden"> {/* This uses flex to arrange Resource Panel and Calendar Area */}
        
        {/* Sticky Left Resource Panel */}
        <div className={`w-[${RESOURCE_PANE_WIDTH}px] flex-shrink-0 h-full flex flex-col bg-card border-r border-border shadow-lg`}>
          <div 
            className="p-2 border-b border-border bg-muted/50 text-xs font-semibold sticky top-0 z-10 flex-shrink-0 flex items-center justify-center" // z-10 relative to its parent
            style={{ height: combinedHeaderStaticHeight }}
          >
            Resources
          </div>
          <ScrollArea 
            className="flex-grow"
            ref={resourcePaneVerticalScrollRef}
            onScroll={handleResourcePaneVerticalScroll}
          >
            <TimelineResourcePane
              resources={horizontalDisplayResources} 
              unscheduledOrders={unscheduledOrders}
              expandedResourceId={expandedResourceId}
              onToggleExpandResource={handleToggleExpandResource}
              rowHeightLevel={rowHeightLevel}
              selectedResourceIds={selectedResourceIds}
              onToggleSelectedResource={handleToggleSelectedResource}
            />
          </ScrollArea>
        </div>

        {/* Right Calendar Grid Area - This div handles horizontal scrolling */}
        <div 
            className="flex-1 flex flex-col min-h-0 overflow-hidden" // overflow-hidden here to let TimelineGrid manage its scroll
            ref={rightPaneHorizontalScrollRef} // Ref for wheel event
        >
          {subProcessViewMode === 'high-level-planning' ? (
            <React.Suspense fallback={<div className="flex-1 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary"/></div>}>
              <HighLevelPlanningBoard />
            </React.Suspense>
          ) : subProcessViewMode === 'low-level-planning' ? (
            <React.Suspense fallback={<div className="flex-1 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary"/></div>}>
              <LowLevelPlanningBoard />
            </React.Suspense>
          ) : subProcessViewMode ? (
            <React.Suspense fallback={<div className="flex-1 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary"/></div>}>
              <SubProcessPlanningView
                orders={subProcessOrdersData}
                onUpdateOrder={handleSubProcessOrderUpdate}
                onSavePlan={handleSubProcessSavePlan}
                displayedDates={currentDisplayedUnits}
                viewType={subProcessViewMode}
              />
            </React.Suspense>
          ) : viewMode === 'horizontal' ? (
            <React.Suspense fallback={<div className="flex-1 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary"/></div>}>
              <TimelineGrid
                horizontalDisplayResources={horizontalDisplayResources}
                tasks={horizontalTasks}
                dailyData={horizontalDailyData}
                displayedUnits={currentDisplayedUnits}
                unitCellWidth={currentUnitCellWidth}
                timelineViewMode={timelineViewMode}
                rowHeightLevel={rowHeightLevel}
                onTaskUpdate={handleHorizontalTaskUpdate}
                unscheduledOrders={unscheduledOrders}
                onScheduleUnscheduledOrder={handleScheduleUnscheduledOrder}
                onUndoAllocation={handleUndoAllocation}
                onOpenSplitDialog={openSplitTaskDialog}
                onOpenMergeDialog={handleOpenMergeDialog}
                isPushPullActive={pushPullState.isActive}
                onPushPullTargetSelected={handlePushPullTargetSelected}
                onStartPushPullMode={startPushPullMode}
                isPastDay={isPastDay}
                isPastHour={isPastHour}
                holidaysMap={holidaysMap}
                selectedResourceIds={selectedResourceIds}
                schedulableResources={schedulableResources}
                onOpenOrderStatusDialog={handleOpenOrderStatusDialog}
                isSameDay={isTodayChecker}
                onOpenEqualiseOrderDialog={handleOpenEqualiseOrderDialog}
                isClient={isClient}
                viewMode={viewMode} 
                subProcessViewMode={subProcessViewMode} 
                targetDisplayScheduleRef={targetDisplayScheduleRef}
                headerScrollRef={headerScrollRef}
                rightPaneHorizontalScrollRef={rightPaneHorizontalScrollRef} 
                schedulePaneVerticalScrollRef={schedulePaneVerticalScrollRef}
                handleScheduleVerticalScroll={handleScheduleVerticalScroll}
              />
            </React.Suspense>
          ) : (
            <VerticalScheduler
              resources={schedulableResources}
              tasks={verticalTasks}
              startDate={verticalCurrentStartDate}
              numDays={currentDisplayedUnits.length > 0 ? currentDisplayedUnits.length : 365*2}
              onTaskUpdate={handleVerticalTaskUpdate}
              onUndoAllocation={handleUndoAllocation}
              onOpenSplitDialog={openSplitTaskDialog as (task: VerticalTask) => void} 
              onOpenMergeDialog={handleOpenMergeDialog as (task: VerticalTask) => void} 
              onScheduleUnscheduledOrder={handleScheduleUnscheduledOrder}
              isPushPullActive={pushPullState.isActive}               onPushPullTargetSelected={handlePushPullTargetSelected}
              onStartPushPullMode={startPushPullMode}
              isPastDay={isPastDay}
              holidaysMap={holidaysMap}
              selectedResourceIds={selectedResourceIds}
              onToggleSelectedResource={handleToggleSelectedResource}
              onOpenOrderStatusDialog={handleOpenOrderStatusDialog}
              onOpenEqualiseOrderDialog={handleOpenEqualiseOrderDialog}
            />
          )}
        </div>
      </div>

      {/* Dialogs remain unchanged */}
      {taskToSplit && taskToSplit.originalOrderDetails && (
        <SplitTaskDialog
          isOpen={isSplitTaskDialogOpen}
          onOpenChange={setIsSplitTaskDialogOpen}
          task={taskToSplit}
          onSubmit={handleConfirmSplitTask}
          maxQuantity={taskToSplit.originalOrderDetails.quantity}
        />
      )}
      {taskToMerge && taskToMerge.originalOrderDetails && (
        <MergeOrdersDialog
          isOpen={isMergeOrdersDialogOpen}
          onOpenChange={setIsMergeOrdersDialogOpen}
          originalTaskName={('label' in taskToMerge ? taskToMerge.label : (taskToMerge as VerticalTask).orderName) || 'Selected Task'}
          mergeableOrders={mergeableOrdersForDialog}
          onSubmit={handleConfirmMergeOrders}
        />
      )}
      {selectedTaskForStatus && (
        <OrderStatusDialog
          isOpen={isOrderStatusDialogOpen}
          onOpenChange={setIsOrderStatusDialogOpen}
          task={selectedTaskForStatus}
        />
      )}
      <PullForwardDialog
        isOpen={isPullForwardDialogOpen}
        onOpenChange={setIsPullForwardDialogOpen}
        onSubmit={handleExecutePullForward}
        initialStartDate={horizontalCurrentStartDate}
      />
      <ConsolidateStripsDialog
        isOpen={isConsolidateStripsDialogOpen}
        onOpenChange={setIsConsolidateStripsDialogOpen}
        onSubmit={handleApplyConsolidation}
      />
      <UnplannedListDialog
        isOpen={isUnplannedListDialogOpen}
        onOpenChange={setIsUnplannedListDialogOpen}
        unscheduledOrders={unscheduledOrders}
        onLoadSelectedOrders={handleLoadOrdersFromUnplannedList}
        onConfigure={handleConfigureUnplannedList}
      />
      <SearchToolDialog
        isOpen={isSearchToolDialogOpen}
        onOpenChange={setIsSearchToolDialogOpen}
        onSubmit={handleSearchSubmit}
      />
      {taskToEqualise && taskToEqualise.originalOrderDetails && (
        <EqualiseOrderDialog
          isOpen={isEqualiseOrderDialogOpen}
          onOpenChange={setIsEqualiseOrderDialogOpen}
          task={taskToEqualise}
          onSubmit={(numberOfParts) => handleConfirmEqualiseOrder(taskToEqualise!.id, numberOfParts)}
        />
      )}
    </div>
  );
}
