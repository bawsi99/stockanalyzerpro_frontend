import { useState, useEffect, useCallback } from 'react';
import { DATA_SERVICE_URL } from '@/config';

interface HistoricalDataPoint {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface HistoricalDataResponse {
  success: boolean;
  symbol: string;
  exchange: string;
  interval: string;
  token: string;
  candles: HistoricalDataPoint[];
  count: number;
  timestamp: string;
}

interface UseHistoricalDataResult {
  data: HistoricalDataResponse | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Parse analysis period string to number of days
 * Examples: "90 days" -> 90, "1 year" -> 365, "6 months" -> 180
 */
const parseAnalysisPeriod = (analysisPeriod?: string): number => {
  if (!analysisPeriod || typeof analysisPeriod !== 'string') {
    return 90; // Default to 90 days
  }

  const period = analysisPeriod.toLowerCase().trim();
  
  // Extract number from string
  const numberMatch = period.match(/(\d+)/);
  const number = numberMatch ? parseInt(numberMatch[1], 10) : 90;
  
  if (period.includes('year')) {
    return number * 365;
  } else if (period.includes('month')) {
    return number * 30;
  } else if (period.includes('week')) {
    return number * 7;
  } else {
    // Default to days
    return number;
  }
};

/**
 * Map frontend interval to data service interval format
 * Examples: "day" -> "1day", "1d" -> "1day", "hour" -> "1h"
 */
const mapInterval = (interval?: string): string => {
  if (!interval || typeof interval !== 'string') {
    return '1day';
  }

  const intervalMap: Record<string, string> = {
    'day': '1day',
    '1d': '1day',
    'd': '1day',
    'daily': '1day',
    'hour': '1h',
    '1h': '1h',
    'h': '1h',
    'hourly': '1h',
    '30min': '30min',
    '15min': '15min',
    '5min': '5min',
    '1min': '1min'
  };

  return intervalMap[interval.toLowerCase()] || '1day';
};

/**
 * Custom hook to fetch historical data from the data service
 * @param symbol - Stock symbol (e.g., "RELIANCE")
 * @param analysisPeriod - Analysis period string (e.g., "90 days")
 * @param interval - Data interval (e.g., "day", "1d")
 * @param exchange - Stock exchange (default: "NSE")
 */
export const useHistoricalData = (
  symbol: string,
  analysisPeriod?: string,
  interval?: string,
  exchange: string = 'NSE'
): UseHistoricalDataResult => {
  const [data, setData] = useState<HistoricalDataResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!symbol) {
      setError('Symbol is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Parse parameters
      const days = parseAnalysisPeriod(analysisPeriod);
      const mappedInterval = mapInterval(interval);
      
      // Calculate appropriate limit based on interval and period
      let limit = days;
      if (mappedInterval.includes('min')) {
        // For minute data, we need more data points
        const minutesPerDay = mappedInterval === '1min' ? 1440 : 
                             mappedInterval === '5min' ? 288 :
                             mappedInterval === '15min' ? 96 :
                             mappedInterval === '30min' ? 48 : 1440;
        limit = Math.min(days * minutesPerDay, 10000); // Cap at 10k points for performance
      } else if (mappedInterval === '1h') {
        limit = days * 24; // 24 hours per day
      }

      // Build API URL
      const url = `${DATA_SERVICE_URL}/stock/${encodeURIComponent(symbol)}/history?interval=${mappedInterval}&exchange=${exchange}&limit=${limit}`;
      
      console.log(`📊 Fetching historical data: ${symbol} (${days} days, ${mappedInterval})`);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: HistoricalDataResponse = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch historical data');
      }

      if (!result.candles || result.candles.length === 0) {
        throw new Error('No historical data available for this symbol');
      }

      console.log(`✅ Historical data loaded: ${result.candles.length} data points`);
      setData(result);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch historical data';
      console.error('❌ Historical data fetch error:', errorMessage);
      setError(errorMessage);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [symbol, analysisPeriod, interval, exchange]);

  // Fetch data when dependencies change
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData
  };
};