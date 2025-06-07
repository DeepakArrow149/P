// @deprecated This file contains legacy mock data for UI components.
// These should be replaced with database calls in future iterations.
// This file exists only to prevent compilation errors during the mock service removal.

export interface MockUnit {
  id: string;
  unitName: string;
  unitType?: string;
  capacity?: number;
}

export interface MockLine {
  id: string;
  lineName: string;
  lineGroup?: string;
  capacity?: number;
  unitId?: string;
}

// Legacy mock data - TO BE REPLACED WITH DATABASE CALLS
export const mockUnitsData: MockUnit[] = [
  { id: 'unit1', unitName: 'Unit 1', unitType: 'Production', capacity: 100 },
  { id: 'unit2', unitName: 'Unit 2', unitType: 'Production', capacity: 150 },
  { id: 'unit3', unitName: 'Unit 3', unitType: 'Quality', capacity: 50 },
];

export const mockLinesData: MockLine[] = [
  { id: 'line1', lineName: 'Line 1', lineGroup: 'Group A', capacity: 50, unitId: 'unit1' },
  { id: 'line2', lineName: 'Line 2', lineGroup: 'Group A', capacity: 60, unitId: 'unit1' },
  { id: 'line3', lineName: 'Line 3', lineGroup: 'Group B', capacity: 40, unitId: 'unit2' },
];