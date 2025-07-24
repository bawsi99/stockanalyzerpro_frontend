
import { useState, useEffect } from 'react';
import { apiService } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import type { ApiResponse } from '@/types/analysis';

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
  chart_paths: any | null;
  metadata: any | null;
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
        return result.candles.map((candle: any, index: number) => ({
          id: `analysis_${index}`,
          stock_symbol: stockSymbol,
          analysis_data: {
            results: {
              ai_analysis: {
                trend: 'neutral' // Default trend since this is historical data
              },
              consensus: {
                overall_signal: 'neutral'
              }
            }
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
  const saveAnalysis = async (stockSymbol: string, analysisData: any) => {
    // TODO: Use new backend endpoint to save analysis
    // Example: await apiService.saveAnalysis(stockSymbol, analysisData)
    return true; // Stubbed for now
  };

  const getAnalysisById = async (analysisId: string): Promise<StoredAnalysis | null> => {
    try {
      // TODO: Implement getAnalysisById using new backend endpoint
      return null; // Stubbed for now
    } catch (err) {
      console.error('Error fetching analysis by ID:', err);
      return null;
    }
  };

  const getAnalysesBySignal = async (signal: string): Promise<StoredAnalysis[]> => {
    try {
      // TODO: Implement getAnalysesBySignal using new backend endpoint
      return []; // Stubbed for now
    } catch (err) {
      console.error('Error fetching analyses by signal:', err);
      return [];
    }
  };

  const getAnalysesBySector = async (sector: string): Promise<StoredAnalysis[]> => {
    try {
      // TODO: Implement getAnalysesBySector using new backend endpoint
      return []; // Stubbed for now
    } catch (err) {
      console.error('Error fetching analyses by sector:', err);
      return [];
    }
  };

  const getHighConfidenceAnalyses = async (minConfidence: number = 80): Promise<StoredAnalysis[]> => {
    try {
      // TODO: Implement getHighConfidenceAnalyses using new backend endpoint
      return []; // Stubbed for now
    } catch (err) {
      console.error('Error fetching high confidence analyses:', err);
      return [];
    }
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
