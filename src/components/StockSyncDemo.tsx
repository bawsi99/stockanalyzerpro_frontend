import React from 'react';
import { useSelectedStockStore } from '@/stores/selectedStockStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, BarChart3, RefreshCw } from 'lucide-react';

const StockSyncDemo: React.FC = () => {
  const { selectedStock, selectionSource, setSelectedStock, clearSelection } = useSelectedStockStore();

  const testStocks = ['RELIANCE', 'TCS', 'HDFC', 'INFY', 'WIPRO'];

  const handleStockChange = (stock: string, source: 'analysis' | 'charts' | 'manual') => {
    setSelectedStock(stock, source);
  };

  const handleClear = () => {
    clearSelection();
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          Stock Synchronization Demo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Status */}
        <div className="p-4 bg-slate-50 rounded-lg">
          <h3 className="font-semibold mb-2">Current Status</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Selected Stock:</span>
              <Badge variant={selectedStock ? 'default' : 'secondary'}>
                {selectedStock || 'None'}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Source:</span>
              <Badge variant="outline">{selectionSource}</Badge>
            </div>
          </div>
        </div>

        {/* Test Controls */}
        <div className="space-y-3">
          <h3 className="font-semibold">Test Stock Selection</h3>
          
          {/* Analysis Page Simulation */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <Target className="h-4 w-4" />
              Analysis Page
            </h4>
            <div className="flex flex-wrap gap-2">
              {testStocks.map((stock) => (
                <Button
                  key={`analysis-${stock}`}
                  variant="outline"
                  size="sm"
                  onClick={() => handleStockChange(stock, 'analysis')}
                  className="text-xs"
                >
                  {stock}
                </Button>
              ))}
            </div>
          </div>

          {/* Charts Page Simulation */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Charts Page
            </h4>
            <div className="flex flex-wrap gap-2">
              {testStocks.map((stock) => (
                <Button
                  key={`charts-${stock}`}
                  variant="outline"
                  size="sm"
                  onClick={() => handleStockChange(stock, 'charts')}
                  className="text-xs"
                >
                  {stock}
                </Button>
              ))}
            </div>
          </div>

          {/* Manual Selection */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-slate-600">Manual Selection</h4>
            <div className="flex flex-wrap gap-2">
              {testStocks.map((stock) => (
                <Button
                  key={`manual-${stock}`}
                  variant="outline"
                  size="sm"
                  onClick={() => handleStockChange(stock, 'manual')}
                  className="text-xs"
                >
                  {stock}
                </Button>
              ))}
            </div>
          </div>

          {/* Clear Selection */}
          <div className="pt-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={handleClear}
              className="w-full"
            >
              Clear Selection
            </Button>
          </div>
        </div>

        {/* Instructions */}
        <div className="p-3 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-800 mb-2">How to Test</h4>
          <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
            <li>Select a stock from any of the sections above</li>
            <li>Navigate between Analysis and Charts pages</li>
            <li>Verify the stock selection is maintained</li>
            <li>Check the console for synchronization logs</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};

export default StockSyncDemo;
