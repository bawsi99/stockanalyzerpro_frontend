import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { createChart, IChartApi, ISeriesApi, CandlestickData, LineData } from 'lightweight-charts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TrendingUp, TrendingDown, Minus, Activity, Wifi, WifiOff, RefreshCw, Settings, ZoomIn, AlertTriangle } from 'lucide-react';
import { toUTCTimestamp, validateChartDataForTradingView, initializeChartWithRetry, createChartTheme, safeChartCleanup, type ChartContainer } from '@/utils/chartUtils';

interface ChartData {
  date: string;
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface ChartState {
  timeScale: {
    rightOffset: number;
    barSpacing: number;
    fixLeftEdge: boolean;
    fixRightEdge: boolean;
    lockVisibleTimeRangeOnResize: boolean;
    rightBarStaysOnScroll: boolean;
    borderVisible: boolean;
    visible: boolean;
    timeVisible: boolean;
    secondsVisible: boolean;
  };
  priceScale: {
    autoScale: boolean;
    scaleMargins: {
      top: number;
      bottom: number;
    };
  };
  visibleRange?: {
    from: number;
    to: number;
  };
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
  showIndicators?: boolean;
  showPatterns?: boolean;
  showVolume?: boolean;
  debug?: boolean;
  data?: ChartData[];
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
  onValidationResult?: (result: any) => void;
  onStatsCalculated?: (stats: any) => void;
  onResetScale?: () => void;
  onRegisterReset?: (resetFn: () => void) => void;
  activeIndicators?: Record<string, boolean>;
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
  showIndicators = true,
  showPatterns = true,
  showVolume = true,
  debug = false,
  data,
  isConnected,
  isLive,
  isLoading,
  error,
  lastUpdate,
  connectionStatus,
  refetch,
  onDataUpdate,
  onConnectionChange,
  onError,
  onValidationResult,
  onStatsCalculated,
  onResetScale,
  onRegisterReset,
  activeIndicators = {}
}) => {
  // Refs
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const isMountedRef = useRef(true);
  const lastSymbolRef = useRef(symbol);
  const lastTimeframeRef = useRef(timeframe);
  const lastDataRef = useRef<CandlestickData[]>([]);
  const isInitializingRef = useRef(false);
  const isNewSymbolRef = useRef(false);
  const isInitialLoadRef = useRef(true);
  const chartStateRef = useRef<ChartState | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const initializationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initializationAttemptsRef = useRef(0);

  // State
  const [isChartReady, setIsChartReady] = useState(false);
  const [chartError, setChartError] = useState<string | null>(null);
  const [lastChartUpdate, setLastChartUpdate] = useState(0);
  const [containerReady, setContainerReady] = useState(false);

  // Chart state management for preserving zoom/pan
  const hasUserInteractedRef = useRef<boolean>(false);

  // Save current chart state
  const saveChartState = useCallback(() => {
    if (!chartRef.current) return;

    try {
      const timeScale = chartRef.current.timeScale();
      const priceScale = chartRef.current.priceScale('right');
      
      const currentState: ChartState = {
        visibleRange: timeScale.getVisibleRange() as any,
        timeScale: {
          rightOffset: timeScale.options().rightOffset,
          barSpacing: timeScale.options().barSpacing,
          fixLeftEdge: timeScale.options().fixLeftEdge,
          fixRightEdge: timeScale.options().fixRightEdge,
          lockVisibleTimeRangeOnResize: timeScale.options().lockVisibleTimeRangeOnResize,
          rightBarStaysOnScroll: timeScale.options().rightBarStaysOnScroll,
          borderVisible: timeScale.options().borderVisible,
          visible: timeScale.options().visible,
          timeVisible: timeScale.options().timeVisible,
          secondsVisible: timeScale.options().secondsVisible,
        },
        priceScale: {
          autoScale: priceScale.options().autoScale,
          scaleMargins: priceScale.options().scaleMargins,
        }
      };

      chartStateRef.current = currentState;

      if (debug) {
        console.log('💾 Chart state saved:', currentState);
      }
    } catch (error) {
      console.warn('Error saving chart state:', error);
    }
  }, [debug]);

  // Restore chart state
  const restoreChartState = useCallback(() => {
    if (!chartRef.current || !chartStateRef.current?.visibleRange) return;

    try {
      const timeScale = chartRef.current.timeScale();
      const priceScale = chartRef.current.priceScale('right');

      // Restore time scale options
      if (chartStateRef.current.timeScale) {
        timeScale.applyOptions(chartStateRef.current.timeScale);
      }

      // Restore price scale options
      if (chartStateRef.current.priceScale) {
        priceScale.applyOptions(chartStateRef.current.priceScale);
      }

      // Restore visible range
      timeScale.setVisibleRange(chartStateRef.current.visibleRange as any);

      if (debug) {
        console.log('🔄 Chart state restored:', chartStateRef.current);
      }
    } catch (error) {
      console.warn('Error restoring chart state:', error);
    }
  }, [debug]);

  // Handle user interaction (zoom, pan, etc.)
  const handleUserInteraction = useCallback(() => {
    hasUserInteractedRef.current = true;
    if (debug) {
      console.log('👆 User interaction detected');
    }
  }, [debug]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('🧹 Cleaning up LiveSimpleChart component');
      isMountedRef.current = false;
      
      // Clear any pending timeouts
      if (initializationTimeoutRef.current) {
        clearTimeout(initializationTimeoutRef.current);
        initializationTimeoutRef.current = null;
      }
      
      // Cleanup resize observer
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      }
      
      // Cleanup chart
      if (chartRef.current) {
        try {
          safeChartCleanup(chartRef);
        } catch (error) {
          console.warn('Error during chart cleanup:', error);
        }
        chartRef.current = null;
        candlestickSeriesRef.current = null;
      }
    };
  }, []); // Only run on unmount

  // Improved container readiness detection with better timing
  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container) return;

    const checkContainerReady = () => {
      const rect = container.getBoundingClientRect();
      console.log('Checking container readiness:', {
        clientWidth: container.clientWidth,
        clientHeight: container.clientHeight,
        offsetWidth: container.offsetWidth,
        offsetHeight: container.offsetHeight,
        rectWidth: rect.width,
        rectHeight: rect.height,
        isVisible: container.offsetParent !== null
      });
      
      // Check if container has dimensions and is visible - use multiple dimension sources
      const hasWidth = container.clientWidth > 0 || container.offsetWidth > 0 || rect.width > 0;
      const hasHeight = container.clientHeight > 0 || container.offsetHeight > 0 || rect.height > 0;
      
      if (container && hasWidth && hasHeight && container.offsetParent !== null) {
        console.log('Container is ready, setting containerReady to true');
        setContainerReady(true);
        return true;
      }
      return false;
    };

    // Initial check
    if (checkContainerReady()) return;

    // Use multiple strategies to detect when container is ready
    const strategies = [
      // Immediate retry
      () => setTimeout(checkContainerReady, 50),
      // After a short delay
      () => setTimeout(checkContainerReady, 100),
      // After a longer delay
      () => setTimeout(checkContainerReady, 200),
      // Use ResizeObserver to detect when container gets dimensions
      () => {
        if (window.ResizeObserver) {
          const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
              if (entry.target === container && entry.contentRect.width > 0 && entry.contentRect.height > 0) {
                console.log('ResizeObserver detected container ready');
                setContainerReady(true);
                observer.disconnect();
                return;
              }
            }
          });
          observer.observe(container);
          return () => observer.disconnect();
        }
        return () => {};
      }
    ];

    const cleanupFns = strategies.map(strategy => strategy());

    return () => {
      cleanupFns.forEach(cleanup => {
        if (typeof cleanup === 'function') cleanup();
      });
    };
  }, []); // Only run once on mount

  // Force container ready when data is available and container exists
  useEffect(() => {
    if (data && data.length > 0 && chartContainerRef.current && !containerReady) {
      const container = chartContainerRef.current;
      if (container.clientWidth > 0 || container.offsetWidth > 0) {
        console.log('Data available, forcing container ready state');
        setContainerReady(true);
      }
    }
  }, [data, containerReady]);

  // Detect symbol changes
  useEffect(() => {
    if (lastSymbolRef.current !== symbol) {
      console.log('Symbol changed from', lastSymbolRef.current, 'to', symbol);
      isNewSymbolRef.current = true;
      lastSymbolRef.current = symbol;
      
      // Reset chart state for new symbol
      setIsChartReady(false);
      setChartError(null);
      initializationAttemptsRef.current = 0;
      lastDataRef.current = []; // Clear stored data
      
      // Reset chart state management for new symbol
      chartStateRef.current = null;
      hasUserInteractedRef.current = false;
      isInitialLoadRef.current = true;
      
      // Cleanup existing chart
      if (chartRef.current) {
        try {
          safeChartCleanup(chartRef);
        } catch (error) {
          console.warn('Error during symbol change cleanup:', error);
        }
        chartRef.current = null;
        candlestickSeriesRef.current = null;
      }
    }
  }, [symbol]);

  // Detect timeframe changes
  useEffect(() => {
    if (lastTimeframeRef.current !== timeframe) {
      console.log('Timeframe changed from', lastTimeframeRef.current, 'to', timeframe);
      lastTimeframeRef.current = timeframe;
      
      // Reset chart state for new timeframe
      setIsChartReady(false);
      setChartError(null);
      initializationAttemptsRef.current = 0;
      lastDataRef.current = []; // Clear stored data
      
      // Reset chart state management for new timeframe
      chartStateRef.current = null;
      hasUserInteractedRef.current = false;
      isInitialLoadRef.current = true;
      
      // Cleanup existing chart
      if (chartRef.current) {
        try {
          safeChartCleanup(chartRef);
        } catch (error) {
          console.warn('Error during timeframe change cleanup:', error);
        }
        chartRef.current = null;
        candlestickSeriesRef.current = null;
      }
    }
  }, [timeframe]);

  // Chart initialization with proper lifecycle management
  const initializeChart = useCallback(async () => {
    // Prevent multiple simultaneous initializations
    if (isInitializingRef.current) {
      console.log('Chart initialization already in progress, skipping...');
      return;
    }

    // Check if component is still mounted
    if (!isMountedRef.current) {
      console.log('Component unmounted, skipping chart initialization');
      return;
    }

    // Check if container is ready with better validation
    if (!chartContainerRef.current) {
      console.log('Container ref not available, will retry when available');
      // Don't retry immediately - let the container readiness effect handle this
      return;
    }

    const container = chartContainerRef.current;
    
    // Check container dimensions with comprehensive validation
    const rect = container.getBoundingClientRect();
    const containerWidth = container.clientWidth || container.offsetWidth || rect.width;
    const containerHeight = container.clientHeight || container.offsetHeight || rect.height;
    
    if (containerWidth === 0 || containerHeight === 0) {
      console.log('Container has no dimensions yet, waiting for container to be ready', {
        clientWidth: container.clientWidth,
        clientHeight: container.clientHeight,
        offsetWidth: container.offsetWidth,
        offsetHeight: container.offsetHeight,
        rectWidth: rect.width,
        rectHeight: rect.height
      });
      // Don't retry immediately - let the container readiness effect handle this
      return;
    }

    console.log('🚀 Starting chart initialization for:', symbol, timeframe);
    console.log('Container dimensions:', {
      width: containerWidth,
      height: containerHeight,
      clientWidth: container.clientWidth,
      clientHeight: container.clientHeight,
      offsetWidth: container.offsetWidth,
      offsetHeight: container.offsetHeight,
      rectWidth: rect.width,
      rectHeight: rect.height
    });

    isInitializingRef.current = true;
    setChartError(null);

    try {
      // Clear container
      container.innerHTML = '';

      // Create chart with proper configuration - use actual container dimensions
      const chart = createChart(container, {
        width: container.clientWidth || containerWidth,
        height: container.clientHeight || containerHeight,
        layout: {
          background: { color: theme === 'dark' ? '#1a1a1a' : '#ffffff' },
          textColor: theme === 'dark' ? '#ffffff' : '#333333',
        },
        grid: {
          vertLines: { color: theme === 'dark' ? '#2a2a2a' : '#f0f0f0' },
          horzLines: { color: theme === 'dark' ? '#2a2a2a' : '#f0f0f0' },
        },
        timeScale: {
          timeVisible: true,
          secondsVisible: false,
          rightOffset: 12,
          barSpacing: 3,
          borderColor: theme === 'dark' ? '#2a2a2a' : '#e1e1e1',
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
          borderColor: theme === 'dark' ? '#2a2a2a' : '#e1e1e1',
        },
        crosshair: {
          mode: 1,
          vertLine: {
            color: theme === 'dark' ? '#ffffff' : '#000000',
            width: 1,
            style: 3,
          },
          horzLine: {
            color: theme === 'dark' ? '#ffffff' : '#000000',
            width: 1,
            style: 3,
          },
        },
        handleScroll: {
          mouseWheel: true,
          pressedMouseMove: true,
          horzTouchDrag: true,
          vertTouchDrag: true,
        },
        handleScale: {
          axisPressedMouseMove: true,
          mouseWheel: true,
          pinch: true,
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

      // Store chart reference
      chartRef.current = chart;

      // Create candlestick series
      const candlestickSeries = chart.addCandlestickSeries({
        upColor: '#26a69a',
        downColor: '#ef5350',
        borderDownColor: '#ef5350',
        borderUpColor: '#26a69a',
        wickDownColor: '#ef5350',
        wickUpColor: '#26a69a',
      });

      // Store series reference
      candlestickSeriesRef.current = candlestickSeries;

      console.log('Chart and candlestick series created successfully');

      // Set chart as ready
      setIsChartReady(true);
      initializationAttemptsRef.current = 0; // Reset attempts counter

      // Add user interaction handlers to detect zoom/pan
      const timeScale = chart.timeScale();
      
      // Subscribe to time scale changes (zoom/pan)
      timeScale.subscribeVisibleTimeRangeChange(() => {
        handleUserInteraction();
      });

      // Add resize handler with better dimension detection
      const handleResize = () => {
        if (chart && container) {
          const newWidth = container.clientWidth || container.offsetWidth || container.getBoundingClientRect().width;
          const newHeight = container.clientHeight || container.offsetHeight || container.getBoundingClientRect().height;
          
          if (newWidth > 0 && newHeight > 0) {
            console.log('Resizing chart to:', { width: newWidth, height: newHeight });
            chart.applyOptions({
              width: newWidth,
              height: newHeight,
            });
          }
        }
      };

      // Store resize observer reference
      if (window.ResizeObserver) {
        resizeObserverRef.current = new ResizeObserver(handleResize);
        resizeObserverRef.current.observe(container);
      }

      // Register reset function if callback provided
      if (onRegisterReset) {
        onRegisterReset(() => {
          if (chart) {
            chart.timeScale().fitContent();
          }
        });
      }

    } catch (error) {
      console.error('Error during chart initialization:', error);
      setChartError(error instanceof Error ? error.message : 'Chart initialization failed');
      setIsChartReady(false);
    } finally {
      isInitializingRef.current = false;
    }
  }, [symbol, timeframe, theme, onRegisterReset]); // Added onRegisterReset to dependencies

  // Trigger chart initialization when ready
  useEffect(() => {
    // Clear any pending initialization
    if (initializationTimeoutRef.current) {
      clearTimeout(initializationTimeoutRef.current);
      initializationTimeoutRef.current = null;
    }

    console.log('Chart initialization trigger check:', {
      isChartReady,
      containerReady,
      hasData: data && data.length > 0,
      dataLength: data?.length || 0,
      containerExists: !!chartContainerRef.current,
      containerDimensions: chartContainerRef.current ? {
        clientWidth: chartContainerRef.current.clientWidth,
        clientHeight: chartContainerRef.current.clientHeight,
        offsetWidth: chartContainerRef.current.offsetWidth,
        offsetHeight: chartContainerRef.current.offsetHeight
      } : null
    });

    // Start initialization if chart is not ready and container is ready
    if (!isChartReady && containerReady && chartContainerRef.current) {
      const container = chartContainerRef.current;
      const rect = container.getBoundingClientRect();
      const hasDimensions = (container.clientWidth > 0 || container.offsetWidth > 0 || rect.width > 0) && 
                           (container.clientHeight > 0 || container.offsetHeight > 0 || rect.height > 0);
      
      if (hasDimensions) {
        console.log('Starting chart initialization with dimensions:', {
          clientWidth: container.clientWidth,
          clientHeight: container.clientHeight,
          offsetWidth: container.offsetWidth,
          offsetHeight: container.offsetHeight,
          rectWidth: rect.width,
          rectHeight: rect.height
        });
        initializeChart();
      } else {
        console.log('Container ready but no dimensions yet, waiting...');
      }
    } else {
      console.log('Chart initialization conditions not met:', {
        isChartReady,
        containerReady,
        containerExists: !!chartContainerRef.current,
        hasDimensions: chartContainerRef.current ? 
          ((chartContainerRef.current.clientWidth > 0 || chartContainerRef.current.offsetWidth > 0 || chartContainerRef.current.getBoundingClientRect().width > 0) && 
           (chartContainerRef.current.clientHeight > 0 || chartContainerRef.current.offsetHeight > 0 || chartContainerRef.current.getBoundingClientRect().height > 0)) : false
      });
    }
  }, [initializeChart, containerReady, isChartReady]);

  // Handle data updates when chart is ready
  useEffect(() => {
    if (isChartReady && data && data.length > 0 && chartRef.current && candlestickSeriesRef.current) {
      console.log('Data received after chart initialization, updating...');
      // Force a data update
      const validatedData = validateChartDataForTradingView(data);
      const candlestickData = validatedData.map(d => ({
        time: d.time,
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
      }));
      
      candlestickSeriesRef.current.setData(candlestickData as any);
      lastDataRef.current = candlestickData as any;
      console.log('Initial data set:', candlestickData.length, 'candles');
      
      // Only fit content for initial load or new symbol
      if (isInitialLoadRef.current || isNewSymbolRef.current) {
        if (chartRef.current) {
          chartRef.current.timeScale().fitContent();
        }
        isInitialLoadRef.current = false;
      }
    }
  }, [isChartReady, data]);

  // Fallback initialization trigger - ensure chart initializes even if container detection fails
  useEffect(() => {
    if (!isChartReady && data && data.length > 0 && chartContainerRef.current) {
      const container = chartContainerRef.current;
      const hasDimensions = (container.clientWidth > 0 || container.offsetWidth > 0) && 
                           (container.clientHeight > 0 || container.offsetHeight > 0);
      
      // If we have data and container exists but chart isn't ready, try to initialize
      if (hasDimensions && !isInitializingRef.current) {
        console.log('Fallback: Attempting chart initialization with data available');
        initializeChart();
      }
    }
  }, [isChartReady, data, initializeChart]);

  // Handle resize events with better dimension detection
  useEffect(() => {
    if (!chartRef.current || !chartContainerRef.current) return;

    const handleResize = () => {
      if (chartRef.current && chartContainerRef.current) {
        const container = chartContainerRef.current;
        const newWidth = container.clientWidth || container.offsetWidth || container.getBoundingClientRect().width;
        const newHeight = container.clientHeight || container.offsetHeight || container.getBoundingClientRect().height;
        
        if (newWidth > 0 && newHeight > 0) {
          console.log('Resize effect - updating chart dimensions:', { width: newWidth, height: newHeight });
          chartRef.current.applyOptions({
            width: newWidth,
            height: newHeight,
          });
        }
      }
    };

    // Use ResizeObserver for better performance
    if (resizeObserverRef.current && chartContainerRef.current) {
      const observer = new ResizeObserver(handleResize);
      observer.observe(chartContainerRef.current);
      
      return () => observer.disconnect();
    }
  }, [isChartReady]);

  // Update chart data when data changes
  useEffect(() => {
    if (!isChartReady || !chartRef.current || !candlestickSeriesRef.current) {
      return;
    }

    // Handle case when data is cleared (empty array)
    if (!data || data.length === 0) {
      console.log('Data cleared, resetting chart state');
      lastDataRef.current = [];
      return;
    }

    try {
      const validatedData = validateChartDataForTradingView(data);
      
      // Debug timestamp values
      console.log('Raw data timestamps:', data.slice(0, 5).map(d => ({
        date: d.date,
        time: d.time,
        convertedDate: new Date(d.time * 1000).toISOString()
      })));
      
      const candlestickData = validatedData.map(d => ({
        time: d.time as any, // Cast to any to satisfy TradingView's Time type
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
      })) as any; // Cast the entire array to satisfy TradingView's type requirements

      // Debug processed timestamps
      console.log('Processed candlestick timestamps:', candlestickData.slice(0, 5).map(d => ({
        time: d.time,
        date: new Date(d.time * 1000).toISOString(),
        localTime: new Date(d.time * 1000).toLocaleString()
      })));

      // Check if this is a new dataset (symbol change or completely different data)
      const isNewDataset = lastDataRef.current.length === 0 || 
        (lastDataRef.current.length > 0 && candlestickData.length > 0 &&
         lastDataRef.current[0]?.time && candlestickData[0]?.time &&
         Math.abs((lastDataRef.current[0].time as number) - (candlestickData[0].time as number)) > 86400) ||
        (lastDataRef.current.length > 0 && candlestickData.length === 0) || // Data was cleared
        (lastDataRef.current.length === 0 && candlestickData.length > 0); // New data loaded

      // Check if this is just a tick update (same number of candles, same timestamps)
      const isTickUpdate = lastDataRef.current.length > 0 && 
        candlestickData.length === lastDataRef.current.length &&
        candlestickData.length > 0 &&
        lastDataRef.current[0]?.time && candlestickData[0]?.time &&
        lastDataRef.current[0].time === candlestickData[0].time;

      console.log('Chart data update analysis:', {
        dataLength: candlestickData.length,
        lastDataLength: lastDataRef.current.length,
        isNewDataset,
        isTickUpdate,
        isNewSymbol: isNewSymbolRef.current,
        firstTime: candlestickData[0]?.time,
        lastDataFirstTime: lastDataRef.current[0]?.time
      });

      if (isNewDataset || isNewSymbolRef.current) {
        // Save current chart state before updating data
        if (hasUserInteractedRef.current) {
          saveChartState();
        }
        
        // Full dataset update
        candlestickSeriesRef.current.setData(candlestickData as any);
        lastDataRef.current = candlestickData as any;
        console.log('Full dataset updated:', candlestickData.length, 'candles');
        
        // Only fit content for new symbol, preserve user's view for same symbol
        if (isNewSymbolRef.current) {
          if (chartRef.current) {
            chartRef.current.timeScale().fitContent();
          }
        } else if (hasUserInteractedRef.current) {
          // Restore user's previous view state
          setTimeout(() => {
            restoreChartState();
          }, 0);
        }
      } else if (isTickUpdate) {
        // Tick update - only update the last candle
        const lastStoredCandle = lastDataRef.current[lastDataRef.current.length - 1];
        const newLastCandle = candlestickData[candlestickData.length - 1];

        if (lastStoredCandle && newLastCandle) {
          // Check if the last candle has been updated (tick data)
          const hasPriceChange = Math.abs(lastStoredCandle.close - newLastCandle.close) > 0.01;
          const hasHighChange = Math.abs(lastStoredCandle.high - newLastCandle.high) > 0.01;
          const hasLowChange = Math.abs(lastStoredCandle.low - newLastCandle.low) > 0.01;
          
          if (hasPriceChange || hasHighChange || hasLowChange) {
            // Update the last candle with new tick data
            candlestickSeriesRef.current.update(newLastCandle as any);
            console.log('Live tick update:', {
              oldClose: lastStoredCandle.close,
              newClose: newLastCandle.close,
              oldHigh: lastStoredCandle.high,
              newHigh: newLastCandle.high,
              oldLow: lastStoredCandle.low,
              newLow: newLastCandle.low
            });
          }
        }
        
        // Update the stored data reference
        lastDataRef.current = candlestickData as any;
      } else {
        // New candle added or other data change
        const lastStoredCandle = lastDataRef.current[lastDataRef.current.length - 1];
        const newLastCandle = candlestickData[candlestickData.length - 1];

        if (lastStoredCandle && newLastCandle && candlestickData.length > lastDataRef.current.length) {
          // New candle added
          candlestickSeriesRef.current.update(newLastCandle as any);
          console.log('New candle added:', newLastCandle);
        }
        
        // Update the stored data reference
        lastDataRef.current = candlestickData as any;
      }

      setLastChartUpdate(Date.now());
    } catch (error) {
      console.error('Error updating chart data:', error);
    }
  }, [data, isChartReady]); // Removed lastUpdate dependency to prevent unnecessary re-renders

  // Handle chart reset
  const handleChartReset = useCallback(() => {
    console.log('🔄 Manual chart reset triggered');
    
    // Cleanup existing chart
    if (chartRef.current) {
      try {
        safeChartCleanup(chartRef);
      } catch (error) {
        console.warn('Error during manual chart cleanup:', error);
      }
    }
    
    // Reset state
    chartRef.current = null;
    candlestickSeriesRef.current = null;
    setIsChartReady(false);
    setChartError(null);
    initializationAttemptsRef.current = 0;
    lastDataRef.current = [];
    
    // Reset chart state management
    chartStateRef.current = null;
    hasUserInteractedRef.current = false;
    isInitialLoadRef.current = true;
    
    // Reset container ready state to force re-detection
    setContainerReady(false);
    
    // Restart initialization with proper timing
    setTimeout(() => {
      if (isMountedRef.current && chartContainerRef.current) {
        const container = chartContainerRef.current;
        const hasDimensions = (container.clientWidth > 0 || container.offsetWidth > 0) && 
                             (container.clientHeight > 0 || container.offsetHeight > 0);
        
        if (hasDimensions) {
          console.log('Container ready after reset, initializing chart');
          setContainerReady(true);
        } else {
          console.log('Container not ready after reset, will wait for container detection');
        }
      }
    }, 100);
  }, []);

  // Register reset function
  useEffect(() => {
    if (onRegisterReset) {
      onRegisterReset(handleChartReset);
    }
  }, [handleChartReset, onRegisterReset]);

  // Loading state
  if (isLoading) {
    return (
      <div className="relative w-full h-full">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <p className="text-gray-600">Loading chart data...</p>
            <p className="text-sm text-gray-500">{symbol} - {timeframe}</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="relative w-full h-full">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-red-500" />
            <p className="text-red-600 mb-2">Chart Error</p>
            <p className="text-sm text-gray-500">{error}</p>
            <Button 
              onClick={() => {
                refetch?.();
              }} 
              className="mt-4"
              variant="outline"
            >
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // No data state
  if (data === null || data === undefined || data.length === 0) {
    return (
      <div className="relative w-full h-full">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <p className="text-gray-600">No data available</p>
            <p className="text-sm text-gray-500">{symbol} - {timeframe}</p>
            <Button 
              onClick={() => {
                refetch?.();
              }} 
              className="mt-4"
              variant="outline"
            >
              Refresh
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Live Price Display Component - Optimized to reduce flickering
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

    if (!isLive || !data || data.length === 0) return null;

    const lastCandle = data[data.length - 1];
    const previousCandle = data[data.length - 2];
    
    if (!lastCandle || !previousCandle) return null;

    const currentPrice = stablePrice || lastCandle.close;

    // Use stable color state instead of calculating on every render
    const isPositive = stableColorState === 'positive';
    const isNegative = stableColorState === 'negative';

    const getPriceColor = () => {
      if (isPositive) return 'text-green-600';
      if (isNegative) return 'text-red-600';
      return 'text-gray-600';
    };

    return (
      <div className="absolute top-2 left-2 z-10 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg">
        <div className="flex items-center gap-2">
          <div className="text-sm font-medium">{symbol}</div>
          <div className={`text-lg font-bold transition-colors duration-300 ${getPriceColor()} ${isUpdating ? 'animate-pulse' : ''}`}>
            ₹{currentPrice.toFixed(2)}
          </div>
          {isLive && (
            <div className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                isPositive ? 'bg-green-500' : isNegative ? 'bg-red-500' : 'bg-green-500'
              } ${isUpdating ? 'animate-ping' : 'animate-pulse'}`}></div>
              <span className="text-xs text-gray-600">LIVE</span>
            </div>
          )}
        </div>
      </div>
    );
  });

  return (
    <div className="relative w-full h-full">




      {/* Chart Container - Responsive sizing with max-width constraint */}
      <div 
        className="chart-container-responsive bg-white border border-gray-200" 
        style={{ 
          height: `${height}px`,
          maxWidth: `${width}px`
        }}
      >

        
        {/* Chart Container */}
        <div 
          ref={chartContainerRef} 
          className="w-full h-full"
          style={{ 
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            pointerEvents: 'auto',
            isolation: 'isolate',
            backgroundColor: debug ? 'rgba(255, 0, 0, 0.1)' : 'transparent',
            width: '100%',
            height: '100%'
          }}
          data-chart-container="true"
          data-symbol={symbol}
          data-timeframe={timeframe}
        />
        
        {/* Loading Overlay */}
        {!isChartReady && data && data.length > 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/90 z-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
              <p className="text-gray-600 text-sm">Initializing chart...</p>
              <p className="text-xs text-gray-500">{data.length} data points available</p>
              {initializationAttemptsRef.current > 0 && (
                <p className="text-xs text-orange-500 mt-1">Attempt {initializationAttemptsRef.current}</p>
              )}
            </div>
          </div>
        )}

        {/* Chart Error Overlay */}
        {chartError && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/90 z-10">
            <div className="text-center">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-red-500" />
              <p className="text-red-600 mb-2">Chart Error</p>
              <p className="text-sm text-gray-500 mb-4">{chartError}</p>
              <Button 
                onClick={handleChartReset}
                className="mr-2"
                variant="outline"
                size="sm"
              >
                Retry
              </Button>
              <Button 
                onClick={() => setChartError(null)}
                variant="outline"
                size="sm"
              >
                Dismiss
              </Button>
            </div>
          </div>
        )}

        {/* Debug Controls */}
        {debug && isChartReady && (
          <div className="absolute bottom-2 right-2 z-10 bg-blue-100 border border-blue-300 rounded p-2 text-xs">
            <div>Last Update: {new Date(lastChartUpdate).toLocaleTimeString()}</div>
            <div>User Interacted: {hasUserInteractedRef.current ? 'Yes' : 'No'}</div>
            <div>Chart State: {chartStateRef.current ? 'Saved' : 'None'}</div>
            <Button 
              onClick={handleChartReset}
              className="mt-1"
              variant="outline"
              size="sm"
            >
              🔧 Reset Chart
            </Button>
            <Button 
              onClick={() => {
                if (chartRef.current) {
                  saveChartState();
                  console.log('Chart state saved manually');
                }
              }}
              className="mt-1 ml-1"
              variant="outline"
              size="sm"
            >
              💾 Save State
            </Button>
            <Button 
              onClick={() => {
                if (chartRef.current) {
                  restoreChartState();
                  console.log('Chart state restored manually');
                }
              }}
              className="mt-1 ml-1"
              variant="outline"
              size="sm"
            >
              🔄 Restore State
            </Button>
          </div>
        )}
      </div>
      
      {/* Control Buttons */}
      <div className="absolute bottom-2 left-2 z-10 flex gap-2">
        {onResetScale && (
          <Button 
            onClick={onResetScale}
            variant="outline"
            size="sm"
            className="bg-white/90 backdrop-blur-sm"
          >
            <ZoomIn className="h-4 w-4 mr-1" />
            Reset Scale
          </Button>
        )}
      </div>
      
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="absolute bottom-16 left-2 right-2 z-10">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default LiveSimpleChart;