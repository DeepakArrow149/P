// src/lib/mockLineCapacityService.ts
import type { LineCapacity, CreateLineCapacityData, UpdateLineCapacityData, LineCapacityFilters } from './lineCapacityRepository';

// Mock data that matches the database LineCapacity interface
const mockLineCapacities: LineCapacity[] = [
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
    dailyCapacity: 1152.0, // Calculated: (30 * 8 * 60 * 85) / 12.5
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
    dailyCapacity: 911.39, // Calculated: (30 * 8 * 60 * 85) / 15.8
    effectiveFrom: new Date('2024-02-01'),
    effectiveTo: new Date('2024-02-28'),
    createdAt: new Date('2024-01-20T09:00:00Z'),
    updatedAt: new Date('2024-01-20T09:00:00Z'),
  },  {
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
    dailyCapacity: 848.43, // Calculated: (35 * 8 * 60 * 90) / 22.3
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
    dailyCapacity: 502.09, // Calculated: (25 * 8 * 60 * 80) / 28.7
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
    dailyCapacity: 682.95, // Calculated: (40 * 8 * 60 * 75) / 35.2
    effectiveFrom: new Date('2024-03-01'),
    effectiveTo: new Date('2024-04-30'),
    createdAt: new Date('2024-02-25T12:00:00Z'),
    updatedAt: new Date('2024-02-25T12:00:00Z'),
  },
];

export class MockLineCapacityService {
  private capacities: LineCapacity[] = [...mockLineCapacities];
  private nextId = 6;

  // Calculate daily capacity
  private calculateDailyCapacity(operators: number, workingHours: number, efficiency: number, sam: number): number {
    return Math.round(((operators * workingHours * 60 * efficiency / 100) / sam) * 100) / 100;
  }

  // Create new line capacity
  async createLineCapacity(data: CreateLineCapacityData): Promise<LineCapacity> {
    const dailyCapacity = this.calculateDailyCapacity(
      data.operators,
      data.workingHours,
      data.efficiency,
      data.sam
    );    const newCapacity: LineCapacity = {
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
    return newCapacity;
  }
  // Get all line capacities with optional filtering
  async getLineCapacities(filters?: LineCapacityFilters): Promise<LineCapacity[]> {
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
    const capacity = this.capacities.find(c => c.id === id);
    return capacity || null;
  }
  // Update line capacity
  async updateLineCapacity(id: number, data: UpdateLineCapacityData): Promise<LineCapacity> {
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
    return updatedCapacity;
  }
  // Delete line capacity (hard delete)
  async deleteLineCapacity(id: number): Promise<boolean> {
    const capacityIndex = this.capacities.findIndex(c => c.id === id);
    if (capacityIndex === -1) {
      return false;
    }

    this.capacities.splice(capacityIndex, 1);
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
    const activeCapacities = this.capacities; // All capacities are considered active now
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
}

// Export singleton instance
export const mockLineCapacityService = new MockLineCapacityService();
