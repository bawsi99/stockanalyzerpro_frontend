
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ApiResponse } from '@/types/analysis';

export interface StoredAnalysis {
  id: string;
  stock_symbol: string;
  analysis_data: ApiResponse;
  created_at: string;
}

export const useStockAnalyses = () => {
  const [analyses, setAnalyses] = useState<StoredAnalysis[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchAnalyses = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('stock_analyses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform the data to match our StoredAnalysis interface
      const transformedData: StoredAnalysis[] = (data || []).map(item => ({
        id: item.id,
        stock_symbol: item.stock_symbol,
        analysis_data: item.analysis_data as ApiResponse,
        created_at: item.created_at
      }));
      
      setAnalyses(transformedData);
    } catch (err) {
      console.error('Error fetching analyses:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch analyses');
    } finally {
      setLoading(false);
    }
  };

  const saveAnalysis = async (stockSymbol: string, analysisData: ApiResponse) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { error } = await supabase
        .from('stock_analyses')
        .insert({
          user_id: user.id,
          stock_symbol: stockSymbol,
          analysis_data: analysisData as ApiResponse
        });

      if (error) throw error;
      
      // Refresh the analyses list
      await fetchAnalyses();
    } catch (err) {
      console.error('Error saving analysis:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchAnalyses();
  }, [user]);

  return {
    analyses,
    loading,
    error,
    saveAnalysis,
    refetch: fetchAnalyses
  };
};
