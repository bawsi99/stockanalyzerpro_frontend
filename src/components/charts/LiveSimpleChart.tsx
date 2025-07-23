import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  initializeChartWithRetry, 
  createChartTheme, 
  safeChartCleanup, 
  isChartContainerReady,
  toUTCTimestamp,
  sortChartDataByTime,
  validateChartDataForTradingView,
  type ChartContainer 
} from '@/utils/chartUtils';
import { useLiveChart, LiveChartData } from '@/hooks/useLiveChart';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
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
    
    // Check after an even longer delay for slow-rendering containers
    const timer3 = setTimeout(checkContainer, 1000);
    
    // Check after a very long delay for edge cases
    const timer4 = setTimeout(checkContainer, 2000);
    
    // Use ResizeObserver to detect when container gets dimensions
    let resizeObserver: ResizeObserver | null = null;
    if (chartContainerRef.current) {
      resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          if (width > 0 && height > 0) {
            console.log('Container resized with dimensions:', { width, height });
            setIsContainerReady(true);
          }
        }
      });
      resizeObserver.observe(chartContainerRef.current);
    }
    
    // Also use MutationObserver to detect when container is added to DOM
    let mutationObserver: MutationObserver | null = null;
    if (chartContainerRef.current) {
      mutationObserver = new MutationObserver(() => {
        if (chartContainerRef.current && document.contains(chartContainerRef.current)) {
          console.log('Container added to DOM, checking readiness...');
          checkContainer();
        }
      });
      mutationObserver.observe(document.body, { childList: true, subtree: true });
    }
    
    return () => {
      clearTimeout(timer);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      if (mutationObserver) {
        mutationObserver.disconnect();
      }
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
  }, [theme, width, height]); // Remove timeframe from dependencies to prevent chart recreation

  // Trigger chart initialization when data becomes available
  useEffect(() => {
    if (data.length > 0 && chartContainerRef.current && !chartRef.current) {
      console.log('Data available, triggering chart initialization...');
      
      // If container is not ready but we have data, try to force initialization after a delay
      if (!isContainerReady) {
        console.log('Container not ready but data available, will retry initialization...');
        const retryTimer = setTimeout(() => {
          if (chartContainerRef.current && !chartRef.current) {
            console.log('Retrying chart initialization after delay...');
            setIsChartReady(false);
          }
        }, 2000); // Wait 2 seconds for container to be ready
        
        return () => clearTimeout(retryTimer);
      }
    }
  }, [data.length, isContainerReady]);

  // Combined effect to handle initialization when both container and data are ready
  useEffect(() => {
    const shouldInitialize = 
      chartContainerRef.current && 
      data.length > 0 && 
      !chartRef.current && 
      !isChartReady &&
      isContainerReady; // Add container ready check

    console.log('Combined initialization check:', {
      hasContainer: !!chartContainerRef.current,
      hasData: data.length > 0,
      hasChart: !!chartRef.current,
      isChartReady,
      isContainerReady,
      shouldInitialize,
      dataLength: data.length
    });

    if (shouldInitialize) {
      console.log('Both container and data ready, initializing chart...');
      
      const initializeChart = async () => {
        try {
          // Double-check container dimensions before initialization
          const container = chartContainerRef.current;
          if (!container || container.clientWidth === 0 || container.clientHeight === 0) {
            console.log('Container dimensions not ready, retrying...', {
              width: container?.clientWidth,
              height: container?.clientHeight
            });
            return;
          }

          // Prevent multiple chart creations
          if (chartRef.current) {
            console.log('Chart already exists, skipping initialization');
            return;
          }

          const chartConfig = {
            width: container.clientWidth || width,
            height: container.clientHeight || height,
            ...createChartTheme(theme === 'dark', { timeframe })
          };

          console.log('Chart config:', chartConfig);
          console.log('Timeframe for chart theme:', timeframe);

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

              // Validate and sort data
              const validatedData = validateChartDataForTradingView(data);
              
              // Convert data to candlestick format
              const candlestickData = validatedData.map(d => ({
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
  }, [data.length, isChartReady, isContainerReady, theme, width, height]); // Remove timeframe from dependencies

  // Add tooltip subscription when chart is ready
  useEffect(() => {
    if (!chartRef.current || !isChartReady) return;

    console.log('Setting up tooltip subscription for live chart');

    // Enhanced candlestick tooltip for live simple chart
    const unsubscribe = chartRef.current.subscribeCrosshairMove((param) => {
      const tooltip = document.getElementById('candlestick-tooltip');
      if (!tooltip) return;
      
      if (param.time && param.seriesData) {
        const candleDataPoint = param.seriesData.get(candlestickSeriesRef.current);
        
        if (candleDataPoint) {
          const timeIndex = data.findIndex(d => toUTCTimestamp(d.date) === param.time);
          if (timeIndex !== -1) {
            const dataPoint = data[timeIndex];
            const date = new Date(dataPoint.date);
            
            // Format date based on timeframe
            let dateStr = '';
            if (timeframe === '1d') {
              dateStr = date.toLocaleDateString('en-IN', { 
                timeZone: 'Asia/Kolkata',
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
              });
            } else {
              dateStr = date.toLocaleDateString('en-IN', { 
                timeZone: 'Asia/Kolkata',
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
              }) + ' ' + date.toLocaleTimeString('en-IN', { 
                timeZone: 'Asia/Kolkata',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
              });
            }
            
            // Format volume
            const volumeStr = dataPoint.volume >= 1000 ? 
              `${(dataPoint.volume / 1000).toFixed(1)} k` : 
              dataPoint.volume.toString();
            
            // Create tooltip content
            tooltip.innerHTML = `
              <div class="tooltip-header">${dateStr}</div>
              <div class="tooltip-price">${dataPoint.close}</div>
              <div class="tooltip-details">
                <div class="tooltip-row">
                  <span class="tooltip-label">VOLUME:</span>
                  <span class="tooltip-value">${volumeStr}</span>
                </div>
                <div class="tooltip-row">
                  <span class="tooltip-label">OPEN:</span>
                  <span class="tooltip-value">${dataPoint.open}</span>
                </div>
                <div class="tooltip-row">
                  <span class="tooltip-label">HIGH:</span>
                  <span class="tooltip-value">${dataPoint.high}</span>
                </div>
                <div class="tooltip-row">
                  <span class="tooltip-label">LOW:</span>
                  <span class="tooltip-value">${dataPoint.low}</span>
                </div>
                <div class="tooltip-row">
                  <span class="tooltip-label">CLOSE:</span>
                  <span class="tooltip-value">${dataPoint.close}</span>
                </div>
              </div>
            `;
            
            // Position tooltip
            const chartRect = chartContainerRef.current?.getBoundingClientRect();
            if (chartRect && param.point) {
              const tooltipWidth = 150;
              const tooltipHeight = 120;
              let left = param.point.x + 10;
              let top = param.point.y - tooltipHeight - 10;
              
              // Adjust position if tooltip goes outside chart bounds
              if (left + tooltipWidth > chartRect.width) {
                left = param.point.x - tooltipWidth - 10;
              }
              if (top < 0) {
                top = param.point.y + 10;
              }
              
              tooltip.style.left = `${left}px`;
              tooltip.style.top = `${top}px`;
              tooltip.style.display = 'block';
            }
          } else {
            tooltip.style.display = 'none';
          }
        } else {
          tooltip.style.display = 'none';
        }
      } else {
        tooltip.style.display = 'none';
      }
    });

    // Cleanup subscription on unmount or when chart changes
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [isChartReady, data]); // Remove timeframe from dependencies

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
      // Validate and sort data
      const validatedData = validateChartDataForTradingView(data);
      
      // Convert data to candlestick format
      const candlestickData = validatedData.map(d => ({
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

  // Handle timeframe changes without recreating chart
  useEffect(() => {
    if (chartRef.current && candlestickSeriesRef.current) {
      console.log('Timeframe changed to:', timeframe);
      // The chart will automatically update when new data comes in
      // No need to recreate the chart for timeframe changes
    }
  }, [timeframe]);



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

  // Cleanup on unmount or when key dependencies change
  useEffect(() => {
    return () => {
      if (chartRef.current) {
        console.log('Cleaning up chart on unmount or dependency change');
        safeChartCleanup(chartRef);
        setIsChartReady(false);
        setChartError(null);
      }
    };
  }, [symbol, theme]); // Remove timeframe from dependencies

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
          return <RefreshCw className="w-4 h-4 text-gray-500" title="Disconnected" />;
      }
    };

    const getStatusText = () => {
      switch (connectionStatus) {
        case 'connected':
          return isLive ? 'Live Data' : 'Connected';
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
          <div 
            ref={chartContainerRef} 
            className="w-full h-full" 
            style={{ 
              minHeight: `${height}px`,
              minWidth: `${width}px`,
              position: 'relative'
            }}
          />
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
    <>
      <style>
        {`
          /* Candlestick Tooltip Styles */
          #candlestick-tooltip {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 12px;
            line-height: 1.4;
          }
          
          #candlestick-tooltip .tooltip-header {
            font-weight: 600;
            color: #374151;
            margin-bottom: 4px;
            font-size: 11px;
          }
          
          #candlestick-tooltip .tooltip-price {
            font-weight: 700;
            font-size: 14px;
            color: #111827;
            margin-bottom: 8px;
          }
          
          #candlestick-tooltip .tooltip-details {
            display: flex;
            flex-direction: column;
            gap: 2px;
          }
          
          #candlestick-tooltip .tooltip-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          
          #candlestick-tooltip .tooltip-label {
            color: #6b7280;
            font-weight: 500;
            font-size: 10px;
            min-width: 50px;
          }
          
          #candlestick-tooltip .tooltip-value {
            color: #111827;
            font-weight: 600;
            font-size: 11px;
            text-align: right;
          }
          
          /* Dark theme styles */
          .dark #candlestick-tooltip .tooltip-header {
            color: #d1d5db;
          }
          
          .dark #candlestick-tooltip .tooltip-price {
            color: #f9fafb;
          }
          
          .dark #candlestick-tooltip .tooltip-label {
            color: #9ca3af;
          }
          
          .dark #candlestick-tooltip .tooltip-value {
            color: #f9fafb;
          }
        `}
      </style>
      <div className="relative w-full h-full">
        <div className="w-full h-full">
          <div 
            ref={chartContainerRef} 
            className="w-full h-full" 
            style={{ 
              minHeight: `${height}px`,
              minWidth: `${width}px`,
              position: 'relative'
            }}
          />
          <div id="candlestick-tooltip" className="absolute hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-3 pointer-events-none z-30 min-w-[160px]" />
        </div>
        <ConnectionStatus />
        <LiveIndicator />
        <ControlButtons />
      </div>
    </>
  );
};

export default LiveSimpleChart; 