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

interface PeakLowPoint {
  index?: number;
  price: number;
  date?: string;
}

interface PatternOverlay {
  start_date?: string;
  end_date?: string;
  type: string;
  target_level?: number;
  stop_level?: number;
  // Triple top/bottom specific fields
  peaks?: PeakLowPoint[];  // For triple tops: array of 3 peaks
  lows?: PeakLowPoint[];   // For triple bottoms: array of 3 lows
  valleys?: Array<{ price: number; ratio?: number }>;  // For triple tops
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
  // Bullish patterns - Green (requested color swap applied)
  triple_bottoms: '#ef4444',
  inverse_head_and_shoulders: '#16a34a', 
  cup_and_handle: '#15803d',
  
  // Bearish patterns - Red (requested color swap applied)
  triple_tops: '#22c55e',
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

    // Collect all pattern markers first (including triple pattern peaks/lows)
    const allMarkers: any[] = [];

    // Helper function to add markers for triple pattern peaks/lows and support/resistance levels
    const addTriplePatternMarkers = (patternType: string, pattern: PatternOverlay, index: number, color: string) => {
      const startTime = parseDateToTimestamp(pattern.start_date || '');
      const endTime = parseDateToTimestamp(pattern.end_date || '');
      
      if (startTime === 0 || endTime === 0) return;

      if (patternType === 'triple_tops' && pattern.peaks && pattern.peaks.length >= 3) {
        pattern.peaks.forEach((peak: PeakLowPoint, peakIndex: number) => {
          let peakTime: number = 0;
          if (peak.date) {
            peakTime = parseDateToTimestamp(peak.date);
          } else if (peak.index !== undefined && peak.index >= 0 && peak.index < data.length) {
            peakTime = data[peak.index].time;
          } else if (peak.index !== undefined) {
            if (startTime > 0 && endTime > 0) {
              const progress = Math.max(0, Math.min(1, peak.index / Math.max(1, data.length - 1)));
              peakTime = startTime + (endTime - startTime) * progress;
            }
          }
          
          if (peakTime > 0) {
            allMarkers.push({
              time: peakTime,
              position: 'belowBar' as const,
              color: color,
              shape: 'circle' as const,
              text: `Peak ${peakIndex + 1}: ${peak.price.toFixed(2)}`,
              size: 1,
              id: `${patternType}_${index}_peak_${peakIndex}`
            });
          }
        });

        // Add support level label marker
        if (pattern.support_level !== undefined && pattern.support_level !== null) {
          allMarkers.push({
            time: endTime,
            position: 'belowBar' as const,
            color: color,
            shape: 'square' as const,
            text: `Support: ${pattern.support_level.toFixed(2)}`,
            size: 1,
            id: `${patternType}_${index}_support_label`
          });
        }
      } else if (patternType === 'triple_bottoms' && pattern.lows && pattern.lows.length >= 3) {
        pattern.lows.forEach((low: PeakLowPoint, lowIndex: number) => {
          let lowTime: number = 0;
          if (low.date) {
            lowTime = parseDateToTimestamp(low.date);
          } else if (low.index !== undefined && low.index >= 0 && low.index < data.length) {
            lowTime = data[low.index].time;
          } else if (low.index !== undefined) {
            if (startTime > 0 && endTime > 0) {
              const progress = Math.max(0, Math.min(1, low.index / Math.max(1, data.length - 1)));
              lowTime = startTime + (endTime - startTime) * progress;
            }
          }
          
          if (lowTime > 0) {
            allMarkers.push({
              time: lowTime,
              position: 'aboveBar' as const,
              color: color,
              shape: 'circle' as const,
              text: `Low ${lowIndex + 1}: ${low.price.toFixed(2)}`,
              size: 1,
              id: `${patternType}_${index}_low_${lowIndex}`
            });
          }
        });

        // Add resistance level label marker
        const resistanceLevel = (pattern as any).resistance_level;
        if (resistanceLevel !== undefined && resistanceLevel !== null) {
          allMarkers.push({
            time: endTime,
            position: 'aboveBar' as const,
            color: color,
            shape: 'square' as const,
            text: `Resistance: ${resistanceLevel.toFixed(2)}`,
            size: 1,
            id: `${patternType}_${index}_resistance_label`
          });
        }
      }
    };

