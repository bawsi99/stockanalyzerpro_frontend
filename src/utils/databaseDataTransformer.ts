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
  indicator_summary: string; // Add missing property
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
    indicator_summary: data.indicator_summary || '', // Add missing property
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
    indicator_summary: extractIndicatorSummary(data), // Add missing property
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
  
  // Calculate signal percentages based on technical indicators
  const bullishPercentage = calculateBullishPercentageFromEnhanced(data);
  const bearishPercentage = calculateBearishPercentageFromEnhanced(data);
  const neutralPercentage = calculateNeutralPercentageFromEnhanced(data);
  
  // Determine overall signal from recommendation or AI analysis
  let overallSignal = 'Neutral';
  if (data.recommendation) {
    const rec = data.recommendation.toLowerCase();
    if (rec.includes('buy') || rec.includes('bullish')) overallSignal = 'Bullish';
    else if (rec.includes('sell') || rec.includes('bearish')) overallSignal = 'Bearish';
  } else if (aiAnalysis.meta?.overall_confidence) {
    const confidence = aiAnalysis.meta.overall_confidence;
    if (confidence > 60) overallSignal = 'Bullish';
    else if (confidence < 40) overallSignal = 'Bearish';
  }
  
  // Determine signal strength from risk level or confidence
  let signalStrength = 'Medium';
  if (data.risk_level) {
    const risk = data.risk_level.toLowerCase();
    if (risk.includes('high')) signalStrength = 'Strong';
    else if (risk.includes('low')) signalStrength = 'Weak';
  } else if (aiAnalysis.meta?.overall_confidence) {
    const confidence = aiAnalysis.meta.overall_confidence;
    if (confidence > 80) signalStrength = 'Strong';
    else if (confidence < 50) signalStrength = 'Weak';
  }
  
  return {
    overall_signal: overallSignal,
    signal_strength: signalStrength,
    bullish_percentage: bullishPercentage,
    bearish_percentage: bearishPercentage,
    neutral_percentage: neutralPercentage,
    bullish_score: bullishPercentage * 0.8, // Weighted score
    bearish_score: bearishPercentage * 0.8,
    neutral_score: neutralPercentage * 0.8,
    total_weight: 100,
    confidence: aiAnalysis.meta?.overall_confidence || 0,
    signal_details: extractSignalDetailsFromEnhanced(data),
    data_quality_flags: [],
    warnings: extractWarningsFromEnhanced(data),
    bullish_count: Math.round(bullishPercentage / 10), // Approximate count
    bearish_count: Math.round(bearishPercentage / 10),
    neutral_count: Math.round(neutralPercentage / 10)
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
    advanced_risk: data.enhanced_metadata?.advanced_risk_metrics || null,
    stress_testing: data.enhanced_metadata?.stress_testing_metrics || null,
    scenario_analysis: data.enhanced_metadata?.scenario_analysis_metrics || null,
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
  
  // Handle the actual backend response structure - flat structure with sector_benchmarking, sector_rotation, sector_correlation
  const sectorBenchmarking = sectorContext.sector_benchmarking as Record<string, unknown>;
  if (!sectorBenchmarking) return undefined;
  
  const sectorInfo = sectorBenchmarking.sector_info as Record<string, unknown>;
  const marketBenchmarking = sectorBenchmarking.market_benchmarking as Record<string, unknown>;
  const sectorBenchmarkingData = sectorBenchmarking.sector_benchmarking as Record<string, unknown>;
  const relativePerformance = sectorBenchmarking.relative_performance as Record<string, unknown>;
  const sectorRiskMetrics = sectorBenchmarking.sector_risk_metrics as Record<string, unknown>;
  const analysisSummary = sectorBenchmarking.analysis_summary as Record<string, unknown>;
  
  return {
    stock_symbol: sectorBenchmarking.stock_symbol as string || data.symbol || '',
    sector_info: {
      sector: sectorInfo?.sector as string || sectorContext.sector as string || '',
      sector_name: sectorInfo?.sector_name as string || sectorContext.sector as string || '',
      sector_index: sectorInfo?.sector_index as string || 'NIFTY_ENERGY',
      sector_stocks_count: sectorInfo?.sector_stocks_count as number || 0
    },
    market_benchmarking: {
      beta: marketBenchmarking?.beta as number || 1.0,
      correlation: marketBenchmarking?.correlation as number || 0.5,
      sharpe_ratio: marketBenchmarking?.stock_sharpe as number || 0,
      volatility: marketBenchmarking?.volatility as number || 0,
      max_drawdown: marketBenchmarking?.max_drawdown as number || 0,
      cumulative_return: marketBenchmarking?.cumulative_return as number || 0,
      annualized_return: marketBenchmarking?.annualized_return as number || 0,
      risk_free_rate: 0.05,
      current_vix: 20,
      data_source: 'NSE',
      data_points: marketBenchmarking?.data_points as number || 0
    },
    sector_benchmarking: {
      sector_beta: sectorBenchmarkingData?.sector_beta as number || 1.0,
      sector_correlation: sectorBenchmarkingData?.sector_correlation as number || 0.5,
      sector_sharpe_ratio: sectorBenchmarkingData?.sector_sharpe_ratio as number || 0,
      sector_volatility: sectorBenchmarkingData?.sector_volatility as number || 0,
      sector_max_drawdown: sectorBenchmarkingData?.sector_max_drawdown as number || 0,
      sector_cumulative_return: sectorBenchmarkingData?.sector_cumulative_return as number || 0,
      sector_annualized_return: sectorBenchmarkingData?.sector_annualized_return as number || 0,
      sector_index: sectorBenchmarkingData?.sector_index as string || 'NIFTY_ENERGY',
      sector_data_points: sectorBenchmarkingData?.sector_data_points as number || 0
    },
    relative_performance: {
      vs_market: {
        performance_ratio: (relativePerformance?.vs_market as Record<string, unknown>)?.performance_ratio as number || 1.0,
        risk_adjusted_ratio: (relativePerformance?.vs_market as Record<string, unknown>)?.risk_adjusted_ratio as number || 1.0,
        outperformance_periods: (relativePerformance?.vs_market as Record<string, unknown>)?.outperformance_periods as number || 0,
        underperformance_periods: (relativePerformance?.vs_market as Record<string, unknown>)?.underperformance_periods as number || 0,
        consistency_score: (relativePerformance?.vs_market as Record<string, unknown>)?.consistency_score as number || 0.5
      },
      vs_sector: {
        performance_ratio: (relativePerformance?.vs_sector as Record<string, unknown>)?.performance_ratio as number || 1.0,
        risk_adjusted_ratio: (relativePerformance?.vs_sector as Record<string, unknown>)?.risk_adjusted_ratio as number || 1.0,
        sector_rank: (relativePerformance?.vs_sector as Record<string, unknown>)?.sector_rank as number || 0,
        sector_percentile: (relativePerformance?.vs_sector as Record<string, unknown>)?.sector_percentile as number || 50,
        sector_consistency: (relativePerformance?.vs_sector as Record<string, unknown>)?.sector_consistency as number || 0.5
      }
    },
    sector_risk_metrics: {
      risk_score: sectorRiskMetrics?.risk_score as number || 50,
      risk_level: sectorRiskMetrics?.risk_level as string || 'Medium',
      correlation_risk: sectorRiskMetrics?.correlation_risk as string || 'Low',
      momentum_risk: sectorRiskMetrics?.momentum_risk as string || 'Medium',
      volatility_risk: sectorRiskMetrics?.volatility_risk as string || 'Medium',
      sector_stress_metrics: {
        stress_score: (sectorRiskMetrics?.sector_stress_metrics as Record<string, unknown>)?.stress_score as number || 50,
        stress_level: (sectorRiskMetrics?.sector_stress_metrics as Record<string, unknown>)?.stress_level as string || 'Medium',
        stress_factors: (sectorRiskMetrics?.sector_stress_metrics as Record<string, unknown>)?.stress_factors as string[] || []
      },
      risk_factors: sectorRiskMetrics?.risk_factors as string[] || [],
      risk_mitigation: sectorRiskMetrics?.risk_mitigation as string[] || []
    },
    analysis_summary: {
      market_position: analysisSummary?.market_position as string || 'Neutral',
      sector_position: analysisSummary?.sector_position as string || 'Neutral',
      risk_assessment: analysisSummary?.risk_assessment as string || 'Medium',
      investment_recommendation: analysisSummary?.investment_recommendation as string || 'Hold'
    },
    timestamp: sectorBenchmarking.timestamp as string || data.analysis_timestamp || '',
    data_points: {
      stock_data_points: (sectorBenchmarking.data_points as Record<string, unknown>)?.stock_data_points as number || 0,
      market_data_points: (sectorBenchmarking.data_points as Record<string, unknown>)?.market_data_points as number || 0,
      sector_data_points: (sectorBenchmarking.data_points as Record<string, unknown>)?.sector_data_points as number || 0
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
  const technicalIndicators = data.technical_indicators;
  if (!technicalIndicators) return 0;
  
  let bullishScore = 0;
  let totalWeight = 0;
  
  // RSI
  if (technicalIndicators.rsi?.rsi_14) {
    const rsi = technicalIndicators.rsi.rsi_14;
    if (rsi < 30) bullishScore += 15; // Oversold = bullish
    totalWeight += 15;
  }
  
  // MACD
  if (technicalIndicators.macd) {
    const macd = technicalIndicators.macd;
    if (macd.macd_line > macd.signal_line && macd.histogram > 0) {
      bullishScore += 20; // Bullish crossover
    }
    totalWeight += 20;
  }
  
  // Moving Averages
  if (technicalIndicators.moving_averages) {
    const ma = technicalIndicators.moving_averages;
    const currentPrice = data.current_price || 0;
    let maScore = 0;
    
    if (currentPrice > ma.sma_20) maScore += 8;
    if (currentPrice > ma.sma_50) maScore += 8;
    if (currentPrice > ma.sma_200) maScore += 9;
    if (ma.golden_cross) maScore += 5;
    
    bullishScore += maScore;
    totalWeight += 25;
  }
  
  // Bollinger Bands
  if (technicalIndicators.bollinger_bands) {
    const bb = technicalIndicators.bollinger_bands;
    const currentPrice = data.current_price || 0;
    
    if (currentPrice < bb.lower_band) {
      bullishScore += 15; // Oversold = bullish
    }
    totalWeight += 15;
  }
  
  // Volume
  if (technicalIndicators.volume?.volume_ratio) {
    const volumeRatio = technicalIndicators.volume.volume_ratio;
    if (volumeRatio > 1.5) {
      bullishScore += 10; // High volume = bullish
    }
    totalWeight += 10;
  }
  
  // ADX
  if (technicalIndicators.adx) {
    const adx = technicalIndicators.adx;
    if (adx.adx > 25 && adx.plus_di > adx.minus_di) {
      bullishScore += 15; // Strong bullish trend
    }
    totalWeight += 15;
  }
  
  return totalWeight > 0 ? (bullishScore / totalWeight) * 100 : 0;
}

function calculateBearishPercentageFromEnhanced(data: Record<string, unknown> | AnalysisResults): number {
  const technicalIndicators = data.technical_indicators;
  if (!technicalIndicators) return 0;
  
  let bearishScore = 0;
  let totalWeight = 0;
  
  // RSI
  if (technicalIndicators.rsi?.rsi_14) {
    const rsi = technicalIndicators.rsi.rsi_14;
    if (rsi > 70) bearishScore += 15; // Overbought = bearish
    totalWeight += 15;
  }
  
  // MACD
  if (technicalIndicators.macd) {
    const macd = technicalIndicators.macd;
    if (macd.macd_line < macd.signal_line && macd.histogram < 0) {
      bearishScore += 20; // Bearish crossover
    }
    totalWeight += 20;
  }
  
  // Moving Averages
  if (technicalIndicators.moving_averages) {
    const ma = technicalIndicators.moving_averages;
    const currentPrice = data.current_price || 0;
    let maScore = 0;
    
    if (currentPrice < ma.sma_20) maScore += 8;
    if (currentPrice < ma.sma_50) maScore += 8;
    if (currentPrice < ma.sma_200) maScore += 9;
    if (ma.death_cross) maScore += 5;
    
    bearishScore += maScore;
    totalWeight += 25;
  }
  
  // Bollinger Bands
  if (technicalIndicators.bollinger_bands) {
    const bb = technicalIndicators.bollinger_bands;
    const currentPrice = data.current_price || 0;
    
    if (currentPrice > bb.upper_band) {
      bearishScore += 15; // Overbought = bearish
    }
    totalWeight += 15;
  }
  
  // Volume
  if (technicalIndicators.volume?.volume_ratio) {
    const volumeRatio = technicalIndicators.volume.volume_ratio;
    if (volumeRatio < 0.5) {
      bearishScore += 10; // Low volume = bearish
    }
    totalWeight += 10;
  }
  
  // ADX
  if (technicalIndicators.adx) {
    const adx = technicalIndicators.adx;
    if (adx.adx > 25 && adx.minus_di > adx.plus_di) {
      bearishScore += 15; // Strong bearish trend
    }
    totalWeight += 15;
  }
  
  return totalWeight > 0 ? (bearishScore / totalWeight) * 100 : 0;
}

function calculateNeutralPercentageFromEnhanced(data: Record<string, unknown> | AnalysisResults): number {
  const bullishPercentage = calculateBullishPercentageFromEnhanced(data);
  const bearishPercentage = calculateBearishPercentageFromEnhanced(data);
  
  // Neutral is what's left after bullish and bearish
  const neutralPercentage = Math.max(0, 100 - bullishPercentage - bearishPercentage);
  
  return neutralPercentage;
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
  
  // MACD Analysis
  if (technicalIndicators.macd) {
    const macd = technicalIndicators.macd;
    const macdLine = macd.macd_line;
    const signalLine = macd.signal_line;
    const histogram = macd.histogram;
    
    let macdSignal = 'neutral';
    let macdStrength = 'weak';
    let macdDescription = '';
    
    if (macdLine > signalLine && histogram > 0) {
      macdSignal = 'bullish';
      macdStrength = Math.abs(histogram) > 1 ? 'strong' : 'weak';
      macdDescription = `MACD bullish crossover - Histogram: ${histogram.toFixed(2)}`;
    } else if (macdLine < signalLine && histogram < 0) {
      macdSignal = 'bearish';
      macdStrength = Math.abs(histogram) > 1 ? 'strong' : 'weak';
      macdDescription = `MACD bearish crossover - Histogram: ${histogram.toFixed(2)}`;
    } else {
      macdSignal = 'neutral';
      macdStrength = 'weak';
      macdDescription = `MACD neutral - Line: ${macdLine.toFixed(2)}, Signal: ${signalLine.toFixed(2)}`;
    }
    
    signals.push({
      indicator: 'MACD',
      signal: macdSignal,
      strength: macdStrength,
      description: macdDescription,
      value: histogram,
      weight: 20
    });
  }
  
  // Moving Averages Analysis
  if (technicalIndicators.moving_averages) {
    const ma = technicalIndicators.moving_averages;
    const currentPrice = data.current_price || 0;
    
    let maSignal = 'neutral';
    let maStrength = 'weak';
    let maDescription = '';
    let bullishCount = 0;
    let totalCount = 0;
    
    // Check SMA 20
    if (ma.sma_20 && currentPrice > ma.sma_20) {
      bullishCount++;
    }
    totalCount++;
    
    // Check SMA 50
    if (ma.sma_50 && currentPrice > ma.sma_50) {
      bullishCount++;
    }
    totalCount++;
    
    // Check SMA 200
    if (ma.sma_200 && currentPrice > ma.sma_200) {
      bullishCount++;
    }
    totalCount++;
    
    // Check Golden/Death Cross
    if (ma.golden_cross) {
      bullishCount++;
      maDescription += 'Golden Cross detected. ';
    } else if (ma.death_cross) {
      bullishCount--;
      maDescription += 'Death Cross detected. ';
    }
    
    const bullishRatio = bullishCount / totalCount;
    if (bullishRatio > 0.6) {
      maSignal = 'bullish';
      maStrength = bullishRatio > 0.8 ? 'strong' : 'weak';
    } else if (bullishRatio < 0.4) {
      maSignal = 'bearish';
      maStrength = bullishRatio < 0.2 ? 'strong' : 'weak';
    } else {
      maSignal = 'neutral';
      maStrength = 'weak';
    }
    
    maDescription += `Price vs MAs: ${bullishCount}/${totalCount} bullish`;
    
    signals.push({
      indicator: 'Moving Averages',
      signal: maSignal,
      strength: maStrength,
      description: maDescription,
      value: bullishRatio * 100,
      weight: 25
    });
  }
  
  // Bollinger Bands Analysis
  if (technicalIndicators.bollinger_bands) {
    const bb = technicalIndicators.bollinger_bands;
    const currentPrice = data.current_price || 0;
    
    let bbSignal = 'neutral';
    let bbStrength = 'weak';
    let bbDescription = '';
    
    if (currentPrice > bb.upper_band) {
      bbSignal = 'bearish';
      bbStrength = 'strong';
      bbDescription = `Price above upper band - Overbought`;
    } else if (currentPrice < bb.lower_band) {
      bbSignal = 'bullish';
      bbStrength = 'strong';
      bbDescription = `Price below lower band - Oversold`;
    } else {
      bbSignal = 'neutral';
      bbStrength = 'weak';
      bbDescription = `Price within bands - Neutral`;
    }
    
    signals.push({
      indicator: 'Bollinger Bands',
      signal: bbSignal,
      strength: bbStrength,
      description: bbDescription,
      value: bb.percent_b || 0,
      weight: 15
    });
  }
  
  // Volume Analysis
  if (technicalIndicators.volume) {
    const volume = technicalIndicators.volume;
    
    let volumeSignal = 'neutral';
    let volumeStrength = 'weak';
    let volumeDescription = '';
    
    if (volume.volume_ratio > 1.5) {
      volumeSignal = 'bullish';
      volumeStrength = 'strong';
      volumeDescription = `High volume - ${volume.volume_ratio.toFixed(1)}x average`;
    } else if (volume.volume_ratio < 0.5) {
      volumeSignal = 'bearish';
      volumeStrength = 'weak';
      volumeDescription = `Low volume - ${volume.volume_ratio.toFixed(1)}x average`;
    } else {
      volumeSignal = 'neutral';
      volumeStrength = 'weak';
      volumeDescription = `Normal volume - ${volume.volume_ratio.toFixed(1)}x average`;
    }
    
    signals.push({
      indicator: 'Volume',
      signal: volumeSignal,
      strength: volumeStrength,
      description: volumeDescription,
      value: volume.volume_ratio,
      weight: 10
    });
  }
  
  // ADX Analysis
  if (technicalIndicators.adx) {
    const adx = technicalIndicators.adx;
    
    let adxSignal = 'neutral';
    let adxStrength = 'weak';
    let adxDescription = '';
    
    if (adx.adx > 25) {
      adxSignal = adx.plus_di > adx.minus_di ? 'bullish' : 'bearish';
      adxStrength = adx.adx > 40 ? 'strong' : 'weak';
      adxDescription = `Strong trend - ADX: ${adx.adx.toFixed(1)}, DI+: ${adx.plus_di.toFixed(1)}, DI-: ${adx.minus_di.toFixed(1)}`;
    } else {
      adxSignal = 'neutral';
      adxStrength = 'weak';
      adxDescription = `Weak trend - ADX: ${adx.adx.toFixed(1)}`;
    }
    
    signals.push({
      indicator: 'ADX',
      signal: adxSignal,
      strength: adxStrength,
      description: adxDescription,
      value: adx.adx,
      weight: 15
    });
  }
  
  return signals;
}

function extractWarningsFromEnhanced(data: Record<string, unknown> | AnalysisResults): string[] {
  const warnings: string[] = [];
  
  // Extract from AI analysis risk management
  const aiAnalysis = data.ai_analysis;
  if (aiAnalysis?.risk_management?.key_risks) {
    const risks = aiAnalysis.risk_management.key_risks;
    if (Array.isArray(risks)) {
      risks.forEach((risk: Record<string, unknown>) => {
        if (typeof risk === 'object' && risk.risk) {
          warnings.push(risk.risk as string);
        }
      });
    }
  }
  
  // Extract from data quality issues
  if (aiAnalysis?.data_quality_assessment?.issues) {
    const issues = aiAnalysis.data_quality_assessment.issues;
    if (Array.isArray(issues)) {
      issues.forEach((issue: Record<string, unknown>) => {
        if (typeof issue === 'object' && issue.issue) {
          warnings.push(issue.issue as string);
        }
      });
    }
  }
  
  // Extract from technical indicators metadata
  const technicalIndicators = data.technical_indicators;
  if (technicalIndicators?.metadata?.data_quality?.warnings) {
    const dataWarnings = technicalIndicators.metadata.data_quality.warnings;
    if (Array.isArray(dataWarnings)) {
      dataWarnings.forEach((warning: unknown) => {
        if (typeof warning === 'string') {
          warnings.push(warning);
        }
      });
    }
  }
  
  // Extract from sector context warnings
  const sectorContext = data.sector_context;
  if (sectorContext?.benchmarking?.sector_risk_metrics?.risk_factors) {
    const riskFactors = sectorContext.benchmarking.sector_risk_metrics.risk_factors;
    if (Array.isArray(riskFactors)) {
      riskFactors.forEach((factor: unknown) => {
        if (typeof factor === 'string') {
          warnings.push(factor);
        }
      });
    }
  }
  
  // Add general warnings based on risk level
  if (data.risk_level) {
    const riskLevel = data.risk_level.toLowerCase();
    if (riskLevel.includes('high')) {
      warnings.push('High risk level detected - exercise caution');
    }
  }
  
  // Add warnings for low confidence
  if (aiAnalysis?.meta?.overall_confidence) {
    const confidence = aiAnalysis.meta.overall_confidence;
    if (confidence < 50) {
      warnings.push('Low confidence analysis - consider additional verification');
    }
  }
  
  return warnings;
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
  
  // Extract from the correct nested structure that matches backend response
  const entryStrategy = timeframeData.entry_strategy as Record<string, unknown>;
  const exitStrategy = timeframeData.exit_strategy as Record<string, unknown>;
  const positionSizing = timeframeData.position_sizing as Record<string, unknown>;
  
  return {
    horizon_days: timeframeData.horizon_days || 30,
    bias: timeframeData.bias || 'Neutral',
    entry_strategy: {
      type: entryStrategy?.type || 'Standard',
      entry_range: entryStrategy?.entry_range || [null, null], // Use correct field from backend
      entry_conditions: entryStrategy?.entry_conditions || [],
      confidence: entryStrategy?.confidence || 0
    },
    exit_strategy: {
      stop_loss: exitStrategy?.stop_loss || 0, // Use correct field from backend
      stop_loss_type: exitStrategy?.stop_loss_type || 'Fixed',
      targets: exitStrategy?.targets || [], // Use correct field from backend
      trailing_stop: exitStrategy?.trailing_stop || { enabled: false, method: null }
    },
    position_sizing: {
      risk_per_trade: positionSizing?.risk_per_trade || '2%',
      max_position_size: positionSizing?.max_position_size || '10%',
      atr_multiplier: positionSizing?.atr_multiplier || null
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

/**
 * Extract price statistics from enhanced structure
 */
export function extractPriceStatisticsFromEnhanced(data: Record<string, unknown> | AnalysisResults): {
  mean: number;
  max: number;
  min: number;
  current: number;
  distFromMean: number;
  distFromMax: number;
  distFromMin: number;
  distFromMeanPct: number;
  distFromMaxPct: number;
  distFromMinPct: number;
} | null {
  const technicalIndicators = data.technical_indicators;
  const currentPrice = data.current_price;
  
  if (!technicalIndicators || !currentPrice) {
    return null;
  }
  
  // Try to extract from raw data if available
  if (technicalIndicators.raw_data && Array.isArray(technicalIndicators.raw_data.close)) {
    const prices = technicalIndicators.raw_data.close.filter((p: number) => p > 0);
    if (prices.length > 0) {
      const max = Math.max(...prices);
      const min = Math.min(...prices);
      const mean = prices.reduce((sum: number, price: number) => sum + price, 0) / prices.length;
      
      const distFromMean = currentPrice - mean;
      const distFromMax = currentPrice - max;
      const distFromMin = currentPrice - min;
      
      return {
        mean,
        max,
        min,
        current: currentPrice,
        distFromMean,
        distFromMax,
        distFromMin,
        distFromMeanPct: mean > 0 ? (distFromMean / mean) * 100 : 0,
        distFromMaxPct: max > 0 ? (distFromMax / max) * 100 : 0,
        distFromMinPct: min > 0 ? (distFromMin / min) * 100 : 0
      };
    }
  }
  
  // Fallback: estimate from moving averages and current price
  const movingAverages = technicalIndicators.moving_averages;
  if (movingAverages) {
    const sma20 = movingAverages.sma_20 || currentPrice;
    const sma50 = movingAverages.sma_50 || currentPrice;
    const sma200 = movingAverages.sma_200 || currentPrice;
    
    // Estimate mean as average of moving averages
    const mean = (sma20 + sma50 + sma200) / 3;
    
    // Estimate range based on typical volatility (20% of mean)
    const volatility = mean * 0.2;
    const max = mean + volatility;
    const min = mean - volatility;
    
    const distFromMean = currentPrice - mean;
    const distFromMax = currentPrice - max;
    const distFromMin = currentPrice - min;
    
    return {
      mean,
      max,
      min,
      current: currentPrice,
      distFromMean,
      distFromMax,
      distFromMin,
      distFromMeanPct: mean > 0 ? (distFromMean / mean) * 100 : 0,
      distFromMaxPct: max > 0 ? (distFromMax / max) * 100 : 0,
      distFromMinPct: min > 0 ? (distFromMin / min) * 100 : 0
    };
  }
  
  return null;
} 