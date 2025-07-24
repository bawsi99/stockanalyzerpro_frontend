import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
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
import { 
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
} from "@/utils/chartUtils";

interface EnhancedSimpleChartProps {
  data: ChartData[];
  theme?: "light" | "dark";
  height?: number;
  width?: number;
  timeframe?: string;
  debug?: boolean;
  showIndicators?: boolean;
  showPatterns?: boolean;
  onValidationResult?: (result: ChartValidationResult) => void;
  onStatsCalculated?: (stats: any) => void;
}

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

function calcStochastic(highs: number[], lows: number[], closes: number[], kPeriod = 14, dPeriod = 3): {
  k: (number | null)[];
  d: (number | null)[];
} {
  const k: (number | null)[] = [];
  const d: (number | null)[] = [];
  
  for (let i = 0; i < closes.length; i++) {
    if (i < kPeriod - 1) {
      k.push(null);
      d.push(null);
      continue;
    }
    
    const highestHigh = Math.max(...highs.slice(i - kPeriod + 1, i + 1));
    const lowestLow = Math.min(...lows.slice(i - kPeriod + 1, i + 1));
    
    if (highestHigh === lowestLow) {
      k.push(50); // Neutral when high equals low
    } else {
      const kValue = ((closes[i] - lowestLow) / (highestHigh - lowestLow)) * 100;
      k.push(kValue);
    }
  }
  
  // Calculate %D (SMA of %K)
  for (let i = 0; i < k.length; i++) {
    if (i < dPeriod - 1) {
      d.push(null);
      continue;
    }
    
    const sum = k.slice(i - dPeriod + 1, i + 1).reduce((acc, val) => acc + (val || 0), 0);
    d.push(sum / dPeriod);
  }
  
  return { k, d };
}

function calcATR(highs: number[], lows: number[], closes: number[], period = 14): (number | null)[] {
  const atr: (number | null)[] = [];
  const trueRanges: number[] = [];
  
  for (let i = 0; i < highs.length; i++) {
    if (i === 0) {
      trueRanges.push(highs[i] - lows[i]);
      atr.push(null);
      continue;
    }
    
    const tr1 = highs[i] - lows[i];
    const tr2 = Math.abs(highs[i] - closes[i - 1]);
    const tr3 = Math.abs(lows[i] - closes[i - 1]);
    const trueRange = Math.max(tr1, tr2, tr3);
    trueRanges.push(trueRange);
    
    if (i < period - 1) {
      atr.push(null);
    } else if (i === period - 1) {
      const sum = trueRanges.slice(0, period).reduce((acc, val) => acc + val, 0);
      atr.push(sum / period);
    } else {
      const prevAtr = atr[i - 1]!;
      const currentTr = trueRanges[i];
      const newAtr = ((prevAtr * (period - 1)) + currentTr) / period;
      atr.push(newAtr);
    }
  }
  
  return atr;
}

function calcOBV(closes: number[], volumes: number[]): (number | null)[] {
  const obv: (number | null)[] = [];
  
  for (let i = 0; i < closes.length; i++) {
    if (i === 0) {
      obv.push(volumes[i]);
      continue;
    }
    
    const prevObv = obv[i - 1]!;
    const currentClose = closes[i];
    const prevClose = closes[i - 1];
    const currentVolume = volumes[i];
    
    if (currentClose > prevClose) {
      obv.push(prevObv + currentVolume);
    } else if (currentClose < prevClose) {
      obv.push(prevObv - currentVolume);
    } else {
      obv.push(prevObv);
    }
  }
  
  return obv;
}