    // Add pattern markers (including triple pattern peaks/lows)
    Object.entries(patterns).forEach(([patternType, patternList]) => {
      if (!patternList || patternList.length === 0) return;

      const color = PATTERN_COLORS[patternType as keyof typeof PATTERN_COLORS] || '#6b7280';

      patternList.forEach((pattern, index) => {
        if (!pattern.start_date || !pattern.end_date) return;

        const startTime = parseDateToTimestamp(pattern.start_date);
        const endTime = parseDateToTimestamp(pattern.end_date);

        if (startTime === 0 || endTime === 0) return;

        // For triple patterns, add individual peak/low markers instead of start/end
        if ((patternType === 'triple_tops' && pattern.peaks && pattern.peaks.length >= 3) ||
            (patternType === 'triple_bottoms' && pattern.lows && pattern.lows.length >= 3)) {
          addTriplePatternMarkers(patternType, pattern, index, color);
        } else {
          // Add markers for pattern start and end (for non-triple patterns)
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
        }
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

        // Special handling for triple tops and triple bottoms
        if (patternType === 'triple_tops' && pattern.peaks && pattern.peaks.length >= 3) {
          // Draw lines connecting the 3 peaks for triple tops
          const peakTimes: number[] = [];
          const peakPrices: number[] = [];
          
          pattern.peaks.forEach((peak: PeakLowPoint) => {
            let peakTime: number = 0;
            if (peak.date) {
              peakTime = parseDateToTimestamp(peak.date);
            } else if (peak.index !== undefined && peak.index >= 0 && peak.index < data.length) {
              // Use the peak's index directly to get the time from data
              peakTime = data[peak.index].time;
            } else if (peak.index !== undefined) {
              // Fallback: interpolate between start and end times if index is out of bounds
              const progress = Math.max(0, Math.min(1, peak.index / Math.max(1, data.length - 1)));
              peakTime = startTime + (endTime - startTime) * progress;
            } else {
              return; // Skip if no date or index
            }
            
            if (peakTime > 0) {
              peakTimes.push(peakTime);
              peakPrices.push(peak.price);
            }
          });

          if (peakTimes.length >= 3 && peakPrices.length >= 3) {
            // Draw line connecting the 3 peaks
            const lineSeries = chartRef.current!.addLineSeries({
              color: color,
              lineWidth: 2,
              lineStyle: 0, // Solid line
              lineType: 0,
              priceLineVisible: false,
              lastValueVisible: false,
            });

            const lineData: LineData[] = peakTimes.map((time, i) => ({
              time,
              value: peakPrices[i]
            }));
            
            lineSeries.setData(lineData);

            // Draw support level line (horizontal dashed line at support_level)
            if (pattern.support_level !== undefined && pattern.support_level !== null) {
              const supportLineSeries = chartRef.current!.addLineSeries({
                color: color,
                lineWidth: 1.5,
                lineStyle: 2, // Dashed line
                lineType: 0,
                priceLineVisible: false,
                lastValueVisible: false,
              });

              const supportLineData: LineData[] = [
                { time: startTime, value: pattern.support_level },
                { time: endTime, value: pattern.support_level }
              ];
              
              supportLineSeries.setData(supportLineData);
            }

            // Optionally draw target level line (horizontal dotted line at target_level)
            if (pattern.target_level !== undefined && pattern.target_level !== null) {
              const targetLineSeries = chartRef.current!.addLineSeries({
                color: color,
                lineWidth: 1,
                lineStyle: 3, // Dotted line
                lineType: 0,
                priceLineVisible: false,
                lastValueVisible: false,
              });

              const targetLineData: LineData[] = [
                { time: endTime, value: pattern.target_level },
                { time: endTime + (endTime - startTime) * 0.5, value: pattern.target_level } // Extend target line forward
              ];
              
              targetLineSeries.setData(targetLineData);
            }
          }
        } else if (patternType === 'triple_bottoms' && pattern.lows && pattern.lows.length >= 3) {
          // Draw lines connecting the 3 lows for triple bottoms
          const lowTimes: number[] = [];
          const lowPrices: number[] = [];
          
          pattern.lows.forEach((low: PeakLowPoint) => {
            let lowTime: number = 0;
            if (low.date) {
              lowTime = parseDateToTimestamp(low.date);
            } else if (low.index !== undefined && low.index >= 0 && low.index < data.length) {
              // Use the low's index directly to get the time from data
              lowTime = data[low.index].time;
            } else if (low.index !== undefined) {
              // Fallback: interpolate between start and end times if index is out of bounds
              const progress = Math.max(0, Math.min(1, low.index / Math.max(1, data.length - 1)));
              lowTime = startTime + (endTime - startTime) * progress;
            } else {
              return; // Skip if no date or index
            }
            
            if (lowTime > 0) {
              lowTimes.push(lowTime);
              lowPrices.push(low.price);
            }
          });

          if (lowTimes.length >= 3 && lowPrices.length >= 3) {
            // Draw line connecting the 3 lows
            const lineSeries = chartRef.current!.addLineSeries({
              color: color,
              lineWidth: 2,
              lineStyle: 0, // Solid line
              lineType: 0,
              priceLineVisible: false,
              lastValueVisible: false,
            });

            const lineData: LineData[] = lowTimes.map((time, i) => ({
              time,
              value: lowPrices[i]
            }));
            
            lineSeries.setData(lineData);

            // Draw resistance level line (horizontal dashed line at resistance_level)
            // Note: triple_bottoms use resistance_level instead of support_level
            const resistanceLevel = (pattern as any).resistance_level;
            if (resistanceLevel !== undefined && resistanceLevel !== null) {
              const resistanceLineSeries = chartRef.current!.addLineSeries({
                color: color,
                lineWidth: 1.5,
                lineStyle: 2, // Dashed line
                lineType: 0,
                priceLineVisible: false,
                lastValueVisible: false,
              });

              const resistanceLineData: LineData[] = [
                { time: startTime, value: resistanceLevel },
                { time: endTime, value: resistanceLevel }
              ];
              
              resistanceLineSeries.setData(resistanceLineData);
            }

            // Optionally draw target level line (horizontal dotted line at target_level)
            if (pattern.target_level !== undefined && pattern.target_level !== null) {
              const targetLineSeries = chartRef.current!.addLineSeries({
                color: color,
                lineWidth: 1,
                lineStyle: 3, // Dotted line
                lineType: 0,
                priceLineVisible: false,
                lastValueVisible: false,
              });

              const targetLineData: LineData[] = [
                { time: endTime, value: pattern.target_level },
                { time: endTime + (endTime - startTime) * 0.5, value: pattern.target_level } // Extend target line forward
              ];
              
              targetLineSeries.setData(targetLineData);
            }
          }
        } else {
          // Default behavior for other patterns: horizontal line at average price
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
            <span>{symbol}</span>
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
            <span>{symbol}</span>
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
            <span>{symbol}</span>
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
      <CardHeader className="p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
          <CardTitle className="flex items-center space-x-2 text-lg sm:text-2xl">
            <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="truncate">{symbol}</span>
          </CardTitle>
          
          {/* Chart Type Toggle */}
          <div className="flex items-center space-x-2">
            <Button
              variant={chartType === 'candlestick' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChartType('candlestick')}
              className="flex items-center space-x-1 h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm"
            >
              <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>Candles</span>
            </Button>
            <Button
              variant={chartType === 'line' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChartType('line')}
              className="flex items-center space-x-1 h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm"
            >
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>Line</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 md:p-6 pt-0">
        {/* Chart Container */}
        <div 
          ref={chartContainerRef} 
          style={{ height }}
          className="w-full border border-slate-200 rounded"
        />
      </CardContent>
    </Card>
  );
};

export default PatternChart;