import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { createChart, IChartApi, ISeriesApi, CandlestickData, LineData, HistogramData } from 'lightweight-charts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatPercentage } from '@/utils/numberFormatter';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TrendingUp, TrendingDown, Minus, Activity, Wifi, WifiOff, RefreshCw, Settings, ZoomIn, AlertTriangle } from 'lucide-react';
import { toUTCTimestamp, validateChartDataForTradingView, initializeChartWithRetry, createChartTheme, safeChartCleanup, type ChartContainer, calcSMA } from '@/utils/chartUtils';

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
  const volumeChartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const volumeChartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const obvSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const avgVolumeSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const volumeScaleFactorRef = useRef<number>(1); // Store volume scaling factor
  const isMountedRef = useRef(true);
  const lastSymbolRef = useRef(symbol);
  const lastTimeframeRef = useRef(timeframe);
  const lastDataRef = useRef<CandlestickData[]>([]);
  const lastVolumeDataRef = useRef<any[]>([]);
  const isInitializingRef = useRef(false);
  const isNewSymbolRef = useRef(false);
  const isInitialLoadRef = useRef(true);
  const chartStateRef = useRef<ChartState | null>(null);
  const volumeChartStateRef = useRef<ChartState | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const volumeResizeObserverRef = useRef<ResizeObserver | null>(null);
  const initializationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initializationAttemptsRef = useRef(0);
  const isSyncingTimeScaleRef = useRef(false);

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

      // console.log('💾 Chart state saved:', currentState);
    } catch (error) {
      // console.warn('Error saving chart state:', error);
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

      // console.log('🔄 Chart state restored:', chartStateRef.current);
    } catch (error) {
      // console.warn('Error restoring chart state:', error);
    }
  }, [debug]);

  // Synchronize time scales between price and volume charts
  const syncTimeScales = useCallback((sourceChart: IChartApi, targetChart: IChartApi) => {
    if (isSyncingTimeScaleRef.current) return;
    
    try {
      const sourceTimeScale = sourceChart.timeScale();
      const targetTimeScale = targetChart.timeScale();
      const visibleRange = sourceTimeScale.getVisibleRange();
      
      if (visibleRange) {
        isSyncingTimeScaleRef.current = true;
        targetTimeScale.setVisibleRange(visibleRange);
        setTimeout(() => {
          isSyncingTimeScaleRef.current = false;
        }, 0);
      }
    } catch (error) {
      isSyncingTimeScaleRef.current = false;
    }
  }, []);

  // Handle user interaction (zoom, pan, etc.)
  const handleUserInteraction = useCallback(() => {
    hasUserInteractedRef.current = true;
    // Sync time scales when user interacts
    if (chartRef.current && volumeChartRef.current) {
      syncTimeScales(chartRef.current, volumeChartRef.current);
    }
    // console.log('👆 User interaction detected');
  }, [syncTimeScales]);

  // Calculate volume scaling factor based on max volume
  const calculateVolumeScaleFactor = useCallback((validatedData: any[]): number => {
    if (validatedData.length === 0) return 1;
    
    const maxVolume = Math.max(...validatedData.map(d => d.volume));
    
    // Determine appropriate scaling factor
    if (maxVolume >= 1000000000) {
      return 1000000000; // Billions
    } else if (maxVolume >= 1000000) {
      return 1000000; // Millions
    } else if (maxVolume >= 1000) {
      return 1000; // Thousands
    } else {
      return 1; // No scaling
    }
  }, []);

  // Prepare volume data with color coding and scaling
  const prepareVolumeData = useCallback((validatedData: any[]): HistogramData[] => {
    // Calculate and store scaling factor
    const scaleFactor = calculateVolumeScaleFactor(validatedData);
    volumeScaleFactorRef.current = scaleFactor;
    
    return validatedData.map((d, index) => {
      const prevClose = index > 0 ? validatedData[index - 1].close : d.close;
      const isUp = d.close >= prevClose;
      
      return {
        time: d.time as any,
        value: d.volume / scaleFactor, // Scale down the volume
        color: isUp ? '#26a69a' : '#ef5350', // Green for up, red for down
      };
    });
  }, [calculateVolumeScaleFactor]);

  // Calculate OBV (On-Balance Volume)
  const calculateOBV = useCallback((validatedData: any[]): LineData[] => {
    if (validatedData.length === 0) return [];
    
    let obv = 0;
    const obvData: LineData[] = [];
    
    validatedData.forEach((d, index) => {
      if (index === 0) {
        // First data point: OBV starts at 0 or first volume
        obv = d.volume;
      } else {
        const prevClose = validatedData[index - 1].close;
        const currentClose = d.close;
        
        if (currentClose > prevClose) {
          // Price up: add volume
          obv = obv + d.volume;
        } else if (currentClose < prevClose) {
          // Price down: subtract volume
          obv = obv - d.volume;
        }
        // If price unchanged, OBV stays the same
      }
      
      obvData.push({
        time: d.time as any,
        value: obv,
      });
    });
    
    return obvData;
  }, []);

  // Calculate Average Volume (SMA of volume) with scaling
  const calculateAverageVolume = useCallback((validatedData: any[], period: number = 20): LineData[] => {
    if (validatedData.length === 0) return [];
    
    const scaleFactor = volumeScaleFactorRef.current || calculateVolumeScaleFactor(validatedData);
    const volumes = validatedData.map(d => d.volume);
    const smaValues = calcSMA(volumes, period);
    
    return validatedData.map((d, index) => ({
      time: d.time as any,
      value: smaValues[index] !== null && smaValues[index] !== undefined ? (smaValues[index]! / scaleFactor) : null, // Scale down the average volume
    })).filter(d => d.value !== null) as LineData[];
  }, [calculateVolumeScaleFactor]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // console.log('🧹 Cleaning up LiveSimpleChart component');
      isMountedRef.current = false;
      
      // Clear any pending timeouts
      if (initializationTimeoutRef.current) {
        clearTimeout(initializationTimeoutRef.current);
        initializationTimeoutRef.current = null;
      }
      
      // Cleanup resize observers
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      }
      if (volumeResizeObserverRef.current) {
        volumeResizeObserverRef.current.disconnect();
        volumeResizeObserverRef.current = null;
      }
      
      // Cleanup charts
      if (chartRef.current) {
        try {
          safeChartCleanup(chartRef);
        } catch (error) {
          // console.warn('Error during chart cleanup:', error);
        }
        chartRef.current = null;
        candlestickSeriesRef.current = null;
      }
      if (volumeChartRef.current) {
        try {
          safeChartCleanup(volumeChartRef);
        } catch (error) {
          // console.warn('Error during volume chart cleanup:', error);
        }
        volumeChartRef.current = null;
        volumeSeriesRef.current = null;
        obvSeriesRef.current = null;
        avgVolumeSeriesRef.current = null;
      }
    };
  }, []); // Only run on unmount

  // Improved container readiness detection with better timing
  useEffect(() => {
    const container = chartContainerRef.current;
    const volumeContainer = volumeChartContainerRef.current;
    if (!container || !volumeContainer) return;

    const checkContainerReady = () => {
      const rect = container.getBoundingClientRect();
      const volumeRect = volumeContainer.getBoundingClientRect();
      
      // Check if both containers have dimensions and are visible
      const hasWidth = container.clientWidth > 0 || container.offsetWidth > 0 || rect.width > 0;
      const hasHeight = container.clientHeight > 0 || container.offsetHeight > 0 || rect.height > 0;
      const volumeHasWidth = volumeContainer.clientWidth > 0 || volumeContainer.offsetWidth > 0 || volumeRect.width > 0;
      const volumeHasHeight = volumeContainer.clientHeight > 0 || volumeContainer.offsetHeight > 0 || volumeRect.height > 0;
      
      if (container && hasWidth && hasHeight && container.offsetParent !== null &&
          volumeContainer && volumeHasWidth && volumeHasHeight && volumeContainer.offsetParent !== null) {
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
      // Use ResizeObserver to detect when containers get dimensions
      () => {
        if (window.ResizeObserver && container && volumeContainer) {
          const observer = new ResizeObserver((entries) => {
            let containerReady = false;
            let volumeContainerReady = false;
            for (const entry of entries) {
              if (entry.target === container && entry.contentRect.width > 0 && entry.contentRect.height > 0) {
                containerReady = true;
              }
              if (entry.target === volumeContainer && entry.contentRect.width > 0 && entry.contentRect.height > 0) {
                volumeContainerReady = true;
              }
              if (containerReady && volumeContainerReady) {
                setContainerReady(true);
                observer.disconnect();
                return;
              }
            }
          });
          observer.observe(container);
          observer.observe(volumeContainer);
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

  // Force container ready when data is available and containers exist
  useEffect(() => {
    if (data && data.length > 0 && chartContainerRef.current && volumeChartContainerRef.current && !containerReady) {
      const container = chartContainerRef.current;
      const volumeContainer = volumeChartContainerRef.current;
      if ((container.clientWidth > 0 || container.offsetWidth > 0) && 
          (volumeContainer.clientWidth > 0 || volumeContainer.offsetWidth > 0)) {
        setContainerReady(true);
      }
    }
  }, [data, containerReady]);

  // Detect symbol changes
  useEffect(() => {
    if (lastSymbolRef.current !== symbol) {
      // console.log('Symbol changed from', lastSymbolRef.current, 'to', symbol);
      isNewSymbolRef.current = true;
      lastSymbolRef.current = symbol;
      
      // Reset chart state for new symbol
      setIsChartReady(false);
      setChartError(null);
      initializationAttemptsRef.current = 0;
      lastDataRef.current = []; // Clear stored data
      lastVolumeDataRef.current = [];
      
      // Reset chart state management for new symbol
      chartStateRef.current = null;
      hasUserInteractedRef.current = false;
      isInitialLoadRef.current = true;
      
      // Cleanup existing charts
      if (chartRef.current) {
        try {
          if (resizeObserverRef.current) {
            resizeObserverRef.current.disconnect();
            resizeObserverRef.current = null;
          }
          safeChartCleanup(chartRef);
        } catch (error) {
          // console.warn('Error during symbol change cleanup:', error);
        }
        chartRef.current = null;
        candlestickSeriesRef.current = null;
      }
      if (volumeChartRef.current) {
        try {
          if (volumeResizeObserverRef.current) {
            volumeResizeObserverRef.current.disconnect();
            volumeResizeObserverRef.current = null;
          }
          safeChartCleanup(volumeChartRef);
        } catch (error) {
          // console.warn('Error during volume chart cleanup:', error);
        }
        volumeChartRef.current = null;
        volumeSeriesRef.current = null;
        obvSeriesRef.current = null;
        avgVolumeSeriesRef.current = null;
      }
    }
  }, [symbol]);

  // Detect timeframe changes
  useEffect(() => {
    if (lastTimeframeRef.current !== timeframe) {
      // console.log('Timeframe changed from', lastTimeframeRef.current, 'to', timeframe);
      lastTimeframeRef.current = timeframe;
      
      // Reset chart state for new timeframe
      setIsChartReady(false);
      setChartError(null);
      initializationAttemptsRef.current = 0;
      lastDataRef.current = []; // Clear stored data
      lastVolumeDataRef.current = [];
      
      // Reset chart state management for new timeframe
      chartStateRef.current = null;
      hasUserInteractedRef.current = false;
      isInitialLoadRef.current = true;
      
      // Cleanup existing charts
      if (chartRef.current) {
        try {
          if (resizeObserverRef.current) {
            resizeObserverRef.current.disconnect();
            resizeObserverRef.current = null;
          }
          safeChartCleanup(chartRef);
        } catch (error) {
          // console.warn('Error during timeframe change cleanup:', error);
        }
        chartRef.current = null;
        candlestickSeriesRef.current = null;
      }
      if (volumeChartRef.current) {
        try {
          if (volumeResizeObserverRef.current) {
            volumeResizeObserverRef.current.disconnect();
            volumeResizeObserverRef.current = null;
          }
          safeChartCleanup(volumeChartRef);
        } catch (error) {
          // console.warn('Error during volume chart cleanup:', error);
        }
        volumeChartRef.current = null;
        volumeSeriesRef.current = null;
        obvSeriesRef.current = null;
        avgVolumeSeriesRef.current = null;
      }
    }
  }, [timeframe]);

  // Chart initialization with proper lifecycle management
  const initializeChart = useCallback(async () => {
    // Prevent multiple simultaneous initializations
    if (isInitializingRef.current) {
      // console.log('Chart initialization already in progress, skipping...');
      return;
    }

    // Check if component is still mounted
    if (!isMountedRef.current) {
      // console.log('Component unmounted, skipping chart initialization');
      return;
    }

    // Check if containers are ready with better validation
    if (!chartContainerRef.current || !volumeChartContainerRef.current) {
      // console.log('Container ref not available, will retry when available');
      // Don't retry immediately - let the container readiness effect handle this
      return;
    }

    const container = chartContainerRef.current;
    const volumeContainer = volumeChartContainerRef.current;
    
    // Check container dimensions with comprehensive validation
    const rect = container.getBoundingClientRect();
    const volumeRect = volumeContainer.getBoundingClientRect();
    const containerWidth = container.clientWidth || container.offsetWidth || rect.width;
    const containerHeight = container.clientHeight || container.offsetHeight || rect.height;
    const volumeContainerWidth = volumeContainer.clientWidth || volumeContainer.offsetWidth || volumeRect.width;
    const volumeContainerHeight = volumeContainer.clientHeight || volumeContainer.offsetHeight || volumeRect.height;
    
    if (containerWidth === 0 || containerHeight === 0 || volumeContainerWidth === 0 || volumeContainerHeight === 0) {
      // console.log('Container has no dimensions yet, waiting for container to be ready', {
      //   clientWidth: container.clientWidth,
      //   clientHeight: container.clientHeight,
      //   offsetWidth: container.offsetWidth,
      //   offsetHeight: container.offsetHeight,
      //   rectWidth: rect.width,
      //   rectHeight: rect.height
      // });
      // Don't retry immediately - let the container readiness effect handle this
      return;
    }

    // console.log('🚀 Starting chart initialization for:', symbol, timeframe);
    // console.log('Container dimensions:', {
    //   width: containerWidth,
    //   height: containerHeight,
    //   clientWidth: container.clientWidth,
    //   clientHeight: container.clientHeight,
    //   offsetWidth: container.offsetWidth,
    //   offsetHeight: container.offsetHeight,
    //   rectWidth: rect.width,
    //   rectHeight: rect.height
    // });

    isInitializingRef.current = true;
    setChartError(null);

    try {
      // Clear containers
      container.innerHTML = '';
      volumeContainer.innerHTML = '';

      // Create price chart with proper configuration - use actual container dimensions
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
        priceScaleId: 'right',
      });

      // Store series reference
      candlestickSeriesRef.current = candlestickSeries;

      // Create volume chart with proper configuration
      const volumeChart = createChart(volumeContainer, {
        width: volumeContainer.clientWidth || volumeContainerWidth,
        height: volumeContainer.clientHeight || volumeContainerHeight,
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
          visible: true,
          tickMarkFormatter: (time: number) => {
            const date = new Date(time * 1000);
            if (timeframe === '1d' || timeframe === '1day') {
              return date.toLocaleDateString('en-IN', { 
                timeZone: 'Asia/Kolkata',
                month: 'short', 
                day: 'numeric',
                year: 'numeric'
              });
            } else if (timeframe === '1h' || timeframe === '60min' || timeframe === '60minute') {
              return date.toLocaleDateString('en-IN', { 
                timeZone: 'Asia/Kolkata',
                month: 'short', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
              });
            } else {
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
          visible: true, // Show right scale for volume plot
          autoScale: true,
          scaleMargins: {
            top: 0.1,
            bottom: 0.1,
          },
          borderColor: theme === 'dark' ? '#2a2a2a' : '#e1e1e1',
        },
        leftPriceScale: {
          visible: false, // Hide left scale (volume moved to right)
          autoScale: true,
          borderColor: theme === 'dark' ? '#2a2a2a' : '#e1e1e1',
        },
        watermark: {
          visible: true,
          color: theme === 'dark' ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)',
          fontSize: 12,
          horzAlign: 'left',
          vertAlign: 'top',
          text: '', // Will be set dynamically based on scale factor
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
            const utcDate = new Date(time * 1000);
            if (timeframe === '1d' || timeframe === '1day') {
              return utcDate.toLocaleDateString('en-IN', { 
                timeZone: 'Asia/Kolkata',
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
              });
            } else if (timeframe === '1h' || timeframe === '60min' || timeframe === '60minute') {
              return utcDate.toLocaleDateString('en-IN', { 
                timeZone: 'Asia/Kolkata',
                month: 'short', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
              });
            } else {
              return utcDate.toLocaleTimeString('en-IN', { 
                timeZone: 'Asia/Kolkata',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
              });
            }
          },
          priceFormatter: (price: number) => {
            // Format scaled volume to minimum 6 digits total with appropriate decimal places
            const priceStr = price.toString();
            const parts = priceStr.split('.');
            const integerPart = parts[0];
            const decimalPart = parts[1] || '';
            
            // Calculate how many digits we have
            const totalDigits = integerPart.length + decimalPart.length;
            
            // If we have less than 6 digits, add more decimal places
            if (totalDigits < 6) {
              const neededDecimals = Math.max(2, 6 - integerPart.length);
              return price.toFixed(neededDecimals);
            } else {
              // If we already have 6+ digits, show 4 decimal places for precision
              return price.toFixed(4);
            }
          },
        },
      });

      // Store volume chart reference
      volumeChartRef.current = volumeChart;

      // Create volume histogram series in volume chart
      const volumeSeries = volumeChart.addHistogramSeries({
        priceScaleId: 'right', // Y-axis on the right side
        priceFormat: {
          type: 'volume',
        },
        color: '#26a69a', // Default color (will be overridden per bar)
      });
      volumeSeriesRef.current = volumeSeries;

      // OBV plot disabled
      // const obvSeries = volumeChart.addLineSeries({
      //   priceScaleId: 'right',
      //   color: '#9c27b0', // Purple color for OBV line
      //   lineWidth: 2,
      //   priceFormat: {
      //     type: 'price',
      //     precision: 0,
      //     minMove: 1,
      //   },
      //   title: 'OBV',
      // });
      obvSeriesRef.current = null;

      // Create average volume line series in volume chart
      const avgVolumeSeries = volumeChart.addLineSeries({
        priceScaleId: 'right', // Use same scale as volume histogram (right side)
        color: '#ff9800', // Orange color for average volume line
        lineWidth: 2,
        priceFormat: {
          type: 'volume',
        },
        title: 'Avg Volume (20)',
      });
      avgVolumeSeriesRef.current = avgVolumeSeries;

      // console.log('Chart and candlestick series created successfully');

      // Set chart as ready
      setIsChartReady(true);
      initializationAttemptsRef.current = 0; // Reset attempts counter

      // Add user interaction handlers to detect zoom/pan and synchronize time scales
      const timeScale = chart.timeScale();
      const volumeTimeScale = volumeChart.timeScale();
      
      // Subscribe to time scale changes (zoom/pan) - sync from price to volume
      timeScale.subscribeVisibleTimeRangeChange(() => {
        handleUserInteraction();
        // Sync volume chart time scale with price chart
        if (volumeChartRef.current && !isSyncingTimeScaleRef.current) {
          syncTimeScales(chart, volumeChart);
          // OBV disabled - no need to update OBV scale
          // if (obvSeriesRef.current) {
          //   try {
          //     const rightPriceScale = volumeChart.priceScale('right');
          //     if (rightPriceScale) {
          //       rightPriceScale.applyOptions({ autoScale: true });
          //     }
          //   } catch (error) {
          //     // Ignore errors during scale update
          //   }
          // }
        }
      });

      // Subscribe to volume chart time scale changes - sync from volume to price
      volumeTimeScale.subscribeVisibleTimeRangeChange(() => {
        // Sync price chart time scale with volume chart
        if (chartRef.current && !isSyncingTimeScaleRef.current) {
          syncTimeScales(volumeChart, chart);
        }
        // OBV disabled - no need to update OBV scale
        // if (obvSeriesRef.current) {
        //   try {
        //     const rightPriceScale = volumeChart.priceScale('right');
        //     if (rightPriceScale) {
        //       rightPriceScale.applyOptions({ autoScale: true });
        //     }
        //   } catch (error) {
        //     // Ignore errors during scale update
        //   }
        // }
      });

      // Add resize handler for price chart
      const handleResize = () => {
        if (chart && container) {
          try {
            const newWidth = container.clientWidth || container.offsetWidth || container.getBoundingClientRect().width;
            const newHeight = container.clientHeight || container.offsetHeight || container.getBoundingClientRect().height;
            
            if (newWidth > 0 && newHeight > 0) {
              chart.applyOptions({
                width: newWidth,
                height: newHeight,
              });
            }
          } catch (error) {
            if (error instanceof Error && error.message.includes('disposed')) {
              chartRef.current = null;
            }
          }
        }
      };

      // Add resize handler for volume chart
      const handleVolumeResize = () => {
        if (volumeChart && volumeContainer) {
          try {
            const newWidth = volumeContainer.clientWidth || volumeContainer.offsetWidth || volumeContainer.getBoundingClientRect().width;
            const newHeight = volumeContainer.clientHeight || volumeContainer.offsetHeight || volumeContainer.getBoundingClientRect().height;
            
            if (newWidth > 0 && newHeight > 0) {
              volumeChart.applyOptions({
                width: newWidth,
                height: newHeight,
              });
            }
          } catch (error) {
            if (error instanceof Error && error.message.includes('disposed')) {
              volumeChartRef.current = null;
            }
          }
        }
      };

      // Store resize observer references
      if (window.ResizeObserver) {
        resizeObserverRef.current = new ResizeObserver(handleResize);
        resizeObserverRef.current.observe(container);
        volumeResizeObserverRef.current = new ResizeObserver(handleVolumeResize);
        volumeResizeObserverRef.current.observe(volumeContainer);
      }

      // Register reset function if callback provided
      if (onRegisterReset) {
        onRegisterReset(() => {
          if (chart && volumeChart) {
            // Reset user interaction state when manually resetting
            hasUserInteractedRef.current = false;
            chartStateRef.current = null;
            volumeChartStateRef.current = null;
            // Reset both charts
            chart.timeScale().fitContent();
            volumeChart.timeScale().fitContent();
          }
        });
      }

    } catch (error) {
      // console.error('Error during chart initialization:', error);
      setChartError(error instanceof Error ? error.message : 'Chart initialization failed');
      setIsChartReady(false);
    } finally {
      isInitializingRef.current = false;
    }
  }, [symbol, timeframe, theme, onRegisterReset, syncTimeScales, handleUserInteraction]); // Added dependencies

  // Trigger chart initialization when ready
  useEffect(() => {
    // Clear any pending initialization
    if (initializationTimeoutRef.current) {
      clearTimeout(initializationTimeoutRef.current);
      initializationTimeoutRef.current = null;
    }

    // console.log('Chart initialization trigger check:', {
    //   isChartReady,
    //   containerReady,
    //   hasData: data && data.length > 0,
    //   dataLength: data?.length || 0,
    //   containerExists: !!chartContainerRef.current,
    //   containerDimensions: chartContainerRef.current ? {
    //     clientWidth: chartContainerRef.current.clientWidth,
    //     clientHeight: chartContainerRef.current.clientHeight,
    //     offsetWidth: chartContainerRef.current.offsetWidth,
    //     offsetHeight: chartContainerRef.current.offsetHeight
    //   } : null
    // });

    // Start initialization if chart is not ready and container is ready
    if (!isChartReady && containerReady && chartContainerRef.current) {
      const container = chartContainerRef.current;
      const rect = container.getBoundingClientRect();
      const hasDimensions = (container.clientWidth > 0 || container.offsetWidth > 0 || rect.width > 0) && 
                           (container.clientHeight > 0 || container.offsetHeight > 0 || rect.height > 0);
      
      if (hasDimensions) {
        // console.log('Starting chart initialization with dimensions:', {
        //   clientWidth: container.clientWidth,
        //   clientHeight: container.clientHeight,
        //   offsetWidth: container.offsetWidth,
        //   offsetHeight: container.offsetHeight,
        //   rectWidth: rect.width,
        //   rectHeight: rect.height
        // });
        initializeChart();
      } else {
        // console.log('Container ready but no dimensions yet, waiting...');
      }
    } else {
      // console.log('Chart initialization conditions not met:', {
      //   isChartReady,
      //   containerReady,
      //   containerExists: !!chartContainerRef.current,
      //   hasDimensions: chartContainerRef.current ? 
      //     ((chartContainerRef.current.clientWidth > 0 || chartContainerRef.current.offsetWidth > 0 || chartContainerRef.current.getBoundingClientRect().width > 0) && 
      //      (chartContainerRef.current.clientHeight > 0 || chartContainerRef.current.offsetHeight > 0 || chartContainerRef.current.getBoundingClientRect().height > 0)) : false
      // });
    }
  }, [initializeChart, containerReady, isChartReady]);

  // Fallback initialization trigger - ensure chart initializes even if container detection fails
  useEffect(() => {
    if (!isChartReady && data && data.length > 0 && chartContainerRef.current && volumeChartContainerRef.current) {
      const container = chartContainerRef.current;
      const volumeContainer = volumeChartContainerRef.current;
      const hasDimensions = (container.clientWidth > 0 || container.offsetWidth > 0) && 
                           (container.clientHeight > 0 || container.offsetHeight > 0);
      const volumeHasDimensions = (volumeContainer.clientWidth > 0 || volumeContainer.offsetWidth > 0) && 
                                 (volumeContainer.clientHeight > 0 || volumeContainer.offsetHeight > 0);
      
      // If we have data and containers exist but chart isn't ready, try to initialize
      if (hasDimensions && volumeHasDimensions && !isInitializingRef.current) {
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
          // console.log('Resize effect - updating chart dimensions:', { width: newWidth, height: newHeight });
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
    if (!isChartReady || !chartRef.current || !candlestickSeriesRef.current || !volumeChartRef.current || !volumeSeriesRef.current || !avgVolumeSeriesRef.current) {
      return;
    }

      // Handle case when data is cleared (empty array)
      if (!data || data.length === 0) {
        // console.log('Data cleared, resetting chart state');
        lastDataRef.current = [];
        // Clear candlestick series data
        if (candlestickSeriesRef.current) {
          candlestickSeriesRef.current.setData([]);
        }
        // Clear volume series data
        if (volumeSeriesRef.current) {
          volumeSeriesRef.current.setData([]);
        }
        if (avgVolumeSeriesRef.current) {
          avgVolumeSeriesRef.current.setData([]);
        }
        // OBV disabled
        // if (obvSeriesRef.current) {
        //   obvSeriesRef.current.setData([]);
        // }
        lastVolumeDataRef.current = [];
        return;
      }

    try {
      const validatedData = validateChartDataForTradingView(data);
      
      // Debug timestamp values
      // console.log('Raw data timestamps:', data.slice(0, 5).map(d => ({
      //   date: d.date,
      //   time: d.time,
      //   convertedDate: new Date(d.time * 1000).toISOString()
      // })));
      
      const candlestickData = validatedData.map(d => ({
        time: d.time as any, // Cast to any to satisfy TradingView's Time type
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
      })) as any; // Cast the entire array to satisfy TradingView's type requirements

      // Prepare volume data (this will calculate and store the scale factor)
      const volumeData = prepareVolumeData(validatedData);
      
      // Update watermark with scale factor
      const scaleFactor = volumeScaleFactorRef.current;
      let scaleText = '';
      if (scaleFactor >= 1000000000) {
        scaleText = 'Volume × 1B';
      } else if (scaleFactor >= 1000000) {
        scaleText = 'Volume × 1M';
      } else if (scaleFactor >= 1000) {
        scaleText = 'Volume × 1K';
      } else {
        scaleText = 'Volume';
      }
      
      // Update volume chart watermark
      if (volumeChartRef.current) {
        volumeChartRef.current.applyOptions({
          watermark: {
            visible: true,
            color: theme === 'dark' ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)',
            fontSize: 12,
            horzAlign: 'left',
            vertAlign: 'top',
            text: scaleText,
          },
        });
      }
      
      // Calculate average volume data
      const avgVolumeData = calculateAverageVolume(validatedData, 20);
      
      // OBV disabled
      // const obvData = calculateOBV(validatedData);

      // Debug processed timestamps
      // console.log('Processed candlestick timestamps:', candlestickData.slice(0, 5).map(d => ({
      //   time: d.time,
      //   date: new Date(d.time * 1000).toISOString(),
      //   localTime: new Date(d.time * 1000).toLocaleString()
      // })));

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

      // console.log('Chart data update analysis:', {
      //   dataLength: candlestickData.length,
      //   lastDataLength: lastDataRef.current.length,
      //   isNewDataset,
      //   isTickUpdate,
      //   isNewSymbol: isNewSymbolRef.current,
      //   firstTime: candlestickData[0]?.time,
      //   lastDataFirstTime: lastDataRef.current[0]?.time
      // });

      if (isNewDataset || isNewSymbolRef.current) {
        // Save current chart state before updating data
        if (hasUserInteractedRef.current) {
          saveChartState();
        }
        
        // Full dataset update
        candlestickSeriesRef.current.setData(candlestickData as any);
        lastDataRef.current = candlestickData as any;
        // console.log('Full dataset updated:', candlestickData.length, 'candles');
        
        // Update volume series
        if (volumeSeriesRef.current) {
          volumeSeriesRef.current.setData(volumeData as any);
          lastVolumeDataRef.current = volumeData as any;
        }
        
        // Update average volume series
        if (avgVolumeSeriesRef.current) {
          avgVolumeSeriesRef.current.setData(avgVolumeData as any);
        }
        
        // OBV disabled
        // if (obvSeriesRef.current) {
        //   obvSeriesRef.current.setData(obvData as any);
        // }
        
        // Only fit content for new symbol, preserve user's view for same symbol
        if (isNewSymbolRef.current) {
          if (chartRef.current) {
            chartRef.current.timeScale().fitContent();
          }
          if (volumeChartRef.current) {
            volumeChartRef.current.timeScale().fitContent();
          }
          // Reset the flag after using it to prevent repeated fit-content on subsequent updates
          isNewSymbolRef.current = false;
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
            // console.log('Live tick update:', {
            //   oldClose: lastStoredCandle.close,
            //   newClose: newLastCandle.close,
            //   oldHigh: lastStoredCandle.high,
            //   newHigh: newLastCandle.high,
            //   oldLow: lastStoredCandle.low,
            //   newLow: newLastCandle.low
            // });
          }
        }
        
        // Update volume series for tick update
        if (volumeSeriesRef.current && volumeData.length > 0) {
          const lastVolume = volumeData[volumeData.length - 1];
          const lastStoredVolume = lastVolumeDataRef.current.length > 0 
            ? lastVolumeDataRef.current[lastVolumeDataRef.current.length - 1] 
            : null;
          
          // Check if volume changed
          if (!lastStoredVolume || lastStoredVolume.value !== lastVolume.value || lastStoredVolume.time !== lastVolume.time) {
            volumeSeriesRef.current.update(lastVolume as any);
            // Update the stored reference array
            if (lastVolumeDataRef.current.length === volumeData.length) {
              lastVolumeDataRef.current[lastVolumeDataRef.current.length - 1] = lastVolume;
            } else {
              lastVolumeDataRef.current = [...lastVolumeDataRef.current.slice(0, -1), lastVolume];
            }
          }
        }
        
        // Update average volume series for tick update
        if (avgVolumeSeriesRef.current && avgVolumeData.length > 0) {
          const lastAvgVolume = avgVolumeData[avgVolumeData.length - 1];
          avgVolumeSeriesRef.current.update(lastAvgVolume as any);
        }
        
        // OBV disabled
        // if (obvSeriesRef.current && obvData.length > 0) {
        //   const lastOBV = obvData[obvData.length - 1];
        //   obvSeriesRef.current.update(lastOBV as any);
        // }
        
        // Update the stored data reference
        lastDataRef.current = candlestickData as any;
      } else {
        // New candle added or other data change
        const lastStoredCandle = lastDataRef.current[lastDataRef.current.length - 1];
        const newLastCandle = candlestickData[candlestickData.length - 1];

        if (lastStoredCandle && newLastCandle && candlestickData.length > lastDataRef.current.length) {
          // New candle added
          candlestickSeriesRef.current.update(newLastCandle as any);
          // console.log('New candle added:', newLastCandle);
        }
        
        // Update volume series for new candle
        if (volumeSeriesRef.current && volumeData.length > lastVolumeDataRef.current.length) {
          const lastVolume = volumeData[volumeData.length - 1];
          volumeSeriesRef.current.update(lastVolume as any);
          // Update stored volume data reference
          lastVolumeDataRef.current = [...lastVolumeDataRef.current, lastVolume];
        } else if (volumeSeriesRef.current && volumeData.length === lastVolumeDataRef.current.length && volumeData.length > 0) {
          // Update last volume bar if it changed
          const lastVolume = volumeData[volumeData.length - 1];
          const lastStoredVolume = lastVolumeDataRef.current[lastVolumeDataRef.current.length - 1];
          if (!lastStoredVolume || lastStoredVolume.value !== lastVolume.value || lastStoredVolume.time !== lastVolume.time) {
            volumeSeriesRef.current.update(lastVolume as any);
            lastVolumeDataRef.current[lastVolumeDataRef.current.length - 1] = lastVolume;
          }
        }
        
        // Update average volume series for new candle
        if (avgVolumeSeriesRef.current && avgVolumeData.length > 0) {
          const lastAvgVolume = avgVolumeData[avgVolumeData.length - 1];
          avgVolumeSeriesRef.current.update(lastAvgVolume as any);
        }
        
        // OBV disabled
        // if (obvSeriesRef.current && obvData.length > 0) {
        //   const lastOBV = obvData[obvData.length - 1];
        //   obvSeriesRef.current.update(lastOBV as any);
        // }
        
        // Update the stored data reference
        lastDataRef.current = candlestickData as any;
      }

      setLastChartUpdate(Date.now());
    } catch (error) {
      // console.error('Error updating chart data:', error);
    }
  }, [data, isChartReady, saveChartState, restoreChartState, prepareVolumeData, calculateAverageVolume, theme]); // Added theme to dependencies for watermark

  // Handle chart reset
  const handleChartReset = useCallback(() => {
    // console.log('🔄 Manual chart reset triggered');
    
    // Cleanup existing charts
    if (chartRef.current) {
      try {
        safeChartCleanup(chartRef);
      } catch (error) {
        // console.warn('Error during manual chart cleanup:', error);
      }
    }
    if (volumeChartRef.current) {
      try {
        safeChartCleanup(volumeChartRef);
      } catch (error) {
        // console.warn('Error during volume chart cleanup:', error);
      }
    }
    
    // Reset state
    chartRef.current = null;
    volumeChartRef.current = null;
    candlestickSeriesRef.current = null;
    volumeSeriesRef.current = null;
    setIsChartReady(false);
    setChartError(null);
    initializationAttemptsRef.current = 0;
    lastDataRef.current = [];
    lastVolumeDataRef.current = [];
    
    // Reset chart state management
    chartStateRef.current = null;
    volumeChartStateRef.current = null;
    hasUserInteractedRef.current = false;
    isInitialLoadRef.current = true;
    
    // Reset container ready state to force re-detection
    setContainerReady(false);
    
    // Restart initialization with proper timing
    setTimeout(() => {
      if (isMountedRef.current && chartContainerRef.current && volumeChartContainerRef.current) {
        const container = chartContainerRef.current;
        const volumeContainer = volumeChartContainerRef.current;
        const hasDimensions = (container.clientWidth > 0 || container.offsetWidth > 0) && 
                             (container.clientHeight > 0 || container.offsetHeight > 0);
        const volumeHasDimensions = (volumeContainer.clientWidth > 0 || volumeContainer.offsetWidth > 0) && 
                                   (volumeContainer.clientHeight > 0 || volumeContainer.offsetHeight > 0);
        
        if (hasDimensions && volumeHasDimensions) {
          setContainerReady(true);
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
                            {formatCurrency(currentPrice)}
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
        className="chart-container-responsive relative bg-white rounded-b-[var(--radius)] overflow-hidden" 
        style={{ 
          height: '100%',
          minHeight: `clamp(280px, 60vh, ${height}px)`,
          maxWidth: '100%',
          width: '100%',
          position: 'relative'
        }}
      >
        {/* Price Chart Container - Takes 70% of height */}
        <div 
          ref={chartContainerRef} 
          className="w-full absolute"
          style={{ 
            top: 0,
            left: 0,
            right: 0,
            height: '70%',
            overflow: 'hidden',
            pointerEvents: 'auto',
            isolation: 'isolate',
            backgroundColor: debug ? 'rgba(255, 0, 0, 0.1)' : 'transparent',
          }}
          data-chart-container="price"
          data-symbol={symbol}
          data-timeframe={timeframe}
        />
        
        {/* Volume Chart Container - Takes 30% of height */}
        <div 
          ref={volumeChartContainerRef} 
          className="w-full absolute"
          style={{ 
            bottom: 0,
            left: 0,
            right: 0,
            height: '30%',
            overflow: 'hidden',
            pointerEvents: 'auto',
            isolation: 'isolate',
            backgroundColor: debug ? 'rgba(0, 255, 0, 0.1)' : 'transparent',
          }}
          data-chart-container="volume"
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
                  // console.log('Chart state saved manually');
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
                  // console.log('Chart state restored manually');
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