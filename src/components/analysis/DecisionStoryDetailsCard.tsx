import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, AlertTriangle, Target, BarChart3 } from "lucide-react";
import { DecisionChain, AIAnalysis } from "@/types/analysis";
import { formatCurrency } from "@/utils/numberFormatter";

interface DecisionStoryDetailsCardProps {
  decisionChain: DecisionChain | null | undefined;
  fallbackFairValueRange?: number[] | null;
  aiAnalysis?: AIAnalysis | null;
}

const DecisionStoryDetailsCard = ({ decisionChain, fallbackFairValueRange, aiAnalysis }: DecisionStoryDetailsCardProps) => {
  if (!decisionChain) return null;

  const getSignalColor = (signal: string) => {
    const s = (signal || 'neutral').toLowerCase();
    if (s === 'bullish') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (s === 'bearish') return 'bg-red-100 text-red-700 border-red-200';
    return 'bg-yellow-100 text-yellow-700 border-yellow-200';
  };

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

        {/* Appended from AI TimeframeRiskOverviewCard: Market Outlook and Critical Levels */}
        {aiAnalysis && (
          <>
            {/* Market Outlook */}
            <div className="space-y-3">
              <h3 className="font-semibold text-slate-800 flex items-center">
                <BarChart3 className="h-4 w-4 mr-2 text-blue-500" />
                Market Outlook
              </h3>
              {/* Primary Trend */}
              {aiAnalysis.market_outlook?.primary_trend && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between mb-1.5">
                    <h4 className="font-medium text-blue-800">Primary Trend</h4>
                    <Badge className={getSignalColor(aiAnalysis.market_outlook.primary_trend.direction || 'neutral')}>
                      {(aiAnalysis.market_outlook.primary_trend.direction || 'neutral').toUpperCase()}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-slate-600">Strength:</span>
                      <span className="ml-2 font-medium text-emerald-700">
                        {aiAnalysis.market_outlook.primary_trend.strength || 'Weak'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-600">Duration:</span>
                      <span className="ml-2 font-medium text-slate-800">
                        {aiAnalysis.market_outlook.primary_trend.duration || 'Unknown'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-600">Confidence:</span>
                      <span className="ml-2 font-medium text-emerald-700">
                        {(aiAnalysis.market_outlook.primary_trend.confidence || 0)}%
                      </span>
                    </div>
                  </div>
                  {aiAnalysis.market_outlook.primary_trend.rationale && (
                    <p className="text-xs text-slate-600 mt-2">
                      {aiAnalysis.market_outlook.primary_trend.rationale}
                    </p>
                  )}
                </div>
              )}

              {/* Secondary Trend */}
              {aiAnalysis.market_outlook?.secondary_trend && (
                <div className="bg-gradient-to-r from-slate-50 to-gray-50 p-3 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-1.5">
                    <h4 className="font-medium text-slate-800">Secondary Trend</h4>
                    <Badge className={getSignalColor(aiAnalysis.market_outlook.secondary_trend.direction || 'neutral')}>
                      {(aiAnalysis.market_outlook.secondary_trend.direction || 'neutral').toUpperCase()}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-slate-600">Strength:</span>
                      <span className="ml-2 font-medium text-slate-700">
                        {aiAnalysis.market_outlook.secondary_trend.strength || 'Weak'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-600">Duration:</span>
                      <span className="ml-2 font-medium text-slate-800">
                        {aiAnalysis.market_outlook.secondary_trend.duration || 'Unknown'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-600">Confidence:</span>
                      <span className="ml-2 font-medium text-slate-700">
                        {(aiAnalysis.market_outlook.secondary_trend.confidence || 0)}%
                      </span>
                    </div>
                  </div>
                  {aiAnalysis.market_outlook.secondary_trend.rationale && (
                    <p className="text-xs text-slate-600 mt-2">
                      {aiAnalysis.market_outlook.secondary_trend.rationale}
                    </p>
                  )}
                </div>
              )}

              {/* Key Drivers */}
              {aiAnalysis.market_outlook?.key_drivers && aiAnalysis.market_outlook.key_drivers.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-slate-700">Key Drivers</h4>
                  <div className="space-y-2">
                    {aiAnalysis.market_outlook.key_drivers.map((driver, index) => (
                      <div key={index} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium text-slate-800 text-sm">{driver.factor}</div>
                          <div className="text-xs text-slate-600">{driver.timeframe}</div>
                        </div>
                        <Badge className={driver.impact === 'positive' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                          {driver.impact}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Critical Levels */}
            {aiAnalysis.critical_levels && (
              <div className="space-y-3">
                <h3 className="font-semibold text-slate-800 flex items-center">
                  <Target className="h-4 w-4 mr-2 text-orange-500" />
                  Critical Levels
                </h3>
                {/* Must Watch Levels */}
                {aiAnalysis.critical_levels.must_watch && aiAnalysis.critical_levels.must_watch.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-slate-700">Must Watch</h4>
                    <div className="space-y-2">
                      {aiAnalysis.critical_levels.must_watch.map((level, index) => (
                        <div key={index} className="p-2.5 bg-orange-50 border border-orange-200 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-orange-800">{formatCurrency(level.level)}</div>
                              <div className="text-xs text-orange-600">{level.type}</div>
                            </div>
                            <Badge className="bg-orange-100 text-orange-700">
                              {level.significance}
                            </Badge>
                          </div>
                          {level.action && (
                            <div className="text-xs text-orange-700 mt-1">{level.action}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Confirmation Levels */}
                {aiAnalysis.critical_levels.confirmation_levels && aiAnalysis.critical_levels.confirmation_levels.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-slate-700">Confirmation Levels</h4>
                    <div className="space-y-2">
                      {aiAnalysis.critical_levels.confirmation_levels.map((c, idx) => (
                        <div key={idx} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-slate-800">{formatCurrency(c.level)}</div>
                              <div className="text-xs text-slate-600">{c.condition}</div>
                            </div>
                            {c.action && (
                              <Badge className="bg-blue-100 text-blue-700">{c.action}</Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default DecisionStoryDetailsCard;
