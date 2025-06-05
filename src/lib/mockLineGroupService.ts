// src/lib/mockLineGroupService.ts
import type { LineGroup, CreateLineGroupData, UpdateLineGroupData, LineGroupFilters } from './interfaces';

// Mock data that matches the database LineGroup interface
const mockLineGroups: LineGroup[] = [
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

export class MockLineGroupService {
  private groups: LineGroup[] = [...mockLineGroups];
  private nextId = 5;
  // Create new line group
  async createLineGroup(data: CreateLineGroupData): Promise<LineGroup> {
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
    return newGroup;
  }

  // Get all line groups with optional filtering
  async getLineGroups(filters?: LineGroupFilters): Promise<LineGroup[]> {
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
    const group = this.groups.find(g => g.id === id && g.isActive);
    return group || null;
  }
  // Get line group by name
  async getLineGroupByName(groupName: string): Promise<LineGroup | null> {
    const group = this.groups.find(g => g.groupName === groupName && g.isActive);
    return group || null;
  }
  // Update line group
  async updateLineGroup(id: number, data: UpdateLineGroupData): Promise<LineGroup> {
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
    return updatedGroup;
  }

  // Delete line group (soft delete)
  async deleteLineGroup(id: number): Promise<boolean> {
    const groupIndex = this.groups.findIndex(g => g.id === id && g.isActive);
    if (groupIndex === -1) {
      return false;
    }

    this.groups[groupIndex] = {
      ...this.groups[groupIndex],
      isActive: false,
      updatedAt: new Date(),
    };

    return true;
  }

  // Get line groups containing a specific line
  async getLineGroupsContainingLine(lineId: string): Promise<LineGroup[]> {
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
}

// Export singleton instance
export const mockLineGroupService = new MockLineGroupService();
