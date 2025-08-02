import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Activity,
  Target
} from "lucide-react";
import { MultiTimeframeAnalysis, TimeframeAnalysisData } from "@/types/analysis";

interface EnhancedMultiTimeframeCardProps {
  multiTimeframeAnalysis: MultiTimeframeAnalysis | null | undefined;
  symbol: string;
}

const EnhancedMultiTimeframeCard = ({ multiTimeframeAnalysis, symbol }: EnhancedMultiTimeframeCardProps) => {
  
  // Handle both simple and complex multi-timeframe analysis structures
  const hasComplexStructure = multiTimeframeAnalysis && 'success' in multiTimeframeAnalysis;
  const hasBackendStructure = multiTimeframeAnalysis && 'timeframes' in multiTimeframeAnalysis;
  const hasSimpleStructure = multiTimeframeAnalysis && ('short_term' in multiTimeframeAnalysis || 'medium_term' in multiTimeframeAnalysis || 'long_term' in multiTimeframeAnalysis);
  

  
  if (!multiTimeframeAnalysis || (!hasComplexStructure && !hasSimpleStructure && !hasBackendStructure)) {
    return (
      <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm h-full">
        <CardHeader>
          <CardTitle className="flex items-center text-slate-800 text-lg">
            <Clock className="h-5 w-5 mr-2 text-blue-500" />
            Multi-Timeframe Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-500">No multi-timeframe analysis data available</p>
        </CardContent>
      </Card>
    );
  }

  // If complex structure but not successful, show error
  if (hasComplexStructure && !multiTimeframeAnalysis.success) {
    return (
      <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm h-full">
        <CardHeader>
          <CardTitle className="flex items-center text-slate-800 text-lg">
            <Clock className="h-5 w-5 mr-2 text-blue-500" />
            Multi-Timeframe Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-500">Multi-timeframe analysis failed: {multiTimeframeAnalysis.error || 'Unknown error'}</p>
        </CardContent>
      </Card>
    );
  }

  const getSignalColor = (signal: string) => {
    const signalLower = signal.toLowerCase();
    if (signalLower === 'bullish') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (signalLower === 'bearish') return 'bg-red-100 text-red-700 border-red-200';
    return 'bg-yellow-100 text-yellow-700 border-yellow-200';
  };

  const getSignalIcon = (signal: string) => {
    const signalLower = signal.toLowerCase();
    if (signalLower === 'bullish') return <TrendingUp className="h-4 w-4" />;
    if (signalLower === 'bearish') return <TrendingDown className="h-4 w-4" />;
    return <Minus className="h-4 w-4" />;
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-emerald-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRiskLevelColor = (riskLevel: string) => {
    const riskLower = riskLevel.toLowerCase();
    if (riskLower === 'low') return 'bg-green-100 text-green-700';
    if (riskLower === 'medium') return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  };

  // Handle different data structures
  let timeframes: string[] = [];
  let summary: any = {};
  let validation: any = {};

  if (hasComplexStructure) {
    // Complex structure with success field
    timeframes = Object.keys(multiTimeframeAnalysis.timeframe_analyses || {});
    summary = multiTimeframeAnalysis.summary || {};
    validation = multiTimeframeAnalysis.cross_timeframe_validation || {};
  } else if (hasBackendStructure) {
    // Backend structure (timeframes, alignment, messages)
    const backendData = multiTimeframeAnalysis as any;
    timeframes = Object.keys(backendData.timeframes || {});
    

    
    // Calculate overall signal from trends
    const trends = Object.values(backendData.timeframes || {}).map((tf: any) => tf.trend).filter(t => t && t !== 'unknown');
    const bullishCount = trends.filter(t => t === 'bullish').length;
    const bearishCount = trends.filter(t => t === 'bearish').length;
    const neutralCount = trends.filter(t => t === 'neutral').length;
    

    
    let overallSignal = 'Neutral';
    if (bullishCount > bearishCount && bullishCount > neutralCount) overallSignal = 'Bullish';
    else if (bearishCount > bullishCount && bearishCount > neutralCount) overallSignal = 'Bearish';
    
    const confidence = trends.length > 0 ? Math.max(bullishCount, bearishCount, neutralCount) / trends.length : 0.5;
    
    summary = {
      overall_signal: overallSignal,
      confidence: confidence,
      timeframes_analyzed: timeframes.length,
      signal_alignment: backendData.alignment || 'Mixed',
      risk_level: 'Medium',
      recommendation: overallSignal === 'Bullish' ? 'Buy' : overallSignal === 'Bearish' ? 'Sell' : 'Hold'
    };
    
    // Create validation arrays based on trends
    const supportingTimeframes = timeframes.filter(tf => {
      const tfData = backendData.timeframes[tf];
      return tfData && tfData.trend && tfData.trend === overallSignal.toLowerCase();
    });
    
    const conflictingTimeframes = timeframes.filter(tf => {
      const tfData = backendData.timeframes[tf];
      return tfData && tfData.trend && tfData.trend !== overallSignal.toLowerCase() && tfData.trend !== 'neutral';
    });
    
    const neutralTimeframes = timeframes.filter(tf => {
      const tfData = backendData.timeframes[tf];
      return tfData && (!tfData.trend || tfData.trend === 'neutral' || tfData.trend === 'unknown');
    });
    
    validation = {
      consensus_trend: overallSignal,
      signal_strength: confidence,
      confidence_score: confidence,
      supporting_timeframes: supportingTimeframes,
      conflicting_timeframes: conflictingTimeframes,
      neutral_timeframes: neutralTimeframes,
      divergence_detected: conflictingTimeframes.length > 0,
      key_conflicts: conflictingTimeframes.map(tf => `${tf} timeframe shows conflicting signal`)
    };
    

  } else {
    // Simple structure with short_term, medium_term, long_term
    timeframes = Object.keys(multiTimeframeAnalysis).filter(key => 
      ['short_term', 'medium_term', 'long_term'].includes(key)
    );
    summary = {
      overall_signal: 'Neutral',
      confidence: 0.5,
      timeframes_analyzed: timeframes.length,
      signal_alignment: 'Mixed',
      risk_level: 'Medium',
      recommendation: 'Hold'
    };
    validation = {
      consensus_trend: 'Neutral',
      signal_strength: 0.5,
      confidence_score: 0.5
    };
  }

  return (
    <Card className="w-full shadow-xl border-0 bg-white/90 backdrop-blur-sm h-full">
      <CardHeader>
        <CardTitle className="flex items-center text-slate-800 text-xl">
          <Clock className="h-6 w-6 mr-3 text-blue-500" />
          Multi-Timeframe Analysis
          <Badge className="ml-2 bg-blue-100 text-blue-700">
            {summary.timeframes_analyzed} Timeframes
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Overall Summary */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-blue-800">Overall Consensus</h3>
            <div className="flex items-center space-x-2">
              {getSignalIcon(summary.overall_signal)}
              <Badge className={getSignalColor(summary.overall_signal)}>
                {summary.overall_signal.toUpperCase()}
              </Badge>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-slate-600">Confidence:</span>
              <div className={`font-medium ${getConfidenceColor(summary.confidence)}`}>
                {(summary.confidence * 100).toFixed(1)}%
              </div>
            </div>
            <div>
              <span className="text-slate-600">Risk Level:</span>
              <Badge className={`ml-1 ${getRiskLevelColor(summary.risk_level)}`}>
                {summary.risk_level}
              </Badge>
            </div>
            <div>
              <span className="text-slate-600">Alignment:</span>
              <div className="font-medium text-slate-800 capitalize">
                {summary.signal_alignment}
              </div>
            </div>
            <div>
              <span className="text-slate-600">Recommendation:</span>
              <div className="font-medium text-slate-800">
                {summary.recommendation}
              </div>
            </div>
          </div>
        </div>

        {/* Cross-Timeframe Validation */}
        <div className="space-y-4">
          <h3 className="font-semibold text-slate-800 flex items-center">
            <BarChart3 className="h-4 w-4 mr-2 text-purple-500" />
            Cross-Timeframe Validation
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Supporting Timeframes */}
            <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
              <h4 className="font-medium text-emerald-800 mb-2 flex items-center">
                <CheckCircle className="h-4 w-4 mr-1" />
                Supporting ({(validation.supporting_timeframes || []).length})
              </h4>
              <div className="space-y-1">
                {(validation.supporting_timeframes || []).map((timeframe, index) => (
                  <div key={index} className="text-sm text-emerald-700 bg-emerald-100 px-2 py-1 rounded">
                    {timeframe}
                  </div>
                ))}
                {(validation.supporting_timeframes || []).length === 0 && (
                  <div className="text-sm text-emerald-600">None</div>
                )}
              </div>
            </div>

            {/* Conflicting Timeframes */}
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <h4 className="font-medium text-red-800 mb-2 flex items-center">
                <AlertTriangle className="h-4 w-4 mr-1" />
                Conflicting ({(validation.conflicting_timeframes || []).length})
              </h4>
              <div className="space-y-1">
                {(validation.conflicting_timeframes || []).map((timeframe, index) => (
                  <div key={index} className="text-sm text-red-700 bg-red-100 px-2 py-1 rounded">
                    {timeframe}
                  </div>
                ))}
                {(validation.conflicting_timeframes || []).length === 0 && (
                  <div className="text-sm text-red-600">None</div>
                )}
              </div>
            </div>

            {/* Neutral Timeframes */}
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <h4 className="font-medium text-yellow-800 mb-2 flex items-center">
                <Minus className="h-4 w-4 mr-1" />
                Neutral ({(validation.neutral_timeframes || []).length})
              </h4>
              <div className="space-y-1">
                {(validation.neutral_timeframes || []).map((timeframe, index) => (
                  <div key={index} className="text-sm text-yellow-700 bg-yellow-100 px-2 py-1 rounded">
                    {timeframe}
                  </div>
                ))}
                {(validation.neutral_timeframes || []).length === 0 && (
                  <div className="text-sm text-yellow-600">None</div>
                )}
              </div>
            </div>
          </div>

          {/* Validation Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-slate-50 rounded-lg">
              <div className="text-lg font-bold text-slate-800">
                {((validation.signal_strength || 0) * 100).toFixed(1)}%
              </div>
              <div className="text-xs text-slate-600">Signal Strength</div>
            </div>
            <div className="text-center p-3 bg-slate-50 rounded-lg">
              <div className="text-lg font-bold text-slate-800">
                {((validation.confidence_score || 0) * 100).toFixed(1)}%
              </div>
              <div className="text-xs text-slate-600">Confidence</div>
            </div>
            <div className="text-center p-3 bg-slate-50 rounded-lg">
              <div className="text-lg font-bold text-slate-800">
                {validation.divergence_detected ? 'Yes' : 'No'}
              </div>
              <div className="text-xs text-slate-600">Divergence</div>
            </div>
            <div className="text-center p-3 bg-slate-50 rounded-lg">
              <div className="text-lg font-bold text-slate-800">
                {(validation.key_conflicts || []).length}
              </div>
              <div className="text-xs text-slate-600">Conflicts</div>
            </div>
          </div>
        </div>

        {/* Individual Timeframe Analysis */}
        <div className="space-y-4">
          <h3 className="font-semibold text-slate-800 flex items-center">
            <Activity className="h-4 w-4 mr-2 text-green-500" />
            Individual Timeframe Analysis
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {timeframes.map((timeframe) => {
              let analysis: any;
              
              if (hasComplexStructure) {
                // Complex structure
                analysis = multiTimeframeAnalysis.timeframe_analyses[timeframe];
              } else if (hasBackendStructure) {
                // Backend structure
                const backendData = multiTimeframeAnalysis as any;
                analysis = backendData.timeframes[timeframe];
        
              } else {
                // Simple structure with short_term, medium_term, long_term
                analysis = multiTimeframeAnalysis[timeframe];
              }
              
              if (!analysis) {
        
                return null;
              }
              
              return (
                <div key={timeframe} className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-slate-800 capitalize">{timeframe}</h4>
                    <div className="flex items-center space-x-1">
                      {getSignalIcon(analysis.trend || 'neutral')}
                      <Badge className={getSignalColor(analysis.trend || 'neutral')}>
                        {analysis.trend || 'Unknown'}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    {hasComplexStructure ? (
                      // Complex structure display
                      <>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Confidence:</span>
                          <span className={`font-medium ${getConfidenceColor(analysis.confidence || 0)}`}>
                            {((analysis.confidence || 0) * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Data Points:</span>
                          <span className="font-medium text-slate-800">
                            {(analysis.data_points || 0).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">RSI:</span>
                          <span className="font-medium text-slate-800">
                            {(analysis.key_indicators?.rsi || 0).toFixed(1)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">MACD:</span>
                          <span className="font-medium text-slate-800 capitalize">
                            {analysis.key_indicators?.macd_signal || 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Volatility:</span>
                          <span className="font-medium text-slate-800">
                            {((analysis.risk_metrics?.volatility || 0) * 100).toFixed(1)}%
                          </span>
                        </div>
                      </>
                    ) : hasBackendStructure ? (
                      // Backend structure display
                      <>
                        <div className="flex justify-between">
                          <span className="text-slate-600">RSI:</span>
                          <span className="font-medium text-slate-800">
                            {(analysis.rsi_14 || 0).toFixed(1)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">MACD:</span>
                          <span className="font-medium text-slate-800">
                            {(analysis.macd || 0).toFixed(3)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">SMA 50:</span>
                          <span className="font-medium text-slate-800">
                            {(analysis.sma_50 || 0).toFixed(1)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">SMA 200:</span>
                          <span className="font-medium text-slate-800">
                            {(analysis.sma_200 || 0).toFixed(1)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">MA Trend:</span>
                          <span className="font-medium text-slate-800 capitalize">
                            {analysis.ma_trend || 'Unknown'}
                          </span>
                        </div>
                      </>
                    ) : (
                      // Simple structure display
                      <>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Data:</span>
                          <span className="font-medium text-slate-800">
                            Available
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Support/Resistance Levels - Only for complex structure */}
                  {hasComplexStructure && analysis.key_indicators && (
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <div className="text-xs text-slate-600 mb-1">Key Levels:</div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <div className="text-red-600 font-medium">Resistance:</div>
                          {(analysis.key_indicators.resistance_levels || []).slice(0, 2).map((level: number, idx: number) => (
                            <div key={idx} className="text-red-600">₹{level.toFixed(1)}</div>
                          ))}
                        </div>
                        <div>
                          <div className="text-green-600 font-medium">Support:</div>
                          {(analysis.key_indicators.support_levels || []).slice(0, 2).map((level: number, idx: number) => (
                            <div key={idx} className="text-green-600">₹{level.toFixed(1)}</div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Divergence Analysis */}
        {validation.divergence_detected && (
          <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
            <h3 className="font-semibold text-orange-800 mb-2 flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Divergence Detected
            </h3>
            <div className="text-sm text-orange-700">
              <div className="font-medium">Type: {validation.divergence_type}</div>
              <div className="mt-1">
                This indicates a potential reversal signal. Consider adjusting your trading strategy accordingly.
              </div>
            </div>
          </div>
        )}

        {/* Key Conflicts */}
        {(validation.key_conflicts || []).length > 0 && (
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <h3 className="font-semibold text-red-800 mb-2 flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Key Conflicts ({(validation.key_conflicts || []).length})
            </h3>
            <div className="space-y-1">
              {(validation.key_conflicts || []).map((conflict, index) => (
                <div key={index} className="text-sm text-red-700">
                  • {conflict}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Backend Messages - Only for backend structure */}
        {hasBackendStructure && (multiTimeframeAnalysis as any).messages && (multiTimeframeAnalysis as any).messages.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-800 flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2 text-orange-500" />
              Analysis Messages
            </h3>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="space-y-2">
                {(multiTimeframeAnalysis as any).messages.map((message: string, index: number) => (
                  <div key={index} className="text-sm text-orange-800 flex items-start">
                    <AlertTriangle className="h-3 w-3 mr-2 mt-0.5 flex-shrink-0" />
                    {message}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EnhancedMultiTimeframeCard; 