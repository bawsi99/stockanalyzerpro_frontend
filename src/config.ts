// Environment-aware configuration for split backend architecture
// Uses separate environment variables for data and analysis services

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

// Separate service URLs - configurable via environment variables
export const DATA_SERVICE_URL = getEnvVar('DATA_SERVICE_URL', 
  IS_PRODUCTION ? 'https://your-data-websocket-service.onrender.com' : 'http://localhost:8001'
);

export const ANALYSIS_SERVICE_URL = getEnvVar('ANALYSIS_SERVICE_URL', 
  IS_PRODUCTION ? 'https://your-analysis-service.onrender.com' : 'http://localhost:8002'
);

// Legacy support - keep the old API_BASE_URL for backward compatibility
export const API_BASE_URL = DATA_SERVICE_URL;

// WebSocket URL - derived from data service URL
export const WEBSOCKET_URL = (() => {
  const customWebSocketUrl = getEnvVar('WEBSOCKET_URL', '');
  if (customWebSocketUrl) {
    return customWebSocketUrl; // Use custom if provided
  }
  
  // Auto-derive from data service URL
  if (DATA_SERVICE_URL.startsWith('https://')) {
    return DATA_SERVICE_URL.replace('https://', 'wss://') + '/ws/stream';
  } else {
    return DATA_SERVICE_URL.replace('http://', 'ws://') + '/ws/stream';
  }
})();

