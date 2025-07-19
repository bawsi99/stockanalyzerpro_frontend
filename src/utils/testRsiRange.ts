/**
 * RSI Range Test Utility
 * Validates RSI calculation and chart configuration for full 0-100 range
 */

export interface RsiTestResult {
  isValid: boolean;
  minValue: number;
  maxValue: number;
  averageValue: number;
  errors: string[];
  warnings: string[];
}

export interface RsiChartConfig {
  minValue: number;
  maxValue: number;
  autoScale: boolean;
  tickMarkFormatter: (value: number) => string;
}

/**
 * Test RSI calculation to ensure values are within 0-100 range
 */
export function testRsiRange(values: number[], period = 14): RsiTestResult {
  const result: RsiTestResult = {
    isValid: true,
    minValue: Infinity,
    maxValue: -Infinity,
    averageValue: 0,
    errors: [],
    warnings: []
  };

  if (values.length < period + 1) {
    result.isValid = false;
    result.errors.push(`Insufficient data: ${values.length} values, need at least ${period + 1}`);
    return result;
  }

  // Calculate RSI using the same algorithm as the chart
  const rsi: number[] = [];
  let gainSum = 0;
  let lossSum = 0;

  for (let i = 1; i < values.length; i++) {
    const change = values[i] - values[i - 1];
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? -change : 0;

    if (i <= period) {
      gainSum += gain;
      lossSum += loss;
      if (i === period) {
        const avgGain = gainSum / period;
        const avgLoss = lossSum / period;
        const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
        const rsiValue = 100 - 100 / (1 + rs);
        rsi.push(Math.max(0, Math.min(100, rsiValue)));
      } else {
        rsi.push(0); // Placeholder for incomplete periods
      }
      continue;
    }

    gainSum = (gainSum * (period - 1) + gain) / period;
    lossSum = (lossSum * (period - 1) + loss) / period;
    const rs = lossSum === 0 ? 100 : gainSum / lossSum;
    const rsiValue = 100 - 100 / (1 + rs);
    rsi.push(Math.max(0, Math.min(100, rsiValue)));
  }

  // Validate RSI values
  const validRsi = rsi.filter(v => v !== 0); // Remove placeholder values
  
  if (validRsi.length === 0) {
    result.isValid = false;
    result.errors.push('No valid RSI values calculated');
    return result;
  }

  result.minValue = Math.min(...validRsi);
  result.maxValue = Math.max(...validRsi);
  result.averageValue = validRsi.reduce((sum, val) => sum + val, 0) / validRsi.length;

  // Check range compliance
  if (result.minValue < 0) {
    result.isValid = false;
    result.errors.push(`RSI minimum value ${result.minValue} is below 0`);
  }

  if (result.maxValue > 100) {
    result.isValid = false;
    result.errors.push(`RSI maximum value ${result.maxValue} is above 100`);
  }

  // Check for extreme values
  if (result.minValue < 5) {
    result.warnings.push(`Very low RSI minimum: ${result.minValue.toFixed(2)}`);
  }

  if (result.maxValue > 95) {
    result.warnings.push(`Very high RSI maximum: ${result.maxValue.toFixed(2)}`);
  }

  // Check for reasonable range
  const range = result.maxValue - result.minValue;
  if (range < 10) {
    result.warnings.push(`Small RSI range: ${range.toFixed(2)} (may indicate low volatility)`);
  }

  return result;
}

/**
 * Generate test data with known RSI characteristics
 */
export function generateTestData(length = 100): number[] {
  const data: number[] = [];
  let price = 100;
  
  for (let i = 0; i < length; i++) {
    // Create some volatility to generate meaningful RSI values
    const volatility = 0.02;
    const change = (Math.random() - 0.5) * volatility * price;
    price += change;
    data.push(price);
  }
  
  return data;
}

/**
 * Validate RSI chart configuration
 */
