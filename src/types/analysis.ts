export interface AnalysisRequest {
  stock: string;
  exchange?: string;
  period?: number;
  interval?: string;
  output?: string | null;
  sector?: string | null; // Optional sector override
  email?: string; // User email for backend user ID mapping
  user_id?: string; // User ID (UUID) - alternative to email
}

export interface ChartData {
  data?: string; // base64 encoded image
  filename?: string;
  type?: string;
  error?: string;
  path?: string;
}

// Enhanced Consensus Signal with weights and scores
export interface ConsensusSignal {
  indicator: string;
  signal: string;
  strength: string;
  weight: number;
  score: number;
  description: string;
}

// Enhanced Consensus with weighted scoring
export interface Consensus {
  overall_signal: string;
  signal_strength: string;
  bullish_percentage: number;
  bearish_percentage: number;
  neutral_percentage: number;
  bullish_score: number;
  bearish_score: number;
  neutral_score: number;
  total_weight: number;
  confidence: number;
  signal_details: ConsensusSignal[];
  data_quality_flags: string[];
  warnings: string[];
  bullish_count: number;
  bearish_count: number;
  neutral_count: number;
}

export interface MovingAverages {
  sma_20: number;
  sma_50: number;
  sma_200: number;
  ema_20: number;
  ema_50: number;
  price_to_sma_200: number;
  sma_20_to_sma_50: number;
  golden_cross: boolean;
  death_cross: boolean;
}

export interface RSI {
  rsi_14: number;
  trend: string;
  status: string;
}

export interface MACD {
  macd_line: number;
  signal_line: number;
  histogram: number;
}

export interface BollingerBands {
  upper_band: number;
  middle_band: number;
  lower_band: number;
  percent_b: number;
  bandwidth: number;
}

export interface Volume {
  volume_ratio: number;
  obv: number;
  obv_trend: string;
}

export interface ADX {
  adx: number;
  plus_di: number;
  minus_di: number;
  trend_direction: string;
}

export interface TrendData {
  direction: string;
  strength: string;
  adx: number;
  plus_di: number;
  minus_di: number;
}

// Raw data structure
export interface RawData {
  open: number[];
  high: number[];
  low: number[];
  close: number[];
  volume: number[];
}

// Data quality assessment
export interface DataQuality {
  is_valid: boolean;
  warnings: string[];
  data_quality_issues: string[];
  missing_data: string[];
  suspicious_patterns: string[];
}

// Indicator availability
export interface IndicatorAvailability {
  sma_20: boolean;
  sma_50: boolean;
  sma_200: boolean;
  ema_20: boolean;
  ema_50: boolean;
  macd: boolean;
  rsi: boolean;
  bollinger_bands: boolean;
  stochastic: boolean;
  adx: boolean;
  obv: boolean;
  volume_ratio: boolean;
  atr: boolean;
}

// Metadata structure
export interface Metadata {
  start: string;
  end: string;
  period: number;
  last_price: number;
  last_volume: number;
  data_quality: DataQuality;
  indicator_availability: IndicatorAvailability;
  multi_timeframe?: MultiTimeframeAnalysis;
}

export interface Indicators {
  moving_averages: MovingAverages;
  rsi: RSI;
  macd: MACD;
  bollinger_bands: BollingerBands;
  volume: Volume;
  adx: ADX;
  trend_data: TrendData;
  raw_data: RawData;
  advanced_patterns?: Record<string, unknown>;
  advanced_risk?: Record<string, unknown>;
  stress_testing?: Record<string, unknown>;
  scenario_analysis?: Record<string, unknown>;
  metadata: Metadata;
}

// AI Analysis Types
export interface AIMeta {
  symbol: string;
  analysis_date: string;
  timeframe: string;
  overall_confidence: number;
  data_quality_score: number;
}

export interface TrendAnalysis {
  direction: string;
  strength: string;
  duration: string;
  confidence: number;
  rationale: string;
}

export interface KeyDriver {
  factor: string;
  impact: string;
  timeframe: string;
}

export interface MarketOutlook {
  primary_trend: TrendAnalysis;
  secondary_trend: TrendAnalysis;
  key_drivers: KeyDriver[];
}

