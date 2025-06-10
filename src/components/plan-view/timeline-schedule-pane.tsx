
// Use client directive for drag-and-drop event handling and date calculations
'use client';

import * as React from 'react';
import type { Resource, Task, DailyData, TimelineViewMode, HolidayDetail, RowHeightLevel, VerticalTask, SchedulableResource } from './types';
import { ROW_HEIGHT_CONFIG } from './types';
import { TimelineTask } from './timeline-task';
import { format, addDays, differenceInDays, getDay, parseISO, differenceInHours, startOfDay, endOfDay, isWithinInterval, addHours, isSameDay, startOfHour, isSameHour } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { CalendarOff } from 'lucide-react';
import { mockLearningCurves } from '@/lib/learningCurveTypes'; // Corrected import
import { calculateDailyProduction } from '@/lib/learningCurve';


interface TimelineSchedulePaneProps {
  resources: Resource[]; // Changed from horizontalDisplayResources
  tasks: Task[];
  dailyData: DailyData[];
  displayedUnits: Date[]; // Prop from TimelineGrid
  unitCellWidth: number;
  timelineViewMode: TimelineViewMode;
  rowHeightLevel: RowHeightLevel;
  onTaskUpdate: (taskId: string, newResourceId: string, newStartDate: string, newEndDate: string) => void;
  expandedResourceId: string | null;
  unscheduledOrdersCount: number;
  onScheduleUnscheduledOrder: (orderId: string, newResourceId: string, newStartDate: string) => void;
  onUndoAllocation: (taskId: string) => void;
  onOpenSplitDialog: (task: Task | VerticalTask) => void;
  onOpenMergeDialog: (task: Task | VerticalTask) => void;
  isPushPullActive: boolean;
  onPushPullTargetSelected: (targetResourceId: string, targetDateString: string) => void;
  onStartPushPullMode: (taskId: string, scope: 'orderOnly' | 'linkedOrders') => void;
  isPastDay: (date: Date) => boolean;
  isPastHour: (date: Date) => boolean;
  holidaysMap: Map<string, HolidayDetail>;
  onOpenOrderStatusDialog: (task: Task | VerticalTask) => void;
  onOpenEqualiseOrderDialog: (task: Task | VerticalTask) => void;
  allResources: SchedulableResource[];
}


const UNSCHEDULED_LIST_MAX_ITEMS_NO_SCROLL = 3;
const UNSCHEDULED_LIST_HEADER_HEIGHT = 20;
const UNSCHEDULED_LIST_PADDING = 8;


