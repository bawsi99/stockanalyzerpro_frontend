import { 
  AnalysisRequest, 
  AnalysisResponse, 
  ErrorResponse,
  SectorListResponse,
  SectorStocksResponse,
  SectorPerformanceResponse,
  SectorComparisonResponse,
  StockSectorResponse,
  isAnalysisResponse,
  isErrorResponse
} from '@/types/analysis';
import { ENDPOINTS } from '../config';

// Types for chart data
export interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface IndicatorData {
  rsi?: number[];
  macd?: {
    macd: number[];
    signal: number[];
    histogram: number[];
  };
  sma?: {
    sma_20: number[];
    sma_50: number[];
    sma_200: number[];
  };
  ema?: {
    ema_12: number[];
    ema_26: number[];
    ema_50: number[];
  };
  bollinger_bands?: {
    upper: number[];
    middle: number[];
    lower: number[];
  };
}

export interface HistoricalDataResponse {
  success: boolean;
  symbol: string;
  exchange: string;
  interval: string;
  token: string;
  candles: CandleData[];
  count: number;
  first_candle: CandleData | null;
  last_candle: CandleData | null;
  timestamp: string;
}

export interface IndicatorsResponse {
  success: boolean;
  symbol: string;
  interval: string;
  indicators: IndicatorData;
  timestamps: number[];
  count: number;
  timestamp: string;
}

export interface PatternsResponse {
  success: boolean;
  symbol: string;
  interval: string;
  patterns: any;
  timestamps: number[];
  count: number;
  timestamp: string;
}

export interface ChartsResponse {
  success: boolean;
  symbol: string;
  interval: string;
  charts: any;
  chart_count: number;
  timestamp: string;
}

class ApiService {
  // ===== ANALYSIS SERVICE ENDPOINTS (Port 8001) =====

