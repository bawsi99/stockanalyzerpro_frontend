import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import LiveSimpleChart from '@/components/charts/LiveSimpleChart';
import SimpleChart from '@/components/charts/SimpleChart';
import ChartTest from '@/components/charts/ChartTest';
import { authService } from '@/services/authService';
import { liveDataService, StockInfo } from '@/services/liveDataService';

// Type for candlestick data
interface CandlestickData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

const TIMEFRAMES = [
  { label: '1 Minute', value: '1m' },
  { label: '5 Minutes', value: '5m' },
  { label: '15 Minutes', value: '15m' },
  { label: '1 Hour', value: '1h' },
  { label: '1 Day', value: '1d' }
];

export default function Charts() {
  const [stockInput, setStockInput] = useState('RELIANCE');
  const [selectedTimeframe, setSelectedTimeframe] = useState('1d');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [authStatus, setAuthStatus] = useState<'loading' | 'authenticated' | 'error'>('loading');
  const [authError, setAuthError] = useState<string>('');
  const [chartData, setChartData] = useState<CandlestickData[]>([]);
  const [showTestChart, setShowTestChart] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);
  const [availableStocks, setAvailableStocks] = useState<StockInfo[]>([]);
  const [currentStockInfo, setCurrentStockInfo] = useState<StockInfo | null>(null);
  
  // Live chart state
  const [useLiveChart, setUseLiveChart] = useState(true); // Enabled by default
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [liveDataError, setLiveDataError] = useState<string | null>(null);
  const [lastDataUpdate, setLastDataUpdate] = useState<number>(0);

  // Load available stocks
  useEffect(() => {
    const loadStocks = async () => {
      try {
        const stocks = await liveDataService.getAvailableStocks();
        setAvailableStocks(stocks);
      } catch (error) {
        console.error('Error loading stocks:', error);
      }
    };
    loadStocks();
  }, []);

  // Handle authentication on component mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setAuthStatus('loading');
        await authService.ensureAuthenticated();
        setAuthStatus('authenticated');
      } catch (error) {
        console.error('Authentication failed:', error);
        setAuthStatus('error');
        setAuthError(error instanceof Error ? error.message : 'Authentication failed');
      }
    };

    initializeAuth();
  }, []);

  // Load real data when stock or timeframe changes (only for static chart)
  useEffect(() => {
    if (authStatus !== 'authenticated' || !stockInput || useLiveChart) return;

    const loadRealData = async () => {
      try {
        setIsLoadingData(true);
        setDataError(null);

        console.log(`Loading real data for ${stockInput} with timeframe ${selectedTimeframe}`);

        // Get historical data from backend
        const response = await liveDataService.getHistoricalData(
          stockInput,
          selectedTimeframe,
          'NSE',
          1000
        );

        // Convert backend data to frontend format
        const convertedData = liveDataService.convertToChartData(response.candles);
        setChartData(convertedData);

        // Get stock info
        try {
          const stockInfo = await liveDataService.getStockInfo(stockInput, 'NSE');
          setCurrentStockInfo(stockInfo);
        } catch (error) {
          console.warn('Could not fetch stock info:', error);
          setCurrentStockInfo(null);
        }

        console.log(`Loaded ${convertedData.length} data points for ${stockInput}`);
      } catch (error) {
        console.error('Error loading real data:', error);
        setDataError(error instanceof Error ? error.message : 'Failed to load data');
        setChartData([]);
      } finally {
        setIsLoadingData(false);
      }
    };

    loadRealData();
  }, [authStatus, stockInput, selectedTimeframe, useLiveChart]);

  // Get token for the entered stock
  const getToken = (stockName: string) => {
    const stock = availableStocks.find(s => s.symbol.toUpperCase() === stockName.toUpperCase());
    return stock?.token || '256265'; // Default to RELIANCE if not found
  };

  const token = getToken(stockInput);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Live Stock Charts
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Real-time stock data with live chart functionality
          </p>
        </div>

        {/* Test Chart Toggle */}
        <Card>
          <CardHeader>
            <CardTitle>Chart Library Test</CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              onClick={() => setShowTestChart(!showTestChart)}
              className="mb-4"
            >
              {showTestChart ? 'Hide' : 'Show'} Test Chart
            </Button>
            {showTestChart && <ChartTest />}
          </CardContent>
        </Card>

        {/* Authentication Status */}
        {authStatus === 'loading' && (
          <Alert>
            <AlertDescription>
              🔐 Authenticating with server... Please wait.
            </AlertDescription>
          </Alert>
        )}

        {authStatus === 'error' && (
          <Alert variant="destructive">
            <AlertDescription>
              ❌ Authentication failed: {authError}. Real data may not be available.
            </AlertDescription>
          </Alert>
        )}

        {authStatus === 'authenticated' && (
          <Alert>
            <AlertDescription>
              ✅ Authenticated successfully. Real data is available.
            </AlertDescription>
          </Alert>
        )}

        {/* Data Error */}
        {dataError && (
          <Alert variant="destructive">
            <AlertDescription>
              ❌ Data Error: {dataError}
            </AlertDescription>
          </Alert>
        )}

        {/* Controls Card */}
        <Card>
          <CardHeader>
            <CardTitle>Chart Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Stock Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Stock Symbol
              </label>
              <div className="flex gap-2">
                <Input
                  value={stockInput}
                  onChange={(e) => setStockInput(e.target.value)}
                  placeholder="Enter stock symbol (e.g., RELIANCE, TCS, INFY)"
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                >
                  {theme === 'light' ? '🌙' : '☀️'} Theme
                </Button>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                <span className="text-xs text-gray-500">Available stocks:</span>
                {availableStocks.slice(0, 10).map(stock => (
                  <Badge
                    key={stock.symbol}
                    variant="outline"
                    className="text-xs cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                    onClick={() => setStockInput(stock.symbol)}
                  >
                    {stock.symbol}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Timeframe Buttons */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Data Interval
              </label>
              <div className="flex flex-wrap gap-2">
                {TIMEFRAMES.map((timeframe) => (
                  <Button
                    key={timeframe.value}
                    variant={selectedTimeframe === timeframe.value ? 'default' : 'outline'}
                    onClick={() => setSelectedTimeframe(timeframe.value)}
                    className="min-w-[100px]"
                  >
                    {timeframe.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Current Selection Info */}
            <div className="flex flex-wrap gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Stock:</span>
                <Badge variant="secondary">{stockInput.toUpperCase()}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Token:</span>
                <Badge variant="outline">{token}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Interval:</span>
                <Badge variant="outline">
                  {TIMEFRAMES.find(tf => tf.value === selectedTimeframe)?.label}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Theme:</span>
                <Badge variant="outline">{theme}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Data Points:</span>
                <Badge variant="outline">{chartData.length}</Badge>
              </div>
              {currentStockInfo && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Sector:</span>
                  <Badge variant="outline">{currentStockInfo.sector || 'N/A'}</Badge>
                </div>
              )}
            </div>

            {/* Live Chart Controls */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="live-chart"
                  checked={useLiveChart}
                  onCheckedChange={setUseLiveChart}
                />
                <Label htmlFor="live-chart" className="text-sm font-medium">
                  Enable Live Updates
                </Label>
                {useLiveChart && isLiveConnected && (
                  <Badge variant="default" className="ml-2">
                    🔴 LIVE
                  </Badge>
                )}
              </div>
              
              {useLiveChart && (
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <span>Status:</span>
                    <Badge variant={isLiveConnected ? 'default' : 'secondary'}>
                      {isLiveConnected ? 'Connected' : 'Disconnected'}
                    </Badge>
                  </div>
                  {lastDataUpdate > 0 && (
                    <div className="flex items-center gap-1">
                      <span>Last Update:</span>
                      <span>{new Date(lastDataUpdate).toLocaleTimeString()}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Data Controls */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  // Reload data
                  setStockInput(stockInput);
                }}
                className="flex-1"
                disabled={isLoadingData || useLiveChart}
              >
                {isLoadingData ? '🔄 Loading...' : '🔄 Reload Data'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  console.log('Current chart data:', chartData);
                  console.log('Current stock info:', currentStockInfo);
                }}
              >
                📊 Debug Data
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Chart Container */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>
                {stockInput.toUpperCase()} - {useLiveChart ? 'Live' : 'Real'} Data Chart
                {currentStockInfo && (
                  <span className="text-sm font-normal text-gray-500 ml-2">
                    ({currentStockInfo.name})
                  </span>
                )}
              </span>
              <div className="flex items-center gap-2">
                {useLiveChart && isLiveConnected && (
                  <Badge variant="destructive" className="animate-pulse">
                    🔴 LIVE
                  </Badge>
                )}
                <Badge variant="outline">
                  {TIMEFRAMES.find(tf => tf.value === selectedTimeframe)?.label}
                </Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {authStatus === 'loading' ? (
              <div className="h-[600px] w-full flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                  <p className="text-gray-600">Authenticating...</p>
                </div>
              </div>
            ) : authStatus === 'error' ? (
              <div className="h-[600px] w-full flex items-center justify-center">
                <div className="text-center">
                  <div className="text-red-500 text-6xl mb-4">⚠️</div>
                  <p className="text-gray-600 mb-2">Authentication failed</p>
                  <p className="text-sm text-gray-500">Real data is not available</p>
                  <Button 
                    onClick={() => window.location.reload()} 
                    className="mt-4"
                    variant="outline"
                  >
                    Retry
                  </Button>
                </div>
              </div>
            ) : useLiveChart ? (
              <div className="h-[600px] w-full">
                <LiveSimpleChart
                  symbol={stockInput}
                  timeframe={selectedTimeframe}
                  theme={theme}
                  height={600}
                  width={800}
                  exchange="NSE"
                  maxDataPoints={1000}
                  autoConnect={true}
                  showConnectionStatus={true}
                  showLiveIndicator={true}
                  onDataUpdate={(data) => {
                    setChartData(data);
                    setLastDataUpdate(Date.now());
                  }}
                  onConnectionChange={(isConnected) => {
                    setIsLiveConnected(isConnected);
                  }}
                  onError={(error) => {
                    setLiveDataError(error);
                    console.error('Live chart error:', error);
                  }}
                />
              </div>
            ) : isLoadingData ? (
              <div className="h-[600px] w-full flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading real market data...</p>
                  <p className="text-sm text-gray-500">{stockInput.toUpperCase()} - {TIMEFRAMES.find(tf => tf.value === selectedTimeframe)?.label}</p>
                </div>
              </div>
            ) : dataError ? (
              <div className="h-[600px] w-full flex items-center justify-center">
                <div className="text-center">
                  <div className="text-red-500 text-6xl mb-4">📊</div>
                  <p className="text-gray-600 mb-2">Failed to load data</p>
                  <p className="text-sm text-gray-500">{dataError}</p>
                  <Button 
                    onClick={() => setStockInput(stockInput)} 
                    className="mt-4"
                    variant="outline"
                  >
                    Retry
                  </Button>
                </div>
              </div>
            ) : (
              <div className="h-[600px] w-full">
                <SimpleChart
                  data={chartData}
                  theme={theme}
                  height={600}
                  width={800}
                  timeframe={selectedTimeframe}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <p>• Enter a stock symbol in the input field above</p>
              <p>• Click on any available stock badge for quick selection</p>
              <p>• Use the interval buttons to switch between different timeframes</p>
              <p>• Toggle between light and dark themes</p>
              <p>• Enable "Live Updates" for real-time WebSocket data streaming</p>
              <p>• Live mode shows connection status and real-time indicators</p>
              <p>• Real market data is fetched from Zerodha API</p>
              <p>• Data updates automatically when you change stock or timeframe</p>
              <p>• Use the reload button to refresh current data (static mode only)</p>
              <p>• Live charts automatically reconnect on connection loss</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 