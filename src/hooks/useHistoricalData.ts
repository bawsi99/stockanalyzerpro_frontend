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
const parseAnalysisPeriod = (analysisPeriod?: string | number): number => {
  if (analysisPeriod == null) {
    return 90; // Default to 90 days
  }
  if (typeof analysisPeriod === 'number' && isFinite(analysisPeriod) && analysisPeriod > 0) {
    return Math.floor(analysisPeriod); // Treat numeric as days
  }
  if (typeof analysisPeriod !== 'string') {
    return 90;
  }

  const raw = analysisPeriod.trim();
  const period = raw.toLowerCase();

  // Support compact notations like 1w, 2w, 6m, 1y
  const compactMatch = period.match(/^(\d+)\s*([wmyd])$/i);
  if (compactMatch) {
    const n = parseInt(compactMatch[1], 10);
    const unit = compactMatch[2];
    if (unit === 'y') return n * 365;
    if (unit === 'm') return n * 30;
    if (unit === 'w') return n * 7;
    return n; // 'd'
  }

  // Extract number from string
  const numberMatch = period.match(/(\d+)/);
  const number = numberMatch ? parseInt(numberMatch[1], 10) : 90;
  
  if (period.includes('year')) {
    return number * 365;
  } else if (period.includes('month')) {
    return number * 30;
  } else if (period.includes('week') || period.includes('wk')) {
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
    return 'day';
  }

  // Normalize and sanitize: lowercase, trim, strip trailing commas/spaces
  const key = interval.toLowerCase().trim().replace(/[\s,]+$/g, '');

  // Normalize variants to data_service accepted values
  // Accepted: "minute","3minute","5minute","10minute","15minute","30minute","60minute","day","week","month"
  if (key === '1minute' || key === '1min') return 'minute';
  if (key === '3min') return '3minute';
  if (key === '5min') return '5minute';
  if (key === '10min') return '10minute';
  if (key === '15min' || key === '15minute') return '15minute';
  if (key === '30min' || key === '30minute') return '30minute';
  if (key === '60min' || key === '1h' || key === 'hour' || key === 'hourly' || key === '60minute') return '60minute';
  if (key === '1d' || key === 'd' || key === 'daily' || key === '1day') return 'day';
  if (key === '1w' || key === 'w' || key === 'weekly' || key === '1week') return 'week';
  if (key === '1m' || key === 'monthly' || key === '1month') return 'month';

  // Already accepted or fallback
  const accepted = new Set([
    'minute','3minute','5minute','10minute','15minute','30minute','60minute','day','week','month'
  ]);
  return accepted.has(key) ? key : 'day';
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
  exchange: string = 'NSE',
  endDate?: string
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
      } else if (mappedInterval === '60minute') {
        limit = days * 24; // 24 hours per day
      }

      // Build API URL
      // If explicit endDate (YYYY-MM-DD) is provided, hit end_date-based window; otherwise, use limit-based.
      let url: string;
      const trimmedEnd = (endDate || '').trim();
      if (trimmedEnd) {
        url = `${DATA_SERVICE_URL}/stock/${encodeURIComponent(symbol)}/history?interval=${mappedInterval}&exchange=${exchange}&period=${days}&end_date=${encodeURIComponent(trimmedEnd)}`;
      } else {
        url = `${DATA_SERVICE_URL}/stock/${encodeURIComponent(symbol)}/history?interval=${mappedInterval}&exchange=${exchange}&limit=${limit}`;
      }
      
      console.log('[useHistoricalData] request', {
        symbol,
        mappedInterval,
        exchange,
        days,
        endDate: trimmedEnd || null,
        url,
        branch: trimmedEnd ? 'end_date+period' : 'limit'
      });
      
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
  }, [symbol, analysisPeriod, interval, exchange, endDate]);

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