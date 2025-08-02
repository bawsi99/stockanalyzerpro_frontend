import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target } from "lucide-react";
import { LegacyAIAnalysis, AIAnalysis } from "@/types/analysis";

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
        <CardContent className="flex-1 overflow-y-auto space-y-4 pb-4">
          {/* Key Metrics - Compact Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 bg-emerald-50 rounded-lg">
              <div className="text-xl font-bold text-emerald-600">{newAnalysis.meta?.overall_confidence || 0}%</div>
              <div className="text-xs text-slate-600">Confidence</div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-xl font-bold text-blue-600">{newAnalysis.market_outlook?.primary_trend?.direction || 'N/A'}</div>
              <div className="text-xs text-slate-600">Primary Trend</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-xl font-bold text-purple-600">{newAnalysis.trading_strategy?.short_term?.exit_strategy?.targets?.length || 0}</div>
              <div className="text-xs text-slate-600">Targets</div>
            </div>
          </div>
          
          {/* Trading Strategy Summary */}
          <div className="space-y-4">
            {/* Short Term */}
            <div className="bg-slate-50 rounded-lg p-5">
              <h4 className="font-semibold text-base text-slate-800 mb-3">Short Term</h4>
              <div className="space-y-2 text-sm">
                <div><span className="font-medium">Bias:</span> {newAnalysis.trading_strategy?.short_term?.bias || 'N/A'}</div>
                <div><span className="font-medium">Entry:</span> {(newAnalysis.trading_strategy?.short_term?.entry_strategy?.entry_range?.[0] || 0).toFixed(2)} - {(newAnalysis.trading_strategy?.short_term?.entry_strategy?.entry_range?.[1] || 0).toFixed(2)}</div>
                <div><span className="font-medium">Stop Loss:</span> {(newAnalysis.trading_strategy?.short_term?.exit_strategy?.stop_loss || 0).toFixed(2)}</div>
                <div><span className="font-medium">Targets:</span> 
                  {newAnalysis.trading_strategy?.short_term?.exit_strategy?.targets && newAnalysis.trading_strategy.short_term.exit_strategy.targets.length > 0 ? (
                    <span className="text-slate-800">
                      {newAnalysis.trading_strategy.short_term.exit_strategy.targets.map((target, idx) => (
                        <span key={idx}>
                          ₹{(target.price || 0).toFixed(2)}{idx < newAnalysis.trading_strategy.short_term.exit_strategy.targets.length - 1 ? ', ' : ''}
                        </span>
                      ))}
                    </span>
                  ) : (
                    <span className="text-slate-500">No targets available</span>
                  )}
                </div>
              </div>
            </div>
            
            {/* Medium Term */}
            <div className="bg-slate-50 rounded-lg p-5">
              <h4 className="font-semibold text-base text-slate-800 mb-3">Medium Term</h4>
              <div className="space-y-2 text-sm">
                <div><span className="font-medium">Bias:</span> {newAnalysis.trading_strategy?.medium_term?.bias || 'N/A'}</div>
                <div><span className="font-medium">Entry:</span> {(newAnalysis.trading_strategy?.medium_term?.entry_strategy?.entry_range?.[0] || 0).toFixed(2)} - {(newAnalysis.trading_strategy?.medium_term?.entry_strategy?.entry_range?.[1] || 0).toFixed(2)}</div>
                <div><span className="font-medium">Stop Loss:</span> {(newAnalysis.trading_strategy?.medium_term?.exit_strategy?.stop_loss || 0).toFixed(2)}</div>
                <div><span className="font-medium">Targets:</span> 
                  {newAnalysis.trading_strategy?.medium_term?.exit_strategy?.targets && newAnalysis.trading_strategy.medium_term.exit_strategy.targets.length > 0 ? (
                    <span className="text-slate-800">
                      {newAnalysis.trading_strategy.medium_term.exit_strategy.targets.map((target, idx) => (
                        <span key={idx}>
                          ₹{(target.price || 0).toFixed(2)}{idx < newAnalysis.trading_strategy.medium_term.exit_strategy.targets.length - 1 ? ', ' : ''}
                        </span>
                      ))}
                    </span>
                  ) : (
                    <span className="text-slate-500">No targets available</span>
                  )}
                </div>
              </div>
            </div>
            
            {/* Long Term */}
            <div className="bg-slate-50 rounded-lg p-5">
              <h4 className="font-semibold text-base text-slate-800 mb-3">Long Term</h4>
              <div className="space-y-2 text-sm">
                <div><span className="font-medium">Rating:</span> {newAnalysis.trading_strategy?.long_term?.investment_rating || 'N/A'}</div>
                <div><span className="font-medium">Fair Value:</span> {(newAnalysis.trading_strategy?.long_term?.fair_value_range?.[0] || 0).toFixed(2)} - {(newAnalysis.trading_strategy?.long_term?.fair_value_range?.[1] || 0).toFixed(2)}</div>
                <div><span className="font-medium">Accumulation:</span> {(newAnalysis.trading_strategy?.long_term?.key_levels?.accumulation_zone?.[0] || 0).toFixed(2)} - {(newAnalysis.trading_strategy?.long_term?.key_levels?.accumulation_zone?.[1] || 0).toFixed(2)}</div>
              </div>
            </div>
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
        
        {/* Key Metrics - Compact Grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 bg-emerald-50 rounded-lg">
            <div className="text-xl font-bold text-emerald-600">{legacyAnalysis.confidence_pct}%</div>
            <div className="text-xs text-slate-600">Confidence</div>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-xl font-bold text-blue-600">{legacyAnalysis.trend}</div>
            <div className="text-xs text-slate-600">Trend</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-xl font-bold text-purple-600">{legacyAnalysis.short_term?.targets?.length || 0}</div>
            <div className="text-xs text-slate-600">Targets</div>
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