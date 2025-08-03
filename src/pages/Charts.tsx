import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, formatPercentage } from '@/utils/numberFormatter';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ArrowLeft, TrendingDown, Minus, AlertTriangle, CheckCircle, XCircle, Loader2, BarChart3, Activity, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { analysisService } from '@/services/analysisService';
import { authService } from '@/services/authService';
import { apiService } from '@/services/api';
import { useLiveChart } from '@/hooks/useLiveChart';
import { useStockAnalyses } from '@/hooks/useStockAnalyses';
import { useDataStore } from '@/stores/dataStore';
import LiveSimpleChart from '@/components/charts/LiveSimpleChart';

// Analysis Components
import PriceStatisticsCard from '@/components/analysis/PriceStatisticsCard';

// UI Components
import { StockSelector } from '@/components/ui/stock-selector';
import { 
  AnalysisResponse
} from '@/types/analysis';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { DataStatusIndicator } from '@/components/DataStatusIndicator';
import Header from '@/components/Header';

interface ChartData {
  date: string;
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface ChartStats {
  dateRange: { start: string; end: string; days: number };
  price: { min: number; max: number; current: number };
  volume: { avg: number; total: number };
  returns: { avg: number; volatility: number };
}



const calculatePriceStatistics = (data: ChartData[] | null): ChartStats => {
  if (!data || data.length === 0) {
    return {
      dateRange: { start: '', end: '', days: 0 },
      price: { min: 0, max: 0, current: 0 },
      volume: { avg: 0, total: 0 },
      returns: { avg: 0, volatility: 0 }
    };
  }

  const prices = data.map(d => d.close);
  const volumes = data.map(d => d.volume);
  const returns = data.slice(1).map((d, i) => (d.close - data[i].close) / data[i].close);

  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const currentPrice = prices[prices.length - 1];
  const avgVolume = volumes.reduce((a, b) => a + b, 0) / volumes.length;
  const totalVolume = volumes.reduce((a, b) => a + b, 0);
  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const volatility = Math.sqrt(returns.reduce((a, b) => a + Math.pow(b - avgReturn, 2), 0) / returns.length);

  const startDate = new Date(data[0].time * 1000).toLocaleDateString();
  const endDate = new Date(data[data.length - 1].time * 1000).toLocaleDateString();
  const days = Math.ceil((data[data.length - 1].time - data[0].time) / (24 * 60 * 60));

  return {
    dateRange: { start: startDate, end: endDate, days },
    price: { min: minPrice, max: maxPrice, current: currentPrice },
    volume: { avg: avgVolume, total: totalVolume },
    returns: { avg: avgReturn, volatility }
  };
};

// Transform ChartStats to PriceStatisticsCard format
const transformChartStatsForPriceCard = (chartStats: ChartStats | null) => {
  if (!chartStats) {
    return {
      mean: 0,
      max: 0,
      min: 0,
      current: 0,
      distFromMean: 0,
      distFromMax: 0,
      distFromMin: 0,
      distFromMeanPct: 0,
      distFromMaxPct: 0,
      distFromMinPct: 0
    };
  }

  const { price } = chartStats;
  const mean = (price.max + price.min) / 2;
  const distFromMean = price.current - mean;
  const distFromMax = price.current - price.max;
  const distFromMin = price.current - price.min;
  const distFromMeanPct = mean !== 0 ? (distFromMean / mean) * 100 : 0;
  const distFromMaxPct = price.max !== 0 ? (distFromMax / price.max) * 100 : 0;
  const distFromMinPct = price.min !== 0 ? (distFromMin / price.min) * 100 : 0;

  return {
    mean,
    max: price.max,
    min: price.min,
    current: price.current,
    distFromMean,
    distFromMax,
    distFromMin,
    distFromMeanPct,
    distFromMaxPct,
    distFromMinPct
  };
};

// Map frontend timeframe values to API interval values
const mapTimeframeToInterval = (timeframe: string): string => {
  const mapping: Record<string, string> = {
    '1m': '1min',
    '5m': '5min',
    '15m': '15min',
    '1h': '1h',
    '1d': '1day'
  };
  return mapping[timeframe] || '1day';
};



// Global variable to persist price across component re-mounts
let globalLastPrice: number | null = null;

const TIMEFRAMES = [
  { label: '1 Minute', value: '1m' },
  { label: '5 Minutes', value: '5m' },
  { label: '15 Minutes', value: '15m' },
  { label: '1 Hour', value: '1h' },
  { label: '1 Day', value: '1d' }
];

const Charts = React.memo(function Charts() {
  // Core State
  const [stockSymbol, setStockSymbol] = useState<string>(() => {
    // Try to get the stock symbol from localStorage (from analysis page)
    const lastAnalyzedStock = localStorage.getItem('lastAnalyzedStock');
    return lastAnalyzedStock || 'NIFTY 50';
  });
  const [selectedTimeframe, setSelectedTimeframe] = useState('1d');

  
  // Authentication
  const [authStatus, setAuthStatus] = useState<'loading' | 'authenticated' | 'error'>('loading');
  const [authError, setAuthError] = useState<string>('');
  
  // Analysis State
  const [analysisData, setAnalysisData] = useState<AnalysisResponse | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Chart Features
  const [showIndicators, setShowIndicators] = useState(true);
  const [showPatterns, setShowPatterns] = useState(true);
  const [showVolume, setShowVolume] = useState(true);
  const [debugMode, setDebugMode] = useState(true);
  const [chartDataLoaded, setChartDataLoaded] = useState(false);
  const [chartData, setChartData] = useState<ChartData[] | null>(null);
  const [lastCandleCount, setLastCandleCount] = useState(0);
  const [isPriceStatsUpdating, setIsPriceStatsUpdating] = useState(false);
  const chartResetRef = useRef<(() => void) | null>(null);
  
  // Live chart hook for real-time data
  // This hook provides real-time WebSocket data streaming with auto-reconnection
  // and handles all live chart functionality including data updates, connection status,
  // and error handling
  const {
    data: liveData,
    isConnected: isLiveConnected,
    isLive,
    isLoading: isLiveLoading,
    error: liveError,
    lastUpdate,
    connectionStatus,
    lastTickPrice,
    lastTickTime,
    connect,
    disconnect,
    refetch,
    updateSymbol,
    updateTimeframe
  } = useLiveChart({
    symbol: stockSymbol,
    timeframe: selectedTimeframe,
    exchange: 'NSE',
    maxDataPoints: 1000,
    autoConnect: true
  });

  // Debug lastTickPrice changes
  useEffect(() => {
    // console.log('🔄 lastTickPrice changed:', lastTickPrice, 'at', new Date().toLocaleTimeString());
    // console.log('🔄 lastTickPrice type:', typeof lastTickPrice, 'isNaN:', isNaN(lastTickPrice || 0));
  }, [lastTickPrice]);

  // Initialize authentication
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setAuthStatus('loading');
        const token = await authService.ensureAuthenticated();
        if (token) {
          setAuthStatus('authenticated');
          // console.log('✅ Authentication successful');
        } else {
          setAuthStatus('error');
          setAuthError('Failed to authenticate');
        }
      } catch (error) {
        setAuthStatus('error');
        setAuthError(error instanceof Error ? error.message : 'Authentication failed');
        // console.error('❌ Authentication error:', error);
      }
    };

