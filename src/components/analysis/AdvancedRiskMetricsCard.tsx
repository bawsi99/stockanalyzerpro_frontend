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
  stress_scenarios?: StressScenario[] | any;
  scenario_analysis?: Record<string, number> | any;
  stress_summary?: StressSummary;
  error?: string;
}

interface ScenarioAnalysisData {
  scenario_results?: ScenarioResult[] | any;
  scenario_summary?: ScenarioSummary;
  error?: string;
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
    if (typeof value !== 'number' || isNaN(value)) return 'N/A';
    return `${(value * 100).toFixed(1)}%`;
  };

  const formatCurrency = (value: number) => {
    if (typeof value !== 'number' || isNaN(value)) return 'N/A';
    return `₹${value.toFixed(2)}`;
  };

  // Helper function to safely check if data is an array
  const isArray = (data: any): data is any[] => {
    return Array.isArray(data);
  };

  // Helper function to safely get stress scenarios
  const getStressScenarios = (): StressScenario[] => {
    if (!stress_testing?.stress_scenarios) return [];
    
    // If it's already an array, return it
    if (isArray(stress_testing.stress_scenarios)) {
      return stress_testing.stress_scenarios;
    }
    
    // If it's an object, convert the nested structure to scenarios
    if (typeof stress_testing.stress_scenarios === 'object') {
      const scenarios: StressScenario[] = [];
      const obj = stress_testing.stress_scenarios as Record<string, any>;
      
      // Handle the backend structure: historical_stress, monte_carlo_stress, sector_stress, crash_scenarios
      Object.entries(obj).forEach(([category, categoryData]) => {
        if (typeof categoryData === 'object' && categoryData !== null) {
          Object.entries(categoryData as Record<string, any>).forEach(([scenarioName, value]) => {
            if (typeof value === 'number') {
              scenarios.push({
                scenario_name: `${category.replace(/_/g, ' ')} - ${scenarioName.replace(/_/g, ' ')}`,
                impact: Math.abs(value), // Convert negative values to positive for display
                probability: 0.1, // Default probability since not provided
                risk_level: Math.abs(value) > 0.15 ? 'high' : Math.abs(value) > 0.08 ? 'medium' : 'low',
                description: `${category.replace(/_/g, ' ')} scenario: ${scenarioName.replace(/_/g, ' ')}`
              });
            }
          });
        }
      });
      
      if (scenarios.length > 0) {
        return scenarios;
      }
    }
    
    // If we can't convert it, log a warning and return empty array
    console.warn('stress_scenarios is not in expected format:', stress_testing.stress_scenarios);
    return [];
  };

  // Helper function to safely get scenario results
  const getScenarioResults = (): ScenarioResult[] => {
    if (!scenario_analysis?.scenario_results) return [];
    
    // Debug: Log the scenario_results to see what we're working with
    console.log('🔍 DEBUG: scenario_results:', scenario_analysis.scenario_results);
    
    // If it's already an array, return it
    if (isArray(scenario_analysis.scenario_results)) {
      return scenario_analysis.scenario_results;
    }
    
    // If it's an object, try to convert it to an array format
    if (typeof scenario_analysis.scenario_results === 'object') {
      const results: ScenarioResult[] = [];
      const obj = scenario_analysis.scenario_results as Record<string, any>;
      
      // Handle different possible object structures
      Object.entries(obj).forEach(([key, value]) => {
        if (typeof value === 'object' && value !== null) {
          // If the value is an object with outcome/probability, treat it as a scenario result
          if ('outcome' in value || 'probability' in value) {
            results.push({
              scenario_name: key,
              outcome: value.outcome || 'unknown',
              probability: value.probability || 0,
              impact: value.impact || 0,
              risk_level: value.risk_level || 'medium'
            });
          }
        }
      });
      
      if (results.length > 0) {
        return results;
      }
    }
    
    // If we can't convert it, log a warning and return empty array
    console.warn('scenario_results is not in expected format:', scenario_analysis.scenario_results);
    return [];
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
            Advanced risk analysis and stress testing scenarios
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Shield className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No advanced risk metrics available</p>
            <p className="text-sm">Advanced risk analysis and stress testing data</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Handle error cases
  if (stress_testing?.error || scenario_analysis?.error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Advanced Risk Metrics Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {stress_testing?.error || scenario_analysis?.error || 'Error loading advanced risk metrics'}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-t-lg">
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-6 w-6" />
          Advanced Risk Metrics
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
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
                        {stress_testing.stress_summary.stress_level?.toUpperCase() || 'UNKNOWN'}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
                      <div className="text-center p-3 bg-white rounded-lg border">
                        <div className="text-2xl font-bold text-blue-600">
                          {formatPercentage(stress_testing.stress_summary.overall_impact)}
                        </div>
                        <div className="text-sm text-gray-600">Overall Impact</div>
                      </div>
                      <div className="text-center p-3 bg-white rounded-lg border">
                        <div className="text-lg font-semibold text-red-600">
                          {stress_testing.stress_summary.worst_case_scenario || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-600">Worst Case</div>
                      </div>
                      <div className="text-center p-3 bg-white rounded-lg border">
                        <div className="text-lg font-semibold text-purple-600">
                          {stress_testing.stress_summary.recommendations?.length || 0}
                        </div>
                        <div className="text-sm text-gray-600">Recommendations</div>
                      </div>
                      <div className="text-center p-3 bg-white rounded-lg border">
                        <div className="text-lg font-semibold text-green-600">
                          {stress_testing.stress_summary.stress_level || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-600">Stress Level</div>
                      </div>
                      <div className="text-center p-3 bg-white rounded-lg border">
                        <div className="text-lg font-semibold text-orange-600">
                          {stress_testing.stress_summary.overall_impact ? 
                           (stress_testing.stress_summary.overall_impact > 0.15 ? 'High' : 
                            stress_testing.stress_summary.overall_impact > 0.08 ? 'Medium' : 'Low') : 'N/A'}
                        </div>
                        <div className="text-sm text-gray-600">Risk Level</div>
                      </div>
                    </div>

                    {/* Recommendations */}
                    {stress_testing.stress_summary.recommendations && isArray(stress_testing.stress_summary.recommendations) && (
                      <div className="mt-4">
                        <h5 className="font-medium mb-2">Key Recommendations:</h5>
                        <ul className="space-y-1 text-sm">
                          {stress_testing.stress_summary.recommendations.map((rec, index) => (
                            <li key={index} className="text-gray-700">• {rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Stress Scenarios */}
                {getStressScenarios().length > 0 && (
                  <div className="space-y-4">
                    <h4 className="font-semibold text-lg">Historical Stress Scenarios</h4>
                    
                    {/* Worst Periods */}
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                      {getStressScenarios().map((scenario, index) => (
                        <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <h5 className="font-medium text-gray-800">{scenario.scenario_name || 'Unknown Scenario'}</h5>
                          <p className="text-sm text-gray-600">{scenario.description || 'No description available'}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge className={getRiskLevelColor(scenario.risk_level)}>
                              {scenario.risk_level?.toUpperCase() || 'UNKNOWN'}
                            </Badge>
                            <span className="text-sm text-gray-600">
                              Impact: {typeof scenario.impact === 'number' ? scenario.impact.toFixed(2) : 'N/A'}%
                            </span>
                            <span className="text-sm text-gray-600">
                              Probability: {typeof scenario.probability === 'number' ? scenario.probability.toFixed(1) : 'N/A'}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Volatility Stress */}
                    {stress_testing.scenario_analysis && typeof stress_testing.scenario_analysis === 'object' && (
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <h5 className="font-medium mb-3">Volatility Stress Analysis</h5>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Current Vol:</span>
                            <div className="font-bold">
                              {typeof stress_testing.scenario_analysis.current_vol === 'number' 
                                ? formatPercentage(stress_testing.scenario_analysis.current_vol) 
                                : 'N/A'}
                            </div>
                          </div>
                          <div>
                            <span className="font-medium">95th Percentile:</span>
                            <div className="font-bold">
                              {typeof stress_testing.scenario_analysis['95th_percentile'] === 'number' 
                                ? formatPercentage(stress_testing.scenario_analysis['95th_percentile']) 
                                : 'N/A'}
                            </div>
                          </div>
                          <div>
                            <span className="font-medium">99th Percentile:</span>
                            <div className="font-bold">
                              {typeof stress_testing.scenario_analysis['99th_percentile'] === 'number' 
                                ? formatPercentage(stress_testing.scenario_analysis['99th_percentile']) 
                                : 'N/A'}
                            </div>
                          </div>
                          <div>
                            <span className="font-medium">Vol Percentile:</span>
                            <div className="font-bold">
                              {typeof stress_testing.scenario_analysis.vol_percentile === 'number' 
                                ? stress_testing.scenario_analysis.vol_percentile.toFixed(1) + '%' 
                                : 'N/A'}
                            </div>
                          </div>
                          <div>
                            <span className="font-medium">Vol Regime:</span>
                            <div className="font-bold">
                              {typeof stress_testing.scenario_analysis.current_vol === 'number' 
                                ? (stress_testing.scenario_analysis.current_vol > 0.3 ? 'High' : 
                                   stress_testing.scenario_analysis.current_vol > 0.2 ? 'Medium' : 'Low')
                                : 'N/A'}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Tail Risk Stress */}
                    {stress_testing.scenario_analysis && typeof stress_testing.scenario_analysis === 'object' && (
                      <div className="p-4 bg-purple-50 rounded-lg">
                        <h5 className="font-medium mb-3">Tail Risk Analysis</h5>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                          <div>
                            <span className="font-medium">2σ Events:</span>
                            <div className="font-bold">
                              {typeof stress_testing.scenario_analysis['2std_events'] === 'number' 
                                ? stress_testing.scenario_analysis['2std_events'] 
                                : 'N/A'}
                            </div>
                          </div>
                          <div>
                            <span className="font-medium">3σ Events:</span>
                            <div className="font-bold">
                              {typeof stress_testing.scenario_analysis['3std_events'] === 'number' 
                                ? stress_testing.scenario_analysis['3std_events'] 
                                : 'N/A'}
                            </div>
                          </div>
                          <div>
                            <span className="font-medium">2σ Frequency:</span>
                            <div className="font-bold">
                              {typeof stress_testing.scenario_analysis['2std_frequency'] === 'number' 
                                ? formatPercentage(stress_testing.scenario_analysis['2std_frequency']) 
                                : 'N/A'}
                            </div>
                          </div>
                          <div>
                            <span className="font-medium">Largest Loss:</span>
                            <div className="font-bold">
                              {typeof stress_testing.scenario_analysis.largest_daily_loss === 'number' 
                                ? formatPercentage(stress_testing.scenario_analysis.largest_daily_loss) 
                                : 'N/A'}
                            </div>
                          </div>
                          <div>
                            <span className="font-medium">Tail Risk:</span>
                            <div className="font-bold">
                              {typeof stress_testing.scenario_analysis['3std_events'] === 'number' && 
                               typeof stress_testing.scenario_analysis['2std_events'] === 'number' 
                                ? (stress_testing.scenario_analysis['3std_events'] > 5 ? 'High' : 
                                   stress_testing.scenario_analysis['3std_events'] > 2 ? 'Medium' : 'Low')
                                : 'N/A'}
                            </div>
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
            {scenario_analysis && scenario_analysis.scenario_results && (
              <>
                {/* Scenario Summary */}
                {scenario_analysis.scenario_summary && 
                 typeof scenario_analysis.scenario_summary.best_case === 'string' &&
                 typeof scenario_analysis.scenario_summary.worst_case === 'string' &&
                 typeof scenario_analysis.scenario_summary.expected_outcome === 'string' && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-lg">Scenario Analysis Summary</h4>
                      <Badge className={getStressLevelColor(
                        typeof scenario_analysis.scenario_summary.confidence_level === 'number' ? 
                        (scenario_analysis.scenario_summary.confidence_level > 0.7 ? 'low' : scenario_analysis.scenario_summary.confidence_level > 0.3 ? 'medium' : 'high') : 'medium'
                      )}>
                        {typeof scenario_analysis.scenario_summary.confidence_level === 'number' ? 
                         (scenario_analysis.scenario_summary.confidence_level > 0.7 ? 'LOW RISK' : scenario_analysis.scenario_summary.confidence_level > 0.3 ? 'MEDIUM RISK' : 'HIGH RISK') : 'MEDIUM RISK'}
                      </Badge>
                    </div>

                    {/* Key Insights */}
                    {scenario_analysis.scenario_summary.best_case && (
                      <div className="mb-4">
                        <h5 className="font-medium mb-2 flex items-center gap-2">
                          <BarChart3 className="h-4 w-4 text-blue-500" />
                          Best Case Scenario
                        </h5>
                        <p className="text-sm text-gray-700 bg-blue-50 p-3 rounded">
                          {scenario_analysis.scenario_summary.best_case}
                        </p>
                      </div>
                    )}

                    {scenario_analysis.scenario_summary.worst_case && (
                      <div className="mb-4">
                        <h5 className="font-medium mb-2 flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                          Worst Case Scenario
                        </h5>
                        <p className="text-sm text-gray-700 bg-red-50 p-3 rounded">
                          {scenario_analysis.scenario_summary.worst_case}
                        </p>
                      </div>
                    )}

                    {scenario_analysis.scenario_summary.expected_outcome && (
                      <div className="mb-4">
                        <h5 className="font-medium mb-2 flex items-center gap-2">
                          <Target className="h-4 w-4 text-green-500" />
                          Expected Outcome
                        </h5>
                        <p className="text-sm text-gray-700 bg-green-50 p-3 rounded">
                          {scenario_analysis.scenario_summary.expected_outcome}
                        </p>
                      </div>
                    )}

                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Confidence Level</span>
                        <span className="text-sm text-gray-600">
                          {typeof scenario_analysis.scenario_summary.confidence_level === 'number' ? 
                           (scenario_analysis.scenario_summary.confidence_level * 100).toFixed(1) : '0.0'}%
                        </span>
                      </div>
                      <Progress 
                        value={typeof scenario_analysis.scenario_summary.confidence_level === 'number' ? 
                               scenario_analysis.scenario_summary.confidence_level * 100 : 0} 
                        className="h-2"
                      />
                    </div>
                  </div>
                )}

                {/* Scenario Results */}
                {getScenarioResults().length > 0 && getScenarioResults().every(result => 
                  typeof result === 'object' && 
                  typeof result.scenario_name === 'string' && 
                  typeof result.outcome === 'string'
                ) && (
                  <div className="space-y-4">
                    <h4 className="font-semibold text-lg">Detailed Scenario Results</h4>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                      {getScenarioResults().map((result, index) => (
                        <div key={index} className="p-4 bg-white rounded-lg border border-gray-200">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-medium text-gray-800">{result.scenario_name || 'Unknown Scenario'}</h5>
                            <Badge className={getRiskLevelColor(result.risk_level)}>
                              {result.risk_level?.toUpperCase() || 'UNKNOWN'}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">
                            {typeof result.outcome === 'string' ? result.outcome : 
                             typeof result.outcome === 'object' ? JSON.stringify(result.outcome) : 
                             'No outcome available'}
                          </p>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="font-medium">Probability:</span>
                              <div className="text-gray-700">
                                {typeof result.probability === 'number' ? result.probability.toFixed(1) + '%' : 'N/A'}
                              </div>
                            </div>
                            <div>
                              <span className="font-medium">Impact:</span>
                              <div className="text-gray-700">
                                {typeof result.impact === 'number' ? result.impact.toFixed(2) + '%' : 'N/A'}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>

        {/* Interpretation Guide */}
        <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-blue-800">How to Interpret Stress Testing & Scenario Analysis</h3>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Stress Testing Guide */}
            <div className="space-y-4">
              <h4 className="font-medium text-blue-700 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Stress Testing Interpretation
              </h4>
              
              <div className="space-y-3 text-sm">
                <div className="bg-white p-3 rounded border border-blue-100">
                  <h5 className="font-medium text-blue-800 mb-1">Stress Level Indicators</h5>
                  <ul className="space-y-1 text-blue-700">
                    <li><span className="font-medium">Low (Green):</span> Stock shows resilience under stress conditions</li>
                    <li><span className="font-medium">Medium (Yellow):</span> Moderate vulnerability to market stress</li>
                    <li><span className="font-medium">High (Red):</span> Significant risk during market downturns</li>
                  </ul>
                </div>

                <div className="bg-white p-3 rounded border border-blue-100">
                  <h5 className="font-medium text-blue-800 mb-1">Impact Metrics</h5>
                  <ul className="space-y-1 text-blue-700">
                    <li><span className="font-medium">Overall Impact:</span> Expected portfolio loss under stress scenarios</li>
                    <li><span className="font-medium">Volatility Percentile:</span> Current volatility vs historical levels</li>
                    <li><span className="font-medium">Tail Risk Events:</span> Frequency of extreme market movements</li>
                  </ul>
                </div>

                <div className="bg-white p-3 rounded border border-blue-100">
                  <h5 className="font-medium text-blue-800 mb-1">Key Risk Factors</h5>
                  <ul className="space-y-1 text-blue-700">
                    <li><span className="font-medium">High Volatility:</span> Stock price swings more than market average</li>
                    <li><span className="font-medium">Low Liquidity:</span> Difficulty selling without price impact</li>
                    <li><span className="font-medium">Sector Concentration:</span> Over-exposure to specific industry risks</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Scenario Analysis Guide */}
            <div className="space-y-4">
              <h4 className="font-medium text-blue-700 flex items-center gap-2">
                <Target className="h-4 w-4" />
                Scenario Analysis Interpretation
              </h4>
              
              <div className="space-y-3 text-sm">
                <div className="bg-white p-3 rounded border border-blue-100">
                  <h5 className="font-medium text-blue-800 mb-1">Scenario Outcomes</h5>
                  <ul className="space-y-1 text-blue-700">
                    <li><span className="font-medium">Best Case:</span> Optimal conditions for stock performance</li>
                    <li><span className="font-medium">Expected:</span> Most likely outcome based on current trends</li>
                    <li><span className="font-medium">Worst Case:</span> Adverse conditions and potential losses</li>
                  </ul>
                </div>

                <div className="bg-white p-3 rounded border border-blue-100">
                  <h5 className="font-medium text-blue-800 mb-1">Confidence Levels</h5>
                  <ul className="space-y-1 text-blue-700">
                    <li><span className="font-medium">High (70%+):</span> Strong confidence in predicted outcomes</li>
                    <li><span className="font-medium">Medium (30-70%):</span> Moderate confidence with some uncertainty</li>
                    <li><span className="font-medium">Low (Below 30%):</span> High uncertainty in predictions</li>
                  </ul>
                </div>

                <div className="bg-white p-3 rounded border border-blue-100">
                  <h5 className="font-medium text-blue-800 mb-1">Probability vs Impact</h5>
                  <ul className="space-y-1 text-blue-700">
                    <li><span className="font-medium">High Probability, Low Impact:</span> Frequent small losses</li>
                    <li><span className="font-medium">Low Probability, High Impact:</span> Rare but significant losses</li>
                    <li><span className="font-medium">High Probability, High Impact:</span> Major risk requiring attention</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Actionable Insights */}
          <div className="mt-6 p-4 bg-blue-100 rounded-lg border border-blue-300">
            <h4 className="font-medium text-blue-800 mb-3 flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Actionable Insights
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="bg-white p-3 rounded border">
                <h5 className="font-medium text-blue-800 mb-1">Risk Management</h5>
                <p className="text-blue-700">Use stress test results to set appropriate stop-loss levels and position sizes</p>
              </div>
              <div className="bg-white p-3 rounded border">
                <h5 className="font-medium text-blue-800 mb-1">Portfolio Diversification</h5>
                <p className="text-blue-700">Consider correlation with other holdings to reduce overall portfolio risk</p>
              </div>
              <div className="bg-white p-3 rounded border">
                <h5 className="font-medium text-blue-800 mb-1">Entry/Exit Timing</h5>
                <p className="text-blue-700">Use scenario analysis to identify optimal entry points and exit strategies</p>
              </div>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-xs text-yellow-800 text-center">
              <strong>Disclaimer:</strong> Stress testing and scenario analysis are based on historical data and statistical models. 
              Past performance does not guarantee future results. Always consider multiple factors when making investment decisions.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdvancedRiskMetricsCard; 