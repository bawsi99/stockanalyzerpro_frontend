import { useEffect, useState, useMemo } from "react";

import Header from "@/components/Header";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import CombinedSummaryCard from "@/components/analysis/CombinedSummaryCard";
import ConsensusSummaryCard from "@/components/analysis/ConsensusSummaryCard";
import AIAnalysisCard from "@/components/analysis/AIAnalysisCard";
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
import ReactMarkdown from "react-markdown";
import { TrendingUp, BarChart3, PieChart, Target, AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import MultiPaneChart from "@/components/charts/MultiPaneChart";
import EnhancedMultiPaneChart from "@/components/charts/EnhancedMultiPaneChart";
import ChartDebugger from "@/components/charts/ChartDebugger";
import DataTester from "@/components/charts/DataTester";
import { Link } from "react-router-dom";
import { AnalysisData, ChartData, AnalysisResponse, isAnalysisResponse, AIAnalysis, LegacyAIAnalysis, EnhancedAIAnalysis, EnhancedOverlays } from "@/types/analysis";
import { cleanText } from "@/utils/textCleaner";
import { ChartValidationResult } from "@/utils/chartUtils";
import { testChartData } from "@/utils/testData";
import { filterDataByTimeframe } from "@/utils/chartUtils";

// Interface for chart statistics used in Output
interface ChartStats {
  dateRange: { start: string; end: string; days: number };
  price: { min: number; max: number; current: number };
  volume: { avg: number; total: number };
  returns: { avg: number; volatility: number };
}

const timeframeOptions = [
  { value: '7d', label: '7D' },
  { value: '30d', label: '30D' },
  { value: '90d', label: '3M' },
  { value: '180d', label: '6M' },
  { value: '1y', label: '1Y' },
  { value: 'all', label: 'All' },
];

const Output: React.FC = () => {
  const [rawData, setRawData] = useState<ChartData[]>([]);
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [stockSymbol, setStockSymbol] = useState<string>("");
  const [selectedTimeframe, setSelectedTimeframe] = useState('all'); // Default to 'all'
  const [validationResult, setValidationResult] = useState<ChartValidationResult | null>(null);
  const [chartStats, setChartStats] = useState<ChartStats | null>(null);
  const [showDebug, setShowDebug] = useState(false);

  // --- Filter data by timeframe ---
  // Filters rawData based on the selected timeframe using a utility for consistency across the app
  const filteredRawData = useMemo(() => filterDataByTimeframe(rawData, selectedTimeframe), [rawData, selectedTimeframe]);

  // --- price stats
  // Calculate price change and percent change between last two data points
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

  // --- Calculate mean, peak, and lowest close values for filteredRawData ---
  // Computes summary statistics for the filtered data, including mean, max, min, and distances from these values
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

  // Helper function to check if AI analysis is in new format
  const isNewAIAnalysis = (aiAnalysis: any): aiAnalysis is AIAnalysis => {
    return aiAnalysis && typeof aiAnalysis === 'object' && 'meta' in aiAnalysis && 'market_outlook' in aiAnalysis;
  };

  // Helper function to check if AI analysis is in legacy format
  const isLegacyAIAnalysis = (aiAnalysis: any): aiAnalysis is LegacyAIAnalysis => {
    return aiAnalysis && typeof aiAnalysis === 'object' && 'trend' in aiAnalysis && 'confidence_pct' in aiAnalysis;
  };

  // Helper function to check if AI analysis is enhanced format with sector context
  const isEnhancedAIAnalysis = (aiAnalysis: any): aiAnalysis is EnhancedAIAnalysis => {
    return isNewAIAnalysis(aiAnalysis) && 'sector_context' in aiAnalysis;
  };

  useEffect(() => {
    // Load and parse analysis data from localStorage, handling both new and legacy formats
    const storedData = localStorage.getItem("analysisResult");
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        console.log("Raw parsed data:", parsedData);

        let results: AnalysisData;
        let data: ChartData[];

        // Check if the data matches the new API response format
        if (isAnalysisResponse(parsedData)) {
          console.log("Using new API response format");
          setStockSymbol(parsedData.stock_symbol);
          results = parsedData.results;
          data = parsedData.data || [];
        } else {
          // Fallback for legacy data format
          console.log("Using legacy data format");
          results = parsedData.results;
          data = parsedData.data || [];
          setStockSymbol("STOCK");
        }

        // Clean text fields in the results for better display
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

        // Ensure consensus has all required properties with defaults
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

        // Handle AI analysis cleaning based on format
        if (isNewAIAnalysis(results.ai_analysis)) {
          // New format - clean the new fields
          cleanedResults.ai_analysis = {
            ...results.ai_analysis,
            key_takeaways: results.ai_analysis.key_takeaways?.map(cleanText) || [],
            indicator_summary_md: cleanText(results.ai_analysis.indicator_summary_md || ''),
            chart_insights: cleanText(results.ai_analysis.chart_insights || ''),
            market_outlook: {
              ...results.ai_analysis.market_outlook,
              primary_trend: {
                ...results.ai_analysis.market_outlook.primary_trend,
                rationale: cleanText(results.ai_analysis.market_outlook.primary_trend.rationale || '')
              },
              secondary_trend: {
                ...results.ai_analysis.market_outlook.secondary_trend,
                rationale: cleanText(results.ai_analysis.market_outlook.secondary_trend.rationale || '')
              }
            },
            trading_strategy: {
              ...results.ai_analysis.trading_strategy,
              short_term: {
                ...results.ai_analysis.trading_strategy.short_term,
                rationale: cleanText(results.ai_analysis.trading_strategy.short_term.rationale || '')
              },
              medium_term: {
                ...results.ai_analysis.trading_strategy.medium_term,
                rationale: cleanText(results.ai_analysis.trading_strategy.medium_term.rationale || '')
              },
              long_term: {
                ...results.ai_analysis.trading_strategy.long_term,
                rationale: cleanText(results.ai_analysis.trading_strategy.long_term.rationale || '')
              }
            }
          };
        } else if (isLegacyAIAnalysis(results.ai_analysis)) {
          // Legacy format - clean the legacy fields
          cleanedResults.ai_analysis = {
            ...results.ai_analysis,
            short_term: {
              ...results.ai_analysis.short_term,
              rationale: cleanText(results.ai_analysis.short_term?.rationale || '')
            },
            medium_term: {
              ...results.ai_analysis.medium_term,
              rationale: cleanText(results.ai_analysis.medium_term?.rationale || '')
            },
            long_term: {
              ...results.ai_analysis.long_term,
              rationale: cleanText(results.ai_analysis.long_term?.rationale || '')
            }
          };
        }

        setAnalysisData(cleanedResults);

        // Ensure overlays has all required properties with defaults
        if (!cleanedResults.overlays) {
          cleanedResults.overlays = {
            triangles: [],
            flags: [],
            support_resistance: { support: [], resistance: [] },
            double_tops: [],
            double_bottoms: [],
            divergences: [],
            volume_anomalies: []
          };
        }

        // Validate and filter chart data for display
        const validatedData = (data || []).filter(d =>
          d && typeof d === 'object' &&
          typeof d.date === 'string' &&
          !isNaN(new Date(d.date).getTime()) &&
          ['open', 'high', 'low', 'close', 'volume'].every(key => typeof d[key] === 'number' && Number.isFinite(d[key]))
        );
        setRawData(validatedData);

      } catch (error) {
        console.error("Error parsing analysis data from localStorage:", error);
        setAnalysisData(null);
        setRawData([]);
      }
    }
  }, []);

  if (!analysisData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <Header />
        <div className="mx-auto px-4 py-8 max-w-screen-2xl">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-slate-800 mb-4">No Analysis Data</h1>
            <p className="text-lg text-slate-600 mb-8">Please run an analysis first.</p>
            <Link to="/analysis">
              <Button className="bg-emerald-500 hover:bg-emerald-600 text-white">
                Start New Analysis
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { consensus, indicators, ai_analysis, indicator_summary_md, chart_insights } = analysisData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Header />
      
      <div className="mx-auto px-4 py-8 max-w-screen-2xl">
        {/* Stock Symbol Header */}
        {stockSymbol && (
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-slate-800 mb-2">
              {stockSymbol} - Technical Analysis
            </h1>
            <p className="text-slate-600">Detailed price action and technical indicators</p>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Left Column - Consensus and Summary */}
          <div className="lg:col-span-1 space-y-6">
            <div className="h-full min-h-[400px]">
              <ConsensusSummaryCard consensus={consensus} />
            </div>
            
            {/* Price Statistics Card */}
            {summaryStats && (
              <div className="h-full min-h-[300px]">
                <PriceStatisticsCard 
                  summaryStats={summaryStats}
                  latestPrice={stats?.lastClose || null}
                  timeframe={selectedTimeframe === 'all' ? 'All Time' : selectedTimeframe}
                />
              </div>
            )}
            
            {/* Enhanced Sector Benchmarking Card */}
            {analysisData.sector_benchmarking && (
              <div className="h-full min-h-[350px]">
                <SectorBenchmarkingCard 
                  sectorBenchmarking={analysisData.sector_benchmarking} 
                />
              </div>
            )}
            
            {/* Sector Analysis Card (if sector context available) */}
            {isEnhancedAIAnalysis(ai_analysis) && ai_analysis.sector_context && (
              <div className="h-full min-h-[300px]">
                <SectorAnalysisCard 
                  sectorContext={ai_analysis.sector_context} 
                />
              </div>
            )}
            
            {/* Legacy Combined Summary Card for backward compatibility */}
            {isLegacyAIAnalysis(ai_analysis) && (
              <div className="h-full min-h-[400px]">
                <CombinedSummaryCard 
                  consensus={consensus} 
                  indicators={indicators} 
                  aiAnalysis={ai_analysis} 
                  latestPrice={stats?.lastClose || null}
                  summaryStats={summaryStats}
                />
              </div>
            )}
          </div>

          {/* Center Column - Charts */}
          <div className="lg:col-span-2">
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm h-full flex flex-col min-h-[600px]">
              <CardHeader className="flex-shrink-0">
                <CardTitle className="flex items-center text-slate-800">
                  <BarChart3 className="h-5 w-5 mr-2 text-blue-500" />
                  Price Action & Technical Indicators
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden p-0">
                {rawData.length > 0 ? (
                  <div className="h-full w-full">
                    <EnhancedMultiPaneChart 
                      data={filteredRawData} 
                      overlays={{
                        showRsiDivergence: true,
                        ...(analysisData.overlays || {})
                      }}
                    />
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    No chart data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* AI Analysis Section */}
        {isNewAIAnalysis(ai_analysis) ? (
          <div className="mb-8 space-y-6">
            <AIAnalysisCard aiAnalysis={ai_analysis} />
          </div>
        ) : (
          /* Legacy AI Analysis Display */
          <div className="mb-8">
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="flex-shrink-0">
                <CardTitle className="flex items-center text-slate-800">
                  <Target className="h-5 w-5 mr-2 text-green-500" />
                  AI Trading Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {isLegacyAIAnalysis(ai_analysis) && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-emerald-50 rounded-lg">
                        <div className="text-2xl font-bold text-emerald-600">{ai_analysis.confidence_pct}%</div>
                        <div className="text-sm text-slate-600">Confidence</div>
                      </div>
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{ai_analysis.trend}</div>
                        <div className="text-sm text-slate-600">Trend</div>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">{ai_analysis.short_term.targets.length}</div>
                        <div className="text-sm text-slate-600">Targets</div>
                      </div>
                    </div>
                    
                    {/* Trading Strategies */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card className="h-full">
                        <CardHeader className="flex-shrink-0">
                          <CardTitle className="text-sm">Short Term</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm flex-1">
                          <p><strong>Entry:</strong> {ai_analysis.short_term.entry_range[0]} - {ai_analysis.short_term.entry_range[1]}</p>
                          <p><strong>Stop Loss:</strong> {ai_analysis.short_term.stop_loss}</p>
                          <p><strong>Targets:</strong> {ai_analysis.short_term.targets.join(', ')}</p>
                        </CardContent>
                      </Card>
                      
                      <Card className="h-full">
                        <CardHeader className="flex-shrink-0">
                          <CardTitle className="text-sm">Medium Term</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm flex-1">
                          <p><strong>Entry:</strong> {ai_analysis.medium_term.entry_range[0]} - {ai_analysis.medium_term.entry_range[1]}</p>
                          <p><strong>Stop Loss:</strong> {ai_analysis.medium_term.stop_loss}</p>
                          <p><strong>Targets:</strong> {ai_analysis.medium_term.targets.join(', ')}</p>
                        </CardContent>
                      </Card>
                      
                      <Card className="h-full">
                        <CardHeader className="flex-shrink-0">
                          <CardTitle className="text-sm">Long Term</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm flex-1">
                          <p><strong>Rating:</strong> {ai_analysis.long_term.investment_rating}</p>
                          <p><strong>Fair Value:</strong> {ai_analysis.long_term.fair_value_range[0]} - {ai_analysis.long_term.fair_value_range[1]}</p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Technical Analysis Section */}
        {indicator_summary_md && (
          <div className="mb-8">
            <TechnicalAnalysisCard 
              indicatorSummary={indicator_summary_md || ''} 
            />
          </div>
        )}

        {/* Enhanced Pattern Recognition Section */}
        {analysisData.overlays && (
          <div className="mb-8">
            <EnhancedPatternRecognitionCard 
              overlays={analysisData.overlays as EnhancedOverlays}
              symbol={stockSymbol}
            />
          </div>
        )}

        {/* Phase 2 Advanced Analysis Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Advanced Pattern Analysis */}
          {(indicators as any)?.advanced_patterns && (
            <AdvancedPatternAnalysisCard 
              patterns={(indicators as any).advanced_patterns} 
              symbol={stockSymbol}
            />
          )}

          {/* Multi-Timeframe Analysis */}
          {(indicators as any)?.multi_timeframe && !(indicators as any).multi_timeframe.error && (
            <MultiTimeframeAnalysisCard 
              analysis={(indicators as any).multi_timeframe} 
              symbol={stockSymbol}
            />
          )}
        </div>

        {/* Advanced Risk Assessment */}
        {(indicators as any)?.advanced_risk && !(indicators as any).advanced_risk.error && (
          <div className="mb-8">
            <AdvancedRiskAssessmentCard 
              riskMetrics={(indicators as any).advanced_risk}
              symbol={stockSymbol}
            />
          </div>
        )}

        {/* Phase 3 Complex Pattern Analysis */}
        {(indicators as any)?.advanced_patterns && (
          <div className="mb-8">
            <ComplexPatternAnalysisCard 
              patterns={(indicators as any).advanced_patterns}
            />
          </div>
        )}

        {/* Phase 3 Advanced Risk Metrics */}
        {((indicators as any)?.stress_testing || (indicators as any)?.scenario_analysis) && (
          <div className="mb-8">
            <AdvancedRiskMetricsCard 
              stress_testing={(indicators as any).stress_testing}
              scenario_analysis={(indicators as any).scenario_analysis}
            />
          </div>
        )}

        {/* Action Buttons and Disclaimer */}
        <div className="space-y-6">
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

export default Output;
