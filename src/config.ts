// Configuration for split backend architecture
export const DATA_SERVICE_URL = "http://localhost:8000";
export const ANALYSIS_SERVICE_URL = "http://localhost:8001";

// Legacy support - keep the old API_BASE_URL for backward compatibility
export const API_BASE_URL = DATA_SERVICE_URL;

// WebSocket URL for real-time data
export const WEBSOCKET_URL = "ws://localhost:8000/ws/stream";

// Service endpoints mapping
export const ENDPOINTS = {
  // Data Service endpoints (Port 8000)
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
    MARKET_OPTIMIZATION: `${DATA_SERVICE_URL}/market/optimization`,
  },
  
  // Analysis Service endpoints (Port 8001)
  ANALYSIS: {
    HEALTH: `${ANALYSIS_SERVICE_URL}/health`,
    ANALYZE: `${ANALYSIS_SERVICE_URL}/analyze`,
    ENHANCED_ANALYZE: `${ANALYSIS_SERVICE_URL}/analyze/enhanced`,
    STOCK_INDICATORS: `${ANALYSIS_SERVICE_URL}/stock`,
    PATTERNS: `${ANALYSIS_SERVICE_URL}/patterns`,
    CHARTS: `${ANALYSIS_SERVICE_URL}/charts`,
    SECTOR_LIST: `${ANALYSIS_SERVICE_URL}/sector/list`,
    SECTOR_BENCHMARK: `${ANALYSIS_SERVICE_URL}/sector/benchmark`,
    SECTOR_STOCKS: `${ANALYSIS_SERVICE_URL}/sector`,
    SECTOR_PERFORMANCE: `${ANALYSIS_SERVICE_URL}/sector`,
    SECTOR_COMPARE: `${ANALYSIS_SERVICE_URL}/sector/compare`,
    STOCK_SECTOR: `${ANALYSIS_SERVICE_URL}/stock`,
  }
}; 