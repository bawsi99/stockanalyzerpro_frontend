import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react';
import { ChartValidationResult, calculateChartStats, ValidatedChartData } from '@/utils/chartUtils';
import { ChartData } from '@/types/analysis';

// Interface for chart statistics used in ChartDebugger
interface ChartStats {
  dateRange: { start: string; end: string; days: number };
  price: { min: number; max: number; current: number };
  volume: { avg: number; total: number };
  returns: { avg: number; volatility: number };
}

interface ChartDebuggerProps {
  data: ChartData[];
  validationResult: ChartValidationResult | null;
  stats: ChartStats;
  onRefresh?: () => void;
}

const ChartDebugger: React.FC<ChartDebuggerProps> = ({ 
  data, 
  validationResult, 
  stats, 
  onRefresh 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!validationResult) {
    return (
      <Card className="border-orange-200 bg-orange-50 dark:bg-orange-900/20">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <Info className="h-4 w-4 text-orange-600" />
            <span className="text-sm text-orange-700 dark:text-orange-300">
              No validation data available
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/20">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center space-x-2">
            <Info className="h-4 w-4 text-blue-600" />
            <span className="text-blue-700 dark:text-blue-300">Chart Debug Info</span>
          </CardTitle>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs"
            >
              {isExpanded ? 'Collapse' : 'Expand'}
            </Button>
            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                className="text-xs"
              >
                Refresh
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
          <div className="text-center p-2 bg-white dark:bg-gray-800 rounded">
            <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {data.length}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Raw Data</div>
          </div>
          <div className="text-center p-2 bg-white dark:bg-gray-800 rounded">
            <div className="text-lg font-bold text-green-600">
              {validationResult.data.length}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Valid Data</div>
          </div>
          <div className="text-center p-2 bg-white dark:bg-gray-800 rounded">
            <div className="text-lg font-bold text-red-600">
              {validationResult.errors.length}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Errors</div>
          </div>
          <div className="text-center p-2 bg-white dark:bg-gray-800 rounded">
            <div className="text-lg font-bold text-yellow-600">
              {validationResult.warnings.length}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Warnings</div>
          </div>
        </div>

        {/* Status */}
        <div className="flex items-center space-x-2 mb-4">
          {validationResult.isValid ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <XCircle className="h-4 w-4 text-red-600" />
          )}
          <Badge variant={validationResult.isValid ? "default" : "destructive"}>
            {validationResult.isValid ? "Valid" : "Invalid"}
          </Badge>
          {validationResult.errors.length > 0 && (
            <Badge variant="destructive">
              {validationResult.errors.length} Errors
            </Badge>
          )}
          {validationResult.warnings.length > 0 && (
            <Badge variant="secondary">
              {validationResult.warnings.length} Warnings
            </Badge>
          )}
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="space-y-4">
            {/* Errors */}
            {validationResult.errors.length > 0 && (
              <div>
                <h4 className="font-semibold text-red-700 dark:text-red-300 mb-2 flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  Validation Errors
                </h4>
                <div className="bg-red-100 dark:bg-red-900/30 rounded p-3 max-h-32 overflow-y-auto">
                  {validationResult.errors.map((error, index) => (
                    <div key={index} className="text-xs text-red-700 dark:text-red-300 mb-1">
                      • {error}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Warnings */}
            {validationResult.warnings.length > 0 && (
              <div>
                <h4 className="font-semibold text-yellow-700 dark:text-yellow-300 mb-2 flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  Validation Warnings
                </h4>
                <div className="bg-yellow-100 dark:bg-yellow-900/30 rounded p-3 max-h-32 overflow-y-auto">
                  {validationResult.warnings.map((warning, index) => (
                    <div key={index} className="text-xs text-yellow-700 dark:text-yellow-300 mb-1">
                      • {warning}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Statistics */}
            {stats && (
              <div>
                <h4 className="font-semibold text-blue-700 dark:text-blue-300 mb-2">
                  Data Statistics
                </h4>
                <div className="bg-white dark:bg-gray-800 rounded p-3 text-xs space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Date Range:</span>
                      <div className="font-medium">
                        {stats.dateRange.start} to {stats.dateRange.end}
                      </div>
                      <div className="text-gray-500">({stats.dateRange.days} days)</div>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Price Range:</span>
                      <div className="font-medium">
                        ₹{stats.price.min.toFixed(2)} - ₹{stats.price.max.toFixed(2)}
                      </div>
                      <div className="text-gray-500">Current: ₹{stats.price.current.toFixed(2)}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Volume:</span>
                      <div className="font-medium">
                        Avg: {stats.volume.avg.toLocaleString()}
                      </div>
                      <div className="text-gray-500">Total: {stats.volume.total.toLocaleString()}</div>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Returns:</span>
                      <div className="font-medium">
                        Avg: {(stats.returns.avg * 100).toFixed(2)}%
                      </div>
                      <div className="text-gray-500">Vol: {(stats.returns.volatility * 100).toFixed(2)}%</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Sample Data */}
            {validationResult.data.length > 0 && (
              <div>
                <h4 className="font-semibold text-blue-700 dark:text-blue-300 mb-2">
                  Sample Data (First 3 entries)
                </h4>
                <div className="bg-white dark:bg-gray-800 rounded p-3 text-xs overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-1">Date</th>
                        <th className="text-left p-1">Open</th>
                        <th className="text-left p-1">High</th>
                        <th className="text-left p-1">Low</th>
                        <th className="text-left p-1">Close</th>
                        <th className="text-left p-1">Volume</th>
                      </tr>
                    </thead>
                    <tbody>
                      {validationResult.data.slice(0, 3).map((item, index) => (
                        <tr key={index} className="border-b">
                          <td className="p-1">{item.date}</td>
                          <td className="p-1">₹{item.open.toFixed(2)}</td>
                          <td className="p-1">₹{item.high.toFixed(2)}</td>
                          <td className="p-1">₹{item.low.toFixed(2)}</td>
                          <td className="p-1">₹{item.close.toFixed(2)}</td>
                          <td className="p-1">{item.volume.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ChartDebugger; 