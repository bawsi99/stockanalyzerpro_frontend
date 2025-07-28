import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ArrowLeft, TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle, XCircle, Loader2, Eye, BarChart3, Settings } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { analysisService } from '@/services/analysisService';
import { authService } from '@/services/authService';
import { apiService } from '@/services/api';
import { useLiveChart } from '@/hooks/useLiveChart';
import { useStockAnalyses } from '@/hooks/useStockAnalyses';
import { useDataStore } from '@/stores/dataStore';
import LiveSimpleChart from '@/components/charts/LiveSimpleChart';

// Analysis Components
import ConsensusSummaryCard from '@/components/analysis/ConsensusSummaryCard';
import AITradingAnalysisOverviewCard from '@/components/analysis/AITradingAnalysisOverviewCard';
import PriceStatisticsCard from '@/components/analysis/PriceStatisticsCard';
import SectorBenchmarkingCard from '@/components/analysis/SectorBenchmarkingCard';
import TechnicalAnalysisCard from '@/components/analysis/TechnicalAnalysisCard';
import EnhancedPatternRecognitionCard from '@/components/analysis/EnhancedPatternRecognitionCard';
import AdvancedPatternAnalysisCard from '@/components/analysis/AdvancedPatternAnalysisCard';
import MultiTimeframeAnalysisCard from '@/components/analysis/MultiTimeframeAnalysisCard';
import AdvancedRiskAssessmentCard from '@/components/analysis/AdvancedRiskAssessmentCard';
import ComplexPatternAnalysisCard from '@/components/analysis/ComplexPatternAnalysisCard';
import AdvancedRiskMetricsCard from '@/components/analysis/AdvancedRiskMetricsCard';

// UI Components
import { StockSelector } from '@/components/ui/stock-selector';
import { 
  AnalysisResponse, 
  EnhancedOverlays, 
  AdvancedPatterns,
  MultiTimeframeAnalysis,
  AdvancedRiskMetrics,
  StressTestingData,
  ScenarioAnalysisData
} from '@/types/analysis';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { DataStatusIndicator } from '@/components/DataStatusIndicator';

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

