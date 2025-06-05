'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle } from 'lucide-react';

interface YearControlsProps {
  availableYears: number[];
  selectedYear: number;
  onYearChange: (year: number) => void;
  onAddYear: (year: number) => void;
}

export function YearControls({
  availableYears,
  selectedYear,
  onYearChange,
  onAddYear,
}: YearControlsProps) {
  const [newYearInput, setNewYearInput] = React.useState<string>(
    (new Date().getFullYear() + 1).toString()
  );

  const handleAddYear = () => {
    const yearNum = parseInt(newYearInput, 10);
    if (!isNaN(yearNum) && yearNum > 1900 && yearNum < 2200) {
      onAddYear(yearNum);
      setNewYearInput((yearNum + 1).toString()); // Suggest next year
    } else {
      // Basic validation feedback, could use toast for better UX
      alert('Please enter a valid year (e.g., 2025).');
    }
  };

  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between p-4 border rounded-lg bg-card shadow">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-4">
        <div>
          <Label htmlFor="select-year">Select Year</Label>
          <Select
            value={selectedYear.toString()}
            onValueChange={(value) => onYearChange(parseInt(value, 10))}
          >
            <SelectTrigger id="select-year" className="w-full sm:w-[180px]">
              <SelectValue placeholder="Select year" />
            </SelectTrigger>
            <SelectContent>
              {availableYears.length > 0 ? (
                availableYears
                  .sort((a, b) => a - b)
                  .map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))
              ) : (
                <SelectItem value="" disabled>
                  No years available
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-2">
        <div className="flex-grow sm:flex-grow-0">
          <Label htmlFor="new-year">Add New Calendar Year</Label>
          <Input
            id="new-year"
            type="number"
            placeholder="e.g., 2025"
            value={newYearInput}
            onChange={(e) => setNewYearInput(e.target.value)}
            className="w-full sm:w-[120px]"
          />
        </div>
        <Button onClick={handleAddYear} className="w-full sm:w-auto">
          <PlusCircle className="mr-2 h-4 w-4" /> Add Year
        </Button>
      </div>
    </div>
  );
}
