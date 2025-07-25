/**
 * @deprecated This component has been archived and is no longer in use.
 * The optimized chart functionality has been integrated into the unified Charts page.
 * See: frontend/src/pages/Charts.tsx for the current implementation.
 * 
 * Archived on: 2024-07-25
 * Reason: Consolidated into unified chart system
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createChart, IChartApi, CandlestickData, HistogramData, UTCTimestamp } from 'lightweight-charts';
import { apiService, CandleData } from '@/services/api';

interface OptimizedChartProps {
  symbol: string;
  timeframe: string;
  exchange?: string;
  height?: number;
  width?: number;
  theme?: 'light' | 'dark';
  showVolume?: boolean;
  showIndicators?: boolean;
  enableLive?: boolean;
  autoConnect?: boolean;
  testMode?: boolean;
}

export function OptimizedChart({
  symbol,
  timeframe,
  exchange = 'NSE',
  height = 600,
  width = 800,
  theme = 'light',
  showVolume = true,
  showIndicators = true,
  enableLive = true,
  autoConnect = true,
  testMode = false
}: OptimizedChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<any>(null);
  const volumeSeriesRef = useRef<any>(null);
  const [chartError, setChartError] = useState<string | null>(null);
  
  const [data, setData] = useState<CandleData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(0);

  // Convert frontend timeframe to backend-compatible timeframe
  const getBackendTimeframe = (frontendTimeframe: string): string => {
    const timeframeMap: { [key: string]: string } = {
      '1d': '1day',
      '1h': '1h',
      '5min': '5min',
      '15min': '15min',
      '30min': '30min',
      '1min': '1min',
      '3min': '3min',
      '10min': '10min',
      '60min': '1h'
    };
    return timeframeMap[frontendTimeframe] || frontendTimeframe;
  };

  // Load historical data
  const loadHistoricalData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const backendTimeframe = getBackendTimeframe(timeframe);
      const response = await apiService.getHistoricalData(symbol, backendTimeframe, exchange, 1000);
      setData(response.candles);
      setLastUpdate(Date.now());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load data';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [symbol, timeframe, exchange]);

  // Load data on mount and when dependencies change
  useEffect(() => {
    loadHistoricalData();
  }, [loadHistoricalData]);

  // Refetch function for external use
  const refetch = useCallback(() => {
    loadHistoricalData();
  }, [loadHistoricalData]);

  // Connect function (placeholder for live data)
  const connect = useCallback(() => {
    console.log('Connect function called - live data not implemented yet');
    setIsConnected(true);
    setIsLive(true);
  }, []);

  // Disconnect function (placeholder for live data)
  const disconnect = useCallback(() => {
    console.log('Disconnect function called - live data not implemented yet');
    setIsConnected(false);
    setIsLive(false);
  }, []);

  // Initialize chart
  useEffect(() => {
    if (!chartRef.current) return;

    try {
      chartInstance.current = createChart(chartRef.current, {
        width,
        height,
        layout: {
          background: { color: theme === 'dark' ? '#1e1e1e' : '#ffffff' },
          textColor: theme === 'dark' ? '#ffffff' : '#000000',
        },
        grid: {
          vertLines: { color: theme === 'dark' ? '#2B2B43' : '#e1e3e6' },
          horzLines: { color: theme === 'dark' ? '#2B2B43' : '#e1e3e6' },
        },
        timeScale: {
          timeVisible: true,
          secondsVisible: false,
          rightOffset: 12,
          barSpacing: 3,
          fixLeftEdge: true,
          lockVisibleTimeRangeOnResize: true,
          rightBarStaysOnScroll: true,
          borderVisible: false,
          visible: true,
          tickMarkFormatter: (time: number) => {
            try {
              // Convert UTC timestamp to IST (UTC+5:30)
              const utcDate = new Date(time * 1000);
              const istDate = new Date(utcDate.getTime() + (5.5 * 60 * 60 * 1000)); // Add 5.5 hours for IST
              const now = new Date();
              const isToday = istDate.toDateString() === now.toDateString();
              
              // Format based on timeframe
              if (timeframe === '1d' || timeframe === '1day') {
                // For daily data, show date
                return istDate.toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric',
                  year: isToday ? undefined : '2-digit'
                });
              } else if (timeframe === '1h' || timeframe === '60min') {
                // For hourly data, show time
                return istDate.toLocaleTimeString('en-US', { 
                  hour: 'numeric', 
                  minute: '2-digit',
                  hour12: true
                });
              } else {
                // For other timeframes, show date and time
                return istDate.toLocaleString('en-US', { 
                  month: 'short', 
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true
                });
              }
            } catch (error) {
              console.error('Error formatting time:', error, 'time:', time);
              return new Date(time * 1000).toLocaleDateString();
            }
          },
        },
      });

      // Add candle series
      candleSeriesRef.current = chartInstance.current.addCandlestickSeries({
        upColor: '#26a69a',
        downColor: '#ef5350',
        borderVisible: false,
        wickUpColor: '#26a69a',
        wickDownColor: '#ef5350',
      });

      // Add volume series if enabled
      if (showVolume) {
        volumeSeriesRef.current = chartInstance.current.addHistogramSeries({
          color: '#26a69a',
          priceFormat: { type: 'volume' },
          priceScaleId: '',
          scaleMargins: {
            top: 0.8,
            bottom: 0,
          },
        });
      }

      setChartError(null);
    } catch (error) {
      console.error('Error initializing chart:', error);
      setChartError('Failed to initialize chart');
    }

    return () => {
      try {
        if (chartInstance.current) {
          chartInstance.current.remove();
        }
      } catch (error) {
        console.error('Error cleaning up chart:', error);
      }
    };
  }, [width, height, theme, showVolume]);

  // Update chart data
  useEffect(() => {
    if (!chartInstance.current || !data.length || chartError) return;

    try {
      // Convert data to chart format - API already returns correct format
      const candleData: CandlestickData[] = data.map(d => ({
        time: d.time as UTCTimestamp,
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
      }));

      const volumeData: HistogramData[] = data.map(d => ({
        time: d.time as UTCTimestamp,
        value: d.volume,
        color: d.close >= d.open ? '#26a69a' : '#ef5350',
      }));

      // Update candle series
      if (candleSeriesRef.current) {
        candleSeriesRef.current.setData(candleData);
      }

      // Update volume series
      if (showVolume && volumeSeriesRef.current) {
        volumeSeriesRef.current.setData(volumeData);
      }

      // Fit content to view
      chartInstance.current.timeScale().fitContent();
    } catch (error) {
      console.error('Error updating chart data:', error);
      setChartError('Failed to update chart data');
    }

  }, [data, showVolume, chartError]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (chartInstance.current && chartRef.current && !chartError) {
        try {
          const rect = chartRef.current.getBoundingClientRect();
          chartInstance.current.applyOptions({
            width: rect.width,
            height: rect.height,
          });
        } catch (error) {
          console.error('Error resizing chart:', error);
        }
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [chartError]);

  // Test mode - show mock data
  if (testMode) {
    return (
      <div className="flex items-center justify-center" style={{ height, width }}>
        <div className="text-center">
          <div className="text-green-500 text-4xl mb-4">✅</div>
          <p className="text-gray-600 mb-2">OptimizedChart Component</p>
          <p className="text-sm text-gray-500 mb-4">Test Mode Active</p>
          <div className="space-y-2 text-xs text-left">
            <p><strong>Symbol:</strong> {symbol}</p>
            <p><strong>Timeframe:</strong> {timeframe}</p>
            <p><strong>Exchange:</strong> {exchange}</p>
            <p><strong>Theme:</strong> {theme}</p>
            <p><strong>Live:</strong> {enableLive ? 'Enabled' : 'Disabled'}</p>
            <p><strong>Volume:</strong> {showVolume ? 'Shown' : 'Hidden'}</p>
            <p><strong>Indicators:</strong> {showIndicators ? 'Shown' : 'Hidden'}</p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center" style={{ height, width }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading chart data...</p>
        </div>
      </div>
    );
  }

  if (error || chartError) {
    return (
      <div className="flex items-center justify-center" style={{ height, width }}>
        <div className="text-center">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <p className="text-red-500 mb-2">Error loading data</p>
          <p className="text-sm text-gray-500 mb-4">{error || chartError}</p>
          <button 
            onClick={() => {
              setChartError(null);
              refetch();
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div ref={chartRef} />
      
      {/* Status indicators */}
      <div className="absolute top-2 right-2 flex gap-2">
        {enableLive && (
          <div className={`px-2 py-1 rounded text-xs font-medium ${
            isConnected ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
          }`}>
            {isConnected ? 'LIVE' : 'DISCONNECTED'}
          </div>
        )}
        
        {lastUpdate && (
          <div className="px-2 py-1 rounded text-xs bg-gray-500 text-white">
            {new Date(lastUpdate).toLocaleTimeString()}
          </div>
        )}

        {data.length > 0 && (
          <div className="px-2 py-1 rounded text-xs bg-blue-500 text-white">
            {data.length} candles
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="absolute top-2 left-2 flex gap-2">
        {enableLive && (
          <button
            onClick={isConnected ? disconnect : connect}
            className={`px-2 py-1 rounded text-xs font-medium ${
              isConnected 
                ? 'bg-red-500 text-white hover:bg-red-600' 
                : 'bg-green-500 text-white hover:bg-green-600'
            } transition-colors`}
          >
            {isConnected ? 'Disconnect' : 'Connect'}
          </button>
        )}
        
        <button
          onClick={refetch}
          className="px-2 py-1 rounded text-xs bg-blue-500 text-white hover:bg-blue-600 transition-colors"
        >
          Refresh
        </button>
      </div>
    </div>
  );
} 