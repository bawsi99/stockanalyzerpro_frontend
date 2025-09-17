// Updated config.ts for unified backend architecture
// Replace your current config.ts with this version

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

// UNIFIED SERVICE URL - Single backend for all services
export const UNIFIED_SERVICE_URL = getEnvVar('VITE_UNIFIED_SERVICE_URL', 
  IS_PRODUCTION ? 'https://your-render-app.onrender.com' : 'http://localhost:8000'
);

// Legacy service URLs - now all point to unified backend with different paths
export const DATA_SERVICE_URL = `${UNIFIED_SERVICE_URL}/data`;
export const ANALYSIS_SERVICE_URL = getEnvVar('VITE_ANALYSIS_SERVICE_URL', 
  IS_PRODUCTION ? 'https://stockanalyzer-pro-1.onrender.com' : 'http://localhost:8002'
);
export const DATABASE_SERVICE_URL = `${UNIFIED_SERVICE_URL}/database`;

// Legacy support - keep the old API_BASE_URL for backward compatibility
export const API_BASE_URL = DATA_SERVICE_URL;

// Service status tracking
export const SERVICE_STATUS = {
  DATA_SERVICE: 'unknown',
  ANALYSIS_SERVICE: 'unknown'
};

// WebSocket URL - derived from unified service URL
export const WEBSOCKET_URL = (() => {
  const customWebSocketUrl = getEnvVar('WEBSOCKET_URL', '');
  if (customWebSocketUrl) {
    return customWebSocketUrl; // Use custom if provided
  }
  
  // Auto-derive from unified service URL
  if (UNIFIED_SERVICE_URL.startsWith('https://')) {
    return UNIFIED_SERVICE_URL.replace('https://', 'wss://') + '/data/ws/stream';
  } else {
    return UNIFIED_SERVICE_URL.replace('http://', 'ws://') + '/data/ws/stream';
  }
})();

// Service endpoints mapping - updated for unified backend
export const ENDPOINTS = {
  // Data Service endpoints - now mounted at /data
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
  
  // Analysis Service endpoints - still separate for now
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
    REDIS_STOCK_CACHE_CLEAR: `${ANALYSIS_SERVICE_URL}/redis/cache/stock`,
    REDIS_STOCK_CACHE_GET: `${ANALYSIS_SERVICE_URL}/redis/cache/stock`,
    // Storage info
    STORAGE_INFO: `${ANALYSIS_SERVICE_URL}/storage/info`,
    STORAGE_RECOMMENDATIONS: `${ANALYSIS_SERVICE_URL}/storage/recommendations`,
  },
};

// Database Service endpoints - now mounted at /database
export const DATABASE_ENDPOINTS = {
  HEALTH: `${DATABASE_SERVICE_URL}/health`,
  STORE_ANALYSIS: `${DATABASE_SERVICE_URL}/analyses/store`,
  USER_ANALYSES: `${DATABASE_SERVICE_URL}/analyses/user`,
  ANALYSIS_BY_ID: `${DATABASE_SERVICE_URL}/analyses`,
  ANALYSES_BY_SIGNAL: `${DATABASE_SERVICE_URL}/analyses/signal`,
  ANALYSES_BY_SECTOR: `${DATABASE_SERVICE_URL}/analyses/sector`,
  ANALYSES_BY_CONFIDENCE: `${DATABASE_SERVICE_URL}/analyses/confidence`,
  USER_ANALYSIS_SUMMARY: `${DATABASE_SERVICE_URL}/analyses/summary/user`,
};

// Configuration object for easy access
export const CONFIG = {
  UNIFIED_SERVICE_URL,
  DATA_SERVICE_URL,
  ANALYSIS_SERVICE_URL,
  DATABASE_SERVICE_URL,
  API_BASE_URL,
  WEBSOCKET_URL,
  IS_PRODUCTION,
  IS_DEVELOPMENT,
  NODE_ENV,
  ENDPOINTS
};

// Log configuration in development
if (IS_DEVELOPMENT) {
  console.log('🔧 Frontend Configuration (Unified Backend):', {
    UNIFIED_SERVICE_URL,
    DATA_SERVICE_URL,
    ANALYSIS_SERVICE_URL,
    DATABASE_SERVICE_URL,
    WEBSOCKET_URL: `Auto-derived: ${WEBSOCKET_URL}`,
    NODE_ENV,
    'DATA_SERVICE_ENDPOINTS': ENDPOINTS.DATA,
    'ANALYSIS_SERVICE_ENDPOINTS': ENDPOINTS.ANALYSIS,
    'DATABASE_SERVICE_ENDPOINTS': DATABASE_ENDPOINTS
  });
}

// Always log service URLs in production for debugging
if (IS_PRODUCTION) {
  console.log('🚀 Production Service URLs (Unified Backend):', {
    UNIFIED_SERVICE_URL,
    DATA_SERVICE_URL,
    ANALYSIS_SERVICE_URL,
    DATABASE_SERVICE_URL,
    WEBSOCKET_URL
  });
}

// Validate configuration
export const validateConfig = () => {
  const issues = [];
  
  if (!UNIFIED_SERVICE_URL || UNIFIED_SERVICE_URL.includes('your-render-app')) {
    issues.push('UNIFIED_SERVICE_URL not properly configured');
  }
  
  if (!ANALYSIS_SERVICE_URL || ANALYSIS_SERVICE_URL.includes('your-analysis-service')) {
    issues.push('ANALYSIS_SERVICE_URL not properly configured');
  }
  
  if (issues.length > 0) {
    console.error('❌ Configuration Issues:', issues);
    return false;
  }
  
  console.log('✅ Configuration validated successfully');
  return true;
};