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
import { formatCurrency, formatPercentage, formatPercentageValue, formatNumber, formatPriceChange } from "@/utils/numberFormatter";

// Icons
import { 
  TrendingUp, 
  TrendingDown,
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
  CheckCircle,
  XCircle,
  Calendar
} from 'lucide-react';

// Analysis Components
import ConsensusSummaryCard from "@/components/analysis/ConsensusSummaryCard";
import SignalsSummaryCard from "@/components/analysis/SignalsSummaryCard";
import AITradingAnalysisOverviewCard from "@/components/analysis/AITradingAnalysisOverviewCard";
import DecisionStoryCard from "@/components/analysis/DecisionStoryCard";

import MultiTimeframeAnalysisCard from "@/components/analysis/MultiTimeframeAnalysisCard";
import AdvancedRiskAssessmentCard from "@/components/analysis/AdvancedRiskAssessmentCard";
import AdvancedRiskMetricsCard from "@/components/analysis/AdvancedRiskMetricsCard";
import SectorAnalysisCard from "@/components/analysis/SectorAnalysisCard";
import SectorBenchmarkingCard from "@/components/analysis/SectorBenchmarkingCard";
import EnhancedPatternRecognitionCard from "@/components/analysis/EnhancedPatternRecognitionCard";
import PriceStatisticsCardOutput from "@/components/analysis/PriceStatisticsCardOutput";
import ActionButtonsSection from "@/components/analysis/ActionButtonsSection";
import DisclaimerCard from "@/components/analysis/DisclaimerCard";
import TradingLevelsCard from "@/components/analysis/TradingLevelsCard";

import VolumeAnalysisCard from "@/components/analysis/VolumeAnalysisCard";

// New Enhanced Components
import EnhancedAIAnalysisCard from "@/components/analysis/EnhancedAIAnalysisCard";
import EnhancedMultiTimeframeCard from "@/components/analysis/EnhancedMultiTimeframeCard";
import EnhancedSectorContextCard from "@/components/analysis/EnhancedSectorContextCard";
import CorrelationMatrixCard from "@/components/analysis/CorrelationMatrixCard";

// Services and Utils
import { apiService } from "@/services/api";
import { AnalysisData, EnhancedOverlays, MultiTimeframeAnalysis, AdvancedRiskMetrics, StressTestingData, ScenarioAnalysisData, AnalysisResults } from "@/types/analysis";
import { transformDatabaseRecord, extractPriceStatisticsFromEnhanced } from "@/utils/databaseDataTransformer";
import Header from "@/components/Header";



interface ChartData {
  date: string;
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  price?: number; // Optional price field for compatibility
}

interface ExtendedIndicators {
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
  
  // Refs for sliding bubble positioning
  const tabRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const [bubbleStyle, setBubbleStyle] = useState({ left: 0, width: 0 });

  // Function to clear cache and force fresh analysis
  const clearCacheAndRefresh = () => {
    localStorage.removeItem('analysisResult');
    window.location.reload();
  };

  // Update bubble position when active tab changes
  useEffect(() => {
    const updateBubblePosition = () => {
      const activeTabRef = tabRefs.current[activeTab];
      if (activeTabRef) {
        const rect = activeTabRef.getBoundingClientRect();
        const tabsListRect = activeTabRef.parentElement?.getBoundingClientRect();
        if (tabsListRect) {
          setBubbleStyle({
            left: rect.left - tabsListRect.left,
            width: rect.width
          });
        }
      }
    };

    // Small delay to ensure DOM is updated
    const timeoutId = setTimeout(updateBubblePosition, 50);
    return () => clearTimeout(timeoutId);
  }, [activeTab]);

