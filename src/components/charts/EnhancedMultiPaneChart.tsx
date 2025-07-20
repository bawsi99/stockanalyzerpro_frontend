import React, { useEffect, useRef, useState, useCallback, useMemo, useImperativeHandle } from "react";
import {
  createChart,
  IChartApi,
  ISeriesApi,
  UTCTimestamp,
  CandlestickData,
  HistogramData,
  LineData,
  ColorType,
  CandlestickSeries,
  HistogramSeries,
  LineSeries,
  AreaSeries,
} from "lightweight-charts";
import { ChartData } from "@/types/analysis";
import { validateChartData, ValidatedChartData, ChartValidationResult, calculateChartStats, detectVolumeAnomalies, VolumeAnomaly, detectDoubleTop, detectDoubleBottom, DoubleTopBottomPattern, detectSupportResistance, detectTriangles, detectFlags, SupportResistanceLevel, TrianglePattern, FlagPattern } from "@/utils/chartUtils";

// Extend Window interface for global timeout tracking
declare global {
  interface Window {
    chartTimeouts?: number[];
  }
}

// Interface for chart statistics used in EnhancedMultiPaneChart
interface ChartStats {
  dateRange: { start: string; end: string; days: number };
  price: { min: number; max: number; current: number };
  volume: { avg: number; total: number };
  returns: { avg: number; volatility: number };
}

interface EnhancedMultiPaneChartProps {
  data: ChartData[];
  theme?: "light" | "dark";
  height?: number;
  debug?: boolean;
  onValidationResult?: (result: ChartValidationResult) => void;
  onStatsCalculated?: (stats: ChartStats) => void;
  overlays?: {
    showRsiDivergence: boolean;
  };
  chartType?: 'candlestick' | 'line';
  onChartTypeChange?: (type: 'candlestick' | 'line') => void;
  onClearAll?: () => void;
  onShowAll?: () => void;
  onToggleShortcuts?: () => void;
  showShortcuts?: boolean;
  onActiveIndicatorsChange?: (indicators: any) => void;
}

// Add responsive hook at the top of the component
const useResponsiveChart = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);
  
  return { isMobile, isTablet };
};

// ---- Utility helpers ---- //
const toTimestamp = (iso: string): UTCTimestamp => {
  let timestamp: number;
  
  try {
    // Try parsing as ISO string first
    timestamp = Date.parse(iso);
    
    // If that fails, try parsing without timezone offset
    if (isNaN(timestamp)) {
      const dateWithoutTz = iso.replace(/[+-]\d{2}:\d{2}$/, '');
      timestamp = Date.parse(dateWithoutTz);
    }
    
    if (isNaN(timestamp)) {
      console.warn(`Invalid date format: ${iso}`);
      return 0 as UTCTimestamp;
    }
    
    return (timestamp / 1000) as UTCTimestamp;
  } catch (error) {
    console.warn(`Error parsing date: ${iso}`, error);
    return 0 as UTCTimestamp;
  }
};

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
  let gainSum = 0;
  let lossSum = 0;

  for (let i = 1; i < values.length; i++) {
    const change = values[i] - values[i - 1];
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? -change : 0;

    if (i <= period) {
      gainSum += gain;
      lossSum += loss;
      if (i === period) {
        const avgGain = gainSum / period;
        const avgLoss = lossSum / period;
        const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
        const rsiValue = 100 - 100 / (1 + rs);
        // Ensure RSI value is within 0-100 range
        rsi.push(Math.max(0, Math.min(100, rsiValue)));
      } else {
        rsi.push(null);
      }
      continue;
    }

    gainSum = (gainSum * (period - 1) + gain) / period;
    lossSum = (lossSum * (period - 1) + loss) / period;
    const rs = lossSum === 0 ? 100 : gainSum / lossSum;
    const rsiValue = 100 - 100 / (1 + rs);
    // Ensure RSI value is within 0-100 range
    rsi.push(Math.max(0, Math.min(100, rsiValue)));
  }

  rsi.unshift(null);
  return rsi;
}

function calcBollingerBands(values: number[], period = 20, stdDev = 2): {
  upper: (number | null)[];
  middle: (number | null)[];
  lower: (number | null)[];
} {
  if (values.length < period) {
    return {
      upper: new Array(values.length).fill(null),
      middle: new Array(values.length).fill(null),
      lower: new Array(values.length).fill(null)
    };
  }

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

    const slice = values.slice(i - period + 1, i + 1);
    const sma = slice.reduce((sum, val) => sum + val, 0) / period;
    const variance = slice.reduce((sum, val) => sum + Math.pow(val - sma, 2), 0) / period;
    const standardDeviation = Math.sqrt(variance);

    middle.push(sma);
    upper.push(sma + (standardDeviation * stdDev));
    lower.push(sma - (standardDeviation * stdDev));
  }

  return { upper, middle, lower };
}

