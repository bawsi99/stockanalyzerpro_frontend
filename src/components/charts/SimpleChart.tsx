import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createChart, IChartApi, ISeriesApi, CandlestickData } from 'lightweight-charts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TrendingUp, TrendingDown, Minus, Activity, Wifi, WifiOff, RefreshCw } from 'lucide-react';

interface ChartData {
  date: string;
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface SimpleChartProps {
  symbol: string;
  timeframe: string;
  height?: number;
  width?: number;
  data: ChartData[];
  isLive?: boolean;
  isConnected?: boolean;
  isLoading?: boolean;
  error?: string | null;
  lastUpdate?: number;
  connectionStatus?: any;
  refetch?: () => void;
  onDataUpdate?: (data: ChartData[]) => void;
  onConnectionChange?: (isConnected: boolean) => void;
  onError?: (error: string) => void;
  debug?: boolean;
}

const SimpleChart: React.FC<SimpleChartProps> = ({ 
  symbol,
  timeframe,
  height = 400,
  width = 800,
  data,
  isLive,
  isConnected,
  isLoading,
  error,
  lastUpdate,
  connectionStatus,
  refetch,
  onDataUpdate,
  onConnectionChange,
  onError,
  debug = false
}) => {
  // Refs
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const isMountedRef = useRef(true);
  const lastSymbolRef = useRef(symbol);
  const lastTimeframeRef = useRef(timeframe);

  // State
  const [isChartReady, setIsChartReady] = useState(false);
  const [chartError, setChartError] = useState<string | null>(null);
  const [lastChartUpdate, setLastChartUpdate] = useState(0);

  // Convert data to candlestick format
  const convertToCandlestickData = useCallback((chartData: ChartData[]): CandlestickData[] => {
    return chartData.map(item => ({
      time: item.time as any,
      open: item.open,
      high: item.high,
      low: item.low,
      close: item.close
    }));
  }, []);

  // Cleanup chart
  const cleanupChart = useCallback(() => {
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }
    candlestickSeriesRef.current = null;
    setIsChartReady(false);
  }, []);

  // Initialize chart
  const initializeChart = useCallback(() => {
    console.log('🚀 initializeChart called:', {
      hasContainer: !!chartContainerRef.current,
      isMounted: isMountedRef.current,
      symbol,
      timeframe
    });
    
    if (!chartContainerRef.current || !isMountedRef.current) {
      console.log('❌ Cannot initialize chart - missing container or not mounted');
      return;
    }

    // Check if container has dimensions
    const container = chartContainerRef.current;
    if (container.clientWidth === 0 || container.clientHeight === 0) {
      console.log('❌ Container has no dimensions, retrying in 100ms');
      setTimeout(() => {
        if (isMountedRef.current) {
          initializeChart();
        }
      }, 100);
      return;
    }

    try {
      console.log('🚀 Initializing SimpleChart for:', symbol, timeframe);
      
      // Cleanup existing chart
      cleanupChart();
      
      // Clear container
      chartContainerRef.current.innerHTML = '';
      
      // Create chart
      const chart = createChart(chartContainerRef.current, {
        width: chartContainerRef.current.clientWidth,
        height: chartContainerRef.current.clientHeight,
        layout: {
          background: { color: '#ffffff' },
          textColor: '#333',
        },
        grid: {
          vertLines: { color: '#f0f0f0' },
          horzLines: { color: '#f0f0f0' },
        },
        timeScale: {
          timeVisible: true,
          secondsVisible: false,
          rightOffset: 12,
          barSpacing: 3,
        },
        rightPriceScale: {
          autoScale: true,
          scaleMargins: {
            top: 0.1,
            bottom: 0.1,
          },
        },
        crosshair: {
          mode: 1,
        },
      });

      chartRef.current = chart;

      // Add candlestick series
      candlestickSeriesRef.current = chart.addCandlestickSeries({
        upColor: '#26a69a',
        downColor: '#ef5350',
        borderVisible: false,
        wickUpColor: '#26a69a',
        wickDownColor: '#ef5350',
      });

      setIsChartReady(true);
      setChartError(null);
      
      console.log('✅ Chart initialized successfully');

    } catch (error) {
      console.error('❌ Chart initialization failed:', error);
      setChartError(error instanceof Error ? error.message : 'Chart initialization failed');
      onError?.(error instanceof Error ? error.message : 'Chart initialization failed');
    }
  }, [symbol, timeframe, onError, cleanupChart]);

