/**
 * @deprecated This component has been archived and is no longer in use.
 * The live chart section functionality has been integrated into the unified Charts page.
 * See: frontend/src/pages/Charts.tsx for the current implementation.
 * 
 * Archived on: 2024-07-25
 * Reason: Consolidated into unified chart system
 */

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
} from "lightweight-charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { 
  BarChart3, 
  Clock, 
  TrendingUp, 
  Activity, 
  Wifi, 
  WifiOff,
  RefreshCw,
  Settings,
  Eye,
  EyeOff
} from "lucide-react";

// API Service
import { apiService, CandleData, IndicatorData } from "@/services/api";
import { buildWebSocketUrl } from "@/utils/configUtils";

// Types
interface LiveChartSectionProps {
  symbol: string;
  theme?: "light" | "dark";
  height?: number;
  debug?: boolean;
  onDataLoaded?: (data: CandleData[]) => void;
  onError?: (error: string) => void;
  timeframe?: string;
}

// Timeframe options
const TIMEFRAME_OPTIONS = [
  { value: '1min', label: '1m', description: '1 Minute' },
  { value: '3min', label: '3m', description: '3 Minutes' },
  { value: '5min', label: '5m', description: '5 Minutes' },
  { value: '10min', label: '10m', description: '10 Minutes' },
  { value: '15min', label: '15m', description: '15 Minutes' },
  { value: '30min', label: '30m', description: '30 Minutes' },
  { value: '60min', label: '1h', description: '1 Hour' },
  { value: '1day', label: '1D', description: '1 Day' },
];