function calcMACD(values: number[], fastPeriod = 12, slowPeriod = 26, signalPeriod = 9): {
  macd: (number | null)[];
  signal: (number | null)[];
  histogram: (number | null)[];
} {
  if (values.length < slowPeriod) {
    return {
      macd: new Array(values.length).fill(null),
      signal: new Array(values.length).fill(null),
      histogram: new Array(values.length).fill(null)
    };
  }

  const emaFast = calcEMA(values, fastPeriod);
  const emaSlow = calcEMA(values, slowPeriod);
  
  const macd: (number | null)[] = [];
  for (let i = 0; i < values.length; i++) {
    if (emaFast[i] !== null && emaSlow[i] !== null) {
      macd.push(emaFast[i]! - emaSlow[i]!);
    } else {
      macd.push(null);
    }
  }

  const signal = calcEMA(macd.filter(val => val !== null) as number[], signalPeriod);
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

function calcStochastic(highs: number[], lows: number[], closes: number[], kPeriod = 14, dPeriod = 3): {
  k: (number | null)[];
  d: (number | null)[];
} {
  if (highs.length < kPeriod) {
    return {
      k: new Array(highs.length).fill(null),
      d: new Array(highs.length).fill(null)
    };
  }

  const k: (number | null)[] = [];
  
  for (let i = 0; i < highs.length; i++) {
    if (i < kPeriod - 1) {
      k.push(null);
      continue;
    }

    const highSlice = highs.slice(i - kPeriod + 1, i + 1);
    const lowSlice = lows.slice(i - kPeriod + 1, i + 1);
    const close = closes[i];

    const highestHigh = Math.max(...highSlice);
    const lowestLow = Math.min(...lowSlice);
    
    const kValue = ((close - lowestLow) / (highestHigh - lowestLow)) * 100;
    k.push(kValue);
  }

  const d = calcSMA(k.filter(val => val !== null) as number[], dPeriod);
  
  return { k, d };
}

function calcATR(highs: number[], lows: number[], closes: number[], period = 14): (number | null)[] {
  if (highs.length < period + 1) {
    return new Array(highs.length).fill(null);
  }

  const trueRanges: number[] = [];
  
  for (let i = 1; i < highs.length; i++) {
    const high = highs[i];
    const low = lows[i];
    const prevClose = closes[i - 1];
    
    const tr1 = high - low;
    const tr2 = Math.abs(high - prevClose);
    const tr3 = Math.abs(low - prevClose);
    
    trueRanges.push(Math.max(tr1, tr2, tr3));
  }

  const atr: (number | null)[] = new Array(period).fill(null);
  
  for (let i = period; i < highs.length; i++) {
    const slice = trueRanges.slice(i - period, i);
    const avg = slice.reduce((sum, val) => sum + val, 0) / period;
    atr.push(avg);
  }

  return atr;
}

function calcOBV(closes: number[], volumes: number[]): (number | null)[] {
  if (closes.length === 0 || volumes.length === 0) {
    return [];
  }

  const obv: (number | null)[] = [];
  let cumulativeOBV = volumes[0]; // Start with first day's volume
  
  obv.push(cumulativeOBV);
  
  for (let i = 1; i < closes.length; i++) {
    const currentClose = closes[i];
    const previousClose = closes[i - 1];
    const currentVolume = volumes[i];
    
    if (currentClose > previousClose) {
      // Price went up, add volume
      cumulativeOBV += currentVolume;
    } else if (currentClose < previousClose) {
      // Price went down, subtract volume
      cumulativeOBV -= currentVolume;
    }
    // If price unchanged, OBV remains the same
    
    obv.push(cumulativeOBV);
  }
  
  return obv;
}

// Add this helper at the top of the file (after imports)
function createAreaFillSeries(chart: IChartApi, color: string) {
  return chart.addSeries(AreaSeries, {
    topColor: color + '33',
    bottomColor: color + '11',
    lineColor: 'transparent',
    lineWidth: 1,
    priceLineVisible: false,
    lastValueVisible: false,
  });
}

// Add this utility function near the top or above the component:
function cleanupRsiDivergenceOverlays(patternSeriesRef, chartInstance, rsiInstance, debug = false) {
  Object.keys(patternSeriesRef.current).forEach(key => {
    const series = patternSeriesRef.current[key];
    if (
      series &&
      (
        key.startsWith('rsiDivPrice_') ||
        key.startsWith('rsiDivArrow_') ||
        key.startsWith('rsiDivRsi_') ||
        key.startsWith('rsiDivRsiArrow_')
      )
    ) {
      try {
        if ((key.startsWith('rsiDivPrice_') || key.startsWith('rsiDivArrow_')) && chartInstance.current) {
          chartInstance.current.removeSeries(series);
        } else if ((key.startsWith('rsiDivRsi_') || key.startsWith('rsiDivRsiArrow_')) && rsiInstance.current) {
          rsiInstance.current.removeSeries(series);
        }
      } catch (err) {
        if (debug) {
          console.warn('Failed to remove series (cleanup)', key, err);
        }
      }
    }
    delete patternSeriesRef.current[key];
  });
}

// Add this utility function near the other cleanup utilities:
function cleanupSupportResistanceOverlays(patternSeriesRef, chartInstance, debug = false) {
  Object.keys(patternSeriesRef.current).forEach(key => {
    if (key.startsWith('sr_') && chartInstance.current) {
      try {
        chartInstance.current.removeSeries(patternSeriesRef.current[key]);
      } catch (err) {
        if (debug) console.warn('Failed to remove SR series', key, err);
      }
    }
    delete patternSeriesRef.current[key];
  });
}

// ---- Component ---- //
const EnhancedMultiPaneChart = React.forwardRef<any, EnhancedMultiPaneChartProps>(({ 
  data, 
  theme = "light",
  height = 600,
  debug = false,
  onValidationResult,
  onStatsCalculated,
  overlays,
  chartType: externalChartType,
  onChartTypeChange,
  onClearAll,
  onShowAll,
  onToggleShortcuts,
  showShortcuts: externalShowShortcuts,
  onActiveIndicatorsChange
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const candleChartRef = useRef<HTMLDivElement>(null);
  const volumeChartRef = useRef<HTMLDivElement>(null);
  const rsiChartRef = useRef<HTMLDivElement>(null);
  const macdChartRef = useRef<HTMLDivElement>(null);
  const stochasticChartRef = useRef<HTMLDivElement>(null);
  const atrChartRef = useRef<HTMLDivElement>(null);
  
  const chartInstance = useRef<IChartApi | null>(null);
  const volumeInstance = useRef<IChartApi | null>(null);
  const rsiInstance = useRef<IChartApi | null>(null);
  const macdInstance = useRef<IChartApi | null>(null);
  const stochasticInstance = useRef<IChartApi | null>(null);
  const atrInstance = useRef<IChartApi | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartDimensions, setChartDimensions] = useState({ width: 0, height: 0 });
  const validationResult = useMemo(() => validateChartData(data), [data, debug]);
  const chartStats = useMemo(() => calculateChartStats(validationResult.data), [validationResult.data]);

  // Add responsive design hook
  const { isMobile, isTablet } = useResponsiveChart();

  // Indicator state management
  const [activeIndicators, setActiveIndicators] = useState<{
    sma20: boolean;
    sma50: boolean;
    sma200: boolean;
    ema12: boolean;
    ema26: boolean;
    ema50: boolean;
    bollingerBands: boolean;
    macd: boolean;
    stochastic: boolean;
    atr: boolean;
    obv: boolean;
    volumeAnomaly: boolean;
    doublePatterns: boolean;
    swingPoints: boolean;
    support: boolean;
    resistance: boolean;
    trianglesFlags: boolean;
    rsiDivergence: boolean;
    peaksLows: boolean;
  }>({
    sma20: false,
    sma50: false,
    sma200: false,
    ema12: false,
    ema26: false,
    ema50: false,
    bollingerBands: false,
    macd: false,
    stochastic: false,
    atr: false,
    obv: false,
    volumeAnomaly: false,
    doublePatterns: false,
    swingPoints: false,
    support: false,
    resistance: false,
    trianglesFlags: false,
    rsiDivergence: false,
    peaksLows: false,
  });

  // Chart type state: 'candlestick' or 'line'
  const [internalPriceChartType, setInternalPriceChartType] = useState<'candlestick' | 'line'>('candlestick');
  
  // Use external chart type if provided, otherwise use internal state
  const priceChartType = externalChartType || internalPriceChartType;
  
  const setPriceChartType = (type: 'candlestick' | 'line') => {
    if (onChartTypeChange) {
      onChartTypeChange(type);
    } else {
      setInternalPriceChartType(type);
    }
  };

  // Add chartReady state for overlay synchronization
  const [chartReady, setChartReady] = useState(false);
  const isMountedRef = useRef(true);

  const indicatorSeriesRef = useRef<{ [key: string]: ISeriesApi<LineData | CandlestickData | HistogramData | AreaSeries> }>({});
  const patternSeriesRef = useRef<{ [key: string]: ISeriesApi<LineData | CandlestickData | HistogramData | AreaSeries> }>({});

  // Ref to track the current main price series (candlestick or line)
  const mainPriceSeriesRef = useRef<ISeriesApi<LineData | CandlestickData> | null>(null);

  // ENHANCED: Optimized height calculations for better visibility and space utilization
  const chartHeights = useMemo(() => {
    // Use the actual height prop for calculations to utilize full available space
    const totalHeight = height || (isMobile ? 600 : 800);
    const headerHeight = 44;
    const chartControlsHeight = 40; // Reduced height of chart controls
    const spacingHeight = 4; // Further reduced spacing between charts to eliminate white space
    
    // Count active indicators for dynamic sizing
    const activeIndicatorCount = [
      activeIndicators.stochastic,
      activeIndicators.atr,
      activeIndicators.macd
    ].filter(Boolean).length;
    
    // Calculate available height for charts (total minus controls and spacing)
    const availableHeight = totalHeight - headerHeight - chartControlsHeight - spacingHeight;
    
    // Fixed heights for consistent indicator charts - optimized for space utilization
    const volumeHeight = isMobile ? 80 : 100;
    const rsiHeight = isMobile ? 120 : 140;
    const macdHeight = isMobile ? 100 : 120;
    const stochasticHeight = isMobile ? 80 : 100;
    const atrHeight = isMobile ? 60 : 80;
    
    // Calculate total height needed for all active indicators
    let totalIndicatorHeight = volumeHeight + rsiHeight;
    if (activeIndicators.stochastic) totalIndicatorHeight += stochasticHeight;
    if (activeIndicators.atr) totalIndicatorHeight += atrHeight;
    if (activeIndicators.macd) totalIndicatorHeight += macdHeight;
    
    // Calculate remaining height for main chart
    let mainChartHeight = availableHeight - totalIndicatorHeight;
    
    // Ensure main chart has a reasonable minimum height
    const minMainChartHeight = Math.max(300, availableHeight * 0.4); // At least 40% of available height
    
    // If main chart would be too small, reduce indicator heights proportionally
    if (mainChartHeight < minMainChartHeight) {
      const excessHeight = minMainChartHeight - mainChartHeight;
      const totalIndicatorHeightToReduce = totalIndicatorHeight - volumeHeight - rsiHeight; // Don't reduce volume and RSI
      
      if (totalIndicatorHeightToReduce > 0) {
        const reductionRatio = Math.max(0.7, 1 - (excessHeight / totalIndicatorHeightToReduce)); // Don't reduce more than 30%
        
        // Apply reduction to optional indicators
        const adjustedMacdHeight = activeIndicators.macd ? Math.floor(macdHeight * reductionRatio) : 0;
        const adjustedStochasticHeight = activeIndicators.stochastic ? Math.floor(stochasticHeight * reductionRatio) : 0;
        const adjustedAtrHeight = activeIndicators.atr ? Math.floor(atrHeight * reductionRatio) : 0;
        
        // Recalculate main chart height
        mainChartHeight = availableHeight - volumeHeight - rsiHeight - adjustedMacdHeight - adjustedStochasticHeight - adjustedAtrHeight;
        
        return {
          candle: Math.max(minMainChartHeight, mainChartHeight),
          volume: volumeHeight,
          rsi: rsiHeight,
          stochastic: adjustedStochasticHeight,
          atr: adjustedAtrHeight,
          macd: adjustedMacdHeight,
          totalHeight: totalHeight,
        };
      }
    }
    
    return {
      candle: Math.max(minMainChartHeight, mainChartHeight),
      volume: volumeHeight,
      rsi: rsiHeight,
      stochastic: stochasticHeight,
      atr: atrHeight,
      macd: macdHeight,
      totalHeight: totalHeight,
    };
  }, [height, activeIndicators.stochastic, activeIndicators.atr, activeIndicators.macd, isMobile]);

  // Validate data
  const validatedData = useMemo(() => {
    const result = validateChartData(data);
    
    if (debug) {
      console.log('Chart Data Validation:', result);
    }
    
    return result.data;
  }, [data, debug]);

  // Update validation result in effect to avoid setState during render
  useEffect(() => {
    const result = validateChartData(data);
    
    if (onValidationResult) {
      onValidationResult(result);
    }
  }, [data, onValidationResult]);

  // Calculate statistics
  const stats = useMemo(() => {
    return calculateChartStats(validatedData);
  }, [validatedData]);

  // Update stats in effect to avoid setState during render
  useEffect(() => {
    const calculatedStats = calculateChartStats(validatedData);
    
    if (onStatsCalculated && calculatedStats) {
      onStatsCalculated(calculatedStats);
    }
    
    if (debug && calculatedStats) {
      console.log('Chart Statistics:', calculatedStats);
    }
  }, [validatedData, onStatsCalculated, debug]);

  // Calculate indicators
  const indicators = useMemo(() => {
    if (validatedData.length === 0) return {
      sma20: [], sma50: [], ema12: [], ema26: [], rsi14: [],
      bollingerBands: { upper: [], middle: [], lower: [] },
      macd: { macd: [], signal: [], histogram: [] },
      stochastic: { k: [], d: [] },
      atr: [],
      obv: []
    };
    
    const closes = validatedData.map(d => d.close);
    const highs = validatedData.map(d => d.high);
    const lows = validatedData.map(d => d.low);
    const volumes = validatedData.map(d => d.volume);
    
    return {
      sma20: calcSMA(closes, 20),
      sma50: calcSMA(closes, 50),
      sma200: calcSMA(closes, 200),
      ema12: calcEMA(closes, 12),
      ema26: calcEMA(closes, 26),
      ema50: calcEMA(closes, 50),
      rsi14: calcRSI(closes, 14),
      bollingerBands: calcBollingerBands(closes, 20, 2),
      macd: calcMACD(closes, 12, 26, 9),
      stochastic: calcStochastic(highs, lows, closes, 14, 3),
      atr: calcATR(highs, lows, closes, 14),
      obv: calcOBV(closes, volumes)
    };
  }, [validatedData]);

  // Place divergence detection logic here, after validatedData and indicators are defined
  // --- Divergence Detection Algorithm (Backend Logic) ---
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

  // Type for divergence objects used in detectDivergence
  interface Divergence {
    type: 'bullish' | 'bearish';
    priceIndices: [number, number];
    indicatorIndices: [number, number];
    priceValues: [number, number];
    indicatorValues: [number, number];
  }

  function detectDivergence(prices: number[], indicator: number[], order = 5): Divergence[] {
    const { peaks, lows } = identifyPeaksLows(prices, order);
    const divergences: Divergence[] = [];
    // Bearish divergence: Price makes higher high, indicator makes lower high
    for (let i = 1; i < peaks.length; i++) {
      const p1 = peaks[i - 1];
      const p2 = peaks[i];
      if (prices[p2] > prices[p1] && indicator[p2] < indicator[p1]) {
        divergences.push({
          type: 'bearish',
          priceIndices: [p1, p2],
          indicatorIndices: [p1, p2],
          priceValues: [prices[p1], prices[p2]],
          indicatorValues: [indicator[p1], indicator[p2]]
        });
      }
    }
    // Bullish divergence: Price makes lower low, indicator makes higher low
    for (let i = 1; i < lows.length; i++) {
      const l1 = lows[i - 1];
      const l2 = lows[i];
      if (prices[l2] < prices[l1] && indicator[l2] > indicator[l1]) {
        divergences.push({
          type: 'bullish',
          priceIndices: [l1, l2],
          indicatorIndices: [l1, l2],
          priceValues: [prices[l1], prices[l2]],
          indicatorValues: [indicator[l1], indicator[l2]]
        });
      }
    }
    return divergences;
  }

  // Add to pattern state management
  const [showRsiDivergence, setShowRsiDivergence] = useState(false);

  // Connect activeIndicators.rsiDivergence to showRsiDivergence
  useEffect(() => {
    setShowRsiDivergence(activeIndicators.rsiDivergence);
  }, [activeIndicators.rsiDivergence]);

  // Calculate divergences once (static data)
  const rsiDivergences = useMemo<Divergence[]>(() => {
    if (!validatedData.length || !indicators.rsi14.length) return [];
    const closes = validatedData.map(d => d.close);
    const rsi = indicators.rsi14.map(v => (v == null ? NaN : v));
    return detectDivergence(closes, rsi, 5);
  }, [validatedData, indicators.rsi14]);

  // Calculate new patterns
  const supportResistanceLevels = useMemo(() => {
    if (!validatedData.length) return [];
    const closes = validatedData.map(d => d.close);
    return detectSupportResistance(closes, 5, 0.02);
  }, [validatedData]);

  const trianglePatterns = useMemo(() => {
    if (!validatedData.length) return [];
    const closes = validatedData.map(d => d.close);
    return detectTriangles(closes, 5, 20, 0.35);
  }, [validatedData]);

  const flagPatterns = useMemo(() => {
    if (!validatedData.length) return [];
    const closes = validatedData.map(d => d.close);
    return detectFlags(closes, 15, 20, 0.35, 0.02);
  }, [validatedData]);

  const peaksLows = useMemo(() => {
    if (!validatedData.length) return { peaks: [], lows: [] };
    const closes = validatedData.map(d => d.close);
    return identifyPeaksLows(closes, 5);
  }, [validatedData]);

  // --- Helper: Draw RSI Divergence Overlays ---
  const drawRsiDivergenceOverlays = useCallback(({
    rsiDivergences,
    validatedData,
    indicators,
    chartInstance,
    rsiInstance,
    patternSeriesRef,
    debug = false,
  }: {
    rsiDivergences: Divergence[];
    validatedData: ValidatedChartData[];
    indicators: {
      sma20: (number | null)[];
      sma50: (number | null)[];
      sma200: (number | null)[];
      ema12: (number | null)[];
      ema26: (number | null)[];
      ema50: (number | null)[];
      rsi14: (number | null)[];
      bollingerBands: { upper: (number | null)[]; middle: (number | null)[]; lower: (number | null)[] };
      macd: { macd: (number | null)[]; signal: (number | null)[]; histogram: (number | null)[] };
      stochastic: { k: (number | null)[]; d: (number | null)[] };
      atr: (number | null)[];
      obv: (number | null)[];
    };
    chartInstance: React.MutableRefObject<IChartApi | null>;
    rsiInstance: React.MutableRefObject<IChartApi | null>;
    patternSeriesRef: React.MutableRefObject<{ [key: string]: ISeriesApi<LineData | CandlestickData | HistogramData | AreaSeries> }>;
    debug?: boolean;
  }) => {
    // Remove previous overlays
    Object.keys(patternSeriesRef.current).forEach(key => {
      const series = patternSeriesRef.current[key];
      if (
        series &&
        (
          key.startsWith('rsiDivPrice_') ||
          key.startsWith('rsiDivArrow_') ||
          key.startsWith('rsiDivRsi_') ||
          key.startsWith('rsiDivRsiArrow_')
        )
      ) {
        try {
          if ((key.startsWith('rsiDivPrice_') || key.startsWith('rsiDivArrow_')) && chartInstance.current) {
            chartInstance.current.removeSeries(series);
          } else if (key.startsWith('rsiDivRsi_') && rsiInstance.current) {
            rsiInstance.current.removeSeries(series);
          }
        } catch (err) {
          if (debug) {
            console.warn('Failed to remove series (cleanup)', key, err);
          }
        }
      }
      delete patternSeriesRef.current[key];
    });
    rsiDivergences.forEach((div, idx) => {
      // Robust guard: skip if any value is undefined, NaN, or out of bounds
      if (
        div.priceIndices.some(i => !validatedData[i] || typeof validatedData[i].date === 'undefined') ||
        div.indicatorIndices.some(i =>
          i < 0 ||
          i >= validatedData.length ||
          i >= indicators.rsi14.length ||
          !validatedData[i] ||
          typeof validatedData[i].date === 'undefined' ||
          indicators.rsi14[i] == null ||
          isNaN(indicators.rsi14[i])
        ) ||
        div.priceValues.some(v => v == null || isNaN(v)) ||
        div.indicatorValues.some(v => v == null || isNaN(v))
      ) {
        if (debug) {
          console.warn('Skipping divergence due to invalid data or out-of-bounds index', div);
        }
        return; // skip this divergence
      }
      // Set color and label based on type
      const color = div.type === 'bearish' ? '#ef4444' : '#10b981';
      const label = div.type === 'bearish' ? 'Bearish Divergence' : 'Bullish Divergence';
      const lineStyle = 0; // 0 = solid line

      // Price chart line
      const priceSeries = chartInstance.current!.addSeries(LineSeries, {
        color,
        lineWidth: 2,
        lineStyle, // solid line
        lastValueVisible: false,
        priceLineVisible: false,
        crosshairMarkerVisible: false,
      });
      priceSeries.setData([
        {
          time: toTimestamp(validatedData[div.priceIndices[0]].date),
          value: div.priceValues[0],
        },
        {
          time: toTimestamp(validatedData[div.priceIndices[1]].date),
          value: div.priceValues[1],
        },
      ]);
      patternSeriesRef.current[`rsiDivPrice_${idx}`] = priceSeries;

      // Arrow marker (price chart)
      const arrowSeries = chartInstance.current!.addSeries(LineSeries, {
        color,
        lineWidth: 1 as number, // Cast to number for library compatibility
        lastValueVisible: false,
        priceLineVisible: false,
        crosshairMarkerVisible: true,
        crosshairMarkerRadius: 7,
        crosshairMarkerBorderColor: color,
        crosshairMarkerBackgroundColor: color,
        title: label,
      });
      arrowSeries.setData([
        {
          time: toTimestamp(validatedData[div.priceIndices[1]].date),
          value: div.priceValues[1],
        },
      ]);
      // Add a price line with a label for the divergence
      priceSeries.createPriceLine({
        price: div.priceValues[1],
        color,
        lineWidth: 1,
        lineStyle, // solid line
        axisLabelVisible: false,
        title: label,
      });
      patternSeriesRef.current[`rsiDivArrow_${idx}`] = arrowSeries;

      // RSI chart line
      if (debug) {
        console.log('Creating RSI divergence overlay', {
          idx,
          color,
          label,
          rsiIndices: div.indicatorIndices,
          rsiValues: div.indicatorValues,
          dates: [validatedData[div.indicatorIndices[0]].date, validatedData[div.indicatorIndices[1]].date]
        });
      }
      const rsiSeries = rsiInstance.current!.addSeries(LineSeries, {
        color,
        lineWidth: 2,
        lineStyle, // solid line
        lastValueVisible: false,
        priceLineVisible: false,
        crosshairMarkerVisible: false,
        priceScaleId: 'rsi', // Ensure overlays use the same y-axis as the main RSI line
      });
      rsiSeries.setData([
        {
          time: toTimestamp(validatedData[div.indicatorIndices[0]].date),
          value: div.indicatorValues[0],
        },
        {
          time: toTimestamp(validatedData[div.indicatorIndices[1]].date),
          value: div.indicatorValues[1],
        },
      ]);
      // Arrow marker (RSI chart)
      const rsiArrowSeries = rsiInstance.current!.addSeries(LineSeries, {
        color,
        lineWidth: 1 as number, // Cast to number for library compatibility
        lastValueVisible: false,
        priceLineVisible: false,
        crosshairMarkerVisible: true,
        crosshairMarkerRadius: 7,
        crosshairMarkerBorderColor: color,
        crosshairMarkerBackgroundColor: color,
        title: label,
        priceScaleId: 'rsi', // Ensure overlays use the same y-axis as the main RSI line
      });
      rsiArrowSeries.setData([
        {
          time: toTimestamp(validatedData[div.indicatorIndices[1]].date),
          value: div.indicatorValues[1],
        },
      ]);
      // Add a price line with a label for the divergence on RSI chart
      rsiSeries.createPriceLine({
        price: div.indicatorValues[1],
        color,
        lineWidth: 1,
        lineStyle, // solid line
        axisLabelVisible: false,
        title: label,
      });
      patternSeriesRef.current[`rsiDivRsi_${idx}`] = rsiSeries;
      patternSeriesRef.current[`rsiDivRsiArrow_${idx}`] = rsiArrowSeries;
    });
  }, []); // No dependencies needed since all arguments are passed in

  // --- Helper: Draw Support/Resistance Levels ---
  function drawSupportResistanceLevels({
    levels,
    validatedData,
    chartInstance,
    patternSeriesRef,
    debug = false,
  }: {
    levels: SupportResistanceLevel[];
    validatedData: ValidatedChartData[];
    chartInstance: React.MutableRefObject<IChartApi | null>;
    patternSeriesRef: React.MutableRefObject<{ [key: string]: ISeriesApi<LineData | CandlestickData | HistogramData | AreaSeries> }>;
    debug?: boolean;
  }) {
    // Remove previous support/resistance lines
    cleanupSupportResistanceOverlays(patternSeriesRef, chartInstance, debug);

    levels.forEach((level, idx) => {
      if (!chartInstance.current) return;

      const color = level.type === 'support' ? '#10b981' : '#ef4444';
      const lineStyle = level.strength >= 3 ? 0 : 2; // Solid for strong levels, dashed for weak
      const lineWidth = level.strength >= 3 ? 2 : 1;

      const srSeries = chartInstance.current.addSeries(LineSeries, {
        color,
        lineWidth: lineWidth as number, // Cast to number for library compatibility
        lineStyle: lineStyle as number, // Cast to number for library compatibility
        lastValueVisible: false,
        priceLineVisible: false,
        crosshairMarkerVisible: false,
        title: `${level.type.charAt(0).toUpperCase() + level.type.slice(1)} (${level.strength} touches)`,
      });

      // Create horizontal line across the entire chart
      const firstTime = toTimestamp(validatedData[0].date);
      const lastTime = toTimestamp(validatedData[validatedData.length - 1].date);
      
      srSeries.setData([
        { time: firstTime, value: level.price },
        { time: lastTime, value: level.price },
      ]);

      patternSeriesRef.current[`sr_${idx}`] = srSeries;
    });
  }

  // --- Helper: Draw Triangle Patterns ---
  function drawTrianglePatterns({
    patterns,
    validatedData,
    chartInstance,
    patternSeriesRef,
    debug = false,
  }: {
    patterns: TrianglePattern[];
    validatedData: ValidatedChartData[];
    chartInstance: React.MutableRefObject<IChartApi | null>;
    patternSeriesRef: React.MutableRefObject<{ [key: string]: ISeriesApi<LineData | CandlestickData | HistogramData | AreaSeries> }>;
    debug?: boolean;
  }) {
    // Remove previous triangle lines
    Object.keys(patternSeriesRef.current).forEach(key => {
      if (key.startsWith('triangle_') && chartInstance.current) {
        try {
          chartInstance.current.removeSeries(patternSeriesRef.current[key]);
        } catch (err) {
          if (debug) console.warn('Failed to remove triangle series', key, err);
        }
        delete patternSeriesRef.current[key];
      }
    });

    // Use a single neutral color for all triangle overlays
    const color = '#3b82f6';

    patterns.forEach((pattern, idx) => {
      if (!chartInstance.current) return;

      const segment = validatedData.slice(pattern.startIndex, pattern.endIndex + 1);
      const times = segment.map((d, i) => toTimestamp(d.date));
      // Calculate trendline values
      const upperLine = times.map((time, i) => ({
        time,
        value: segment[0].close + pattern.upperSlope * i,
      }));
      const lowerLine = times.map((time, i) => ({
        time,
        value: segment[0].close + pattern.lowerSlope * i,
      }));

      // Draw upper boundary (dashed, thin, blue)
      const upperSeries = chartInstance.current.addSeries(LineSeries, {
        color,
        lineWidth: 1,
        lineStyle: 2,
        lastValueVisible: false,
        priceLineVisible: false,
        crosshairMarkerVisible: false,
      });
      upperSeries.setData(upperLine);
      patternSeriesRef.current[`triangle_upper_${idx}`] = upperSeries;

      // Draw lower boundary (dashed, thin, blue)
      const lowerSeries = chartInstance.current.addSeries(LineSeries, {
        color,
        lineWidth: 1,
        lineStyle: 2,
        lastValueVisible: false,
        priceLineVisible: false,
        crosshairMarkerVisible: false,
      });
      lowerSeries.setData(lowerLine);
      patternSeriesRef.current[`triangle_lower_${idx}`] = lowerSeries;

      // Add transparent area fill for bullish/bearish triangles
      let fillColor: string | null = null;
      if (pattern.type === 'ascending') fillColor = '#22c55e22'; // green
      else if (pattern.type === 'descending') fillColor = '#ef444422'; // red
      // symmetrical: no fill
      if (fillColor) {
        const areaSeries = chartInstance.current.addSeries(AreaSeries, {
          topColor: fillColor,
          bottomColor: fillColor,
          lineColor: 'transparent',
          lineWidth: 1,
          priceLineVisible: false,
          lastValueVisible: false,
        });
        // Fill between upper and lower lines (use upperLine for area, as AreaSeries only supports one line)
        areaSeries.setData(upperLine);
        patternSeriesRef.current[`triangle_area_${idx}`] = areaSeries;
      }
    });
  }

  // --- Helper: Draw Flag Patterns ---
  function drawFlagPatterns({
    patterns,
    validatedData,
    chartInstance,
    patternSeriesRef,
    debug = false,
  }: {
    patterns: FlagPattern[];
    validatedData: ValidatedChartData[];
    chartInstance: React.MutableRefObject<IChartApi | null>;
    patternSeriesRef: React.MutableRefObject<{ [key: string]: ISeriesApi<LineData | CandlestickData | HistogramData | AreaSeries> }>;
    debug?: boolean;
  }) {
    // Remove previous flag lines
    Object.keys(patternSeriesRef.current).forEach(key => {
      if (key.startsWith('flag_') && chartInstance.current) {
        try {
          chartInstance.current.removeSeries(patternSeriesRef.current[key]);
        } catch (err) {
          if (debug) console.warn('Failed to remove flag series', key, err);
        }
        delete patternSeriesRef.current[key];
      }
    });

    // Use a single neutral color for all flag overlays
    const color = '#3b82f6';

    patterns.forEach((pattern, idx) => {
      if (!chartInstance.current) return;

      const flagSegment = validatedData.slice(pattern.flagStartIndex, pattern.flagEndIndex + 1);
      const times = flagSegment.map(d => toTimestamp(d.date));
      const highs = flagSegment.map(d => d.high);
      const lows = flagSegment.map(d => d.low);

      // Draw upper boundary (dashed, thin, blue)
      const upperLine = times.map((time, i) => ({ time, value: highs[i] }));
      const upperSeries = chartInstance.current.addSeries(LineSeries, {
        color,
        lineWidth: 1,
        lineStyle: 2, // dashed
        lastValueVisible: false,
        priceLineVisible: false,
        crosshairMarkerVisible: false,
      });
      upperSeries.setData(upperLine);
      patternSeriesRef.current[`flag_upper_${idx}`] = upperSeries;

      // Draw lower boundary (dashed, thin, blue)
      const lowerLine = times.map((time, i) => ({ time, value: lows[i] }));
      const lowerSeries = chartInstance.current.addSeries(LineSeries, {
        color,
        lineWidth: 1,
        lineStyle: 2, // dashed
        lastValueVisible: false,
        priceLineVisible: false,
        crosshairMarkerVisible: false,
      });
      lowerSeries.setData(lowerLine);
      patternSeriesRef.current[`flag_lower_${idx}`] = lowerSeries;

      // Add transparent area fill for bullish/bearish flags
      let fillColor: string | null = null;
      if (pattern.direction === 'bullish') fillColor = '#22c55e22'; // green
      else if (pattern.direction === 'bearish') fillColor = '#ef444422'; // red
      if (fillColor) {
        const areaSeries = chartInstance.current.addSeries(AreaSeries, {
          topColor: fillColor,
          bottomColor: fillColor,
          lineColor: 'transparent',
          lineWidth: 1,
          priceLineVisible: false,
          lastValueVisible: false,
        });
        areaSeries.setData(upperLine);
        patternSeriesRef.current[`flag_area_${idx}`] = areaSeries;
      }
    });
  }

  // --- Helper: Draw Peaks and Lows ---
  // (Removed old drawPeaksLows function)

  // --- Drawing Divergences on Chart ---
  useEffect(() => {
    if (!showRsiDivergence || !mainPriceSeriesRef.current || !rsiInstance.current) return;
    // Use the current main price series for overlays
    drawRsiDivergenceOverlays({
      rsiDivergences,
      validatedData,
      indicators,
      chartInstance,
      rsiInstance,
      patternSeriesRef,
      debug,
    });
    // Cleanup on toggle off
    return () => cleanupRsiDivergenceOverlays(patternSeriesRef, chartInstance, rsiInstance, debug);
  }, [showRsiDivergence, rsiDivergences, validatedData, mainPriceSeriesRef, chartInstance, rsiInstance, priceChartType, debug, drawRsiDivergenceOverlays, indicators]);

  // --- Drawing Support/Resistance Levels ---
  useEffect(() => {
    if (!activeIndicators.support && !activeIndicators.resistance || !chartInstance.current) return;
    
    const levelsToShow = supportResistanceLevels.filter(level => {
      if (activeIndicators.support && level.type === 'support') return true;
      if (activeIndicators.resistance && level.type === 'resistance') return true;
      return false;
    });

    if (levelsToShow.length > 0) {
      drawSupportResistanceLevels({
        levels: levelsToShow,
        validatedData,
        chartInstance,
        patternSeriesRef,
        debug,
      });
    }

    // Cleanup
    return () => {
      cleanupSupportResistanceOverlays(patternSeriesRef, chartInstance, debug);
    };
  }, [activeIndicators.support, activeIndicators.resistance, supportResistanceLevels, validatedData, chartInstance]);

  // --- Drawing Triangle Patterns ---
  useEffect(() => {
    if (!activeIndicators.trianglesFlags || !chartInstance.current) return;
    
    if (trianglePatterns.length > 0) {
      drawTrianglePatterns({
        patterns: trianglePatterns,
        validatedData,
        chartInstance,
        patternSeriesRef,
        debug,
      });
    }

    // Cleanup
    return () => {
      Object.keys(patternSeriesRef.current).forEach(key => {
        if (key.startsWith('triangle_') && chartInstance.current) {
          try {
            chartInstance.current.removeSeries(patternSeriesRef.current[key]);
          } catch (err) {
            if (debug) console.warn('Failed to remove triangle series (cleanup)', key, err);
          }
          delete patternSeriesRef.current[key];
        }
      });
    };
  }, [activeIndicators.trianglesFlags, trianglePatterns, validatedData, chartInstance]);

  // --- Drawing Flag Patterns ---
  useEffect(() => {
    if (!activeIndicators.trianglesFlags || !chartInstance.current) return;
    
    if (flagPatterns.length > 0) {
      drawFlagPatterns({
        patterns: flagPatterns,
        validatedData,
        chartInstance,
        patternSeriesRef,
        debug,
      });
    }

    // Cleanup
    return () => {
      Object.keys(patternSeriesRef.current).forEach(key => {
        if (key.startsWith('flag_') && chartInstance.current) {
          try {
            chartInstance.current.removeSeries(patternSeriesRef.current[key]);
          } catch (err) {
            if (debug) console.warn('Failed to remove flag series (cleanup)', key, err);
          }
          delete patternSeriesRef.current[key];
        }
      });
    };
  }, [activeIndicators.trianglesFlags, flagPatterns, validatedData, chartInstance]);

  // --- Peaks/Lows Marker Effect (like other overlays) ---
  useEffect(() => {
    if (!chartReady || !chartInstance.current) return;
    // Remove previous marker overlays if they exist
    const peaksMarker = indicatorSeriesRef.current['peaksMarker'];
    if (peaksMarker && typeof peaksMarker.remove === 'function') {
      try {
        chartInstance.current && chartInstance.current.removeSeries(peaksMarker);
      } catch (e) {
        if (debug) console.warn('Failed to remove peaksMarker (cleanup)', e);
      }
    }
    delete indicatorSeriesRef.current['peaksMarker'];
    const lowsMarker = indicatorSeriesRef.current['lowsMarker'];
    if (lowsMarker && typeof lowsMarker.remove === 'function') {
      try {
        chartInstance.current && chartInstance.current.removeSeries(lowsMarker);
      } catch (e) {
        if (debug) console.warn('Failed to remove lowsMarker (cleanup)', e);
      }
    }
    delete indicatorSeriesRef.current['lowsMarker'];
    if (activeIndicators.swingPoints && chartInstance.current) {
      // Peaks
      const peaksData = peaksLows.peaks
        .filter((peakIdx) => validatedData[peakIdx] && validatedData[peakIdx].date !== undefined && validatedData[peakIdx].close !== undefined)
        .map((peakIdx) => ({
          time: toTimestamp(validatedData[peakIdx].date),
          value: validatedData[peakIdx].close,
        }));
      if (debug) {
        console.log('Plotting peaks:', peaksData.length, peaksData);
      }
      if (peaksData.length > 0) {
        const peaksSeries = chartInstance.current.addSeries(LineSeries, {
          color: '#ef4444',
          lineWidth: 1,
          lineVisible: false,
          lastValueVisible: false,
          priceLineVisible: false,
          crosshairMarkerVisible: false,
          pointMarkersVisible: true,
          pointMarkersRadius: 5,
        });
        peaksSeries.setData(peaksData);
        indicatorSeriesRef.current['peaksMarker'] = peaksSeries;
      }
      // Lows
      const lowsData = peaksLows.lows
        .filter((lowIdx) => validatedData[lowIdx] && validatedData[lowIdx].date !== undefined && validatedData[lowIdx].close !== undefined)
        .map((lowIdx) => ({
          time: toTimestamp(validatedData[lowIdx].date),
          value: validatedData[lowIdx].close,
        }));
      if (debug) {
        console.log('Plotting lows:', lowsData.length, lowsData);
      }
      if (lowsData.length > 0) {
        const lowsSeries = chartInstance.current.addSeries(LineSeries, {
          color: '#10b981',
          lineWidth: 1,
          lineVisible: false,
          lastValueVisible: false,
          priceLineVisible: false,
          crosshairMarkerVisible: false,
          pointMarkersVisible: true,
          pointMarkersRadius: 5,
        });
        lowsSeries.setData(lowsData);
        indicatorSeriesRef.current['lowsMarker'] = lowsSeries;
      }
    }
    // Cleanup on unmount or dependency change
    return () => {
      const peaksMarker = indicatorSeriesRef.current['peaksMarker'];
      if (peaksMarker && typeof peaksMarker.remove === 'function') {
        try {
          chartInstance.current && chartInstance.current.removeSeries(peaksMarker);
        } catch (e) {
          if (debug) console.warn('Failed to remove peaksMarker (cleanup)', e);
        }
      }
      delete indicatorSeriesRef.current['peaksMarker'];
      const lowsMarker = indicatorSeriesRef.current['lowsMarker'];
      if (lowsMarker && typeof lowsMarker.remove === 'function') {
        try {
          chartInstance.current && chartInstance.current.removeSeries(lowsMarker);
        } catch (e) {
          if (debug) console.warn('Failed to remove lowsMarker (cleanup)', e);
        }
      }
      delete indicatorSeriesRef.current['lowsMarker'];
    };
  }, [activeIndicators.swingPoints, validatedData, peaksLows, chartInstance, priceChartType, chartDimensions.width, debug, chartReady]);

  // --- RSI Divergence Overlay Effect (like other overlays) ---
  useEffect(() => {
    if (!chartReady || !showRsiDivergence || !chartInstance.current || !rsiInstance.current) return;
    drawRsiDivergenceOverlays({
      rsiDivergences,
      validatedData,
      indicators,
      chartInstance,
      rsiInstance,
      patternSeriesRef,
      debug,
    });
    // Cleanup on toggle off
    return () => cleanupRsiDivergenceOverlays(patternSeriesRef, chartInstance, rsiInstance, debug);
  }, [showRsiDivergence, rsiDivergences, validatedData, chartInstance, rsiInstance, priceChartType, chartDimensions.width, debug, chartReady]);

  // FIXED: Improved debounced resize handler with better chart resizing
  const debouncedResize = useCallback(() => {
    let timeoutId: NodeJS.Timeout;
    return () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (!containerRef.current) return;
        
        const { width, height } = containerRef.current.getBoundingClientRect();
        setChartDimensions({ width, height });
        
        // Apply resize to all charts immediately
        const charts = [
          chartInstance.current,
          volumeInstance.current,
          rsiInstance.current,
          macdInstance.current,
          stochasticInstance.current,
          atrInstance.current
        ].filter(Boolean);
        
        charts.forEach(chart => {
          try {
            chart?.applyOptions({ width });
          } catch (error) {
            if (debug) console.warn('Chart resize failed:', error);
          }
        });
        
        if (debug) {
          console.log('Applied chart resize:', { width, height });
        }
      }, 100);
    };
  }, [height, debug]);

  // Indicator toggle handler
  const toggleIndicator = useCallback((indicator: keyof typeof activeIndicators) => {
    setActiveIndicators(prev => ({
      ...prev,
      [indicator]: !prev[indicator]
    }));
  }, []);

  // Pan chart handler
  const panChart = useCallback((direction: 'left' | 'right' | 'center') => {
    if (!chartInstance.current || !volumeInstance.current || !rsiInstance.current) {
      return;
    }

    try {
      const horizontalPanAmount = 0.1; // 10% for left/right movement
      
      switch (direction) {
        case 'left': {
          // Pan time scale left (show earlier data)
          const timeRange = chartInstance.current.timeScale().getVisibleRange();
          if (timeRange && timeRange.from && timeRange.to) {
            const timeSpan = (timeRange.to as number) - (timeRange.from as number);
            const panTime = timeSpan * horizontalPanAmount;
            chartInstance.current.timeScale().setVisibleRange({
              from: (timeRange.from as number) - panTime as UTCTimestamp,
              to: (timeRange.to as number) - panTime as UTCTimestamp,
            });
          }
          break;
        }
        case 'right': {
          // Pan time scale right (show later data)
          const timeRangeRight = chartInstance.current.timeScale().getVisibleRange();
          if (timeRangeRight && timeRangeRight.from && timeRangeRight.to) {
            const timeSpan = (timeRangeRight.to as number) - (timeRangeRight.from as number);
            const panTime = timeSpan * horizontalPanAmount;
            chartInstance.current.timeScale().setVisibleRange({
              from: (timeRangeRight.from as number) + panTime as UTCTimestamp,
              to: (timeRangeRight.to as number) + panTime as UTCTimestamp,
            });
          }
          break;
        }
        case 'center':
          // Reset to show all data but maintain manual scrolling
          chartInstance.current.priceScale('right').applyOptions({
            autoScale: false,
          });
          chartInstance.current.timeScale().fitContent();
          break;
          
        default:
          // Fallback: if anything goes wrong, reset to auto-scale
          chartInstance.current.priceScale('right').applyOptions({
            autoScale: true,
          });
          break;
      }
    } catch (error) {
      if (debug) {
        console.warn('Pan operation failed:', error);
        console.log('Current chart state:', {
          direction,
          chartInstance: !!chartInstance.current,
          volumeInstance: !!volumeInstance.current,
          rsiInstance: !!rsiInstance.current,
          dataLength: validatedData.length
        });
      }
    }
  }, [debug, validatedData.length]);

  // Cleanup charts
  const cleanupCharts = useCallback(() => {
    try {
      // Clear any pending timeouts first
      if (window.chartTimeouts) {
        window.chartTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
        window.chartTimeouts = [];
      }
      
      // Remove charts with proper disposal checks
      if (chartInstance.current) {
        try {
          chartInstance.current.remove();
        } catch (e) {
          if (debug) console.warn('Error removing chart instance:', e);
        }
        chartInstance.current = null;
      }
      
      if (volumeInstance.current) {
        try {
          volumeInstance.current.remove();
        } catch (e) {
          if (debug) console.warn('Error removing volume instance:', e);
        }
        volumeInstance.current = null;
      }
      
      if (rsiInstance.current) {
        try {
          rsiInstance.current.remove();
        } catch (e) {
          if (debug) console.warn('Error removing RSI instance:', e);
        }
        rsiInstance.current = null;
      }
      
      if (macdInstance.current) {
        try {
          macdInstance.current.remove();
        } catch (e) {
          if (debug) console.warn('Error removing MACD instance:', e);
        }
        macdInstance.current = null;
      }
      
      if (stochasticInstance.current) {
        try {
          stochasticInstance.current.remove();
        } catch (e) {
          if (debug) console.warn('Error removing Stochastic instance:', e);
        }
        stochasticInstance.current = null;
      }
      
      if (atrInstance.current) {
        try {
          atrInstance.current.remove();
        } catch (e) {
          if (debug) console.warn('Error removing ATR instance:', e);
        }
        atrInstance.current = null;
      }
      
      setChartReady(false); // <-- Reset chartReady on cleanup
    } catch (error) {
      console.error('Error cleaning up charts:', error);
    }
  }, [debug]);

  // Initialize charts with retry mechanism (NO MACD logic here)
  const initializeCharts = useCallback((retryCount = 0) => {
    setChartReady(false); // <-- Set chartReady to false at start
    if (!candleChartRef.current || !volumeChartRef.current || !rsiChartRef.current || validatedData.length === 0) {
      if (debug) {
        console.log('Chart initialization skipped:', {
          candleRef: !!candleChartRef.current,
          volumeRef: !!volumeChartRef.current,
          rsiRef: !!rsiChartRef.current,
          dataLength: validatedData.length
        });
      }
      return;
    }

    // Check if containers have proper dimensions
    const candleContainer = candleChartRef.current;
    const volumeContainer = volumeChartRef.current;
    const rsiContainer = rsiChartRef.current;
    const macdContainer = macdChartRef.current;
    const stochasticContainer = stochasticChartRef.current;
    const atrContainer = atrChartRef.current;

    const macdNeeded = activeIndicators.macd;
    const macdReady = !macdNeeded || (macdContainer && macdContainer.clientWidth);
    const stochasticNeeded = activeIndicators.stochastic;
    const stochasticReady = !stochasticNeeded || (stochasticContainer && stochasticContainer.clientWidth);
    const atrNeeded = activeIndicators.atr;
    const atrReady = !atrNeeded || (atrContainer && atrContainer.clientWidth);
    if (!candleContainer.clientWidth || !volumeContainer.clientWidth || !rsiContainer.clientWidth || !macdReady || !stochasticReady || !atrReady) {
      if (debug) {
        console.log('Chart containers not properly sized, retrying...', {
          retryCount,
          candle: candleContainer.clientWidth,
          volume: volumeContainer.clientWidth,
          rsi: rsiContainer.clientWidth,
          macd: macdContainer ? macdContainer.clientWidth : 'N/A',
          macdNeeded,
          stochastic: stochasticContainer ? stochasticContainer.clientWidth : 'N/A',
          stochasticNeeded,
          atr: atrContainer ? atrContainer.clientWidth : 'N/A',
          atrNeeded,
        });
      }
      // Retry after a short delay, max 10 retries
      if (retryCount < 10) {
        setTimeout(() => initializeCharts(retryCount + 1), 150);
      } else {
        setError('Failed to initialize charts: containers not properly sized');
        setIsLoading(false);
      }
      return;
    }

    try {
      setError(null);
      setIsLoading(true);

      if (debug) {
        console.log('Initializing charts with data:', {
          dataPoints: validatedData.length,
          dateRange: `${validatedData[0]?.date} to ${validatedData[validatedData.length - 1]?.date}`,
          dimensions: chartDimensions,
          heights: chartHeights
        });
      }

      // Clear previous charts
      cleanupCharts();
      
      // Clear container content
      candleChartRef.current.innerHTML = '';
      volumeChartRef.current.innerHTML = '';
      rsiChartRef.current.innerHTML = '';
      if (activeIndicators.macd && macdChartRef.current) macdChartRef.current.innerHTML = '';
      if (activeIndicators.stochastic && stochasticChartRef.current) stochasticChartRef.current.innerHTML = '';
      if (activeIndicators.atr && atrChartRef.current) atrChartRef.current.innerHTML = '';

      const isDark = theme === "dark";
      
      // FIXED: Unified theme system for consistent styling
      const createChartTheme = (isDark: boolean) => ({
        layout: {
          background: { type: ColorType.Solid, color: isDark ? "#0f172a" : "#ffffff" },
          textColor: isDark ? "#e2e8f0" : "#1e293b",
          fontSize: isMobile ? 10 : 12,
          fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          attributionLogo: false
        },
        grid: {
          vertLines: { 
            color: isDark ? "#1e293b" : "#f1f5f9",
            visible: true,
            style: 2,
          },
          horzLines: { 
            color: isDark ? "#1e293b" : "#f1f5f9",
            visible: true,
            style: 2,
          },
        },
        priceScale: {
          borderColor: isDark ? "#334155" : "#e2e8f0",
          scaleMargins: { top: 0.02, bottom: 0.05 }, // Further reduced margins for more chart space
          autoScale: true,
          entireTextOnly: false, // Changed to false to ensure labels display
          ticksVisible: true,
          borderVisible: true,
        },
        timeScale: {
          borderColor: isDark ? "#334155" : "#e2e8f0",
          timeVisible: true,
          secondsVisible: false,
          rightOffset: isMobile ? 4 : 8,
          barSpacing: isMobile ? 4 : 6,
          minBarSpacing: isMobile ? 1 : 2,
          fixLeftEdge: true,
          fixRightEdge: true,
          // Further reduced margins for more chart space
          scaleMargins: { left: 0.0, right: 0.01 },
          tickMarkFormatter: (time: number) => {
            const date = new Date(time * 1000);
            return isMobile 
              ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          },
        },
        crosshair: {
          vertLine: {
            color: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
            width: 1,
            style: 0,
            visible: true,
            labelVisible: true,
            labelBackgroundColor: isDark ? '#1e293b' : '#f8fafc',
          },
          horzLine: {
            color: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
            width: 1,
            style: 0,
            visible: true,
            labelVisible: true,
            labelBackgroundColor: isDark ? '#1e293b' : '#f8fafc',
          },
        },
        handleScroll: {
          mouseWheel: true,
          pressedMouseMove: true,
          horzTouchDrag: true,
          vertTouchDrag: true,
        },
        handleScale: {
          axisPressedMouseMove: false,
          mouseWheel: true,
          pinch: true,
          axisDoubleClickReset: true,
        },
        localization: {
          timeFormatter: (time: number) => {
            return new Date(time * 1000).toLocaleDateString();
          },
          priceFormatter: (price: number) => {
            // Format to exactly 8 characters total for main chart alignment (e.g., " 123.45")
            const formatted = price >= 1 ? price.toFixed(2) : price.toPrecision(4);
            return formatted.padStart(8, ' ');
          },
        },
      });

      const themeConfig = createChartTheme(isDark);
      
      // Common chart options using unified theme
      const commonOptions = {
        ...themeConfig,
        rightPriceScale: {
          ...themeConfig.priceScale,
          autoScale: true, // Enable autoScale for proper axis labels
        },
        leftPriceScale: {
          ...themeConfig.priceScale,
          visible: false, // Hide left price scale to save space
        },
      };

      // Create main candlestick chart
      const candleChart = createChart(candleChartRef.current, {
        ...commonOptions,
        width: chartDimensions.width || candleChartRef.current.clientWidth,
        height: chartHeights.candle,
        layout: {
          ...commonOptions.layout,
          textColor: isDark ? "#e2e8f0" : "#1e293b",
        },
        grid: {
          ...commonOptions.grid,
          vertLines: { ...commonOptions.grid.vertLines, visible: false },
        },
        // Enhanced space utilization
        leftPriceScale: {
          visible: false, // Hide left price scale to save space
        },
        rightPriceScale: {
          ...commonOptions.rightPriceScale,
          scaleMargins: { top: 0.02, bottom: 0.05 }, // Minimal margins
          autoScale: true, // Ensure autoScale is enabled
        },
        timeScale: {
          ...commonOptions.timeScale,
          scaleMargins: { left: 0.0, right: 0.01 }, // Zero left margin to eliminate space
        },
      });
      chartInstance.current = candleChart;

      // Create volume chart
      const volumeChart = createChart(volumeChartRef.current, {
        layout: {
          background: { color: 'transparent' },
          textColor: isDark ? '#d1d5db' : '#4b5563',
          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
          attributionLogo: false,
        },
        grid: {
          vertLines: { visible: false },
          horzLines: { visible: false },
        },
        width: chartDimensions.width || volumeChartRef.current.clientWidth,
        height: chartHeights.volume,
        rightPriceScale: {
          visible: true,
          borderColor: isDark ? "#334155" : "#e2e8f0",
          scaleMargins: { top: 0.1, bottom: 0.1 }, // Better margins for volume visibility
          entireTextOnly: false, // Changed to false to ensure labels display
          autoScale: true,
          ticksVisible: true,
        },
        leftPriceScale: {
          visible: false,
          borderVisible: false,
        },
        timeScale: {
          visible: false,
          timeVisible: false,
          secondsVisible: false,
          borderVisible: false,
        },
        crosshair: {
          vertLine: {
            color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
            width: 1,
            style: 2,
            visible: true,
            labelVisible: false,
          },
          horzLine: {
            visible: false,
            labelVisible: false,
          },
        },
        handleScroll: false,
        handleScale: false,
        localization: {
          priceFormatter: (price: number) => {
            // Format volume to 8 characters + thin space for perfect alignment (e.g., "   40.0M")
            const thinSpace = '\u2009'; // Unicode thin space character
            if (price >= 1000000) {
              return `${(price / 1000000).toFixed(1)}M${thinSpace}`.padStart(8, ' ');
            } else if (price >= 1000) {
              return `${(price / 1000).toFixed(1)}K${thinSpace}`.padStart(8, ' ');
            } else {
              return `${price.toFixed(1)}${thinSpace}`.padStart(8, ' ');
            }
          },
        },
      });
      volumeInstance.current = volumeChart;

      // Create RSI chart
      const rsiChart = createChart(rsiChartRef.current, {
        ...commonOptions,
        width: chartDimensions.width || rsiChartRef.current.clientWidth,
        height: chartHeights.rsi,
        layout: {
          ...commonOptions.layout,
          textColor: isDark ? "#94a3b8" : "#64748b",
        },
        rightPriceScale: {
          ...commonOptions.rightPriceScale,
          scaleMargins: { top: 0.05, bottom: 0.05 }, // Reduced margins for better space utilization
          autoScale: false, // Disable autoScale to use fixed range
          minValue: 0, // Set minimum RSI value
          maxValue: 100, // Set maximum RSI value
          entireTextOnly: false, // Ensure all labels are visible
          ticksVisible: true, // Ensure tick marks are visible
          // Force display of full 0-100 range
          visible: true,
          borderVisible: true,
          // Increase scale width to accommodate labels
          size: 80, // Increase from default ~54px to 80px
          // Enhanced tick configuration for 0-100 range
          tickMarkFormatter: (value: number) => {
            // Show every 10 points: 0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100
            if (value % 10 === 0) {
              return value.toString();
            }
            return '';
          },
          // Force the scale to show the full range
          autoScaleInfoProvider: () => ({
            priceRange: {
              minValue: 0,
              maxValue: 100,
            },
          }),
        },
        timeScale: {
          ...commonOptions.timeScale,
          scaleMargins: { left: 0.0, right: 0.02 }, // Consistent with main chart
          timeVisible: false, // Hide time labels on RSI chart
          secondsVisible: false,
          borderVisible: false,
          visible: false, // Explicitly hide the entire time scale
        },
        localization: {
          priceFormatter: (price: number) => {
            // Format to exactly 7 characters total (e.g., "100.00")
            const formatted = price.toFixed(2);
            return formatted.padStart(7, ' ');
          },
        },
      });
      rsiInstance.current = rsiChart;
      
      // Enhanced RSI chart range enforcement
      const enforceRsiRange = () => {
        try {
          if (rsiChart) {
            rsiChart.applyOptions({
              rightPriceScale: {
                minValue: 0,
                maxValue: 100,
                autoScale: false,
                entireTextOnly: false,
                ticksVisible: true,
                size: 80,
                scaleMargins: { top: 0.1, bottom: 0.1 },
                tickMarkFormatter: (value: number) => {
                  if (value % 10 === 0) {
                    return value.toString();
                  }
                  return '';
                },
                autoScaleInfoProvider: () => ({
                  priceRange: {
                    minValue: 0,
                    maxValue: 100,
                  },
                }),
              }
            });
            
            // Force the chart to recalculate and display the full range
            rsiChart.resize(rsiChartRef.current?.clientWidth || 800, chartHeights.rsi);
            
            // Additional enforcement by setting visible range
            rsiChart.priceScale('right').setAutoScale(false);
            rsiChart.priceScale('right').applyOptions({
              minValue: 0,
              maxValue: 100,
              scaleMargins: { top: 0.05, bottom: 0.05 },
            });
            
            // Ensure time scale is properly configured
            rsiChart.timeScale().applyOptions({
              timeVisible: false,
              secondsVisible: false,
              borderVisible: false,
              visible: false, // Explicitly hide the entire time scale
            });
          }
        } catch (error) {
          console.warn('RSI range enforcement error:', error);
        }
      };
      
      // Initial enforcement
      enforceRsiRange();
      
      // Ensure RSI range is set after data is loaded with multiple attempts
      setTimeout(enforceRsiRange, 100);
      setTimeout(enforceRsiRange, 500);
      setTimeout(enforceRsiRange, 1000);
      
      // Additional enforcement after a longer delay to ensure it sticks
      setTimeout(enforceRsiRange, 2000);
      
      // Robust RSI time scale enforcement to prevent interference from other charts
      const enforceRsiTimeScaleVisibility = () => {
        try {
          if (rsiChart && rsiInstance.current) {
            rsiChart.timeScale().applyOptions({
              timeVisible: false,
              secondsVisible: false,
              borderVisible: false,
              visible: false, // Explicitly hide the entire time scale
            });
          }
        } catch (error) {
          console.warn('RSI time scale visibility enforcement error:', error);
        }
      };
      
      // Apply enforcement after any potential chart interference
      setTimeout(enforceRsiTimeScaleVisibility, 100);
      setTimeout(enforceRsiTimeScaleVisibility, 500);
      setTimeout(enforceRsiTimeScaleVisibility, 1000);
      
      // --- MACD Chart ---
      if (activeIndicators.macd && macdChartRef.current) {
        const macdChart = createChart(macdChartRef.current, {
          ...commonOptions,
          width: chartDimensions.width || macdChartRef.current.clientWidth,
          height: chartHeights.macd,
          layout: {
            ...commonOptions.layout,
            textColor: isDark ? "#a5b4fc" : "#3730a3",
          },
          rightPriceScale: {
            ...commonOptions.rightPriceScale,
            scaleMargins: { top: 0.05, bottom: 0.1 },
          },
        });
        macdInstance.current = macdChart;
        // MACD, Signal, Histogram series
        const macdLine = macdChart.addSeries(LineSeries, {
          color: isDark ? '#6366f1' : '#3730a3',
          lineWidth: 2,
          title: '',
          priceLineVisible: false,
          lastValueVisible: false,
        });
        const signalLine = macdChart.addSeries(LineSeries, {
          color: isDark ? '#f59e42' : '#ea580c',
          lineWidth: 2,
          title: '',
          priceLineVisible: false,
          lastValueVisible: false,
        });
        const histogram = macdChart.addSeries(HistogramSeries, {
          color: '', // color will be set per-bar in the data
          priceFormat: { type: 'price', precision: 2, minMove: 0.01 },
          priceLineVisible: false,
          lastValueVisible: false,
          base: 0,
        });
        // Prepare MACD data
        const macdData = validatedData.map((d, idx) => ({
          time: toTimestamp(d.date),
          value: indicators.macd.macd[idx],
        })).filter(d => d.value !== null);
        const signalData = validatedData.map((d, idx) => ({
          time: toTimestamp(d.date),
          value: indicators.macd.signal[idx],
        })).filter(d => d.value !== null);
        const histogramData = validatedData.map((d, idx) => {
          const value = indicators.macd.histogram[idx];
          if (value === null || value === undefined) return null;
          const color = value >= 0
            ? (isDark ? '#22c55e' : '#16a34a')
            : (isDark ? '#ef4444' : '#dc2626');
          return {
            time: toTimestamp(d.date) as UTCTimestamp,
            value,
            color,
          };
        }).filter(
          d => d !== null && typeof d.value === 'number' && !isNaN(d.value)
        ) as Array<{ time: UTCTimestamp, value: number, color: string }>;
        macdLine.setData(macdData);
        signalLine.setData(signalData);
        histogram.setData(histogramData);
        // Sync time scale
        candleChart.timeScale().subscribeVisibleTimeRangeChange(() => {
          try {
            const timeRange = candleChart.timeScale().getVisibleRange();
            if (timeRange && timeRange.from && timeRange.to) {
              setTimeout(() => {
                try {
                  macdChart.timeScale().setVisibleRange(timeRange);
                } catch (syncError) {
                  if (debug) {
                    console.warn('MACD time scale sync error:', syncError);
                  }
                }
              }, 10);
            }
          } catch (error) {
            if (debug) {
              console.warn('MACD time range change error:', error);
            }
          }
        });
      }

      // --- Stochastic Chart ---
      if (activeIndicators.stochastic && stochasticChartRef.current) {
        const stochasticChart = createChart(stochasticChartRef.current, {
          ...commonOptions,
          width: chartDimensions.width || stochasticChartRef.current.clientWidth,
          height: chartHeights.stochastic,
          layout: {
            ...commonOptions.layout,
            textColor: isDark ? '#0ea5e9' : '#0369a1',
          },
          rightPriceScale: {
            ...commonOptions.rightPriceScale,
            scaleMargins: { top: 0.05, bottom: 0.1 },
          },
        });
        stochasticInstance.current = stochasticChart;
        // Stochastic %K and %D lines
        const kLine = stochasticChart.addSeries(LineSeries, {
          color: isDark ? '#0ea5e9' : '#0369a1',
          lineWidth: 2,
          title: '%K',
          priceLineVisible: false,
          lastValueVisible: true,
        });
        const dLine = stochasticChart.addSeries(LineSeries, {
          color: isDark ? '#f59e42' : '#ea580c',
          lineWidth: 2,
          title: '%D',
          priceLineVisible: false,
          lastValueVisible: true,
        });
        // Prepare data
        const kData = validatedData.map((d, idx) => ({
          time: toTimestamp(d.date),
          value: indicators.stochastic.k[idx],
        })).filter(d => d.value !== null);
        const dData = validatedData.map((d, idx) => ({
          time: toTimestamp(d.date),
          value: indicators.stochastic.d[idx],
        })).filter(d => d.value !== null);
        kLine.setData(kData);
        dLine.setData(dData);
        // Reference lines
        kLine.createPriceLine({ price: 80, color: '#ef4444', lineWidth: 1, lineStyle: 2, axisLabelVisible: false });
        kLine.createPriceLine({ price: 20, color: '#10b981', lineWidth: 1, lineStyle: 2, axisLabelVisible: false });
      }

      // --- ATR Chart ---
      if (activeIndicators.atr && atrChartRef.current) {
        const atrChart = createChart(atrChartRef.current, {
          ...commonOptions,
          width: chartDimensions.width || atrChartRef.current.clientWidth,
          height: chartHeights.atr,
          layout: {
            ...commonOptions.layout,
            textColor: isDark ? '#f87171' : '#b91c1c',
          },
          rightPriceScale: {
            ...commonOptions.rightPriceScale,
            scaleMargins: { top: 0.05, bottom: 0.1 },
          },
        });
        atrInstance.current = atrChart;
        // ATR line
        const atrLine = atrChart.addSeries(LineSeries, {
          color: isDark ? '#f87171' : '#b91c1c',
          lineWidth: 2,
          title: 'ATR',
          priceLineVisible: false,
          lastValueVisible: true,
        });
        // Prepare data
        const atrData = validatedData.map((d, idx) => ({
          time: toTimestamp(d.date),
          value: indicators.atr[idx],
        })).filter(d => d.value !== null);
        atrLine.setData(atrData);
      }

      // Initialize global timeout tracking if not exists
      if (!window.chartTimeouts) {
        window.chartTimeouts = [];
      }

      // Synchronize time scales with proper error handling
      candleChart.timeScale().subscribeVisibleTimeRangeChange(() => {
        try {
          const timeRange = candleChart.timeScale().getVisibleRange();
          if (timeRange && timeRange.from && timeRange.to) {
            // Add a small delay to ensure charts are ready
            const timeoutId = setTimeout(() => {
              // Check if component is still mounted
              if (!isMountedRef.current) return;
              
              try {
                // Check if charts are still valid before syncing
                if (volumeChart && chartInstance.current) {
                  try {
                    volumeChart.timeScale().setVisibleRange(timeRange);
                  } catch (e) {
                    if (debug) console.warn('Volume chart sync failed:', e);
                  }
                }
                if (rsiChart && chartInstance.current) {
                  try {
                    rsiChart.timeScale().setVisibleRange(timeRange);
                  } catch (e) {
                    if (debug) console.warn('RSI chart sync failed:', e);
                  }
                }
                if (activeIndicators.macd && macdInstance.current && chartInstance.current) {
                  try {
                    macdInstance.current.timeScale().setVisibleRange(timeRange);
                  } catch (e) {
                    if (debug) console.warn('MACD chart sync failed:', e);
                  }
                }
                if (activeIndicators.stochastic && stochasticInstance.current && chartInstance.current) {
                  try {
                    stochasticInstance.current.timeScale().setVisibleRange(timeRange);
                  } catch (e) {
                    if (debug) console.warn('Stochastic chart sync failed:', e);
                  }
                }
                if (activeIndicators.atr && atrInstance.current && chartInstance.current) {
                  try {
                    atrInstance.current.timeScale().setVisibleRange(timeRange);
                  } catch (e) {
                    if (debug) console.warn('ATR chart sync failed:', e);
                  }
                }
              } catch (syncError) {
                if (debug) {
                  console.warn('Time scale sync error:', syncError);
                }
              }
            }, 10);
            
            // Track the timeout for cleanup
            window.chartTimeouts.push(timeoutId);
          }
        } catch (error) {
          if (debug) {
            console.warn('Time range change error:', error);
          }
        }
      });

      // Add series to charts
      let priceSeries;
      if (priceChartType === 'candlestick') {
        priceSeries = candleChart.addSeries(CandlestickSeries, {
          upColor: '#10b981',
          downColor: '#ef4444',
          borderVisible: false,
          wickUpColor: '#10b981',
          wickDownColor: '#ef4444',
          wickVisible: true,
          borderColor: 'transparent',
          borderUpColor: 'transparent',
          borderDownColor: 'transparent',
          wickColor: isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
          priceLineVisible: false,
          lastValueVisible: true,
          priceLineWidth: 1,
          priceLineStyle: 2,
          priceFormat: {
            type: 'price',
            precision: 2,
            minMove: 0.01,
          },
        });
      } else {
        priceSeries = candleChart.addSeries(LineSeries, {
          color: isDark ? '#3b82f6' : '#60a5fa', // light blue for line plot
          lineWidth: 2,
          priceLineVisible: false,
          lastValueVisible: true,
          priceFormat: {
            type: 'price',
            precision: 2,
            minMove: 0.01,
          },
        });
      }
      
      const volumeSeries = volumeChart.addSeries(HistogramSeries, {
        color: isDark ? 'rgba(96, 165, 250, 0.8)' : 'rgba(59, 130, 246, 0.8)',
        priceFormat: { type: 'volume' },
        priceScaleId: 'right',
        priceLineVisible: false,
        lastValueVisible: false,
        base: 0,
        priceLineWidth: 1,
        priceLineStyle: 2,
      });
      
      // Add OBV series to volume chart
      const obvSeries = volumeChart.addSeries(LineSeries, {
        color: isDark ? '#a855f7' : '#7c3aed',
        lineWidth: 2,
        lineStyle: 0,
        title: 'OBV',
        visible: activeIndicators.obv,
        lastValueVisible: activeIndicators.obv,
        priceLineVisible: false,
        priceLineWidth: 1,
        priceLineStyle: 2,
        crosshairMarkerVisible: true,
        crosshairMarkerRadius: 3,
        priceScaleId: 'right',
        priceFormat: {
          type: 'volume',
          precision: 0,
          minMove: 1,
        },
      });
      
      // Store OBV series reference
      indicatorSeriesRef.current['obv'] = obvSeries;
      
      const rsiSeries = rsiChart.addSeries(LineSeries, {
        color: isDark ? '#f59e0b' : '#d97706',
        lineWidth: 2,
        lastValueVisible: true,
        priceLineVisible: false,
        priceLineWidth: 1,
        priceLineStyle: 2,
        crosshairMarkerVisible: true,
        crosshairMarkerRadius: 4,
      });

      // Enhanced RSI reference lines for full range visualization
      // 100 (Maximum) - Gray dashed line
      const rsiMaxLine = rsiChart.addSeries(LineSeries, {
        color: isDark ? '#6b7280' : '#9ca3af',
        lineWidth: 1,
        lineStyle: 2, // Dashed line
        lastValueVisible: false,
        priceLineVisible: false,
      });

      // 80 (Strong Overbought) - Orange dashed line
      const rsiStrongOverboughtLine = rsiChart.addSeries(LineSeries, {
        color: isDark ? '#f97316' : '#ea580c',
        lineWidth: 1,
        lineStyle: 2, // Dashed line
        lastValueVisible: false,
        priceLineVisible: false,
      });

      // 70 (Overbought) - Red dashed line
      const overboughtLine = rsiChart.addSeries(LineSeries, {
        color: isDark ? '#ef4444' : '#dc2626',
        lineWidth: 1,
        lineStyle: 2, // Dashed line
        lastValueVisible: false,
        priceLineVisible: false,
      });

      // 50 (Neutral) - Gray dashed line
      const rsiNeutralLine = rsiChart.addSeries(LineSeries, {
        color: isDark ? '#6b7280' : '#9ca3af',
        lineWidth: 1,
        lineStyle: 2, // Dashed line
        lastValueVisible: false,
        priceLineVisible: false,
      });

      // 30 (Oversold) - Green dashed line
      const oversoldLine = rsiChart.addSeries(LineSeries, {
        color: isDark ? '#22c55e' : '#16a34a',
        lineWidth: 1,
        lineStyle: 2, // Dashed line
        lastValueVisible: false,
        priceLineVisible: false,
      });

      // 20 (Strong Oversold) - Dark green dashed line
      const rsiStrongOversoldLine = rsiChart.addSeries(LineSeries, {
        color: isDark ? '#15803d' : '#166534',
        lineWidth: 1,
        lineStyle: 2, // Dashed line
        lastValueVisible: false,
        priceLineVisible: false,
      });

      // 0 (Minimum) - Gray dashed line
      const rsiMinLine = rsiChart.addSeries(LineSeries, {
        color: isDark ? '#6b7280' : '#9ca3af',
        lineWidth: 1,
        lineStyle: 2, // Dashed line
        lastValueVisible: false,
        priceLineVisible: false,
      });

      // Add indicator series with visibility control
      indicatorSeriesRef.current['sma20'] = candleChart.addSeries(LineSeries, {
        color: isDark ? '#60a5fa' : '#2563eb',
        lineWidth: 2,
        lineStyle: 0,
        title: 'SMA 20',
        visible: activeIndicators.sma20,
        lastValueVisible: activeIndicators.sma20,
        priceLineVisible: activeIndicators.sma20,
        priceLineWidth: 1,
        priceLineStyle: 2,
        crosshairMarkerVisible: false,
        priceFormat: {
          type: 'price',
          precision: 2,
          minMove: 0.01,
        },
      });

      indicatorSeriesRef.current['sma50'] = candleChart.addSeries(LineSeries, {
        color: isDark ? '#8b5cf6' : '#7c3aed',
        lineWidth: 2,
        lineStyle: 0,
        title: 'SMA 50',
        visible: activeIndicators.sma50,
        lastValueVisible: activeIndicators.sma50,
        priceLineVisible: activeIndicators.sma50,
        priceLineWidth: 1,
        priceLineStyle: 2,
        crosshairMarkerVisible: false,
        priceFormat: {
          type: 'price',
          precision: 2,
          minMove: 0.01,
        },
      });

      indicatorSeriesRef.current['ema12'] = candleChart.addSeries(LineSeries, {
        color: isDark ? '#f472b6' : '#db2777',
        lineWidth: 2,
        lineStyle: 0,
        title: 'EMA 12',
        visible: activeIndicators.ema12,
        lastValueVisible: activeIndicators.ema12,
        priceLineVisible: activeIndicators.ema12,
        priceLineWidth: 1,
        priceLineStyle: 2,
        crosshairMarkerVisible: false,
        priceFormat: {
          type: 'price',
          precision: 2,
          minMove: 0.01,
        },
      });

      indicatorSeriesRef.current['ema26'] = candleChart.addSeries(LineSeries, {
        color: isDark ? '#f59e0b' : '#d97706',
        lineWidth: 2,
        lineStyle: 0,
        title: 'EMA 26',
        visible: activeIndicators.ema26,
        lastValueVisible: activeIndicators.ema26,
        priceLineVisible: activeIndicators.ema26,
        priceLineWidth: 1,
        priceLineStyle: 2,
        crosshairMarkerVisible: false,
        priceFormat: {
          type: 'price',
          precision: 2,
          minMove: 0.01,
        },
      });

      indicatorSeriesRef.current['ema50'] = candleChart.addSeries(LineSeries, {
        color: isDark ? '#3b82f6' : '#1d4ed8',
        lineWidth: 2,
        lineStyle: 0,
        title: 'EMA 50',
        visible: activeIndicators.ema50,
        lastValueVisible: activeIndicators.ema50,
        priceLineVisible: activeIndicators.ema50,
        priceLineWidth: 1,
        priceLineStyle: 2,
        crosshairMarkerVisible: false,
        priceFormat: {
          type: 'price',
          precision: 2,
          minMove: 0.01,
        },
      });

      indicatorSeriesRef.current['sma200'] = candleChart.addSeries(LineSeries, {
        color: isDark ? '#10b981' : '#06b6d4',
        lineWidth: 2,
        lineStyle: 0,
        title: 'SMA 200',
        visible: activeIndicators.sma200,
        lastValueVisible: activeIndicators.sma200,
        priceLineVisible: activeIndicators.sma200,
        priceLineWidth: 1,
        priceLineStyle: 2,
        crosshairMarkerVisible: false,
        priceFormat: {
          type: 'price',
          precision: 2,
          minMove: 0.01,
        },
      });

      indicatorSeriesRef.current['bollingerUpper'] = candleChart.addSeries(LineSeries, {
        color: isDark ? 'rgba(34, 197, 94, 0.6)' : 'rgba(34, 197, 94, 0.6)',
        lineWidth: 1,
        lineStyle: 2,
        title: 'BB Upper',
        visible: activeIndicators.bollingerBands,
        lastValueVisible: false,
        priceLineVisible: false,
        crosshairMarkerVisible: false,
        priceFormat: {
          type: 'price',
          precision: 2,
          minMove: 0.01,
        },
      });

      indicatorSeriesRef.current['bollingerMiddle'] = candleChart.addSeries(LineSeries, {
        color: isDark ? 'rgba(59, 130, 246, 0.8)' : 'rgba(59, 130, 246, 0.8)',
        lineWidth: 1,
        lineStyle: 0,
        title: 'BB Middle',
        visible: activeIndicators.bollingerBands,
        lastValueVisible: false,
        priceLineVisible: false,
        crosshairMarkerVisible: false,
        priceFormat: {
          type: 'price',
          precision: 2,
          minMove: 0.01,
        },
      });

      indicatorSeriesRef.current['bollingerLower'] = candleChart.addSeries(LineSeries, {
        color: isDark ? 'rgba(239, 68, 68, 0.6)' : 'rgba(239, 68, 68, 0.6)',
        lineWidth: 1,
        lineStyle: 2,
        title: 'BB Lower',
        visible: activeIndicators.bollingerBands,
        lastValueVisible: false,
        priceLineVisible: false,
        crosshairMarkerVisible: false,
        priceFormat: {
          type: 'price',
          precision: 2,
          minMove: 0.01,
        },
      });

      // Set data for all series
      const candleData = validatedData.map<CandlestickData>(d => ({
        time: toTimestamp(d.date),
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
      }));

      // For line chart: filter out invalid close values
      const lineData = validatedData
        .filter(d => typeof d.close === 'number' && !isNaN(d.close))
        .map<LineData>(d => ({
          time: toTimestamp(d.date),
          value: d.close,
        }));

      const volumeData = validatedData.map<HistogramData>(d => ({
        time: toTimestamp(d.date),
        value: d.volume,
        color: d.close >= d.open ? 'rgba(38, 166, 154, 0.8)' : 'rgba(239, 83, 80, 0.8)',
      }));

      const rsiData = validatedData
        .map<LineData>((d, idx) => ({
          time: toTimestamp(d.date),
          value: indicators.rsi14[idx],
        }))
        .filter(d => d.value !== null) as LineData[];
      
      // Ensure RSI data has proper range for display
      if (rsiData.length > 0) {
        // Filter out any invalid values and ensure proper range
        const validRsiData = rsiData.filter(d => 
          d.value !== null && 
          d.value !== undefined && 
          !isNaN(d.value) && 
          d.value >= 0 && 
          d.value <= 100
        );
        
        if (validRsiData.length > 0) {
          // Replace with valid data
          rsiData.length = 0;
          rsiData.push(...validRsiData);
        }
      }

      // Prepare indicator data
      const sma20Data = validatedData
        .map<LineData>((d, idx) => ({
          time: toTimestamp(d.date),
          value: indicators.sma20[idx],
        }))
        .filter(d => d.value !== null) as LineData[];

      const sma50Data = validatedData
        .map<LineData>((d, idx) => ({
          time: toTimestamp(d.date),
          value: indicators.sma50[idx],
        }))
        .filter(d => d.value !== null) as LineData[];

      const ema12Data = validatedData
        .map<LineData>((d, idx) => ({
          time: toTimestamp(d.date),
          value: indicators.ema12[idx],
        }))
        .filter(d => d.value !== null) as LineData[];

      const ema26Data = validatedData
        .map<LineData>((d, idx) => ({
          time: toTimestamp(d.date),
          value: indicators.ema26[idx],
        }))
        .filter(d => d.value !== null) as LineData[];

      const ema50Data = validatedData
        .map<LineData>((d, idx) => ({
          time: toTimestamp(d.date),
          value: indicators.ema50[idx],
        }))
        .filter(d => d.value !== null) as LineData[];

      const sma200Data = validatedData
        .map<LineData>((d, idx) => ({
          time: toTimestamp(d.date),
          value: indicators.sma200[idx],
        }))
        .filter(d => d.value !== null) as LineData[];

      const bollingerUpperData = validatedData
        .map<LineData>((d, idx) => ({
          time: toTimestamp(d.date),
          value: indicators.bollingerBands.upper[idx],
        }))
        .filter(d => d.value !== null) as LineData[];

      const bollingerMiddleData = validatedData
        .map<LineData>((d, idx) => ({
          time: toTimestamp(d.date),
          value: indicators.bollingerBands.middle[idx],
        }))
        .filter(d => d.value !== null) as LineData[];

      const bollingerLowerData = validatedData
        .map<LineData>((d, idx) => ({
          time: toTimestamp(d.date),
          value: indicators.bollingerBands.lower[idx],
        }))
        .filter(d => d.value !== null) as LineData[];

      const obvData = validatedData
        .map<LineData>((d, idx) => ({
          time: toTimestamp(d.date),
          value: indicators.obv[idx],
        }))
        .filter(d => d.value !== null) as LineData[];

      if (debug) {
        console.log('Chart data prepared:', {
          candleDataPoints: candleData.length,
          volumeDataPoints: volumeData.length,
          rsiDataPoints: rsiData.length,
          sma20DataPoints: sma20Data.length,
          sma50DataPoints: sma50Data.length
        });
      }

      // Set data with error handling
      try {
        if (priceChartType === 'candlestick') {
          priceSeries.setData(candleData);
        } else {
          priceSeries.setData(lineData);
        }
        volumeSeries.setData(volumeData);
        rsiSeries.setData(rsiData);
        obvSeries.setData(obvData);
        
        // Enhanced RSI range enforcement after data is set
        const enforceRsiRangeAfterData = () => {
          try {
            if (rsiChart) {
              rsiChart.applyOptions({
                rightPriceScale: {
                  minValue: 0,
                  maxValue: 100,
                  autoScale: false,
                  entireTextOnly: false,
                  ticksVisible: true,
                  size: 80,
                  scaleMargins: { top: 0.05, bottom: 0.05 },
                  tickMarkFormatter: (value: number) => {
                    if (value % 10 === 0) {
                      return value.toString();
                    }
                    return '';
                  },
                  autoScaleInfoProvider: () => ({
                    priceRange: {
                      minValue: 0,
                      maxValue: 100,
                    },
                  }),
                }
              });
              
              // Force the chart to recalculate and display the full range
              rsiChart.resize(rsiChartRef.current?.clientWidth || 800, chartHeights.rsi);
              
              // Additional enforcement by setting visible range
              rsiChart.priceScale('right').setAutoScale(false);
              rsiChart.priceScale('right').applyOptions({
                minValue: 0,
                maxValue: 100,
                scaleMargins: { top: 0.05, bottom: 0.05 },
              });
              
              // Ensure time scale is properly configured
              rsiChart.timeScale().applyOptions({
                timeVisible: false,
                secondsVisible: false,
                borderVisible: false,
              });
            }
          } catch (error) {
            console.warn('RSI data-set range enforcement error:', error);
          }
        };
        
        // Enforce range immediately after data is set
        enforceRsiRangeAfterData();
        
        // Additional enforcement with delays to ensure it sticks
        setTimeout(enforceRsiRangeAfterData, 50);
        setTimeout(enforceRsiRangeAfterData, 200);
        setTimeout(enforceRsiRangeAfterData, 500);
        
        // Set data for comprehensive RSI reference lines (0, 20, 30, 50, 70, 80, 100)
        const rsiMaxData = validatedData.map<LineData>(d => ({
          time: toTimestamp(d.date),
          value: 100,
        }));
        const rsiStrongOverboughtData = validatedData.map<LineData>(d => ({
          time: toTimestamp(d.date),
          value: 80,
        }));
        const overboughtData = validatedData.map<LineData>(d => ({
          time: toTimestamp(d.date),
          value: 70,
        }));
        const rsiNeutralData = validatedData.map<LineData>(d => ({
          time: toTimestamp(d.date),
          value: 50,
        }));
        const oversoldData = validatedData.map<LineData>(d => ({
          time: toTimestamp(d.date),
          value: 30,
        }));
        const rsiStrongOversoldData = validatedData.map<LineData>(d => ({
          time: toTimestamp(d.date),
          value: 20,
        }));
        const rsiMinData = validatedData.map<LineData>(d => ({
          time: toTimestamp(d.date),
          value: 0,
        }));
        
        // Set data for all reference lines
        rsiMaxLine.setData(rsiMaxData);
        rsiStrongOverboughtLine.setData(rsiStrongOverboughtData);
        overboughtLine.setData(overboughtData);
        rsiNeutralLine.setData(rsiNeutralData);
        oversoldLine.setData(oversoldData);
        rsiStrongOversoldLine.setData(rsiStrongOversoldData);
        rsiMinLine.setData(rsiMinData);
        
        // Set indicator data
        indicatorSeriesRef.current['sma20'].setData(sma20Data);
        indicatorSeriesRef.current['sma50'].setData(sma50Data);
        indicatorSeriesRef.current['ema12'].setData(ema12Data);
        indicatorSeriesRef.current['ema26'].setData(ema26Data);
        indicatorSeriesRef.current['ema50'].setData(ema50Data);
        indicatorSeriesRef.current['sma200'].setData(sma200Data);
        indicatorSeriesRef.current['bollingerUpper'].setData(bollingerUpperData);
        indicatorSeriesRef.current['bollingerMiddle'].setData(bollingerMiddleData);
        indicatorSeriesRef.current['bollingerLower'].setData(bollingerLowerData);
        
        // --- Volume Anomaly Markers ---
        const volumes = validatedData.map(d => d.volume);
        const anomalies = detectVolumeAnomalies(volumes, 2.0, 20);
        if (anomalies.length > 0 && volumeChart && activeIndicators.volumeAnomaly) {
          const anomalyMarkerSeries = volumeChart.addSeries(LineSeries, {
            color: '#f59e42', // orange
            lineWidth: 1, // thinner line
            crosshairMarkerVisible: true,
            crosshairMarkerRadius: 5,
            lastValueVisible: false,
            priceLineVisible: false,
            title: 'Volume Anomaly',
            priceScaleId: 'left',
          });
          const anomalyMarkerData = anomalies.map(anom => ({
            time: toTimestamp(validatedData[anom.index].date),
            value: anom.volume,
          }));
          anomalyMarkerSeries.setData(anomalyMarkerData);
        }
        // --- End Volume Anomaly Markers ---

        // --- Ensure indicator visibility matches activeIndicators after re-init ---
        const indicatorKeys = [
          'sma20', 'sma50', 'sma200', 'ema12', 'ema26', 'ema50',
          'bollingerUpper', 'bollingerMiddle', 'bollingerLower', 'obv'
        ];
        indicatorKeys.forEach(key => {
          const series = indicatorSeriesRef.current[key];
          if (series) {
            let visible = false;
            if (key.startsWith('sma')) visible = activeIndicators[key as keyof typeof activeIndicators];
            else if (key.startsWith('ema')) visible = activeIndicators[key as keyof typeof activeIndicators];
            else if (key.startsWith('bollinger')) visible = activeIndicators.bollingerBands;
            else if (key === 'obv') visible = activeIndicators.obv;
            series.applyOptions({
              visible,
              lastValueVisible: visible,
              priceLineVisible: visible,
            });
          }
        });
        if (debug) {
          console.log('Indicator series after creation:', indicatorSeriesRef.current);
          console.log('Active indicators:', activeIndicators);
        }

        // Scroll all charts to latest bar
        if (candleChart && candleData.length > 0) {
          candleChart.timeScale().scrollToPosition(candleData.length - 1, false);
        }
        if (volumeChart && volumeData.length > 0) {
          volumeChart.timeScale().scrollToPosition(volumeData.length - 1, false);
        }
        if (rsiChart && rsiData.length > 0) {
          rsiChart.timeScale().scrollToPosition(rsiData.length - 1, false);
        }

        if (debug) {
          console.log('All series data set successfully');
        }
      } catch (dataError) {
        console.error('Error setting chart data:', dataError);
        throw new Error(`Failed to set chart data: ${dataError instanceof Error ? dataError.message : 'Unknown error'}`);
      }

      // Add only essential RSI reference lines (70 and 30)
      rsiSeries.createPriceLine({
        price: 70,
        color: isDark ? '#ef4444' : '#dc2626',
        lineWidth: 1,
        lineStyle: 0,
        axisLabelVisible: false,
      });
      
      rsiSeries.createPriceLine({
        price: 30,
        color: isDark ? '#10b981' : '#059669',
        lineWidth: 1,
        lineStyle: 0,
        axisLabelVisible: false,
      });

      // Wait a bit for charts to render before marking as loaded
      const readyTimeoutId = setTimeout(() => {
        // Check if component is still mounted
        if (!isMountedRef.current) return;
        
        setIsLoading(false);
        setChartReady(true); // <-- Set chartReady to true after charts are initialized
        if (debug) {
          console.log('Charts initialized successfully');
        }
      }, 100);
      
      // Track the timeout for cleanup
      if (window.chartTimeouts) {
        window.chartTimeouts.push(readyTimeoutId);
      }

      // Add double top and double bottom patterns
      const closes = validatedData.map(d => d.close);
      if (activeIndicators.doublePatterns) {
        const doubleTops = detectDoubleTop(closes, 0.02, 5);
        const doubleBottoms = detectDoubleBottom(closes, 0.02, 5);
        
        // Draw Double Top patterns
        doubleTops.forEach((pattern) => {
          const lineSeries = candleChart.addSeries(LineSeries, {
            color: '#ef4444',
            lineWidth: 2,
            lineStyle: 2, // dashed
            priceLineVisible: false,
            lastValueVisible: false,
            crosshairMarkerVisible: false,
          });
          lineSeries.setData([
            {
              time: toTimestamp(validatedData[pattern.indices[0]].date),
              value: pattern.values[0],
            },
            {
              time: toTimestamp(validatedData[pattern.indices[1]].date),
              value: pattern.values[1],
            },
          ]);
        });
        
        // Draw Double Bottom patterns
        doubleBottoms.forEach((pattern) => {
          const lineSeries = candleChart.addSeries(LineSeries, {
            color: '#22c55e',
            lineWidth: 2,
            lineStyle: 2, // dashed
            priceLineVisible: false,
            lastValueVisible: false,
            crosshairMarkerVisible: false,
          });
          lineSeries.setData([
            {
              time: toTimestamp(validatedData[pattern.indices[0]].date),
              value: pattern.values[0],
            },
            {
              time: toTimestamp(validatedData[pattern.indices[1]].date),
              value: pattern.values[1],
            },
          ]);
        });
      }
      // Note: setMarkers is not available on candlestick series in lightweight-charts
      // Pattern markers are already added as separate line series above
      if (debug) {
        console.log('Pattern markers added as separate series');
      }
    } catch (error) {
      console.error('Error initializing charts:', error);
      setError(`Failed to initialize charts: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsLoading(false);
    }
  }, [validatedData, theme, chartDimensions.width, chartHeights.candle, chartHeights.volume, chartHeights.rsi, indicators, debug, cleanupCharts, activeIndicators.volumeAnomaly, activeIndicators.doublePatterns, priceChartType]);

  // Handle resize
  useEffect(() => {
    const handleResize = debouncedResize();
    window.addEventListener('resize', handleResize);
    
    // Initial size calculation
    if (containerRef.current) {
      const { width } = containerRef.current.getBoundingClientRect();
      setChartDimensions({ width, height });
    }

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [debouncedResize, height]);

  // Initialize charts when dependencies change
  useEffect(() => {
    initializeCharts();
  }, [initializeCharts]);

  // Update indicator visibility when activeIndicators change
  useEffect(() => {
    if (!chartInstance.current) return;

    try {
      const sma20Series = indicatorSeriesRef.current['sma20'];
      if (sma20Series) {
        sma20Series.applyOptions({
          visible: activeIndicators.sma20,
          lastValueVisible: activeIndicators.sma20,
          priceLineVisible: activeIndicators.sma20,
        });
      }
      const sma50Series = indicatorSeriesRef.current['sma50'];
      if (sma50Series) {
        sma50Series.applyOptions({
          visible: activeIndicators.sma50,
          lastValueVisible: activeIndicators.sma50,
          priceLineVisible: activeIndicators.sma50,
        });
      }
      const ema12Series = indicatorSeriesRef.current['ema12'];
      if (ema12Series) {
        ema12Series.applyOptions({
          visible: activeIndicators.ema12,
          lastValueVisible: activeIndicators.ema12,
          priceLineVisible: activeIndicators.ema12,
        });
      }
      const ema26Series = indicatorSeriesRef.current['ema26'];
      if (ema26Series) {
        ema26Series.applyOptions({
          visible: activeIndicators.ema26,
          lastValueVisible: activeIndicators.ema26,
          priceLineVisible: activeIndicators.ema26,
        });
      }
      const ema50Series = indicatorSeriesRef.current['ema50'];
      if (ema50Series) {
        ema50Series.applyOptions({
          visible: activeIndicators.ema50,
          lastValueVisible: activeIndicators.ema50,
          priceLineVisible: activeIndicators.ema50,
        });
      }
      const sma200Series = indicatorSeriesRef.current['sma200'];
      if (sma200Series) {
        sma200Series.applyOptions({
          visible: activeIndicators.sma200,
          lastValueVisible: activeIndicators.sma200,
          priceLineVisible: activeIndicators.sma200,
        });
      }
      const bbUpperSeries = indicatorSeriesRef.current['bollingerUpper'];
      const bbMiddleSeries = indicatorSeriesRef.current['bollingerMiddle'];
      const bbLowerSeries = indicatorSeriesRef.current['bollingerLower'];
      if (bbUpperSeries) {
        bbUpperSeries.applyOptions({
          visible: activeIndicators.bollingerBands,
          lastValueVisible: false,
          priceLineVisible: false,
        });
      }
      if (bbMiddleSeries) {
        bbMiddleSeries.applyOptions({
          visible: activeIndicators.bollingerBands,
          lastValueVisible: false,
          priceLineVisible: false,
        });
      }
      if (bbLowerSeries) {
        bbLowerSeries.applyOptions({
          visible: activeIndicators.bollingerBands,
          lastValueVisible: false,
          priceLineVisible: false,
        });
      }
      const obvSeries = indicatorSeriesRef.current['obv'];
      if (obvSeries) {
        obvSeries.applyOptions({
          visible: activeIndicators.obv,
          lastValueVisible: activeIndicators.obv,
          priceLineVisible: false,
        });
      }

      if (debug) {
        console.log('Indicator visibility updated:', activeIndicators);
      }
    } catch (error) {
      console.error('Error updating indicator visibility:', error);
    }
  }, [activeIndicators, debug]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      cleanupCharts();
    };
  }, [cleanupCharts]);

  // FIXED: Improved chart resize handling
  useEffect(() => {
    if (chartDimensions.width > 0) {
      const charts = [
        chartInstance.current,
        volumeInstance.current,
        rsiInstance.current,
        macdInstance.current,
        stochasticInstance.current,
        atrInstance.current
      ].filter(Boolean);
      
      charts.forEach(chart => {
        try {
          chart?.applyOptions({ width: chartDimensions.width });
        } catch (error) {
          if (debug) console.warn('Chart resize failed:', error);
        }
      });
      
      if (debug) {
        console.log('Applied chart resize to all charts:', chartDimensions.width);
      }
    }
  }, [chartDimensions.width, debug]);

  // --- MACD Chart Effect ---
  useEffect(() => {
    if (!activeIndicators.macd) {
      // Remove MACD chart if exists
      if (macdInstance.current) {
        macdInstance.current.remove();
        macdInstance.current = null;
      }
      if (macdChartRef.current) {
        macdChartRef.current.innerHTML = '';
      }
      return;
    }
    if (!macdChartRef.current || !chartInstance.current || validatedData.length === 0) return;
    // Create MACD chart
    const isDark = theme === "dark";
    const macdChart = createChart(macdChartRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: isDark ? "#0f172a" : "#ffffff" },
        textColor: isDark ? "#a5b4fc" : "#3730a3",
        fontSize: 12,
        fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          attributionLogo: false
      },
      rightPriceScale: {
        borderColor: isDark ? "#334155" : "#e2e8f0",
        scaleMargins: { top: 0.05, bottom: 0.1 },
        autoScale: false,
        entireTextOnly: true,
        ticksVisible: true,
        borderVisible: true,
      },
      width: chartDimensions.width || macdChartRef.current.clientWidth,
      height: chartHeights.macd,
      grid: {
        vertLines: { color: isDark ? "#1e293b" : "#f1f5f9", visible: true, style: 2 },
        horzLines: { color: isDark ? "#1e293b" : "#f1f5f9", visible: true, style: 2 },
      },
      timeScale: {
        borderColor: isDark ? "#334155" : "#e2e8f0",
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 8,
        barSpacing: 6,
        minBarSpacing: 2,
        fixLeftEdge: true,
        fixRightEdge: true,
        tickMarkFormatter: (time: number) => {
          const date = new Date(time * 1000);
          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        },
      },
      crosshair: {
        vertLine: {
          color: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
          width: 1,
          style: 0,
          visible: true,
          labelVisible: true,
          labelBackgroundColor: isDark ? '#1e293b' : '#f8fafc',
        },
        horzLine: {
          color: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
          width: 1,
          style: 0,
          visible: true,
          labelVisible: true,
          labelBackgroundColor: isDark ? '#1e293b' : '#f8fafc',
        },
      },
      localization: {
        timeFormatter: (time: number) => {
          return new Date(time * 1000).toLocaleDateString();
        },
        priceFormatter: (price: number) => {
          // Format to exactly 8 characters total for MACD alignment (e.g., "  -0.123")
          const formatted = price >= 1 ? price.toFixed(3) : price.toPrecision(4);
          return formatted.padStart(8, ' ');
        },
      },
    });
    macdInstance.current = macdChart;
    // MACD, Signal, Histogram series
    const macdLine = macdChart.addSeries(LineSeries, {
      color: isDark ? '#6366f1' : '#3730a3',
      lineWidth: 2,
      title: '',
      priceLineVisible: false,
      lastValueVisible: false,
    });
    const signalLine = macdChart.addSeries(LineSeries, {
      color: isDark ? '#f59e42' : '#ea580c',
      lineWidth: 2,
      title: '',
      priceLineVisible: false,
      lastValueVisible: false,
    });
    const histogram = macdChart.addSeries(HistogramSeries, {
      color: '',
      priceFormat: { type: 'price', precision: 2, minMove: 0.01 },
      priceLineVisible: false,
      lastValueVisible: false,
      base: 0,
    });
    // Prepare MACD data
    const macdData = validatedData.map((d, idx) => ({
      time: toTimestamp(d.date),
      value: indicators.macd.macd[idx],
    })).filter(d => d.value !== null);
    const signalData = validatedData.map((d, idx) => ({
      time: toTimestamp(d.date),
      value: indicators.macd.signal[idx],
    })).filter(d => d.value !== null);
    const histogramData = validatedData.map((d, idx) => {
      const value = indicators.macd.histogram[idx];
      if (value === null || value === undefined) return null;
      const color = value >= 0
        ? (isDark ? '#22c55e' : '#16a34a')
        : (isDark ? '#ef4444' : '#dc2626');
      return {
        time: toTimestamp(d.date) as UTCTimestamp,
        value,
        color,
      };
    }).filter(
      d => d !== null && typeof d.value === 'number' && !isNaN(d.value)
    ) as Array<{ time: UTCTimestamp, value: number, color: string }>;
    macdLine.setData(macdData);
    signalLine.setData(signalData);
    histogram.setData(histogramData);
    // --- Time scale sync ---
    let unsub: (() => void) | null = null;
    try {
      const sync = () => {
        // Check if component is still mounted
        if (!isMountedRef.current) return;
        
        try {
          const timeRange = chartInstance.current?.timeScale().getVisibleRange();
          if (timeRange && macdChart && chartInstance.current) {
            macdChart.timeScale().setVisibleRange(timeRange);
          }
        } catch (syncError) {
          if (debug) console.warn('MACD sync error:', syncError);
        }
      };
      chartInstance.current?.timeScale().subscribeVisibleTimeRangeChange(sync);
      unsub = () => {
        try {
          chartInstance.current?.timeScale().unsubscribeVisibleTimeRangeChange(sync);
        } catch (unsubError) {
          if (debug) console.warn('MACD unsub error:', unsubError);
        }
      };
    } catch (err) { /* No-op: cleanup error is non-fatal, but log for debugging */ if (debug) console.warn('Cleanup error (MACD sync):', err); }
    // Cleanup
    return () => {
      if (macdInstance.current) {
        macdInstance.current.remove();
        macdInstance.current = null;
      }
      if (macdChartRef.current) {
        macdChartRef.current.innerHTML = '';
      }
      if (unsub) unsub();
    };
  }, [activeIndicators.macd, macdChartRef, chartInstance, indicators.macd, validatedData, chartDimensions.width, chartHeights.macd, theme]);

  // --- Stochastic Chart Effect ---
  useEffect(() => {
    if (!activeIndicators.stochastic) {
      // Remove Stochastic chart if exists
      if (stochasticInstance.current) {
        stochasticInstance.current.remove();
        stochasticInstance.current = null;
      }
      if (stochasticChartRef.current) {
        stochasticChartRef.current.innerHTML = '';
      }
      return;
    }
    if (!stochasticChartRef.current || !chartInstance.current || validatedData.length === 0) return;
    // Create Stochastic chart
    const isDark = theme === "dark";
    const stochasticChart = createChart(stochasticChartRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: isDark ? "#0f172a" : "#ffffff" },
        textColor: isDark ? "#a5b4fc" : "#3730a3",
        fontSize: 12,
        fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          attributionLogo: false
      },
      rightPriceScale: {
        borderColor: isDark ? "#334155" : "#e2e8f0",
        scaleMargins: { top: 0.05, bottom: 0.1 },
        autoScale: false,
        entireTextOnly: true,
        ticksVisible: true,
        borderVisible: true,
      },
      width: chartDimensions.width || stochasticChartRef.current.clientWidth,
      height: chartHeights.stochastic,
      grid: {
        vertLines: { color: isDark ? "#1e293b" : "#f1f5f9", visible: true, style: 2 },
        horzLines: { color: isDark ? "#1e293b" : "#f1f5f9", visible: true, style: 2 },
      },
      timeScale: {
        borderColor: isDark ? "#334155" : "#e2e8f0",
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 8,
        barSpacing: 6,
        minBarSpacing: 2,
        fixLeftEdge: true,
        fixRightEdge: true,
        tickMarkFormatter: (time: number) => {
          const date = new Date(time * 1000);
          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        },
      },
      crosshair: {
        vertLine: {
          color: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
          width: 1,
          style: 0,
          visible: true,
          labelVisible: true,
          labelBackgroundColor: isDark ? '#1e293b' : '#f8fafc',
        },
        horzLine: {
          color: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
          width: 1,
          style: 0,
          visible: true,
          labelVisible: true,
          labelBackgroundColor: isDark ? '#1e293b' : '#f8fafc',
        },
      },
      localization: {
        timeFormatter: (time: number) => {
          return new Date(time * 1000).toLocaleDateString();
        },
        priceFormatter: (price: number) => {
          // Format to exactly 7 characters total for Stochastic alignment (e.g., " 80.00")
          const formatted = price.toFixed(2);
          return formatted.padStart(7, ' ');
        },
      },
    });
    stochasticInstance.current = stochasticChart;
    // Stochastic %K and %D lines
    const kLine = stochasticChart.addSeries(LineSeries, {
      color: isDark ? '#0ea5e9' : '#0369a1',
      lineWidth: 2,
      title: '%K',
      priceLineVisible: false,
      lastValueVisible: true,
    });
    const dLine = stochasticChart.addSeries(LineSeries, {
      color: isDark ? '#f59e42' : '#ea580c',
      lineWidth: 2,
      title: '%D',
      priceLineVisible: false,
      lastValueVisible: true,
    });
    // Prepare data
    const kData = validatedData.map((d, idx) => ({
      time: toTimestamp(d.date),
      value: indicators.stochastic.k[idx],
    })).filter(d => d.value !== null);
    const dData = validatedData.map((d, idx) => ({
      time: toTimestamp(d.date),
      value: indicators.stochastic.d[idx],
    })).filter(d => d.value !== null);
    kLine.setData(kData);
    dLine.setData(dData);
    // Reference lines
    kLine.createPriceLine({ price: 80, color: '#ef4444', lineWidth: 1, lineStyle: 2, axisLabelVisible: false });
    kLine.createPriceLine({ price: 20, color: '#10b981', lineWidth: 1, lineStyle: 2, axisLabelVisible: false });
    // --- Time scale sync ---
    let unsub: (() => void) | null = null;
    try {
      const sync = () => {
        // Check if component is still mounted
        if (!isMountedRef.current) return;
        
        try {
          const timeRange = chartInstance.current?.timeScale().getVisibleRange();
          if (timeRange && stochasticChart && chartInstance.current) {
            stochasticChart.timeScale().setVisibleRange(timeRange);
          }
        } catch (syncError) {
          if (debug) console.warn('Stochastic sync error:', syncError);
        }
      };
      chartInstance.current?.timeScale().subscribeVisibleTimeRangeChange(sync);
      unsub = () => {
        try {
          chartInstance.current?.timeScale().unsubscribeVisibleTimeRangeChange(sync);
        } catch (unsubError) {
          if (debug) console.warn('Stochastic unsub error:', unsubError);
        }
      };
    } catch (err) { /* No-op: cleanup error is non-fatal, but log for debugging */ if (debug) console.warn('Cleanup error (Stochastic sync):', err); }
    // Cleanup
    return () => {
      if (stochasticInstance.current) {
        stochasticInstance.current.remove();
        stochasticInstance.current = null;
      }
      if (stochasticChartRef.current) {
        stochasticChartRef.current.innerHTML = '';
      }
      if (unsub) unsub();
    };
  }, [activeIndicators.stochastic, stochasticChartRef, chartInstance, indicators.stochastic, validatedData, chartDimensions.width, chartHeights.stochastic, theme]);

  // --- ATR Chart Effect ---
  useEffect(() => {
    if (!activeIndicators.atr) {
      // Remove ATR chart if exists
      if (atrInstance.current) {
        atrInstance.current.remove();
        atrInstance.current = null;
      }
      if (atrChartRef.current) {
        atrChartRef.current.innerHTML = '';
      }
      return;
    }
    if (!atrChartRef.current || !chartInstance.current || validatedData.length === 0) return;
    // Create ATR chart
    const isDark = theme === "dark";
    const atrChart = createChart(atrChartRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: isDark ? "#0f172a" : "#ffffff" },
        textColor: isDark ? "#a5b4fc" : "#3730a3",
        fontSize: 12,
        fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          attributionLogo: false
      },
      rightPriceScale: {
        borderColor: isDark ? "#334155" : "#e2e8f0",
        scaleMargins: { top: 0.05, bottom: 0.1 },
        autoScale: false,
        entireTextOnly: true,
        ticksVisible: true,
        borderVisible: true,
      },
      width: chartDimensions.width || atrChartRef.current.clientWidth,
      height: chartHeights.atr,
      grid: {
        vertLines: { color: isDark ? "#1e293b" : "#f1f5f9", visible: true, style: 2 },
        horzLines: { color: isDark ? "#1e293b" : "#f1f5f9", visible: true, style: 2 },
      },
      timeScale: {
        borderColor: isDark ? "#334155" : "#e2e8f0",
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 8,
        barSpacing: 6,
        minBarSpacing: 2,
        fixLeftEdge: true,
        fixRightEdge: true,
        tickMarkFormatter: (time: number) => {
          const date = new Date(time * 1000);
          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        },
      },
      crosshair: {
        vertLine: {
          color: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
          width: 1,
          style: 0,
          visible: true,
          labelVisible: true,
          labelBackgroundColor: isDark ? '#1e293b' : '#f8fafc',
        },
        horzLine: {
          color: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
          width: 1,
          style: 0,
          visible: true,
          labelVisible: true,
          labelBackgroundColor: isDark ? '#1e293b' : '#f8fafc',
        },
      },
      localization: {
        timeFormatter: (time: number) => {
          return new Date(time * 1000).toLocaleDateString();
        },
        priceFormatter: (price: number) => {
          // Format to exactly 8 characters total for ATR alignment (e.g., "  12.34")
          const formatted = price >= 1 ? price.toFixed(2) : price.toPrecision(4);
          return formatted.padStart(8, ' ');
        },
      },
    });
    atrInstance.current = atrChart;
    // ATR line
    const atrLine = atrChart.addSeries(LineSeries, {
      color: isDark ? '#f87171' : '#b91c1c',
      lineWidth: 2,
      title: 'ATR',
      priceLineVisible: false,
      lastValueVisible: true,
    });
    // Prepare data
    const atrData = validatedData.map((d, idx) => ({
      time: toTimestamp(d.date),
      value: indicators.atr[idx],
    })).filter(d => d.value !== null);
    atrLine.setData(atrData);
    // --- Time scale sync ---
    let unsub: (() => void) | null = null;
    try {
      const sync = () => {
        // Check if component is still mounted
        if (!isMountedRef.current) return;
        
        try {
          const timeRange = chartInstance.current?.timeScale().getVisibleRange();
          if (timeRange && atrChart && chartInstance.current) {
            atrChart.timeScale().setVisibleRange(timeRange);
          }
        } catch (syncError) {
          if (debug) console.warn('ATR sync error:', syncError);
        }
      };
      chartInstance.current?.timeScale().subscribeVisibleTimeRangeChange(sync);
      unsub = () => {
        try {
          chartInstance.current?.timeScale().unsubscribeVisibleTimeRangeChange(sync);
        } catch (unsubError) {
          if (debug) console.warn('ATR unsub error:', unsubError);
        }
      };
    } catch (err) { /* No-op: cleanup error is non-fatal, but log for debugging */ if (debug) console.warn('Cleanup error (ATR sync):', err); }
    // Cleanup
    return () => {
      if (atrInstance.current) {
        atrInstance.current.remove();
        atrInstance.current = null;
      }
      if (atrChartRef.current) {
        atrChartRef.current.innerHTML = '';
      }
      if (unsub) unsub();
    };
  }, [activeIndicators.atr, atrChartRef, chartInstance, indicators.atr, validatedData, chartDimensions.width, chartHeights.atr, theme]);

  // Debug information
  if (debug && validationResult) {
    console.log('Chart Component State:', {
      dataLength: data.length,
      validatedDataLength: validatedData.length,
      validationErrors: validationResult.errors.length,
      validationWarnings: validationResult.warnings.length,
      isLoading,
      error,
      chartDimensions,
      stats: chartStats
    });
  }

  // Notify parent when validationResult or chartStats change
  useEffect(() => {
    if (onValidationResult) onValidationResult(validationResult);
  }, [onValidationResult, validationResult]);

  useEffect(() => {
    if (onStatsCalculated && chartStats) onStatsCalculated(chartStats);
  }, [onStatsCalculated, chartStats]);

  // Add keyboard shortcuts for professional trading terminal feel
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Only handle shortcuts when chart is focused
      if (!chartReady) return;
      
      switch (event.key.toLowerCase()) {
        case '1':
          toggleIndicator('sma20');
          break;
        case '2':
          toggleIndicator('sma50');
          break;
        case '3':
          toggleIndicator('ema12');
          break;
        case '4':
          toggleIndicator('ema26');
          break;
        case '5':
          toggleIndicator('bollingerBands');
          break;
        case 'm':
          toggleIndicator('macd');
          break;
        case 's':
          toggleIndicator('stochastic');
          break;
        case 'a':
          toggleIndicator('atr');
          break;
        case 'o':
          toggleIndicator('obv');
          break;
        case 'c':
          setPriceChartType(priceChartType === 'candlestick' ? 'line' : 'candlestick');
          break;
        case 'r':
          // Reset view
          if (chartInstance.current) {
            chartInstance.current.timeScale().scrollToPosition(0, false);
          }
          break;
        case 'f':
          // Fit to screen
          if (chartInstance.current) {
            chartInstance.current.timeScale().fitContent();
          }
          break;
        case 'escape':
          // Clear all indicators
          setActiveIndicators({
            sma20: false, sma50: false, ema12: false, ema26: false, ema50: false, sma200: false,
            bollingerBands: false, macd: false, stochastic: false, atr: false, obv: false,
            rsiDivergence: false, doublePatterns: false, volumeAnomaly: false,
            swingPoints: false, peaksLows: false, support: false, resistance: false, trianglesFlags: false,
          });
          break;
        case 'enter':
          // Show all indicators
          setActiveIndicators({
            sma20: true, sma50: true, ema12: true, ema26: true, ema50: true, sma200: true,
            bollingerBands: true, macd: true, stochastic: true, atr: true, obv: true,
            rsiDivergence: true, doublePatterns: true, volumeAnomaly: true,
            swingPoints: true, peaksLows: true, support: true, resistance: true, trianglesFlags: true,
          });
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [chartReady, toggleIndicator]);

  // Add chart interaction hints
  const [internalShowShortcuts, setInternalShowShortcuts] = useState(false);
  
  // Use external showShortcuts if provided, otherwise use internal state
  const showShortcuts = externalShowShortcuts !== undefined ? externalShowShortcuts : internalShowShortcuts;
  
  const setShowShortcuts = (value: boolean) => {
    if (onToggleShortcuts) {
      onToggleShortcuts();
    } else {
      setInternalShowShortcuts(value);
    }
  };

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    clearAllIndicators: () => {
      const clearedIndicators = {
        sma20: false, sma50: false, ema12: false, ema26: false, ema50: false, sma200: false,
        bollingerBands: false, macd: false, stochastic: false, atr: false, obv: false,
        rsiDivergence: false, doublePatterns: false, volumeAnomaly: false,
        swingPoints: false, peaksLows: false, support: false, resistance: false, trianglesFlags: false,
      };
      setActiveIndicators(clearedIndicators);
      if (onActiveIndicatorsChange) {
        onActiveIndicatorsChange(clearedIndicators);
      }
    },
    showAllIndicators: () => {
      const allIndicators = {
        sma20: true, sma50: true, ema12: true, ema26: true, ema50: true, sma200: true,
        bollingerBands: true, macd: true, stochastic: true, atr: true, obv: true,
        rsiDivergence: true, doublePatterns: true, volumeAnomaly: true,
        swingPoints: true, peaksLows: true, support: true, resistance: true, trianglesFlags: true,
      };
      setActiveIndicators(allIndicators);
      if (onActiveIndicatorsChange) {
        onActiveIndicatorsChange(allIndicators);
      }
    }
  }));

  return (
    <div className="w-full flex flex-col" style={{
      height: `${height}px`,
      // Hide TradingView branding
      '--tv-lightweight-charts-after': 'none',
      // Ensure no extra spacing
      marginBottom: '0',
      paddingBottom: '0',
    } as React.CSSProperties}>
      <style>
        {`
          *[class*="tv-"]::after,
          *[class*="tradingview"]::after {
            display: none !important;
          }
        `}
      </style>
      {/* Debug Info */}
      {debug && (
        <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg mb-4">
          <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">Debug Info</h3>
          <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
            <div>Data Points: {validatedData.length}</div>
            <div>Chart Dimensions: {chartDimensions.width} x {chartDimensions.height}</div>
            <div>Chart Heights: Candle={chartHeights.candle}, Volume={chartHeights.volume}, RSI={chartHeights.rsi}, MACD={chartHeights.macd}, Stochastic={chartHeights.stochastic}, ATR={chartHeights.atr}</div>
            <div>Theme: {theme}</div>
            <div>Loading: {isLoading ? 'Yes' : 'No'}</div>
            <div>Peaks: {peaksLows.peaks.length}, Lows: {peaksLows.lows.length}</div>
            <div>Support/Resistance Levels: {supportResistanceLevels.length}</div>
            <div>Triangle Patterns: {trianglePatterns.length}</div>
            <div>Flag Patterns: {flagPatterns.length}</div>
            <div>RSI Divergences: {rsiDivergences.length}</div>
            {error && <div className="text-red-600 dark:text-red-400">Error: {error}</div>}
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg mb-4">
          <h3 className="text-sm font-semibold text-red-900 dark:text-red-100 mb-2">Chart Error</h3>
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          <button 
            onClick={() => {
              setError(null);
              setIsLoading(true);
              setTimeout(() => initializeCharts(), 100);
            }}
            className="mt-2 px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Initializing charts...</span>
        </div>
      )}

      {/* Chart Container */}
      {validatedData.length === 0 ? (
        <div className="flex-1 flex items-center justify-center bg-slate-50 dark:bg-slate-800/50 rounded-lg">
          <div className="text-center space-y-2">
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
              No valid data available
            </p>
            {debug && validationResult && (
              <div className="text-left text-xs text-slate-400 mt-2">
                <p>Raw Data Points: {data.length}</p>
                <p>Valid Data Points: {validatedData.length}</p>
                {validationResult.errors.length > 0 && (
                  <p>Errors: {validationResult.errors.length}</p>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div 
          ref={containerRef}
          className="w-full h-full flex flex-col rounded-lg overflow-hidden"
          style={{ marginBottom: '0', paddingBottom: '0' }}
        >
          <div className="flex flex-col w-full flex-1 rounded-lg overflow-hidden">
            {/* Chart Controls */}
            <div className="flex flex-wrap gap-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg mb-0.5">
              {/* All Indicators and Patterns - Combined Layout */}
              <div className="flex-1 min-w-0">
                <div className="grid grid-cols-6 gap-1">
                  <button
                    onClick={() => toggleIndicator('sma20')}
                    className={`px-2 py-1 text-xs rounded transition-colors ${
                      activeIndicators.sma20
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                    title="SMA 20"
                  >
                    SMA20
                  </button>
                  <button
                    onClick={() => toggleIndicator('sma50')}
                    className={`px-2 py-1 text-xs rounded transition-colors ${
                      activeIndicators.sma50
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                    title="SMA 50"
                  >
                    SMA50
                  </button>
                  <button
                    onClick={() => toggleIndicator('ema12')}
                    className={`px-2 py-1 text-xs rounded transition-colors ${
                      activeIndicators.ema12
                        ? 'bg-pink-600 text-white shadow-sm'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                    title="EMA 12"
                  >
                    EMA12
                  </button>
                  <button
                    onClick={() => toggleIndicator('ema26')}
                    className={`px-2 py-1 text-xs rounded transition-colors ${
                      activeIndicators.ema26
                        ? 'bg-orange-600 text-white shadow-sm'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                    title="EMA 26"
                  >
                    EMA26
                  </button>
                  <button
                    onClick={() => toggleIndicator('ema50')}
                    className={`px-2 py-1 text-xs rounded transition-colors ${
                      activeIndicators.ema50
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                    title="EMA 50"
                  >
                    EMA50
                  </button>
                  <button
                    onClick={() => toggleIndicator('sma200')}
                    className={`px-2 py-1 text-xs rounded transition-colors ${
                      activeIndicators.sma200
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                    title="SMA 200"
                  >
                    SMA200
                  </button>
                  <button
                    onClick={() => toggleIndicator('bollingerBands')}
                    className={`px-2 py-1 text-xs rounded transition-colors ${
                      activeIndicators.bollingerBands
                        ? 'bg-green-600 text-white shadow-sm'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                    title="Bollinger Bands"
                  >
                    Bollinger Bands
                  </button>
                  <button
                    onClick={() => toggleIndicator('macd')}
                    className={`px-2 py-1 text-xs rounded transition-colors ${
                      activeIndicators.macd
                        ? 'shadow-sm relative overflow-hidden'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                    title="MACD"
                  >
                    {activeIndicators.macd ? (
                      <div className="flex h-full">
                        <div className="bg-indigo-600 text-white px-1 py-0.5 flex-1 text-center text-xs font-medium">
                          MACD
                        </div>
                        <div className="bg-orange-500 text-white px-1 py-0.5 flex-1 text-center text-xs font-medium">
                          Signal
                        </div>
                      </div>
                    ) : (
                      'MACD'
                    )}
                  </button>
                  <button
                    onClick={() => toggleIndicator('stochastic')}
                    className={`px-2 py-1 text-xs rounded transition-colors ${
                      activeIndicators.stochastic
                        ? 'bg-teal-600 text-white shadow-sm'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                    title="Stochastic"
                  >
                    Stochastic
                  </button>
                  <button
                    onClick={() => toggleIndicator('atr')}
                    className={`px-2 py-1 text-xs rounded transition-colors ${
                      activeIndicators.atr
                        ? 'bg-red-600 text-white shadow-sm'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                    title="ATR"
                  >
                    ATR
                  </button>
                  <button
                    onClick={() => toggleIndicator('obv')}
                    className={`px-2 py-1 text-xs rounded transition-colors ${
                      activeIndicators.obv
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                    title="OBV"
                  >
                    OBV
                  </button>
                  <button
                    onClick={() => toggleIndicator('rsiDivergence')}
                    className={`px-2 py-1 text-xs rounded transition-colors ${
                      activeIndicators.rsiDivergence
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                    title="RSI Divergence"
                  >
                    RSI Divergence
                  </button>
                  <button
                    onClick={() => toggleIndicator('doublePatterns')}
                    className={`px-2 py-1 text-xs rounded transition-colors ${
                      activeIndicators.doublePatterns
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                    title="Double Top & Bottom Patterns"
                  >
                    Double Patterns
                  </button>
                  <button
                    onClick={() => toggleIndicator('volumeAnomaly')}
                    className={`px-2 py-1 text-xs rounded transition-colors ${
                      activeIndicators.volumeAnomaly
                        ? 'bg-orange-600 text-white shadow-sm'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                    title="Volume Anomaly"
                  >
                    Volume Anomaly
                  </button>
                  <button
                    onClick={() => toggleIndicator('peaksLows')}
                    className={`px-2 py-1 text-xs rounded transition-colors ${
                      activeIndicators.peaksLows
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                    title="Peaks/Lows"
                  >
                    Peaks/Lows
                  </button>
                  <button
                    onClick={() => toggleIndicator('support')}
                    className={`px-2 py-1 text-xs rounded transition-colors ${
                      activeIndicators.support
                        ? 'bg-green-600 text-white shadow-sm'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                    title="Support"
                  >
                    Support
                  </button>
                  <button
                    onClick={() => toggleIndicator('resistance')}
                    className={`px-2 py-1 text-xs rounded transition-colors ${
                      activeIndicators.resistance
                        ? 'bg-red-600 text-white shadow-sm'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                    title="Resistance"
                  >
                    Resistance
                  </button>
                  <button
                    onClick={() => toggleIndicator('trianglesFlags')}
                    className={`px-2 py-1 text-xs rounded transition-colors ${
                      activeIndicators.trianglesFlags
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                    title="Triangles/Flags"
                  >
                    Triangles/Flags
                  </button>
                </div>
              </div>
              

              

              

            </div>

            {/* Keyboard Shortcuts Help Overlay */}
            {showShortcuts && (
              <div className="absolute top-0 right-0 m-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 z-50 max-w-sm">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Keyboard Shortcuts</h3>
                  <button
                    onClick={() => setShowShortcuts(false)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    ×
                  </button>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div><kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">1-5</kbd> <span className="text-gray-600 dark:text-gray-400">SMA/EMA/Bollinger</span></div>
                    <div><kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">M</kbd> <span className="text-gray-600 dark:text-gray-400">MACD</span></div>
                    <div><kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">S</kbd> <span className="text-gray-600 dark:text-gray-400">Stochastic</span></div>
                    <div><kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">A</kbd> <span className="text-gray-600 dark:text-gray-400">ATR</span></div>
                    <div><kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">O</kbd> <span className="text-gray-600 dark:text-gray-400">OBV</span></div>
                    <div><kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">C</kbd> <span className="text-gray-600 dark:text-gray-400">Chart Type</span></div>
                    <div><kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">R</kbd> <span className="text-gray-600 dark:text-gray-400">Reset View</span></div>
                    <div><kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">F</kbd> <span className="text-gray-600 dark:text-gray-400">Fit to Screen</span></div>
                    <div><kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">ESC</kbd> <span className="text-gray-600 dark:text-gray-400">Clear All</span></div>
                    <div><kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">Enter</kbd> <span className="text-gray-600 dark:text-gray-400">Show All</span></div>
                  </div>
                </div>
              </div>
            )}

            {/* FIXED: Enhanced chart container styling with better space utilization */}
            {/* Main Price Chart - Enhanced prominence */}
            <div className="relative border-2 border-blue-200 dark:border-blue-700 overflow-hidden bg-white dark:bg-gray-900 flex-1 shadow-lg mb-0.5">
              <div ref={candleChartRef} className="w-full h-full" />
            </div>

            {/* Volume Chart - Compact styling */}
            <div className="relative border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-900 shadow-sm mb-0.5" style={{ height: `${chartHeights.volume}px` }}>
              <div className="absolute top-1 left-1 z-10 bg-gray-100 dark:bg-gray-800/50 px-2 py-0.5 rounded text-xs font-medium text-gray-600 dark:text-gray-400">
                Volume
              </div>
              <div ref={volumeChartRef} className="w-full h-full" />
            </div>

            {/* RSI Chart - Enhanced with full range indicators */}
            <div className="relative border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-900 shadow-sm" style={{ height: `${chartHeights.rsi}px` }}>
              <div className="absolute top-1 left-1 z-10 bg-gray-100 dark:bg-gray-800/50 px-2 py-0.5 rounded text-xs font-medium text-gray-600 dark:text-gray-400">
                RSI(14)
              </div>
              <div ref={rsiChartRef} className="w-full h-full" />
            </div>

            {/* Stochastic Chart (conditionally rendered) */}
            {activeIndicators.stochastic && (
              <div className="relative border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-900 shadow-sm mb-0.5" style={{ height: `${chartHeights.stochastic}px` }}>
                <div className="absolute top-1 left-1 z-10 bg-gray-100 dark:bg-gray-800/50 px-2 py-0.5 rounded text-xs font-medium text-gray-600 dark:text-gray-400">
                  Stochastic
                </div>
                <div ref={stochasticChartRef} className="w-full h-full" />
              </div>
            )}

            {/* ATR Chart (conditionally rendered) */}
            {activeIndicators.atr && (
              <div className="relative border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-900 shadow-sm mb-0.5" style={{ height: `${chartHeights.atr}px` }}>
                <div className="absolute top-1 left-1 z-10 bg-gray-100 dark:bg-gray-800/50 px-2 py-0.5 rounded text-xs font-medium text-gray-600 dark:text-gray-400">
                  ATR
                </div>
                <div ref={atrChartRef} className="w-full h-full" />
              </div>
            )}

            {/* MACD Chart (conditionally rendered) */}
            {activeIndicators.macd && (
              <div className="relative border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-900 shadow-sm" style={{ height: `${chartHeights.macd}px` }}>
                <div className="absolute top-1 left-1 z-10 bg-gray-100 dark:bg-gray-800/50 px-2 py-0.5 rounded text-xs font-medium text-gray-600 dark:text-gray-400">
                  MACD
                </div>
                <div ref={macdChartRef} className="w-full h-full" />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

export default EnhancedMultiPaneChart; 