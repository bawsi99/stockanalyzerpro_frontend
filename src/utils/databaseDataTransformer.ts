/**
 * Database Data Transformer
 * 
 * This utility transforms data from the simplified database structure
 * (single JSON column) into the specific format expected by frontend components.
 * 
 * The simplified database stores everything in analysis_data JSON column,
 * but frontend components expect specific nested structures.
 * 
 * Updated to handle the new enhanced JSON response structure from the backend.
 */

import { 
  AnalysisData, 
  Consensus, 
  Indicators, 
  AIAnalysis, 
  Summary,
  SectorBenchmarking,
  SectorContext,
  Overlays,
  ChartData,
  LegacyAIAnalysis,
  AnalysisResults,
  TechnicalIndicators,
  MultiTimeframeAnalysis
} from '@/types/analysis';

export interface SimplifiedDatabaseRecord {
  id: string;
  user_id: string;
  stock_symbol: string;
  analysis_data: Record<string, unknown> | AnalysisResults; // The JSON column containing all analysis data
  created_at: string;
  updated_at: string;
}

export interface TransformedAnalysisData {
  consensus: Consensus;
  indicators: Indicators;
  charts: Charts;
  ai_analysis: AIAnalysis;
  indicator_summary_md: string;
  chart_insights: string;
  sector_benchmarking?: SectorBenchmarking;
  summary: Summary;
  support_levels?: number[];
  resistance_levels?: number[];
  triangle_patterns?: unknown[];
  flag_patterns?: unknown[];
  volume_anomalies_detailed?: unknown[];
  overlays: Overlays;
  trading_guidance?: Record<string, unknown>;
  multi_timeframe_analysis?: MultiTimeframeAnalysis;
  
  // New enhanced fields
  symbol?: string;
  exchange?: string;
  analysis_timestamp?: string;
  analysis_type?: string;
  mathematical_validation?: boolean;
  calculation_method?: string;
  accuracy_improvement?: string;
  current_price?: number;
  price_change?: number;
  price_change_percentage?: number;
  analysis_period?: string;
  interval?: string;
  technical_indicators?: TechnicalIndicators;
  risk_level?: string;
  recommendation?: string;
  sector_context?: SectorContext;
  enhanced_metadata?: Record<string, unknown>;
  mathematical_validation_results?: Record<string, unknown>;
  code_execution_metadata?: Record<string, unknown>;
}

/**
 * Transform simplified database record to frontend-compatible format
 * Updated to handle both legacy and new enhanced JSON structures
 */
export function transformDatabaseRecord(record: SimplifiedDatabaseRecord): TransformedAnalysisData {
  const analysisData = record.analysis_data;
  
  // Check if this is the new enhanced structure
  const isEnhancedStructure = analysisData && (
    analysisData.symbol || 
    analysisData.analysis_type || 
    analysisData.enhanced_metadata ||
    analysisData.technical_indicators
  );
  
  if (isEnhancedStructure) {
    return transformEnhancedStructure(analysisData);
  } else {
    return transformLegacyStructure(analysisData);
  }
}

/**
 * Transform enhanced JSON structure (new format)
 */
function transformEnhancedStructure(data: Record<string, unknown> | AnalysisResults): TransformedAnalysisData {
  return {
    // Enhanced fields
    symbol: data.symbol,
    exchange: data.exchange,
    analysis_timestamp: data.analysis_timestamp,
    analysis_type: data.analysis_type,
    mathematical_validation: data.mathematical_validation,
    calculation_method: data.calculation_method,
    accuracy_improvement: data.accuracy_improvement,
    current_price: data.current_price,
    price_change: data.price_change,
    price_change_percentage: data.price_change_percentage,
    analysis_period: data.analysis_period,
    interval: data.interval,
    technical_indicators: data.technical_indicators,
    risk_level: data.risk_level,
    recommendation: data.recommendation,
    sector_context: data.sector_context,
    enhanced_metadata: data.enhanced_metadata,
    mathematical_validation_results: data.mathematical_validation_results,
    code_execution_metadata: data.code_execution_metadata,
    
    // Core analysis components
    consensus: extractConsensusFromEnhanced(data),
    indicators: extractIndicatorsFromEnhanced(data),
    charts: extractCharts(data),
    ai_analysis: extractAIAnalysisFromEnhanced(data),
    indicator_summary_md: data.indicator_summary || '',
    chart_insights: data.chart_insights || '',
    sector_benchmarking: extractSectorBenchmarkingFromEnhanced(data),
    summary: extractSummaryFromEnhanced(data),
    support_levels: extractSupportLevels(data),
    resistance_levels: extractResistanceLevels(data),
    triangle_patterns: extractTrianglePatterns(data),
    flag_patterns: extractFlagPatterns(data),
    volume_anomalies_detailed: extractVolumeAnomalies(data),
    overlays: extractOverlays(data),
    trading_guidance: extractTradingGuidance(data),
    multi_timeframe_analysis: data.multi_timeframe_analysis
  };
}

/**
 * Transform legacy JSON structure (backward compatibility)
 */
function transformLegacyStructure(data: Record<string, unknown>): TransformedAnalysisData {
  return {
    consensus: extractConsensus(data),
    indicators: extractIndicators(data),
    charts: extractCharts(data),
    ai_analysis: extractAIAnalysis(data),
    indicator_summary_md: extractIndicatorSummary(data),
    chart_insights: extractChartInsights(data),
    sector_benchmarking: extractSectorBenchmarking(data),
    summary: extractSummary(data),
    support_levels: extractSupportLevels(data),
    resistance_levels: extractResistanceLevels(data),
    triangle_patterns: extractTrianglePatterns(data),
    flag_patterns: extractFlagPatterns(data),
    volume_anomalies_detailed: extractVolumeAnomalies(data),
    overlays: extractOverlays(data),
    trading_guidance: extractTradingGuidance(data),
    multi_timeframe_analysis: extractMultiTimeframeAnalysis(data)
  };
}

