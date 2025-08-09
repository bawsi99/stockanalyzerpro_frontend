
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";
import { AnalysisData } from "@/types/analysis";

interface ConsensusSummaryCardProps {
  consensus: AnalysisData['consensus'];
  analysisDate?: string;
  analysisPeriod?: string;
}

const ConsensusSummaryCard = ({ consensus, analysisDate, analysisPeriod }: ConsensusSummaryCardProps) => {
  // Add null checks and default values
  if (!consensus) {
    return (
      <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm h-[99%] flex flex-col">
        <CardHeader className="pb-6 flex-shrink-0">
          <CardTitle className="flex items-center text-slate-800 text-2xl">
            <TrendingUp className="h-7 w-7 mr-3 text-emerald-500" />
            Indicator Consensus
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 flex-1 overflow-y-auto max-h-[calc(90vh-200px)] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="text-center py-8 text-gray-500">
            <p>No consensus data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getSignalColor = (signal: string) => {
    const signalLower = signal.toLowerCase();
    if (signalLower === 'bullish') return 'bg-emerald-100 text-emerald-700';
    if (signalLower === 'bearish') return 'bg-red-100 text-red-700';
    return 'bg-yellow-100 text-yellow-700';
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-emerald-600';
    if (confidence >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Safe access to properties with defaults
  const overallSignal = consensus.overall_signal || 'Neutral';
  const confidence = consensus.confidence || 0;
  const bullishPercentage = consensus.bullish_percentage || 0;
  const bearishPercentage = consensus.bearish_percentage || 0;
  const neutralPercentage = consensus.neutral_percentage || 0;
  const warnings = consensus.warnings || [];
  const signalDetails = consensus.signal_details || [];
  const total_signals = signalDetails.length;

  return (
    <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm h-[99%] flex flex-col">
      <CardHeader className="pb-6 flex-shrink-0">
        <CardTitle className="flex items-center text-slate-800 text-2xl">
          <TrendingUp className="h-7 w-7 mr-3 text-emerald-500" />
          Indicator Consensus
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 flex-1 overflow-y-auto max-h-[calc(90vh-200px)] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <div className="space-y-6">


          {/* Signal Details */}
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3">
              {signalDetails.map((signal, index) => (
                <div key={index} className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                    <div className="flex flex-wrap items-center gap-2 min-w-0">
                      <span className="font-bold text-slate-800 text-sm truncate">{signal.indicator}</span>
                      {signal.value !== undefined && (
                        <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded flex-shrink-0">
                          {typeof signal.value === 'number' ? signal.value.toFixed(2) : signal.value}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                      <Badge 
                        variant="outline" 
                        className={`text-xs px-2 py-1 flex-shrink-0 ${getSignalColor(signal.signal || 'neutral')}`}
                      >
                        {signal.signal?.toUpperCase() || 'NEUTRAL'}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-sm text-slate-600 leading-relaxed break-words">
                    {signal.description || 'No description available'}
                  </div>
                </div>
              ))}
              {signalDetails.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>No technical indicators available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ConsensusSummaryCard;
