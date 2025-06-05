
// Use client directive for event handling, state management, and interactions
'use client';

import * as React from 'react';
import type { SchedulableResource, VerticalTask, UnscheduledOrder, VerticalTaskDailyData, Task, HolidayDetail } from './types';
import { format, parseISO, eachDayOfInterval, differenceInDays, addDays as dateFnsAddDays, getISOWeek, startOfDay } from 'date-fns';
import Image from 'next/image';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenuTrigger, 
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuGroup,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal
} from '@/components/ui/dropdown-menu';
import { DropdownMenu } from '@/components/ui/dropdown-menu'; 
import {
  Sparkles,
  AlertTriangle,
  Info,
  Loader2,
  Edit,
  CalendarCheck2,
  Boxes,
  Move,
  LogOut,
  ChevronsUpDown,
  ClipboardEdit,
  FileText,
  BadgeInfo,
  Combine,
  Brain,
  Clock,
  GitCompareArrows,
  ListOrdered,
  ArrowLeftRight,
  Merge,
  PackageOpen,
  MousePointerClick,
  CalendarOff,
  Settings2,
  Link as LinkIcon,
  PlayCircle,
  Hourglass,
  Package as PackageIcon,
  CalendarClock as DeliveryDateIcon,
  BarChartHorizontalBig,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { suggestPlanActions, type SuggestPlanActionsInput, type SuggestedAction } from '@/ai/flows/suggest-plan-actions-flow';
import { useToast } from '@/hooks/use-toast';
import { ProductionEntryDialog } from './production-entry-dialog';
import { calculateDailyProduction } from '@/lib/learningCurve';
import { mockLearningCurves } from '@/lib/learningCurveTypes';
import { TnaDetailDialog } from './TnaDetailDialog';
import { Button } from '@/components/ui/button';

interface VerticalSchedulerProps {
  resources: SchedulableResource[];
  tasks: VerticalTask[];
  startDate: Date;
  numDays: number;
  onTaskUpdate: (taskId: string, newResourceId: string, newStartDate: string, newEndDate: string) => void;
  onUndoAllocation: (taskId: string) => void;
  onOpenSplitDialog: (task: VerticalTask) => void;
  onOpenMergeDialog: (task: VerticalTask) => void;
  onScheduleUnscheduledOrder: (orderId: string, targetResourceId: string, newStartDate: string) => void;
  isPushPullActive: boolean;
  onPushPullTargetSelected: (targetResourceId: string, targetDateString: string) => void;
  onStartPushPullMode: (taskId: string, scope: 'orderOnly' | 'linkedOrders') => void;
  isPastDay: (date: Date) => boolean;
  holidaysMap: Map<string, HolidayDetail>;
  selectedResourceIds: string[];
  onToggleSelectedResource: (resourceId: string) => void;
  onOpenOrderStatusDialog: (task: Task | VerticalTask) => void;
  onOpenEqualiseOrderDialog: (task: Task | VerticalTask) => void; 
}

const DATE_CELL_HEIGHT = 60;
const DATE_COLUMN_WIDTH = 100;
const WEEK_COLUMN_WIDTH = 60;
const STICKY_HEADER_WIDTH = DATE_COLUMN_WIDTH + WEEK_COLUMN_WIDTH;

const STYLE_SUBCOLUMN_WIDTH = 80;
const PLAN_SUBCOLUMN_WIDTH = 60;
const CUM_SUBCOLUMN_WIDTH = 60;
const RESOURCE_COLUMN_TOTAL_WIDTH = STYLE_SUBCOLUMN_WIDTH + PLAN_SUBCOLUMN_WIDTH + CUM_SUBCOLUMN_WIDTH;


export function VerticalScheduler({
  resources,
  tasks,
  startDate,
  numDays,
  onTaskUpdate,
  onUndoAllocation,
  onOpenSplitDialog,
  onOpenMergeDialog,
  onScheduleUnscheduledOrder,
  isPushPullActive,
  onPushPullTargetSelected,
  onStartPushPullMode,
  isPastDay,
  holidaysMap,
  selectedResourceIds,
  onToggleSelectedResource,
  onOpenOrderStatusDialog,
  onOpenEqualiseOrderDialog, 
}: VerticalSchedulerProps) {
  const { toast } = useToast();
  const dates = React.useMemo(() => {
    const end = dateFnsAddDays(startDate, numDays - 1);
    return eachDayOfInterval({ start: startDate, end });
  }, [startDate, numDays]);

  const scrollAreaRef = React.useRef<HTMLDivElement>(null);
  const gridContentRef = React.useRef<HTMLDivElement>(null);

  const [activeContextMenuTask, setActiveContextMenuTask] = React.useState<VerticalTask | null>(null);
  const [aiSuggestions, setAiSuggestions] = React.useState<SuggestedAction[]>([]);
  const [isLoadingAiSuggestions, setIsLoadingAiSuggestions] = React.useState(false);
  const [isProductionEntryDialogOpen, setIsProductionEntryDialogOpen] = React.useState(false);
  const [isTnaDialogOpen, setIsTnaDialogOpen] = React.useState(false);


  const getHolidayInfo = (date: Date) => holidaysMap.get(format(date, 'yyyy-MM-dd'));

  const handleTaskDragStart = (event: React.DragEvent<HTMLDivElement>, task: VerticalTask, resourceId: string) => {
    event.dataTransfer.setData('application/json', JSON.stringify({
      type: 'VERTICAL_TASK_DRAG',
      taskId: task.id,
      originalResourceId: resourceId,
      originalStartDate: task.startDate,
      originalEndDate: task.endDate,
      taskDuration: differenceInDays(parseISO(task.endDate), parseISO(task.startDate)),
      originalOrderDetails: task.originalOrderDetails
    }));
    event.dataTransfer.effectAllowed = 'move';
    if (activeContextMenuTask?.id === task.id) {
        handleOpenChange(false, undefined); 
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  };

  const getTargetDateFromDropOrClickEvent = (event: React.DragEvent<HTMLDivElement> | React.MouseEvent<HTMLDivElement>): string => {
      const viewportElement = scrollAreaRef.current?.querySelector<HTMLDivElement>('[data-radix-scroll-area-viewport]');
      const gridTop = gridContentRef.current?.getBoundingClientRect().top || 0;
      const scrollTop = viewportElement?.scrollTop || 0;
      const dropYRelativeToGridTop = event.clientY - gridTop;
      const dropYInScrollableContent = dropYRelativeToGridTop + scrollTop;
      
      let dateIndex = Math.floor(dropYInScrollableContent / DATE_CELL_HEIGHT);
      dateIndex = Math.max(0, Math.min(dateIndex, dates.length - 1));
      return format(dates[dateIndex], 'yyyy-MM-dd');
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>, targetResourceId: string) => {
    event.preventDefault();
    const newStartDateString = getTargetDateFromDropOrClickEvent(event);
    const newStartDateObj = parseISO(newStartDateString);

    if (isPastDay(newStartDateObj)) {
        toast({ title: "Action Blocked", description: "Cannot drop task onto a past date.", variant: "destructive" });
        return;
    }
    const holidayInfo = getHolidayInfo(newStartDateObj);
    if (holidayInfo && holidayInfo.type === 'full') {
      toast({ title: "Action Blocked", description: "Cannot schedule task starting on a full holiday.", variant: "destructive" });
      return;
    }

    if (isPushPullActive) {
        onPushPullTargetSelected(targetResourceId, newStartDateString);
        return;
    }

    const rawData = event.dataTransfer.getData('application/json');
    if (!rawData) return;

    try {
      const data = JSON.parse(rawData);
      if (data.type === 'NEW_TASK_FROM_UNSCHEDULED' && data.orderId) {
        onScheduleUnscheduledOrder(data.orderId, targetResourceId, newStartDateString);
      } else if (data.type === 'VERTICAL_TASK_DRAG' && data.taskId) {
        const { taskId, taskDuration } = data;
        const newEndDate = dateFnsAddDays(newStartDateObj, taskDuration);
        const newEndDateString = format(newEndDate, 'yyyy-MM-dd');
        onTaskUpdate(taskId, targetResourceId, newStartDateString, newEndDateString);
      }
    } catch (e) {
      console.error("Failed to parse dragged data or process drop:", e);
      toast({ title: "Drop Error", description: "Could not process the drop operation.", variant: "destructive" });
    }
  };

  const handleClick = (event: React.MouseEvent<HTMLDivElement>, targetResourceId: string) => {
    if (isPushPullActive) {
      const targetDateString = getTargetDateFromDropOrClickEvent(event);
      const targetDateObj = parseISO(targetDateString);
      if (isPastDay(targetDateObj)) {
        toast({ title: "Action Blocked", description: "Cannot apply Push/Pull to a past date.", variant: "destructive" });
        return;
      }
      const holidayInfo = getHolidayInfo(targetDateObj);
      if (holidayInfo && holidayInfo.type === 'full') {
        toast({ title: "Action Blocked", description: "Target date for Push/Pull is a full holiday.", variant: "destructive" });
        return;
      }
      onPushPullTargetSelected(targetResourceId, targetDateString);
    }
  };

  const fetchAiSuggestions = async (task: VerticalTask) => {
    try {
      if (!task.originalOrderDetails) {
        setIsLoadingAiSuggestions(false);
        setAiSuggestions([]);
        return;
      }
      setIsLoadingAiSuggestions(true);
      setAiSuggestions([]);
      const daysInProduction = differenceInDays(parseISO(task.endDate), parseISO(task.startDate)) + 1;
      const resourceDetails = resources.find(r => r.id === task.resourceId);
      const learningCurve = task.learningCurveId ? mockLearningCurves.find(lc => lc.id === task.learningCurveId) : undefined;
      let capacityToUse = resourceDetails?.capacity;
      if (learningCurve?.points && learningCurve.smv > 0) {
          const plan = calculateDailyProduction(
              learningCurve.points,
              learningCurve.smv,
              learningCurve.workingMinutesPerDay,
              learningCurve.operatorsCount,
              1, 
              parseISO(task.startDate)
          );
          if (plan.length > 0) {
              capacityToUse = plan[0].capacity;
          }
      }
      const input: SuggestPlanActionsInput = {
        taskId: task.id,
        orderId: task.originalOrderDetails.id,
        styleName: task.originalOrderDetails.style,
        quantity: task.originalOrderDetails.quantity,
        currentStartDate: task.startDate,
        currentEndDate: task.endDate,
        requestedShipDate: task.originalOrderDetails.requestedShipDate,
        resourceId: task.resourceId,
        daysInProduction: daysInProduction,
        resourceCapacityPerDay: capacityToUse,
        isNewStyle: learningCurve?.curveType === 'Complex' || Math.random() > 0.7, 
      };
      const result = await suggestPlanActions(input);
      setAiSuggestions(result.suggestions || []);
    } catch (error) {
      console.error("Error in VerticalScheduler fetchAiSuggestions:", error);
      toast({
        title: "AI Error",
        description: "Could not fetch AI suggestions at this time.",
        variant: "destructive",
      });
      setAiSuggestions([{
        actionLabel: "AI Assistant Error",
        actionType: "ERROR_COMPONENT_LEVEL",
        reasoning: "Failed to load suggestions from AI.",
        severity: "critical"
      }]);
    } finally {
      setIsLoadingAiSuggestions(false);
    }
  };

  const handleContextMenu = (event: React.MouseEvent, task: VerticalTask) => {
    event.preventDefault();
    setActiveContextMenuTask(task);
    fetchAiSuggestions(task);
  };

  const handleOpenChange = (open: boolean, task?: VerticalTask) => {
    if (!open) {
      setActiveContextMenuTask(null);
      setAiSuggestions([]);
    }
    // If 'open' is true, it's handled by handleContextMenu or handleDoubleClickOpenMenu
  };

  const handleGenericAction = (actionName: string, taskId: string) => {
    toast({ title: 'Action Selected', description: `${actionName} for task: ${taskId}` });
  };

  const handleSplitOrder = (task: VerticalTask) => {
    if (task.originalOrderDetails && task.originalOrderDetails.quantity > 1) {
      onOpenSplitDialog(task);
    } else {
      toast({
        title: "Cannot Split Task",
        description: "Task quantity must be greater than 1 to split.",
        variant: "destructive",
      });
    }
  };

  const handleMergeOrders = (task: VerticalTask) => {
    if (task.originalOrderDetails) {
      onOpenMergeDialog(task);
    } else {
      toast({ title: "Cannot Merge", description: "Task is missing original order details.", variant: "destructive" });
    }
  };

  const handleUndo = (taskId: string) => {
    onUndoAllocation(taskId);
  };

  const handleAiActionSelect = (suggestion: SuggestedAction) => {
    toast({
      title: `AI Suggestion: ${suggestion.actionLabel}`,
      description: `Type: ${suggestion.actionType}\nReason: ${suggestion.reasoning || 'N/A'}`,
      variant: suggestion.severity === 'critical' ? 'destructive' : 'default',
    });
  }

  const getSeverityIcon = (severity?: 'info' | 'warning' | 'critical') => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="mr-2 h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="mr-2 h-4 w-4 text-yellow-500" />;
      case 'info':
      default:
        return <Info className="mr-2 h-4 w-4 text-blue-500" />;
    }
  }

  if (!resources || resources.length === 0) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-4 bg-card text-card-foreground rounded-md shadow">
        <PackageOpen className="h-16 w-16 text-muted-foreground mb-4" />
        <p className="text-lg font-semibold text-muted-foreground">No Resources Available</p>
        <p className="text-sm text-muted-foreground text-center">
          Please define production lines or other schedulable resources in the Masters section to use the Vertical Planning Board.
        </p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full bg-card text-card-foreground rounded-md shadow overflow-hidden">
        <div className="flex sticky top-0 z-30 bg-card border-b">
          {/* Date Column Header */}
          <div
            className="p-2 border-r bg-muted/50 flex items-center justify-center text-xs font-semibold sticky left-0 z-20 bg-card"
            style={{ minWidth: DATE_COLUMN_WIDTH, width: DATE_COLUMN_WIDTH }}
          >
            Date
          </div>
          {/* Week Column Header */}
          <div
            className="p-2 border-r bg-muted/50 flex items-center justify-center text-xs font-semibold sticky z-20 bg-card"
            style={{ minWidth: WEEK_COLUMN_WIDTH, width: WEEK_COLUMN_WIDTH, left: DATE_COLUMN_WIDTH }}
           >
            Week
          </div>
          {/* Resource Column Headers */}
          {resources.map(resource => (
            <div
              key={resource.id}
              className={cn(
                "border-r text-center text-xs font-semibold flex-shrink-0 flex flex-col cursor-pointer hover:bg-primary/5",
                selectedResourceIds.includes(resource.id) && "bg-primary/10 ring-1 ring-primary"
                )}
              style={{ width: RESOURCE_COLUMN_TOTAL_WIDTH }}
              onClick={() => onToggleSelectedResource(resource.id)}
              title={`Click to select/deselect ${resource.name} for target display`}
            >
              <div className="p-2 border-b h-1/2 flex items-center justify-center">
                {resource.name} (Cap: {resource.capacity})
              </div>
              <div className="flex h-1/2">
                <div className="p-1 border-r flex-1 flex items-center justify-center bg-muted/30" style={{width: STYLE_SUBCOLUMN_WIDTH}}>Style</div>
                <div className="p-1 border-r flex-1 flex items-center justify-center bg-muted/30" style={{width: PLAN_SUBCOLUMN_WIDTH}}>Plan</div>
                <div className="p-1 flex-1 flex items-center justify-center bg-muted/30" style={{width: CUM_SUBCOLUMN_WIDTH}}>Cum</div>
              </div>
            </div>
          ))}
        </div>

        <ScrollArea className="flex-grow" ref={scrollAreaRef}>
          <div ref={gridContentRef} className="relative" style={{ height: dates.length * DATE_CELL_HEIGHT }}>
            {/* Sticky Date and Week Columns - Background */}
            <div className="absolute top-0 left-0 z-10 bg-card flex flex-col" style={{width: STICKY_HEADER_WIDTH}}>
              {dates.map((date, dateIndex) => {
                const isPast = isPastDay(date);
                const holidayInfo = getHolidayInfo(date);
                return (
                <div
                  key={dateIndex}
                  className={cn("flex border-b",
                    isPast ? "bg-slate-100 opacity-80" :
                    (holidayInfo?.type === 'full' ? "bg-rose-100 dark:bg-rose-800/40" :
                    (holidayInfo ? "bg-amber-100 dark:bg-amber-800/30" : ""))
                  )}
                  style={{ height: DATE_CELL_HEIGHT }}
                >
                    {/* Date Cell */}
                    <div
                      className={cn(
                        "p-2 border-r text-center text-xs h-full flex items-center justify-center sticky left-0",
                        isPast ? "bg-slate-200 text-slate-500" :
                        (holidayInfo?.type === 'full' ? "text-rose-700 dark:text-rose-300" :
                        (holidayInfo ? "text-amber-700 dark:text-amber-300" : "bg-blue-100 text-blue-800"))
                      )}
                      style={{ minWidth: DATE_COLUMN_WIDTH, width: DATE_COLUMN_WIDTH }}
                      title={holidayInfo ? `Holiday: ${holidayInfo.type}` : undefined}
                    >
                      {format(date, 'dd-MM-yy')}
                      <br />
                      {format(date, 'EEE')}
                      {holidayInfo && <CalendarOff className="ml-1 h-3 w-3 opacity-70" />}
                    </div>
                    {/* Week Cell */}
                    <div
                      className={cn(
                        "p-2 border-r text-center text-xs h-full flex items-center justify-center sticky",
                         isPast ? "bg-slate-200 text-slate-500" :
                        (holidayInfo?.type === 'full' ? "text-rose-700 dark:text-rose-300" :
                        (holidayInfo ? "text-amber-700 dark:text-amber-300" : "bg-blue-100 text-blue-800"))
                      )}
                      style={{ minWidth: WEEK_COLUMN_WIDTH, width: WEEK_COLUMN_WIDTH, left: DATE_COLUMN_WIDTH }}
                    >
                      W{getISOWeek(date)}
                    </div>
                </div>
              );
              })}
            </div>

            {/* Main Schedulable Content Area */}
            <div className="absolute top-0 right-0 bottom-0" style={{ left: STICKY_HEADER_WIDTH }}>
              <div className="flex h-full">
                {resources.map((resource) => (
                  <div
                    key={resource.id}
                    className={cn("relative border-r flex-shrink-0", selectedResourceIds.includes(resource.id) && "bg-primary/5")}
                    style={{ width: RESOURCE_COLUMN_TOTAL_WIDTH }}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, resource.id)}
                    onClick={(e) => handleClick(e, resource.id)}
                  >
                    {/* Background Cells for this Resource */}
                    {dates.map((date, dateIndex) => {
                      const isPast = isPastDay(date);
                      const holidayInfo = getHolidayInfo(date);
                      return (
                      <div
                        key={`${resource.id}-${dateIndex}-bg`}
                        className={cn(
                          "border-b flex relative",
                           isPast ? "bg-slate-100 opacity-70 cursor-not-allowed" :
                           (holidayInfo?.type === 'full' ? "bg-rose-100 dark:bg-rose-800/30" :
                           (holidayInfo ? "bg-amber-100 dark:bg-amber-800/20" : ""))
                        )}
                        style={{ height: DATE_CELL_HEIGHT }}
                        title={holidayInfo ? `Holiday: ${holidayInfo.type}` : undefined}
                      >
                        <div className={cn("border-r", isPast && "border-slate-300")} style={{width: STYLE_SUBCOLUMN_WIDTH}}></div>
                        <div className={cn("border-r", isPast && "border-slate-300")} style={{width: PLAN_SUBCOLUMN_WIDTH}}></div>
                        <div style={{width: CUM_SUBCOLUMN_WIDTH}}></div>
                         {holidayInfo && !isPast && (
                            <CalendarOff className="absolute top-1 right-1 h-3 w-3 text-rose-500 opacity-50" />
                          )}
                      </div>
                    );
                    })}

                    {/* Scheduled Tasks for this Resource */}
                    {tasks
                      .filter(task => task.resourceId === resource.id)
                      .map(task => {
                        const taskStartDate = parseISO(task.startDate);
                        const taskEndDate = parseISO(task.endDate);
                        let effectiveTaskStartIndex = -1;
                        let effectiveTaskEndIndex = -1;

                        for (let i = 0; i < dates.length; i++) {
                            const currentDate = dates[i];
                            if (currentDate.getTime() >= taskStartDate.getTime() && currentDate.getTime() <= taskEndDate.getTime()) {
                                if (effectiveTaskStartIndex === -1) effectiveTaskStartIndex = i;
                                effectiveTaskEndIndex = i;
                            } else if (effectiveTaskEndIndex !== -1 && currentDate.getTime() > taskEndDate.getTime()) {
                                break;
                            }
                        }

                        if (effectiveTaskStartIndex === -1) return null;

                        const topOffset = effectiveTaskStartIndex * DATE_CELL_HEIGHT;
                        const blockHeight = (effectiveTaskEndIndex - effectiveTaskStartIndex + 1) * DATE_CELL_HEIGHT;

                        if (blockHeight <= 0) return null;

                        const visibleDailyData: (VerticalTaskDailyData & { dayIndex: number })[] = [];
                        let cumQtyBeforeView = 0;

                        if (effectiveTaskStartIndex > 0 && dates[effectiveTaskStartIndex - 1]) {
                            const dayBeforeVisibleStart = format(dates[effectiveTaskStartIndex -1], 'yyyy-MM-dd');
                            const dataPointBefore = task.dailyData.find(d => d.date === dayBeforeVisibleStart);
                            if(dataPointBefore && dataPointBefore.cumulativeQty) {
                                cumQtyBeforeView = dataPointBefore.cumulativeQty;
                            } else {
                                for(let i = 0; i < task.dailyData.length; i++) {
                                    if (task.dailyData[i].date < format(dates[effectiveTaskStartIndex], 'yyyy-MM-dd')) {
                                        cumQtyBeforeView = task.dailyData[i].cumulativeQty || 0;
                                    } else {
                                        break;
                                    }
                                }
                            }
                        }

                        let runningCumulativeInView = cumQtyBeforeView;
                        for (let i = effectiveTaskStartIndex; i <= effectiveTaskEndIndex; i++) {
                             const currentDateStr = format(dates[i], 'yyyy-MM-dd');
                             const daily = task.dailyData.find(d => d.date === currentDateStr);
                             if(daily) {
                                runningCumulativeInView = daily.cumulativeQty || runningCumulativeInView;
                                visibleDailyData.push({ ...daily, dayIndex: i, cumulativeQty: runningCumulativeInView });
                             } else {
                                 visibleDailyData.push({
                                     date: currentDateStr,
                                     styleCode: task.originalOrderDetails?.style || 'N/A',
                                     plannedQty: 0, 
                                     efficiency: 0,
                                     cumulativeQty: runningCumulativeInView,
                                     dayIndex: i
                                 });
                             }
                        }

                        return (
                          <DropdownMenu
                            key={task.id + resource.id}
                            open={activeContextMenuTask?.id === task.id && activeContextMenuTask?.resourceId === resource.id}
                            onOpenChange={(isOpen) => handleOpenChange(isOpen, task)}
                          >
                            <DropdownMenuTrigger asChild>
                              <div
                                draggable
                                onDragStart={(e) => handleTaskDragStart(e, task, resource.id)}
                                onContextMenu={(e) => handleContextMenu(e, task)}
                                className={cn(
                                  "absolute left-px right-px rounded shadow-md cursor-grab flex overflow-hidden border border-black/20",
                                  task.displayColor || task.color || 'bg-slate-800 text-white'
                                )}
                                style={{
                                  top: topOffset,
                                  height: blockHeight,
                                  zIndex: 10,
                                }}
                              >
                                {/* Style Sub-column */}
                                <div
                                  className="flex flex-col items-center justify-between p-1 border-r border-white/20"
                                  style={{width: STYLE_SUBCOLUMN_WIDTH}}
                                >
                                  <div className="[writing-mode:vertical-rl] transform rotate-180 text-xs font-semibold whitespace-nowrap p-0.5 self-center leading-tight mt-1" title={task.orderName}>
                                    {task.orderName}
                                  </div>
                                  {task.imageHint && (
                                    <Image
                                        src={`https://placehold.co/50x50.png`} 
                                        alt={task.imageHint}
                                        width={Math.min(50, STYLE_SUBCOLUMN_WIDTH - 10)}
                                        height={Math.min(50, STYLE_SUBCOLUMN_WIDTH - 10)}
                                        className="my-1 rounded object-cover"
                                        data-ai-hint={task.imageHint}
                                      />
                                  )}
                                  <div className="text-[10px] mt-auto p-0.5 truncate" title={task.originalOrderDetails?.style || task.orderName}>
                                      {task.originalOrderDetails?.style || task.orderName}
                                  </div>
                                </div>

                                {/* Plan & Cum Sub-columns Container */}
                                <div className="flex-grow flex flex-col">
                                  {visibleDailyData.map((daily, idx) => (
                                      <div
                                        key={idx}
                                        className="flex text-[10px] border-b border-white/20 last:border-b-0"
                                        style={{height: DATE_CELL_HEIGHT}}
                                        title={`Date: ${daily.date}\nPlanned: ${daily.plannedQty}\nEfficiency: ${daily.efficiency?.toFixed(1)}%\nCumulative: ${daily.cumulativeQty}`}
                                      >
                                        <div className="w-1/2 p-1 border-r border-white/20 flex items-center justify-center">{daily.plannedQty}</div>
                                        <div className="w-1/2 p-1 flex items-center justify-center">{daily.cumulativeQty}</div>
                                      </div>
                                    )
                                  )}
                                </div>
                              </div>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-64">
                                <DropdownMenuLabel>Order Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuGroup>
                                  <DropdownMenuItem onSelect={() => handleGenericAction('Style', task.id)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    <span>Style</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onSelect={() => { setIsTnaDialogOpen(true); setActiveContextMenuTask(null); }}>
                                    <CalendarCheck2 className="mr-2 h-4 w-4" />
                                    <span>T&amp;A</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onSelect={() => handleGenericAction('Materials', task.id)}>
                                    <Boxes className="mr-2 h-4 w-4" />
                                    <span>Materials</span>
                                  </DropdownMenuItem>
                                   <DropdownMenuItem onSelect={() => handleGenericAction('Product Details', task.id)}>
                                    <PackageIcon className="mr-2 h-4 w-4" />
                                    <span>Product Details</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onSelect={() => handleGenericAction('Order Details', task.id)}>
                                    <BadgeInfo className="mr-2 h-4 w-4" />
                                    <span>Order Details</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onSelect={() => handleGenericAction('Delivery Date', task.id)}>
                                    <DeliveryDateIcon className="mr-2 h-4 w-4" />
                                    <span>Delivery Date</span>
                                  </DropdownMenuItem>
                                </DropdownMenuGroup>
                                <DropdownMenuSeparator />
                                <DropdownMenuGroup>
                                  <DropdownMenuItem onSelect={() => handleGenericAction('Move Adjacent Strips', task.id)}>
                                    <Move className="mr-2 h-4 w-4" />
                                    <span>Move Adjacent Strips</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onSelect={() => handleUndo(task.id)} disabled={!task.originalOrderDetails}>
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <span>Unload Strip</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onSelect={() => handleSplitOrder(task)}>
                                    <ChevronsUpDown className="mr-2 h-4 w-4" />
                                    <span>Split Strip</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onSelect={() => handleMergeOrders(task)} disabled={!task.originalOrderDetails}>
                                    <Merge className="mr-2 h-4 w-4" />
                                    <span>Merge Orders</span>
                                  </DropdownMenuItem>
                                   <DropdownMenuSub>
                                    <DropdownMenuSubTrigger>
                                      <ArrowLeftRight className="mr-2 h-4 w-4" />
                                      <span>Pull/Push Order</span>
                                    </DropdownMenuSubTrigger>
                                    <DropdownMenuPortal>
                                      <DropdownMenuSubContent>
                                        <DropdownMenuItem onSelect={() => onStartPushPullMode(task.id, 'orderOnly')}>
                                          <MousePointerClick className="mr-2 h-4 w-4" />
                                          <span>Shift This Order Only</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onSelect={() => onStartPushPullMode(task.id, 'linkedOrders')}>
                                          <MousePointerClick className="mr-2 h-4 w-4" />
                                          <span>Shift Linked Orders</span>
                                        </DropdownMenuItem>
                                      </DropdownMenuSubContent>
                                    </DropdownMenuPortal>
                                  </DropdownMenuSub>
                                  <DropdownMenuItem onSelect={() => handleGenericAction('Linked Order Relationships', task.id)}>
                                    <LinkIcon className="mr-2 h-4 w-4" />
                                    <span>Linked Order Relationships</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onSelect={() => onOpenEqualiseOrderDialog(task)} disabled={!task.originalOrderDetails || task.originalOrderDetails.quantity <= 1}>
                                    <GitCompareArrows className="mr-2 h-4 w-4" />
                                    <span>Equalise Order</span>
                                  </DropdownMenuItem>
                                </DropdownMenuGroup>
                                <DropdownMenuSeparator />
                                <DropdownMenuGroup>
                                  <DropdownMenuItem onSelect={() => handleGenericAction('Planned Schedule', task.id)}>
                                    <CalendarCheck2 className="mr-2 h-4 w-4" />
                                    <span>Planned Schedule</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onSelect={() => {
                                      if (activeContextMenuTask) { setIsProductionEntryDialogOpen(true); }
                                      // No need to call setActiveContextMenuTask(null) here as onOpenChange of DropdownMenu will handle it
                                    }}>
                                    <ClipboardEdit className="mr-2 h-4 w-4" />
                                    <span>Production Entry</span>
                                  </DropdownMenuItem>
                                   <DropdownMenuItem onSelect={() => handleGenericAction('Edit Capacity Options', task.id)}>
                                    <Settings2 className="mr-2 h-4 w-4" />
                                    <span>Edit Capacity Options</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onSelect={() => handleGenericAction('Notes', task.id)}>
                                    <FileText className="mr-2 h-4 w-4" />
                                    <span>Notes</span>
                                  </DropdownMenuItem>
                                   <DropdownMenuItem onSelect={() => onOpenOrderStatusDialog(task)}>
                                    <BarChartHorizontalBig className="mr-2 h-4 w-4" />
                                    <span>Order Status</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onSelect={() => handleGenericAction('Consolidate Progress', task.id)}>
                                    <Combine className="mr-2 h-4 w-4" />
                                    <span>Consolidate Progress</span>
                                  </DropdownMenuItem>
                                </DropdownMenuGroup>
                                <DropdownMenuSeparator />
                                <DropdownMenuGroup>
                                  <DropdownMenuItem onSelect={() => handleGenericAction('Change Learning Curve', task.id)}>
                                    <Brain className="mr-2 h-4 w-4" />
                                    <span>Change Learning Curve</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onSelect={() => handleGenericAction('Change Start-Up', task.id)}>
                                    <PlayCircle className="mr-2 h-4 w-4" />
                                    <span>Change Start-Up</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onSelect={() => handleGenericAction('Change Standing Time', task.id)}>
                                    <Hourglass className="mr-2 h-4 w-4" />
                                    <span>Change Standing Time</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onSelect={() => handleGenericAction('Change Working Hours', task.id)}>
                                    <Clock className="mr-2 h-4 w-4" />
                                    <span>Change Working Hours</span>
                                  </DropdownMenuItem>
                                   <DropdownMenuItem onSelect={() => handleGenericAction('Multiple Strip Options', task.id)} disabled>
                                    <ListOrdered className="mr-2 h-4 w-4" />
                                    <span>Multiple Strip Options</span>
                                  </DropdownMenuItem>
                                </DropdownMenuGroup>

                                {(isLoadingAiSuggestions || aiSuggestions.length > 0) && <DropdownMenuSeparator />}
                                {isLoadingAiSuggestions && (
                                  <DropdownMenuItem disabled>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Loading AI suggestions...
                                  </DropdownMenuItem>
                                )}
                                {!isLoadingAiSuggestions && aiSuggestions.length > 0 && (
                                    <DropdownMenuLabel className="text-purple-600 flex items-center">
                                        <Sparkles className="mr-2 h-4 w-4 text-purple-500" />
                                        AI Suggestions
                                    </DropdownMenuLabel>
                                )}
                                {!isLoadingAiSuggestions && aiSuggestions.map((suggestion, index) => (
                                  <DropdownMenuItem key={index} onSelect={() => handleAiActionSelect(suggestion)} title={suggestion.reasoning || undefined}>
                                    {getSeverityIcon(suggestion.severity)}
                                    <span className="flex-1 truncate">{suggestion.actionLabel}</span>
                                  </DropdownMenuItem>
                                ))}
                                {!isLoadingAiSuggestions && aiSuggestions.length === 0 && task.originalOrderDetails && (
                                    <DropdownMenuItem disabled>
                                        <Info className="mr-2 h-4 w-4" />
                                        No specific AI suggestions.
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onSelect={() => handleOpenChange(false, undefined)}>
                                    <span>Exit</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        );
                      })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>
      {activeContextMenuTask && (
        <ProductionEntryDialog
          isOpen={isProductionEntryDialogOpen}
          onOpenChange={(open) => {
            setIsProductionEntryDialogOpen(open);
            if (!open) setActiveContextMenuTask(null); // Clear active task when dialog closes
          }}
          task={activeContextMenuTask}
          onSubmit={(data) => {
            console.log('Vertical Production Entry Data:', data, 'for task:', activeContextMenuTask.id);
            toast({ title: 'Production Entry Saved', description: `Data saved for ${activeContextMenuTask.orderName}` });
            setIsProductionEntryDialogOpen(false);
            setActiveContextMenuTask(null);
          }}
        />
      )}
       {activeContextMenuTask && ( 
          <TnaDetailDialog
            isOpen={isTnaDialogOpen}
            onOpenChange={(open) => {
                setIsTnaDialogOpen(open);
                if (!open) setActiveContextMenuTask(null); // Clear active task when dialog closes
            }}
            tnaPlan={(activeContextMenuTask as VerticalTask).tnaPlan}
        />
      )}
    </TooltipProvider>
  );
}
