import { useEffect, useMemo, useCallback, useRef } from 'react';
import { useDataStore } from '@/stores/dataStore';
import { useLiveChart } from '@/hooks/useLiveChart';
import { liveDataService } from '@/services/liveDataService';

interface UseSmartDataOptions {
  symbol: string;
  timeframe: string;
  exchange?: string;
  limit?: number;
  enableLive?: boolean;
  autoConnect?: boolean;
}

export function useSmartData({
  symbol,
  timeframe,
  exchange = 'NSE',
  limit = 1000,
  enableLive = true,
  autoConnect = true
}: UseSmartDataOptions) {
  const {
    historicalData,
    liveData,
    loadingStates,
    errors,
    fetchHistoricalData,
    updateLiveData
  } = useDataStore();

  // Add ref to track if component is mounted
  const isMountedRef = useRef(true);

  const cacheKey = useMemo(() => 
    `${symbol}-${timeframe}-${exchange}-${limit}`, 
    [symbol, timeframe, exchange, limit]
  );

  const historicalCache = historicalData.get(cacheKey);
  const liveCache = liveData.get(symbol);
  const isLoading = loadingStates.get(cacheKey) || false;
  const error = errors.get(cacheKey);

  // Live data hook
  const liveChartHook = useLiveChart({
    symbol,
    timeframe,
    exchange,
    maxDataPoints: limit,
    autoConnect: enableLive && autoConnect
  });

  // Fetch historical data when needed
  const loadHistoricalData = useCallback(async (forceRefresh = false) => {
    if (!symbol || !isMountedRef.current) return;
    
    try {
      await fetchHistoricalData({
        symbol,
        timeframe,
        exchange,
        limit,
        forceRefresh
      });
    } catch (error) {
      // console.error('Error loading historical data:', error);
    }
  }, [symbol, timeframe, exchange, limit, fetchHistoricalData]);

  // Auto-load historical data
  useEffect(() => {
    if (symbol && !historicalCache && isMountedRef.current) {
      loadHistoricalData();
    }
  }, [symbol, historicalCache, loadHistoricalData]);

  // Update live data in store when received
  useEffect(() => {
    if (liveChartHook.data && liveChartHook.data.length > 0 && isMountedRef.current) {
      updateLiveData(symbol, liveChartHook.data);
    }
  }, [liveChartHook.data, symbol, updateLiveData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Combine historical and live data
  const combinedData = useMemo(() => {
    if (!historicalCache?.data?.candles) return [];
    
    // Convert historical data to the proper format
    const historical = liveDataService.convertToChartData(historicalCache.data.candles);
    
    // Debug: Log the converted data
    if (historical.length > 0) {
      // console.log('�� useSmartData - Converted historical data sample:', {
      //   originalCount: historicalCache.data.candles.length,
      //   convertedCount: historical.length,
      //   firstOriginal: historicalCache.data.candles[0],
      //   firstConverted: historical[0],
      //   lastOriginal: historicalCache.data.candles[historicalCache.data.candles.length - 1],
      //   lastConverted: historical[historical.length - 1]
      // });
    }
    
    if (!enableLive || !liveCache?.data) {
      return historical;
    }
    
    // Merge historical with live data, avoiding duplicates
    const liveDataMap = new Map();
    liveCache.data.forEach(item => {
      liveDataMap.set(item.time, item);
    });
    
    const merged = [...historical];
    liveCache.data.forEach(liveItem => {
      const existingIndex = merged.findIndex(item => item.time === liveItem.time);
      if (existingIndex >= 0) {
        merged[existingIndex] = liveItem; // Update existing
      } else {
        merged.push(liveItem); // Add new
      }
    });
    
    return merged.sort((a, b) => a.time - b.time);
  }, [historicalCache, liveCache, enableLive]);

  return {
    // Data
    data: combinedData,
    historicalData: historicalCache?.data,
    liveData: liveCache?.data,
    
    // States
    isLoading,
    error,
    isLive: liveChartHook.isLive,
    isConnected: liveChartHook.isConnected,
    lastUpdate: liveCache?.lastUpdate || historicalCache?.timestamp,
    
    // Actions
    refetch: () => loadHistoricalData(true),
    clearCache: () => useDataStore.getState().clearCache(symbol),
    
    // Live chart controls
    connect: liveChartHook.connect,
    disconnect: liveChartHook.disconnect,
    updateSymbol: liveChartHook.updateSymbol,
    updateTimeframe: liveChartHook.updateTimeframe
  };
} 