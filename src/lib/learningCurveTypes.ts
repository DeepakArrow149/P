
export interface LearningCurvePoint {
  day: number;
  efficiency: number; // Percentage (0-100, but can be > 100 for highly skilled scenarios)
}

export interface LearningCurveMaster {
  id: string;
  name: string;
  curveType: 'Standard' | 'Complex' | 'Simple' | 'Custom'; // Example types
  points: LearningCurvePoint[];
  smv: number; // Standard Minute Value, MUST be > 0 for capacity calculation
  workingMinutesPerDay: number; // e.g., 450
  operatorsCount: number; // e.g., 20
  description?: string; // Added description field
}

// Type for Firestore schema, mirroring LearningCurveMaster but without 'id' for creation
export type LearningCurveDBSchema = Omit<LearningCurveMaster, 'id'> & { id: string };


// Helper to generate points for standard types (can be adjusted)
const generateStandardPoints = (initial: number, target: number, days: number): LearningCurvePoint[] => {
  if (days <= 0) return [{ day: 1, efficiency: target }];
  const points: LearningCurvePoint[] = [];
  for (let i = 0; i < days; i++) {
    const dayNum = i + 1;
    const efficiency = initial + ((target - initial) / (days -1 < 1 ? 1 : days -1)) * i; // Avoid division by zero if days is 1
    points.push({ day: dayNum, efficiency: parseFloat(Math.min(efficiency, target).toFixed(1)) });
  }
   // Ensure target is reached on the last day or immediately after
   const lastPointDay = points.length > 0 ? points[points.length - 1].day : 0;
   const lastPointEfficiency = points.length > 0 ? points[points.length - 1].efficiency : initial;

   if (points.length === 0 && days > 0) { // Handle case where loop doesn't run (e.g., days=1)
     points.push({ day: 1, efficiency: initial});
   }

   if (lastPointDay < days || (lastPointDay === days && lastPointEfficiency < target) ) {
      // Add or update the target efficiency for the final learning day
      const existingTargetDayPointIndex = points.findIndex(p => p.day === days);
      if (existingTargetDayPointIndex !== -1) {
        points[existingTargetDayPointIndex].efficiency = target;
      } else {
        points.push({ day: days, efficiency: target });
      }
   } else if (points.length > 0 && points[points.length - 1].day === days && points[points.length -1].efficiency < target) {
      // If loop finished but target not hit exactly (due to float precision), set it
       points[points.length - 1].efficiency = target;
   }

   // Add a final point to maintain target efficiency after learning period, if not already there
   if (points.length > 0) {
       const finalLearningDay = points[points.length - 1].day;
       if (points[points.length -1].efficiency === target) { // Only add next day point if target is met
            const nextDayPointIndex = points.findIndex(p => p.day === finalLearningDay + 1);
            if (nextDayPointIndex === -1) {
                 points.push({ day: finalLearningDay + 1, efficiency: target });
            } else {
                points[nextDayPointIndex].efficiency = target; // Ensure it's target
            }
       }
   }


  // Ensure unique days and sort
  const pointMap = new Map<number, number>();
  points.forEach(p => pointMap.set(p.day, p.efficiency));
  return Array.from(pointMap.entries()).sort((a,b) => a[0] - b[0]).map(([day, efficiency]) => ({ day, efficiency }));
};


export const mockLearningCurves: LearningCurveMaster[] = [
  {
    id: 'lc-simple-tee',
    name: 'Simple T-Shirt Curve',
    curveType: 'Simple',
    points: generateStandardPoints(45, 80, 5), // Reaches 80% in 5 days
    smv: 8, // SMV for a simple T-shirt
    workingMinutesPerDay: 480, // 8 hours
    operatorsCount: 20,
    description: 'For basic t-shirts, quick learning, high volume.',
  },
  {
    id: 'lc-complex-jacket',
    name: 'Complex Jacket Curve',
    curveType: 'Complex',
    points: generateStandardPoints(30, 70, 15), // Reaches 70% in 15 days
    smv: 45, // SMV for a complex jacket
    workingMinutesPerDay: 480,
    operatorsCount: 25,
    description: 'For multi-panel jackets with many operations, slower learning.',
  },
  {
    id: 'lc-standard-polo',
    name: 'Standard Polo Shirt',
    curveType: 'Standard',
    points: generateStandardPoints(40, 75, 10), // Reaches 75% in 10 days
    smv: 15, // SMV for a standard polo
    workingMinutesPerDay: 480,
    operatorsCount: 22,
    description: 'Standard polo shirt production line learning curve.',
  },
   {
    id: 'lc-very-fast',
    name: 'Very Fast Item Curve',
    curveType: 'Simple',
    points: generateStandardPoints(60, 90, 3), // Reaches 90% in 3 days
    smv: 5, // SMV for a very simple item like a cap or basic accessory
    workingMinutesPerDay: 480,
    operatorsCount: 15,
    description: 'For very simple items with highly skilled operators or repeat orders.',
  },
  {
    id: 'lc-moderate-dress',
    name: 'Moderate Dress Curve',
    curveType: 'Standard',
    points: generateStandardPoints(35, 72, 12), // Reaches 72% in 12 days
    smv: 25, // SMV for a moderately complex dress
    workingMinutesPerDay: 480,
    operatorsCount: 18,
    description: 'Learning curve for dresses with moderate complexity.',
  }
];
