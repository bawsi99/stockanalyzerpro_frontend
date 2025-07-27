/**
 * @deprecated This component has been archived and is no longer in use.
 * The enhanced multi-pane chart functionality has been integrated into the unified Charts page.
 * See: frontend/src/pages/Charts.tsx for the current implementation.
 * 
 * Archived on: 2024-07-25
 * Reason: Consolidated into unified chart system
 */

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
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
} from 'lightweight-charts';
import { ChartData } from '@/types/analysis';
import { 
  validateChartData, 
  ValidatedChartData, 
  ChartValidationResult, 
  calculateChartStats,
  calcSMA,
  calcEMA,
  calcRSI,
  calcMACD,
  calcStochastic,
  calcATR,
  calcBollingerBands,
  calcOBV,
  detectVolumeAnomalies,
  detectDoubleTop,
  detectDoubleBottom,
  identifyPeaksLows,
  detectSupportResistance,
  detectTriangles,
  detectFlags,
  detectDivergence
} from '@/utils/chartUtils';

interface EnhancedChartsMultiPaneChartProps {
  data: ChartData[];
  theme?: 'light' | 'dark';
  height?: number;
  width?: number;
  timeframe?: string;
  debug?: boolean;
  showVolume?: boolean;
  isLiveMode?: boolean;
  activeIndicators?: {
    // Moving Averages
    sma20?: boolean;
    sma50?: boolean;
    sma200?: boolean;
    ema12?: boolean;
    ema26?: boolean;
    ema50?: boolean;
    
    // Technical Indicators
    bollingerBands?: boolean;
    macd?: boolean;
    stochastic?: boolean;
    atr?: boolean;
    obv?: boolean;
    rsi?: boolean;
    
    // Patterns
    rsiDivergence?: boolean;
    doublePatterns?: boolean;
    volumeAnomaly?: boolean;
    peaksLows?: boolean;
    support?: boolean;
    resistance?: boolean;
    trianglesFlags?: boolean;
  };
  onValidationResult?: (result: ChartValidationResult) => void;
  onStatsCalculated?: (stats: Record<string, unknown>) => void;
  onResetScale?: () => void;
  onRegisterReset?: (resetFn: () => void) => void;
}

const toTimestamp = (iso: string): UTCTimestamp => {
  try {
    if (!iso || typeof iso !== 'string') {
      console.warn(`Invalid date input: ${iso}`);
      return 0 as UTCTimestamp;
    }
    
    const timestamp = Date.parse(iso);
    if (isNaN(timestamp)) {
      console.warn(`Invalid date format: ${iso}`);
      return 0 as UTCTimestamp;
    }
    
    const utcTimestamp = (timestamp / 1000) as UTCTimestamp;
    if (utcTimestamp <= 0) {
      console.warn(`Invalid timestamp result: ${utcTimestamp} for date: ${iso}`);
      return 0 as UTCTimestamp;
    }
    
    return utcTimestamp;
  } catch (error) {
    console.warn(`Error parsing date: ${iso}`, error);
    return 0 as UTCTimestamp;
  }
};

