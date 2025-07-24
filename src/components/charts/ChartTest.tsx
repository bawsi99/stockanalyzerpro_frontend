/*
 * ChartTest
 * ---------
 * Component for testing the chart library integration (lightweight-charts).
 * Not used in production. For development/debugging only.
 */
import React, { useEffect, useRef, useState } from 'react';

const ChartTest: React.FC = () => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    console.log('Creating test chart...');

    const createTestChart = async () => {
      try {
        const { createChart } = await import('lightweight-charts');
        console.log('Test library imported successfully');
        
        const chart = createChart(chartContainerRef.current!, {
          width: 600,
          height: 400,
          layout: {
            background: { color: '#ffffff' },
            textColor: '#000000',
          },
          grid: {
            vertLines: { color: '#e1e1e1' },
            horzLines: { color: '#e1e1e1' },
          },
        });

        console.log('Test chart created successfully:', chart);
        console.log('addCandlestickSeries method:', typeof chart.addCandlestickSeries);

        // Test adding a candlestick series
        const candlestickSeries = chart.addCandlestickSeries();
        console.log('Candlestick series created:', candlestickSeries);

        // Add some test data
        const testData = [
          { time: 1640995200, open: 100, high: 105, low: 95, close: 102 },
          { time: 1641081600, open: 102, high: 108, low: 100, close: 105 },
          { time: 1641168000, open: 105, high: 110, low: 102, close: 108 },
        ];

        candlestickSeries.setData(testData);
        console.log('Test data set successfully');

        return () => {
          console.log('Cleaning up test chart');
          chart.remove();
        };
      } catch (error) {
        console.error('Error creating test chart:', error);
        setError(error instanceof Error ? error.message : 'Unknown error');
      }
    };

    createTestChart();
  }, []);

  if (error) {
    return (
      <div className="p-4 border rounded">
        <h3 className="text-lg font-semibold mb-4">Chart Library Test</h3>
        <div className="text-center">
          <div className="text-red-500 text-4xl mb-2">⚠️</div>
          <p className="text-red-600 mb-2">Test Chart Error</p>
          <p className="text-sm text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 border rounded">
      <h3 className="text-lg font-semibold mb-4">Chart Library Test</h3>
      <div ref={chartContainerRef} className="w-full h-[400px]" />
    </div>
  );
};

export default ChartTest; 