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
    <div className="w-full h-full">
      <div ref={chartContainerRef} className="w-full h-full" />
    </div>
  );
};

export default SimpleChart; 