  // Update chart data
  const updateChartData = useCallback((chartData: ChartData[]) => {
    if (!candlestickSeriesRef.current || !chartData || chartData.length === 0) {
      return;
    }

    try {
      const candlestickData = convertToCandlestickData(chartData);
      
      // Basic validation
      if (candlestickData.length > 0) {
        const lastCandle = candlestickData[candlestickData.length - 1];
        
        // Check for reasonable price values
        if (lastCandle.close < 1 || lastCandle.close > 1000000) {
          console.warn('⚠️ Suspicious price values detected, skipping data:', {
            lastClose: lastCandle.close,
            symbol: symbol
          });
          return;
        }
      }
      
      candlestickSeriesRef.current.setData(candlestickData);
      setLastChartUpdate(Date.now());
      
      console.log('📊 Chart data updated:', {
        symbol: symbol,
        timeframe: timeframe,
        dataPoints: candlestickData.length
      });
      
    } catch (error) {
      console.error('❌ Chart data update failed:', error);
      setChartError(error instanceof Error ? error.message : 'Chart data update failed');
    }
  }, [convertToCandlestickData, symbol, timeframe]);

  // Handle resize
  const handleResize = useCallback(() => {
    if (chartRef.current && chartContainerRef.current) {
      chartRef.current.applyOptions({
        width: chartContainerRef.current.clientWidth,
        height: chartContainerRef.current.clientHeight,
      });
    }
  }, []);

  // Initialize chart on mount
  useEffect(() => {
    isMountedRef.current = true;
    
    // Add a small delay to ensure container is ready
    const timer = setTimeout(() => {
      if (isMountedRef.current) {
        initializeChart();
      }
    }, 100);

    // Add resize listener
    window.addEventListener('resize', handleResize);

    return () => {
      isMountedRef.current = false;
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
      cleanupChart();
    };
  }, [initializeChart, handleResize, cleanupChart]);

  // Handle symbol/timeframe changes
  useEffect(() => {
    if (lastSymbolRef.current !== symbol || lastTimeframeRef.current !== timeframe) {
      console.log('🔄 Symbol/timeframe changed, reinitializing chart');
      lastSymbolRef.current = symbol;
      lastTimeframeRef.current = timeframe;
      initializeChart();
    }
  }, [symbol, timeframe, initializeChart]);

  // Update data when it changes
  useEffect(() => {
    console.log('🔄 SimpleChart data effect triggered:', {
      isChartReady,
      hasData: !!data,
      dataLength: data?.length || 0,
      isLoading,
      symbol,
      timeframe
    });
    
    if (isChartReady && data) {
      if (data.length > 0) {
        console.log('📊 Setting chart data:', data.length, 'points');
        updateChartData(data);
      } else {
        // Clear chart data when data is empty
        console.log('🧹 Clearing chart data - empty data received');
        if (candlestickSeriesRef.current) {
          candlestickSeriesRef.current.setData([]);
        }
      }
    }
  }, [isChartReady, data, updateChartData, isLoading, symbol, timeframe]);

  // Connection Status Component
  const ConnectionStatus = () => {
    if (!isConnected) return null;

    const getStatusIcon = () => {
      if (isLive) return <Activity className="h-4 w-4 text-green-500" />;
      return <Wifi className="h-4 w-4 text-blue-500" />;
    };

    const getStatusText = () => {
      if (isLive) return 'Live';
      return 'Connected';
    };

    return (
      <div className="absolute top-2 right-2 z-10">
        <Badge variant="secondary" className="flex items-center gap-1">
          {getStatusIcon()}
          {getStatusText()}
        </Badge>
      </div>
    );
  };

