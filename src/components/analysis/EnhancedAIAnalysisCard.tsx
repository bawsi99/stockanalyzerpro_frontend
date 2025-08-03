import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Shield, 
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  Activity
} from "lucide-react";
import { AIAnalysis } from "@/types/analysis";
import { formatCurrency } from "@/utils/numberFormatter";

interface EnhancedAIAnalysisCardProps {
  aiAnalysis: AIAnalysis | null | undefined;
}

const EnhancedAIAnalysisCard = ({ aiAnalysis }: EnhancedAIAnalysisCardProps) => {
  if (!aiAnalysis || !aiAnalysis.meta) {
    return (
      <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm h-full">
        <CardHeader>
          <CardTitle className="flex items-center text-slate-800 text-lg">
            <Brain className="h-5 w-5 mr-2 text-purple-500" />
            Enhanced AI Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-500">No AI analysis data available</p>
        </CardContent>
      </Card>
    );
  }

  const getSignalColor = (signal: string) => {
    const signalLower = signal.toLowerCase();
    if (signalLower === 'bullish') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (signalLower === 'bearish') return 'bg-red-100 text-red-700 border-red-200';
    return 'bg-yellow-100 text-yellow-700 border-yellow-200';
  };

  const getStrengthColor = (strength: string) => {
    const strengthLower = strength.toLowerCase();
    if (strengthLower === 'strong') return 'text-emerald-600';
    if (strengthLower === 'moderate') return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-emerald-600';
    if (confidence >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm h-full">
      <CardHeader>
        <CardTitle className="flex items-center text-slate-800 text-xl">
          <Brain className="h-6 w-6 mr-3 text-purple-500" />
          Enhanced AI Analysis
          <Badge className="ml-2 bg-purple-100 text-purple-700">
            {aiAnalysis.meta?.overall_confidence || 0}% Confidence
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Market Outlook */}
        <div className="space-y-4">
          <h3 className="font-semibold text-slate-800 flex items-center">
            <BarChart3 className="h-4 w-4 mr-2 text-blue-500" />
            Market Outlook
          </h3>
          
          {/* Primary Trend */}
          {aiAnalysis.market_outlook?.primary_trend && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-blue-800">Primary Trend</h4>
                <Badge className={getSignalColor(aiAnalysis.market_outlook.primary_trend.direction || 'neutral')}>
                  {(aiAnalysis.market_outlook.primary_trend.direction || 'neutral').toUpperCase()}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-600">Strength:</span>
                  <span className={`ml-2 font-medium ${getStrengthColor(aiAnalysis.market_outlook.primary_trend.strength || 'weak')}`}>
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
                  <span className={`ml-2 font-medium ${getConfidenceColor(aiAnalysis.market_outlook.primary_trend.confidence || 0)}`}>
                    {aiAnalysis.market_outlook.primary_trend.confidence || 0}%
                  </span>
                </div>
              </div>
              <p className="text-sm text-slate-600 mt-2">
                {aiAnalysis.market_outlook.primary_trend.rationale || 'No rationale available'}
              </p>
            </div>
          )}

          {/* Key Drivers */}
          {aiAnalysis.market_outlook?.key_drivers && aiAnalysis.market_outlook.key_drivers.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-slate-700">Key Drivers</h4>
              <div className="space-y-2">
                {aiAnalysis.market_outlook.key_drivers.map((driver, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium text-slate-800">{driver.factor}</div>
                      <div className="text-sm text-slate-600">{driver.timeframe}</div>
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

        {/* Trading Strategy */}
        {aiAnalysis.trading_strategy && (
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-800 flex items-center">
              <Target className="h-4 w-4 mr-2 text-green-500" />
              Trading Strategy
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Short Term */}
              {aiAnalysis.trading_strategy.short_term && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                  <h4 className="font-medium text-green-800 mb-3 flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    Short Term ({aiAnalysis.trading_strategy.short_term.horizon_days || 0} days)
                  </h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-slate-600">Bias:</span>
                  <Badge className={`ml-2 ${getSignalColor(aiAnalysis.trading_strategy.short_term.bias || 'neutral')}`}>
                    {aiAnalysis.trading_strategy.short_term.bias || 'Neutral'}
                  </Badge>
                </div>
                {aiAnalysis.trading_strategy.short_term.entry_strategy && (
                  <div>
                    <span className="text-slate-600">Entry Range:</span>
                    <div className="text-slate-800 font-medium">
                      {formatCurrency(aiAnalysis.trading_strategy.short_term.entry_strategy.entry_range?.[0] || 0)} - 
                      {formatCurrency(aiAnalysis.trading_strategy.short_term.entry_strategy.entry_range?.[1] || 0)}
                    </div>
                  </div>
                )}
                {aiAnalysis.trading_strategy.short_term.exit_strategy && (
                  <>
                    <div>
                      <span className="text-slate-600">Stop Loss:</span>
                      <div className="text-slate-800 font-medium">
                        {formatCurrency(aiAnalysis.trading_strategy.short_term.exit_strategy.stop_loss || 0)}
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-600">Targets:</span>
                      <div className="text-slate-800 font-medium">
                        {aiAnalysis.trading_strategy.short_term.exit_strategy.targets?.map((target, idx) => (
                          <div key={idx} className="text-xs">
                            {formatCurrency(target.price || 0)}
                          </div>
                        )) || 'No targets available'}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
              )}

              {/* Medium Term */}
              {aiAnalysis.trading_strategy.medium_term && (
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-800 mb-3 flex items-center">
                    <Activity className="h-4 w-4 mr-1" />
                    Medium Term ({aiAnalysis.trading_strategy.medium_term.horizon_days || 0} days)
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-slate-600">Bias:</span>
                      <Badge className={`ml-2 ${getSignalColor(aiAnalysis.trading_strategy.medium_term.bias || 'neutral')}`}>
                        {aiAnalysis.trading_strategy.medium_term.bias || 'Neutral'}
                      </Badge>
                    </div>
                    {aiAnalysis.trading_strategy.medium_term.entry_strategy && (
                      <div>
                        <span className="text-slate-600">Entry Range:</span>
                        <div className="text-slate-800 font-medium">
                          {formatCurrency(aiAnalysis.trading_strategy.medium_term.entry_strategy.entry_range?.[0] || 0)} - 
                          {formatCurrency(aiAnalysis.trading_strategy.medium_term.entry_strategy.entry_range?.[1] || 0)}
                        </div>
                      </div>
                    )}
                    {aiAnalysis.trading_strategy.medium_term.exit_strategy && (
                      <>
                        <div>
                          <span className="text-slate-600">Stop Loss:</span>
                          <div className="text-slate-800 font-medium">
                            {formatCurrency(aiAnalysis.trading_strategy.medium_term.exit_strategy.stop_loss || 0)}
                          </div>
                        </div>
                        <div>
                          <span className="text-slate-600">Targets:</span>
                          <div className="text-slate-800 font-medium">
                            {aiAnalysis.trading_strategy.medium_term.exit_strategy.targets?.map((target, idx) => (
                              <div key={idx} className="text-xs">
                                {formatCurrency(target.price || 0)}
                              </div>
                            )) || 'No targets available'}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Long Term */}
              {aiAnalysis.trading_strategy.long_term && (
                <div className="bg-gradient-to-r from-purple-50 to-violet-50 p-4 rounded-lg border border-purple-200">
                  <h4 className="font-medium text-purple-800 mb-3 flex items-center">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    Long Term ({aiAnalysis.trading_strategy.long_term.horizon_days || 0} days)
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-slate-600">Rating:</span>
                      <Badge className="ml-2 bg-purple-100 text-purple-700">
                        {aiAnalysis.trading_strategy.long_term.investment_rating || 'N/A'}
                      </Badge>
                    </div>
                    {aiAnalysis.trading_strategy.long_term.fair_value_range && (
                      <div>
                        <span className="text-slate-600">Fair Value:</span>
                        <div className="text-slate-800 font-medium">
                          {formatCurrency(aiAnalysis.trading_strategy.long_term.fair_value_range[0] || 0)} - 
                          {formatCurrency(aiAnalysis.trading_strategy.long_term.fair_value_range[1] || 0)}
                        </div>
                      </div>
                    )}
                    {aiAnalysis.trading_strategy.long_term.key_levels?.accumulation_zone && (
                      <div>
                        <span className="text-slate-600">Accumulation:</span>
                        <div className="text-slate-800 font-medium">
                          {formatCurrency(aiAnalysis.trading_strategy.long_term.key_levels.accumulation_zone[0] || 0)} - 
                          {formatCurrency(aiAnalysis.trading_strategy.long_term.key_levels.accumulation_zone[1] || 0)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Risk Management */}
        {aiAnalysis.risk_management && (
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-800 flex items-center">
              <Shield className="h-4 w-4 mr-2 text-red-500" />
              Risk Management
            </h3>
            
            {/* Key Risks */}
            {aiAnalysis.risk_management.key_risks && aiAnalysis.risk_management.key_risks.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-slate-700">Key Risks</h4>
                <div className="space-y-2">
                  {aiAnalysis.risk_management.key_risks.map((risk, index) => (
                    <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-red-800">{risk.risk}</div>
                          <div className="text-sm text-red-600 mt-1">
                            <span className="font-medium">Impact:</span> {risk.impact} | 
                            <span className="font-medium ml-2">Probability:</span> {risk.probability}
                          </div>
                          <div className="text-sm text-red-700 mt-1">
                            <span className="font-medium">Mitigation:</span> {risk.mitigation}
                          </div>
                        </div>
                        <AlertTriangle className="h-5 w-5 text-red-500 mt-1 flex-shrink-0" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Stop Loss Levels */}
            {aiAnalysis.risk_management.stop_loss_levels && aiAnalysis.risk_management.stop_loss_levels.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-slate-700">Stop Loss Levels</h4>
                <div className="w-full space-y-2">
                  {aiAnalysis.risk_management.stop_loss_levels.map((level, index) => (
                    <div key={index} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-yellow-800">{formatCurrency(level.level)}</div>
                          <div className="text-sm text-yellow-600">{level.type}</div>
                        </div>
                        <div className="text-xs text-yellow-700 text-right">
                          {level.significance}
                        </div>
                      </div>
                      <div className="text-xs text-yellow-700 mt-1">{level.rationale}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Critical Levels */}
        {aiAnalysis.critical_levels && (
          <div className="space-y-4">
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
                    <div key={index} className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-orange-800">{formatCurrency(level.level)}</div>
                          <div className="text-sm text-orange-600">{level.type}</div>
                        </div>
                        <Badge className="bg-orange-100 text-orange-700">
                          {level.significance}
                        </Badge>
                      </div>
                      <div className="text-sm text-orange-700 mt-1">{level.action}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Key Takeaways */}
        {aiAnalysis.key_takeaways && aiAnalysis.key_takeaways.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-slate-800 flex items-center">
              <CheckCircle className="h-4 w-4 mr-2 text-emerald-500" />
              Key Takeaways
            </h3>
            <div className="space-y-2">
              {aiAnalysis.key_takeaways.map((takeaway, index) => (
                <div key={index} className="flex items-start p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <CheckCircle className="h-4 w-4 mr-3 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <div className="text-emerald-800">{takeaway}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EnhancedAIAnalysisCard; 