import { authService } from './authService';
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

// Types for analysis responses
export interface IndicatorsResponse {
  success: boolean;
  symbol: string;
  interval: string;
  indicators: {
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
  };
  timestamps: number[];
  count: number;
  timestamp: string;
}

export interface PatternsResponse {
  success: boolean;
  symbol: string;
  interval: string;
  patterns: {
    candlestick_patterns?: any[];
    double_tops?: any[];
    double_bottoms?: any[];
    head_shoulders?: any[];
    triangles?: any[];
  };
  timestamps: number[];
  count: number;
  timestamp: string;
}

export interface ChartsResponse {
  success: boolean;
  symbol: string;
  interval: string;
  charts: {
    [key: string]: {
      data?: string; // base64 encoded image
      filename?: string;
      type?: string;
      error?: string;
    };
  };
  chart_count: number;
  timestamp: string;
}

class AnalysisService {
  constructor() {
    console.log('AnalysisService initialized with split backend architecture');
  }

  // ===== STOCK ANALYSIS =====

  // POST /analyze - Comprehensive stock analysis
  async analyzeStock(request: AnalysisRequest): Promise<AnalysisResponse> {
    try {
      const token = await authService.ensureAuthenticated();
      if (!token) {
        throw new Error('Authentication token not available');
      }

      const response = await fetch(ENDPOINTS.ANALYSIS.ANALYZE, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed. Please login again.');
        } else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to analyze stock');
      }

      return data;
    } catch (error) {
      console.error('Error analyzing stock:', error);
      throw error;
    }
  }

  // POST /analyze/enhanced - Enhanced analysis with code execution
  async enhancedAnalyzeStock(request: AnalysisRequest & { enable_code_execution?: boolean }): Promise<AnalysisResponse> {
    try {
      const token = await authService.ensureAuthenticated();
      if (!token) {
        throw new Error('Authentication token not available');
      }

      const response = await fetch(ENDPOINTS.ANALYSIS.ENHANCED_ANALYZE, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed. Please login again.');
        } else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to perform enhanced analysis');
      }

      return data;
    } catch (error) {
      console.error('Error performing enhanced analysis:', error);
      throw error;
    }
  }

  // GET /stock/{symbol}/indicators - Technical indicators
  async getIndicators(
    symbol: string, 
    interval: string = '1day', 
    exchange: string = 'NSE',
    indicators: string = 'rsi,macd,sma,ema,bollinger'
  ): Promise<IndicatorsResponse> {
    try {
      const token = await authService.ensureAuthenticated();
      if (!token) {
        throw new Error('Authentication token not available');
      }

      const params = new URLSearchParams({
        interval,
        exchange,
        indicators
      });
      
      const response = await fetch(`${ENDPOINTS.ANALYSIS.STOCK_INDICATORS}/${symbol}/indicators?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed. Please login again.');
        } else if (response.status === 404) {
          throw new Error(`Indicators not found for ${symbol}`);
        } else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || `Failed to fetch indicators for ${symbol}`);
      }

      return data;
    } catch (error) {
      console.error('Error fetching indicators:', error);
      throw error;
    }
  }

  // GET /patterns/{symbol} - Pattern recognition
  async getPatterns(
    symbol: string,
    interval: string = '1day',
    exchange: string = 'NSE',
    pattern_types: string = 'all'
  ): Promise<PatternsResponse> {
    try {
      const token = await authService.ensureAuthenticated();
      if (!token) {
        throw new Error('Authentication token not available');
      }

      const params = new URLSearchParams({
        interval,
        exchange,
        pattern_types
      });
      
      const response = await fetch(`${ENDPOINTS.ANALYSIS.PATTERNS}/${symbol}?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed. Please login again.');
        } else if (response.status === 404) {
          throw new Error(`Patterns not found for ${symbol}`);
        } else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || `Failed to fetch patterns for ${symbol}`);
      }

      return data;
    } catch (error) {
      console.error('Error fetching patterns:', error);
      throw error;
    }
  }

  // GET /charts/{symbol} - Chart generation
  async getCharts(
    symbol: string,
    interval: string = '1day',
    exchange: string = 'NSE',
    chart_types: string = 'all'
  ): Promise<ChartsResponse> {
    try {
      const token = await authService.ensureAuthenticated();
      if (!token) {
        throw new Error('Authentication token not available');
      }

      const params = new URLSearchParams({
        interval,
        exchange,
        chart_types
      });
      
      const response = await fetch(`${ENDPOINTS.ANALYSIS.CHARTS}/${symbol}?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed. Please login again.');
        } else if (response.status === 404) {
          throw new Error(`Charts not found for ${symbol}`);
        } else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || `Failed to fetch charts for ${symbol}`);
      }

      return data;
    } catch (error) {
      console.error('Error fetching charts:', error);
      throw error;
    }
  }

  // ===== SECTOR ANALYSIS =====

  // GET /sector/list - Sector information
  async getSectors(): Promise<SectorListResponse> {
    try {
      const token = await authService.ensureAuthenticated();
      if (!token) {
        throw new Error('Authentication token not available');
      }

      const response = await fetch(ENDPOINTS.ANALYSIS.SECTOR_LIST, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed. Please login again.');
        } else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch sectors');
      }

      return data;
    } catch (error) {
      console.error('Error fetching sectors:', error);
      throw error;
    }
  }

  // POST /sector/benchmark - Sector benchmarking
  async getSectorBenchmark(request: AnalysisRequest): Promise<any> {
    try {
      const token = await authService.ensureAuthenticated();
      if (!token) {
        throw new Error('Authentication token not available');
      }

      const response = await fetch(ENDPOINTS.ANALYSIS.SECTOR_BENCHMARK, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed. Please login again.');
        } else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch sector benchmark');
      }

      return data;
    } catch (error) {
      console.error('Error fetching sector benchmark:', error);
      throw error;
    }
  }

  // GET /sector/{sector_name}/stocks - Sector stocks
  async getSectorStocks(sectorName: string): Promise<SectorStocksResponse> {
    try {
      const token = await authService.ensureAuthenticated();
      if (!token) {
        throw new Error('Authentication token not available');
      }

      const response = await fetch(`${ENDPOINTS.ANALYSIS.SECTOR_STOCKS}/${sectorName}/stocks`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed. Please login again.');
        } else if (response.status === 404) {
          throw new Error(`Sector ${sectorName} not found`);
        } else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch sector stocks');
      }

      return data;
    } catch (error) {
      console.error('Error fetching sector stocks:', error);
      throw error;
    }
  }

  // GET /sector/{sector_name}/performance - Sector performance
  async getSectorPerformance(sectorName: string, period: number = 365): Promise<SectorPerformanceResponse> {
    try {
      const token = await authService.ensureAuthenticated();
      if (!token) {
        throw new Error('Authentication token not available');
      }

      const response = await fetch(`${ENDPOINTS.ANALYSIS.SECTOR_PERFORMANCE}/${sectorName}/performance?period=${period}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed. Please login again.');
        } else if (response.status === 404) {
          throw new Error(`Sector ${sectorName} not found`);
        } else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch sector performance');
      }

      return data;
    } catch (error) {
      console.error('Error fetching sector performance:', error);
      throw error;
    }
  }

  // POST /sector/compare - Sector comparison
  async compareSectors(sectors: string[], period: number = 365): Promise<SectorComparisonResponse> {
    try {
      const token = await authService.ensureAuthenticated();
      if (!token) {
        throw new Error('Authentication token not available');
      }

      const response = await fetch(ENDPOINTS.ANALYSIS.SECTOR_COMPARE, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sectors, period })
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed. Please login again.');
        } else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to compare sectors');
      }

      return data;
    } catch (error) {
      console.error('Error comparing sectors:', error);
      throw error;
    }
  }

  // GET /stock/{symbol}/sector - Stock sector information
  async getStockSector(symbol: string): Promise<StockSectorResponse> {
    try {
      const token = await authService.ensureAuthenticated();
      if (!token) {
        throw new Error('Authentication token not available');
      }

      const response = await fetch(`${ENDPOINTS.ANALYSIS.STOCK_SECTOR}/${symbol}/sector`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed. Please login again.');
        } else if (response.status === 404) {
          throw new Error(`Stock ${symbol} not found`);
        } else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch stock sector');
      }

      return data;
    } catch (error) {
      console.error('Error fetching stock sector:', error);
      throw error;
    }
  }

  // ===== HEALTH CHECKS =====

  // GET /health - Analysis service health
  async getHealth(): Promise<any> {
    try {
      const token = await authService.ensureAuthenticated();
      if (!token) {
        throw new Error('Authentication token not available');
      }

      const response = await fetch(ENDPOINTS.ANALYSIS.HEALTH, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching analysis service health:', error);
      throw error;
    }
  }
}

export const analysisService = new AnalysisService();

// Export individual functions for convenience
export const {
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
  getHealth,
} = analysisService; 