// Service endpoints mapping - separate URLs for each service
export const ENDPOINTS = {
  // Data Service endpoints - using DATA_SERVICE_URL
  DATA: {
    HEALTH: `${DATA_SERVICE_URL}/health`,
    STOCK_HISTORY: `${DATA_SERVICE_URL}/stock`,
    STOCK_INFO: `${DATA_SERVICE_URL}/stock`,
    MARKET_STATUS: `${DATA_SERVICE_URL}/market/status`,
    MAPPING_TOKEN_TO_SYMBOL: `${DATA_SERVICE_URL}/mapping/token-to-symbol`,
    MAPPING_SYMBOL_TO_TOKEN: `${DATA_SERVICE_URL}/mapping/symbol-to-token`,
    OPTIMIZED_DATA: `${DATA_SERVICE_URL}/data/optimized`,
    WEBSOCKET: WEBSOCKET_URL,
    WEBSOCKET_HEALTH: `${DATA_SERVICE_URL}/ws/health`,
    WEBSOCKET_TEST: `${DATA_SERVICE_URL}/ws/test`,
    WEBSOCKET_CONNECTIONS: `${DATA_SERVICE_URL}/ws/connections`,
    AUTH_TOKEN: `${DATA_SERVICE_URL}/auth/token`,
    AUTH_VERIFY: `${DATA_SERVICE_URL}/auth/verify`,
    MARKET_OPTIMIZATION_STATS: `${DATA_SERVICE_URL}/market/optimization/stats`,
    MARKET_OPTIMIZATION_CLEAR_CACHE: `${DATA_SERVICE_URL}/market/optimization/clear-cache`,
    MARKET_OPTIMIZATION_CLEAR_INTERVAL: `${DATA_SERVICE_URL}/market/optimization/clear-interval-cache`,
  },
  
  // Analysis Service endpoints - using ANALYSIS_SERVICE_URL
  ANALYSIS: {
    HEALTH: `${ANALYSIS_SERVICE_URL}/health`,
    ANALYZE: `${ANALYSIS_SERVICE_URL}/analyze`,
    ANALYZE_ASYNC: `${ANALYSIS_SERVICE_URL}/analyze/async`,
    ENHANCED_ANALYZE: `${ANALYSIS_SERVICE_URL}/analyze/enhanced`,
    ENHANCED_MTF_ANALYZE: `${ANALYSIS_SERVICE_URL}/analyze/enhanced-mtf`,
    STOCK_INDICATORS: `${ANALYSIS_SERVICE_URL}/stock`,
    PATTERNS: `${ANALYSIS_SERVICE_URL}/patterns`,
    CHARTS: `${ANALYSIS_SERVICE_URL}/charts`,
    SECTOR_LIST: `${ANALYSIS_SERVICE_URL}/sector/list`,
    SECTOR_BENCHMARK: `${ANALYSIS_SERVICE_URL}/sector/benchmark`,
    SECTOR_BENCHMARK_ASYNC: `${ANALYSIS_SERVICE_URL}/sector/benchmark/async`,
    SECTOR_STOCKS: `${ANALYSIS_SERVICE_URL}/sector`,
    SECTOR_PERFORMANCE: `${ANALYSIS_SERVICE_URL}/sector`,
    SECTOR_COMPARE: `${ANALYSIS_SERVICE_URL}/sector/compare`,
    STOCK_SECTOR: `${ANALYSIS_SERVICE_URL}/stock`,
    // User Analysis endpoints
    USER_ANALYSES: `${ANALYSIS_SERVICE_URL}/analyses/user`,
    ANALYSIS_BY_ID: `${ANALYSIS_SERVICE_URL}/analyses`,
    ANALYSES_BY_SIGNAL: `${ANALYSIS_SERVICE_URL}/analyses/signal`,
    ANALYSES_BY_SECTOR: `${ANALYSIS_SERVICE_URL}/analyses/sector`,
    ANALYSES_BY_CONFIDENCE: `${ANALYSIS_SERVICE_URL}/analyses/confidence`,
    USER_ANALYSIS_SUMMARY: `${ANALYSIS_SERVICE_URL}/analyses/summary/user`,
    // ML endpoints
    ML_TRAIN: `${ANALYSIS_SERVICE_URL}/ml/train`,
    ML_MODEL: `${ANALYSIS_SERVICE_URL}/ml/model`,
    ML_PREDICT: `${ANALYSIS_SERVICE_URL}/ml/predict`,
    // Chart and storage management
    CHARTS_STORAGE_STATS: `${ANALYSIS_SERVICE_URL}/charts/storage/stats`,
    CHARTS_CLEANUP: `${ANALYSIS_SERVICE_URL}/charts/cleanup`,
    CHARTS_CLEANUP_SPECIFIC: `${ANALYSIS_SERVICE_URL}/charts`,
    CHARTS_CLEANUP_ALL: `${ANALYSIS_SERVICE_URL}/charts/all`,
    // Redis management
    REDIS_IMAGES_STATS: `${ANALYSIS_SERVICE_URL}/redis/images/stats`,
    REDIS_IMAGES_CLEANUP: `${ANALYSIS_SERVICE_URL}/redis/images/cleanup`,
    REDIS_IMAGES_BY_SYMBOL: `${ANALYSIS_SERVICE_URL}/redis/images`,
    REDIS_IMAGES_CLEAR_ALL: `${ANALYSIS_SERVICE_URL}/redis/images`,
    // Cache management
    REDIS_CACHE_STATS: `${ANALYSIS_SERVICE_URL}/redis/cache/stats`,
    REDIS_CACHE_CLEAR: `${ANALYSIS_SERVICE_URL}/redis/cache/clear`,
    REDIS_CACHE_STOCK: `${ANALYSIS_SERVICE_URL}/redis/cache/stock`,
    // Storage info
    STORAGE_INFO: `${ANALYSIS_SERVICE_URL}/storage/info`,
    STORAGE_RECOMMENDATIONS: `${ANALYSIS_SERVICE_URL}/storage/recommendations`,
  }
};

// Configuration object for easy access
export const CONFIG = {
  DATA_SERVICE_URL,
  ANALYSIS_SERVICE_URL,
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
    DATA_SERVICE_URL,
    ANALYSIS_SERVICE_URL,
    WEBSOCKET_URL: `Auto-derived: ${WEBSOCKET_URL}`,
    NODE_ENV,
    'DATA_SERVICE_ENDPOINTS': ENDPOINTS.DATA,
    'ANALYSIS_SERVICE_ENDPOINTS': ENDPOINTS.ANALYSIS
  });
} 