export interface EntryStrategy {
  type: string;
  entry_range: [number | null, number | null];
  entry_conditions: string[];
  confidence: number;
}

export interface Target {
  price: number;
  probability: string;
  timeframe: string;
}

export interface TrailingStop {
  enabled: boolean;
  method: string | null;
}

export interface ExitStrategy {
  stop_loss: number;
  stop_loss_type: string;
  targets: Target[];
  trailing_stop: TrailingStop;
}

export interface PositionSizing {
  risk_per_trade: string;
  max_position_size: string;
  atr_multiplier: number | null;
}

export interface TimeframeStrategy {
  horizon_days: number;
  bias: string;
  entry_strategy: EntryStrategy;
  exit_strategy: ExitStrategy;
  position_sizing: PositionSizing;
  rationale: string;
}

export interface LongTermStrategy {
  horizon_days: number;
  investment_rating: string;
  fair_value_range: [number, number];
  key_levels: {
    accumulation_zone: [number, number];
    distribution_zone: [number, number];
  };
  rationale: string;
}

export interface TradingStrategy {
  short_term: TimeframeStrategy;
  medium_term: TimeframeStrategy;
  long_term: LongTermStrategy;
}

export interface Risk {
  risk: string;
  probability: string;
  impact: string;
  mitigation: string;
}

export interface StopLossLevel {
  level: number;
  type: string;
  rationale: string;
}

export interface PositionManagement {
  scaling_in: boolean;
  scaling_out: boolean;
  max_correlation: number;
}

export interface RiskManagement {
  key_risks: Risk[];
  stop_loss_levels: StopLossLevel[];
  position_management: PositionManagement;
}

export interface CriticalLevel {
  level: number;
  type: string;
  significance: string;
  action: string;
}

export interface ConfirmationLevel {
  level: number;
  condition: string;
  action: string;
}

export interface CriticalLevels {
  must_watch: CriticalLevel[];
  confirmation_levels: ConfirmationLevel[];
}

export interface ExitTrigger {
  condition: string;
  action: string;
}

export interface MonitoringPlan {
  daily_checks: string[];
  weekly_reviews: string[];
  exit_triggers: ExitTrigger[];
}

export interface DataQualityIssue {
  issue: string;
  impact: string;
  mitigation: string;
}

export interface ConfidenceAdjustment {
  reason: string;
  adjustment: string;
}

export interface DataQualityAssessment {
  issues: DataQualityIssue[];
  confidence_adjustments: ConfidenceAdjustment;
}

export interface AIAnalysis {
  meta: AIMeta;
  market_outlook: MarketOutlook;
  trading_strategy: TradingStrategy;
  risk_management: RiskManagement;
  critical_levels: CriticalLevels;
  monitoring_plan: MonitoringPlan;
  data_quality_assessment: DataQualityAssessment;
  key_takeaways: string[];
  indicator_summary_md: string;
  chart_insights: string;
}

export interface Charts {
  comparison_chart: ChartData;
  divergence: ChartData;
  double_tops_bottoms: ChartData;
  support_resistance: ChartData;
  triangles_flags: ChartData;
  volume_anomalies: ChartData;
}

// Legacy types for backward compatibility
export interface TimeframeAnalysis {
  horizon_days: number;
  entry_range: [number, number];
  stop_loss: number;
  targets: number[];
  rationale: string;
}

export interface LongTermAnalysis {
  horizon_days: number;
  investment_rating: string;
  fair_value_range: [number, number];
  rationale: string;
}

// Legacy AI Analysis for backward compatibility
export interface LegacyAIAnalysis {
  trend: string;
  confidence_pct: number;
  short_term: TimeframeAnalysis;
  medium_term: TimeframeAnalysis;
  long_term: LongTermAnalysis;
  risks: string[];
  must_watch_levels: string[];
  timestamp: string;
}

export interface Summary {
  overall_signal: string;
  signal_strength: string;
  bullish_percentage: number;
  bearish_percentage: number;
  neutral_percentage: number;
}

