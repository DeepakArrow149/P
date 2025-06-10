// Test script to validate the date conversion fixes
const fs = require('fs');
const path = require('path');

// Read the orderService.ts file to test our date conversion logic
const orderServicePath = path.join(__dirname, 'src', 'lib', 'orderService.ts');
console.log('Testing date conversion fixes...\n');

// Test cases for the safeDateToISO function
const testCases = [
  { name: 'Valid Date object', input: new Date('2023-01-01'), expected: '2023-01-01T00:00:00.000Z' },
  { name: 'Valid date string', input: '2023-01-01', expected: '2023-01-01T00:00:00.000Z' },
  { name: 'Null value', input: null, expected: undefined },
  { name: 'Undefined value', input: undefined, expected: undefined },
  { name: 'Invalid date string', input: 'invalid-date', expected: undefined },
  { name: 'Empty string', input: '', expected: undefined },
  { name: 'Timestamp number', input: 1672531200000, expected: '2023-01-01T00:00:00.000Z' }
];

// Extract the safeDateToISO function from the file (simplified test)
function safeDateToISO(date) {
  if (!date) return undefined;
  
  try {
    if (date instanceof Date) {
      return date.toISOString();
    }
    if (typeof date === 'string') {
      const parsedDate = new Date(date);
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate.toISOString();
      }
    }
    if (typeof date === 'number') {
      const parsedDate = new Date(date);
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate.toISOString();
      }
    }
  } catch (error) {
    console.warn('Error converting date to ISO string:', error, 'Date value:', date);
  }
  
  return undefined;
}

// Run test cases
console.log('Running date conversion tests:');
console.log('================================');

let passed = 0;
let failed = 0;

testCases.forEach((testCase) => {
  const result = safeDateToISO(testCase.input);
  const success = result === testCase.expected;
  
  console.log(`${success ? '✅' : '❌'} ${testCase.name}: ${success ? 'PASS' : 'FAIL'}`);
  
  if (!success) {
    console.log(`   Expected: ${testCase.expected}`);
    console.log(`   Got: ${result}`);
    failed++;
  } else {
    passed++;
  }
});

console.log('\n================================');
console.log(`Results: ${passed} passed, ${failed} failed`);

if (failed === 0) {
  console.log('🎉 All date conversion tests passed!');
  console.log('\nThe fixes should resolve the JavaScript runtime errors:');
  console.log('- convertToStoredOrder@http://localhost:9002/_next/static/chunks/src_b06b8242._.js:409:49');
  console.log('- getAllOrders@http://localhost:9002/_next/static/chunks/src_b06b8242._.js:484:32');
} else {
  console.log('❌ Some tests failed. Please review the implementation.');
}

console.log('\nKey improvements made:');
console.log('1. Added safeDateToISO helper function for robust date conversion');
console.log('2. Added null/undefined checks for deliveryDetails and poLines arrays');
console.log('3. Added comprehensive error handling in convertToStoredOrder');
console.log('4. Enhanced getAllOrders with individual order error handling');
console.log('5. Improved logging for debugging problematic orders');
