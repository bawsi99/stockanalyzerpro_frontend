import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatPercentage, formatConfidence } from '@/utils/numberFormatter'
import { validateNumeric } from '@/utils/dataValidator'
import { AlertCircle, TrendingUp, TrendingDown, Activity, HelpCircle } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

type Reason = { indicator: string; description: string; weight: number; bias: 'bullish'|'bearish'|'neutral' }
type TimeframeScore = { timeframe: string; score: number; confidence: number; bias: string; reasons: Reason[] }

export default function SignalsSummaryCard({ signals }: { signals: {
  consensus_score: number;
  consensus_bias: string;
  confidence: number;
  per_timeframe: TimeframeScore[];
  regime?: { trend?: string; volatility?: string };
} | null }) {
  if (!signals) return null
  
  const biasColor = (b: string) => b === 'bullish' ? 'bg-green-100 text-green-800' : b === 'bearish' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
  
  // Enhanced regime display with better fallbacks and visual indicators
  const getRegimeDisplay = () => {
    const trend = signals.regime?.trend || 'unknown';
    const volatility = signals.regime?.volatility || 'normal';
    
    // Debug logging to see what regime data we're receiving
    console.log('Regime data received:', { trend, volatility, fullRegime: signals.regime });
    
    // Check if we have meaningful regime data
    const hasRegimeData = trend !== 'unknown' || volatility !== 'normal';
    
    // Only show "pending" if we truly have no regime information
    if (!hasRegimeData) {
      return (
        <div className="flex items-center space-x-2 text-amber-600">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">Regime analysis pending - analyzing market conditions...</span>
        </div>
      );
    }
    
    const trendIcon = trend === 'bullish' ? <TrendingUp className="h-4 w-4" /> : 
                     trend === 'bearish' ? <TrendingDown className="h-4 w-4" /> : 
                     <Activity className="h-4 w-4" />;
    
    const trendColor = trend === 'bullish' ? 'text-green-600' : 
                      trend === 'bearish' ? 'text-red-600' : 'text-slate-600';
    
    const volatilityColor = volatility === 'high' ? 'text-red-600' : 
                           volatility === 'medium' ? 'text-yellow-600' : 'text-green-600';
    
    return (
      <div className="flex items-center space-x-3">
        <span className="text-sm text-slate-600">Regime:</span>
        <div className="flex items-center space-x-1">
          {trendIcon}
          <span className={`font-medium ${trendColor}`}>
            {trend === 'unknown' ? 'analyzing...' : trend}
          </span>
        </div>
        <span className="text-slate-400">·</span>
        <span className={`font-medium ${volatilityColor}`}>
          {volatility === 'high' ? 'high volatility' : 
           volatility === 'medium' ? 'moderate volatility' : 
           volatility === 'low' ? 'low volatility' :
           volatility === 'normal' ? 'stable volatility' : 'analyzing...'}
        </span>
      </div>
    );
  };
  
  return (
    <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm h-[99%] flex flex-col">
      <CardHeader className="pb-8 flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle>Deterministic Signals</CardTitle>
          <Badge className={biasColor(signals.consensus_bias)}>
            {signals.consensus_bias} · {formatPercentage(signals.consensus_score, false, '0%')}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-6 pt-0 flex-1 overflow-y-auto max-h-[calc(90vh-200px)] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <div className="text-sm text-slate-600 mb-8">
          <div className="flex items-center justify-between">
            <span>Confidence: {formatConfidence(signals.confidence, '0%')}</span>
            {getRegimeDisplay()}
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6">
          {signals.per_timeframe && signals.per_timeframe.length > 0 ? (
            signals.per_timeframe.map((tf) => (
              <div key={tf.timeframe} className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <div className="font-medium">{tf.timeframe}</div>
                  <div className="flex items-center">
                    <Badge className={biasColor(tf.bias)}>
                      {tf.bias} · {formatPercentage(tf.score, false, '0%')} · {formatConfidence(tf.confidence, '0%')}
                    </Badge>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-3 w-3 ml-1 text-slate-400 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-[300px]">
                          <p className="text-xs">
                            <span className="font-bold">Direction</span> · <span className="font-bold">Strength</span> · <span className="font-bold">Confidence</span>
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
                <ul className="list-disc list-inside text-sm text-slate-700 space-y-1">
                  {tf.reasons.slice(0, 5).map((r, idx) => (
                    <li key={idx}><span className="font-semibold">{r.indicator}:</span> {r.description}</li>
                  ))}
                </ul>
              </div>
            ))
          ) : (
            <div className="col-span-1 md:col-span-2 border rounded-lg p-4 text-sm text-slate-600 bg-slate-50">
              <div className="flex items-center space-x-2">
                <Activity className="h-4 w-4" />
                <span>Analyzing market signals across timeframes...</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}


