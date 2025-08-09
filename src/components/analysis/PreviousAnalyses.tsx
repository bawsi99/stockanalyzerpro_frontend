import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, Clock, History, Loader2 } from 'lucide-react';
import { StoredAnalysis } from '@/hooks/useStockAnalyses';
import { format } from "date-fns";

export interface RunningAnalysisItem {
  id: string;
  stock: string;
  exchange: string;
  period: number;
  interval: string;
  sector: string | null;
  startedAt: number; // epoch ms
  status?: 'running' | 'success' | 'error';
  error?: string;
}

interface PreviousAnalysesProps {
  analyses: StoredAnalysis[];
  onAnalysisSelect?: (analysis: StoredAnalysis) => void;
  loading?: boolean;
  error?: string | null;
  runningAnalyses?: RunningAnalysisItem[];
}

const PreviousAnalyses = ({ analyses, onAnalysisSelect, loading = false, error = null, runningAnalyses = [] }: PreviousAnalysesProps) => {
  // local clock to tick running timers
  const [now, setNow] = useState<number>(Date.now());

  useEffect(() => {
    if (!runningAnalyses || runningAnalyses.length === 0) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [runningAnalyses?.length]);

  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm grid grid-rows-[auto,1fr] h-[850px]">
      <CardHeader className="flex-shrink-0">
        <CardTitle className="flex items-center text-slate-800">
          <History className="h-5 w-5 mr-2 text-blue-500" />
          Previous Analyses
        </CardTitle>
        <CardDescription>
          View your past stock analysis reports
        </CardDescription>
      </CardHeader>
      <CardContent className="overflow-y-auto p-4 min-h-0">
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
        ) : analyses.length === 0 && (runningAnalyses?.length ?? 0) === 0 ? (
          <div className="text-center py-8">
            <TrendingUp className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No previous analyses found</p>
            <p className="text-sm text-slate-400">Your completed analyses will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Running analyses at the top */}
            {runningAnalyses && runningAnalyses.length > 0 && (
              <div className="space-y-2">
                {runningAnalyses.map((run) => {
                  const elapsedSec = Math.max(0, Math.floor((now - run.startedAt) / 1000));
                  return (
                    <div key={run.id} className="border rounded-lg p-3 bg-amber-50/80 hover:bg-amber-100 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-semibold text-slate-800 truncate">{run.stock}</h3>
                            <Badge variant="outline" className="text-xs flex-shrink-0 bg-blue-100 text-blue-700 border-blue-200 flex items-center">
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" /> Running
                            </Badge>
                          </div>
                          <div className="flex items-center text-xs text-slate-600">
                            <Clock className="h-3 w-3 mr-1 flex-shrink-0" />
                            <span className="truncate">
                              Elapsed {String(Math.floor(elapsedSec / 60)).padStart(2, '0')}:{String(elapsedSec % 60).padStart(2, '0')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {analyses.map((analysis) => (
              <div key={analysis.id} className="border rounded-lg p-3 bg-slate-50 hover:bg-slate-100 transition-colors">
                <div className="space-y-2">
                  {/* Header with stock symbol and signal */}
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-semibold text-slate-800 truncate">{analysis.stock_symbol}</h3>
                        {(() => {
                          const getSignalClasses = (signal: string) => {
                            const s = (signal || '').toLowerCase();
                            if (s === 'bullish' || s.includes('buy')) return 'bg-green-100 text-green-700 border-green-200';
                            if (s === 'bearish' || s.includes('sell')) return 'bg-red-100 text-red-700 border-red-200';
                            return 'bg-yellow-100 text-yellow-700 border-yellow-200';
                          };

                          // Prefer enhanced AI primary trend → legacy AI trend → normalized overall_signal → summary/consensus
                          const aiSignal: string =
                            (analysis as any)?.analysis_data?.results?.ai_analysis?.market_outlook?.primary_trend?.direction ||
                            (analysis as any)?.analysis_data?.results?.ai_analysis?.trend ||
                            analysis.overall_signal ||
                            (analysis as any)?.analysis_data?.results?.summary?.overall_signal ||
                            (analysis as any)?.analysis_data?.results?.consensus?.overall_signal ||
                            'N/A';

                          const badgeClass = getSignalClasses(aiSignal);

                          return (
                            <Badge variant="outline" className={`text-xs flex-shrink-0 ${badgeClass}`}>
                              {aiSignal}
                            </Badge>
                          );
                        })()}
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
                  {/* Consensus badge removed per requirement to show only AI trading signal */}


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
