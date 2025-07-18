import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { TrendingUp, TrendingDown, Minus, BarChart3, Target, AlertTriangle } from "lucide-react";

interface TimeframeConsensus {
  direction: string;
  strength: number;
  bullish_periods: number;
  bearish_periods: number;
  total_periods: number;
}

interface MultiTimeframeAnalysis {
  short_term?: {
    name: string;
    consensus: TimeframeConsensus;
    periods: Record<string, any>;
  };
  medium_term?: {
    name: string;
    consensus: TimeframeConsensus;
    periods: Record<string, any>;
  };
  long_term?: {
    name: string;
    consensus: TimeframeConsensus;
    periods: Record<string, any>;
  };
  overall_consensus?: {
    direction: string;
    strength: number;
    score: number;
    timeframe_alignment: {
      short_term: string;
      medium_term: string;
      long_term: string;
    };
  };
}

interface MultiTimeframeAnalysisCardProps {
  analysis: MultiTimeframeAnalysis;
  symbol: string;
}

const MultiTimeframeAnalysisCard: React.FC<MultiTimeframeAnalysisCardProps> = ({ analysis, symbol }) => {
  const getDirectionIcon = (direction: string) => {
    switch (direction) {
      case 'bullish':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'bearish':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getDirectionColor = (direction: string) => {
    switch (direction) {
      case 'bullish':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'bearish':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStrengthColor = (strength: number) => {
    if (strength >= 80) return 'bg-green-500';
    if (strength >= 60) return 'bg-yellow-500';
    if (strength >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const renderTimeframeCard = (timeframe: string, data: any) => {
    if (!data) return null;

    const consensus = data.consensus;
    const periods = Object.keys(data.periods || {});

    return (
      <div className="border rounded-lg p-4 bg-white">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5 text-blue-500" />
            <h3 className="font-semibold">{data.name}</h3>
          </div>
          <Badge className={getDirectionColor(consensus.direction)}>
            <div className="flex items-center space-x-1">
              {getDirectionIcon(consensus.direction)}
              <span className="capitalize">{consensus.direction}</span>
            </div>
          </Badge>
        </div>

        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Strength</span>
              <span>{consensus.strength.toFixed(0)}%</span>
            </div>
            <Progress 
              value={consensus.strength} 
              className="h-2"
              style={{
                '--progress-background': getStrengthColor(consensus.strength)
              } as React.CSSProperties}
            />
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="text-center p-2 bg-green-50 rounded">
              <div className="font-semibold text-green-700">{consensus.bullish_periods}</div>
              <div className="text-green-600">Bullish</div>
            </div>
            <div className="text-center p-2 bg-red-50 rounded">
              <div className="font-semibold text-red-700">{consensus.bearish_periods}</div>
              <div className="text-red-600">Bearish</div>
            </div>
            <div className="text-center p-2 bg-gray-50 rounded">
              <div className="font-semibold text-gray-700">{consensus.total_periods}</div>
              <div className="text-gray-600">Total</div>
            </div>
          </div>

          {periods.length > 0 && (
            <div className="text-xs text-gray-600">
              <span className="font-medium">Periods:</span> {periods.join(', ')}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (!analysis || Object.keys(analysis).length === 0) {
    return (
      <Card className="w-full shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-t-lg">
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-6 w-6" />
            <span>Multi-Timeframe Analysis</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center py-8 text-gray-500">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No multi-timeframe analysis available</p>
            <p className="text-sm">Analysis across short, medium, and long-term timeframes</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full shadow-xl border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-t-lg">
        <CardTitle className="flex items-center space-x-2">
          <BarChart3 className="h-6 w-6" />
          <span>Multi-Timeframe Analysis</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Overall Consensus */}
        {analysis.overall_consensus && (
          <div className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-lg">Overall Consensus</h3>
              <Badge className={getDirectionColor(analysis.overall_consensus.direction)}>
                <div className="flex items-center space-x-1">
                  {getDirectionIcon(analysis.overall_consensus.direction)}
                  <span className="capitalize">{analysis.overall_consensus.direction}</span>
                </div>
              </Badge>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Strength</span>
                  <span>{analysis.overall_consensus.strength.toFixed(0)}%</span>
                </div>
                <Progress 
                  value={analysis.overall_consensus.strength} 
                  className="h-3"
                  style={{
                    '--progress-background': getStrengthColor(analysis.overall_consensus.strength)
                  } as React.CSSProperties}
                />
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Score:</span> {analysis.overall_consensus.score.toFixed(1)}
                </div>
                <div>
                  <span className="font-medium">Alignment:</span>
                  <div className="flex space-x-1 mt-1">
                    {Object.entries(analysis.overall_consensus.timeframe_alignment).map(([tf, direction]) => (
                      <Badge key={tf} variant="outline" className="text-xs">
                        {tf}: {direction}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <Separator />

        {/* Individual Timeframes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {renderTimeframeCard('short_term', analysis.short_term)}
          {renderTimeframeCard('medium_term', analysis.medium_term)}
          {renderTimeframeCard('long_term', analysis.long_term)}
        </div>

        {/* Analysis Summary */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-semibold mb-3">Analysis Summary</h4>
          <div className="space-y-2 text-sm">
            {analysis.overall_consensus && (
              <div className="flex items-center space-x-2">
                <Target className="h-4 w-4 text-blue-500" />
                <span>
                  <strong>Primary Trend:</strong> {analysis.overall_consensus.direction} 
                  with {analysis.overall_consensus.strength.toFixed(0)}% strength
                </span>
              </div>
            )}
            
            {analysis.short_term && (
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span>
                  <strong>Short-term:</strong> {analysis.short_term.consensus.direction} 
                  ({analysis.short_term.consensus.strength.toFixed(0)}%)
                </span>
              </div>
            )}
            
            {analysis.medium_term && (
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-4 w-4 text-blue-500" />
                <span>
                  <strong>Medium-term:</strong> {analysis.medium_term.consensus.direction} 
                  ({analysis.medium_term.consensus.strength.toFixed(0)}%)
                </span>
              </div>
            )}
            
            {analysis.long_term && (
              <div className="flex items-center space-x-2">
                <TrendingDown className="h-4 w-4 text-purple-500" />
                <span>
                  <strong>Long-term:</strong> {analysis.long_term.consensus.direction} 
                  ({analysis.long_term.consensus.strength.toFixed(0)}%)
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MultiTimeframeAnalysisCard; 