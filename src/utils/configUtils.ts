import { CONFIG } from '../config';

/**
 * Configuration utilities for environment-aware URL management
 */

export interface EnvironmentConfig {
  isProduction: boolean;
  isDevelopment: boolean;
  isStaging: boolean;
  dataServiceUrl: string;
  analysisServiceUrl: string;
  websocketUrl: string;
  apiBaseUrl: string;
}

/**
 * Get current environment configuration
 */
export const getEnvironmentConfig = (): EnvironmentConfig => {
  return {
    isProduction: CONFIG.IS_PRODUCTION,
    isDevelopment: CONFIG.IS_DEVELOPMENT,
    isStaging: CONFIG.NODE_ENV === 'staging',
    dataServiceUrl: CONFIG.DATA_SERVICE_URL,
    analysisServiceUrl: CONFIG.ANALYSIS_SERVICE_URL,
    websocketUrl: CONFIG.WEBSOCKET_URL,
    apiBaseUrl: CONFIG.API_BASE_URL,
  };
};

/**
 * Build WebSocket URL with authentication token
 */
export const buildWebSocketUrl = (token?: string): string => {
  if (token) {
    const separator = CONFIG.WEBSOCKET_URL.includes('?') ? '&' : '?';
    return `${CONFIG.WEBSOCKET_URL}${separator}token=${encodeURIComponent(token)}`;
  }
  return CONFIG.WEBSOCKET_URL;
};

/**
 * Validate configuration for common issues
 */
export const validateConfiguration = (): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // Check if URLs are properly configured
  if (!CONFIG.DATA_SERVICE_URL) {
    errors.push('DATA_SERVICE_URL is not configured');
  }
  
  if (!CONFIG.ANALYSIS_SERVICE_URL) {
    errors.push('ANALYSIS_SERVICE_URL is not configured');
  }
  
  if (!CONFIG.WEBSOCKET_URL) {
    errors.push('WEBSOCKET_URL is not configured');
  }
  
  // Check for localhost in production
  if (CONFIG.IS_PRODUCTION) {
    if (CONFIG.DATA_SERVICE_URL.includes('localhost')) {
      errors.push('DATA_SERVICE_URL should not use localhost in production');
    }
    if (CONFIG.ANALYSIS_SERVICE_URL.includes('localhost')) {
      errors.push('ANALYSIS_SERVICE_URL should not use localhost in production');
    }
    if (CONFIG.WEBSOCKET_URL.includes('localhost')) {
      errors.push('WEBSOCKET_URL should not use localhost in production');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Get configuration summary for debugging
 */
export const getConfigurationSummary = (): Record<string, any> => {
  const validation = validateConfiguration();
  
  return {
    environment: {
      mode: CONFIG.NODE_ENV,
      isProduction: CONFIG.IS_PRODUCTION,
      isDevelopment: CONFIG.IS_DEVELOPMENT,
    },
    urls: {
      dataService: CONFIG.DATA_SERVICE_URL,
      analysisService: CONFIG.ANALYSIS_SERVICE_URL,
      websocket: CONFIG.WEBSOCKET_URL,
      apiBase: CONFIG.API_BASE_URL,
    },
    validation: {
      isValid: validation.isValid,
      errors: validation.errors,
    },
  };
};

/**
 * Log configuration in development mode
 */
export const logConfiguration = (): void => {
  if (CONFIG.IS_DEVELOPMENT) {
    const summary = getConfigurationSummary();
    console.group('🔧 Frontend Configuration');
    console.log('Environment:', summary.environment);
    console.log('URLs:', summary.urls);
    if (!summary.validation.isValid) {
      console.warn('Configuration Issues:', summary.validation.errors);
    }
    console.groupEnd();
  }
}; 