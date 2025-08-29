import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, BarChart3, Target, Activity, Loader2 } from "lucide-react";
import { formatCurrency, formatPercentage, formatPercentageValue, formatPriceChange } from "@/utils/numberFormatter";

interface PriceStatisticsProps {
  summaryStats: {
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
  };
  latestPrice: number | null;
  timeframe?: string;
}

const PriceStatisticsCardOutput: React.FC<PriceStatisticsProps> = ({ 
  summaryStats, 
  latestPrice, 
  timeframe = "All Time" 
}) => {
  const stats = summaryStats || {
    mean: 0,
    max: 0,
    min: 0,
    current: 0,
    distFromMean: 0,
    distFromMax: 0,
    distFromMin: 0,
    distFromMeanPct: 0,
    distFromMaxPct: 0,
    distFromMinPct: 0
  };

  const getPerformanceColor = (value: number | null | undefined) => {
    if (value === null || value === undefined || isNaN(value)) return "text-gray-600";
    if (value > 0) return "text-green-600";
    if (value < 0) return "text-red-600";
    return "text-gray-600";
  };

  const getPerformanceIcon = (value: number | null | undefined) => {
    if (value === null || value === undefined || isNaN(value)) return <BarChart3 className="h-4 w-4 text-gray-600" />;
    if (value > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (value < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <BarChart3 className="h-4 w-4 text-gray-600" />;
  };

  const getPositionInRange = () => {
    const range = stats.max - stats.min;
    if (range === 0) return 50;
    const position = ((stats.current - stats.min) / range) * 100;
    return isNaN(position) ? 50 : Math.max(0, Math.min(100, position));
  };

  if (!summaryStats || stats.current === 0) {
    return (
      <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm h-[99%] flex flex-col">
        <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-t-lg pb-6 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <Target className="h-6 w-6" />
            <CardTitle className="text-xl">Price Statistics</CardTitle>
          </div>
          <div className="text-blue-100 text-sm">
            {timeframe} Analysis
          </div>
        </CardHeader>
        <CardContent className="p-6 pt-0 flex-1 overflow-y-auto max-h-[calc(90vh-200px)] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="text-center text-gray-500">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
            <p>Loading price statistics...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm h-[99%] flex flex-col">
      <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-t-lg pb-6 flex-shrink-0">
        <div className="flex items-center space-x-2">
          <Target className="h-6 w-6" />
          <CardTitle className="text-xl">Price Statistics</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-6 pt-0 flex-1 overflow-y-auto max-h-[calc(90vh-200px)] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <div className="space-y-4 mb-6 mt-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="text-center p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200 mt-2">
              <div className="text-sm text-slate-600 mb-1">Current Price</div>
              <div className="text-xl font-bold text-slate-800">
                {formatCurrency(stats.current)}
              </div>
              {latestPrice && latestPrice !== stats.current && (
                <div className="text-xs text-slate-500 mt-1">
                  Latest: {formatCurrency(latestPrice)}
                </div>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="text-sm text-slate-600 mb-1">All-Time High</div>
              <div className="text-xl font-bold text-green-700">
                {formatCurrency(stats.max)}
              </div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-sm text-slate-600 mb-1">Mean Price</div>
              <div className="text-xl font-bold text-blue-700">
                {formatCurrency(stats.mean)}
              </div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
              <div className="text-sm text-slate-600 mb-1">All-Time Low</div>
              <div className="text-xl font-bold text-red-700">
                {formatCurrency(stats.min)}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-blue-600" />
              <span className="text-slate-700">Deviation from Mean</span>
            </div>
            <div className="text-right">
              <div className={`font-semibold ${getPerformanceColor(stats.distFromMean)}`}>
                {getPerformanceIcon(stats.distFromMean)}
                <span className="ml-1">{formatPriceChange(stats.distFromMean)}</span>
              </div>
              <div className="text-sm text-slate-600">
                {formatPercentageValue(stats.distFromMeanPct)}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <span className="text-slate-700">Distance from High</span>
            </div>
            <div className="text-right">
              <div className={`font-semibold ${getPerformanceColor(stats.distFromMax)}`}>
                {getPerformanceIcon(stats.distFromMax)}
                <span className="ml-1">{formatCurrency(Math.abs(stats.distFromMax))}</span>
              </div>
              <div className="text-sm text-slate-600">
                {formatPercentageValue(stats.distFromMaxPct)}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <TrendingDown className="h-5 w-5 text-red-600" />
              <span className="text-slate-700">Distance from Low</span>
            </div>
            <div className="text-right">
              <div className={`font-semibold ${getPerformanceColor(stats.distFromMin)}`}>
                {getPerformanceIcon(stats.distFromMin)}
                <span className="ml-1">{formatCurrency(stats.distFromMin)}</span>
              </div>
              <div className="text-sm text-slate-600">
                {formatPercentageValue(stats.distFromMinPct)}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="p-4 bg-slate-50 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-slate-600">Current Position</span>
              <span className="font-semibold text-slate-800">
                {getPositionInRange().toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${getPositionInRange()}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>Low ({formatCurrency(stats.min)})</span>
              <span>High ({formatCurrency(stats.max)})</span>
            </div>
          </div>
        </div>

      </CardContent>
    </Card>
  );
};

export default PriceStatisticsCardOutput;


