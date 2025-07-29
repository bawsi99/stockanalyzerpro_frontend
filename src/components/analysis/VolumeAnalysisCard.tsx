import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle, XCircle, BarChart3 } from 'lucide-react';

interface VolumeAnalysisCardProps {
  volumeData?: any;
  priceData?: any[];
  symbol: string;
}

const VolumeAnalysisCard: React.FC<VolumeAnalysisCardProps> = ({ volumeData, priceData, symbol }) => {
  // Extract volume information from the data
  const volumeRatio = volumeData?.volume_ratio || 1;
  const obv = volumeData?.obv || 0;
  const obvTrend = volumeData?.obv_trend || 'neutral';
  
  // Calculate basic volume metrics from price data if available
  const calculateVolumeMetrics = () => {
    if (!priceData || priceData.length === 0) return null;
    
    const volumes = priceData.map(d => d.volume || 0).filter(v => v > 0);
    if (volumes.length === 0) return null;
    
    const avgVolume = volumes.reduce((sum, vol) => sum + vol, 0) / volumes.length;
    const recentVolumes = volumes.slice(-5); // Last 5 periods
    const recentAvgVolume = recentVolumes.reduce((sum, vol) => sum + vol, 0) / recentVolumes.length;
    
    return {
      averageVolume: avgVolume,
      recentAverageVolume: recentAvgVolume,
      volumeTrend: recentAvgVolume > avgVolume ? 'up' : recentAvgVolume < avgVolume ? 'down' : 'neutral',
      volumeRatio: recentAvgVolume / avgVolume
    };
  };

  const volumeMetrics = calculateVolumeMetrics();

  const getTrendIcon = (trend: string) => {
    switch (trend.toLowerCase()) {
      case 'up':
      case 'bullish':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down':
      case 'bearish':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const getVolumeRatioColor = (ratio: number) => {
    if (ratio > 1.5) return 'text-green-600';
    if (ratio > 1.2) return 'text-yellow-600';
    if (ratio < 0.5) return 'text-red-600';
    return 'text-gray-600';
  };

  const getVolumeRatioBadge = (ratio: number) => {
    if (ratio > 1.5) return <Badge className="bg-green-100 text-green-800">High Volume</Badge>;
    if (ratio > 1.2) return <Badge className="bg-yellow-100 text-yellow-800">Above Average</Badge>;
    if (ratio < 0.5) return <Badge className="bg-red-100 text-red-800">Low Volume</Badge>;
    return <Badge className="bg-gray-100 text-gray-800">Normal</Badge>;
  };

  return (
    <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
      <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-t-lg">
        <div className="flex items-center space-x-2">
          <BarChart3 className="h-6 w-6" />
          <CardTitle className="text-xl">Volume Analysis</CardTitle>
        </div>
        <CardDescription className="text-purple-100">
          Volume trends and price-volume relationship
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-6">
          {/* Volume Ratio */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-600 font-medium">Volume Ratio</span>
              <div className="flex items-center space-x-2">
                <span className={`font-semibold text-lg ${getVolumeRatioColor(volumeRatio)}`}>
                  {volumeRatio.toFixed(2)}x
                </span>
                {getVolumeRatioBadge(volumeRatio)}
              </div>
            </div>
            <Progress value={Math.min(volumeRatio * 50, 100)} className="h-2" />
            <p className="text-sm text-slate-500">
              {volumeRatio > 1.5 ? 'Significantly above average volume' :
               volumeRatio > 1.2 ? 'Above average volume' :
               volumeRatio < 0.5 ? 'Below average volume' :
               'Normal volume levels'}
            </p>
          </div>

          {/* OBV Trend */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-600 font-medium">OBV Trend</span>
              <div className="flex items-center space-x-2">
                {getTrendIcon(obvTrend)}
                <span className="font-semibold capitalize">{obvTrend}</span>
              </div>
            </div>
            <p className="text-sm text-slate-500">
              On-Balance Volume trend indicates {obvTrend} buying/selling pressure
            </p>
          </div>

          {/* Calculated Volume Metrics */}
          {volumeMetrics && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 font-medium">Recent Volume Trend</span>
                <div className="flex items-center space-x-2">
                  {getTrendIcon(volumeMetrics.volumeTrend)}
                  <span className="font-semibold capitalize">{volumeMetrics.volumeTrend}</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-slate-50 p-3 rounded-lg">
                  <div className="text-slate-600">Average Volume</div>
                  <div className="font-semibold">{volumeMetrics.averageVolume.toLocaleString()}</div>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg">
                  <div className="text-slate-600">Recent Avg</div>
                  <div className="font-semibold">{volumeMetrics.recentAverageVolume.toLocaleString()}</div>
                </div>
              </div>
            </div>
          )}

          {/* Volume Insights */}
          <div className="space-y-3">
            <h4 className="font-semibold text-slate-800">Volume Insights</h4>
            <div className="space-y-2">
              {volumeRatio > 1.5 && (
                <div className="flex items-start space-x-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-green-700">High volume confirms strong market interest</span>
                </div>
              )}
              {volumeRatio < 0.5 && (
                <div className="flex items-start space-x-2 text-sm">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <span className="text-yellow-700">Low volume suggests weak market participation</span>
                </div>
              )}
              {obvTrend === 'up' && (
                <div className="flex items-start space-x-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-green-700">Rising OBV indicates accumulation</span>
                </div>
              )}
              {obvTrend === 'down' && (
                <div className="flex items-start space-x-2 text-sm">
                  <XCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <span className="text-red-700">Declining OBV suggests distribution</span>
                </div>
              )}
            </div>
          </div>

          {/* No Data Alert */}
          {!volumeData && !volumeMetrics && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Volume analysis data not available for {symbol}
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default VolumeAnalysisCard; 