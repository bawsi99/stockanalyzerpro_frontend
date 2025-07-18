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

  // Safe access to properties with defaults
  const {
    sector_info = { sector: 'Unknown', sector_name: 'Unknown', sector_index: 'Unknown', sector_stocks_count: 0 },
    market_benchmarking = { cumulative_return: 0, volatility: 0, sharpe_ratio: 0, beta: 0 },
    sector_benchmarking: sectorData = { 
      sector_cumulative_return: 0, 
      sector_volatility: 0, 
      sector_sharpe_ratio: 0, 
      sector_beta: 0 
    },
    relative_performance = { 
      vs_market: { performance_ratio: 0, sector_rank: 0, sector_consistency: 0 },
      vs_sector: { performance_ratio: 0, sector_rank: 0, sector_consistency: 0 }
    },
    sector_risk_metrics: rawSectorRiskMetrics
  } = sectorBenchmarking;

  // Safe access to sector_info with null checking
  const safeSectorInfo = {
    sector: sector_info?.sector ?? 'Unknown',
    sector_name: sector_info?.sector_name ?? 'Unknown',
    sector_index: sector_info?.sector_index ?? 'Unknown',
    sector_stocks_count: sector_info?.sector_stocks_count ?? 0
  };

  // Ensure all numeric values are safe for toFixed() calls
  const safeMarketBenchmarking = {
    cumulative_return: market_benchmarking?.cumulative_return ?? 0,
    volatility: market_benchmarking?.volatility ?? 0,
    sharpe_ratio: market_benchmarking?.sharpe_ratio ?? 0,
    beta: market_benchmarking?.beta ?? 0
  };

  const safeSectorData = {
    sector_cumulative_return: sectorData?.sector_cumulative_return ?? 0,
    sector_volatility: sectorData?.sector_volatility ?? 0,
    sector_sharpe_ratio: sectorData?.sector_sharpe_ratio ?? 0,
    sector_beta: sectorData?.sector_beta ?? 0
  };

  const safeRelativePerformance = {
    vs_market: {
      performance_ratio: relative_performance?.vs_market?.performance_ratio ?? 0,
      sector_rank: relative_performance?.vs_market?.sector_rank ?? 0,
      sector_consistency: relative_performance?.vs_market?.sector_consistency ?? 0
    },
    vs_sector: {
      performance_ratio: relative_performance?.vs_sector?.performance_ratio ?? 0,
      sector_rank: relative_performance?.vs_sector?.sector_rank ?? 0,
      sector_consistency: relative_performance?.vs_sector?.sector_consistency ?? 0
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
  const analysis_summary = sectorBenchmarking.analysis_summary || {
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

  return (
    <div className="space-y-6">
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
                  <span className="text-slate-600">Stress Level:</span>
                  <Badge variant="outline" className={getRiskLevelColor(stressMetrics.stress_level)}>
                    {stressMetrics.stress_level}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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
                    {getPerformanceIcon(safeMarketBenchmarking.cumulative_return)}
                    <span className={`font-medium ${getPerformanceColor(safeMarketBenchmarking.cumulative_return)}`}>
                      {(safeMarketBenchmarking.cumulative_return * 100).toFixed(2)}%
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Volatility:</span>
                  <span className="font-medium">{(safeMarketBenchmarking.volatility * 100).toFixed(2)}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Sharpe Ratio:</span>
                  <span className="font-medium">{safeMarketBenchmarking.sharpe_ratio.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Beta:</span>
                  <span className="font-medium">{safeMarketBenchmarking.beta.toFixed(2)}</span>
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
                    {getPerformanceIcon(safeSectorData.sector_cumulative_return)}
                    <span className={`font-medium ${getPerformanceColor(safeSectorData.sector_cumulative_return)}`}>
                      {(safeSectorData.sector_cumulative_return * 100).toFixed(2)}%
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Volatility:</span>
                  <span className="font-medium">{(safeSectorData.sector_volatility * 100).toFixed(2)}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Sharpe Ratio:</span>
                  <span className="font-medium">{safeSectorData.sector_sharpe_ratio.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Beta:</span>
                  <span className="font-medium">{safeSectorData.sector_beta.toFixed(2)}</span>
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
                    {getPerformanceIcon(safeRelativePerformance.vs_market.performance_ratio)}
                    <span className={`font-medium ${getPerformanceColor(safeRelativePerformance.vs_market.performance_ratio)}`}>
                      {(safeRelativePerformance.vs_market.performance_ratio * 100).toFixed(2)}%
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">vs Sector:</span>
                  <div className="flex items-center space-x-1">
                    {getPerformanceIcon(safeRelativePerformance.vs_sector.performance_ratio)}
                    <span className={`font-medium ${getPerformanceColor(safeRelativePerformance.vs_sector.performance_ratio)}`}>
                      {(safeRelativePerformance.vs_sector.performance_ratio * 100).toFixed(2)}%
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Sector Rank:</span>
                  <Badge variant="outline">
                    {safeRelativePerformance.vs_sector.sector_rank}/{safeSectorInfo.sector_stocks_count}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Consistency:</span>
                  <span className="font-medium">{(safeRelativePerformance.vs_sector.sector_consistency * 100).toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Risk Metrics */}
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
                {riskFactors.map((factor, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-slate-600">{factor}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Risk Mitigation */}
            <div className="space-y-4">
              <h4 className="font-semibold text-slate-700">Risk Mitigation</h4>
              <div className="space-y-2">
                {riskMitigation.map((mitigation, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-slate-600">{mitigation}</span>
                  </div>
                ))}
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
                  <p className="font-medium text-slate-800">{analysis_summary.market_position}</p>
                </div>
                <div>
                  <span className="text-sm text-slate-600">Sector Position:</span>
                  <p className="font-medium text-slate-800">{analysis_summary.sector_position}</p>
                </div>
                <div>
                  <span className="text-sm text-slate-600">Risk Assessment:</span>
                  <p className="font-medium text-slate-800">{analysis_summary.risk_assessment}</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold text-slate-700">Recommendation</h4>
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                <p className="text-emerald-800 font-medium">{analysis_summary.investment_recommendation}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SectorBenchmarkingCard; 