/**
 * Extract consensus data from enhanced structure
 */
function extractConsensusFromEnhanced(data: Record<string, unknown> | AnalysisResults): Consensus {
  const aiAnalysis = data.ai_analysis || {};
  const technicalIndicators = data.technical_indicators || {};
  
  return {
    overall_signal: data.recommendation || aiAnalysis.meta?.overall_confidence ? 'Bullish' : 'Neutral',
    signal_strength: data.risk_level || 'Medium',
    bullish_percentage: calculateBullishPercentageFromEnhanced(data),
    bearish_percentage: calculateBearishPercentageFromEnhanced(data),
    neutral_percentage: calculateNeutralPercentageFromEnhanced(data),
    bullish_score: 0,
    bearish_score: 0,
    neutral_score: 0,
    total_weight: 100,
    confidence: aiAnalysis.meta?.overall_confidence || 0,
    signal_details: extractSignalDetailsFromEnhanced(data),
    data_quality_flags: [],
    warnings: extractWarningsFromEnhanced(data),
    bullish_count: 0,
    bearish_count: 0,
    neutral_count: 0
  };
}

/**
 * Extract indicators data from enhanced structure
 */
function extractIndicatorsFromEnhanced(data: Record<string, unknown> | AnalysisResults): Indicators {
  const technicalIndicators = data.technical_indicators || {};
  
  return {
    moving_averages: {
      sma_20: technicalIndicators.moving_averages?.sma_20 || 0,
      sma_50: technicalIndicators.moving_averages?.sma_50 || 0,
      sma_200: technicalIndicators.moving_averages?.sma_200 || 0,
      ema_20: technicalIndicators.moving_averages?.ema_20 || 0,
      ema_50: technicalIndicators.moving_averages?.ema_50 || 0,
      price_to_sma_200: technicalIndicators.moving_averages?.price_to_sma_200 || 0,
      sma_20_to_sma_50: technicalIndicators.moving_averages?.sma_20_to_sma_50 || 0,
      golden_cross: technicalIndicators.moving_averages?.golden_cross || false,
      death_cross: technicalIndicators.moving_averages?.death_cross || false
    },
    rsi: {
      rsi_14: technicalIndicators.rsi?.rsi_14 || 0,
      trend: technicalIndicators.rsi?.trend || 'Neutral',
      status: technicalIndicators.rsi?.status || 'Neutral'
    },
    macd: {
      macd_line: technicalIndicators.macd?.macd_line || 0,
      signal_line: technicalIndicators.macd?.signal_line || 0,
      histogram: technicalIndicators.macd?.histogram || 0
    },
    bollinger_bands: {
      upper_band: technicalIndicators.bollinger_bands?.upper_band || 0,
      middle_band: technicalIndicators.bollinger_bands?.middle_band || 0,
      lower_band: technicalIndicators.bollinger_bands?.lower_band || 0,
      percent_b: technicalIndicators.bollinger_bands?.percent_b || 0,
      bandwidth: technicalIndicators.bollinger_bands?.bandwidth || 0
    },
    volume: {
      volume_ratio: technicalIndicators.volume?.volume_ratio || 0,
      obv: technicalIndicators.volume?.obv || 0,
      obv_trend: technicalIndicators.volume?.obv_trend || 'Neutral'
    },
    adx: {
      adx: technicalIndicators.adx?.adx || 0,
      plus_di: technicalIndicators.adx?.plus_di || 0,
      minus_di: technicalIndicators.adx?.minus_di || 0,
      trend_direction: technicalIndicators.adx?.trend_direction || 'Neutral'
    },
    trend_data: {
      direction: technicalIndicators.trend_data?.direction || 'Neutral',
      strength: technicalIndicators.trend_data?.strength || 'Weak',
      adx: technicalIndicators.trend_data?.adx || 0,
      plus_di: technicalIndicators.trend_data?.plus_di || 0,
      minus_di: technicalIndicators.trend_data?.minus_di || 0
    },
    raw_data: technicalIndicators.raw_data || {
      open: [],
      high: [],
      low: [],
      close: [],
      volume: []
    },
    advanced_patterns: data.overlays?.advanced_patterns || null,
    advanced_risk: data.indicators?.advanced_risk_metrics || null,
    stress_testing: data.indicators?.stress_testing_metrics || null,
    scenario_analysis: data.indicators?.scenario_analysis_metrics || null,
    metadata: {
      start: data.analysis_timestamp || '',
      end: data.analysis_timestamp || '',
      period: parseInt(data.analysis_period?.split(' ')[0]) || 365,
      last_price: data.current_price || 0,
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
      },
      multi_timeframe: data.multi_timeframe_analysis || null
    }
  };
}

/**
 * Extract AI analysis data from enhanced structure
 */
