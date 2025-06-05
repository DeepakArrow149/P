
// src/components/plan-view/TargetDisplayPanel.tsx
'use client';

import * as React from 'react';
import type { SchedulableResource, TimelineViewMode, HolidayDetail, RowHeightLevel } from './types';
import { ROW_HEIGHT_CONFIG, RESOURCE_PANE_WIDTH } from './types'; 
import { format, getDay, getISOWeek, getYear, getMonth, startOfDay, addDays, eachDayOfInterval, isSameWeek as dateFnsIsSameWeek, isSameMonth, parseISO as dateFnsParseISO, getDaysInMonth, startOfWeek as dateFnsStartOfWeek, startOfMonth } from 'date-fns';
import { cn } from '@/lib/utils';
import { CalendarOff } from 'lucide-react';

interface TargetDisplayPanelProps extends React.HTMLAttributes<HTMLDivElement> {
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

export function TargetDisplayPanel({
  displayedUnits,
  timelineViewMode,
  selectedResourceIds,
  allResources,
  unitCellWidth,
  holidaysMap,
  isPastDay,
  isPastHour,
  scrollRef,
  rowHeightLevel,
  className,
  style,
  ...restOfProps
}: TargetDisplayPanelProps) {
  if (selectedResourceIds.length === 0) {
    return null; 
  }

  const currentHeights = ROW_HEIGHT_CONFIG[rowHeightLevel] || ROW_HEIGHT_CONFIG.medium;
  const panelUnitHeight = currentHeights.targetUnit;
  const totalPanelHeight = panelUnitHeight * (selectedResourceIds.length + 1); 

  const selectedResources = allResources.filter(r => selectedResourceIds.includes(r.id));
  const getHolidayInfo = (date: Date) => holidaysMap.get(format(date, 'yyyy-MM-dd'));

  const getTargetForPeriod = (resource: SchedulableResource, periodStartDate: Date): number => {
    let target = 0;
    const dailyCapacity = resource.capacity || 0;

    switch (timelineViewMode) {
      case 'hourly': 
      case 'daily':
        if (!getHolidayInfo(periodStartDate) || getHolidayInfo(periodStartDate)?.type !== 'full') {
          target = dailyCapacity;
        }
        break;
      case 'weekly':
        const weekStart = dateFnsStartOfWeek(periodStartDate, { weekStartsOn: 1 }); // Monday
        const weekDays = eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 6) });
        target = weekDays.reduce((sum, day) => {
          if (!getHolidayInfo(day) || getHolidayInfo(day)?.type !== 'full') {
            return sum + dailyCapacity;
          }
          return sum;
        }, 0);
        break;
      case 'monthly':
        const monthStart = startOfMonth(periodStartDate);
        const daysInMonthCount = getDaysInMonth(monthStart);
        const monthDays = Array.from({ length: daysInMonthCount }, (_, i) => addDays(monthStart, i));
        target = monthDays.reduce((sum, day) => {
           if (!getHolidayInfo(day) || getHolidayInfo(day)?.type !== 'full') {
            return sum + dailyCapacity;
          }
          return sum;
        },0);
        break;
    }
    return target;
  };
  
  const renderScheduleContent = () => {
    if (!displayedUnits || displayedUnits.length === 0) {
      return <div className="flex-grow p-1 text-center text-xs">Loading units...</div>;
    }

    let finalAggregatedUnits: { date: Date, label: string, span: number }[] = [];
    let tempSpan = 0;
    let tempLabel = "";
    let tempStartDate = displayedUnits[0];

    displayedUnits.forEach((unitDate, index) => {
        let currentUnitPeriodLabel = "";
        let effectivePeriodStartDateForLabel = unitDate; // This will be the start of the week/month for labeling

        if (timelineViewMode === 'hourly') {
            currentUnitPeriodLabel = format(unitDate, 'yyyy-MM-dd'); // Day label for hourly targets
        } else if (timelineViewMode === 'daily') {
            effectivePeriodStartDateForLabel = dateFnsStartOfWeek(unitDate, {weekStartsOn: 1});
            currentUnitPeriodLabel = `W${getISOWeek(effectivePeriodStartDateForLabel)}-${getYear(effectivePeriodStartDateForLabel)}`;
        } else if (timelineViewMode === 'weekly') {
            effectivePeriodStartDateForLabel = dateFnsStartOfWeek(unitDate, {weekStartsOn: 1});
            currentUnitPeriodLabel = `W${getISOWeek(effectivePeriodStartDateForLabel)} (${format(effectivePeriodStartDateForLabel, 'dd')}-${format(addDays(effectivePeriodStartDateForLabel,6), 'dd MMM')})`;
        } else if (timelineViewMode === 'monthly') {
            effectivePeriodStartDateForLabel = startOfMonth(unitDate);
            currentUnitPeriodLabel = format(effectivePeriodStartDateForLabel, 'MMMM yyyy');
        }

        if (index === 0) {
            tempLabel = currentUnitPeriodLabel;
            tempStartDate = effectivePeriodStartDateForLabel;
        }

        if (currentUnitPeriodLabel === tempLabel) {
            tempSpan++;
        } else {
            finalAggregatedUnits.push({ date: tempStartDate, label: tempLabel, span: tempSpan });
            tempLabel = currentUnitPeriodLabel;
            tempStartDate = effectivePeriodStartDateForLabel;
            tempSpan = 1;
        }

        if (index === displayedUnits.length - 1) {
            finalAggregatedUnits.push({ date: tempStartDate, label: tempLabel, span: tempSpan });
        }
    });


    return (
      <div className="flex">
        {finalAggregatedUnits.map((aggUnit, aggIndex) => {
          // For 'isPast' and 'isPeriodFullHoliday', use the start of the aggregated unit.
          // For weekly/monthly, aggUnit.date is already the start of that period.
          // For daily grouped by week, or hourly grouped by day, aggUnit.date is the start of that group.
          const isPast = aggUnit.date < startOfDay(new Date()) && timelineViewMode !== 'hourly';
          
          let isPeriodFullHoliday = false;
          if (aggUnit.span === 1 && (timelineViewMode === 'daily' || timelineViewMode === 'hourly')) {
            // For single day units (or single day groups in hourly)
            const hi = getHolidayInfo(aggUnit.date);
            isPeriodFullHoliday = !!(hi && hi.type === 'full');
          } else if (timelineViewMode === 'weekly' || timelineViewMode === 'monthly') {
            // For weekly/monthly spans, check if ALL days within that span (that are part of displayedUnits) are full holidays
            const periodDays = displayedUnits.filter(du => {
                if(timelineViewMode === 'weekly') return dateFnsIsSameWeek(du, aggUnit.date, {weekStartsOn: 1});
                if(timelineViewMode === 'monthly') return isSameMonth(du, aggUnit.date);
                return false;
            });
            isPeriodFullHoliday = periodDays.length > 0 && periodDays.every(d => {
                const hi = getHolidayInfo(d);
                return hi && hi.type === 'full';
            });
          }


          return (
            <div
              key={`target-group-${aggUnit.label}-${aggIndex}`} 
              className={cn(
                "border-r border-border text-center text-[10px] font-medium flex flex-col justify-around flex-shrink-0", // Added flex-shrink-0
                isPast && "bg-muted/20 text-muted-foreground/60",
                isPeriodFullHoliday && !isPast && "bg-rose-50 dark:bg-rose-900/20"
              )}
              style={{ minWidth: aggUnit.span * unitCellWidth, width: aggUnit.span * unitCellWidth, height: totalPanelHeight }}
              title={aggUnit.label}
            >
              {selectedResources.map(resource => {
                const target = getTargetForPeriod(resource, aggUnit.date); 
                return (
                  <div key={`${resource.id}-${aggUnit.label}-${aggIndex}`} className="truncate leading-tight" style={{ height: panelUnitHeight, lineHeight: `${panelUnitHeight}px`, color: resource.id.includes("dg-") ? 'darkblue' : resource.id.includes("sh-") ? 'darkgreen' : 'black' }}>
                    {target.toLocaleString()}
                  </div>
                );
              })}
              <div className="font-bold border-t border-border mt-auto pt-0.5" style={{ height: panelUnitHeight, lineHeight: `${panelUnitHeight}px`, color: 'saddlebrown' }}>
                {selectedResources.reduce((sum, resource) => sum + getTargetForPeriod(resource, aggUnit.date), 0).toLocaleString()}
              </div>
            </div>
          );
        })}
      </div>
    );
  };


  return (
    <div className={cn("flex", className)} style={{ height: totalPanelHeight, ...style }} {...restOfProps}>
      <div className="flex-grow overflow-x-hidden" style={{ height: totalPanelHeight }} ref={scrollRef}>
        {renderScheduleContent()}
      </div>
    </div>
  );
}

function isSameWeek(dateLeft: Date | number, dateRight: Date | number, options?: { weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6; }) {
  const startOfWeekLeft = dateFnsStartOfWeek(dateLeft, options);
  const startOfWeekRight = dateFnsStartOfWeek(dateRight, options);
  return startOfWeekLeft.getTime() === startOfWeekRight.getTime();
}
