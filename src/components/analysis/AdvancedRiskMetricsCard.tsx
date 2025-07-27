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

interface StressScenario {
  scenario_name: string;
  impact: number;
  probability: number;
  risk_level: string;
  description: string;
}

interface StressSummary {
  stress_level: string;
  overall_impact: number;
  worst_case_scenario: string;
  recommendations: string[];
}

interface ScenarioResult {
  scenario_name: string;
  outcome: string;
  probability: number;
  impact: number;
  risk_level: string;
}

interface ScenarioSummary {
  best_case: string;
  worst_case: string;
  expected_outcome: string;
  confidence_level: number;
}

interface StressTestingData {
  stress_scenarios?: StressScenario[];
  scenario_analysis?: Record<string, number>;
  stress_summary?: StressSummary;
}

interface ScenarioAnalysisData {
  scenario_results?: ScenarioResult[];
  scenario_summary?: ScenarioSummary;
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
                          {stress_testing.stress_summary.overall_impact}
                        </div>
                        <div className="text-sm text-gray-600">Overall Impact</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">
                          {stress_testing.stress_summary.worst_case_scenario}
                        </div>
                        <div className="text-sm text-gray-600">Worst Case Scenario</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {stress_testing.stress_summary.recommendations?.length || 0}
                        </div>
                        <div className="text-sm text-gray-600">Recommendations</div>
                      </div>
                    </div>