const EnhancedChartsMultiPaneChart: React.FC<EnhancedChartsMultiPaneChartProps> = ({
  data,
  theme = 'light',
  height = 600,
  width = 800,
  timeframe = '1d',
  debug = false,
  showVolume = true,
  isLiveMode = true,
  activeIndicators = {
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
    rsi: false,
    rsiDivergence: false,
    doublePatterns: false,
    volumeAnomaly: false,
    peaksLows: false,
    support: false,
    resistance: false,
    trianglesFlags: false
  },
  onValidationResult,
  onStatsCalculated,
  onResetScale,
  onRegisterReset
}) => {
  // Chart refs
  const containerRef = useRef<HTMLDivElement>(null);
  const candleChartRef = useRef<HTMLDivElement>(null);
  const volumeChartRef = useRef<HTMLDivElement>(null);
  const rsiChartRef = useRef<HTMLDivElement>(null);
  const macdChartRef = useRef<HTMLDivElement>(null);
  const atrChartRef = useRef<HTMLDivElement>(null);
  const obvChartRef = useRef<HTMLDivElement>(null);

  // Chart instances
  const chartInstance = useRef<IChartApi | null>(null);
  const volumeInstance = useRef<IChartApi | null>(null);
  const rsiInstance = useRef<IChartApi | null>(null);
  const macdInstance = useRef<IChartApi | null>(null);
  const atrInstance = useRef<IChartApi | null>(null);
  const obvInstance = useRef<IChartApi | null>(null);

  // Series refs
  const candleSeries = useRef<CandlestickSeries | null>(null);
  const volumeSeries = useRef<HistogramSeries | null>(null);
  const rsiSeries = useRef<LineSeries | null>(null);
  const macdSeries = useRef<LineSeries | null>(null);
  const macdSignalSeries = useRef<LineSeries | null>(null);
  const macdHistogramSeries = useRef<HistogramSeries | null>(null);
  const atrSeries = useRef<LineSeries | null>(null);
  const obvSeries = useRef<LineSeries | null>(null);

  // Moving Average Series
  const sma20Series = useRef<LineSeries | null>(null);
  const sma50Series = useRef<LineSeries | null>(null);
  const sma200Series = useRef<LineSeries | null>(null);
  const ema12Series = useRef<LineSeries | null>(null);
  const ema26Series = useRef<LineSeries | null>(null);
  const ema50Series = useRef<LineSeries | null>(null);

  // Bollinger Bands Series
  const bbUpperSeries = useRef<LineSeries | null>(null);
  const bbMiddleSeries = useRef<LineSeries | null>(null);
  const bbLowerSeries = useRef<LineSeries | null>(null);

  // Stochastic Series
  const stochKSeries = useRef<LineSeries | null>(null);
  const stochDSeries = useRef<LineSeries | null>(null);

  // State
  const [error, setError] = useState<string | null>(null);
  const [chartStats, setChartStats] = useState<Record<string, unknown> | null>(null);
  const [chartDimensions, setChartDimensions] = useState({ width: 0, height: 0 });

  // Calculate chart heights based on active indicators
  const chartHeights = useMemo(() => {
    const baseHeight = height;
    const volumeHeight = showVolume ? 100 : 0;
    const rsiHeight = activeIndicators.rsi ? 120 : 0;
    const macdHeight = activeIndicators.macd ? 120 : 0;
    const atrHeight = activeIndicators.atr ? 100 : 0;
    const obvHeight = activeIndicators.obv ? 100 : 0;
    
    const totalIndicatorHeight = rsiHeight + macdHeight + atrHeight + obvHeight;
    const candleHeight = baseHeight - volumeHeight - totalIndicatorHeight;
    
    return {
      candle: Math.max(candleHeight, 300),
      volume: volumeHeight,
      rsi: rsiHeight,
      macd: macdHeight,
      atr: atrHeight,
      obv: obvHeight
    };
  }, [height, showVolume, activeIndicators]);

  // Validate and process data
  const validatedData = useMemo(() => {
    const result = validateChartData(data);
    if (onValidationResult) {
      onValidationResult(result);
    }
    return result.data;
  }, [data, onValidationResult]);

  // Calculate all indicators
  const indicators = useMemo(() => {
    if (!validatedData || validatedData.length === 0) return {};

    const closes = validatedData.map(d => d.close);
    const highs = validatedData.map(d => d.high);
    const lows = validatedData.map(d => d.low);
    const volumes = validatedData.map(d => d.volume);

    console.log('Calculating enhanced indicators with data:', {
      dataLength: validatedData.length,
      firstDate: validatedData[0]?.date,
      lastDate: validatedData[validatedData.length - 1]?.date,
      firstClose: validatedData[0]?.close,
      lastClose: validatedData[validatedData.length - 1]?.close
    });

    const result = {
      // Moving Averages
      sma20: calcSMA(closes, 20),
      sma50: calcSMA(closes, 50),
      sma200: calcSMA(closes, 200),
      ema12: calcEMA(closes, 12),
      ema26: calcEMA(closes, 26),
      ema50: calcEMA(closes, 50),
      
      // Technical Indicators
      rsi: calcRSI(closes, 14),
      macd: calcMACD(closes, 12, 26, 9),
      bollingerBands: calcBollingerBands(closes, 20, 2),
      stochastic: calcStochastic(highs, lows, closes, 14, 3),
      atr: calcATR(highs, lows, closes, 14),
      obv: calcOBV(closes, volumes),
      
      // Patterns
      volumeAnomalies: detectVolumeAnomalies(volumes, 2.0, 20),
      doubleTops: detectDoubleTop(closes, 0.02, 5),
      doubleBottoms: detectDoubleBottom(closes, 0.02, 5),
      peaksLows: identifyPeaksLows(closes, 5),
      supportResistance: detectSupportResistance(closes, 5, 0.02),
      triangles: detectTriangles(closes, 5, 20, 0.35),
      flags: detectFlags(closes, 15, 20, 0.35, 0.02),
      divergences: detectDivergence(closes, calcRSI(closes, 14), 5)
    };

    console.log('Enhanced indicators calculated:', {
      sma20Length: result.sma20?.length || 0,
      rsiLength: result.rsi?.length || 0,
      macdLength: result.macd?.macd?.length || 0,
      bollingerLength: result.bollingerBands?.upper?.length || 0,
      stochasticLength: result.stochastic?.k?.length || 0,
      atrLength: result.atr?.length || 0,
      obvLength: result.obv?.length || 0,
      volumeAnomalies: result.volumeAnomalies?.length || 0,
      doubleTops: result.doubleTops?.length || 0,
      doubleBottoms: result.doubleBottoms?.length || 0,
      supportResistance: result.supportResistance?.length || 0,
      triangles: result.triangles?.length || 0,
      flags: result.flags?.length || 0,
      divergences: result.divergences?.length || 0
    });

    return result;
  }, [validatedData]);

  // Update stats
  useEffect(() => {
    if (validatedData.length > 0) {
      const stats = calculateChartStats(validatedData);
      setChartStats(stats);
      if (onStatsCalculated) {
        onStatsCalculated(stats);
      }
    }
  }, [validatedData, onStatsCalculated]);

  // Initialize charts
  const initializeCharts = useCallback(() => {
    console.log('initializeCharts called:', {
      validatedDataLength: validatedData?.length || 0,
      chartDimensions,
      width,
      height
    });

    if (!validatedData || validatedData.length === 0) {
      console.warn('No validated data available for chart initialization');
      return;
    }

    // Ensure we have valid dimensions
    if (!chartDimensions.width || !chartDimensions.height) {
      console.warn('Chart dimensions not available, using fallback values');
      setChartDimensions({ width: width || 800, height: height || 600 });
      return;
    }

    const isDark = theme === 'dark';

    // Enhanced color scheme matching the output page
    const colors = {
      // Moving Averages
      sma20: '#3B82F6', // Blue
      sma50: '#8B5CF6', // Purple
      sma200: '#6366F1', // Indigo
      ema12: '#EC4899', // Pink
      ema26: '#F97316', // Orange
      ema50: '#3B82F6', // Blue
      
      // Bollinger Bands
      bbUpper: '#10B981', // Green
      bbMiddle: '#6B7280', // Gray
      bbLower: '#10B981', // Green
      
      // MACD
      macdLine: '#6366F1', // Indigo
      macdSignal: '#F97316', // Orange
      macdHistogram: '#8B5CF6', // Purple
      
      // RSI
      rsi: '#8B5CF6', // Purple
      rsiOverbought: '#EF4444', // Red
      rsiOversold: '#10B981', // Green
      
      // Stochastic
      stochK: '#14B8A6', // Teal
      stochD: '#F59E0B', // Amber
      
      // ATR
      atr: '#EF4444', // Red
      
      // OBV
      obv: '#8B5CF6', // Purple
      
      // Volume
      volume: '#6B7280', // Gray
      volumeAnomaly: '#F97316', // Orange
      
      // Patterns
      support: '#10B981', // Green
      resistance: '#EF4444', // Red
      divergence: '#8B5CF6', // Purple
      doublePattern: '#8B5CF6', // Purple
      triangleFlag: '#8B5CF6', // Purple
      peaksLows: '#3B82F6' // Blue
    };

    // Common chart options
    const commonOptions = {
      layout: {
        background: { type: ColorType.Solid, color: isDark ? '#1a1a1a' : '#ffffff' },
        textColor: isDark ? '#ffffff' : '#000000',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
      },
      grid: {
        vertLines: { color: isDark ? '#2a2a2a' : '#e1e1e1' },
        horzLines: { color: isDark ? '#2a2a2a' : '#e1e1e1' },
      },
      rightPriceScale: {
        borderColor: isDark ? '#2a2a2a' : '#e1e1e1',
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
      timeScale: {
        borderColor: isDark ? '#2a2a2a' : '#e1e1e1',
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        vertLine: {
          color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
          width: 1,
          style: 2,
          visible: true,
          labelVisible: true,
        },
        horzLine: {
          color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
          width: 1,
          style: 2,
          visible: true,
          labelVisible: true,
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
    };

    // Create main candlestick chart
    if (candleChartRef.current && !chartInstance.current) {
      try {
        const chartWidth = chartDimensions.width || width;
        console.log('Creating main chart with dimensions:', {
          chartWidth,
          chartDimensionsWidth: chartDimensions.width,
          propsWidth: width,
          height: chartHeights.candle,
          isLiveMode
        });

        chartInstance.current = createChart(candleChartRef.current, {
          ...commonOptions,
          width: chartWidth,
          height: chartHeights.candle,
        });
        console.log('Main chart created successfully');
      } catch (error) {
        console.error('Error creating main chart:', error);
        setError('Failed to create main chart');
        return;
      }
    }

    // Create volume chart
    if (showVolume && volumeChartRef.current && !volumeInstance.current) {
      try {
        const volumeChartWidth = chartDimensions.width || width;
        volumeInstance.current = createChart(volumeChartRef.current, {
          ...commonOptions,
          width: volumeChartWidth,
          height: chartHeights.volume,
          timeScale: {
            ...commonOptions.timeScale,
            visible: false,
          },
        });
        console.log('Volume chart created successfully');
      } catch (error) {
        console.error('Error creating volume chart:', error);
      }
    }

    // Create RSI chart
    if (activeIndicators.rsi && rsiChartRef.current && !rsiInstance.current) {
      const rsiChartWidth = chartDimensions.width || width;
      rsiInstance.current = createChart(rsiChartRef.current, {
        ...commonOptions,
        width: rsiChartWidth,
        height: chartHeights.rsi,
        timeScale: {
          ...commonOptions.timeScale,
          visible: false,
        },
        rightPriceScale: {
          ...commonOptions.rightPriceScale,
          scaleMargins: { top: 0.1, bottom: 0.1 },
        },
      });
    }

    // Create MACD chart
    if (activeIndicators.macd && macdChartRef.current && !macdInstance.current) {
      const macdChartWidth = chartDimensions.width || width;
      macdInstance.current = createChart(macdChartRef.current, {
        ...commonOptions,
        width: macdChartWidth,
        height: chartHeights.macd,
        timeScale: {
          ...commonOptions.timeScale,
          visible: false,
        },
      });
    }

    // Create ATR chart
    if (activeIndicators.atr && atrChartRef.current && !atrInstance.current) {
      const atrChartWidth = chartDimensions.width || width;
      atrInstance.current = createChart(atrChartRef.current, {
        ...commonOptions,
        width: atrChartWidth,
        height: chartHeights.atr,
        timeScale: {
          ...commonOptions.timeScale,
          visible: false,
        },
      });
    }

    // Create OBV chart
    if (activeIndicators.obv && obvChartRef.current && !obvInstance.current) {
      const obvChartWidth = chartDimensions.width || width;
      obvInstance.current = createChart(obvChartRef.current, {
        ...commonOptions,
        width: obvChartWidth,
        height: chartHeights.obv,
        timeScale: {
          ...commonOptions.timeScale,
          visible: false,
        },
      });
    }

    // Add series to charts
    addSeriesToCharts(colors);

  }, [validatedData, chartDimensions, width, height, theme, chartHeights, showVolume, activeIndicators, addSeriesToCharts, isLiveMode]);

  // Add series to charts
  const addSeriesToCharts = useCallback((colors: Record<string, string>) => {
    if (!chartInstance.current || !validatedData || validatedData.length === 0) return;

    // Convert data to chart format
    const chartData: CandlestickData[] = validatedData.map(d => ({
      time: toTimestamp(d.date),
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
    }));

    // Add candlestick series
    if (!candleSeries.current) {
      candleSeries.current = chartInstance.current.addCandlestickSeries({
        upColor: '#10B981',
        downColor: '#EF4444',
        borderVisible: false,
        wickUpColor: '#10B981',
        wickDownColor: '#EF4444',
      });
      candleSeries.current.setData(chartData);
    }

    // Add Moving Averages
    if (activeIndicators.sma20 && indicators.sma20) {
      const sma20Data: LineData[] = indicators.sma20.map((value, index) => ({
        time: toTimestamp(validatedData[index].date),
        value: value || 0,
      })).filter(d => d.value > 0);
      
      if (!sma20Series.current) {
        sma20Series.current = chartInstance.current.addLineSeries({
          color: colors.sma20,
          lineWidth: 2,
          title: 'SMA 20',
        });
      }
      sma20Series.current.setData(sma20Data);
    }

    if (activeIndicators.sma50 && indicators.sma50) {
      const sma50Data: LineData[] = indicators.sma50.map((value, index) => ({
        time: toTimestamp(validatedData[index].date),
        value: value || 0,
      })).filter(d => d.value > 0);
      
      if (!sma50Series.current) {
        sma50Series.current = chartInstance.current.addLineSeries({
          color: colors.sma50,
          lineWidth: 2,
          title: 'SMA 50',
        });
      }
      sma50Series.current.setData(sma50Data);
    }

    if (activeIndicators.sma200 && indicators.sma200) {
      const sma200Data: LineData[] = indicators.sma200.map((value, index) => ({
        time: toTimestamp(validatedData[index].date),
        value: value || 0,
      })).filter(d => d.value > 0);
      
      if (!sma200Series.current) {
        sma200Series.current = chartInstance.current.addLineSeries({
          color: colors.sma200,
          lineWidth: 2,
          title: 'SMA 200',
        });
      }
      sma200Series.current.setData(sma200Data);
    }

    if (activeIndicators.ema12 && indicators.ema12) {
      const ema12Data: LineData[] = indicators.ema12.map((value, index) => ({
        time: toTimestamp(validatedData[index].date),
        value: value || 0,
      })).filter(d => d.value > 0);
      
      if (!ema12Series.current) {
        ema12Series.current = chartInstance.current.addLineSeries({
          color: colors.ema12,
          lineWidth: 2,
          title: 'EMA 12',
        });
      }
      ema12Series.current.setData(ema12Data);
    }

    if (activeIndicators.ema26 && indicators.ema26) {
      const ema26Data: LineData[] = indicators.ema26.map((value, index) => ({
        time: toTimestamp(validatedData[index].date),
        value: value || 0,
      })).filter(d => d.value > 0);
      
      if (!ema26Series.current) {
        ema26Series.current = chartInstance.current.addLineSeries({
          color: colors.ema26,
          lineWidth: 2,
          title: 'EMA 26',
        });
      }
      ema26Series.current.setData(ema26Data);
    }

    if (activeIndicators.ema50 && indicators.ema50) {
      const ema50Data: LineData[] = indicators.ema50.map((value, index) => ({
        time: toTimestamp(validatedData[index].date),
        value: value || 0,
      })).filter(d => d.value > 0);
      
      if (!ema50Series.current) {
        ema50Series.current = chartInstance.current.addLineSeries({
          color: colors.ema50,
          lineWidth: 2,
          title: 'EMA 50',
        });
      }
      ema50Series.current.setData(ema50Data);
    }

    // Add Bollinger Bands
    if (activeIndicators.bollingerBands && indicators.bollingerBands) {
      const bbUpperData: LineData[] = indicators.bollingerBands.upper.map((value, index) => ({
        time: toTimestamp(validatedData[index].date),
        value: value || 0,
      })).filter(d => d.value > 0);
      
      const bbMiddleData: LineData[] = indicators.bollingerBands.middle.map((value, index) => ({
        time: toTimestamp(validatedData[index].date),
        value: value || 0,
      })).filter(d => d.value > 0);
      
      const bbLowerData: LineData[] = indicators.bollingerBands.lower.map((value, index) => ({
        time: toTimestamp(validatedData[index].date),
        value: value || 0,
      })).filter(d => d.value > 0);

      if (!bbUpperSeries.current) {
        bbUpperSeries.current = chartInstance.current.addLineSeries({
          color: colors.bbUpper,
          lineWidth: 1,
          title: 'BB Upper',
        });
      }
      bbUpperSeries.current.setData(bbUpperData);

      if (!bbMiddleSeries.current) {
        bbMiddleSeries.current = chartInstance.current.addLineSeries({
          color: colors.bbMiddle,
          lineWidth: 1,
          title: 'BB Middle',
        });
      }
      bbMiddleSeries.current.setData(bbMiddleData);

      if (!bbLowerSeries.current) {
        bbLowerSeries.current = chartInstance.current.addLineSeries({
          color: colors.bbLower,
          lineWidth: 1,
          title: 'BB Lower',
        });
      }
      bbLowerSeries.current.setData(bbLowerData);
    }

    // Add Volume
    if (showVolume && volumeInstance.current && !volumeSeries.current) {
      const volumeData: HistogramData[] = validatedData.map(d => ({
        time: toTimestamp(d.date),
        value: d.volume,
        color: d.close >= d.open ? colors.volume : colors.volume,
      }));

      volumeSeries.current = volumeInstance.current.addHistogramSeries({
        color: colors.volume,
        priceFormat: {
          type: 'volume',
        },
        priceScaleId: '',
        scaleMargins: {
          top: 0.8,
          bottom: 0,
        },
      });
      volumeSeries.current.setData(volumeData);
    }

    // Add RSI
    if (activeIndicators.rsi && rsiInstance.current && indicators.rsi) {
      const rsiData: LineData[] = indicators.rsi.map((value, index) => ({
        time: toTimestamp(validatedData[index].date),
        value: value || 0,
      })).filter(d => d.value > 0);

      if (!rsiSeries.current) {
        rsiSeries.current = rsiInstance.current.addLineSeries({
          color: colors.rsi,
          lineWidth: 2,
          title: 'RSI',
        });
      }
      rsiSeries.current.setData(rsiData);

      // Add overbought/oversold lines
      rsiInstance.current.addLineSeries({
        color: colors.rsiOverbought,
        lineWidth: 1,
        lineStyle: 2,
        title: 'Overbought',
      }).setData(rsiData.map(d => ({ ...d, value: 70 })));

      rsiInstance.current.addLineSeries({
        color: colors.rsiOversold,
        lineWidth: 1,
        lineStyle: 2,
        title: 'Oversold',
      }).setData(rsiData.map(d => ({ ...d, value: 30 })));
    }

    // Add MACD
    if (activeIndicators.macd && macdInstance.current && indicators.macd) {
      const macdData: LineData[] = indicators.macd.macd.map((value, index) => ({
        time: toTimestamp(validatedData[index].date),
        value: value || 0,
      })).filter(d => d.value !== null);

      const signalData: LineData[] = indicators.macd.signal.map((value, index) => ({
        time: toTimestamp(validatedData[index].date),
        value: value || 0,
      })).filter(d => d.value !== null);

      const histogramData: HistogramData[] = indicators.macd.histogram.map((value, index) => ({
        time: toTimestamp(validatedData[index].date),
        value: value || 0,
        color: (value || 0) >= 0 ? colors.macdHistogram : '#EF4444',
      })).filter(d => d.value !== null);

      if (!macdSeries.current) {
        macdSeries.current = macdInstance.current.addLineSeries({
          color: colors.macdLine,
          lineWidth: 2,
          title: 'MACD',
        });
      }
      macdSeries.current.setData(macdData);

      if (!macdSignalSeries.current) {
        macdSignalSeries.current = macdInstance.current.addLineSeries({
          color: colors.macdSignal,
          lineWidth: 2,
          title: 'Signal',
        });
      }
      macdSignalSeries.current.setData(signalData);

      if (!macdHistogramSeries.current) {
        macdHistogramSeries.current = macdInstance.current.addHistogramSeries({
          color: colors.macdHistogram,
          priceFormat: {
            type: 'price',
            precision: 6,
            minMove: 0.000001,
          },
        });
      }
      macdHistogramSeries.current.setData(histogramData);
    }

    // Add Stochastic
    if (activeIndicators.stochastic && indicators.stochastic) {
      const stochKData: LineData[] = indicators.stochastic.k.map((value, index) => ({
        time: toTimestamp(validatedData[index].date),
        value: value || 0,
      })).filter(d => d.value > 0);

      const stochDData: LineData[] = indicators.stochastic.d.map((value, index) => ({
        time: toTimestamp(validatedData[index].date),
        value: value || 0,
      })).filter(d => d.value > 0);

      if (!stochKSeries.current) {
        stochKSeries.current = chartInstance.current.addLineSeries({
          color: colors.stochK,
          lineWidth: 2,
          title: 'Stoch K',
        });
      }
      stochKSeries.current.setData(stochKData);

      if (!stochDSeries.current) {
        stochDSeries.current = chartInstance.current.addLineSeries({
          color: colors.stochD,
          lineWidth: 2,
          title: 'Stoch D',
        });
      }
      stochDSeries.current.setData(stochDData);
    }

    // Add ATR
    if (activeIndicators.atr && atrInstance.current && indicators.atr) {
      const atrData: LineData[] = indicators.atr.map((value, index) => ({
        time: toTimestamp(validatedData[index].date),
        value: value || 0,
      })).filter(d => d.value > 0);

      if (!atrSeries.current) {
        atrSeries.current = atrInstance.current.addLineSeries({
          color: colors.atr,
          lineWidth: 2,
          title: 'ATR',
        });
      }
      atrSeries.current.setData(atrData);
    }

    // Add OBV
    if (activeIndicators.obv && obvInstance.current && indicators.obv) {
      const obvData: LineData[] = indicators.obv.map((value, index) => ({
        time: toTimestamp(validatedData[index].date),
        value: value || 0,
      })).filter(d => d.value > 0);

      if (!obvSeries.current) {
        obvSeries.current = obvInstance.current.addLineSeries({
          color: colors.obv,
          lineWidth: 2,
          title: 'OBV',
        });
      }
      obvSeries.current.setData(obvData);
    }

  }, [validatedData, activeIndicators, indicators, showVolume, chartInstance, volumeInstance, rsiInstance, macdInstance, atrInstance, obvInstance]);

  // Handle resize
  const handleResize = useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setChartDimensions({ width: rect.width, height: rect.height });
    }
  }, []);

  // Register reset function
  useEffect(() => {
    if (onRegisterReset) {
      onRegisterReset(() => {
        if (chartInstance.current) {
          chartInstance.current.timeScale().fitContent();
        }
        if (volumeInstance.current) {
          volumeInstance.current.timeScale().fitContent();
        }
        if (rsiInstance.current) {
          rsiInstance.current.timeScale().fitContent();
        }
        if (macdInstance.current) {
          macdInstance.current.timeScale().fitContent();
        }
        if (atrInstance.current) {
          atrInstance.current.timeScale().fitContent();
        }
        if (obvInstance.current) {
          obvInstance.current.timeScale().fitContent();
        }
      });
    }
  }, [onRegisterReset]);

  // Initialize charts when data or dimensions change
  useEffect(() => {
    initializeCharts();
  }, [initializeCharts]);

  // Handle resize
  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (chartInstance.current) {
        chartInstance.current.remove();
      }
      if (volumeInstance.current) {
        volumeInstance.current.remove();
      }
      if (rsiInstance.current) {
        rsiInstance.current.remove();
      }
      if (macdInstance.current) {
        macdInstance.current.remove();
      }
      if (atrInstance.current) {
        atrInstance.current.remove();
      }
      if (obvInstance.current) {
        obvInstance.current.remove();
      }
    };
  }, []);

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-red-500 text-center">
          <p>Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full h-full">
      {/* Main Candlestick Chart */}
      <div ref={candleChartRef} className="w-full" style={{ height: chartHeights.candle }} />
      
      {/* Volume Chart */}
      {showVolume && (
        <div ref={volumeChartRef} className="w-full" style={{ height: chartHeights.volume }} />
      )}
      
      {/* RSI Chart */}
      {activeIndicators.rsi && (
        <div ref={rsiChartRef} className="w-full" style={{ height: chartHeights.rsi }} />
      )}
      
      {/* MACD Chart */}
      {activeIndicators.macd && (
        <div ref={macdChartRef} className="w-full" style={{ height: chartHeights.macd }} />
      )}
      
      {/* ATR Chart */}
      {activeIndicators.atr && (
        <div ref={atrChartRef} className="w-full" style={{ height: chartHeights.atr }} />
      )}
      
      {/* OBV Chart */}
      {activeIndicators.obv && (
        <div ref={obvChartRef} className="w-full" style={{ height: chartHeights.obv }} />
      )}
      
      {/* Debug Info */}
      {debug && (
        <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded">
          <h3 className="font-semibold mb-2">Debug Info</h3>
          <div className="text-sm space-y-1">
            <p>Data Points: {validatedData.length}</p>
            <p>Active Indicators: {Object.values(activeIndicators).filter(Boolean).length}</p>
            <p>Chart Dimensions: {chartDimensions.width} x {chartDimensions.height}</p>
            <p>Chart Heights: {JSON.stringify(chartHeights)}</p>
            {chartStats && (
              <div>
                <p>Price Range: ₹{chartStats.priceRange?.min?.toFixed(2)} - ₹{chartStats.priceRange?.max?.toFixed(2)}</p>
                <p>Volume Anomalies: {indicators.volumeAnomalies?.length || 0}</p>
                <p>Support/Resistance Levels: {indicators.supportResistance?.length || 0}</p>
                <p>Patterns Detected: {indicators.triangles?.length || 0} triangles, {indicators.flags?.length || 0} flags</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedChartsMultiPaneChart; 