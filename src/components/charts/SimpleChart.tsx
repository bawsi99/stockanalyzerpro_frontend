import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createChart, IChartApi, ISeriesApi, CandlestickData } from 'lightweight-charts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TrendingUp, TrendingDown, Minus, Activity, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { formatCurrency, formatPercentage, formatPriceChange } from '@/utils/numberFormatter';

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
  width = 1200,
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
    // console.log('🚀 initializeChart called:', {
    //   hasContainer: !!chartContainerRef.current,
    //   isMounted: isMountedRef.current,
    //   symbol,
    //   timeframe
    // });
    
    if (!chartContainerRef.current || !isMountedRef.current) {
      // console.log('❌ Cannot initialize chart - missing container or not mounted');
      return;
    }

    // Check if container has dimensions with comprehensive validation
    const container = chartContainerRef.current;
    const rect = container.getBoundingClientRect();
    const hasWidth = container.clientWidth > 0 || container.offsetWidth > 0 || rect.width > 0;
    const hasHeight = container.clientHeight > 0 || container.offsetHeight > 0 || rect.height > 0;
    
    if (!hasWidth || !hasHeight) {
      // console.log('❌ Container has no dimensions, retrying in 100ms', {
      //   clientWidth: container.clientWidth,
      //   clientHeight: container.clientHeight,
      //   offsetWidth: container.offsetWidth,
      //   offsetHeight: container.offsetHeight,
      //   rectWidth: rect.width,
      //   rectHeight: rect.height
      // });
      setTimeout(() => {
        if (isMountedRef.current) {
          initializeChart();
        }
      }, 100);
      return;
    }

    try {
      // console.log('🚀 Initializing SimpleChart for:', symbol, timeframe);
      
      // Cleanup existing chart
      cleanupChart();
      
      // Clear container
      chartContainerRef.current.innerHTML = '';
      
      // Create chart with actual container dimensions
      const chart = createChart(chartContainerRef.current, {
        width: chartContainerRef.current.clientWidth || chartContainerRef.current.offsetWidth || chartContainerRef.current.getBoundingClientRect().width,
        height: chartContainerRef.current.clientHeight || chartContainerRef.current.offsetHeight || chartContainerRef.current.getBoundingClientRect().height,
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
          tickMarkFormatter: (time: number) => {
            const date = new Date(time * 1000);
            
            // For 1-day interval, show only date
            if (timeframe === '1d' || timeframe === '1day') {
              return date.toLocaleDateString('en-IN', { 
                timeZone: 'Asia/Kolkata',
                month: 'short', 
                day: 'numeric',
                year: 'numeric'
              });
            } else if (timeframe === '1h' || timeframe === '60min' || timeframe === '60minute') {
              // For hourly intervals, show date and full time
              return date.toLocaleDateString('en-IN', { 
                timeZone: 'Asia/Kolkata',
                month: 'short', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
              });
            } else {
              // For minute intervals, show date and time
              return date.toLocaleDateString('en-IN', { 
                timeZone: 'Asia/Kolkata',
                month: 'short', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
              });
            }
          },
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
        localization: {
          timeFormatter: (time: number) => {
            // Convert UTC time to IST for display
            const utcDate = new Date(time * 1000);
            
            // For 1-day interval, show only date
            if (timeframe === '1d' || timeframe === '1day') {
              return utcDate.toLocaleDateString('en-IN', { 
                timeZone: 'Asia/Kolkata',
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
              });
            } else if (timeframe === '1h' || timeframe === '60min' || timeframe === '60minute') {
              // For hourly intervals, show date and full time
              return utcDate.toLocaleDateString('en-IN', { 
                timeZone: 'Asia/Kolkata',
                month: 'short', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
              });
            } else {
              // For other intervals, show time
              return utcDate.toLocaleTimeString('en-IN', { 
                timeZone: 'Asia/Kolkata',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
              });
            }
          },
          priceFormatter: (price: number) => {
            return price >= 1 ? price.toFixed(2) : price.toPrecision(4);
          },
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
      
      // console.log('✅ Chart initialized successfully');

    } catch (error) {
      // console.error('❌ Chart initialization failed:', error);
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
        
        // Check for reasonable price values - REMOVED overly restrictive range check
        // OLD: if (lastCandle.close < 1 || lastCandle.close > 1000000)
        
        // NEW: Smart validation that checks for data consistency
        let isValidData = true;
        
        // Check OHLC logic consistency
        if (lastCandle.high < lastCandle.low) {
          console.warn('⚠️ Invalid OHLC in SimpleChart: High < Low for', symbol);
          isValidData = false;
        }
        if (lastCandle.high < Math.max(lastCandle.open, lastCandle.close)) {
          console.warn('⚠️ Invalid OHLC in SimpleChart: High < max(Open, Close) for', symbol);
          isValidData = false;
        }
        if (lastCandle.low > Math.min(lastCandle.open, lastCandle.close)) {
          console.warn('⚠️ Invalid OHLC in SimpleChart: Low > min(Open, Close) for', symbol);
          isValidData = false;
        }
        
        // Check for negative or zero prices (invalid)
        if (lastCandle.close < 0 || lastCandle.close === 0) {
          console.warn('⚠️ Invalid price in SimpleChart: Non-positive close price for', symbol);
          isValidData = false;
        }
        
        if (!isValidData) {
          console.warn('⚠️ Data validation failed in SimpleChart for', symbol, '- skipping chart update');
          return;
        }
      }
      
      candlestickSeriesRef.current.setData(candlestickData);
      setLastChartUpdate(Date.now());
      
      // console.log('📊 Chart data updated:', {
      //   symbol: symbol,
      //   timeframe: timeframe,
      //   dataPoints: candlestickData.length
      // });
      
    } catch (error) {
      // console.error('❌ Chart data update failed:', error);
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
      // console.log('🔄 Symbol/timeframe changed, reinitializing chart');
      lastSymbolRef.current = symbol;
      lastTimeframeRef.current = timeframe;
      initializeChart();
    }
  }, [symbol, timeframe, initializeChart]);

  // Update data when it changes
  useEffect(() => {
    // console.log('🔄 SimpleChart data effect triggered:', {
    //   isChartReady,
    //   hasData: !!data,
    //   dataLength: data?.length || 0,
    //   isLoading,
    //   symbol,
    //   timeframe
    // });
    
    if (isChartReady && data) {
      if (data.length > 0) {
        // console.log('📊 Setting chart data:', data.length, 'points');
        updateChartData(data);
      } else {
        // Clear chart data when data is empty
        // console.log('🧹 Clearing chart data - empty data received');
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

  // Live Price Display - Optimized to reduce flickering
  const LivePriceDisplay = React.memo(() => {
    const [stablePrice, setStablePrice] = useState<number | null>(null);
    const [stableColorState, setStableColorState] = useState<'positive' | 'negative' | 'neutral'>('neutral');
    const [isUpdating, setIsUpdating] = useState(false);
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
    const lastPriceRef = useRef<number | null>(null);

    // Debounced price update to reduce flickering
    useEffect(() => {
      if (!data || data.length === 0) return;

      const lastCandle = data[data.length - 1];
      const previousCandle = data[data.length - 2];
      
      if (!lastCandle || !previousCandle) return;

      const currentPrice = lastCandle.close;
      const previousPrice = previousCandle.close;

      // Clear existing timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Set a new timer for debounced update
      debounceTimerRef.current = setTimeout(() => {
        if (lastPriceRef.current === null) {
          // First price - just store it
          lastPriceRef.current = currentPrice;
          setStablePrice(currentPrice);
          setStableColorState('neutral');
        } else if (lastPriceRef.current !== currentPrice) {
          // Price changed - update with stable state
          const priceChange = currentPrice - lastPriceRef.current;
          const newColorState = priceChange > 0 ? 'positive' : priceChange < 0 ? 'negative' : 'neutral';
          
          setStablePrice(currentPrice);
          setStableColorState(newColorState);
          lastPriceRef.current = currentPrice;
          
          // Trigger update animation
          setIsUpdating(true);
          setTimeout(() => setIsUpdating(false), 300);
        }
      }, 100); // 100ms debounce

      return () => {
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
      };
    }, [data]);

    // Cleanup on unmount
    useEffect(() => {
      return () => {
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
      };
    }, []);

    if (!data || data.length === 0) return null;

    const lastCandle = data[data.length - 1];
    const previousCandle = data[data.length - 2];
    
    if (!lastCandle || !previousCandle) return null;

    const currentPrice = stablePrice || lastCandle.close;
    const previousPrice = previousCandle.close;
    const priceChange = currentPrice - previousPrice;
    const priceChangePercent = (priceChange / previousPrice) * 100;

    // Use stable color state instead of calculating on every render
    const isPositive = stableColorState === 'positive';
    const isNegative = stableColorState === 'negative';

    const getPriceColor = () => {
      if (isPositive) return 'text-green-600';
      if (isNegative) return 'text-red-600';
      return 'text-gray-600';
    };

    const getPriceIcon = () => {
      if (isPositive) return <TrendingUp className="h-4 w-4" />;
      if (isNegative) return <TrendingDown className="h-4 w-4" />;
      return <Minus className="h-4 w-4" />;
    };

    return (
      <div className="absolute top-2 left-2 z-10">
        <div className={`flex items-center gap-2 ${getPriceColor()} transition-colors duration-300 ${isUpdating ? 'animate-pulse' : ''}`}>
          {getPriceIcon()}
                          <span className="font-semibold">{formatCurrency(currentPrice)}</span>
          <span className="text-sm">
                          {formatPriceChange(priceChange, '', priceChange > 0 ? '+' : '')} ({formatPercentage(priceChangePercent, true)})
          </span>
        </div>
      </div>
    );
  });

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
        className="chart-container-responsive bg-white border border-gray-200 relative" 
        style={{ 
          minHeight: `${height}px`,
          maxWidth: `${width}px`
        }}
      >
        {/* Debug info */}
        {debug && (
          <div className="absolute top-2 left-2 z-10 bg-black bg-opacity-75 text-white text-xs p-2 rounded">
            <div>Chart Ready: {isChartReady ? 'Yes' : 'No'}</div>
            <div>Has Chart: {chartRef.current ? 'Yes' : 'No'}</div>
            <div>Has Series: {candlestickSeriesRef.current ? 'Yes' : 'No'}</div>
            <div>Data Points: {data ? data.length : 0}</div>
            <div>Container Size: {chartContainerRef.current ? (() => {
              const rect = chartContainerRef.current!.getBoundingClientRect();
              return `${rect.width}x${rect.height} (client: ${chartContainerRef.current!.clientWidth}x${chartContainerRef.current!.clientHeight})`;
            })() : 'N/A'}</div>
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