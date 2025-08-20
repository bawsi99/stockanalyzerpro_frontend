/**
 * React hook for safe data validation and display
 */

import { useMemo } from 'react';
import { 
  validateNumeric, 
  validatePercentage, 
  validateConfidence, 
  validatePrice,
  validateArray,
  validateObject,
  safeGet,
  ValidationResult
} from '@/utils/dataValidator';
import { 
  formatCurrency, 
  formatPercentage, 
  formatConfidence, 
  formatNumber 
} from '@/utils/numberFormatter';

export interface ValidationHook {
  // Safe value access
  safeNumber: (value: any, fallback?: number) => number;
  safePercentage: (value: any, fallback?: number) => number;
  safeConfidence: (value: any, fallback?: number) => number;
  safePrice: (value: any, fallback?: number) => number;
  safeArray: <T>(value: any, fallback?: T[]) => T[];
  safeObject: (value: any, fallback?: Record<string, any>) => Record<string, any>;
  
  // Safe property access
  safeGet: <T>(obj: any, path: string, fallback: T) => T;
  
  // Formatted display values
  formatCurrency: (value: any, currency?: string, fallback?: string) => string;
  formatPercentage: (value: any, includeSign?: boolean, fallback?: string) => string;
  formatConfidence: (value: any, fallback?: string) => string;
  formatNumber: (value: any, decimals?: number, fallback?: string) => string;
  
  // Validation results for debugging
  validate: {
    numeric: (value: any, fallback?: number) => ValidationResult<number>;
    percentage: (value: any, fallback?: number) => ValidationResult<number>;
    confidence: (value: any, fallback?: number) => ValidationResult<number>;
    price: (value: any, fallback?: number) => ValidationResult<number>;
    array: <T>(value: any, fallback?: T[]) => ValidationResult<T[]>;
    object: (value: any, fallback?: Record<string, any>) => ValidationResult<Record<string, any>>;
  };
}

export function useDataValidation(): ValidationHook {
  return useMemo(() => ({
    // Safe value access
    safeNumber: (value: any, fallback: number = 0) => {
      const result = validateNumeric(value, fallback);
      return result.value;
    },
    
    safePercentage: (value: any, fallback: number = 0) => {
      const result = validatePercentage(value, fallback);
      return result.value;
    },
    
    safeConfidence: (value: any, fallback: number = 0) => {
      const result = validateConfidence(value, fallback);
      return result.value;
    },
    
    safePrice: (value: any, fallback: number = 0) => {
      const result = validatePrice(value, fallback);
      return result.value;
    },
    
    safeArray: <T>(value: any, fallback: T[] = []) => {
      const result = validateArray<T>(value, fallback);
      return result.value;
    },
    
    safeObject: (value: any, fallback: Record<string, any> = {}) => {
      const result = validateObject(value, fallback);
      return result.value;
    },
    
    // Safe property access
    safeGet,
    
    // Formatted display values
    formatCurrency: (value: any, currency: string = "₹", fallback: string = "₹0.00") => {
      return formatCurrency(value, currency, fallback);
    },
    
    formatPercentage: (value: any, includeSign: boolean = false, fallback: string = "0.00%") => {
      return formatPercentage(value, includeSign, fallback);
    },
    
    formatConfidence: (value: any, fallback: string = "0.0%") => {
      return formatConfidence(value, fallback);
    },
    
    formatNumber: (value: any, decimals: number = 2, fallback: string = "N/A") => {
      return formatNumber(value, decimals, fallback);
    },
    
    // Validation results for debugging
    validate: {
      numeric: validateNumeric,
      percentage: validatePercentage,
      confidence: validateConfidence,
      price: validatePrice,
      array: validateArray,
      object: validateObject,
    }
  }), []);
}

/**
 * Hook for validating analysis data specifically
 */
export function useAnalysisDataValidation() {
  const validation = useDataValidation();
  
  return useMemo(() => ({
    ...validation,
    
    // Analysis-specific validations
    validateSignals: (signals: any) => {
      if (!signals || typeof signals !== 'object') {
        return {
          consensus_score: 0,
          consensus_bias: 'neutral',
          confidence: 0,
          per_timeframe: []
        };
      }
      
      return {
        consensus_score: validation.safePercentage(signals.consensus_score),
        consensus_bias: signals.consensus_bias || 'neutral',
        confidence: validation.safeConfidence(signals.confidence),
        per_timeframe: validation.safeArray(signals.per_timeframe)
      };
    },
    
    validateIndicators: (indicators: any) => {
      if (!indicators || typeof indicators !== 'object') {
        return {
          moving_averages: {},
          rsi: {},
          macd: {},
          volume: {},
          adx: {}
        };
      }
      
      return {
        moving_averages: validation.safeObject(indicators.moving_averages),
        rsi: validation.safeObject(indicators.rsi),
        macd: validation.safeObject(indicators.macd),
        volume: validation.safeObject(indicators.volume),
        adx: validation.safeObject(indicators.adx)
      };
    },
    
    validateRiskMetrics: (riskMetrics: any) => {
      if (!riskMetrics || typeof riskMetrics !== 'object') {
        return {
          basic_metrics: {},
          var_metrics: {},
          drawdown_metrics: {},
          risk_adjusted_metrics: {},
          distribution_metrics: {},
          volatility_analysis: {},
          liquidity_analysis: {},
          correlation_analysis: {},
          risk_assessment: {}
        };
      }
      
      return {
        basic_metrics: validation.safeObject(riskMetrics.basic_metrics),
        var_metrics: validation.safeObject(riskMetrics.var_metrics),
        drawdown_metrics: validation.safeObject(riskMetrics.drawdown_metrics),
        risk_adjusted_metrics: validation.safeObject(riskMetrics.risk_adjusted_metrics),
        distribution_metrics: validation.safeObject(riskMetrics.distribution_metrics),
        volatility_analysis: validation.safeObject(riskMetrics.volatility_analysis),
        liquidity_analysis: validation.safeObject(riskMetrics.liquidity_analysis),
        correlation_analysis: validation.safeObject(riskMetrics.correlation_analysis),
        risk_assessment: validation.safeObject(riskMetrics.risk_assessment)
      };
    }
  }), [validation]);
}
