
'use client';

import * as React from 'react';
import { MonthView } from './month-view';
import { startOfYear, addMonths } from 'date-fns';

export type HolidayType = 'full' | 'half-am' | 'half-pm';
export interface HolidayDetail {
  type: HolidayType;
  // customHours?: { start: number; end: number }; // For future use
}

interface CalendarDisplayProps {
  year: number;
  holidaysForYear: Map<string, HolidayDetail>; // Map of 'yyyy-MM-dd' to HolidayDetail
  onToggleHoliday: (dateString: string, currentHolidayDetail: HolidayDetail | undefined) => void;
}

export function CalendarDisplay({
  year,
  holidaysForYear,
  onToggleHoliday,
}: CalendarDisplayProps) {
  const firstDayOfYear = startOfYear(new Date(year, 0, 1));
  const months = Array.from({ length: 12 }, (_, i) => addMonths(firstDayOfYear, i));

  return (
    <div className="space-y-8">
      {holidaysForYear === undefined || year === 0 ? (
         <div className="text-center py-10 text-muted-foreground">
          <p className="text-lg">Please select a year or add a new calendar year to view and manage holidays.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {months.map((monthDate) => (
            <MonthView
              key={monthDate.toISOString()}
              monthDate={monthDate}
              holidays={holidaysForYear}
              onToggleHoliday={onToggleHoliday}
            />
          ))}
        </div>
      )}
       <div className="mt-8 p-4 border rounded-lg bg-background shadow">
        <h4 className="text-md font-semibold mb-2">Legend:</h4>
        <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-sm bg-destructive/80"></div>
            <span>Full Holiday</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-sm bg-yellow-400/80"></div>
            <span>Half Holiday (AM)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-sm bg-orange-400/80"></div>
            <span>Half Holiday (PM)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-sm bg-muted/50"></div>
            <span>Weekend</span>
          </div>
           <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-sm ring-2 ring-primary ring-inset"></div>
            <span>Today</span>
          </div>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
            Click on any date to cycle its holiday status (None → Full → Half AM → Half PM → None). Changes are saved automatically.
        </p>
      </div>
    </div>
  );
}
