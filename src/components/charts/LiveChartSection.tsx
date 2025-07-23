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

const LiveChartSection = React.forwardRef<any, LiveChartSectionProps>(({
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
  const candleSeriesRef = useRef<ISeriesApi<CandlestickData> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<HistogramData> | null>(null);
  const rsiSeriesRef = useRef<ISeriesApi<LineData> | null>(null);
  const macdSeriesRef = useRef<ISeriesApi<LineData> | null>(null);
  const macdSignalSeriesRef = useRef<ISeriesApi<LineData> | null>(null);
  const macdHistogramSeriesRef = useRef<ISeriesApi<HistogramData> | null>(null);
  
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
      
      const data = await apiService.getHistoricalData(symbol, timeframe, 'NSE', 1000);
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
  const initializeWebSocket = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
    }

    try {
      const token = localStorage.getItem('jwt_token');
      const wsUrl = token 
        ? `ws://localhost:8000/ws/stream?token=${token}`
        : 'ws://localhost:8000/ws/stream';
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setIsLive(true);
        
        // Subscribe to symbol data
        ws.send(JSON.stringify({
          action: 'subscribe',
          symbol: symbol,
          interval: selectedTimeframe
        }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
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
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        setIsLive(false);
        
        // Attempt to reconnect after 5 seconds
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        reconnectTimeoutRef.current = setTimeout(() => {
          initializeWebSocket();
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
  }, [symbol, selectedTimeframe]);

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
          if (selectedTimeframe === '1day') {
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

  // Update chart data
  const updateChartData = useCallback(() => {
    if (!chartData.length) return;

    const isDark = theme === "dark";

    // Update candle data
    if (chartInstance.current && candleSeriesRef.current) {
      const candleData = chartData.map<CandlestickData>(d => ({
        time: d.time as UTCTimestamp,
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
      }));

      candleSeriesRef.current.setData(candleData);
    }

    // Update volume data
    if (showVolume && volumeInstance.current && volumeSeriesRef.current) {
      const volumeData = chartData.map<HistogramData>(d => ({
        time: d.time as UTCTimestamp,
        value: d.volume,
        color: d.close >= d.open ? 'rgba(38, 166, 154, 0.8)' : 'rgba(239, 83, 80, 0.8)',
      }));

      volumeSeriesRef.current.setData(volumeData);
    }

    // Update RSI data
    if (showIndicators && activeIndicators.rsi && rsiInstance.current && rsiSeriesRef.current && indicators.rsi) {
      const rsiData = chartData
        .map<LineData>((d, idx) => ({
          time: d.time as UTCTimestamp,
          value: indicators.rsi![idx],
        }))
        .filter(d => d.value !== null && !isNaN(d.value) && d.value >= 0 && d.value <= 100) as LineData[];

      rsiSeriesRef.current.setData(rsiData);
    }

    // Update MACD data
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

      macdSeriesRef.current.setData(macdData);
      macdSignalSeriesRef.current?.setData(signalData);
      macdHistogramSeriesRef.current?.setData(histogramData);
    }
  }, [chartData, theme, showVolume, showIndicators, activeIndicators, indicators]);

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

  // Handle timeframe change
  const handleTimeframeChange = useCallback((timeframe: string) => {
    setSelectedTimeframe(timeframe);
    loadHistoricalData(timeframe);
    
    // Update WebSocket subscription
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        action: 'subscribe',
        symbol: symbol,
        interval: timeframe
      }));
    }
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
    initializeWebSocket();
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [initializeWebSocket]);

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
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadHistoricalData(selectedTimeframe)}
                className="text-xs h-7"
                disabled={isLoading}
              >
                <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
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
        
        <div ref={containerRef} className="w-full h-full">
          {/* Main Chart */}
          <div ref={candleChartRef} className="w-full" style={{ height: chartHeights.candle }}></div>
          
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
  );
});

LiveChartSection.displayName = 'LiveChartSection';

export default LiveChartSection; 