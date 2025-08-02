import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TrendingUp, TrendingDown, Target, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { AdvancedPatterns } from '@/types/analysis';

interface ComplexPattern {
  type: string;
  quality_score: number;
  completion_status: string;
  target?: number;
  [key: string]: unknown;
}

interface ComplexPatternAnalysisCardProps {
  patterns: AdvancedPatterns;
}

const ComplexPatternAnalysisCard: React.FC<ComplexPatternAnalysisCardProps> = ({ patterns }) => {
  const allPatterns = [
    ...(patterns.triple_tops || []).map(p => ({ ...p, category: 'Triple Tops' })),
    ...(patterns.triple_bottoms || []).map(p => ({ ...p, category: 'Triple Bottoms' })),
    ...(patterns.wedge_patterns || []).map(p => ({ ...p, category: 'Wedges' })),
    ...(patterns.channel_patterns || []).map(p => ({ ...p, category: 'Channels' }))
  ];

  const getPatternIcon = (type: string) => {
    switch (type) {
      case 'triple_top':
      case 'rising_wedge':
      case 'descending_channel':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      case 'triple_bottom':
      case 'falling_wedge':
      case 'ascending_channel':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'horizontal_channel':
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4 text-blue-500" />;
    }
  };

  const getPatternColor = (type: string) => {
    switch (type) {
      case 'triple_top':
      case 'rising_wedge':
      case 'descending_channel':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'triple_bottom':
      case 'falling_wedge':
      case 'ascending_channel':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'horizontal_channel':
        return 'bg-gray-50 border-gray-200 text-gray-800';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  const getQualityColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getCompletionColor = (status: string) => {
    return status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';
  };

  const formatPatternType = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getPatternSummary = () => {
    const summary = {
      total: allPatterns.length,
      completed: allPatterns.filter(p => (p.completion || p.completion_status) === 100 || (p.completion_status === 'completed')).length,
      forming: allPatterns.filter(p => (p.completion || 0) < 100 && p.completion_status !== 'completed').length,
      avgQuality: allPatterns.length > 0 ? 
        Math.round(allPatterns.reduce((sum, p) => sum + (p.quality_score || p.completion || 0), 0) / allPatterns.length) : 0
    };
    return summary;
  };

  const summary = getPatternSummary();

  if (allPatterns.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Complex Pattern Analysis
          </CardTitle>
          <CardDescription>
            Advanced pattern recognition including triple tops/bottoms, wedges, and channels
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              No complex patterns detected in the current analysis period.
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
          <Clock className="h-5 w-5" />
          Complex Pattern Analysis
        </CardTitle>
        <CardDescription>
          Advanced pattern recognition including triple tops/bottoms, wedges, and channels
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{summary.total}</div>
            <div className="text-sm text-blue-600">Total Patterns</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{summary.completed}</div>
            <div className="text-sm text-green-600">Completed</div>
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">{summary.forming}</div>
            <div className="text-sm text-yellow-600">Forming</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{summary.avgQuality}</div>
            <div className="text-sm text-purple-600">Avg Quality</div>
          </div>
        </div>

        {/* Pattern Details */}
        <div className="space-y-4">
          <h4 className="font-semibold text-lg">Detected Patterns</h4>
          {allPatterns.map((pattern, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border ${getPatternColor(pattern.type)}`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {getPatternIcon(pattern.type)}
                  <span className="font-semibold">
                    {formatPatternType(pattern.type)}
                  </span>
                  <Badge variant="outline" className={getCompletionColor(pattern.completion_status || (pattern.completion === 100 ? 'completed' : 'forming'))}>
                    {pattern.completion_status || (pattern.completion === 100 ? 'completed' : 'forming')}
                  </Badge>
                </div>
                <div className="text-right">
                  <div className={`font-bold ${getQualityColor(pattern.quality_score || pattern.completion || 0)}`}>
                    Q: {pattern.quality_score || pattern.completion || 0}
                  </div>
                  <Progress value={pattern.quality_score || pattern.completion || 0} className="w-20 h-2" />
                </div>
              </div>

              {/* Pattern-specific details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {/* Display common properties for all pattern types */}
                <div>
                  <span className="font-medium">Strength:</span> {pattern.strength || 'medium'}
                </div>
                <div>
                  <span className="font-medium">Reliability:</span> {pattern.reliability || 'medium'}
                </div>
                {pattern.target_level && (
                  <div>
                    <span className="font-medium">Target Level:</span> ₹{pattern.target_level.toFixed(2)}
                  </div>
                )}
                {pattern.stop_level && (
                  <div>
                    <span className="font-medium">Stop Level:</span> ₹{pattern.stop_level.toFixed(2)}
                  </div>
                )}
                
                {/* Legacy pattern properties (if available) */}
                {pattern.support_level && (
                  <div>
                    <span className="font-medium">Support Level:</span> ₹{pattern.support_level.toFixed(2)}
                  </div>
                )}
                {pattern.resistance_level && (
                  <div>
                    <span className="font-medium">Resistance Level:</span> ₹{pattern.resistance_level.toFixed(2)}
                  </div>
                )}
                {pattern.target && (
                  <div>
                    <span className="font-medium">Target:</span> ₹{pattern.target.toFixed(2)}
                  </div>
                )}
                {pattern.duration && (
                  <div>
                    <span className="font-medium">Duration:</span> {pattern.duration} days
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Pattern Insights */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h5 className="font-semibold mb-2">Pattern Insights</h5>
          <ul className="text-sm space-y-1 text-gray-700">
            {summary.completed > 0 && (
              <li>• {summary.completed} pattern(s) have completed their formation</li>
            )}
            {summary.forming > 0 && (
              <li>• {summary.forming} pattern(s) are still forming</li>
            )}
            {summary.avgQuality >= 80 && (
              <li>• High quality patterns detected with strong technical significance</li>
            )}
            {summary.avgQuality < 60 && (
              <li>• Pattern quality is below optimal levels - exercise caution</li>
            )}
            {allPatterns.some(p => p.type.includes('wedge')) && (
              <li>• Wedge patterns suggest potential breakout opportunities</li>
            )}
            {allPatterns.some(p => p.type.includes('channel')) && (
              <li>• Channel patterns indicate range-bound trading conditions</li>
            )}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default ComplexPatternAnalysisCard; 