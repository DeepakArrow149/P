
// src/components/plan-view/timeline-grid.tsx
'use client';

import * as React from 'react';
import { TargetDisplayPanel } from './TargetDisplayPanel';
import { TimelineHeader } from './timeline-header';
import { TimelineSchedulePane } from './timeline-schedule-pane';
import type {
  DailyData,
  HolidayDetail,
  RowHeightLevel,
  SchedulableResource,
  Task,
  TimelineViewMode,
  UnscheduledOrder,
  VerticalTask,
  SubProcessViewMode,
  Resource,
} from './types';
import { ROW_HEIGHT_CONFIG, RESOURCE_PANE_WIDTH } from './types';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { format, parseISO, addDays, differenceInDays } from 'date-fns'; // Added addDays and differenceInDays

const SCROLL_SPEED_PIXELS_PER_INTERVAL = 20;
const SCROLL_INTERVAL_MS = 50;
const HOT_ZONE_WIDTH = 50;

export interface TimelineGridProps {
  horizontalDisplayResources: Resource[];
  tasks: Task[];
  dailyData: DailyData[];
  displayedUnits: Date[];
  unitCellWidth: number;
  timelineViewMode: TimelineViewMode;
  rowHeightLevel: RowHeightLevel;
  onTaskUpdate: (taskId: string, newResourceId: string, newStartDate: string, newEndDate: string) => void;
  expandedResourceId?: string | null;
  unscheduledOrders?: UnscheduledOrder[];
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
  selectedResourceIds: string[];
  schedulableResources: SchedulableResource[];
  onOpenOrderStatusDialog: (task: Task | VerticalTask) => void;
  isSameDay: (dateLeft: Date | number, dateRight: Date | number) => boolean;
  onOpenEqualiseOrderDialog: (task: Task | VerticalTask) => void;
  isClient: boolean;
  viewMode: 'horizontal' | 'vertical';
  subProcessViewMode: SubProcessViewMode | null;

  targetDisplayScheduleRef: React.RefObject<HTMLDivElement>;
  headerScrollRef: React.RefObject<HTMLDivElement>;
  rightPaneHorizontalScrollRef: React.RefObject<HTMLDivElement>;
  schedulePaneVerticalScrollRef: React.RefObject<HTMLDivElement>;
  handleScheduleVerticalScroll: (scrollTopValue: number) => void;
}

