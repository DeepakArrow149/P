
// src/app/masters/calendar/page.tsx
'use client';

import * as React from 'react';
import { MasterPageTemplate } from '@/components/masters/master-page-template';
import { YearControls } from '@/components/masters/calendar/year-controls';
import { CalendarDisplay, type HolidayDetail, type HolidayType } from '@/components/masters/calendar/calendar-display';
import { useToast } from '@/hooks/use-toast';
import { CalendarDays } from 'lucide-react';

type ToastMessageType = {
  title: string;
  description: string;
  variant?: 'default' | 'destructive';
};

const LOCALSTORAGE_KEY_SELECTED_YEAR = 'trackTech_calendarMaster_selectedYear_v2';
const LOCALSTORAGE_KEY_AVAILABLE_YEARS = 'trackTech_calendarMaster_availableYears_v2';
const LOCALSTORAGE_KEY_CALENDARS_DATA = 'trackTech_calendarsData_v2';


export default function CalendarMasterPage() {
  const { toast } = useToast();
  const currentYear = new Date().getFullYear();

  const [availableYears, setAvailableYears] = React.useState<number[]>(() => {
    if (typeof window !== 'undefined') {
      const storedYears = localStorage.getItem(LOCALSTORAGE_KEY_AVAILABLE_YEARS);
      if (storedYears) {
        try {
          const parsed = JSON.parse(storedYears);
          if (Array.isArray(parsed) && parsed.every(y => typeof y === 'number')) {
            const yearSet = new Set([currentYear, ...parsed]);
            return Array.from(yearSet).sort((a, b) => a - b);
          }
        } catch (e) { console.error("Failed to parse availableYears from localStorage", e); }
      }
    }
    return [currentYear];
  });

  const [selectedYear, setSelectedYear] = React.useState<number>(() => {
     if (typeof window !== 'undefined') {
      const storedSelected = localStorage.getItem(LOCALSTORAGE_KEY_SELECTED_YEAR);
      if (storedSelected) {
        const yearNum = parseInt(storedSelected, 10);
        // initialAvailableYears is not yet set here, so we defer full validation to useEffect
        if (!isNaN(yearNum)) return yearNum;
      }
    }
    return currentYear;
  });
  
  const [calendarsData, setCalendarsData] = React.useState<Map<number, Map<string, HolidayDetail>>>(() => {
    if (typeof window !== 'undefined') {
        const storedData = localStorage.getItem(LOCALSTORAGE_KEY_CALENDARS_DATA);
        if (storedData) {
          try {
            const parsedEntries: [number, [string, HolidayDetail][]][] = JSON.parse(storedData);
            const mapData = new Map<number, Map<string, HolidayDetail>>();
            parsedEntries.forEach(([year, holidayEntriesArray]) => {
              mapData.set(year, new Map(holidayEntriesArray));
            });
            if (!mapData.has(currentYear)) {
                mapData.set(currentYear, new Map<string, HolidayDetail>());
            }
            return mapData;
          } catch (e) {
            console.error("Failed to parse calendarsData from localStorage", e);
          }
        }
    }
    return new Map([[currentYear, new Map<string, HolidayDetail>()]]);
  });
  
  const [toastMessage, setToastMessage] = React.useState<ToastMessageType | null>(null);

  // Effect to reconcile selectedYear with availableYears after initial load from localStorage
  React.useEffect(() => {
    if (!availableYears.includes(selectedYear)) {
      const newSelectedDefault = availableYears.includes(currentYear) ? currentYear : (availableYears[0] || currentYear);
      setSelectedYear(newSelectedDefault);
      if (typeof window !== 'undefined') {
        localStorage.setItem(LOCALSTORAGE_KEY_SELECTED_YEAR, newSelectedDefault.toString());
      }
    }
  }, [availableYears, selectedYear, currentYear]);


  React.useEffect(() => {
    if (typeof window !== 'undefined') {
        const entriesToStore: [number, [string, HolidayDetail][]][] = Array.from(calendarsData.entries()).map(([year, holidayMap]) => [year, Array.from(holidayMap.entries())]);
        localStorage.setItem(LOCALSTORAGE_KEY_CALENDARS_DATA, JSON.stringify(entriesToStore));
    }
  }, [calendarsData]);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
        localStorage.setItem(LOCALSTORAGE_KEY_AVAILABLE_YEARS, JSON.stringify(availableYears));
    }
  }, [availableYears]);

  React.useEffect(() => {
    if (typeof window !== 'undefined' && availableYears.includes(selectedYear)) { // Only save if selectedYear is valid
      localStorage.setItem(LOCALSTORAGE_KEY_SELECTED_YEAR, selectedYear.toString());
    }
  }, [selectedYear, availableYears]);

  React.useEffect(() => {
    if (toastMessage) {
      toast(toastMessage);
      setToastMessage(null); 
    }
  }, [toastMessage, toast]);

  const handleYearChange = (year: number) => {
    setSelectedYear(year);
  };

  const handleAddYear = (year: number) => {
    const yearPreviouslyInDropdown = availableYears.includes(year);
    const calendarDataExisted = calendarsData.has(year);

    if (!calendarDataExisted) {
      setCalendarsData((prevData) => new Map(prevData).set(year, new Map<string, HolidayDetail>()));
    }

    if (!yearPreviouslyInDropdown) {
        setAvailableYears((prevYears) => {
            const yearSet = new Set(prevYears);
            yearSet.add(year);
            return Array.from(yearSet).sort((a, b) => a - b);
        });
    }
    
    setSelectedYear(year); 

    if (!yearPreviouslyInDropdown && !calendarDataExisted) {
        setToastMessage({
            title: 'Calendar Year Added',
            description: `Calendar for ${year} has been created. You can now mark holidays.`,
        });
    } else if (!calendarDataExisted) { 
         setToastMessage({
            title: 'Calendar Data Initialized',
            description: `Holiday data for ${year} initialized. You can now mark holidays.`,
        });
    } else if (!yearPreviouslyInDropdown) { 
        setToastMessage({
            title: 'Year Added to Selection',
            description: `Year ${year} is now available in the dropdown. Holiday data already existed.`,
        });
    } else { 
        setToastMessage({
            title: 'Year Selected',
            description: `Calendar for ${year} is selected.`,
            variant: 'default',
        });
    }
  };

  const handleToggleHoliday = (dateString: string, currentHolidayDetail: HolidayDetail | undefined) => {
    setCalendarsData((prevData) => {
      const yearData = prevData.get(selectedYear) || new Map<string, HolidayDetail>();
      const newYearData = new Map(yearData);
      let newHolidayType: HolidayType | null = null;
      let toastDescription = '';

      if (!currentHolidayDetail) {
        newHolidayType = 'full';
        toastDescription = `${dateString} marked as Full Day Holiday.`;
      } else if (currentHolidayDetail.type === 'full') {
        newHolidayType = 'half-am';
        toastDescription = `${dateString} marked as Half Day (AM) Holiday.`;
      } else if (currentHolidayDetail.type === 'half-am') {
        newHolidayType = 'half-pm';
        toastDescription = `${dateString} marked as Half Day (PM) Holiday.`;
      } else if (currentHolidayDetail.type === 'half-pm') {
        newHolidayType = null; // Cycle back to no holiday
        toastDescription = `${dateString} is no longer marked as a holiday.`;
      }

      if (newHolidayType) {
        newYearData.set(dateString, { type: newHolidayType });
      } else {
        newYearData.delete(dateString);
      }
      
      setToastMessage({
        title: 'Holiday Status Updated',
        description: toastDescription,
      });

      const newCalendarsData = new Map(prevData);
      newCalendarsData.set(selectedYear, newYearData);
      return newCalendarsData;
    });
  };

  const holidaysForSelectedYear = calendarsData.get(selectedYear) || new Map<string, HolidayDetail>();

  return (
    <MasterPageTemplate
      title="Calendar Master"
      description="Manage yearly calendars, holidays (full/half days), and working days."
    >
      <div className="space-y-6">
        <YearControls
          availableYears={availableYears}
          selectedYear={selectedYear}
          onYearChange={handleYearChange}
          onAddYear={handleAddYear}
        />
        
        {availableYears.length > 0 && selectedYear !== 0 && availableYears.includes(selectedYear) ? (
          <CalendarDisplay
            year={selectedYear}
            holidaysForYear={holidaysForSelectedYear}
            onToggleHoliday={handleToggleHoliday}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-border rounded-md p-8 text-center">
            <CalendarDays className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-lg">No valid calendar year selected or available.</p>
            <p className="text-sm text-muted-foreground">
              Please add or select a valid calendar year using the controls above.
            </p>
          </div>
        )}
      </div>
    </MasterPageTemplate>
  );
}

    