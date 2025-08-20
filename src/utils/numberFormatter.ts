/**
 * Centralized number formatting utilities to ensure consistent 2 decimal places
 * throughout the application with comprehensive validation
 */

import { validateNumeric, validatePercentage, validateConfidence, validatePrice } from './dataValidator';

/**
 * Formats a number to exactly 2 decimal places with validation
 * @param value - The number to format
 * @param fallback - Fallback value if the number is invalid (default: "0.00")
 * @returns Formatted string with 2 decimal places
 */
export function formatToTwoDecimals(value: number | null | undefined, fallback: string = "0.00"): string {
  const validation = validateNumeric(value);
  if (!validation.isValid) {
    return fallback;
  }
  return validation.value.toFixed(2);
}

/**
 * Formats a currency value to 2 decimal places with currency symbol
 * @param value - The number to format
 * @param currency - Currency symbol (default: "₹")
 * @param fallback - Fallback value if the number is invalid
 * @returns Formatted currency string
 */
export function formatCurrency(value: number | null | undefined, currency: string = "₹", fallback: string = "₹0.00"): string {
  const validation = validatePrice(value);
  if (!validation.isValid) {
    return fallback;
  }
  return `${currency}${validation.value.toFixed(2)}`;
}

/**
 * Formats a percentage value to 2 decimal places
 * @param value - The number to format (as decimal, e.g., 0.15 for 15%)
 * @param includeSign - Whether to include + sign for positive values (default: false)
 * @param fallback - Fallback value if the number is invalid
 * @returns Formatted percentage string
 */
export function formatPercentage(value: number | null | undefined, includeSign: boolean = false, fallback: string = "0.00%"): string {
  const validation = validatePercentage(value);
  if (!validation.isValid) {
    return fallback;
  }
  const sign = includeSign && validation.value >= 0 ? '+' : '';
  return `${sign}${(validation.value * 100).toFixed(2)}%`;
}

/**
 * Formats a percentage value that's already in percentage form (e.g., 15 for 15%)
 * @param value - The number to format (already in percentage)
 * @param includeSign - Whether to include + sign for positive values (default: false)
 * @param fallback - Fallback value if the number is invalid
 * @returns Formatted percentage string
 */
export function formatPercentageValue(value: number | null | undefined, includeSign: boolean = false, fallback: string = "0.00%"): string {
  if (value == null || !Number.isFinite(value)) {
    return fallback;
  }
  const sign = includeSign && value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

/**
 * Formats a price value with appropriate precision
 * For prices >= 1: 2 decimal places
 * For prices < 1: 4 decimal places (precision)
 * @param price - The price to format
 * @param currency - Currency symbol (default: "₹")
 * @param fallback - Fallback value if the number is invalid
 * @returns Formatted price string
 */
export function formatPrice(price: number | null | undefined, currency: string = "₹", fallback: string = "₹0.00"): string {
  if (price == null || !Number.isFinite(price)) {
    return fallback;
  }
  
  if (price >= 1) {
    return `${currency}${price.toFixed(2)}`;
  } else {
    return `${currency}${price.toPrecision(4)}`;
  }
}

/**
 * Formats a number with specified decimal places (defaults to 2)
 * @param value - The number to format
 * @param decimals - Number of decimal places (default: 2)
 * @param fallback - Fallback value if the number is invalid
 * @returns Formatted number string
 */
export function formatNumber(value: number | null | undefined, decimals: number = 2, fallback: string = "N/A"): string {
  if (value == null || !Number.isFinite(value)) {
    return fallback;
  }
  return value.toFixed(decimals);
}

/**
 * Formats a ratio or metric value to 2 decimal places
 * @param value - The number to format
 * @param fallback - Fallback value if the number is invalid
 * @returns Formatted ratio string
 */
export function formatRatio(value: number | null | undefined, fallback: string = "0.00"): string {
  return formatToTwoDecimals(value, fallback);
}

/**
 * Formats a confidence score to 1 decimal place (for percentages like 85.5%)
 * @param value - The number to format
 * @param fallback - Fallback value if the number is invalid
 * @returns Formatted confidence string
 */
export function formatConfidence(value: number | null | undefined, fallback: string = "0.0%"): string {
  const validation = validateConfidence(value);
  if (!validation.isValid) {
    return fallback;
  }
  return `${(validation.value * 100).toFixed(1)}%`;
}

/**
 * Formats a strength value to 0 decimal places (for percentages like 85%)
 * @param value - The number to format
 * @param fallback - Fallback value if the number is invalid
 * @returns Formatted strength string
 */
export function formatStrength(value: number | null | undefined, fallback: string = "0%"): string {
  if (value == null || !Number.isFinite(value)) {
    return fallback;
  }
  return `${value.toFixed(0)}%`;
} 