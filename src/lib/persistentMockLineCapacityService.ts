// src/lib/persistentMockLineCapacityService.ts
import fs from 'fs';
import path from 'path';
import type { LineCapacity, CreateLineCapacityData, UpdateLineCapacityData, LineCapacityFilters } from './interfaces';

const STORAGE_FILE_PATH = path.join(process.cwd(), 'tmp', 'mockLineCapacities.json');

// Initial mock data
const initialMockLineCapacities: LineCapacity[] = [
  {
    id: 1,
    lineId: 'line-dg-01',
    orderNo: 'PO-2024-001',
    buyer: 'Global Fashion Inc.',
    styleNo: 'GF-001',
    garmentDescription: 'Basic T-Shirt',
    sam: 12.5,
    operators: 30,
    workingHours: 8.0,
    efficiency: 85.0,
    dailyCapacity: 1152.0,
    effectiveFrom: new Date('2024-01-15'),
    effectiveTo: undefined,
    createdAt: new Date('2024-01-15T08:00:00Z'),
    updatedAt: new Date('2024-01-15T08:00:00Z'),
  },
  {
    id: 2,
    lineId: 'line-dg-01',
    orderNo: 'PO-2024-002',
    buyer: 'European Styles Ltd.',
    styleNo: 'ES-202',
    garmentDescription: 'Polo Shirt',
    sam: 15.8,
    operators: 30,
    workingHours: 8.0,
    efficiency: 85.0,
    dailyCapacity: 911.39,
    effectiveFrom: new Date('2024-02-01'),
    effectiveTo: new Date('2024-02-28'),
    createdAt: new Date('2024-01-20T09:00:00Z'),
    updatedAt: new Date('2024-01-20T09:00:00Z'),
  },
  {
    id: 3,
    lineId: 'line-dg-02',
    orderNo: 'PO-2024-003',
    buyer: 'Asian Apparel Co.',
    styleNo: 'AA-305',
    garmentDescription: 'Dress Shirt',
    sam: 22.3,
    operators: 35,
    workingHours: 8.0,
    efficiency: 90.0,
    dailyCapacity: 848.43,
    effectiveFrom: new Date('2024-01-20'),
    effectiveTo: undefined,
    createdAt: new Date('2024-01-20T10:00:00Z'),
    updatedAt: new Date('2024-01-20T10:00:00Z'),
  },
  {
    id: 4,
    lineId: 'line-sz-01',
    orderNo: 'PO-2024-004',
    buyer: 'Trendy Threads LLC',
    styleNo: 'TT-150',
    garmentDescription: 'Hoodie',
    sam: 28.7,
    operators: 25,
    workingHours: 8.0,
    efficiency: 80.0,
    dailyCapacity: 502.09,
    effectiveFrom: new Date('2024-02-15'),
    effectiveTo: undefined,
    createdAt: new Date('2024-02-10T11:00:00Z'),
    updatedAt: new Date('2024-02-10T11:00:00Z'),
  },
  {
    id: 5,
    lineId: 'line-sz-02',
    orderNo: 'PO-2024-005',
    buyer: 'Quality Wear Inc.',
    styleNo: 'QW-088',
    garmentDescription: 'Jeans',
    sam: 35.2,
    operators: 40,
    workingHours: 8.0,
    efficiency: 75.0,
    dailyCapacity: 682.95,
    effectiveFrom: new Date('2024-03-01'),
    effectiveTo: new Date('2024-04-30'),
    createdAt: new Date('2024-02-25T12:00:00Z'),
    updatedAt: new Date('2024-02-25T12:00:00Z'),
  },
];

export class PersistentMockLineCapacityService {
  private capacities: LineCapacity[] = [];
  private nextId = 6;
  private initialized = false;

