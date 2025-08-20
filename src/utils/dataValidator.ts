/**
 * Comprehensive data validation utilities for safe display of values
 */

export interface ValidationResult<T> {
  isValid: boolean;
  value: T;
  error?: string;
}

/**
 * Validates and sanitizes numeric values for display
 */
export function validateNumeric(value: any, fallback: number = 0): ValidationResult<number> {
  if (value == null || value === undefined) {
    return { isValid: false, value: fallback, error: 'Value is null or undefined' };
  }
  
  const num = Number(value);
  
  if (isNaN(num)) {
    return { isValid: false, value: fallback, error: 'Value is not a valid number' };
  }
  
  if (!isFinite(num)) {
    return { isValid: false, value: fallback, error: 'Value is infinite' };
  }
  
  return { isValid: true, value: num };
}

/**
 * Validates percentage values (0-1 range) and converts to display format
 */
export function validatePercentage(value: any, fallback: number = 0): ValidationResult<number> {
  const result = validateNumeric(value, fallback);
  
  if (!result.isValid) {
    return result;
  }
  
  // Ensure percentage is in 0-1 range for display
  if (result.value > 1) {
    // Assume it's already in percentage format (e.g., 15 for 15%)
    return { isValid: true, value: result.value / 100 };
  }
  
  return result;
}

/**
 * Validates confidence scores and ensures they're in proper range
 */
export function validateConfidence(value: any, fallback: number = 0): ValidationResult<number> {
  const result = validatePercentage(value, fallback);
  
  if (!result.isValid) {
    return result;
  }
  
  // Clamp confidence to 0-1 range
  const clamped = Math.max(0, Math.min(1, result.value));
  
  return { isValid: true, value: clamped };
}

/**
 * Validates price values and ensures they're positive
 */
export function validatePrice(value: any, fallback: number = 0): ValidationResult<number> {
  const result = validateNumeric(value, fallback);
  
  if (!result.isValid) {
    return result;
  }
  
  // Ensure price is non-negative
  if (result.value < 0) {
    return { isValid: false, value: fallback, error: 'Price cannot be negative' };
  }
  
  return result;
}

/**
 * Validates array data and ensures it's safe to iterate
 */
export function validateArray<T>(value: any, fallback: T[] = []): ValidationResult<T[]> {
  if (!Array.isArray(value)) {
    return { isValid: false, value: fallback, error: 'Value is not an array' };
  }
  
  return { isValid: true, value };
}

/**
 * Validates object data and ensures it's safe to access
 */
export function validateObject(value: any, fallback: Record<string, any> = {}): ValidationResult<Record<string, any>> {
  if (value == null || typeof value !== 'object' || Array.isArray(value)) {
    return { isValid: false, value: fallback, error: 'Value is not a valid object' };
  }
  
  return { isValid: true, value };
}

/**
 * Safe property access with validation
 */
export function safeGet<T>(obj: any, path: string, fallback: T): T {
  if (!obj || typeof obj !== 'object') {
    return fallback;
  }
  
  const keys = path.split('.');
  let current = obj;
  
  for (const key of keys) {
    if (current == null || typeof current !== 'object' || !(key in current)) {
      return fallback;
    }
    current = current[key];
  }
  
  return current ?? fallback;
}

/**
 * Validates and formats a value for display with proper error handling
 */
export function safeFormat(
  value: any, 
  formatter: (val: number) => string, 
  fallback: string = 'N/A'
): string {
  const validation = validateNumeric(value);
  
  if (!validation.isValid) {
    return fallback;
  }
  
  try {
    return formatter(validation.value);
  } catch (error) {
    return fallback;
  }
}
