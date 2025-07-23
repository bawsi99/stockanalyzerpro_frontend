import { useState, useEffect, useRef, useCallback } from 'react';
import { liveDataService, StockInfo } from '@/services/liveDataService';
import { toUTCTimestamp } from '@/utils/chartUtils';

// Types for live chart data
export interface LiveChartData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface LiveChartState {
  data: LiveChartData[];
  isConnected: boolean;
  isLive: boolean;
  isLoading: boolean;
  error: string | null;
  lastUpdate: number;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  reconnectAttempts: number;
}

export interface UseLiveChartOptions {
  symbol: string;
  timeframe: string;
  exchange?: string;
  maxDataPoints?: number;
  autoConnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export interface UseLiveChartReturn extends LiveChartState {
  connect: () => Promise<void>;
  disconnect: () => void;
  refetch: () => Promise<void>;
  updateSymbol: (symbol: string) => void;
  updateTimeframe: (timeframe: string) => void;
}

// WebSocket message types
interface WebSocketCandleMessage {
  type: 'candle';
  data: {
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    start: number;
  };
}

interface WebSocketTickMessage {
  type: 'tick';
  data: any;
}

interface WebSocketSubscribedMessage {
  type: 'subscribed';
  tokens: string[];
  timeframes: string[];
}

interface WebSocketErrorMessage {
  type: 'error';
  data: string;
}

type WebSocketMessage = WebSocketCandleMessage | WebSocketTickMessage | WebSocketSubscribedMessage | WebSocketErrorMessage;

export function useLiveChart({
  symbol,
  timeframe,
  exchange = 'NSE',
  maxDataPoints = 1000,
  autoConnect = true,
  reconnectInterval = 5000,
  maxReconnectAttempts = 5
}: UseLiveChartOptions): UseLiveChartReturn {
  // State
  const [state, setState] = useState<LiveChartState>({
    data: [],
    isConnected: false,
    isLive: false,
    isLoading: false,
    error: null,
    lastUpdate: 0,
    connectionStatus: 'disconnected',
    reconnectAttempts: 0
  });

  // Refs
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dataRef = useRef<LiveChartData[]>([]);
  const symbolRef = useRef(symbol);
  const timeframeRef = useRef(timeframe);

  // Update refs when props change
  useEffect(() => {
    symbolRef.current = symbol;
    timeframeRef.current = timeframe;
  }, [symbol, timeframe]);

  // Get token for symbol
  const getToken = useCallback(async (stockSymbol: string): Promise<string> => {
    try {
      const stocks = await liveDataService.getAvailableStocks();
      const stock = stocks.find(s => s.symbol.toUpperCase() === stockSymbol.toUpperCase());
      return stock?.token || '256265'; // Default to RELIANCE
    } catch (error) {
      console.error('Error getting token for symbol:', error);
      return '256265'; // Default fallback
    }
  }, []);

  // Load historical data
  const loadHistoricalData = useCallback(async () => {
    if (!symbol) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      console.log(`Loading historical data for ${symbol} with timeframe ${timeframe}`);

      const response = await liveDataService.getHistoricalData(
        symbol,
        timeframe,
        exchange,
        maxDataPoints
      );

      const convertedData = liveDataService.convertToChartData(response.candles);
      
      // Limit data points for performance
      const limitedData = convertedData.slice(-maxDataPoints);
      
      console.log('Historical data sample:', limitedData.slice(0, 3));
      console.log('Data format check:', {
        hasData: limitedData.length > 0,
        firstItem: limitedData[0],
        lastItem: limitedData[limitedData.length - 1]
      });
      
      dataRef.current = limitedData;
      setState(prev => ({
        ...prev,
        data: limitedData,
        isLoading: false,
        lastUpdate: Date.now(),
        error: null
      }));

      console.log(`Loaded ${limitedData.length} historical data points for ${symbol}`);
    } catch (error) {
      console.error('Error loading historical data:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load data'
      }));
    }
  }, [symbol, timeframe, exchange, maxDataPoints]);

  // Connect to WebSocket
  const connect = useCallback(async () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      // Unsubscribe from previous tokens/timeframes before subscribing to new ones
      wsRef.current.send(JSON.stringify({
        action: 'unsubscribe',
        tokens: [await getToken(symbolRef.current)],
        timeframes: [timeframeRef.current]
      }));
      console.log('Unsubscribed from previous tokens/timeframes');
      // Wait a moment to ensure unsubscribe is processed
      await new Promise(res => setTimeout(res, 100));
    }

    setState(prev => ({ 
      ...prev, 
      connectionStatus: 'connecting',
      error: null 
    }));

    try {
      const token = await getToken(symbol);
      console.log(`Connecting to WebSocket for ${symbol} (token: ${token})`);

      wsRef.current = await liveDataService.connectWebSocket(
        [token], // Use the actual token as identifier
        (wsData: WebSocketMessage) => {
          // Handle incoming WebSocket data
          if (wsData.type === 'candle' && wsData.data) {
            try {
              // Validate and convert data
              const candleData = wsData.data;
              if (!candleData.open || !candleData.high || !candleData.low || !candleData.close) {
                console.warn('Incomplete candle data received:', candleData);
                return;
              }

              const newCandle: LiveChartData = {
                // Convert Unix timestamp to ISO string for chart library
                date: new Date(candleData.start * 1000).toISOString(),
                open: parseFloat(candleData.open.toString()),
                high: parseFloat(candleData.high.toString()),
                low: parseFloat(candleData.low.toString()),
                close: parseFloat(candleData.close.toString()),
                volume: parseInt(candleData.volume.toString()) || 0
              };

              console.log('Received live candle:', newCandle);

              setState(prev => {
                const updatedData = [...prev.data];
                const lastIndex = updatedData.length - 1;
                
                // Replace the last candle if it's the same timestamp, otherwise add new
                if (lastIndex >= 0 && updatedData[lastIndex].date === newCandle.date) {
                  updatedData[lastIndex] = newCandle;
                  console.log('Updated existing candle');
                } else {
                  updatedData.push(newCandle);
                  console.log('Added new candle');
                }

                // Keep only the last maxDataPoints
                const limitedData = updatedData.slice(-maxDataPoints);
                dataRef.current = limitedData;
                console.log('Live chart state after update:', dataRef.current);
                return {
                  ...prev,
                  data: limitedData,
                  isLive: true,
                  lastUpdate: Date.now()
                };
              });
            } catch (error) {
              console.error('Error processing candle data:', error, wsData);
            }
          } else if (wsData.type === 'tick') {
            // On tick, update the last candle’s close price in real-time
            setState(prev => {
              if (!prev.data.length) return prev;
              const updatedData = [...prev.data];
              const lastIndex = updatedData.length - 1;
              // Only update close price and optionally volume
              updatedData[lastIndex] = {
                ...updatedData[lastIndex],
                close: typeof wsData.data?.price === 'number' ? wsData.data.price : updatedData[lastIndex].close,
                volume: typeof wsData.data?.volume_traded === 'number' ? wsData.data.volume_traded : updatedData[lastIndex].volume
              };
              return {
                ...prev,
                data: updatedData,
                isLive: true,
                lastUpdate: Date.now()
              };
            });
          } else if (wsData.type === 'subscribed') {
            console.log('Successfully subscribed to WebSocket:', wsData);
            setState(prev => ({
              ...prev,
              connectionStatus: 'connected',
              isConnected: true
            }));
          } else if (wsData.type === 'error') {
            console.error('WebSocket error:', wsData);
            setState(prev => ({
              ...prev,
              error: wsData.data || 'WebSocket error',
              connectionStatus: 'error'
            }));
          }
        },
        (wsError) => {
          console.error('WebSocket error:', wsError);
          setState(prev => ({
            ...prev,
            connectionStatus: 'error',
            isConnected: false,
            isLive: false,
            error: 'WebSocket connection error'
          }));
        },
        () => {
          console.log('WebSocket disconnected');
          setState(prev => ({
            ...prev,
            connectionStatus: 'disconnected',
            isConnected: false,
            isLive: false
          }));
        },
        [timeframe]
      );

      setState(prev => ({
        ...prev,
        connectionStatus: 'connected',
        isConnected: true
      }));

    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
      setState(prev => ({
        ...prev,
        connectionStatus: 'error',
        error: error instanceof Error ? error.message : 'Failed to connect'
      }));
    }
  }, [symbol, timeframe, maxDataPoints, getToken]);

  // Disconnect WebSocket
  const disconnect = useCallback(() => {
    if (wsRef.current) {
      liveDataService.disconnectWebSocket();
      wsRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    setState(prev => ({
      ...prev,
      connectionStatus: 'disconnected',
      isConnected: false,
      isLive: false,
      reconnectAttempts: 0
    }));
  }, []);

  // Refetch data
  const refetch = useCallback(async () => {
    await loadHistoricalData();
  }, [loadHistoricalData]);

  // Update symbol
  const updateSymbol = useCallback((newSymbol: string) => {
    disconnect();
    symbolRef.current = newSymbol;
    loadHistoricalData();
    if (autoConnect) {
      connect();
    }
  }, [disconnect, loadHistoricalData, autoConnect, connect]);

  // Update timeframe
  const updateTimeframe = useCallback((newTimeframe: string) => {
    disconnect();
    timeframeRef.current = newTimeframe;
    loadHistoricalData();
    if (autoConnect) {
      connect();
    }
  }, [disconnect, loadHistoricalData, autoConnect, connect]);

  // Initialize on mount
  useEffect(() => {
    loadHistoricalData();
    
    // Temporarily disable WebSocket to focus on chart rendering
    // if (autoConnect) {
    //   connect();
    // }

    return () => {
      disconnect();
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    ...state,
    connect,
    disconnect,
    refetch,
    updateSymbol,
    updateTimeframe
  };
} 