function extractAIAnalysisFromEnhanced(data: Record<string, unknown> | AnalysisResults): AIAnalysis {
  const aiAnalysis = data.ai_analysis || {};
  
  return {
    meta: {
      symbol: data.symbol || '',
      analysis_date: data.analysis_timestamp || '',
      timeframe: data.interval || 'day',
      overall_confidence: aiAnalysis.meta?.overall_confidence || 0,
      data_quality_score: aiAnalysis.meta?.data_quality_score || 85
    },
    market_outlook: aiAnalysis.market_outlook || {
      primary_trend: {
        direction: 'Neutral',
        strength: 'Weak',
        duration: 'Medium-term',
        confidence: 0,
        rationale: 'Based on technical analysis'
      },
      secondary_trend: {
        direction: 'Neutral',
        strength: 'Weak',
        duration: 'Short-term',
        confidence: 0,
        rationale: 'Secondary trend analysis'
      },
      key_drivers: []
    },
    trading_strategy: aiAnalysis.trading_strategy || {
      short_term: extractTimeframeStrategy(aiAnalysis.short_term),
      medium_term: extractTimeframeStrategy(aiAnalysis.medium_term),
      long_term: {
        horizon_days: 365,
        investment_rating: data.recommendation || 'Hold',
        fair_value_range: [0, 0],
        key_levels: {
          accumulation_zone: [0, 0],
          distribution_zone: [0, 0]
        },
        rationale: 'Long-term analysis'
      }
    },
    risk_management: aiAnalysis.risk_management || {
      key_risks: [],
      stop_loss_levels: [],
      position_management: {
        scaling_in: false,
        scaling_out: false,
        max_correlation: 0.7
      }
    },
    critical_levels: aiAnalysis.critical_levels || {
      must_watch: [],
      confirmation_levels: []
    },
    monitoring_plan: aiAnalysis.monitoring_plan || {
      daily_checks: [],
      weekly_reviews: [],
      exit_triggers: []
    },
    data_quality_assessment: aiAnalysis.data_quality_assessment || {
      issues: [],
      confidence_adjustments: {
        reason: '',
        adjustment: ''
      }
    },
    key_takeaways: aiAnalysis.key_takeaways || [],
    indicator_summary_md: data.indicator_summary || '',
    chart_insights: data.chart_insights || ''
  };
}

/**
 * Extract sector benchmarking data from enhanced structure
 */
function extractSectorBenchmarkingFromEnhanced(data: Record<string, unknown> | AnalysisResults): SectorBenchmarking | undefined {
  const sectorContext = data.sector_context;
  if (!sectorContext) return undefined;
  
  return {
    stock_symbol: data.symbol || '',
    sector_info: {
      sector: sectorContext.sector || '',
      sector_name: sectorContext.sector || '',
      sector_index: sectorContext.benchmarking?.sector_info?.sector_index || '',
      sector_stocks_count: 0
    },
    market_benchmarking: {
      beta: sectorContext.benchmarking?.market_benchmarking?.beta || 1.0,
      correlation: sectorContext.benchmarking?.market_benchmarking?.correlation || 0.5,
      sharpe_ratio: sectorContext.benchmarking?.market_benchmarking?.sharpe_ratio || 0,
      volatility: sectorContext.benchmarking?.market_benchmarking?.volatility || 0,
      max_drawdown: sectorContext.benchmarking?.market_benchmarking?.max_drawdown || 0,
      cumulative_return: sectorContext.benchmarking?.market_benchmarking?.cumulative_return || 0,
      annualized_return: sectorContext.benchmarking?.market_benchmarking?.annualized_return || 0,
      risk_free_rate: 0.02,
      current_vix: 20,
      data_source: 'NSE',
      data_points: 252
    },
    sector_benchmarking: {
      sector_beta: sectorContext.benchmarking?.sector_benchmarking?.sector_beta || 1.0,
      sector_correlation: sectorContext.benchmarking?.sector_benchmarking?.sector_correlation || 0.5,
      sector_sharpe_ratio: sectorContext.benchmarking?.sector_benchmarking?.sector_sharpe_ratio || 0,
      sector_volatility: sectorContext.benchmarking?.sector_benchmarking?.sector_volatility || 0,
      sector_max_drawdown: sectorContext.benchmarking?.sector_benchmarking?.sector_max_drawdown || 0,
      sector_cumulative_return: sectorContext.benchmarking?.sector_benchmarking?.sector_cumulative_return || 0,
      sector_annualized_return: sectorContext.benchmarking?.sector_benchmarking?.sector_annualized_return || 0,
      sector_index: sectorContext.benchmarking?.sector_benchmarking?.sector_index || '',
      sector_data_points: 252
    },
    relative_performance: {
      vs_market: {
        performance_ratio: 1.0,
        risk_adjusted_ratio: 1.0,
        outperformance_periods: 0,
        underperformance_periods: 0,
        consistency_score: 0.5
      },
      vs_sector: {
        performance_ratio: 1.0,
        risk_adjusted_ratio: 1.0,
        sector_rank: 0,
        sector_percentile: 50,
        sector_consistency: 0.5
      }
    },
    sector_risk_metrics: {
      risk_score: 50,
      risk_level: 'Medium',
      correlation_risk: 'Low',
      momentum_risk: 'Medium',
      volatility_risk: 'Medium',
      sector_stress_metrics: {
        stress_score: 50,
        stress_level: 'Medium',
        stress_factors: []
      },
      risk_factors: [],
      risk_mitigation: []
    },
    analysis_summary: {
      market_position: 'Neutral',
      sector_position: 'Neutral',
      risk_assessment: 'Medium',
      investment_recommendation: 'Hold'
    },
    timestamp: data.analysis_timestamp || '',
    data_points: {
      stock_data_points: 252,
      market_data_points: 252,
      sector_data_points: 252
    }
  };
}

/**
 * Extract summary data from enhanced structure
 */
function extractSummaryFromEnhanced(data: Record<string, unknown> | AnalysisResults): Summary {
  return {
    overall_signal: data.recommendation || 'Neutral',
    signal_strength: data.risk_level || 'Medium',
    bullish_percentage: calculateBullishPercentageFromEnhanced(data),
    bearish_percentage: calculateBearishPercentageFromEnhanced(data),
    neutral_percentage: calculateNeutralPercentageFromEnhanced(data)
  };
}

/**
 * Extract overlays data for pattern analysis
 */
function extractOverlays(data: Record<string, unknown>): Overlays {
  const overlays = data.overlays || {};
  
  return {
    triangles: overlays.triangles || [],
    flags: overlays.flags || [],
    support_resistance: overlays.support_resistance || { support: [], resistance: [] },
    double_tops: overlays.double_tops || [],
    double_bottoms: overlays.double_bottoms || [],
    divergences: overlays.divergences || [],
    volume_anomalies: overlays.volume_anomalies || []
  };
}

