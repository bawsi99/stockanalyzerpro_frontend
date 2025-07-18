
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Target, Activity } from 'lucide-react';
import { PatternRecognition, PeakLowData, PriceStats } from '@/utils/patternRecognition';
import { EnhancedPatternRecognition, EnhancedDivergenceData } from '@/utils/enhancedPatternRecognition';

interface PatternAnalysisCardProps {
  data: {
    date: string[];
    close: number[];
    rsi: number[];
  };
  symbol: string;
}

const PatternAnalysisCard = ({ data, symbol }: PatternAnalysisCardProps) => {
  // Calculate pattern data
  const peaksLows: PeakLowData = PatternRecognition.identifyPeaksLows(data.close, 5);
  const enhancedDivergences: EnhancedDivergenceData[] = EnhancedPatternRecognition.detectEnhancedDivergences(
    data.close, 
    data.rsi.filter(val => !isNaN(val)), 
    data.date, 
    5,
    0.02
  );
  const priceStats: PriceStats = PatternRecognition.calculatePriceStats(data.close);

  return (
    <Card className="w-full shadow-xl border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-t-lg">
        <div className="flex items-center space-x-2">
          <Activity className="h-6 w-6" />
          <CardTitle className="text-xl">Enhanced Pattern Analysis</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {/* Enhanced Interactive Pattern Chart */}
        {/* Chart removed intentionally */}

        {/* Enhanced Divergence Analysis Summary */}
        {enhancedDivergences.length > 0 && (
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-lg">
            <h3 className="font-semibold text-indigo-800 mb-3">Advanced Divergence Insights</h3>
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
              <h4 className="font-medium text-slate-700">Strength Distribution:</h4>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-3 flex items-center">
              <Target className="h-4 w-4 mr-2" />
              Price Levels
            </h3>
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
            <h3 className="font-semibold text-green-800 mb-3 flex items-center">
              <TrendingUp className="h-4 w-4 mr-2" />
              Distance Analysis
            </h3>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-red-50 p-4 rounded-lg">
            <h3 className="font-semibold text-red-800 mb-3 flex items-center">
              <TrendingUp className="h-4 w-4 mr-2" />
              Identified Peaks
            </h3>
            <div className="text-sm">
              <p className="text-gray-600 mb-2">Total Peaks: <span className="font-medium text-red-700">{peaksLows.peaks.length}</span></p>
              {peaksLows.peaks.length > 0 && (
                <div className="space-y-1">
                  <p className="text-gray-600">Recent Peaks:</p>
                  {peaksLows.peaks.slice(-3).map((peakIndex, index) => (
                    <div key={index} className="flex justify-between text-xs">
                      <span>{data.date[peakIndex]?.split('T')[0]}</span>
                      <span className="font-medium">{data.close[peakIndex]?.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold text-green-800 mb-3 flex items-center">
              <TrendingDown className="h-4 w-4 mr-2" />
              Identified Lows
            </h3>
            <div className="text-sm">
              <p className="text-gray-600 mb-2">Total Lows: <span className="font-medium text-green-700">{peaksLows.lows.length}</span></p>
              {peaksLows.lows.length > 0 && (
                <div className="space-y-1">
                  <p className="text-gray-600">Recent Lows:</p>
                  {peaksLows.lows.slice(-3).map((lowIndex, index) => (
                    <div key={index} className="flex justify-between text-xs">
                      <span>{data.date[lowIndex]?.split('T')[0]}</span>
                      <span className="font-medium">{data.close[lowIndex]?.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {enhancedDivergences.length === 0 && (
          <div className="text-center text-gray-500 py-4">
            <p>No significant price-RSI divergences detected in the current timeframe.</p>
            <p className="text-sm mt-2">Try adjusting the analysis period or sensitivity settings.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PatternAnalysisCard;
