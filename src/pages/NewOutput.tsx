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
  ZoomIn
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

// Services and Utils
import { apiService } from "@/services/api";
import { AnalysisData, EnhancedOverlays } from "@/types/analysis";
import Header from "@/components/Header";

// Price Statistics calculation function
const calculatePriceStatistics = (data: any[] | null) => {
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


const NewOutput: React.FC = () => {
  // State
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [stockSymbol, setStockSymbol] = useState<string>("");
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(true); // Separate loading for analysis
  const [error, setError] = useState<string | null>(null);
  




  // Load analysis data and stock symbol from localStorage or route params
  useEffect(() => {
    try {
      // Try to get analysis data from localStorage (from previous analysis)
      const storedAnalysis = localStorage.getItem('analysisResult');
      if (storedAnalysis) {
        const parsed = JSON.parse(storedAnalysis);
        setAnalysisData(parsed);
        setStockSymbol(parsed.stock_symbol || "RELIANCE");
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
                chart_insights: 'Historical data available',
                indicator_summary_md: 'Technical indicators will be calculated from historical data',
                data: data.candles
              });
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

  const consensus = analysisData?.consensus;
  const indicators = analysisData?.indicators;
  const indicator_summary_md = analysisData?.indicator_summary_md;
  const chart_insights = analysisData?.chart_insights;

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
          </div>

          {/* Quick Stats Bar */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-slate-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-800">
                  {analysisLoading ? <Skeleton className="h-8 w-20 mx-auto" /> : "₹0.00"}
                </div>
                <div className="text-sm text-slate-600">Current Price</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold flex items-center justify-center text-red-600`}>
                  {analysisLoading ? <Skeleton className="h-8 w-20 mx-auto" /> : "₹0.00"}
                </div>
                <div className="text-sm text-slate-600">Change</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold text-red-600`}>
                  {analysisLoading ? <Skeleton className="h-8 w-20 mx-auto" /> : "0.00%"}
                </div>
                <div className="text-sm text-slate-600">Change %</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-800">
                  {consensus?.overall_signal || (analysisLoading ? <Skeleton className="h-8 w-20 mx-auto" /> : 'Neutral')}
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
          <TabsList className="grid w-full grid-cols-3 bg-white/80 backdrop-blur-sm">
            <TabsTrigger value="overview" className="flex items-center space-x-2">
              <Eye className="h-4 w-4" />
              <span>Overview</span>
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
                    summaryStats={calculatePriceStatistics(analysisData?.data || null) || {
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
                    latestPrice={analysisData?.data && analysisData.data.length > 0 ? analysisData.data[analysisData.data.length - 1].close || analysisData.data[analysisData.data.length - 1].price : null}
                    timeframe="1 Day"
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
                  {(indicators as any)?.advanced_patterns && (
                    <AdvancedPatternAnalysisCard 
                      patterns={(indicators as any).advanced_patterns} 
                      symbol={stockSymbol}
                    />
                  )}

                  {(indicators as any)?.multi_timeframe && !(indicators as any).multi_timeframe.error && (
                    <MultiTimeframeAnalysisCard 
                      analysis={(indicators as any).multi_timeframe} 
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
                {(indicators as any)?.advanced_risk && !(indicators as any).advanced_risk.error && (
                  <AdvancedRiskAssessmentCard 
                    riskMetrics={(indicators as any).advanced_risk}
                    symbol={stockSymbol}
                  />
                )}

                {(indicators as any)?.advanced_patterns && (
                  <ComplexPatternAnalysisCard 
                    patterns={(indicators as any).advanced_patterns}
                  />
                )}

                {((indicators as any)?.stress_testing || (indicators as any)?.scenario_analysis) && (
                  <AdvancedRiskMetricsCard 
                    stress_testing={(indicators as any)?.stress_testing}
                    scenario_analysis={(indicators as any)?.scenario_analysis}
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