  // Load analysis data and stock symbol from localStorage or route params
  useEffect(() => {
    try {
      // Try to get analysis data from localStorage (from previous analysis)
      const storedAnalysis = localStorage.getItem('analysisResult');
      if (storedAnalysis) {
        const parsed = JSON.parse(storedAnalysis);
        // console.log('Parsed analysis data:', parsed);
        
        // Check if the response has a 'results' field (new backend structure)
        const analysisData = parsed.results || parsed;
        const stockSymbol = parsed.stock_symbol || "RELIANCE";
        
        // console.log('Analysis data after extraction:', analysisData);
        // console.log('Stock symbol:', stockSymbol);
        
        // Check if this is the new enhanced structure
        const isEnhancedStructure = analysisData && (
          analysisData.analysis_type || 
          analysisData.enhanced_metadata ||
          analysisData.technical_indicators
        );
        
        if (isEnhancedStructure) {
          // Handle enhanced structure
          setEnhancedData(analysisData);
          setStockSymbol(stockSymbol);
          
          // Transform for backward compatibility
          const transformedData = transformDatabaseRecord({
            id: analysisData.id || '1',
            user_id: analysisData.user_id || '1',
            stock_symbol: stockSymbol,
            analysis_data: analysisData,
            created_at: analysisData.analysis_timestamp || new Date().toISOString(),
            updated_at: analysisData.analysis_timestamp || new Date().toISOString()
          });
          // console.log('Transformed data:', transformedData);
          setAnalysisData(transformedData);
        } else {
          // Handle legacy structure
          const transformedData = transformDatabaseRecord({
            id: analysisData.id || '1',
            user_id: analysisData.user_id || '1',
            stock_symbol: stockSymbol,
            analysis_data: analysisData,
            created_at: analysisData.created_at || new Date().toISOString(),
            updated_at: analysisData.updated_at || new Date().toISOString()
          });
          
          // console.log('Transformed legacy data:', transformedData);
          setAnalysisData(transformedData);
          setStockSymbol(stockSymbol);
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
                indicator_summary: 'Technical indicators will be calculated from historical data',
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
      // console.error('Error loading analysis data:', err);
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
          <Button onClick={clearCacheAndRefresh} className="mt-4">
            Clear Cache & Retry
          </Button>
        </div>
      </div>
    );
  }

  // Extract data with proper fallbacks
  const consensus = analysisData?.consensus;
  const consensusForCard = consensus || (enhancedData ? {
    overall_signal: enhancedData.recommendation || 'Neutral',
    signal_strength: enhancedData.risk_level || 'Medium',
    bullish_percentage: 0,
    bearish_percentage: 0,
    neutral_percentage: 100,
    bullish_score: 0,
    bearish_score: 0,
    neutral_score: 0,
    total_weight: 0,
    confidence: (enhancedData as any)?.ai_analysis?.meta?.overall_confidence || 0,
    signal_details: [],
    data_quality_flags: [],
    warnings: [],
    bullish_count: 0,
    bearish_count: 0,
    neutral_count: 0,
    technical_indicators: enhancedData?.technical_indicators || null
  } : null);
  // Extract indicators data with advanced components mapping
  // Transform backend scenario analysis to frontend format
  const transformScenarioAnalysis = (backendScenarioAnalysis: any) => {
    if (!backendScenarioAnalysis || backendScenarioAnalysis.error) {
      return backendScenarioAnalysis;
    }
    
    // If it's already in frontend format, return as is
    if (backendScenarioAnalysis.scenario_results && backendScenarioAnalysis.scenario_summary) {
      return backendScenarioAnalysis;
    }
    
    // Transform backend structure to frontend format
    const scenarioResults: any[] = [];
    const probabilityScores = backendScenarioAnalysis.probability_scores || {};
    const expectedOutcomes = backendScenarioAnalysis.expected_outcomes || {};
    const impactScores = backendScenarioAnalysis.impact_scores || {};
    
    // Convert probability scores and expected outcomes to scenario results
    Object.entries(probabilityScores).forEach(([scenarioKey, probability]) => {
      const scenarioName = scenarioKey === 'bull' ? 'Bull Market' : 
                          scenarioKey === 'bear' ? 'Bear Market' : 
                          scenarioKey === 'sideways' ? 'Sideways Market' : 
                          scenarioKey === 'volatility' ? 'Volatility Spike' : scenarioKey;
      
      const expectedOutcome = expectedOutcomes[`${scenarioKey}_scenario`] || {};
      const impact = impactScores[`${scenarioKey}_scenario_impact`] || 0;
      
      scenarioResults.push({
        scenario_name: scenarioName,
        outcome: expectedOutcome.scenario || scenarioName,
        probability: (probability as number) || 0,
        impact: impact,
        risk_level: impact > 20 ? 'high' : impact > 10 ? 'medium' : 'low'
      });
    });
    
    // Create scenario summary
    const scenarioSummary = {
      best_case: backendScenarioAnalysis.best_case || 'Bull Market',
      worst_case: backendScenarioAnalysis.worst_case || 'Bear Market',
      expected_outcome: scenarioResults.length > 0 ? scenarioResults[0].scenario_name : 'Unknown',
      confidence_level: backendScenarioAnalysis.confidence_levels?.overall || 0.5
    };
    
    return {
      scenario_results: scenarioResults,
      scenario_summary: scenarioSummary,
      analysis_timestamp: backendScenarioAnalysis.analysis_timestamp
    };
  };

  // Transform backend advanced risk metrics to frontend format
  const transformAdvancedRiskMetrics = (backendRiskMetrics: any) => {
    if (!backendRiskMetrics || backendRiskMetrics.error) {
      return backendRiskMetrics;
    }
    
    // Debug: Log the backend risk metrics to see what data is available
    // console.log('🔍 DEBUG: Backend risk metrics:', backendRiskMetrics);
    // console.log('🔍 DEBUG: Backend risk metrics liquidity_analysis:', backendRiskMetrics?.liquidity_analysis);
    // console.log('🔍 DEBUG: Backend risk metrics correlation_analysis:', backendRiskMetrics?.correlation_analysis);
    
    // If it's already in frontend format, return as is
    if (backendRiskMetrics.basic_metrics && backendRiskMetrics.risk_assessment) {
      return backendRiskMetrics;
    }
    
    // Transform flat backend structure to nested frontend structure
    return {
      basic_metrics: {
        volatility: backendRiskMetrics.volatility ?? backendRiskMetrics.current_volatility ?? 0,
        annualized_volatility: backendRiskMetrics.annualized_volatility ?? backendRiskMetrics.volatility_annualized ?? 0,
        mean_return: backendRiskMetrics.mean_return ?? backendRiskMetrics.avg_return ?? 0,
        annualized_return: backendRiskMetrics.annualized_return ?? backendRiskMetrics.return_annualized ?? 0
      },
      var_metrics: {
        var_95: backendRiskMetrics.var_95 ?? backendRiskMetrics.value_at_risk_95 ?? 0,
        var_99: backendRiskMetrics.var_99 ?? backendRiskMetrics.value_at_risk_99 ?? 0,
        es_95: backendRiskMetrics.expected_shortfall_95 ?? backendRiskMetrics.es_95 ?? 0,
        es_99: backendRiskMetrics.expected_shortfall_99 ?? backendRiskMetrics.es_99 ?? 0
      },
      drawdown_metrics: {
        max_drawdown: backendRiskMetrics.max_drawdown ?? backendRiskMetrics.dd_max ?? 0,
        current_drawdown: backendRiskMetrics.current_drawdown ?? backendRiskMetrics.dd_current ?? 0,
        drawdown_duration: backendRiskMetrics.drawdown_duration ?? backendRiskMetrics.dd_duration ?? 0
      },
      risk_adjusted_metrics: {
        sharpe_ratio: backendRiskMetrics.sharpe_ratio ?? backendRiskMetrics.ratio_sharpe ?? 0,
        sortino_ratio: backendRiskMetrics.sortino_ratio ?? backendRiskMetrics.ratio_sortino ?? 0,
        calmar_ratio: backendRiskMetrics.calmar_ratio ?? backendRiskMetrics.ratio_calmar ?? 0,
        risk_adjusted_return: backendRiskMetrics.annualized_return ?? backendRiskMetrics.return_annualized ?? 0
      },
      distribution_metrics: {
        skewness: backendRiskMetrics.skewness ?? 0,
        kurtosis: backendRiskMetrics.kurtosis ?? 0,
        tail_frequency: backendRiskMetrics.tail_frequency ?? backendRiskMetrics.tail_freq ?? 0
      },
      volatility_analysis: {
        current_volatility: backendRiskMetrics.current_volatility ?? backendRiskMetrics.annualized_volatility ?? 0,
        volatility_percentile: 50, // Not provided in backend
        volatility_regime: (backendRiskMetrics.current_volatility ?? backendRiskMetrics.annualized_volatility ?? 0) > 0.3 ? 'high' : 
                          (backendRiskMetrics.current_volatility ?? backendRiskMetrics.annualized_volatility ?? 0) > 0.2 ? 'medium' : 'low'
      },
      liquidity_analysis: {
        liquidity_score: backendRiskMetrics.liquidity_analysis?.liquidity_score || backendRiskMetrics.liquidity_score || 50,
        volume_volatility: backendRiskMetrics.liquidity_analysis?.volume_volatility ?? backendRiskMetrics.volume_volatility ?? null
      },
      correlation_analysis: {
        market_correlation: backendRiskMetrics.correlation_analysis?.market_correlation || backendRiskMetrics.market_correlation || 0.5,
        beta: backendRiskMetrics.correlation_analysis?.beta || backendRiskMetrics.beta || 1.0
      },
      risk_assessment: {
        overall_risk_score: backendRiskMetrics.risk_score ?? backendRiskMetrics.overall_risk_score ?? 50,
        risk_level: backendRiskMetrics.risk_level || 'medium',
        risk_components: backendRiskMetrics.risk_components ? 
          Object.fromEntries(
            Object.entries(backendRiskMetrics.risk_components).map(([key, value]) => [
              key, 
              typeof value === 'string' ? 
                (value === 'high' ? 80 : value === 'medium' ? 50 : 20) : 
                (value || 50)
            ])
          ) : {
            volatility_risk: 50,
            drawdown_risk: 50,
            tail_risk: 50,
            liquidity_risk: 50,
            correlation_risk: 50
          },
        mitigation_strategies: backendRiskMetrics.mitigation_strategies || []
      }
    };
    

  };

  const extractAdvancedIndicators = (enhancedData: any, analysisData: any) => {
    const baseIndicators = enhancedData?.technical_indicators || analysisData?.indicators;
    
    // Transform advanced risk metrics
    const backendRiskMetrics = enhancedData?.enhanced_metadata?.advanced_risk_metrics || 
                               enhancedData?.technical_indicators?.advanced_risk_metrics ||
                               enhancedData?.advanced_risk_metrics ||
                               enhancedData?.risk_metrics ||
                               baseIndicators?.advanced_risk;
    
    // Debug: Log what we're getting for liquidity analysis
    if (backendRiskMetrics && backendRiskMetrics.liquidity_analysis) {
      console.log('✅ [LIQUIDITY DEBUG] Found liquidity analysis:', {
        liquidity_score: backendRiskMetrics.liquidity_analysis.liquidity_score,
        volume_volatility: backendRiskMetrics.liquidity_analysis.volume_volatility,
        path: 'advanced_risk -> liquidity_analysis'
      });
    } else {
      console.warn('⚠️ [LIQUIDITY DEBUG] No liquidity analysis found in:', {
        hasBackendRiskMetrics: !!backendRiskMetrics,
        enhancedMetadata: !!enhancedData?.enhanced_metadata?.advanced_risk_metrics,
        technicalIndicators: !!enhancedData?.technical_indicators?.advanced_risk_metrics,
        directAdvancedRisk: !!enhancedData?.advanced_risk_metrics,
        riskMetrics: !!enhancedData?.risk_metrics,
        baseAdvancedRisk: !!baseIndicators?.advanced_risk
      });
      
      // Debug: Show the actual structure of backendRiskMetrics
      console.log('🔍 [LIQUIDITY DEBUG] Actual backendRiskMetrics structure:', backendRiskMetrics);
      const keys = backendRiskMetrics ? Object.keys(backendRiskMetrics) : [];
      console.log('🔍 [LIQUIDITY DEBUG] All keys in backendRiskMetrics:', keys);
      console.log('🔍 [LIQUIDITY DEBUG] Keys containing "liquid":', keys.filter(k => k.toLowerCase().includes('liquid')));
      console.log('🔍 [LIQUIDITY DEBUG] Keys containing "volume":', keys.filter(k => k.toLowerCase().includes('volume')));
      
      // Check if liquidity data exists but with different key names
      if (backendRiskMetrics) {
        const liquidityInfo = {
          liquidity_analysis: !!backendRiskMetrics.liquidity_analysis,
          liquidity_score: !!backendRiskMetrics.liquidity_score,
          volume_volatility: !!backendRiskMetrics.volume_volatility,
          has_liquidity_analysis: 'liquidity_analysis' in backendRiskMetrics,
          liquidity_analysis_keys: backendRiskMetrics.liquidity_analysis ? Object.keys(backendRiskMetrics.liquidity_analysis) : 'not found',
          // Check direct values
          liquidity_analysis_value: backendRiskMetrics.liquidity_analysis,
          liquidity_score_value: backendRiskMetrics.liquidity_score,
          volume_volatility_value: backendRiskMetrics.volume_volatility
        };
        console.log('🔍 [LIQUIDITY DEBUG] Liquidity-related keys and values:', liquidityInfo);
      }
    }
    
    const transformedRiskMetrics = transformAdvancedRiskMetrics(backendRiskMetrics);
    
    // Transform scenario analysis
    const backendScenarioAnalysis = enhancedData?.enhanced_metadata?.scenario_analysis_metrics || 
                                   enhancedData?.technical_indicators?.scenario_analysis_metrics ||
                                   baseIndicators?.scenario_analysis;
    const transformedScenarioAnalysis = transformScenarioAnalysis(backendScenarioAnalysis);
    
    // Debug: Log the transformed scenario analysis
    // console.log('🔍 DEBUG: Transformed scenario analysis:', transformedScenarioAnalysis);
    
    // Map advanced components from enhanced data structure
    return {
      ...baseIndicators,
      // Advanced risk metrics (transformed)
      advanced_risk: transformedRiskMetrics,
      
      // Stress testing from enhanced metadata
      stress_testing: enhancedData?.enhanced_metadata?.stress_testing_metrics || 
                     enhancedData?.technical_indicators?.stress_testing_metrics ||
                     baseIndicators?.stress_testing,
      
      // Scenario analysis (transformed)
      scenario_analysis: transformedScenarioAnalysis,
      
      // Multi-timeframe analysis
      multi_timeframe: enhancedData?.multi_timeframe_analysis || 
                      enhancedData?.technical_indicators?.multi_timeframe ||
                      baseIndicators?.multi_timeframe
    };
  };
  
  const indicators = extractAdvancedIndicators(enhancedData, analysisData);

  const indicator_summary_md = enhancedData?.indicator_summary || analysisData?.indicator_summary;
  const chart_insights = enhancedData?.chart_insights || analysisData?.chart_insights;
  const ai_analysis = enhancedData?.ai_analysis || analysisData?.ai_analysis;
  const deterministicSignals = (enhancedData as any)?.signals || (analysisData as any)?.signals || null;
  // Transform backend sector benchmarking data to frontend format
  const transformSectorBenchmarking = (backendData: any) => {
    if (!backendData) {
      return null;
    }
    
    // Check for backend errors or insufficient data
    const hasError = backendData.error;
    const hasInsufficientData = backendData.data_quality?.sufficient_data === false;
    const isReliable = backendData.data_quality?.reliability !== 'none';

    // Check for insufficient data points (less than minimum recommended)
    const dataPoints = backendData.data_quality?.data_points || 0;
    const minRecommended = backendData.data_quality?.minimum_recommended || 30;
    const hasInsufficientDataPoints = dataPoints < minRecommended;
    
    // Determine if values should be nullified BEFORE any usage
    // Be aggressive about nullifying when data is clearly insufficient
    const shouldNullifyValues = Boolean(
      hasError || 
      hasInsufficientData || 
      !isReliable || 
      hasInsufficientDataPoints ||
      (dataPoints === 0) // Always nullify when zero data points
    );
    if (shouldNullifyValues) {
      console.warn('⚠️ [SECTOR DATA] Insufficient data detected - showing N/A values');
    }
    
    // If it's already in frontend format, ensure proper field mapping
    if (backendData.sector_info && backendData.market_benchmarking) {
      // Still need to map stock_sharpe to sharpe_ratio if not already mapped
      const result = { ...backendData };
      if (result.market_benchmarking && result.market_benchmarking.stock_sharpe !== undefined && result.market_benchmarking.sharpe_ratio === undefined) {
        result.market_benchmarking.sharpe_ratio = result.market_benchmarking.stock_sharpe;
      }
      return result;
    }
    
    // CRITICAL FIX: Handle our optimized backend data structure
    // Our backend returns: { sector, beta, correlation, sector_beta, sector_correlation, data_quality, ... }
    if (backendData.beta !== undefined || backendData.sector_beta !== undefined) {
      
      return {
        stock_symbol: backendData.stock_symbol || 'UNKNOWN',
        sector_info: {
          sector: backendData.sector || 'UNKNOWN',
          sector_name: backendData.sector || 'UNKNOWN', 
          sector_index: backendData.sector_index || `NIFTY_${backendData.sector || 'UNKNOWN'}`,
          sector_stocks_count: 0
        },
        market_benchmarking: {
          beta: shouldNullifyValues ? null : (backendData.beta ?? null),
          correlation: shouldNullifyValues ? null : (backendData.correlation ?? null),
          sharpe_ratio: shouldNullifyValues ? null : (backendData.stock_sharpe ?? backendData.sharpe_ratio ?? null),
          volatility: shouldNullifyValues ? null : (backendData.stock_volatility ?? backendData.volatility ?? null),
          max_drawdown: shouldNullifyValues ? null : (backendData.max_drawdown ?? null),
          cumulative_return: shouldNullifyValues ? null : (backendData.stock_cumulative_return ?? backendData.cumulative_return ?? null),
          annualized_return: shouldNullifyValues ? null : (backendData.stock_annualized_return ?? backendData.annualized_return ?? null),
          risk_free_rate: backendData.risk_free_rate ?? 0.07,
          current_vix: backendData.current_vix ?? 20,
          data_source: 'NSE',
          data_points: backendData.data_quality?.data_points ?? 0
        },
        sector_benchmarking: {
          sector_beta: shouldNullifyValues ? null : (backendData.sector_beta ?? null),
          sector_correlation: shouldNullifyValues ? null : (backendData.sector_correlation ?? null),
          sector_sharpe_ratio: shouldNullifyValues ? null : (backendData.sector_sharpe ?? backendData.sector_sharpe_ratio ?? null),
          // CRITICAL FIX: Get sector_volatility from sector_correlation object using current sector key
          sector_volatility: shouldNullifyValues ? null : (
            backendData.sector_volatility ?? 
            backendData.sector_correlation?.sector_volatility?.[backendData.sector] ?? 
            backendData.sector_correlation?.sector_volatilities?.[backendData.sector] ?? 
            null
          ),
          sector_max_drawdown: shouldNullifyValues ? null : (backendData.sector_max_drawdown ?? null),
          sector_cumulative_return: shouldNullifyValues ? null : (backendData.sector_cumulative_return ?? null),
          sector_annualized_return: shouldNullifyValues ? null : (backendData.sector_annualized_return ?? null),
          sector_index: backendData.sector_index ?? `NIFTY_${backendData.sector || 'UNKNOWN'}`,
          sector_data_points: backendData.data_quality?.sector_data_points ?? 0
        },
        relative_performance: {
          vs_market: {
            performance_ratio: shouldNullifyValues ? null : (backendData.excess_return ?? null),
            risk_adjusted_ratio: null,
            outperformance_periods: null,
            underperformance_periods: null,
            consistency_score: null
          },
          vs_sector: {
            performance_ratio: shouldNullifyValues ? null : (backendData.sector_excess_return ?? null),
            risk_adjusted_ratio: null,
            sector_rank: shouldNullifyValues ? null : (backendData.relative_performance?.vs_sector?.sector_rank ?? null),
            sector_percentile: shouldNullifyValues ? null : (backendData.relative_performance?.vs_sector?.sector_percentile ?? null),
            sector_consistency: shouldNullifyValues ? null : (backendData.relative_performance?.vs_sector?.sector_consistency ?? null)
          }
        },
        sector_risk_metrics: {
          risk_score: backendData.sector_risk_metrics?.risk_score ?? null,
          risk_level: backendData.sector_risk_metrics?.risk_level ?? null,
          correlation_risk: backendData.sector_risk_metrics?.correlation_risk ?? null,
          momentum_risk: backendData.sector_risk_metrics?.momentum_risk ?? null,
          volatility_risk: backendData.sector_risk_metrics?.volatility_risk ?? null,
          sector_stress_metrics: {
            stress_score: backendData.sector_risk_metrics?.sector_stress_metrics?.stress_score ?? null,
            stress_level: backendData.sector_risk_metrics?.sector_stress_metrics?.stress_level ?? null,
            stress_factors: backendData.sector_risk_metrics?.sector_stress_metrics?.stress_factors ?? []
          },
          risk_factors: backendData.sector_risk_metrics?.risk_factors ?? [],
          risk_mitigation: backendData.sector_risk_metrics?.risk_mitigation ?? []
        },
        analysis_summary: {
          market_position: backendData.analysis_summary?.market_position ?? null,
          sector_position: backendData.analysis_summary?.sector_position ?? null,
          risk_assessment: backendData.analysis_summary?.risk_assessment ?? null,
          investment_recommendation: backendData.analysis_summary?.investment_recommendation ?? null
        },
        timestamp: new Date().toISOString(),
        data_points: backendData.data_points || {
          stock_data_points: 0,
          market_data_points: 0,
          sector_data_points: 0
        },
        data_quality: backendData.data_quality || null,
        error_message: null,
        is_reliable: !shouldNullifyValues
      };
    }
    
    // Transform backend format to frontend format - using the correct structure from your JSON
    return {
      stock_symbol: backendData.stock_symbol || '',
      sector_info: {
        sector: backendData.sector_info?.sector || backendData.sector || '',
        sector_name: backendData.sector_info?.sector_name || backendData.sector || '',
        sector_index: backendData.sector_info?.sector_index || 'NIFTY_' + (backendData.sector || 'UNKNOWN'),
        sector_stocks_count: backendData.sector_info?.sector_stocks_count || 0
      },
      market_benchmarking: {
        beta: shouldNullifyValues ? null : (backendData.market_benchmarking?.beta ?? null),
        correlation: shouldNullifyValues ? null : (backendData.market_benchmarking?.correlation ?? null),
        sharpe_ratio: shouldNullifyValues ? null : (backendData.market_benchmarking?.stock_sharpe ?? backendData.market_benchmarking?.sharpe_ratio ?? null),
        volatility: shouldNullifyValues ? null : (backendData.market_benchmarking?.volatility ?? null),
        max_drawdown: shouldNullifyValues ? null : (backendData.market_benchmarking?.max_drawdown ?? null),
        cumulative_return: shouldNullifyValues ? null : (backendData.market_benchmarking?.cumulative_return ?? null),
        annualized_return: shouldNullifyValues ? null : (backendData.market_benchmarking?.annualized_return ?? null),
        risk_free_rate: backendData.market_benchmarking?.risk_free_rate ?? 0.05,
        current_vix: backendData.market_benchmarking?.current_vix ?? 20,
        data_source: backendData.market_benchmarking?.data_source ?? 'NSE',
        data_points: backendData.data_quality?.data_points ?? 0
      },
      sector_benchmarking: {
        sector_beta: shouldNullifyValues ? null : (backendData.sector_benchmarking?.sector_beta ?? null),
        sector_correlation: shouldNullifyValues ? null : (backendData.sector_benchmarking?.sector_correlation ?? null),
        sector_sharpe_ratio: shouldNullifyValues ? null : (backendData.sector_benchmarking?.sector_sharpe_ratio ?? null),
        // CRITICAL FIX: Get sector_volatility from sector_correlation object using current sector key
        sector_volatility: shouldNullifyValues ? null : (
          backendData.sector_benchmarking?.sector_volatility ?? 
          backendData.sector_correlation?.sector_volatility?.[backendData.sector] ?? 
          backendData.sector_correlation?.sector_volatilities?.[backendData.sector] ?? 
          null
        ),
        sector_max_drawdown: shouldNullifyValues ? null : (backendData.sector_benchmarking?.sector_max_drawdown ?? null),
        sector_cumulative_return: shouldNullifyValues ? null : (backendData.sector_benchmarking?.sector_cumulative_return ?? null),
        sector_annualized_return: shouldNullifyValues ? null : (backendData.sector_benchmarking?.sector_annualized_return ?? null),
        sector_index: backendData.sector_benchmarking?.sector_index ?? (backendData.sector ? 'NIFTY_' + backendData.sector : 'NIFTY_UNKNOWN'),
        sector_data_points: backendData.data_quality?.sector_data_points ?? 0
      },
      relative_performance: {
        vs_market: {
          performance_ratio: shouldNullifyValues ? null : (backendData.relative_performance?.vs_market?.performance_ratio ?? null),
          risk_adjusted_ratio: shouldNullifyValues ? null : (backendData.relative_performance?.vs_market?.risk_adjusted_ratio ?? null),
          outperformance_periods: shouldNullifyValues ? null : (backendData.relative_performance?.vs_market?.outperformance_periods ?? null),
          underperformance_periods: shouldNullifyValues ? null : (backendData.relative_performance?.vs_market?.underperformance_periods ?? null),
          consistency_score: shouldNullifyValues ? null : (backendData.relative_performance?.vs_market?.consistency_score ?? null)
        },
        vs_sector: {
          performance_ratio: shouldNullifyValues ? null : (backendData.relative_performance?.vs_sector?.performance_ratio ?? null),
          risk_adjusted_ratio: shouldNullifyValues ? null : (backendData.relative_performance?.vs_sector?.risk_adjusted_ratio ?? null),
          sector_rank: shouldNullifyValues ? null : (backendData.relative_performance?.vs_sector?.sector_rank ?? null),
          sector_percentile: shouldNullifyValues ? null : (backendData.relative_performance?.vs_sector?.sector_percentile ?? null),
          sector_consistency: shouldNullifyValues ? null : (backendData.relative_performance?.vs_sector?.sector_consistency ?? null)
        }
      },
      sector_risk_metrics: {
        risk_score: backendData.sector_risk_metrics?.risk_score ?? null,
        risk_level: backendData.sector_risk_metrics?.risk_level ?? null,
        correlation_risk: backendData.sector_risk_metrics?.correlation_risk ?? null,
        momentum_risk: backendData.sector_risk_metrics?.momentum_risk ?? null,
        volatility_risk: backendData.sector_risk_metrics?.volatility_risk ?? null,
        sector_stress_metrics: {
          stress_score: backendData.sector_risk_metrics?.sector_stress_metrics?.stress_score ?? null,
          stress_level: backendData.sector_risk_metrics?.sector_stress_metrics?.stress_level ?? null,
          stress_factors: backendData.sector_risk_metrics?.sector_stress_metrics?.stress_factors ?? []
        },
        risk_factors: backendData.sector_risk_metrics?.risk_factors ?? [],
        risk_mitigation: backendData.sector_risk_metrics?.risk_mitigation ?? []
      },
      analysis_summary: {
        market_position: backendData.analysis_summary?.market_position ?? null,
        sector_position: backendData.analysis_summary?.sector_position ?? null,
        risk_assessment: backendData.analysis_summary?.risk_assessment ?? null,
        investment_recommendation: backendData.analysis_summary?.investment_recommendation ?? null
      },
      timestamp: backendData.timestamp || new Date().toISOString(),
      data_points: {
        stock_data_points: backendData.data_points?.stock_data_points ?? 0,
        market_data_points: backendData.data_points?.market_data_points ?? 0,
        sector_data_points: backendData.data_points?.sector_data_points ?? 0
      },
      // Add data quality and error information for frontend display
      data_quality: backendData.data_quality || null,
      error_message: hasError ? backendData.error : null,
      is_reliable: !shouldNullifyValues
    };
    
    // Log final transformation result when there are issues
    if (shouldNullifyValues && result) {
      console.info('ℹ️ [SECTOR DATA] Transformed unreliable data to null values for display as N/A');
    }
    
    return result;
  };

  // Extract sector data from the appropriate location in the response
  const rawSectorData = enhancedData?.sector_context?.sector_benchmarking || 
                       enhancedData?.sector_context?.comprehensive_sector_context?.sector_benchmarking ||
                       enhancedData?.sector_context?.benchmarking || 
                       enhancedData?.sector_context || 
                       analysisData?.sector_benchmarking;
  
  const sector_benchmarking_raw = transformSectorBenchmarking(rawSectorData);
  
  // CRITICAL FIX: Only use sector_benchmarking when it's not null
  // This prevents null values from first render overriding good data from subsequent renders
  const sector_benchmarking = sector_benchmarking_raw && Object.keys(sector_benchmarking_raw).length > 0 ? sector_benchmarking_raw : null;
  

  
  // Transform backend sector_context to frontend SectorContext format
  const transformSectorContext = (backendSectorContext: any) => {
    if (!backendSectorContext) return null;
    
    return {
      sector: backendSectorContext.sector || 'UNKNOWN',
      benchmarking: sector_benchmarking, // Use the transformed sector benchmarking
      rotation_insights: {
        sector_rank: backendSectorContext.sector_rotation?.sector_rankings?.[backendSectorContext.sector]?.rank ?? 
                    backendSectorContext.sector_rotation?.sector_performance?.[backendSectorContext.sector]?.total_return ?? null,
        sector_performance: backendSectorContext.sector_rotation?.sector_performance?.[backendSectorContext.sector]?.total_return ?? null,
        rotation_strength: backendSectorContext.sector_rotation?.rotation_patterns?.rotation_strength ?? null,
        leading_sectors: backendSectorContext.sector_rotation?.rotation_patterns?.leading_sectors?.map((s: any) => s.sector) || [],
        lagging_sectors: backendSectorContext.sector_rotation?.rotation_patterns?.lagging_sectors?.map((s: any) => s.sector) || [],
        recommendations: backendSectorContext.sector_rotation?.recommendations?.map((r: any) => ({
          type: r.type || 'rotation',
          action: r.action || r.recommendation || '',
          reason: r.reason || r.message || '',
          confidence: r.confidence || 50,
          timeframe: '1M'
        })) || []
      },
      correlation_insights: {
        average_correlation: backendSectorContext.sector_correlation?.average_correlation ?? null,
        diversification_quality: backendSectorContext.sector_correlation?.diversification_insights?.diversification_quality ?? null,
        sector_volatility: backendSectorContext.sector_correlation?.sector_volatility?.[backendSectorContext.sector] ?? 
                          backendSectorContext.sector_correlation?.sector_volatilities?.[backendSectorContext.sector] ?? 
                          (typeof backendSectorContext.sector_correlation?.sector_volatility === 'number' ? 
                            backendSectorContext.sector_correlation.sector_volatility : null),
        // Store raw correlation data for the new component
        correlation_matrix: backendSectorContext.sector_correlation?.correlation_matrix || {},
        high_correlation_pairs: backendSectorContext.sector_correlation?.high_correlation_pairs || [],
        low_correlation_pairs: backendSectorContext.sector_correlation?.low_correlation_pairs || [],
        // Include the full diversification insights for the new component
        diversification_insights: backendSectorContext.sector_correlation?.diversification_insights ?? {
          diversification_quality: null,
          recommendations: []
        }
      },
      trading_recommendations: [
        ...(backendSectorContext.sector_rotation?.recommendations?.map((r: any) => ({
          type: 'rotation',
          recommendation: r.action || r.recommendation || '',
          reason: r.reason || r.message || '',
          confidence: r.confidence?.toString() || 'medium'
        })) || []),
        ...(backendSectorContext.sector_correlation?.diversification_insights?.recommendations?.map((r: any) => ({
          type: 'diversification',
          recommendation: r.type || '',
          reason: r.message || '',
          confidence: r.priority || 'medium'
        })) || [])
      ]
    };
  };
  
  const enhancedSectorContext = transformSectorContext(enhancedData?.sector_context);

  const overlays = enhancedData?.overlays || analysisData?.overlays;
  const trading_guidance = enhancedData?.trading_guidance || analysisData?.trading_guidance;
  const summary = enhancedData?.summary || analysisData?.summary;
  

  

  
  // Create metadata object with proper field mapping for enhanced structure
  const metadata = enhancedData ? {
    exchange: enhancedData.exchange,
    data_period: enhancedData.analysis_period,
    analysis_date: enhancedData.analysis_timestamp,
    sector: enhancedData.sector_context?.sector
  } : analysisData?.metadata;

  // Enhanced data extraction
  const enhancedAI = enhancedData?.ai_analysis;
  // enhancedSectorContext is now created by transformSectorContext function above
  const enhancedMultiTimeframe = enhancedData?.multi_timeframe_analysis;

  const enhancedTechnicalIndicators = enhancedData?.technical_indicators;
  
  // Calculate current price and price change
  const currentPrice = enhancedData?.current_price || getCurrentPrice(analysisData?.data || null);
  const priceChange = enhancedData ? { 
    change: enhancedData.price_change || 0, 
    changePercent: enhancedData.price_change_percentage || 0 
  } : getPriceChange(analysisData?.data || null);
  const priceStats = enhancedData ? extractPriceStatisticsFromEnhanced(enhancedData) : calculatePriceStatistics(analysisData?.data || null);

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
    <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm h-[90%]">
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
      <div className="h-16" />
      <div className="w-full px-4 py-8">

        
        {/* Stock Header */}
        <div className="mb-8">
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold text-slate-800 mb-2">
              {stockSymbol || "Loading..."} Analysis
            </h1>
            
            {/* Analysis Metadata */}
            {(enhancedData?.analysis_timestamp || enhancedData?.analysis_period || enhancedData?.exchange || enhancedData?.interval) && (
              <div className="mt-3 flex flex-wrap items-center justify-center gap-4 text-sm text-slate-500">
                {enhancedData?.analysis_timestamp && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>Analysis Date: {new Date(enhancedData.analysis_timestamp).toLocaleDateString()}</span>
                  </div>
                )}
                {enhancedData?.analysis_period && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>Period: {enhancedData.analysis_period}</span>
                  </div>
                )}
                {enhancedData?.interval && (
                  <div className="flex items-center gap-1">
                    <Activity className="h-4 w-4" />
                    <span>Data Interval: {enhancedData.interval}</span>
                  </div>
                )}
                {enhancedData?.exchange && (
                  <div className="flex items-center gap-1">
                    <BarChart3 className="h-4 w-4" />
                    <span>Exchange: {enhancedData.exchange}</span>
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Quick Stats Bar */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-slate-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-800">
                  {analysisLoading ? <Skeleton className="h-8 w-20 mx-auto" /> : formatCurrency(currentPrice)}
                </div>
                <div className="text-sm text-slate-600">Current Price</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold flex items-center justify-center ${priceChange?.changePercent && priceChange.changePercent > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {analysisLoading ? <Skeleton className="h-8 w-20 mx-auto" /> : formatPriceChange(priceChange?.change)}
                </div>
                <div className="text-sm text-slate-600">Change</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${priceChange?.changePercent && priceChange.changePercent > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {analysisLoading ? <Skeleton className="h-8 w-20 mx-auto" /> : formatPercentageValue(priceChange?.changePercent)}
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
          <div className="flex w-fit justify-center bg-transparent p-3 gap-3 h-16 mx-auto">
            <TabsList className="flex bg-transparent gap-3 h-full relative">
              {/* Sliding Background Bubble */}
              <div 
                className="absolute top-0 bottom-0 bg-white/20 shadow-lg shadow-slate-200/30 border border-slate-400/70 backdrop-blur-md rounded-full transition-all duration-500 ease-out"
                style={{
                  left: `${bubbleStyle.left}px`,
                  width: `${bubbleStyle.width}px`
                }}
              />
              <TabsTrigger 
                ref={(el) => (tabRefs.current.overview = el)}
                value="overview" 
                className="flex items-center justify-center space-x-2 h-full px-6 rounded-full transition-all duration-300 ease-out hover:bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-slate-800 data-[state=active]:font-semibold data-[state=active]:scale-105 data-[state=inactive]:text-slate-600 data-[state=inactive]:hover:text-slate-800 data-[state=inactive]:scale-100 min-w-fit"
              >
                <Eye className="h-4 w-4 data-[state=active]:h-5 data-[state=active]:w-5" />
                <span className="data-[state=active]:text-2xl text-sm whitespace-nowrap">Overview</span>
              </TabsTrigger>
              <TabsTrigger 
                ref={(el) => (tabRefs.current.technical = el)}
                value="technical" 
                className="flex items-center justify-center space-x-2 h-full px-6 rounded-full transition-all duration-300 ease-out hover:bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-slate-800 data-[state=active]:font-semibold data-[state=active]:scale-105 data-[state=inactive]:text-slate-600 data-[state=inactive]:hover:text-slate-800 data-[state=inactive]:scale-100 min-w-fit"
              >
                <TrendingUp className="h-4 w-4 data-[state=active]:h-5 data-[state=active]:w-5" />
                <span className="data-[state=active]:text-2xl text-sm whitespace-nowrap">Technical</span>
              </TabsTrigger>
              <TabsTrigger 
                ref={(el) => (tabRefs.current.ai = el)}
                value="ai" 
                className="flex items-center justify-center space-x-2 h-full px-6 rounded-full transition-all duration-300 ease-out hover:bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-slate-800 data-[state=active]:font-semibold data-[state=active]:scale-105 data-[state=inactive]:text-slate-600 data-[state=inactive]:hover:text-slate-800 data-[state=inactive]:scale-100 min-w-fit"
              >
                <Brain className="h-4 w-4 data-[state=active]:h-5 data-[state=active]:w-5" />
                <span className="data-[state=active]:text-2xl text-sm whitespace-nowrap">AI Analysis</span>
              </TabsTrigger>
              <TabsTrigger 
                ref={(el) => (tabRefs.current.sector = el)}
                value="sector" 
                className="flex items-center justify-center space-x-2 h-full px-6 rounded-full transition-all duration-300 ease-out hover:bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-slate-800 data-[state=active]:font-semibold data-[state=active]:scale-105 data-[state=inactive]:text-slate-600 data-[state=inactive]:hover:text-slate-800 data-[state=inactive]:scale-100 min-w-fit"
              >
                <Building2 className="h-4 w-4 data-[state=active]:h-5 data-[state=active]:w-5" />
                <span className="data-[state=active]:text-2xl text-sm whitespace-nowrap">Sector</span>
              </TabsTrigger>
              <TabsTrigger 
                ref={(el) => (tabRefs.current.advanced = el)}
                value="advanced" 
                className="flex items-center justify-center space-x-2 h-full px-6 rounded-full transition-all duration-300 ease-out hover:bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-slate-800 data-[state=active]:font-semibold data-[state=active]:scale-105 data-[state=inactive]:text-slate-600 data-[state=inactive]:hover:text-slate-800 data-[state=inactive]:scale-100 min-w-fit"
              >
                <Settings className="h-4 w-4 data-[state=active]:h-5 data-[state=active]:w-5" />
                <span className="data-[state=active]:text-2xl text-sm whitespace-nowrap">Advanced</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-0.001">
            {/* Top Row - AI Trading Analysis, Indicator Consensus, and Price Statistics */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 h-[99%]">
              {/* AI Trading Analysis */}
              <div className="xl:col-span-1">
                {analysisLoading ? (
                  <AnalysisCardSkeleton 
                    title="AI Trading Analysis" 
                    description="Loading AI analysis..." 
                  />
                ) : (
                  <AITradingAnalysisOverviewCard 
                    aiAnalysis={ai_analysis} 
                    analysisDate={enhancedData?.analysis_timestamp}
                    analysisPeriod={enhancedData?.analysis_period}
                    indicatorSummary={enhancedData?.indicator_summary || analysisData?.indicator_summary}
                  />
                )}
              </div>
              
              {/* Consensus Summary */}
              <div className="xl:col-span-1">
                {analysisLoading ? (
                  <AnalysisCardSkeleton 
                    title="Consensus Summary" 
                    description="Loading consensus analysis..." 
                  />
                ) : (
                  <ConsensusSummaryCard 
                    consensus={consensusForCard as any} 
                    analysisDate={enhancedData?.analysis_timestamp}
                    analysisPeriod={enhancedData?.analysis_period}
                  />
                )}
              </div>

              {/* Deterministic Signals */}
              <div className="xl:col-span-1">
                {analysisLoading ? (
                  <AnalysisCardSkeleton 
                    title="Deterministic Signals" 
                    description="Loading signals..." 
                  />
                ) : (
                  <SignalsSummaryCard 
                    signals={deterministicSignals}
                  />
                )}
              </div>

              {/* Price Statistics Card */}
              <div className="xl:col-span-1">
                {analysisLoading ? (
                  <AnalysisCardSkeleton 
                    title="Price Statistics" 
                    description="Loading price statistics..." 
                  />
                ) : (
                  <PriceStatisticsCardOutput 
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
            
            {/* Decision Story Card (Full Width) */}
            <div className="mt-4">
              {analysisLoading ? (
                <AnalysisCardSkeleton 
                  title="Decision Story" 
                  description="Loading decision analysis..." 
                />
              ) : (
                <DecisionStoryCard 
                  decisionStory={enhancedData?.decision_story || ai_analysis?.decision_story}
                  analysisDate={enhancedData?.analysis_timestamp}
                  analysisPeriod={enhancedData?.analysis_period}
                />
              )}
            </div>
          </TabsContent>

          {/* Technical Tab */}
          <TabsContent value="technical" className="space-y-6">
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
                  supportLevels={(enhancedData as any)?.support_levels || []}
                  resistanceLevels={(enhancedData as any)?.resistance_levels || []}
                  analysisPeriod={enhancedData?.analysis_period || '90 days'}
                  interval={enhancedData?.interval || '1day'}
                />
              )
            )}

            {/* Volume Analysis */}
            {analysisLoading ? (
              <AnalysisCardSkeleton 
                title="Volume Analysis" 
                description="Loading volume analysis..." 
              />
            ) : (
              <VolumeAnalysisCard 
                volumeData={enhancedData?.technical_indicators?.enhanced_volume?.comprehensive_analysis || enhancedData?.technical_indicators?.volume || indicators?.volume}
                priceData={enhancedData?.technical_indicators?.raw_data || analysisData?.data}
                symbol={stockSymbol}
                className=""
              />
            )}

            {/* Advanced Patterns and Multi-timeframe Analysis */}
            <div className="w-full">
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


                                    {enhancedMultiTimeframe ? (
                    <EnhancedMultiTimeframeCard 
                      multiTimeframeAnalysis={enhancedMultiTimeframe}
                      symbol={stockSymbol}
                    />
                  ) : (
                    (indicators as ExtendedIndicators)?.multi_timeframe && !(indicators as ExtendedIndicators).multi_timeframe.error && (
                    <MultiTimeframeAnalysisCard 
                      analysis={(indicators as ExtendedIndicators).multi_timeframe} 
                      symbol={stockSymbol}
                    />
                    )
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
                <>
                  <EnhancedSectorContextCard 
                    sectorContext={enhancedSectorContext}
                    symbol={stockSymbol}
                  />
                  
                  {/* New Correlation Matrix Card */}
                  {enhancedSectorContext.correlation_insights?.correlation_matrix && 
                   Object.keys(enhancedSectorContext.correlation_insights.correlation_matrix).length > 0 && (
                    <CorrelationMatrixCard
                      correlationData={enhancedSectorContext.correlation_insights}
                      currentSector={enhancedSectorContext.sector}
                    />
                  )}
                </>
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
                {/* console.log('🔍 DEBUG: Advanced tab rendering check:', {
                  hasAdvancedRisk: !!(indicators as ExtendedIndicators)?.advanced_risk,
                  hasAdvancedRiskError: (indicators as ExtendedIndicators)?.advanced_risk?.error,
                  hasStressTesting: !!(indicators as ExtendedIndicators)?.stress_testing,
                  hasScenarioAnalysis: !!(indicators as ExtendedIndicators)?.scenario_analysis
                })} */}
                
                <div className="space-y-6">
                  {(indicators as ExtendedIndicators)?.advanced_risk && !(indicators as ExtendedIndicators).advanced_risk.error && (
                    <AdvancedRiskAssessmentCard 
                      riskMetrics={(indicators as ExtendedIndicators).advanced_risk}
                      symbol={stockSymbol}
                    />
                  )}

                  {((indicators as ExtendedIndicators)?.stress_testing || (indicators as ExtendedIndicators)?.scenario_analysis) && (
                    <AdvancedRiskMetricsCard 
                      stress_testing={(indicators as ExtendedIndicators)?.stress_testing}
                      scenario_analysis={(indicators as ExtendedIndicators)?.scenario_analysis}
                    />
                  )}
                </div>
                
                {/* Fallback message if no advanced data is available */}
                {!((indicators as ExtendedIndicators)?.advanced_risk || 
                   (indicators as ExtendedIndicators)?.stress_testing || 
                   (indicators as ExtendedIndicators)?.scenario_analysis) && (
                  <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center text-slate-800">
                        <AlertTriangle className="h-5 w-5 mr-2 text-yellow-500" />
                        Advanced Analysis
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-slate-500">Advanced analysis components are not available for this stock. This may be due to insufficient data or the analysis not including advanced risk metrics, complex patterns, or scenario analysis.</p>
                    </CardContent>
                  </Card>
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