// Helper functions for enhanced structure
function calculateBullishPercentageFromEnhanced(data: Record<string, unknown> | AnalysisResults): number {
  const aiAnalysis = data.ai_analysis;
  if (aiAnalysis?.meta?.overall_confidence && data.recommendation === 'Buy') {
    return aiAnalysis.meta.overall_confidence;
  }
  return 0;
}

function calculateBearishPercentageFromEnhanced(data: Record<string, unknown> | AnalysisResults): number {
  const aiAnalysis = data.ai_analysis;
  if (aiAnalysis?.meta?.overall_confidence && data.recommendation === 'Sell') {
    return aiAnalysis.meta.overall_confidence;
  }
  return 0;
}

function calculateNeutralPercentageFromEnhanced(data: Record<string, unknown> | AnalysisResults): number {
  const bullish = calculateBullishPercentageFromEnhanced(data);
  const bearish = calculateBearishPercentageFromEnhanced(data);
  return Math.max(0, 100 - bullish - bearish);
}

function extractSignalDetailsFromEnhanced(data: Record<string, unknown> | AnalysisResults): unknown[] {
  const technicalIndicators = data.technical_indicators;
  if (!technicalIndicators) return [];
  
  const signals = [];
  
  // RSI Analysis
  if (technicalIndicators.rsi) {
    const rsi = technicalIndicators.rsi.rsi_14;
    let rsiSignal = 'neutral';
    let rsiStrength = 'weak';
    let rsiDescription = '';
    
    if (rsi > 70) {
      rsiSignal = 'bearish';
      rsiStrength = 'strong';
      rsiDescription = `RSI at ${rsi.toFixed(1)} - Overbought conditions`;
    } else if (rsi < 30) {
      rsiSignal = 'bullish';
      rsiStrength = 'strong';
      rsiDescription = `RSI at ${rsi.toFixed(1)} - Oversold conditions`;
    } else {
      rsiSignal = 'neutral';
      rsiStrength = 'weak';
      rsiDescription = `RSI at ${rsi.toFixed(1)} - Neutral zone`;
    }
    
    signals.push({
      indicator: 'RSI',
      signal: rsiSignal,
      strength: rsiStrength,
      description: rsiDescription,
      value: rsi,
      weight: 15
    });
  }
  
  return signals;
}

function extractWarningsFromEnhanced(data: Record<string, unknown> | AnalysisResults): string[] {
  const aiAnalysis = data.ai_analysis;
  if (aiAnalysis?.risk_management?.key_risks) {
    return aiAnalysis.risk_management.key_risks.map((risk: Record<string, unknown>) => (risk as Record<string, unknown>).risk as string);
  }
  return [];
}

/**
 * Extract consensus data for ConsensusSummaryCard
 */
function extractConsensus(data: Record<string, unknown>): Consensus {
  const summary = data.summary || {};
  const aiAnalysis = data.ai_analysis || {};
  
  return {
    overall_signal: summary.overall_signal || aiAnalysis.trend || 'Neutral',
    signal_strength: summary.analysis_quality || 'Medium',
    bullish_percentage: calculateBullishPercentage(data),
    bearish_percentage: calculateBearishPercentage(data),
    neutral_percentage: calculateNeutralPercentage(data),
    bullish_score: 0, // Calculate from indicators
    bearish_score: 0, // Calculate from indicators
    neutral_score: 0, // Calculate from indicators
    total_weight: 100,
    confidence: summary.confidence || aiAnalysis.confidence_pct || 0,
    signal_details: extractSignalDetails(data),
    data_quality_flags: [],
    warnings: extractWarnings(data),
    bullish_count: 0, // Calculate from indicators
    bearish_count: 0, // Calculate from indicators
    neutral_count: 0 // Calculate from indicators
  };
}

/**
 * Extract indicators data for TechnicalAnalysisCard
 */
function extractIndicators(data: Record<string, unknown>): Indicators {
  const indicators = data.indicators || {};
  
  return {
    moving_averages: {
      sma_20: indicators.moving_averages?.sma_20 || 0,
      sma_50: indicators.moving_averages?.sma_50 || 0,
      sma_200: indicators.moving_averages?.sma_200 || 0,
      ema_20: indicators.moving_averages?.ema_20 || 0,
      ema_50: indicators.moving_averages?.ema_50 || 0,
      price_to_sma_200: indicators.moving_averages?.price_to_sma_200 || 0,
      sma_20_to_sma_50: indicators.moving_averages?.sma_20_to_sma_50 || 0,
      golden_cross: indicators.moving_averages?.golden_cross || false,
      death_cross: indicators.moving_averages?.death_cross || false
    },
    rsi: {
      rsi_14: indicators.rsi?.rsi_14 || 0,
      trend: indicators.rsi?.trend || 'Neutral',
      status: indicators.rsi?.status || 'Neutral'
    },
    macd: {
      macd_line: indicators.macd?.macd_line || 0,
      signal_line: indicators.macd?.signal_line || 0,
      histogram: indicators.macd?.histogram || 0
    },
    bollinger_bands: {
      upper_band: indicators.bollinger_bands?.upper_band || indicators.bollinger_bands?.upper || 0,
      middle_band: indicators.bollinger_bands?.middle_band || indicators.bollinger_bands?.middle || 0,
      lower_band: indicators.bollinger_bands?.lower_band || indicators.bollinger_bands?.lower || 0,
      percent_b: indicators.bollinger_bands?.percent_b || 0,
      bandwidth: indicators.bollinger_bands?.bandwidth || 0
    },
    volume: {
      volume_ratio: indicators.volume?.volume_ratio || 0,
      obv: indicators.volume?.obv || 0,
      obv_trend: indicators.volume?.obv_trend || 'Neutral'
    },
    adx: {
      adx: indicators.adx?.adx || 0,
      plus_di: indicators.adx?.plus_di || 0,
      minus_di: indicators.adx?.minus_di || 0,
      trend_direction: indicators.adx?.trend_direction || 'Neutral'
    },
    trend_data: {
      direction: indicators.trend_data?.direction || 'Neutral',
      strength: indicators.trend_data?.strength || 'Weak',
      adx: indicators.trend_data?.adx || 0,
      plus_di: indicators.trend_data?.plus_di || 0,
      minus_di: indicators.trend_data?.minus_di || 0
    },
    raw_data: {
      open: [],
      high: [],
      low: [],
      close: [],
      volume: []
    },
    advanced_patterns: data.overlays?.advanced_patterns || null,
    advanced_risk: data.indicators?.advanced_risk_metrics || null,
    stress_testing: data.indicators?.stress_testing_metrics || null,
    scenario_analysis: data.indicators?.scenario_analysis_metrics || null,
    metadata: {
      start: data.metadata?.analysis_date || '',
      end: data.metadata?.analysis_date || '',
      period: data.metadata?.period_days || data.metadata?.data_period?.split(' ')[0] || 365,
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
      },
      multi_timeframe: data.multi_timeframe_analysis || null
    }
  };
}

