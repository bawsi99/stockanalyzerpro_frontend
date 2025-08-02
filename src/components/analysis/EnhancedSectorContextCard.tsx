import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Target,
  AlertTriangle,
  CheckCircle,
  Activity,
  Shield,
  RotateCcw
} from "lucide-react";
import { SectorContext } from "@/types/analysis";

interface EnhancedSectorContextCardProps {
  sectorContext: SectorContext | null | undefined;
  symbol: string;
}

const EnhancedSectorContextCard = ({ sectorContext, symbol }: EnhancedSectorContextCardProps) => {
  if (!sectorContext || !sectorContext.benchmarking) {
    return (
      <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm h-full">
        <CardHeader>
          <CardTitle className="flex items-center text-slate-800 text-lg">
            <Building2 className="h-5 w-5 mr-2 text-blue-500" />
            Sector Context
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-500">No sector context data available</p>
        </CardContent>
      </Card>
    );
  }

  const getPerformanceColor = (performance: string) => {
    const perfLower = performance.toLowerCase();
    if (perfLower === 'outperforming') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (perfLower === 'underperforming') return 'bg-red-100 text-red-700 border-red-200';
    return 'bg-yellow-100 text-yellow-700 border-yellow-200';
  };

  const getRiskLevelColor = (riskLevel: string) => {
    const riskLower = riskLevel.toLowerCase();
    if (riskLower === 'low') return 'bg-green-100 text-green-700';
    if (riskLower === 'medium') return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  };

  const getRecommendationColor = (recommendation: string) => {
    const recLower = recommendation.toLowerCase();
    if (recLower.includes('buy')) return 'bg-emerald-100 text-emerald-700';
    if (recLower.includes('sell')) return 'bg-red-100 text-red-700';
    return 'bg-yellow-100 text-yellow-700';
  };

  const benchmarking = sectorContext.benchmarking;
  const rotation = sectorContext.rotation_insights;
  const correlation = sectorContext.correlation_insights;

  return (
    <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm h-full">
      <CardHeader>
        <CardTitle className="flex items-center text-slate-800 text-xl">
          <Building2 className="h-6 w-6 mr-3 text-blue-500" />
          Sector Context
          <Badge className="ml-2 bg-blue-100 text-blue-700">
            {sectorContext.sector}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Sector Overview */}
        {benchmarking.analysis_summary && benchmarking.sector_info && benchmarking.sector_risk_metrics && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-blue-800">Sector Overview</h3>
              <Badge className={getPerformanceColor(benchmarking.analysis_summary.market_position || 'neutral')}>
                {benchmarking.analysis_summary.market_position || 'Neutral'}
              </Badge>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-slate-600">Sector:</span>
                <div className="font-medium text-slate-800">{benchmarking.sector_info.sector_name || 'N/A'}</div>
              </div>
              <div>
                <span className="text-slate-600">Index:</span>
                <div className="font-medium text-slate-800">{benchmarking.sector_info.sector_index || 'N/A'}</div>
              </div>
              <div>
                <span className="text-slate-600">Stocks:</span>
                <div className="font-medium text-slate-800">{benchmarking.sector_info.sector_stocks_count || 'N/A'}</div>
              </div>
              <div>
                <span className="text-slate-600">Risk Level:</span>
                <Badge className={`ml-1 ${getRiskLevelColor(benchmarking.sector_risk_metrics.risk_level || 'medium')}`}>
                  {benchmarking.sector_risk_metrics.risk_level || 'Medium'}
                </Badge>
              </div>
            </div>
          </div>
        )}

        {/* Market vs Sector Performance */}
        <div className="space-y-4">
          <h3 className="font-semibold text-slate-800 flex items-center">
            <BarChart3 className="h-4 w-4 mr-2 text-green-500" />
            Performance Analysis
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Market Benchmarking */}
            {benchmarking.market_benchmarking && (
              <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
                <h4 className="font-medium text-emerald-800 mb-3 flex items-center">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  vs Market
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Beta:</span>
                    <span className="font-medium text-slate-800">{(benchmarking.market_benchmarking.beta || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Correlation:</span>
                    <span className="font-medium text-slate-800">{((benchmarking.market_benchmarking.correlation || 0) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Sharpe Ratio:</span>
                    <span className="font-medium text-slate-800">{(benchmarking.market_benchmarking.sharpe_ratio || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Volatility:</span>
                    <span className="font-medium text-slate-800">{((benchmarking.market_benchmarking.volatility || 0) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Return:</span>
                    <span className="font-medium text-slate-800">{((benchmarking.market_benchmarking.annualized_return || 0) * 100).toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            )}

            {/* Sector Benchmarking */}
            {benchmarking.sector_benchmarking && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-800 mb-3 flex items-center">
                  <Activity className="h-4 w-4 mr-1" />
                  vs Sector
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Sector Beta:</span>
                    <span className="font-medium text-slate-800">{(benchmarking.sector_benchmarking.sector_beta || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Sector Correlation:</span>
                    <span className="font-medium text-slate-800">{((benchmarking.sector_benchmarking.sector_correlation || 0) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Sector Sharpe:</span>
                    <span className="font-medium text-slate-800">{(benchmarking.sector_benchmarking.sector_sharpe_ratio || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Sector Volatility:</span>
                    <span className="font-medium text-slate-800">{((benchmarking.sector_benchmarking.sector_volatility || 0) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Sector Return:</span>
                    <span className="font-medium text-slate-800">{((benchmarking.sector_benchmarking.sector_annualized_return || 0) * 100).toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sector Rotation Insights */}
        {rotation && (
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-800 flex items-center">
              <RotateCcw className="h-4 w-4 mr-2 text-purple-500" />
              Sector Rotation
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Leading Sectors */}
              <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
                <h4 className="font-medium text-emerald-800 mb-2 flex items-center">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  Leading Sectors ({rotation.leading_sectors.length})
                </h4>
                <div className="space-y-1">
                  {rotation.leading_sectors.map((sector, index) => (
                    <div key={index} className="text-sm text-emerald-700 bg-emerald-100 px-2 py-1 rounded">
                      {sector}
                    </div>
                  ))}
                  {rotation.leading_sectors.length === 0 && (
                    <div className="text-sm text-emerald-600">None</div>
                  )}
                </div>
              </div>

              {/* Lagging Sectors */}
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <h4 className="font-medium text-red-800 mb-2 flex items-center">
                  <TrendingDown className="h-4 w-4 mr-1" />
                  Lagging Sectors ({rotation.lagging_sectors.length})
                </h4>
                <div className="space-y-1">
                  {rotation.lagging_sectors.map((sector, index) => (
                    <div key={index} className="text-sm text-red-700 bg-red-100 px-2 py-1 rounded">
                      {sector}
                    </div>
                  ))}
                  {rotation.lagging_sectors.length === 0 && (
                    <div className="text-sm text-red-600">None</div>
                  )}
                </div>
              </div>
            </div>

            {/* Rotation Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-slate-50 rounded-lg">
                <div className="text-lg font-bold text-slate-800">
                  {rotation.sector_rank || 'N/A'}
                </div>
                <div className="text-xs text-slate-600">Sector Rank</div>
              </div>
              <div className="text-center p-3 bg-slate-50 rounded-lg">
                <div className="text-lg font-bold text-slate-800">
                  {rotation.sector_performance ? `${rotation.sector_performance.toFixed(2)}%` : 'N/A'}
                </div>
                <div className="text-xs text-slate-600">Performance</div>
              </div>
              <div className="text-center p-3 bg-slate-50 rounded-lg">
                <div className="text-lg font-bold text-slate-800 capitalize">
                  {rotation.rotation_strength || 'N/A'}
                </div>
                <div className="text-xs text-slate-600">Rotation Strength</div>
              </div>
              <div className="text-center p-3 bg-slate-50 rounded-lg">
                <div className="text-lg font-bold text-slate-800">
                  {rotation.recommendations?.length || 0}
                </div>
                <div className="text-xs text-slate-600">Recommendations</div>
              </div>
            </div>
          </div>
        )}

        {/* Correlation Insights */}
        {correlation && (
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-800 flex items-center">
              <Target className="h-4 w-4 mr-2 text-orange-500" />
              Correlation Analysis
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* High Correlation Sectors */}
              <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                <h4 className="font-medium text-orange-800 mb-2">High Correlation</h4>
                <div className="space-y-1">
                  {correlation.high_correlation_sectors.map((sector, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-orange-700">{sector.sector}</span>
                      <span className="font-medium text-orange-800">{(sector.correlation * 100).toFixed(1)}%</span>
                    </div>
                  ))}
                  {correlation.high_correlation_sectors.length === 0 && (
                    <div className="text-sm text-orange-600">None</div>
                  )}
                </div>
              </div>

              {/* Low Correlation Sectors */}
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h4 className="font-medium text-green-800 mb-2">Low Correlation</h4>
                <div className="space-y-1">
                  {correlation.low_correlation_sectors.map((sector, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-green-700">{sector.sector}</span>
                      <span className="font-medium text-green-800">{(sector.correlation * 100).toFixed(1)}%</span>
                    </div>
                  ))}
                  {correlation.low_correlation_sectors.length === 0 && (
                    <div className="text-sm text-green-600">None</div>
                  )}
                </div>
              </div>
            </div>

            {/* Correlation Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="text-center p-3 bg-slate-50 rounded-lg">
                <div className="text-lg font-bold text-slate-800">
                  {(correlation.average_correlation * 100).toFixed(1)}%
                </div>
                <div className="text-xs text-slate-600">Avg Correlation</div>
              </div>
              <div className="text-center p-3 bg-slate-50 rounded-lg">
                <div className="text-lg font-bold text-slate-800 capitalize">
                  {correlation.diversification_quality}
                </div>
                <div className="text-xs text-slate-600">Diversification</div>
              </div>
              <div className="text-center p-3 bg-slate-50 rounded-lg">
                <div className="text-lg font-bold text-slate-800">
                  {(correlation.sector_volatility * 100).toFixed(1)}%
                </div>
                <div className="text-xs text-slate-600">Sector Volatility</div>
              </div>
            </div>
          </div>
        )}

        {/* Risk Assessment */}
        {benchmarking.sector_risk_metrics && (
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-800 flex items-center">
              <Shield className="h-4 w-4 mr-2 text-red-500" />
              Risk Assessment
            </h3>
            
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-slate-600">Risk Score:</span>
                  <div className="font-medium text-slate-800">{benchmarking.sector_risk_metrics.risk_score || 'N/A'}</div>
                </div>
                <div>
                  <span className="text-slate-600">Correlation Risk:</span>
                  <div className="font-medium text-slate-800 capitalize">{benchmarking.sector_risk_metrics.correlation_risk || 'N/A'}</div>
                </div>
                <div>
                  <span className="text-slate-600">Momentum Risk:</span>
                  <div className="font-medium text-slate-800 capitalize">{benchmarking.sector_risk_metrics.momentum_risk || 'N/A'}</div>
                </div>
                <div>
                  <span className="text-slate-600">Volatility Risk:</span>
                  <div className="font-medium text-slate-800 capitalize">{benchmarking.sector_risk_metrics.volatility_risk || 'N/A'}</div>
                </div>
              </div>

              {/* Risk Factors */}
              {benchmarking.sector_risk_metrics.risk_factors && benchmarking.sector_risk_metrics.risk_factors.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium text-red-800 mb-2">Key Risk Factors</h4>
                  <div className="space-y-1">
                    {benchmarking.sector_risk_metrics.risk_factors.map((factor, index) => (
                      <div key={index} className="text-sm text-red-700 flex items-start">
                        <AlertTriangle className="h-3 w-3 mr-2 mt-0.5 flex-shrink-0" />
                        {factor}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Investment Recommendation */}
        {benchmarking.analysis_summary && (
          <div className="bg-gradient-to-r from-emerald-50 to-green-50 p-4 rounded-lg border border-emerald-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-emerald-800">Investment Recommendation</h3>
                <p className="text-sm text-emerald-700 mt-1">
                  Based on sector analysis and market positioning
                </p>
              </div>
              <Badge className={getRecommendationColor(benchmarking.analysis_summary.investment_recommendation || 'neutral')}>
                {benchmarking.analysis_summary.investment_recommendation || 'Neutral'}
              </Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EnhancedSectorContextCard; 