export function TimelineSchedulePane({
  resources: resourcesProp,
  tasks,
  dailyData,
  displayedUnits: displayedUnitsProp,
  unitCellWidth,
  timelineViewMode,
  rowHeightLevel,
  onTaskUpdate,
  expandedResourceId,
  unscheduledOrdersCount,
  onScheduleUnscheduledOrder,
  onUndoAllocation,
  onOpenSplitDialog,
  onOpenMergeDialog,
  isPushPullActive,
  onPushPullTargetSelected,
  onStartPushPullMode,
  isPastDay,
  isPastHour,
  holidaysMap,
  onOpenOrderStatusDialog,
  onOpenEqualiseOrderDialog,
  allResources,
}: TimelineSchedulePaneProps) {
  const [isClient, setIsClient] = React.useState(false);
  const { toast } = useToast();
  React.useEffect(() => {
    setIsClient(true);
  }, []);

  const resources = resourcesProp || [];
  const displayedUnits = displayedUnitsProp || []; // Default to empty array if undefined

  const currentHeights = ROW_HEIGHT_CONFIG[rowHeightLevel] || ROW_HEIGHT_CONFIG.medium;

  const getHolidayInfo = (date: Date) => holidaysMap.get(format(date, 'yyyy-MM-dd'));

  const getEffectiveRowHeight = (resource: Resource) => {
    let expansionHeight = 0;
    if (resource.type === 'unit' && resource.id === expandedResourceId) {
      if (unscheduledOrdersCount > 0) {
        expansionHeight = UNSCHEDULED_LIST_HEADER_HEIGHT +
          Math.min(unscheduledOrdersCount, UNSCHEDULED_LIST_MAX_ITEMS_NO_SCROLL) * currentHeights.unscheduledItem +
          UNSCHEDULED_LIST_PADDING;
      } else {
        expansionHeight = UNSCHEDULED_LIST_HEADER_HEIGHT + 20 + UNSCHEDULED_LIST_PADDING;
      }
    }
    let baseHeight = currentHeights.mainUnit;
    if (resource.type === 'header') baseHeight = currentHeights.headerUnit * 2;
    else if (resource.type === 'groupHeader') baseHeight = currentHeights.groupHeaderUnit;
    else if (resource.type === 'subtotal' && resource.subRowsData?.length) baseHeight = currentHeights.mainUnit + (resource.subRowsData.length * currentHeights.subUnit);
    else if (resource.type === 'unit' || resource.type === 'holding') baseHeight = currentHeights.mainUnit + currentHeights.subUnit;
    return baseHeight + expansionHeight;
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
     event.currentTarget.classList.add('bg-primary/10');
  };
  
  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.currentTarget.classList.remove('bg-primary/10');
  };


  const getTargetDateFromDropEvent = (event: React.DragEvent<HTMLDivElement>): string => {
    const scheduleContainer = event.currentTarget.closest('.relative[style*="width:"]');
    if (!scheduleContainer || displayedUnits.length === 0) return format(new Date(), 'yyyy-MM-dd');

    const scheduleRect = scheduleContainer.getBoundingClientRect();
    const dropXInSchedule = event.clientX - scheduleRect.left + event.currentTarget.scrollLeft; 
    const unitIndex = Math.max(0, Math.floor(dropXInSchedule / unitCellWidth));
    
    if (unitIndex >= displayedUnits.length) { // Safety check
        return format(displayedUnits[displayedUnits.length - 1], timelineViewMode === 'hourly' ? 'yyyy-MM-dd HH:00:00' : 'yyyy-MM-dd');
    }
    const newUnitStartDate = displayedUnits[unitIndex];


    if (timelineViewMode === 'hourly') {
      return format(newUnitStartDate, 'yyyy-MM-dd HH:00:00');
    }
    return format(newUnitStartDate, 'yyyy-MM-dd');
  };


  const handleDrop = (event: React.DragEvent<HTMLDivElement>, targetResourceId: string) => {
    event.preventDefault();
    event.currentTarget.classList.remove('bg-primary/10');
    const targetDateString = getTargetDateFromDropEvent(event);
    const targetDateObj = parseISO(targetDateString);

    if (timelineViewMode === 'hourly' ? isPastHour(targetDateObj) : isPastDay(targetDateObj)) {
      toast({ title: "Action Blocked", description: "Cannot drop task into a past time slot.", variant: "destructive" });
      return;
    }
    const holidayInfo = getHolidayInfo(targetDateObj);
    if (holidayInfo && holidayInfo.type === 'full') {
      toast({ title: "Action Blocked", description: "Cannot schedule task starting on a full holiday.", variant: "destructive" });
      return;
    }

    if (isPushPullActive) {
        onPushPullTargetSelected(targetResourceId, targetDateString);
        return;
    }

    const rawData = event.dataTransfer.getData('application/json');
    const plainTextData = event.dataTransfer.getData('text/plain');


    if (rawData) {
        try {
            const parsedData = JSON.parse(rawData);
            if (parsedData.type === 'NEW_TASK_FROM_UNSCHEDULED' && parsedData.orderId) {
                onScheduleUnscheduledOrder(parsedData.orderId, targetResourceId, targetDateString);
                return;

            } else if (parsedData.type === 'EXISTING_TASK' && parsedData.taskId) {
                const originalTask = tasks.find(t => t.id === parsedData.taskId);
                if (originalTask) {
                    const originalTaskStartDate = parseISO(originalTask.startDate);
                    const originalTaskEndDate = parseISO(originalTask.endDate);
                    let duration = 0;
                    if (timelineViewMode === 'hourly') {
                        duration = differenceInHours(originalTaskEndDate, originalTaskStartDate);
                         const newEndDateString = format(addHours(parseISO(targetDateString), duration), 'yyyy-MM-dd HH:mm:ss');
                         onTaskUpdate(parsedData.taskId, targetResourceId, targetDateString, newEndDateString);
                    } else {
                        duration = differenceInDays(originalTaskEndDate, originalTaskStartDate);
                        const newEndDateString = format(addDays(parseISO(targetDateString), duration), 'yyyy-MM-dd');
                        onTaskUpdate(parsedData.taskId, targetResourceId, targetDateString, newEndDateString);
                    }
                }
                return;
            }
        } catch (e) { console.error("Failed to parse dragged data", e); }
    }

    if (plainTextData && !rawData) {
        const taskId = plainTextData;
        const originalTask = tasks.find(t => t.id === taskId);
        if (originalTask) {
            const originalTaskStartDate = parseISO(originalTask.startDate);
            const originalTaskEndDate = parseISO(originalTask.endDate);
            if (timelineViewMode === 'hourly') {
                const durationHours = differenceInHours(originalTaskEndDate, originalTaskStartDate);
                const newEndDateString = format(addHours(parseISO(targetDateString), durationHours), 'yyyy-MM-dd HH:mm:ss');
                onTaskUpdate(taskId, targetResourceId, targetDateString, newEndDateString);
            } else {
                const durationDays = differenceInDays(originalTaskEndDate, originalTaskStartDate);
                const newEndDateString = format(addDays(parseISO(targetDateString), durationDays), 'yyyy-MM-dd');
                onTaskUpdate(taskId, targetResourceId, targetDateString, newEndDateString);
            }
        }
    }
  };

  const handleClick = (event: React.MouseEvent<HTMLDivElement>, targetResourceId: string) => {
    if (isPushPullActive) {
      const scheduleContainer = event.currentTarget.closest('.relative[style*="width:"]');
      if (!scheduleContainer || displayedUnits.length === 0) return;

      const scheduleRect = scheduleContainer.getBoundingClientRect();
      const clickXInSchedule = event.clientX - scheduleRect.left + event.currentTarget.scrollLeft;
      const unitIndex = Math.max(0, Math.floor(clickXInSchedule / unitCellWidth));
      
      if (unitIndex >= displayedUnits.length) return; // Click out of bounds

      const targetUnitStartDate = displayedUnits[unitIndex];

      let targetDateString = format(targetUnitStartDate, 'yyyy-MM-dd');
      if (timelineViewMode === 'hourly') {
          targetDateString = format(targetUnitStartDate, 'yyyy-MM-dd HH:00:00');
      }

      const targetDateObj = parseISO(targetDateString);
      if (timelineViewMode === 'hourly' ? isPastHour(targetDateObj) : isPastDay(targetDateObj)) {
        toast({ title: "Action Blocked", description: "Cannot apply Push/Pull to a past time slot.", variant: "destructive" });
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

  if (!isClient || !displayedUnits || displayedUnits.length === 0) {
    const fallbackTotalUnits = 30;
    const fallbackWidth = fallbackTotalUnits * (unitCellWidth || ROW_HEIGHT_CONFIG.medium.mainUnit);
    return <div className="relative" style={{ width: fallbackWidth > 0 ? fallbackWidth : 500 }}>Loading schedule...</div>;
  }


  const totalTimelineRenderWidth = displayedUnits.length * unitCellWidth;

  return (
    <div className="relative" style={{ width: totalTimelineRenderWidth }}>
      <div className="absolute inset-0 grid grid-cols-1"> {/* Removed divide-y */}
        {resources.map((resource) => {
           const effectiveRowHeight = getEffectiveRowHeight(resource);
           const taskHeight = currentHeights.mainUnit - currentHeights.taskInnerHeightReduction;
           const taskTop = currentHeights.taskTopMargin;
          return (
            <div
              key={resource.id}
              className={cn(
                "relative flex border-b border-border", // Added border-border
                isPushPullActive && resource.type === 'unit' && "cursor-crosshair",
                resource.type === 'header' && "bg-muted/20"
                )}
              style={{ height: effectiveRowHeight }}
              onDragOver={resource.type === 'unit' ? handleDragOver : undefined}
              onDragLeave={resource.type === 'unit' ? handleDragLeave : undefined}
              onDrop={resource.type === 'unit' ? (e) => handleDrop(e, resource.id) : undefined}
              onClick={resource.type === 'unit' ? (e) => handleClick(e, resource.id) : undefined}
            >
              {/* Background Cells */}
              {displayedUnits.map((unitDate, unitIndex) => {
                let isWeekendOrSpecial = false;
                let isPast = false;
                const holidayInfo = getHolidayInfo(unitDate);

                if (timelineViewMode === 'hourly') {
                  isPast = isPastHour(unitDate);
                  const dayOfHour = startOfDay(unitDate);
                  isWeekendOrSpecial = getDay(dayOfHour) === 0 || getDay(dayOfHour) === 6;
                } else {
                  isPast = isPastDay(unitDate);
                  isWeekendOrSpecial = getDay(unitDate) === 0 || getDay(unitDate) === 6;
                }

                return (
                  <div
                    key={`${resource.id}-${unitIndex}-bg`}
                    className={cn(
                      "border-r border-border relative", 
                      isPast ? "bg-slate-100 dark:bg-slate-800/50 opacity-70 cursor-not-allowed" :
                      (holidayInfo?.type === 'full' ? "bg-rose-100 dark:bg-rose-800/40" :
                      (holidayInfo ? "bg-amber-100 dark:bg-amber-800/30" :
                      (isWeekendOrSpecial ? "bg-muted/20 dark:bg-slate-700/20" : "bg-card"))), 
                       resource.type === 'header' && "bg-muted/30"
                    )}
                    style={{
                      minWidth: unitCellWidth, width: unitCellWidth,
                      height: resource.type === 'header' ? (currentHeights.headerUnit * 2) : effectiveRowHeight
                    }}
                    title={holidayInfo ? `Holiday: ${holidayInfo.type}` : undefined}
                  >
                  {holidayInfo && !isPast && (
                    <CalendarOff className="absolute top-1 right-1 h-3 w-3 text-rose-500 opacity-70" />
                  )}
                  </div>
                );
              })}

              {/* Tasks for 'unit' type resources */}
              {resource.type === 'unit' && (
                <div
                  className="absolute top-0 left-0 w-full overflow-hidden"
                  style={{height: currentHeights.mainUnit}} 
                >
                  {(() => {
                    // Get all tasks for this resource and calculate their positions
                    const resourceTasks = tasks
                      .filter((task) => task.resourceId === resource.id)
                      .map((task) => {
                        const taskStartDateObj = parseISO(task.startDate);
                        const taskEndDateObj = parseISO(task.endDate);

                        let taskStartUnitIndex = -1;
                        let taskEndUnitIndex = -1;

                        displayedUnits.forEach((unitDate, index) => {
                          const unitStart = (timelineViewMode === 'hourly') ? unitDate : startOfDay(unitDate);
                          const unitEnd = (timelineViewMode === 'hourly') ? addHours(unitStart, 1) : endOfDay(unitStart);
                          
                          const isTaskStartOnOrBeforeUnitEnd = taskStartDateObj < unitEnd;
                          const isTaskEndOnOrAfterUnitStart = taskEndDateObj >= unitStart;

                          if (isTaskStartOnOrBeforeUnitEnd && isTaskEndOnOrAfterUnitStart) {
                             if (taskStartUnitIndex === -1) {
                                  taskStartUnitIndex = index;
                              }
                              taskEndUnitIndex = index;
                          }
                        });
                        
                        if (taskStartUnitIndex === -1 || taskEndUnitIndex === -1) {
                          return null; 
                        }

                        // Clamp the task end index to stay within the visible timeline bounds
                        const clampedTaskEndIndex = Math.min(taskEndUnitIndex, displayedUnits.length - 1);
                        
                        const left = taskStartUnitIndex * unitCellWidth;
                        const width = (clampedTaskEndIndex - taskStartUnitIndex + 1) * unitCellWidth;

                        if (width <= 0) return null;

                        return {
                          task,
                          left,
                          width,
                          startIndex: taskStartUnitIndex,
                          endIndex: clampedTaskEndIndex
                        };
                      })
                      .filter(Boolean)
                      .filter((item): item is NonNullable<typeof item> => item !== null);

                    // Simple vertical stacking for overlapping tasks
                    const stackedTasks: Array<{
                      task: any;
                      left: number;
                      width: number;
                      startIndex: number;
                      endIndex: number;
                      stackLevel: number;
                    }> = [];
                    const occupiedLevels: Array<Set<number>> = []; // Array to track which stack levels are occupied at each time unit

                    for (const taskData of resourceTasks) {
                      let stackLevel = 0;
                      
                      // Find the lowest available stack level for this task's time range
                      while (true) {
                        let levelAvailable = true;
                        
                        // Check if this stack level is free for the entire task duration
                        for (let unitIndex = taskData.startIndex; unitIndex <= taskData.endIndex; unitIndex++) {
                          if (!occupiedLevels[unitIndex]) occupiedLevels[unitIndex] = new Set();
                          if (occupiedLevels[unitIndex].has(stackLevel)) {
                            levelAvailable = false;
                            break;
                          }
                        }
                        
                        if (levelAvailable) {
                          // Mark this level as occupied for the task's duration
                          for (let unitIndex = taskData.startIndex; unitIndex <= taskData.endIndex; unitIndex++) {
                            if (!occupiedLevels[unitIndex]) occupiedLevels[unitIndex] = new Set();
                            occupiedLevels[unitIndex].add(stackLevel);
                          }
                          break;
                        }
                        
                        stackLevel++;
                        // Safety check to prevent infinite loops
                        if (stackLevel > 10) break;
                      }
                      
                      stackedTasks.push({ ...taskData, stackLevel });
                    }

                    const schedulableResource = allResources.find(r => r.id === resource.id);

                    return stackedTasks.map(({ task, left, width, stackLevel }) => {
                      const adjustedHeight = Math.max(12, taskHeight - Math.min(stackLevel * 2, 8)); // Reduce height slightly for stacked tasks, max reduction 8px
                      const adjustedTopMargin = taskTop + (stackLevel * (adjustedHeight + 2)); // Stack with 2px gap
                      
                      return (
                        <TimelineTask
                          key={task.id} 
                          task={task} 
                          left={left} 
                          width={width} 
                          height={adjustedHeight} 
                          topMargin={adjustedTopMargin}
                          onUndoAllocation={onUndoAllocation}
                          resourceCapacityPerDay={schedulableResource?.capacity}
                          onOpenSplitDialog={onOpenSplitDialog as (task: Task) => void}
                          onOpenMergeDialog={onOpenMergeDialog as (task: Task) => void}
                          onStartPushPullMode={onStartPushPullMode}
                          onOpenOrderStatusDialog={onOpenOrderStatusDialog}
                          onOpenEqualiseOrderDialog={onOpenEqualiseOrderDialog}
                        />
                      );
                    });
                  })()}
                </div>
              )}

              {/* Capacity / Load Row for 'unit' or 'holding' */}
              {(resource.type === 'unit' || resource.type === 'holding') && (
                <div className="absolute bottom-0 left-0 w-full flex" style={{ height: currentHeights.subUnit, top: currentHeights.mainUnit }}>
                  {displayedUnits.map((unitDate, unitIndex) => {
                    const dateKey = timelineViewMode === 'hourly' ? format(startOfHour(unitDate), 'yyyy-MM-dd HH:00:00') : format(startOfDay(unitDate), 'yyyy-MM-dd');
                    const dayData = dailyData.find(d => d.resourceId === resource.id && d.date === dateKey);
                    const capacity = dayData?.value ?? (allResources.find(r=>r.id === resource.id)?.capacity || 0);
                    const load = Math.round(dayData?.calculatedLoad ?? 0);
                    const displayValue = `${capacity} / ${load}`;
                    const titleText = `Std Cap: ${capacity}\nCalc Load: ${load}`;
                    const isPast = timelineViewMode === 'hourly' ? isPastHour(unitDate) : isPastDay(unitDate);
                    const holidayInfo = getHolidayInfo(unitDate);
                    return (
                      <div
                        key={`${resource.id}-${unitIndex}-capload`}
                        className={cn(
                          "flex items-center justify-center text-[10px] text-muted-foreground border-r border-border", 
                           isPast && "opacity-70",
                           holidayInfo?.type === 'full' && !isPast && "bg-rose-50 dark:bg-rose-900/10",
                           holidayInfo && holidayInfo.type !== 'full' && !isPast && "bg-amber-50 dark:bg-amber-900/5"
                        )}
                        style={{ minWidth: unitCellWidth, width: unitCellWidth, height: currentHeights.subUnit }}
                        title={titleText}
                      >
                        {displayValue}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Subtotal Row */}
              {resource.type === 'subtotal' && resource.subRowsData && (
                 <div className="absolute bottom-0 left-0 w-full flex flex-col" style={{ height: resource.subRowsData.length * currentHeights.subUnit, top: currentHeights.mainUnit }}>
                    {resource.subRowsData.map((subRowConfig, subRowIndex) => (
                        <div key={subRowIndex} className="flex w-full" style={{height: currentHeights.subUnit}}>
                        {displayedUnits.map((unitDate, unitIndex) => {
                            const dateKey = timelineViewMode === 'hourly' ? format(startOfHour(unitDate), 'yyyy-MM-dd HH:00:00') : format(startOfDay(unitDate), 'yyyy-MM-dd');
                            let valueToShow: string | number = 0;
                            let titleText = '';
                            const relevantSchedulableResources = allResources.filter(r => resources.find(hr => hr.id === r.id && hr.type === 'unit'));


                            if (subRowConfig.dailyValuesKey === 'totalCapacity') {
                                valueToShow = relevantSchedulableResources.reduce((sum, res) => {
                                   const dailyCapData = dailyData.find(d => d.resourceId === res.id && d.date === dateKey);
                                   return sum + (dailyCapData?.value || res.capacity || 0);
                                },0);
                                titleText = `Total Standard Capacity: ${valueToShow}`;
                            } else if (subRowConfig.dailyValuesKey === 'calculatedLoad') {
                                 valueToShow = relevantSchedulableResources.reduce((sum, res) => sum + Math.round(dailyData.find(d => d.resourceId === res.id && d.date === dateKey)?.calculatedLoad || 0), 0);
                                titleText = `Total Calculated Load: ${valueToShow}`;
                            }
                            const isPast = timelineViewMode === 'hourly' ? isPastHour(unitDate) : isPastDay(unitDate);
                             const holidayInfo = getHolidayInfo(unitDate);
                            return (
                            <div
                                key={`${resource.id}-${subRowIndex}-${unitIndex}-sub`}
                                className={cn(
                                  "flex items-center justify-center text-[10px] font-semibold text-foreground border-r border-border bg-muted/30", 
                                  isPast && "opacity-70",
                                  holidayInfo?.type === 'full' && !isPast && "bg-rose-100/50 dark:bg-rose-900/20",
                                  holidayInfo && holidayInfo.type !== 'full' && !isPast && "bg-amber-100/50 dark:bg-amber-900/10"
                                )}
                                style={{ minWidth: unitCellWidth, width: unitCellWidth, height: currentHeights.subUnit }}
                                title={titleText}
                            >
                                {valueToShow.toLocaleString()}
                            </div>
                            );
                        })}
                        </div>
                    ))}
                 </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}


