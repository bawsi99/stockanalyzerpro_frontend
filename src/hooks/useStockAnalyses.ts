
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

export const useStockAnalyses = () => {
  const [analyses, setAnalyses] = useState<StoredAnalysis[]>([]);
  const [analysisSummary, setAnalysisSummary] = useState<AnalysisSummary[]>([]);
  const [sectorPerformance, setSectorPerformance] = useState<SectorPerformance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Fetch user's analysis history
  const fetchAnalyses = useCallback(async () => {
    if (!user?.id) {
      setAnalyses([]);
      return [];
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiService.getUserAnalyses(user.id, 50);
      
      if (response.success && response.analyses) {
        const transformedAnalyses = response.analyses.map((analysis: any) => ({
          id: analysis.id,
          stock_symbol: analysis.stock_symbol,
          analysis_data: analysis.analysis_data,
          created_at: analysis.created_at,
          // Extract normalized fields from analysis_data
          overall_signal: analysis.analysis_data?.summary?.overall_signal || 
                         analysis.analysis_data?.ai_analysis?.trend || null,
          confidence_score: analysis.analysis_data?.summary?.confidence || 
                           analysis.analysis_data?.ai_analysis?.confidence_pct || null,
          risk_level: analysis.analysis_data?.ai_analysis?.risk_management?.key_risks?.[0]?.risk_level || null,
          current_price: analysis.analysis_data?.stock_data?.current_price || null,
          price_change_percentage: null, // Not available in current data structure
          sector: analysis.analysis_data?.sector_benchmarking?.sector_info?.sector || null,
          analysis_type: 'standard',
          exchange: analysis.analysis_data?.metadata?.exchange || 'NSE',
          period_days: analysis.analysis_data?.metadata?.period_days || null,
          interval: analysis.analysis_data?.metadata?.interval || null,
          analysis_quality: 'standard',
          mathematical_validation: true,
          chart_paths: null,
          metadata: analysis.analysis_data?.metadata || null
        }));

        setAnalyses(transformedAnalyses);
        return transformedAnalyses;
      } else {
        setAnalyses([]);
        return [];
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch analyses';
      setError(errorMessage);
      console.error('Error fetching analyses:', err);
      setAnalyses([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Fetch analysis by ID
  const getAnalysisById = async (analysisId: string): Promise<StoredAnalysis | null> => {
    if (!user?.id) return null;

    try {
      const response = await apiService.getAnalysisById(analysisId);
      if (response) {
        return {
          id: analysisId,
          stock_symbol: response.stock_symbol || '',
          analysis_data: response,
          created_at: response.timestamp || new Date().toISOString(),
          overall_signal: response.results?.summary?.overall_signal || 
                         response.results?.ai_analysis?.trend || null,
          confidence_score: response.results?.summary?.confidence || 
                           response.results?.ai_analysis?.confidence_pct || null,
          risk_level: null,
          current_price: null,
          price_change_percentage: null,
          sector: null,
          analysis_type: 'standard',
          exchange: response.exchange || 'NSE',
          period_days: null,
          interval: response.interval || null,
          analysis_quality: 'standard',
          mathematical_validation: true,
          chart_paths: null,
          metadata: null
        };
      }
      return null;
    } catch (err) {
      console.error('Error fetching analysis by ID:', err);
      return null;
    }
  };

  // Fetch analyses by signal
  const getAnalysesBySignal = async (signal: string): Promise<StoredAnalysis[]> => {
    if (!user?.id) return [];

    try {
      const response = await apiService.getAnalysesBySignal(signal, user.id, 20);
      if (response.success && response.analyses) {
        return response.analyses.map((analysis: any) => ({
          id: analysis.id,
          stock_symbol: analysis.stock_symbol,
          analysis_data: analysis.analysis_data,
          created_at: analysis.created_at,
          overall_signal: analysis.overall_signal,
          confidence_score: analysis.confidence_score,
          risk_level: analysis.risk_level,
          current_price: analysis.current_price,
          price_change_percentage: analysis.price_change_percentage,
          sector: analysis.sector,
          analysis_type: analysis.analysis_type,
          exchange: analysis.exchange || 'NSE',
          period_days: null,
          interval: null,
          analysis_quality: analysis.analysis_quality,
          mathematical_validation: analysis.mathematical_validation,
          chart_paths: null,
          metadata: null
        }));
      }
      return [];
    } catch (err) {
      console.error('Error fetching analyses by signal:', err);
      return [];
    }
  };

  // Fetch analyses by sector
  const getAnalysesBySector = async (sector: string): Promise<StoredAnalysis[]> => {
    if (!user?.id) return [];

    try {
      const response = await apiService.getAnalysesBySector(sector, user.id, 20);
      if (response.success && response.analyses) {
        return response.analyses.map((analysis: any) => ({
          id: analysis.id,
          stock_symbol: analysis.stock_symbol,
          analysis_data: analysis.analysis_data,
          created_at: analysis.created_at,
          overall_signal: analysis.overall_signal,
          confidence_score: analysis.confidence_score,
          risk_level: analysis.risk_level,
          current_price: analysis.current_price,
          price_change_percentage: analysis.price_change_percentage,
          sector: analysis.sector,
          analysis_type: analysis.analysis_type,
          exchange: analysis.exchange || 'NSE',
          period_days: null,
          interval: null,
          analysis_quality: analysis.analysis_quality,
          mathematical_validation: analysis.mathematical_validation,
          chart_paths: null,
          metadata: null
        }));
      }
      return [];
    } catch (err) {
      console.error('Error fetching analyses by sector:', err);
      return [];
    }
  };

  // Fetch high confidence analyses
  const getHighConfidenceAnalyses = async (minConfidence: number = 80): Promise<StoredAnalysis[]> => {
    if (!user?.id) return [];

    try {
      const response = await apiService.getHighConfidenceAnalyses(minConfidence, user.id, 20);
      if (response.success && response.analyses) {
        return response.analyses.map((analysis: any) => ({
          id: analysis.id,
          stock_symbol: analysis.stock_symbol,
          analysis_data: analysis.analysis_data,
          created_at: analysis.created_at,
          overall_signal: analysis.overall_signal,
          confidence_score: analysis.confidence_score,
          risk_level: analysis.risk_level,
          current_price: analysis.current_price,
          price_change_percentage: analysis.price_change_percentage,
          sector: analysis.sector,
          analysis_type: analysis.analysis_type,
          exchange: analysis.exchange || 'NSE',
          period_days: null,
          interval: null,
          analysis_quality: analysis.analysis_quality,
          mathematical_validation: analysis.mathematical_validation,
          chart_paths: null,
          metadata: null
        }));
      }
      return [];
    } catch (err) {
      console.error('Error fetching high confidence analyses:', err);
      return [];
    }
  };

  // Save a new analysis
  const saveAnalysis = async (stockSymbol: string, analysisData: AnalysisResponse) => {
    if (!user?.id) return;

    try {
      // The analysis is already saved by the backend when the analysis is completed
      // This function is called after successful analysis in NewStockAnalysis.tsx
      console.log('Analysis saved for:', stockSymbol);
      
      // Refresh the analyses list
      await fetchAnalyses();
    } catch (err) {
      console.error('Error saving analysis:', err);
    }
  };

  // Fetch sector performance (stubbed for now)
  const fetchSectorPerformance = async () => {
    try {
      // TODO: Implement sector performance fetching using new backend endpoint
      setSectorPerformance([]);
    } catch (err) {
      console.error('Error fetching sector performance:', err);
    }
  };

  // Load analyses on component mount
  useEffect(() => {
    if (user?.id) {
      fetchAnalyses();
      fetchSectorPerformance();
    }
  }, [user?.id, fetchAnalyses]);

  return {
    analyses,
    analysisSummary,
    sectorPerformance,
    loading,
    error,
    saveAnalysis,
    refetch: fetchAnalyses,
    getAnalysisById,
    getAnalysesBySignal,
    getAnalysesBySector,
    getHighConfidenceAnalyses,
    fetchAnalyses
  };
};