export interface TrianglePattern {
  type: string;
  start_index: number;
  end_index: number;
  start_date: string;
  end_date: string;
}

export interface FlagPattern {
  type: string;
  start_index: number;
  end_index: number;
  start_date: string;
  end_date: string;
}

export interface VolumeAnomalyDetailed {
  index: number;
  date: string;
  volume: number;
  price: number;
}

export interface Overlays {
  triangles: TriangleOverlay[];
  flags: FlagOverlay[];
  support_resistance: SupportResistanceOverlay;
  double_tops: DoubleTopOverlay[];
  double_bottoms: DoubleBottomOverlay[];
  divergences: DivergenceOverlay[];
  volume_anomalies: VolumeAnomalyOverlay[];
}

export interface AnalysisResults {
  consensus: Consensus;
  indicators: Indicators;
  charts: Charts;
  ai_analysis: AIAnalysis;
  indicator_summary_md: string;
  chart_insights: string;
  sector_benchmarking?: SectorBenchmarking; // Enhanced sector benchmarking data
  summary: Summary;
  support_levels?: number[];
  resistance_levels?: number[];
  triangle_patterns?: TrianglePattern[];
  flag_patterns?: FlagPattern[];
  volume_anomalies_detailed?: VolumeAnomalyDetailed[];
  overlays: Overlays;
}

export interface ChartData {
  date: string;
  time?: number; // Optional for backward compatibility
  open: number;
  close: number;
  high: number;
  low: number;
  volume: number;
}

export interface AnalysisResponse {
  success: boolean;
  stock_symbol: string;
  exchange: string;
  analysis_period: string;
  interval: string;
  timestamp: string;
  results: AnalysisResults;
  data: ChartData[];
}

export interface ErrorResponse {
  success: false;
  error: string;
  stock_symbol: string;
  exchange: string;
  timestamp: string;
}

// Utility types for frontend use
export type ApiResponse = AnalysisResponse | ErrorResponse;

// Helper functions for type checking
export function isAnalysisResponse(response: unknown): response is AnalysisResponse {
  return typeof response === 'object' && response !== null && 
         'success' in response && response.success === true && 
         'results' in response;
}

// Type guard for error responses
export function isErrorResponse(response: unknown): response is ErrorResponse {
  return typeof response === 'object' && response !== null && 
         'success' in response && response.success === false && 
         'error' in response;
}

export function isChartDataValid(chartData: ChartData): boolean {
  return !!(chartData.data && chartData.filename && !chartData.error);
}

// Legacy type alias for backward compatibility
export type AnalysisData = AnalysisResults;

// Pattern markers for overlaying on technical charts
export interface PatternMarkers {
  peaks: number[]; // indices of peaks in the data array
  lows: number[];  // indices of lows in the data array
  divergences: {
    type: 'bullish' | 'bearish';
    startIdx: number;
    endIdx: number;
    // Optionally, add confidence/strength if needed
  }[];
}

