import { useState, useEffect, useRef, useCallback } from 'react';
import { liveDataService, StockInfo } from '@/services/liveDataService';
import { toUTCTimestamp } from '@/utils/chartUtils';
import { performanceMonitor } from '@/utils/performanceMonitor';

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

interface WebSocketTickData {
  price?: number | string;
  close?: number | string;
  last_price?: number | string;
  volume_traded?: number;
  volume?: number;
  timestamp?: number | string;
  time?: number | string;
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

interface WebSocketHeartbeatMessage {
  type: 'heartbeat';
  timestamp: number;
}

type WebSocketMessage = WebSocketCandleMessage | WebSocketTickMessage | WebSocketSubscribedMessage | WebSocketErrorMessage | WebSocketHeartbeatMessage;

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
  
  // Function refs to avoid dependency issues
  const connectRef = useRef<(() => Promise<void>) | null>(null);
  const disconnectRef = useRef<(() => void) | null>(null);
  const loadHistoricalDataRef = useRef<((retryCount?: number) => Promise<void>) | null>(null);

  // Remove this useEffect - let the prop change handler manage refs
  // useEffect(() => {
  //   symbolRef.current = symbol;
  //   timeframeRef.current = timeframe;
  // }, [symbol, timeframe]);

  // Get token for symbol with better error handling
  const getToken = useCallback(async (stockSymbol: string): Promise<string> => {
    try {
      const stocks = await liveDataService.getAvailableStocks();
      const stock = stocks.find(s => s.symbol.toUpperCase() === stockSymbol.toUpperCase());
      if (!stock) {
        // console.warn(`Stock ${stockSymbol} not found in available stocks, using default RELIANCE token`);
        return '256265'; // Default to RELIANCE
      }
      // console.log(`Found token for ${stockSymbol}: ${stock.token}`);
      return stock.token;
    } catch (error) {
      // console.error('Error getting token for symbol:', error);
      return '256265'; // Default fallback
    }
  }, []);

