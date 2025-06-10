// src/components/plan-view/types.ts

import type { LearningCurveMaster as LCLearningCurveMaster, LearningCurvePoint } from '@/lib/learningCurveTypes';
import type { DailyProduction } from '@/lib/learningCurve';

export const RESOURCE_PANE_WIDTH = 260;

export const ROW_HEIGHT_CONFIG = {
  small: { headerUnit: 24, mainUnit: 30, subUnit: 16, unscheduledItem: 32, taskTopMargin: 2, taskInnerHeightReduction: 4, targetUnit: 20, groupHeaderUnit: 24 },
  medium: { headerUnit: 32, mainUnit: 48, subUnit: 20, unscheduledItem: 40, taskTopMargin: 4, taskInnerHeightReduction: 8, targetUnit: 28, groupHeaderUnit: 28 },
  large: { headerUnit: 40, mainUnit: 60, subUnit: 24, unscheduledItem: 48, taskTopMargin: 6, taskInnerHeightReduction: 12, targetUnit: 32, groupHeaderUnit: 32 },
};

export type TimelineViewMode = 'hourly' | 'daily' | 'weekly' | 'monthly';
export type RotationMode = 'order' | 'product' | 'productType' | 'customer' | 'delivery';
export type RowHeightLevel = 'small' | 'medium' | 'large';

export type HolidayType = 'full' | 'half-am' | 'half-pm';
export interface HolidayDetail {
  type: HolidayType;
}

export interface SchedulableResource {
  id: string;
  name: string;
  capacity: number;
  unitId?: string;
}

export interface Resource {
  id: string;
  type: 'header' | 'holding' | 'unit' | 'subtotal' | 'groupHeader';
  name: string;
  details?: string;
  values?: (string | number)[];
  capacityPerDay?: number;
  isExpandable?: boolean;
  subRowsData?: { type: string; dailyValuesKey?: 'totalCapacity' | 'calculatedLoad' | string }[];
  isSelected?: boolean;
  lineCount?: number;
}

export interface UnscheduledOrder {
  id: string;
  buyer: string;
  style: string;
  productType?: string;
  quantity: number;
  requestedShipDate: string; // YYYY-MM-DD
  reason: string;
  learningCurveId?: string;
  imageHint?: string;
}

export interface TnaActivityItem {
  activityName: string;
  responsible: string;
  startDate: string;
  endDate: string;
  remarks?: string;
}

export interface TnaPlan {
  planName: string;
  activities: TnaActivityItem[];
}

export type TaskDailyProductionData = DailyProduction;

interface BaseTaskDetails {
  id: string;
  resourceId: string;
  startDate: string; // YYYY-MM-DD format
  endDate: string;   // YYYY-MM-DD format
  color?: string;
  displayColor?: string;
  originalOrderDetails?: UnscheduledOrder;
  learningCurveId?: string;
  mergedOrderIds?: string[];
  tnaPlan?: TnaPlan;
}

export interface Task extends BaseTaskDetails {
  label: string;
  dailyProductionPlan?: TaskDailyProductionData[];
}

export interface VerticalTaskDailyData {
  date: string;
  styleCode: string;
  plannedQty: number;
  efficiency?: number;
  cumulativeQty?: number;
}

export interface VerticalTask extends BaseTaskDetails {
  orderName: string;
  imageHint?: string;
  dailyData: VerticalTaskDailyData[];
}

export interface MergeableOrderItem {
  id: string;
  displayLabel: string;
  type: 'task' | 'unscheduled_order';
  buyer: string;
  quantity: number;
  style: string;
  productType?: string;
  originalOrderDetails?: UnscheduledOrder;
  taskDetails?: Task | VerticalTask;
}

export interface PushPullState {
  isActive: boolean;
  originTaskId: string | null;
  scope: 'orderOnly' | 'linkedOrders' | null;
}

export interface DailyData {
  date: string;
  resourceId: string;
  value: number; // Standard capacity for the period/resource
  load?: number; // DEPRECATED or simplified visual load
  calculatedLoad?: number; // Actual planned quantity for the period/resource
}

