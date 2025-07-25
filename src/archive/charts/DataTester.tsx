/**
 * @deprecated This component has been archived and is no longer in use.
 * The data testing functionality has been integrated into the unified Charts page.
 * See: frontend/src/pages/Charts.tsx for the current implementation.
 * 
 * Archived on: 2024-07-25
 * Reason: Consolidated into unified chart system
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';
import { validateChartData, calculateChartStats } from '@/utils/chartUtils';
import { ChartData } from '@/types/analysis';

interface DataTesterProps {
  data: ChartData[];
}

const DataTester: React.FC<DataTesterProps> = ({ data }) => {
  const [showDetails, setShowDetails] = useState(false);

  // Test the data
  const validationResult = validateChartData(data);
  const stats = calculateChartStats(validationResult.data);

  const testResults = {
    rawDataCount: data.length,
    validDataCount: validationResult.data.length,
    errorCount: validationResult.errors.length,
    warningCount: validationResult.warnings.length,
    isValid: validationResult.isValid,
    hasStats: !!stats
  };

  return (
    <Card className="border-2 border-blue-200 bg-blue-50 dark:bg-blue-900/20">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center space-x-2">
            <Info className="h-4 w-4 text-blue-600" />
            <span className="text-blue-700 dark:text-blue-300">Data Format Tester</span>
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
            className="text-xs"
          >
            {showDetails ? 'Hide Details' : 'Show Details'}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
          <div className="text-center p-2 bg-white dark:bg-gray-800 rounded">
            <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {testResults.rawDataCount}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Raw Data</div>
          </div>
          <div className="text-center p-2 bg-white dark:bg-gray-800 rounded">
            <div className="text-lg font-bold text-green-600">
              {testResults.validDataCount}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Valid Data</div>
          </div>
          <div className="text-center p-2 bg-white dark:bg-gray-800 rounded">
            <div className="text-lg font-bold text-red-600">
              {testResults.errorCount}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Errors</div>
          </div>
        </div>

        {/* Status */}
        <div className="flex items-center space-x-2 mb-4">
          {testResults.isValid ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <XCircle className="h-4 w-4 text-red-600" />
          )}
          <Badge variant={testResults.isValid ? "default" : "destructive"}>
            {testResults.isValid ? "Data Format OK" : "Data Format Issues"}
          </Badge>
          {testResults.errorCount > 0 && (
            <Badge variant="destructive">
              {testResults.errorCount} Errors
            </Badge>
          )}
          {testResults.warningCount > 0 && (
            <Badge variant="secondary">
              {testResults.warningCount} Warnings
            </Badge>
          )}
        </div>

        {/* Detailed Results */}
        {showDetails && (
          <div className="space-y-4">
            {/* Sample Raw Data */}
            <div>
              <h4 className="font-semibold text-blue-700 dark:text-blue-300 mb-2">
                Sample Raw Data (First 2 entries)
              </h4>
              <div className="bg-white dark:bg-gray-800 rounded p-3 text-xs overflow-x-auto">
                <pre className="whitespace-pre-wrap">
                  {JSON.stringify(data.slice(0, 2), null, 2)}
                </pre>
              </div>
            </div>

            {/* Validation Errors */}
            {validationResult.errors.length > 0 && (
              <div>
                <h4 className="font-semibold text-red-700 dark:text-red-300 mb-2 flex items-center">
                  <XCircle className="h-4 w-4 mr-1" />
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

            {/* Validation Warnings */}
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

            {/* Processed Data */}
            {validationResult.data.length > 0 && (
              <div>
                <h4 className="font-semibold text-green-700 dark:text-green-300 mb-2">
                  Processed Data (First 2 entries)
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
                        <th className="text-left p-1">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {validationResult.data.slice(0, 2).map((item, index) => (
                        <tr key={index} className="border-b">
                          <td className="p-1">{item.date}</td>
                          <td className="p-1">₹{item.open.toFixed(2)}</td>
                          <td className="p-1">₹{item.high.toFixed(2)}</td>
                          <td className="p-1">₹{item.low.toFixed(2)}</td>
                          <td className="p-1">₹{item.close.toFixed(2)}</td>
                          <td className="p-1">{item.volume.toLocaleString()}</td>
                          <td className="p-1 text-xs">{new Date(item.timestamp).toISOString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Statistics */}
            {stats && (
              <div>
                <h4 className="font-semibold text-blue-700 dark:text-blue-300 mb-2">
                  Calculated Statistics
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

            {/* Recommendations */}
            <div>
              <h4 className="font-semibold text-blue-700 dark:text-blue-300 mb-2">
                Recommendations
              </h4>
              <div className="bg-blue-100 dark:bg-blue-900/30 rounded p-3 text-xs">
                {testResults.isValid ? (
                  <div className="text-green-700 dark:text-green-300">
                    ✅ Your data format is correct! The charts should work properly.
                  </div>
                ) : (
                  <div className="text-red-700 dark:text-red-300">
                    ❌ Please fix the validation errors above before using the charts.
                  </div>
                )}
                {testResults.warningCount > 0 && (
                  <div className="text-yellow-700 dark:text-yellow-300 mt-2">
                    ⚠️ Consider addressing the warnings for better data quality.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DataTester; 