/**
 * Extract AI analysis data for AITradingAnalysisOverviewCard
 */
function extractAIAnalysis(data: Record<string, unknown>): AIAnalysis {
  const aiAnalysis = data.ai_analysis || {};
  const summary = data.summary || {};
  
  return {
    meta: {
      symbol: data.metadata?.symbol || '',
      analysis_date: data.metadata?.analysis_date || '',
      timeframe: data.metadata?.interval || 'day',
      overall_confidence: summary.confidence || aiAnalysis.confidence_pct || 0,
      data_quality_score: 85
    },
    market_outlook: {
      primary_trend: {
        direction: aiAnalysis.trend || 'Neutral',
        strength: summary.analysis_quality || 'Medium',
        duration: 'Medium-term',
        confidence: summary.confidence || 0,
        rationale: 'Based on technical analysis'
      },
      secondary_trend: {
        direction: 'Neutral',
        strength: 'Weak',
        duration: 'Short-term',
        confidence: 0,
        rationale: 'Secondary trend analysis'
      },
      key_drivers: []
    },
    trading_strategy: {
      short_term: extractTimeframeStrategy(aiAnalysis.short_term),
      medium_term: extractTimeframeStrategy(aiAnalysis.medium_term),
      long_term: {
        horizon_days: 365,
        investment_rating: summary.recommendation || 'Hold',
        fair_value_range: [0, 0],
        rationale: 'Long-term analysis'
      }
    },
    risk_management: {
      key_risks: extractRisks(aiAnalysis.risks),
      stop_loss_levels: [],
      position_management: {
        scaling_in: false,
        scaling_out: false,
        max_correlation: 0.7
      }
    },
    critical_levels: {
      must_watch: extractCriticalLevels(aiAnalysis.must_watch_levels),
      confirmation_levels: []
    },
    monitoring_plan: {
      daily_checks: [],
      weekly_reviews: [],
      exit_triggers: []
    },
    data_quality_assessment: {
      issues: [],
      confidence_adjustments: {
        reason: '',
        adjustment: ''
      }
    },
    key_takeaways: [],
    indicator_summary_md: data.indicator_summary_md || '',
    chart_insights: data.chart_insights || ''
  };
}

/**
 * Extract sector benchmarking data for SectorAnalysisCard
 */
function extractSectorBenchmarking(data: Record<string, unknown>): SectorBenchmarking | undefined {
  const sectorData = data.sector_benchmarking;
  if (!sectorData) return undefined;
  
  return {
    stock_symbol: data.metadata?.symbol || '',
    sector_info: {
      sector: sectorData.sector || '',
      sector_name: sectorData.sector || '',
      sector_index: sectorData.sector_index || '',
      sector_stocks_count: 0
    },
    market_benchmarking: {
      beta: sectorData.beta || 1.0,
      correlation: sectorData.correlation || 0.5,
      sharpe_ratio: sectorData.sharpe_ratio || 0,
      volatility: sectorData.volatility || 0,
      max_drawdown: sectorData.max_drawdown || 0,
      cumulative_return: sectorData.cumulative_return || 0,
      annualized_return: sectorData.annualized_return || 0,
      risk_free_rate: 0.02,
      current_vix: 20,
      data_source: 'NSE',
      data_points: 252
    },
    sector_benchmarking: {
      sector_beta: sectorData.sector_beta || 1.0,
      sector_correlation: sectorData.sector_correlation || 0.5,
      sector_sharpe_ratio: sectorData.sector_sharpe_ratio || 0,
      sector_volatility: sectorData.sector_volatility || 0,
      sector_max_drawdown: sectorData.sector_max_drawdown || 0,
      sector_cumulative_return: sectorData.sector_cumulative_return || 0,
      sector_annualized_return: sectorData.sector_annualized_return || 0,
      sector_index: sectorData.sector_index || '',
      sector_data_points: 252
    },
    relative_performance: {
      vs_market: {
        performance_ratio: 1.0,
        risk_adjusted_ratio: 1.0,
        outperformance_periods: 0,
        underperformance_periods: 0,
        consistency_score: 0.5
      },
      vs_sector: {
        performance_ratio: 1.0,
        risk_adjusted_ratio: 1.0,
        sector_rank: 0,
        sector_percentile: 50,
        sector_consistency: 0.5
      }
    },
    sector_risk_metrics: {
      risk_score: 50,
      risk_level: 'Medium',
      correlation_risk: 'Low',
      momentum_risk: 'Medium',
      volatility_risk: 'Medium',
      sector_stress_metrics: {
        stress_score: 50,
        stress_level: 'Medium',
        stress_factors: []
      },
      risk_factors: [],
      risk_mitigation: []
    },
    analysis_summary: {
      market_position: 'Neutral',
      sector_position: 'Neutral',
      risk_assessment: 'Medium',
      investment_recommendation: 'Hold'
    },
    timestamp: data.metadata?.analysis_date || '',
    data_points: {
      stock_data_points: 252,
      market_data_points: 252,
      sector_data_points: 252
    }
  };
}

