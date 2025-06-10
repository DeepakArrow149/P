// Simple test to validate the overlap detection and stacking logic
// This simulates the algorithm implemented in timeline-schedule-pane.tsx

function testOverlapStacking() {
  console.log("Testing Timeline Task Overlap Stacking Algorithm");
  
  // Mock tasks with overlapping time periods
  const mockTasks = [
    { id: 1, resourceId: 'R1', startIndex: 0, endIndex: 3, name: 'Task A' },
    { id: 2, resourceId: 'R1', startIndex: 2, endIndex: 5, name: 'Task B' },
    { id: 3, resourceId: 'R1', startIndex: 1, endIndex: 4, name: 'Task C' },
    { id: 4, resourceId: 'R1', startIndex: 6, endIndex: 8, name: 'Task D' },
    { id: 5, resourceId: 'R1', startIndex: 7, endIndex: 9, name: 'Task E' }
  ];

  console.log("Input tasks:", mockTasks);

  // Implement the stacking algorithm
  const stackedTasks = [];
  const occupiedLevels = []; // Array to track which stack levels are occupied at each time unit

  for (const taskData of mockTasks) {
    let stackLevel = 0;
    
    // Find the lowest available stack level for this task's time range
    while (true) {
      let levelAvailable = true;
      
      // Check if this stack level is free for the entire task duration
      for (let unitIndex = taskData.startIndex; unitIndex <= taskData.endIndex; unitIndex++) {
        if (!occupiedLevels[unitIndex]) occupiedLevels[unitIndex] = new Set();
        if (occupiedLevels[unitIndex].has(stackLevel)) {
          levelAvailable = false;
          break;
        }
      }
      
      if (levelAvailable) {
        // Mark this level as occupied for the task's duration
        for (let unitIndex = taskData.startIndex; unitIndex <= taskData.endIndex; unitIndex++) {
          if (!occupiedLevels[unitIndex]) occupiedLevels[unitIndex] = new Set();
          occupiedLevels[unitIndex].add(stackLevel);
        }
        break;
      }
      
      stackLevel++;
      // Safety check to prevent infinite loops
      if (stackLevel > 10) break;
    }
    
    stackedTasks.push({ ...taskData, stackLevel });
  }

  console.log("Stacked tasks result:");
  stackedTasks.forEach(task => {
    console.log(`${task.name} (${task.startIndex}-${task.endIndex}): Stack Level ${task.stackLevel}`);
  });

  // Verify the results
  console.log("\nValidation:");
  
  // Check if any tasks at the same stack level overlap
  for (let level = 0; level <= Math.max(...stackedTasks.map(t => t.stackLevel)); level++) {
    const tasksAtLevel = stackedTasks.filter(t => t.stackLevel === level);
    console.log(`Stack Level ${level}:`, tasksAtLevel.map(t => `${t.name}(${t.startIndex}-${t.endIndex})`));
    
    // Check for overlaps within this level
    for (let i = 0; i < tasksAtLevel.length; i++) {
      for (let j = i + 1; j < tasksAtLevel.length; j++) {
        const task1 = tasksAtLevel[i];
        const task2 = tasksAtLevel[j];
        const hasOverlap = !(task1.endIndex < task2.startIndex || task1.startIndex > task2.endIndex);
        if (hasOverlap) {
          console.log(`⚠️  OVERLAP DETECTED: ${task1.name} and ${task2.name} at level ${level}`);
        }
      }
    }
  }
  
  console.log("✅ Test completed");
}

testOverlapStacking();