export interface ChartDataPoint {
  date: string;
  time?: number; // Optional for backward compatibility
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TriangleOverlay {
  vertices: { date: string; price: number }[];
}

export interface FlagOverlay {
  start_date: string;
  end_date: string;
  start_price: number;
  end_price: number;
}

export interface SupportResistanceOverlay {
  support: { level: number }[];
  resistance: { level: number }[];
}

export interface DoubleTopOverlay {
  peak1: { date: string; price: number };
  peak2: { date: string; price: number };
}

export interface DoubleBottomOverlay {
  bottom1: { date: string; price: number };
  bottom2: { date: string; price: number };
}

export interface DivergenceOverlay {
  type: "bullish" | "bearish";
  start_date: string;
  end_date: string;
  start_price: number;
  end_price: number;
  start_rsi: number;
  end_rsi: number;
}

export interface VolumeAnomalyOverlay {
  date: string;
  volume: number;
  price: number;
}

// Legacy interfaces for backward compatibility
export interface LegacyOverlays {
  triangles: TriangleOverlay[];
  flags: FlagOverlay[];
  support_resistance: SupportResistanceOverlay;
  double_tops: DoubleTopOverlay[];
  double_bottoms: DoubleBottomOverlay[];
  divergences: DivergenceOverlay[];
  volume_anomalies: VolumeAnomalyOverlay[];
}

// Legacy AnalysisResults for backward compatibility
export interface LegacyAnalysisResults {
  consensus: Consensus;
  indicators: Indicators;
  charts: Charts;
  ai_analysis: LegacyAIAnalysis;
  indicator_summary_md: string;
  chart_insights: string;
  summary: Summary;
  support_levels?: number[];
  resistance_levels?: number[];
  triangle_patterns?: TrianglePattern[];
  flag_patterns?: FlagPattern[];
  volume_anomalies_detailed?: VolumeAnomalyDetailed[];
  overlays: LegacyOverlays;
}

// Legacy ApiResponse for backward compatibility
export interface LegacyApiResponse {
  success: boolean;
  stock_symbol: string;
  exchange: string;
  analysis_period: string;
  interval: string;
  timestamp: string;
  results: LegacyAnalysisResults;
  data: ChartDataPoint[];
}

// Add sector information to types

export interface MarketMetrics {
  beta: number;
  correlation: number;
  sector_beta?: number;
  sector_correlation?: number;
  market_beta?: number;
  market_correlation?: number;
  sector?: string;
  risk_free_rate: number;
  current_vix: number;
  data_source: string;
  // ... other fields
}

// Enhanced Sector Benchmarking Types
export interface SectorInfo {
  sector: string;
  sector_name: string;
  sector_index: string;
  sector_stocks_count: number;
}

export interface MarketBenchmarking {
  beta: number;
  correlation: number;
  sharpe_ratio: number;
  volatility: number;
  max_drawdown: number;
  cumulative_return: number;
  annualized_return: number;
  risk_free_rate: number;
  current_vix: number;
  data_source: string;
  data_points: number;
}

export interface SectorBenchmarkingData {
  sector_beta: number;
  sector_correlation: number;
  sector_sharpe_ratio: number;
  sector_volatility: number;
  sector_max_drawdown: number;
  sector_cumulative_return: number;
  sector_annualized_return: number;
  sector_index: string;
  sector_data_points: number;
}

export interface RelativePerformance {
  vs_market: {
    performance_ratio: number;
    risk_adjusted_ratio: number;
    outperformance_periods: number;
    underperformance_periods: number;
    consistency_score: number;
  };
  vs_sector: {
    performance_ratio: number;
    risk_adjusted_ratio: number;
    sector_rank: number;
    sector_percentile: number;
    sector_consistency: number;
  };
}

export interface SectorStressMetrics {
  stress_score: number;
  stress_level: string;
  stress_factors: string[];
}

export interface SectorRiskMetrics {
  risk_score: number;
  risk_level: string;
  correlation_risk: string;
  momentum_risk: string;
  volatility_risk: string;
  sector_stress_metrics: SectorStressMetrics;
  risk_factors: string[];
  risk_mitigation: string[];
}

export interface AnalysisSummary {
  market_position: string;
  sector_position: string;
  risk_assessment: string;
  investment_recommendation: string;
}

export interface DataPoints {
  stock_data_points: number;
  market_data_points: number;
  sector_data_points: number;
}

export interface SectorBenchmarking {
  stock_symbol: string;
  sector_info: SectorInfo;
  market_benchmarking: MarketBenchmarking;
  sector_benchmarking: SectorBenchmarkingData;
  relative_performance: RelativePerformance;
  sector_risk_metrics: SectorRiskMetrics;
  analysis_summary: AnalysisSummary;
  timestamp: string;
  data_points: DataPoints;
}

// Enhanced Pattern Recognition Types
export interface PatternData {
  start_date: string;
  end_date: string;
  start_price: number;
  end_price: number;
  confidence: number;
  type: string;
  description: string;
}

export interface AdvancedPatterns {
  head_and_shoulders: PatternData[];
  inverse_head_and_shoulders: PatternData[];
  cup_and_handle: PatternData[];
  triple_tops: PatternData[];
  triple_bottoms: PatternData[];
  wedge_patterns: PatternData[];
  channel_patterns: PatternData[];
}

// Enhanced Overlays with Advanced Patterns
export interface EnhancedOverlays extends Overlays {
  advanced_patterns: AdvancedPatterns;
}

// Sector Context for AI Analysis
export interface SectorRecommendation {
  type: string;
  action: string;
  reason: string;
  confidence: number;
  timeframe: string;
}

export interface SectorRotationInsights {
  sector_rank: number | null;
  sector_performance: number | null;
  rotation_strength: string;
  leading_sectors: string[];
  lagging_sectors: string[];
  recommendations: SectorRecommendation[];
}

export interface SectorCorrelationInsights {
  average_correlation: number;
  diversification_quality: string;
  sector_volatility: number;
  high_correlation_sectors: Array<{sector: string, correlation: number}>;
  low_correlation_sectors: Array<{sector: string, correlation: number}>;
}

export interface SectorTradingRecommendation {
  type: string;
  recommendation: string;
  reason: string;
  confidence: string;
}

export interface SectorContext {
  sector: string;
  benchmarking: SectorBenchmarking;
  rotation_insights: SectorRotationInsights;
  correlation_insights: SectorCorrelationInsights;
  trading_recommendations: SectorTradingRecommendation[];
}

// Enhanced AI Analysis with Sector Context
export interface EnhancedAIAnalysis extends AIAnalysis {
  sector_context?: SectorContext;
}

// Updated Analysis Results with Enhanced Structures
export interface EnhancedAnalysisResults extends AnalysisResults {
  sector_benchmarking: SectorBenchmarking;
  overlays: EnhancedOverlays;
  ai_analysis: EnhancedAIAnalysis;
}

// Updated Analysis Response with Enhanced Results
export interface EnhancedAnalysisResponse extends AnalysisResponse {
  results: EnhancedAnalysisResults;
}

// Sector API Response Types
export interface SectorListResponse {
  success: boolean;
  sectors: string[];
  total_sectors: number;
  timestamp: string;
}

export interface SectorStocksResponse {
  success: boolean;
  sector_info: {
    sector: string;
    display_name: string;
    primary_index: string;
    stock_count: number;
  };
  stocks: string[];
  timestamp: string;
}

export interface SectorPerformanceResponse {
  success: boolean;
  sector_performance: {
    sector: string;
    sector_index: string;
    display_name: string;
    period_days: number;
    cumulative_return: number;
    annualized_volatility: number;
    stock_count: number;
    data_points: number;
    last_price: number;
    last_date: string;
  };
  timestamp: string;
}

export interface SectorComparisonResponse {
  success: boolean;
  sector_comparison: Record<string, {
    sector: string;
    display_name: string;
    sector_index: string;
    cumulative_return: number;
    annualized_volatility: number;
    stock_count: number;
    last_price: number;
  }>;
  period_days: number;
  timestamp: string;
}

export interface StockSectorResponse {
  success: boolean;
  sector_info: {
    stock_symbol: string;
    sector: string | null;
    sector_name: string | null;
    sector_index: string | null;
    sector_stocks: string[];
    sector_stock_count: number;
    note?: string;
  };
  timestamp: string;
}

// Multi-timeframe analysis interfaces
export interface TimeframeAnalysis {
  name: string;
  periods: Record<string, unknown>;
  ai_confidence?: number;
  ai_trend?: string;
  consensus?: {
    direction: string;
    strength: number;
    score?: number;
    timeframe_alignment?: Record<string, string>;
    bullish_periods?: number;
    bearish_periods?: number;
    neutral_periods?: number;
  };
}

export interface MultiTimeframeAnalysis {
  short_term?: TimeframeAnalysis;
  medium_term?: TimeframeAnalysis;
  long_term?: TimeframeAnalysis;
  overall_consensus?: {
    direction: string;
    strength: number;
    score: number;
    timeframe_alignment: Record<string, string>;
  };
  error?: string;
}

export interface AdvancedRiskMetrics {
  // Add advanced risk metrics structure here
  [key: string]: unknown;
}

export interface StressTestingData {
  // Add stress testing data structure here
  [key: string]: unknown;
}

export interface ScenarioAnalysisData {
  // Add scenario analysis data structure here
  [key: string]: unknown;
}

// Enhanced Multi-Timeframe Analysis Types
export interface TimeframeAnalysisData {
  trend: string;
  confidence: number;
  data_points: number;
  key_indicators: {
    rsi: number;
    macd_signal: string;
    volume_status: string | null;
    support_levels: number[];
    resistance_levels: number[];
  };
  patterns: string[];
  risk_metrics: {
    current_price: number;
    volatility: number;
    max_drawdown: number;
  };
}

export interface CrossTimeframeValidation {
  consensus_trend: string;
  signal_strength: number;
  confidence_score: number;
  supporting_timeframes: string[];
  conflicting_timeframes: string[];
  neutral_timeframes: string[];
  divergence_detected: boolean;
  divergence_type: string | null;
  key_conflicts: string[];
}

export interface MultiTimeframeSummary {
  overall_signal: string;
  confidence: number;
  timeframes_analyzed: number;
  signal_alignment: string;
  risk_level: string;
  recommendation: string;
}

export interface MultiTimeframeAnalysis {
  success: boolean;
  symbol: string;
  exchange: string;
  analysis_timestamp: string;
  timeframe_analyses: {
    [key: string]: TimeframeAnalysisData;
  };
  cross_timeframe_validation: CrossTimeframeValidation;
  summary: MultiTimeframeSummary;
}

// Enhanced Technical Indicators with new structure
export interface TechnicalIndicators {
  moving_averages: MovingAverages;
  rsi: RSI;
  macd: MACD;
  bollinger_bands: BollingerBands;
  volume: Volume;
  adx: ADX;
  trend_data: TrendData;
  raw_data: RawData;
  metadata: Metadata;
}

// Enhanced Metadata with new fields
export interface Metadata {
  start: string;
  end: string;
  period: number;
  last_price: number;
  last_volume: number;
  data_quality: DataQuality;
  indicator_availability: IndicatorAvailability;
  multi_timeframe?: MultiTimeframeAnalysis;
}

// Enhanced Analysis Results with new structure
export interface AnalysisResults {
  symbol: string;
  exchange: string;
  analysis_timestamp: string;
  analysis_type: string;
  mathematical_validation: boolean;
  calculation_method: string;
  accuracy_improvement: string;
  