export default function TimelineGrid(props: TimelineGridProps) {
  const {
    tasks,
    dailyData,
    displayedUnits,
    unitCellWidth,
    timelineViewMode,
    rowHeightLevel,
    onTaskUpdate,
    expandedResourceId,
    unscheduledOrders,
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
    selectedResourceIds,
    schedulableResources,
    onOpenOrderStatusDialog,
    isSameDay,
    onOpenEqualiseOrderDialog,
    isClient,
    viewMode,
    subProcessViewMode,
    targetDisplayScheduleRef,
    headerScrollRef,
    rightPaneHorizontalScrollRef,
    schedulePaneVerticalScrollRef,
    handleScheduleVerticalScroll,
  } = props;

  const mainScrollAreaRef = React.useRef<HTMLDivElement>(null);
  const scrollIntervalRef = React.useRef<NodeJS.Timeout | null>(null);
  const [isAutoScrolling, setIsAutoScrolling] = React.useState<'left' | 'right' | false>(false);
  const isSyncingHorizontalScroll = React.useRef(false);


  const stopAutoScroll = React.useCallback(() => {
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
      scrollIntervalRef.current = null;
    }
    setIsAutoScrolling(false);
  }, []);

  const startAutoScroll = React.useCallback((direction: 'left' | 'right') => {
    stopAutoScroll();
    setIsAutoScrolling(direction);
    scrollIntervalRef.current = setInterval(() => {
      const scrollableElement = mainScrollAreaRef.current?.querySelector<HTMLDivElement>('[data-radix-scroll-area-viewport]');
      if (scrollableElement) {
        const currentScroll = scrollableElement.scrollLeft;
        const maxScroll = scrollableElement.scrollWidth - scrollableElement.clientWidth;
        let newScrollLeft = currentScroll + (direction === 'right' ? SCROLL_SPEED_PIXELS_PER_INTERVAL : -SCROLL_SPEED_PIXELS_PER_INTERVAL);
        newScrollLeft = Math.max(0, Math.min(newScrollLeft, maxScroll));
        scrollableElement.scrollLeft = newScrollLeft;

        if ((direction === 'left' && newScrollLeft === 0) || (direction === 'right' && newScrollLeft === maxScroll)) {
          stopAutoScroll();
        }
      } else {
        stopAutoScroll();
      }
    }, SCROLL_INTERVAL_MS);
  }, [stopAutoScroll]);

  const handleMouseMoveOnScheduleArea = React.useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    const scrollAreaViewport = mainScrollAreaRef.current?.querySelector<HTMLDivElement>('[data-radix-scroll-area-viewport]');
    if (!scrollAreaViewport) return;

    const scrollAreaRect = scrollAreaViewport.getBoundingClientRect();
    const mouseX = event.clientX - scrollAreaRect.left;

    if (mouseX < HOT_ZONE_WIDTH) {
      if (isAutoScrolling !== 'left') startAutoScroll('left');
    } else if (mouseX > scrollAreaRect.width - HOT_ZONE_WIDTH) {
      if (isAutoScrolling !== 'right') startAutoScroll('right');
    } else {
      if (isAutoScrolling) stopAutoScroll();
    }
  }, [isAutoScrolling, startAutoScroll, stopAutoScroll]);

  const handleMouseLeaveScheduleArea = React.useCallback(() => {
    stopAutoScroll();
  }, [stopAutoScroll]);

  React.useEffect(() => {
    return () => {
      stopAutoScroll(); // Cleanup on unmount
    };
  }, [stopAutoScroll]);

  // Auto-scroll to today
   React.useEffect(() => {
    const timerId = setTimeout(() => {
      if (
        !isClient ||
        timelineViewMode === 'hourly' ||
        !displayedUnits || displayedUnits.length === 0 ||
        !mainScrollAreaRef || 
        !mainScrollAreaRef.current ||
        !headerScrollRef || 
        !headerScrollRef.current ||
        !headerScrollRef.current.hasChildNodes() 
      ) {
        return;
      }
      
      const scrollContainerViewport = mainScrollAreaRef.current.querySelector<HTMLDivElement>('[data-radix-scroll-area-viewport]');
      const headerContentContainer = headerScrollRef.current;

      if (scrollContainerViewport && headerContentContainer) {
        const todayColumn = headerContentContainer.querySelector<HTMLElement>('#timeline-header-today-column');
        if (todayColumn) {
          const cellLeft = todayColumn.offsetLeft;
          const cellWidth = todayColumn.offsetWidth;
          const containerWidth = scrollContainerViewport.clientWidth;
          let scrollTo = cellLeft - (containerWidth / 2) + (cellWidth / 2);
          scrollTo = Math.max(0, Math.min(scrollTo, scrollContainerViewport.scrollWidth - containerWidth));

          if (Math.abs(scrollContainerViewport.scrollLeft - scrollTo) > 1) {
            scrollContainerViewport.scrollLeft = scrollTo;
          }
        }
      }
    }, 50); 

    return () => clearTimeout(timerId);
  }, [isClient, displayedUnits, timelineViewMode, unitCellWidth, headerScrollRef]);


  const handleRightPaneHorizontalScroll = (event: React.UIEvent<HTMLDivElement>) => {
    if (isSyncingHorizontalScroll.current) return;
    const scrollLeft = event.currentTarget.scrollLeft;
    
    if (targetDisplayScheduleRef.current && targetDisplayScheduleRef.current.scrollLeft !== scrollLeft) {
        isSyncingHorizontalScroll.current = true;
        targetDisplayScheduleRef.current.scrollLeft = scrollLeft;
        requestAnimationFrame(() => { isSyncingHorizontalScroll.current = false; });
    }
    if (headerScrollRef.current && headerScrollRef.current.scrollLeft !== scrollLeft) {
        isSyncingHorizontalScroll.current = true;
        headerScrollRef.current.scrollLeft = scrollLeft;
        requestAnimationFrame(() => { isSyncingHorizontalScroll.current = false; });
    }
  };
  
  React.useEffect(() => {
    const scrollViewport = mainScrollAreaRef.current?.querySelector<HTMLDivElement>('[data-radix-scroll-area-viewport]');

    if (scrollViewport) {
      const handleWheel = (event: WheelEvent) => {
        if (event.deltaY !== 0 && Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
          // Only act on vertical wheel scrolls to convert them to horizontal
          event.preventDefault(); // Prevent default vertical scroll of the page or this element
          scrollViewport.scrollLeft += event.deltaY;
        }
        // Horizontal scrolls (deltaX) will be handled natively by the ScrollArea's viewport if overflow-x is auto/scroll
      };

      scrollViewport.addEventListener('wheel', handleWheel, { passive: false });
      return () => {
        scrollViewport.removeEventListener('wheel', handleWheel);
      };
    }
  }, [mainScrollAreaRef]); // Re-attach if ref changes (should be stable)


  const currentConfiguredHeights = ROW_HEIGHT_CONFIG[rowHeightLevel] || ROW_HEIGHT_CONFIG.medium;
  const targetDisplayPanelHeight = selectedResourceIds.length > 0
    ? currentConfiguredHeights.targetUnit * (selectedResourceIds.length + 1)
    : 0;
  const timelineHeaderHeight = currentConfiguredHeights.headerUnit * 2;

  const totalTimelineRenderWidth = displayedUnits && unitCellWidth ? displayedUnits.length * unitCellWidth : 0;
  
  // Root div of TimelineGrid is now the main horizontal scroller for the calendar content
  return (
    <div 
      ref={rightPaneHorizontalScrollRef} 
      className="flex-1 flex flex-col min-w-0 overflow-x-auto"
      onScroll={handleRightPaneHorizontalScroll}
      onMouseMove={handleMouseMoveOnScheduleArea}
      onMouseLeave={handleMouseLeaveScheduleArea}
    >
      <div className="h-full flex flex-col relative" style={{ width: totalTimelineRenderWidth > 0 ? totalTimelineRenderWidth : '100%', minWidth: '100%' }}>
        {/* Sticky Headers within Right Pane */}
        <div className="sticky top-0 z-20 bg-card flex-shrink-0"> {/* Sticks to the top of the rightPaneScrollRef */}
          {selectedResourceIds.length > 0 && viewMode === 'horizontal' && !subProcessViewMode && (
            <TargetDisplayPanel
              displayedUnits={displayedUnits}
              timelineViewMode={timelineViewMode}
              selectedResourceIds={selectedResourceIds}
              allResources={schedulableResources}
              unitCellWidth={unitCellWidth}
              holidaysMap={holidaysMap}
              isPastDay={isPastDay}
              isPastHour={isPastHour}
              scrollRef={targetDisplayScheduleRef}
              rowHeightLevel={rowHeightLevel}
              style={{ height: targetDisplayPanelHeight }}
            />
          )}
          <TimelineHeader
            displayedUnits={displayedUnits}
            unitCellWidth={unitCellWidth}
            timelineViewMode={timelineViewMode}
            rowHeightLevel={rowHeightLevel}
            isPastDay={isPastDay}
            isPastHour={isPastHour}
            holidaysMap={holidaysMap}
            scrollRef={headerScrollRef}
            isSameDay={isSameDay}
            startDate={displayedUnits && displayedUnits.length > 0 ? displayedUnits[0] : new Date()}
            style={{ height: timelineHeaderHeight }}
          />
        </div>

        {/* Main Schedule Pane (Tasks) - This ScrollArea is now for VERTICAL scroll only */}
        <ScrollArea 
          className="flex-grow" // Takes up remaining vertical space
          ref={schedulePaneVerticalScrollRef}
          onScroll={(e) => handleScheduleVerticalScroll(e.currentTarget.scrollTop)}
          data-testid="timeline-grid-schedule-scroller"
        >
          <TimelineSchedulePane
            resources={props.horizontalDisplayResources || []}
            tasks={tasks}
            dailyData={dailyData}
            displayedUnits={displayedUnits}
            unitCellWidth={unitCellWidth}
            timelineViewMode={timelineViewMode}
            rowHeightLevel={rowHeightLevel}
            onTaskUpdate={onTaskUpdate}
            expandedResourceId={expandedResourceId} // Still needed for task context if any
            unscheduledOrdersCount={unscheduledOrders ? unscheduledOrders.length : 0} // For context if any
            onScheduleUnscheduledOrder={onScheduleUnscheduledOrder}
            onUndoAllocation={onUndoAllocation}
            onOpenSplitDialog={onOpenSplitDialog}
            onOpenMergeDialog={onOpenMergeDialog}
            isPushPullActive={isPushPullActive}
            onPushPullTargetSelected={onPushPullTargetSelected}
            onStartPushPullMode={onStartPushPullMode}
            isPastDay={isPastDay}
            isPastHour={isPastHour}
            holidaysMap={holidaysMap}
            onOpenOrderStatusDialog={onOpenOrderStatusDialog}
            onOpenEqualiseOrderDialog={onOpenEqualiseOrderDialog}
            allResources={schedulableResources}
          />
        </ScrollArea>
      </div>
    </div>
  );
}