  // Enhanced historical data loading with retry logic
  const loadHistoricalData = useCallback(async (retryCount = 0) => {
    const currentSymbol = symbolRef.current;
    const currentTimeframe = timeframeRef.current;
    
    if (!currentSymbol) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      console.log(`🔄 [useLiveChart] Starting loadHistoricalData for ${currentSymbol} (attempt ${retryCount + 1})`);

      const response = await liveDataService.getHistoricalData(
        currentSymbol,
        currentTimeframe,
        exchange,
        maxDataPoints
      );

      console.log('📊 [useLiveChart] Backend API response received:', {
        symbol: currentSymbol,
        responseSuccess: response.success,
        responseSymbol: response.symbol,
        candlesLength: response.candles?.length,
        firstCandle: response.candles?.[0],
        lastCandle: response.candles?.[response.candles?.length - 1]
      });

      // Add more detailed debugging for the first few candles
      if (response.candles && response.candles.length > 0) {
        // console.log('First 3 candles from backend:', response.candles.slice(0, 3).map(candle => ({
        //   time: candle.time,
        //   open: candle.open,
        //   high: candle.high,
        //   low: candle.low,
        //   close: candle.close,
        //   volume: candle.volume
        // })));
      }

      if (!response.success || !response.candles || response.candles.length === 0) {
        throw new Error(`No data received from server for ${currentSymbol}`);
      }

      console.log(`🔄 [useLiveChart] Converting ${response.candles.length} candles for ${currentSymbol}`);
      const convertedData = liveDataService.convertToChartData(response.candles);
      
      console.log('🔄 [useLiveChart] Converted data sample:', {
        originalCount: response.candles.length,
        convertedCount: convertedData.length,
        firstConverted: convertedData[0],
        lastConverted: convertedData[convertedData.length - 1]
      });

      // Validate data before setting
      if (convertedData.length === 0) {
        throw new Error(`No valid data points received for ${currentSymbol}`);
      }
      
      // Additional validation: check for reasonable price values
      const lastCandle = convertedData[convertedData.length - 1];
      const firstCandle = convertedData[0];
      
      // Check for suspicious price values (likely old data from different stock)
      // REMOVED: Hardcoded price range validation that was too restrictive
      // OLD: if (lastCandle.close < 100 || lastCandle.close > 100000)
      
      // NEW: Smart validation that checks for data consistency and reasonable relationships
      let validationErrors: string[] = [];
      
      // Check OHLC logic consistency
      if (lastCandle.high < lastCandle.low) {
        validationErrors.push('High < Low in last candle');
      }
      if (lastCandle.high < Math.max(lastCandle.open, lastCandle.close)) {
        validationErrors.push('High < max(Open, Close) in last candle');
      }
      if (lastCandle.low > Math.min(lastCandle.open, lastCandle.close)) {
        validationErrors.push('Low > min(Open, Close) in last candle');
      }
      
      // Check for reasonable price relationships (not absolute values)
      const priceRange = Math.abs(lastCandle.close - firstCandle.close);
      const avgPrice = (lastCandle.close + firstCandle.close) / 2;
      const priceChangePercent = (priceRange / avgPrice) * 100;
      
      // Log price information for debugging
      console.log(`🔍 [useLiveChart] Price analysis for ${currentSymbol}:`, {
        lastClose: lastCandle.close,
        firstClose: firstCandle.close,
        priceRange,
        avgPrice,
        priceChangePercent: priceChangePercent.toFixed(2) + '%'
      });
      
      // Check for extreme price changes (likely data corruption)
      if (priceChangePercent > 1000) { // More than 1000% change
        validationErrors.push(`Extreme price change: ${priceChangePercent.toFixed(2)}%`);
      }
      
      // Check for negative prices (invalid)
      if (lastCandle.close < 0 || firstCandle.close < 0) {
        validationErrors.push('Negative prices detected');
      }
      
      // Check for zero prices (invalid)
      if (lastCandle.close === 0 || firstCandle.close === 0) {
        validationErrors.push('Zero prices detected');
      }
      
      if (validationErrors.length > 0) {
        console.warn(`⚠️ [useLiveChart] Validation errors for ${currentSymbol}:`, validationErrors);
        throw new Error(`Invalid price data received for ${currentSymbol}. Please try again.`);
      }
      
      console.log('✅ [useLiveChart] Data validation passed for', currentSymbol);
      
      // Limit data points for performance
      const limitedData = convertedData.slice(-maxDataPoints);
      
      console.log('📊 [useLiveChart] Historical data loaded successfully:', {
        symbol: currentSymbol,
        timeframe: currentTimeframe,
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
      console.error(`❌ [useLiveChart] Error loading historical data for ${currentSymbol}:`, error);
      
      // Retry logic for transient errors
      if (retryCount < 2 && error instanceof Error && 
          (error.message.includes('network') || error.message.includes('timeout'))) {
        console.log(`🔄 [useLiveChart] Retrying historical data load for ${currentSymbol} (${retryCount + 1}/2)...`);
        setTimeout(() => loadHistoricalDataRef.current?.(retryCount + 1), 2000);
        return;
      }
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : `Failed to load data for ${currentSymbol}`,
        data: [] // Clear data on error
      }));
    }
  }, [exchange, maxDataPoints]);

  // Store the function in ref
  loadHistoricalDataRef.current = loadHistoricalData;

  // Enhanced WebSocket connection with better error handling
  const connect = useCallback(async () => {
    if (isConnectingRef.current) {
      // console.log('🔌 WebSocket already connecting, skipping...');
      return;
    }

    // console.log('🔌 Starting WebSocket connection for:', symbolRef.current, timeframeRef.current);
    isConnectingRef.current = true;

    // Disconnect any existing connection first
    liveDataService.disconnectWebSocket();

    setState(prev => ({ 
      ...prev, 
      connectionStatus: 'connecting',
      error: null 
    }));

    try {
      // console.log(`🔌 Connecting to WebSocket for ${symbolRef.current}`);

      wsRef.current = await liveDataService.connectWebSocket(
        [symbolRef.current], // Send symbol instead of token
        (wsData: WebSocketMessage) => {
          // console.log('📨 useLiveChart received WebSocket message:', wsData.type);
          // console.log('📨 Full wsData structure:', wsData);
          // console.log('📨 wsData.data exists:', !!wsData.data);
          // console.log('📨 wsData.data type:', typeof wsData.data);
          
          // Enhanced message handling with better validation
          if (wsData.type === 'candle' && wsData.data) {
            // console.log('🕯️ Processing candle data:', wsData.data);
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
                    // console.log('🔄 Updated existing candle:', liveChartData);
                  } else {
                    newData.push(liveChartData);
                    // console.log('➕ Added new candle:', liveChartData);
                  }
                  
                  // console.log('🔄 Setting lastTickPrice from candle data:', liveChartData.close, 'old lastTickPrice:', prev.lastTickPrice);
                  return {
                    ...prev,
                    data: newData,
                    lastUpdate: Date.now(),
                    isLive: true,
                    lastTickPrice: liveChartData.close,
                    lastTickTime: candleData.time
                  };
                });
              }
            } catch (error) {
              // console.error('Error processing candle data:', error);
            }
          } else if (wsData.type === 'tick') {
            // console.log('🔍 Processing tick data:', wsData);
            // console.log('🔍 Tick data type:', typeof wsData);
            // console.log('🔍 Tick data keys:', Object.keys(wsData));
            
            try {
              // Handle both direct tick data and nested data structure
              const tickData = (wsData as any).data || wsData;
              const price = parseFloat(tickData.price || tickData.close || tickData.last_price || '0');
              const tickTime = parseFloat(tickData.timestamp || tickData.time || Date.now() / 1000);
              
              if (price > 0 && tickTime > 0) {
                // console.log('🔄 TICK RECEIVED:', { price, tickTime, originalData: tickData });
                
                // Update last tick info
                lastTickRef.current = { price, time: tickTime };
                
                setState(prev => {
                  const newData = [...prev.data];
                  if (newData.length > 0) {
                    const lastCandle = newData[newData.length - 1];
                    const oldClose = lastCandle.close;
                    
                    // Update the last candle with new price
                    newData[newData.length - 1] = {
                      ...lastCandle,
                      close: price,
                      high: Math.max(lastCandle.high, price),
                      low: Math.min(lastCandle.low, price)
                    };
                    
                    // console.log('📊 Candle updated with tick:', {
                    //   oldClose,
                    //   newClose: price,
                    //   dataLength: newData.length
                    // });
                  }
                  
                  return {
                    ...prev,
                    data: newData,
                    lastUpdate: Date.now(),
                    isLive: true,
                    lastTickPrice: price,
                    lastTickTime: tickTime
                  };
                });
              }
            } catch (error) {
              // console.error('Error processing tick data:', error);
            }
          } else if (wsData.type === 'subscribed') {
            // console.log('✅ Successfully subscribed to WebSocket feed');
            setState(prev => ({
              ...prev,
              connectionStatus: 'connected',
              isConnected: true,
              reconnectAttempts: 0
            }));
          } else if (wsData.type === 'error') {
            // console.error('WebSocket error:', wsData);
            setState(prev => ({
              ...prev,
              connectionStatus: 'error',
              error: `WebSocket error: ${wsData.data}`,
              isConnected: false
            }));
          } else if (wsData.type === 'heartbeat') {
            // Handle heartbeat to keep connection alive
            // console.log('💓 WebSocket heartbeat received');
          }
        }
      );

      // console.log('WebSocket connected to Data Service');
      setState(prev => ({
        ...prev,
        connectionStatus: 'connected',
        isConnected: true,
        reconnectAttempts: 0
      }));

      // Reset connecting flag on successful connection
      isConnectingRef.current = false;

    } catch (error) {
      // console.error('Failed to connect to WebSocket:', error);
      isConnectingRef.current = false;
      
      setState(prev => ({
        ...prev,
        connectionStatus: 'error',
        error: `Failed to connect: ${error instanceof Error ? error.message : 'Unknown error'}`,
        isConnected: false
      }));

      // Attempt reconnection
      if (state.reconnectAttempts < maxReconnectAttempts) {
        // console.log(`Attempting reconnection (${state.reconnectAttempts + 1}/${maxReconnectAttempts})...`);
        reconnectTimeoutRef.current = setTimeout(() => {
          setState(prev => ({ ...prev, reconnectAttempts: prev.reconnectAttempts + 1 }));
          connectRef.current?.();
        }, reconnectInterval);
      }
    }
  }, [maxReconnectAttempts, reconnectInterval]);

  // Store the function in ref
  connectRef.current = connect;

  // Enhanced disconnect with cleanup
  const disconnect = useCallback(() => {
    // console.log('Disconnecting WebSocket...');
    
    // Use the liveDataService disconnect method
    liveDataService.disconnectWebSocket();
    
    // Clear our local reference
    wsRef.current = null;

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

  // Store the function in ref
  disconnectRef.current = disconnect;

  // Enhanced refetch with error handling
  const refetch = useCallback(async () => {
    // console.log('Refetching data...');
    await loadHistoricalDataRef.current?.();
  }, []);

  // Enhanced symbol update
  const updateSymbol = useCallback(async (newSymbol: string) => {
    // console.log(`🔄 Updating symbol from ${symbolRef.current} to ${newSymbol}`);
    // console.log('Symbol comparison:', {
    //   currentSymbol: symbolRef.current,
    //   newSymbol: newSymbol,
    //   areEqual: symbolRef.current === newSymbol,
    //   currentType: typeof symbolRef.current,
    //   newType: typeof newSymbol
    // });
    
    // Don't update if it's the same symbol
    if (symbolRef.current === newSymbol) {
      // console.log('⚠️ Same symbol, skipping update');
      return;
    }
    
    // Clear old data immediately when symbol changes
    setState(prev => ({
      ...prev,
      data: [], // Clear old data
      isLoading: true,
      error: null,
      isLive: false,
      lastTickPrice: undefined,
      lastTickTime: undefined
    }));
    
    try {
      // Disconnect current WebSocket first
      disconnectRef.current?.();
      
      // Update the symbol reference
      symbolRef.current = newSymbol;
      
      // Load new historical data
      await loadHistoricalDataRef.current?.();
      
      // Reconnect WebSocket if autoConnect is enabled
      if (autoConnect) {
        await connectRef.current?.();
      }
      
      // console.log(`✅ Successfully updated symbol to ${newSymbol}`);
    } catch (error) {
      // console.error(`❌ Failed to update symbol to ${newSymbol}:`, error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: `Failed to update symbol to ${newSymbol}: ${error instanceof Error ? error.message : 'Unknown error'}`
      }));
    }
  }, [autoConnect]);

  // Enhanced timeframe update
  const updateTimeframe = useCallback(async (newTimeframe: string) => {
    // console.log(`🔄 Updating timeframe from ${timeframeRef.current} to ${newTimeframe}`);
    
    // Don't update if it's the same timeframe
    if (timeframeRef.current === newTimeframe) {
      // console.log('⚠️ Same timeframe, skipping update');
      return;
    }
    
    // Clear old data when timeframe changes
    setState(prev => ({
      ...prev,
      data: [], // Clear old data
      isLoading: true,
      error: null,
      isLive: false,
      lastTickPrice: undefined,
      lastTickTime: undefined
    }));
    
    try {
      // Disconnect current WebSocket first
      disconnectRef.current?.();
      
      // Update the timeframe reference
      timeframeRef.current = newTimeframe;
      
      // Load new historical data
      await loadHistoricalDataRef.current?.();
      
      // Reconnect WebSocket if autoConnect is enabled
      if (autoConnect) {
        await connectRef.current?.();
      }
      
      // console.log(`✅ Successfully updated timeframe to ${newTimeframe}`);
    } catch (error) {
      // console.error(`❌ Failed to update timeframe to ${newTimeframe}:`, error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: `Failed to update timeframe to ${newTimeframe}: ${error instanceof Error ? error.message : 'Unknown error'}`
      }));
    }
  }, [autoConnect]);

  // Initialize on mount with better error handling
  useEffect(() => {
    // console.log('🚀 useLiveChart hook initializing for:', symbol, timeframe, 'at', new Date().toISOString());
    
    // Don't set refs here - let the prop change handler do it
    // symbolRef.current = symbol;
    // timeframeRef.current = timeframe;
    
    // Load initial data
    loadHistoricalDataRef.current?.();
    
    if (autoConnect) {
      // console.log('🔌 Auto-connecting to WebSocket...');
      connectRef.current?.();
    }

    return () => {
      // console.log('🧹 Cleaning up useLiveChart hook for:', symbol, timeframe, 'at', new Date().toISOString());
      disconnectRef.current?.();
      
      // Clear any pending performance timers for this symbol/timeframe
      const timerPattern = `getHistoricalData-${symbol}-${timeframe}`;
      performanceMonitor.clearTimersByPattern(timerPattern);
    };
  }, []); // Only run once on mount

  // Handle prop changes (symbol or timeframe)
  useEffect(() => {
    // console.log('🔄 useLiveChart props changed:', { symbol, timeframe, 'at': new Date().toISOString() });
    
    // Store previous values for comparison
    const previousSymbol = symbolRef.current;
    const previousTimeframe = timeframeRef.current;
    
    // console.log('🔄 Symbol comparison check:', {
    //   previousSymbol,
    //   newSymbol: symbol,
    //   areEqual: previousSymbol === symbol,
    //   previousType: typeof previousSymbol,
    //   newType: typeof symbol
    // });
    
    // Check if symbol has changed (including initial case when previousSymbol is undefined)
    if (previousSymbol !== symbol) {
      // console.log(`🔄 Symbol changed from ${previousSymbol || 'undefined'} to ${symbol}`);
      symbolRef.current = symbol;
      
      // Clear data and reload for new symbol
      setState(prev => ({
        ...prev,
        data: [],
        isLoading: true,
        error: null,
        isLive: false,
        lastTickPrice: undefined,
        lastTickTime: undefined
      }));
      
      // Disconnect current WebSocket to stop receiving old symbol data
      disconnectRef.current?.();
      
      // Load new historical data
      // console.log('🔄 Calling loadHistoricalData for symbol change...');
      // console.log('loadHistoricalDataRef.current exists:', !!loadHistoricalDataRef.current);
      loadHistoricalDataRef.current?.();
      
      // Reconnect WebSocket for new symbol if autoConnect is enabled
      if (autoConnect) {
        // console.log('🔄 Reconnecting WebSocket for new symbol...');
        // Use setTimeout to ensure disconnect completes before reconnect
        setTimeout(() => {
          connectRef.current?.();
        }, 100);
      }
    } else {
      // console.log('🔄 Symbol comparison failed - symbols are the same');
    }
    
    // Check if timeframe has changed (including initial case when previousTimeframe is undefined)
    if (previousTimeframe !== timeframe) {
      // console.log(`🔄 Timeframe changed from ${previousTimeframe || 'undefined'} to ${timeframe}`);
      timeframeRef.current = timeframe;
      
      // Clear data and reload for new timeframe
      setState(prev => ({
        ...prev,
        data: [],
        isLoading: true,
        error: null,
        isLive: false,
        lastTickPrice: undefined,
        lastTickTime: undefined
      }));
      
      // Disconnect current WebSocket to stop receiving old timeframe data
      disconnectRef.current?.();
      
      // Load new historical data
      // console.log('🔄 Calling loadHistoricalData for timeframe change...');
      // console.log('loadHistoricalDataRef.current exists:', !!loadHistoricalDataRef.current);
      loadHistoricalDataRef.current?.();
      
      // Reconnect WebSocket for new timeframe if autoConnect is enabled
      if (autoConnect) {
        // console.log('🔄 Reconnecting WebSocket for new timeframe...');
        // Use setTimeout to ensure disconnect completes before reconnect
        setTimeout(() => {
          connectRef.current?.();
        }, 100);
      }
    }
  }, [symbol, timeframe, autoConnect]);

  return {
    ...state,
    connect,
    disconnect,
    refetch,
    updateSymbol,
    updateTimeframe
  };
} 