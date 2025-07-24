import React, { useEffect, useRef, useState } from 'react';
import { 
  initializeChartWithRetry, 
  createChartTheme, 
  safeChartCleanup, 
  isChartContainerReady,
  type ChartContainer 
} from '@/utils/chartUtils';

// Specific interface for candlestick chart data
interface CandlestickChartData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface SimpleChartProps {
  data: CandlestickChartData[];
  theme?: 'light' | 'dark';
  height?: number;
  width?: number;
  timeframe?: string;
}

const toTimestamp = (iso: string): number => {
  try {
    const timestamp = Date.parse(iso);
    if (isNaN(timestamp)) {
      console.warn(`Invalid date format: ${iso}`);
      return 0;
    }
    return Math.floor(timestamp / 1000);
  } catch (error) {
    console.warn(`Error parsing date: ${iso}`, error);
    return 0;
  }
};

const SimpleChart: React.FC<SimpleChartProps> = ({ 
  data, 
  theme = 'light', 
  height = 400,
  width = 800,
  timeframe = '1d'
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const [isChartReady, setIsChartReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isContainerReady, setIsContainerReady] = useState(false);

  // Check if container is ready
  useEffect(() => {
    const checkContainer = () => {
      const ready = isChartContainerReady(chartContainerRef as ChartContainer);
      setIsContainerReady(ready);
    };

    // Check immediately
    checkContainer();

    // Also check after a small delay to ensure DOM is rendered
    const timer = setTimeout(checkContainer, 50);
    
    return () => clearTimeout(timer);
  }, []);

  // Initialize chart
  useEffect(() => {
    if (!isContainerReady || !chartContainerRef.current || data.length === 0) {
      console.log('Chart initialization conditions not met:', {
        isContainerReady,
        hasContainer: !!chartContainerRef.current,
        dataLength: data.length
      });
      return;
    }

    console.log('Starting chart initialization...');

    const initializeChart = async () => {
      try {
        // Clean up any existing chart
        safeChartCleanup(chartRef);

        // Create chart configuration
        const chartConfig = {
          width,
          height,
          ...createChartTheme(theme === 'dark', { timeframe })
        };

        // Debug: Log the timeframe being used
        console.log('Debug: Chart timeframe:', timeframe);

        // Initialize chart with retry mechanism
        const chart = await initializeChartWithRetry(
          chartContainerRef as ChartContainer,
          { width, height, theme, timeframe, debug: true },
          chartConfig
        );

        if (!chart) {
          throw new Error('Failed to create chart');
        }

        console.log('Chart created successfully:', chart);
        
        // Test if addCandlestickSeries exists
        if (typeof chart.addCandlestickSeries !== 'function') {
          throw new Error('addCandlestickSeries is not a function');
        }

        chartRef.current = chart;
        setIsChartReady(true);
        setError(null);

      } catch (error) {
        console.error('Error initializing chart:', error);
        setError(error instanceof Error ? error.message : 'Error initializing chart');
        setIsChartReady(false);
      }
    };

    initializeChart();

    // Cleanup function
    return () => {
      safeChartCleanup(chartRef);
      setIsChartReady(false);
    };
  }, [isContainerReady, theme, width, height, data.length, timeframe]);

  // Add candlestick series
  useEffect(() => {
    if (!isChartReady || !chartRef.current || data.length === 0) {
      return;
    }

    console.log('Adding candlestick series...');

    try {
      const isDark = theme === 'dark';

      // Add candlestick series
      const candlestickSeries = chartRef.current.addCandlestickSeries({
        upColor: isDark ? '#26a69a' : '#26a69a',
        downColor: isDark ? '#ef5350' : '#ef5350',
        borderVisible: false,
        wickUpColor: isDark ? '#26a69a' : '#26a69a',
        wickDownColor: isDark ? '#ef5350' : '#ef5350',
      });

      console.log('Candlestick series created');

      // Convert data to candlestick format
      const candlestickData = data.map(d => ({
        time: toTimestamp(d.date),
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
      }));

      // Debug: Log the first few timestamps to check timezone conversion
      console.log('Debug: First 5 timestamps:', candlestickData.slice(0, 5).map(d => ({
        originalDate: d.time,
        convertedDate: new Date(d.time * 1000).toISOString(),
        istTime: new Date(d.time * 1000).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
      })));

      // Validate candlestick data
      const invalidData = candlestickData.filter(d => 
        d.high < Math.max(d.open, d.close) || 
        d.low > Math.min(d.open, d.close) ||
        d.time === 0
      );

      if (invalidData.length > 0) {
        console.warn('Invalid candlestick data found:', invalidData);
      }

      console.log('Setting data:', candlestickData.length, 'points');
      console.log('Sample candlestick data:', candlestickData[0]);
      console.log('First 5 data points:', candlestickData.slice(0, 5));
      console.log('Last 5 data points:', candlestickData.slice(-5));
      console.log('Price range:', {
        min: Math.min(...candlestickData.map(d => d.low)),
        max: Math.max(...candlestickData.map(d => d.high))
      });

      // Set data
      candlestickSeries.setData(candlestickData);

      // Enhanced candlestick tooltip
      chartRef.current.subscribeCrosshairMove((param) => {
        const tooltip = document.getElementById('candlestick-tooltip');
        if (!tooltip) return;
        
        if (param.time && param.seriesData) {
          const candleDataPoint = param.seriesData.get(candlestickSeries);
          
          if (candleDataPoint) {
            const timeIndex = data.findIndex(d => toTimestamp(d.date) === param.time);
            if (timeIndex !== -1) {
              const dataPoint = data[timeIndex];
              const date = new Date(dataPoint.date);
              
              // Format date based on timeframe
              let dateStr = '';
              if (timeframe === '1d') {
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
              const chartRect = chartContainerRef.current?.getBoundingClientRect();
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

      // Fit content
      chartRef.current.timeScale().fitContent();

      console.log('Chart data set successfully');

    } catch (error) {
      console.error('Error adding candlestick series:', error);
      setError(error instanceof Error ? error.message : 'Error adding data');
    }

  }, [isChartReady, data, theme]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (chartRef.current && chartContainerRef.current) {
        const rect = chartContainerRef.current.getBoundingClientRect();
        chartRef.current.applyOptions({
          width: rect.width,
          height: rect.height,
        });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <p className="text-red-600 mb-2">Chart Error</p>
          <p className="text-sm text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-gray-500 text-6xl mb-4">📊</div>
          <p className="text-gray-600">No data available</p>
          <p className="text-sm text-gray-500">Select a stock to view chart</p>
        </div>
      </div>
    );
  }

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
      <div className="w-full h-full relative">
        <div ref={chartContainerRef} className="w-full h-full" />
        <div id="candlestick-tooltip" className="absolute hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-3 pointer-events-none z-30 min-w-[160px]" />
      </div>
    </>
  );
};

export default SimpleChart; 