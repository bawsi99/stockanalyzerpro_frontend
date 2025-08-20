import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatPercentage, formatConfidence } from '@/utils/numberFormatter'
import { validateNumeric } from '@/utils/dataValidator'

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
          Confidence: {formatConfidence(signals.confidence, '0%')}
          {signals.regime && (
            <span className="ml-3">Regime: {signals.regime.trend || 'unknown'} · {signals.regime.volatility || 'normal'}</span>
          )}
        </div>
        <div className="grid grid-cols-1 gap-6">
          {signals.per_timeframe && signals.per_timeframe.length > 0 ? (
            signals.per_timeframe.map((tf) => (
              <div key={tf.timeframe} className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <div className="font-medium">{tf.timeframe}</div>
                  <Badge className={biasColor(tf.bias)}>
                    {tf.bias} · {formatPercentage(tf.score, false, '0%')} · {formatConfidence(tf.confidence, '0%')}
                  </Badge>
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
              No per-timeframe signals available.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}