  // Ensure tmp directory exists
  private ensureTmpDir(): void {
    const tmpDir = path.dirname(STORAGE_FILE_PATH);
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
  }
  // Load data from file or initialize with default data
  private loadData(): void {
    if (this.initialized) return;

    this.ensureTmpDir();

    try {
      if (fs.existsSync(STORAGE_FILE_PATH)) {
        const data = fs.readFileSync(STORAGE_FILE_PATH, 'utf8');
        const parsed = JSON.parse(data);
        
        // Convert date strings back to Date objects
        this.capacities = parsed.capacities.map((capacity: any) => ({
          ...capacity,
          effectiveFrom: capacity.effectiveFrom ? new Date(capacity.effectiveFrom) : new Date(),
          effectiveTo: capacity.effectiveTo ? new Date(capacity.effectiveTo) : undefined,
          createdAt: capacity.createdAt ? new Date(capacity.createdAt) : new Date(),
          updatedAt: capacity.updatedAt ? new Date(capacity.updatedAt) : new Date(),
        }));
        
        this.nextId = parsed.nextId || 6;
      } else {
        // Initialize with default data
        this.capacities = initialMockLineCapacities.map(capacity => ({
          ...capacity,
          effectiveFrom: capacity.effectiveFrom ? new Date(capacity.effectiveFrom) : new Date(),
          effectiveTo: capacity.effectiveTo ? new Date(capacity.effectiveTo) : undefined,
          createdAt: capacity.createdAt ? new Date(capacity.createdAt) : new Date(),
          updatedAt: capacity.updatedAt ? new Date(capacity.updatedAt) : new Date(),
        }));
        this.saveData();
      }
    } catch (error) {
      console.error('Error loading line capacity data:', error);
      this.capacities = [...initialMockLineCapacities];
    }

    this.initialized = true;
  }

