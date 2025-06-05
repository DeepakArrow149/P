// src/lib/persistentMockLineGroupService.ts
import fs from 'fs';
import path from 'path';
import type { LineGroup, CreateLineGroupData, UpdateLineGroupData, LineGroupFilters } from './interfaces';

const STORAGE_FILE_PATH = path.join(process.cwd(), 'tmp', 'mockLineGroups.json');

// Initial mock data
const initialMockLineGroups: LineGroup[] = [
  {
    id: 1,
    groupName: 'Dongguan Main Lines',
    lineIds: ['line-dg-01', 'line-dg-02'],
    description: 'Primary production lines at Dongguan factory',
    isActive: true,
    createdAt: new Date('2024-01-15T08:00:00Z'),
    updatedAt: new Date('2024-01-15T08:00:00Z'),
  },
  {
    id: 2,
    groupName: 'Dongguan Cutting Lines',
    lineIds: ['line-dg-03'],
    description: 'Cutting and preparation lines',
    isActive: true,
    createdAt: new Date('2024-01-15T09:00:00Z'),
    updatedAt: new Date('2024-01-15T09:00:00Z'),
  },
  {
    id: 3,
    groupName: 'Shenzhen Production',
    lineIds: ['line-sz-01', 'line-sz-02'],
    description: 'Main production and finishing lines at Shenzhen',
    isActive: true,
    createdAt: new Date('2024-01-15T10:00:00Z'),
    updatedAt: new Date('2024-01-15T10:00:00Z'),
  },
  {
    id: 4,
    groupName: 'Special Operations',
    lineIds: ['line-dg-04'],
    description: 'Specialized lines for complex operations',
    isActive: true,
    createdAt: new Date('2024-01-15T11:00:00Z'),
    updatedAt: new Date('2024-01-15T11:00:00Z'),
  },
];

export class PersistentMockLineGroupService {
  private groups: LineGroup[] = [];
  private nextId = 5;
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
        this.groups = parsed.groups.map((group: any) => ({
          ...group,
          createdAt: group.createdAt ? new Date(group.createdAt) : new Date(),
          updatedAt: group.updatedAt ? new Date(group.updatedAt) : new Date(),
        }));
        