/**
 * Extract summary data
 */
function extractSummary(data: Record<string, unknown>): Summary {
  const summary = data.summary || {};
  const aiAnalysis = data.ai_analysis || {};
  
  return {
    overall_signal: summary.overall_signal || aiAnalysis.trend || 'Neutral',
    signal_strength: summary.analysis_quality || 'Medium',
    bullish_percentage: calculateBullishPercentage(data),
    bearish_percentage: calculateBearishPercentage(data),
    neutral_percentage: calculateNeutralPercentage(data)
  };
}

// Helper functions
function extractIndicatorSummary(data: Record<string, unknown>): string {
  return data.indicator_summary_md || '';
}

function extractChartInsights(data: Record<string, unknown>): string {
  return data.chart_insights || '';
}

function extractSupportLevels(data: Record<string, unknown>): number[] {
  const overlays = data.overlays || {};
  const supportResistance = overlays.support_resistance || {};
  return (supportResistance.support || []).map((s: Record<string, unknown>) => (s as Record<string, unknown>).level as number || 0);
}

function extractResistanceLevels(data: Record<string, unknown>): number[] {
  const overlays = data.overlays || {};
  const supportResistance = overlays.support_resistance || {};
  return (supportResistance.resistance || []).map((r: Record<string, unknown>) => (r as Record<string, unknown>).level as number || 0);
}

function extractTrianglePatterns(data: Record<string, unknown>): unknown[] {
  return data.overlays?.triangles || [];
}

function extractFlagPatterns(data: Record<string, unknown>): unknown[] {
  return data.overlays?.flags || [];
}

function extractVolumeAnomalies(data: Record<string, unknown>): unknown[] {
  return data.overlays?.volume_anomalies || [];
}

function extractTradingGuidance(data: Record<string, unknown>): Record<string, unknown> | null {
  return data.trading_guidance || null;
}

function extractMultiTimeframeAnalysis(data: Record<string, unknown>): MultiTimeframeAnalysis | null {
  return data.multi_timeframe_analysis || null;
}

function extractCharts(data: Record<string, unknown>): Charts {
  return {
    comparison_chart: {},
    divergence: {},
    double_tops_bottoms: {},
    support_resistance: {},
    triangles_flags: {},
    volume_anomalies: {}
  };
}

function calculateBullishPercentage(data: Record<string, unknown>): number {
  const summary = data.summary || {};
  const aiAnalysis = data.ai_analysis || {};
  
  // Calculate from signal details if available
  const signalDetails = extractSignalDetails(data);
  if (signalDetails.length > 0) {
    const bullishSignals = signalDetails.filter(signal => signal.signal === 'bullish');
    const totalWeight = signalDetails.reduce((sum, signal) => sum + (signal.weight || 0), 0);
    const bullishWeight = bullishSignals.reduce((sum, signal) => sum + (signal.weight || 0), 0);
    
    if (totalWeight > 0) {
      return Math.round((bullishWeight / totalWeight) * 100);
    }
  }
  
  // Fallback to AI analysis
  if (summary.overall_signal === 'Bullish' || aiAnalysis.trend === 'Bullish') {
    return summary.confidence || aiAnalysis.confidence_pct || 50;
  }
  return 0;
}

function calculateBearishPercentage(data: Record<string, unknown>): number {
  const summary = data.summary || {};
  const aiAnalysis = data.ai_analysis || {};
  
  // Calculate from signal details if available
  const signalDetails = extractSignalDetails(data);
  if (signalDetails.length > 0) {
    const bearishSignals = signalDetails.filter(signal => signal.signal === 'bearish');
    const totalWeight = signalDetails.reduce((sum, signal) => sum + (signal.weight || 0), 0);
    const bearishWeight = bearishSignals.reduce((sum, signal) => sum + (signal.weight || 0), 0);
    
    if (totalWeight > 0) {
      return Math.round((bearishWeight / totalWeight) * 100);
    }
  }
  
  // Fallback to AI analysis
  if (summary.overall_signal === 'Bearish' || aiAnalysis.trend === 'Bearish') {
    return summary.confidence || aiAnalysis.confidence_pct || 50;
  }
  return 0;
}

function calculateNeutralPercentage(data: Record<string, unknown>): number {
  const bullish = calculateBullishPercentage(data);
  const bearish = calculateBearishPercentage(data);
  return Math.max(0, 100 - bullish - bearish);
}

