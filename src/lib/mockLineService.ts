// src/lib/mockLineService.ts
import type { Line, CreateLineData, UpdateLineData, LineSearchParams } from './lineRepository';

// Mock data that matches the database Line interface
const mockLines: Line[] = [
  {
    id: 'line-dg-01',
    lineCode: 'DG-L01',
    lineName: 'DG - Line 1',
    unitId: 'unit-1',
    lineType: 'Sewing',
    defaultCapacity: 1000,
    notes: 'Specializes in knitwear.',
    createdAt: new Date('2024-01-15T08:00:00Z'),
    updatedAt: new Date('2024-01-15T08:00:00Z'),
  },
  {
    id: 'line-dg-02',
    lineCode: 'DG-L02',
    lineName: 'DG - Line 2',
    unitId: 'unit-1',
    lineType: 'Sewing',
    defaultCapacity: 850,
    notes: 'Handles complex garments.',
    createdAt: new Date('2024-01-15T08:30:00Z'),
    updatedAt: new Date('2024-01-15T08:30:00Z'),
  },
  {
    id: 'line-dg-03',
    lineCode: 'DG-L03',
    lineName: 'DG - Line 3 (Cutting)',
    unitId: 'unit-1',
    lineType: 'Cutting',
    defaultCapacity: 5000,
    notes: 'Automated cutting tables.',
    createdAt: new Date('2024-01-15T09:00:00Z'),
    updatedAt: new Date('2024-01-15T09:00:00Z'),
  },
  {
    id: 'line-sz-01',
    lineCode: 'SZ-L01',
    lineName: 'SH - Line 1',
    unitId: 'unit-2',
    lineType: 'Sewing',
    defaultCapacity: 1200,
    notes: undefined,
    createdAt: new Date('2024-01-15T09:30:00Z'),
    updatedAt: new Date('2024-01-15T09:30:00Z'),
  },
  {
    id: 'line-sz-02',
    lineCode: 'SZ-L02',
    lineName: 'SH - Line 2 (Finishing)',
    unitId: 'unit-2',
    lineType: 'Finishing',
    defaultCapacity: 2000,
    notes: 'Pressing and packing.',
    createdAt: new Date('2024-01-15T10:00:00Z'),
    updatedAt: new Date('2024-01-15T10:00:00Z'),
  },
];

export class MockLineService {
  private lines: Line[] = [...mockLines];

  async findMany(params: LineSearchParams = {}): Promise<Line[]> {
    let filtered = [...this.lines];

    // Apply search filter
    if (params.search) {
      const searchLower = params.search.toLowerCase();
      filtered = filtered.filter(line =>
        line.lineCode.toLowerCase().includes(searchLower) ||
        line.lineName.toLowerCase().includes(searchLower)
      );
    }

    // Apply unit filter
    if (params.unitId) {
      filtered = filtered.filter(line => line.unitId === params.unitId);
    }

    // Apply line type filter
    if (params.lineType) {
      filtered = filtered.filter(line => line.lineType === params.lineType);
    }

    // Sort by line code
    filtered.sort((a, b) => a.lineCode.localeCompare(b.lineCode));

    // Apply pagination
    if (params.limit) {
      const start = params.offset || 0;
      filtered = filtered.slice(start, start + params.limit);
    }

    return filtered;
  }

  async findById(id: string): Promise<Line | null> {
    const line = this.lines.find(l => l.id === id);
    return line || null;
  }

  async findByCode(lineCode: string): Promise<Line | null> {
    const line = this.lines.find(l => l.lineCode === lineCode);
    return line || null;
  }

  async create(data: CreateLineData): Promise<Line> {
    // Check for duplicate line code
    const existingLine = await this.findByCode(data.lineCode);
    if (existingLine) {
      throw new Error(`Line with code "${data.lineCode}" already exists`);
    }

    const newLine: Line = {
      id: `line_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      lineCode: data.lineCode,
      lineName: data.lineName,
      unitId: data.unitId,
      lineType: data.lineType,
      defaultCapacity: data.defaultCapacity || 0,
      notes: data.notes,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.lines.push(newLine);
    return newLine;
  }

  async update(id: string, data: UpdateLineData): Promise<Line> {
    const lineIndex = this.lines.findIndex(l => l.id === id);
    if (lineIndex === -1) {
      throw new Error(`Line with ID "${id}" not found`);
    }

    const existingLine = this.lines[lineIndex];

    // Check for duplicate line code if being updated
    if (data.lineCode && data.lineCode !== existingLine.lineCode) {
      const lineWithSameCode = await this.findByCode(data.lineCode);
      if (lineWithSameCode) {
        throw new Error(`Line with code "${data.lineCode}" already exists`);
      }
    }

    const updatedLine: Line = {
      ...existingLine,
      ...data,
      updatedAt: new Date(),
    };

    this.lines[lineIndex] = updatedLine;
    return updatedLine;
  }

  async delete(id: string): Promise<boolean> {
    const lineIndex = this.lines.findIndex(l => l.id === id);
    if (lineIndex === -1) {
      return false;
    }

    this.lines.splice(lineIndex, 1);
    return true;
  }

  async count(params: LineSearchParams = {}): Promise<number> {
    const filtered = await this.findMany(params);
    return filtered.length;
  }

  async deleteAll(): Promise<number> {
    const count = this.lines.length;
    this.lines = [];
    return count;
  }
}

export const mockLineService = new MockLineService();
