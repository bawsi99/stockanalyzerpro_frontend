import { useEffect, useState, useRef } from "react";
import Header from "@/components/Header";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

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

// Chart Components
import LiveSimpleChart from "@/components/charts/LiveSimpleChart";
import { useLiveChart } from "@/hooks/useLiveChart";

// Icons
import { 
  TrendingUp, 
  BarChart3, 
  AlertTriangle, 
  ArrowUpRight, 
  ArrowDownRight,
  Minus,
  Settings,
  Loader2
} from "lucide-react";

// Types and Utils
import { AnalysisData, EnhancedOverlays } from "@/types/analysis";
import { apiService } from "@/services/api";

// Chart statistics interface
interface ChartStats {
  dateRange: { start: string; end: string; days: number };
  price: { min: number; max: number; current: number };
  volume: { avg: number; total: number };
  returns: { avg: number; volatility: number };
}

const NewOutput: React.FC = () => {
  // State
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [stockSymbol, setStockSymbol] = useState<string>("");
  const [selectedTimeframe, setSelectedTimeframe] = useState('1day');
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(true); // Separate loading for analysis
  const [chartDataLoaded, setChartDataLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  


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
        // If no stored analysis, try to get from realtime analysis
        const token = stockSymbol || "RELIANCE";
        const timeframe = selectedTimeframe;
        if (!token) return;
        
        setAnalysisLoading(true);
        apiService.getRealtimeAnalysis(token, timeframe)
          .then((data) => {
            if (data && data.analysis) {
              setAnalysisData(data.analysis);
              setStockSymbol(data.analysis.symbol || token);
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
  }, [stockSymbol, selectedTimeframe]);

  // Update live chart when stock symbol changes
  useEffect(() => {
    if (stockSymbol && updateSymbol) {
      console.log('🔄 Updating symbol in useLiveChart hook:', stockSymbol);
      updateSymbol(stockSymbol);
    }
  }, [stockSymbol, updateSymbol]);

  // Update live chart when timeframe changes
  useEffect(() => {
    if (selectedTimeframe && updateTimeframe) {
      console.log('🔄 Updating timeframe in useLiveChart hook:', selectedTimeframe);
      updateTimeframe(selectedTimeframe);
    }
  }, [selectedTimeframe, updateTimeframe]);

  // Handle chart data loaded
  const handleChartDataLoaded = (data: any[]) => {
    setChartDataLoaded(true);
    console.log('Chart data loaded:', data.length, 'candles');
  };

  // Handle live chart data updates
  useEffect(() => {
    if (liveData && liveData.length > 0) {
      setChartDataLoaded(true);
      console.log('📈 Live data updated in Output page:', {
        dataLength: liveData.length,
        lastCandle: liveData[liveData.length - 1],
        lastUpdate: new Date(lastUpdate).toLocaleTimeString()
      });
    }
  }, [liveData, lastUpdate]);

  // Handle chart error
  const handleChartError = (error: string) => {
    console.error('Chart error:', error);
    setError(error);
  };

  // Handle live chart errors
  useEffect(() => {
    if (liveError) {
      console.error('Live chart error:', liveError);
      setError(liveError);
    }
  }, [liveError]);

  // Show charts immediately when stock symbol is available, regardless of analysis loading
  const canShowCharts = stockSymbol && !error;

  // Loading and error states - only show full page loading if no stock symbol
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

  if (error && !canShowCharts) {
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
                  {chartDataLoaded ? "₹0.00" : <Skeleton className="h-8 w-20 mx-auto" />}
                </div>
                <div className="text-sm text-slate-600">Current Price</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold flex items-center justify-center text-red-600`}>
                  {chartDataLoaded ? "₹0.00" : <Skeleton className="h-8 w-20 mx-auto" />}
                </div>
                <div className="text-sm text-slate-600">Change</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold text-red-600`}>
                  {chartDataLoaded ? "0.00%" : <Skeleton className="h-8 w-20 mx-auto" />}
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
                  <span className="text-sm text-blue-700">Analysis in progress... Charts are ready for viewing</span>
                </div>
              </div>
            )}
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
                    summaryStats={null}
                    latestPrice={null}
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
            {/* Enhanced Live Chart Section */}
            {/* 
              This section integrates the advanced LiveSimpleChart component with:
              - Real-time WebSocket data streaming
              - Technical indicators (SMA, EMA, RSI, MACD, Bollinger Bands)
              - Pattern recognition features
              - Live price updates and connection status
              - Auto-reconnection and error handling
            */}
            <div className="w-full">
              {canShowCharts ? (
                <LiveSimpleChart
                  symbol={stockSymbol}
                  timeframe={selectedTimeframe}
                  theme="light"
                  height={800}
                  width={800}
                  exchange="NSE"
                  maxDataPoints={1000}
                  autoConnect={true}
                  showConnectionStatus={true}
                  showLiveIndicator={true}
                  showIndicators={true}
                  showPatterns={true}
                  showVolume={true}
                  debug={false}
                  data={liveData}
                  isConnected={isLiveConnected}
                  isLive={isLive}
                  isLoading={isLiveLoading}
                  error={liveError}
                  lastUpdate={lastUpdate}
                  connectionStatus={connectionStatus}
                  refetch={refetch}
                  onDataUpdate={handleChartDataLoaded}
                  onConnectionChange={(isConnected) => {
                    console.log('Connection status changed:', isConnected);
                  }}
                  onError={handleChartError}
                  onValidationResult={(result) => {
                    console.log('Chart validation result:', result);
                  }}
                  onStatsCalculated={(stats) => {
                    console.log('Chart stats calculated:', stats);
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