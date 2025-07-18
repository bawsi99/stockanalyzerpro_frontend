import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { TrendingUp, TrendingDown, Target, AlertTriangle, CheckCircle, Clock } from "lucide-react";

interface AdvancedPattern {
  type: string;
  quality_score: number;
  completion_status: string;
  target?: number;
  left_shoulder?: any;
  head?: any;
  right_shoulder?: any;
  neckline?: any;
  cup?: any;
  handle?: any;
  breakout_level?: number;
}

interface AdvancedPatternAnalysisCardProps {
  patterns: {
    head_and_shoulders: AdvancedPattern[];
    inverse_head_and_shoulders: AdvancedPattern[];
    cup_and_handle: AdvancedPattern[];
  };
  symbol: string;
}

const AdvancedPatternAnalysisCard: React.FC<AdvancedPatternAnalysisCardProps> = ({ patterns, symbol }) => {
  const getPatternIcon = (type: string) => {
    switch (type) {
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
    ...patterns.head_and_shoulders.map(p => ({ ...p, type: 'head_and_shoulders' })),
    ...patterns.inverse_head_and_shoulders.map(p => ({ ...p, type: 'inverse_head_and_shoulders' })),
    ...patterns.cup_and_handle.map(p => ({ ...p, type: 'cup_and_handle' }))
  ];

  if (allPatterns.length === 0) {
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
            <p>No advanced patterns detected</p>
            <p className="text-sm">Head & Shoulders, Inverse H&S, and Cup & Handle patterns will appear here</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full shadow-xl border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-t-lg">
        <CardTitle className="flex items-center space-x-2">
          <Target className="h-6 w-6" />
          <span>Advanced Pattern Analysis</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {allPatterns.map((pattern, index) => (
          <div key={index} className={`border rounded-lg p-4 ${getPatternColor(pattern.type)}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                {getPatternIcon(pattern.type)}
                <span className="font-semibold capitalize">
                  {pattern.type.replace(/_/g, ' ')}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Badge className={getQualityColor(pattern.quality_score)}>
                  Quality: {pattern.quality_score.toFixed(0)}
                </Badge>
                <div className="flex items-center space-x-1">
                  {getStatusIcon(pattern.completion_status)}
                  <span className="text-sm capitalize">{pattern.completion_status}</span>
                </div>
              </div>
            </div>
            
            <Separator className="my-3" />
            
            {renderPatternDetails(pattern)}
          </div>
        ))}
        
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-semibold mb-2">Pattern Summary</h4>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium">Head & Shoulders:</span>
              <div className="text-gray-600">{patterns.head_and_shoulders.length}</div>
            </div>
            <div>
              <span className="font-medium">Inverse H&S:</span>
              <div className="text-gray-600">{patterns.inverse_head_and_shoulders.length}</div>
            </div>
            <div>
              <span className="font-medium">Cup & Handle:</span>
              <div className="text-gray-600">{patterns.cup_and_handle.length}</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdvancedPatternAnalysisCard; 