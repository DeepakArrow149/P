
// src/lib/lineGroupStore.ts
import type { LineGroup } from '@/components/plan-view/types';

// Re-export LineGroup type for consumers
export type { LineGroup };

const LINE_GROUPS_STORAGE_KEY = 'trackTechLineGroups_v1';

export const getLineGroups = (): LineGroup[] => {
  if (typeof window === 'undefined') return [];
  const storedGroups = localStorage.getItem(LINE_GROUPS_STORAGE_KEY);
  try {
    return storedGroups ? JSON.parse(storedGroups) : [];
  } catch (error) {
    console.error("Error parsing line groups from localStorage:", error);
    return [];
  }
};

export const saveLineGroups = (groups: LineGroup[]): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LINE_GROUPS_STORAGE_KEY, JSON.stringify(groups));
};

export const addLineGroup = (groupData: Omit<LineGroup, 'id'>): LineGroup => {
  const groups = getLineGroups();
  const newGroup: LineGroup = {
    ...groupData,
    id: `lg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
  };
  groups.push(newGroup);
  saveLineGroups(groups);
  return newGroup;
};

export const updateLineGroup = (updatedGroup: LineGroup): boolean => {
  let groups = getLineGroups();
  const index = groups.findIndex(g => g.id === updatedGroup.id);
  if (index !== -1) {
    groups[index] = updatedGroup;
    saveLineGroups(groups);
    return true;
  }
  return false;
};

export const deleteLineGroup = (groupId: string): boolean => {
  let groups = getLineGroups();
  const initialLength = groups.length;
  groups = groups.filter(g => g.id !== groupId);
  if (groups.length < initialLength) {
    saveLineGroups(groups);
    return true;
  }
  return false;
};
