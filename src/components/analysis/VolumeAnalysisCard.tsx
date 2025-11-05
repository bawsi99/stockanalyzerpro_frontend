import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle, XCircle, BarChart3, Activity } from 'lucide-react';

interface VolumeAnalysisCardProps {
  volumeData?: any;
  priceData?: any[];
  symbol: string;
  className?: string;
  volumeAgentsData?: any;  // Add volume agents data from responses
  volumeAgentSummaries?: { [agentName: string]: string };  // Agent summaries from decision_story
}

const VolumeAnalysisCard: React.FC<VolumeAnalysisCardProps> = ({ volumeData, priceData, symbol, className, volumeAgentsData, volumeAgentSummaries }) => {

  // Debug logging for volume agents data
  React.useEffect(() => {
    if (volumeAgentsData) {
      console.log('🔍 [VolumeAnalysisCard] Volume Agents Data:', volumeAgentsData);
      const agents = volumeAgentsData?.individual_agents || {};
      console.log('📊 [VolumeAnalysisCard] Volume Anomaly Agent:', agents.volume_anomaly?.key_data);
      console.log('✅ [VolumeAnalysisCard] Volume Confirmation Agent:', agents.volume_confirmation?.key_data);
    }
  }, [volumeAgentsData]);
  
  // Extract volume information from the data
  const volumeRatio = volumeData?.volume_ratios?.primary_ratio || volumeData?.volume_ratio || 1;
  const obv = volumeData?.advanced_indicators?.obv || volumeData?.obv || 0;
  const obvTrend = volumeData?.advanced_indicators?.obv_trend || volumeData?.obv_trend || 'neutral';
  
  // Enhanced volume insights
  const volumeTrends = volumeData?.volume_trends || {};
  const volumeAnomalies = volumeData?.volume_anomalies || {};
  const priceVolumeCorrelation = volumeData?.price_volume_correlation || {};
  const volumeConfirmation = volumeData?.volume_confirmation || {};
  const volumeVolatility = volumeData?.volume_volatility || {};
  const volumeStrengthScore = volumeData?.volume_strength_score || 0;
  
  // Extract volume agents data (from volume agents orchestrator)
  const volumeAgents = volumeAgentsData?.individual_agents || {};
  const volumeAnomalyAgent = volumeAgents.volume_anomaly?.key_data || {};
  const volumeConfirmationAgent = volumeAgents.volume_confirmation?.key_data || {};
  const institutionalActivityAgent = volumeAgents.institutional_activity?.key_data || {};
  const supportResistanceAgent = volumeAgents.support_resistance?.key_data || {};
  const volumeMomentumAgent = volumeAgents.volume_momentum?.key_data || {};
  
  // Safe number formatting helper
  const safeNumber = (value: any, decimals: number = 2): string => {
    const num = parseFloat(value);
    return isNaN(num) ? 'N/A' : num.toFixed(decimals);
  };
  
  const safeLocaleNumber = (value: any): string => {
    const num = parseFloat(value);
    return isNaN(num) ? 'N/A' : Math.round(num).toLocaleString();
  };
  
  // Calculate basic volume metrics from price data if available
  const calculateVolumeMetrics = () => {
    if (!priceData || !Array.isArray(priceData) || priceData.length === 0) return null;
    
    const volumes = priceData.map(d => d.volume || 0).filter(v => v > 0);
    if (volumes.length === 0) return null;
    
    const avgVolume = volumes.reduce((sum, vol) => sum + vol, 0) / volumes.length;
    const recentVolumes = volumes.slice(-5); // Last 5 periods
    const recentAvgVolume = recentVolumes.reduce((sum, vol) => sum + vol, 0) / recentVolumes.length;
    
    return {
      averageVolume: avgVolume,
      recentAverageVolume: recentAvgVolume,
      volumeTrend: recentAvgVolume > avgVolume ? 'up' : recentAvgVolume < avgVolume ? 'down' : 'neutral',
      volumeRatio: recentAvgVolume / avgVolume
    };
  };

  const volumeMetrics = calculateVolumeMetrics();

  const getTrendIcon = (trend: string) => {
    switch (trend.toLowerCase()) {
      case 'up':
      case 'bullish':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down':
      case 'bearish':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const getVolumeRatioColor = (ratio: number) => {
    if (ratio > 1.5) return 'text-green-600';
    if (ratio > 1.2) return 'text-yellow-600';
    if (ratio < 0.5) return 'text-red-600';
    return 'text-gray-600';
  };

  const getVolumeRatioBadge = (ratio: number) => {
    if (ratio > 1.5) return <Badge className="bg-green-100 text-green-800">High Volume</Badge>;
    if (ratio > 1.2) return <Badge className="bg-yellow-100 text-yellow-800">Above Average</Badge>;
    if (ratio < 0.5) return <Badge className="bg-red-100 text-red-800">Low Volume</Badge>;
    return <Badge className="bg-gray-100 text-gray-800">Normal</Badge>;
  };

  return (
    <Card className={`shadow-xl border-0 bg-white/90 backdrop-blur-sm h-full flex flex-col ${className || ''}`}>
      <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-t-lg flex-shrink-0">
        <div className="flex items-center space-x-2">
          <BarChart3 className="h-6 w-6" />
          <CardTitle className="text-xl">Volume Analysis</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-6 flex-1 flex flex-col overflow-y-auto">
        <div className="space-y-6 flex-1">
          {/* Volume Agent Summaries */}
          {volumeAgentSummaries && Object.keys(volumeAgentSummaries).length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold text-slate-800">Volume Agent Analysis</h4>
              <Accordion type="multiple" defaultValue={Object.keys(volumeAgentSummaries)} className="w-full">
                {Object.entries(volumeAgentSummaries).map(([agentName, summary]) => (
                  <AccordionItem key={agentName} value={agentName} className="border border-slate-200 rounded-lg mb-2 px-3">
                    <AccordionTrigger className="text-sm font-medium text-slate-700 hover:no-underline py-3">
                      {agentName}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-slate-600 leading-relaxed pb-4 pt-0">
                      <p className="whitespace-pre-wrap">{summary}</p>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          )}

          {/* Volume Ratio */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <span className="text-slate-600 font-medium">Volume Ratio</span>
              <div className="flex items-center space-x-2">
                <span className={`font-semibold text-lg ${getVolumeRatioColor(volumeRatio)}`}>
                  {volumeRatio.toFixed(2)}x
                </span>
                {getVolumeRatioBadge(volumeRatio)}
              </div>
            </div>
            <Progress value={Math.min(volumeRatio * 50, 100)} className="h-2" />
            <p className="text-sm text-slate-500">
              {volumeRatio > 1.5 ? 'Significantly above average volume' :
               volumeRatio > 1.2 ? 'Above average volume' :
               volumeRatio < 0.5 ? 'Below average volume' :
               'Normal volume levels'}
            </p>
          </div>

          {/* OBV Trend */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <span className="text-slate-600 font-medium">OBV Trend</span>
              <div className="flex items-center space-x-2">
                {getTrendIcon(obvTrend)}
                <span className="font-semibold capitalize">{obvTrend}</span>
              </div>
            </div>
            <p className="text-sm text-slate-500">
              On-Balance Volume trend indicates {obvTrend} buying/selling pressure
            </p>
          </div>

          {/* Enhanced Volume Metrics */}
          {volumeData?.volume_ratios && (
            <div className="space-y-3">
              <h4 className="font-semibold text-slate-800">Volume Metrics</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-slate-50 p-3 rounded-lg">
                  <div className="text-slate-600">20-Day Ratio</div>
                  <div className="font-semibold">{(volumeData.volume_ratios.ratio_20d || 1).toFixed(2)}x</div>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg">
                  <div className="text-slate-600">50-Day Ratio</div>
                  <div className="font-semibold">{(volumeData.volume_ratios.ratio_50d || 1).toFixed(2)}x</div>
                </div>
                {volumeData.volume_anomalies?.total_anomalies > 0 && (
                  <div className="bg-slate-50 p-3 rounded-lg">
                    <div className="text-slate-600">Volume Anomalies</div>
                    <div className="font-semibold text-orange-600">{volumeData.volume_anomalies.total_anomalies}</div>
                  </div>
                )}
                {volumeStrengthScore > 0 && (
                  <div className="bg-slate-50 p-3 rounded-lg">
                    <div className="text-slate-600">Strength Score</div>
                    <div className="font-semibold text-emerald-600">{volumeStrengthScore.toFixed(0)}/100</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Calculated Volume Metrics (fallback) */}
          {volumeMetrics && !volumeData?.volume_ratios && (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <span className="text-slate-600 font-medium">Recent Volume Trend</span>
                <div className="flex items-center space-x-2">
                  {getTrendIcon(volumeMetrics.volumeTrend)}
                  <span className="font-semibold capitalize">{volumeMetrics.volumeTrend}</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-slate-50 p-3 rounded-lg">
                  <div className="text-slate-600">Average Volume</div>
                  <div className="font-semibold">{volumeMetrics.averageVolume.toLocaleString()}</div>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg">
                  <div className="text-slate-600">Recent Avg</div>
                  <div className="font-semibold">{volumeMetrics.recentAverageVolume.toLocaleString()}</div>
                </div>
              </div>
            </div>
          )}

          {/* Volume Statistics from Anomaly Agent */}
          {volumeAnomalyAgent && Object.keys(volumeAnomalyAgent).length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold text-slate-800">📊 Volume Statistics</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {volumeAnomalyAgent.volume_statistics?.volume_mean && (
                  <div className="bg-slate-50 p-3 rounded-lg">
                    <div className="text-slate-600 text-xs">Mean Volume</div>
                    <div className="font-semibold">{safeLocaleNumber(volumeAnomalyAgent.volume_statistics.volume_mean)}</div>
                  </div>
                )}
                {volumeAnomalyAgent.volume_statistics?.current_z_score !== undefined && (
                  <div className="bg-slate-50 p-3 rounded-lg">
                    <div className="text-slate-600 text-xs">Z-Score</div>
                    <div className={`font-semibold ${volumeAnomalyAgent.volume_statistics.current_z_score > 2 ? 'text-orange-600' : 'text-gray-600'}`}>
                      {safeNumber(volumeAnomalyAgent.volume_statistics.current_z_score, 2)}
                    </div>
                  </div>
                )}
                {volumeAnomalyAgent.volume_statistics?.percentiles?.percentile_50 && (
                  <div className="bg-slate-50 p-3 rounded-lg">
                    <div className="text-slate-600 text-xs">Median Volume</div>
                    <div className="font-semibold">{safeLocaleNumber(volumeAnomalyAgent.volume_statistics.percentiles.percentile_50)}</div>
                  </div>
                )}
                {volumeAnomalyAgent.volume_statistics?.volume_cv !== undefined && (
                  <div className="bg-slate-50 p-3 rounded-lg">
                    <div className="text-slate-600 text-xs">Volume CV</div>
                    <div className="font-semibold">{safeNumber(volumeAnomalyAgent.volume_statistics.volume_cv, 2)}</div>
                  </div>
                )}
              </div>
              {/* Current Volume Status */}
              {volumeAnomalyAgent.current_volume_status && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="text-xs font-semibold text-blue-900 mb-1">Current Status</div>
                  <div className="text-sm text-blue-800">
                    <div className="capitalize font-semibold">{volumeAnomalyAgent.current_volume_status.current_status?.replace(/_/g, ' ')}</div>
                    <div className="text-xs text-blue-700 mt-1">📍 Percentile: {volumeAnomalyAgent.current_volume_status.volume_percentile}th</div>
                    {volumeAnomalyAgent.current_volume_status.recent_trend && (
                      <div className="text-xs text-blue-700">📈 Trend: <span className="capitalize font-semibold">{volumeAnomalyAgent.current_volume_status.recent_trend}</span></div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Volume Confirmation from Confirmation Agent */}
          {volumeConfirmationAgent && Object.keys(volumeConfirmationAgent).length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold text-slate-800">✅ Volume Confirmation Analysis</h4>
              {volumeConfirmationAgent.price_volume_correlation && (
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {volumeConfirmationAgent.price_volume_correlation.correlation_coefficient !== undefined && (
                    <div className="bg-slate-50 p-3 rounded-lg">
                      <div className="text-slate-600 text-xs">Price-Volume Correlation</div>
                      <div className="font-semibold text-blue-600">{safeNumber(volumeConfirmationAgent.price_volume_correlation.correlation_coefficient, 2)}</div>
                      <div className="text-xs text-slate-500 mt-1 capitalize">
                        {volumeConfirmationAgent.price_volume_correlation.correlation_strength || 'unknown'} strength
                      </div>
                    </div>
                  )}
                  {volumeConfirmationAgent.overall_assessment?.confirmation_strength && (
                    <div className={`p-3 rounded-lg ${
                      volumeConfirmationAgent.overall_assessment.confirmation_strength === 'strong' ? 'bg-green-50' :
                      volumeConfirmationAgent.overall_assessment.confirmation_strength === 'medium' ? 'bg-yellow-50' :
                      'bg-red-50'
                    }`}>
                      <div className="text-slate-600 text-xs">Confirmation</div>
                      <div className={`font-semibold capitalize ${
                        volumeConfirmationAgent.overall_assessment.confirmation_strength === 'strong' ? 'text-green-700' :
                        volumeConfirmationAgent.overall_assessment.confirmation_strength === 'medium' ? 'text-yellow-700' :
                        'text-red-700'
                      }`}>
                        {volumeConfirmationAgent.overall_assessment.confirmation_strength}
                      </div>
                      <div className="text-xs text-slate-600 mt-1 capitalize">
                        {volumeConfirmationAgent.overall_assessment.confirmation_status?.replace(/_/g, ' ')}
                      </div>
                    </div>
                  )}
                </div>
              )}
              {/* Volume Averages */}
              {volumeConfirmationAgent.volume_averages && (
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-slate-700">📊 Volume Averages</div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    {volumeConfirmationAgent.volume_averages.volume_10d_avg && (
                      <div className="bg-slate-50 p-2 rounded">
                        <div className="text-slate-600 font-semibold">10d Avg</div>
                        <div className="font-semibold text-slate-800">{safeLocaleNumber(volumeConfirmationAgent.volume_averages.volume_10d_avg)}</div>
                        {volumeConfirmationAgent.volume_averages.volume_vs_10d && (
                          <div className="text-slate-600 mt-1">×{safeNumber(volumeConfirmationAgent.volume_averages.volume_vs_10d, 2)}</div>
                        )}
                      </div>
                    )}
                    {volumeConfirmationAgent.volume_averages.volume_20d_avg && (
                      <div className="bg-slate-50 p-2 rounded">
                        <div className="text-slate-600 font-semibold">20d Avg</div>
                        <div className="font-semibold text-slate-800">{safeLocaleNumber(volumeConfirmationAgent.volume_averages.volume_20d_avg)}</div>
                        {volumeConfirmationAgent.volume_averages.volume_vs_20d && (
                          <div className="text-slate-600 mt-1">×{safeNumber(volumeConfirmationAgent.volume_averages.volume_vs_20d, 2)}</div>
                        )}
                      </div>
                    )}
                    {volumeConfirmationAgent.volume_averages.volume_50d_avg && (
                      <div className="bg-slate-50 p-2 rounded">
                        <div className="text-slate-600 font-semibold">50d Avg</div>
                        <div className="font-semibold text-slate-800">{safeLocaleNumber(volumeConfirmationAgent.volume_averages.volume_50d_avg)}</div>
                        {volumeConfirmationAgent.volume_averages.volume_vs_50d && (
                          <div className="text-slate-600 mt-1">×{safeNumber(volumeConfirmationAgent.volume_averages.volume_vs_50d, 2)}</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Recent Anomalies from Anomaly Agent */}
          {volumeAnomalyAgent.significant_anomalies && volumeAnomalyAgent.significant_anomalies.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold text-slate-800">🚨 Recent Volume Anomalies</h4>
              <div className="space-y-2 max-h-72 overflow-y-auto border border-slate-200 rounded-lg p-3 bg-gradient-to-br from-slate-50 to-white">
                {volumeAnomalyAgent.significant_anomalies.slice(0, 5).map((anomaly: any, idx: number) => (
                  <div key={idx} className={`border-l-4 rounded p-3 ${
                    anomaly.significance === 'high' ? 'border-red-500 bg-red-50' :
                    anomaly.significance === 'medium' ? 'border-yellow-500 bg-yellow-50' :
                    'border-blue-500 bg-blue-50'
                  }`}>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">{anomaly.date}</div>
                        <div className="text-xs text-slate-600 mt-0.5">📊 Volume: {safeLocaleNumber(anomaly.volume_level)}</div>
                      </div>
                      <div className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        anomaly.significance === 'high' ? 'bg-red-200 text-red-900' :
                        anomaly.significance === 'medium' ? 'bg-yellow-200 text-yellow-900' :
                        'bg-blue-200 text-blue-900'
                      }`}>
                        {anomaly.significance?.toUpperCase()}
                      </div>
                    </div>
                    {anomaly.price_context && (
                      <div className="text-xs text-slate-700 mb-1">
                        <span className="font-semibold">📈 Context:</span> {anomaly.price_context.replace(/_/g, ' ').toUpperCase()}
                      </div>
                    )}
                    {anomaly.likely_cause && (
                      <div className="text-xs text-slate-700">
                        <span className="font-semibold">🔍 Cause:</span> {anomaly.likely_cause.replace(/_/g, ' ')}
                      </div>
                    )}
                    {anomaly.z_score !== undefined && (
                      <div className="text-xs text-slate-600 mt-1">
                        <span className="font-semibold">Z-Score:</span> {safeNumber(anomaly.z_score, 2)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {volumeAnomalyAgent.significant_anomalies && (
                <div className="text-xs text-slate-500 text-center">
                  Showing {Math.min(5, volumeAnomalyAgent.significant_anomalies.length)} of {volumeAnomalyAgent.significant_anomalies.length} anomalies
                </div>
              )}
            </div>
          )}

          {/* Volume Insights */}
          <div className="space-y-3">
            <h4 className="font-semibold text-slate-800">Volume Insights</h4>
            <div className="space-y-2">
              {/* Volume Trend Analysis */}
              {volumeTrends.primary_trend && (
                <div className="flex items-start space-x-2 text-sm">
                  {getTrendIcon(volumeTrends.primary_trend)}
                  <span className={`break-words ${volumeTrends.primary_trend === 'up' ? 'text-green-700' : 'text-red-700'}`}>
                    Volume trend is {volumeTrends.primary_trend} over 20-day period
                  </span>
                </div>
              )}
              
              {/* Volume Confirmation */}
              {volumeConfirmation.confirmation_status && (
                <div className="flex items-start space-x-2 text-sm">
                  {volumeConfirmation.confirmation_status === 'confirmed' ? (
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  )}
                  <span className={`break-words ${volumeConfirmation.confirmation_status === 'confirmed' ? 'text-green-700' : 'text-yellow-700'}`}>
                    Volume {volumeConfirmation.confirmation_status} price trend ({volumeConfirmation.strength} strength)
                  </span>
                </div>
              )}
              
              {/* Price-Volume Correlation */}
              {priceVolumeCorrelation.correlation_strength && (
                <div className="flex items-start space-x-2 text-sm">
                  <BarChart3 className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span className="text-blue-700 break-words">
                    {priceVolumeCorrelation.correlation_strength} price-volume correlation ({Math.abs(priceVolumeCorrelation.correlation_20d || 0).toFixed(2)})
                  </span>
                </div>
              )}
              
              {/* Volume Anomalies */}
              {volumeAnomalies.recent_anomalies > 0 && (
                <div className="flex items-start space-x-2 text-sm">
                  <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                  <span className="text-orange-700 break-words">
                    {volumeAnomalies.recent_anomalies} recent volume anomalies detected
                  </span>
                </div>
              )}
              
              {/* Volume Volatility */}
              {volumeVolatility.volatility_regime && (
                <div className="flex items-start space-x-2 text-sm">
                  <Activity className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                  <span className="text-purple-700 break-words">
                    {volumeVolatility.volatility_regime} volume volatility regime
                  </span>
                </div>
              )}
              
              {/* Volume Strength Score */}
              {volumeStrengthScore > 0 && (
                <div className="flex items-start space-x-2 text-sm">
                  <TrendingUp className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span className="text-emerald-700 break-words">
                    Volume strength score: {volumeStrengthScore.toFixed(0)}/100
                  </span>
                </div>
              )}
              
              {/* Basic Volume Insights (fallback) */}
              {volumeRatio > 1.5 && !volumeTrends.primary_trend && (
                <div className="flex items-start space-x-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-green-700 break-words">High volume confirms strong market interest</span>
                </div>
              )}
              {volumeRatio < 0.5 && !volumeTrends.primary_trend && (
                <div className="flex items-start space-x-2 text-sm">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <span className="text-yellow-700 break-words">Low volume suggests weak market participation</span>
                </div>
              )}
              {obvTrend === 'up' && !volumeTrends.primary_trend && (
                <div className="flex items-start space-x-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-green-700 break-words">Rising OBV indicates accumulation</span>
                </div>
              )}
              {obvTrend === 'down' && !volumeTrends.primary_trend && (
                <div className="flex items-start space-x-2 text-sm">
                  <XCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <span className="text-red-700 break-words">Declining OBV suggests distribution</span>
                </div>
              )}
            </div>
          </div>

          {/* No Data Alert */}
          {!volumeData && !volumeMetrics && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Volume analysis data not available for {symbol}
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default VolumeAnalysisCard; 