import { authService } from './authService';
import { useState, useEffect, useCallback, useRef } from 'react';
import { ChartData } from '@/types/analysis';
import { toUTCTimestamp } from '@/utils/chartUtils';
import { ENDPOINTS } from '../config';

// Types for real data
export interface RealCandlestickData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface HistoricalDataResponse {
  success: boolean;
  symbol: string;
  exchange: string;
  interval: string;
  token: string;
  candles: RealCandlestickData[];
  count: number;
  first_candle?: RealCandlestickData;
  last_candle?: RealCandlestickData;
  timestamp: string;
}

export interface StockInfo {
  symbol: string;
  name: string;
  token: string;
  exchange: string;
  sector?: string;
}

// Interval mapping for frontend to backend
export const INTERVAL_MAPPING = {
  '1m': '1min',
  '5m': '5min',
  '15m': '15min',
  '1h': '60min',
  '1d': '1day'
};

// ===== UTILITY FUNCTIONS =====

// Note: Timestamp conversion is now handled by centralized utilities in chartUtils.ts

// ===== TYPES & INTERFACES =====

class LiveDataService {
  private wsConnection: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor() {
    // Use the data service URL for WebSocket connections
    console.log('LiveDataService initialized with split backend architecture');
  }

  // Get historical data for a stock (Data Service - Port 8000)
  async getHistoricalData(
    symbol: string,
    interval: string = '1d',
    exchange: string = 'NSE',
    limit: number = 1000
  ): Promise<HistoricalDataResponse> {
    try {
      const token = await authService.ensureAuthenticated();
      if (!token) {
        throw new Error('Authentication token not available');
      }

      const backendInterval = INTERVAL_MAPPING[interval as keyof typeof INTERVAL_MAPPING] || '1day';
      
      const response = await fetch(
        `${ENDPOINTS.DATA.STOCK_HISTORY}/${symbol}/history?interval=${backendInterval}&exchange=${exchange}&limit=${limit}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed. Please login again.');
        } else if (response.status === 404) {
          throw new Error(`Stock ${symbol} not found or no data available`);
        } else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch historical data');
      }

      return data;
    } catch (error) {
      console.error('Error fetching historical data:', error);
      throw error;
    }
  }

  // Get stock information (Data Service - Port 8000)
  async getStockInfo(symbol: string, exchange: string = 'NSE'): Promise<StockInfo> {
    try {
      const token = await authService.ensureAuthenticated();
      if (!token) {
        throw new Error('Authentication token not available');
      }
      
      const response = await fetch(
        `${ENDPOINTS.DATA.STOCK_INFO}/${symbol}/info?exchange=${exchange}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

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
        throw new Error(data.error || 'Failed to fetch stock info');
      }

      // Extract stock info from the response
      const quote = data.quote;
      return {
        symbol: data.stock_symbol,
        name: `${data.stock_symbol} Ltd`, // You can enhance this with a proper name mapping
        token: quote.instrument_token.toString(),
        exchange: data.exchange,
        sector: 'N/A' // You can add sector information if available
      };
    } catch (error) {
      console.error('Error fetching stock info:', error);
      throw error;
    }
  }