export interface LineGroup {
  id?: number;
  groupName: string;
  description?: string;
  lineIds: string[];
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PullForwardOptions {
  rangeType: 'currentDay' | 'currentWeek' | 'currentMonth' | 'entirePlan' | 'dateRange';
  fromDate?: Date;
  toDate?: Date;
}

export type SubProcessViewMode = 'cutting' | 'embroidery' | 'finishing' | 'high-level-planning' | 'low-level-planning' | null;

export interface SubProcessOrder {
  id: string;
  line: string;
  buyer: string;
  style: string;
  po: string;
  colour: string;
  totalPlanQty: number;
  deliveryDate: string;
  madeQty: number;
  balanceQty: number;
  backlog: number;
  dailyTargets: { [date: string]: number };
}

export type ConsolidationCriteria =
  | 'customer'
  | 'orderSet'
  | 'poNo'
  | 'poAndColour'
  | 'soNo'
  | 'style'
  | 'none';

export interface ConsolidationOptions {
  criteria: ConsolidationCriteria;
  dropAtEnd?: boolean;
}

export interface SearchFormValues {
  general_order?: string;
  general_orderSet?: string;
  general_product?: string;
  general_productType?: string;
  general_customer?: string;
  general_planGroup?: string;
  general_rowName?: string;
  general_operationWorkContent?: string;
  general_orderDescription?: string;
  general_productDescription?: string;
  general_materialRequired?: boolean;
  general_inBillOfMaterial?: boolean;
  general_transportMethod?: string;
  general_stage?: string;
  general_timetable?: string;
  general_prodStartDateFrom?: Date;
  general_prodStartDateTo?: Date;
  general_deliveryDateFrom?: Date;
  general_deliveryDateTo?: Date;
  general_statusConfirmed?: boolean;
  general_statusProvisional?: boolean;
  general_statusSpeculative?: boolean;
  general_statusTransit?: boolean;
  general_includeMadeStrips?: boolean;
  general_showAllSections?: boolean;
  general_showFindSummary?: boolean;
  general_prodHasStarted?: boolean;
  general_prodHasNotStarted?: boolean;
  general_parallelProcesses?: boolean;
  advanced_customField1?: string;
  problems_preProduction?: boolean;
  problems_materials?: boolean;
  problems_lateDelivery?: boolean;
  problems_wip?: boolean;
  problems_condition?: 'any' | 'all';
}

export interface EqualiseOrderOptions {
  numberOfParts: number;
}

export interface TimelineHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  displayedUnits: Date[];
  unitCellWidth: number;
  timelineViewMode: TimelineViewMode;
  rowHeightLevel: RowHeightLevel;
  isPastDay: (date: Date) => boolean;
  isPastHour: (date: Date) => boolean;
  holidaysMap: Map<string, HolidayDetail>;
  scrollRef?: React.RefObject<HTMLDivElement>; 
  isSameDay: (dateLeft: Date | number, dateRight: Date | number) => boolean;
  startDate?: Date; 
  // resourcePaneWidth prop removed as it's not used directly here for main layout
}

export interface TargetDisplayPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  displayedUnits: Date[];
  timelineViewMode: TimelineViewMode;
  selectedResourceIds: string[];
  allResources: SchedulableResource[];
  unitCellWidth: number;
  holidaysMap: Map<string, HolidayDetail>;
  isPastDay: (date: Date) => boolean;
  isPastHour: (date: Date) => boolean;
  scrollRef?: React.RefObject<HTMLDivElement>; 
  rowHeightLevel: RowHeightLevel;
}

export interface DailyLoadSummaryBarProps extends React.HTMLAttributes<HTMLDivElement> {
  displayedUnits: Date[];
  dailyData: DailyData[]; // This should contain the aggregated load and capacity
  allResources: SchedulableResource[]; // To calculate total capacity
  unitCellWidth: number;
  timelineViewMode: TimelineViewMode;
  holidaysMap: Map<string, HolidayDetail>;
  scrollRef?: React.RefObject<HTMLDivElement>;
  rowHeightLevel: RowHeightLevel;
}

// Ensure all intended exports are present
export type { LearningCurvePoint, LCLearningCurveMaster };

// Plan-related types that need to be exported
export interface PlanData {
  horizontalTasks: Task[];
  verticalTasks: VerticalTask[];
  bucketScheduledTasks: Task[];
  bucketUnscheduledOrders: UnscheduledOrder[];
}

export interface PlanInfo {
  id: string;
  name: string;
}