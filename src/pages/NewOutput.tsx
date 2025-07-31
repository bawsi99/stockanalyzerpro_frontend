import React, { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

// Icons
import { 
  TrendingUp, 
  BarChart3, 
  AlertTriangle, 
  ArrowUpRight, 
  ArrowDownRight,
  Minus,
  Settings,
  Loader2,
  Eye,
  Activity,
  Wifi,
  WifiOff,
  RefreshCw,
  ZoomIn,
  Target,
  Shield,
  ChartBar,
  DollarSign,
  Brain,
  Clock,
  Building2,
  CheckCircle
} from 'lucide-react';

// Analysis Components
import ConsensusSummaryCard from "@/components/analysis/ConsensusSummaryCard";
import AITradingAnalysisOverviewCard from "@/components/analysis/AITradingAnalysisOverviewCard";
import TechnicalAnalysisCard from "@/components/analysis/TechnicalAnalysisCard";
import AdvancedPatternAnalysisCard from "@/components/analysis/AdvancedPatternAnalysisCard";
import MultiTimeframeAnalysisCard from "@/components/analysis/MultiTimeframeAnalysisCard";
import AdvancedRiskAssessmentCard from "@/components/analysis/AdvancedRiskAssessmentCard";
import ComplexPatternAnalysisCard from "@/components/analysis/ComplexPatternAnalysisCard";
import AdvancedRiskMetricsCard from "@/components/analysis/AdvancedRiskMetricsCard";
import SectorAnalysisCard from "@/components/analysis/SectorAnalysisCard";
import SectorBenchmarkingCard from "@/components/analysis/SectorBenchmarkingCard";
import EnhancedPatternRecognitionCard from "@/components/analysis/EnhancedPatternRecognitionCard";
import PriceStatisticsCard from "@/components/analysis/PriceStatisticsCard";
import ActionButtonsSection from "@/components/analysis/ActionButtonsSection";
import DisclaimerCard from "@/components/analysis/DisclaimerCard";
import TradingLevelsCard from "@/components/analysis/TradingLevelsCard";
import StockInfoCard from "@/components/analysis/StockInfoCard";
import VolumeAnalysisCard from "@/components/analysis/VolumeAnalysisCard";

// New Enhanced Components
import EnhancedAIAnalysisCard from "@/components/analysis/EnhancedAIAnalysisCard";
import EnhancedMultiTimeframeCard from "@/components/analysis/EnhancedMultiTimeframeCard";
import EnhancedSectorContextCard from "@/components/analysis/EnhancedSectorContextCard";

// Services and Utils
import { apiService } from "@/services/api";
import { AnalysisData, EnhancedOverlays, AdvancedPatterns, MultiTimeframeAnalysis, AdvancedRiskMetrics, StressTestingData, ScenarioAnalysisData, AnalysisResults } from "@/types/analysis";
import { transformDatabaseRecord } from "@/utils/databaseDataTransformer";
import Header from "@/components/Header";

interface ChartData {
  date: string;
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface ExtendedIndicators {
  advanced_patterns?: AdvancedPatterns;
  multi_timeframe?: MultiTimeframeAnalysis;
  advanced_risk?: AdvancedRiskMetrics;
  stress_testing?: StressTestingData;
  scenario_analysis?: ScenarioAnalysisData;
}

// Price Statistics calculation function
const calculatePriceStatistics = (data: ChartData[] | null) => {
  if (!data || data.length === 0) {
    return null;
  }

  const prices = data.map(d => d.close || d.price || 0).filter(p => p > 0);
  if (prices.length === 0) return null;

  const current = prices[prices.length - 1];
  const max = Math.max(...prices);
  const min = Math.min(...prices);
  const mean = prices.reduce((sum, price) => sum + price, 0) / prices.length;

  const distFromMean = current - mean;
  const distFromMax = current - max;
  const distFromMin = current - min;

  const distFromMeanPct = (distFromMean / mean) * 100;
  const distFromMaxPct = (distFromMax / max) * 100;
  const distFromMinPct = (distFromMin / min) * 100;

  return {
    mean,
    max,
    min,
    current,
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

// Helper function to extract current price from data
const getCurrentPrice = (data: ChartData[] | null): number | null => {
  if (!data || data.length === 0) return null;
  const lastCandle = data[data.length - 1];
  return lastCandle.close || lastCandle.price || null;
};

// Helper function to extract price change
const getPriceChange = (data: ChartData[] | null): { change: number; changePercent: number } | null => {
  if (!data || data.length < 2) return null;
  const current = data[data.length - 1].close || data[data.length - 1].price || 0;
  const previous = data[data.length - 2].close || data[data.length - 2].price || 0;
  const change = current - previous;
  const changePercent = previous !== 0 ? (change / previous) * 100 : 0;
  return { change, changePercent };
};

const NewOutput: React.FC = () => {
  // State
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [stockSymbol, setStockSymbol] = useState<string>("");
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(true); // Separate loading for analysis
  const [error, setError] = useState<string | null>(null);
  
  // Enhanced data state
  const [enhancedData, setEnhancedData] = useState<AnalysisResults | null>(null);

  // Load analysis data and stock symbol from localStorage or route params
  useEffect(() => {
    try {
      // Try to get analysis data from localStorage (from previous analysis)
      const storedAnalysis = localStorage.getItem('analysisResult');
      if (storedAnalysis) {
        const parsed = JSON.parse(storedAnalysis);
        
        // Check if this is the new enhanced structure
        const isEnhancedStructure = parsed && (
          parsed.symbol || 
          parsed.analysis_type || 
          parsed.enhanced_metadata ||
          parsed.technical_indicators
        );
        
        if (isEnhancedStructure) {
          // Handle enhanced structure
          setEnhancedData(parsed);
          setStockSymbol(parsed.symbol || "RELIANCE");
          
          // Transform for backward compatibility
          const transformedData = transformDatabaseRecord({
            id: parsed.id || '1',
            user_id: parsed.user_id || '1',
            stock_symbol: parsed.symbol || "RELIANCE",
            analysis_data: parsed,
            created_at: parsed.analysis_timestamp || new Date().toISOString(),
            updated_at: parsed.analysis_timestamp || new Date().toISOString()
          });
          setAnalysisData(transformedData);
        } else {
          // Handle legacy structure
          const transformedData = transformDatabaseRecord({
            id: parsed.id || '1',
            user_id: parsed.user_id || '1',
            stock_symbol: parsed.stock_symbol || "RELIANCE",
            analysis_data: parsed,
            created_at: parsed.created_at || new Date().toISOString(),
            updated_at: parsed.updated_at || new Date().toISOString()
          });
          
          setAnalysisData(transformedData);
          setStockSymbol(parsed.stock_symbol || "RELIANCE");
        }
        
        setAnalysisLoading(false);
      } else {
        // If no stored analysis, try to get from historical data
        const token = stockSymbol || "RELIANCE";
        if (!token) return;
        
        setAnalysisLoading(true);
        apiService.getHistoricalData(token, "1day", "NSE", 1000)
          .then((data) => {
            if (data && data.success && data.candles && data.candles.length > 0) {
              // Create a basic analysis structure from historical data
              const basicAnalysis = {
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
                chart_insights: 'Historical data available',
                indicator_summary_md: 'Technical indicators will be calculated from historical data',
                data: data.candles
              };
              
              // Transform the basic analysis using the database transformer
              const transformedData = transformDatabaseRecord({
                id: '1',
                user_id: '1',
                stock_symbol: token,
                analysis_data: basicAnalysis,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              });
              
              setAnalysisData(transformedData);
              setStockSymbol(token);
            } else {
              setError("No analysis data available.");
            }
          })
          .catch((err) => {
            setError(err.message || "Failed to fetch analysis data.");
          })
          .finally(() => setAnalysisLoading(false));
      }
    } catch (err) {
      console.error('Error loading analysis data:', err);
      setError("Failed to load analysis data.");
      setAnalysisLoading(false);
    }
  }, [stockSymbol]);

  // Loading and error states
  if (loading && !stockSymbol) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="w-24 h-24 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <Loader2 className="h-12 w-12 text-slate-400 animate-spin" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-4">Loading...</h1>
        </div>
      </div>
    );
  }

  if (error && !stockSymbol) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <Header />
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

  // Extract data with proper fallbacks
  const consensus = analysisData?.consensus;
  const indicators = analysisData?.indicators;
  const indicator_summary_md = analysisData?.indicator_summary_md;
  const chart_insights = analysisData?.chart_insights;
  const ai_analysis = analysisData?.ai_analysis;
  const sector_benchmarking = analysisData?.sector_benchmarking;
  const overlays = analysisData?.overlays;
  const trading_guidance = analysisData?.trading_guidance;
  const summary = analysisData?.summary;
  const metadata = analysisData?.metadata;
  
  // Enhanced data extraction
  const enhancedAI = enhancedData?.ai_analysis;
  const enhancedSectorContext = enhancedData?.sector_context;
  const enhancedMultiTimeframe = enhancedData?.multi_timeframe_analysis;
  const enhancedTechnicalIndicators = enhancedData?.technical_indicators;
  
  // Calculate current price and price change
  const currentPrice = enhancedData?.current_price || getCurrentPrice(analysisData?.data || null);
  const priceChange = enhancedData ? { 
    change: enhancedData.price_change || 0, 
    changePercent: enhancedData.price_change_percentage || 0 
  } : getPriceChange(analysisData?.data || null);
  const priceStats = calculatePriceStatistics(analysisData?.data || null);

  // Get signal color
  const getSignalColor = (signal: string) => {
    switch (signal.toLowerCase()) {
      case 'bullish': return 'text-green-600 bg-green-50 border-green-200';
      case 'bearish': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  // Get signal icon
  const getSignalIcon = (signal: string) => {
    switch (signal.toLowerCase()) {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Stock Header */}
        <div className="mb-8">
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold text-slate-800 mb-2">
              {stockSymbol || "Loading..."} Analysis
            </h1>
            <p className="text-slate-600">Comprehensive technical analysis and insights</p>
            {enhancedData && (
              <div className="mt-2 flex items-center justify-center space-x-4">
                <Badge className="bg-purple-100 text-purple-700">
                  {enhancedData.analysis_type || 'Enhanced Analysis'}
                </Badge>
                {enhancedData.mathematical_validation && (
                  <Badge className="bg-green-100 text-green-700">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Validated
                  </Badge>
                )}
                <Badge className="bg-blue-100 text-blue-700">
                  {enhancedData.accuracy_improvement || 'High Accuracy'}
                </Badge>
              </div>
            )}
          </div>

          {/* Quick Stats Bar */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-slate-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-800">
                  {analysisLoading ? <Skeleton className="h-8 w-20 mx-auto" /> : `₹${currentPrice?.toFixed(2) || "0.00"}`}
                </div>
                <div className="text-sm text-slate-600">Current Price</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold flex items-center justify-center ${priceChange?.changePercent && priceChange.changePercent > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {analysisLoading ? <Skeleton className="h-8 w-20 mx-auto" /> : `₹${priceChange?.change.toFixed(2) || "0.00"}`}
                </div>
                <div className="text-sm text-slate-600">Change</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${priceChange?.changePercent && priceChange.changePercent > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {analysisLoading ? <Skeleton className="h-8 w-20 mx-auto" /> : `${priceChange?.changePercent.toFixed(2) || "0.00"}%`}
                </div>
                <div className="text-sm text-slate-600">Change %</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-800">
                  {enhancedData?.recommendation || consensus?.overall_signal || summary?.overall_signal || ai_analysis?.trend || (analysisLoading ? <Skeleton className="h-8 w-20 mx-auto" /> : 'Neutral')}
                </div>
                <div className="text-sm text-slate-600">Signal</div>
              </div>
            </div>
            
            {/* Analysis Loading Indicator */}
            {analysisLoading && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                  <span className="text-sm text-blue-700">Analysis in progress...</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-white/80 backdrop-blur-sm">
            <TabsTrigger value="overview" className="flex items-center space-x-2">
              <Eye className="h-4 w-4" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger value="technical" className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4" />
              <span>Technical</span>
            </TabsTrigger>
            <TabsTrigger value="ai" className="flex items-center space-x-2">
              <Brain className="h-4 w-4" />
              <span>AI Analysis</span>
            </TabsTrigger>
            <TabsTrigger value="sector" className="flex items-center space-x-2">
              <Building2 className="h-4 w-4" />
              <span>Sector</span>
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
                  <AITradingAnalysisOverviewCard aiAnalysis={ai_analysis} />
                )}
              </div>
            </div>

            {/* Middle Row - Stock Info and Price Statistics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Stock Information */}
              <div className="lg:col-span-1">
                {analysisLoading ? (
                  <AnalysisCardSkeleton 
                    title="Stock Information" 
                    description="Loading stock details..." 
                  />
                ) : (
                  <StockInfoCard 
                    symbol={stockSymbol}
                    currentPrice={currentPrice}
                    priceChange={priceChange}
                    metadata={metadata}
                    summary={summary}
                  />
                )}
              </div>
              
              {/* Price Statistics Card */}
              <div className="lg:col-span-1">
                {analysisLoading ? (
                  <AnalysisCardSkeleton 
                    title="Price Statistics" 
                    description="Loading price statistics..." 
                  />
                ) : (
                  <PriceStatisticsCard 
                    summaryStats={priceStats || {
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
                    }}
                    latestPrice={currentPrice}
                    timeframe="1 Day"
                  />
                )}
              </div>
            </div>

            {/* Bottom Row - Sector Analysis and Volume Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Sector Benchmarking */}
              <div className="lg:col-span-1">
                {analysisLoading ? (
                  <AnalysisCardSkeleton 
                    title="Sector Benchmarking" 
                    description="Loading sector analysis..." 
                  />
                ) : (
                  sector_benchmarking ? (
                    <SectorBenchmarkingCard 
                      sectorBenchmarking={sector_benchmarking} 
                    />
                  ) : (
                    <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
                      <CardHeader>
                        <CardTitle className="flex items-center text-slate-800">
                          <ChartBar className="h-5 w-5 mr-2 text-blue-500" />
                          Sector Benchmarking
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-slate-500">No sector benchmarking data available</p>
                      </CardContent>
                    </Card>
                  )
                )}
              </div>
              
              {/* Volume Analysis */}
              <div className="lg:col-span-1">
                {analysisLoading ? (
                  <AnalysisCardSkeleton 
                    title="Volume Analysis" 
                    description="Loading volume analysis..." 
                  />
                ) : (
                  <VolumeAnalysisCard 
                    volumeData={indicators?.volume}
                    priceData={analysisData?.data}
                    symbol={stockSymbol}
                  />
                )}
              </div>
            </div>
          </TabsContent>

          {/* Technical Tab */}
          <TabsContent value="technical" className="space-y-6">
            {/* Technical Analysis Summary */}
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

            {/* Pattern Recognition */}
            {analysisLoading ? (
              <AnalysisCardSkeleton 
                title="Pattern Recognition" 
                description="Loading pattern analysis..." 
              />
            ) : (
              overlays && (
                <EnhancedPatternRecognitionCard 
                  overlays={overlays as EnhancedOverlays}
                  symbol={stockSymbol}
                />
              )
            )}

            {/* Advanced Patterns and Multi-timeframe Analysis */}
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
                      patterns={(indicators as ExtendedIndicators).advanced_patterns} 
                      symbol={stockSymbol}
                    />
                  )}

                  {(indicators as ExtendedIndicators)?.multi_timeframe && !(indicators as ExtendedIndicators).multi_timeframe.error && (
                    <MultiTimeframeAnalysisCard 
                      analysis={(indicators as ExtendedIndicators).multi_timeframe} 
                      symbol={stockSymbol}
                    />
                  )}
                </>
              )}
            </div>
          </TabsContent>

          {/* AI Analysis Tab */}
          <TabsContent value="ai" className="space-y-6">
            {/* Enhanced AI Analysis */}
            {analysisLoading ? (
              <AnalysisCardSkeleton 
                title="Enhanced AI Analysis" 
                description="Loading AI analysis..." 
              />
            ) : (
              enhancedAI && (
                <EnhancedAIAnalysisCard 
                  aiAnalysis={enhancedAI}
                />
              )
            )}

            {/* Multi-Timeframe Analysis */}
            {analysisLoading ? (
              <AnalysisCardSkeleton 
                title="Multi-Timeframe Analysis" 
                description="Loading multi-timeframe analysis..." 
              />
            ) : (
              enhancedMultiTimeframe && (
                <EnhancedMultiTimeframeCard 
                  multiTimeframeAnalysis={enhancedMultiTimeframe}
                  symbol={stockSymbol}
                />
              )
            )}
          </TabsContent>

          {/* Sector Tab */}
          <TabsContent value="sector" className="space-y-6">
            {/* Enhanced Sector Context */}
            {analysisLoading ? (
              <AnalysisCardSkeleton 
                title="Sector Context" 
                description="Loading sector analysis..." 
              />
            ) : (
              enhancedSectorContext && (
                <EnhancedSectorContextCard 
                  sectorContext={enhancedSectorContext}
                  symbol={stockSymbol}
                />
              )
            )}
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
                {(indicators as ExtendedIndicators)?.advanced_risk && !(indicators as ExtendedIndicators).advanced_risk.error && (
                  <AdvancedRiskAssessmentCard 
                    riskMetrics={(indicators as ExtendedIndicators).advanced_risk}
                    symbol={stockSymbol}
                  />
                )}

                {(indicators as ExtendedIndicators)?.advanced_patterns && (
                  <ComplexPatternAnalysisCard 
                    patterns={(indicators as ExtendedIndicators).advanced_patterns}
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

        {/* Action Buttons and Disclaimer */}
        <div className="space-y-6 mt-8">
          <ActionButtonsSection />
          <DisclaimerCard />
        </div>

        {/* Analysis Loading Progress */}
        {analysisLoading && (
          <div className="mt-8">
            <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-4">
                  <CardTitle className="flex items-center text-slate-800">
                    <Loader2 className="h-5 w-5 mr-2 text-blue-500 animate-spin" />
                    Analysis in Progress
                  </CardTitle>
                </div>
                <CardDescription>
                  AI analysis is being performed. Chart data is already available for viewing.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                    <span className="text-sm text-gray-600">Processing technical indicators...</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                    <span className="text-sm text-gray-600">Analyzing patterns...</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                    <span className="text-sm text-gray-600">Generating AI insights...</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewOutput; 