                    {/* Key Risk Factors */}
                    {stress_testing.stress_summary.recommendations?.length > 0 && (
                      <div className="mb-4">
                        <h5 className="font-medium mb-2 flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                          Recommendations
                        </h5>
                        <ul className="text-sm space-y-1 text-gray-700">
                          {stress_testing.stress_summary.recommendations.map((rec: string, index: number) => (
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
                      {stress_testing.stress_scenarios.map((scenario, index) => (
                        <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <h5 className="font-medium text-gray-800">{scenario.scenario_name}</h5>
                          <p className="text-sm text-gray-600">{scenario.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge className={getRiskLevelColor(scenario.risk_level)}>{scenario.risk_level?.toUpperCase()}</Badge>
                            <span className="text-sm text-gray-600">Impact: {scenario.impact.toFixed(2)}%</span>
                            <span className="text-sm text-gray-600">Probability: {scenario.probability.toFixed(1)}%</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Volatility Stress */}
                    {stress_testing.scenario_analysis && (
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <h5 className="font-medium mb-3">Volatility Stress Analysis</h5>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Current Vol:</span>
                            <div className="font-bold">{formatPercentage(stress_testing.scenario_analysis.current_vol)}</div>
                          </div>
                          <div>
                            <span className="font-medium">95th Percentile:</span>
                            <div className="font-bold">{formatPercentage(stress_testing.scenario_analysis['95th_percentile'])}</div>
                          </div>
                          <div>
                            <span className="font-medium">99th Percentile:</span>
                            <div className="font-bold">{formatPercentage(stress_testing.scenario_analysis['99th_percentile'])}</div>
                          </div>
                          <div>
                            <span className="font-medium">Vol Percentile:</span>
                            <div className="font-bold">{stress_testing.scenario_analysis.vol_percentile?.toFixed(1)}%</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Tail Risk Stress */}
                    {stress_testing.scenario_analysis && (
                      <div className="p-4 bg-purple-50 rounded-lg">
                        <h5 className="font-medium mb-3">Tail Risk Analysis</h5>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="font-medium">2σ Events:</span>
                            <div className="font-bold">{stress_testing.scenario_analysis['2std_events']}</div>
                          </div>
                          <div>
                            <span className="font-medium">3σ Events:</span>
                            <div className="font-bold">{stress_testing.scenario_analysis['3std_events']}</div>
                          </div>
                          <div>
                            <span className="font-medium">2σ Frequency:</span>
                            <div className="font-bold">{formatPercentage(stress_testing.scenario_analysis['2std_frequency'])}</div>
                          </div>
                          <div>
                            <span className="font-medium">Largest Loss:</span>
                            <div className="font-bold">{formatPercentage(stress_testing.scenario_analysis.largest_daily_loss)}</div>
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
                      <Badge className={getStressLevelColor(scenario_analysis.scenario_summary.confidence_level > 0.7 ? 'low' : scenario_analysis.scenario_summary.confidence_level > 0.3 ? 'medium' : 'high')}>
                        {scenario_analysis.scenario_summary.confidence_level > 0.7 ? 'LOW RISK' : scenario_analysis.scenario_summary.confidence_level > 0.3 ? 'MEDIUM RISK' : 'HIGH RISK'}
                      </Badge>
                    </div>

                    {/* Key Insights */}
                    {scenario_analysis.scenario_summary.best_case && (
                      <div className="mb-4">
                        <h5 className="font-medium mb-2 flex items-center gap-2">
                          <BarChart3 className="h-4 w-4 text-blue-500" />
                          Best Case Scenario
                        </h5>
                        <p className="text-sm text-gray-700">{scenario_analysis.scenario_summary.best_case}</p>
                      </div>
                    )}
                    {scenario_analysis.scenario_summary.worst_case && (
                      <div className="mb-4">
                        <h5 className="font-medium mb-2 flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                          Worst Case Scenario
                        </h5>
                        <p className="text-sm text-gray-700">{scenario_analysis.scenario_summary.worst_case}</p>
                      </div>
                    )}
                    {scenario_analysis.scenario_summary.expected_outcome && (
                      <div className="mb-4">
                        <h5 className="font-medium mb-2 flex items-center gap-2">
                          <Activity className="h-4 w-4 text-green-500" />
                          Expected Outcome
                        </h5>
                        <p className="text-sm text-gray-700">{scenario_analysis.scenario_summary.expected_outcome}</p>
                      </div>
                    )}
                    {scenario_analysis.scenario_summary.confidence_level !== undefined && (
                      <div className="mb-4">
                        <h5 className="font-medium mb-2 flex items-center gap-2">
                          <Clock className="h-4 w-4 text-purple-500" />
                          Confidence Level
                        </h5>
                        <Progress value={scenario_analysis.scenario_summary.confidence_level * 100} className="w-full" />
                        <p className="text-sm text-gray-600 text-center mt-2">{scenario_analysis.scenario_summary.confidence_level * 100}%</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Return Probabilities */}
                {scenario_analysis.scenario_results && (
                  <div className="space-y-4">
                    <h4 className="font-semibold text-lg">Return Probabilities (Monte Carlo)</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {scenario_analysis.scenario_results.map((result, index) => (
                        <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <h5 className="font-medium text-gray-800">{result.scenario_name}</h5>
                          <p className="text-sm text-gray-600">Outcome: {result.outcome}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge className={getRiskLevelColor(result.risk_level)}>{result.risk_level?.toUpperCase()}</Badge>
                            <span className="text-sm text-gray-600">Probability: {result.probability.toFixed(1)}%</span>
                            <span className="text-sm text-gray-600">Impact: {result.impact.toFixed(2)}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Expected Values */}
                {scenario_analysis.scenario_results && (
                  <div className="p-4 bg-indigo-50 rounded-lg">
                    <h5 className="font-medium mb-3">Expected Values (Annual)</h5>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Expected Return:</span>
                        <div className="font-bold">{formatPercentage(scenario_analysis.scenario_results.expected_annual_return)}</div>
                      </div>
                      <div>
                        <span className="font-medium">Expected Volatility:</span>
                        <div className="font-bold">{formatPercentage(scenario_analysis.scenario_results.expected_annual_volatility)}</div>
                      </div>
                      <div>
                        <span className="font-medium">Best Case:</span>
                        <div className="font-bold">{formatPercentage(scenario_analysis.scenario_results.best_case_scenario)}</div>
                      </div>
                      <div>
                        <span className="font-medium">Worst Case:</span>
                        <div className="font-bold">{formatPercentage(scenario_analysis.scenario_results.worst_case_scenario)}</div>
                      </div>
                      <div>
                        <span className="font-medium">Median:</span>
                        <div className="font-bold">{formatPercentage(scenario_analysis.scenario_results.median_scenario)}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Recovery Analysis */}
                {scenario_analysis.scenario_results && (
                  <div className="p-4 bg-teal-50 rounded-lg">
                    <h5 className="font-medium mb-3 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Recovery Analysis
                    </h5>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Expected Recovery:</span>
                        <div className="font-bold">{scenario_analysis.scenario_results.expected_recovery_time?.toFixed(0) || 'N/A'} days</div>
                      </div>
                      <div>
                        <span className="font-medium">Median Recovery:</span>
                        <div className="font-bold">{scenario_analysis.scenario_results.median_recovery_time?.toFixed(0) || 'N/A'} days</div>
                      </div>
                      <div>
                        <span className="font-medium">Recovery ≤30d:</span>
                        <div className="font-bold">{formatPercentage(scenario_analysis.scenario_results.probability_recovery_within_30_days || 0)}</div>
                      </div>
                      <div>
                        <span className="font-medium">Recovery ≤60d:</span>
                        <div className="font-bold">{formatPercentage(scenario_analysis.scenario_results.probability_recovery_within_60_days || 0)}</div>
                      </div>
                      <div>
                        <span className="font-medium">Recovery ≤90d:</span>
                        <div className="font-bold">{formatPercentage(scenario_analysis.scenario_results.probability_recovery_within_90_days || 0)}</div>
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