/**
 * Validation test script for testing data validation utilities
 * Run this to verify all validation functions work correctly
 */

import { 
  validateNumeric, 
  validatePercentage, 
  validateConfidence, 
  validatePrice,
  validateArray,
  validateObject,
  safeGet,
  safeFormat
} from './dataValidator';
import { 
  formatCurrency, 
  formatPercentage, 
  formatConfidence, 
  formatNumber 
} from './numberFormatter';

interface TestCase {
  name: string;
  input: any;
  expected: any;
  validator: (input: any) => any;
}

const testCases: TestCase[] = [
  // Numeric validation tests
  {
    name: 'Valid number',
    input: 42.5,
    expected: { isValid: true, value: 42.5 },
    validator: validateNumeric
  },
  {
    name: 'Null value',
    input: null,
    expected: { isValid: false, value: 0, error: 'Value is null or undefined' },
    validator: validateNumeric
  },
  {
    name: 'Undefined value',
    input: undefined,
    expected: { isValid: false, value: 0, error: 'Value is null or undefined' },
    validator: validateNumeric
  },
  {
    name: 'NaN value',
    input: NaN,
    expected: { isValid: false, value: 0, error: 'Value is not a valid number' },
    validator: validateNumeric
  },
  {
    name: 'Infinity value',
    input: Infinity,
    expected: { isValid: false, value: 0, error: 'Value is infinite' },
    validator: validateNumeric
  },
  {
    name: 'String number',
    input: '123.45',
    expected: { isValid: true, value: 123.45 },
    validator: validateNumeric
  },
  {
    name: 'Invalid string',
    input: 'not a number',
    expected: { isValid: false, value: 0, error: 'Value is not a valid number' },
    validator: validateNumeric
  },

  // Percentage validation tests
  {
    name: 'Valid percentage (0-1)',
    input: 0.15,
    expected: { isValid: true, value: 0.15 },
    validator: validatePercentage
  },
  {
    name: 'Percentage already in percent format',
    input: 15,
    expected: { isValid: true, value: 0.15 },
    validator: validatePercentage
  },

  // Confidence validation tests
  {
    name: 'Valid confidence',
    input: 0.85,
    expected: { isValid: true, value: 0.85 },
    validator: validateConfidence
  },
  {
    name: 'Confidence above 1',
    input: 1.5,
    expected: { isValid: true, value: 1.0 },
    validator: validateConfidence
  },
  {
    name: 'Confidence below 0',
    input: -0.5,
    expected: { isValid: true, value: 0.0 },
    validator: validateConfidence
  },

  // Price validation tests
  {
    name: 'Valid price',
    input: 100.50,
    expected: { isValid: true, value: 100.50 },
    validator: validatePrice
  },
  {
    name: 'Negative price',
    input: -50,
    expected: { isValid: false, value: 0, error: 'Price cannot be negative' },
    validator: validatePrice
  },

  // Array validation tests
  {
    name: 'Valid array',
    input: [1, 2, 3],
    expected: { isValid: true, value: [1, 2, 3] },
    validator: validateArray
  },
  {
    name: 'Non-array',
    input: 'not an array',
    expected: { isValid: false, value: [], error: 'Value is not an array' },
    validator: validateArray
  },

  // Object validation tests
  {
    name: 'Valid object',
    input: { key: 'value' },
    expected: { isValid: true, value: { key: 'value' } },
    validator: validateObject
  },
  {
    name: 'Null object',
    input: null,
    expected: { isValid: false, value: {}, error: 'Value is not a valid object' },
    validator: validateObject
  }
];

function runTests() {
  console.log('🧪 Running validation tests...\n');
  
  let passed = 0;
  let failed = 0;
  
  testCases.forEach(testCase => {
    try {
      const result = testCase.validator(testCase.input);
      
      // Deep comparison for objects
      const isEqual = JSON.stringify(result) === JSON.stringify(testCase.expected);
      
      if (isEqual) {
        console.log(`✅ ${testCase.name}: PASSED`);
        passed++;
      } else {
        console.log(`❌ ${testCase.name}: FAILED`);
        console.log(`   Expected: ${JSON.stringify(testCase.expected)}`);
        console.log(`   Got:      ${JSON.stringify(result)}`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ ${testCase.name}: ERROR - ${error}`);
      failed++;
    }
  });
  
  console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);
  
  // Test safeGet function
  console.log('\n🔍 Testing safeGet function...');
  const testObj = { 
    nested: { 
      deep: { 
        value: 42 
      } 
    } 
  };
  
  console.log(`safeGet(testObj, 'nested.deep.value', 0): ${safeGet(testObj, 'nested.deep.value', 0)}`);
  console.log(`safeGet(testObj, 'nested.deep.missing', 0): ${safeGet(testObj, 'nested.deep.missing', 0)}`);
  console.log(`safeGet(null, 'any.path', 0): ${safeGet(null, 'any.path', 0)}`);
  
  // Test safeFormat function
  console.log('\n🔍 Testing safeFormat function...');
  console.log(`safeFormat(42.5, (v) => \`\$${v.toFixed(2)}\`, 'N/A'): ${safeFormat(42.5, (v) => `$${v.toFixed(2)}`, 'N/A')}`);
  console.log(`safeFormat(null, (v) => \`\$${v.toFixed(2)}\`, 'N/A'): ${safeFormat(null, (v) => `$${v.toFixed(2)}`, 'N/A')}`);
  
  // Test number formatter functions
  console.log('\n🔍 Testing number formatter functions...');
  console.log(`formatCurrency(100.5): ${formatCurrency(100.5)}`);
  console.log(`formatCurrency(null): ${formatCurrency(null)}`);
  console.log(`formatPercentage(0.15): ${formatPercentage(0.15)}`);
  console.log(`formatPercentage(15): ${formatPercentage(15)}`);
  console.log(`formatConfidence(0.85): ${formatConfidence(0.85)}`);
  console.log(`formatConfidence(null): ${formatConfidence(null)}`);
  
  return { passed, failed };
}

// Export for use in other modules
export { runTests };

// Run tests if this file is executed directly
if (typeof window !== 'undefined') {
  // Browser environment
  (window as any).runValidationTests = runTests;
} else {
  // Node.js environment
  runTests();
}