        this.nextId = parsed.nextId || 5;
      } else {
        // Initialize with default data
        this.groups = initialMockLineGroups.map(group => ({
          ...group,
          createdAt: group.createdAt ? new Date(group.createdAt) : new Date(),
          updatedAt: group.updatedAt ? new Date(group.updatedAt) : new Date(),
        }));
        this.saveData();
      }
    } catch (error) {
      console.error('Error loading line group data:', error);
      this.groups = [...initialMockLineGroups];
    }

    this.initialized = true;
  }

  // Save data to file
  private saveData(): void {
    this.ensureTmpDir();
    
    try {
      const data = {
        groups: this.groups,
        nextId: this.nextId,
        lastUpdated: new Date().toISOString(),
      };
      
      fs.writeFileSync(STORAGE_FILE_PATH, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Error saving line group data:', error);
    }
  }
  // Create new line group
  async createLineGroup(data: CreateLineGroupData): Promise<LineGroup> {
    this.loadData();

    // Check for duplicate group name
    const existingGroup = this.groups.find(g => g.groupName === data.groupName && g.isActive);
    if (existingGroup) {
      throw new Error(`Line group with name '${data.groupName}' already exists`);
    }

    const newGroup: LineGroup = {
      id: this.nextId++,
      groupName: data.groupName,
      lineIds: [...data.lineIds],
      description: data.description,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.groups.push(newGroup);
    this.saveData();
    return newGroup;
  }

  // Get all line groups with optional filtering
  async getLineGroups(filters?: LineGroupFilters): Promise<LineGroup[]> {
    this.loadData();

    let filteredGroups = this.groups.filter(group => group.isActive);

    if (filters?.active !== undefined) {
      filteredGroups = filteredGroups.filter(group => group.isActive === filters.active);
    }    if (filters?.search) {
      const searchTerm = filters.search.toLowerCase();
      filteredGroups = filteredGroups.filter(group =>
        group.groupName.toLowerCase().includes(searchTerm) ||
        (group.description?.toLowerCase().includes(searchTerm) || false)
      );
    }

    if (filters?.hasLines !== undefined) {
      if (filters.hasLines) {
        filteredGroups = filteredGroups.filter(group => group.lineIds.length > 0);
      } else {
        filteredGroups = filteredGroups.filter(group => group.lineIds.length === 0);
      }
    }

    return filteredGroups.sort((a, b) => a.groupName.localeCompare(b.groupName));
  }

  // Get line group by ID
  async getLineGroupById(id: number): Promise<LineGroup | null> {
    this.loadData();
    const group = this.groups.find(g => g.id === id && g.isActive);
    return group || null;
  }
  // Get line group by name
  async getLineGroupByName(groupName: string): Promise<LineGroup | null> {
    this.loadData();
    const group = this.groups.find(g => g.groupName === groupName && g.isActive);
    return group || null;
  }
  // Update line group
  async updateLineGroup(id: number, data: UpdateLineGroupData): Promise<LineGroup> {
    this.loadData();

    const groupIndex = this.groups.findIndex(g => g.id === id && g.isActive);
    if (groupIndex === -1) {
      throw new Error('Line group not found');
    }

    const existingGroup = this.groups[groupIndex];

    // Check for group name uniqueness if updating
    if (data.groupName && data.groupName !== existingGroup.groupName) {
      const duplicate = this.groups.find(g => 
        g.groupName === data.groupName && g.id !== id && g.isActive
      );
      if (duplicate) {
        throw new Error(`Line group with name '${data.groupName}' already exists`);
      }
    }

    // Update the group
    const updatedGroup: LineGroup = {
      ...existingGroup,
      ...data,
      id, // Ensure ID doesn't change
      updatedAt: new Date(),
    };

    this.groups[groupIndex] = updatedGroup;
    this.saveData();
    return updatedGroup;
  }

  // Delete line group (soft delete)
  async deleteLineGroup(id: number): Promise<boolean> {
    this.loadData();

    const groupIndex = this.groups.findIndex(g => g.id === id && g.isActive);
    if (groupIndex === -1) {
      return false;
    }

    this.groups[groupIndex] = {
      ...this.groups[groupIndex],
      isActive: false,
      updatedAt: new Date(),
    };

    this.saveData();
    return true;
  }

  // Get line groups containing a specific line
  async getLineGroupsContainingLine(lineId: string): Promise<LineGroup[]> {
    this.loadData();
    return this.groups.filter(group => 
      group.isActive && group.lineIds.includes(lineId)
    );
  }

  // Get statistics
  async getLineGroupStats(): Promise<{
    totalGroups: number;
    activeGroups: number;
    totalLinesAssigned: number;
    avgLinesPerGroup: number;
  }> {
    this.loadData();
    
    const activeGroups = this.groups.filter(g => g.isActive);
    const totalLinesAssigned = activeGroups.reduce((sum, group) => sum + group.lineIds.length, 0);

    return {
      totalGroups: this.groups.length,
      activeGroups: activeGroups.length,
      totalLinesAssigned,
      avgLinesPerGroup: activeGroups.length > 0 ? 
        Math.round((totalLinesAssigned / activeGroups.length) * 100) / 100 : 0,
    };
  }

  // Search functionality
  async searchLineGroups(searchTerm: string): Promise<LineGroup[]> {
    return this.getLineGroups({ search: searchTerm });
  }

  // Reset to initial data (for testing/development)
  async resetData(): Promise<void> {
    this.groups = [...initialMockLineGroups];
    this.nextId = 5;
    this.saveData();
  }
}

// Export singleton instance
export const persistentMockLineGroupService = new PersistentMockLineGroupService();