  // Get market status (Data Service - Port 8000)
  async getMarketStatus(): Promise<any> {
    try {
      const token = await authService.ensureAuthenticated();
      
      const response = await fetch(ENDPOINTS.DATA.MARKET_STATUS, {
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
      console.error('Error fetching market status:', error);
      throw error;
    }
  }

  // Get optimized data (Data Service - Port 8000)
  async getOptimizedData(request: {
    symbol: string;
    exchange?: string;
    interval?: string;
    period?: number;
    force_live?: boolean;
  }): Promise<any> {
    try {
      const token = await authService.ensureAuthenticated();
      
      const response = await fetch(ENDPOINTS.DATA.OPTIMIZED_DATA, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching optimized data:', error);
      throw error;
    }
  }

  // Connect to WebSocket for real-time data (Data Service - Port 8000)
  async connectWebSocket(
    tokens: string[],
    onData: (data: any) => void,
    onError?: (error: any) => void,
    onClose?: () => void,
    timeframes: string[] = ['1d'] // Default to daily timeframe
  ): Promise<WebSocket> {
    if (this.wsConnection && this.wsConnection.readyState === WebSocket.OPEN) {
      this.wsConnection.close();
    }

    const token = await authService.ensureAuthenticated();
    if (!token) {
      throw new Error('Authentication token not available for WebSocket connection');
    }
    
    const wsUrl = `${ENDPOINTS.DATA.WEBSOCKET}?token=${token}`;
    
    this.wsConnection = new WebSocket(wsUrl);

    this.wsConnection.onopen = () => {
      console.log('WebSocket connected to Data Service');
      this.reconnectAttempts = 0;
      
      // Subscribe to tokens with specific timeframes
      if (tokens.length > 0) {
        this.wsConnection?.send(JSON.stringify({
          action: 'subscribe',
          tokens: tokens,
          timeframes: timeframes
        }));
      }
    };

    this.wsConnection.onmessage = (event) => {
      console.log('Raw WebSocket message:', event.data);
      try {
        const data = JSON.parse(event.data);
        onData(data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    this.wsConnection.onerror = (error) => {
      console.error('WebSocket error:', error);
      onError?.(error);
    };

    this.wsConnection.onclose = (event) => {
      console.log('WebSocket closed:', event.code, event.reason);
      onClose?.();
      
      // Attempt to reconnect
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
        
        setTimeout(() => {
          this.connectWebSocket(tokens, onData, onError, onClose, timeframes);
        }, this.reconnectDelay * this.reconnectAttempts);
      }
    };

    return this.wsConnection;
  }

  // Disconnect WebSocket
  disconnectWebSocket(): void {
    if (this.wsConnection) {
      this.wsConnection.close();
      this.wsConnection = null;
    }
  }

  // Get WebSocket health status (Data Service - Port 8000)
  async getWebSocketHealth(): Promise<any> {
    try {
      const token = await authService.ensureAuthenticated();
      
      const response = await fetch(ENDPOINTS.DATA.WEBSOCKET_HEALTH, {
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
      console.error('Error fetching WebSocket health:', error);
      throw error;
    }
  }

  // Get WebSocket test status (Data Service - Port 8000)
  async getWebSocketTest(): Promise<any> {
    try {
      const token = await authService.ensureAuthenticated();
      
      const response = await fetch(ENDPOINTS.DATA.WEBSOCKET_TEST, {
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
      console.error('Error fetching WebSocket test:', error);
      throw error;
    }
  }

  // Get available stocks (you can expand this based on your needs)
  async getAvailableStocks(): Promise<StockInfo[]> {
    // For now, return a predefined list of major stocks
    // You can implement this to fetch from your backend
    const majorStocks = [
      { symbol: 'RELIANCE', name: 'Reliance Industries Ltd', token: '256265', exchange: 'NSE', sector: 'Oil & Gas' },
      { symbol: 'TCS', name: 'Tata Consultancy Services Ltd', token: '11536', exchange: 'NSE', sector: 'IT' },
      { symbol: 'HDFC', name: 'HDFC Bank Ltd', token: '1330', exchange: 'NSE', sector: 'Banking' },
      { symbol: 'INFY', name: 'Infosys Ltd', token: '1594', exchange: 'NSE', sector: 'IT' },
      { symbol: 'ICICIBANK', name: 'ICICI Bank Ltd', token: '4963', exchange: 'NSE', sector: 'Banking' },
      { symbol: 'HINDUNILVR', name: 'Hindustan Unilever Ltd', token: '3045', exchange: 'NSE', sector: 'FMCG' },
      { symbol: 'ITC', name: 'ITC Ltd', token: '1660', exchange: 'NSE', sector: 'FMCG' },
      { symbol: 'SBIN', name: 'State Bank of India', token: '3045', exchange: 'NSE', sector: 'Banking' },
      { symbol: 'BHARTIARTL', name: 'Bharti Airtel Ltd', token: '2713', exchange: 'NSE', sector: 'Telecom' },
      { symbol: 'AXISBANK', name: 'Axis Bank Ltd', token: '590', exchange: 'NSE', sector: 'Banking' },
      { symbol: 'WIPRO', name: 'Wipro Ltd', token: '969', exchange: 'NSE', sector: 'IT' },
      { symbol: 'HCLTECH', name: 'HCL Technologies Ltd', token: '7229', exchange: 'NSE', sector: 'IT' },
      { symbol: 'ASIANPAINT', name: 'Asian Paints Ltd', token: '22', exchange: 'NSE', sector: 'Consumer Goods' },
      { symbol: 'MARUTI', name: 'Maruti Suzuki India Ltd', token: '10999', exchange: 'NSE', sector: 'Automobile' },
      { symbol: 'SUNPHARMA', name: 'Sun Pharmaceutical Industries Ltd', token: '8572', exchange: 'NSE', sector: 'Pharma' },
      { symbol: 'ULTRACEMCO', name: 'UltraTech Cement Ltd', token: '11511', exchange: 'NSE', sector: 'Cement' },
      { symbol: 'TITAN', name: 'Titan Company Ltd', token: '11536', exchange: 'NSE', sector: 'Consumer Goods' },
      { symbol: 'BAJFINANCE', name: 'Bajaj Finance Ltd', token: '811', exchange: 'NSE', sector: 'Finance' },
      { symbol: 'NESTLEIND', name: 'Nestle India Ltd', token: '16751', exchange: 'NSE', sector: 'FMCG' },
      { symbol: 'POWERGRID', name: 'Power Grid Corporation of India Ltd', token: '14977', exchange: 'NSE', sector: 'Power' }
    ];

    return majorStocks;
  }

  // Convert backend data format to frontend format
  convertToChartData(backendData: RealCandlestickData[]): any[] {
    return backendData.map(candle => ({
      date: new Date(candle.time * 1000).toISOString(), // Use UTC ISO string
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
      volume: candle.volume
    }));
  }

  // Get real-time status (Data Service - Port 8000)
  async getRealTimeStatus(): Promise<any> {
    try {
      const token = await authService.ensureAuthenticated();
      
      const response = await fetch(ENDPOINTS.DATA.WEBSOCKET_HEALTH, {
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
      console.error('Error fetching real-time status:', error);
      throw error;
    }
  }

  // Clear interval cache for specific symbol and interval (Data Service - Port 8000)
  async clearIntervalCache(symbol: string, interval: string): Promise<void> {
    try {
      const token = await authService.ensureAuthenticated();
      if (!token) {
        throw new Error('Authentication token not available');
      }

      const backendInterval = INTERVAL_MAPPING[interval as keyof typeof INTERVAL_MAPPING] || '1day';
      
      const params = new URLSearchParams({
        symbol,
        interval: backendInterval
      });
      
      const response = await fetch(`${ENDPOINTS.DATA.MARKET_OPTIMIZATION}/clear-interval-cache?${params}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Failed to clear interval cache for ${symbol}`);
      }
    } catch (error) {
      console.error('Error clearing interval cache:', error);
      throw error;
    }
  }
}

export const liveDataService = new LiveDataService();

// ===== REACT HOOKS =====

export function useLiveData(token: string, timeframe: string) {
  const [data, setData] = useState<ChartData[]>([]);
  const [isLive, setIsLive] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState(0);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Convert token to symbol (you might need to implement a mapping)
  const getSymbolFromToken = useCallback((token: string): string => {
    // For now, return a default symbol. You should implement proper token-to-symbol mapping
    return 'RELIANCE'; // Default fallback
  }, []);

  // Fetch initial historical data
  const fetchHistoricalData = useCallback(async () => {
    if (!token) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const symbol = getSymbolFromToken(token);
      const response = await liveDataService.getHistoricalData(symbol, timeframe);
      
      if (response.success && response.candles) {
        const chartData: ChartData[] = response.candles.map(candle => ({
          date: new Date(candle.time * 1000).toISOString(), // Use UTC ISO string
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
          volume: candle.volume
        }));
        
        setData(chartData);
        setLastUpdate(Date.now());
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch historical data');
      console.error('Error fetching historical data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [token, timeframe, getSymbolFromToken]);

  // Connect to WebSocket for live data
  const connectWebSocket = useCallback(async () => {
    if (!token || wsRef.current?.readyState === WebSocket.OPEN) return;
    
    const symbol = getSymbolFromToken(token);
    
    try {
      wsRef.current = await liveDataService.connectWebSocket(
        [symbol],
        (wsData) => {
        // Handle incoming WebSocket data
        if (wsData.type === 'candlestick' && wsData.data) {
          const newCandle: ChartData = {
            date: new Date(wsData.data.time * 1000).toISOString(), // Use UTC ISO string
            open: wsData.data.open,
            high: wsData.data.high,
            low: wsData.data.low,
            close: wsData.data.close,
            volume: wsData.data.volume
          };
          
          setData(prevData => {
            const updatedData = [...prevData];
            // Replace the last candle if it's the same timestamp, otherwise add new
            const lastIndex = updatedData.length - 1;
            if (lastIndex >= 0 && updatedData[lastIndex].date === newCandle.date) {
              updatedData[lastIndex] = newCandle;
            } else {
              updatedData.push(newCandle);
            }
            return updatedData;
          });
          
          setLastUpdate(Date.now());
          setIsLive(true);
        }
      },
      (wsError) => {
        console.error('WebSocket error:', wsError);
        setError('WebSocket connection error');
        setIsConnected(false);
        setIsLive(false);
      },
      () => {
        console.log('WebSocket closed');
        setIsConnected(false);
        setIsLive(false);
        
        // Attempt to reconnect
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        reconnectTimeoutRef.current = setTimeout(() => {
          connectWebSocket();
        }, 5000);
      }
    );
    
    setIsConnected(true);
    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
      setError('Failed to connect to WebSocket');
      setIsConnected(false);
    }
  }, [token, getSymbolFromToken]);

  // Disconnect WebSocket
  const disconnectWebSocket = useCallback(() => {
    if (wsRef.current) {
      liveDataService.disconnectWebSocket();
      wsRef.current = null;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
      updateIntervalRef.current = null;
    }
    
    setIsConnected(false);
    setIsLive(false);
  }, []);

  // Refetch data
  const refetch = useCallback(() => {
    fetchHistoricalData();
  }, [fetchHistoricalData]);

  // Initialize data fetching
  useEffect(() => {
    if (token) {
      fetchHistoricalData();
      connectWebSocket().catch(error => {
        console.error('Failed to connect WebSocket:', error);
      });
    }
    
    return () => {
      disconnectWebSocket();
    };
  }, [token, timeframe, fetchHistoricalData, connectWebSocket, disconnectWebSocket]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnectWebSocket();
    };
  }, [disconnectWebSocket]);

  return {
    data,
    isLive,
    isConnected,
    isLoading,
    error,
    lastUpdate,
    refetch
  };
} 