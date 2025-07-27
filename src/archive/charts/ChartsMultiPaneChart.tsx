/**
 * @deprecated This component has been archived and is no longer in use.
 * The multi-pane chart functionality has been integrated into the unified Charts page.
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
  calcATR
} from '@/utils/chartUtils';

interface ChartsMultiPaneChartProps {
  data: ChartData[];
  theme?: 'light' | 'dark';
  height?: number;
  width?: number;
  timeframe?: string;
  debug?: boolean;
  showVolume?: boolean;
  isLiveMode?: boolean;
  activeIndicators?: {
    macd?: boolean;
    atr?: boolean;
    stochastic?: boolean;
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

const ChartsMultiPaneChart: React.FC<ChartsMultiPaneChartProps> = ({
  data,
  theme = 'light',
  height = 600,
  width = 800,
  timeframe = '1d',
  debug = false,
  showVolume = true,
  isLiveMode = true,
  activeIndicators = {
    macd: false,
    atr: false,
    stochastic: false
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
  const stochasticChartRef = useRef<HTMLDivElement>(null);

  // Chart instances
  const chartInstance = useRef<IChartApi | null>(null);
  const volumeInstance = useRef<IChartApi | null>(null);
  const rsiInstance = useRef<IChartApi | null>(null);
  const macdInstance = useRef<IChartApi | null>(null);
  const atrInstance = useRef<IChartApi | null>(null);
  const stochasticInstance = useRef<IChartApi | null>(null);

  // Series refs
  const candleSeriesRef = useRef<ISeriesApi<CandlestickData> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<HistogramData> | null>(null);
  const rsiSeriesRef = useRef<ISeriesApi<LineData> | null>(null);
  const macdSeriesRef = useRef<ISeriesApi<LineData> | null>(null);
  const macdSignalSeriesRef = useRef<ISeriesApi<LineData> | null>(null);
  const macdHistogramSeriesRef = useRef<ISeriesApi<HistogramData> | null>(null);
  const atrSeriesRef = useRef<ISeriesApi<LineData> | null>(null);
  const stochasticKSeriesRef = useRef<ISeriesApi<LineData> | null>(null);
  const stochasticDSeriesRef = useRef<ISeriesApi<LineData> | null>(null);

  // State
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartDimensions, setChartDimensions] = useState({ width: width || 800, height: height || 600 });

  // Debug logging (moved after state declarations)
  console.log('ChartsMultiPaneChart render:', {
    dataLength: data?.length || 0,
    theme,
    height,
    width,
    timeframe,
    debug,
    showVolume,
    isLiveMode,
    activeIndicators,
    chartDimensions,
    isLoading
  });

  // Validation and stats
  const validationResult = useMemo(() => validateChartData(data), [data]);
  const validatedData = useMemo(() => {
    if (!validationResult.data || validationResult.data.length === 0) {
      return [];
    }
    
    // Sort data by timestamp and remove duplicates
    const sortedData = validationResult.data
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .filter((item, index, array) => {
        if (index === 0) return true;
        return item.date !== array[index - 1].date;
      });
    
    return sortedData;
  }, [validationResult.data]);
  const chartStats = useMemo(() => calculateChartStats(validatedData), [validatedData]);

  // Calculate chart heights
  const chartHeights = useMemo(() => {
    const totalHeight = height;
    const headerHeight = 44;
    const volumeHeight = showVolume ? (height >= 800 ? 120 : 100) : 0;
    const rsiHeight = height >= 800 ? 150 : 120;
    const macdHeight = activeIndicators.macd ? (height >= 800 ? 150 : 120) : 0;
    const atrHeight = activeIndicators.atr ? (height >= 800 ? 100 : 80) : 0;
    const stochasticHeight = activeIndicators.stochastic ? (height >= 800 ? 120 : 100) : 0;
    
    const totalIndicatorHeight = volumeHeight + rsiHeight + macdHeight + atrHeight + stochasticHeight;
    const mainChartHeight = totalHeight - totalIndicatorHeight - headerHeight;
    
    const heights = {
      candle: Math.max(200, mainChartHeight),
      volume: volumeHeight,
      rsi: rsiHeight,
      macd: macdHeight,
      atr: atrHeight,
      stochastic: stochasticHeight
    };

    console.log('Chart heights calculated:', {
      totalHeight,
      showVolume,
      volumeHeight,
      heights
    });

    return heights;
  }, [height, showVolume, activeIndicators]);

  // Update validation result
  useEffect(() => {
    if (onValidationResult) {
      onValidationResult(validationResult);
    }
  }, [validationResult, onValidationResult]);

  // Update stats
  useEffect(() => {
    if (onStatsCalculated && chartStats) {
      onStatsCalculated(chartStats);
    }
  }, [chartStats, onStatsCalculated]);

  // Calculate indicators
  const indicators = useMemo(() => {
    if (!validatedData || validatedData.length === 0) return {};

    const closes = validatedData.map(d => d.close);
    const highs = validatedData.map(d => d.high);
    const lows = validatedData.map(d => d.low);
    const volumes = validatedData.map(d => d.volume);

    console.log('Calculating indicators with data:', {
      dataLength: validatedData.length,
      firstDate: validatedData[0]?.date,
      lastDate: validatedData[validatedData.length - 1]?.date,
      firstClose: validatedData[0]?.close,
      lastClose: validatedData[validatedData.length - 1]?.close,
      closesLength: closes.length,
      highsLength: highs.length,
      lowsLength: lows.length,
      volumesLength: volumes.length
    });

    const result = {
      rsi: calcRSI(closes, 14),
      macd: calcMACD(closes, 12, 26, 9),
      stochastic: calcStochastic(highs, lows, closes, 14, 3),
      atr: calcATR(highs, lows, closes, 14)
    };

    console.log('Indicators calculated:', {
      rsiLength: result.rsi?.length || 0,
      macdLength: result.macd?.macd?.length || 0,
      stochasticLength: result.stochastic?.k?.length || 0,
      atrLength: result.atr?.length || 0
    });

    return result;
  }, [validatedData]);

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
      return; // Don't initialize until we have proper dimensions
    }

    const isDark = theme === 'dark';

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
    if (showVolume && volumeChartRef.current) {
      try {
        console.log('Processing volume chart:', {
          showVolume,
          volumeChartRefExists: !!volumeChartRef.current,
          volumeInstanceExists: !!volumeInstance.current,
          chartDimensions,
          chartHeights: chartHeights.volume
        });

        // Create chart if it doesn't exist
        if (!volumeInstance.current) {
          const volumeChartWidth = chartDimensions.width || width;
          console.log('Creating volume chart with dimensions:', {
            volumeChartWidth,
            chartDimensionsWidth: chartDimensions.width,
            propsWidth: width,
            height: chartHeights.volume,
            isLiveMode
          });

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
        } else {
          console.log('Volume chart already exists, reusing instance');
        }
      } catch (error) {
        console.error('Error processing volume chart:', error);
      }
    } else {
      console.log('Volume chart not processed:', {
        showVolume,
        volumeChartRefExists: !!volumeChartRef.current,
        volumeInstanceExists: !!volumeInstance.current
      });
    }

    // Create RSI chart
    if (rsiChartRef.current && !rsiInstance.current) {
      const rsiChartWidth = chartDimensions.width || width;
      console.log('Creating RSI chart with dimensions:', {
        rsiChartWidth,
        chartDimensionsWidth: chartDimensions.width,
        propsWidth: width,
        height: chartHeights.rsi,
        isLiveMode
      });

      rsiInstance.current = createChart(rsiChartRef.current, {
        ...commonOptions,
        width: rsiChartWidth,
        height: chartHeights.rsi,
        rightPriceScale: {
          ...commonOptions.rightPriceScale,
          minValue: 0,
          maxValue: 100,
        },
        timeScale: {
          ...commonOptions.timeScale,
          visible: false,
        },
      });
    }

    // Create MACD chart
    if (activeIndicators.macd && macdChartRef.current && !macdInstance.current) {
      macdInstance.current = createChart(macdChartRef.current, {
        ...commonOptions,
        width: chartDimensions.width || width,
        height: chartHeights.macd,
        timeScale: {
          ...commonOptions.timeScale,
          visible: false,
        },
      });
    }

    // Create ATR chart
    if (activeIndicators.atr && atrChartRef.current && !atrInstance.current) {
      atrInstance.current = createChart(atrChartRef.current, {
        ...commonOptions,
        width: chartDimensions.width || width,
        height: chartHeights.atr,
        timeScale: {
          ...commonOptions.timeScale,
          visible: false,
        },
      });
    }

    // Create Stochastic chart
    if (activeIndicators.stochastic && stochasticChartRef.current && !stochasticInstance.current) {
      stochasticInstance.current = createChart(stochasticChartRef.current, {
        ...commonOptions,
        width: chartDimensions.width || width,
        height: chartHeights.stochastic,
        rightPriceScale: {
          ...commonOptions.rightPriceScale,
          minValue: 0,
          maxValue: 100,
        },
        timeScale: {
          ...commonOptions.timeScale,
          visible: false,
        },
      });
    }

    // Synchronize time scales
    const charts = [
      chartInstance.current,
      volumeInstance.current,
      rsiInstance.current,
      macdInstance.current,
      atrInstance.current,
      stochasticInstance.current
    ].filter(Boolean);

    // Only synchronize if we have at least 2 charts and the main chart has data
    if (charts.length > 1 && chartInstance.current && validatedData.length > 0) {
      charts.forEach(chart => {
        if (chart && chart !== chartInstance.current) {
          try {
            chartInstance.current.timeScale().subscribeVisibleTimeRangeChange(() => {
              try {
                const timeRange = chartInstance.current?.timeScale().getVisibleRange();
                if (timeRange && timeRange.from !== null && timeRange.to !== null) {
                  chart.timeScale().setVisibleRange(timeRange);
                }
              } catch (error) {
                console.warn('Error synchronizing time range:', error);
              }
            });
          } catch (error) {
            console.warn('Error setting up time scale synchronization:', error);
          }
        }
      });
    }

    setIsLoading(false);
  }, [validatedData, theme, chartDimensions, width, chartHeights, showVolume, activeIndicators, height, isLiveMode]);

  // Set loading to false when we have data and dimensions
  useEffect(() => {
    if (validatedData && validatedData.length > 0 && chartDimensions.width > 0) {
      setIsLoading(false);
    }
  }, [validatedData, chartDimensions]);

  // Add series to charts
  useEffect(() => {
    if (!validatedData || validatedData.length === 0) return;

    console.log('=== CHART SERIES CREATION START ===');
    console.log('Using validated data for all charts:', {
      dataLength: validatedData.length,
      firstDate: validatedData[0]?.date,
      lastDate: validatedData[validatedData.length - 1]?.date,
      firstClose: validatedData[0]?.close,
      lastClose: validatedData[validatedData.length - 1]?.close,
      isLiveMode
    });

    const isDark = theme === 'dark';

    // Add candlestick series
    if (chartInstance.current) {
      try {
        const candleData = validatedData.map<CandlestickData>(d => ({
          time: toTimestamp(d.date),
          open: d.open,
          high: d.high,
          low: d.low,
          close: d.close,
        })).filter(d => d.time > 0); // Filter out invalid timestamps

        console.log('Candlestick data processed:', {
          originalLength: validatedData.length,
          filteredLength: candleData.length,
          firstDataPoint: candleData[0],
          lastDataPoint: candleData[candleData.length - 1]
        });

        if (candleData.length > 0) {
          // Create series if it doesn't exist
          if (!candleSeriesRef.current) {
            candleSeriesRef.current = chartInstance.current.addCandlestickSeries({
              upColor: isDark ? '#26a69a' : '#26a69a',
              downColor: isDark ? '#ef5350' : '#ef5350',
              borderVisible: false,
              wickUpColor: isDark ? '#26a69a' : '#26a69a',
              wickDownColor: isDark ? '#ef5350' : '#ef5350',
            });
            console.log('Candlestick series created');
          }

          // Update data regardless of whether series was just created or already existed
          candleSeriesRef.current.setData(candleData);
          console.log('Candlestick series data set successfully');
        }
      } catch (error) {
        console.error('Error processing candlestick series:', error);
      }
    }

    // Add volume series
    if (showVolume && volumeInstance.current) {
      try {
        console.log('Processing volume series with data:', {
          showVolume,
          volumeInstanceExists: !!volumeInstance.current,
          volumeSeriesExists: !!volumeSeriesRef.current,
          dataLength: validatedData.length,
          sampleVolume: validatedData[0]?.volume
        });

        const volumeData = validatedData.map<HistogramData>(d => ({
          time: toTimestamp(d.date),
          value: d.volume,
          color: d.close >= d.open ? 'rgba(38, 166, 154, 0.8)' : 'rgba(239, 83, 80, 0.8)',
        })).filter(d => d.time > 0 && d.value > 0); // Filter out invalid timestamps and zero volumes

        console.log('Volume data processed:', {
          originalLength: validatedData.length,
          filteredLength: volumeData.length,
          sampleData: volumeData.slice(0, 3)
        });

        if (volumeData.length > 0) {
          // Create series if it doesn't exist
          if (!volumeSeriesRef.current) {
            volumeSeriesRef.current = volumeInstance.current.addHistogramSeries({
              color: isDark ? '#26a69a' : '#26a69a',
              priceFormat: { type: 'volume' },
            });
            console.log('Volume series created');
          }

          // Update data regardless of whether series was just created or already existed
          volumeSeriesRef.current.setData(volumeData);
          console.log('Volume series data updated successfully');
        } else {
          console.warn('No valid volume data to display');
        }
      } catch (error) {
        console.error('Error processing volume series:', error);
      }
    } else {
      console.log('Volume series not processed:', {
        showVolume,
        volumeInstanceExists: !!volumeInstance.current,
        volumeSeriesExists: !!volumeSeriesRef.current
      });
    }

    // Add RSI series
    if (rsiInstance.current && indicators.rsi) {
      const rsiData = validatedData
        .map<LineData>((d, idx) => ({
          time: toTimestamp(d.date),
          value: indicators.rsi[idx],
        }))
        .filter(d => d.value !== null && !isNaN(d.value)) as LineData[];

      console.log('RSI data processed:', {
        originalLength: validatedData.length,
        rsiLength: indicators.rsi?.length || 0,
        filteredLength: rsiData.length,
        firstRSI: rsiData[0],
        lastRSI: rsiData[rsiData.length - 1]
      });

      if (rsiData.length > 0) {
        // Create series if it doesn't exist
        if (!rsiSeriesRef.current) {
          rsiSeriesRef.current = rsiInstance.current.addLineSeries({
            color: isDark ? '#2196f3' : '#2196f3',
            lineWidth: 2,
            title: 'RSI',
          });
          console.log('RSI series created');
        }

        // Update data regardless of whether series was just created or already existed
        rsiSeriesRef.current.setData(rsiData);
        console.log('RSI series data set successfully');
      }

      // Add overbought/oversold lines
      rsiInstance.current.addLineSeries({
        color: isDark ? '#ff9800' : '#ff9800',
        lineWidth: 1,
        lineStyle: 2,
        title: 'Overbought',
      }).setData([
        { time: toTimestamp(validatedData[0].date), value: 70 },
        { time: toTimestamp(validatedData[validatedData.length - 1].date), value: 70 },
      ]);

      rsiInstance.current.addLineSeries({
        color: isDark ? '#ff9800' : '#ff9800',
        lineWidth: 1,
        lineStyle: 2,
        title: 'Oversold',
      }).setData([
        { time: toTimestamp(validatedData[0].date), value: 30 },
        { time: toTimestamp(validatedData[validatedData.length - 1].date), value: 30 },
      ]);
    }

    // Add MACD series
    if (activeIndicators.macd && macdInstance.current && indicators.macd) {
      const macdData = validatedData
        .map<LineData>((d, idx) => ({
          time: toTimestamp(d.date),
          value: indicators.macd.macd[idx],
        }))
        .filter(d => d.value !== null && !isNaN(d.value)) as LineData[];

      const signalData = validatedData
        .map<LineData>((d, idx) => ({
          time: toTimestamp(d.date),
          value: indicators.macd.signal[idx],
        }))
        .filter(d => d.value !== null && !isNaN(d.value)) as LineData[];

      const histogramData = validatedData
        .map<HistogramData>((d, idx) => ({
          time: toTimestamp(d.date),
          value: indicators.macd.histogram[idx],
          color: (indicators.macd.histogram[idx] || 0) >= 0 ? 'rgba(38, 166, 154, 0.8)' : 'rgba(239, 83, 80, 0.8)',
        }))
        .filter(d => d.value !== null && !isNaN(d.value)) as HistogramData[];

      console.log('MACD data processed:', {
        originalLength: validatedData.length,
        macdLength: indicators.macd?.macd?.length || 0,
        macdDataLength: macdData.length,
        signalDataLength: signalData.length,
        histogramDataLength: histogramData.length
      });

      if (macdData.length > 0) {
        // Create series if they don't exist
        if (!macdSeriesRef.current) {
          macdSeriesRef.current = macdInstance.current.addLineSeries({
            color: isDark ? '#2196f3' : '#2196f3',
            lineWidth: 2,
            title: 'MACD',
          });
          console.log('MACD series created');
        }

        if (!macdSignalSeriesRef.current) {
          macdSignalSeriesRef.current = macdInstance.current.addLineSeries({
            color: isDark ? '#ff9800' : '#ff9800',
            lineWidth: 2,
            title: 'Signal',
          });
          console.log('MACD Signal series created');
        }

        if (!macdHistogramSeriesRef.current) {
          macdHistogramSeriesRef.current = macdInstance.current.addHistogramSeries({
            color: isDark ? '#26a69a' : '#26a69a',
            title: 'Histogram',
          });
          console.log('MACD Histogram series created');
        }

        // Update data regardless of whether series were just created or already existed
        macdSeriesRef.current.setData(macdData);
        macdSignalSeriesRef.current.setData(signalData);
        macdHistogramSeriesRef.current.setData(histogramData);
        console.log('MACD series data set successfully');
      }
    }

    // Add ATR series
    if (activeIndicators.atr && atrInstance.current && indicators.atr) {
      const atrData = validatedData
        .map<LineData>((d, idx) => ({
          time: toTimestamp(d.date),
          value: indicators.atr[idx],
        }))
        .filter(d => d.value !== null && !isNaN(d.value)) as LineData[];

      console.log('ATR data processed:', {
        originalLength: validatedData.length,
        atrLength: indicators.atr?.length || 0,
        filteredLength: atrData.length
      });

      if (atrData.length > 0) {
        // Create series if it doesn't exist
        if (!atrSeriesRef.current) {
          atrSeriesRef.current = atrInstance.current.addLineSeries({
            color: isDark ? '#9c27b0' : '#9c27b0',
            lineWidth: 2,
            title: 'ATR',
          });
          console.log('ATR series created');
        }

        // Update data regardless of whether series was just created or already existed
        atrSeriesRef.current.setData(atrData);
        console.log('ATR series data set successfully');
      }
    }

    // Add Stochastic series
    if (activeIndicators.stochastic && stochasticInstance.current && indicators.stochastic) {
      const kData = validatedData
        .map<LineData>((d, idx) => ({
          time: toTimestamp(d.date),
          value: indicators.stochastic.k[idx],
        }))
        .filter(d => d.value !== null && !isNaN(d.value)) as LineData[];

      const dData = validatedData
        .map<LineData>((d, idx) => ({
          time: toTimestamp(d.date),
          value: indicators.stochastic.d[idx],
        }))
        .filter(d => d.value !== null && !isNaN(d.value)) as LineData[];

      console.log('Stochastic data processed:', {
        originalLength: validatedData.length,
        stochasticLength: indicators.stochastic?.k?.length || 0,
        kDataLength: kData.length,
        dDataLength: dData.length
      });

      if (kData.length > 0) {
        // Create series if they don't exist
        if (!stochasticKSeriesRef.current) {
          stochasticKSeriesRef.current = stochasticInstance.current.addLineSeries({
            color: isDark ? '#2196f3' : '#2196f3',
            lineWidth: 2,
            title: '%K',
          });
          console.log('Stochastic %K series created');
        }

        if (!stochasticDSeriesRef.current) {
          stochasticDSeriesRef.current = stochasticInstance.current.addLineSeries({
            color: isDark ? '#ff9800' : '#ff9800',
            lineWidth: 2,
            title: '%D',
          });
          console.log('Stochastic %D series created');
        }

        // Update data regardless of whether series were just created or already existed
        stochasticKSeriesRef.current.setData(kData);
        stochasticDSeriesRef.current.setData(dData);
        console.log('Stochastic series data set successfully');
      }

      // Add overbought/oversold lines
      stochasticInstance.current.addLineSeries({
        color: isDark ? '#ff9800' : '#ff9800',
        lineWidth: 1,
        lineStyle: 2,
        title: 'Overbought',
      }).setData([
        { time: toTimestamp(validatedData[0].date), value: 80 },
        { time: toTimestamp(validatedData[validatedData.length - 1].date), value: 80 },
      ]);

      stochasticInstance.current.addLineSeries({
        color: isDark ? '#ff9800' : '#ff9800',
        lineWidth: 1,
        lineStyle: 2,
        title: 'Oversold',
      }).setData([
        { time: toTimestamp(validatedData[0].date), value: 20 },
        { time: toTimestamp(validatedData[validatedData.length - 1].date), value: 20 },
      ]);
    }

    console.log('=== CHART SERIES CREATION COMPLETE ===');
    console.log('All charts now using the same validated data source');
  }, [validatedData, theme, showVolume, activeIndicators, indicators]);

  // Initialize charts when component mounts
  useEffect(() => {
    console.log('Chart initialization effect triggered:', {
      containerRef: !!containerRef.current,
      candleChartRef: !!candleChartRef.current,
      validatedDataLength: validatedData?.length || 0,
      chartDimensions
    });

    // Ensure containers are ready before initializing charts
    if (containerRef.current && candleChartRef.current && chartDimensions.width > 0) {
      initializeCharts();
    } else {
      // If containers aren't ready, try again after a short delay
      const timer = setTimeout(() => {
        if (containerRef.current && candleChartRef.current && chartDimensions.width > 0) {
          initializeCharts();
        } else {
          console.warn('Chart containers still not ready after delay:', {
            containerRef: !!containerRef.current,
            candleChartRef: !!candleChartRef.current,
            chartDimensions
          });
        }
      }, 200);
      
      return () => clearTimeout(timer);
    }
  }, [initializeCharts, chartDimensions, validatedData?.length]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        console.log('Resize detected:', { 
          width: rect.width, 
          height: rect.height,
          isLiveMode,
          propsWidth: width,
          propsHeight: height
        });
        setChartDimensions({ width: rect.width, height: rect.height });
      } else {
        console.log('Container ref not available, using props dimensions:', { width, height });
        setChartDimensions({ width: width || 800, height: height || 600 });
      }
    };

    // Initial setup with a small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      handleResize();
    }, 50);

    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, [width, height, isLiveMode]);

  // Resize charts when dimensions change
  useEffect(() => {
    console.log('Chart resize effect triggered:', {
      chartDimensions,
      isLiveMode,
      chartInstanceExists: !!chartInstance.current,
      volumeInstanceExists: !!volumeInstance.current,
      rsiInstanceExists: !!rsiInstance.current
    });

    if (chartDimensions.width > 0 && chartDimensions.height > 0) {
      // Resize main chart
      if (chartInstance.current) {
        try {
          chartInstance.current.resize(chartDimensions.width, chartHeights.candle);
          console.log('Main chart resized to:', { width: chartDimensions.width, height: chartHeights.candle });
        } catch (error) {
          console.error('Error resizing main chart:', error);
        }
      }

      // Resize volume chart
      if (volumeInstance.current && showVolume) {
        try {
          volumeInstance.current.resize(chartDimensions.width, chartHeights.volume);
          console.log('Volume chart resized to:', { width: chartDimensions.width, height: chartHeights.volume });
        } catch (error) {
          console.error('Error resizing volume chart:', error);
        }
      }

      // Resize RSI chart
      if (rsiInstance.current) {
        try {
          rsiInstance.current.resize(chartDimensions.width, chartHeights.rsi);
          console.log('RSI chart resized to:', { width: chartDimensions.width, height: chartHeights.rsi });
        } catch (error) {
          console.error('Error resizing RSI chart:', error);
        }
      }

      // Resize MACD chart
      if (macdInstance.current && activeIndicators.macd) {
        try {
          macdInstance.current.resize(chartDimensions.width, chartHeights.macd);
          console.log('MACD chart resized to:', { width: chartDimensions.width, height: chartHeights.macd });
        } catch (error) {
          console.error('Error resizing MACD chart:', error);
        }
      }

      // Resize ATR chart
      if (atrInstance.current && activeIndicators.atr) {
        try {
          atrInstance.current.resize(chartDimensions.width, chartHeights.atr);
          console.log('ATR chart resized to:', { width: chartDimensions.width, height: chartHeights.atr });
        } catch (error) {
          console.error('Error resizing ATR chart:', error);
        }
      }

      // Resize Stochastic chart
      if (stochasticInstance.current && activeIndicators.stochastic) {
        try {
          stochasticInstance.current.resize(chartDimensions.width, chartHeights.stochastic);
          console.log('Stochastic chart resized to:', { width: chartDimensions.width, height: chartHeights.stochastic });
        } catch (error) {
          console.error('Error resizing Stochastic chart:', error);
        }
      }
    }
  }, [chartDimensions, chartHeights, showVolume, activeIndicators, isLiveMode]);

  // Register reset function
  useEffect(() => {
    if (onRegisterReset) {
      onRegisterReset(() => {
        if (chartInstance.current) {
          chartInstance.current.timeScale().fitContent();
        }
      });
    }
  }, [onRegisterReset]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (chartInstance.current) chartInstance.current.remove();
      if (volumeInstance.current) volumeInstance.current.remove();
      if (rsiInstance.current) rsiInstance.current.remove();
      if (macdInstance.current) macdInstance.current.remove();
      if (atrInstance.current) atrInstance.current.remove();
      if (stochasticInstance.current) stochasticInstance.current.remove();
    };
  }, []);

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-red-500 mb-2">Chart Error</p>
          <p className="text-sm text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Loading charts...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef} 
      className={`w-full h-full flex flex-col ${isLiveMode ? 'space-y-1' : 'space-y-2'}`}
      style={{ minWidth: '100%' }}
      data-debug={`container-width: ${chartDimensions.width}px, isLiveMode: ${isLiveMode}`}
    >
      {console.log('Chart container rendered:', {
        chartDimensions,
        isLiveMode,
        containerWidth: chartDimensions.width,
        containerHeight: chartDimensions.height
      })}
      {/* Main Price Chart */}
      <div className="relative rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-900 flex-1">
        <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200">
            {isLiveMode ? 'Live Price Chart' : 'Historical Price Chart'}
          </h3>
        </div>
        <div 
          ref={candleChartRef} 
          className="w-full" 
          style={{ height: `${chartHeights.candle}px` }}
          data-debug={`candle-chart-width: ${chartDimensions.width}px`}
        />
        <div id="candlestick-tooltip" className="absolute hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-3 pointer-events-none z-30 min-w-[160px]" />
      </div>

      {/* Volume Chart */}
      {showVolume && (
        <div className="relative rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-900">
          <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200">Volume</h3>
          </div>
          <div 
            ref={volumeChartRef} 
            className="w-full" 
            style={{ height: `${chartHeights.volume}px` }}
            data-debug={`volume-chart-width: ${chartDimensions.width}px, volume-height: ${chartHeights.volume}px`}
          />
          {console.log('Volume chart container rendered:', {
            showVolume,
            volumeHeight: chartHeights.volume,
            volumeChartRef: !!volumeChartRef.current
          })}
        </div>
      )}

      {/* RSI Chart */}
      <div className="relative rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-900">
        <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200">RSI (14)</h3>
        </div>
        <div 
          ref={rsiChartRef} 
          className="w-full" 
          style={{ height: `${chartHeights.rsi}px` }}
          data-debug={`rsi-chart-width: ${chartDimensions.width}px`}
        />
      </div>

      {/* MACD Chart */}
      {activeIndicators.macd && (
        <div className="relative rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-900">
          <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200">MACD</h3>
          </div>
          <div ref={macdChartRef} className="w-full" style={{ height: `${chartHeights.macd}px` }} />
        </div>
      )}

      {/* ATR Chart */}
      {activeIndicators.atr && (
        <div className="relative rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-900">
          <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200">ATR (14)</h3>
          </div>
          <div ref={atrChartRef} className="w-full" style={{ height: `${chartHeights.atr}px` }} />
        </div>
      )}

      {/* Stochastic Chart */}
      {activeIndicators.stochastic && (
        <div className="relative rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-900">
          <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200">Stochastic</h3>
          </div>
          <div ref={stochasticChartRef} className="w-full" style={{ height: `${chartHeights.stochastic}px` }} />
        </div>
      )}
    </div>
  );
};

export default ChartsMultiPaneChart; 