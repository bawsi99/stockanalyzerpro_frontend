import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface VolumeData {
  volume: number;
  price: number;
  date: string;
  volume_ratio: number;
  price_change: number;
  is_anomaly: boolean;
}

interface VolumeAnalysis {
  average_volume: number;
  volume_trend: string;
  price_volume_correlation: number;
  volume_anomalies: VolumeData[];
  volume_patterns: {
    accumulation: boolean;
    distribution: boolean;
    climax: boolean;
  };
  key_insights: string[];
}

interface VolumeAnalysisCardProps {
  volumeData: VolumeAnalysis;
  symbol: string;
}

const VolumeAnalysisCard: React.FC<VolumeAnalysisCardProps> = ({ volumeData, className = '' }) => {
  if (!volumeData || !volumeData.enhanced_volume?.comprehensive_analysis) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Volume Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Enhanced volume analysis data not available. Using basic volume metrics.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const analysis = volumeData.enhanced_volume.comprehensive_analysis;
  const ratios = analysis.volume_ratios;
  const trends = analysis.volume_trends;
  const confirmation = analysis.volume_confirmation;
  const quality = analysis.volume_quality;

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down':
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

  const getConfirmationBadge = () => {
    const status = confirmation.confirmation_status;
    const strength = confirmation.strength;
    
    if (status === 'confirmed' && strength === 'strong') {
      return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Strong Confirmation</Badge>;
    } else if (status === 'confirmed') {
      return <Badge variant="secondary" className="bg-blue-100 text-blue-800"><CheckCircle className="h-3 w-3 mr-1" />Confirmed</Badge>;
    } else {
      return <Badge variant="destructive" className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />Diverging</Badge>;
    }
  };

  const getQualityBadge = () => {
    const dataQuality = quality.data_quality;
    const reliability = quality.reliability;
    
    if (dataQuality === 'good' && reliability === 'high') {
      return <Badge variant="default" className="bg-green-100 text-green-800">High Quality</Badge>;
    } else if (dataQuality === 'good') {
      return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Good Quality</Badge>;
    } else {
      return <Badge variant="destructive" className="bg-red-100 text-red-800">Poor Quality</Badge>;
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Volume Analysis
          </div>
          <div className="flex gap-2">
            {getQualityBadge()}
            {getConfirmationBadge()}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Daily Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-600">Current Volume</h4>
            <p className="text-2xl font-bold">
              {analysis.daily_metrics.current_volume.toLocaleString()}
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-600">Volume/Price Ratio</h4>
            <p className="text-2xl font-bold">
              {analysis.daily_metrics.volume_price_ratio.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Volume Ratios */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-600">Volume Ratios (vs Moving Averages)</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span className="text-sm">5-day:</span>
              <span className={`font-semibold ${getVolumeRatioColor(ratios.ratio_5d)}`}>
                {ratios.ratio_5d.toFixed(2)}x
              </span>
            </div>
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span className="text-sm">10-day:</span>
              <span className={`font-semibold ${getVolumeRatioColor(ratios.ratio_10d)}`}>
                {ratios.ratio_10d.toFixed(2)}x
              </span>
            </div>
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span className="text-sm">20-day:</span>
              <span className={`font-semibold ${getVolumeRatioColor(ratios.ratio_20d)}`}>
                {ratios.ratio_20d.toFixed(2)}x
              </span>
            </div>
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span className="text-sm">50-day:</span>
              <span className={`font-semibold ${getVolumeRatioColor(ratios.ratio_50d)}`}>
                {ratios.ratio_50d.toFixed(2)}x
              </span>
            </div>
          </div>
        </div>

        {/* Volume Trends */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-600">Volume Trends</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span className="text-sm">5-day:</span>
              <div className="flex items-center gap-1">
                {getTrendIcon(trends.trend_5d)}
                <span className="text-sm font-medium capitalize">{trends.trend_5d}</span>
              </div>
            </div>
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span className="text-sm">10-day:</span>
              <div className="flex items-center gap-1">
                {getTrendIcon(trends.trend_10d)}
                <span className="text-sm font-medium capitalize">{trends.trend_10d}</span>
              </div>
            </div>
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span className="text-sm">20-day:</span>
              <div className="flex items-center gap-1">
                {getTrendIcon(trends.trend_20d)}
                <span className="text-sm font-medium capitalize">{trends.trend_20d}</span>
              </div>
            </div>
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span className="text-sm">50-day:</span>
              <div className="flex items-center gap-1">
                {getTrendIcon(trends.trend_50d)}
                <span className="text-sm font-medium capitalize">{trends.trend_50d}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Volume Strength Score */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-600">Volume Strength Score</h4>
            <span className="text-lg font-bold">{analysis.volume_strength_score}/100</span>
          </div>
          <Progress value={analysis.volume_strength_score} className="h-2" />
          <div className="flex justify-between text-xs text-gray-500">
            <span>Weak</span>
            <span>Moderate</span>
            <span>Strong</span>
          </div>
        </div>

        {/* Price-Volume Correlation */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-600">Price-Volume Correlation</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span className="text-sm">20-day:</span>
              <span className={`font-semibold ${
                Math.abs(analysis.price_volume_correlation.correlation_20d) > 0.5 ? 'text-green-600' :
                Math.abs(analysis.price_volume_correlation.correlation_20d) > 0.3 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {analysis.price_volume_correlation.correlation_20d.toFixed(3)}
              </span>
            </div>
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span className="text-sm">50-day:</span>
              <span className={`font-semibold ${
                Math.abs(analysis.price_volume_correlation.correlation_50d) > 0.5 ? 'text-green-600' :
                Math.abs(analysis.price_volume_correlation.correlation_50d) > 0.3 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {analysis.price_volume_correlation.correlation_50d.toFixed(3)}
              </span>
            </div>
          </div>
          <Badge variant="outline" className="capitalize">
            {analysis.price_volume_correlation.correlation_strength} Correlation
          </Badge>
        </div>

        {/* Volume Anomalies */}
        {analysis.volume_anomalies.recent_anomalies > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-600">Recent Volume Anomalies</h4>
            <div className="space-y-2">
              {analysis.volume_anomalies.anomaly_list.slice(0, 3).map((anomaly: Record<string, unknown>, index: number) => (
                <div key={index} className="flex items-center justify-between p-2 bg-yellow-50 rounded border border-yellow-200">
                  <div>
                    <p className="text-sm font-medium">{anomaly.date}</p>
                    <p className="text-xs text-gray-600">
                      {anomaly.volume_ratio.toFixed(2)}x average volume
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {anomaly.anomaly_strength}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Advanced Indicators */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-600">Advanced Volume Indicators</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span className="text-sm">MFI:</span>
              <span className={`font-semibold ${
                analysis.advanced_indicators.mfi_status === 'overbought' ? 'text-red-600' :
                analysis.advanced_indicators.mfi_status === 'oversold' ? 'text-green-600' : 'text-gray-600'
              }`}>
                {analysis.advanced_indicators.mfi.toFixed(1)}
              </span>
            </div>
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span className="text-sm">OBV Trend:</span>
              <div className="flex items-center gap-1">
                {getTrendIcon(analysis.advanced_indicators.obv_trend)}
                <span className="text-sm font-medium capitalize">{analysis.advanced_indicators.obv_trend}</span>
              </div>
            </div>
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span className="text-sm">VWAP:</span>
              <span className="font-semibold">
                ₹{analysis.advanced_indicators.vwap.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span className="text-sm">Price vs VWAP:</span>
              <span className={`font-semibold ${
                analysis.advanced_indicators.price_vs_vwap_pct > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {analysis.advanced_indicators.price_vs_vwap_pct > 0 ? '+' : ''}{analysis.advanced_indicators.price_vs_vwap_pct.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>

        {/* Volume Volatility */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-600">Volume Volatility</h4>
          <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
            <span className="text-sm">Volatility Ratio:</span>
            <span className={`font-semibold ${
              analysis.volume_volatility.volatility_regime === 'high' ? 'text-red-600' :
              analysis.volume_volatility.volatility_regime === 'low' ? 'text-green-600' : 'text-yellow-600'
            }`}>
              {analysis.volume_volatility.volatility_ratio.toFixed(3)}
            </span>
          </div>
          <Badge variant="outline" className="capitalize">
            {analysis.volume_volatility.volatility_regime} Volatility
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};

export default VolumeAnalysisCard; 