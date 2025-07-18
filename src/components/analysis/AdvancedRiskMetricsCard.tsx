import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Target,
  Clock,
  BarChart3,
  Shield
} from 'lucide-react';

interface StressTestingData {
  stress_scenarios?: any;
  scenario_analysis?: any;
  stress_summary?: any;
}

interface ScenarioAnalysisData {
  scenario_results?: any;
  scenario_summary?: any;
}

interface AdvancedRiskMetricsCardProps {
  stress_testing?: StressTestingData;
  scenario_analysis?: ScenarioAnalysisData;
}

const AdvancedRiskMetricsCard: React.FC<AdvancedRiskMetricsCardProps> = ({ 
  stress_testing, 
  scenario_analysis 
}) => {
  const getStressLevelColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const formatCurrency = (value: number) => {
    return `₹${value.toFixed(2)}`;
  };

  if (!stress_testing && !scenario_analysis) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Advanced Risk Metrics
          </CardTitle>
          <CardDescription>
            Stress testing and scenario analysis for comprehensive risk assessment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              Advanced risk metrics not available for this analysis.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Advanced Risk Metrics
        </CardTitle>
        <CardDescription>
          Stress testing and scenario analysis for comprehensive risk assessment
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="stress" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="stress">Stress Testing</TabsTrigger>
            <TabsTrigger value="scenario">Scenario Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="stress" className="space-y-6">
            {stress_testing && (
              <>
                {/* Stress Summary */}
                {stress_testing.stress_summary && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-lg">Stress Test Summary</h4>
                      <Badge className={getStressLevelColor(stress_testing.stress_summary.stress_level)}>
                        {stress_testing.stress_summary.stress_level?.toUpperCase()} STRESS
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {stress_testing.stress_summary.overall_stress_score}
                        </div>
                        <div className="text-sm text-gray-600">Stress Score</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">
                          {stress_testing.stress_summary.key_risk_factors?.length || 0}
                        </div>
                        <div className="text-sm text-gray-600">Risk Factors</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {stress_testing.stress_summary.mitigation_recommendations?.length || 0}
                        </div>
                        <div className="text-sm text-gray-600">Recommendations</div>
                      </div>
                    </div>

                    {/* Key Risk Factors */}
                    {stress_testing.stress_summary.key_risk_factors?.length > 0 && (
                      <div className="mb-4">
                        <h5 className="font-medium mb-2 flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                          Key Risk Factors
                        </h5>
                        <ul className="text-sm space-y-1 text-gray-700">
                          {stress_testing.stress_summary.key_risk_factors.map((factor: string, index: number) => (
                            <li key={index}>• {factor}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Mitigation Recommendations */}
                    {stress_testing.stress_summary.mitigation_recommendations?.length > 0 && (
                      <div>
                        <h5 className="font-medium mb-2 flex items-center gap-2">
                          <Target className="h-4 w-4 text-blue-500" />
                          Mitigation Recommendations
                        </h5>
                        <ul className="text-sm space-y-1 text-gray-700">
                          {stress_testing.stress_summary.mitigation_recommendations.map((rec: string, index: number) => (
                            <li key={index}>• {rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Stress Scenarios */}
                {stress_testing.stress_scenarios && (
                  <div className="space-y-4">
                    <h4 className="font-semibold text-lg">Historical Stress Scenarios</h4>
                    
                    {/* Worst Periods */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {stress_testing.stress_scenarios.worst_20d && (
                        <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                          <div className="text-sm font-medium text-red-800">Worst 20 Days</div>
                          <div className="text-lg font-bold text-red-600">
                            {formatPercentage(stress_testing.stress_scenarios.worst_20d.return)}
                          </div>
                          <div className="text-xs text-red-600">
                            Percentile: {stress_testing.stress_scenarios.worst_20d.percentile?.toFixed(1)}%
                          </div>
                        </div>
                      )}
                      
                      {stress_testing.stress_scenarios.worst_60d && (
                        <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                          <div className="text-sm font-medium text-orange-800">Worst 60 Days</div>
                          <div className="text-lg font-bold text-orange-600">
                            {formatPercentage(stress_testing.stress_scenarios.worst_60d.return)}
                          </div>
                          <div className="text-xs text-orange-600">
                            Percentile: {stress_testing.stress_scenarios.worst_60d.percentile?.toFixed(1)}%
                          </div>
                        </div>
                      )}
                      
                      {stress_testing.stress_scenarios.worst_252d && (
                        <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                          <div className="text-sm font-medium text-yellow-800">Worst Year</div>
                          <div className="text-lg font-bold text-yellow-600">
                            {formatPercentage(stress_testing.stress_scenarios.worst_252d.return)}
                          </div>
                          <div className="text-xs text-yellow-600">
                            Percentile: {stress_testing.stress_scenarios.worst_252d.percentile?.toFixed(1)}%
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Volatility Stress */}
                    {stress_testing.stress_scenarios.volatility_stress && (
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <h5 className="font-medium mb-3">Volatility Stress Analysis</h5>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Current Vol:</span>
                            <div className="font-bold">{formatPercentage(stress_testing.stress_scenarios.volatility_stress.current_vol)}</div>
                          </div>
                          <div>
                            <span className="font-medium">95th Percentile:</span>
                            <div className="font-bold">{formatPercentage(stress_testing.stress_scenarios.volatility_stress['95th_percentile'])}</div>
                          </div>
                          <div>
                            <span className="font-medium">99th Percentile:</span>
                            <div className="font-bold">{formatPercentage(stress_testing.stress_scenarios.volatility_stress['99th_percentile'])}</div>
                          </div>
                          <div>
                            <span className="font-medium">Vol Percentile:</span>
                            <div className="font-bold">{stress_testing.stress_scenarios.volatility_stress.vol_percentile?.toFixed(1)}%</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Tail Risk Stress */}
                    {stress_testing.stress_scenarios.tail_risk_stress && (
                      <div className="p-4 bg-purple-50 rounded-lg">
                        <h5 className="font-medium mb-3">Tail Risk Analysis</h5>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="font-medium">2σ Events:</span>
                            <div className="font-bold">{stress_testing.stress_scenarios.tail_risk_stress['2std_events']}</div>
                          </div>
                          <div>
                            <span className="font-medium">3σ Events:</span>
                            <div className="font-bold">{stress_testing.stress_scenarios.tail_risk_stress['3std_events']}</div>
                          </div>
                          <div>
                            <span className="font-medium">2σ Frequency:</span>
                            <div className="font-bold">{formatPercentage(stress_testing.stress_scenarios.tail_risk_stress['2std_frequency'])}</div>
                          </div>
                          <div>
                            <span className="font-medium">Largest Loss:</span>
                            <div className="font-bold">{formatPercentage(stress_testing.stress_scenarios.tail_risk_stress.largest_daily_loss)}</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="scenario" className="space-y-6">
            {scenario_analysis && (
              <>
                {/* Scenario Summary */}
                {scenario_analysis.scenario_summary && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-lg">Scenario Analysis Summary</h4>
                      <Badge className={getStressLevelColor(scenario_analysis.scenario_summary.overall_risk_level)}>
                        {scenario_analysis.scenario_summary.overall_risk_level?.toUpperCase()} RISK
                      </Badge>
                    </div>

                    {/* Key Insights */}
                    {scenario_analysis.scenario_summary.key_scenario_insights?.length > 0 && (
                      <div className="mb-4">
                        <h5 className="font-medium mb-2 flex items-center gap-2">
                          <BarChart3 className="h-4 w-4 text-blue-500" />
                          Key Insights
                        </h5>
                        <ul className="text-sm space-y-1 text-gray-700">
                          {scenario_analysis.scenario_summary.key_scenario_insights.map((insight: string, index: number) => (
                            <li key={index}>• {insight}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Recommended Actions */}
                    {scenario_analysis.scenario_summary.recommended_actions?.length > 0 && (
                      <div>
                        <h5 className="font-medium mb-2 flex items-center gap-2">
                          <Target className="h-4 w-4 text-green-500" />
                          Recommended Actions
                        </h5>
                        <ul className="text-sm space-y-1 text-gray-700">
                          {scenario_analysis.scenario_summary.recommended_actions.map((action: string, index: number) => (
                            <li key={index}>• {action}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Return Probabilities */}
                {scenario_analysis.scenario_results?.return_probabilities && (
                  <div className="space-y-4">
                    <h4 className="font-semibold text-lg">Return Probabilities (Monte Carlo)</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                        <div className="text-sm font-medium text-green-800">Positive Return</div>
                        <div className="text-lg font-bold text-green-600">
                          {formatPercentage(scenario_analysis.scenario_results.return_probabilities.probability_positive_return)}
                        </div>
                      </div>
                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="text-sm font-medium text-blue-800">10% Gain</div>
                        <div className="text-lg font-bold text-blue-600">
                          {formatPercentage(scenario_analysis.scenario_results.return_probabilities.probability_10_percent_gain)}
                        </div>
                      </div>
                      <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                        <div className="text-sm font-medium text-purple-800">20% Gain</div>
                        <div className="text-lg font-bold text-purple-600">
                          {formatPercentage(scenario_analysis.scenario_results.return_probabilities.probability_20_percent_gain)}
                        </div>
                      </div>
                      <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                        <div className="text-sm font-medium text-yellow-800">10% Loss</div>
                        <div className="text-lg font-bold text-yellow-600">
                          {formatPercentage(scenario_analysis.scenario_results.return_probabilities.probability_10_percent_loss)}
                        </div>
                      </div>
                      <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                        <div className="text-sm font-medium text-orange-800">20% Loss</div>
                        <div className="text-lg font-bold text-orange-600">
                          {formatPercentage(scenario_analysis.scenario_results.return_probabilities.probability_20_percent_loss)}
                        </div>
                      </div>
                      <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                        <div className="text-sm font-medium text-red-800">30% Loss</div>
                        <div className="text-lg font-bold text-red-600">
                          {formatPercentage(scenario_analysis.scenario_results.return_probabilities.probability_30_percent_loss)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Expected Values */}
                {scenario_analysis.scenario_results?.expected_values && (
                  <div className="p-4 bg-indigo-50 rounded-lg">
                    <h5 className="font-medium mb-3">Expected Values (Annual)</h5>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Expected Return:</span>
                        <div className="font-bold">{formatPercentage(scenario_analysis.scenario_results.expected_values.expected_annual_return)}</div>
                      </div>
                      <div>
                        <span className="font-medium">Expected Volatility:</span>
                        <div className="font-bold">{formatPercentage(scenario_analysis.scenario_results.expected_values.expected_annual_volatility)}</div>
                      </div>
                      <div>
                        <span className="font-medium">Best Case:</span>
                        <div className="font-bold">{formatPercentage(scenario_analysis.scenario_results.expected_values.best_case_scenario)}</div>
                      </div>
                      <div>
                        <span className="font-medium">Worst Case:</span>
                        <div className="font-bold">{formatPercentage(scenario_analysis.scenario_results.expected_values.worst_case_scenario)}</div>
                      </div>
                      <div>
                        <span className="font-medium">Median:</span>
                        <div className="font-bold">{formatPercentage(scenario_analysis.scenario_results.expected_values.median_scenario)}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Recovery Analysis */}
                {scenario_analysis.scenario_results?.recovery_analysis && (
                  <div className="p-4 bg-teal-50 rounded-lg">
                    <h5 className="font-medium mb-3 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Recovery Analysis
                    </h5>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Expected Recovery:</span>
                        <div className="font-bold">{scenario_analysis.scenario_results.recovery_analysis.expected_recovery_time?.toFixed(0) || 'N/A'} days</div>
                      </div>
                      <div>
                        <span className="font-medium">Median Recovery:</span>
                        <div className="font-bold">{scenario_analysis.scenario_results.recovery_analysis.median_recovery_time?.toFixed(0) || 'N/A'} days</div>
                      </div>
                      <div>
                        <span className="font-medium">Recovery ≤30d:</span>
                        <div className="font-bold">{formatPercentage(scenario_analysis.scenario_results.recovery_analysis.probability_recovery_within_30_days || 0)}</div>
                      </div>
                      <div>
                        <span className="font-medium">Recovery ≤60d:</span>
                        <div className="font-bold">{formatPercentage(scenario_analysis.scenario_results.recovery_analysis.probability_recovery_within_60_days || 0)}</div>
                      </div>
                      <div>
                        <span className="font-medium">Recovery ≤90d:</span>
                        <div className="font-bold">{formatPercentage(scenario_analysis.scenario_results.recovery_analysis.probability_recovery_within_90_days || 0)}</div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default AdvancedRiskMetricsCard; 