  // Live Price Display
  const LivePriceDisplay = () => {
    if (!data || data.length === 0) return null;

    const lastCandle = data[data.length - 1];
    const previousCandle = data[data.length - 2];
    
    if (!lastCandle || !previousCandle) return null;

    const currentPrice = lastCandle.close;
    const previousPrice = previousCandle.close;
    const priceChange = currentPrice - previousPrice;
    const priceChangePercent = (priceChange / previousPrice) * 100;

    const getPriceColor = () => {
      if (priceChange > 0) return 'text-green-600';
      if (priceChange < 0) return 'text-red-600';
      return 'text-gray-600';
    };

    const getPriceIcon = () => {
      if (priceChange > 0) return <TrendingUp className="h-4 w-4" />;
      if (priceChange < 0) return <TrendingDown className="h-4 w-4" />;
      return <Minus className="h-4 w-4" />;
    };

    return (
      <div className="absolute top-2 left-2 z-10">
        <div className={`flex items-center gap-2 ${getPriceColor()}`}>
          {getPriceIcon()}
          <span className="font-semibold">₹{currentPrice.toFixed(2)}</span>
          <span className="text-sm">
            {priceChange > 0 ? '+' : ''}{priceChange.toFixed(2)} ({priceChangePercent > 0 ? '+' : ''}{priceChangePercent.toFixed(2)}%)
          </span>
        </div>
      </div>
    );
  };

  // Control Buttons
  const ControlButtons = () => (
    <div className="absolute bottom-2 right-2 z-10 flex gap-2">
      {refetch && (
        <Button
          size="sm"
          variant="outline"
          onClick={refetch}
          className="h-8 w-8 p-0"
          title="Refresh data"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      )}
    </div>
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="relative w-full h-full">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <p className="text-gray-600 text-sm">Loading chart data...</p>
            <p className="text-xs text-gray-500">{symbol} - {timeframe}</p>
          </div>
        </div>
        <ControlButtons />
      </div>
    );
  }

  // No data state
  if (!data || data.length === 0) {
    return (
      <div className="relative w-full h-full">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <p className="text-gray-600">No data available</p>
            <p className="text-sm text-gray-500">{symbol} - {timeframe}</p>
            {refetch && (
              <Button 
                onClick={refetch} 
                className="mt-4"
                variant="outline"
              >
                Refresh
              </Button>
            )}
          </div>
        </div>
        <ControlButtons />
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <LivePriceDisplay />
      <ConnectionStatus />
      
      {/* Chart container */}
      <div 
        className="w-full h-full bg-white border border-gray-200 relative" 
        style={{ 
          minHeight: `${height}px`,
          minWidth: `${width}px`
        }}
      >
        {/* Debug info */}
        {debug && (
          <div className="absolute top-2 left-2 z-10 bg-black bg-opacity-75 text-white text-xs p-2 rounded">
            <div>Chart Ready: {isChartReady ? 'Yes' : 'No'}</div>
            <div>Has Chart: {chartRef.current ? 'Yes' : 'No'}</div>
            <div>Has Series: {candlestickSeriesRef.current ? 'Yes' : 'No'}</div>
            <div>Data Points: {data ? data.length : 0}</div>
            <div>Container Size: {chartContainerRef.current ? `${chartContainerRef.current.clientWidth}x${chartContainerRef.current.clientHeight}` : 'N/A'}</div>
            <div>Last Update: {new Date(lastChartUpdate).toLocaleTimeString()}</div>
          </div>
        )}
        
        {/* Chart container */}
        <div 
          ref={chartContainerRef} 
          className="w-full h-full"
          style={{ 
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0
          }}
        />
        
        {/* Loading overlay */}
        {!isChartReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 z-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
              <p className="text-gray-600 text-sm">Initializing chart...</p>
              <p className="text-xs text-gray-500">{data.length} data points available</p>
            </div>
          </div>
        )}
      </div>
      
      <ControlButtons />
      
      {error && (
        <Alert variant="destructive" className="absolute bottom-16 left-2 right-2 z-10">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default SimpleChart; 