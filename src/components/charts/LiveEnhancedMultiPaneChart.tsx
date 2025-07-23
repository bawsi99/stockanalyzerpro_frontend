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
import { validateChartData, ValidatedChartData, ChartValidationResult, calculateChartStats } from "@/utils/chartUtils";
import { LiveChartProvider, useLiveChart, LiveChartStatus, LiveChartControls } from "./LiveChartProvider";

// ===== TYPES & INTERFACES =====

interface LiveEnhancedMultiPaneChartProps {
  token: string;
  timeframe: string;
  theme?: "light" | "dark";
  height?: number;
  debug?: boolean;
  onValidationResult?: (result: ChartValidationResult) => void;
  onStatsCalculated?: (stats: any) => void;
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
  autoConnect?: boolean;
  maxDataPoints?: number;
  updateInterval?: number;
}

// ===== UTILITY FUNCTIONS =====

const toTimestamp = (iso: string): UTCTimestamp => {
  let timestamp: number;
  
  try {
    timestamp = Date.parse(iso);
    
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

// ===== CHART COMPONENT =====

const LiveChartComponent = React.forwardRef<any, LiveEnhancedMultiPaneChartProps>(({ 
  token,
  timeframe,
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
  // Live chart context
  const {
    chartData,
    indicators,
    patterns,
    isLive,
    isConnected,
    isLoading,
    error,
    lastUpdate
  } = useLiveChart();

  // Chart refs
  const containerRef = useRef<HTMLDivElement>(null);
  const candleChartRef = useRef<HTMLDivElement>(null);
  const volumeChartRef = useRef<HTMLDivElement>(null);
  const rsiChartRef = useRef<HTMLDivElement>(null);
  const macdChartRef = useRef<HTMLDivElement>(null);
  const stochasticChartRef = useRef<HTMLDivElement>(null);
  const atrChartRef = useRef<HTMLDivElement>(null);
  
  // Chart instances
  const chartInstance = useRef<IChartApi | null>(null);
  const volumeInstance = useRef<IChartApi | null>(null);
  const rsiInstance = useRef<IChartApi | null>(null);
  const macdInstance = useRef<IChartApi | null>(null);
  const stochasticInstance = useRef<IChartApi | null>(null);
  const atrInstance = useRef<IChartApi | null>(null);
  
  // Series refs
  const candleSeriesRef = useRef<ISeriesApi<CandlestickData> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<HistogramData> | null>(null);
  const rsiSeriesRef = useRef<ISeriesApi<LineData> | null>(null);
  const macdSeriesRef = useRef<ISeriesApi<LineData> | null>(null);
  const macdSignalSeriesRef = useRef<ISeriesApi<LineData> | null>(null);
  const macdHistogramSeriesRef = useRef<ISeriesApi<HistogramData> | null>(null);
  const stochasticKSeriesRef = useRef<ISeriesApi<LineData> | null>(null);
  const stochasticDSeriesRef = useRef<ISeriesApi<LineData> | null>(null);
  const atrSeriesRef = useRef<ISeriesApi<LineData> | null>(null);
  
  // State
  const [isChartReady, setIsChartReady] = useState(false);
  const [chartDimensions, setChartDimensions] = useState({ width: 0, height: 0 });
  const [activeIndicators, setActiveIndicators] = useState({
    sma: true,
    ema: true,
    rsi: true,
    macd: true,
    bollingerBands: true,
    stochastic: false,
    atr: false
  });

  // Validation result
  const validationResult = useMemo(() => validateChartData(chartData), [chartData, debug]);
  const validatedData = validationResult.data;

  // Chart statistics
  const chartStats = useMemo(() => calculateChartStats(validatedData), [validatedData]);

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

  // Chart heights calculation
  const chartHeights = useMemo(() => {
    const totalHeight = height;
    const headerHeight = 44;
    const volumeHeight = Math.max(80, totalHeight * 0.15);
    const rsiHeight = Math.max(100, totalHeight * 0.2);
    const macdHeight = activeIndicators.macd ? Math.max(100, totalHeight * 0.15) : 0;
    const stochasticHeight = activeIndicators.stochastic ? Math.max(100, totalHeight * 0.15) : 0;
    const atrHeight = activeIndicators.atr ? Math.max(100, totalHeight * 0.15) : 0;
    
    const totalIndicatorHeight = rsiHeight + macdHeight + stochasticHeight + atrHeight;
    const mainChartHeight = totalHeight - volumeHeight - totalIndicatorHeight - headerHeight;
    
    return {
      candle: Math.max(200, mainChartHeight),
      volume: volumeHeight,
      rsi: rsiHeight,
      macd: macdHeight,
      stochastic: stochasticHeight,
      atr: atrHeight,
      totalHeight: totalHeight
    };
  }, [height, activeIndicators]);

  // Initialize charts
  const initializeCharts = useCallback(() => {
    if (!containerRef.current || !candleChartRef.current) return;

    const isDark = theme === "dark";
    
    // Create main chart
    chartInstance.current = createChart(candleChartRef.current, {
      width: chartDimensions.width,
      height: chartHeights.candle,
      layout: {
        background: { type: ColorType.Solid, color: isDark ? '#1a1a1a' : '#ffffff' },
        textColor: isDark ? '#ffffff' : '#000000',
      },
      grid: {
        vertLines: { color: isDark ? '#2a2a2a' : '#e1e1e1' },
        horzLines: { color: isDark ? '#2a2a2a' : '#e1e1e1' },
      },
      crosshair: {
        mode: 1,
        vertLine: {
          color: isDark ? '#ffffff' : '#000000',
          width: 1,
          style: 3,
        },
        horzLine: {
          color: isDark ? '#ffffff' : '#000000',
          width: 1,
          style: 3,
        },
      },
      rightPriceScale: {
        borderColor: isDark ? '#2a2a2a' : '#e1e1e1',
      },
      timeScale: {
        borderColor: isDark ? '#2a2a2a' : '#e1e1e1',
        timeVisible: true,
        secondsVisible: false,
        tickMarkFormatter: (time: number) => {
          const date = new Date(time * 1000);
          
          // For 1-day interval, show only date
          if (timeframe === '1d') {
            return date.toLocaleDateString('en-IN', { 
              timeZone: 'Asia/Kolkata',
              month: 'short', 
              day: 'numeric' 
            });
          } else {
            // For other intervals, show time
            return date.toLocaleTimeString('en-IN', { 
              timeZone: 'Asia/Kolkata',
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
            });
          }
        },
      },
      localization: {
        timeFormatter: (time: number) => {
          // Convert UTC time to IST for display
          const utcDate = new Date(time * 1000);
          
          // For 1-day interval, show only date
          if (timeframe === '1d') {
            return utcDate.toLocaleDateString('en-IN', { 
              timeZone: 'Asia/Kolkata',
              day: '2-digit',
              month: '2-digit',
              year: 'numeric'
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

    // Create volume chart
    volumeInstance.current = createChart(volumeChartRef.current, {
      width: chartDimensions.width,
      height: chartHeights.volume,
      layout: {
        background: { type: ColorType.Solid, color: isDark ? '#1a1a1a' : '#ffffff' },
        textColor: isDark ? '#ffffff' : '#000000',
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
          visible: false,
        },
        localization: {
          timeFormatter: (time: number) => {
            // Convert UTC time to IST for display
            const utcDate = new Date(time * 1000);
            
            // For 1-day interval, show only date
            if (timeframe === '1d') {
              return utcDate.toLocaleDateString('en-IN', { 
                timeZone: 'Asia/Kolkata',
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
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

      localization: {
        timeFormatter: (time: number) => {
          // Convert UTC time to IST for display
          const utcDate = new Date(time * 1000);
          const istDate = new Date(utcDate.getTime() + (5 * 60 + 30) * 60 * 1000);
          return istDate.toLocaleDateString('en-IN', { 
            timeZone: 'Asia/Kolkata',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          });
        },
        priceFormatter: (price: number) => {
          return price >= 1 ? price.toFixed(2) : price.toPrecision(4);
        },
      },
    });

    // Create RSI chart
    if (activeIndicators.rsi && rsiChartRef.current) {
      rsiInstance.current = createChart(rsiChartRef.current, {
        width: chartDimensions.width,
        height: chartHeights.rsi,
        layout: {
          background: { type: ColorType.Solid, color: isDark ? '#1a1a1a' : '#ffffff' },
          textColor: isDark ? '#ffffff' : '#000000',
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
          visible: false,
        },
        localization: {
          timeFormatter: (time: number) => {
            // Convert UTC time to IST for display
            const utcDate = new Date(time * 1000);
            
            // For 1-day interval, show only date
            if (timeframe === '1d') {
              return utcDate.toLocaleDateString('en-IN', { 
                timeZone: 'Asia/Kolkata',
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
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
    }

    // Create MACD chart
    if (activeIndicators.macd && macdChartRef.current) {
      macdInstance.current = createChart(macdChartRef.current, {
        width: chartDimensions.width,
        height: chartHeights.macd,
        layout: {
          background: { type: ColorType.Solid, color: isDark ? '#1a1a1a' : '#ffffff' },
          textColor: isDark ? '#ffffff' : '#000000',
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
          visible: false,
        },
        localization: {
          timeFormatter: (time: number) => {
            // Convert UTC time to IST for display
            const utcDate = new Date(time * 1000);
            
            // For 1-day interval, show only date
            if (timeframe === '1d') {
              return utcDate.toLocaleDateString('en-IN', { 
                timeZone: 'Asia/Kolkata',
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
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
    }

    setIsChartReady(true);
  }, [theme, chartDimensions, chartHeights, activeIndicators]);

  // Initialize charts on mount
  useEffect(() => {
    initializeCharts();
  }, [initializeCharts]);

  // Update chart data
  const updateChartData = useCallback(() => {
    if (!isChartReady || validatedData.length === 0) return;

    const isDark = theme === "dark";

    // Update candle data
    if (chartInstance.current && candleSeriesRef.current) {
      const candleData = validatedData.map<CandlestickData>(d => ({
        time: toTimestamp(d.date),
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
      }));

      candleSeriesRef.current.setData(candleData);
    }

    // Update volume data
    if (volumeInstance.current && volumeSeriesRef.current) {
      const volumeData = validatedData.map<HistogramData>(d => ({
        time: toTimestamp(d.date),
        value: d.volume,
        color: d.close >= d.open ? 'rgba(38, 166, 154, 0.8)' : 'rgba(239, 83, 80, 0.8)',
      }));

      volumeSeriesRef.current.setData(volumeData);
    }

    // Update RSI data
    if (activeIndicators.rsi && rsiInstance.current && rsiSeriesRef.current && indicators?.rsi) {
      const rsiData = validatedData
        .map<LineData>((d, idx) => ({
          time: toTimestamp(d.date),
          value: indicators.rsi[idx],
        }))
        .filter(d => d.value !== null && !isNaN(d.value) && d.value >= 0 && d.value <= 100) as LineData[];

      rsiSeriesRef.current.setData(rsiData);
    }

    // Update MACD data
    if (activeIndicators.macd && macdInstance.current && indicators?.macd) {
      if (macdSeriesRef.current) {
        const macdData = validatedData
          .map<LineData>((d, idx) => ({
            time: toTimestamp(d.date),
            value: indicators.macd.line[idx],
          }))
          .filter(d => d.value !== null && !isNaN(d.value)) as LineData[];

        macdSeriesRef.current.setData(macdData);
      }

      if (macdSignalSeriesRef.current) {
        const signalData = validatedData
          .map<LineData>((d, idx) => ({
            time: toTimestamp(d.date),
            value: indicators.macd.signal[idx],
          }))
          .filter(d => d.value !== null && !isNaN(d.value)) as LineData[];

        macdSignalSeriesRef.current.setData(signalData);
      }

      if (macdHistogramSeriesRef.current) {
        const histogramData = validatedData
          .map<HistogramData>((d, idx) => ({
            time: toTimestamp(d.date),
            value: indicators.macd.histogram[idx],
            color: indicators.macd.histogram[idx] >= 0 ? 'rgba(38, 166, 154, 0.8)' : 'rgba(239, 83, 80, 0.8)',
          }))
          .filter(d => d.value !== null && !isNaN(d.value)) as HistogramData[];

        macdHistogramSeriesRef.current.setData(histogramData);
      }
    }

  }, [isChartReady, validatedData, theme, activeIndicators, indicators]);

  // Update chart data when data changes
  useEffect(() => {
    updateChartData();
  }, [updateChartData]);

  // Add series to charts
  useEffect(() => {
    if (!isChartReady) return;

    const isDark = theme === "dark";

    // Add candle series
    if (chartInstance.current && !candleSeriesRef.current) {
      candleSeriesRef.current = chartInstance.current.addCandlestickSeries({
        upColor: isDark ? '#26a69a' : '#26a69a',
        downColor: isDark ? '#ef5350' : '#ef5350',
        borderVisible: false,
        wickUpColor: isDark ? '#26a69a' : '#26a69a',
        wickDownColor: isDark ? '#ef5350' : '#ef5350',
      });
    }

    // Add volume series
    if (volumeInstance.current && !volumeSeriesRef.current) {
      volumeSeriesRef.current = volumeInstance.current.addHistogramSeries({
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

    // Add RSI series
    if (activeIndicators.rsi && rsiInstance.current && !rsiSeriesRef.current) {
      rsiSeriesRef.current = rsiInstance.current.addLineSeries({
        color: isDark ? '#2196f3' : '#2196f3',
        lineWidth: 2,
        title: 'RSI',
      });

      // Add overbought/oversold lines
      rsiInstance.current.addLineSeries({
        color: isDark ? '#ff9800' : '#ff9800',
        lineWidth: 1,
        lineStyle: 2,
        title: 'Overbought',
      }).setData([
        { time: toTimestamp(validatedData[0]?.date || ''), value: 70 },
        { time: toTimestamp(validatedData[validatedData.length - 1]?.date || ''), value: 70 },
      ]);

      rsiInstance.current.addLineSeries({
        color: isDark ? '#ff9800' : '#ff9800',
        lineWidth: 1,
        lineStyle: 2,
        title: 'Oversold',
      }).setData([
        { time: toTimestamp(validatedData[0]?.date || ''), value: 30 },
        { time: toTimestamp(validatedData[validatedData.length - 1]?.date || ''), value: 30 },
      ]);
    }

    // Add MACD series
    if (activeIndicators.macd && macdInstance.current && !macdSeriesRef.current) {
      macdSeriesRef.current = macdInstance.current.addLineSeries({
        color: isDark ? '#2196f3' : '#2196f3',
        lineWidth: 2,
        title: 'MACD',
      });

      macdSignalSeriesRef.current = macdInstance.current.addLineSeries({
        color: isDark ? '#ff9800' : '#ff9800',
        lineWidth: 2,
        title: 'Signal',
      });

      macdHistogramSeriesRef.current = macdInstance.current.addHistogramSeries({
        color: isDark ? '#26a69a' : '#26a69a',
        title: 'Histogram',
      });
    }

  }, [isChartReady, theme, activeIndicators, validatedData]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setChartDimensions({ width: rect.width, height: rect.height });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
    };
  }, []);

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    getChart: () => chartInstance.current,
    getVolumeChart: () => volumeInstance.current,
    getRsiChart: () => rsiInstance.current,
    getMacdChart: () => macdInstance.current,
    updateData: updateChartData,
  }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Connecting to live data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-red-500 text-lg mb-2">⚠️</div>
          <p className="text-sm text-red-600">Connection error: {error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full h-full">
      {/* Live Status Bar */}
      <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-4">
          <LiveChartStatus />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {token} - {timeframe}
          </span>
          {isLive && (
            <span className="text-xs text-green-600 bg-green-100 dark:bg-green-900 px-2 py-1 rounded">
              LIVE
            </span>
          )}
        </div>
        <LiveChartControls />
      </div>

      {/* Charts Container */}
      <div className="relative">
        {/* Main Chart */}
        <div ref={candleChartRef} className="w-full" style={{ height: chartHeights.candle }}></div>
        
        {/* Volume Chart */}
        <div ref={volumeChartRef} className="w-full" style={{ height: chartHeights.volume }}></div>
        
        {/* RSI Chart */}
        {activeIndicators.rsi && (
          <div ref={rsiChartRef} className="w-full" style={{ height: chartHeights.rsi }}></div>
        )}
        
        {/* MACD Chart */}
        {activeIndicators.macd && (
          <div ref={macdChartRef} className="w-full" style={{ height: chartHeights.macd }}></div>
        )}
        
        {/* Stochastic Chart */}
        {activeIndicators.stochastic && (
          <div ref={stochasticChartRef} className="w-full" style={{ height: chartHeights.stochastic }}></div>
        )}
        
        {/* ATR Chart */}
        {activeIndicators.atr && (
          <div ref={atrChartRef} className="w-full" style={{ height: chartHeights.atr }}></div>
        )}
      </div>

      {/* Debug Info */}
      {debug && (
        <div className="p-2 bg-gray-100 dark:bg-gray-900 text-xs">
          <div>Data Points: {validatedData.length}</div>
          <div>Is Live: {isLive ? 'Yes' : 'No'}</div>
          <div>Connected: {isConnected ? 'Yes' : 'No'}</div>
          <div>Last Update: {new Date(lastUpdate).toLocaleTimeString()}</div>
          <div>Validation Errors: {validationResult.errors.length}</div>
          <div>Validation Warnings: {validationResult.warnings.length}</div>
        </div>
      )}
    </div>
  );
});

// ===== WRAPPER COMPONENT =====

const LiveEnhancedMultiPaneChart = React.forwardRef<any, LiveEnhancedMultiPaneChartProps>((props, ref) => {
  return (
    <LiveChartProvider
      token={props.token}
      timeframe={props.timeframe}
      autoConnect={props.autoConnect}
      maxDataPoints={props.maxDataPoints}
      updateInterval={props.updateInterval}
    >
      <LiveChartComponent {...props} ref={ref} />
    </LiveChartProvider>
  );
});

LiveEnhancedMultiPaneChart.displayName = 'LiveEnhancedMultiPaneChart';

export default LiveEnhancedMultiPaneChart; 