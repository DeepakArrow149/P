// src/lib/persistentMockLineService.ts
import fs from 'fs';
import path from 'path';
import type { Line, CreateLineData, UpdateLineData, LineSearchParams } from './lineRepository';

const DATA_DIR = path.join(process.cwd(), 'tmp');
const LINES_FILE = path.join(DATA_DIR, 'lines.json');

// Initial mock data that matches the database Line interface
const initialMockLines: Line[] = [
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

export class PersistentMockLineService {
  private ensureDataDir(): void {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private loadLines(): Line[] {
    this.ensureDataDir();
    
    if (!fs.existsSync(LINES_FILE)) {
      this.saveLines(initialMockLines);
      return [...initialMockLines];
    }

    try {
      const data = fs.readFileSync(LINES_FILE, 'utf8');
      const lines = JSON.parse(data);
      
      // Convert date strings back to Date objects
      return lines.map((line: any) => ({
        ...line,
        createdAt: line.createdAt ? new Date(line.createdAt) : undefined,
        updatedAt: line.updatedAt ? new Date(line.updatedAt) : undefined,
      }));
    } catch (error) {
      console.error('Error loading lines from file:', error);
      return [...initialMockLines];
    }
  }

  private saveLines(lines: Line[]): void {
    this.ensureDataDir();
    
    try {
      fs.writeFileSync(LINES_FILE, JSON.stringify(lines, null, 2));
    } catch (error) {
      console.error('Error saving lines to file:', error);
    }
  }

  async findMany(params: LineSearchParams = {}): Promise<Line[]> {
    let lines = this.loadLines();

    // Apply search filter
    if (params.search) {
      const searchLower = params.search.toLowerCase();
      lines = lines.filter(line =>
        line.lineCode.toLowerCase().includes(searchLower) ||
        line.lineName.toLowerCase().includes(searchLower)
      );
    }

    // Apply unit filter
    if (params.unitId) {
      lines = lines.filter(line => line.unitId === params.unitId);
    }

    // Apply line type filter
    if (params.lineType) {
      lines = lines.filter(line => line.lineType === params.lineType);
    }

    // Sort by line code
    lines.sort((a, b) => a.lineCode.localeCompare(b.lineCode));

    // Apply pagination
    if (params.limit) {
      const start = params.offset || 0;
      lines = lines.slice(start, start + params.limit);
    }

    return lines;
  }

  async findById(id: string): Promise<Line | null> {
    const lines = this.loadLines();
    const line = lines.find(l => l.id === id);
    return line || null;
  }

  async findByCode(lineCode: string): Promise<Line | null> {
    const lines = this.loadLines();
    const line = lines.find(l => l.lineCode === lineCode);
    return line || null;
  }

  async create(data: CreateLineData): Promise<Line> {
    const lines = this.loadLines();
    
    // Check for duplicate line code
    const existingLine = lines.find(l => l.lineCode === data.lineCode);
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

    lines.push(newLine);
    this.saveLines(lines);
    return newLine;
  }

  async update(id: string, data: UpdateLineData): Promise<Line> {
    const lines = this.loadLines();
    const lineIndex = lines.findIndex(l => l.id === id);
    
    if (lineIndex === -1) {
      throw new Error(`Line with ID "${id}" not found`);
    }

    const existingLine = lines[lineIndex];

    // Check for duplicate line code if being updated
    if (data.lineCode && data.lineCode !== existingLine.lineCode) {
      const lineWithSameCode = lines.find(l => l.lineCode === data.lineCode);
      if (lineWithSameCode) {
        throw new Error(`Line with code "${data.lineCode}" already exists`);
      }
    }

    const updatedLine: Line = {
      ...existingLine,
      ...data,
      updatedAt: new Date(),
    };

    lines[lineIndex] = updatedLine;
    this.saveLines(lines);
    return updatedLine;
  }

  async delete(id: string): Promise<boolean> {
    const lines = this.loadLines();
    const lineIndex = lines.findIndex(l => l.id === id);
    
    if (lineIndex === -1) {
      return false;
    }

    lines.splice(lineIndex, 1);
    this.saveLines(lines);
    return true;
  }

  async count(params: LineSearchParams = {}): Promise<number> {
    const filtered = await this.findMany(params);
    return filtered.length;
  }

  async deleteAll(): Promise<number> {
    const lines = this.loadLines();
    const count = lines.length;
    this.saveLines([]);
    return count;
  }
}

export const persistentMockLineService = new PersistentMockLineService();
