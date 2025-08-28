// Environment-aware configuration for split backend architecture
// Uses environment variables with fallbacks for development

// Environment detection - must come first
export const IS_PRODUCTION = import.meta.env.PROD;
export const IS_DEVELOPMENT = import.meta.env.DEV;
export const NODE_ENV = import.meta.env.MODE;

// Frontend port detection
export const FRONTEND_PORT = window.location.port || (IS_DEVELOPMENT ? '8080' : '80');
export const FRONTEND_HOST = window.location.hostname || 'localhost';
export const FRONTEND_URL = `${window.location.protocol}//${FRONTEND_HOST}:${FRONTEND_PORT}`;

// Get environment variables with fallbacks
const getEnvVar = (key: string, fallback: string): string => {
  // Check for Vite environment variables (prefixed with VITE_)
  const viteKey = `VITE_${key}`;
  if (import.meta.env[viteKey]) {
    return import.meta.env[viteKey] as string;
  }
  
  // Check for regular environment variables
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key] as string;
  }
  
  return fallback;
};

// Base URL - configurable via environment variables
export const BASE_SERVICE_URL = getEnvVar('BASE_SERVICE_URL', 
  IS_PRODUCTION ? 'https://stockanalyzer-pro.onrender.com' : 'http://localhost:8000'
);

// Legacy support - keep the old API_BASE_URL for backward compatibility
export const API_BASE_URL = BASE_SERVICE_URL;

// WebSocket URL - automatically derived from base URL
// Convert http:// to ws:// and https:// to wss://
export const WEBSOCKET_URL = (() => {
  const customWebSocketUrl = getEnvVar('WEBSOCKET_URL', '');
  if (customWebSocketUrl) {
    return customWebSocketUrl; // Use custom if provided
  }
  
  // Auto-derive from base URL
  if (BASE_SERVICE_URL.startsWith('https://')) {
    return BASE_SERVICE_URL.replace('https://', 'wss://') + '/ws/stream';
  } else {
    return BASE_SERVICE_URL.replace('http://', 'ws://') + '/ws/stream';
  }
})();

// Service endpoints mapping - use consolidated service mount points
export const ENDPOINTS = {
  // Data Service endpoints - Direct paths for both local and production
  DATA: {
    HEALTH: `${BASE_SERVICE_URL}/data/health`,
    STOCK_HISTORY: `${BASE_SERVICE_URL}/data/stock`,
    STOCK_INFO: `${BASE_SERVICE_URL}/data/stock`,
    MARKET_STATUS: `${BASE_SERVICE_URL}/data/market/status`,
    MAPPING_TOKEN_TO_SYMBOL: `${BASE_SERVICE_URL}/data/mapping/token-to-symbol`,
    MAPPING_SYMBOL_TO_TOKEN: `${BASE_SERVICE_URL}/data/mapping/symbol-to-token`,
    OPTIMIZED_DATA: `${BASE_SERVICE_URL}/data/optimized`,
    WEBSOCKET: WEBSOCKET_URL,
    WEBSOCKET_HEALTH: `${BASE_SERVICE_URL}/data/ws/health`,
    WEBSOCKET_TEST: `${BASE_SERVICE_URL}/data/ws/test`,
    WEBSOCKET_CONNECTIONS: `${BASE_SERVICE_URL}/data/ws/connections`,
    AUTH_TOKEN: `${BASE_SERVICE_URL}/data/auth/token`,
    AUTH_VERIFY: `${BASE_SERVICE_URL}/data/auth/verify`,
    MARKET_OPTIMIZATION: `${BASE_SERVICE_URL}/data/market/optimization`,
  },
  
  // Analysis Service endpoints - Direct paths for both local and production
  ANALYSIS: {
    HEALTH: `${BASE_SERVICE_URL}/analysis/health`,
    ANALYZE: `${BASE_SERVICE_URL}/analysis/analyze`,
    ANALYZE_ASYNC: `${BASE_SERVICE_URL}/analysis/analyze/async`,
    ENHANCED_ANALYZE: `${BASE_SERVICE_URL}/analysis/analyze/enhanced`,
    ENHANCED_MTF_ANALYZE: `${BASE_SERVICE_URL}/analysis/analyze/enhanced-mtf`,
    STOCK_INDICATORS: `${BASE_SERVICE_URL}/analysis/stock`,
    PATTERNS: `${BASE_SERVICE_URL}/analysis/patterns`,
    CHARTS: `${BASE_SERVICE_URL}/analysis/charts`,
    SECTOR_LIST: `${BASE_SERVICE_URL}/analysis/sector/list`,
    SECTOR_BENCHMARK: `${BASE_SERVICE_URL}/analysis/sector/benchmark`,
    SECTOR_BENCHMARK_ASYNC: `${BASE_SERVICE_URL}/analysis/sector/benchmark/async`,
    SECTOR_STOCKS: `${BASE_SERVICE_URL}/analysis/sector`,
    SECTOR_PERFORMANCE: `${BASE_SERVICE_URL}/analysis/sector`,
    SECTOR_COMPARE: `${BASE_SERVICE_URL}/analysis/sector/compare`,
    STOCK_SECTOR: `${BASE_SERVICE_URL}/analysis/stock`,
    // User Analysis endpoints
    USER_ANALYSES: `${BASE_SERVICE_URL}/analysis/analyses/user`,
    ANALYSIS_BY_ID: `${BASE_SERVICE_URL}/analysis/analyses`,
    ANALYSES_BY_SIGNAL: `${BASE_SERVICE_URL}/analysis/analyses/signal`,
    ANALYSES_BY_SECTOR: `${BASE_SERVICE_URL}/analysis/analyses/sector`,
    ANALYSES_BY_CONFIDENCE: `${BASE_SERVICE_URL}/analysis/analyses/confidence`,
    USER_ANALYSIS_SUMMARY: `${BASE_SERVICE_URL}/analysis/analyses/summary/user`,
  }
};

// Configuration object for easy access
export const CONFIG = {
  BASE_SERVICE_URL,
  API_BASE_URL,
  WEBSOCKET_URL,
  IS_PRODUCTION,
  IS_DEVELOPMENT,
  NODE_ENV,
  ENDPOINTS
};

// Log configuration in development
if (IS_DEVELOPMENT) {
  console.log('🔧 Frontend Configuration:', {
    BASE_SERVICE_URL,
    WEBSOCKET_URL: `Auto-derived: ${WEBSOCKET_URL}`,
    NODE_ENV,
    'DATA_SERVICE_ENDPOINTS': ENDPOINTS.DATA,
    'ANALYSIS_SERVICE_ENDPOINTS': ENDPOINTS.ANALYSIS
  });
} 