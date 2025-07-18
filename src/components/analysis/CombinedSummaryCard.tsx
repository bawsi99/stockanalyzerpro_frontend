import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Target, AlertTriangle } from "lucide-react";
import { AnalysisData } from "@/types/analysis";

interface CombinedSummaryCardProps {
  consensus: AnalysisData["consensus"];
  indicators: AnalysisData["indicators"];
  aiAnalysis: AnalysisData["ai_analysis"];
  latestPrice: number | null;
  summaryStats?: {
    mean: number;
    max: number;
    min: number;
    current: number;
    distFromMean: number;
    distFromMax: number;
    distFromMin: number;
    distFromMeanPct: number;
    distFromMaxPct: number;
    distFromMinPct: number;
  } | null;
}

const formatNumber = (value: number | null | undefined, digits = 2) =>
  value != null && Number.isFinite(value) ? value.toFixed(digits) : "N/A";

// Reusable metric card component
const MetricCard = ({
  label,
  value,
  valueClass = '',
  subLabel,
  bg = '',
  valuePrefix = '',
  valueSuffix = '',
  children,
}: {
  label: string;
  value: React.ReactNode;
  valueClass?: string;
  subLabel?: React.ReactNode;
  bg?: string;
  valuePrefix?: string;
  valueSuffix?: string;
  children?: React.ReactNode;
}) => (
  <div className={`flex flex-col items-center justify-center p-3 rounded ${bg}`}>
    <span className="text-sm text-slate-600">{label}</span>
    <span className={`font-medium text-lg ${valueClass}`}>{valuePrefix}{value}{valueSuffix}</span>
    {subLabel && <span className="text-xs text-slate-500">{subLabel}</span>}
    {children}
  </div>
);

