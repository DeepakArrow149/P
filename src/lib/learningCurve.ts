
import { addDays, format } from 'date-fns';
import type { LearningCurvePoint } from './learningCurveTypes';

export interface DailyProduction {
  date: string; // YYYY-MM-DD
  efficiency: number; // Percentage
  capacity: number; // Units (calculated output)
}

/**
 * Interpolates efficiency for a given day based on defined learning curve points.
 *
 * @param day The day number (1-based) for which to calculate efficiency.
 * @param points An array of LearningCurvePoint objects, sorted by day.
 * @returns The interpolated efficiency percentage for the given day.
 */
function getEfficiencyForDay(day: number, points: LearningCurvePoint[]): number {
  if (!points || points.length === 0) {
    return 0; // Or a default efficiency if no points are defined
  }

  // Ensure points are sorted by day
  const sortedPoints = [...points].sort((a, b) => a.day - b.day);

  // Find the point exactly matching the day
  const exactMatch = sortedPoints.find(p => p.day === day);
  if (exactMatch) {
    return exactMatch.efficiency;
  }

  // If the day is before the first defined point, use the first point's efficiency
  if (day < sortedPoints[0].day) {
    return sortedPoints[0].efficiency;
  }

  // If the day is after the last defined point, use the last point's efficiency
  if (day > sortedPoints[sortedPoints.length - 1].day) {
    return sortedPoints[sortedPoints.length - 1].efficiency;
  }

  // Find the two points the day falls between for interpolation
  let p1: LearningCurvePoint | null = null;
  let p2: LearningCurvePoint | null = null;

  for (let i = 0; i < sortedPoints.length - 1; i++) {
    if (day > sortedPoints[i].day && day < sortedPoints[i + 1].day) {
      p1 = sortedPoints[i];
      p2 = sortedPoints[i + 1];
      break;
    }
  }

  if (p1 && p2) {
    // Linear interpolation
    const dayDiff = p2.day - p1.day;
    const efficiencyDiff = p2.efficiency - p1.efficiency;
    if (dayDiff === 0) return p1.efficiency; // Avoid division by zero
    const efficiency = p1.efficiency + (efficiencyDiff / dayDiff) * (day - p1.day);
    return parseFloat(efficiency.toFixed(2)); // Limit decimal places
  }

  // Should not happen if day is within the range, but return last point as fallback
  return sortedPoints[sortedPoints.length - 1].efficiency;
}


// Overload signature 1: For points-based calculation
export function calculateDailyProduction(
  points: LearningCurvePoint[],
  smv: number | undefined | null,
  workingMinutesPerDay: number,
  operatorsCount: number,
  durationInDays: number,
  startDate: Date
): DailyProduction[];

// Overload signature 2: For the old way (linear interpolation)
export function calculateDailyProduction(
  initialEfficiency: number,
  targetEfficiency: number,
  learningDays: number,
  smv: number | undefined | null,
  workingMinutesPerDay: number,
  operatorsCount: number,
  durationInDays: number,
  startDate: Date
): DailyProduction[];

// Combined Implementation (the actual function body)
export function calculateDailyProduction(
  arg1: number | LearningCurvePoint[],
  arg2: number | undefined | null | number, 
  arg3: number, 
  arg4: number | undefined | null | number, 
  arg5: number, 
  arg6: number | Date, 
  arg7?: number, 
  arg8?: Date 
): DailyProduction[] {
  if (Array.isArray(arg1)) {
    // New signature: calculateDailyProduction(points, smv, workingMinutes, operators, duration, startDate)
    const points = arg1 as LearningCurvePoint[];
    const smv = arg2 as number | undefined | null;
    const workingMinutesPerDay = arg3 as number;
    const operatorsCount = arg4 as number;
    const durationInDays = arg5 as number;
    const startDate = arg6 as Date;
    return calculateWithPointsInternal(points, smv, workingMinutesPerDay, operatorsCount, durationInDays, startDate);
  } else {
    // Old signature: calculateDailyProduction(initial, target, learnDays, smv, workMins, ops, duration, startDate)
    const initialEfficiency = arg1 as number;
    const targetEfficiency = arg2 as number;
    const learningDays = arg3 as number;
    const smv = arg4 as number | undefined | null;
    const workingMinutesPerDay = arg5 as number;
    const operatorsCount = arg6 as number;
    const durationInDays = arg7 as number; // Must be present for this overload
    const startDate = arg8 as Date; // Must be present for this overload
    return calculateLinearInternal(initialEfficiency, targetEfficiency, learningDays, smv, workingMinutesPerDay, operatorsCount, durationInDays, startDate);
  }
}

