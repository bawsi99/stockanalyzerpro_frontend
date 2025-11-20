import { useState, useEffect, useRef, useCallback } from 'react';
import { liveDataService, StockInfo, INTERVAL_MAPPING } from '@/services/liveDataService';
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

      // Calculate number of days to fetch based on interval
      // Limit parameter represents number of days, not candles
      const getDaysForInterval = (timeframe: string): number => {
        const daysToFetch: Record<string, number> = {
          '1m': 30,       // 1 minute: 30 days
          '5m': 90,       // 5 minute: 90 days
          '15m': 180,     // 15 minute: 180 days
          '30m': 180,     // 30 minute: 180 days
          '1h': 365,      // 1 hour: 365 days
          '1d': 2000,     // 1 day: 2000 days
        };

        return daysToFetch[timeframe] || 1;
      };

      const daysLimit = getDaysForInterval(currentTimeframe);
      console.log(`📊 [useLiveChart] Using limit=${daysLimit} days for interval=${currentTimeframe}`);

      // Get date in YYYY-MM-DD format for historical data request
      // For daily timeframe: use end_date (works correctly)
      // For intraday timeframes: don't use end_date - backend automatically uses latest available candle
      const today = new Date();
      const isDailyTimeframe = currentTimeframe === '1d' || currentTimeframe === '1day';
      
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const endDate = `${year}-${month}-${day}`; // Format: YYYY-MM-DD in local timezone
      
      console.log(`📅 [useLiveChart] Requesting historical data${isDailyTimeframe ? ` with end_date: ${endDate}` : ' (limit-only, no end_date for intraday)'} for timeframe: ${currentTimeframe}`);
      if (!isDailyTimeframe) {
        console.log(`📅 [useLiveChart] Note: For intraday, backend automatically uses latest available candle (including today) when no end_date is provided`);
      }

      const response = await liveDataService.getHistoricalData(
        currentSymbol,
        currentTimeframe,
        exchange,
        daysLimit,  // Send number of days as limit
        endDate
      );

      // Detailed analysis of received data
      console.log('🔍 [useLiveChart] Starting gap analysis - candles count:', response.candles?.length);
      const now = new Date();
      const nowTimestamp = Math.floor(now.getTime() / 1000);
      const firstCandle = response.candles?.[0];
      const lastCandle = response.candles?.[response.candles?.length - 1];
      
      console.log('🔍 [useLiveChart] First candle:', firstCandle ? { time: firstCandle.time, date: new Date(firstCandle.time * 1000).toISOString() } : 'null');
      console.log('🔍 [useLiveChart] Last candle:', lastCandle ? { time: lastCandle.time, date: new Date(lastCandle.time * 1000).toISOString() } : 'null');
      console.log('🔍 [useLiveChart] Current time:', { timestamp: nowTimestamp, date: now.toISOString() });
      console.log('🔍 [useLiveChart] Requested endDate:', endDate);
      
      let gapAnalysis: any = {};
      if (lastCandle) {
        console.log('🔍 [useLiveChart] Last candle exists, calculating gap...');
        const lastCandleDate = new Date(lastCandle.time * 1000);
        const timeDiff = nowTimestamp - lastCandle.time;
        const hoursDiff = timeDiff / 3600;
        const minutesDiff = timeDiff / 60;
        
        gapAnalysis = {
          lastCandleTimestamp: lastCandle.time,
          lastCandleDate: lastCandleDate.toISOString(),
          lastCandleLocalDate: lastCandleDate.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
          currentTimestamp: nowTimestamp,
          currentDate: now.toISOString(),
          currentLocalDate: now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
          gapSeconds: timeDiff,
          gapMinutes: Math.round(minutesDiff),
          gapHours: Math.round(hoursDiff * 10) / 10,
          isLastCandleToday: lastCandleDate.toDateString() === now.toDateString(),
          requestedEndDate: endDate
        };
        
        // Calculate expected interval for this timeframe
        const expectedIntervalSeconds: Record<string, number> = {
          '1min': 60,
          '5min': 300,
          '15min': 900,
          '60min': 3600,
          '1day': 86400
        };
        const intervalMapping: Record<string, string> = {
          '1m': '1min',
          '5m': '5min',
          '15m': '15min',
          '1h': '60min',
          '1d': '1day'
        };
        const backendInterval = intervalMapping[currentTimeframe] || currentTimeframe;
        const intervalSeconds = expectedIntervalSeconds[backendInterval] || 86400;
        
        gapAnalysis.expectedInterval = {
          timeframe: currentTimeframe,
          backendInterval,
          intervalSeconds,
          isGapSignificant: timeDiff > intervalSeconds * 2,
          missingCandlesEstimate: Math.floor(timeDiff / intervalSeconds)
        };
      }
      
      console.log('📊 [useLiveChart] Backend API response received:', {
        symbol: currentSymbol,
        timeframe: currentTimeframe,
        responseSuccess: response.success,
        responseSymbol: response.symbol,
        candlesLength: response.candles?.length,
        firstCandle: firstCandle,
        lastCandle: lastCandle,
        gapAnalysis
      });
      
      // Expanded gap analysis logging
      if (gapAnalysis.lastCandleTimestamp) {
        console.log('⏰ [useLiveChart] GAP ANALYSIS (After API Response):', {
          'Last Candle Time': gapAnalysis.lastCandleLocalDate,
          'Current Time': gapAnalysis.currentLocalDate,
          'Gap (seconds)': gapAnalysis.gapSeconds,
          'Gap (minutes)': gapAnalysis.gapMinutes,
          'Gap (hours)': gapAnalysis.gapHours,
          'Is Last Candle Today?': gapAnalysis.isLastCandleToday,
          'Requested End Date': gapAnalysis.requestedEndDate,
          'Expected Interval (seconds)': gapAnalysis.expectedInterval?.intervalSeconds,
          'Is Gap Significant?': gapAnalysis.expectedInterval?.isGapSignificant,
          'Estimated Missing Candles': gapAnalysis.expectedInterval?.missingCandlesEstimate
        });
      }

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
      
      // CRITICAL: Sort by time to ensure chronological order
      // Backend returns candles in chronological order, but we need to ensure this
      convertedData.sort((a, b) => a.time - b.time);
      
      // Log the full range of data we received
      console.log('🔄 [useLiveChart] Converted and sorted data:', {
        originalCount: response.candles.length,
        convertedCount: convertedData.length,
        firstCandle: {
          time: convertedData[0]?.time,
          date: convertedData[0] ? new Date(convertedData[0].time * 1000).toISOString() : 'null',
          localDate: convertedData[0] ? new Date(convertedData[0].time * 1000).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : 'null'
        },
        lastCandle: {
          time: convertedData[convertedData.length - 1]?.time,
          date: convertedData[convertedData.length - 1] ? new Date(convertedData[convertedData.length - 1].time * 1000).toISOString() : 'null',
          localDate: convertedData[convertedData.length - 1] ? new Date(convertedData[convertedData.length - 1].time * 1000).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : 'null'
        }
      });

      // Validate data before setting
      if (convertedData.length === 0) {
        throw new Error(`No valid data points received for ${currentSymbol}`);
      }
      
      // Additional validation: check for reasonable price values
      const lastConvertedCandle = convertedData[convertedData.length - 1];
      const firstConvertedCandle = convertedData[0];
      
      // Check for suspicious price values (likely old data from different stock)
      // REMOVED: Hardcoded price range validation that was too restrictive
      // OLD: if (lastCandle.close < 100 || lastCandle.close > 100000)
      
      // NEW: Smart validation that checks for data consistency and reasonable relationships
      let validationErrors: string[] = [];
      
      // Check OHLC logic consistency
      if (lastConvertedCandle.high < lastConvertedCandle.low) {
        validationErrors.push('High < Low in last candle');
      }
      if (lastConvertedCandle.high < Math.max(lastConvertedCandle.open, lastConvertedCandle.close)) {
        validationErrors.push('High < max(Open, Close) in last candle');
      }
      if (lastConvertedCandle.low > Math.min(lastConvertedCandle.open, lastConvertedCandle.close)) {
        validationErrors.push('Low > min(Open, Close) in last candle');
      }
      
      // Check for reasonable price relationships (not absolute values)
      const priceRange = Math.abs(lastConvertedCandle.close - firstConvertedCandle.close);
      const avgPrice = (lastConvertedCandle.close + firstConvertedCandle.close) / 2;
      const priceChangePercent = (priceRange / avgPrice) * 100;
      
      // Log price information for debugging
      console.log(`🔍 [useLiveChart] Price analysis for ${currentSymbol}:`, {
        lastClose: lastConvertedCandle.close,
        firstClose: firstConvertedCandle.close,
        priceRange,
        avgPrice,
        priceChangePercent: priceChangePercent.toFixed(2) + '%'
      });
      
      // Check for extreme price changes (likely data corruption)
      if (priceChangePercent > 1000) { // More than 1000% change
        validationErrors.push(`Extreme price change: ${priceChangePercent.toFixed(2)}%`);
      }
      
      // Check for negative prices (invalid)
      if (lastConvertedCandle.close < 0 || firstConvertedCandle.close < 0) {
        validationErrors.push('Negative prices detected');
      }
      
      // Check for zero prices (invalid)
      if (lastConvertedCandle.close === 0 || firstConvertedCandle.close === 0) {
        validationErrors.push('Zero prices detected');
      }
      
      if (validationErrors.length > 0) {
        console.warn(`⚠️ [useLiveChart] Validation errors for ${currentSymbol}:`, validationErrors);
        throw new Error(`Invalid price data received for ${currentSymbol}. Please try again.`);
      }
      
      console.log('✅ [useLiveChart] Data validation passed for', currentSymbol);
      
      // Limit data points for performance - take the MOST RECENT candles
      // Since data is sorted chronologically (oldest first), slice(-N) gives us the newest N
      const limitedData = convertedData.slice(-maxDataPoints);
      
      // Log what we're keeping vs discarding
      if (convertedData.length > maxDataPoints) {
        const discardedCount = convertedData.length - maxDataPoints;
        console.log(`⚠️ [useLiveChart] Discarding ${discardedCount} older candles, keeping ${maxDataPoints} most recent`);
        console.log(`📊 [useLiveChart] Data range after limiting:`, {
          firstKept: {
            time: limitedData[0].time,
            date: new Date(limitedData[0].time * 1000).toISOString(),
            localDate: new Date(limitedData[0].time * 1000).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
          },
          lastKept: {
            time: limitedData[limitedData.length - 1].time,
            date: new Date(limitedData[limitedData.length - 1].time * 1000).toISOString(),
            localDate: new Date(limitedData[limitedData.length - 1].time * 1000).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
          },
          firstDiscarded: {
            time: convertedData[0].time,
            date: new Date(convertedData[0].time * 1000).toISOString(),
            localDate: new Date(convertedData[0].time * 1000).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
          }
        });
      } else {
        console.log(`✅ [useLiveChart] All ${convertedData.length} candles fit within limit of ${maxDataPoints}`);
      }
      
      // Final gap analysis after limiting data
      const finalLastCandle = limitedData[limitedData.length - 1];
      const finalNow = new Date();
      const finalNowTimestamp = Math.floor(finalNow.getTime() / 1000);
      let finalGapAnalysis: any = {};
      
      if (finalLastCandle) {
        const finalLastCandleDate = new Date(finalLastCandle.time * 1000);
        const finalTimeDiff = finalNowTimestamp - finalLastCandle.time;
        const finalMinutesDiff = finalTimeDiff / 60;
        const finalHoursDiff = finalTimeDiff / 3600;
        
        const intervalMapping: Record<string, string> = {
          '1m': '1min',
          '5m': '5min',
          '15m': '15min',
          '1h': '60min',
          '1d': '1day'
        };
        const expectedIntervalSeconds: Record<string, number> = {
          '1min': 60,
          '5min': 300,
          '15min': 900,
          '60min': 3600,
          '1day': 86400
        };
        const backendInterval = intervalMapping[currentTimeframe] || currentTimeframe;
        const intervalSeconds = expectedIntervalSeconds[backendInterval] || 86400;
        
        finalGapAnalysis = {
          lastCandleTimestamp: finalLastCandle.time,
          lastCandleDate: finalLastCandleDate.toISOString(),
          lastCandleLocalDate: finalLastCandleDate.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
          currentTimestamp: finalNowTimestamp,
          gapSeconds: finalTimeDiff,
          gapMinutes: Math.round(finalMinutesDiff),
          gapHours: Math.round(finalHoursDiff * 10) / 10,
          isLastCandleToday: finalLastCandleDate.toDateString() === finalNow.toDateString(),
          expectedIntervalSeconds: intervalSeconds,
          isGapSignificant: finalTimeDiff > intervalSeconds * 2,
          estimatedMissingCandles: Math.floor(finalTimeDiff / intervalSeconds),
          willWebSocketFillGap: finalTimeDiff <= intervalSeconds * 2
        };
      }
      
      console.log('📊 [useLiveChart] Historical data loaded successfully:', {
        symbol: currentSymbol,
        timeframe: currentTimeframe,
        dataPoints: limitedData.length,
        firstCandle: limitedData[0],
        lastCandle: finalLastCandle,
        finalGapAnalysis
      });
      
      // Expanded final gap analysis logging
      if (finalGapAnalysis.lastCandleTimestamp) {
        console.log('⏰ [useLiveChart] FINAL GAP ANALYSIS (After Limiting Data):', {
          'Last Candle Time': finalGapAnalysis.lastCandleLocalDate,
          'Current Time': new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
          'Gap (seconds)': finalGapAnalysis.gapSeconds,
          'Gap (minutes)': finalGapAnalysis.gapMinutes,
          'Gap (hours)': finalGapAnalysis.gapHours,
          'Is Last Candle Today?': finalGapAnalysis.isLastCandleToday,
          'Expected Interval (seconds)': finalGapAnalysis.expectedIntervalSeconds,
          'Is Gap Significant?': finalGapAnalysis.isGapSignificant,
          'Estimated Missing Candles': finalGapAnalysis.estimatedMissingCandles,
          'Will WebSocket Fill Gap?': finalGapAnalysis.willWebSocketFillGap
        });
        
        // Log a clear summary
        console.log(`📊 FINAL GAP SUMMARY: ${finalGapAnalysis.gapHours.toFixed(1)} hours (${finalGapAnalysis.estimatedMissingCandles} candles missing) - ${finalGapAnalysis.isLastCandleToday ? 'Last candle is from TODAY ✅' : 'Last candle is NOT from today ⚠️'} - ${finalGapAnalysis.willWebSocketFillGap ? 'WebSocket will fill gap ✅' : 'Gap too large for WebSocket ⚠️'}`);
      }
      
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

      // Map frontend timeframe to backend format for WebSocket subscription
      // Handle both frontend format ('1m', '5m', etc.) and backend format ('1min', '5min', etc.)
      const currentTimeframe = timeframeRef.current;
      let backendTimeframe: string;
      
      // First, try mapping from frontend format
      if (INTERVAL_MAPPING[currentTimeframe as keyof typeof INTERVAL_MAPPING]) {
        backendTimeframe = INTERVAL_MAPPING[currentTimeframe as keyof typeof INTERVAL_MAPPING];
      } else {
        // Check if it's already in backend format
        const backendFormats = ['1min', '5min', '15min', '60min', '1day'];
        if (backendFormats.includes(currentTimeframe)) {
          backendTimeframe = currentTimeframe;
        } else {
          // Fallback to daily if format is unrecognized
          backendTimeframe = '1day';
        }
      }

      console.log('🔌 [useLiveChart] Connecting WebSocket with:', {
        symbol: symbolRef.current,
        frontendTimeframe: currentTimeframe,
        backendTimeframe: backendTimeframe,
        timeframes: [backendTimeframe]
      });

      wsRef.current = await liveDataService.connectWebSocket(
        [symbolRef.current], // Send symbol instead of token
        (wsData: WebSocketMessage) => {
          // console.log('📨 useLiveChart received WebSocket message:', wsData.type);
          // console.log('📨 Full wsData structure:', wsData);
          // console.log('📨 wsData.data exists:', !!wsData.data);
          // console.log('📨 wsData.data type:', typeof wsData.data);
          
          // Enhanced message handling with better validation
          // Log all WebSocket messages for debugging
          console.log('📨 [useLiveChart] WebSocket message received:', {
            type: wsData.type,
            hasData: !!wsData.data,
            timeframe: timeframeRef.current,
            timestamp: new Date().toISOString()
          });
          
          if (wsData.type === 'candle' && wsData.data) {
            console.log('🕯️ [useLiveChart] Processing candle data:', {
              candleData: wsData.data,
              timeframe: timeframeRef.current,
              candleTime: wsData.data.start
            });
            try {
              const candleData = wsData.data;
              // WebSocketCandleMessage.data uses 'start' property, not 'time'
              const candleTime = candleData.start;
              
              if (candleData && typeof candleData.open === 'number' && typeof candleTime === 'number') {
                setState(prev => {
                  const newData = [...prev.data];
                  
                  // Calculate expected interval in seconds based on current timeframe
                  const intervalSeconds: Record<string, number> = {
                    '1min': 60,
                    '5min': 300,
                    '15min': 900,
                    '60min': 3600,
                    '1day': 86400
                  };
                  
                  // Map timeframe to backend format (handle both frontend and backend formats)
                  const currentTimeframe = timeframeRef.current;
                  let currentBackendTimeframe: string;
                  if (INTERVAL_MAPPING[currentTimeframe as keyof typeof INTERVAL_MAPPING]) {
                    currentBackendTimeframe = INTERVAL_MAPPING[currentTimeframe as keyof typeof INTERVAL_MAPPING];
                  } else {
                    const backendFormats = ['1min', '5min', '15min', '60min', '1day'];
                    currentBackendTimeframe = backendFormats.includes(currentTimeframe) ? currentTimeframe : '1day';
                  }
                  const expectedInterval = intervalSeconds[currentBackendTimeframe] || 86400;
                  
                  // Convert WebSocket candle data to LiveChartData format
                  // Map 'start' to 'time' for consistency with chart data format
                  const liveChartData: LiveChartData = {
                    date: new Date(candleTime * 1000).toISOString(),
                    time: candleTime,
                    open: candleData.open,
                    high: candleData.high,
                    low: candleData.low,
                    close: candleData.close,
                    volume: candleData.volume
                  };
                  
                  // Get the last historical candle for comparison
                  const lastHistoricalCandle = newData.length > 0 ? newData[newData.length - 1] : null;
                  
                  // Check gap between last historical candle and this WebSocket candle
                  let gapInfo: any = {};
                  if (lastHistoricalCandle) {
                    const timeDiff = candleTime - lastHistoricalCandle.time;
                    gapInfo = {
                      lastHistoricalTimestamp: lastHistoricalCandle.time,
                      lastHistoricalDate: new Date(lastHistoricalCandle.time * 1000).toISOString(),
                      websocketCandleTimestamp: candleTime,
                      websocketCandleDate: new Date(candleTime * 1000).toISOString(),
                      gapSeconds: timeDiff,
                      gapMinutes: Math.round(timeDiff / 60),
                      gapHours: Math.round(timeDiff / 3600 * 10) / 10,
                      expectedInterval,
                      isExactMatch: timeDiff === 0,
                      isNewer: timeDiff > 0,
                      isOlder: timeDiff < 0
                    };
                  }
                  
                  // Smart candle matching logic:
                  // 1. If exact timestamp match with last candle: Update/merge (discard duplicate)
                  // 2. If WebSocket candle is newer: Append (during market hours, new candle)
                  // 3. Otherwise: Use interval-based matching for other cases
                  
                  if (lastHistoricalCandle && candleTime === lastHistoricalCandle.time) {
                    // Exact timestamp match: Update the last candle with WebSocket data (more recent)
                    // This handles the case where historical data and WebSocket both have the same candle
                    // Use WebSocket data as it's more up-to-date
                    newData[newData.length - 1] = liveChartData;
                    console.log('🔄 [useLiveChart] Exact timestamp match - Updated last candle with WebSocket data (duplicate handling):', {
                      timestamp: candleTime,
                      candle: liveChartData,
                      timeframe: timeframeRef.current,
                      dataLength: newData.length,
                      gapInfo
                    });
                    
                    // Update dataRef to keep it in sync
                    dataRef.current = newData;
                    
                    return {
                      ...prev,
                      data: newData,
                      lastUpdate: Date.now(),
                      isLive: true,
                      lastTickPrice: liveChartData.close,
                      lastTickTime: candleTime
                    };
                  } else if (lastHistoricalCandle && candleTime > lastHistoricalCandle.time) {
                    // WebSocket candle is newer: Append it (new candle during market hours)
                    newData.push(liveChartData);
                    // Sort by time to maintain chronological order (should already be sorted, but ensure it)
                    newData.sort((a, b) => a.time - b.time);
                    
                    // Limit to maxDataPoints to prevent unbounded growth
                    // Keep the most recent candles
                    const limitedData = newData.length > maxDataPoints 
                      ? newData.slice(-maxDataPoints) 
                      : newData;
                    
                    console.log('➕ [useLiveChart] WebSocket candle is newer - Appended new candle:', {
                      candle: liveChartData,
                      timeframe: timeframeRef.current,
                      dataLength: limitedData.length,
                      expectedInterval,
                      maxDataPoints,
                      gapInfo
                    });
                    
                    // Update dataRef to keep it in sync
                    dataRef.current = limitedData;
                    
                    return {
                      ...prev,
                      data: limitedData,
                      lastUpdate: Date.now(),
                      isLive: true,
                      lastTickPrice: liveChartData.close,
                      lastTickTime: candleTime
                    };
                  } else {
                    // Use interval-based matching for other cases (candle might be older or in middle of data)
                    // Find candles within the same interval window (allows for small timestamp differences)
                    const existingIndex = newData.findIndex(d => {
                      const timeDiff = Math.abs(d.time - candleTime);
                      // Match if timestamps are within the same interval window
                      // Use 80% of interval as tolerance to account for rounding differences
                      return timeDiff < expectedInterval * 0.8;
                    });
                    
                    if (existingIndex >= 0) {
                      // Update existing candle - use the WebSocket timestamp to maintain consistency
                      newData[existingIndex] = liveChartData;
                      console.log('🔄 [useLiveChart] Interval-based match - Updated existing candle:', {
                        index: existingIndex,
                        candle: liveChartData,
                        timeframe: timeframeRef.current,
                        dataLength: newData.length,
                        gapInfo
                      });
                      
                      // Update dataRef to keep it in sync
                      dataRef.current = newData;
                      
                      return {
                        ...prev,
                        data: newData,
                        lastUpdate: Date.now(),
                        isLive: true,
                        lastTickPrice: liveChartData.close,
                        lastTickTime: candleTime
                      };
                    } else {
                      // No match found: Add new candle
                      newData.push(liveChartData);
                      // Sort by time to maintain chronological order
                      newData.sort((a, b) => a.time - b.time);
                      
                      // Limit to maxDataPoints to prevent unbounded growth
                      // Keep the most recent candles
                      const limitedData = newData.length > maxDataPoints 
                        ? newData.slice(-maxDataPoints) 
                        : newData;
                      
                      console.log('➕ [useLiveChart] No match found - Added new candle:', {
                        candle: liveChartData,
                        timeframe: timeframeRef.current,
                        dataLength: limitedData.length,
                        expectedInterval,
                        maxDataPoints,
                        gapInfo
                      });
                      
                      // Update dataRef to keep it in sync
                      dataRef.current = limitedData;
                      
                      return {
                        ...prev,
                        data: limitedData,
                        lastUpdate: Date.now(),
                        isLive: true,
                        lastTickPrice: liveChartData.close,
                        lastTickTime: candleTime
                      };
                    }
                  }
                });
              }
            } catch (error) {
              // console.error('Error processing candle data:', error);
            }
          } else if (wsData.type === 'tick') {
            console.log('🔍 [useLiveChart] Processing tick data:', {
              tickData: wsData,
              timeframe: timeframeRef.current
            });
            
            try {
              // Handle both direct tick data and nested data structure
              const tickData = (wsData as any).data || wsData;
              const price = parseFloat(tickData.price || tickData.close || tickData.last_price || '0');
              let tickTime = parseFloat(tickData.timestamp || tickData.time || Date.now() / 1000);
              const tickVolume = parseFloat(tickData.volume || tickData.volume_traded || '0') || 0;
              
              // Normalize tick timestamp to seconds if it's in milliseconds
              // Timestamps > 1e12 are likely in milliseconds, convert to seconds
              if (tickTime > 1e12) {
                tickTime = tickTime / 1000;
              }
              
              if (price > 0 && tickTime > 0) {
                console.log('🔄 [useLiveChart] TICK RECEIVED:', { 
                  price, 
                  tickTime, 
                  tickVolume,
                  timeframe: timeframeRef.current,
                  originalData: tickData 
                });
                
                // Update last tick info
                lastTickRef.current = { price, time: tickTime };
                
                setState(prev => {
                  const newData = [...prev.data];
                  
                  // Calculate expected interval in seconds based on current timeframe
                  const intervalSeconds: Record<string, number> = {
                    '1min': 60,
                    '5min': 300,
                    '15min': 900,
                    '60min': 3600,
                    '1day': 86400
                  };
                  // Map timeframe to backend format (handle both frontend and backend formats)
                  const currentTimeframe = timeframeRef.current;
                  let currentBackendTimeframe: string;
                  if (INTERVAL_MAPPING[currentTimeframe as keyof typeof INTERVAL_MAPPING]) {
                    currentBackendTimeframe = INTERVAL_MAPPING[currentTimeframe as keyof typeof INTERVAL_MAPPING];
                  } else {
                    const backendFormats = ['1min', '5min', '15min', '60min', '1day'];
                    currentBackendTimeframe = backendFormats.includes(currentTimeframe) ? currentTimeframe : '1day';
                  }
                  const expectedInterval = intervalSeconds[currentBackendTimeframe] || 86400;
                  
                  if (newData.length > 0) {
                    const lastCandle = newData[newData.length - 1];
                    
                    // Calculate the time window for the last candle
                    const lastCandleStartTime = lastCandle.time;
                    const lastCandleEndTime = lastCandleStartTime + expectedInterval;
                    
                    // Check if tick falls within the last candle's time window
                    const timeDiff = tickTime - lastCandleStartTime;
                    const isWithinWindow = tickTime >= lastCandleStartTime && tickTime < lastCandleEndTime;
                    
                    console.log('🔍 [useLiveChart] Checking tick against candle window:', {
                      tickTime,
                      tickTimeDate: new Date(tickTime * 1000).toISOString(),
                      lastCandleStartTime,
                      lastCandleStartDate: new Date(lastCandleStartTime * 1000).toISOString(),
                      lastCandleEndTime,
                      lastCandleEndDate: new Date(lastCandleEndTime * 1000).toISOString(),
                      timeDiff,
                      expectedInterval,
                      isWithinWindow,
                      timeframe: timeframeRef.current
                    });
                    
                    if (isWithinWindow) {
                      // Update the last candle with new tick data
                      const oldClose = lastCandle.close;
                      
                      newData[newData.length - 1] = {
                        ...lastCandle,
                        close: price,
                        high: Math.max(lastCandle.high, price),
                        low: Math.min(lastCandle.low, price),
                        volume: lastCandle.volume + tickVolume // Accumulate volume
                      };
                      
                      console.log('📊 [useLiveChart] Updated existing candle with tick:', {
                        oldClose,
                        newClose: price,
                        high: newData[newData.length - 1].high,
                        low: newData[newData.length - 1].low,
                        dataLength: newData.length,
                        timeframe: timeframeRef.current
                      });
                      
                      // Update dataRef to keep it in sync
                      dataRef.current = newData;
                      
                      return {
                        ...prev,
                        data: newData,
                        lastUpdate: Date.now(),
                        isLive: true,
                        lastTickPrice: price,
                        lastTickTime: tickTime
                      };
                    } else {
                      // Tick is outside the current candle's time window - create a new candle
                      // Calculate the start time of the interval that contains this tick
                      // Round down to the nearest interval boundary
                      const newCandleStartTime = Math.floor(tickTime / expectedInterval) * expectedInterval;
                      
                      // Check if this new candle timestamp matches the last historical candle
                      // If it does, update the last candle instead of creating a duplicate
                      if (newCandleStartTime === lastCandleStartTime) {
                        // Same candle interval: Update the last candle with tick data
                        const oldClose = lastCandle.close;
                        
                        newData[newData.length - 1] = {
                          ...lastCandle,
                          close: price,
                          high: Math.max(lastCandle.high, price),
                          low: Math.min(lastCandle.low, price),
                          volume: lastCandle.volume + tickVolume
                        };
                        
                        console.log('🔄 [useLiveChart] Tick in same interval as last candle - Updated (duplicate prevention):', {
                          newCandleStartTime,
                          lastCandleStartTime,
                          oldClose,
                          newClose: price,
                          timeframe: timeframeRef.current
                        });
                        
                        // Update dataRef to keep it in sync
                        dataRef.current = newData;
                        
                        return {
                          ...prev,
                          data: newData,
                          lastUpdate: Date.now(),
                          isLive: true,
                          lastTickPrice: price,
                          lastTickTime: tickTime
                        };
                      }
                      
                      console.log('🆕 [useLiveChart] Tick outside current candle window, creating new candle:', {
                        tickTime,
                        tickTimeDate: new Date(tickTime * 1000).toISOString(),
                        lastCandleStartTime,
                        lastCandleEndTime,
                        lastCandleEndDate: new Date(lastCandleEndTime * 1000).toISOString(),
                        expectedInterval,
                        newCandleStartTime,
                        newCandleStartDate: new Date(newCandleStartTime * 1000).toISOString(),
                        timeframe: timeframeRef.current
                      });
                      
                      // Create a new candle for the new interval
                      const newCandle: LiveChartData = {
                        date: new Date(newCandleStartTime * 1000).toISOString(),
                        time: newCandleStartTime,
                        open: price, // Use current price as open (or use last close if available)
                        high: price,
                        low: price,
                        close: price,
                        volume: tickVolume
                      };
                      
                      // If we have a previous candle, use its close as the new candle's open
                      if (newData.length > 0) {
                        newCandle.open = lastCandle.close;
                      }
                      
                      newData.push(newCandle);
                      // Sort by time to maintain chronological order
                      newData.sort((a, b) => a.time - b.time);
                      
                      // Limit to maxDataPoints to prevent unbounded growth
                      // Keep the most recent candles
                      const limitedData = newData.length > maxDataPoints 
                        ? newData.slice(-maxDataPoints) 
                        : newData;
                      
                      console.log('➕ [useLiveChart] Created new candle from tick:', {
                        newCandle,
                        tickTime,
                        newCandleStartTime,
                        expectedInterval,
                        timeframe: timeframeRef.current,
                        newDataLength: newData.length,
                        limitedDataLength: limitedData.length,
                        maxDataPoints,
                        firstCandleTime: limitedData[0]?.time,
                        lastCandleTime: limitedData[limitedData.length - 1]?.time
                      });
                      
                      // Update dataRef to keep it in sync
                      dataRef.current = limitedData;
                      
                      return {
                        ...prev,
                        data: limitedData,
                        lastUpdate: Date.now(),
                        isLive: true,
                        lastTickPrice: price,
                        lastTickTime: tickTime
                      };
                    }
                  } else {
                    // No existing data - create first candle from tick
                    const newCandleStartTime = Math.floor(tickTime / expectedInterval) * expectedInterval;
                    const newCandle: LiveChartData = {
                      date: new Date(newCandleStartTime * 1000).toISOString(),
                      time: newCandleStartTime,
                      open: price,
                      high: price,
                      low: price,
                      close: price,
                      volume: tickVolume
                    };
                    
                    newData.push(newCandle);
                    console.log('🆕 [useLiveChart] Created first candle from tick:', {
                      newCandle,
                      timeframe: timeframeRef.current
                    });
                    
                    // Update dataRef to keep it in sync
                    dataRef.current = newData;
                  
                  return {
                    ...prev,
                    data: newData,
                    lastUpdate: Date.now(),
                    isLive: true,
                    lastTickPrice: price,
                    lastTickTime: tickTime
                  };
                  }
                });
              }
            } catch (error) {
              console.error('❌ [useLiveChart] Error processing tick data:', error);
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
        },
        undefined, // onError
        undefined, // onClose
        [backendTimeframe] // timeframes - pass the mapped timeframe
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