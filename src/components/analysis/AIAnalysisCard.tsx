import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Brain, TrendingUp, TrendingDown, Minus, Target, AlertTriangle, Shield, Eye } from "lucide-react";
import { AIAnalysis } from "@/types/analysis";

interface AIAnalysisCardProps {
  aiAnalysis: AIAnalysis;
}

const AIAnalysisCard = ({ aiAnalysis }: AIAnalysisCardProps) => {
  const { meta, market_outlook, trading_strategy, risk_management, critical_levels, key_takeaways } = aiAnalysis;

  const getSignalColor = (signal: string) => {
    const signalLower = signal.toLowerCase();
    if (signalLower.includes('bullish')) return 'bg-emerald-100 text-emerald-700';
    if (signalLower.includes('bearish')) return 'bg-red-100 text-red-700';
    return 'bg-yellow-100 text-yellow-700';
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-emerald-600';
    if (confidence >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Meta Information */}
      <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="pb-6">
          <CardTitle className="flex items-center text-slate-800 text-2xl">
            <Brain className="h-7 w-7 mr-3 text-blue-500" />
            AI Analysis Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-base">
            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
              <div className="text-slate-600 text-sm font-medium mb-2">Symbol</div>
              <div className="font-bold text-lg text-slate-800">{meta.symbol}</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-emerald-50 to-green-50 rounded-lg border border-emerald-100">
              <div className="text-slate-600 text-sm font-medium mb-2">Analysis Date</div>
              <div className="font-bold text-lg text-slate-800">{meta.analysis_date}</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-100">
              <div className="text-slate-600 text-sm font-medium mb-2">Overall Confidence</div>
              <div className={`font-bold text-lg ${getConfidenceColor(meta.overall_confidence)}`}>
                {meta.overall_confidence}%
              </div>
            </div>

          </div>
        </CardContent>
      </Card>

      {/* Market Outlook */}
      <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center text-slate-800">
            <Eye className="h-5 w-5 mr-2 text-purple-500" />
            Market Outlook
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Primary Trend */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-slate-700">Primary Trend</h4>
              <Badge className={getSignalColor(market_outlook.primary_trend.direction)}>
                {market_outlook.primary_trend.direction.toUpperCase()}
              </Badge>
            </div>
            <div className="text-sm text-slate-600 space-y-1">
              <div><span className="font-medium">Strength:</span> {market_outlook.primary_trend.strength}</div>
              <div><span className="font-medium">Duration:</span> {market_outlook.primary_trend.duration}</div>
              <div><span className="font-medium">Confidence:</span> <span className={getConfidenceColor(market_outlook.primary_trend.confidence)}>{market_outlook.primary_trend.confidence}%</span></div>
              <div className="mt-2 text-slate-500">{market_outlook.primary_trend.rationale}</div>
            </div>
          </div>

          <Separator />

          {/* Secondary Trend */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-slate-700">Secondary Trend</h4>
              <Badge className={getSignalColor(market_outlook.secondary_trend.direction)}>
                {market_outlook.secondary_trend.direction.toUpperCase()}
              </Badge>
            </div>
            <div className="text-sm text-slate-600 space-y-1">
              <div><span className="font-medium">Strength:</span> {market_outlook.secondary_trend.strength}</div>
              <div><span className="font-medium">Duration:</span> {market_outlook.secondary_trend.duration}</div>
              <div><span className="font-medium">Confidence:</span> <span className={getConfidenceColor(market_outlook.secondary_trend.confidence)}>{market_outlook.secondary_trend.confidence}%</span></div>
              <div className="mt-2 text-slate-500">{market_outlook.secondary_trend.rationale}</div>
            </div>
          </div>

          {/* Key Drivers */}
          {market_outlook.key_drivers.length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="font-semibold text-slate-700 mb-2">Key Drivers</h4>
                <div className="space-y-2">
                  {market_outlook.key_drivers.map((driver, index) => (
                    <div key={index} className="text-sm p-2 bg-slate-50 rounded">
                      <div className="font-medium">{driver.factor}</div>
                      <div className="text-slate-500">
                        Impact: <span className={driver.impact === 'positive' ? 'text-emerald-600' : driver.impact === 'negative' ? 'text-red-600' : 'text-yellow-600'}>{driver.impact}</span> | 
                        Timeframe: {driver.timeframe}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Trading Strategy */}
      <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center text-slate-800">
            <Target className="h-5 w-5 mr-2 text-green-500" />
            Trading Strategy
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Short Term */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-slate-700">Short Term ({trading_strategy.short_term.horizon_days} days)</h4>
              <Badge className={getSignalColor(trading_strategy.short_term.bias)}>
                {trading_strategy.short_term.bias.toUpperCase()}
              </Badge>
            </div>
            <div className="text-sm text-slate-600 space-y-2">
              <div><span className="font-medium">Entry Range:</span> {trading_strategy.short_term.entry_strategy.entry_range[0] || 'N/A'} - {trading_strategy.short_term.entry_strategy.entry_range[1] || 'N/A'}</div>
              <div><span className="font-medium">Stop Loss:</span> {trading_strategy.short_term.exit_strategy.stop_loss}</div>
              <div><span className="font-medium">Targets:</span> {trading_strategy.short_term.exit_strategy.targets.map(t => `${t.price} (${t.probability})`).join(', ')}</div>
              <div><span className="font-medium">Risk per Trade:</span> {trading_strategy.short_term.position_sizing.risk_per_trade}</div>
              <div className="mt-2 text-slate-500">{trading_strategy.short_term.rationale}</div>
            </div>
          </div>

          <Separator />

          {/* Medium Term */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-slate-700">Medium Term ({trading_strategy.medium_term.horizon_days} days)</h4>
              <Badge className={getSignalColor(trading_strategy.medium_term.bias)}>
                {trading_strategy.medium_term.bias.toUpperCase()}
              </Badge>
            </div>
            <div className="text-sm text-slate-600 space-y-2">
              <div><span className="font-medium">Entry Range:</span> {trading_strategy.medium_term.entry_strategy.entry_range[0] || 'N/A'} - {trading_strategy.medium_term.entry_strategy.entry_range[1] || 'N/A'}</div>
              <div><span className="font-medium">Stop Loss:</span> {trading_strategy.medium_term.exit_strategy.stop_loss}</div>
              <div><span className="font-medium">Targets:</span> {trading_strategy.medium_term.exit_strategy.targets.map(t => `${t.price} (${t.probability})`).join(', ')}</div>
              <div><span className="font-medium">Risk per Trade:</span> {trading_strategy.medium_term.position_sizing.risk_per_trade}</div>
              <div className="mt-2 text-slate-500">{trading_strategy.medium_term.rationale}</div>
            </div>
          </div>

          <Separator />

          {/* Long Term */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-slate-700">Long Term ({trading_strategy.long_term.horizon_days} days)</h4>
              <Badge className="bg-blue-100 text-blue-700">
                {trading_strategy.long_term.investment_rating.toUpperCase()}
              </Badge>
            </div>
            <div className="text-sm text-slate-600 space-y-2">
              <div><span className="font-medium">Fair Value Range:</span> {trading_strategy.long_term.fair_value_range[0]} - {trading_strategy.long_term.fair_value_range[1]}</div>
              <div><span className="font-medium">Accumulation Zone:</span> {trading_strategy.long_term.key_levels.accumulation_zone[0]} - {trading_strategy.long_term.key_levels.accumulation_zone[1]}</div>
              <div><span className="font-medium">Distribution Zone:</span> {trading_strategy.long_term.key_levels.distribution_zone[0]} - {trading_strategy.long_term.key_levels.distribution_zone[1]}</div>
              <div className="mt-2 text-slate-500">{trading_strategy.long_term.rationale}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Risk Management */}
      <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center text-slate-800">
            <Shield className="h-5 w-5 mr-2 text-orange-500" />
            Risk Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Key Risks */}
          <div>
            <h4 className="font-semibold text-slate-700 mb-2">Key Risks</h4>
            <div className="space-y-2">
              {risk_management.key_risks.map((risk, index) => (
                <div key={index} className="text-sm p-3 bg-red-50 border border-red-200 rounded">
                  <div className="font-medium text-red-800">{risk.risk}</div>
                  <div className="text-red-600">
                    Probability: <span className="font-medium">{risk.probability}</span> | 
                    Impact: <span className="font-medium">{risk.impact}</span>
                  </div>
                  <div className="text-red-700 mt-1">
                    <span className="font-medium">Mitigation:</span> {risk.mitigation}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stop Loss Levels */}
          {risk_management.stop_loss_levels.length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="font-semibold text-slate-700 mb-2">Stop Loss Levels</h4>
                <div className="space-y-2">
                  {risk_management.stop_loss_levels.map((level, index) => (
                    <div key={index} className="text-sm p-2 bg-orange-50 border border-orange-200 rounded">
                      <div className="font-medium text-orange-800">{level.level} ({level.type})</div>
                      <div className="text-orange-700">{level.rationale}</div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Critical Levels */}
      <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center text-slate-800">
            <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
            Critical Levels
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Must Watch Levels */}
          <div>
            <h4 className="font-semibold text-slate-700 mb-2">Must Watch</h4>
            <div className="space-y-2">
              {critical_levels.must_watch.map((level, index) => (
                <div key={index} className="text-sm p-2 bg-red-50 border border-red-200 rounded">
                  <div className="font-medium text-red-800">{level.level} ({level.type})</div>
                  <div className="text-red-600">Significance: {level.significance}</div>
                  <div className="text-red-700">{level.action}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Confirmation Levels */}
          {critical_levels.confirmation_levels.length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="font-semibold text-slate-700 mb-2">Confirmation Levels</h4>
                <div className="space-y-2">
                  {critical_levels.confirmation_levels.map((level, index) => (
                    <div key={index} className="text-sm p-2 bg-blue-50 border border-blue-200 rounded">
                      <div className="font-medium text-blue-800">{level.level} ({level.condition})</div>
                      <div className="text-blue-700">{level.action}</div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Key Takeaways */}
      {key_takeaways.length > 0 && (
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center text-slate-800">
              <Brain className="h-5 w-5 mr-2 text-indigo-500" />
              Key Takeaways
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {key_takeaways.map((takeaway, index) => (
                <div key={index} className="text-sm p-2 bg-indigo-50 border border-indigo-200 rounded">
                  <div className="text-indigo-800">• {takeaway}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AIAnalysisCard; 