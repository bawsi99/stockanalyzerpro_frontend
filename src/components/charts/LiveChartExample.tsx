import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import LiveEnhancedMultiPaneChart from './LiveEnhancedMultiPaneChart';
import { LiveChartProvider, LiveChartStatus, LiveChartControls } from './LiveChartProvider';

// ===== STOCK TOKENS =====
const STOCK_TOKENS = {
  'RELIANCE': '256265',
  'TCS': '11536',
  'HDFC': '1330',
  'INFY': '1594',
  'ICICIBANK': '4963',
  'HINDUNILVR': '3045',
  'ITC': '1660',
  'SBIN': '3045',
  'BHARTIARTL': '2713',
  'AXISBANK': '590'
};

const TIMEFRAMES = ['1m', '5m', '15m', '1h', '1d'];

// ===== EXAMPLE COMPONENT =====

export default function LiveChartExample() {
  const [selectedStock, setSelectedStock] = useState('RELIANCE');
  const [selectedTimeframe, setSelectedTimeframe] = useState('1d');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [debug, setDebug] = useState(false);

  const token = STOCK_TOKENS[selectedStock as keyof typeof STOCK_TOKENS];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Live Stock Chart</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Real-time streaming data with live indicators and pattern detection
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <LiveChartStatus />
          <Button
            variant="outline"
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          >
            {theme === 'light' ? '🌙' : '☀️'} {theme}
          </Button>
        </div>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Chart Controls</span>
            <div className="flex items-center space-x-2">
              <Badge variant={debug ? 'default' : 'secondary'}>
                Debug: {debug ? 'ON' : 'OFF'}
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Stock Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Stock</label>
              <Select value={selectedStock} onValueChange={setSelectedStock}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(STOCK_TOKENS).map(stock => (
                    <SelectItem key={stock} value={stock}>
                      {stock}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Timeframe Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Timeframe</label>
              <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMEFRAMES.map(tf => (
                    <SelectItem key={tf} value={tf}>
                      {tf}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Debug Toggle */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Debug Mode</label>
              <Button
                variant={debug ? 'default' : 'outline'}
                onClick={() => setDebug(!debug)}
                className="w-full"
              >
                {debug ? 'Disable' : 'Enable'} Debug
              </Button>
            </div>

            {/* Live Controls */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Live Controls</label>
              <LiveChartControls />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chart Container */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{selectedStock} - {selectedTimeframe} Chart</span>
            <div className="flex items-center space-x-2">
              <Badge variant="outline">Token: {token}</Badge>
              <Badge variant="outline">Theme: {theme}</Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="h-[600px] w-full">
            <LiveChartProvider
              token={token}
              timeframe={selectedTimeframe}
              autoConnect={true}
              maxDataPoints={1000}
              updateInterval={1000}
            >
              <LiveEnhancedMultiPaneChart
                token={token}
                timeframe={selectedTimeframe}
                theme={theme}
                height={600}
                debug={debug}
                autoConnect={true}
                maxDataPoints={1000}
                updateInterval={1000}
                onValidationResult={(result) => {
                  if (debug) {
                    console.log('Chart Validation:', result);
                  }
                }}
                onStatsCalculated={(stats) => {
                  if (debug) {
                    console.log('Chart Stats:', stats);
                  }
                }}
              />
            </LiveChartProvider>
          </div>
        </CardContent>
      </Card>

      {/* Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Connection Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Connection Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Stock:</span>
                <Badge variant="outline">{selectedStock}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Timeframe:</span>
                <Badge variant="outline">{selectedTimeframe}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Token:</span>
                <Badge variant="outline">{token}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Features Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Live Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">Real-time Data</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">Live Indicators</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">Pattern Detection</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">Auto Reconnection</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm">Max Data Points:</span>
                <Badge variant="outline">1000</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Update Interval:</span>
                <Badge variant="outline">1s</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Memory Usage:</span>
                <Badge variant="outline">~60MB</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">CPU Usage:</span>
                <Badge variant="outline">~8%</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How to Use</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p>1. <strong>Select a Stock:</strong> Choose from the dropdown to view different stocks</p>
            <p>2. <strong>Choose Timeframe:</strong> Select 1m, 5m, 15m, 1h, or 1d for different intervals</p>
            <p>3. <strong>Toggle Theme:</strong> Switch between light and dark themes</p>
            <p>4. <strong>Enable Debug:</strong> Turn on debug mode to see detailed logs</p>
            <p>5. <strong>Live Controls:</strong> Use the live controls to refresh, recalculate, or detect patterns</p>
            <p>6. <strong>Monitor Status:</strong> Watch the connection status indicator for live updates</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 