const CombinedSummaryCard = ({ consensus, indicators, aiAnalysis, latestPrice, summaryStats }: CombinedSummaryCardProps) => {
  return (
    <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader className="bg-gradient-to-r from-emerald-500 to-blue-500 text-white rounded-t-lg">
        <div className="flex items-center space-x-2">
          <TrendingUp className="h-6 w-6" />
          <CardTitle className="text-xl">Analysis Summary</CardTitle>
        </div>
        <CardDescription className="text-emerald-100">
          Comprehensive snapshot of current analysis
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        {/* AI Analysis & Sentiment (moved to first row) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="flex flex-col items-center justify-center bg-blue-50 p-3 rounded">
            <span className="text-sm text-slate-600">AI Trend</span>
            <span className="font-medium text-blue-700 text-lg">{aiAnalysis?.trend ?? "-"}</span>
            <span className="text-xs text-slate-500">{formatNumber(aiAnalysis?.confidence_pct,1)}% confidence</span>
          </div>
          {/* Market Sentiment */}
          <div className="flex flex-col items-center justify-center bg-slate-50 p-3 rounded space-y-1">
            <span className="text-sm text-slate-600">Market Sentiment</span>
            <div className="flex gap-3 text-xs">
              <div className="text-center">
                <div className="text-emerald-600 font-semibold">{formatNumber(consensus?.bullish_percentage,1)}%</div>
                <div className="text-slate-500">Bull</div>
              </div>
              <div className="text-center">
                <div className="text-red-600 font-semibold">{formatNumber(consensus?.bearish_percentage,1)}%</div>
                <div className="text-slate-500">Bear</div>
              </div>
              <div className="text-center">
                <div className="text-yellow-600 font-semibold">{formatNumber(consensus?.neutral_percentage,1)}%</div>
                <div className="text-slate-500">Neutral</div>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center bg-orange-50 p-3 rounded">
            <span className="text-sm text-slate-600">Investment Rating</span>
            <span className="font-medium text-orange-700 text-lg">{aiAnalysis?.long_term?.investment_rating ?? "-"}</span>
            <span className="text-xs text-slate-500">{aiAnalysis?.long_term?.horizon_days ?? "-"} days</span>
          </div>
          <div className="flex flex-col items-center justify-center bg-green-50 p-3 rounded">
            <span className="text-sm text-slate-600">Short Term Target</span>
            <span className="font-medium text-green-700 text-lg">₹{aiAnalysis?.short_term?.targets?.[0] ?? "-"}</span>
            <span className="text-xs text-slate-500">{aiAnalysis?.short_term?.horizon_days ?? "-"} days</span>
          </div>
        </div>

        {/* Key Metrics Section */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 gap-4">
          <MetricCard label="Current Price" value={`₹${formatNumber(latestPrice)}`} valueClass="font-semibold text-slate-900 text-2xl" bg="bg-slate-100 shadow-inner" />
          <MetricCard label="SMA 20" value={`₹${formatNumber(indicators?.moving_averages?.sma_20)}`} valueClass="text-slate-800" bg="bg-slate-50" />
          <MetricCard label="SMA 50" value={`₹${formatNumber(indicators?.moving_averages?.sma_50)}`} valueClass="text-blue-700" bg="bg-blue-50" />
          <MetricCard label="RSI (14)" value={formatNumber(indicators?.rsi?.rsi_14)} valueClass="text-emerald-700" bg="bg-emerald-50" />
          <MetricCard label="MACD" value={formatNumber(indicators?.macd?.macd_line)} valueClass="text-purple-700" bg="bg-purple-50" />
          <MetricCard label="EMA 20" value={`₹${formatNumber(indicators?.moving_averages?.ema_20)}`} valueClass="text-indigo-700" bg="bg-indigo-50" />
          <MetricCard label="EMA 50" value={`₹${formatNumber(indicators?.moving_averages?.ema_50)}`} valueClass="text-indigo-700" bg="bg-indigo-50" />
          <MetricCard label="OBV Trend" value={indicators?.volume?.obv_trend ?? "-"} valueClass="text-amber-700 capitalize" bg="bg-amber-50" />
          <MetricCard label="ADX" value={formatNumber(indicators?.adx?.adx)} valueClass="text-teal-700" bg="bg-teal-50" />
        </div>

        {/* --- Distance from Mean, Peak, and Lowest Value Section --- */}
        {summaryStats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <MetricCard
              label="Distance from Mean"
              value={`${summaryStats.distFromMean >= 0 ? '+' : ''}${formatNumber(summaryStats.distFromMean)} (${summaryStats.distFromMeanPct >= 0 ? '+' : ''}${formatNumber(summaryStats.distFromMeanPct, 2)}%)`}
              valueClass="text-blue-700"
              bg="bg-blue-50"
              subLabel={`Mean: ₹${formatNumber(summaryStats.mean)}`}
            />
            <MetricCard
              label="Distance from Peak (High)"
              value={`${summaryStats.distFromMax >= 0 ? '+' : ''}${formatNumber(summaryStats.distFromMax)} (${summaryStats.distFromMaxPct >= 0 ? '+' : ''}${formatNumber(summaryStats.distFromMaxPct, 2)}%)`}
              valueClass="text-green-700"
              bg="bg-green-50"
              subLabel={`Peak: ₹${formatNumber(summaryStats.max)}`}
            />
            <MetricCard
              label="Distance from Lowest"
              value={`${summaryStats.distFromMin >= 0 ? '+' : ''}${formatNumber(summaryStats.distFromMin)} (${summaryStats.distFromMinPct >= 0 ? '+' : ''}${formatNumber(summaryStats.distFromMinPct, 2)}%)`}
              valueClass="text-red-700"
              bg="bg-red-50"
              subLabel={`Lowest: ₹${formatNumber(summaryStats.min)}`}
            />
          </div>
        )}

        {/* Key Risk Warning */}
        {aiAnalysis?.risks?.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <span className="font-semibold text-red-700">Key Risk</span>
            </div>
            <p className="text-sm text-red-600">{aiAnalysis?.risks?.[0]}</p>
          </div>
        )}

        {/* Top Signal Details */}
        <div className="space-y-2">
          <h4 className="font-semibold text-slate-700">Top Signal Details</h4>
          {consensus.signal_details.slice(0,3).map((detail, index) => (
            <div key={index} className="flex items-center justify-between bg-slate-50 p-3 rounded">
              <div className="flex-1">
                <div className="font-medium text-slate-800">{detail?.indicator ?? "-"}</div>
                <div className="text-sm text-slate-600">{detail?.description ?? "-"}</div>
              </div>
              <Badge
                variant="secondary"
                className={`ml-2 ${detail?.signal === "bullish" ? "bg-emerald-100 text-emerald-700" : detail?.signal === "bearish" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}
              >
                {detail?.signal?.toUpperCase() ?? "-"}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default CombinedSummaryCard; 