    initializeAuth();
  }, []);

  // Handle stock symbol change
  const handleStockSymbolChange = (newSymbol: string) => {
    setStockSymbol(newSymbol);
    // Clear the localStorage value when user manually changes the stock
    // This prevents it from interfering with future manual selections
    localStorage.removeItem('lastAnalyzedStock');
  };

  // Load analysis data
  useEffect(() => {
    const loadAnalysisData = async () => {
      if (!stockSymbol || authStatus !== 'authenticated') return;
      
      try {
        setAnalysisLoading(true);
        setError(null);
        
        // Try to get from API first
        const interval = mapTimeframeToInterval(selectedTimeframe);
        const data = await apiService.getHistoricalData(stockSymbol, interval, 'NSE', 1000);
        if (data && data.success && data.candles && data.candles.length > 0) {
          // For now, we'll use the live data for analysis since we have it
          // In a real implementation, you might want to call a separate analysis API
          setAnalysisData({
            consensus: { 
              overall_signal: 'Neutral',
              signal_strength: 'Weak',
              bullish_percentage: 50,
              bearish_percentage: 50,
              neutral_percentage: 0
            },
            indicators: {
              moving_averages: {
                sma_20: 0,
                sma_50: 0,
                sma_200: 0,
                ema_20: 0,
                ema_50: 0,
                price_to_sma_200: 0,
                sma_20_to_sma_50: 0,
                golden_cross: false,
                death_cross: false
              },
              rsi: {
                rsi_14: 50,
                trend: 'neutral',
                status: 'neutral'
              },
              macd: {
                macd_line: 0,
                signal_line: 0,
                histogram: 0
              },
              bollinger_bands: {
                upper_band: 0,
                middle_band: 0,
                lower_band: 0,
                percent_b: 0.5,
                bandwidth: 0
              },
              volume: {
                volume_ratio: 1,
                obv: 0,
                obv_trend: 'neutral'
              },
              adx: {
                adx: 25,
                plus_di: 25,
                minus_di: 25,
                trend_direction: 'neutral'
              },
              trend_data: {
                direction: 'neutral',
                strength: 'weak',
                adx: 25,
                plus_di: 25,
                minus_di: 25
              },
              raw_data: {
                open: [],
                high: [],
                low: [],
                close: [],
                volume: []
              },
              metadata: {
                start: '',
                end: '',
                period: 0,
                last_price: 0,
                last_volume: 0,
                data_quality: {
                  is_valid: true,
                  warnings: [],
                  data_quality_issues: [],
                  missing_data: [],
                  suspicious_patterns: []
                },
                indicator_availability: {
                  sma_20: true,
                  sma_50: true,
                  sma_200: true,
                  ema_20: true,
                  ema_50: true,
                  macd: true,
                  rsi: true,
                  bollinger_bands: true,
                  stochastic: true,
                  adx: true,
                  obv: true,
                  volume_ratio: true,
                  atr: true
                }
              }
            },
            chart_insights: 'Live chart data available',
            indicator_summary_md: 'Technical indicators will be calculated from live data'
          });
        } else {
          // Fallback to localStorage
          const storedAnalysis = localStorage.getItem('analysisResult');
          if (storedAnalysis) {
            const parsed = JSON.parse(storedAnalysis);
            setAnalysisData(parsed);
          }
        }
      } catch (err) {
        // console.error('Error loading analysis data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load analysis data');
      } finally {
        setAnalysisLoading(false);
      }
    };

    loadAnalysisData();
  }, [stockSymbol, selectedTimeframe, authStatus]);

  // Update live chart when stock symbol changes
  useEffect(() => {
    if (stockSymbol) {
      // console.log('🔄 Stock symbol changed to:', stockSymbol, 'at', new Date().toISOString());
      // Set loading state immediately when symbol changes
      setChartDataLoaded(false);
      // Clear any existing data immediately
      setChartData(null);
      // The useLiveChart hook will handle the symbol change automatically
    }
  }, [stockSymbol]);

  // Update live chart when timeframe changes
  useEffect(() => {
    if (selectedTimeframe) {
      // console.log('🔄 Timeframe changed to:', selectedTimeframe, 'at', new Date().toISOString());
      // Set loading state immediately when timeframe changes
      setChartDataLoaded(false);
      // Clear any existing data immediately
      setChartData(null);
      // The useLiveChart hook will handle the timeframe change automatically
    }
  }, [selectedTimeframe]);

  // Handle chart data loaded
  const handleChartDataLoaded = useCallback((data: ChartData[]) => {
    // console.log('Chart data loaded:', data.length, 'points');
    setChartData(data);
    
    // Chart stats will be calculated automatically by the memoized function
  }, []);

  // Handle live chart data updates
  useEffect(() => {
    if (liveData && liveData.length > 0) {
      setChartDataLoaded(true);
      // console.log('📈 Live data updated in Charts page:', {
      //   dataLength: liveData.length,
      //   lastCandle: liveData[liveData.length - 1],
      //   lastUpdate: new Date(lastUpdate).toLocaleTimeString()
      // });
    }
  }, [liveData?.length, lastUpdate]); // Only depend on length and lastUpdate, not the entire liveData array

  // Handle chart error
  const handleChartError = useCallback((error: string) => {
    // console.error('Chart error:', error);
    setError(error);
  }, []);

  // Handle live chart errors
  useEffect(() => {
    if (liveError) {
      // console.error('Live chart error:', liveError);
      setError(liveError);
    }
  }, [liveError]);

  // Handle connection status change
  const handleConnectionChange = useCallback((isConnected: boolean) => {
    // console.log('Connection status changed:', isConnected);
  }, []);

  // Handle validation result
  const handleValidationResult = useCallback((result: any) => {
    // console.log('Chart validation result:', result);
  }, []);

  // Handle stats calculated
  const handleStatsCalculated = useCallback((stats: any) => {
    // console.log('Chart stats calculated:', stats);
  }, []);

  // Show charts immediately when stock symbol is available, regardless of analysis loading
  const canShowCharts = useMemo(() => stockSymbol && !error, [stockSymbol, error]);
  
  // Check if chart is loading due to symbol change
  const isChartLoading = useMemo(() => {
    return isLiveLoading;
  }, [isLiveLoading]);

  // Memoize chart stats calculation for analysis data
  const memoizedChartStats = useMemo(() => {
    if (chartData) {
      return calculatePriceStatistics(chartData);
    }
    return null;
  }, [chartData]);

  // Memoize live chart stats calculation for Price Statistics Card
  const memoizedLiveChartStats = useMemo(() => {
    if (liveData && liveData.length > 0) {
      return calculatePriceStatistics(liveData);
    }
    return null;
  }, [liveData]);

  // Detect new candles and trigger update animation for Price Statistics Card
  useEffect(() => {
    if (liveData && liveData.length > 0) {
      if (liveData.length > lastCandleCount && lastCandleCount > 0) {
        // New candle added
        setIsPriceStatsUpdating(true);
        setTimeout(() => setIsPriceStatsUpdating(false), 1000); // Show animation for 1 second
        // console.log('🕯️ New candle detected, updating Price Statistics Card');
      }
      setLastCandleCount(liveData.length);
    }
  }, [liveData, lastCandleCount]);

  // Loading and error states
  if (authStatus === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="w-24 h-24 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <Loader2 className="h-12 w-12 text-slate-400 animate-spin" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-4">Authenticating...</h1>
        </div>
      </div>
    );
  }

  if (authStatus === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="w-24 h-24 bg-red-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-12 w-12 text-red-400" />
          </div>
          <h1 className="text-3xl font-bold text-red-800 mb-4">Authentication Failed</h1>
          <p className="text-red-600 mb-4">{authError}</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (error && !canShowCharts) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="w-24 h-24 bg-red-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-12 w-12 text-red-400" />
          </div>
          <h1 className="text-3xl font-bold text-red-800 mb-4">{error}</h1>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const consensus = analysisData?.consensus;
  const indicators = analysisData?.indicators;
  const indicator_summary_md = analysisData?.indicator_summary_md;
  const chart_insights = analysisData?.chart_insights;

  // Get signal color
  const getSignalColor = (signal: string) => {
    switch (signal?.toLowerCase()) {
      case 'bullish': return 'text-green-600 bg-green-50 border-green-200';
      case 'bearish': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  // Get signal icon
  const getSignalIcon = (signal: string) => {
    switch (signal?.toLowerCase()) {
      case 'bullish': return <ArrowUpRight className="h-4 w-4" />;
      case 'bearish': return <ArrowDownRight className="h-4 w-4" />;
      default: return <Minus className="h-4 w-4" />;
    }
  };

  // Loading skeleton for analysis cards
  const AnalysisCardSkeleton = ({ title, description }: { title: string; description: string }) => (
    <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
      <CardHeader className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-4">
          <CardTitle className="flex items-center text-slate-800">
            <Loader2 className="h-5 w-5 mr-2 text-blue-500 animate-spin" />
            {title}
          </CardTitle>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <div className="flex space-x-2">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
        {analysisLoading && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
              <span className="text-sm text-blue-700">Waiting for analysis data...</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  // Live Price Label Component - Optimized to reduce flickering
  const LivePriceLabel = React.memo(({ price, isConnected, isLive, liveData, lastTickTime }: { 
    price?: number; 
    isConnected: boolean; 
    isLive: boolean; 
    liveData: any[];
    lastTickTime?: number;
  }) => {
    const [isUpdating, setIsUpdating] = useState(false);
    const [previousPrice, setPreviousPrice] = useState<number | null>(null);
    const [stablePrice, setStablePrice] = useState<number | null>(null);
    const [stableColorState, setStableColorState] = useState<'positive' | 'negative' | 'neutral'>('neutral');
    const lastPriceRef = useRef<number | null>(null);
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Debounced price update to reduce flickering
    useEffect(() => {
      if (price === undefined || price === null) return;

      // Clear existing timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Set a new timer for debounced update
      debounceTimerRef.current = setTimeout(() => {
        if (globalLastPrice === null) {
          // First price - just store it
          globalLastPrice = price;
          setPreviousPrice(price);
          setStablePrice(price);
          setStableColorState('neutral');
        } else if (globalLastPrice !== price) {
          // Price changed - update with stable state
          const priceChange = price - globalLastPrice;
          const newColorState = priceChange > 0 ? 'positive' : priceChange < 0 ? 'negative' : 'neutral';
          
          setPreviousPrice(globalLastPrice);
          setStablePrice(price);
          setStableColorState(newColorState);
          globalLastPrice = price;
          
          // Trigger update animation
          setIsUpdating(true);
          setTimeout(() => setIsUpdating(false), 300);
        }
      }, 100); // 100ms debounce

      return () => {
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
      };
    }, [price]);

    // Calculate stable price change
    const priceChange = stablePrice && globalLastPrice && globalLastPrice !== stablePrice ? stablePrice - globalLastPrice : 0;
    const percentageChange = stablePrice && globalLastPrice && globalLastPrice !== 0 ? (priceChange / globalLastPrice) * 100 : 0;
    
    // Use stable color state instead of calculating on every render
    const isPositive = stableColorState === 'positive';
    const isNegative = stableColorState === 'negative';
    const hasPriceChange = globalLastPrice !== null && stablePrice !== globalLastPrice;

    // Cleanup on unmount
    useEffect(() => {
      return () => {
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
      };
    }, []);

    // Format timestamp
    const formatTime = (timestamp?: number) => {
      if (!timestamp) return '';
      try {
        const date = new Date(timestamp * 1000);
        return date.toLocaleTimeString('en-IN', { 
          hour: '2-digit', 
          minute: '2-digit', 
          second: '2-digit',
          hour12: false 
        });
      } catch (error) {
        // console.error('Error formatting timestamp:', error);
        return '';
      }
    };

    // Handle different connection states
    if (!isConnected) {
      return (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg border">
          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
          <span className="text-sm font-medium text-gray-500">Disconnected</span>
        </div>
      );
    }

    if (!price) {
      return (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-50 rounded-lg border border-yellow-200">
          <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium text-yellow-700">Waiting for data...</span>
        </div>
      );
    }



    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={`flex items-center gap-3 px-3 py-2 border rounded-lg shadow-sm cursor-help transition-all duration-300 ${
              isUpdating ? 'shadow-md' : ''
            } ${
              isPositive ? 'bg-green-50 border-green-200' :
              isNegative ? 'bg-red-50 border-red-200' :
              'bg-white border-gray-200'
            }`}>
              {/* Price and Change */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                    isPositive ? 'bg-green-600' :
                    isNegative ? 'bg-red-600' :
                    'bg-green-500 animate-pulse'
                  } ${isUpdating ? 'animate-ping' : ''}`}></div>
                                         <span className={`text-sm font-semibold transition-colors duration-300 ${
                         isPositive ? 'text-green-800' :
                         isNegative ? 'text-red-800' :
                         'text-gray-900'
                       }`}>
                         {formatCurrency(stablePrice || price || 0)}
                       </span>
                </div>
                

              </div>
              
              {/* Separator */}
              <div className="w-px h-4 bg-gray-300"></div>
              
              {/* Status and Time */}
              <div className="flex items-center gap-2">
                {isLive && (
                  <span className={`text-xs font-medium px-1.5 py-0.5 rounded transition-colors duration-300 ${
                    isPositive ? 'text-green-700 bg-green-100' :
                    isNegative ? 'text-red-700 bg-red-100' :
                    'text-green-600 bg-green-50'
                  }`}>
                    LIVE
                  </span>
                )}
                {lastTickTime && (
                  <span className="text-xs text-gray-500 font-medium">
                    {formatTime(lastTickTime)}
                  </span>
                )}
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <div className="space-y-1">
              <div className="font-medium">Live Price Data</div>
              <div className="text-xs text-gray-500">
                <div>Current Price: {formatCurrency(stablePrice || price || 0)}</div>
                {hasPriceChange && (
                  <>
                    <div>Previous Price: {formatCurrency(previousPrice)}</div>
                                          <div>Change: {formatCurrency(priceChange, '', priceChange > 0 ? '+' : '')} ({formatPercentage(percentageChange, true)})</div>
                    <div>Direction: {isPositive ? '🟢 UP' : isNegative ? '🔴 DOWN' : '⚪ NO CHANGE'}</div>
                  </>
                )}
                <div>Status: {isLive ? 'Live Streaming' : 'Connected'}</div>
                {lastTickTime && (
                  <div>Last Update: {new Date(lastTickTime * 1000).toLocaleString('en-IN')}</div>
                )}
                <div>Data Points: {liveData.length}</div>
                <div>Has Change: {hasPriceChange ? 'Yes' : 'No'}</div>
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Header />
      <div className="container mx-auto px-2 py-8 max-w-[1920px]">


        {/* Main Content */}
        <div className="space-y-6">
          {/* Chart Controls */}
          <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Chart Controls
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                {/* Stock Symbol */}
                <div>
                  <StockSelector
                    value={stockSymbol}
                    onValueChange={handleStockSymbolChange}
                    placeholder="Select a stock"
                    label="Stock Symbol"
                  />
                </div>

                {/* Timeframe */}
                <div>
                  <label className="block text-sm font-medium mb-2">Timeframe</label>
                  <select
                    value={selectedTimeframe}
                    onChange={(e) => setSelectedTimeframe(e.target.value)}
                    className="w-full p-2 border rounded-md"
                  >
                    {TIMEFRAMES.map((tf) => (
                      <option key={tf.value} value={tf.value}>
                        {tf.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Connection Status */}
                <div>
                  <label className="block text-sm font-medium mb-2">Connection</label>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isLiveConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="text-sm">{isLiveConnected ? 'Connected' : 'Disconnected'}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Chart and Price Statistics Side by Side */}
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            {/* Enhanced Live Chart Section - Takes 3/4 of the width */}
            <div className="xl:col-span-3">
              <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm h-full">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{stockSymbol} - {TIMEFRAMES.find(tf => tf.value === selectedTimeframe)?.label}</span>
                    <div className="flex items-center gap-2">
                      <DataStatusIndicator
                        isConnected={isLiveConnected}
                        isLive={isLive}
                        connectionStatus={connectionStatus}
                        error={liveError}
                      />
                      <LivePriceLabel
                        price={lastTickPrice}
                        isConnected={isLiveConnected}
                        isLive={isLive}
                        liveData={liveData}
                        lastTickTime={lastTickTime}
                      />
                    </div>
                  </CardTitle>
                  <CardDescription>
                    Real-time market data with advanced technical analysis
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {canShowCharts ? (
                    <LiveSimpleChart
                      symbol={stockSymbol}
                      timeframe={selectedTimeframe}
                      theme="light"
                      height={800}
                      width={1200}
                      exchange="NSE"
                      maxDataPoints={1000}
                      autoConnect={true}
                      showConnectionStatus={true}
                      showLiveIndicator={true}
                      showIndicators={showIndicators}
                      showPatterns={showPatterns}
                      showVolume={showVolume}
                      debug={debugMode}
                      data={liveData}
                      isConnected={isLiveConnected}
                      isLive={isLive}
                      isLoading={isLiveLoading}
                      error={liveError}
                      lastUpdate={lastUpdate}
                      connectionStatus={connectionStatus}
                      refetch={refetch}
                      onDataUpdate={handleChartDataLoaded}
                      onConnectionChange={handleConnectionChange}
                      onError={handleChartError}
                      onValidationResult={handleValidationResult}
                      onStatsCalculated={handleStatsCalculated}
                      onResetScale={() => {
                        // Reset the chart to fit content and clear user interaction state
                        if (chartResetRef.current) {
                          chartResetRef.current();
                        }
                      }}
                      onRegisterReset={(resetFn) => {
                        chartResetRef.current = resetFn;
                      }}
                    />
                  ) : (
                    <div className="text-center py-16 text-slate-500">
                      <BarChart3 className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                      <p>{stockSymbol ? 'Initializing chart...' : 'Loading stock data...'}</p>
                      {stockSymbol && (
                        <p className="text-sm text-slate-400 mt-2">Chart will be available shortly</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Price Statistics Card - Takes 1/4 of the width */}
            <div className="xl:col-span-1 h-full">
              {!liveData || liveData.length === 0 ? (
                <AnalysisCardSkeleton 
                  title="Price Statistics" 
                  description="Waiting for live data..." 
                />
              ) : (
                <div className={`h-full transition-all duration-300 ${isPriceStatsUpdating ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}`}>
                  <PriceStatisticsCard 
                    summaryStats={transformChartStatsForPriceCard(memoizedLiveChartStats)}
                    latestPrice={liveData[liveData.length - 1].close || liveData[liveData.length - 1].price}
                    timeframe={selectedTimeframe === 'all' ? 'All Time' : selectedTimeframe}
                  />
                  {isPriceStatsUpdating && (
                    <div className="absolute top-2 right-2 z-10">
                      <Badge variant="secondary" className="bg-blue-500 text-white animate-pulse">
                        <Activity className="h-3 w-3 mr-1" />
                        New Candle
                      </Badge>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default Charts;
