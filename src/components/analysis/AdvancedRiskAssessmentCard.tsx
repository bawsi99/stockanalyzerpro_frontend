import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, TrendingUp, TrendingDown, BarChart3, Target, Shield, Activity } from "lucide-react";

interface RiskMetrics {
  basic_metrics: {
    volatility: number;
    annualized_volatility: number;
    mean_return: number;
    annualized_return: number;
  };
  var_metrics: {
    var_95: number;
    var_99: number;
    es_95: number;
    es_99: number;
  };
  drawdown_metrics: {
    max_drawdown: number;
    current_drawdown: number;
    drawdown_duration: number;
  };
  risk_adjusted_metrics: {
    sharpe_ratio: number;
    sortino_ratio: number;
    calmar_ratio: number;
    risk_adjusted_return: number;
  };
  distribution_metrics: {
    skewness: number;
    kurtosis: number;
    tail_frequency: number;
  };
  volatility_analysis: {
    current_volatility: number;
    volatility_percentile: number;
    volatility_regime: string;
  };
  liquidity_analysis: {
    liquidity_score: number;
    volume_volatility?: number;
  };
  correlation_analysis: {
    market_correlation: number;
    beta: number;
  };
  risk_assessment: {
    overall_risk_score: number;
    risk_level: string;
    risk_components: {
      volatility_risk: number;
      drawdown_risk: number;
      tail_risk: number;
      liquidity_risk: number;
      correlation_risk: number;
    };
    mitigation_strategies: string[];
  };
}

interface AdvancedRiskAssessmentCardProps {
  riskMetrics: RiskMetrics;
  symbol: string;
}

