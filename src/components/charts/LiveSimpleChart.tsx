import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { 
  initializeChartWithRetry, 
  createChartTheme, 
  safeChartCleanup, 
  isChartContainerReady,
  toUTCTimestamp,
  sortChartDataByTime,
  validateChartDataForTradingView,
  type ChartContainer,
  validateChartData,
  ValidatedChartData,
  ChartValidationResult,
  calculateChartStats,
  detectVolumeAnomalies,
  VolumeAnomaly,
  detectDoubleTop,
  detectDoubleBottom,
  DoubleTopBottomPattern,
  detectSupportResistance,
  detectTriangles,
  detectFlags,
  SupportResistanceLevel,
  TrianglePattern,
  FlagPattern
} from '@/utils/chartUtils';
import { useLiveChart, LiveChartData } from '@/hooks/useLiveChart';
import { LiveIndicatorCalculator } from '@/utils/liveIndicators';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  RefreshCw, 
  Activity,
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Settings,
  Eye,
  EyeOff
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
  showIndicators?: boolean;
  showPatterns?: boolean;
  showVolume?: boolean;
  debug?: boolean;
  onDataUpdate?: (data: CandlestickChartData[]) => void;
  onConnectionChange?: (isConnected: boolean) => void;
  onError?: (error: string) => void;
  onValidationResult?: (result: ChartValidationResult) => void;
  onStatsCalculated?: (stats: any) => void;
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
  onDataUpdate,
  onConnectionChange,
  onError,
  onValidationResult,
  onStatsCalculated
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const candlestickSeriesRef = useRef<any>(null);
  const volumeSeriesRef = useRef<any>(null);
  const patternSeriesRef = useRef<{ [key: string]: any }>({});
  const [isChartReady, setIsChartReady] = useState(false);
  const [chartError, setChartError] = useState<string | null>(null);
  const [isContainerReady, setIsContainerReady] = useState(false);
  const [chartStats, setChartStats] = useState<any>(null);
  const [localShowIndicators, setLocalShowIndicators] = useState(showIndicators);
  const [localShowVolume, setLocalShowVolume] = useState(false); // Disable volume by default
  const [localShowPatterns, setLocalShowPatterns] = useState(showPatterns);

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

  // Live indicator calculator instance
  const liveIndicatorCalculator = useMemo(() => new LiveIndicatorCalculator(), []);

  // Validate and process data
  const validationResult = useMemo(() => {
    return validateChartData(data);
  }, [data]);

  const validatedData = useMemo(() => {
    return validationResult.data;
  }, [validationResult]);

  // Technical Indicator Calculation Functions
  function calcSMA(values: number[], period: number): (number | null)[] {
    if (values.length < period) return new Array(values.length).fill(null);
    
    const sma: (number | null)[] = [];
    let sum = 0;
    
    for (let i = 0; i < values.length; i++) {
      if (i < period - 1) {
        sma.push(null);
        sum += values[i];
      } else {
        if (i === period - 1) {
          sum += values[i];
        } else {
          sum = sum - values[i - period] + values[i];
        }
        sma.push(sum / period);
      }
    }
    return sma;
  }

  function calcEMA(values: number[], period: number): (number | null)[] {
    if (values.length < period) return new Array(values.length).fill(null);
    
    const ema: (number | null)[] = [];
    const k = 2 / (period + 1);
    let prevEma: number | null = null;
    
    for (let i = 0; i < values.length; i++) {
      const price = values[i];
      if (prevEma === null) {
        prevEma = price;
      } else {
        prevEma = price * k + prevEma * (1 - k);
      }
      ema.push(i >= period - 1 ? prevEma : null);
    }
    return ema;
  }

  function calcRSI(values: number[], period = 14): (number | null)[] {
    if (values.length < period + 1) return new Array(values.length).fill(null);
    
    const rsi: (number | null)[] = [];
    let gains = 0;
    let losses = 0;
    
    // Calculate initial average gain and loss
    for (let i = 1; i <= period; i++) {
      const change = values[i] - values[i - 1];
      if (change > 0) {
        gains += change;
      } else {
        losses -= change;
      }
    }
    
    let avgGain = gains / period;
    let avgLoss = losses / period;
    
    // Calculate RSI for the first valid point
    const rs = avgGain / avgLoss;
    const firstRsi = 100 - (100 / (1 + rs));
    rsi.push(...new Array(period).fill(null));
    rsi.push(firstRsi);
    
    // Calculate RSI for remaining points
    for (let i = period + 1; i < values.length; i++) {
      const change = values[i] - values[i - 1];
      let currentGain = 0;
      let currentLoss = 0;
      
      if (change > 0) {
        currentGain = change;
      } else {
        currentLoss = -change;
      }
      
      avgGain = (avgGain * (period - 1) + currentGain) / period;
      avgLoss = (avgLoss * (period - 1) + currentLoss) / period;
      
      const rs = avgGain / avgLoss;
      const rsiValue = 100 - (100 / (1 + rs));
      rsi.push(rsiValue);
    }
    
    return rsi;
  }

  function calcBollingerBands(values: number[], period = 20, stdDev = 2): {
    upper: (number | null)[];
    middle: (number | null)[];
    lower: (number | null)[];
  } {
    const sma = calcSMA(values, period);
    const upper: (number | null)[] = [];
    const middle: (number | null)[] = [];
    const lower: (number | null)[] = [];
    
    for (let i = 0; i < values.length; i++) {
      if (i < period - 1) {
        upper.push(null);
        middle.push(null);
        lower.push(null);
        continue;
      }
      
      const smaValue = sma[i];
      if (smaValue === null) {
        upper.push(null);
        middle.push(null);
        lower.push(null);
        continue;
      }
      
      // Calculate standard deviation
      let sum = 0;
      for (let j = i - period + 1; j <= i; j++) {
        sum += Math.pow(values[j] - smaValue, 2);
      }
      const standardDeviation = Math.sqrt(sum / period);
      
      middle.push(smaValue);
      upper.push(smaValue + (standardDeviation * stdDev));
      lower.push(smaValue - (standardDeviation * stdDev));
    }
    
    return { upper, middle, lower };
  }

  function calcMACD(values: number[], fastPeriod = 12, slowPeriod = 26, signalPeriod = 9): {
    macd: (number | null)[];
    signal: (number | null)[];
    histogram: (number | null)[];
  } {
    const fastEMA = calcEMA(values, fastPeriod);
    const slowEMA = calcEMA(values, slowPeriod);
    
    const macd: (number | null)[] = [];
    for (let i = 0; i < values.length; i++) {
      if (fastEMA[i] !== null && slowEMA[i] !== null) {
        macd.push(fastEMA[i]! - slowEMA[i]!);
      } else {
        macd.push(null);
      }
    }
    
    const signal = calcEMA(macd.map(v => v || 0), signalPeriod);
    const histogram: (number | null)[] = [];
    
    for (let i = 0; i < values.length; i++) {
      if (macd[i] !== null && signal[i] !== null) {
        histogram.push(macd[i]! - signal[i]!);
      } else {
        histogram.push(null);
      }
    }
    
    return { macd, signal, histogram };
  }

  // Calculate indicators
  const indicators = useMemo(() => {
    if (validatedData.length === 0) return {
      sma20: [], sma50: [], sma200: [], ema12: [], ema26: [], ema50: [], rsi14: [],
      bollingerBands: { upper: [], middle: [], lower: [] },
      macd: { macd: [], signal: [], histogram: [] }
    };
    
    try {
      const closes = validatedData.map(d => d.close);
      
      return {
        sma20: calcSMA(closes, 20),
        sma50: calcSMA(closes, 50),
        sma200: calcSMA(closes, 200),
        ema12: calcEMA(closes, 12),
        ema26: calcEMA(closes, 26),
        ema50: calcEMA(closes, 50),
        rsi14: calcRSI(closes, 14),
        bollingerBands: calcBollingerBands(closes, 20, 2),
        macd: calcMACD(closes, 12, 26, 9)
      };
    } catch (error) {
      console.error('Error calculating indicators:', error);
      return {
        sma20: [], sma50: [], sma200: [], ema12: [], ema26: [], ema50: [], rsi14: [],
        bollingerBands: { upper: [], middle: [], lower: [] },
        macd: { macd: [], signal: [], histogram: [] }
      };
    }
  }, [validatedData]);

  // Pattern detection functions
  function identifyPeaksLows(prices: number[], order = 5) {
    const peaks: number[] = [];
    const lows: number[] = [];
    for (let i = order; i < prices.length - order; i++) {
      let isPeak = true;
      for (let j = i - order; j <= i + order; j++) {
        if (j !== i && prices[j] >= prices[i]) {
          isPeak = false;
          break;
        }
      }
      if (isPeak) peaks.push(i);
      let isLow = true;
      for (let j = i - order; j <= i + order; j++) {
        if (j !== i && prices[j] <= prices[i]) {
          isLow = false;
          break;
        }
      }
      if (isLow) lows.push(i);
    }
    return { peaks, lows };
  }

  function detectDivergence(prices: number[], indicator: number[], order = 5) {
    const { peaks, lows } = identifyPeaksLows(prices, order);
    const { peaks: indicatorPeaks, lows: indicatorLows } = identifyPeaksLows(indicator, order);
    
    const divergences: any[] = [];
    
    // Bullish divergence: price makes lower lows, indicator makes higher lows
    for (let i = 0; i < lows.length - 1; i++) {
      for (let j = i + 1; j < lows.length; j++) {
        const priceLow1 = prices[lows[i]];
        const priceLow2 = prices[lows[j]];
        const indicatorLow1 = indicator[lows[i]];
        const indicatorLow2 = indicator[lows[j]];
        
        if (priceLow2 < priceLow1 && indicatorLow2 > indicatorLow1) {
          divergences.push({
            type: 'bullish',
            priceIndices: [lows[i], lows[j]],
            indicatorIndices: [lows[i], lows[j]],
            priceValues: [priceLow1, priceLow2],
            indicatorValues: [indicatorLow1, indicatorLow2]
          });
        }
      }
    }
    
    // Bearish divergence: price makes higher highs, indicator makes lower highs
    for (let i = 0; i < peaks.length - 1; i++) {
      for (let j = i + 1; j < peaks.length; j++) {
        const priceHigh1 = prices[peaks[i]];
        const priceHigh2 = prices[peaks[j]];
        const indicatorHigh1 = indicator[peaks[i]];
        const indicatorHigh2 = indicator[peaks[j]];
        
        if (priceHigh2 > priceHigh1 && indicatorHigh2 < indicatorHigh1) {
          divergences.push({
            type: 'bearish',
            priceIndices: [peaks[i], peaks[j]],
            indicatorIndices: [peaks[i], peaks[j]],
            priceValues: [priceHigh1, priceHigh2],
            indicatorValues: [indicatorHigh1, indicatorHigh2]
          });
        }
      }
    }
    
    return divergences;
  }

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

  // Update local state when props change
  useEffect(() => {
    setLocalShowIndicators(showIndicators);
  }, [showIndicators]);

  // Volume is disabled by default, so we don't sync with the prop
  // useEffect(() => {
  //   setLocalShowVolume(showVolume);
  // }, [showVolume]);

  useEffect(() => {
    setLocalShowPatterns(showPatterns);
  }, [showPatterns]);

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

    // This initialization function is incomplete and conflicts with the second one
    // Removing it to avoid conflicts
    console.log('Skipping incomplete initialization, waiting for complete initialization...');
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

          // Add a small delay to ensure chart is fully initialized before data updates
          setTimeout(() => {
            console.log('Chart initialization delay completed, ready for data updates');
          }, 100);

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

              // Add volume series if enabled
              if (localShowVolume) {
                volumeSeriesRef.current = chart.addHistogramSeries({
                  color: isDark ? '#26a69a' : '#26a69a',
                  priceFormat: {
                    type: 'volume',
                  },
                  priceScaleId: '',
                  scaleMargins: {
                    top: 0.8,
                    bottom: 0,
                  },
                });
              }

              // Add technical indicators if enabled
              if (localShowIndicators) {
                // Add SMA lines
                const sma20Series = chart.addLineSeries({
                  color: isDark ? '#ff9800' : '#ff9800',
                  lineWidth: 1,
                  title: 'SMA 20',
                });

                const sma50Series = chart.addLineSeries({
                  color: isDark ? '#2196f3' : '#2196f3',
                  lineWidth: 1,
                  title: 'SMA 50',
                });

                const sma200Series = chart.addLineSeries({
                  color: isDark ? '#9c27b0' : '#9c27b0',
                  lineWidth: 2,
                  title: 'SMA 200',
                });

                // Add EMA lines
                const ema12Series = chart.addLineSeries({
                  color: isDark ? '#4caf50' : '#4caf50',
                  lineWidth: 1,
                  title: 'EMA 12',
                });

                const ema26Series = chart.addLineSeries({
                  color: isDark ? '#ff5722' : '#ff5722',
                  lineWidth: 1,
                  title: 'EMA 26',
                });

                // Add Bollinger Bands
                const bbUpperSeries = chart.addLineSeries({
                  color: isDark ? '#00bcd4' : '#00bcd4',
                  lineWidth: 1,
                  title: 'BB Upper',
                });

                const bbMiddleSeries = chart.addLineSeries({
                  color: isDark ? '#607d8b' : '#607d8b',
                  lineWidth: 1,
                  title: 'BB Middle',
                });

                const bbLowerSeries = chart.addLineSeries({
                  color: isDark ? '#00bcd4' : '#00bcd4',
                  lineWidth: 1,
                  title: 'BB Lower',
                });

                // Store series references for live updates
                patternSeriesRef.current = {
                  sma20: sma20Series,
                  sma50: sma50Series,
                  sma200: sma200Series,
                  ema12: ema12Series,
                  ema26: ema26Series,
                  bbUpper: bbUpperSeries,
                  bbMiddle: bbMiddleSeries,
                  bbLower: bbLowerSeries,
                };
              }

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

              // Set candlestick data
              if (candlestickSeriesRef.current) {
                candlestickSeriesRef.current.setData(candlestickData);
              }

              // Set volume data if enabled
              if (localShowVolume && volumeSeriesRef.current) {
                const volumeData = validatedData.map(d => ({
                  time: toUTCTimestamp(d.date),
                  value: d.volume,
                  color: d.close >= d.open ? (isDark ? '#26a69a' : '#26a69a') : (isDark ? '#ef5350' : '#ef5350'),
                }));
                volumeSeriesRef.current.setData(volumeData);
              }

              // Set indicator data if enabled
              if (localShowIndicators && patternSeriesRef.current) {
                const closes = validatedData.map(d => d.close);
                
                // Calculate indicators
                const sma20Data = calcSMA(closes, 20);
                const sma50Data = calcSMA(closes, 50);
                const sma200Data = calcSMA(closes, 200);
                const ema12Data = calcEMA(closes, 12);
                const ema26Data = calcEMA(closes, 26);
                const bbData = calcBollingerBands(closes, 20, 2);

                // Set indicator data
                if (patternSeriesRef.current?.sma20) {
                  const sma20ChartData = validatedData.map((d, i) => ({
                    time: toUTCTimestamp(d.date),
                    value: sma20Data[i] || 0,
                  })).filter(d => d.value > 0);
                  patternSeriesRef.current.sma20.setData(sma20ChartData);
                }

                if (patternSeriesRef.current?.sma50) {
                  const sma50ChartData = validatedData.map((d, i) => ({
                    time: toUTCTimestamp(d.date),
                    value: sma50Data[i] || 0,
                  })).filter(d => d.value > 0);
                  patternSeriesRef.current.sma50.setData(sma50ChartData);
                }

                if (patternSeriesRef.current?.sma200) {
                  const sma200ChartData = validatedData.map((d, i) => ({
                    time: toUTCTimestamp(d.date),
                    value: sma200Data[i] || 0,
                  })).filter(d => d.value > 0);
                  patternSeriesRef.current.sma200.setData(sma200ChartData);
                }

                if (patternSeriesRef.current?.ema12) {
                  const ema12ChartData = validatedData.map((d, i) => ({
                    time: toUTCTimestamp(d.date),
                    value: ema12Data[i] || 0,
                  })).filter(d => d.value > 0);
                  patternSeriesRef.current.ema12.setData(ema12ChartData);
                }

                if (patternSeriesRef.current?.ema26) {
                  const ema26ChartData = validatedData.map((d, i) => ({
                    time: toUTCTimestamp(d.date),
                    value: ema26Data[i] || 0,
                  })).filter(d => d.value > 0);
                  patternSeriesRef.current.ema26.setData(ema26ChartData);
                }

                if (patternSeriesRef.current?.bbUpper) {
                  const bbUpperChartData = validatedData.map((d, i) => ({
                    time: toUTCTimestamp(d.date),
                    value: bbData.upper[i] || 0,
                  })).filter(d => d.value > 0);
                  patternSeriesRef.current.bbUpper.setData(bbUpperChartData);
                }

                if (patternSeriesRef.current?.bbMiddle) {
                  const bbMiddleChartData = validatedData.map((d, i) => ({
                    time: toUTCTimestamp(d.date),
                    value: bbData.middle[i] || 0,
                  })).filter(d => d.value > 0);
                  patternSeriesRef.current.bbMiddle.setData(bbMiddleChartData);
                }

                if (patternSeriesRef.current?.bbLower) {
                  const bbLowerChartData = validatedData.map((d, i) => ({
                    time: toUTCTimestamp(d.date),
                    value: bbData.lower[i] || 0,
                  })).filter(d => d.value > 0);
                  patternSeriesRef.current.bbLower.setData(bbLowerChartData);
                }
              }

              // Fit content
              if (chart) {
                chart.timeScale().fitContent();
              }

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
  }, [data.length, isChartReady, isContainerReady, theme, width, height, localShowIndicators, localShowVolume]); // Remove timeframe from dependencies

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
          const timeIndex = validatedData.findIndex(d => toUTCTimestamp(d.date) === param.time);
          if (timeIndex !== -1) {
            const dataPoint = validatedData[timeIndex];
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
            
            // Get indicator values for this data point
            const indicatorValues = {
              sma20: indicators?.sma20?.[timeIndex] || null,
              sma50: indicators?.sma50?.[timeIndex] || null,
              sma200: indicators?.sma200?.[timeIndex] || null,
              ema12: indicators?.ema12?.[timeIndex] || null,
              ema26: indicators?.ema26?.[timeIndex] || null,
              rsi: indicators?.rsi14?.[timeIndex] || null,
              bbUpper: indicators?.bollingerBands?.upper?.[timeIndex] || null,
              bbMiddle: indicators?.bollingerBands?.middle?.[timeIndex] || null,
              bbLower: indicators?.bollingerBands?.lower?.[timeIndex] || null,
              macd: indicators?.macd?.macd?.[timeIndex] || null,
              macdSignal: indicators?.macd?.signal?.[timeIndex] || null,
              macdHistogram: indicators?.macd?.histogram?.[timeIndex] || null
            };

            // Create tooltip content
            let tooltipContent = `
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
            `;

            // Add indicator values if available
            if (localShowIndicators) {
              tooltipContent += `
                <div class="tooltip-separator"></div>
                <div class="tooltip-indicators">
              `;
              
              if (indicatorValues.sma20 !== null) {
                tooltipContent += `
                  <div class="tooltip-row">
                    <span class="tooltip-label">SMA20:</span>
                    <span class="tooltip-value">${indicatorValues.sma20.toFixed(2)}</span>
                  </div>
                `;
              }
              
              if (indicatorValues.sma50 !== null) {
                tooltipContent += `
                  <div class="tooltip-row">
                    <span class="tooltip-label">SMA50:</span>
                    <span class="tooltip-value">${indicatorValues.sma50.toFixed(2)}</span>
                  </div>
                `;
              }
              
              if (indicatorValues.ema12 !== null) {
                tooltipContent += `
                  <div class="tooltip-row">
                    <span class="tooltip-label">EMA12:</span>
                    <span class="tooltip-value">${indicatorValues.ema12.toFixed(2)}</span>
                  </div>
                `;
              }
              
              if (indicatorValues.ema26 !== null) {
                tooltipContent += `
                  <div class="tooltip-row">
                    <span class="tooltip-label">EMA26:</span>
                    <span class="tooltip-value">${indicatorValues.ema26.toFixed(2)}</span>
                  </div>
                `;
              }
              
              if (indicatorValues.rsi !== null) {
                tooltipContent += `
                  <div class="tooltip-row">
                    <span class="tooltip-label">RSI:</span>
                    <span class="tooltip-value">${indicatorValues.rsi.toFixed(2)}</span>
                  </div>
                `;
              }
              
              if (indicatorValues.macd !== null) {
                tooltipContent += `
                  <div class="tooltip-row">
                    <span class="tooltip-label">MACD:</span>
                    <span class="tooltip-value">${indicatorValues.macd.toFixed(3)}</span>
                  </div>
                `;
              }
              
              tooltipContent += `
                </div>
              `;
            }

            tooltipContent += `
              </div>
            `;

            tooltip.innerHTML = tooltipContent;
            
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
  }, [isChartReady, validatedData, timeframe, localShowIndicators, indicators]); // Remove timeframe from dependencies

  // Add candlestick series and update data
  useEffect(() => {
    console.log('Chart data effect triggered:', {
      isChartReady,
      hasChartRef: !!chartRef.current,
      dataLength: validatedData.length,
      hasData: validatedData.length > 0
    });

    if (!chartRef.current) {
      console.log('Chart not ready, skipping data update');
      return;
    }

    if (validatedData.length === 0) {
      console.log('No data available, skipping chart update');
      return;
    }

    // Wait for chart to be fully ready and series to be initialized
    if (!isChartReady || !chartRef.current || !candlestickSeriesRef.current) {
      console.log('Chart not fully ready yet, waiting for initialization...', {
        isChartReady,
        hasChartRef: !!chartRef.current,
        hasCandlestickSeries: !!candlestickSeriesRef.current
      });
      return;
    }

    // Data update logic continues below

    console.log('Updating existing candlestick series with new data...');

    try {
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

      // Update candlestick data
      if (candlestickSeriesRef.current) {
        candlestickSeriesRef.current.setData(candlestickData);
        console.log('setData called with:', candlestickData.slice(-3));
      } else {
        console.warn('Candlestick series not initialized, skipping data update');
      }

      // Update volume data if enabled
      if (localShowVolume && volumeSeriesRef.current) {
        const volumeData = validatedData.map(d => ({
          time: toUTCTimestamp(d.date),
          value: d.volume,
          color: d.close >= d.open ? 
            (theme === 'dark' ? '#26a69a' : '#26a69a') : 
            (theme === 'dark' ? '#ef5350' : '#ef5350'),
        }));
        volumeSeriesRef.current.setData(volumeData);
      }

      // Update technical indicators if enabled
      if (localShowIndicators && patternSeriesRef.current) {
        const sma20Data = validatedData.map((d, i) => ({
          time: toUTCTimestamp(d.date),
          value: indicators?.sma20?.[i] || 0,
        })).filter(d => d.value > 0);

        const sma50Data = validatedData.map((d, i) => ({
          time: toUTCTimestamp(d.date),
          value: indicators?.sma50?.[i] || 0,
        })).filter(d => d.value > 0);

        const sma200Data = validatedData.map((d, i) => ({
          time: toUTCTimestamp(d.date),
          value: indicators?.sma200?.[i] || 0,
        })).filter(d => d.value > 0);

        const ema12Data = validatedData.map((d, i) => ({
          time: toUTCTimestamp(d.date),
          value: indicators?.ema12?.[i] || 0,
        })).filter(d => d.value > 0);

        const ema26Data = validatedData.map((d, i) => ({
          time: toUTCTimestamp(d.date),
          value: indicators?.ema26?.[i] || 0,
        })).filter(d => d.value > 0);

        const bbUpperData = validatedData.map((d, i) => ({
          time: toUTCTimestamp(d.date),
          value: indicators?.bollingerBands?.upper?.[i] || 0,
        })).filter(d => d.value > 0);

        const bbMiddleData = validatedData.map((d, i) => ({
          time: toUTCTimestamp(d.date),
          value: indicators?.bollingerBands?.middle?.[i] || 0,
        })).filter(d => d.value > 0);

        const bbLowerData = validatedData.map((d, i) => ({
          time: toUTCTimestamp(d.date),
          value: indicators?.bollingerBands?.lower?.[i] || 0,
        })).filter(d => d.value > 0);

        if (patternSeriesRef.current?.sma20) patternSeriesRef.current.sma20.setData(sma20Data);
        if (patternSeriesRef.current?.sma50) patternSeriesRef.current.sma50.setData(sma50Data);
        if (patternSeriesRef.current?.sma200) patternSeriesRef.current.sma200.setData(sma200Data);
        if (patternSeriesRef.current?.ema12) patternSeriesRef.current.ema12.setData(ema12Data);
        if (patternSeriesRef.current?.ema26) patternSeriesRef.current.ema26.setData(ema26Data);
        if (patternSeriesRef.current?.bbUpper) patternSeriesRef.current.bbUpper.setData(bbUpperData);
        if (patternSeriesRef.current?.bbMiddle) patternSeriesRef.current.bbMiddle.setData(bbMiddleData);
        if (patternSeriesRef.current?.bbLower) patternSeriesRef.current.bbLower.setData(bbLowerData);
      }

      // Fit content
      if (chartRef.current) {
        chartRef.current.timeScale().fitContent();
      }

      console.log(`Live chart updated with ${candlestickData.length} data points`);

    } catch (error) {
      console.error('Error updating live chart data:', error);
      setChartError(error instanceof Error ? error.message : 'Error updating data');
    }

  }, [validatedData, theme, isChartReady, localShowIndicators, localShowVolume, indicators]); // Add isChartReady as dependency

  // Handle timeframe changes without recreating chart
  useEffect(() => {
    if (chartRef.current && candlestickSeriesRef.current) {
      console.log('Timeframe changed to:', timeframe);
      // The chart will automatically update when new data comes in
      // No need to recreate the chart for timeframe changes
    }
  }, [timeframe]);

  // Custom cleanup function that also nullifies series references
  const cleanupChartAndSeries = () => {
    if (chartRef.current) {
      console.log('Cleaning up chart and series references...');
      safeChartCleanup(chartRef);
      // Nullify series references
      candlestickSeriesRef.current = null;
      volumeSeriesRef.current = null;
      patternSeriesRef.current = null;
      setIsChartReady(false);
      setChartError(null);
    }
  };

  // Recreate chart when toggle states change
  useEffect(() => {
    if (chartRef.current) {
      console.log('Toggle states changed, recreating chart...');
      cleanupChartAndSeries();
    }
  }, [localShowIndicators, localShowVolume, localShowPatterns]);

  // Update stats
  useEffect(() => {
    try {
      const calculatedStats = calculateChartStats(validatedData);
      setChartStats(calculatedStats);
      
      if (onStatsCalculated && calculatedStats) {
        onStatsCalculated(calculatedStats);
      }
      
      if (debug && calculatedStats) {
        console.log('Chart Statistics:', calculatedStats);
      }
    } catch (error) {
      console.error('Error calculating chart stats:', error);
      setChartStats(null);
    }
  }, [validatedData, onStatsCalculated, debug]);

  // Handle validation result callback
  useEffect(() => {
    if (onValidationResult) {
      onValidationResult(validationResult);
    }
  }, [validationResult, onValidationResult]);



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
        cleanupChartAndSeries();
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
    const [showControls, setShowControls] = useState(false);

    return (
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
            onClick={refetch}
            disabled={isLoading}
            className="h-8 px-2"
          >
            <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        
        {showControls && (
          <div className="flex flex-col gap-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-2 shadow-lg">
            <div className="flex items-center gap-2 text-xs">
              <Button
                size="sm"
                variant={localShowIndicators ? "default" : "outline"}
                onClick={() => setLocalShowIndicators(!localShowIndicators)}
                className="h-6 px-2 text-xs"
              >
                {localShowIndicators ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                Indicators
              </Button>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Button
                size="sm"
                variant={localShowVolume ? "default" : "outline"}
                onClick={() => setLocalShowVolume(!localShowVolume)}
                className="h-6 px-2 text-xs"
              >
                {localShowVolume ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                Volume
              </Button>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Button
                size="sm"
                variant={localShowPatterns ? "default" : "outline"}
                onClick={() => setLocalShowPatterns(!localShowPatterns)}
                className="h-6 px-2 text-xs"
              >
                {localShowPatterns ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                Patterns
              </Button>
            </div>
          </div>
        )}
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
          
          #candlestick-tooltip .tooltip-separator {
            height: 1px;
            background-color: #e5e7eb;
            margin: 6px 0;
          }
          
          #candlestick-tooltip .tooltip-indicators {
            margin-top: 4px;
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
          
          .dark #candlestick-tooltip .tooltip-separator {
            background-color: #4b5563;
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
        
        {debug && chartStats && (
          <div className="absolute top-16 left-2 z-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-3 shadow-lg max-w-xs">
            <h3 className="font-bold mb-2 text-sm">Chart Statistics</h3>
            <div className="text-xs space-y-1">
              <div>Data Points: {validatedData.length}</div>
              <div>Price Range: ₹{chartStats?.priceRange?.min?.toFixed(2) || 'N/A'} - ₹{chartStats?.priceRange?.max?.toFixed(2) || 'N/A'}</div>
              <div>Volume Range: {chartStats?.volumeRange?.min?.toLocaleString() || 'N/A'} - {chartStats?.volumeRange?.max?.toLocaleString() || 'N/A'}</div>
              <div>Current Price: ₹{validatedData[validatedData.length - 1]?.close?.toFixed(2) || 'N/A'}</div>
              <div>Price Change: {chartStats?.priceChange?.toFixed(2) || 'N/A'}%</div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default LiveSimpleChart; 