  // Price Information
  current_price: number;
  price_change: number;
  price_change_percentage: number;
  analysis_period: string;
  interval: string;
  
  // Core Analysis Components
  ai_analysis: AIAnalysis;
  indicator_summary: string;
  chart_insights: string;
  
  // Technical Analysis
  technical_indicators: TechnicalIndicators;
  risk_level: string;
  recommendation: string;
  
  // Sector Analysis
  sector_context: SectorContext;
  
  // Charts and Visualizations
  charts: Charts;
  
  // Multi-timeframe Analysis
  multi_timeframe_analysis: MultiTimeframeAnalysis;
  
  // Enhanced Metadata
  enhanced_metadata: {
    mathematical_validation: boolean;
    code_execution_enabled: boolean;
    statistical_analysis: boolean;
    confidence_improvement: string;
    calculation_timestamp: number;
    analysis_quality: string;
  };
  
      // Mathematical Validation Results
    mathematical_validation_results: Record<string, unknown>;
    
    // Code Execution Metadata
    code_execution_metadata: Record<string, unknown>;
  
  // Legacy fields for backward compatibility
  consensus?: Consensus;
  indicators?: Indicators;
  summary?: Summary;
      support_levels?: number[];
    resistance_levels?: number[];
    triangle_patterns?: unknown[];
    flag_patterns?: unknown[];
    volume_anomalies_detailed?: unknown[];
    overlays?: Overlays;
    trading_guidance?: Record<string, unknown>;
}

// Enhanced Analysis Response with new structure
export interface AnalysisResponse {
  success: boolean;
  stock_symbol: string;
  exchange: string;
  analysis_period: string;
  interval: string;
  timestamp: string;
  message: string;
  results: AnalysisResults;
}
