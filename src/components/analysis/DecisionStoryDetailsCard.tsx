import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, AlertTriangle, Target } from "lucide-react";
import { DecisionChain } from "@/types/analysis";

interface DecisionStoryDetailsCardProps {
  decisionChain: DecisionChain | null | undefined;
  fallbackFairValueRange?: number[] | null;
}

const DecisionStoryDetailsCard = ({ decisionChain, fallbackFairValueRange }: DecisionStoryDetailsCardProps) => {
  if (!decisionChain) return null;

  return (
    <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center text-slate-800 text-lg">
          Timeframe Analysis & Risk Assessment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Timeframe Analysis */}
        {decisionChain.timeframe_analysis && (
          <div className="pt-2">
            <h3 className="font-semibold text-slate-800 mb-3 flex items-center">
              <Clock className="h-4 w-4 mr-2 text-blue-600" />
              Timeframe Analysis
            </h3>
            <div className="space-y-4">
              {/* Short Term */}
              {decisionChain.timeframe_analysis.short_term && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-green-800">Short Term</h4>
                    <Badge className="bg-green-100 text-green-700 border-green-300">
                      {decisionChain.timeframe_analysis.short_term.horizon} days
                    </Badge>
                  </div>
                  <p className="text-sm text-green-700 mb-3">
                    {decisionChain.timeframe_analysis.short_term.rationale}
                  </p>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="font-medium text-green-800">Entry Range:</span>
                      <div className="text-green-700">
                        {decisionChain.timeframe_analysis.short_term.entry_range?.length > 0 
                          ? `₹${decisionChain.timeframe_analysis.short_term.entry_range[0]?.toFixed(2) || 'N/A'} - ₹${decisionChain.timeframe_analysis.short_term.entry_range[1]?.toFixed(2) || 'N/A'}`
                          : 'Not specified'}
                      </div>
                    </div>
                    <div>
                      <span className="font-medium text-green-800">Targets:</span>
                      <div className="text-green-700">
                        {decisionChain.timeframe_analysis.short_term.targets?.length > 0
                          ? decisionChain.timeframe_analysis.short_term.targets.map(t => `₹${t?.toFixed(2)}`).join(', ')
                          : 'Not specified'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Medium Term */}
              {decisionChain.timeframe_analysis.medium_term && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-yellow-800">Medium Term</h4>
                    <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300">
                      {decisionChain.timeframe_analysis.medium_term.horizon} days
                    </Badge>
                  </div>
                  <p className="text-sm text-yellow-700 mb-3">
                    {decisionChain.timeframe_analysis.medium_term.rationale}
                  </p>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="font-medium text-yellow-800">Entry Range:</span>
                      <div className="text-yellow-700">
                        {decisionChain.timeframe_analysis.medium_term.entry_range?.length > 0
                          ? `₹${decisionChain.timeframe_analysis.medium_term.entry_range[0]?.toFixed(2) || 'N/A'} - ₹${decisionChain.timeframe_analysis.medium_term.entry_range[1]?.toFixed(2) || 'N/A'}`
                          : 'Not specified'}
                      </div>
                    </div>
                    <div>
                      <span className="font-medium text-yellow-800">Targets:</span>
                      <div className="text-yellow-700">
                        {decisionChain.timeframe_analysis.medium_term.targets?.length > 0
                          ? decisionChain.timeframe_analysis.medium_term.targets.map(t => `₹${t?.toFixed(2)}`).join(', ')
                          : 'Not specified'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Long Term */}
              {decisionChain.timeframe_analysis.long_term && (() => {
                const rawFv = decisionChain.timeframe_analysis.long_term.fair_value_range;
                const isValidNum = (n: any) => typeof n === 'number' && isFinite(n);
                const fvPrimary = Array.isArray(rawFv) && rawFv.length >= 2 && isValidNum(rawFv[0]) && isValidNum(rawFv[1])
                  ? rawFv
                  : null;
                const fvFallback = Array.isArray(fallbackFairValueRange) && fallbackFairValueRange.length >= 2 &&
                                   isValidNum(fallbackFairValueRange[0]) && isValidNum(fallbackFairValueRange[1])
                  ? fallbackFairValueRange
                  : null;
                const fvToShow = fvPrimary || fvFallback;
                return (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-blue-800">Long Term</h4>
                      <Badge className="bg-blue-100 text-blue-700 border-blue-300">
                        {decisionChain.timeframe_analysis.long_term.horizon} days
                      </Badge>
                    </div>
                    <p className="text-sm text-blue-700 mb-3">
                      {decisionChain.timeframe_analysis.long_term.rationale}
                    </p>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="font-medium text-blue-800">Rating:</span>
                        <div className="text-blue-700 capitalize">
                          {decisionChain.timeframe_analysis.long_term.technical_rating || 'Not specified'}
                        </div>
                      </div>
                      <div>
                        <span className="font-medium text-blue-800">Fair Value:</span>
                        <div className="text-blue-700">
                          {fvToShow
                            ? `₹${(fvToShow[0] as number).toFixed(2)} - ₹${(fvToShow[1] as number).toFixed(2)}`
                            : 'Not specified'}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* Risk Assessment */}
        {decisionChain.risk_assessment && (
          <div>
            <h3 className="font-semibold text-slate-800 mb-3 flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2 text-orange-600" />
              Risk Assessment
            </h3>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Primary Risks */}
                <div>
                  <h4 className="font-semibold text-orange-800 mb-2">Primary Risks</h4>
                  <div className="space-y-1">
                    {decisionChain.risk_assessment.primary_risks?.length > 0 ? (
                      decisionChain.risk_assessment.primary_risks.slice(0, 3).map((risk, idx) => (
                        <div key={idx} className="text-sm text-orange-700 flex items-start">
                          <span className="inline-block w-1 h-1 bg-orange-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                          {risk}
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-orange-600">No specific risks identified</div>
                    )}
                  </div>
                </div>

                {/* Critical Levels */}
                <div>
                  <h4 className="font-semibold text-orange-800 mb-2">Critical Levels</h4>
                  <div className="space-y-1">
                    {decisionChain.risk_assessment.critical_levels?.length > 0 ? (
                      decisionChain.risk_assessment.critical_levels.slice(0, 3).map((level, idx) => (
                        <div key={idx} className="text-sm text-orange-700 flex items-center">
                          <Target className="h-3 w-3 mr-2 text-orange-600" />
                          ₹{typeof level === 'string' ? level : level.toFixed(2)}
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-orange-600">No critical levels specified</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DecisionStoryDetailsCard;
