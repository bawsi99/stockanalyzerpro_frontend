import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ZoomIn } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command';
import LiveSimpleChart from '@/components/charts/LiveSimpleChart';
import EnhancedSimpleChart from '@/components/charts/EnhancedSimpleChart';
// EnhancedLiveChart removed - using enhanced LiveSimpleChart instead
import ChartTest from '@/components/charts/ChartTest';
import { authService } from '@/services/authService';
import { liveDataService } from '@/services/liveDataService';
import type { StockInfo } from '@/services/liveDataService';
import { ChartData } from '@/types/analysis';
import { useLiveChart } from '@/hooks/useLiveChart';
import stockList from '@/utils/stockList.json';

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
  const [enhancedChartData, setEnhancedChartData] = useState<ChartData[]>([]);
  const [showTestChart, setShowTestChart] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);
  const [availableStocks, setAvailableStocks] = useState<StockInfo[]>([]);
  const [currentStockInfo, setCurrentStockInfo] = useState<StockInfo | null>(null);
  
  // Stock dropdown state
  const [stockDialogOpen, setStockDialogOpen] = useState(false);
  const [stockSearch, setStockSearch] = useState('');
  
  // Chart type and features
  // Enhanced charts are now the default - no toggle needed
  const [showIndicators, setShowIndicators] = useState(true);
  const [showPatterns, setShowPatterns] = useState(true);
  const [debugMode, setDebugMode] = useState(false);
  
  // Live chart state
  const [enableLiveChart, setEnableLiveChart] = useState(true); // Enabled by default
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [liveDataError, setLiveDataError] = useState<string | null>(null);
  // Remove the lastDataUpdate state since we'll use lastUpdate from the hook
  
  // Chart statistics and validation
  const [chartStats, setChartStats] = useState<any>(null);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // Chart reset refs
  const liveChartResetRef = useRef<(() => void) | null>(null);
  const enhancedChartResetRef = useRef<(() => void) | null>(null);
  
  // Functions to register reset functions from chart components
  const registerLiveChartReset = (resetFn: () => void) => {
    liveChartResetRef.current = resetFn;
    console.log('Live chart reset function registered');
  };
  
  const registerEnhancedChartReset = (resetFn: () => void) => {
    enhancedChartResetRef.current = resetFn;
    console.log('Enhanced chart reset function registered');
  };
  


  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Live chart hook for real-time data
  const {
    data: liveData,
    isConnected: isLiveConnectedFromHook,
    isLive,
    isLoading: isLiveLoading,
    error: liveError,
    lastUpdate,
    connectionStatus,
    connect,
    disconnect,
    refetch,
    updateSymbol,
    updateTimeframe
  } = useLiveChart({
    symbol: stockInput,
    timeframe: selectedTimeframe,
    exchange: 'NSE',
    maxDataPoints: 1000,
    autoConnect: true
  });

  // Update local state from hook
  useEffect(() => {
    setIsLiveConnected(isLiveConnectedFromHook);
  }, [isLiveConnectedFromHook]);

  useEffect(() => {
    if (liveError) {
      setLiveDataError(liveError);
    } else {
      setLiveDataError(null);
    }
  }, [liveError]);

  // Update symbol when stockInput changes
  useEffect(() => {
    if (stockInput && enableLiveChart) {
      console.log('🔄 Updating symbol in useLiveChart hook:', stockInput);
      updateSymbol(stockInput);
    }
  }, [stockInput, enableLiveChart, updateSymbol]);

  // Update timeframe when selectedTimeframe changes
  useEffect(() => {
    if (selectedTimeframe && enableLiveChart) {
      console.log('🔄 Updating timeframe in useLiveChart hook:', selectedTimeframe);
      updateTimeframe(selectedTimeframe);
    }
  }, [selectedTimeframe, enableLiveChart, updateTimeframe]);

  // Debug live data updates
  useEffect(() => {
    if (liveData && liveData.length > 0) {
      console.log('📈 Live data updated in Charts page:', {
        dataLength: liveData.length,
        lastCandle: liveData[liveData.length - 1],
        lastUpdate: new Date(lastUpdate).toLocaleTimeString()
      });
    }
  }, [liveData, lastUpdate]);

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
    if (authStatus !== 'authenticated' || !stockInput || enableLiveChart) return;

    const loadRealData = async () => {
      try {
        setIsLoadingData(true);
        setDataError(null);

        console.log(`Loading real data for ${stockInput} with timeframe ${selectedTimeframe}`);

        // Clear cache for the previous interval to ensure fresh data
        await liveDataService.clearIntervalCache(stockInput, selectedTimeframe);

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
        
        // Convert to enhanced chart data format
        const enhancedData: ChartData[] = convertedData.map(d => ({
          date: d.date,
          open: d.open,
          high: d.high,
          low: d.low,
          close: d.close,
          volume: d.volume
        }));
        setEnhancedChartData(enhancedData);

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
  }, [authStatus, stockInput, selectedTimeframe, enableLiveChart]);

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
            {/* Stock Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Stock Symbol
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="flex-1 flex items-center justify-between rounded-lg border border-gray-300 bg-white px-4 py-3 text-left shadow-sm hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                  onClick={() => setStockDialogOpen(true)}
                >
                  {stockInput ? (
                    (() => {
                      const selected = stockList.find(s => s.symbol === stockInput);
                      return selected
                        ? `${selected.symbol} – ${selected.name}`
                        : stockInput;
                    })()
                  ) : (
                    "Select a stock"
                  )}
                  <span className="text-gray-400">▼</span>
                </button>
                <Button
                  variant="outline"
                  onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                >
                  {theme === 'light' ? '🌙' : '☀️'} Theme
                </Button>
              </div>
              
              <CommandDialog open={stockDialogOpen} onOpenChange={setStockDialogOpen}>
                <CommandInput
                  placeholder="Search stock by symbol or name..."
                  value={stockSearch}
                  onValueChange={setStockSearch}
                  autoFocus
                />
                <CommandList>
                  <CommandEmpty>No stocks found.</CommandEmpty>
                  <CommandGroup>
                    {stockList
                      .filter((s) =>
                        (s.symbol + " " + s.name + " " + s.exchange)
                          .toLowerCase()
                          .includes(stockSearch.toLowerCase())
                      )
                      .slice(0, 50)
                      .map((s) => (
                        <CommandItem
                          key={`${s.symbol}_${s.exchange}`}
                          value={s.symbol}
                          onSelect={() => {
                            setStockInput(s.symbol);
                            setStockDialogOpen(false);
                            setStockSearch("");
                          }}
                        >
                          <div className="flex items-center justify-between w-full">
                            <div>
                              <span className="font-semibold">{s.symbol}</span>
                              <span className="ml-2 text-gray-600 dark:text-gray-400">{s.name}</span>
                            </div>
                            <span className="text-xs text-gray-400">{s.exchange}</span>
                          </div>
                        </CommandItem>
                      ))}
                  </CommandGroup>
                </CommandList>
              </CommandDialog>
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

            {/* Chart Type and Features Controls */}
            <div className="space-y-4">
              <Separator />
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Chart Features</h4>
                
                {/* Indicators Toggle */}
                <div className="flex items-center space-x-2">
                  <Switch
                    id="show-indicators"
                    checked={showIndicators}
                    onCheckedChange={setShowIndicators}
                  />
                  <Label htmlFor="show-indicators" className="text-sm font-medium">
                    Show Technical Indicators (SMA, EMA, RSI, MACD, Bollinger Bands)
                  </Label>
                </div>
                
                {/* Patterns Toggle */}
                <div className="flex items-center space-x-2">
                  <Switch
                    id="show-patterns"
                    checked={showPatterns}
                    onCheckedChange={setShowPatterns}
                  />
                  <Label htmlFor="show-patterns" className="text-sm font-medium">
                    Show Pattern Recognition (Support/Resistance, Divergences, etc.)
                  </Label>
                </div>
                
                {/* Debug Mode Toggle */}
                <div className="flex items-center space-x-2">
                  <Switch
                    id="debug-mode"
                    checked={debugMode}
                    onCheckedChange={setDebugMode}
                  />
                  <Label htmlFor="debug-mode" className="text-sm font-medium">
                    Debug Mode (Show Chart Statistics)
                  </Label>
                </div>
              </div>
              
              <Separator />
              
              {/* Live Chart Controls */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Live Updates</h4>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="live-chart"
                    checked={enableLiveChart}
                    onCheckedChange={setEnableLiveChart}
                  />
                  <Label htmlFor="live-chart" className="text-sm font-medium">
                    Enable Live Updates
                  </Label>
                  {enableLiveChart && isLiveConnected && (
                    <Badge variant="default" className="ml-2">
                      🔴 LIVE
                    </Badge>
                  )}
                </div>
                
                {enableLiveChart && (
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <span>Status:</span>
                      <Badge variant={isLiveConnected ? 'default' : 'secondary'}>
                        {isLiveConnected ? 'Connected' : 'Disconnected'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>Current Time:</span>
                      <span className="font-mono">{currentTime.toLocaleTimeString()}</span>
                    </div>
                    {lastUpdate > 0 && (
                      <div className="flex items-center gap-1">
                        <span>Last Update:</span>
                        <span className="font-mono">{new Date(lastUpdate).toLocaleTimeString()}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Data Controls */}
            <div className="flex gap-2">
              {!enableLiveChart && (
                <Button
                  variant="outline"
                  onClick={() => {
                    // Reload data
                    setStockInput(stockInput);
                  }}
                  className="flex-1"
                  disabled={isLoadingData}
                >
                  {isLoadingData ? '🔄 Loading...' : '🔄 Refresh Chart'}
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => {
                  // Call the appropriate reset function based on chart type
                  if (enableLiveChart) {
                    console.log('Calling live chart reset function...');
                    liveChartResetRef.current?.();
                  } else {
                    console.log('Calling enhanced chart reset function...');
                    enhancedChartResetRef.current?.();
                  }
                }}
                className="flex-1"
                title="Reset chart scale to fit all data"
              >
                <ZoomIn className="w-4 h-4 mr-2" />
                Reset Scale
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
                {stockInput.toUpperCase()} - {enableLiveChart ? 'Live' : 'Real'} Data Chart
                {currentStockInfo && (
                  <span className="text-sm font-normal text-gray-500 ml-2">
                    ({currentStockInfo.name})
                  </span>
                )}
              </span>
              <div className="flex items-center gap-2">
                {enableLiveChart && isLiveConnected && (
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
            ) : enableLiveChart ? (
              <div className="h-[600px] w-full">
                <LiveSimpleChart
                  key={`${stockInput}-${selectedTimeframe}-${theme}-enhanced`}
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
                  showIndicators={showIndicators}
                  showPatterns={showPatterns}
                  showVolume={false}
                  debug={debugMode}
                  data={liveData}
                  isConnected={isLiveConnectedFromHook}
                  isLive={isLive}
                  isLoading={isLiveLoading}
                  error={liveError}
                  lastUpdate={lastUpdate}
                  connectionStatus={connectionStatus}
                  refetch={refetch}
                  onConnectionChange={(isConnected) => {
                    setIsLiveConnected(isConnected);
                  }}
                  onError={(error) => {
                    setLiveDataError(error);
                    console.error('Live chart error:', error);
                  }}
                  onValidationResult={(result) => {
                    setValidationResult(result);
                  }}
                  onStatsCalculated={(stats) => {
                    setChartStats(stats);
                  }}
                  onResetScale={() => {
                    console.log('Live chart scale reset');
                  }}
                  onRegisterReset={registerLiveChartReset}
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
                <EnhancedSimpleChart
                  data={enhancedChartData}
                  theme={theme}
                  height={600}
                  width={800}
                  timeframe={selectedTimeframe}
                  showIndicators={showIndicators}
                  showPatterns={showPatterns}
                  showVolume={false}
                  debug={debugMode}
                  onValidationResult={(result) => {
                    setValidationResult(result);
                  }}
                  onStatsCalculated={(stats) => {
                    setChartStats(stats);
                  }}
                  onResetScale={() => {
                    console.log('Enhanced chart scale reset');
                  }}
                  onRegisterReset={registerEnhancedChartReset}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chart Statistics (Debug Mode) */}
        {debugMode && chartStats && (
          <Card>
            <CardHeader>
              <CardTitle>Chart Statistics & Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
                    <h4 className="font-semibold text-sm mb-2">Data Summary</h4>
                    <div className="text-xs space-y-1">
                      <p>Total Points: {chartStats.totalPoints}</p>
                      <p>Date Range: {chartStats.dateRange?.start} to {chartStats.dateRange?.end} ({chartStats.dateRange?.days} days)</p>
                      <p>Price Range: ₹{chartStats.priceRange?.min?.toFixed(2)} - ₹{chartStats.priceRange?.max?.toFixed(2)}</p>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
                    <h4 className="font-semibold text-sm mb-2">Volume Analysis</h4>
                    <div className="text-xs space-y-1">
                      <p>Total Volume: {chartStats.volumeStats?.totalVolume?.toLocaleString()}</p>
                      <p>Avg Volume: {chartStats.volumeStats?.averageVolume?.toLocaleString()}</p>
                      <p>Volume Anomalies: {chartStats.volumeStats?.anomalies?.length || 0}</p>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
                    <h4 className="font-semibold text-sm mb-2">Pattern Detection</h4>
                    <div className="text-xs space-y-1">
                      <p>Support Levels: {chartStats.patterns?.supportLevels?.length || 0}</p>
                      <p>Resistance Levels: {chartStats.patterns?.resistanceLevels?.length || 0}</p>
                      <p>Double Tops: {chartStats.patterns?.doubleTops?.length || 0}</p>
                      <p>Double Bottoms: {chartStats.patterns?.doubleBottoms?.length || 0}</p>
                    </div>
                  </div>
                </div>
                
                {validationResult && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
                    <h4 className="font-semibold text-sm mb-2">Data Validation</h4>
                    <div className="text-xs space-y-1">
                      <p>Valid: {validationResult.isValid ? '✅ Yes' : '❌ No'}</p>
                      {validationResult.errors.length > 0 && (
                        <div>
                          <p className="font-semibold">Errors:</p>
                          <ul className="list-disc list-inside">
                            {validationResult.errors.map((error: string, index: number) => (
                              <li key={index}>{error}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {validationResult.warnings.length > 0 && (
                        <div>
                          <p className="font-semibold">Warnings:</p>
                          <ul className="list-disc list-inside">
                            {validationResult.warnings.map((warning: string, index: number) => (
                              <li key={index}>{warning}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <p>• Click the stock selection dropdown to search and select stocks by symbol or name</p>
              <p>• Click on any available stock badge for quick selection</p>
              <p>• Use the interval buttons to switch between different timeframes</p>
              <p>• Toggle between light and dark themes</p>
              <p>• <strong>Enhanced Charts:</strong> Enable for technical indicators and pattern recognition</p>
              <p>• <strong>Technical Indicators:</strong> SMA, EMA, RSI, MACD, Bollinger Bands</p>
              <p>• <strong>Pattern Recognition:</strong> Support/Resistance, RSI Divergences, Double Tops/Bottoms</p>
              <p>• <strong>Debug Mode:</strong> View detailed chart statistics and validation results</p>
              <p>• Enable "Live Updates" for real-time WebSocket data streaming</p>
              <p>• When live updates are enabled, charts update automatically</p>
              <p>• When live updates are disabled, use the refresh button to update static charts</p>
              <p>• Real market data is fetched from Zerodha API</p>
              <p>• Data updates automatically when you change stock or timeframe</p>
              <p>• Live charts automatically reconnect on connection loss</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 