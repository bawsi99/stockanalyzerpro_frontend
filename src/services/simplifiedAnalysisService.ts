/**
 * Simplified Analysis Service
 * 
 * This service handles database operations with the simplified schema.
 * It uses the data transformer to convert JSON data to frontend-compatible format.
 */

import { supabase } from '@/integrations/supabase/client';
import { transformDatabaseRecord, SimplifiedDatabaseRecord } from '@/utils/databaseDataTransformer';
import { AnalysisData } from '@/types/analysis';

export interface SimplifiedAnalysisService {
  getAnalysisById(analysisId: string): Promise<AnalysisData | null>;
  getUserAnalyses(userId: string, limit?: number): Promise<AnalysisData[]>;
  getStockAnalyses(stockSymbol: string, limit?: number): Promise<AnalysisData[]>;
  getAnalysesBySignal(signal: string, userId?: string, limit?: number): Promise<AnalysisData[]>;
  getAnalysesBySector(sector: string, userId?: string, limit?: number): Promise<AnalysisData[]>;
  getHighConfidenceAnalyses(minConfidence: number, userId?: string, limit?: number): Promise<AnalysisData[]>;
  getUserAnalysisSummary(userId: string): Promise<any>;
}

class SimplifiedAnalysisServiceImpl implements SimplifiedAnalysisService {
  async getAnalysisById(analysisId: string): Promise<AnalysisData | null> {
    try {
      const { data, error } = await supabase
        .from('stock_analyses_simple')
        .select('*')
        .eq('id', analysisId)
        .single();

      if (error) throw error;
      if (!data) return null;

      return transformDatabaseRecord(data as SimplifiedDatabaseRecord);
    } catch (error) {
      // console.error('Error fetching analysis by ID:', error);
      return null;
    }
  }

  async getUserAnalyses(userId: string, limit: number = 20): Promise<AnalysisData[]> {
    try {
      const { data, error } = await supabase
        .from('stock_analyses_simple')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      if (!data) return [];

      return data.map(record => transformDatabaseRecord(record as SimplifiedDatabaseRecord));
    } catch (error) {
      // console.error('Error fetching user analyses:', error);
      return [];
    }
  }

  async getStockAnalyses(stockSymbol: string, limit: number = 20): Promise<AnalysisData[]> {
    try {
      const { data, error } = await supabase
        .from('stock_analyses_simple')
        .select('*')
        .eq('stock_symbol', stockSymbol.toUpperCase())
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      if (!data) return [];

      return data.map(record => transformDatabaseRecord(record as SimplifiedDatabaseRecord));
    } catch (error) {
      // console.error('Error fetching stock analyses:', error);
      return [];
    }
  }

  async getAnalysesBySignal(signal: string, userId?: string, limit: number = 20): Promise<AnalysisData[]> {
    try {
      let query = supabase
        .from('analysis_summary_simple')
        .select('*')
        .eq('overall_signal', signal.toLowerCase())
        .order('created_at', { ascending: false })
        .limit(limit);

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;
      if (error) throw error;
      if (!data) return [];

      // Transform the summary data back to full analysis data
      return data.map(summary => {
        // Create a mock analysis data structure from summary
        return {
          consensus: {
            overall_signal: summary.overall_signal,
            confidence: summary.confidence_score,
            signal_strength: summary.overall_signal
          },
          summary: {
            overall_signal: summary.overall_signal,
            confidence_score: summary.confidence_score,
            risk_level: summary.risk_level,
            current_price: summary.current_price,
            sector: summary.sector
          },
          ai_analysis: {
            confidence_pct: summary.confidence_score,
            risk_management: {
              key_risks: summary.risk_level ? [{ risk_level: summary.risk_level }] : []
            }
          },
          sector_benchmarking: summary.sector ? {
            sector_info: { sector: summary.sector }
          } : undefined
        } as AnalysisData;
      });
    } catch (error) {
      // console.error('Error fetching analyses by signal:', error);
      return [];
    }
  }

  async getAnalysesBySector(sector: string, userId?: string, limit: number = 20): Promise<AnalysisData[]> {
    try {
      let query = supabase
        .from('analysis_summary_simple')
        .select('*')
        .eq('sector', sector)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;
      if (error) throw error;
      if (!data) return [];

      // Transform the summary data back to full analysis data
      return data.map(summary => {
        return {
          consensus: {
            overall_signal: summary.overall_signal,
            confidence: summary.confidence_score,
            signal_strength: summary.overall_signal
          },
          summary: {
            overall_signal: summary.overall_signal,
            confidence_score: summary.confidence_score,
            risk_level: summary.risk_level,
            current_price: summary.current_price,
            sector: summary.sector
          },
          ai_analysis: {
            confidence_pct: summary.confidence_score,
            risk_management: {
              key_risks: summary.risk_level ? [{ risk_level: summary.risk_level }] : []
            }
          },
          sector_benchmarking: summary.sector ? {
            sector_info: { sector: summary.sector }
          } : undefined
        } as AnalysisData;
      });
    } catch (error) {
      // console.error('Error fetching analyses by sector:', error);
      return [];
    }
  }

  async getHighConfidenceAnalyses(minConfidence: number = 80, userId?: string, limit: number = 20): Promise<AnalysisData[]> {
    try {
      let query = supabase
        .from('analysis_summary_simple')
        .select('*')
        .gte('confidence_score', minConfidence)
        .order('confidence_score', { ascending: false })
        .limit(limit);

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;
      if (error) throw error;
      if (!data) return [];

      // Transform the summary data back to full analysis data
      return data.map(summary => {
        return {
          consensus: {
            overall_signal: summary.overall_signal,
            confidence: summary.confidence_score,
            signal_strength: summary.overall_signal
          },
          summary: {
            overall_signal: summary.overall_signal,
            confidence_score: summary.confidence_score,
            risk_level: summary.risk_level,
            current_price: summary.current_price,
            sector: summary.sector
          },
          ai_analysis: {
            confidence_pct: summary.confidence_score,
            risk_management: {
              key_risks: summary.risk_level ? [{ risk_level: summary.risk_level }] : []
            }
          },
          sector_benchmarking: summary.sector ? {
            sector_info: { sector: summary.sector }
          } : undefined
        } as AnalysisData;
      });
    } catch (error) {
      // console.error('Error fetching high confidence analyses:', error);
      return [];
    }
  }

  async getUserAnalysisSummary(userId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('analysis_summary_simple')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!data) return [];

      return data;
    } catch (error) {
      // console.error('Error fetching user analysis summary:', error);
      return [];
    }
  }
}

export const simplifiedAnalysisService = new SimplifiedAnalysisServiceImpl(); 