interface ExtendedIndicators {
  advanced_patterns?: AdvancedPatterns;
  multi_timeframe?: MultiTimeframeAnalysis;
  advanced_risk?: AdvancedRiskMetrics;
  stress_testing?: StressTestingData;
  scenario_analysis?: ScenarioAnalysisData;
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
  const [stockSymbol, setStockSymbol] = useState<string>('NIFTY 50');
  const [selectedTimeframe, setSelectedTimeframe] = useState('1d');
  const [activeTab, setActiveTab] = useState('overview');
  
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
    console.log('🔄 lastTickPrice changed:', lastTickPrice, 'at', new Date().toLocaleTimeString());
    console.log('🔄 lastTickPrice type:', typeof lastTickPrice, 'isNaN:', isNaN(lastTickPrice || 0));
  }, [lastTickPrice]);

  // Initialize authentication
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setAuthStatus('loading');
        const token = await authService.ensureAuthenticated();
        if (token) {
          setAuthStatus('authenticated');
          console.log('✅ Authentication successful');
        } else {
          setAuthStatus('error');
          setAuthError('Failed to authenticate');
        }
      } catch (error) {
        setAuthStatus('error');
        setAuthError(error instanceof Error ? error.message : 'Authentication failed');
        console.error('❌ Authentication error:', error);
      }
    };

    initializeAuth();
  }, []);

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
        console.error('Error loading analysis data:', err);
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
      console.log('🔄 Stock symbol changed to:', stockSymbol, 'at', new Date().toISOString());
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
      console.log('🔄 Timeframe changed to:', selectedTimeframe, 'at', new Date().toISOString());
      // Set loading state immediately when timeframe changes
      setChartDataLoaded(false);
      // Clear any existing data immediately
      setChartData(null);
      // The useLiveChart hook will handle the timeframe change automatically
    }
  }, [selectedTimeframe]);

  // Handle chart data loaded
  const handleChartDataLoaded = useCallback((data: ChartData[]) => {
    console.log('Chart data loaded:', data.length, 'points');
    setChartData(data);
    
    // Chart stats will be calculated automatically by the memoized function
  }, []);

  // Handle live chart data updates
  useEffect(() => {
    if (liveData && liveData.length > 0) {
      setChartDataLoaded(true);
      console.log('📈 Live data updated in Charts page:', {
        dataLength: liveData.length,
        lastCandle: liveData[liveData.length - 1],
        lastUpdate: new Date(lastUpdate).toLocaleTimeString()
      });
    }
  }, [liveData?.length, lastUpdate]); // Only depend on length and lastUpdate, not the entire liveData array

  // Handle chart error
  const handleChartError = useCallback((error: string) => {
    console.error('Chart error:', error);
    setError(error);
  }, []);

  // Handle live chart errors
  useEffect(() => {
    if (liveError) {
      console.error('Live chart error:', liveError);
      setError(liveError);
    }
  }, [liveError]);

  // Handle connection status change
  const handleConnectionChange = useCallback((isConnected: boolean) => {
    console.log('Connection status changed:', isConnected);
  }, []);

  // Handle validation result
  const handleValidationResult = useCallback((result: any) => {
    console.log('Chart validation result:', result);
  }, []);

  // Handle stats calculated
  const handleStatsCalculated = useCallback((stats: any) => {
    console.log('Chart stats calculated:', stats);
  }, []);

  // Show charts immediately when stock symbol is available, regardless of analysis loading
  const canShowCharts = useMemo(() => stockSymbol && !error, [stockSymbol, error]);
  
  // Check if chart is loading due to symbol change
  const isChartLoading = useMemo(() => {
    return isLiveLoading;
  }, [isLiveLoading]);

  // Memoize chart stats calculation
  const memoizedChartStats = useMemo(() => {
    if (chartData) {
      return calculatePriceStatistics(chartData);
    }
    return null;
  }, [chartData]);

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
        console.error('Error formatting timestamp:', error);
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
                         ₹{(stablePrice || price || 0).toFixed(2)}
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
                <div>Current Price: ₹{(stablePrice || price || 0).toFixed(2)}</div>
                {hasPriceChange && (
                  <>
                    <div>Previous Price: ₹{previousPrice?.toFixed(2)}</div>
                    <div>Change: {priceChange > 0 ? '+' : ''}{priceChange.toFixed(2)} ({percentageChange > 0 ? '+' : ''}{percentageChange.toFixed(2)}%)</div>
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
      <div className="container mx-auto px-4 py-8">
        {/* Stock Header */}
        <div className="mb-8">
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold text-slate-800 mb-2">
              {stockSymbol || "Loading..."} Analysis
            </h1>
          </div>


        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white/80 backdrop-blur-sm">
            <TabsTrigger value="overview" className="flex items-center space-x-2">
              <Eye className="h-4 w-4" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger value="charts" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>Charts</span>
              {chartDataLoaded && (
                <div className="w-2 h-2 bg-green-500 rounded-full ml-1"></div>
              )}
            </TabsTrigger>
            <TabsTrigger value="technical" className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4" />
              <span>Technical</span>
            </TabsTrigger>
            <TabsTrigger value="advanced" className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span>Advanced</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Top Row - Summary Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Consensus Summary */}
              <div className="lg:col-span-1">
                {analysisLoading ? (
                  <AnalysisCardSkeleton 
                    title="Consensus Summary" 
                    description="Loading consensus analysis..." 
                  />
                ) : (
                  <ConsensusSummaryCard consensus={consensus} />
                )}
              </div>
              
              {/* AI Trading Analysis */}
              <div className="lg:col-span-1">
                {analysisLoading ? (
                  <AnalysisCardSkeleton 
                    title="AI Trading Analysis" 
                    description="Loading AI analysis..." 
                  />
                ) : (
                  <AITradingAnalysisOverviewCard aiAnalysis={analysisData?.ai_analysis} />
                )}
              </div>
            </div>

            {/* Bottom Row - Price Statistics and Sector Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Price Statistics Card */}
              <div className="lg:col-span-1">
                {analysisLoading ? (
                  <AnalysisCardSkeleton 
                    title="Price Statistics" 
                    description="Loading price statistics..." 
                  />
                ) : (
                  <PriceStatisticsCard 
                    summaryStats={transformChartStatsForPriceCard(memoizedChartStats)}
                    latestPrice={liveData && liveData.length > 0 ? liveData[liveData.length - 1].close || liveData[liveData.length - 1].price : null}
                    timeframe={selectedTimeframe === 'all' ? 'All Time' : selectedTimeframe}
                  />
                )}
              </div>
              
              <div className="lg:col-span-1">
                {analysisLoading ? (
                  <AnalysisCardSkeleton 
                    title="Sector Benchmarking" 
                    description="Loading sector analysis..." 
                  />
                ) : (
                  analysisData?.sector_benchmarking && (
                    <SectorBenchmarkingCard 
                      sectorBenchmarking={analysisData.sector_benchmarking} 
                    />
                  )
                )}
              </div>
            </div>
          </TabsContent>

          {/* Charts Tab */}
          <TabsContent value="charts" className="space-y-6">
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
                      onValueChange={setStockSymbol}
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

            {/* Enhanced Live Chart Section */}
            <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
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
          </TabsContent>

          {/* Technical Tab */}
          <TabsContent value="technical" className="space-y-6">
            {analysisLoading ? (
              <AnalysisCardSkeleton 
                title="Technical Analysis" 
                description="Loading technical indicators..." 
              />
            ) : (
              indicator_summary_md && (
                <TechnicalAnalysisCard 
                  indicatorSummary={indicator_summary_md || ''} 
                />
              )
            )}

            {analysisLoading ? (
              <AnalysisCardSkeleton 
                title="Pattern Recognition" 
                description="Loading pattern analysis..." 
              />
            ) : (
              analysisData?.overlays && (
                <EnhancedPatternRecognitionCard 
                  overlays={analysisData.overlays as EnhancedOverlays}
                  symbol={stockSymbol}
                />
              )
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {analysisLoading ? (
                <>
                  <AnalysisCardSkeleton 
                    title="Advanced Patterns" 
                    description="Loading pattern analysis..." 
                  />
                  <AnalysisCardSkeleton 
                    title="Multi-timeframe Analysis" 
                    description="Loading timeframe analysis..." 
                  />
                </>
              ) : (
                <>
                  {(indicators as ExtendedIndicators)?.advanced_patterns && (
                    <AdvancedPatternAnalysisCard 
                      patterns={(indicators as ExtendedIndicators).advanced_patterns!} 
                      symbol={stockSymbol}
                    />
                  )}

                  {(indicators as ExtendedIndicators)?.multi_timeframe && !(indicators as ExtendedIndicators).multi_timeframe?.error && (
                    <MultiTimeframeAnalysisCard 
                      analysis={(indicators as ExtendedIndicators).multi_timeframe!} 
                      symbol={stockSymbol}
                    />
                  )}
                </>
              )}
            </div>
          </TabsContent>

          {/* Advanced Tab */}
          <TabsContent value="advanced" className="space-y-6">
            {analysisLoading ? (
              <>
                <AnalysisCardSkeleton 
                  title="Risk Assessment" 
                  description="Loading risk analysis..." 
                />
                <AnalysisCardSkeleton 
                  title="Complex Patterns" 
                  description="Loading complex patterns..." 
                />
                <AnalysisCardSkeleton 
                  title="Risk Metrics" 
                  description="Loading risk metrics..." 
                />
              </>
            ) : (
              <>
                {(indicators as ExtendedIndicators)?.advanced_risk && !(indicators as ExtendedIndicators).advanced_risk?.error && (
                  <AdvancedRiskAssessmentCard 
                    riskMetrics={(indicators as ExtendedIndicators).advanced_risk!}
                    symbol={stockSymbol}
                  />
                )}

                {(indicators as ExtendedIndicators)?.advanced_patterns && (
                  <ComplexPatternAnalysisCard 
                    patterns={(indicators as ExtendedIndicators).advanced_patterns!}
                  />
                )}

                {((indicators as ExtendedIndicators)?.stress_testing || (indicators as ExtendedIndicators)?.scenario_analysis) && (
                  <AdvancedRiskMetricsCard 
                    stress_testing={(indicators as ExtendedIndicators)?.stress_testing}
                    scenario_analysis={(indicators as ExtendedIndicators)?.scenario_analysis}
                  />
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
});

export default Charts;
