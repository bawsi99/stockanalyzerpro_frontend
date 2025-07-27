/**
 * @deprecated This component has been archived and is no longer in use.
 * The enhanced simple chart functionality has been integrated into the unified Charts page.
 * See: frontend/src/pages/Charts.tsx for the current implementation.
 * 
 * Archived on: 2024-07-25
 * Reason: Consolidated into unified chart system
 */
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
import { useChartReset } from "@/hooks/useChartReset";
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
  FlagPattern,
  calcSMA,
  calcEMA,
  calcRSI,
  calcBollingerBands,
  calcMACD,
  calcStochastic,
  calcATR,
  calcOBV,
  detectDivergence
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
  showVolume?: boolean;
  onValidationResult?: (result: ChartValidationResult) => void;
  onStatsCalculated?: (stats: Record<string, unknown>) => void;
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

function detectDivergence(prices: number[], indicator: number[], order = 5): Divergence[] {
  const { peaks, lows } = identifyPeaksLows(prices, order);
  const { peaks: indicatorPeaks, lows: indicatorLows } = identifyPeaksLows(indicator, order);
  
  const divergences: Divergence[] = [];
  
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

const EnhancedSimpleChart: React.FC<EnhancedSimpleChartProps> = ({ 
  data, 
  theme = "light",
  height = 400,
  width = 800,
  timeframe = "1d",
  debug = false,
  showIndicators = true,
  showPatterns = true,
  showVolume = false,
  onValidationResult,
  onStatsCalculated,
  onResetScale,
  onRegisterReset,
  activeIndicators = {}
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const patternSeriesRef = useRef<{ [key: string]: ISeriesApi<LineData | CandlestickData | HistogramData | AreaSeries> }>({});

  // Chart reset functionality
  const {
    chartRef,
    chartStateRef,
    isInitialState,
    hasUserInteracted,
    saveChartState,
    restoreChartState,
    resetToInitialState,
    resetToFitContent,
    handleUserInteraction,
    handleChartUpdate,
  } = useChartReset({
    debug,
    onReset: () => {
      console.log('Enhanced chart reset completed');
    }
  });
  
  const [isChartReady, setIsChartReady] = useState(false);
  const [chartError, setChartError] = useState<string | null>(null);
  const [chartStats, setChartStats] = useState<Record<string, unknown> | null>(null);

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

  function detectDivergence(prices: number[], indicator: number[], order = 5): Divergence[] {
    const { peaks, lows } = identifyPeaksLows(prices, order);
    const { peaks: indicatorPeaks, lows: indicatorLows } = identifyPeaksLows(indicator, order);
    
    const divergences: Divergence[] = [];
    
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

    // Set candlestick data
    const candlestickData: CandlestickData[] = validatedData.map(d => ({
      time: toTimestamp(d.date),
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
    }));

    candlestickSeriesRef.current.setData(candlestickData);

    // Add volume series if enabled
    if (showVolume) {
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

      // Set volume data
      const volumeData: HistogramData[] = validatedData.map(d => ({
        time: toTimestamp(d.date),
        value: d.volume,
        color: d.close >= d.open ? 
          (theme === 'dark' ? '#26a69a' : '#26a69a') : 
          (theme === 'dark' ? '#ef5350' : '#ef5350'),
      }));

      volumeSeriesRef.current.setData(volumeData);
    }

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

  if (chartError) {
    return (
      <div className="flex items-center justify-center h-full text-red-500">
        Error: {chartError}
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      <div 
        ref={chartContainerRef} 
        className="w-full h-full"
        style={{ width: `${width}px`, height: `${height}px` }}
      />
      
      {/* Reset Scale Button */}
      <div className="absolute bottom-2 right-2 z-10">
        <button
          onClick={resetScale}
          className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded p-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          title="Reset chart scale to fit all data"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
          </svg>
        </button>
      </div>
      
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