import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, BarChart3, Target, Activity } from "lucide-react";

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

const PriceStatisticsCard: React.FC<PriceStatisticsProps> = ({ 
  summaryStats, 
  latestPrice, 
  timeframe = "All Time" 
}) => {
  const getPerformanceColor = (value: number) => {
    if (value > 0) return "text-green-600";
    if (value < 0) return "text-red-600";
    return "text-gray-600";
  };

  const getPerformanceIcon = (value: number) => {
    if (value > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (value < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <BarChart3 className="h-4 w-4 text-gray-600" />;
  };

  const getPositionInRange = () => {
    const range = summaryStats.max - summaryStats.min;
    if (range === 0) return 50; // If max and min are the same
    return ((summaryStats.current - summaryStats.min) / range) * 100;
  };

  const formatCurrency = (value: number) => {
    return `₹${value.toFixed(2)}`;
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  return (
    <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-t-lg">
        <div className="flex items-center space-x-2">
          <Target className="h-6 w-6" />
          <CardTitle className="text-xl">Price Statistics</CardTitle>
        </div>
        <div className="text-blue-100 text-sm">
          {timeframe} Analysis
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {/* Current Price Highlight */}
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
          <div className="text-center">
            <div className="text-sm text-slate-600 mb-1">Current Price</div>
            <div className="text-3xl font-bold text-slate-800">
              {formatCurrency(summaryStats.current)}
            </div>
            {latestPrice && latestPrice !== summaryStats.current && (
              <div className="text-sm text-slate-500 mt-1">
                Latest: {formatCurrency(latestPrice)}
              </div>
            )}
          </div>
        </div>

        {/* Key Price Levels */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="text-sm text-slate-600 mb-1">All-Time High</div>
            <div className="text-xl font-bold text-green-700">
              {formatCurrency(summaryStats.max)}
            </div>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-sm text-slate-600 mb-1">Mean Price</div>
            <div className="text-xl font-bold text-blue-700">
              {formatCurrency(summaryStats.mean)}
            </div>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
            <div className="text-sm text-slate-600 mb-1">All-Time Low</div>
            <div className="text-xl font-bold text-red-700">
              {formatCurrency(summaryStats.min)}
            </div>
          </div>
        </div>

        {/* Distance Metrics */}
        <div className="space-y-4 mb-6">
          <h4 className="font-semibold text-slate-800 text-lg">Distance Analysis</h4>
          
          {/* Deviation from Mean */}
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-blue-600" />
              <span className="text-slate-700">Deviation from Mean</span>
            </div>
            <div className="text-right">
              <div className={`font-semibold ${getPerformanceColor(summaryStats.distFromMean)}`}>
                {getPerformanceIcon(summaryStats.distFromMean)}
                <span className="ml-1">{formatCurrency(summaryStats.distFromMean)}</span>
              </div>
              <div className="text-sm text-slate-600">
                {formatPercentage(summaryStats.distFromMeanPct)}
              </div>
            </div>
          </div>

          {/* Distance from High */}
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <span className="text-slate-700">Distance from High</span>
            </div>
            <div className="text-right">
              <div className={`font-semibold ${getPerformanceColor(summaryStats.distFromMax)}`}>
                {getPerformanceIcon(summaryStats.distFromMax)}
                <span className="ml-1">{formatCurrency(summaryStats.distFromMax)}</span>
              </div>
              <div className="text-sm text-slate-600">
                {formatPercentage(summaryStats.distFromMaxPct)}
              </div>
            </div>
          </div>

          {/* Distance from Low */}
          <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <TrendingDown className="h-5 w-5 text-red-600" />
              <span className="text-slate-700">Distance from Low</span>
            </div>
            <div className="text-right">
              <div className={`font-semibold ${getPerformanceColor(summaryStats.distFromMin)}`}>
                {getPerformanceIcon(summaryStats.distFromMin)}
                <span className="ml-1">{formatCurrency(summaryStats.distFromMin)}</span>
              </div>
              <div className="text-sm text-slate-600">
                {formatPercentage(summaryStats.distFromMinPct)}
              </div>
            </div>
          </div>
        </div>

        {/* Position in Range */}
        <div className="space-y-3">
          <h4 className="font-semibold text-slate-800 text-lg">Position in Range</h4>
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
              <span>Low ({formatCurrency(summaryStats.min)})</span>
              <span>High ({formatCurrency(summaryStats.max)})</span>
            </div>
          </div>
        </div>

        {/* Quick Insights */}
        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <h4 className="font-semibold text-amber-800 mb-2">Quick Insights</h4>
          <div className="space-y-2 text-sm text-amber-700">
            {summaryStats.current > summaryStats.mean ? (
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4" />
                <span>Price is above the mean, indicating bullish momentum</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <TrendingDown className="h-4 w-4" />
                <span>Price is below the mean, indicating bearish pressure</span>
              </div>
            )}
            
            {getPositionInRange() > 80 ? (
              <div className="flex items-center space-x-2">
                <Target className="h-4 w-4" />
                <span>Near all-time high - consider profit booking</span>
              </div>
            ) : getPositionInRange() < 20 ? (
              <div className="flex items-center space-x-2">
                <Target className="h-4 w-4" />
                <span>Near all-time low - potential accumulation zone</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-4 w-4" />
                <span>Mid-range position - monitor for breakout/breakdown</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PriceStatisticsCard; 