function extractSignalDetails(data: Record<string, unknown>): unknown[] {
  const indicators = data.indicators || {};
  const signals = [];
  
  // Get current price (estimate from latest data or use a default)
  const currentPrice = data.current_price || 1500; // Default fallback
  
  // RSI Analysis
  if (indicators.rsi) {
    const rsi = indicators.rsi.rsi_14;
    const rsiTrend = indicators.rsi.trend;
    const rsiStatus = indicators.rsi.status;
    
    let rsiSignal = 'neutral';
    let rsiStrength = 'weak';
    let rsiDescription = '';
    
    if (rsi > 70) {
      rsiSignal = 'bearish';
      rsiStrength = 'strong';
      rsiDescription = `RSI at ${rsi.toFixed(1)} - Overbought conditions, potential reversal`;
    } else if (rsi > 60) {
      rsiSignal = 'bearish';
      rsiStrength = 'moderate';
      rsiDescription = `RSI at ${rsi.toFixed(1)} - Near overbought, showing ${rsiTrend} momentum`;
    } else if (rsi < 30) {
      rsiSignal = 'bullish';
      rsiStrength = 'strong';
      rsiDescription = `RSI at ${rsi.toFixed(1)} - Oversold conditions, potential bounce`;
    } else if (rsi < 40) {
      rsiSignal = 'bullish';
      rsiStrength = 'moderate';
      rsiDescription = `RSI at ${rsi.toFixed(1)} - Near oversold, showing ${rsiTrend} momentum`;
    } else {
      rsiSignal = 'neutral';
      rsiStrength = 'weak';
      rsiDescription = `RSI at ${rsi.toFixed(1)} - Neutral zone, ${rsiStatus} conditions`;
    }
    
    signals.push({
      indicator: 'RSI',
      signal: rsiSignal,
      strength: rsiStrength,
      description: rsiDescription,
      value: rsi,
      weight: 15
    });
  }
  
  // MACD Analysis
  if (indicators.macd) {
    const macdLine = indicators.macd.macd_line;
    const signalLine = indicators.macd.signal_line;
    const histogram = indicators.macd.histogram;
    
    let macdSignal = 'neutral';
    let macdStrength = 'weak';
    let macdDescription = '';
    
    if (macdLine > signalLine && histogram > 0) {
      macdSignal = 'bullish';
      macdStrength = histogram > 1 ? 'strong' : 'moderate';
      macdDescription = `MACD line above signal line, histogram positive - Bullish momentum`;
    } else if (macdLine < signalLine && histogram < 0) {
      macdSignal = 'bearish';
      macdStrength = histogram < -1 ? 'strong' : 'moderate';
      macdDescription = `MACD line below signal line, histogram negative - Bearish momentum`;
    } else {
      macdSignal = 'neutral';
      macdStrength = 'weak';
      macdDescription = `MACD near signal line - Consolidation phase`;
    }
    
    signals.push({
      indicator: 'MACD',
      signal: macdSignal,
      strength: macdStrength,
      description: macdDescription,
      value: macdLine,
      weight: 12
    });
  }
  
  // Moving Averages Analysis
  if (indicators.moving_averages) {
    const sma20 = indicators.moving_averages.sma_20;
    const sma50 = indicators.moving_averages.sma_50;
    const sma200 = indicators.moving_averages.sma_200;
    const priceToSma200 = indicators.moving_averages.price_to_sma_200;
    const sma20ToSma50 = indicators.moving_averages.sma_20_to_sma_50;
    const goldenCross = indicators.moving_averages.golden_cross;
    const deathCross = indicators.moving_averages.death_cross;
    
    // Price vs SMA 200
    if (priceToSma200 > 0.05) {
      signals.push({
        indicator: 'Price vs SMA 200',
        signal: 'bullish',
        strength: 'strong',
        description: `Price ${(priceToSma200 * 100).toFixed(1)}% above SMA 200 - Strong uptrend`,
        value: priceToSma200 * 100,
        weight: 20
      });
    } else if (priceToSma200 < -0.05) {
      signals.push({
        indicator: 'Price vs SMA 200',
        signal: 'bearish',
        strength: 'strong',
        description: `Price ${Math.abs(priceToSma200 * 100).toFixed(1)}% below SMA 200 - Strong downtrend`,
        value: priceToSma200 * 100,
        weight: 20
      });
    } else {
      signals.push({
        indicator: 'Price vs SMA 200',
        signal: 'neutral',
        strength: 'weak',
        description: `Price near SMA 200 - Consolidation phase`,
        value: priceToSma200 * 100,
        weight: 20
      });
    }
    
    // SMA 20 vs SMA 50
    if (sma20ToSma50 > 0.02) {
      signals.push({
        indicator: 'SMA 20 vs SMA 50',
        signal: 'bullish',
        strength: 'moderate',
        description: `SMA 20 ${(sma20ToSma50 * 100).toFixed(1)}% above SMA 50 - Short-term uptrend`,
        value: sma20ToSma50 * 100,
        weight: 10
      });
    } else if (sma20ToSma50 < -0.02) {
      signals.push({
        indicator: 'SMA 20 vs SMA 50',
        signal: 'bearish',
        strength: 'moderate',
        description: `SMA 20 ${Math.abs(sma20ToSma50 * 100).toFixed(1)}% below SMA 50 - Short-term downtrend`,
        value: sma20ToSma50 * 100,
        weight: 10
      });
    }
    
    // Golden/Death Cross
    if (goldenCross) {
      signals.push({
        indicator: 'Golden Cross',
        signal: 'bullish',
        strength: 'strong',
        description: 'SMA 20 crossed above SMA 50 - Bullish signal',
        value: 1,
        weight: 15
      });
    } else if (deathCross) {
      signals.push({
        indicator: 'Death Cross',
        signal: 'bearish',
        strength: 'strong',
        description: 'SMA 20 crossed below SMA 50 - Bearish signal',
        value: -1,
        weight: 15
      });
    }
  }
  
  // Bollinger Bands Analysis
  if (indicators.bollinger_bands) {
    const upperBand = indicators.bollinger_bands.upper_band;
    const middleBand = indicators.bollinger_bands.middle_band;
    const lowerBand = indicators.bollinger_bands.lower_band;
    const percentB = indicators.bollinger_bands.percent_b;
    const bandwidth = indicators.bollinger_bands.bandwidth;
    
    let bbSignal = 'neutral';
    let bbStrength = 'weak';
    let bbDescription = '';
    
    if (percentB > 0.8) {
      bbSignal = 'bearish';
      bbStrength = 'moderate';
      bbDescription = `Price near upper Bollinger Band - Potential resistance`;
    } else if (percentB < 0.2) {
      bbSignal = 'bullish';
      bbStrength = 'moderate';
      bbDescription = `Price near lower Bollinger Band - Potential support`;
    } else if (percentB > 0.6) {
      bbSignal = 'bearish';
      bbStrength = 'weak';
      bbDescription = `Price in upper Bollinger Band range`;
    } else if (percentB < 0.4) {
      bbSignal = 'bullish';
      bbStrength = 'weak';
      bbDescription = `Price in lower Bollinger Band range`;
    } else {
      bbSignal = 'neutral';
      bbStrength = 'weak';
      bbDescription = `Price in middle Bollinger Band range - Neutral`;
    }
    
    signals.push({
      indicator: 'Bollinger Bands',
      signal: bbSignal,
      strength: bbStrength,
      description: bbDescription,
      value: percentB,
      weight: 8
    });
  }
  
  // Volume Analysis
  if (indicators.volume) {
    const volumeRatio = indicators.volume.volume_ratio;
    const obvTrend = indicators.volume.obv_trend;
    
    let volumeSignal = 'neutral';
    let volumeStrength = 'weak';
    let volumeDescription = '';
    
    if (volumeRatio > 1.5) {
      volumeSignal = 'bullish';
      volumeStrength = 'strong';
      volumeDescription = `Volume ${(volumeRatio * 100).toFixed(0)}% above average - Strong buying pressure`;
    } else if (volumeRatio > 1.2) {
      volumeSignal = 'bullish';
      volumeStrength = 'moderate';
      volumeDescription = `Volume ${(volumeRatio * 100).toFixed(0)}% above average - Good volume support`;
    } else if (volumeRatio < 0.8) {
      volumeSignal = 'bearish';
      volumeStrength = 'moderate';
      volumeDescription = `Volume ${((1 - volumeRatio) * 100).toFixed(0)}% below average - Weak volume`;
    } else {
      volumeSignal = 'neutral';
      volumeStrength = 'weak';
      volumeDescription = `Volume at normal levels - ${obvTrend} trend`;
    }
    
    signals.push({
      indicator: 'Volume',
      signal: volumeSignal,
      strength: volumeStrength,
      description: volumeDescription,
      value: volumeRatio,
      weight: 10
    });
  }
  
  // ADX Analysis
  if (indicators.adx) {
    const adx = indicators.adx.adx;
    const plusDi = indicators.adx.plus_di;
    const minusDi = indicators.adx.minus_di;
    const trendDirection = indicators.adx.trend_direction;
    
    let adxSignal = 'neutral';
    let adxStrength = 'weak';
    let adxDescription = '';
    
    if (adx > 25) {
      if (plusDi > minusDi) {
        adxSignal = 'bullish';
        adxStrength = 'strong';
        adxDescription = `ADX at ${adx.toFixed(1)} - Strong bullish trend`;
      } else {
        adxSignal = 'bearish';
        adxStrength = 'strong';
        adxDescription = `ADX at ${adx.toFixed(1)} - Strong bearish trend`;
      }
    } else {
      adxSignal = 'neutral';
      adxStrength = 'weak';
      adxDescription = `ADX at ${adx.toFixed(1)} - Weak trend, ${trendDirection} bias`;
    }
    
    signals.push({
      indicator: 'ADX',
      signal: adxSignal,
      strength: adxStrength,
      description: adxDescription,
      value: adx,
      weight: 10
    });
  }
  
  return signals;
}