const EnhancedSimpleChart: React.FC<EnhancedSimpleChartProps> = ({ 
  data, 
  theme = "light",
  height = 400,
  width = 800,
  timeframe = "1d",
  debug = false,
  showIndicators = true,
  showPatterns = true,
  onValidationResult,
  onStatsCalculated
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const patternSeriesRef = useRef<{ [key: string]: ISeriesApi<any> }>({});
  
  const [isChartReady, setIsChartReady] = useState(false);
  const [chartError, setChartError] = useState<string | null>(null);
  const [chartStats, setChartStats] = useState<any>(null);

  // Validate and process data
  const validationResult = useMemo(() => {
    return validateChartData(data);
  }, [data]);

  const validatedData = useMemo(() => {
    return validationResult.data;
  }, [validationResult]);

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

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current || validatedData.length === 0) return;

    const chart = createChart(chartContainerRef.current, {
      width: width,
      height: height,
      layout: {
        background: { type: ColorType.Solid, color: theme === 'dark' ? '#1e1e1e' : '#ffffff' },
        textColor: theme === 'dark' ? '#ffffff' : '#000000',
      },
      grid: {
        vertLines: { color: theme === 'dark' ? '#2B2B43' : '#e1e3e6' },
        horzLines: { color: theme === 'dark' ? '#2B2B43' : '#e1e3e6' },
      },
      crosshair: {
        mode: 1,
      },
      rightPriceScale: {
        borderColor: theme === 'dark' ? '#2B2B43' : '#e1e3e6',
      },
      timeScale: {
        borderColor: theme === 'dark' ? '#2B2B43' : '#e1e3e6',
        timeVisible: true,
        secondsVisible: false,
      },
    });

    chartRef.current = chart;

    // Add candlestick series
    candlestickSeriesRef.current = chart.addCandlestickSeries({
      upColor: theme === 'dark' ? '#26a69a' : '#26a69a',
      downColor: theme === 'dark' ? '#ef5350' : '#ef5350',
      borderVisible: false,
      wickUpColor: theme === 'dark' ? '#26a69a' : '#26a69a',
      wickDownColor: theme === 'dark' ? '#ef5350' : '#ef5350',
    });

    // Add volume series
    volumeSeriesRef.current = chart.addHistogramSeries({
      color: theme === 'dark' ? '#26a69a' : '#26a69a',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '',
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    });

    // Set candlestick data
    const candlestickData: CandlestickData[] = validatedData.map(d => ({
      time: toTimestamp(d.date),
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
    }));

    candlestickSeriesRef.current.setData(candlestickData);

    // Set volume data
    const volumeData: HistogramData[] = validatedData.map(d => ({
      time: toTimestamp(d.date),
      value: d.volume,
      color: d.close >= d.open ? 
        (theme === 'dark' ? '#26a69a' : '#26a69a') : 
        (theme === 'dark' ? '#ef5350' : '#ef5350'),
    }));

    volumeSeriesRef.current.setData(volumeData);

    // Add technical indicators if enabled
    if (showIndicators) {
      // Add SMA lines
      const sma20Series = chart.addLineSeries({
        color: theme === 'dark' ? '#ff9800' : '#ff9800',
        lineWidth: 1,
        title: 'SMA 20',
      });

      const sma50Series = chart.addLineSeries({
        color: theme === 'dark' ? '#2196f3' : '#2196f3',
        lineWidth: 1,
        title: 'SMA 50',
      });

      const sma200Series = chart.addLineSeries({
        color: theme === 'dark' ? '#9c27b0' : '#9c27b0',
        lineWidth: 2,
        title: 'SMA 200',
      });

      // Add EMA lines
      const ema12Series = chart.addLineSeries({
        color: theme === 'dark' ? '#4caf50' : '#4caf50',
        lineWidth: 1,
        title: 'EMA 12',
      });

      const ema26Series = chart.addLineSeries({
        color: theme === 'dark' ? '#ff5722' : '#ff5722',
        lineWidth: 1,
        title: 'EMA 26',
      });

      // Add Bollinger Bands
      const bbUpperSeries = chart.addLineSeries({
        color: theme === 'dark' ? '#00bcd4' : '#00bcd4',
        lineWidth: 1,
        title: 'BB Upper',
      });

      const bbMiddleSeries = chart.addLineSeries({
        color: theme === 'dark' ? '#607d8b' : '#607d8b',
        lineWidth: 1,
        title: 'BB Middle',
      });

      const bbLowerSeries = chart.addLineSeries({
        color: theme === 'dark' ? '#00bcd4' : '#00bcd4',
        lineWidth: 1,
        title: 'BB Lower',
      });

      // Set indicator data
      const sma20Data: LineData[] = validatedData.map((d, i) => ({
        time: toTimestamp(d.date),
        value: indicators.sma20[i] || 0,
      })).filter(d => d.value > 0);

      const sma50Data: LineData[] = validatedData.map((d, i) => ({
        time: toTimestamp(d.date),
        value: indicators.sma50[i] || 0,
      })).filter(d => d.value > 0);

      const sma200Data: LineData[] = validatedData.map((d, i) => ({
        time: toTimestamp(d.date),
        value: indicators.sma200[i] || 0,
      })).filter(d => d.value > 0);

      const ema12Data: LineData[] = validatedData.map((d, i) => ({
        time: toTimestamp(d.date),
        value: indicators.ema12[i] || 0,
      })).filter(d => d.value > 0);

      const ema26Data: LineData[] = validatedData.map((d, i) => ({
        time: toTimestamp(d.date),
        value: indicators.ema26[i] || 0,
      })).filter(d => d.value > 0);

      const bbUpperData: LineData[] = validatedData.map((d, i) => ({
        time: toTimestamp(d.date),
        value: indicators.bollingerBands.upper[i] || 0,
      })).filter(d => d.value > 0);

      const bbMiddleData: LineData[] = validatedData.map((d, i) => ({
        time: toTimestamp(d.date),
        value: indicators.bollingerBands.middle[i] || 0,
      })).filter(d => d.value > 0);

      const bbLowerData: LineData[] = validatedData.map((d, i) => ({
        time: toTimestamp(d.date),
        value: indicators.bollingerBands.lower[i] || 0,
      })).filter(d => d.value > 0);

      sma20Series.setData(sma20Data);
      sma50Series.setData(sma50Data);
      sma200Series.setData(sma200Data);
      ema12Series.setData(ema12Data);
      ema26Series.setData(ema26Data);
      bbUpperSeries.setData(bbUpperData);
      bbMiddleSeries.setData(bbMiddleData);
      bbLowerSeries.setData(bbLowerData);
    }

    // Add pattern overlays if enabled
    if (showPatterns) {
      const closes = validatedData.map(d => d.close);
      
      // Detect RSI divergences
      const rsiDivergences = detectDivergence(closes, indicators.rsi14);
      
      // Detect support/resistance levels
      const supportResistanceLevels = detectSupportResistance(closes);
      
      // Detect triangle patterns
      const trianglePatterns = detectTriangles(closes);
      
      // Detect flag patterns
      const flagPatterns = detectFlags(closes);
      
      // Detect double tops/bottoms
      const doubleTops = detectDoubleTop(closes);
      const doubleBottoms = detectDoubleBottom(closes);

      // Draw pattern overlays (simplified version for single pane)
      // This would add visual markers for patterns on the chart
      if (debug) {
        console.log('Detected patterns:', {
          rsiDivergences: rsiDivergences.length,
          supportResistance: supportResistanceLevels.length,
          triangles: trianglePatterns.length,
          flags: flagPatterns.length,
          doubleTops: doubleTops.length,
          doubleBottoms: doubleBottoms.length
        });
      }
    }

    // Fit content
    chart.timeScale().fitContent();
    setIsChartReady(true);

    return () => {
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
      setIsChartReady(false);
    };
  }, [validatedData, theme, width, height, showIndicators, showPatterns, debug]);

  // Update stats
  useEffect(() => {
    const calculatedStats = calculateChartStats(validatedData);
    setChartStats(calculatedStats);
    
    if (onStatsCalculated && calculatedStats) {
      onStatsCalculated(calculatedStats);
    }
    
    if (debug && calculatedStats) {
      console.log('Chart Statistics:', calculatedStats);
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
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (chartError) {
    return (
      <div className="flex items-center justify-center h-full text-red-500">
        Error: {chartError}
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <div 
        ref={chartContainerRef} 
        className="w-full h-full"
        style={{ width: `${width}px`, height: `${height}px` }}
      />
      {debug && chartStats && (
        <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded">
          <h3 className="font-bold mb-2">Chart Statistics</h3>
          <pre className="text-xs">{JSON.stringify(chartStats, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default EnhancedSimpleChart; 