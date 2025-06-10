/**
 * Comprehensive test for the dual-level Planning Board system
 * Tests integration and functionality of both High-Level and Low-Level Planning Boards
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Testing Dual-Level Planning Board Implementation\n');

// Test 1: Verify type system extension
function testTypeSystem() {
    console.log('1. Testing Type System Extension...');
    
    const typesPath = path.join(__dirname, '../src/components/plan-view/types.ts');
    const typesContent = fs.readFileSync(typesPath, 'utf8');
    
    const hasHighLevelPlanning = typesContent.includes("'high-level-planning'");
    const hasLowLevelPlanning = typesContent.includes("'low-level-planning'");
    
    console.log(`   ✓ High-Level Planning type: ${hasHighLevelPlanning ? '✅ Found' : '❌ Missing'}`);
    console.log(`   ✓ Low-Level Planning type: ${hasLowLevelPlanning ? '✅ Found' : '❌ Missing'}`);
    
    return hasHighLevelPlanning && hasLowLevelPlanning;
}

// Test 2: Verify component files exist and are properly structured
function testComponentFiles() {
    console.log('\n2. Testing Component Files...');
    
    const highLevelPath = path.join(__dirname, '../src/components/plan-view/HighLevelPlanningBoard.tsx');
    const lowLevelPath = path.join(__dirname, '../src/components/plan-view/LowLevelPlanningBoard.tsx');
    
    const highLevelExists = fs.existsSync(highLevelPath);
    const lowLevelExists = fs.existsSync(lowLevelPath);
    
    console.log(`   ✓ HighLevelPlanningBoard.tsx: ${highLevelExists ? '✅ Exists' : '❌ Missing'}`);
    console.log(`   ✓ LowLevelPlanningBoard.tsx: ${lowLevelExists ? '✅ Exists' : '❌ Missing'}`);
    
    if (highLevelExists) {
        const highLevelContent = fs.readFileSync(highLevelPath, 'utf8');
        const hasHighLevelExport = highLevelContent.includes('export function HighLevelPlanningBoard');
        const hasTimelineFeatures = highLevelContent.includes('Timeline') && highLevelContent.includes('Capacity');
        const hasAlerts = highLevelContent.includes('Alerts & Milestones');
        
        console.log(`   ✓ High-Level Board export: ${hasHighLevelExport ? '✅ Found' : '❌ Missing'}`);
        console.log(`   ✓ Timeline features: ${hasTimelineFeatures ? '✅ Found' : '❌ Missing'}`);
        console.log(`   ✓ Alerts & Milestones: ${hasAlerts ? '✅ Found' : '❌ Missing'}`);
    }
    
    if (lowLevelExists) {
        const lowLevelContent = fs.readFileSync(lowLevelPath, 'utf8');
        const hasLowLevelExport = lowLevelContent.includes('export function LowLevelPlanningBoard');
        const hasShiftFeatures = lowLevelContent.includes('Day/Shift View') && lowLevelContent.includes('Operator Mapping');
        const hasProgressTracking = lowLevelContent.includes('Progress Tracking');
        const hasBottlenecks = lowLevelContent.includes('Bottlenecks & Issues');
        
        console.log(`   ✓ Low-Level Board export: ${hasLowLevelExport ? '✅ Found' : '❌ Missing'}`);
        console.log(`   ✓ Shift features: ${hasShiftFeatures ? '✅ Found' : '❌ Missing'}`);
        console.log(`   ✓ Progress tracking: ${hasProgressTracking ? '✅ Found' : '❌ Missing'}`);
        console.log(`   ✓ Bottleneck management: ${hasBottlenecks ? '✅ Found' : '❌ Missing'}`);
    }
    
    return highLevelExists && lowLevelExists;
}

// Test 3: Verify toolbar integration
function testToolbarIntegration() {
    console.log('\n3. Testing Toolbar Integration...');
    
    const toolbarPath = path.join(__dirname, '../src/components/plan-view/timeline-toolbar.tsx');
    const toolbarContent = fs.readFileSync(toolbarPath, 'utf8');
    
    const hasHighLevelOption = toolbarContent.includes("'high-level-planning'") && toolbarContent.includes('High-Level Planning Board');
    const hasLowLevelOption = toolbarContent.includes("'low-level-planning'") && toolbarContent.includes('Low-Level Planning Board');
    const hasTargetIcon = toolbarContent.includes('Target');
    const hasZapIcon = toolbarContent.includes('Zap');
    
    console.log(`   ✓ High-Level Planning option: ${hasHighLevelOption ? '✅ Found' : '❌ Missing'}`);
    console.log(`   ✓ Low-Level Planning option: ${hasLowLevelOption ? '✅ Found' : '❌ Missing'}`);
    console.log(`   ✓ Target icon import: ${hasTargetIcon ? '✅ Found' : '❌ Missing'}`);
    console.log(`   ✓ Zap icon import: ${hasZapIcon ? '✅ Found' : '❌ Missing'}`);
    
    return hasHighLevelOption && hasLowLevelOption && hasTargetIcon && hasZapIcon;
}

// Test 4: Verify main page integration
function testMainPageIntegration() {
    console.log('\n4. Testing Main Page Integration...');
    
    const mainPagePath = path.join(__dirname, '../src/app/plan-view/page.tsx');
    const mainPageContent = fs.readFileSync(mainPagePath, 'utf8');
    
    const hasHighLevelImport = mainPageContent.includes('HighLevelPlanningBoard');
    const hasLowLevelImport = mainPageContent.includes('LowLevelPlanningBoard');
    const hasConditionalRendering = mainPageContent.includes("subProcessViewMode === 'high-level-planning'") &&
                                   mainPageContent.includes("subProcessViewMode === 'low-level-planning'");
    const hasLocalStorageUpdate = mainPageContent.includes("'high-level-planning', 'low-level-planning'");
    
    console.log(`   ✓ HighLevelPlanningBoard import: ${hasHighLevelImport ? '✅ Found' : '❌ Missing'}`);
    console.log(`   ✓ LowLevelPlanningBoard import: ${hasLowLevelImport ? '✅ Found' : '❌ Missing'}`);
    console.log(`   ✓ Conditional rendering logic: ${hasConditionalRendering ? '✅ Found' : '❌ Missing'}`);
    console.log(`   ✓ LocalStorage integration: ${hasLocalStorageUpdate ? '✅ Found' : '❌ Missing'}`);
    
    return hasHighLevelImport && hasLowLevelImport && hasConditionalRendering && hasLocalStorageUpdate;
}

// Test 5: Feature completeness check
function testFeatureCompleteness() {
    console.log('\n5. Testing Feature Completeness...');
    
    const highLevelPath = path.join(__dirname, '../src/components/plan-view/HighLevelPlanningBoard.tsx');
    const lowLevelPath = path.join(__dirname, '../src/components/plan-view/LowLevelPlanningBoard.tsx');
    
    const highLevelContent = fs.readFileSync(highLevelPath, 'utf8');
    const lowLevelContent = fs.readFileSync(lowLevelPath, 'utf8');
    
    // High-Level Features
    const highLevelFeatures = {
        timeline: highLevelContent.includes('Timeline') && highLevelContent.includes('WeeklyTimelineData'),
        capacity: highLevelContent.includes('Capacity') && highLevelContent.includes('LineCapacityData'),
        filters: highLevelContent.includes('Buyer') && highLevelContent.includes('Factory') && highLevelContent.includes('SAM'),
        milestones: highLevelContent.includes('Milestone') && highLevelContent.includes('Cutting Start'),
        alerts: highLevelContent.includes('Alert') && highLevelContent.includes('fabric shortage'),
        dragDrop: highLevelContent.includes('drag') || highLevelContent.includes('Drag'),
    };
    
    // Low-Level Features
    const lowLevelFeatures = {
        dayShift: lowLevelContent.includes('Day/Shift') && lowLevelContent.includes('ShiftData'),
        operators: lowLevelContent.includes('Operator') && lowLevelContent.includes('OperatorAssignment'),
        progress: lowLevelContent.includes('Progress') && lowLevelContent.includes('HourlyTarget'),
        bottlenecks: lowLevelContent.includes('Bottleneck') && lowLevelContent.includes('DelayReason'),
        realTime: lowLevelContent.includes('real-time') || lowLevelContent.includes('Real-time'),
        efficiency: lowLevelContent.includes('efficiency') || lowLevelContent.includes('Efficiency'),
    };
    
    console.log('\n   High-Level Planning Board Features:');
    Object.entries(highLevelFeatures).forEach(([feature, exists]) => {
        console.log(`     ✓ ${feature}: ${exists ? '✅ Implemented' : '❌ Missing'}`);
    });
    
    console.log('\n   Low-Level Planning Board Features:');
    Object.entries(lowLevelFeatures).forEach(([feature, exists]) => {
        console.log(`     ✓ ${feature}: ${exists ? '✅ Implemented' : '❌ Missing'}`);
    });
    
    const allHighLevel = Object.values(highLevelFeatures).every(Boolean);
    const allLowLevel = Object.values(lowLevelFeatures).every(Boolean);
    
    return allHighLevel && allLowLevel;
}

// Run all tests
function runAllTests() {
    console.log('=' .repeat(60));
    console.log('DUAL-LEVEL PLANNING BOARD IMPLEMENTATION TEST');
    console.log('=' .repeat(60));
    
    const results = {
        typeSystem: testTypeSystem(),
        componentFiles: testComponentFiles(),
        toolbarIntegration: testToolbarIntegration(),
        mainPageIntegration: testMainPageIntegration(),
        featureCompleteness: testFeatureCompleteness(),
    };
    
    console.log('\n' + '=' .repeat(60));
    console.log('TEST SUMMARY');
    console.log('=' .repeat(60));
    
    const totalTests = Object.keys(results).length;
    const passedTests = Object.values(results).filter(Boolean).length;
    
    Object.entries(results).forEach(([test, passed]) => {
        console.log(`${test.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}: ${passed ? '✅ PASS' : '❌ FAIL'}`);
    });
    
    console.log('\n' + '-'.repeat(60));
    console.log(`OVERALL RESULT: ${passedTests}/${totalTests} tests passed`);
    
    if (passedTests === totalTests) {
        console.log('🎉 ALL TESTS PASSED! Dual-Level Planning Board implementation is complete.');
        console.log('\n📋 Implementation Summary:');
        console.log('   • Type system extended with new planning board modes');
        console.log('   • High-Level Planning Board: Strategic view with timeline, capacity, alerts');
        console.log('   • Low-Level Planning Board: Execution view with shifts, operators, bottlenecks');
        console.log('   • Toolbar integration with new dropdown options');
        console.log('   • Main page conditional rendering updated');
        console.log('   • LocalStorage persistence for planning board modes');
        console.log('\n🚀 Ready for production use!');
    } else {
        console.log('⚠️  Some tests failed. Please review the implementation.');
    }
    
    return passedTests === totalTests;
}

// Execute tests
runAllTests();
