import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import {
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
} from "lightweight-charts";
import { ChartData } from "@/types/analysis";
import { 
  initializeChartWithRetry, 
  safeChartCleanup, 
  isChartContainerReady,
  type ChartContainer 
} from '@/utils/chartUtils';

interface MultiPaneChartProps {
  data: ChartData[];
  theme?: "light" | "dark";
  height?: number;
  timeframe?: string;
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
        rsi.push(100 - 100 / (1 + rs));
      } else {
        rsi.push(null);
      }
      continue;
    }

    gainSum = (gainSum * (period - 1) + gain) / period;
    lossSum = (lossSum * (period - 1) + loss) / period;
    const rs = lossSum === 0 ? 100 : gainSum / lossSum;
    rsi.push(100 - 100 / (1 + rs));
  }

  rsi.unshift(null);
  return rsi;
}

// ---- Component ---- //
const MultiPaneChart: React.FC<MultiPaneChartProps> = ({ 
  data, 
  theme = "light",
  height = 600,
  timeframe = "1d"
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const candleChartRef = useRef<HTMLDivElement>(null);
  const volumeChartRef = useRef<HTMLDivElement>(null);
  const rsiChartRef = useRef<HTMLDivElement>(null);
  
  const chartInstance = useRef<IChartApi | null>(null);
  const volumeInstance = useRef<IChartApi | null>(null);
  const rsiInstance = useRef<IChartApi | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartDimensions, setChartDimensions] = useState({ width: 0, height: 0 });

  // Calculate responsive heights
  const chartHeights = useMemo(() => {
    const totalHeight = height;
    const headerHeight = 44; // Chart header height
    const volumeHeight = Math.max(80, totalHeight * 0.15); // 15% of total height
    const rsiHeight = Math.max(100, totalHeight * 0.2); // 20% of total height
    const candleHeight = totalHeight - volumeHeight - rsiHeight - headerHeight;
    
    return {
      candle: Math.max(200, candleHeight),
      volume: volumeHeight,
      rsi: rsiHeight
    };
  }, [height]);

  // Validate data
  const validatedData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    return data.filter(d => 
      d && 
      typeof d === 'object' &&
      typeof d.date === 'string' &&
      !isNaN(new Date(d.date).getTime()) &&
      ['open', 'high', 'low', 'close', 'volume'].every(key => 
        typeof d[key] === 'number' && 
        Number.isFinite(d[key]) && 
        d[key] >= 0
      ) &&
      d.high >= d.low &&
      d.high >= d.open &&
      d.high >= d.close &&
      d.low <= d.open &&
      d.low <= d.close
    );
  }, [data]);

  // Calculate indicators
  const indicators = useMemo(() => {
    if (validatedData.length === 0) return { sma20: [], ema50: [], rsi14: [] };
    
    const closes = validatedData.map(d => d.close);
    return {
      sma20: calcSMA(closes, 20),
      ema50: calcEMA(closes, 50),
      rsi14: calcRSI(closes, 14)
    };
  }, [validatedData]);

  // Debounced resize handler
  const debouncedResize = useCallback(() => {
    let timeoutId: NodeJS.Timeout;
    return () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (containerRef.current) {
          const { width } = containerRef.current.getBoundingClientRect();
          setChartDimensions({ width, height });
        }
      }, 100);
    };
  }, [height]);

  // Cleanup charts
  const cleanupCharts = useCallback(() => {
    try {
      safeChartCleanup(chartInstance);
      safeChartCleanup(volumeInstance);
      safeChartCleanup(rsiInstance);
    } catch (error) {
      console.error('Error cleaning up charts:', error);
    }
  }, []);

  // Initialize charts
  const initializeCharts = useCallback(async () => {
    // Check if all containers are ready
    const containersReady = [
      isChartContainerReady(candleChartRef as ChartContainer),
      isChartContainerReady(volumeChartRef as ChartContainer),
      isChartContainerReady(rsiChartRef as ChartContainer)
    ].every(Boolean);

    if (!containersReady || validatedData.length === 0) {
      console.log('Chart initialization conditions not met:', {
        containersReady,
        dataLength: validatedData.length
      });
      return;
    }

    try {
      setError(null);
      setIsLoading(true);

      // Clear previous charts
      cleanupCharts();

      const isDark = theme === "dark";
      
      // Common chart options
      const commonOptions = {
        layout: {
          background: { type: ColorType.Solid, color: isDark ? "#0f172a" : "#ffffff" },
          textColor: isDark ? "#e2e8f0" : "#1e293b",
          fontSize: 12,
          fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          attributionLogo: false
        },
        rightPriceScale: {
          borderColor: isDark ? "#334155" : "#e2e8f0",
          scaleMargins: { top: 0.1, bottom: 0.2 },
          autoScale: true,
          entireTextOnly: true,
        },
        leftPriceScale: {
          visible: true,
          borderColor: isDark ? "#334155" : "#e2e8f0",
          scaleMargins: { top: 0.1, bottom: 0.2 },
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
          axisDoubleClickReset: true,
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
            // Format to exactly 7 characters total for consistent alignment (e.g., " 123.45")
            const formatted = price >= 1 ? price.toFixed(2) : price.toPrecision(4);
            return formatted.padStart(7, ' ');
          },
        },
      };

      // Create main candlestick chart
      const candleChart = await initializeChartWithRetry(
        candleChartRef as ChartContainer,
        { 
          width: chartDimensions.width || candleChartRef.current!.clientWidth,
          height: chartHeights.candle,
          theme,
          timeframe,
          debug: true
        },
        {
          ...commonOptions,
          width: chartDimensions.width || candleChartRef.current!.clientWidth,
          height: chartHeights.candle,
          layout: {
            ...commonOptions.layout,
            textColor: isDark ? "#e2e8f0" : "#1e293b",
          },
          grid: {
            ...commonOptions.grid,
            vertLines: { ...commonOptions.grid.vertLines, visible: false },
          },
        }
      );
      chartInstance.current = candleChart;

      // Create volume chart
      const volumeChart = await initializeChartWithRetry(
        volumeChartRef as ChartContainer,
        { 
          width: chartDimensions.width || volumeChartRef.current!.clientWidth,
          height: chartHeights.volume,
          theme,
          timeframe,
          debug: true
        },
        {
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
          scaleMargins: { top: 0.05, bottom: 0.05 },
          borderColor: isDark ? "#334155" : "#e2e8f0",
          entireTextOnly: true,
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
            // Format volume to 7 characters total for consistent alignment (e.g., " 40.0M")
            if (price >= 1000000) {
              return `${(price / 1000000).toFixed(1)}M`.padStart(7, ' ');
            } else if (price >= 1000) {
              return `${(price / 1000).toFixed(1)}K`.padStart(7, ' ');
            } else {
              return `${price.toFixed(1)}`.padStart(7, ' ');
            }
          },
        },
      );
      volumeInstance.current = volumeChart;

      // Create RSI chart
      const rsiChart = await initializeChartWithRetry(
        rsiChartRef as ChartContainer,
        { 
          width: chartDimensions.width || rsiChartRef.current!.clientWidth,
          height: chartHeights.rsi,
          theme,
          timeframe,
          debug: true
        },
        {
        ...commonOptions,
        width: chartDimensions.width || rsiChartRef.current.clientWidth,
        height: chartHeights.rsi,
        layout: {
          ...commonOptions.layout,
          textColor: isDark ? "#94a3b8" : "#64748b",
        },
        rightPriceScale: {
          ...commonOptions.rightPriceScale,
          scaleMargins: { top: 0.1, bottom: 0.1 },
        },
        localization: {
          priceFormatter: (price: number) => {
            // Format to exactly 7 characters total (e.g., "100.00")
            const formatted = price.toFixed(2);
            return formatted.padStart(7, ' ');
          },
        },
      );
      rsiInstance.current = rsiChart;

      // Synchronize time scales
      candleChart.timeScale().subscribeVisibleTimeRangeChange(() => {
        const timeRange = candleChart.timeScale().getVisibleRange();
        if (timeRange) {
          volumeChart.timeScale().setVisibleRange(timeRange);
          rsiChart.timeScale().setVisibleRange(timeRange);
        }
      });

      // Add series to charts
      const candleSeries = candleChart.addSeries(CandlestickSeries, {
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
      
      const rsiSeries = rsiChart.addSeries(LineSeries, {
        color: isDark ? '#f59e0b' : '#d97706',
        lineWidth: 2,
        priceScaleId: 'rsi',
        lastValueVisible: true,
        priceLineVisible: false,
        title: 'RSI (14)',
        priceLineWidth: 1,
        priceLineStyle: 2,
        crosshairMarkerVisible: true,
        crosshairMarkerRadius: 4,
        priceFormat: {
          type: 'price',
          precision: 2,
          minMove: 0.01,
        },
      });

      // Add indicator series
      const sma20Series = candleChart.addSeries(LineSeries, {
        color: isDark ? '#60a5fa' : '#2563eb',
        lineWidth: 2,
        lineStyle: 0,
        title: 'SMA 20',
        visible: true,
        lastValueVisible: true,
        priceLineVisible: true,
        priceLineWidth: 1,
        priceLineStyle: 2,
        crosshairMarkerVisible: false,
        priceFormat: {
          type: 'price',
          precision: 2,
          minMove: 0.01,
        },
      });
      
      const ema50Series = candleChart.addSeries(LineSeries, {
        color: isDark ? '#f472b6' : '#db2777',
        lineWidth: 2,
        lineStyle: 0,
        title: 'EMA 50',
        visible: true,
        lastValueVisible: true,
        priceLineVisible: true,
        priceLineWidth: 1,
        priceLineStyle: 2,
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

      const sma20Data = validatedData
        .map<LineData>((d, idx) => ({
          time: toTimestamp(d.date),
          value: indicators.sma20[idx],
        }))
        .filter(d => d.value !== null) as LineData[];

      const ema50Data = validatedData
        .map<LineData>((d, idx) => ({
          time: toTimestamp(d.date),
          value: indicators.ema50[idx],
        }))
        .filter(d => d.value !== null) as LineData[];

      // Set data
      candleSeries.setData(candleData);
      volumeSeries.setData(volumeData);
      rsiSeries.setData(rsiData);
      sma20Series.setData(sma20Data);
      ema50Series.setData(ema50Data);

      // Add RSI reference lines
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
      
      rsiSeries.createPriceLine({
        price: 50,
        color: isDark ? '#94a3b8' : '#64748b',
        lineWidth: 1,
        lineStyle: 0,
        axisLabelVisible: false,
      });

      setIsLoading(false);
    } catch (error) {
      console.error('Error initializing charts:', error);
      setError('Failed to initialize charts');
      setIsLoading(false);
    }
  }, [validatedData, theme, chartDimensions.width, chartHeights, indicators]);

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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupCharts();
    };
  }, [cleanupCharts]);

  // Handle chart resize
  useEffect(() => {
    if (chartDimensions.width > 0) {
      chartInstance.current?.applyOptions({ width: chartDimensions.width });
      volumeInstance.current?.applyOptions({ width: chartDimensions.width });
      rsiInstance.current?.applyOptions({ width: chartDimensions.width });
    }
  }, [chartDimensions.width]);

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-red-50 dark:bg-red-900/20 rounded-lg">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 border-4 border-red-200 dark:border-red-600 border-t-red-500 dark:border-t-red-400 rounded-full animate-spin mx-auto"></div>
          <p className="text-red-600 dark:text-red-400 text-sm font-medium">Chart Error</p>
          <p className="text-red-500 dark:text-red-300 text-xs">{error}</p>
        </div>
      </div>
    );
  }

  if (validatedData.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-50 dark:bg-slate-800/50 rounded-lg">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 border-4 border-slate-200 dark:border-slate-600 border-t-blue-500 dark:border-t-blue-400 rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
            {isLoading ? 'Loading chart data...' : 'No valid data available'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full h-full flex flex-col gap-2 p-2 bg-white dark:bg-slate-900 rounded-xl">
      <div className="flex flex-col space-y-2 w-full h-full">
        {/* Candlestick Chart */}
        <div className="relative rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-900 flex-1">
          <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200">Price Chart</h3>
            <div className="flex space-x-4 mt-1 text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-blue-500 mr-1"></div>
                <span>SMA 20</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-pink-500 mr-1"></div>
                <span>EMA 50</span>
              </div>
            </div>
          </div>
          <div ref={candleChartRef} className="w-full" style={{ height: `${chartHeights.candle}px` }} />
        </div>

        {/* Volume Chart */}
        <div className="relative rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-900">
          <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200">Volume</h3>
          </div>
          <div ref={volumeChartRef} className="w-full" style={{ height: `${chartHeights.volume}px` }} />
        </div>

        {/* RSI Chart */}
        <div className="relative rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-900">
          <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200">RSI (14)</h3>
            <div className="flex space-x-4 mt-1 text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-red-500 mr-1"></div>
                <span>Overbought (70)</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-green-500 mr-1"></div>
                <span>Oversold (30)</span>
              </div>
            </div>
          </div>
          <div ref={rsiChartRef} className="w-full" style={{ height: `${chartHeights.rsi}px` }} />
        </div>
      </div>
    </div>
  );
};

export default MultiPaneChart;
