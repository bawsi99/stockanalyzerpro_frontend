import { useEffect, useState, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

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
import EnhancedMultiPaneChart from "@/components/charts/EnhancedMultiPaneChart";
import ChartDebugger from "@/components/charts/ChartDebugger";
import DataTester from "@/components/charts/DataTester";

// Icons
import { 
  TrendingUp, 
  BarChart3, 
  Target, 
  AlertTriangle, 
  ArrowUpRight, 
  ArrowDownRight,
  Minus,
  Clock,
  Eye,
  Settings
} from "lucide-react";

// Types and Utils
import { AnalysisData, ChartData, AnalysisResponse, isAnalysisResponse, EnhancedOverlays } from "@/types/analysis";
import { cleanText } from "@/utils/textCleaner";
import { ChartValidationResult } from "@/utils/chartUtils";
import { filterDataByTimeframe } from "@/utils/chartUtils";

// Timeframe options
const timeframeOptions = [
  { value: '7d', label: '7D' },
  { value: '30d', label: '30D' },
  { value: '90d', label: '3M' },
  { value: '180d', label: '6M' },
  { value: '1y', label: '1Y' },
  { value: 'all', label: 'All' },
];

// Chart statistics interface
interface ChartStats {
  dateRange: { start: string; end: string; days: number };
  price: { min: number; max: number; current: number };
  volume: { avg: number; total: number };
  returns: { avg: number; volatility: number };
}

const NewOutput: React.FC = () => {
  // State
  const [rawData, setRawData] = useState<ChartData[]>([]);
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [stockSymbol, setStockSymbol] = useState<string>("");
  const [selectedTimeframe, setSelectedTimeframe] = useState('all');
  const [chartType, setChartType] = useState<'candlestick' | 'line'>('candlestick');
  const [validationResult, setValidationResult] = useState<ChartValidationResult | null>(null);
  const [chartStats, setChartStats] = useState<ChartStats | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [showShortcuts, setShowShortcuts] = useState(false);
  const chartRef = useRef<any>(null);

  // Filtered data
  const filteredRawData = useMemo(() => 
    filterDataByTimeframe(rawData, selectedTimeframe), 
    [rawData, selectedTimeframe]
  );

  // Price statistics
  const stats = useMemo(() => {
    if (rawData.length < 2) return null;
    const prev = rawData[rawData.length - 2];
    const last = rawData[rawData.length - 1];
    const delta = last.close - prev.close;
    const deltaPct = prev.close ? (delta / prev.close) * 100 : 0;
    return {
      lastClose: last.close,
      lastVolume: last.volume,
      lastDate: last.date,
      delta,
      deltaPct,
    };
  }, [rawData]);

  // Summary statistics
  const summaryStats = useMemo(() => {
    if (!filteredRawData || filteredRawData.length === 0) return null;
    const closes = filteredRawData.map(d => d.close);
    const mean = closes.reduce((sum, v) => sum + v, 0) / closes.length;
    const max = Math.max(...closes);
    const min = Math.min(...closes);
    const current = closes[closes.length - 1];
    return {
      mean,
      max,
      min,
      current,
      distFromMean: current - mean,
      distFromMax: current - max,
      distFromMin: current - min,
      distFromMeanPct: mean !== 0 ? ((current - mean) / mean) * 100 : 0,
      distFromMaxPct: max !== 0 ? ((current - max) / max) * 100 : 0,
      distFromMinPct: min !== 0 ? ((current - min) / min) * 100 : 0,
    };
  }, [filteredRawData]);

  // Load analysis data
  useEffect(() => {
    const storedData = localStorage.getItem("analysisResult");
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        let results: AnalysisData;
        let data: ChartData[];

        if (isAnalysisResponse(parsedData)) {
          setStockSymbol(parsedData.stock_symbol);
          results = parsedData.results;
          data = parsedData.data || [];
        } else {
          results = parsedData.results;
          data = parsedData.data || [];
          setStockSymbol("STOCK");
        }

        // Clean text fields
        const cleanedResults: AnalysisData = {
          ...results,
          indicator_summary_md: cleanText(results.indicator_summary_md || ''),
          chart_insights: cleanText(results.chart_insights || ''),
          consensus: {
            ...results.consensus,
            signal_details: results.consensus?.signal_details?.map((detail) => ({
              ...detail,
              description: cleanText(detail.description || '')
            })) || []
          }
        };

        // Ensure consensus has all required properties
        if (!cleanedResults.consensus) {
          cleanedResults.consensus = {
            overall_signal: 'Neutral',
            signal_strength: 'Weak',
            bullish_percentage: 0,
            bearish_percentage: 0,
            neutral_percentage: 0,
            bullish_score: 0,
            bearish_score: 0,
            neutral_score: 0,
            total_weight: 0,
            confidence: 0,
            signal_details: [],
            data_quality_flags: [],
            warnings: [],
            bullish_count: 0,
            bearish_count: 0,
            neutral_count: 0
          };
        }

        setAnalysisData(cleanedResults);
        setRawData(data);
      } catch (error) {
        console.error("Error parsing stored analysis data:", error);
      }
    }
  }, []);

  // No data state
  if (!analysisData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="text-center max-w-md mx-auto">
            <div className="mb-8">
              <div className="w-24 h-24 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="h-12 w-12 text-slate-400" />
              </div>
              <h1 className="text-3xl font-bold text-slate-800 mb-4">No Analysis Data</h1>
              <p className="text-slate-600 mb-8">
                Please run an analysis first to view the results.
              </p>
            </div>
            <Link to="/analysis">
              <Button className="bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700 text-white px-8 py-3">
                Start New Analysis
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { consensus, indicators, indicator_summary_md, chart_insights } = analysisData;

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

  // Action button functions
  const clearAllIndicators = () => {
    if (chartRef.current && chartRef.current.clearAllIndicators) {
      chartRef.current.clearAllIndicators();
    }
  };

  const showAllIndicators = () => {
    if (chartRef.current && chartRef.current.showAllIndicators) {
      chartRef.current.showAllIndicators();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Stock Header */}
        <div className="mb-8">
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold text-slate-800 mb-2">
              {stockSymbol} Analysis
            </h1>
            <p className="text-slate-600">Comprehensive technical analysis and insights</p>
          </div>

          {/* Quick Stats Bar */}
          {stats && (
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-slate-200">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-800">
                    ₹{stats.lastClose?.toFixed(2)}
                  </div>
                  <div className="text-sm text-slate-600">Current Price</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold flex items-center justify-center ${stats.delta >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stats.delta >= 0 ? '+' : ''}₹{stats.delta?.toFixed(2)}
                  </div>
                  <div className="text-sm text-slate-600">Change</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${stats.deltaPct >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stats.deltaPct >= 0 ? '+' : ''}{stats.deltaPct?.toFixed(2)}%
                  </div>
                  <div className="text-sm text-slate-600">Change %</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-800">
                    {consensus?.overall_signal || 'Neutral'}
                  </div>
                  <div className="text-sm text-slate-600">Signal</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-white/80 backdrop-blur-sm">
            <TabsTrigger value="overview" className="flex items-center space-x-2">
              <Eye className="h-4 w-4" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger value="technical" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
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
                <ConsensusSummaryCard consensus={consensus} />
              </div>
              
              {/* AI Trading Analysis */}
              <div className="lg:col-span-1">
                <AITradingAnalysisOverviewCard aiAnalysis={analysisData.ai_analysis} />
              </div>
            </div>

            {/* Trading Terminal - Full Width Professional Layout */}
            <div className="w-full">
              <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
                <CardHeader className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <CardTitle className="flex items-center text-slate-800">
                        <BarChart3 className="h-5 w-5 mr-2 text-blue-500" />
                        Trading Terminal - {stockSymbol}
                      </CardTitle>
                    </div>
                    <div className="flex items-center space-x-4">
                      {/* Timeframe Controls */}
                      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                        {timeframeOptions.map((option) => (
                          <Button
                            key={option.value}
                            variant={selectedTimeframe === option.value ? "default" : "ghost"}
                            size="sm"
                            onClick={() => setSelectedTimeframe(option.value)}
                            className="text-xs h-7 px-2"
                          >
                            {option.label}
                          </Button>
                        ))}
                      </div>
                      
                      {/* Chart Type Toggle */}
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">Chart:</span>
                        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                          <Button 
                            variant={chartType === 'candlestick' ? 'default' : 'ghost'} 
                            size="sm" 
                            className="text-xs h-7 px-2"
                            onClick={() => setChartType('candlestick')}
                          >
                            Candle
                          </Button>
                          <Button 
                            variant={chartType === 'line' ? 'default' : 'ghost'} 
                            size="sm" 
                            className="text-xs h-7 px-2"
                            onClick={() => setChartType('line')}
                          >
                            Line
                          </Button>
                        </div>
                      </div>

                      {/* Quick Actions */}
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-xs h-7 bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
                          onClick={clearAllIndicators}
                        >
                          Clear
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-xs h-7 bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                          onClick={showAllIndicators}
                        >
                          All
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-xs h-7 bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                          onClick={() => setShowShortcuts(!showShortcuts)}
                        >
                          {showShortcuts ? 'Hide' : 'Keys'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                {/* Trading Terminal Content */}
                <CardContent className="flex-1 overflow-hidden p-0">
                  {rawData.length > 0 ? (
                    <div className="h-[1000px] w-full flex flex-col">
                      {/* Chart Container with Professional Layout */}
                      <div className="flex-1 relative">
                        <EnhancedMultiPaneChart 
                          ref={chartRef}
                          data={filteredRawData} 
                          height={1000} // Match container height to eliminate white space
                          chartType={chartType}
                          onChartTypeChange={setChartType}
                          onClearAll={clearAllIndicators}
                          onShowAll={showAllIndicators}
                          onToggleShortcuts={() => setShowShortcuts(!showShortcuts)}
                          showShortcuts={showShortcuts}
                          overlays={{
                            showRsiDivergence: true,
                            ...(analysisData.overlays || {})
                          }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-16 text-slate-500">
                      <BarChart3 className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                      No chart data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Bottom Row - Price Statistics and Sector Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {summaryStats && (
                <PriceStatisticsCard 
                  summaryStats={summaryStats}
                  latestPrice={stats?.lastClose || null}
                  timeframe={selectedTimeframe === 'all' ? 'All Time' : selectedTimeframe}
                />
              )}
              
              {analysisData.sector_benchmarking && (
                <SectorBenchmarkingCard 
                  sectorBenchmarking={analysisData.sector_benchmarking} 
                />
              )}
            </div>
          </TabsContent>

          {/* Technical Tab */}
          <TabsContent value="technical" className="space-y-6">
            {indicator_summary_md && (
              <TechnicalAnalysisCard 
                indicatorSummary={indicator_summary_md || ''} 
              />
            )}

            {analysisData.overlays && (
              <EnhancedPatternRecognitionCard 
                overlays={analysisData.overlays as EnhancedOverlays}
                symbol={stockSymbol}
              />
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
            </div>
          </TabsContent>

          {/* Advanced Tab */}
          <TabsContent value="advanced" className="space-y-6">
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
                stress_testing={(indicators as any).stress_testing}
                scenario_analysis={(indicators as any).scenario_analysis}
              />
            )}
          </TabsContent>
        </Tabs>

        {/* Action Buttons and Disclaimer */}
        <div className="space-y-6 mt-8">
          <ActionButtonsSection />
          <DisclaimerCard />
        </div>

        {/* Debug Section */}
        {showDebug && (
          <div className="mt-8">
            <ChartDebugger 
              data={rawData} 
              validationResult={validationResult}
              stats={chartStats || {
                dateRange: { start: '', end: '', days: 0 },
                price: { min: 0, max: 0, current: 0 },
                volume: { avg: 0, total: 0 },
                returns: { avg: 0, volatility: 0 }
              }}
            />
            <DataTester data={rawData} />
          </div>
        )}
      </div>
    </div>
  );
};

export default NewOutput; 