
import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiService } from '@/services/api';
import { ApiResponse, AnalysisResponse } from '@/types/analysis';
import { RealCandlestickData } from '@/services/liveDataService';

export interface StoredAnalysis {
  id: string;
  stock_symbol: string;
  analysis_data: ApiResponse;
  created_at: string;
  // New normalized fields
  overall_signal: string | null;
  confidence_score: number | null;
  risk_level: string | null;
  current_price: number | null;
  price_change_percentage: number | null;
  sector: string | null;
  analysis_type: string | null;
  exchange: string | null;
  period_days: number | null;
  interval: string | null;
  analysis_quality: string | null;
  mathematical_validation: boolean | null;
  chart_paths: Record<string, string> | null;
  metadata: Record<string, unknown> | null;
}

export interface AnalysisSummary {
  id: string | null;
  stock_symbol: string | null;
  user_id: string | null;
  overall_signal: string | null;
  confidence_score: number | null;
  risk_level: string | null;
  current_price: number | null;
  price_change_percentage: number | null;
  sector: string | null;
  analysis_type: string | null;
  created_at: string | null;
  user_name: string | null;
  user_email: string | null;
}

export interface SectorPerformance {
  sector: string | null;
  analysis_count: number | null;
  avg_confidence: number | null;
  avg_price_change: number | null;
  bullish_count: number | null;
  bearish_count: number | null;
  neutral_count: number | null;
  last_analysis: string | null;
}

// All Supabase logic below should be replaced with new backend API calls.

// TODO: Implement analysis storage/retrieval using new backend endpoints
// For now, stub out the main functions and leave TODOs for advanced queries