const LiveChartSection = React.forwardRef<HTMLDivElement, LiveChartSectionProps>(({
  symbol,
  theme = "light",
  height = 600,
  debug = false,
  onDataLoaded,
  onError
}, ref) => {
  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const candleChartRef = useRef<HTMLDivElement>(null);
  const volumeChartRef = useRef<HTMLDivElement>(null);
  const rsiChartRef = useRef<HTMLDivElement>(null);
  const macdChartRef = useRef<HTMLDivElement>(null);
  
  // Chart instances
  const chartInstance = useRef<IChartApi | null>(null);
  const volumeInstance = useRef<IChartApi | null>(null);
  const rsiInstance = useRef<IChartApi | null>(null);
  const macdInstance = useRef<IChartApi | null>(null);
  
  // Series refs
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const rsiSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const macdSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const macdSignalSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const macdHistogramSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  
  // State
  const [selectedTimeframe, setSelectedTimeframe] = useState('1day');
  const [chartData, setChartData] = useState<CandleData[]>([]);
  const [indicators, setIndicators] = useState<IndicatorData>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chartDimensions, setChartDimensions] = useState({ width: 0, height: 0 });
  const [activeIndicators, setActiveIndicators] = useState({
    rsi: true,
    macd: true,
    sma: false,
    ema: false,
    bollinger: false
  });
  const [showVolume, setShowVolume] = useState(true);
  const [showIndicators, setShowIndicators] = useState(true);
  const [latestTickPrice, setLatestTickPrice] = useState<number | null>(null);
  const [latestTickTime, setLatestTickTime] = useState<number | null>(null);
  
  // WebSocket ref
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Chart heights calculation
  const chartHeights = useMemo(() => {
    const totalHeight = height;
    const headerHeight = 60;
    const volumeHeight = showVolume ? Math.max(80, totalHeight * 0.15) : 0;
    const rsiHeight = (showIndicators && activeIndicators.rsi) ? Math.max(100, totalHeight * 0.2) : 0;
    const macdHeight = (showIndicators && activeIndicators.macd) ? Math.max(100, totalHeight * 0.15) : 0;
    
    const totalIndicatorHeight = rsiHeight + macdHeight;
    const mainChartHeight = totalHeight - volumeHeight - totalIndicatorHeight - headerHeight;
    
    return {
      candle: Math.max(200, mainChartHeight),
      volume: volumeHeight,
      rsi: rsiHeight,
      macd: macdHeight,
      totalHeight: totalHeight
    };
  }, [height, showVolume, showIndicators, activeIndicators]);

  // Load historical data
  const loadHistoricalData = useCallback(async (timeframe: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Loading historical data for:', symbol, timeframe);
      const data = await apiService.getHistoricalData(symbol, timeframe, 'NSE', 1000);
      console.log('Historical data loaded:', data.candles.length, 'candles');
      setChartData(data.candles);
      
      // Load indicators
      try {
        const indicatorData = await apiService.getIndicators(symbol, timeframe, 'NSE');
        setIndicators(indicatorData.indicators);
      } catch (indicatorError) {
        console.warn('Failed to load indicators:', indicatorError);
      }
      
      onDataLoaded?.(data.candles);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load data';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [symbol, onDataLoaded, onError]);

  // Initialize WebSocket connection
  const initializeWebSocket = useCallback(async () => {
    if (wsRef.current) {
      wsRef.current.close();
    }

    try {
      const token = localStorage.getItem('jwt_token');
      const wsUrl = buildWebSocketUrl(token || undefined);
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setIsLive(true);
        
        // Subscribe to symbol data - send symbol name instead of token
        ws.send(JSON.stringify({
          action: 'subscribe',
          symbols: [symbol], // Send symbol name, backend will convert to token
          timeframes: [selectedTimeframe]
        }));
      };

      ws.onmessage = handleWebSocketMessage;

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        setIsLive(false);
        
        // Attempt to reconnect after 5 seconds
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        reconnectTimeoutRef.current = setTimeout(() => {
          initializeWebSocket().catch(console.error);
        }, 5000);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
        setIsLive(false);
      };

    } catch (err) {
      console.error('Failed to initialize WebSocket:', err);
      setIsConnected(false);
      setIsLive(false);
    }
  }, [symbol]); // Remove selectedTimeframe from dependencies

  // Update WebSocket subscription when timeframe changes
  const updateWebSocketSubscription = useCallback(async () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      console.log('Updating WebSocket subscription for timeframe:', selectedTimeframe);
      
      wsRef.current.send(JSON.stringify({
        action: 'subscribe',
        symbols: [symbol], // Send symbol name, backend will convert to token
        timeframes: [selectedTimeframe]
      }));
    }
  }, [symbol, selectedTimeframe]);

  // Initialize charts
  const initializeCharts = useCallback(() => {
    if (!containerRef.current || !candleChartRef.current) {
      console.log('Chart containers not ready:', { 
        container: !!containerRef.current, 
        candleChart: !!candleChartRef.current 
      });
      return;
    }

    console.log('Initializing charts with dimensions:', chartDimensions);
    console.log('Chart heights:', chartHeights);

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
            if (selectedTimeframe === '1day') {
              return date.toLocaleDateString('en-IN', { 
                timeZone: 'Asia/Kolkata',
                month: 'short', 
                day: 'numeric' 
              });
            } else if (selectedTimeframe === '1h' || selectedTimeframe === '60min' || selectedTimeframe === '60minute') {
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
          if (selectedTimeframe === '1day') {
            return utcDate.toLocaleDateString('en-IN', { 
              timeZone: 'Asia/Kolkata',
              day: '2-digit',
              month: '2-digit',
              year: 'numeric'
            });
          } else if (selectedTimeframe === '1h' || selectedTimeframe === '60min' || selectedTimeframe === '60minute') {
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

    // Create volume chart
    if (showVolume && volumeChartRef.current) {
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
            if (selectedTimeframe === '1day') {
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

    // Create RSI chart
    if (showIndicators && activeIndicators.rsi && rsiChartRef.current) {
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
            if (selectedTimeframe === '1day') {
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
    if (showIndicators && activeIndicators.macd && macdChartRef.current) {
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
            if (selectedTimeframe === '1day') {
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
  }, [theme, chartDimensions, chartHeights, showVolume, showIndicators, activeIndicators]);

  // Update chart data - FIXED VERSION
  const updateChartData = useCallback(() => {
    console.log('updateChartData called with:', chartData.length, 'candles');
    if (!chartData.length) {
      console.log('No chart data to update');
      return;
    }

    const isDark = theme === "dark";

    // Update candle data - Use update() for real-time updates, setData() only for initial load
    if (chartInstance.current && candleSeriesRef.current) {
      const candleData = chartData.map<CandlestickData>(d => ({
        time: d.time as UTCTimestamp,
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
      }));

      // Only use setData() for initial load, use update() for real-time updates
      if (chartData.length === 1) {
        // Initial data load
        candleSeriesRef.current.setData(candleData);
      } else {
        // Real-time updates - update only the last candle
        const lastCandle = candleData[candleData.length - 1];
        if (lastCandle && typeof lastCandle.time === 'number') {
          try {
            // Temporarily disable real-time updates to prevent chart errors
            // candleSeriesRef.current.update(lastCandle);
            console.log('Tick update received:', lastCandle);
          } catch (error) {
            console.warn('Failed to update candle data:', error);
          }
        }
      }
    }

    // Update volume data - Only update if volume series exists
    if (showVolume && volumeInstance.current && volumeSeriesRef.current) {
      const volumeData = chartData.map<HistogramData>(d => ({
        time: d.time as UTCTimestamp,
        value: d.volume,
        color: d.close >= d.open ? 'rgba(38, 166, 154, 0.8)' : 'rgba(239, 83, 80, 0.8)',
      }));

      // Only update volume on initial load or when volume changes significantly
      if (chartData.length === 1) {
        volumeSeriesRef.current.setData(volumeData);
      } else {
        const lastVolume = volumeData[volumeData.length - 1];
        if (lastVolume && typeof lastVolume.time === 'number') {
          try {
            // Temporarily disable real-time volume updates to prevent chart errors
            // volumeSeriesRef.current.update(lastVolume);
            console.log('Volume update received:', lastVolume);
          } catch (error) {
            console.warn('Failed to update volume data:', error);
          }
        }
      }
    }

    // Update indicators - Only update when indicators change significantly
    if (showIndicators && activeIndicators.rsi && rsiInstance.current && rsiSeriesRef.current && indicators.rsi) {
      const rsiData = chartData
        .map<LineData>((d, idx) => ({
          time: d.time as UTCTimestamp,
          value: indicators.rsi![idx],
        }))
        .filter(d => d.value !== null && !isNaN(d.value) && d.value >= 0 && d.value <= 100) as LineData[];

      // Only update RSI on initial load
      if (chartData.length === 1) {
        rsiSeriesRef.current.setData(rsiData);
      }
    }

    // Update MACD data - Only update on initial load
    if (showIndicators && activeIndicators.macd && macdInstance.current && macdSeriesRef.current && indicators.macd) {
      const macdData = chartData
        .map<LineData>((d, idx) => ({
          time: d.time as UTCTimestamp,
          value: indicators.macd!.macd[idx],
        }))
        .filter(d => d.value !== null && !isNaN(d.value)) as LineData[];

      const signalData = chartData
        .map<LineData>((d, idx) => ({
          time: d.time as UTCTimestamp,
          value: indicators.macd!.signal[idx],
        }))
        .filter(d => d.value !== null && !isNaN(d.value)) as LineData[];

      const histogramData = chartData
        .map<HistogramData>((d, idx) => ({
          time: d.time as UTCTimestamp,
          value: indicators.macd!.histogram[idx],
          color: indicators.macd!.histogram[idx] >= 0 ? 'rgba(38, 166, 154, 0.8)' : 'rgba(239, 83, 80, 0.8)',
        }))
        .filter(d => d.value !== null && !isNaN(d.value)) as HistogramData[];

      // Only update MACD on initial load
      if (chartData.length === 1) {
        macdSeriesRef.current.setData(macdData);
        macdSignalSeriesRef.current?.setData(signalData);
        macdHistogramSeriesRef.current?.setData(histogramData);
      }
    }
  }, [chartData, theme, showVolume, showIndicators, activeIndicators, indicators]);

  // Fix tick data handling
  const handleTickUpdate = useCallback((tickData: { price: number }) => {
    if (!chartInstance.current || !candleSeriesRef.current) return;

    // Update the last candle with tick data
    const lastCandle = chartData[chartData.length - 1];
    if (lastCandle && typeof lastCandle.time === 'number') {
      const updatedCandle: CandlestickData = {
        time: lastCandle.time as UTCTimestamp,
        open: lastCandle.open,
        high: Math.max(lastCandle.high, tickData.price),
        low: Math.min(lastCandle.low, tickData.price),
        close: tickData.price,
      };

      // Use update() to preserve chart state (zoom, pan, crosshair)
      candleSeriesRef.current.update(updatedCandle);
      
      // Update the chart data state
      setChartData(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          ...lastCandle,
          close: tickData.price,
          high: Math.max(lastCandle.high, tickData.price),
          low: Math.min(lastCandle.low, tickData.price)
        };
        return updated;
      });
    }
  }, [chartData]);

  // Update WebSocket message handler
  const handleWebSocketMessage = useCallback((event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data);
      console.log('WebSocket message received:', data);
      
      if (data.type === 'candle' && data.token === symbol) {
        // Update chart with new candle
        const newCandle: CandleData = {
          time: data.data.start,
          open: data.data.open,
          high: data.data.high,
          low: data.data.low,
          close: data.data.close,
          volume: data.data.volume
        };
        
        setChartData(prev => {
          const updated = [...prev];
          const existingIndex = updated.findIndex(c => c.time === newCandle.time);
          
          if (existingIndex >= 0) {
            updated[existingIndex] = newCandle;
          } else {
            updated.push(newCandle);
          }
          
          // Keep only last 1000 candles
          return updated.slice(-1000);
        });
      } else if (data.type === 'tick' && data.token === symbol) {
        // Handle tick data for real-time price updates
        console.log('Tick data received:', data);
        setLatestTickPrice(data.price);
        setLatestTickTime(data.timestamp);
        
        // Use the new tick update handler with error handling
        try {
          handleTickUpdate(data);
        } catch (error) {
          console.warn('Error handling tick update:', error);
        }
      }
    } catch (err) {
      console.error('Error parsing WebSocket message:', err);
    }
  }, [symbol, handleTickUpdate]);

  // Add series to charts
  useEffect(() => {
    if (!chartInstance.current) return;

    const isDark = theme === "dark";

    // Add candle series
    if (!candleSeriesRef.current) {
      candleSeriesRef.current = chartInstance.current.addCandlestickSeries({
        upColor: isDark ? '#26a69a' : '#26a69a',
        downColor: isDark ? '#ef5350' : '#ef5350',
        borderVisible: false,
        wickUpColor: isDark ? '#26a69a' : '#26a69a',
        wickDownColor: isDark ? '#ef5350' : '#ef5350',
      });


    }

    // Add volume series
    if (showVolume && volumeInstance.current && !volumeSeriesRef.current) {
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
    if (showIndicators && activeIndicators.rsi && rsiInstance.current && !rsiSeriesRef.current) {
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
        { time: chartData[0]?.time as UTCTimestamp || 0, value: 70 },
        { time: chartData[chartData.length - 1]?.time as UTCTimestamp || 0, value: 70 },
      ]);

      rsiInstance.current.addLineSeries({
        color: isDark ? '#ff9800' : '#ff9800',
        lineWidth: 1,
        lineStyle: 2,
        title: 'Oversold',
      }).setData([
        { time: chartData[0]?.time as UTCTimestamp || 0, value: 30 },
        { time: chartData[chartData.length - 1]?.time as UTCTimestamp || 0, value: 30 },
      ]);
    }

    // Add MACD series
    if (showIndicators && activeIndicators.macd && macdInstance.current && !macdSeriesRef.current) {
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
  }, [theme, showVolume, showIndicators, activeIndicators, chartData]);

  // Add tooltip subscription when chart is ready
  useEffect(() => {
    if (!chartInstance.current || !candleSeriesRef.current) return;

    console.log('Setting up tooltip subscription for live chart section');

    // Enhanced candlestick tooltip for live chart section
    const unsubscribe = chartInstance.current.subscribeCrosshairMove((param) => {
      const tooltip = document.getElementById('candlestick-tooltip');
      if (!tooltip) return;
      
      if (param.time && param.seriesData) {
        const candleDataPoint = param.seriesData.get(candleSeriesRef.current);
        
        if (candleDataPoint) {
          const timeIndex = chartData.findIndex(d => d.time === param.time);
          if (timeIndex !== -1) {
            const dataPoint = chartData[timeIndex];
            const date = new Date(dataPoint.time * 1000);
            
            // Format date based on timeframe
            let dateStr = '';
            if (selectedTimeframe === '1d') {
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
            
            // Create tooltip content
            tooltip.innerHTML = `
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
              </div>
            `;
            
            // Position tooltip
            const chartRect = chartInstance.current?.getElement()?.getBoundingClientRect();
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
  }, [chartInstance.current, candleSeriesRef.current, chartData, selectedTimeframe]);

  // Add real-time price display
  const renderRealTimePrice = () => {
    if (!latestTickPrice) return null;
    
    const priceChange = chartData.length > 1 
      ? latestTickPrice - chartData[chartData.length - 2].close 
      : 0;
    const priceChangePercent = chartData.length > 1 
      ? (priceChange / chartData[chartData.length - 2].close) * 100 
      : 0;
    
    return (
      <div className="absolute top-4 right-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-3 z-20">
        <div className="text-sm text-gray-500 dark:text-gray-400">Live Price</div>
        <div className="text-xl font-bold text-gray-900 dark:text-white">
          ₹{latestTickPrice.toFixed(2)}
        </div>
        <div className={`text-sm font-medium ${priceChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)} ({priceChangePercent >= 0 ? '+' : ''}{priceChangePercent.toFixed(2)}%)
        </div>
        {latestTickTime && (
          <div className="text-xs text-gray-400 mt-1">
            {new Date(latestTickTime * 1000).toLocaleTimeString()}
          </div>
        )}
      </div>
    );
  };

  // Handle timeframe change
  const handleTimeframeChange = useCallback(async (timeframe: string) => {
    setSelectedTimeframe(timeframe);
    
    // Clear cache for the new interval to ensure fresh data
    try {
      await apiService.clearIntervalCache(symbol, timeframe);
    } catch (error) {
      console.warn('Failed to clear interval cache:', error);
    }
    
    loadHistoricalData(timeframe);
  }, [symbol, loadHistoricalData]);

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

  // Initialize charts on mount
  useEffect(() => {
    initializeCharts();
  }, [initializeCharts]);

  // Update chart data when data changes
  useEffect(() => {
    updateChartData();
  }, [updateChartData]);

  // Load initial data
  useEffect(() => {
    loadHistoricalData(selectedTimeframe);
  }, [loadHistoricalData, selectedTimeframe]);

  // Initialize WebSocket on mount
  useEffect(() => {
    initializeWebSocket().catch(console.error);
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [initializeWebSocket]);

  // Update subscription when timeframe changes
  useEffect(() => {
    updateWebSocketSubscription().catch(console.error);
  }, [updateWebSocketSubscription]);

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
    changeTimeframe: handleTimeframeChange,
    reloadData: () => loadHistoricalData(selectedTimeframe),
  }));

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
        `}
      </style>
      <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
      <CardHeader className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <CardTitle className="flex items-center text-slate-800">
              <BarChart3 className="h-5 w-5 mr-2 text-blue-500" />
              Live Chart - {symbol}
            </CardTitle>
            
            {/* Connection Status */}
            <div className="flex items-center space-x-2">
              {isConnected ? (
                <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                  <Wifi className="h-3 w-3 mr-1" />
                  Connected
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <WifiOff className="h-3 w-3 mr-1" />
                  Disconnected
                </Badge>
              )}
              
              {isLive && (
                <Badge variant="default" className="bg-red-100 text-red-800 border-red-200">
                  <Activity className="h-3 w-3 mr-1" />
                  LIVE
                </Badge>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Timeframe Controls */}
            <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              {TIMEFRAME_OPTIONS.map((option) => (
                <Button
                  key={option.value}
                  variant={selectedTimeframe === option.value ? "default" : "ghost"}
                  size="sm"
                  onClick={() => handleTimeframeChange(option.value)}
                  className="text-xs h-7 px-2"
                  disabled={isLoading}
                >
                  {option.label}
                </Button>
              ))}
            </div>
            
            {/* Chart Controls */}
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowVolume(!showVolume)}
                className="text-xs h-7"
              >
                {showVolume ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                Volume
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowIndicators(!showIndicators)}
                className="text-xs h-7"
              >
                {showIndicators ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                Indicators
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-hidden p-0">
        {error && (
          <Alert variant="destructive" className="m-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {isLoading && (
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-500" />
              <p className="text-sm text-gray-600">Loading chart data...</p>
            </div>
          </div>
        )}
        
        <div ref={containerRef} className="w-full h-full relative">
          {/* Real-time Price Display */}
          {renderRealTimePrice()}
          
          {/* Debug Info */}
          <div className="p-2 bg-yellow-100 text-xs">
            <div>Container Dimensions: {chartDimensions.width} x {chartDimensions.height}</div>
            <div>Chart Heights: {JSON.stringify(chartHeights)}</div>
            <div>Data Points: {chartData.length}</div>
            <div>Is Loading: {isLoading ? 'Yes' : 'No'}</div>
          </div>
          
          {/* Main Chart */}
          <div ref={candleChartRef} className="w-full border-2 border-red-500" style={{ height: chartHeights.candle }}></div>
          <div id="candlestick-tooltip" className="absolute hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-3 pointer-events-none z-30 min-w-[160px]" />
          
          {/* Volume Chart */}
          {showVolume && (
            <div ref={volumeChartRef} className="w-full" style={{ height: chartHeights.volume }}></div>
          )}
          
          {/* RSI Chart */}
          {showIndicators && activeIndicators.rsi && (
            <div ref={rsiChartRef} className="w-full" style={{ height: chartHeights.rsi }}></div>
          )}
          
          {/* MACD Chart */}
          {showIndicators && activeIndicators.macd && (
            <div ref={macdChartRef} className="w-full" style={{ height: chartHeights.macd }}></div>
          )}
        </div>
        
        {/* Debug Info */}
        {debug && (
          <div className="p-4 bg-gray-100 dark:bg-gray-900 text-xs">
            <div>Data Points: {chartData.length}</div>
            <div>Timeframe: {selectedTimeframe}</div>
            <div>Is Live: {isLive ? 'Yes' : 'No'}</div>
            <div>Connected: {isConnected ? 'Yes' : 'No'}</div>
            <div>Last Update: {new Date().toLocaleTimeString()}</div>
          </div>
        )}
      </CardContent>
    </Card>
    </>
  );
});

LiveChartSection.displayName = 'LiveChartSection';

export default LiveChartSection; 