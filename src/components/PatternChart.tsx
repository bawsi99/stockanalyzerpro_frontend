import React, { useEffect, useRef, useState } from 'react';
import { createChart, IChartApi, ISeriesApi, LineData, CandlestickData, SeriesType } from 'lightweight-charts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp, Loader2, AlertTriangle } from 'lucide-react';

interface HistoricalDataPoint {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface PatternOverlay {
  start_date?: string;
  end_date?: string;
  type: string;
  target_level?: number;
  stop_level?: number;
}

interface PatternData {
  triple_tops?: PatternOverlay[];
  triple_bottoms?: PatternOverlay[];
  wedge_patterns?: PatternOverlay[];
  channel_patterns?: PatternOverlay[];
  head_and_shoulders?: PatternOverlay[];
  inverse_head_and_shoulders?: PatternOverlay[];
  cup_and_handle?: PatternOverlay[];
}

interface PatternChartProps {
  data: HistoricalDataPoint[];
  patterns?: PatternData;
  symbol: string;
  height?: number;
  loading?: boolean;
  error?: string | null;
}

type ChartType = 'candlestick' | 'line';

// Pattern color mapping
const PATTERN_COLORS = {
  // Bullish patterns - Green
  triple_bottoms: '#22c55e',
  inverse_head_and_shoulders: '#16a34a', 
  cup_and_handle: '#15803d',
  
  // Bearish patterns - Red  
  triple_tops: '#ef4444',
  head_and_shoulders: '#dc2626',
  
  // Neutral patterns - Yellow/Purple
  wedge_patterns: '#eab308',
  channel_patterns: '#8b5cf6'
};

const PatternChart: React.FC<PatternChartProps> = ({ 
  data, 
  patterns, 
  symbol, 
  height = 400, 
  loading = false,
  error = null 
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<SeriesType> | null>(null);
  const [chartType, setChartType] = useState<ChartType>('candlestick');

  // Convert timestamp to lightweight-charts compatible format
  const formatTimeForChart = (timestamp: number): number => {
    return timestamp;
  };

  // Parse date string to timestamp
  const parseDateToTimestamp = (dateString: string): number => {
    try {
      return Math.floor(new Date(dateString).getTime() / 1000);
    } catch {
      return 0;
    }
  };

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current || loading || error || !data || data.length === 0) {
      return;
    }

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height,
      layout: {
        background: { color: '#ffffff' },
        textColor: '#333333',
      },
      grid: {
        vertLines: { color: '#f0f0f0' },
        horzLines: { color: '#f0f0f0' },
      },
      crosshair: {
        mode: 1,
      },
      rightPriceScale: {
        borderColor: '#cccccc',
      },
      timeScale: {
        borderColor: '#cccccc',
        timeVisible: true,
        secondsVisible: false,
      },
    });

    chartRef.current = chart;

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, [height, loading, error, data]);

  // Update chart data and type
  useEffect(() => {
    if (!chartRef.current || !data || data.length === 0) {
      return;
    }

    // Remove existing series
    if (seriesRef.current) {
      chartRef.current.removeSeries(seriesRef.current);
    }

    // Prepare data
    const chartData = data
      .map(point => ({
        time: formatTimeForChart(point.time),
        open: point.open,
        high: point.high,
        low: point.low,
        close: point.close,
        value: point.close // For line chart
      }))
      .sort((a, b) => a.time - b.time);

    // Create appropriate series based on chart type
    if (chartType === 'candlestick') {
      const candlestickSeries = chartRef.current.addCandlestickSeries({
        upColor: '#22c55e',
        downColor: '#ef4444',
        borderUpColor: '#22c55e',
        borderDownColor: '#ef4444',
        wickUpColor: '#22c55e',
        wickDownColor: '#ef4444',
      });
      
      candlestickSeries.setData(chartData as CandlestickData[]);
      seriesRef.current = candlestickSeries;
    } else {
      const lineSeries = chartRef.current.addLineSeries({
        color: '#3b82f6',
        lineWidth: 2,
      });
      
      const lineData: LineData[] = chartData.map(d => ({
        time: d.time,
        value: d.value
      }));
      
      lineSeries.setData(lineData);
      seriesRef.current = lineSeries;
    }

    // Fit content
    chartRef.current.timeScale().fitContent();

  }, [chartType, data]);

  // Add pattern overlays
  useEffect(() => {
    if (!chartRef.current || !patterns || !data || data.length === 0) {
      return;
    }

    // Debug logging
    console.log('[PatternChart] Adding pattern overlays:', {
      patternTypes: Object.keys(patterns),
      patternCounts: Object.fromEntries(
        Object.entries(patterns).map(([key, value]) => [key, value?.length || 0])
      )
    });

    // Collect all pattern markers first
    const allMarkers: any[] = [];

    // Add pattern markers
    Object.entries(patterns).forEach(([patternType, patternList]) => {
      if (!patternList || patternList.length === 0) return;

      const color = PATTERN_COLORS[patternType as keyof typeof PATTERN_COLORS] || '#6b7280';

      patternList.forEach((pattern, index) => {
        if (!pattern.start_date || !pattern.end_date) return;

        const startTime = parseDateToTimestamp(pattern.start_date);
        const endTime = parseDateToTimestamp(pattern.end_date);

        if (startTime === 0 || endTime === 0) return;

        // Add markers for pattern start and end
        const patternName = patternType.replace(/_/g, ' ');
        const patternDisplayName = patternName.charAt(0).toUpperCase() + patternName.slice(1);
        
        allMarkers.push(
          {
            time: startTime,
            position: 'belowBar' as const,
            color,
            shape: 'arrowUp' as const,
            text: `${patternDisplayName} ${index + 1} Start`,
            id: `${patternType}_${index}_start`
          },
          {
            time: endTime,
            position: 'aboveBar' as const,
            color,
            shape: 'arrowDown' as const,
            text: `${patternDisplayName} ${index + 1} End`,
            id: `${patternType}_${index}_end`
          }
        );
      });
    });

    // Set all markers at once
    if (seriesRef.current && allMarkers.length > 0) {
      // Sort markers by time to ensure proper display
      allMarkers.sort((a, b) => a.time - b.time);
      seriesRef.current.setMarkers(allMarkers);
    }

    // Add pattern lines/shapes
    Object.entries(patterns).forEach(([patternType, patternList]) => {
      if (!patternList || patternList.length === 0) return;

      const color = PATTERN_COLORS[patternType as keyof typeof PATTERN_COLORS] || '#6b7280';

      patternList.forEach((pattern, index) => {
        if (!pattern.start_date || !pattern.end_date) return;

        const startTime = parseDateToTimestamp(pattern.start_date);
        const endTime = parseDateToTimestamp(pattern.end_date);

        if (startTime === 0 || endTime === 0) return;

        // Add horizontal line for pattern duration
        const lineSeries = chartRef.current!.addLineSeries({
          color: color,
          lineWidth: 2,
          lineStyle: 2, // Dashed line
          lineType: 0, // Simple line
        });

        // Find price data for pattern timeframe to draw appropriate level
        const patternData = data.filter(d => d.time >= startTime && d.time <= endTime);
        if (patternData.length > 0) {
          const avgPrice = patternData.reduce((sum, d) => sum + d.close, 0) / patternData.length;
          
          // Draw horizontal line at average price level
          const lineData: LineData[] = [
            { time: startTime, value: avgPrice },
            { time: endTime, value: avgPrice }
          ];
          
          lineSeries.setData(lineData);
        }
      });
    });
  }, [patterns, data, chartType]);

  // Show loading state
  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Pattern Chart - {symbol}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center" style={{ height }}>
            <div className="flex items-center space-x-2">
              <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
              <span className="text-slate-600">Loading chart data...</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show error state
  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Pattern Chart - {symbol}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center" style={{ height }}>
            <div className="flex items-center space-x-2 text-red-600">
              <AlertTriangle className="h-6 w-6" />
              <span>{error}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show empty state
  if (!data || data.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Pattern Chart - {symbol}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center" style={{ height }}>
            <span className="text-slate-500">No chart data available</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Pattern Chart - {symbol}</span>
          </CardTitle>
          
          {/* Chart Type Toggle */}
          <div className="flex items-center space-x-2">
            <Button
              variant={chartType === 'candlestick' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChartType('candlestick')}
              className="flex items-center space-x-1"
            >
              <BarChart3 className="h-4 w-4" />
              <span>Candles</span>
            </Button>
            <Button
              variant={chartType === 'line' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChartType('line')}
              className="flex items-center space-x-1"
            >
              <TrendingUp className="h-4 w-4" />
              <span>Line</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Chart Container */}
        <div 
          ref={chartContainerRef} 
          style={{ height }}
          className="w-full border border-slate-200 rounded"
        />
        
        {/* Pattern Legend */}
        {patterns && Object.keys(patterns).length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-slate-700 mb-2">Detected Patterns</h4>
            <div className="flex flex-wrap gap-3">
              {Object.entries(patterns).map(([patternType, patternList]) => {
                if (!patternList || patternList.length === 0) return null;
                
                const color = PATTERN_COLORS[patternType as keyof typeof PATTERN_COLORS] || '#6b7280';
                const displayName = patternType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                
                // Calculate average quality for this pattern type
                const avgQuality = patternList.reduce((sum, p) => {
                  const quality = (p as any)?.quality_score || (p as any)?.confidence || 0;
                  return sum + quality;
                }, 0) / patternList.length;
                
                return (
                  <div key={patternType} className="flex items-center space-x-2 text-xs bg-slate-50 px-2 py-1 rounded">
                    <div 
                      className="w-3 h-3 rounded" 
                      style={{ backgroundColor: color }}
                    />
                    <div className="flex flex-col">
                      <span className="text-slate-700 font-medium">
                        {displayName}
                      </span>
                      <span className="text-slate-500">
                        {patternList.length} pattern{patternList.length !== 1 ? 's' : ''}
                        {avgQuality > 0 && ` • ${avgQuality.toFixed(0)}% avg quality`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PatternChart;