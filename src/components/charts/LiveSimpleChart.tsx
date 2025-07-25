import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { 
  initializeChartWithRetry, 
  createChartTheme, 
  safeChartCleanup, 
  toUTCTimestamp,
  validateChartDataForTradingView,
  type ChartContainer
} from '@/utils/chartUtils';
import { useLiveChart } from '@/hooks/useLiveChart';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, Activity, Settings, TrendingUp, TrendingDown, ZoomIn } from 'lucide-react';

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
  data?: any[]; // Accept data as prop
  isConnected?: boolean;
  isLive?: boolean;
  isLoading?: boolean;
  error?: string | null;
  lastUpdate?: number;
  connectionStatus?: string;
  refetch?: () => void; // Add refetch function
  onDataUpdate?: (data: any[]) => void;
  onConnectionChange?: (isConnected: boolean) => void;
  onError?: (error: string) => void;
  onValidationResult?: (result: any) => void;
  onStatsCalculated?: (stats: any) => void;
  onResetScale?: () => void; // Add reset scale callback
  onRegisterReset?: (resetFn: () => void) => void; // Add reset function registration
  activeIndicators?: {
    sma20?: boolean;
    sma50?: boolean;
    ema12?: boolean;
    ema26?: boolean;
    ema50?: boolean;
    sma200?: boolean;
    bollingerBands?: boolean;
    macd?: boolean;
    stochastic?: boolean;
    atr?: boolean;
    obv?: boolean;
    rsiDivergence?: boolean;
    doublePatterns?: boolean;
    volumeAnomaly?: boolean;
    peaksLows?: boolean;
    support?: boolean;
    resistance?: boolean;
    trianglesFlags?: boolean;
  };
}