export const useStockAnalyses = () => {
  const [analyses, setAnalyses] = useState<StoredAnalysis[]>([]);
  const [analysisSummary, setAnalysisSummary] = useState<AnalysisSummary[]>([]);
  const [sectorPerformance, setSectorPerformance] = useState<SectorPerformance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Fetch analysis history for a stock and timeframe
  const fetchAnalyses = async (stockSymbol: string, timeframe: string = '1day') => {
    try {
      // Use getHistoricalData instead of deprecated getAnalysisHistory
      const result = await apiService.getHistoricalData(stockSymbol, timeframe);
      if (result && result.candles) {
        // Transform historical data to match expected analysis format
        return result.candles.map((candle: RealCandlestickData, index: number) => ({
          id: `analysis_${index}`,
          stock_symbol: stockSymbol,
          analysis_data: {
            success: true,
            stock_symbol: stockSymbol,
            exchange: 'NSE',
            analysis_period: timeframe,
            interval: timeframe,
            timestamp: new Date(candle.time * 1000).toISOString(),
            results: {
              ai_analysis: {
                meta: {
                  symbol: stockSymbol,
                  analysis_date: new Date(candle.time * 1000).toISOString(),
                  timeframe: timeframe,
                  overall_confidence: 0,
                  data_quality_score: 0
                },
                market_outlook: {
                  primary_trend: {
                    direction: 'neutral',
                    strength: 'weak',
                    duration: 'short',
                    confidence: 0,
                    rationale: 'Historical data analysis'
                  },
                  secondary_trend: {
                    direction: 'neutral',
                    strength: 'weak',
                    duration: 'short',
                    confidence: 0,
                    rationale: 'Historical data analysis'
                  },
                  key_drivers: []
                },
                trading_strategy: {
                  short_term: {
                    horizon_days: 1,
                    bias: 'neutral',
                    entry_strategy: {
                      type: 'historical',
                      entry_range: [null, null],
                      entry_conditions: [],
                      confidence: 0
                    },
                    exit_strategy: {
                      stop_loss: 0,
                      stop_loss_type: 'historical',
                      targets: [],
                      trailing_stop: { enabled: false, method: null }
                    },
                    position_sizing: {
                      risk_per_trade: '0%',
                      max_position_size: '0%',
                      atr_multiplier: null
                    },
                    rationale: 'Historical data analysis'
                  },
                  medium_term: {
                    horizon_days: 7,
                    bias: 'neutral',
                    entry_strategy: {
                      type: 'historical',
                      entry_range: [null, null],
                      entry_conditions: [],
                      confidence: 0
                    },
                    exit_strategy: {
                      stop_loss: 0,
                      stop_loss_type: 'historical',
                      targets: [],
                      trailing_stop: { enabled: false, method: null }
                    },
                    position_sizing: {
                      risk_per_trade: '0%',
                      max_position_size: '0%',
                      atr_multiplier: null
                    },
                    rationale: 'Historical data analysis'
                  },
                  long_term: {
                    horizon_days: 30,
                    investment_rating: 'hold',
                    fair_value_range: [0, 0],
                    key_levels: {
                      accumulation_zone: [0, 0],
                      distribution_zone: [0, 0]
                    },
                    rationale: 'Historical data analysis'
                  }
                },
                risk_management: {
                  key_risks: [],
                  stop_loss_levels: [],
                  position_management: {
                    scaling_in: false,
                    scaling_out: false,
                    max_correlation: 0
                  }
                },
                critical_levels: {
                  must_watch: [],
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
                    reason: 'Historical data',
                    adjustment: 'none'
                  }
                },
                key_takeaways: ['Historical data analysis'],
                indicator_summary_md: 'Historical data analysis',
                chart_insights: 'Historical data analysis'
              },
              consensus: {
                overall_signal: 'neutral',
                signal_strength: 'weak',
                bullish_percentage: 0,
                bearish_percentage: 0,
                neutral_percentage: 100,
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
                neutral_count: 1
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
                  rsi_14: 0,
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
                  percent_b: 0,
                  bandwidth: 0
                },
                volume: {
                  volume_ratio: 0,
                  obv: 0,
                  obv_trend: 'neutral'
                },
                adx: {
                  adx: 0,
                  plus_di: 0,
                  minus_di: 0,
                  trend_direction: 'neutral'
                },
                trend_data: {
                  direction: 'neutral',
                  strength: 'weak',
                  adx: 0,
                  plus_di: 0,
                  minus_di: 0
                },
                raw_data: {
                  open: [],
                  high: [],
                  low: [],
                  close: [],
                  volume: []
                },
                metadata: {
                  start: new Date(candle.time * 1000).toISOString(),
                  end: new Date(candle.time * 1000).toISOString(),
                  period: 1,
                  last_price: candle.close,
                  last_volume: candle.volume,
                  data_quality: {
                    is_valid: true,
                    warnings: [],
                    data_quality_issues: [],
                    missing_data: [],
                    suspicious_patterns: []
                  },
                  indicator_availability: {
                    sma_20: false,
                    sma_50: false,
                    sma_200: false,
                    ema_20: false,
                    ema_50: false,
                    macd: false,
                    rsi: false,
                    bollinger_bands: false,
                    stochastic: false,
                    adx: false,
                    obv: false,
                    volume_ratio: false,
                    atr: false
                  }
                }
              },
              charts: {
                comparison_chart: { data: '', filename: '', type: '', error: '' },
                divergence: { data: '', filename: '', type: '', error: '' },
                double_tops_bottoms: { data: '', filename: '', type: '', error: '' },
                support_resistance: { data: '', filename: '', type: '', error: '' },
                triangles_flags: { data: '', filename: '', type: '', error: '' },
                volume_anomalies: { data: '', filename: '', type: '', error: '' }
              },
              indicator_summary_md: 'Historical data analysis',
              chart_insights: 'Historical data analysis',
              summary: {
                overall_signal: 'neutral',
                signal_strength: 'weak',
                bullish_percentage: 0,
                bearish_percentage: 0,
                neutral_percentage: 100
              },
              overlays: {
                triangles: [],
                flags: [],
                support_resistance: { support: [], resistance: [] },
                double_tops: [],
                double_bottoms: [],
                divergences: [],
                volume_anomalies: []
              }
            },
            data: []
          },
          created_at: new Date(candle.time * 1000).toISOString(),
          overall_signal: null,
          confidence_score: null,
          risk_level: null,
          current_price: candle.close,
          price_change_percentage: null,
          sector: null,
          analysis_type: 'historical',
          exchange: 'NSE',
          period_days: null,
          interval: timeframe,
          analysis_quality: null,
          mathematical_validation: null,
          chart_paths: null,
          metadata: null
        }));
      }
      return [];
    } catch (err) {
      console.error('Error fetching analysis history:', err);
      return [];
    }
  };

  const fetchSectorPerformance = async () => {
    try {
      // TODO: Implement sector performance fetching using new backend endpoint
      // Example: const { data, error } = await apiService.getSectorPerformance()
      setSectorPerformance([]); // Stubbed for now
    } catch (err) {
      console.error('Error fetching sector performance:', err);
    }
  };

  // Example: Save a new analysis (replace with new API call)
  const saveAnalysis = async (stockSymbol: string, analysisData: AnalysisResponse) => {
    // TODO: Implement analysis saving using new backend endpoint
    console.log('Saving analysis for:', stockSymbol, analysisData);
  };

  const getAnalysisById = async (analysisId: string): Promise<StoredAnalysis | null> => {
    // TODO: Implement analysis retrieval by ID using new backend endpoint
    console.log('Getting analysis by ID:', analysisId);
    return null;
  };

  const getAnalysesBySignal = async (signal: string): Promise<StoredAnalysis[]> => {
    // TODO: Implement analysis filtering by signal using new backend endpoint
    console.log('Getting analyses by signal:', signal);
    return [];
  };

  const getAnalysesBySector = async (sector: string): Promise<StoredAnalysis[]> => {
    // TODO: Implement analysis filtering by sector using new backend endpoint
    console.log('Getting analyses by sector:', sector);
    return [];
  };

  const getHighConfidenceAnalyses = async (minConfidence: number = 80): Promise<StoredAnalysis[]> => {
    // TODO: Implement high confidence analysis filtering using new backend endpoint
    console.log('Getting high confidence analyses:', minConfidence);
    return [];
  };

  useEffect(() => {
    // TODO: Fetch analyses and sector performance using new backend endpoints
    // For now, stubbing to avoid errors
    // fetchAnalyses();
    // fetchSectorPerformance();
  }, [user]);

  return {
    analyses,
    analysisSummary,
    sectorPerformance,
    loading,
    error,
    saveAnalysis,
    refetch: () => {}, // Stubbed for now
    getAnalysisById,
    getAnalysesBySignal,
    getAnalysesBySector,
    getHighConfidenceAnalyses,
    fetchAnalyses // <-- Add this line
  };
};
