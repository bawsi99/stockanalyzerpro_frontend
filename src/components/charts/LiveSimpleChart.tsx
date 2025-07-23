import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  initializeChartWithRetry, 
  createChartTheme, 
  safeChartCleanup, 
  isChartContainerReady,
  toUTCTimestamp,
  type ChartContainer 
} from '@/utils/chartUtils';
import { useLiveChart, LiveChartData } from '@/hooks/useLiveChart';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Activity,
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

// Specific interface for candlestick chart data
interface CandlestickChartData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface LiveSimpleChartProps {
  symbol: string;
  timeframe: string;
  theme?: 'light' | 'dark';
  height?: number;
  width?: number;
  exchange?: string;
  maxDataPoints?: number;
  autoConnect?: boolean;
  showConnectionStatus?: boolean;
  showLiveIndicator?: boolean;
  onDataUpdate?: (data: CandlestickChartData[]) => void;
  onConnectionChange?: (isConnected: boolean) => void;
  onError?: (error: string) => void;
}

const LiveSimpleChart: React.FC<LiveSimpleChartProps> = ({ 
  symbol,
  timeframe,
  theme = 'light', 
  height = 400,
  width = 800,
  exchange = 'NSE',
  maxDataPoints = 1000,
  autoConnect = true,
  showConnectionStatus = true,
  showLiveIndicator = true,
  onDataUpdate,
  onConnectionChange,
  onError
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const candlestickSeriesRef = useRef<any>(null);
  const [isChartReady, setIsChartReady] = useState(false);
  const [chartError, setChartError] = useState<string | null>(null);
  const [isContainerReady, setIsContainerReady] = useState(false);

  // Live chart hook
  const {
    data,
    isConnected,
    isLive,
    isLoading,
    error,
    lastUpdate,
    connectionStatus,
    reconnectAttempts,
    connect,
    disconnect,
    refetch,
    updateSymbol,
    updateTimeframe
  } = useLiveChart({
    symbol,
    timeframe,
    exchange,
    maxDataPoints,
    autoConnect
  });

  // Notify parent components of state changes
  useEffect(() => {
    onConnectionChange?.(isConnected);
  }, [isConnected, onConnectionChange]);

  useEffect(() => {
    if (error) {
      onError?.(error);
    }
  }, [error, onError]);

  useEffect(() => {
    if (data.length > 0) {
      onDataUpdate?.(data);
    }
  }, [data, onDataUpdate]);

  // Check if container is ready
  useEffect(() => {
    const checkContainer = () => {
      console.log('Container ref check:', chartContainerRef.current);
      const ready = isChartContainerReady(chartContainerRef as ChartContainer);
      console.log('Container ready check:', ready, chartContainerRef.current);
      setIsContainerReady(ready);
    };

    // Check immediately
    checkContainer();
    
    // Check after a short delay
    const timer = setTimeout(checkContainer, 100);
    
    // Check after a longer delay
    const timer2 = setTimeout(checkContainer, 500);
    
    // Force container ready if container exists but not detected as ready
    const forceReadyTimer = setTimeout(() => {
      if (chartContainerRef.current && !isContainerReady) {
        console.log('Forcing container ready state - container exists but not detected as ready');
        setIsContainerReady(true);
      }
    }, 1000);
    
    return () => {
      clearTimeout(timer);
      clearTimeout(timer2);
      clearTimeout(forceReadyTimer);
    };
  }, []); // Remove isContainerReady dependency to prevent infinite loop

  // Initialize chart when container is available and data is loaded
  useEffect(() => {
    console.log('Chart initialization effect triggered:', {
      isContainerReady,
      hasContainer: !!chartContainerRef.current,
      hasData: data.length > 0,
      width,
      height,
      theme,
      timeframe
    });

    // Only initialize if we have a container and data, and chart doesn't exist
    if (!chartContainerRef.current) {
      console.log('No container ref, skipping chart initialization');
      return;
    }

    if (data.length === 0) {
      console.log('No data available, skipping chart initialization');
      return;
    }

    // Prevent multiple chart creations
    if (chartRef.current) {
      console.log('Chart already exists, skipping initialization');
      return;
    }

    // Force initialization even if container not detected as ready
    console.log('Starting live chart initialization...');

    const initializeChart = async () => {
      try {
        const chartConfig = {
          width,
          height,
          ...createChartTheme(theme === 'dark', { timeframe })
        };

        console.log('Chart config:', chartConfig);

        const chart = await initializeChartWithRetry(
          chartContainerRef as ChartContainer,
          { width, height, theme, timeframe, debug: true },
          chartConfig
        );

        if (!chart) {
          throw new Error('Failed to create chart');
        }

        console.log('Chart created successfully:', chart);
        chartRef.current = chart;
        setIsChartReady(true);
        setChartError(null);

        // Immediately set up data if available
        if (data.length > 0) {
          console.log('Setting up initial data for newly created chart...');
          try {
            const isDark = theme === 'dark';

            // Add candlestick series
            candlestickSeriesRef.current = chart.addCandlestickSeries({
              upColor: isDark ? '#26a69a' : '#26a69a',
              downColor: isDark ? '#ef5350' : '#ef5350',
              borderVisible: false,
              wickUpColor: isDark ? '#26a69a' : '#26a69a',
              wickDownColor: isDark ? '#ef5350' : '#ef5350',
            });

            // Convert data to candlestick format
            const candlestickData = data.map(d => ({
              time: toUTCTimestamp(d.date),
              open: d.open,
              high: d.high,
              low: d.low,
              close: d.close,
            }));

            // Set data
            candlestickSeriesRef.current.setData(candlestickData);

            // Fit content
            chart.timeScale().fitContent();

            console.log(`Initial data set with ${candlestickData.length} points`);
          } catch (error) {
            console.error('Error setting initial data:', error);
            setChartError(error instanceof Error ? error.message : 'Error setting initial data');
          }
        }

      } catch (error) {
        console.error('Error initializing chart:', error);
        setChartError(error instanceof Error ? error.message : 'Error initializing chart');
        setIsChartReady(false);
      }
    };

    initializeChart();

    return () => {
      safeChartCleanup(chartRef);
      setIsChartReady(false);
    };
  }, [theme, width, height, timeframe]); // Keep original dependencies for theme/config changes

  // Trigger chart initialization when data becomes available
  useEffect(() => {
    if (data.length > 0 && chartContainerRef.current && !chartRef.current) {
      console.log('Data available, triggering chart initialization...');
      // Force a re-render to trigger chart initialization
      setIsChartReady(false);
    }
  }, [data.length]);

  // Combined effect to handle initialization when both container and data are ready
  useEffect(() => {
    const shouldInitialize = 
      chartContainerRef.current && 
      data.length > 0 && 
      !chartRef.current && 
      !isChartReady;

    console.log('Combined initialization check:', {
      hasContainer: !!chartContainerRef.current,
      hasData: data.length > 0,
      hasChart: !!chartRef.current,
      isChartReady,
      shouldInitialize
    });

    if (shouldInitialize) {
      console.log('Both container and data ready, initializing chart...');
      
      const initializeChart = async () => {
        try {
          const chartConfig = {
            width,
            height,
            ...createChartTheme(theme === 'dark', { timeframe })
          };

          console.log('Chart config:', chartConfig);

          const chart = await initializeChartWithRetry(
            chartContainerRef as ChartContainer,
            { width, height, theme, timeframe, debug: true },
            chartConfig
          );

          if (!chart) {
            throw new Error('Failed to create chart');
          }

          console.log('Chart created successfully:', chart);
          chartRef.current = chart;
          setIsChartReady(true);
          setChartError(null);

          // Immediately set up data if available
          if (data.length > 0) {
            console.log('Setting up initial data for newly created chart...');
            try {
              const isDark = theme === 'dark';

              // Add candlestick series
              candlestickSeriesRef.current = chart.addCandlestickSeries({
                upColor: isDark ? '#26a69a' : '#26a69a',
                downColor: isDark ? '#ef5350' : '#ef5350',
                borderVisible: false,
                wickUpColor: isDark ? '#26a69a' : '#26a69a',
                wickDownColor: isDark ? '#ef5350' : '#ef5350',
              });

              // Convert data to candlestick format
              const candlestickData = data.map(d => ({
                time: toUTCTimestamp(d.date),
                open: d.open,
                high: d.high,
                low: d.low,
                close: d.close,
              }));

              // Set data
              candlestickSeriesRef.current.setData(candlestickData);

              // Fit content
              chart.timeScale().fitContent();

              console.log(`Initial data set with ${candlestickData.length} points`);
            } catch (error) {
              console.error('Error setting initial data:', error);
              setChartError(error instanceof Error ? error.message : 'Error setting initial data');
            }
          }

        } catch (error) {
          console.error('Error initializing chart:', error);
          setChartError(error instanceof Error ? error.message : 'Error initializing chart');
          setIsChartReady(false);
        }
      };

      initializeChart();
    }
  }, [data.length, isChartReady, theme, width, height, timeframe]);

  // Add candlestick series and update data
  useEffect(() => {
    console.log('Chart data effect triggered:', {
      isChartReady,
      hasChartRef: !!chartRef.current,
      dataLength: data.length,
      hasData: data.length > 0
    });

    if (!chartRef.current) {
      console.log('Chart not ready, skipping data update');
      return;
    }

    if (data.length === 0) {
      console.log('No data available, skipping chart update');
      return;
    }

    // Wait for chart to be fully ready
    if (!isChartReady) {
      console.log('Chart not fully ready yet, waiting...');
      return;
    }

    // Only update data if series already exists (for live updates)
    if (!candlestickSeriesRef.current) {
      console.log('Candlestick series not found, skipping data update (should be set up during initialization)');
      return;
    }

    console.log('Updating existing candlestick series with new data...');

    try {
      // Convert data to candlestick format
      const candlestickData = data.map(d => ({
        time: toUTCTimestamp(d.date),
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
      }));

      console.log('Sample candlestick data:', candlestickData.slice(0, 3));
      console.log('Data time range:', {
        first: new Date(candlestickData[0]?.time * 1000),
        last: new Date(candlestickData[candlestickData.length - 1]?.time * 1000)
      });

      // Update data
      candlestickSeriesRef.current.setData(candlestickData);
      console.log('setData called with:', candlestickData.slice(-3));

      // Fit content
      chartRef.current.timeScale().fitContent();

      console.log(`Live chart updated with ${candlestickData.length} data points`);

    } catch (error) {
      console.error('Error updating live chart data:', error);
      setChartError(error instanceof Error ? error.message : 'Error updating data');
    }

  }, [data, theme, isChartReady]); // Add isChartReady as dependency



  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (chartRef.current && chartContainerRef.current) {
        const rect = chartContainerRef.current.getBoundingClientRect();
        chartRef.current.applyOptions({
          width: rect.width,
          height: rect.height,
        });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Connection status component
  const ConnectionStatus = () => {
    if (!showConnectionStatus) return null;

    const now = Date.now();
    const isStale = now - lastUpdate > 10000; // 10 seconds

    const getStatusIcon = () => {
      switch (connectionStatus) {
        case 'connected':
          return <CheckCircle className="w-4 h-4 text-green-500" title="Connected" />;
        case 'connecting':
          return <RefreshCw className="w-4 h-4 text-yellow-500 animate-spin" title="Connecting..." />;
        case 'error':
          return <AlertCircle className="w-4 h-4 text-red-500" title="Connection Error" />;
        default:
          return <WifiOff className="w-4 h-4 text-gray-500" title="Disconnected" />;
      }
    };

    const getStatusText = () => {
      switch (connectionStatus) {
        case 'connected':
          return isLive ? 'Live' : 'Connected';
        case 'connecting':
          return 'Connecting...';
        case 'error':
          return 'Connection Error';
        default:
          return 'Disconnected';
      }
    };

    return (
      <div className="absolute top-2 right-2 z-10 flex items-center gap-2">
        <Badge 
          variant={connectionStatus === 'connected' ? 'default' : 'secondary'}
          className="flex items-center gap-1"
          title={getStatusText()}
        >
          {getStatusIcon()}
          {getStatusText()}
        </Badge>
        {reconnectAttempts > 0 && (
          <Badge variant="outline" className="text-xs" title="Reconnect attempts">
            Retry {reconnectAttempts}
          </Badge>
        )}
        {isStale && connectionStatus === 'connected' && (
          <Badge variant="destructive" className="text-xs animate-pulse" title="Data is stale. Backend may be unreachable.">
            STALE
          </Badge>
        )}
        {error && (
          <Badge variant="destructive" className="text-xs" title={error}>
            Error
          </Badge>
        )}
      </div>
    );
  };

  // Live indicator component
  const LiveIndicator = () => {
    if (!showLiveIndicator || !isLive) return null;

    return (
      <div className="absolute top-2 left-2 z-10">
        <Badge variant="destructive" className="flex items-center gap-1 animate-pulse" title="Live data updating in real-time">
          <Activity className="w-3 h-3" />
          LIVE
        </Badge>
      </div>
    );
  };

  // Control buttons component
  const ControlButtons = () => {
    return (
      <div className="absolute bottom-2 right-2 z-10 flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => isConnected ? disconnect() : connect()}
          disabled={isLoading}
          className="h-8 px-2"
        >
          {isConnected ? <WifiOff className="w-3 h-3" /> : <Wifi className="w-3 h-3" />}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={refetch}
          disabled={isLoading}
          className="h-8 px-2"
        >
          <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>
    );
  };

  // Error display
  if (chartError) {
    return (
      <div className="relative w-full h-full">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <p className="text-red-600 mb-2">Chart Error</p>
            <p className="text-sm text-gray-500">{chartError}</p>
          </div>
        </div>
        <ControlButtons />
      </div>
    );
  }

  // Loading state
  if (isLoading && data.length === 0) {
    return (
      <div className="relative w-full h-full">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading live data...</p>
            <p className="text-sm text-gray-500">{symbol} - {timeframe}</p>
          </div>
        </div>
        <ControlButtons />
      </div>
    );
  }

  // No data state
  if (data.length === 0) {
    return (
      <div className="relative w-full h-full">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="text-gray-500 text-6xl mb-4">📊</div>
            <p className="text-gray-600">No data available</p>
            <p className="text-sm text-gray-500">Select a stock to view live chart</p>
          </div>
        </div>
        <ControlButtons />
      </div>
    );
  }

  // Error alert
  if (error) {
    return (
      <div className="relative w-full h-full">
        <div className="w-full h-full">
          <div ref={chartContainerRef} className="w-full h-full" />
        </div>
        <ConnectionStatus />
        <LiveIndicator />
        <ControlButtons />
        <Alert variant="destructive" className="absolute bottom-16 left-2 right-2 z-10">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <div className="w-full h-full">
        <div ref={chartContainerRef} className="w-full h-full" />
      </div>
      <ConnectionStatus />
      <LiveIndicator />
      <ControlButtons />
    </div>
  );
};

export default LiveSimpleChart; 