import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Target } from "lucide-react";
import { AIAnalysis } from "@/types/analysis";
import { formatCurrency } from "@/utils/numberFormatter";

interface TimeframeRiskOverviewCardProps {
  aiAnalysis: AIAnalysis | null | undefined;
}

const TimeframeRiskOverviewCard = ({ aiAnalysis }: TimeframeRiskOverviewCardProps) => {
  if (!aiAnalysis) return null;

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
      </CardContent>
    </Card>
  );
};

export default TimeframeRiskOverviewCard;
