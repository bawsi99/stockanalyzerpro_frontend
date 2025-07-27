import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, Clock, History } from 'lucide-react';
import { StoredAnalysis } from '@/hooks/useStockAnalyses';
import { format } from "date-fns";

interface PreviousAnalysesProps {
  analyses: StoredAnalysis[];
  onAnalysisSelect?: (analysis: StoredAnalysis) => void;
}

const PreviousAnalyses = ({ analyses, onAnalysisSelect }: PreviousAnalysesProps) => {
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
      <CardContent className="flex-1 overflow-y-auto">
        {analyses.length === 0 ? (
          <div className="text-center py-8">
            <TrendingUp className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No previous analyses found</p>
            <p className="text-sm text-slate-400">Your completed analyses will appear here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {analyses.map((analysis) => (
              <div key={analysis.id} className="border rounded-lg p-4 bg-slate-50 hover:bg-slate-100 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-semibold text-slate-800">{analysis.stock_symbol}</h3>
                      <Badge variant="outline" className="text-xs">
                        {analysis.analysis_data?.results?.ai_analysis?.trend || 'N/A'}
                      </Badge>
                    </div>
                    <div className="flex items-center text-sm text-slate-600">
                      <Clock className="h-4 w-4 mr-1" />
                      <span>{format(new Date(analysis.created_at), 'PPp')}</span>
                    </div>
                    {analysis.analysis_data?.results?.consensus && (
                      <div className="mt-2">
                        <Badge 
                          variant="outline"
                          className={`text-xs ${
                            analysis.analysis_data.results.consensus.overall_signal?.toLowerCase() === 'bullish' 
                              ? 'bg-green-100 text-green-700 border-green-200' :
                            analysis.analysis_data.results.consensus.overall_signal?.toLowerCase() === 'bearish' 
                              ? 'bg-red-100 text-red-700 border-red-200' : 
                              'bg-yellow-100 text-yellow-700 border-yellow-200'
                          }`}
                        >
                          {analysis.analysis_data.results.consensus.overall_signal || 'N/A'}
                        </Badge>
                        <span className="ml-2 text-xs text-slate-500">
                          {analysis.analysis_data.results.consensus.signal_strength}
                        </span>
                      </div>
                    )}
                    {analysis.analysis_data?.results?.ai_analysis && (
                      <div className="mt-1 text-xs text-slate-500">
                        Confidence: {analysis.analysis_data.results.ai_analysis.confidence_pct}%
                      </div>
                    )}
                  </div>
                  {onAnalysisSelect && (
                    <button
                      onClick={() => onAnalysisSelect(analysis)}
                      className="ml-4 px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                    >
                      View
                    </button>
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