const AdvancedRiskAssessmentCard: React.FC<AdvancedRiskAssessmentCardProps> = ({ riskMetrics, symbol }) => {
  // Debug: Log the risk metrics received by the component
  // console.log('🔍 DEBUG: AdvancedRiskAssessmentCard received riskMetrics:', riskMetrics);
  // console.log('🔍 DEBUG: AdvancedRiskAssessmentCard liquidity_analysis:', riskMetrics?.liquidity_analysis);
  // console.log('🔍 DEBUG: AdvancedRiskAssessmentCard correlation_analysis:', riskMetrics?.correlation_analysis);
  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRiskScoreColor = (score: number) => {
    if (score >= 70) return 'bg-red-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const formatPercentage = (value: number) => {
    const numeric = typeof value === 'number' ? value : 0;
    const isAlreadyPercent = Math.abs(numeric) > 1; // treat values >1 as already percent units
    const pct = isAlreadyPercent ? numeric : numeric * 100;
    return `${pct.toFixed(2)}%`;
  };

  const formatNumber = (value: number, decimals: number = 2) => {
    return value.toFixed(decimals);
  };

  const renderMetricCard = (title: string, metrics: Record<string, number | string>, icon: React.ReactNode) => (
    <div className="border rounded-lg p-4 bg-white">
      <div className="flex items-center space-x-2 mb-3">
        {icon}
        <h3 className="font-semibold">{title}</h3>
      </div>
      <div className="space-y-2 text-sm">
        {Object.entries(metrics).map(([key, value]) => (
          <div key={key} className="flex justify-between">
            <span className="capitalize">{key.replace(/_/g, ' ')}:</span>
            <span className="font-medium">
              {typeof value === 'number' ? formatNumber(value) : value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  if (!riskMetrics) {
    return (
      <Card className="w-full shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-t-lg">
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-6 w-6" />
            <span>Advanced Risk Assessment</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center py-8 text-gray-500">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No risk assessment data available</p>
            <p className="text-sm">Comprehensive risk metrics and analysis</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full shadow-xl border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader className="bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-t-lg">
        <CardTitle className="flex items-center space-x-2">
          <AlertTriangle className="h-6 w-6" />
          <span>Advanced Risk Assessment</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Overall Risk Score */}
        <div className="border-2 border-red-200 rounded-lg p-4 bg-red-50">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-lg">Overall Risk Assessment</h3>
            <Badge className={getRiskLevelColor(riskMetrics?.risk_assessment?.risk_level || 'medium')}>
              {(riskMetrics?.risk_assessment?.risk_level || 'medium').toUpperCase()} RISK
            </Badge>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Risk Score</span>
                <span>{(riskMetrics?.risk_assessment?.overall_risk_score || 0).toFixed(0)}/100</span>
              </div>
              <Progress 
                value={riskMetrics?.risk_assessment?.overall_risk_score || 0} 
                className="h-3"
                style={{
                  '--progress-background': getRiskScoreColor(riskMetrics?.risk_assessment?.overall_risk_score || 0)
                } as React.CSSProperties}
              />
            </div>

            {/* Risk Components */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
              {Object.entries(riskMetrics?.risk_assessment?.risk_components || {}).map(([component, score]) => (
                <div key={component} className="text-center p-2 bg-white rounded border">
                  <div className="font-semibold">{(score as number).toFixed(0)}</div>
                  <div className="text-gray-600 capitalize">{component.replace(/_/g, ' ')}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <Separator />

        {/* Risk Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {renderMetricCard(
            "Basic Metrics",
            {
              volatility: formatPercentage(riskMetrics?.basic_metrics?.volatility || 0),
              annualized_volatility: formatPercentage(riskMetrics?.basic_metrics?.annualized_volatility || 0),
              mean_return: formatPercentage(riskMetrics?.basic_metrics?.mean_return || 0),
              annualized_return: formatPercentage(riskMetrics?.basic_metrics?.annualized_return || 0)
            },
            <BarChart3 className="h-5 w-5 text-blue-500" />
          )}

          {renderMetricCard(
            "Value at Risk",
            {
              "95% VaR": formatPercentage(riskMetrics?.var_metrics?.var_95 || 0),
              "99% VaR": formatPercentage(riskMetrics?.var_metrics?.var_99 || 0),
              "95% ES": formatPercentage(riskMetrics?.var_metrics?.es_95 || 0),
              "99% ES": formatPercentage(riskMetrics?.var_metrics?.es_99 || 0)
            },
            <AlertTriangle className="h-5 w-5 text-red-500" />
          )}

          {renderMetricCard(
            "Drawdown Metrics",
            {
              max_drawdown: formatPercentage(riskMetrics?.drawdown_metrics?.max_drawdown || 0),
              current_drawdown: formatPercentage(riskMetrics?.drawdown_metrics?.current_drawdown || 0),
              duration: `${riskMetrics?.drawdown_metrics?.drawdown_duration || 0} days`
            },
            <TrendingDown className="h-5 w-5 text-orange-500" />
          )}

          {renderMetricCard(
            "Risk-Adjusted Metrics",
            {
              sharpe_ratio: formatNumber(riskMetrics?.risk_adjusted_metrics?.sharpe_ratio || 0),
              sortino_ratio: formatNumber(riskMetrics?.risk_adjusted_metrics?.sortino_ratio || 0),
              calmar_ratio: formatNumber(riskMetrics?.risk_adjusted_metrics?.calmar_ratio || 0),
              risk_adjusted_return: formatPercentage(riskMetrics?.risk_adjusted_metrics?.risk_adjusted_return || 0)
            },
            <Target className="h-5 w-5 text-green-500" />
          )}

          {renderMetricCard(
            "Distribution Metrics",
            {
              skewness: formatNumber(riskMetrics?.distribution_metrics?.skewness || 0),
              kurtosis: formatNumber(riskMetrics?.distribution_metrics?.kurtosis || 0),
              tail_frequency: formatPercentage(riskMetrics?.distribution_metrics?.tail_frequency || 0)
            },
            <Activity className="h-5 w-5 text-purple-500" />
          )}

          {renderMetricCard(
            "Volatility Analysis",
            {
              current_volatility: formatPercentage(riskMetrics?.volatility_analysis?.current_volatility || 0),
              volatility_percentile: formatNumber(riskMetrics?.volatility_analysis?.volatility_percentile || 0),
              regime: riskMetrics?.volatility_analysis?.volatility_regime || 'normal'
            },
            <TrendingUp className="h-5 w-5 text-indigo-500" />
          )}
        </div>

        {/* Liquidity and Correlation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {renderMetricCard(
            "Liquidity Analysis",
            {
              liquidity_score: `${(riskMetrics?.liquidity_analysis?.liquidity_score || 0).toFixed(0)}/100`,
              volume_volatility: riskMetrics?.liquidity_analysis?.volume_volatility !== undefined && riskMetrics?.liquidity_analysis?.volume_volatility !== null
                ? formatPercentage(riskMetrics.liquidity_analysis.volume_volatility)
                : 'N/A'
            },
            <Shield className="h-5 w-5 text-teal-500" />
          )}

          {renderMetricCard(
            "Correlation Analysis",
            {
              market_correlation: formatNumber(riskMetrics?.correlation_analysis?.market_correlation || 0),
              beta: formatNumber(riskMetrics?.correlation_analysis?.beta || 0)
            },
            <BarChart3 className="h-5 w-5 text-cyan-500" />
          )}
        </div>

        {/* Mitigation Strategies and Risk Summary - Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Mitigation Strategies */}
          {(riskMetrics?.risk_assessment?.mitigation_strategies?.length || 0) > 0 && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-semibold mb-3 flex items-center space-x-2">
                <Shield className="h-5 w-5 text-yellow-600" />
                <span>Risk Mitigation Strategies</span>
              </h4>
              <ul className="space-y-2 text-sm">
                {(riskMetrics?.risk_assessment?.mitigation_strategies || []).map((strategy, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <span className="text-yellow-600 mt-1">•</span>
                    <span>{strategy}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Risk Summary */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold mb-3">Risk Summary</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <span>
                  <strong>Risk Level:</strong> {(riskMetrics?.risk_assessment?.risk_level || 'medium').toUpperCase()} 
                  (Score: {(riskMetrics?.risk_assessment?.overall_risk_score || 0).toFixed(0)}/100)
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <TrendingDown className="h-4 w-4 text-orange-500" />
                <span>
                  <strong>Max Drawdown:</strong> {formatPercentage(riskMetrics?.drawdown_metrics?.max_drawdown || 0)}
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-4 w-4 text-blue-500" />
                <span>
                  <strong>Volatility Regime:</strong> {(riskMetrics?.volatility_analysis?.volatility_regime || 'normal').toUpperCase()}
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Target className="h-4 w-4 text-green-500" />
                <span>
                  <strong>Sharpe Ratio:</strong> {formatNumber(riskMetrics?.risk_adjusted_metrics?.sharpe_ratio || 0)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdvancedRiskAssessmentCard; 