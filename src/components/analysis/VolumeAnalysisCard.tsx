import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle, XCircle, BarChart3, Activity } from 'lucide-react';

interface VolumeAnalysisCardProps {
  volumeData?: any;
  priceData?: any[];
  symbol: string;
  className?: string;
}

const VolumeAnalysisCard: React.FC<VolumeAnalysisCardProps> = ({ volumeData, priceData, symbol, className }) => {

  
  // Extract volume information from the data
  const volumeRatio = volumeData?.volume_ratios?.primary_ratio || volumeData?.volume_ratio || 1;
  const obv = volumeData?.advanced_indicators?.obv || volumeData?.obv || 0;
  const obvTrend = volumeData?.advanced_indicators?.obv_trend || volumeData?.obv_trend || 'neutral';
  
  // Enhanced volume insights
  const volumeTrends = volumeData?.volume_trends || {};
  const volumeAnomalies = volumeData?.volume_anomalies || {};
  const priceVolumeCorrelation = volumeData?.price_volume_correlation || {};
  const volumeConfirmation = volumeData?.volume_confirmation || {};
  const volumeVolatility = volumeData?.volume_volatility || {};
  const volumeStrengthScore = volumeData?.volume_strength_score || 0;
  
  // Calculate basic volume metrics from price data if available
  const calculateVolumeMetrics = () => {
    if (!priceData || !Array.isArray(priceData) || priceData.length === 0) return null;
    
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
    <Card className={`shadow-xl border-0 bg-white/90 backdrop-blur-sm h-full flex flex-col ${className || ''}`}>
      <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-t-lg flex-shrink-0">
        <div className="flex items-center space-x-2">
          <BarChart3 className="h-6 w-6" />
          <CardTitle className="text-xl">Volume Analysis</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-6 flex-1 flex flex-col overflow-y-auto">
        <div className="space-y-6 flex-1">
          {/* Volume Ratio */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
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

          {/* Enhanced Volume Metrics */}
          {volumeData?.volume_ratios && (
            <div className="space-y-3">
              <h4 className="font-semibold text-slate-800">Volume Metrics</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-slate-50 p-3 rounded-lg">
                  <div className="text-slate-600">20-Day Ratio</div>
                  <div className="font-semibold">{(volumeData.volume_ratios.ratio_20d || 1).toFixed(2)}x</div>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg">
                  <div className="text-slate-600">50-Day Ratio</div>
                  <div className="font-semibold">{(volumeData.volume_ratios.ratio_50d || 1).toFixed(2)}x</div>
                </div>
                {volumeData.volume_anomalies?.total_anomalies > 0 && (
                  <div className="bg-slate-50 p-3 rounded-lg">
                    <div className="text-slate-600">Volume Anomalies</div>
                    <div className="font-semibold text-orange-600">{volumeData.volume_anomalies.total_anomalies}</div>
                  </div>
                )}
                {volumeStrengthScore > 0 && (
                  <div className="bg-slate-50 p-3 rounded-lg">
                    <div className="text-slate-600">Strength Score</div>
                    <div className="font-semibold text-emerald-600">{volumeStrengthScore.toFixed(0)}/100</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Calculated Volume Metrics (fallback) */}
          {volumeMetrics && !volumeData?.volume_ratios && (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
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
              {/* Volume Trend Analysis */}
              {volumeTrends.primary_trend && (
                <div className="flex items-start space-x-2 text-sm">
                  {getTrendIcon(volumeTrends.primary_trend)}
                  <span className={`break-words ${volumeTrends.primary_trend === 'up' ? 'text-green-700' : 'text-red-700'}`}>
                    Volume trend is {volumeTrends.primary_trend} over 20-day period
                  </span>
                </div>
              )}
              
              {/* Volume Confirmation */}
              {volumeConfirmation.confirmation_status && (
                <div className="flex items-start space-x-2 text-sm">
                  {volumeConfirmation.confirmation_status === 'confirmed' ? (
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  )}
                  <span className={`break-words ${volumeConfirmation.confirmation_status === 'confirmed' ? 'text-green-700' : 'text-yellow-700'}`}>
                    Volume {volumeConfirmation.confirmation_status} price trend ({volumeConfirmation.strength} strength)
                  </span>
                </div>
              )}
              
              {/* Price-Volume Correlation */}
              {priceVolumeCorrelation.correlation_strength && (
                <div className="flex items-start space-x-2 text-sm">
                  <BarChart3 className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span className="text-blue-700 break-words">
                    {priceVolumeCorrelation.correlation_strength} price-volume correlation ({Math.abs(priceVolumeCorrelation.correlation_20d || 0).toFixed(2)})
                  </span>
                </div>
              )}
              
              {/* Volume Anomalies */}
              {volumeAnomalies.recent_anomalies > 0 && (
                <div className="flex items-start space-x-2 text-sm">
                  <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                  <span className="text-orange-700 break-words">
                    {volumeAnomalies.recent_anomalies} recent volume anomalies detected
                  </span>
                </div>
              )}
              
              {/* Volume Volatility */}
              {volumeVolatility.volatility_regime && (
                <div className="flex items-start space-x-2 text-sm">
                  <Activity className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                  <span className="text-purple-700 break-words">
                    {volumeVolatility.volatility_regime} volume volatility regime
                  </span>
                </div>
              )}
              
              {/* Volume Strength Score */}
              {volumeStrengthScore > 0 && (
                <div className="flex items-start space-x-2 text-sm">
                  <TrendingUp className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span className="text-emerald-700 break-words">
                    Volume strength score: {volumeStrengthScore.toFixed(0)}/100
                  </span>
                </div>
              )}
              
              {/* Basic Volume Insights (fallback) */}
              {volumeRatio > 1.5 && !volumeTrends.primary_trend && (
                <div className="flex items-start space-x-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-green-700 break-words">High volume confirms strong market interest</span>
                </div>
              )}
              {volumeRatio < 0.5 && !volumeTrends.primary_trend && (
                <div className="flex items-start space-x-2 text-sm">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <span className="text-yellow-700 break-words">Low volume suggests weak market participation</span>
                </div>
              )}
              {obvTrend === 'up' && !volumeTrends.primary_trend && (
                <div className="flex items-start space-x-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-green-700 break-words">Rising OBV indicates accumulation</span>
                </div>
              )}
              {obvTrend === 'down' && !volumeTrends.primary_trend && (
                <div className="flex items-start space-x-2 text-sm">
                  <XCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <span className="text-red-700 break-words">Declining OBV suggests distribution</span>
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