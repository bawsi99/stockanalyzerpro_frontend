import React, { useMemo, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, BarChart3, Activity, Download, LineChart } from "lucide-react";
import { PatternRecognition } from "@/utils/patternRecognition";
import { EnhancedPatternRecognition } from "@/utils/enhancedPatternRecognition";
import { calculateSMA, calculateEMA, calculateRSI, calculateMACD, calculateBollingerBands, filterDataByTimeframe } from "@/utils/chartUtils";
import { PatternMarkers, TrianglePattern, FlagPattern, VolumeAnomalyDetailed, Overlays } from '@/types/analysis';

// Types
interface CombinedChartAnalysisCardProps {
  chartData: Array<{
    date: string;
    time?: number; // Optional for backward compatibility
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }>;
  patternData: {
    date: string[];
    close: number[];
    rsi: number[];
  };
  symbol: string;
  overlays: Overlays;
}

const CombinedChartAnalysisCard: React.FC<CombinedChartAnalysisCardProps> = ({ chartData, patternData, symbol, overlays }) => {
  // --- Technical Indicator Calculations ---
  // Memoize all technical indicator calculations for performance
  const indicators = useMemo(() => {
    const sma20 = calculateSMA(chartData, 20);
    const sma50 = calculateSMA(chartData, 50);
    const sma200 = calculateSMA(chartData, 200);
    const ema20 = calculateEMA(chartData, 20);
    const ema50 = calculateEMA(chartData, 50);
    const rsi = calculateRSI(chartData);
    const macd = calculateMACD(chartData);
    const bollingerBands = calculateBollingerBands(chartData);
    return { sma20, sma50, sma200, ema20, ema50, rsi, macd, bollingerBands };
  }, [chartData]);

  // --- Technical Analysis Chart Data ---
  // Prepare chart data structure for technical analysis chart
  const technicalAnalysisData = useMemo(() => {
    return {
      date: chartData.map(d => d.date),
      time: chartData.map(d => typeof d.time === 'number' ? d.time : Math.floor(new Date(d.date).getTime() / 1000)),
      open: chartData.map(d => d.open),
      high: chartData.map(d => d.high),
      low: chartData.map(d => d.low),
      close: chartData.map(d => d.close),
      volume: chartData.map(d => d.volume),
      sma20: indicators.sma20,
      sma50: indicators.sma50,
      sma200: indicators.sma200,
      upperBB: indicators.bollingerBands.upperBand,
      lowerBB: indicators.bollingerBands.lowerBand,
      macd: indicators.macd.macdLine,
      signal: indicators.macd.signalLine,
      histogram: indicators.macd.histogram,
      rsi: indicators.rsi,
      ema_20: indicators.ema20,
      ema_50: indicators.ema50,
    };
  }, [chartData, indicators]);

  // --- Timeframe Selection ---
  const timeframeOptions = [
    { value: "7d", label: "7D" },
    { value: "30d", label: "30D" },
    { value: "90d", label: "3M" },
    { value: "180d", label: "6M" },
    { value: "1y", label: "1Y" },
    { value: "all", label: "All" },
  ];
  const [selectedTimeframe, setSelectedTimeframe] = useState("all");
  // Filter chart data and recalculate indicators based on selected timeframe
  const filteredChartData = useMemo(() => filterDataByTimeframe(chartData, selectedTimeframe), [chartData, selectedTimeframe]);
  const filteredIndicators = useMemo(() => {
    // Recalculate indicators for filtered data
    const sma20 = calculateSMA(filteredChartData, 20);
    const sma50 = calculateSMA(filteredChartData, 50);
    const sma200 = calculateSMA(filteredChartData, 200);
    const ema20 = calculateEMA(filteredChartData, 20);
    const ema50 = calculateEMA(filteredChartData, 50);
    const rsi = calculateRSI(filteredChartData);
    const macd = calculateMACD(filteredChartData);
    const bollingerBands = calculateBollingerBands(filteredChartData);
    return { sma20, sma50, sma200, ema20, ema50, rsi, macd, bollingerBands };
  }, [filteredChartData]);
  const filteredTechnicalAnalysisData = useMemo(() => {
    // Prepare chart data structure for filtered technical analysis chart
    return {
      date: filteredChartData.map(d => d.date),
      time: filteredChartData.map(d => typeof d.time === 'number' ? d.time : Math.floor(new Date(d.date).getTime() / 1000)),
      open: filteredChartData.map(d => d.open),
      high: filteredChartData.map(d => d.high),
      low: filteredChartData.map(d => d.low),
      close: filteredChartData.map(d => d.close),
      volume: filteredChartData.map(d => d.volume),
      sma20: filteredIndicators.sma20,
      sma50: filteredIndicators.sma50,
      sma200: filteredIndicators.sma200,
      upperBB: filteredIndicators.bollingerBands.upperBand,
      lowerBB: filteredIndicators.bollingerBands.lowerBand,
      macd: filteredIndicators.macd.macdLine,
      signal: filteredIndicators.macd.signalLine,
      histogram: filteredIndicators.macd.histogram,
      rsi: filteredIndicators.rsi,
      ema_20: filteredIndicators.ema20,
      ema_50: filteredIndicators.ema50,
    };
  }, [filteredChartData, filteredIndicators]);

  // --- Pattern Analysis Logic (inline from PatternAnalysisCard) ---
  // Filter pattern data based on selected timeframe
  const filteredPatternData = useMemo(() => {
    if (selectedTimeframe === "all") return patternData;
    // Find indices of patternData.date that are within the selected timeframe
    const filteredIndices = patternData.date
      .map((date, index) => ({ date, index }))
      .filter(({ date }) => new Date(date) >= new Date(filterDataByTimeframe([{ date }], selectedTimeframe)[0]?.date || 0))
      .map(({ index }) => index);
    return {
      date: filteredIndices.map(i => patternData.date[i]),
      close: filteredIndices.map(i => patternData.close[i]),
      rsi: filteredIndices.map(i => patternData.rsi[i]),
    };
  }, [patternData, selectedTimeframe]);

  // Identify peaks and lows in the filtered close data
  const peaksLows = useMemo(() => PatternRecognition.identifyPeaksLows(filteredPatternData.close, 5), [filteredPatternData]);
  // Detect enhanced divergences using close and RSI values
  const enhancedDivergences = useMemo(
    () => EnhancedPatternRecognition.detectEnhancedDivergences(
      filteredPatternData.close,
      filteredPatternData.rsi.filter(val => !isNaN(val)),
      filteredPatternData.date,
      5,
      0.02
    ),
    [filteredPatternData]
  );

  // Create patternMarkers object for overlay
  const patternMarkers: PatternMarkers = useMemo(() => ({
    peaks: peaksLows.peaks,
    lows: peaksLows.lows,
    divergences: enhancedDivergences.map(d => ({
      type: d.type,
      startIdx: d.startIndex,
      endIdx: d.endIndex,
    })),
  }), [peaksLows, enhancedDivergences]);

  // Calculate price statistics for filtered pattern data
  const priceStats = useMemo(() => PatternRecognition.calculatePriceStats(filteredPatternData.close), [filteredPatternData]);

  return (
    <Card className="w-full shadow-xl border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-t-lg flex items-center space-x-2">
        <TrendingUp className="h-6 w-6" />
        <CardTitle className="text-2xl font-bold">Charts & Analysis</CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-10">
        {/* --- Technical Analysis Chart Section --- */}
        <section>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2 gap-2">
            <div className="flex gap-2 flex-wrap">
              {timeframeOptions.map(option => (
                <Button
                  key={option.value}
                  onClick={() => setSelectedTimeframe(option.value)}
                  size="sm"
                  variant={selectedTimeframe === option.value ? "default" : "secondary"}
                  className={selectedTimeframe === option.value ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
          <div className="mt-4">
            {/* Technical Analysis Chart LWC removed */}
          </div>
        </section>
        <Separator className="my-6" />
        {/* --- Enhanced Pattern Analysis Section --- */}
        <section>
            {/* Enhanced Pattern Chart removed */}
          {/* Enhanced Divergence Analysis Summary */}
          {enhancedDivergences.length > 0 && (
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-lg mb-6">
              <h4 className="font-semibold text-indigo-800 mb-3">Advanced Divergence Insights</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="text-center p-3 bg-white rounded border">
                  <div className="text-2xl font-bold text-indigo-600">{enhancedDivergences.length}</div>
                  <div className="text-sm text-gray-600">Total Divergences</div>
                </div>
                <div className="text-center p-3 bg-white rounded border">
                  <div className="text-2xl font-bold text-green-600">
                    {enhancedDivergences.filter(d => d.type === 'bullish').length}
                  </div>
                  <div className="text-sm text-gray-600">Bullish Signals</div>
                </div>
                <div className="text-center p-3 bg-white rounded border">
                  <div className="text-2xl font-bold text-red-600">
                    {enhancedDivergences.filter(d => d.type === 'bearish').length}
                  </div>
                  <div className="text-sm text-gray-600">Bearish Signals</div>
                </div>
              </div>
              <div className="space-y-3">
                <h5 className="font-medium text-slate-700">Strength Distribution:</h5>
                <div className="flex gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-red-50 text-red-700">
                      Strong: {enhancedDivergences.filter(d => d.strength === 'strong').length}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                      Moderate: {enhancedDivergences.filter(d => d.strength === 'moderate').length}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      Weak: {enhancedDivergences.filter(d => d.strength === 'weak').length}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* Price Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-3 flex items-center">
                <BarChart3 className="h-4 w-4 mr-2" /> Price Levels
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Current Price:</span>
                  <span className="font-medium text-blue-700">{priceStats.currentPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">All Time High:</span>
                  <span className="font-medium text-green-700">{priceStats.allTimeHigh.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">All Time Low:</span>
                  <span className="font-medium text-red-700">{priceStats.allTimeLow.toFixed(2)}</span>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg">
              <h4 className="font-semibold text-green-800 mb-3 flex items-center">
                <TrendingUp className="h-4 w-4 mr-2" /> Distance Analysis
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">From High:</span>
                  <span className={`font-medium ${priceStats.distanceFromHighPercent >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    {priceStats.distanceFromHighPercent.toFixed(2)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">From Low:</span>
                  <span className="font-medium text-green-700">
                    +{priceStats.distanceFromLowPercent.toFixed(2)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Range Position:</span>
                  <span className="font-medium text-blue-700">
                    {(((priceStats.currentPrice - priceStats.allTimeLow) / (priceStats.allTimeHigh - priceStats.allTimeLow)) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
          {/* Peaks and Lows Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-red-50 p-4 rounded-lg">
              <h4 className="font-semibold text-red-800 mb-3 flex items-center">
                <TrendingUp className="h-4 w-4 mr-2" /> Identified Peaks
              </h4>
              <div className="text-sm">
                <p className="text-gray-600 mb-2">Total Peaks: <span className="font-medium text-red-700">{peaksLows.peaks.length}</span></p>
                {peaksLows.peaks.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-gray-600">Recent Peaks:</p>
                    {peaksLows.peaks.slice(-3).map((peakIndex, index) => (
                      <div key={index} className="flex justify-between text-xs">
                        <span>{filteredPatternData.date[peakIndex]?.split('T')[0]}</span>
                        <span className="font-medium">{filteredPatternData.close[peakIndex]?.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-semibold text-green-800 mb-3 flex items-center">
                <Activity className="h-4 w-4 mr-2" /> Identified Lows
              </h4>
              <div className="text-sm">
                <p className="text-gray-600 mb-2">Total Lows: <span className="font-medium text-green-700">{peaksLows.lows.length}</span></p>
                {peaksLows.lows.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-gray-600">Recent Lows:</p>
                    {peaksLows.lows.slice(-3).map((lowIndex, index) => (
                      <div key={index} className="flex justify-between text-xs">
                        <span>{filteredPatternData.date[lowIndex]?.split('T')[0]}</span>
                        <span className="font-medium">{filteredPatternData.close[lowIndex]?.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* No Divergences Message */}
          {enhancedDivergences.length === 0 && (
            <div className="text-center text-gray-500 py-4">
              <p>No significant price-RSI divergences detected in the current timeframe.</p>
              <p className="text-sm mt-2">Try adjusting the analysis period or sensitivity settings.</p>
            </div>
          )}
        </section>
      </CardContent>
    </Card>
  );
};

export default CombinedChartAnalysisCard; 