export function validateRsiChartConfig(config: RsiChartConfig): RsiTestResult {
  const result: RsiTestResult = {
    isValid: true,
    minValue: config.minValue,
    maxValue: config.maxValue,
    averageValue: (config.minValue + config.maxValue) / 2,
    errors: [],
    warnings: []
  };

  // Check minimum value
  if (config.minValue < 0) {
    result.isValid = false;
    result.errors.push(`Chart minimum value ${config.minValue} should be >= 0`);
  }

  if (config.minValue > 0) {
    result.warnings.push(`Chart minimum value ${config.minValue} is not 0 (may hide extreme oversold conditions)`);
  }

  // Check maximum value
  if (config.maxValue > 100) {
    result.isValid = false;
    result.errors.push(`Chart maximum value ${config.maxValue} should be <= 100`);
  }

  if (config.maxValue < 100) {
    result.warnings.push(`Chart maximum value ${config.maxValue} is not 100 (may hide extreme overbought conditions)`);
  }

  // Check range
  const range = config.maxValue - config.minValue;
  if (range !== 100) {
    result.warnings.push(`Chart range ${range} is not 100 (should be 0-100 for RSI)`);
  }

  // Check autoScale
  if (config.autoScale) {
    result.warnings.push('AutoScale is enabled (should be false for fixed RSI range)');
  }

  return result;
}

/**
 * Run comprehensive RSI tests
 */
export function runRsiTests(): void {
  console.log('🧪 Running RSI Range Tests...\n');

  // Test 1: Generate and validate test data
  console.log('📊 Test 1: RSI Calculation Validation');
  const testData = generateTestData(200);
  const rsiResult = testRsiRange(testData);
  
  console.log(`   Min Value: ${rsiResult.minValue.toFixed(2)}`);
  console.log(`   Max Value: ${rsiResult.maxValue.toFixed(2)}`);
  console.log(`   Average: ${rsiResult.averageValue.toFixed(2)}`);
  console.log(`   Valid: ${rsiResult.isValid ? '✅' : '❌'}`);
  
  if (rsiResult.errors.length > 0) {
    console.log('   Errors:', rsiResult.errors);
  }
  if (rsiResult.warnings.length > 0) {
    console.log('   Warnings:', rsiResult.warnings);
  }

  // Test 2: Validate chart configuration
  console.log('\n📈 Test 2: Chart Configuration Validation');
  const chartConfig: RsiChartConfig = {
    minValue: 0,
    maxValue: 100,
    autoScale: false,
    tickMarkFormatter: (value: number) => value % 10 === 0 ? value.toString() : ''
  };
  
  const configResult = validateRsiChartConfig(chartConfig);
  console.log(`   Min Value: ${configResult.minValue}`);
  console.log(`   Max Value: ${configResult.maxValue}`);
  console.log(`   Valid: ${configResult.isValid ? '✅' : '❌'}`);
  
  if (configResult.errors.length > 0) {
    console.log('   Errors:', configResult.errors);
  }
  if (configResult.warnings.length > 0) {
    console.log('   Warnings:', configResult.warnings);
  }

  // Test 3: Edge cases
  console.log('\n🔍 Test 3: Edge Cases');
  
  // Test with all increasing values (should give high RSI)
  const increasingData = Array.from({ length: 50 }, (_, i) => 100 + i * 2);
  const highRsiResult = testRsiRange(increasingData);
  console.log(`   All Increasing - Max RSI: ${highRsiResult.maxValue.toFixed(2)}`);
  
  // Test with all decreasing values (should give low RSI)
  const decreasingData = Array.from({ length: 50 }, (_, i) => 200 - i * 2);
  const lowRsiResult = testRsiRange(decreasingData);
  console.log(`   All Decreasing - Min RSI: ${lowRsiResult.minValue.toFixed(2)}`);

  console.log('\n✅ RSI Range Tests Complete!');
}

// Export for use in development
if (typeof window !== 'undefined') {
  (window as any).testRsiRange = {
    testRsiRange,
    generateTestData,
    validateRsiChartConfig,
    runRsiTests
  };
} 