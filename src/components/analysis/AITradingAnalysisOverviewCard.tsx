import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target, Clock, Activity, TrendingUp } from "lucide-react";
import { LegacyAIAnalysis, AIAnalysis } from "@/types/analysis";
import { formatCurrency } from "@/utils/numberFormatter";

interface AITradingAnalysisOverviewCardProps {
  aiAnalysis: LegacyAIAnalysis | AIAnalysis | null | undefined;
  analysisDate?: string;
  analysisPeriod?: string;
  indicatorSummary?: string;
}

const AITradingAnalysisOverviewCard = ({ aiAnalysis, analysisDate, analysisPeriod, indicatorSummary }: AITradingAnalysisOverviewCardProps) => {
  if (!aiAnalysis) {
    return (
      <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm h-[99%] flex flex-col">
        <CardHeader className="flex-shrink-0">
          <CardTitle className="flex items-center text-slate-800 text-lg">
            <Target className="h-4 w-4 mr-2 text-green-500" />
            AI Trading Analysis
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
          <p className="text-slate-500">No AI analysis data available</p>
        </CardContent>
      </Card>
    );
  }

  // Check if it's legacy AI analysis format
  const isLegacyFormat = aiAnalysis && typeof aiAnalysis === 'object' && 'confidence_pct' in aiAnalysis;

  const getSignalColor = (signal: string) => {
    const s = (signal || 'neutral').toLowerCase();
    if (s === 'bullish') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (s === 'bearish') return 'bg-red-100 text-red-700 border-red-200';
    return 'bg-yellow-100 text-yellow-700 border-yellow-200';
  };

  if (!isLegacyFormat) {
    // Handle new AI analysis format
    const newAnalysis = aiAnalysis as AIAnalysis;
    return (
      <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm h-[99%] flex flex-col">
        <CardHeader className="flex-shrink-0">
          <CardTitle className="flex items-center text-slate-800 text-lg">
            <Target className="h-4 w-4 mr-2 text-green-500" />
            AI Trading Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto space-y-5 pb-4">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-3 bg-emerald-50 rounded-lg">
              <div className="text-xl font-bold text-emerald-600">{newAnalysis.meta?.overall_confidence || 0}%</div>
              <div className="text-xs text-slate-600">Confidence</div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-xl font-bold text-blue-600">{newAnalysis.market_outlook?.primary_trend?.direction || 'N/A'}</div>
              <div className="text-xs text-slate-600">Primary Trend</div>
            </div>
          </div>

          {/* Trading Strategy (styled like Enhanced card) */}
          <div className="grid grid-cols-1 gap-4">
            {/* Short Term */}
            {newAnalysis.trading_strategy?.short_term && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-3 rounded-lg border border-green-200">
                <h4 className="font-medium text-green-800 mb-3 flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  Short Term ({newAnalysis.trading_strategy.short_term.horizon_days || 0} days)
                </h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-slate-600">Bias:</span>
                    <Badge className={`ml-2 ${getSignalColor(newAnalysis.trading_strategy.short_term.bias || 'neutral')}`}>{newAnalysis.trading_strategy.short_term.bias || 'Neutral'}</Badge>
                  </div>
                  {newAnalysis.trading_strategy.short_term.entry_strategy && (
                    <div>
                      <span className="text-slate-600">Entry Range:</span>
                      <div className="text-slate-800 font-medium">
                        {formatCurrency(newAnalysis.trading_strategy.short_term.entry_strategy.entry_range?.[0] || 0)} - {formatCurrency(newAnalysis.trading_strategy.short_term.entry_strategy.entry_range?.[1] || 0)}
                      </div>
                    </div>
                  )}
                  {newAnalysis.trading_strategy.short_term.exit_strategy && (
                    <div className="flex flex-wrap items-center gap-x-4">
                      <div>
                        <span className="text-slate-600">Stop Loss:</span>
                        <span className="ml-1 text-slate-800 font-medium">{formatCurrency(newAnalysis.trading_strategy.short_term.exit_strategy.stop_loss || 0)}</span>
                      </div>
                      <div>
                        <span className="text-slate-600">Targets:</span>
                        <span className="ml-1 text-slate-800 font-medium">
                          {newAnalysis.trading_strategy.short_term.exit_strategy.targets && newAnalysis.trading_strategy.short_term.exit_strategy.targets.length > 0 ? (
                            newAnalysis.trading_strategy.short_term.exit_strategy.targets.map((t, idx) => (
                              <span key={idx}>
                                {formatCurrency(t.price || 0)}{idx < newAnalysis.trading_strategy.short_term.exit_strategy.targets.length - 1 ? ', ' : ''}
                              </span>
                            ))
                          ) : (
                            'No targets available'
                          )}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Medium Term */}
            {newAnalysis.trading_strategy?.medium_term && (
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-3 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-800 mb-3 flex items-center">
                  <Activity className="h-4 w-4 mr-1" />
                  Medium Term ({newAnalysis.trading_strategy.medium_term.horizon_days || 0} days)
                </h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-slate-600">Bias:</span>
                    <Badge className={`ml-2 ${getSignalColor(newAnalysis.trading_strategy.medium_term.bias || 'neutral')}`}>{newAnalysis.trading_strategy.medium_term.bias || 'Neutral'}</Badge>
                  </div>
                  {newAnalysis.trading_strategy.medium_term.entry_strategy && (
                    <div>
                      <span className="text-slate-600">Entry Range:</span>
                      <div className="text-slate-800 font-medium">
                        {formatCurrency(newAnalysis.trading_strategy.medium_term.entry_strategy.entry_range?.[0] || 0)} - {formatCurrency(newAnalysis.trading_strategy.medium_term.entry_strategy.entry_range?.[1] || 0)}
                      </div>
                    </div>
                  )}
                  {newAnalysis.trading_strategy.medium_term.exit_strategy && (
                    <div className="flex flex-wrap items-center gap-x-4">
                      <div>
                        <span className="text-slate-600">Stop Loss:</span>
                        <span className="ml-1 text-slate-800 font-medium">{formatCurrency(newAnalysis.trading_strategy.medium_term.exit_strategy.stop_loss || 0)}</span>
                      </div>
                      <div>
                        <span className="text-slate-600">Targets:</span>
                        <span className="ml-1 text-slate-800 font-medium">
                          {newAnalysis.trading_strategy.medium_term.exit_strategy.targets && newAnalysis.trading_strategy.medium_term.exit_strategy.targets.length > 0 ? (
                            newAnalysis.trading_strategy.medium_term.exit_strategy.targets.map((t, idx) => (
                              <span key={idx}>
                                {formatCurrency(t.price || 0)}{idx < newAnalysis.trading_strategy.medium_term.exit_strategy.targets.length - 1 ? ', ' : ''}
                              </span>
                            ))
                          ) : (
                            'No targets available'
                          )}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Long Term */}
            {newAnalysis.trading_strategy?.long_term && (
              <div className="bg-gradient-to-r from-purple-50 to-violet-50 p-3 rounded-lg border border-purple-200">
                <h4 className="font-medium text-purple-800 mb-3 flex items-center">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  Long Term ({newAnalysis.trading_strategy.long_term.horizon_days || 0} days)
                </h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-slate-600">Rating:</span>
                    <Badge className="ml-2 bg-purple-100 text-purple-700">{newAnalysis.trading_strategy.long_term.investment_rating || 'N/A'}</Badge>
                  </div>
                  {newAnalysis.trading_strategy.long_term.fair_value_range && (
                    <div>
                      <span className="text-slate-600">Fair Value:</span>
                      <div className="text-slate-800 font-medium">
                        {formatCurrency(newAnalysis.trading_strategy.long_term.fair_value_range[0] || 0)} - {formatCurrency(newAnalysis.trading_strategy.long_term.fair_value_range[1] || 0)}
                      </div>
                    </div>
                  )}
                  {newAnalysis.trading_strategy.long_term.key_levels?.accumulation_zone && (
                    <div>
                      <span className="text-slate-600">Accumulation:</span>
                      <div className="text-slate-800 font-medium">
                        {formatCurrency(newAnalysis.trading_strategy.long_term.key_levels.accumulation_zone[0] || 0)} - {formatCurrency(newAnalysis.trading_strategy.long_term.key_levels.accumulation_zone[1] || 0)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Type guard to ensure we have legacy format data
  const legacyAnalysis = aiAnalysis as LegacyAIAnalysis;
  
  return (
    <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm h-[90%] flex flex-col">
      <CardHeader className="flex-shrink-0">
        <CardTitle className="flex items-center text-slate-800 text-lg">
          <Target className="h-4 w-4 mr-2 text-green-500" />
          AI Trading Analysis
        </CardTitle>
      </CardHeader>
              <CardContent className="flex-1 overflow-y-auto space-y-4 pb-4">
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
        
        {/* Key Metrics - Compact Grid (Targets removed) */}
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-3 bg-emerald-50 rounded-lg">
            <div className="text-xl font-bold text-emerald-600">{legacyAnalysis.confidence_pct}%</div>
            <div className="text-xs text-slate-600">Confidence</div>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-xl font-bold text-blue-600">{legacyAnalysis.trend}</div>
            <div className="text-xs text-slate-600">Trend</div>
          </div>
        </div>
        
        {/* Trading Levels - Compact Cards */}
        <div className="space-y-3">
          {/* Short Term */}
          <div className="bg-slate-50 rounded-lg p-3">
            <h4 className="font-semibold text-sm text-slate-800 mb-2">Short Term</h4>
            <div className="space-y-1 text-xs">
              <div><span className="font-medium">Entry:</span> {(legacyAnalysis.short_term?.entry_range?.[0] || 0).toFixed(2)} - {(legacyAnalysis.short_term?.entry_range?.[1] || 0).toFixed(2)}</div>
              <div><span className="font-medium">Stop Loss:</span> {(legacyAnalysis.short_term?.stop_loss || 0).toFixed(2)}</div>
              <div><span className="font-medium">Targets:</span> {(legacyAnalysis.short_term?.targets || []).join(', ')}</div>
            </div>
          </div>
          
          {/* Medium Term */}
          <div className="bg-slate-50 rounded-lg p-3">
            <h4 className="font-semibold text-sm text-slate-800 mb-2">Medium Term</h4>
            <div className="space-y-1 text-xs">
              <div><span className="font-medium">Entry:</span> {(legacyAnalysis.medium_term?.entry_range?.[0] || 0).toFixed(2)} - {(legacyAnalysis.medium_term?.entry_range?.[1] || 0).toFixed(2)}</div>
              <div><span className="font-medium">Stop Loss:</span> {(legacyAnalysis.medium_term?.stop_loss || 0).toFixed(2)}</div>
              <div><span className="font-medium">Targets:</span> {(legacyAnalysis.medium_term?.targets || []).join(', ')}</div>
            </div>
          </div>
          
          {/* Long Term */}
          <div className="bg-slate-50 rounded-lg p-3">
            <h4 className="font-semibold text-sm text-slate-800 mb-2">Long Term</h4>
            <div className="space-y-1 text-xs">
              <div><span className="font-medium">Rating:</span> {legacyAnalysis.long_term?.investment_rating}</div>
              <div><span className="font-medium">Fair Value:</span> {(legacyAnalysis.long_term?.fair_value_range?.[0] || 0).toFixed(2)} - {(legacyAnalysis.long_term?.fair_value_range?.[1] || 0).toFixed(2)}</div>
              <div><span className="font-medium">Accumulation:</span> {(legacyAnalysis.long_term?.key_levels?.accumulation_zone?.[0] || 0).toFixed(2)} - {(legacyAnalysis.long_term?.key_levels?.accumulation_zone?.[1] || 0).toFixed(2)}</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AITradingAnalysisOverviewCard;
