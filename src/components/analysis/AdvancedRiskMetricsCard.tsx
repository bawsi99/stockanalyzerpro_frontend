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
  Shield,
  Info
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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

  const formatPercentage = (value: number | null | undefined) => {
    if (typeof value !== 'number' || isNaN(value)) return 'N/A';
    return `${(value * 100).toFixed(1)}%`;
  };

  const formatCurrency = (value: number) => {
    if (typeof value !== 'number' || isNaN(value)) return 'N/A';
    return `₹${value.toFixed(2)}`;
  };

  // Number with thousands separators
  const formatNumberWithSeparators = (value: number) => {
    if (typeof value !== 'number' || isNaN(value)) return 'N/A';
    return new Intl.NumberFormat('en-IN').format(value);
  };

  // Normalize percent-like numbers whether provided as 0..1 or 0..100
  const formatPercentAuto = (value: number, decimals: number = 1) => {
    if (typeof value !== 'number' || isNaN(value)) return 'N/A';
    const scaled = Math.abs(value) > 1 ? value : value * 100;
    return `${scaled.toFixed(decimals)}%`;
  };

  // Helper function to safely check if data is an array
  const isArray = (data: any): data is any[] => {
    return Array.isArray(data);
  };

  // Normalize stress summary across different backend shapes
  const getNormalizedStressSummary = () => {
    if (!stress_testing) return null;
    const rawSummary: any = (stress_testing as any).stress_summary || {};
    const level = rawSummary.stress_level || (stress_testing as any).stress_level || 'unknown';

    // Derive overall impact as a 0..1 fraction for percentage display
    let overallImpact: number | null = null;
    if (typeof rawSummary.overall_impact === 'number') {
      overallImpact = rawSummary.overall_impact; // already fractional
    } else if (typeof rawSummary.overall_stress_score === 'number') {
      overallImpact = Math.max(0, Math.min(1, rawSummary.overall_stress_score / 100));
    } else if (typeof (stress_testing as any).stress_score === 'number') {
      overallImpact = Math.max(0, Math.min(1, (stress_testing as any).stress_score / 100));
    }

    // Derive worst case label
    let worstCase: string | null = null;
    // 1) Direct string in summary
    if (typeof rawSummary.worst_case_scenario === 'string') {
      worstCase = rawSummary.worst_case_scenario;
    }
    // 2) Top-level numeric worst_case_scenario
    if (!worstCase && typeof (stress_testing as any).worst_case_scenario === 'number') {
      worstCase = `${((stress_testing as any).worst_case_scenario * 100).toFixed(1)}%`;
    }
    // 3) Monte Carlo worst_case in stress_scenarios
    if (!worstCase && typeof (stress_testing as any).stress_scenarios === 'object') {
      const sc: any = (stress_testing as any).stress_scenarios;
      const mc = sc?.monte_carlo_stress;
      if (mc && typeof mc.worst_case === 'number') {
        worstCase = `${(mc.worst_case * 100).toFixed(1)}%`;
      }
    }
    // 4) Compute from available stress_scenarios if still missing
    if (!worstCase && typeof (stress_testing as any).stress_scenarios === 'object') {
      const sc: any = (stress_testing as any).stress_scenarios;
      const candidates: number[] = [];
      try {
        // Historical windows (technical_indicators shape)
        if (sc.worst_20d && typeof sc.worst_20d.return === 'number') candidates.push(sc.worst_20d.return);
        if (sc.worst_60d && typeof sc.worst_60d.return === 'number') candidates.push(sc.worst_60d.return);
        if (sc.worst_252d && typeof sc.worst_252d.return === 'number') candidates.push(sc.worst_252d.return);
        // Drawdown stress
        if (sc.drawdown_stress && typeof sc.drawdown_stress.max_drawdown === 'number') candidates.push(sc.drawdown_stress.max_drawdown);
        // Tail risk stress
        if (sc.tail_risk_stress && typeof sc.tail_risk_stress.largest_daily_loss === 'number') candidates.push(sc.tail_risk_stress.largest_daily_loss);
        // Crash scenarios (advanced_analysis shape)
        if (sc.crash_scenarios && typeof sc.crash_scenarios === 'object') {
          Object.values(sc.crash_scenarios).forEach((v: any) => { if (typeof v === 'number') candidates.push(v as number); });
        }
      } catch {}
      if (candidates.length > 0) {
        const minReturn = candidates.reduce((min, v) => (v < min ? v : min), candidates[0]);
        worstCase = `${(minReturn * 100).toFixed(1)}%`;
      }
    }
    // 5) Fall back to scenario_analysis summary worst_case if available
    if (!worstCase && (scenario_analysis as any)?.scenario_summary?.worst_case) {
      const s = (scenario_analysis as any).scenario_summary.worst_case;
      if (typeof s === 'string') worstCase = s;
    }

    // Collect recommendations
    let recommendations: string[] = [];
    if (Array.isArray(rawSummary.recommendations)) {
      recommendations = rawSummary.recommendations;
    } else if (Array.isArray(rawSummary.mitigation_recommendations)) {
      recommendations = rawSummary.mitigation_recommendations;
    } else if (Array.isArray((stress_testing as any).risk_mitigation_recommendations)) {
      recommendations = (stress_testing as any).risk_mitigation_recommendations;
    }

    return { stress_level: level, overall_impact: overallImpact, worst_case: worstCase, recommendations };
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
    // console.warn('stress_scenarios is not in expected format:', stress_testing.stress_scenarios);
    return [];
  };

  // Helper function to safely get scenario results
  const getScenarioResults = (): ScenarioResult[] => {
    if (!scenario_analysis?.scenario_results) return [];
    
    // If it's already an array, return it
    if (isArray(scenario_analysis.scenario_results)) {
      return scenario_analysis.scenario_results;
    }
    
    // If it's an object, try to convert it to an array format
    if (typeof scenario_analysis.scenario_results === 'object') {
      const results: ScenarioResult[] = [];
      const obj = scenario_analysis.scenario_results as Record<string, any>;
      
      // 1) Advanced analysis shape: entries with outcome/probability
      Object.entries(obj).forEach(([key, value]) => {
        if (typeof value === 'object' && value !== null) {
          if ('outcome' in value || 'probability' in value) {
            results.push({
              scenario_name: key,
              outcome: (value as any).outcome || 'unknown',
              probability: (value as any).probability || 0,
              impact: (value as any).impact || 0,
              risk_level: (value as any).risk_level || 'medium'
            });
          }
        }
      });

      if (results.length > 0) {
        return results;
      }

      // 2) Technical indicators shape: synthesize display cards from known groups
      const rp = obj['return_probabilities'];
      const ev = obj['expected_values'];
      const dd = obj['drawdown_scenarios'];
      const vrs = obj['volatility_regime_scenarios'];
      const corr = obj['correlation_scenarios'];
      const rec = obj['recovery_analysis'];

      const synthesized: ScenarioResult[] = [];

      // Return probabilities - key risk-focused cards
      if (rp && typeof rp === 'object') {
        if (typeof rp.probability_20_percent_loss === 'number') {
          synthesized.push({
            scenario_name: '20% Loss Risk',
            outcome: 'Probability of >20% loss',
            probability: rp.probability_20_percent_loss,
            impact: 0.20,
            risk_level: rp.probability_20_percent_loss > 0.15 ? 'high' : rp.probability_20_percent_loss > 0.08 ? 'medium' : 'low'
          });
        }
        if (typeof rp.probability_30_percent_loss === 'number') {
          synthesized.push({
            scenario_name: '30% Loss Risk',
            outcome: 'Probability of >30% loss',
            probability: rp.probability_30_percent_loss,
            impact: 0.30,
            risk_level: rp.probability_30_percent_loss > 0.10 ? 'high' : rp.probability_30_percent_loss > 0.05 ? 'medium' : 'low'
          });
        }
        if (typeof rp.probability_positive_return === 'number') {
          synthesized.push({
            scenario_name: 'Positive Return Odds',
            outcome: 'Probability of positive return',
            probability: rp.probability_positive_return,
            impact: 0.0,
            risk_level: rp.probability_positive_return < 0.5 ? 'high' : rp.probability_positive_return < 0.65 ? 'medium' : 'low'
          });
        }
      }

      // Expected values
      if (ev && typeof ev === 'object') {
        if (typeof ev.worst_case_scenario === 'number') {
          synthesized.push({
            scenario_name: 'Worst Case (Expected Values)',
            outcome: '5th percentile outcome',
            probability: 0.05,
            impact: Math.abs(ev.worst_case_scenario),
            risk_level: Math.abs(ev.worst_case_scenario) > 0.20 ? 'high' : Math.abs(ev.worst_case_scenario) > 0.10 ? 'medium' : 'low'
          });
        }
        if (typeof ev.best_case_scenario === 'number') {
          synthesized.push({
            scenario_name: 'Best Case (Expected Values)',
            outcome: '95th percentile outcome',
            probability: 0.05,
            impact: Math.abs(ev.best_case_scenario),
            risk_level: 'low'
          });
        }
      }

      // Drawdown scenarios
      if (dd && typeof dd === 'object') {
        if (typeof dd.expected_max_drawdown === 'number') {
          synthesized.push({
            scenario_name: 'Expected Max Drawdown',
            outcome: 'Average max peak-to-trough',
            probability: 0.5,
            impact: Math.abs(dd.expected_max_drawdown),
            risk_level: Math.abs(dd.expected_max_drawdown) > 0.25 ? 'high' : Math.abs(dd.expected_max_drawdown) > 0.15 ? 'medium' : 'low'
          });
        }
        if (typeof dd.worst_case_drawdown === 'number') {
          synthesized.push({
            scenario_name: 'Worst Case Drawdown',
            outcome: '5th percentile drawdown',
            probability: 0.05,
            impact: Math.abs(dd.worst_case_drawdown),
            risk_level: Math.abs(dd.worst_case_drawdown) > 0.30 ? 'high' : Math.abs(dd.worst_case_drawdown) > 0.20 ? 'medium' : 'low'
          });
        }
      }

      // Volatility regime scenarios (pick high and extreme)
      if (vrs && typeof vrs === 'object') {
        const high = vrs['high_volatility'];
        const extreme = vrs['extreme_volatility'];
        if (high && typeof high === 'object') {
          synthesized.push({
            scenario_name: 'High Volatility Regime',
            outcome: 'Elevated volatility environment',
            probability: high.probability_positive_return ?? 0,
            impact: Math.abs(high.expected_volatility ?? 0),
            risk_level: (high.probability_20_percent_loss ?? 0) > 0.10 ? 'high' : 'medium'
          });
        }
        if (extreme && typeof extreme === 'object') {
          synthesized.push({
            scenario_name: 'Extreme Volatility Regime',
            outcome: 'Stressful volatility regime',
            probability: extreme.probability_positive_return ?? 0,
            impact: Math.abs(extreme.expected_volatility ?? 0),
            risk_level: (extreme.probability_20_percent_loss ?? 0) > 0.10 ? 'high' : 'medium'
          });
        }
      }

      // Correlation scenarios (optional informative)
      if (corr && typeof corr === 'object') {
        const highCorr = corr['high_correlation'] || corr['extreme_correlation'];
        if (highCorr) {
          synthesized.push({
            scenario_name: 'High Correlation Shock',
            outcome: 'Market correlation spike with downturn',
            probability: 0.1,
            impact: Math.abs(highCorr.market_impact ?? 0.10),
            risk_level: Math.abs(highCorr.market_impact ?? 0.10) > 0.15 ? 'high' : 'medium'
          });
        }
      }

      if (synthesized.length > 0) {
        return synthesized;
      }
    }
    
    return [];
  };

  // Normalize specific stress sub-analyses that have known shapes in backend
  const getVolatilityStress = () => {
    // Preferred: technical_indicators shape
    const vs = (stress_testing as any)?.stress_scenarios?.volatility_stress;
    if (vs && typeof vs === 'object') return vs;
    // Fallback: if someone put these keys under scenario_analysis by mistake
    const sa = (stress_testing as any)?.scenario_analysis;
    if (sa && typeof sa === 'object' && ('current_vol' in sa || '95th_percentile' in sa || '99th_percentile' in sa || 'vol_percentile' in sa)) {
      return sa;
    }
    return null;
  };

  const getTailRiskStress = () => {
    // Preferred: technical_indicators shape
    const tr = (stress_testing as any)?.stress_scenarios?.tail_risk_stress;
    if (tr && typeof tr === 'object') return tr;
    // Fallback: if present under scenario_analysis mistakenly
    const sa = (stress_testing as any)?.scenario_analysis;
    if (sa && typeof sa === 'object' && ('2std_events' in sa || '3std_events' in sa || '2std_frequency' in sa || 'largest_daily_loss' in sa)) {
      return sa;
    }
    return null;
  };

  // Memoize normalized summary to avoid repeated computation in render
  const normalizedSummary = React.useMemo(() => getNormalizedStressSummary(), [stress_testing, scenario_analysis]);

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
                {normalizedSummary && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-lg">Stress Test Summary</h4>
                      <Badge className={getStressLevelColor(normalizedSummary.stress_level)}>
                        {normalizedSummary.stress_level?.toUpperCase() || 'UNKNOWN'}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
                      <div className="text-center p-3 bg-white rounded-lg border">
                        <div className="text-2xl font-bold text-blue-600">
                          {formatPercentage(normalizedSummary.overall_impact as number)}
                        </div>
                        <div className="text-sm text-gray-600">Overall Impact</div>
                      </div>
                      <div className="text-center p-3 bg-white rounded-lg border">
                        <div className="text-lg font-semibold text-red-600">
                          {normalizedSummary.worst_case || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-600">Worst Case</div>
                      </div>
                      <div className="text-center p-3 bg-white rounded-lg border">
                        <div className="text-lg font-semibold text-purple-600">
                          {normalizedSummary.recommendations.length}
                        </div>
                        <div className="text-sm text-gray-600">Recommendations</div>
                      </div>
                      <div className="text-center p-3 bg-white rounded-lg border">
                        <div className="text-lg font-semibold text-green-600">
                          {normalizedSummary.stress_level || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-600">Stress Level</div>
                      </div>
                      <div className="text-center p-3 bg-white rounded-lg border">
                        <div className="text-lg font-semibold text-orange-600">
                          {typeof normalizedSummary.overall_impact === 'number' ? 
                           (normalizedSummary.overall_impact! > 0.15 ? 'High' : 
                            normalizedSummary.overall_impact! > 0.08 ? 'Medium' : 'Low') : 'N/A'}
                        </div>
                        <div className="text-sm text-gray-600">Risk Level</div>
                      </div>
                    </div>

                    {/* Recommendations */}
                    {normalizedSummary.recommendations.length > 0 && (
                      <div className="mt-4">
                        <h5 className="font-medium mb-2">Key Recommendations:</h5>
                        <ul className="space-y-1 text-sm">
                          {normalizedSummary.recommendations.map((rec, index) => (
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
                      {getStressScenarios().map((scenario, index) => {
                        const name = (scenario.scenario_name || '').toLowerCase();
                        const isLiquidity = name.includes('liquidity stress');
                        const isVolumeCount = isLiquidity && (
                          name.includes('5th percentile volume') ||
                          name.includes('1st percentile volume') ||
                          name.includes('current volume') ||
                          name.includes('low volume')
                        );
                        const isEventCount = name.includes('2std events') || name.includes('3std events') || name.includes('events');
                        const isPercentLike = !isVolumeCount && !isEventCount;

                        const impactLabel = isVolumeCount || isEventCount ? 'Value' : 'Impact';
                        const impactDisplay = typeof scenario.impact === 'number'
                          ? (isPercentLike ? formatPercentAuto(scenario.impact, 2) : formatNumberWithSeparators(scenario.impact))
                          : 'N/A';

                        return (
                          <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <h5 className="font-medium text-gray-800">{scenario.scenario_name || 'Unknown Scenario'}</h5>
                            <p className="text-sm text-gray-600">{scenario.description || 'No description available'}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge className={getRiskLevelColor(scenario.risk_level)}>
                                {scenario.risk_level?.toUpperCase() || 'UNKNOWN'}
                              </Badge>
                              <span className="text-sm text-gray-600">
                                {impactLabel}: {impactDisplay}
                              </span>
                              <span className="text-sm text-gray-600">
                                Probability: {typeof scenario.probability === 'number' ? formatPercentAuto(scenario.probability, 1) : 'N/A'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Volatility Stress */}
                    {getVolatilityStress() && (
                      (() => { const vol = getVolatilityStress() as any; return (
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <h5 className="font-medium mb-3">Volatility Stress Analysis</h5>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Current Vol:</span>
                            <div className="font-bold">
                              {typeof vol.current_vol === 'number' 
                                ? formatPercentage(vol.current_vol) 
                                : 'N/A'}
                            </div>
                          </div>
                          <div>
                            <span className="font-medium">95th Percentile:</span>
                            <div className="font-bold">
                              {typeof vol['95th_percentile'] === 'number' 
                                ? formatPercentage(vol['95th_percentile']) 
                                : 'N/A'}
                            </div>
                          </div>
                          <div>
                            <span className="font-medium">99th Percentile:</span>
                            <div className="font-bold">
                              {typeof vol['99th_percentile'] === 'number' 
                                ? formatPercentage(vol['99th_percentile']) 
                                : 'N/A'}
                            </div>
                          </div>
                          <div>
                            <span className="font-medium">Vol Percentile:</span>
                            <div className="font-bold">
                              {typeof vol.vol_percentile === 'number' 
                                ? vol.vol_percentile.toFixed(1) + '%' 
                                : 'N/A'}
                            </div>
                          </div>
                          <div>
                            <span className="font-medium">Vol Regime:</span>
                            <div className="font-bold">
                              {typeof vol.current_vol === 'number' 
                                ? (vol.current_vol > 0.3 ? 'High' : 
                                   vol.current_vol > 0.2 ? 'Medium' : 'Low')
                                : 'N/A'}
                            </div>
                          </div>
                        </div>
                      </div>
                      ); })()
                    )}

                    {/* Tail Risk Stress */}
                    {getTailRiskStress() && (
                      (() => { const tr = getTailRiskStress() as any; return (
                      <div className="p-4 bg-purple-50 rounded-lg">
                        <h5 className="font-medium mb-3 flex items-center gap-2">
                          Tail Risk Analysis
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="h-4 w-4 text-purple-600 cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs text-xs">
                                <p className="mb-1"><strong>2σ Events:</strong> Days where returns fall below -2 standard deviations. Under a normal model, this is rare (~2.3% per left tail).</p>
                                <p className="mb-1"><strong>3σ Events:</strong> Extreme downside days below -3 standard deviations (~0.13% per left tail).</p>
                                <p className="mb-1"><strong>2σ Frequency:</strong> Share of days breaching the -2σ threshold. Heuristics: &gt;5% = High risk, 2.5–5% = Medium, &lt;2.5% = Low.</p>
                                <p><em>Note:</em> Real markets have fat tails; frequencies can exceed normal-theory odds.</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </h5>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                          <div>
                            <span className="font-medium">2σ Events:</span>
                            <div className="font-bold">
                              {typeof tr['2std_events'] === 'number' 
                                ? tr['2std_events'] 
                                : 'N/A'}
                            </div>
                          </div>
                          <div>
                            <span className="font-medium">3σ Events:</span>
                            <div className="font-bold">
                              {typeof tr['3std_events'] === 'number' 
                                ? tr['3std_events'] 
                                : 'N/A'}
                            </div>
                          </div>
                          <div>
                            <span className="font-medium">2σ Frequency:</span>
                            <div className="font-bold">
                              {typeof tr['2std_frequency'] === 'number' 
                                ? formatPercentage(tr['2std_frequency']) 
                                : 'N/A'}
                            </div>
                          </div>
                          <div>
                            <span className="font-medium">Largest Loss:</span>
                            <div className="font-bold">
                              {typeof tr.largest_daily_loss === 'number' 
                                ? formatPercentage(tr.largest_daily_loss) 
                                : 'N/A'}
                            </div>
                          </div>
                          <div>
                            <span className="font-medium">Tail Risk:</span>
                            <div className="font-bold">
                              {typeof tr['3std_events'] === 'number' && 
                               typeof tr['2std_events'] === 'number' 
                                ? (tr['3std_events'] > 5 ? 'High' : 
                                   tr['3std_events'] > 2 ? 'Medium' : 'Low')
                                : 'N/A'}
                            </div>
                          </div>
                        </div>
                      </div>
                      ); })()
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
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                                {typeof result.probability === 'number' ? formatPercentAuto(result.probability, 1) : 'N/A'}
                              </div>
                            </div>
                            <div>
                              <span className="font-medium">Impact:</span>
                              <div className="text-gray-700">
                                {typeof result.impact === 'number' ? formatPercentAuto(result.impact, 2) : 'N/A'}
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