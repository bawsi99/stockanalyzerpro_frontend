
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";
import { AnalysisData } from "@/types/analysis";

interface ConsensusSummaryCardProps {
  consensus: AnalysisData['consensus'];
}

const ConsensusSummaryCard = ({ consensus }: ConsensusSummaryCardProps) => {
  // Add null checks and default values
  if (!consensus) {
    return (
      <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm h-full flex flex-col">
        <CardHeader className="pb-6 flex-shrink-0">
          <CardTitle className="flex items-center text-slate-800 text-2xl">
            <TrendingUp className="h-7 w-7 mr-3 text-emerald-500" />
            Analysis Consensus
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 flex-1 overflow-y-auto">
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

  const getStrengthColor = (strength: string) => {
    const strengthLower = strength.toLowerCase();
    if (strengthLower === 'strong') return 'text-emerald-600';
    if (strengthLower === 'moderate') return 'text-yellow-600';
    return 'text-red-600';
  };

  // Safe access to properties with defaults
  const overallSignal = consensus.overall_signal || 'Neutral';
  const signalStrength = consensus.signal_strength || 'Weak';
  const confidence = consensus.confidence || 0;
  const bullishPercentage = consensus.bullish_percentage || 0;
  const bearishPercentage = consensus.bearish_percentage || 0;
  const neutralPercentage = consensus.neutral_percentage || 0;
  const warnings = consensus.warnings || [];
  const signalDetails = consensus.signal_details || [];

  return (
    <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm h-full flex flex-col">
      <CardHeader className="pb-6 flex-shrink-0">
        <CardTitle className="flex items-center text-slate-800 text-2xl">
          <TrendingUp className="h-7 w-7 mr-3 text-emerald-500" />
          Analysis Consensus
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 flex-1 overflow-y-auto">
        <div className="space-y-6">
          {/* Overall Signal */}
          <div className="text-center">
            <Badge 
              variant="secondary" 
              className={`text-xl px-6 py-3 ${getSignalColor(overallSignal)}`}
            >
              {overallSignal.toUpperCase()} ({signalStrength})
            </Badge>
          </div>

          {/* Signal Breakdown */}
          <div className="grid grid-cols-3 gap-4 text-base">
            <div className="text-center p-4 bg-gradient-to-br from-emerald-50 to-green-50 rounded-lg border border-emerald-100">
              <div className="text-emerald-600 font-bold text-lg">{bullishPercentage.toFixed(1)}%</div>
              <div className="text-slate-600 font-medium">Bullish</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-red-50 to-pink-50 rounded-lg border border-red-100">
              <div className="text-red-600 font-bold text-lg">{bearishPercentage.toFixed(1)}%</div>
              <div className="text-slate-600 font-medium">Bearish</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg border border-yellow-100">
              <div className="text-yellow-600 font-bold text-lg">{neutralPercentage.toFixed(1)}%</div>
              <div className="text-slate-600 font-medium">Neutral</div>
            </div>
          </div>

          {/* User Warnings */}
          {warnings.length > 0 && (
            <div className="space-y-3">
              {warnings.map((warning, index) => (
                <div key={index} className="flex items-start p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-base">
                  <AlertTriangle className="h-5 w-5 mr-3 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div className="text-yellow-800 font-medium">{warning}</div>
                </div>
              ))}
            </div>
          )}

          {/* Signal Details */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-700 text-lg">Signal Details</h4>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {signalDetails.map((signal, index) => (
                <div key={index} className="text-sm p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-slate-800">{signal.indicator || 'Unknown'}</span>
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant="outline" 
                        className={`text-sm ${getSignalColor(signal.signal || 'neutral')}`}
                      >
                        {signal.signal || 'neutral'}
                      </Badge>
                      <span className={`text-sm font-medium ${getStrengthColor(signal.strength || 'weak')}`}>
                        {signal.strength || 'weak'}
                      </span>
                    </div>
                  </div>
                  <div className="text-slate-600">{signal.description || 'No description available'}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ConsensusSummaryCard;
