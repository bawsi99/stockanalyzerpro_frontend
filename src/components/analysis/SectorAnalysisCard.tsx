import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Target,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RotateCcw,
  Network,
  Lightbulb
} from "lucide-react";
import { SectorContext } from "@/types/analysis";

interface SectorAnalysisCardProps {
  sectorContext: SectorContext;
}

const SectorAnalysisCard: React.FC<SectorAnalysisCardProps> = ({ 
  sectorContext 
}) => {
  const {
    sector,
    rotation_insights,
    correlation_insights,
    trading_recommendations
  } = sectorContext;

  const getRotationStrengthColor = (strength: string) => {
    switch (strength.toLowerCase()) {
      case 'strong': return 'bg-green-100 text-green-800';
      case 'moderate': return 'bg-yellow-100 text-yellow-800';
      case 'weak': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCorrelationQualityColor = (quality: string) => {
    switch (quality.toLowerCase()) {
      case 'excellent': return 'bg-green-100 text-green-800';
      case 'good': return 'bg-blue-100 text-blue-800';
      case 'fair': return 'bg-yellow-100 text-yellow-800';
      case 'poor': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRecommendationTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'buy': return 'bg-green-100 text-green-800';
      case 'sell': return 'bg-red-100 text-red-800';
      case 'hold': return 'bg-yellow-100 text-yellow-800';
      case 'accumulate': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Sector Rotation Analysis */}
      <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-t-lg">
          <div className="flex items-center space-x-2">
            <RotateCcw className="h-6 w-6" />
            <CardTitle className="text-xl">Sector Rotation Analysis</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Rotation Insights */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-800">Rotation Insights</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Rotation Strength:</span>
                  <Badge className={getRotationStrengthColor(rotation_insights.rotation_strength)}>
                    {rotation_insights.rotation_strength}
                  </Badge>
                </div>
                {rotation_insights.sector_rank && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Sector Rank:</span>
                    <Badge variant="outline">
                      #{rotation_insights.sector_rank}
                    </Badge>
                  </div>
                )}
                {rotation_insights.sector_performance && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Sector Performance:</span>
                    <div className="flex items-center space-x-1">
                      {rotation_insights.sector_performance > 0 ? (
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-600" />
                      )}
                      <span className={`font-medium ${
                        rotation_insights.sector_performance > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {(rotation_insights.sector_performance * 100).toFixed(2)}%
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Leading/Lagging Sectors */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-800">Sector Momentum</h3>
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-slate-700 mb-2">Leading Sectors</h4>
                  <div className="space-y-1">
                    {rotation_insights.leading_sectors.length > 0 ? (
                      rotation_insights.leading_sectors.slice(0, 3).map((sector, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          <span className="text-sm text-slate-600">{sector}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500">No leading sectors identified</p>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-slate-700 mb-2">Lagging Sectors</h4>
                  <div className="space-y-1">
                    {rotation_insights.lagging_sectors.length > 0 ? (
                      rotation_insights.lagging_sectors.slice(0, 3).map((sector, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <XCircle className="h-3 w-3 text-red-500" />
                          <span className="text-sm text-slate-600">{sector}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500">No lagging sectors identified</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Correlation Analysis */}
      <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center text-slate-800">
            <Network className="h-5 w-5 mr-2 text-blue-500" />
            Sector Correlation Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Correlation Metrics */}
            <div className="space-y-4">
              <h4 className="font-semibold text-slate-700">Correlation Metrics</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Average Correlation:</span>
                  <span className="font-medium">{correlation_insights.average_correlation.toFixed(3)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Diversification Quality:</span>
                  <Badge className={getCorrelationQualityColor(correlation_insights.diversification_quality)}>
                    {correlation_insights.diversification_quality}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Sector Volatility:</span>
                  <span className="font-medium">{correlation_insights.sector_volatility.toFixed(2)}%</span>
                </div>
              </div>
            </div>

            {/* ENHANCED: Correlation Breakdown with Negative Correlations */}
            <div className="space-y-4">
              <h4 className="font-semibold text-slate-700">Enhanced Correlation Breakdown</h4>
              <div className="grid grid-cols-1 gap-3">
                {/* High Positive Correlations */}
                <div>
                  <h5 className="text-sm font-medium text-slate-600 mb-2 flex items-center">
                    <TrendingUp className="h-3 w-3 mr-1 text-orange-500" />
                    High Positive ({'>'} 0.5)
                  </h5>
                  <div className="space-y-1">
                    {correlation_insights.high_correlation_sectors?.length > 0 ? (
                      correlation_insights.high_correlation_sectors.slice(0, 2).map((item, index) => (
                        <div key={index} className="flex items-center justify-between text-sm">
                          <span className="text-slate-600">{item.sector}</span>
                          <span className="font-medium text-orange-600">{item.correlation.toFixed(3)}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500">No high positive correlations</p>
                    )}
                  </div>
                </div>
                
                {/* NEW: Negative Correlations (Hedging Opportunities) */}
                {correlation_insights.negative_correlation_sectors?.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-slate-600 mb-2 flex items-center">
                      <TrendingDown className="h-3 w-3 mr-1 text-blue-500" />
                      Negative Correlations (Hedging)
                    </h5>
                    <div className="space-y-1">
                      {correlation_insights.negative_correlation_sectors.slice(0, 2).map((item, index) => (
                        <div key={index} className="flex items-center justify-between text-sm">
                          <span className="text-slate-600">{item.sector}</span>
                          <span className="font-medium text-blue-600">{item.correlation.toFixed(3)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Low Correlations (Diversification) */}
                <div>
                  <h5 className="text-sm font-medium text-slate-600 mb-2 flex items-center">
                    <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
                    Low Correlation ({'<'} 0.3)
                  </h5>
                  <div className="space-y-1">
                    {correlation_insights.low_correlation_sectors?.length > 0 ? (
                      correlation_insights.low_correlation_sectors.slice(0, 2).map((item, index) => (
                        <div key={index} className="flex items-center justify-between text-sm">
                          <span className="text-slate-600">{item.sector}</span>
                          <span className="font-medium text-green-600">{item.correlation.toFixed(3)}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500">No low correlation sectors</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trading Recommendations */}
      <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center text-slate-800">
            <Lightbulb className="h-5 w-5 mr-2 text-emerald-500" />
            Sector-Aware Trading Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {trading_recommendations.length > 0 ? (
            <div className="space-y-4">
              {trading_recommendations.map((recommendation, index) => (
                <div key={index} className="p-4 border border-slate-200 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Badge className={getRecommendationTypeColor(recommendation.recommendation)}>
                        {recommendation.recommendation}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {recommendation.type}
                      </Badge>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {recommendation.confidence} confidence
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-slate-800">{recommendation.reason}</p>
                    {recommendation.message && (
                      <p className="text-sm text-slate-600">{recommendation.message}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600">No sector-specific recommendations available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sector Insights Summary */}
      <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center text-slate-800">
            <BarChart3 className="h-5 w-5 mr-2 text-purple-500" />
            Sector Analysis Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-slate-50 rounded-lg">
              <div className="text-2xl font-bold text-slate-800">
                {rotation_insights.sector_rank || 'N/A'}
              </div>
              <div className="text-xs text-slate-600">Sector Rank</div>
            </div>
            <div className="text-center p-4 bg-slate-50 rounded-lg">
              <div className="text-2xl font-bold text-slate-800">
                {correlation_insights.diversification_quality}
              </div>
              <div className="text-xs text-slate-600">Diversification Quality</div>
            </div>
            <div className="text-center p-4 bg-slate-50 rounded-lg">
              <div className="text-2xl font-bold text-slate-800">
                {trading_recommendations.length}
              </div>
              <div className="text-xs text-slate-600">Trading Recommendations</div>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h5 className="font-medium text-blue-800 mb-1">Sector Analysis Insights</h5>
                <p className="text-sm text-blue-700">
                  {rotation_insights.rotation_strength === 'strong' 
                    ? 'Strong sector rotation detected. Consider sector-specific positioning based on momentum trends.'
                    : correlation_insights.diversification_quality === 'excellent'
                    ? 'Excellent diversification opportunities available. Consider low-correlation sectors for portfolio balance.'
                    : 'Standard sector analysis. Monitor for rotation opportunities and correlation changes.'
                  }
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SectorAnalysisCard; 