function extractWarnings(data: Record<string, unknown>): string[] {
  const aiAnalysis = data.ai_analysis || {};
  return aiAnalysis.risks || [];
}

function extractTimeframeStrategy(timeframeData: Record<string, unknown>): Record<string, unknown> {
  if (!timeframeData) {
    return {
      horizon_days: 30,
      bias: 'Neutral',
      entry_strategy: { type: '', entry_range: [null, null], entry_conditions: [], confidence: 0 },
      exit_strategy: { stop_loss: 0, stop_loss_type: '', targets: [], trailing_stop: { enabled: false, method: null } },
      position_sizing: { risk_per_trade: '', max_position_size: '', atr_multiplier: null },
      rationale: ''
    };
  }
  
  return {
    horizon_days: timeframeData.horizon_days || 30,
    bias: timeframeData.signal || 'Neutral',
    entry_strategy: {
      type: 'Standard',
      entry_range: [timeframeData.entry_range_min || null, timeframeData.entry_range_max || null],
      entry_conditions: [],
      confidence: timeframeData.confidence || 0
    },
    exit_strategy: {
      stop_loss: timeframeData.stop_loss || 0,
      stop_loss_type: 'Fixed',
      targets: [timeframeData.target_1 || 0, timeframeData.target_2 || 0],
      trailing_stop: { enabled: false, method: null }
    },
    position_sizing: {
      risk_per_trade: '2%',
      max_position_size: '10%',
      atr_multiplier: null
    },
    rationale: timeframeData.rationale || ''
  };
}

function extractRisks(risks: unknown[]): Record<string, unknown>[] {
  if (!Array.isArray(risks)) return [];
  
  return risks.map(risk => ({
    risk: typeof risk === 'string' ? risk : 'Unknown risk',
    probability: 'Medium',
    impact: 'Medium',
    mitigation: 'Monitor closely'
  }));
}

function extractCriticalLevels(levels: unknown[]): Record<string, unknown>[] {
  if (!Array.isArray(levels)) return [];
  
  return levels.map(level => ({
    level: typeof level === 'string' ? parseFloat(level) || 0 : level,
    type: 'Support/Resistance',
    significance: 'High',
    action: 'Monitor'
  }));
}

/**
 * Get sector context for SectorAnalysisCard
 */
export function extractSectorContext(data: Record<string, unknown>): SectorContext | undefined {
  const sectorData = data.sector_benchmarking;
  if (!sectorData) return undefined;
  
  return {
    sector: sectorData.sector || '',
    benchmarking: extractSectorBenchmarking(data) as SectorBenchmarking,
    rotation_insights: {
      sector_rank: null,
      sector_performance: null,
      rotation_strength: 'Weak',
      leading_sectors: [],
      lagging_sectors: [],
      recommendations: []
    },
    correlation_insights: {
      average_correlation: 0.5,
      diversification_quality: 'Fair',
      sector_volatility: 0.2,
      high_correlation_sectors: [],
      low_correlation_sectors: []
    },
    trading_recommendations: []
  };
}

/**
 * Transform multiple database records
 */
export function transformMultipleRecords(records: SimplifiedDatabaseRecord[]): TransformedAnalysisData[] {
  return records.map(record => transformDatabaseRecord(record));
} 