// Interface for chart state preservation
interface ChartState {
  visibleRange?: {
    from: number;
    to: number;
  };
  timeScale?: {
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
  priceScale?: {
    autoScale: boolean;
    scaleMargins: {
      top: number;
      bottom: number;
    };
  };
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
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const candlestickSeriesRef = useRef<any>(null);
  
  // Chart state
  const [isChartReady, setIsChartReady] = useState(false);
  const [chartError, setChartError] = useState<string | null>(null);
  const [showControls, setShowControls] = useState(false);
  const [lastChartUpdate, setLastChartUpdate] = useState<number>(0);

  // Chart reset functionality
  const chartRef = useRef<ChartContainer | null>(null);
  const chartStateRef = useRef<ChartState | null>(null);
  const [isInitialState, setIsInitialState] = useState(true);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  // Reset functionality
  const saveChartState = useCallback(() => {
    if (chartRef.current) {
      const timeScale = chartRef.current.timeScale();
      const priceScale = chartRef.current.priceScale('right');
      
      chartStateRef.current = {
        timeScale: {
          rightOffset: timeScale.options().rightOffset || 0,
          barSpacing: timeScale.options().barSpacing || 0,
          fixLeftEdge: timeScale.options().fixLeftEdge || false,
          fixRightEdge: timeScale.options().fixRightEdge || false,
          lockVisibleTimeRangeOnResize: timeScale.options().lockVisibleTimeRangeOnResize || false,
          rightBarStaysOnScroll: timeScale.options().rightBarStaysOnScroll || false,
          borderVisible: timeScale.options().borderVisible || false,
          visible: timeScale.options().visible || false,
          timeVisible: timeScale.options().timeVisible || false,
          secondsVisible: timeScale.options().secondsVisible || false,
        },
        priceScale: {
          autoScale: priceScale.options().autoScale || false,
          scaleMargins: {
            top: priceScale.options().scaleMargins?.top || 0,
            bottom: priceScale.options().scaleMargins?.bottom || 0,
          },
        },
      };
    }
  }, []);

  const restoreChartState = useCallback(() => {
    if (chartRef.current && chartStateRef.current) {
      const timeScale = chartRef.current.timeScale();
      const priceScale = chartRef.current.priceScale('right');
      
      timeScale.applyOptions(chartStateRef.current.timeScale);
      priceScale.applyOptions(chartStateRef.current.priceScale);
    }
  }, []);

  const resetToInitialState = useCallback(() => {
    if (chartRef.current) {
      const timeScale = chartRef.current.timeScale();
      const priceScale = chartRef.current.priceScale('right');
      
      // Reset to default settings
      timeScale.applyOptions({
        rightOffset: 0,
        barSpacing: 6,
        fixLeftEdge: false,
        fixRightEdge: false,
        lockVisibleTimeRangeOnResize: false,
        rightBarStaysOnScroll: false,
        borderVisible: false,
        visible: true,
        timeVisible: true,
        secondsVisible: false,
      });
      
      priceScale.applyOptions({
        autoScale: true,
        scaleMargins: { top: 0.1, bottom: 0.1 },
      });
      
      setIsInitialState(true);
      setHasUserInteracted(false);
      
      if (debug) {
        console.log('Live chart reset to initial state');
      }
    }
  }, [debug]);

  const resetToFitContent = useCallback(() => {
    if (chartRef.current) {
      chartRef.current.timeScale().fitContent();
      if (debug) {
        console.log('Live chart reset to fit content');
      }
    }
  }, [debug]);

  const handleUserInteraction = useCallback(() => {
    setHasUserInteracted(true);
    setIsInitialState(false);
  }, []);

  const handleChartUpdate = useCallback(() => {
    // Handle chart updates
    if (debug) {
      console.log('Chart update handled');
    }
  }, [debug]);

  // Legacy refs for compatibility
  const lastSymbolRef = useRef<string>('');
  const lastTimeframeRef = useRef<string>('');
  const lastThemeRef = useRef<string>('');
  const isInitialLoadRef = useRef<boolean>(true);

  // Live price state with better tracking
  const [livePrice, setLivePrice] = useState<number | null>(null);
  const [prevLivePrice, setPrevLivePrice] = useState<number | null>(null);
  const [priceChange, setPriceChange] = useState<number>(0);
  const [priceChangePercent, setPriceChangePercent] = useState<number>(0);
  const [lastTickTime, setLastTickTime] = useState<number>(0);

  // Debouncing for chart updates
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastDataRef = useRef<any[]>([]);

  // Memoized price direction for better performance
  const priceDirection = useMemo(() => {
    if (prevLivePrice === null || livePrice === null) return 'neutral';
    if (livePrice > prevLivePrice) return 'up';
    if (livePrice < prevLivePrice) return 'down';
    return 'neutral';
  }, [livePrice, prevLivePrice]);

  // Enhanced price tracking with change calculation
  const updateLivePrice = useCallback((newPrice: number) => {
    if (livePrice !== null) {
      const change = newPrice - livePrice;
      const changePercent = (change / livePrice) * 100;
      
      setPrevLivePrice(livePrice);
      setPriceChange(change);
      setPriceChangePercent(changePercent);
      setLastTickTime(Date.now());
    }
    setLivePrice(newPrice);
  }, [livePrice]);



  // Enhanced chart data update with validation and state preservation
  const updateChartData = useCallback(() => {
    if (!chartRef.current || !candlestickSeriesRef.current || data === null || data.length === 0) {
      return;
    }

    try {
      const validatedData = validateChartDataForTradingView(data);
      
      // Convert to candlestick format
      const candlestickData = validatedData.map(d => ({
        time: toUTCTimestamp(d.date),
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
      }));

      // Check if this is initial load or update
      const isInitialLoad = lastDataRef.current.length === 0;
      
      if (isInitialLoad) {
        // Initial load - use setData
        candlestickSeriesRef.current.setData(candlestickData);
        console.log('Initial chart data loaded:', candlestickData.length, 'candles');
      } else {
        // Live update - check if we have new data
        const lastStoredData = lastDataRef.current;
        const lastStoredCandle = lastStoredData[lastStoredData.length - 1];
        const newLastCandle = candlestickData[candlestickData.length - 1];
        
        // Use hook's chart update handler
        handleChartUpdate();
        
        // Check if user is zoomed in (not at the rightmost edge)
        const timeScale = chartRef.current.timeScale();
        const visibleRange = timeScale.getVisibleRange();
        const isUserZoomedIn = visibleRange && 
          visibleRange.to < candlestickData[candlestickData.length - 1].time;
        
        if (lastStoredCandle && newLastCandle && 
            lastStoredCandle.time === newLastCandle.time) {
          // Same candle, update it
          candlestickSeriesRef.current.update(newLastCandle);
          console.log('Updated last candle:', newLastCandle);
        } else if (candlestickData.length > lastStoredData.length) {
          // New candle added
          candlestickSeriesRef.current.setData(candlestickData);
          console.log('New candle added, updated chart');
          
          // If user is zoomed in, don't auto-scroll to keep their view
          // If user is at the rightmost edge, auto-scroll to show new data
          if (!isUserZoomedIn) {
            // Auto-scroll to show the latest data
            timeScale.scrollToPosition(0, false);
          }
        } else {
          // Full update
          candlestickSeriesRef.current.setData(candlestickData);
          console.log('Full chart update');
        }
      }

      // Volume data update removed - volume is displayed in separate chart below

      // Store last data for comparison
      lastDataRef.current = candlestickData;
      
      // Update last chart update time
      setLastChartUpdate(Date.now());
      
      if (debug) {
        console.log('📊 Chart data updated:', {
          candles: candlestickData.length,
          lastCandle: candlestickData[candlestickData.length - 1],
          isInitialLoad
        });
      }

    } catch (error) {
      console.error('Error updating chart data:', error);
      setChartError(error instanceof Error ? error.message : 'Error updating chart data');
    }
  }, [data, showVolume, saveChartState, restoreChartState, debug]);

  // Handle chart re-initialization with state preservation
  const reinitializeChartWithState = useCallback(async () => {
    if (!chartContainerRef.current || data === null || data.length === 0) {
      return;
    }

    try {
      console.log('🔄 Re-initializing chart with state preservation');
      
      // Save current state before re-initialization
      saveChartState();
      
      // Clean up existing chart
      if (chartRef.current) {
        safeChartCleanup(chartRef);
        candlestickSeriesRef.current = null;
        setIsChartReady(false);
      }

      // Re-initialize chart
      const chart = await initializeChartWithRetry(
        chartContainerRef as ChartContainer,
        { width, height, theme, timeframe },
        { 
          width, 
          height, 
          ...createChartTheme(theme === 'dark', { timeframe }),
          // Add better zoom and interaction options
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
          // Improve time scale behavior
          timeScale: {
            ...createChartTheme(theme === 'dark', { timeframe }).timeScale,
            rightOffset: 12,
            barSpacing: 3,
            fixLeftEdge: false,
            fixRightEdge: false,
            lockVisibleTimeRangeOnResize: false,
            rightBarStaysOnScroll: true,
            borderVisible: true,
            visible: true,
            timeVisible: true,
            secondsVisible: false,
          },
          // Improve price scale behavior
          rightPriceScale: {
            ...createChartTheme(theme === 'dark', { timeframe }).rightPriceScale,
            autoScale: true,
            scaleMargins: {
              top: 0.1,
              bottom: 0.1,
            },
          },
        }
      );

      if (!chart) {
        throw new Error('Failed to create chart');
      }

      chartRef.current = chart;
      setIsChartReady(true);
      setChartError(null);

      // Add candlestick series with enhanced styling
      candlestickSeriesRef.current = chart.addCandlestickSeries({
        upColor: theme === 'dark' ? '#26a69a' : '#26a69a',
        downColor: theme === 'dark' ? '#ef5350' : '#ef5350',
        borderVisible: false,
        wickUpColor: theme === 'dark' ? '#26a69a' : '#26a69a',
        wickDownColor: theme === 'dark' ? '#ef5350' : '#ef5350',
      });

      // Volume series removed from main chart - volume is displayed in separate chart below

      // Add event listeners for chart interactions to save state
      const timeScale = chart.timeScale();
      const priceScale = chart.priceScale('right');

      // Save state when user interacts with the chart
      const saveStateOnInteraction = () => {
        setTimeout(() => {
          saveChartState();
        }, 100); // Small delay to ensure interaction is complete
      };

      // Listen for time scale changes (zoom, pan, etc.)
      timeScale.subscribeVisibleTimeRangeChange(saveStateOnInteraction);
      timeScale.subscribeVisibleLogicalRangeChange(saveStateOnInteraction);

      // Listen for price scale changes
      priceScale.subscribeVisiblePriceRangeChange(saveStateOnInteraction);

      // Set data and restore state
      updateChartData();
      
      // Restore state after a short delay to ensure chart is ready
      setTimeout(() => {
        restoreChartState();
      }, 100);

      setLastChartUpdate(Date.now());
      console.log('✅ Chart re-initialized with state preservation');

    } catch (error) {
      console.error('Error re-initializing chart:', error);
      setChartError(error instanceof Error ? error.message : 'Error re-initializing chart');
      setIsChartReady(false);
    }
  }, [width, height, theme, timeframe, data, showVolume, saveChartState, restoreChartState]);

  // Notify parent components
  useEffect(() => {
    onConnectionChange?.(isConnected || false);
  }, [isConnected, onConnectionChange]);

  useEffect(() => {
    if (error) {
      onError?.(error);
      setChartError(error);
    } else {
      setChartError(null);
    }
  }, [error, onError]);

  // Call onDataUpdate whenever data changes OR when live price updates
  useEffect(() => {
    if (data && data.length > 0) {
      onDataUpdate?.(data);
      
      // Update live price from latest data
      const lastClose = data[data.length - 1].close;
      if (lastClose !== livePrice) {
        console.log('Updating live price from data:', { old: livePrice, new: lastClose });
        updateLivePrice(lastClose);
      }
    }
  }, [data, onDataUpdate, livePrice, updateLivePrice]);

  // Additional effect to call onDataUpdate on every tick price change
  useEffect(() => {
    if (livePrice !== null && data && data.length > 0) {
      // Create a copy of data with updated live price for the callback
      const updatedData = [...data];
      if (updatedData.length > 0) {
        updatedData[updatedData.length - 1] = {
          ...updatedData[updatedData.length - 1],
          close: livePrice
        };
        onDataUpdate?.(updatedData);
        console.log('Live price update triggered onDataUpdate:', livePrice);
      }
    }
  }, [livePrice, data, onDataUpdate]);

  // Check if chart needs re-initialization
  const needsReinitialization = useCallback(() => {
    return (
      lastSymbolRef.current !== symbol ||
      lastTimeframeRef.current !== timeframe ||
      lastThemeRef.current !== theme ||
      !chartRef.current ||
      !isChartReady
    );
  }, [symbol, timeframe, theme, isChartReady]);

  // Initialize chart when data is available OR when symbol changes
  useEffect(() => {
    // Only re-initialize if necessary
    if (!needsReinitialization()) {
      return;
    }

    // Destroy existing chart if symbol/timeframe/theme changes
    if (chartRef.current) {
      console.log('Destroying existing chart for symbol/timeframe/theme change');
      saveChartState(); // Save state before destroying
      safeChartCleanup(chartRef);
      candlestickSeriesRef.current = null;
      setIsChartReady(false);
      chartRef.current = null;
      // Reset last data reference for new symbol
      lastDataRef.current = [];
    }

    if (!chartContainerRef.current || data === null || data.length === 0) {
      return;
    }

    const initializeChart = async () => {
      try {
        console.log('Initializing chart for:', symbol, timeframe);
        
        const chart = await initializeChartWithRetry(
          chartContainerRef as ChartContainer,
          { width, height, theme, timeframe },
          { 
            width, 
            height, 
            ...createChartTheme(theme === 'dark', { timeframe }),
            // Add better zoom and interaction options
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
            // Improve time scale behavior
            timeScale: {
              ...createChartTheme(theme === 'dark', { timeframe }).timeScale,
              rightOffset: 12,
              barSpacing: 3,
              fixLeftEdge: false,
              fixRightEdge: false,
              lockVisibleTimeRangeOnResize: false,
              rightBarStaysOnScroll: true,
              borderVisible: true,
              visible: true,
              timeVisible: true,
              secondsVisible: false,
            },
            // Improve price scale behavior
            rightPriceScale: {
              ...createChartTheme(theme === 'dark', { timeframe }).rightPriceScale,
              autoScale: true,
              scaleMargins: {
                top: 0.1,
                bottom: 0.1,
              },
            },
          }
        );

        if (!chart) {
          throw new Error('Failed to create chart');
        }

        chartRef.current = chart;
        setIsChartReady(true);
        setChartError(null);

        // Add candlestick series with enhanced styling
        candlestickSeriesRef.current = chart.addCandlestickSeries({
          upColor: theme === 'dark' ? '#26a69a' : '#26a69a',
          downColor: theme === 'dark' ? '#ef5350' : '#ef5350',
          borderVisible: false,
          wickUpColor: theme === 'dark' ? '#26a69a' : '#26a69a',
          wickDownColor: theme === 'dark' ? '#ef5350' : '#ef5350',
        });

        // Volume series removed from main chart - volume is displayed in separate chart below

        // Add event listeners for chart interactions
        const timeScale = chart.timeScale();
        const priceScale = chart.priceScale('right');

        // Handle user interactions
        const handleInteraction = () => {
          setTimeout(() => {
            handleUserInteraction();
            saveChartState();
          }, 100); // Small delay to ensure interaction is complete
        };

        // Listen for time scale changes (zoom, pan, etc.)
        timeScale.subscribeVisibleTimeRangeChange(handleInteraction);
        timeScale.subscribeVisibleLogicalRangeChange(handleInteraction);

        // Listen for price scale changes (if method exists)
        if (priceScale.subscribeVisiblePriceRangeChange) {
          priceScale.subscribeVisiblePriceRangeChange(handleInteraction);
        }

        // Set initial data
        updateChartData();
        setLastChartUpdate(Date.now());

        // Update refs
        lastSymbolRef.current = symbol;
        lastTimeframeRef.current = timeframe;
        lastThemeRef.current = theme;
        isInitialLoadRef.current = false;

        console.log('Chart initialized successfully');

      } catch (error) {
        console.error('Error initializing chart:', error);
        setChartError(error instanceof Error ? error.message : 'Error initializing chart');
        setIsChartReady(false);
      }
    };

    initializeChart();
  }, [symbol, timeframe, theme, data, width, height, showVolume, needsReinitialization]); // Removed data from dependencies



  // Update chart when data changes (immediate for live updates)
  useEffect(() => {
    if (isChartReady && data && data.length > 0) {
      console.log('🔄 LiveSimpleChart received data update:', {
        dataLength: data.length,
        lastCandle: data[data.length - 1],
        isChartReady,
        hasChartRef: !!chartRef.current,
        hasCandlestickSeries: !!candlestickSeriesRef.current
      });
      updateChartData();
      setLastChartUpdate(Date.now());
    }
  }, [data, isChartReady, updateChartData]);

  // Handle resize with throttling
  useEffect(() => {
    let resizeTimeout: NodeJS.Timeout;
    
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        if (chartRef.current && chartContainerRef.current) {
          const rect = chartContainerRef.current.getBoundingClientRect();
          chartRef.current.applyOptions({
            width: rect.width,
            height: rect.height,
          });
        }
      }, 250); // Throttle resize updates
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimeout);
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      if (chartRef.current) {
        saveChartState(); // Save state before cleanup
        safeChartCleanup(chartRef);
        candlestickSeriesRef.current = null;
        setIsChartReady(false);
      }
    };
  }, [symbol, theme, saveChartState]);

  // Connection status component
  const ConnectionStatus = () => {
    if (!showConnectionStatus) return null;

    const getStatusIcon = () => {
      switch (connectionStatus) {
        case 'connected':
          return <div className="w-2 h-2 bg-green-500 rounded-full" title="Connected" />;
        case 'connecting':
          return <RefreshCw className="w-3 h-3 text-yellow-500 animate-spin" title="Connecting..." />;
        case 'error':
          return <div className="w-2 h-2 bg-red-500 rounded-full" title="Connection Error" />;
        default:
          return <div className="w-2 h-2 bg-gray-500 rounded-full" title="Disconnected" />;
      }
    };

    const getStatusText = () => {
      switch (connectionStatus) {
        case 'connected':
          return isLive ? 'Live' : 'Connected';
        case 'connecting':
          return 'Connecting...';
        case 'error':
          return 'Error';
        default:
          return 'Disconnected';
      }
    };

    return (
      <div className="absolute top-2 right-2 z-10">
        <Badge variant="outline" className="flex items-center gap-1 text-xs">
          {getStatusIcon()}
          {getStatusText()}
        </Badge>
      </div>
    );
  };

  // Enhanced live indicator component
  const LiveIndicator = () => {
    if (!showLiveIndicator || !isLive) return null;

    return (
      <div className="absolute top-2 left-2 z-10">
        <Badge variant="destructive" className="flex items-center gap-1 animate-pulse text-xs">
          <Activity className="w-3 h-3" />
          LIVE
        </Badge>
      </div>
    );
  };

  // Enhanced live price display
  const LivePriceDisplay = () => {
    if (livePrice === null) return null;

    const getPriceColor = () => {
      switch (priceDirection) {
        case 'up':
          return 'bg-green-100 text-green-700 border-green-400';
        case 'down':
          return 'bg-red-100 text-red-700 border-red-400';
        default:
          return 'bg-gray-200 text-gray-800 border-gray-400';
      }
    };

    const getPriceIcon = () => {
      switch (priceDirection) {
        case 'up':
          return <TrendingUp className="w-4 h-4 text-green-600" />;
        case 'down':
          return <TrendingDown className="w-4 h-4 text-red-600" />;
        default:
          return null;
      }
    };

    return (
      <div
        className={`absolute top-2 left-1/2 -translate-x-1/2 z-20 px-4 py-2 rounded-lg shadow-lg border transition-all duration-300 ${getPriceColor()}`}
        style={{ minWidth: 140, textAlign: 'center' }}
      >
        <div className="flex items-center justify-center gap-2">
          {getPriceIcon()}
          <span className="text-lg font-bold">₹{livePrice.toFixed(2)}</span>
        </div>
        {priceChange !== 0 && (
          <div className={`text-sm font-semibold ${priceChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {priceChange > 0 ? '+' : ''}{priceChange.toFixed(2)} ({priceChangePercent > 0 ? '+' : ''}{priceChangePercent.toFixed(2)}%)
          </div>
        )}
        {lastTickTime > 0 && (
          <div className="text-xs text-gray-500 mt-1">
            {new Date(lastTickTime).toLocaleTimeString()}
          </div>
        )}
      </div>
    );
  };

  // Reset scale function - use hook's resetToInitialState
  const resetScale = useCallback(() => {
    resetToInitialState();
    // Call parent callback if provided
    onResetScale?.();
  }, [resetToInitialState, onResetScale]);

  // Register reset function with parent component
  useEffect(() => {
    if (onRegisterReset) {
      onRegisterReset(resetScale);
    }
  }, [onRegisterReset, resetScale]);

  // Control buttons component
  const ControlButtons = () => (
    <div className="absolute bottom-2 right-2 z-10 flex flex-col gap-2">
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowControls(!showControls)}
          className="h-8 px-2"
        >
          <Settings className="w-3 h-3" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            refetch?.();
          }}
          disabled={isLoading}
          className="h-8 px-2"
        >
          <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={resetScale}
          className="h-8 px-2"
          title="Reset chart scale to fit all data"
        >
          <ZoomIn className="w-3 h-3" />
        </Button>
        {debug && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              reinitializeChartWithState();
            }}
            className="h-8 px-2"
            title="Re-initialize chart with state preservation"
          >
            🔄
          </Button>
        )}
      </div>
      {debug && (
        <div className="text-xs text-gray-500 bg-white/80 p-2 rounded max-w-xs">
          <div>Last Update: {new Date(lastChartUpdate).toLocaleTimeString()}</div>
          <div>Data Points: {data ? data.length : 0}</div>
          <div>Connection: {connectionStatus}</div>
          <div>Chart Ready: {isChartReady ? '✅' : '❌'}</div>
          {chartRef.current && (
            <div>
              <div>Zoom State: {chartStateRef.current.visibleRange ? 'Saved' : 'Not saved'}</div>
              {chartStateRef.current.visibleRange && (
                <div className="text-xs">
                  Range: {new Date(chartStateRef.current.visibleRange.from * 1000).toLocaleTimeString()} - {new Date(chartStateRef.current.visibleRange.to * 1000).toLocaleTimeString()}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );

  // Error display
  if (chartError) {
    return (
      <div className="relative w-full h-full">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <p className="text-red-600 mb-2">Chart Error</p>
            <p className="text-sm text-gray-500">{chartError}</p>
            <Button 
              onClick={() => {
                setChartError(null);
                refetch?.();
              }} 
              className="mt-4"
              variant="outline"
            >
              Retry
            </Button>
          </div>
        </div>
        <ControlButtons />
      </div>
    );
  }

  // Loading state
  if (isLoading && data === null || data === undefined || data.length === 0) {
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
        <ControlButtons />
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <LivePriceDisplay />
      <ConnectionStatus />
      <LiveIndicator />
      
      {/* Chart container */}
      <div 
        ref={chartContainerRef} 
        className="w-full h-full" 
        style={{ 
          minHeight: `${height}px`,
          minWidth: `${width}px`
        }}
      />
      
      <ControlButtons />
      
      {error && (
        <Alert variant="destructive" className="absolute bottom-16 left-2 right-2 z-10">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default LiveSimpleChart; 