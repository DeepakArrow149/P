
'use client';

import * as React from 'react';
import {
  format,
  getDaysInMonth,
  startOfMonth,
  getDay,
  isWeekend,
  addDays,
  isSameDay,
} from 'date-fns';
import { cn } from '@/lib/utils';
import type { HolidayDetail } from './calendar-display';
import { Badge } from '@/components/ui/badge';

interface MonthViewProps {
  monthDate: Date; // A date within the month to display
  holidays: Map<string, HolidayDetail>; // Map of 'yyyy-MM-dd' to HolidayDetail
  onToggleHoliday: (dateString: string, currentHolidayDetail: HolidayDetail | undefined) => void;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function MonthView({ monthDate, holidays, onToggleHoliday }: MonthViewProps) {
  const firstDayOfMonth = startOfMonth(monthDate);
  const daysInMonth = getDaysInMonth(monthDate);
  const startingDayOfWeek = getDay(firstDayOfMonth); 

  const monthName = format(monthDate, 'MMMM yyyy');
  const dayCells = [];

  for (let i = 0; i < startingDayOfWeek; i++) {
    dayCells.push(<div key={`empty-${i}`} className="border p-1 h-20 sm:h-24"></div>);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const currentDate = addDays(firstDayOfMonth, day - 1);
    const dateString = format(currentDate, 'yyyy-MM-dd');
    const isCurrentWeekend = isWeekend(currentDate);
    const holidayDetail = holidays.get(dateString);

    let cellClassName = 'border p-2 text-sm cursor-pointer h-20 sm:h-24 flex flex-col items-start hover:bg-primary/10 transition-colors relative';
    let holidayBadgeText: string | null = null;

    if (holidayDetail) {
      if (holidayDetail.type === 'full') {
        cellClassName = cn(cellClassName, 'bg-destructive/80 text-destructive-foreground');
        holidayBadgeText = 'Full';
      } else if (holidayDetail.type === 'half-am') {
        cellClassName = cn(cellClassName, 'bg-yellow-400/80 text-yellow-900');
        holidayBadgeText = 'AM';
      } else if (holidayDetail.type === 'half-pm') {
        cellClassName = cn(cellClassName, 'bg-orange-400/80 text-orange-900');
        holidayBadgeText = 'PM';
      }
    } else if (isCurrentWeekend) {
      cellClassName = cn(cellClassName, 'bg-muted/50 text-muted-foreground');
    }

    if (isSameDay(currentDate, new Date()) && !holidayDetail) {
      cellClassName = cn(cellClassName, 'ring-2 ring-primary ring-inset');
    }
    
    const titleText = holidayDetail
      ? `Status: ${holidayDetail.type === 'full' ? 'Full Holiday' : holidayDetail.type === 'half-am' ? 'Half AM Off' : 'Half PM Off'}. Click to change.`
      : 'Click to mark as holiday';

    dayCells.push(
      <div
        key={dateString}
        className={cellClassName}
        onClick={() => onToggleHoliday(dateString, holidayDetail)}
        title={titleText}
      >
        <span className={cn('font-medium', holidayDetail ? 'text-inherit' : 'text-foreground')}>
          {day}
        </span>
        {holidayBadgeText && (
          <Badge 
            variant={holidayDetail?.type === 'full' ? 'destructive' : 'secondary'} 
            className={cn(
              "mt-auto text-xs self-center px-1.5 py-0.5 rounded",
              holidayDetail?.type === 'full' && "bg-destructive-foreground text-destructive",
              holidayDetail?.type === 'half-am' && "bg-yellow-900 text-yellow-100",
              holidayDetail?.type === 'half-pm' && "bg-orange-900 text-orange-100"
            )}
          >
            {holidayBadgeText}
          </Badge>
        )}
      </div>
    );
  }

  return (
    <div className="bg-card p-4 rounded-lg shadow">
      <h3 className="text-lg font-semibold text-center mb-3 text-primary">
        {monthName}
      </h3>
      <div className="grid grid-cols-7 gap-px">
        {WEEKDAYS.map((dayName) => (
          <div key={dayName} className="text-center font-medium text-muted-foreground text-xs py-2 border-b">
            {dayName}
          </div>
        ))}
        {dayCells}
      </div>
    </div>
  );
}
