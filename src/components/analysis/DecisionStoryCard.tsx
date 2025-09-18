import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { BookOpen, TrendingUp, TrendingDown, AlertTriangle, Target, Clock, DollarSign } from "lucide-react";
import { DecisionStory } from "@/types/analysis";

interface DecisionStoryCardProps {
  decisionStory: DecisionStory | null | undefined;
  analysisDate?: string;
  analysisPeriod?: string;
}

const DecisionStoryCard = ({ decisionStory, analysisDate, analysisPeriod }: DecisionStoryCardProps) => {
  if (!decisionStory) {
    return (
      <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm h-full flex flex-col">
        <CardHeader className="flex-shrink-0">
          <CardTitle className="flex items-center text-slate-800 text-lg">
            <BookOpen className="h-4 w-4 mr-2 text-purple-500" />
            Decision Story
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto">
          {/* Analysis Date and Period */}
          {(analysisDate || analysisPeriod) && (
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-sm text-slate-600 border-b border-slate-200 pb-3 mb-4">
              {analysisDate && (
                <div className="flex items-center gap-1">
                  <span className="font-medium">Analysis Date:</span>
                  <span>{new Date(analysisDate).toLocaleDateString()}</span>
                </div>
              )}
              {analysisPeriod && (
                <div className="flex items-center gap-1">
                  <span className="font-medium">Period:</span>
                  <span>{analysisPeriod}</span>
                </div>
              )}
            </div>
          )}
          <p className="text-slate-500">No decision story data available</p>
        </CardContent>
      </Card>
    );
  }

  const { narrative, decision_chain } = decisionStory;

  const getConfidenceBadge = (confidence: number, level: string) => {
    const badgeColors = {
      high: "bg-green-100 text-green-800 border-green-200",
      moderate: "bg-yellow-100 text-yellow-800 border-yellow-200", 
      low: "bg-red-100 text-red-800 border-red-200"
    };
    
    return (
      <Badge className={`${badgeColors[level as keyof typeof badgeColors] || badgeColors.moderate}`}>
        {confidence}% {level}
      </Badge>
    );
  };

  const getTrendIcon = (trend: string) => {
    const trendLower = trend.toLowerCase();
    if (trendLower.includes('bullish') || trendLower.includes('buy')) {
      return <TrendingUp className="h-4 w-4 text-green-600" />;
    } else if (trendLower.includes('bearish') || trendLower.includes('sell')) {
      return <TrendingDown className="h-4 w-4 text-red-600" />;
    }
    return <Target className="h-4 w-4 text-slate-600" />;
  };

  return (
    <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm h-full flex flex-col">
      <CardHeader className="flex-shrink-0">
        <CardTitle className="flex items-center text-slate-800 text-lg">
          <BookOpen className="h-4 w-4 mr-2 text-purple-500" />
          Decision Story
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto space-y-6">
        {/* Analysis Date and Period */}
        {(analysisDate || analysisPeriod) && (
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-sm text-slate-600 border-b border-slate-200 pb-3">
            {analysisDate && (
              <div className="flex items-center gap-1">
                <span className="font-medium">Analysis Date:</span>
                <span>{new Date(analysisDate).toLocaleDateString()}</span>
              </div>
            )}
            {analysisPeriod && (
              <div className="flex items-center gap-1">
                <span className="font-medium">Period:</span>
                <span>{analysisPeriod}</span>
              </div>
            )}
          </div>
        )}

        {/* Executive Summary */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-100">
          <h3 className="font-semibold text-slate-800 mb-2 flex items-center">
            <BookOpen className="h-4 w-4 mr-2 text-purple-600" />
            Executive Summary
          </h3>
          <p className="text-sm text-slate-700 leading-relaxed">
            {narrative}
          </p>
        </div>

        {/* Overall Assessment */}
        {decision_chain.overall_assessment && (
          <div>
            <h3 className="font-semibold text-slate-800 mb-3 flex items-center">
              {getTrendIcon(decision_chain.overall_assessment.trend)}
              <span className="ml-2">Overall Assessment</span>
            </h3>
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-slate-800 capitalize">
                    {decision_chain.overall_assessment.trend}
                  </div>
                  <div className="text-xs text-slate-600">Trend</div>
                </div>
                <div className="text-center">
                  <div className="flex justify-center">
                    {getConfidenceBadge(
                      decision_chain.overall_assessment.confidence,
                      decision_chain.overall_assessment.confidence_level
                    )}
                  </div>
                  <div className="text-xs text-slate-600 mt-1">Confidence</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-slate-800 capitalize">
                    {decision_chain.overall_assessment.confidence_level}
                  </div>
                  <div className="text-xs text-slate-600">Risk Level</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Timeframe Analysis */}
        {decision_chain.timeframe_analysis && (
          <div>
            <h3 className="font-semibold text-slate-800 mb-3 flex items-center">
              <Clock className="h-4 w-4 mr-2 text-blue-600" />
              Timeframe Analysis
            </h3>
            <div className="space-y-4">
              {/* Short Term */}
              {decision_chain.timeframe_analysis.short_term && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-green-800">Short Term</h4>
                    <Badge className="bg-green-100 text-green-700 border-green-300">
                      {decision_chain.timeframe_analysis.short_term.horizon} days
                    </Badge>
                  </div>
                  <p className="text-sm text-green-700 mb-3">
                    {decision_chain.timeframe_analysis.short_term.rationale}
                  </p>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="font-medium text-green-800">Entry Range:</span>
                      <div className="text-green-700">
                        {decision_chain.timeframe_analysis.short_term.entry_range?.length > 0 
                          ? `₹${decision_chain.timeframe_analysis.short_term.entry_range[0]?.toFixed(2) || 'N/A'} - ₹${decision_chain.timeframe_analysis.short_term.entry_range[1]?.toFixed(2) || 'N/A'}`
                          : 'Not specified'
                        }
                      </div>
                    </div>
                    <div>
                      <span className="font-medium text-green-800">Targets:</span>
                      <div className="text-green-700">
                        {decision_chain.timeframe_analysis.short_term.targets?.length > 0
                          ? decision_chain.timeframe_analysis.short_term.targets.map(t => `₹${t?.toFixed(2)}`).join(', ')
                          : 'Not specified'
                        }
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Medium Term */}
              {decision_chain.timeframe_analysis.medium_term && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-yellow-800">Medium Term</h4>
                    <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300">
                      {decision_chain.timeframe_analysis.medium_term.horizon} days
                    </Badge>
                  </div>
                  <p className="text-sm text-yellow-700 mb-3">
                    {decision_chain.timeframe_analysis.medium_term.rationale}
                  </p>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="font-medium text-yellow-800">Entry Range:</span>
                      <div className="text-yellow-700">
                        {decision_chain.timeframe_analysis.medium_term.entry_range?.length > 0
                          ? `₹${decision_chain.timeframe_analysis.medium_term.entry_range[0]?.toFixed(2) || 'N/A'} - ₹${decision_chain.timeframe_analysis.medium_term.entry_range[1]?.toFixed(2) || 'N/A'}`
                          : 'Not specified'
                        }
                      </div>
                    </div>
                    <div>
                      <span className="font-medium text-yellow-800">Targets:</span>
                      <div className="text-yellow-700">
                        {decision_chain.timeframe_analysis.medium_term.targets?.length > 0
                          ? decision_chain.timeframe_analysis.medium_term.targets.map(t => `₹${t?.toFixed(2)}`).join(', ')
                          : 'Not specified'
                        }
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Long Term */}
              {decision_chain.timeframe_analysis.long_term && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-blue-800">Long Term</h4>
                    <Badge className="bg-blue-100 text-blue-700 border-blue-300">
                      {decision_chain.timeframe_analysis.long_term.horizon} days
                    </Badge>
                  </div>
                  <p className="text-sm text-blue-700 mb-3">
                    {decision_chain.timeframe_analysis.long_term.rationale}
                  </p>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="font-medium text-blue-800">Rating:</span>
                      <div className="text-blue-700 capitalize">
                        {decision_chain.timeframe_analysis.long_term.technical_rating || 'Not specified'}
                      </div>
                    </div>
                    <div>
                      <span className="font-medium text-blue-800">Fair Value:</span>
                      <div className="text-blue-700">
                        {decision_chain.timeframe_analysis.long_term.fair_value_range?.length > 0
                          ? `₹${decision_chain.timeframe_analysis.long_term.fair_value_range[0]?.toFixed(2) || 'N/A'} - ₹${decision_chain.timeframe_analysis.long_term.fair_value_range[1]?.toFixed(2) || 'N/A'}`
                          : 'Not specified'
                        }
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Risk Assessment */}
        {decision_chain.risk_assessment && (
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
                    {decision_chain.risk_assessment.primary_risks?.length > 0 ? (
                      decision_chain.risk_assessment.primary_risks.slice(0, 3).map((risk, idx) => (
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
                    {decision_chain.risk_assessment.critical_levels?.length > 0 ? (
                      decision_chain.risk_assessment.critical_levels.slice(0, 3).map((level, idx) => (
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

        {/* Footer */}
        <div className="text-xs text-slate-500 pt-2 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <span>AI-Generated Analysis</span>
            <span>Updated: {analysisDate ? new Date(analysisDate).toLocaleDateString() : 'N/A'}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DecisionStoryCard;