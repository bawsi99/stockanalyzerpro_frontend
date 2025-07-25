import { useState, useEffect, useRef, useCallback } from 'react';
import { liveDataService, StockInfo } from '@/services/liveDataService';
import { toUTCTimestamp } from '@/utils/chartUtils';

// Types for live chart data
export interface LiveChartData {
  date: string;
  time: number; // UTC timestamp in seconds for lightweight-charts
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
  lastTickPrice?: number;
  lastTickTime?: number;
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
  data: {
    price: number;
    volume_traded?: number;
    timestamp?: number;
  };
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
    reconnectAttempts: 0,
    lastTickPrice: undefined,
    lastTickTime: undefined
  });

  // Refs
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dataRef = useRef<LiveChartData[]>([]);
  const symbolRef = useRef(symbol);
  const timeframeRef = useRef(timeframe);
  const isConnectingRef = useRef(false);
  const lastTickRef = useRef<{ price: number; time: number } | null>(null);

  // Update refs when props change
  useEffect(() => {
    symbolRef.current = symbol;
    timeframeRef.current = timeframe;
  }, [symbol, timeframe]);

  // Get token for symbol with better error handling
  const getToken = useCallback(async (stockSymbol: string): Promise<string> => {
    try {
      const stocks = await liveDataService.getAvailableStocks();
      const stock = stocks.find(s => s.symbol.toUpperCase() === stockSymbol.toUpperCase());
      if (!stock) {
        console.warn(`Stock ${stockSymbol} not found in available stocks, using default`);
        return '256265'; // Default to RELIANCE
      }
      return stock.token;
    } catch (error) {
      console.error('Error getting token for symbol:', error);
      return '256265'; // Default fallback
    }
  }, []);

  // Enhanced historical data loading with retry logic
  const loadHistoricalData = useCallback(async (retryCount = 0) => {
    if (!symbol) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      console.log(`Loading historical data for ${symbol} with timeframe ${timeframe} (attempt ${retryCount + 1})`);

      const response = await liveDataService.getHistoricalData(
        symbol,
        timeframe,
        exchange,
        maxDataPoints
      );

      if (!response.success || !response.candles || response.candles.length === 0) {
        throw new Error('No data received from server');
      }

      const convertedData = liveDataService.convertToChartData(response.candles);
      
      // Validate data before setting
      if (convertedData.length === 0) {
        throw new Error('No valid data points received');
      }
      
      // Limit data points for performance
      const limitedData = convertedData.slice(-maxDataPoints);
      
      console.log('Historical data loaded:', {
        symbol,
        timeframe,
        dataPoints: limitedData.length,
        firstCandle: limitedData[0],
        lastCandle: limitedData[limitedData.length - 1]
      });
      
      dataRef.current = limitedData;
      setState(prev => ({
        ...prev,
        data: limitedData,
        isLoading: false,
        lastUpdate: Date.now(),
        error: null,
        lastTickPrice: limitedData[limitedData.length - 1]?.close
      }));

    } catch (error) {
      console.error('Error loading historical data:', error);
      
      // Retry logic for transient errors
      if (retryCount < 2 && error instanceof Error && 
          (error.message.includes('network') || error.message.includes('timeout'))) {
        console.log(`Retrying historical data load (${retryCount + 1}/2)...`);
        setTimeout(() => loadHistoricalData(retryCount + 1), 2000);
        return;
      }
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load data'
      }));
    }
  }, [symbol, timeframe, exchange, maxDataPoints]);

  // Enhanced WebSocket connection with better error handling
  const connect = useCallback(async () => {
    if (isConnectingRef.current || wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('🔌 WebSocket already connected or connecting, skipping...');
      return;
    }

    console.log('🔌 Starting WebSocket connection for:', symbol, timeframe);
    isConnectingRef.current = true;

    // Unsubscribe from previous symbols/timeframes before subscribing to new ones
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify({
          action: 'unsubscribe',
          symbols: [symbolRef.current], // Send symbol name instead of token
          timeframes: [timeframeRef.current]
        }));
        console.log('Unsubscribed from previous symbols/timeframes');
        // Wait a moment to ensure unsubscribe is processed
        await new Promise(res => setTimeout(res, 100));
      } catch (error) {
        console.warn('Error unsubscribing from previous symbols:', error);
      }
    }

    setState(prev => ({ 
      ...prev, 
      connectionStatus: 'connecting',
      error: null 
    }));

    try {
      console.log(`🔌 Connecting to WebSocket for ${symbol}`);

      wsRef.current = await liveDataService.connectWebSocket(
        [symbol], // Send symbol instead of token
        (wsData: WebSocketMessage) => {
          console.log('📨 useLiveChart received WebSocket message:', wsData.type);
          console.log('📨 Full wsData structure:', wsData);
          console.log('📨 wsData.data exists:', !!wsData.data);
          console.log('📨 wsData.data type:', typeof wsData.data);
          
          // Enhanced message handling with better validation
          if (wsData.type === 'candle' && wsData.data) {
            console.log('🕯️ Processing candle data:', wsData.data);
            try {
              const candleData = wsData.data as CandleData;
              if (candleData && typeof candleData.open === 'number') {
                setState(prev => {
                  const newData = [...prev.data];
                  // Convert CandleData to LiveChartData format
                  const liveChartData: LiveChartData = {
                    date: new Date(candleData.time * 1000).toISOString(),
                    time: candleData.time,
                    open: candleData.open,
                    high: candleData.high,
                    low: candleData.low,
                    close: candleData.close,
                    volume: candleData.volume
                  };
                  
                  const existingIndex = newData.findIndex(d => d.time === candleData.time);
                  
                  if (existingIndex >= 0) {
                    newData[existingIndex] = liveChartData;
                    console.log('🔄 Updated existing candle:', liveChartData);
                  } else {
                    newData.push(liveChartData);
                    console.log('➕ Added new candle:', liveChartData);
                  }
                  
                  return {
                    ...prev,
                    data: newData,
                    lastUpdate: Date.now(),
                    isLive: true
                  };
                });
              }
            } catch (error) {
              console.error('Error processing candle data:', error);
            }
          } else if (wsData.type === 'tick') {
            console.log('🔍 Processing tick data:', wsData);
            try {
              // The tick data is directly in the message, not under a data field
              const tickData = wsData as any;
              console.log('🔍 Tick data type:', typeof tickData);
              console.log('🔍 Tick data keys:', Object.keys(tickData));
              
              // Extract price from various possible field names
              let price: number | null = null;
              if (typeof tickData.price === 'number') {
                price = tickData.price;
              } else if (typeof tickData.close === 'number') {
                price = tickData.close;
              } else if (typeof tickData.last_price === 'number') {
                price = tickData.last_price;
              } else if (typeof tickData.price === 'string') {
                price = parseFloat(tickData.price);
              } else if (typeof tickData.close === 'string') {
                price = parseFloat(tickData.close);
              } else if (typeof tickData.last_price === 'string') {
                price = parseFloat(tickData.last_price);
              }
              
              if (price === null || isNaN(price)) {
                console.warn('⚠️ No valid price found in tick data:', tickData);
                return;
              }
              
              // Extract timestamp
              const tickTime = tickData.timestamp || tickData.time || new Date().toISOString();
              
              console.log('🔄 TICK RECEIVED:', {
                price,
                tickTime,
                originalData: tickData
              });
              
              setState(prev => {
                if (prev.data.length === 0) {
                  console.log('No existing data to update with tick');
                  return prev;
                }
                
                const newData = [...prev.data];
                const lastCandle = newData[newData.length - 1];
                
                // Update the last candle with the new tick data
                const updatedCandle = {
                  ...lastCandle,
                  close: price,
                  high: Math.max(lastCandle.high, price),
                  low: Math.min(lastCandle.low, price),
                  volume: tickData.volume_traded || tickData.volume || lastCandle.volume,
                  time: lastCandle.time // Preserve the time property
                };
                
                newData[newData.length - 1] = updatedCandle;
                
                console.log('📊 Candle updated with tick:', {
                  oldClose: lastCandle.close,
                  newClose: price,
                  dataLength: newData.length
                });
                
                return {
                  ...prev,
                  data: newData,
                  lastUpdate: Date.now(),
                  isLive: true,
                  lastTickPrice: price,
                  lastTickTime: Date.now()
                };
              });
            } catch (error) {
              console.error('Error processing tick data:', error);
            }
          } else if (wsData.type === 'subscribed') {
            console.log('✅ Successfully subscribed to WebSocket feed');
            setState(prev => ({ 
              ...prev, 
              isConnected: true,
              connectionStatus: 'connected',
              reconnectAttempts: 0 
            }));
          } else if (wsData.type === 'error') {
            console.error('❌ WebSocket error:', wsData.data);
            setState(prev => ({ 
              ...prev, 
              error: wsData.data as string,
              connectionStatus: 'error'
            }));
          } else {
            console.log('⚠️ Unhandled message type or missing data:', wsData);
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
          
          // Enhanced reconnection logic
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
          }
          
          const currentAttempts = state.reconnectAttempts;
          if (currentAttempts < maxReconnectAttempts) {
            const delay = reconnectInterval * Math.pow(2, currentAttempts); // Exponential backoff
            console.log(`Scheduling reconnection attempt ${currentAttempts + 1}/${maxReconnectAttempts} in ${delay}ms`);
            
            reconnectTimeoutRef.current = setTimeout(() => {
              setState(prev => ({ ...prev, reconnectAttempts: prev.reconnectAttempts + 1 }));
              connect().catch(console.error);
            }, delay);
          } else {
            console.log('Max reconnection attempts reached');
            setState(prev => ({ ...prev, error: 'Max reconnection attempts reached' }));
          }
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
    } finally {
      isConnectingRef.current = false;
    }
  }, [symbol, timeframe, maxDataPoints, maxReconnectAttempts, reconnectInterval, getToken]);

  // Enhanced disconnect with cleanup
  const disconnect = useCallback(() => {
    console.log('Disconnecting WebSocket...');
    
    if (wsRef.current) {
      liveDataService.disconnectWebSocket();
      wsRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    isConnectingRef.current = false;
    lastTickRef.current = null;

    setState(prev => ({
      ...prev,
      connectionStatus: 'disconnected',
      isConnected: false,
      isLive: false,
      reconnectAttempts: 0,
      lastTickPrice: undefined,
      lastTickTime: undefined
    }));
  }, []);

  // Enhanced refetch with error handling
  const refetch = useCallback(async () => {
    console.log('Refetching data...');
    await loadHistoricalData();
  }, [loadHistoricalData]);

  // Enhanced symbol update
  const updateSymbol = useCallback((newSymbol: string) => {
    console.log(`Updating symbol from ${symbol} to ${newSymbol}`);
    disconnect();
    symbolRef.current = newSymbol;
    loadHistoricalData();
    if (autoConnect) {
      connect();
    }
  }, [disconnect, loadHistoricalData, autoConnect, connect, symbol]);

  // Enhanced timeframe update
  const updateTimeframe = useCallback((newTimeframe: string) => {
    console.log(`Updating timeframe from ${timeframe} to ${newTimeframe}`);
    disconnect();
    timeframeRef.current = newTimeframe;
    loadHistoricalData();
    if (autoConnect) {
      connect();
    }
  }, [disconnect, loadHistoricalData, autoConnect, connect, timeframe]);

  // Initialize on mount with better error handling
  useEffect(() => {
    console.log('🚀 useLiveChart hook initializing for:', symbol, timeframe);
    loadHistoricalData();
    
    if (autoConnect) {
      console.log('🔌 Auto-connecting to WebSocket...');
      connect();
    }

    return () => {
      console.log('🧹 Cleaning up useLiveChart hook');
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