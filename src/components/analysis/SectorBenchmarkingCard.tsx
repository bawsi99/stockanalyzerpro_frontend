import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Shield, 
  Target,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle
} from "lucide-react";
import { SectorBenchmarking } from "@/types/analysis";

interface SectorBenchmarkingCardProps {
  sectorBenchmarking: SectorBenchmarking;
}

const SectorBenchmarkingCard: React.FC<SectorBenchmarkingCardProps> = ({ 
  sectorBenchmarking 
}) => {

  
  // Add null checks and default values
  if (!sectorBenchmarking) {
    return (
      <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center text-slate-800">
            <BarChart3 className="h-5 w-5 mr-2 text-blue-500" />
            Sector Benchmarking
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center py-8 text-gray-500">
            <p>No sector benchmarking data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Safe access to properties with defaults - handle both frontend and backend structures
  const {
    // Frontend structure fields
    sector_info = null,
    market_benchmarking = null,
    sector_benchmarking: sectorData = null,
    relative_performance = null,
    sector_risk_metrics: rawSectorRiskMetrics = null,
    analysis_summary = null,
    // Data quality and error information
    data_quality = null,
    error_message = null,
    is_reliable = true
  } = sectorBenchmarking;

  // Since data is now transformed to frontend format, we don't need backend structure fields
  // The transformed data already has the correct structure

  // Safe access to sector_info with null checking
  const safeSectorInfo = {
    sector: sector_info?.sector ?? 'Unknown',
    sector_name: sector_info?.sector_name ?? 'Unknown',
    sector_index: sector_info?.sector_index ?? 'NIFTY 50',
    sector_stocks_count: sector_info?.sector_stocks_count ?? 0
  };

  // Handle null values properly - don't default to 0, keep null for unavailable data
  const safeMarketBenchmarking = {
    cumulative_return: market_benchmarking?.cumulative_return,
    volatility: market_benchmarking?.volatility,
    sharpe_ratio: market_benchmarking?.sharpe_ratio,
    beta: market_benchmarking?.beta
  };

  const safeSectorData = {
    sector_cumulative_return: sectorData?.sector_cumulative_return,
    sector_volatility: sectorData?.sector_volatility,
    sector_sharpe_ratio: sectorData?.sector_sharpe_ratio,
    sector_beta: sectorData?.sector_beta
  };

  // Handle both frontend and backend relative performance structures - keep null values
  const safeRelativePerformance = {
    vs_market: {
      performance_ratio: relative_performance?.vs_market?.performance_ratio,
      consistency_score: relative_performance?.vs_market?.consistency_score
    },
    vs_sector: {
      performance_ratio: relative_performance?.vs_sector?.performance_ratio,
      sector_rank: relative_performance?.vs_sector?.sector_rank,
      sector_percentile: relative_performance?.vs_sector?.sector_percentile,
      sector_consistency: relative_performance?.vs_sector?.sector_consistency
    }
  };

  // Safe access to sector_risk_metrics with null checking
  const sector_risk_metrics = rawSectorRiskMetrics || {
    risk_level: 'Unknown',
    risk_score: 0,
    correlation_risk: 'Unknown',
    momentum_risk: 'Unknown',
    volatility_risk: 'Unknown',
    sector_stress_metrics: { stress_level: 'Unknown', stress_score: 0 },
    risk_factors: [],
    risk_mitigation: []
  };

  // Ensure sector_stress_metrics is safe to access
  const stressMetrics = sector_risk_metrics.sector_stress_metrics || {
    stress_level: 'Unknown',
    stress_score: 0
  };

  // Calculate stress score from backend stress metrics if available
  const calculatedStressScore = stressMetrics.stress_score || 0;
  const calculatedStressLevel = stressMetrics.stress_level || 
    (calculatedStressScore > 30 ? 'High' : calculatedStressScore > 15 ? 'Medium' : 'Low');

  // Ensure arrays are safe to access
  const riskFactors = sector_risk_metrics.risk_factors || [];
  const riskMitigation = sector_risk_metrics.risk_mitigation || [];

  // Safe access to other risk metrics properties
  const riskLevel = sector_risk_metrics.risk_level || 'Unknown';
  const riskScore = sector_risk_metrics.risk_score || 0;
  const correlationRisk = sector_risk_metrics.correlation_risk || 'Unknown';
  const momentumRisk = sector_risk_metrics.momentum_risk || 'Unknown';
  const volatilityRisk = sector_risk_metrics.volatility_risk || 'Unknown';

  // Safe access to analysis_summary
  const safeAnalysisSummary = analysis_summary || {
    market_position: 'Unknown',
    sector_position: 'Unknown',
    risk_assessment: 'Unknown',
    investment_recommendation: 'No recommendation available'
  };

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

  const getRiskLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskLevelIcon = (level: string) => {
    switch (level.toLowerCase()) {
      case 'low': return <CheckCircle className="h-4 w-4" />;
      case 'medium': return <AlertTriangle className="h-4 w-4" />;
      case 'high': return <XCircle className="h-4 w-4" />;
      default: return <Shield className="h-4 w-4" />;
    }
  };

  // Helper functions to handle null values in display
  const formatPercentage = (value: number | null): string => {
    return value !== null && value !== undefined ? `${(value * 100).toFixed(2)}%` : 'N/A';
  };

  const formatNumber = (value: number | null, decimals: number = 2): string => {
    return value !== null && value !== undefined ? value.toFixed(decimals) : 'N/A';
  };

  const getPerformanceColorSafe = (value: number | null) => {
    if (value === null || value === undefined) return "text-gray-600";
    return getPerformanceColor(value);
  };

  const getPerformanceIconSafe = (value: number | null) => {
    if (value === null || value === undefined) return <BarChart3 className="h-4 w-4 text-gray-600" />;
    return getPerformanceIcon(value);
  };

  return (
    <div className="space-y-6">
      {/* Data Quality Warning */}
      {(!is_reliable || error_message) && (
        <Card className="shadow-xl border-0 bg-yellow-50/80 backdrop-blur-sm border-yellow-200">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-2">
                <div className="font-medium text-yellow-800">
                  {error_message ? 'Data Analysis Error' : 'Insufficient Data Warning'}
                </div>
                <div className="text-sm text-yellow-700">
                  {error_message || 'The metrics below may not be reliable due to insufficient historical data. More data points are needed for accurate calculations.'}
                </div>
                {data_quality && (
                  <div className="text-xs text-yellow-600">
                    Data points: {data_quality.data_points} / {data_quality.minimum_recommended} recommended
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Sector Information */}
      <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-t-lg">
          <div className="flex items-center space-x-2">
            <BarChart3 className="h-6 w-6" />
            <CardTitle className="text-xl">Sector Benchmarking</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Sector Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-800">Sector Information</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-600">Sector:</span>
                  <Badge variant="outline" className="font-medium">
                    {safeSectorInfo.sector_name || safeSectorInfo.sector}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Index:</span>
                  <span className="font-medium">{safeSectorInfo.sector_index}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Stocks in Sector:</span>
                  <span className="font-medium">{safeSectorInfo.sector_stocks_count}</span>
                </div>
              </div>
            </div>

            {/* Risk Assessment */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-800">Risk Assessment</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Risk Level:</span>
                  <Badge className={getRiskLevelColor(riskLevel)}>
                    <div className="flex items-center space-x-1">
                      {getRiskLevelIcon(riskLevel)}
                      <span>{riskLevel}</span>
                    </div>
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Risk Score:</span>
                  <span className="font-medium">{(riskScore || 0).toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Stress Score:</span>
                  <span className="font-medium">{(calculatedStressScore || 0).toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Stress Level:</span>
                  <Badge variant="outline" className={getRiskLevelColor(calculatedStressLevel)}>
                    {calculatedStressLevel}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Comparison and Risk Analysis - Side by Side */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Performance Comparison */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center text-slate-800">
              <TrendingUp className="h-5 w-5 mr-2 text-blue-500" />
              Performance Comparison
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Market Performance */}
              <div className="space-y-3">
                <h4 className="font-semibold text-slate-700">Market (NIFTY 50)</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Return:</span>
                    <div className="flex items-center space-x-1">
                      {getPerformanceIconSafe(safeMarketBenchmarking.cumulative_return)}
                      <span className={`font-medium ${getPerformanceColorSafe(safeMarketBenchmarking.cumulative_return)}`}>
                        {formatPercentage(safeMarketBenchmarking.cumulative_return)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Volatility:</span>
                    <span className="font-medium">{formatPercentage(safeMarketBenchmarking.volatility)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Sharpe Ratio:</span>
                    <span className="font-medium">{formatNumber(safeMarketBenchmarking.sharpe_ratio)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Beta:</span>
                    <span className="font-medium">{formatNumber(safeMarketBenchmarking.beta)}</span>
                  </div>
                </div>
              </div>

              {/* Sector Performance */}
              <div className="space-y-3">
                <h4 className="font-semibold text-slate-700">Sector ({safeSectorInfo.sector_index})</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Return:</span>
                    <div className="flex items-center space-x-1">
                      {getPerformanceIconSafe(safeSectorData.sector_cumulative_return)}
                      <span className={`font-medium ${getPerformanceColorSafe(safeSectorData.sector_cumulative_return)}`}>
                        {formatPercentage(safeSectorData.sector_cumulative_return)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Volatility:</span>
                    <span className="font-medium">{formatPercentage(safeSectorData.sector_volatility)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Sharpe Ratio:</span>
                    <span className="font-medium">{formatNumber(safeSectorData.sector_sharpe_ratio)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Beta:</span>
                    <span className="font-medium">{formatNumber(safeSectorData.sector_beta)}</span>
                  </div>
                </div>
              </div>

              {/* Relative Performance */}
              <div className="space-y-3">
                <h4 className="font-semibold text-slate-700">Relative Performance</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">vs Market:</span>
                    <div className="flex items-center space-x-1">
                      {getPerformanceIconSafe(safeRelativePerformance.vs_market.performance_ratio)}
                      <span className={`font-medium ${getPerformanceColorSafe(safeRelativePerformance.vs_market.performance_ratio)}`}>
                        {formatPercentage(safeRelativePerformance.vs_market.performance_ratio)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">vs Sector:</span>
                    <div className="flex items-center space-x-1">
                      {getPerformanceIconSafe(safeRelativePerformance.vs_sector.performance_ratio)}
                      <span className={`font-medium ${getPerformanceColorSafe(safeRelativePerformance.vs_sector.performance_ratio)}`}>
                        {formatPercentage(safeRelativePerformance.vs_sector.performance_ratio)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Sector Rank:</span>
                    <Badge variant="outline">
                      {safeRelativePerformance.vs_sector.sector_rank !== null ? `${safeRelativePerformance.vs_sector.sector_rank}/${safeSectorInfo.sector_stocks_count}` : 'N/A'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Percentile:</span>
                    <Badge variant="secondary">
                      {safeRelativePerformance.vs_sector.sector_percentile !== null ? `${safeRelativePerformance.vs_sector.sector_percentile}th` : 'N/A'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Consistency:</span>
                    <span className="font-medium">{formatPercentage(safeRelativePerformance.vs_sector.sector_consistency)}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Risk Analysis */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center text-slate-800">
              <Shield className="h-5 w-5 mr-2 text-red-500" />
              Risk Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Risk Factors */}
              <div className="space-y-4">
                <h4 className="font-semibold text-slate-700">Risk Factors</h4>
                <div className="space-y-2">
                  {riskFactors.length > 0 ? (
                    riskFactors.map((factor, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-slate-600">{factor}</span>
                      </div>
                    ))
                  ) : (
                    <>
                      <div className="flex items-start space-x-2">
                        <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-slate-600">Oil price volatility</span>
                      </div>
                      <div className="flex items-start space-x-2">
                        <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-slate-600">Regulatory changes</span>
                      </div>
                      <div className="flex items-start space-x-2">
                        <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-slate-600">Environmental risks</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Risk Mitigation */}
              <div className="space-y-4">
                <h4 className="font-semibold text-slate-700">Risk Mitigation</h4>
                <div className="space-y-2">
                  {riskMitigation.length > 0 ? (
                    riskMitigation.map((mitigation, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-slate-600">{mitigation}</span>
                      </div>
                    ))
                  ) : (
                    <>
                      <div className="flex items-start space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-slate-600">Monitor oil price trends</span>
                      </div>
                      <div className="flex items-start space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-slate-600">Track regulatory changes</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Risk Metrics Grid */}
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-slate-50 rounded-lg">
                <div className="text-2xl font-bold text-slate-800">
                  {correlationRisk}
                </div>
                <div className="text-xs text-slate-600">Correlation Risk</div>
              </div>
              <div className="text-center p-3 bg-slate-50 rounded-lg">
                <div className="text-2xl font-bold text-slate-800">
                  {momentumRisk}
                </div>
                <div className="text-xs text-slate-600">Momentum Risk</div>
              </div>
              <div className="text-center p-3 bg-slate-50 rounded-lg">
                <div className="text-2xl font-bold text-slate-800">
                  {volatilityRisk}
                </div>
                <div className="text-xs text-slate-600">Volatility Risk</div>
              </div>
              <div className="text-center p-3 bg-slate-50 rounded-lg">
                <div className="text-2xl font-bold text-slate-800">
                  {(stressMetrics.stress_score || 0).toFixed(1)}
                </div>
                <div className="text-xs text-slate-600">Stress Score</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analysis Summary */}
      <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center text-slate-800">
            <Target className="h-5 w-5 mr-2 text-emerald-500" />
            Investment Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold text-slate-700">Position Analysis</h4>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-slate-600">Market Position:</span>
                  <p className="font-medium text-slate-800">{safeAnalysisSummary.market_position}</p>
                </div>
                <div>
                  <span className="text-sm text-slate-600">Sector Position:</span>
                  <p className="font-medium text-slate-800">{safeAnalysisSummary.sector_position}</p>
                </div>
                <div>
                  <span className="text-sm text-slate-600">Risk Assessment:</span>
                  <p className="font-medium text-slate-800">{safeAnalysisSummary.risk_assessment}</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold text-slate-700">Recommendation</h4>
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                <p className="text-emerald-800 font-medium">{safeAnalysisSummary.investment_recommendation}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SectorBenchmarkingCard; 