  // Save data to file
  private saveData(): void {
    this.ensureTmpDir();
    
    try {
      const data = {
        capacities: this.capacities,
        nextId: this.nextId,
        lastUpdated: new Date().toISOString(),
      };
      
      fs.writeFileSync(STORAGE_FILE_PATH, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Error saving line capacity data:', error);
    }
  }

  // Calculate daily capacity
  private calculateDailyCapacity(operators: number, workingHours: number, efficiency: number, sam: number): number {
    return Math.round(((operators * workingHours * 60 * efficiency / 100) / sam) * 100) / 100;
  }
  // Create new line capacity
  async createLineCapacity(data: CreateLineCapacityData): Promise<LineCapacity> {
    this.loadData();

    const dailyCapacity = this.calculateDailyCapacity(
      data.operators,
      data.workingHours,
      data.efficiency,
      data.sam
    );

    const newCapacity: LineCapacity = {
      id: this.nextId++,
      lineId: data.lineId,
      orderNo: data.orderNo,
      buyer: data.buyer,
      styleNo: data.styleNo,
      garmentDescription: data.garmentDescription,
      sam: data.sam,
      operators: data.operators,
      workingHours: data.workingHours,
      efficiency: data.efficiency,
      dailyCapacity,
      effectiveFrom: data.effectiveFrom || new Date(),
      effectiveTo: data.effectiveTo,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.capacities.push(newCapacity);
    this.saveData();
    return newCapacity;
  }
  // Get all line capacities with optional filtering
  async getLineCapacities(filters?: LineCapacityFilters): Promise<LineCapacity[]> {
    this.loadData();

    let filteredCapacities = [...this.capacities];

    if (filters?.lineId) {
      filteredCapacities = filteredCapacities.filter(capacity => capacity.lineId === filters.lineId);
    }

    if (filters?.buyer) {
      filteredCapacities = filteredCapacities.filter(capacity => 
        capacity.buyer?.toLowerCase().includes(filters.buyer!.toLowerCase())
      );
    }

    if (filters?.active !== undefined) {
      // For backward compatibility, treat active filter as a way to filter all capacities
      // Since we don't have isActive property anymore, we just return all capacities
      // This maintains API compatibility while removing the deprecated property
    }

    if (filters?.effectiveDate) {
      const date = filters.effectiveDate;
      filteredCapacities = filteredCapacities.filter(capacity => {
        const from = capacity.effectiveFrom;
        const to = capacity.effectiveTo;
        return from && from <= date && (!to || to >= date);
      });
    }

    if (filters?.search) {
      const searchTerm = filters.search.toLowerCase();
      filteredCapacities = filteredCapacities.filter(capacity =>
        capacity.lineId.toLowerCase().includes(searchTerm) ||
        (capacity.orderNo?.toLowerCase().includes(searchTerm)) ||
        (capacity.buyer?.toLowerCase().includes(searchTerm)) ||
        (capacity.styleNo?.toLowerCase().includes(searchTerm)) ||
        (capacity.garmentDescription?.toLowerCase().includes(searchTerm))
      );
    }

    return filteredCapacities.sort((a, b) => {
      const aDate = a.effectiveFrom ? new Date(a.effectiveFrom).getTime() : 0;
      const bDate = b.effectiveFrom ? new Date(b.effectiveFrom).getTime() : 0;
      return bDate - aDate;
    });
  }
  // Get line capacity by ID
  async getLineCapacityById(id: number): Promise<LineCapacity | null> {
    this.loadData();
    const capacity = this.capacities.find(c => c.id === id);
    return capacity || null;
  }
  // Update line capacity
  async updateLineCapacity(id: number, data: UpdateLineCapacityData): Promise<LineCapacity> {
    this.loadData();

    const capacityIndex = this.capacities.findIndex(c => c.id === id);
    if (capacityIndex === -1) {
      throw new Error('Line capacity not found');
    }

    const existingCapacity = this.capacities[capacityIndex];
    
    // Recalculate daily capacity if relevant fields are updated
    let dailyCapacity = existingCapacity.dailyCapacity;
    if (data.operators !== undefined || data.workingHours !== undefined || 
        data.efficiency !== undefined || data.sam !== undefined) {
      
      const operators = data.operators ?? existingCapacity.operators;
      const workingHours = data.workingHours ?? existingCapacity.workingHours;
      const efficiency = data.efficiency ?? existingCapacity.efficiency;
      const sam = data.sam ?? existingCapacity.sam;
      
      dailyCapacity = this.calculateDailyCapacity(operators, workingHours, efficiency, sam);
    }

    // Update the capacity
    const updatedCapacity: LineCapacity = {
      ...existingCapacity,
      ...data,
      id, // Ensure ID doesn't change
      dailyCapacity,
      updatedAt: new Date(),
    };

    this.capacities[capacityIndex] = updatedCapacity;
    this.saveData();
    return updatedCapacity;
  }
  // Delete line capacity (hard delete since we don't have isActive anymore)
  async deleteLineCapacity(id: number): Promise<boolean> {
    this.loadData();

    const capacityIndex = this.capacities.findIndex(c => c.id === id);
    if (capacityIndex === -1) {
      return false;
    }

    this.capacities.splice(capacityIndex, 1);
    this.saveData();
    return true;
  }

  // Get capacities for a specific line
  async getCapacitiesByLineId(lineId: string): Promise<LineCapacity[]> {
    return this.getLineCapacities({ lineId });
  }
  // Get current capacity for a line (most recent effective)
  async getCurrentCapacityForLine(lineId: string, date?: Date): Promise<LineCapacity | null> {
    const targetDate = date || new Date();
    const capacities = await this.getLineCapacities({ 
      lineId, 
      effectiveDate: targetDate 
    });

    if (capacities.length === 0) return null;

    // Return the most recently effective capacity
    return capacities.sort((a, b) => {
      const aDate = a.effectiveFrom ? new Date(a.effectiveFrom).getTime() : 0;
      const bDate = b.effectiveFrom ? new Date(b.effectiveFrom).getTime() : 0;
      return bDate - aDate;
    })[0];
  }
  // Get statistics
  async getLineCapacityStats(): Promise<{
    totalCapacities: number;
    activeCapacities: number;
    uniqueLines: number;
    avgDailyCapacity: number;
  }> {
    this.loadData();
    
    const activeCapacities = [...this.capacities]; // All capacities are considered active since we removed isActive
    const uniqueLines = new Set(activeCapacities.map(c => c.lineId)).size;
    const totalDailyCapacity = activeCapacities.reduce((sum, c) => sum + (c.dailyCapacity || 0), 0);

    return {
      totalCapacities: this.capacities.length,
      activeCapacities: activeCapacities.length,
      uniqueLines,
      avgDailyCapacity: activeCapacities.length > 0 ? 
        Math.round((totalDailyCapacity / activeCapacities.length) * 100) / 100 : 0,
    };
  }

  // Search functionality
  async searchLineCapacities(searchTerm: string): Promise<LineCapacity[]> {
    return this.getLineCapacities({ search: searchTerm });
  }

  // Reset to initial data (for testing/development)
  async resetData(): Promise<void> {
    this.capacities = [...initialMockLineCapacities];
    this.nextId = 6;
    this.saveData();
  }
}

// Export singleton instance
export const persistentMockLineCapacityService = new PersistentMockLineCapacityService();