// --- Internal Helper Functions ---

function calculateWithPointsInternal(
  points: LearningCurvePoint[],
  smv: number | undefined | null,
  workingMinutesPerDay: number,
  operatorsCount: number,
  durationInDays: number,
  startDate: Date
): DailyProduction[] {
  const dailyProduction: DailyProduction[] = [];
  const validSmv = smv !== undefined && smv !== null && smv > 0;
  const sortedPoints = [...points].sort((a, b) => a.day - b.day);

  for (let dayIndex = 0; dayIndex < durationInDays; dayIndex++) {
    const currentDayNumber = dayIndex + 1;
    const currentEfficiency = getEfficiencyForDay(currentDayNumber, sortedPoints); // Uses the existing helper

    let dailyCapacity = 0;
    if (validSmv) {
      dailyCapacity = (currentEfficiency / 100) * operatorsCount * workingMinutesPerDay / smv!;
    }

    const currentDate = addDays(startDate, dayIndex);
    const formattedDate = format(currentDate, 'yyyy-MM-dd');

    dailyProduction.push({
      date: formattedDate,
      efficiency: parseFloat(currentEfficiency.toFixed(2)),
      capacity: parseFloat(dailyCapacity.toFixed(2)),
    });
  }
  return dailyProduction;
}

function calculateLinearInternal(
  initialEfficiency: number,
  targetEfficiency: number,
  learningDays: number,
  smv: number | undefined | null,
  workingMinutesPerDay: number,
  operatorsCount: number,
  durationInDays: number,
  startDate: Date
): DailyProduction[] {
  const dailyProduction: DailyProduction[] = [];
  const validSmv = smv !== undefined && smv !== null && smv > 0;

  for (let dayIndex = 0; dayIndex < durationInDays; dayIndex++) {
    const currentDayNumber = dayIndex + 1;
    let currentEfficiency: number;

    if (learningDays <= 0 || currentDayNumber > learningDays) {
      currentEfficiency = targetEfficiency;
    } else {
      // Linear interpolation for learning phase
      // Ensure learningDays is not zero to prevent division by zero if initialEfficiency != targetEfficiency
      if (learningDays > 0 && initialEfficiency !== targetEfficiency) {
         currentEfficiency = initialEfficiency + ((targetEfficiency - initialEfficiency) / learningDays) * dayIndex;
      } else if (learningDays === 0 && initialEfficiency !== targetEfficiency) {
         // If learningDays is 0, but efficiencies differ, immediately jump to target if dayIndex is 0, otherwise stay at target
         currentEfficiency = dayIndex === 0 ? initialEfficiency : targetEfficiency;
      }
      else {
         currentEfficiency = initialEfficiency; // Or targetEfficiency, they are the same
      }
    }
    
    currentEfficiency = Math.min(currentEfficiency, targetEfficiency); // Cap at target
    currentEfficiency = Math.max(currentEfficiency, initialEfficiency); // Floor at initial

    let dailyCapacity = 0;
    if (validSmv) {
      dailyCapacity = (currentEfficiency / 100) * operatorsCount * workingMinutesPerDay / smv!;
    }

    const currentDate = addDays(startDate, dayIndex);
    const formattedDate = format(currentDate, 'yyyy-MM-dd');

    dailyProduction.push({
      date: formattedDate,
      efficiency: parseFloat(currentEfficiency.toFixed(2)),
      capacity: parseFloat(dailyCapacity.toFixed(2)),
    });
  }
  return dailyProduction;
}
