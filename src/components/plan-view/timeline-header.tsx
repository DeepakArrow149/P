
// Use client directive for date calculations
'use client';

import * as React from 'react';
import { format, addDays, getDay, startOfWeek as dateFnsStartOfWeek, eachWeekOfInterval, getISOWeek, startOfMonth, eachMonthOfInterval, getYear, getMonth, isSameDay as dateFnsIsSameDay, isSameHour, isSameMonth, startOfDay, startOfHour, parseISO as dateFnsParseISO, endOfWeek as dateFnsEndOfWeek } from 'date-fns';
import type { TimelineViewMode, HolidayDetail, RowHeightLevel, TimelineHeaderProps } from './types';
import { ROW_HEIGHT_CONFIG } from './types';
import { cn } from '@/lib/utils';
import { CalendarOff } from 'lucide-react';


// Custom isSameWeek to ensure consistent week start day (e.g., Monday)
function dateFnsIsSameWeek(dateLeft: Date | number, dateRight: Date | number, options?: { weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6; }): boolean {
  const startOfWeekLeft = dateFnsStartOfWeek(dateLeft, options);
  const startOfWeekRight = dateFnsStartOfWeek(dateRight, options);
  return startOfWeekLeft.getTime() === startOfWeekRight.getTime();
}


export function TimelineHeader(props: TimelineHeaderProps) {
  const {
    displayedUnits,
    unitCellWidth,
    timelineViewMode,
    rowHeightLevel,
    isPastDay,
    isPastHour,
    holidaysMap,
    scrollRef,
    isSameDay,
    startDate, // Explicitly destructured here
    className,
    style,
    ...restOfProps // Now only contains other valid HTML attributes
  } = props;

  const currentHeights = ROW_HEIGHT_CONFIG[rowHeightLevel] || ROW_HEIGHT_CONFIG.medium;
  const headerUnitHeight = currentHeights.headerUnit;
  const totalHeaderHeight = headerUnitHeight * 2; // Assuming two rows for header
  const today = startOfDay(new Date());

  const getHolidayInfo = (date: Date) => holidaysMap.get(format(date, 'yyyy-MM-dd'));

  const renderHeaderContent = () => {
    if (!displayedUnits || displayedUnits.length === 0) {
      return <div className="flex-grow p-2 text-center text-xs">Loading timeline units...</div>;
    }

    let topRowCells: React.ReactNode[] = [];
    let bottomRowCells: React.ReactNode[] = [];

    if (timelineViewMode === 'hourly') {
      const hoursByDay: { [key: string]: Date[] } = {};
      displayedUnits.forEach(hourDate => {
        const dayKey = format(hourDate, 'yyyy-MM-dd');
        if (!hoursByDay[dayKey]) hoursByDay[dayKey] = [];
        hoursByDay[dayKey].push(hourDate);
      });

      Object.entries(hoursByDay).forEach(([dayKey, hoursInDay]) => {
        const dayDateObj = dateFnsParseISO(dayKey);
        const isPastDayHeader = isPastDay(dayDateObj);
        const holidayInfoDay = getHolidayInfo(dayDateObj);
        const isTodayHeader = isSameDay(dayDateObj, today);

        topRowCells.push(
          <div
            key={`top-hourly-${dayKey}`}
            className={cn(
              "p-1 border-b border-r border-border text-center text-xs font-medium flex items-center justify-center flex-shrink-0",
              isPastDayHeader && "bg-muted/30 text-muted-foreground/70",
              isTodayHeader && !isPastDayHeader && "bg-primary/10 text-primary",
              holidayInfoDay?.type === 'full' && !isPastDayHeader && !isTodayHeader && "bg-rose-100 dark:bg-rose-800/40 text-rose-700 dark:text-rose-300",
              holidayInfoDay && holidayInfoDay.type !== 'full' && !isPastDayHeader && !isTodayHeader && "bg-amber-100 dark:bg-amber-800/30"
            )}
            style={{ minWidth: hoursInDay.length * unitCellWidth, width: hoursInDay.length * unitCellWidth, height: headerUnitHeight }}
            title={holidayInfoDay ? `Holiday: ${holidayInfoDay.type}` : undefined}
          >
            {format(dayDateObj, 'MMM dd, yyyy')}
            {holidayInfoDay && <CalendarOff className="ml-1 h-3 w-3 opacity-70" />}
          </div>
        );

        hoursInDay.forEach((hourDate) => {
          const isPastHourCell = isPastHour(hourDate);
          const isCurrentHour = isSameHour(hourDate, new Date());
          bottomRowCells.push(
            <div
              key={`bottom-hourly-${format(hourDate, 'yyyy-MM-dd-HH')}`}
              className={cn(
                "p-1 border-r border-border text-center text-xs flex items-center justify-center flex-shrink-0",
                isPastHourCell && "bg-muted/20 text-muted-foreground/60",
                isCurrentHour && !isPastHourCell && "bg-primary/10 ring-1 ring-primary",
                holidayInfoDay?.type === 'full' && !isPastHourCell && !isCurrentHour && "bg-rose-50 dark:bg-rose-800/20",
                holidayInfoDay && holidayInfoDay.type !== 'full' && !isPastHourCell && !isCurrentHour && "bg-amber-50 dark:bg-amber-800/10"
              )}
              style={{ minWidth: unitCellWidth, width: unitCellWidth, height: headerUnitHeight }}
            >
              {format(hourDate, 'HH')}
            </div>
          );
        });
      });
    } else if (timelineViewMode === 'daily') {
        const daysByWeekAgg: { [weekKey: string]: { weekLabel: string, days: Date[], startDate: Date } } = {};
        displayedUnits.forEach(dayDate => {
            const weekStart = dateFnsStartOfWeek(dayDate, { weekStartsOn: 1 }); // Monday
            const weekKey = `W${getISOWeek(weekStart)}-${getYear(weekStart)}`;
            if (!daysByWeekAgg[weekKey]) {
                daysByWeekAgg[weekKey] = { 
                    weekLabel: `W${getISOWeek(weekStart)} (${format(weekStart, 'MMM dd')})`,
                    days: [],
                    startDate: weekStart
                };
            }
            daysByWeekAgg[weekKey].days.push(dayDate);
        });
        
        const sortedWeekKeys = Object.keys(daysByWeekAgg).sort((a,b) => daysByWeekAgg[a].startDate.getTime() - daysByWeekAgg[b].startDate.getTime());

        sortedWeekKeys.forEach(weekKey => {
            const weekData = daysByWeekAgg[weekKey];
            const isPastWeekHeader = weekData.days.every(d => isPastDay(d));
            const isCurrentWeekHeader = weekData.days.some(d => dateFnsIsSameWeek(d, today, { weekStartsOn: 1 }));
             topRowCells.push(
                <div
                    key={`top-daily-${weekKey}`}
                    className={cn(
                        "p-1 border-b border-r border-border text-center text-xs font-medium flex items-center justify-center flex-shrink-0",
                        isPastWeekHeader && "bg-muted/30 text-muted-foreground/70",
                        isCurrentWeekHeader && !isPastWeekHeader && "bg-primary/10 text-primary"
                    )}
                    style={{ minWidth: weekData.days.length * unitCellWidth, width: weekData.days.length * unitCellWidth, height: headerUnitHeight }}
                >
                    {weekData.weekLabel}
                </div>
            );
            weekData.days.forEach((dayDate) => {
                const isPastDayCell = isPastDay(dayDate);
                const holidayInfo = getHolidayInfo(dayDate);
                const isTodayCell = isSameDay(dayDate, today);
                const cellKey = `bottom-daily-${format(dayDate, 'yyyy-MM-dd')}`;
                bottomRowCells.push(
                    <div
                        id={isTodayCell ? "timeline-header-today-column" : undefined}
                        key={cellKey}
                        className={cn(
                            "p-1 border-r border-border text-center text-xs flex items-center justify-center relative flex-shrink-0",
                            (getDay(dayDate) === 0 || getDay(dayDate) === 6) && !isPastDayCell && !holidayInfo && !isTodayCell && "bg-slate-100 dark:bg-slate-800/30", 
                            isPastDayCell && "bg-muted/20 text-muted-foreground/60",
                            isTodayCell && !isPastDayCell && "bg-primary/10 ring-1 ring-primary",
                            holidayInfo?.type === 'full' && !isPastDayCell && !isTodayCell && "bg-rose-100 dark:bg-rose-800/40 text-rose-700 dark:text-rose-300",
                            holidayInfo && holidayInfo.type !== 'full' && !isPastDayCell && !isTodayCell && "bg-amber-100 dark:bg-amber-800/30"
                        )}
                        style={{ minWidth: unitCellWidth, width: unitCellWidth, height: headerUnitHeight }}
                        title={holidayInfo ? `Holiday: ${holidayInfo.type}` : format(dayDate, 'EEE, MMM dd')}
                    >
                        {format(dayDate, 'dd EEE')}
                        {holidayInfo && <CalendarOff className="absolute top-0.5 right-0.5 h-2.5 w-2.5 opacity-60" />}
                    </div>
                );
            });
        });
    } else if (timelineViewMode === 'weekly') {
        const daysByMonthAndWeek: { [monthKey: string]: { [weekKey: string]: {days: Date[], weekLabel: string, startDate: Date} } } = {};
        displayedUnits.forEach(dayDate => {
            const monthKey = format(dayDate, 'yyyy-MM'); 
            const weekStart = dateFnsStartOfWeek(dayDate, { weekStartsOn: 1 });
            const weekKey = `W${getISOWeek(weekStart)}-${getYear(weekStart)}`; 
            
            if (!daysByMonthAndWeek[monthKey]) daysByMonthAndWeek[monthKey] = {};
            if (!daysByMonthAndWeek[monthKey][weekKey]) {
                 daysByMonthAndWeek[monthKey][weekKey] = {
                    days: [],
                    weekLabel: `W${getISOWeek(weekStart)} (${format(weekStart, 'dd')}-${format(dateFnsEndOfWeek(weekStart, {weekStartsOn:1}), 'dd')})`,
                    startDate: weekStart
                };
            }
            daysByMonthAndWeek[monthKey][weekKey].days.push(dayDate);
        });

        Object.keys(daysByMonthAndWeek).sort().forEach(monthKey => {
            const weeksInMonth = daysByMonthAndWeek[monthKey];
            const monthDateObj = dateFnsParseISO(monthKey);
            const isCurrentMonthHeader = isSameMonth(monthDateObj, today);
            const isPastMonthHeader = monthDateObj < startOfMonth(today);
            const totalDaysInMonthDisplay = Object.values(weeksInMonth).reduce((sum, weekData) => sum + weekData.days.length, 0);

            topRowCells.push(
                <div
                    key={`top-weekly-month-${monthKey}`}
                    className={cn(
                        "p-1 border-b border-r border-border text-center text-xs font-medium flex items-center justify-center flex-shrink-0",
                        isPastMonthHeader && "bg-muted/30 text-muted-foreground/70",
                        isCurrentMonthHeader && !isPastMonthHeader && "bg-primary/10 text-primary"
                    )}
                    style={{ minWidth: totalDaysInMonthDisplay * unitCellWidth, width: totalDaysInMonthDisplay * unitCellWidth, height: headerUnitHeight }}
                >
                    {format(monthDateObj, 'MMMM yyyy')}
                </div>
            );

            const sortedWeekKeysInMonth = Object.keys(weeksInMonth).sort((a,b)=> weeksInMonth[a].startDate.getTime() - weeksInMonth[b].startDate.getTime());
            
            sortedWeekKeysInMonth.forEach(weekKey => {
                const weekData = weeksInMonth[weekKey];
                 const isCurrentWeekSubHeader = weekData.days.some(d => dateFnsIsSameWeek(d, today, { weekStartsOn: 1 }));
                 weekData.days.forEach((dayDate) => { // Removed dayIdx as it's not needed for key
                    const isPastDayCell = isPastDay(dayDate);
                    const holidayInfo = getHolidayInfo(dayDate);
                    const isTodayCell = isSameDay(dayDate, today);
                    const cellKey = `bottom-weekly-${format(dayDate, 'yyyy-MM-dd')}`;
                    bottomRowCells.push(
                        <div
                            id={isTodayCell ? "timeline-header-today-column" : undefined}
                            key={cellKey} 
                            className={cn(
                                "p-1 border-r border-border text-center text-xs flex items-center justify-center relative flex-shrink-0",
                                (getDay(dayDate) === 0 || getDay(dayDate) === 6) && !isPastDayCell && !holidayInfo && !isTodayCell && "bg-slate-100 dark:bg-slate-800/30",
                                isPastDayCell && "bg-muted/20 text-muted-foreground/60",
                                isTodayCell && !isPastDayCell && "bg-primary/10 ring-1 ring-primary",
                                holidayInfo?.type === 'full' && !isPastDayCell && !isTodayCell && "bg-rose-100 dark:bg-rose-800/40 text-rose-700 dark:text-rose-300",
                                holidayInfo && holidayInfo.type !== 'full' && !isPastDayCell && !isTodayCell && "bg-amber-100 dark:bg-amber-800/30",
                                isCurrentWeekSubHeader && !isTodayCell && !isPastDayCell && !holidayInfo && "bg-primary/5" 
                            )}
                            style={{ minWidth: unitCellWidth, width: unitCellWidth, height: headerUnitHeight }}
                            title={holidayInfo ? `Holiday: ${holidayInfo.type}` : format(dayDate, 'EEE, MMM dd')}
                        >
                           {format(dayDate, 'EEE dd')}
                           {holidayInfo && <CalendarOff className="absolute top-0.5 right-0.5 h-2.5 w-2.5 opacity-60" />}
                        </div>
                    );
                });
            });
        });

    } else if (timelineViewMode === 'monthly') {
        const daysByYearAndMonth: { [yearKey: string]: { [monthKey: string]: { days: Date[], monthLabel: string, startDate: Date } } } = {};
        displayedUnits.forEach(dayDate => {
            const yearKey = format(dayDate, 'yyyy');
            const monthStart = startOfMonth(dayDate);
            const monthKey = format(monthStart, 'yyyy-MM'); 
            if (!daysByYearAndMonth[yearKey]) daysByYearAndMonth[yearKey] = {};
            if (!daysByYearAndMonth[yearKey][monthKey]) {
                daysByYearAndMonth[yearKey][monthKey] = {
                    days: [],
                    monthLabel: format(monthStart, 'MMMM'),
                    startDate: monthStart
                };
            }
            daysByYearAndMonth[yearKey][monthKey].days.push(dayDate);
        });

        Object.keys(daysByYearAndMonth).sort().forEach(yearKey => {
            const monthsInYear = daysByYearAndMonth[yearKey];
            const totalDaysInYearDisplay = Object.values(monthsInYear).reduce((sum, monthData) => sum + monthData.days.length, 0);
            topRowCells.push(
                <div
                    key={`top-monthly-year-${yearKey}`}
                    className={cn(
                        "p-1 border-b border-r border-border text-center text-xs font-medium flex items-center justify-center flex-shrink-0",
                         getYear(today) === parseInt(yearKey) && "bg-primary/10 text-primary"
                    )}
                    style={{ minWidth: totalDaysInYearDisplay * unitCellWidth, width: totalDaysInYearDisplay * unitCellWidth, height: headerUnitHeight }}
                >
                    {yearKey}
                </div>
            );
            const sortedMonthKeysInYear = Object.keys(monthsInYear).sort((a,b)=> monthsInYear[a].startDate.getTime() - monthsInYear[b].startDate.getTime());
            
            sortedMonthKeysInYear.forEach(monthKey => {
                const monthData = monthsInYear[monthKey];
                const isCurrentMonthSubHeader = isSameMonth(monthData.startDate, today);
                const isPastMonthSubHeader = monthData.startDate < startOfMonth(today);

                monthData.days.forEach((dayDate, dayIdx) => { // Use dayIdx here for the day number within month
                     const isPastDayCell = isPastDay(dayDate);
                     const holidayInfo = getHolidayInfo(dayDate);
                     const isTodayCell = isSameDay(dayDate, today);
                     const cellKey = `bottom-monthly-${format(dayDate, 'yyyy-MM-dd')}`;
                     bottomRowCells.push(
                        <div
                            id={isTodayCell ? "timeline-header-today-column" : undefined}
                            key={cellKey} 
                            className={cn(
                                "p-1 border-r border-border text-center text-[10px] flex items-center justify-center relative flex-shrink-0",
                                (getDay(dayDate) === 0 || getDay(dayDate) === 6) && !isPastDayCell && !holidayInfo && !isTodayCell && "bg-slate-100 dark:bg-slate-800/30",
                                isPastDayCell && "bg-muted/20 text-muted-foreground/60",
                                isTodayCell && !isPastDayCell && "bg-primary/10 ring-1 ring-primary",
                                holidayInfo?.type === 'full' && !isPastDayCell && !isTodayCell && "bg-rose-100 dark:bg-rose-800/40",
                                holidayInfo && holidayInfo.type !== 'full' && !isPastDayCell && !isTodayCell && "bg-amber-100 dark:bg-amber-800/30",
                                isCurrentMonthSubHeader && !isPastMonthSubHeader && !isTodayCell && !isPastDayCell && !holidayInfo && "bg-primary/5"
                            )}
                            style={{ minWidth: unitCellWidth, width: unitCellWidth, height: headerUnitHeight }}
                            title={holidayInfo ? `Holiday: ${holidayInfo.type}` : format(dayDate, 'EEE, MMM dd')}
                        >
                           {dayIdx === 0 ? format(dayDate, 'MMM dd') : format(dayDate, 'dd')}
                           {holidayInfo && <CalendarOff className="absolute top-0.5 right-0.5 h-2.5 w-2.5 opacity-60" />}
                        </div>
                     );
                });
            });
        });
    }


    return (
      <div className="flex flex-col" ref={scrollRef}>
        <div className="flex sticky top-0 z-10 bg-card">{topRowCells}</div>
        <div className="flex">{bottomRowCells}</div>
      </div>
    );
  };


  return (
    <div
      className={cn("flex flex-shrink-0", className)}
      style={{ height: totalHeaderHeight, ...style }}
      {...restOfProps} // Spread any other standard HTML div attributes
    >
      {/* Content that needs horizontal scrolling via JS, controlled by parent */}
      <div className="flex-grow overflow-x-hidden" style={{ height: totalHeaderHeight }}>
        {renderHeaderContent()}
      </div>
    </div>
  );
}
