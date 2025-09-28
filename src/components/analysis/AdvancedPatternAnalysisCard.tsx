import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { TrendingUp, TrendingDown, Target, Clock, CheckCircle, AlertTriangle } from 'lucide-react';

interface PatternComponent {
  price?: number;
  level?: number;
  date?: string;
  volume?: number;
}

interface AdvancedPattern {
  type: string;
  strength?: string;
  completion?: number;
  reliability?: string;
  target_level?: number;
  stop_level?: number;
  quality_score?: number;
  completion_status?: string;
  target?: number;
  left_shoulder?: PatternComponent;
  head?: PatternComponent;
  right_shoulder?: PatternComponent;
  neckline?: PatternComponent;
  cup?: PatternComponent;
  handle?: PatternComponent;
  breakout_level?: number;
}

interface AdvancedPatternAnalysisCardProps {
  patterns?: {
    triple_tops?: AdvancedPattern[];
    triple_bottoms?: AdvancedPattern[];
    wedge_patterns?: AdvancedPattern[];
    channel_patterns?: AdvancedPattern[];
    head_and_shoulders?: AdvancedPattern[];
    inverse_head_and_shoulders?: AdvancedPattern[];
    cup_and_handle?: AdvancedPattern[];
  };
  symbol: string;
}

const AdvancedPatternAnalysisCard: React.FC<AdvancedPatternAnalysisCardProps> = ({ patterns, symbol }) => {
  // Safety check for undefined patterns
  if (!patterns) {
    return (
      <Card className="w-full shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-t-lg">
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-6 w-6" />
            <span>Advanced Pattern Analysis</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center py-8 text-gray-500">
            <Target className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No pattern data available</p>
            <p className="text-sm">Pattern analysis data is not available for this stock</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  const getPatternIcon = (type: string) => {
    switch (type) {
      case 'triple_tops':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'triple_bottoms':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      case 'wedge_patterns':
        return <Target className="h-4 w-4 text-blue-500" />;
      case 'channel_patterns':
        return <Target className="h-4 w-4 text-purple-500" />;
      case 'head_and_shoulders':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      case 'inverse_head_and_shoulders':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'cup_and_handle':
        return <Target className="h-4 w-4 text-blue-500" />;
      default:
        return <Target className="h-4 w-4" />;
    }
  };

  const getPatternColor = (type: string) => {
    switch (type) {
      case 'triple_tops':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'triple_bottoms':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'wedge_patterns':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'channel_patterns':
        return 'bg-purple-50 border-purple-200 text-purple-800';
      case 'head_and_shoulders':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'inverse_head_and_shoulders':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'cup_and_handle':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getQualityColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'forming':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const renderPatternDetails = (pattern: AdvancedPattern) => {
    // Handle new pattern structure with target_level and stop_level
    if (pattern.target_level !== undefined || pattern.stop_level !== undefined) {
      return (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="font-medium">Target Level:</span>
              <div className="text-xs text-gray-600">
                ₹{pattern.target_level?.toFixed(2) || 'N/A'}
              </div>
            </div>
            <div>
              <span className="font-medium">Stop Level:</span>
              <div className="text-xs text-gray-600">
                ₹{pattern.stop_level?.toFixed(2) || 'N/A'}
              </div>
            </div>
            <div>
              <span className="font-medium">Strength:</span>
              <div className="text-xs text-gray-600 capitalize">
                {pattern.strength || 'N/A'}
              </div>
            </div>
            <div>
              <span className="font-medium">Reliability:</span>
              <div className="text-xs text-gray-600 capitalize">
                {pattern.reliability || 'N/A'}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Handle legacy pattern structure
    switch (pattern.type) {
      case 'head_and_shoulders':
      case 'inverse_head_and_shoulders':
        return (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="font-medium">Left Shoulder:</span>
                <div className="text-xs text-gray-600">
                  ₹{pattern.left_shoulder?.price?.toFixed(2)}
                </div>
              </div>
              <div>
                <span className="font-medium">Head:</span>
                <div className="text-xs text-gray-600">
                  ₹{pattern.head?.price?.toFixed(2)}
                </div>
              </div>
              <div>
                <span className="font-medium">Right Shoulder:</span>
                <div className="text-xs text-gray-600">
                  ₹{pattern.right_shoulder?.price?.toFixed(2)}
                </div>
              </div>
              <div>
                <span className="font-medium">Neckline:</span>
                <div className="text-xs text-gray-600">
                  ₹{pattern.neckline?.level?.toFixed(2)}
                </div>
              </div>
            </div>
            {pattern.target && (
              <div className="text-sm">
                <span className="font-medium">Target:</span> ₹{pattern.target.toFixed(2)}
              </div>
            )}
          </div>
        );
      
      case 'cup_and_handle':
        return (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="font-medium">Cup Depth:</span>
                <div className="text-xs text-gray-600">
                  {(pattern.cup?.depth * 100).toFixed(1)}%
                </div>
              </div>
              <div>
                <span className="font-medium">Handle Drift:</span>
                <div className="text-xs text-gray-600">
                  {(pattern.handle?.drift * 100).toFixed(1)}%
                </div>
              </div>
              <div>
                <span className="font-medium">Breakout Level:</span>
                <div className="text-xs text-gray-600">
                  ₹{pattern.breakout_level?.toFixed(2)}
                </div>
              </div>
              <div>
                <span className="font-medium">Target:</span>
                <div className="text-xs text-gray-600">
                  ₹{pattern.target?.toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  const allPatterns = [
    ...(patterns.triple_tops || []).map(p => ({ ...p, type: 'triple_tops' })),
    ...(patterns.triple_bottoms || []).map(p => ({ ...p, type: 'triple_bottoms' })),
    ...(patterns.wedge_patterns || []).map(p => ({ ...p, type: 'wedge_patterns' })),
    ...(patterns.channel_patterns || []).map(p => ({ ...p, type: 'channel_patterns' })),
    ...(patterns.head_and_shoulders || []).map(p => ({ ...p, type: 'head_and_shoulders' })),
    ...(patterns.inverse_head_and_shoulders || []).map(p => ({ ...p, type: 'inverse_head_and_shoulders' })),
    ...(patterns.cup_and_handle || []).map(p => ({ ...p, type: 'cup_and_handle' }))
  ];

  if (allPatterns.length === 0) {
    return (
      <Card className="w-full shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="text-center py-8 text-gray-500">
            <Target className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No advanced patterns detected</p>
            <p className="text-sm">Triple Tops/Bottoms, Wedge Patterns, and Channel Patterns will appear here</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full shadow-xl border-0 bg-white/80 backdrop-blur-sm">
      <CardContent className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {allPatterns.map((pattern, index) => (
            <div key={index} className={`border rounded-lg p-4 h-fit min-h-[200px] flex flex-col ${getPatternColor(pattern.type)}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  {getPatternIcon(pattern.type)}
                  <span className="font-semibold capitalize">
                    {pattern.type.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={getQualityColor(pattern.quality_score || pattern.completion || 0)}>
                    Quality: {(pattern.quality_score || pattern.completion || 0).toFixed(0)}
                  </Badge>
                  <div className="flex items-center space-x-1">
                    {getStatusIcon(pattern.completion_status || (pattern.completion === 100 ? 'completed' : 'forming'))}
                    <span className="text-sm capitalize">{pattern.completion_status || (pattern.completion === 100 ? 'completed' : 'forming')}</span>
                  </div>
                </div>
              </div>
              
              <Separator className="my-3" />
              
              {renderPatternDetails(pattern)}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default AdvancedPatternAnalysisCard; 