  // POST /analyze - Comprehensive stock analysis
  async analyzeStock(request: AnalysisRequest): Promise<AnalysisResponse> {
    const resp = await fetch(ENDPOINTS.ANALYSIS.ANALYZE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    });
    if (!resp.ok) throw new Error('Failed to analyze stock');
    return await resp.json();
  }

  // POST /analyze/enhanced - Enhanced analysis with code execution
  async enhancedAnalyzeStock(request: AnalysisRequest & { enable_code_execution?: boolean }): Promise<AnalysisResponse> {
    const resp = await fetch(ENDPOINTS.ANALYSIS.ENHANCED_ANALYZE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    });
    if (!resp.ok) throw new Error('Failed to perform enhanced analysis');
    return await resp.json();
  }

  // GET /stock/{symbol}/indicators - Technical indicators
  async getIndicators(
    symbol: string, 
    interval: string = '1day', 
    exchange: string = 'NSE',
    indicators: string = 'rsi,macd,sma,ema,bollinger'
  ): Promise<IndicatorsResponse> {
    const params = new URLSearchParams({
      interval,
      exchange,
      indicators
    });
    
    const resp = await fetch(`${ENDPOINTS.ANALYSIS.STOCK_INDICATORS}/${symbol}/indicators?${params}`);
    if (!resp.ok) {
      const errorData = await resp.json().catch(() => ({}));
      throw new Error(errorData.detail || `Failed to fetch indicators for ${symbol}`);
    }
    return await resp.json();
  }

  // GET /patterns/{symbol} - Pattern recognition
  async getPatterns(
    symbol: string,
    interval: string = '1day',
    exchange: string = 'NSE',
    pattern_types: string = 'all'
  ): Promise<PatternsResponse> {
    const params = new URLSearchParams({
      interval,
      exchange,
      pattern_types
    });
    
    const resp = await fetch(`${ENDPOINTS.ANALYSIS.PATTERNS}/${symbol}?${params}`);
    if (!resp.ok) {
      const errorData = await resp.json().catch(() => ({}));
      throw new Error(errorData.detail || `Failed to fetch patterns for ${symbol}`);
    }
    return await resp.json();
  }

  // GET /charts/{symbol} - Chart generation
  async getCharts(
    symbol: string,
    interval: string = '1day',
    exchange: string = 'NSE',
    chart_types: string = 'all'
  ): Promise<ChartsResponse> {
    const params = new URLSearchParams({
      interval,
      exchange,
      chart_types
    });
    
    const resp = await fetch(`${ENDPOINTS.ANALYSIS.CHARTS}/${symbol}?${params}`);
    if (!resp.ok) {
      const errorData = await resp.json().catch(() => ({}));
      throw new Error(errorData.detail || `Failed to fetch charts for ${symbol}`);
    }
    return await resp.json();
  }

  // GET /sector/list - Sector information
  async getSectors(): Promise<any> {
    const resp = await fetch(ENDPOINTS.ANALYSIS.SECTOR_LIST);
    if (!resp.ok) throw new Error('Failed to fetch sectors');
    return await resp.json();
  }

  // POST /sector/benchmark - Sector benchmarking
  async getSectorBenchmark(request: AnalysisRequest): Promise<any> {
    const resp = await fetch(ENDPOINTS.ANALYSIS.SECTOR_BENCHMARK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    });
    if (!resp.ok) throw new Error('Failed to fetch sector benchmark');
    return await resp.json();
  }

  // GET /sector/{sector_name}/stocks - Sector stocks
  async getSectorStocks(sectorName: string): Promise<any> {
    const resp = await fetch(`${ENDPOINTS.ANALYSIS.SECTOR_STOCKS}/${sectorName}/stocks`);
    if (!resp.ok) throw new Error('Failed to fetch sector stocks');
    return await resp.json();
  }

  // GET /sector/{sector_name}/performance - Sector performance
  async getSectorPerformance(sectorName: string, period: number = 365): Promise<any> {
    const resp = await fetch(`${ENDPOINTS.ANALYSIS.SECTOR_PERFORMANCE}/${sectorName}/performance?period=${period}`);
    if (!resp.ok) throw new Error('Failed to fetch sector performance');
    return await resp.json();
  }

  // POST /sector/compare - Sector comparison
  async compareSectors(sectors: string[], period: number = 365): Promise<any> {
    const resp = await fetch(ENDPOINTS.ANALYSIS.SECTOR_COMPARE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sectors, period })
    });
    if (!resp.ok) throw new Error('Failed to compare sectors');
    return await resp.json();
  }

  // GET /stock/{symbol}/sector - Stock sector information
  async getStockSector(symbol: string): Promise<any> {
    const resp = await fetch(`${ENDPOINTS.ANALYSIS.STOCK_SECTOR}/${symbol}/sector`);
    if (!resp.ok) throw new Error('Failed to fetch stock sector');
    return await resp.json();
  }

  // ===== DATA SERVICE ENDPOINTS (Port 8000) =====

  // GET /stock/{symbol}/history - Historical OHLCV data
  async getHistoricalData(
    symbol: string, 
    interval: string = '1day', 
    exchange: string = 'NSE', 
    limit: number = 1000
  ): Promise<HistoricalDataResponse> {
    const params = new URLSearchParams({
      interval,
      exchange,
      limit: limit.toString()
    });
    
    const resp = await fetch(`${ENDPOINTS.DATA.STOCK_HISTORY}/${symbol}/history?${params}`);
    if (!resp.ok) {
      const errorData = await resp.json().catch(() => ({}));
      throw new Error(errorData.detail || `Failed to fetch historical data for ${symbol}`);
    }
    return await resp.json();
  }

  // GET /stock/{symbol}/info - Stock information
  async getStockInfo(symbol: string, exchange: string = 'NSE'): Promise<any> {
    const resp = await fetch(`${ENDPOINTS.DATA.STOCK_INFO}/${symbol}/info?exchange=${exchange}`);
    if (!resp.ok) throw new Error('Failed to fetch stock info');
    return await resp.json();
  }

  // GET /market/status - Market status
  async getMarketStatus(): Promise<any> {
    const resp = await fetch(ENDPOINTS.DATA.MARKET_STATUS);
    if (!resp.ok) throw new Error('Failed to fetch market status');
    return await resp.json();
  }

  // GET /mapping/token-to-symbol - Token to symbol mapping
  async getTokenToSymbol(token: number, exchange: string = 'NSE'): Promise<any> {
    const resp = await fetch(`${ENDPOINTS.DATA.MAPPING_TOKEN_TO_SYMBOL}?token=${token}&exchange=${exchange}`);
    if (!resp.ok) throw new Error('Failed to fetch token to symbol mapping');
    return await resp.json();
  }

  // GET /mapping/symbol-to-token - Symbol to token mapping
  async getSymbolToToken(symbol: string, exchange: string = 'NSE'): Promise<any> {
    const resp = await fetch(`${ENDPOINTS.DATA.MAPPING_SYMBOL_TO_TOKEN}?symbol=${symbol}&exchange=${exchange}`);
    if (!resp.ok) throw new Error('Failed to fetch symbol to token mapping');
    return await resp.json();
  }

  // POST /data/optimized - Optimized data fetching
  async getOptimizedData(request: {
    symbol: string;
    exchange?: string;
    interval?: string;
    period?: number;
    force_live?: boolean;
  }): Promise<any> {
    const resp = await fetch(ENDPOINTS.DATA.OPTIMIZED_DATA, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    });
    if (!resp.ok) throw new Error('Failed to fetch optimized data');
    return await resp.json();
  }

  // ===== AUTHENTICATION ENDPOINTS (Port 8000) =====

  // POST /auth/token - Get JWT token
  async getJwtToken(userId: string): Promise<any> {
    const resp = await fetch(`${ENDPOINTS.DATA.AUTH_TOKEN}?user_id=${encodeURIComponent(userId)}`, { 
      method: 'POST' 
    });
    if (!resp.ok) throw new Error('Failed to get JWT token');
    return await resp.json();
  }

  // GET /auth/verify - Verify JWT token
  async verifyToken(token: string): Promise<any> {
    const resp = await fetch(`${ENDPOINTS.DATA.AUTH_VERIFY}?token=${encodeURIComponent(token)}`);
    if (!resp.ok) throw new Error('Failed to verify token');
    return await resp.json();
  }

  // ===== WEBSOCKET ENDPOINTS (Port 8000) =====

  // GET /ws/health - WebSocket health
  async getWebSocketHealth(): Promise<any> {
    const resp = await fetch(ENDPOINTS.DATA.WEBSOCKET_HEALTH);
    if (!resp.ok) throw new Error('Failed to fetch WebSocket health');
    return await resp.json();
  }

  // GET /ws/test - WebSocket test
  async getWebSocketTest(): Promise<any> {
    const resp = await fetch(ENDPOINTS.DATA.WEBSOCKET_TEST);
    if (!resp.ok) throw new Error('Failed to fetch WebSocket test');
    return await resp.json();
  }

  // GET /ws/connections - WebSocket connections
  async getWebSocketConnections(): Promise<any> {
    const resp = await fetch(ENDPOINTS.DATA.WEBSOCKET_CONNECTIONS);
    if (!resp.ok) throw new Error('Failed to fetch WebSocket connections');
    return await resp.json();
  }

  // ===== HEALTH CHECKS =====

  // GET /health - Data service health
  async getDataServiceHealth(): Promise<any> {
    const resp = await fetch(ENDPOINTS.DATA.HEALTH);
    if (!resp.ok) throw new Error('Data service health check failed');
    return await resp.json();
  }

  // GET /health - Analysis service health
  async getAnalysisServiceHealth(): Promise<any> {
    const resp = await fetch(ENDPOINTS.ANALYSIS.HEALTH);
    if (!resp.ok) throw new Error('Analysis service health check failed');
    return await resp.json();
  }

  // ===== LEGACY SUPPORT =====

  // Legacy method for backward compatibility
  async getRealtimeAnalysis(token: string, timeframe: string): Promise<any> {
    console.warn('getRealtimeAnalysis is deprecated. Use getHistoricalData instead.');
    return this.getHistoricalData('RELIANCE', timeframe);
  }

  async getAnalysisHistory(token: string, timeframe: string, limit: number = 10): Promise<any> {
    console.warn('getAnalysisHistory is deprecated. Use getHistoricalData instead.');
    return this.getHistoricalData('RELIANCE', timeframe);
  }
}

// Export a singleton instance
export const apiService = new ApiService();

// Export individual functions for convenience
export const {
  // Analysis Service
  analyzeStock,
  enhancedAnalyzeStock,
  getIndicators,
  getPatterns,
  getCharts,
  getSectors,
  getSectorBenchmark,
  getSectorStocks,
  getSectorPerformance,
  compareSectors,
  getStockSector,
  
  // Data Service
  getHistoricalData,
  getStockInfo,
  getMarketStatus,
  getTokenToSymbol,
  getSymbolToToken,
  getOptimizedData,
  
  // Authentication
  getJwtToken,
  verifyToken,
  
  // WebSocket
  getWebSocketHealth,
  getWebSocketTest,
  getWebSocketConnections,
  
  // Health Checks
  getDataServiceHealth,
  getAnalysisServiceHealth,
  
  // Legacy
  getRealtimeAnalysis,
  getAnalysisHistory,
} = apiService; 