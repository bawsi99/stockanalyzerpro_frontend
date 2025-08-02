import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, Clock, History, Loader2 } from 'lucide-react';
import { StoredAnalysis } from '@/hooks/useStockAnalyses';
import { format } from "date-fns";

interface PreviousAnalysesProps {
  analyses: StoredAnalysis[];
  onAnalysisSelect?: (analysis: StoredAnalysis) => void;
  loading?: boolean;
  error?: string | null;
}

const PreviousAnalyses = ({ analyses, onAnalysisSelect, loading = false, error = null }: PreviousAnalysesProps) => {
  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm h-full flex flex-col">
      <CardHeader className="flex-shrink-0">
        <CardTitle className="flex items-center text-slate-800">
          <History className="h-5 w-5 mr-2 text-blue-500" />
          Previous Analyses
        </CardTitle>
        <CardDescription>
          View your past stock analysis reports
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 text-blue-500 mx-auto mb-4 animate-spin" />
            <p className="text-slate-600">Loading analyses...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <TrendingDown className="h-12 w-12 text-red-300 mx-auto mb-4" />
            <p className="text-red-600 mb-2">Error loading analyses</p>
            <p className="text-sm text-slate-500 break-words">{error}</p>
          </div>
        ) : analyses.length === 0 ? (
          <div className="text-center py-8">
            <TrendingUp className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No previous analyses found</p>
            <p className="text-sm text-slate-400">Your completed analyses will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {analyses.map((analysis) => (
              <div key={analysis.id} className="border rounded-lg p-3 bg-slate-50 hover:bg-slate-100 transition-colors">
                <div className="space-y-2">
                  {/* Header with stock symbol and signal */}
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-semibold text-slate-800 truncate">{analysis.stock_symbol}</h3>
                        <Badge variant="outline" className="text-xs flex-shrink-0">
                          {analysis.analysis_data?.results?.ai_analysis?.trend || 
                           analysis.analysis_data?.summary?.overall_signal || 'N/A'}
                        </Badge>
                      </div>
                      <div className="flex items-center text-xs text-slate-600">
                        <Clock className="h-3 w-3 mr-1 flex-shrink-0" />
                        <span className="truncate">{format(new Date(analysis.created_at), 'PPp')}</span>
                      </div>
                    </div>
                    {onAnalysisSelect && (
                      <button
                        onClick={() => onAnalysisSelect(analysis)}
                        className="px-2 py-1 bg-blue-500 text-white text-xs rounded-md hover:bg-blue-600 transition-colors flex-shrink-0 whitespace-nowrap"
                      >
                        View
                      </button>
                    )}
                  </div>

                  {/* Consensus data */}
                  {analysis.analysis_data?.results?.consensus && (
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge 
                        variant="outline"
                        className={`text-xs flex-shrink-0 ${
                          analysis.analysis_data.results.consensus.overall_signal?.toLowerCase() === 'bullish' 
                            ? 'bg-green-100 text-green-700 border-green-200' :
                          analysis.analysis_data.results.consensus.overall_signal?.toLowerCase() === 'bearish' 
                            ? 'bg-red-100 text-red-700 border-red-200' : 
                            'bg-yellow-100 text-yellow-700 border-yellow-200'
                        }`}
                      >
                        {analysis.analysis_data.results.consensus.overall_signal || 'N/A'}
                      </Badge>
                      <span className="text-xs text-slate-500 flex-shrink-0">
                        {analysis.analysis_data.results.consensus.signal_strength}
                      </span>
                    </div>
                  )}

                  {/* AI Analysis confidence */}
                  {analysis.analysis_data?.results?.ai_analysis && (
                    <div className="text-xs text-slate-500">
                      Confidence: {analysis.analysis_data.results.ai_analysis.confidence_pct}%
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PreviousAnalyses;
