
// src/lib/mockData.ts

export interface MockUnit {
  id: string;
  unitCode: string;
  unitName: string;
  location?: string;
  unitType?: 'Factory' | 'Warehouse' | 'Office' | 'Other';
  contactPerson?: string;
  contactNumber?: string;
}

export interface MockLine {
  id: string;
  lineCode: string;
  lineName: string;
  unitId: string;
  lineType?: 'Sewing' | 'Cutting' | 'Finishing' | 'Assembly' | 'Packing' | 'Other';
  defaultCapacity?: number;
  notes?: string;
}

export let mockUnitsData: MockUnit[] = [
  { id: 'unit-1', unitCode: 'FAC-DG', unitName: 'Dongguan Factory', location: 'Dongguan, CN', unitType: 'Factory', contactPerson: 'Mr. Lee', contactNumber: '+86-769-12345678' },
  { id: 'unit-2', unitCode: 'FAC-SZ', unitName: 'Shenzhen Factory', location: 'Shenzhen, CN', unitType: 'Factory', contactPerson: 'Ms. Chen', contactNumber: '+86-755-87654321' },
  { id: 'unit-3', unitCode: 'WH-HK', unitName: 'Hong Kong Warehouse', location: 'Hong Kong', unitType: 'Warehouse', contactPerson: 'Mr. Wong', contactNumber: '+852-11223344' },
];

export let mockLinesData: MockLine[] = [
  { id: 'line-dg-01', lineCode: 'DG-L01', lineName: 'DG - Line 1', unitId: 'unit-1', lineType: 'Sewing', defaultCapacity: 1000, notes: 'Specializes in knitwear.' },
  { id: 'line-dg-02', lineCode: 'DG-L02', lineName: 'DG - Line 2', unitId: 'unit-1', lineType: 'Sewing', defaultCapacity: 850, notes: 'Handles complex garments.' },
  { id: 'line-dg-03', lineCode: 'DG-L03', lineName: 'DG - Line 3 (Cutting)', unitId: 'unit-1', lineType: 'Cutting', defaultCapacity: 5000, notes: 'Automated cutting tables.' },
  { id: 'line-sz-01', lineCode: 'SZ-L01', lineName: 'SH - Line 1', unitId: 'unit-2', lineType: 'Sewing', defaultCapacity: 1200 },
  { id: 'line-sz-02', lineCode: 'SZ-L02', lineName: 'SH - Line 2 (Finishing)', unitId: 'unit-2', lineType: 'Finishing', defaultCapacity: 2000, notes: 'Pressing and packing.' },
];
