import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target } from "lucide-react";
import { LegacyAIAnalysis, AIAnalysis } from "@/types/analysis";

interface AITradingAnalysisOverviewCardProps {
  aiAnalysis: LegacyAIAnalysis | AIAnalysis | null | undefined;
}

const AITradingAnalysisOverviewCard = ({ aiAnalysis }: AITradingAnalysisOverviewCardProps) => {
  if (!aiAnalysis) {
    return (
      <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm h-full">
        <CardHeader>
          <CardTitle className="flex items-center text-slate-800 text-lg">
            <Target className="h-4 w-4 mr-2 text-green-500" />
            AI Trading Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
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
      <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm h-full">
        <CardHeader>
          <CardTitle className="flex items-center text-slate-800 text-lg">
            <Target className="h-4 w-4 mr-2 text-green-500" />
            AI Trading Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Key Metrics - Compact Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 bg-emerald-50 rounded-lg">
              <div className="text-xl font-bold text-emerald-600">{newAnalysis.meta.overall_confidence}%</div>
              <div className="text-xs text-slate-600">Confidence</div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-xl font-bold text-blue-600">{newAnalysis.market_outlook.primary_trend.direction}</div>
              <div className="text-xs text-slate-600">Primary Trend</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-xl font-bold text-purple-600">{newAnalysis.trading_strategy.short_term.exit_strategy.targets.length}</div>
              <div className="text-xs text-slate-600">Targets</div>
            </div>
          </div>
          
          {/* Trading Strategy Summary */}
          <div className="space-y-3">
            {/* Short Term */}
            <div className="bg-slate-50 rounded-lg p-3">
              <h4 className="font-semibold text-sm text-slate-800 mb-2">Short Term</h4>
              <div className="space-y-1 text-xs">
                <div><span className="font-medium">Bias:</span> {newAnalysis.trading_strategy.short_term.bias}</div>
                <div><span className="font-medium">Entry:</span> {newAnalysis.trading_strategy.short_term.entry_strategy.entry_range[0] || 'N/A'} - {newAnalysis.trading_strategy.short_term.entry_strategy.entry_range[1] || 'N/A'}</div>
                <div><span className="font-medium">Stop Loss:</span> {newAnalysis.trading_strategy.short_term.exit_strategy.stop_loss}</div>
              </div>
            </div>
            
            {/* Medium Term */}
            <div className="bg-slate-50 rounded-lg p-3">
              <h4 className="font-semibold text-sm text-slate-800 mb-2">Medium Term</h4>
              <div className="space-y-1 text-xs">
                <div><span className="font-medium">Bias:</span> {newAnalysis.trading_strategy.medium_term.bias}</div>
                <div><span className="font-medium">Entry:</span> {newAnalysis.trading_strategy.medium_term.entry_strategy.entry_range[0] || 'N/A'} - {newAnalysis.trading_strategy.medium_term.entry_strategy.entry_range[1] || 'N/A'}</div>
                <div><span className="font-medium">Stop Loss:</span> {newAnalysis.trading_strategy.medium_term.exit_strategy.stop_loss}</div>
              </div>
            </div>
            
            {/* Long Term */}
            <div className="bg-slate-50 rounded-lg p-3">
              <h4 className="font-semibold text-sm text-slate-800 mb-2">Long Term</h4>
              <div className="space-y-1 text-xs">
                <div><span className="font-medium">Rating:</span> {newAnalysis.trading_strategy.long_term.investment_rating}</div>
                <div><span className="font-medium">Fair Value:</span> {newAnalysis.trading_strategy.long_term.fair_value_range[0]} - {newAnalysis.trading_strategy.long_term.fair_value_range[1]}</div>
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
    <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm h-full">
      <CardHeader>
        <CardTitle className="flex items-center text-slate-800 text-lg">
          <Target className="h-4 w-4 mr-2 text-green-500" />
          AI Trading Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
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
              <div><span className="font-medium">Entry:</span> {legacyAnalysis.short_term?.entry_range?.[0]} - {legacyAnalysis.short_term?.entry_range?.[1]}</div>
              <div><span className="font-medium">Stop Loss:</span> {legacyAnalysis.short_term?.stop_loss}</div>
              <div><span className="font-medium">Targets:</span> {legacyAnalysis.short_term?.targets?.join(', ')}</div>
            </div>
          </div>
          
          {/* Medium Term */}
          <div className="bg-slate-50 rounded-lg p-3">
            <h4 className="font-semibold text-sm text-slate-800 mb-2">Medium Term</h4>
            <div className="space-y-1 text-xs">
              <div><span className="font-medium">Entry:</span> {legacyAnalysis.medium_term?.entry_range?.[0]} - {legacyAnalysis.medium_term?.entry_range?.[1]}</div>
              <div><span className="font-medium">Stop Loss:</span> {legacyAnalysis.medium_term?.stop_loss}</div>
              <div><span className="font-medium">Targets:</span> {legacyAnalysis.medium_term?.targets?.join(', ')}</div>
            </div>
          </div>
          
          {/* Long Term */}
          <div className="bg-slate-50 rounded-lg p-3">
            <h4 className="font-semibold text-sm text-slate-800 mb-2">Long Term</h4>
            <div className="space-y-1 text-xs">
              <div><span className="font-medium">Rating:</span> {legacyAnalysis.long_term?.investment_rating}</div>
              <div><span className="font-medium">Fair Value:</span> {legacyAnalysis.long_term?.fair_value_range?.[0]} - {legacyAnalysis.long_term?.fair_value_range?.[1]}</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AITradingAnalysisOverviewCard; 