import React, { useState } from 'react';
import { StockSelector } from './stock-selector';
import { performanceMonitor } from '@/utils/performanceMonitor';
import { Button } from './button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';

export const StockSelectorDemo: React.FC = () => {
  const [selectedStock, setSelectedStock] = useState('');
  const [performanceMetrics, setPerformanceMetrics] = useState<Record<string, { avg: number; count: number; min: number; max: number }>>({});

  const handleShowMetrics = () => {
    const metrics = performanceMonitor.getAllMetrics();
    setPerformanceMetrics(metrics);
    performanceMonitor.logReport();
  };

  const handleClearMetrics = () => {
    performanceMonitor.clearMetrics();
    setPerformanceMetrics({});
  };

  return (
    <div className="p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Stock Selector Performance Demo</h1>
        <p className="text-muted-foreground">
          Experience the optimized stock selector with 34,000+ stocks
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Stock Selector Demo */}
        <Card>
          <CardHeader>
            <CardTitle>Stock Selector</CardTitle>
            <CardDescription>
              Try selecting a stock to see the performance improvements
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <StockSelector
              value={selectedStock}
              onValueChange={setSelectedStock}
              placeholder="Select a stock..."
              label="Choose a Stock"
            />
            
            {selectedStock && (
              <div className="p-3 bg-muted rounded-md">
                <p className="text-sm">
                  <strong>Selected:</strong> {selectedStock}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
            <CardDescription>
              Real-time performance tracking
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button onClick={handleShowMetrics} variant="outline" size="sm">
                Show Metrics
              </Button>
              <Button onClick={handleClearMetrics} variant="outline" size="sm">
                Clear Metrics
              </Button>
            </div>

            {Object.keys(performanceMetrics).length > 0 && (
              <div className="space-y-2">
                {Object.entries(performanceMetrics).map(([operation, data]) => (
                  <div key={operation} className="p-2 bg-muted rounded text-xs">
                    <div className="font-semibold">{operation}</div>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <div>Avg: {data.avg}ms</div>
                      <div>Count: {data.count}</div>
                      <div>Min: {data.min}ms</div>
                      <div>Max: {data.max}ms</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Performance Features */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Features</CardTitle>
          <CardDescription>
            Key optimizations implemented
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">🚀 Progressive Loading</h3>
              <p className="text-sm text-muted-foreground">
                Popular stocks load instantly, full list on demand
              </p>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">⚡ Virtualization</h3>
              <p className="text-sm text-muted-foreground">
                Only visible items rendered, smooth scrolling
              </p>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">🔍 Smart Search</h3>
              <p className="text-sm text-muted-foreground">
                Debounced search with caching and indexing
              </p>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">💾 Memory Management</h3>
              <p className="text-sm text-muted-foreground">
                LRU cache with automatic cleanup
              </p>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">📊 Performance Monitoring</h3>
              <p className="text-sm text-muted-foreground">
                Real-time metrics and performance tracking
              </p>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">🎯 Optimized UX</h3>
              <p className="text-sm text-muted-foreground">
                Instant response for popular stocks
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How to Use</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                1
              </div>
              <div>
                <p className="font-medium">Click the stock selector</p>
                <p className="text-sm text-muted-foreground">
                  Popular stocks will load instantly
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                2
              </div>
              <div>
                <p className="font-medium">Search for specific stocks</p>
                <p className="text-sm text-muted-foreground">
                  Type to search with debounced input
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                3
              </div>
              <div>
                <p className="font-medium">Load all stocks if needed</p>
                <p className="text-sm text-muted-foreground">
                  Click "Load all" to access the full list
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                4
              </div>
              <div>
                <p className="font-medium">Monitor performance</p>
                <p className="text-sm text-muted-foreground">
                  Check the metrics panel for performance data
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 