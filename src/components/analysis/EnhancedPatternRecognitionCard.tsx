import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Target,
  AlertTriangle,
  CheckCircle,
  XCircle,
  BarChart3,
  Zap
} from "lucide-react";
import { EnhancedOverlays } from "@/types/analysis";
import AdvancedPatternAnalysisCard from "./AdvancedPatternAnalysisCard";
import { formatCurrency, formatConfidence } from "@/utils/numberFormatter";

interface EnhancedPatternRecognitionCardProps {
  overlays: EnhancedOverlays;
  symbol: string;
}

const EnhancedPatternRecognitionCard: React.FC<EnhancedPatternRecognitionCardProps> = ({ 
  overlays, 
  symbol 
}) => {
  // Add null checks and default values
  if (!overlays) {
    return (
      <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-t-lg">
          <div className="flex items-center space-x-2">
            <Activity className="h-6 w-6" />
            <CardTitle className="text-xl">Enhanced Pattern Recognition</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center py-8 text-gray-500">
            <p>No pattern recognition data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Safe access to properties with defaults
  const advanced_patterns = overlays.advanced_patterns || {
    head_and_shoulders: [],
    inverse_head_and_shoulders: [],
    cup_and_handle: [],
    triple_tops: [],
    triple_bottoms: [],
    wedge_patterns: [],
    channel_patterns: []
  };

  const support_resistance = overlays.support_resistance || { support: [], resistance: [] };

  const getPatternIcon = (patternType: string) => {
    switch (patternType.toLowerCase()) {
      case 'head_and_shoulders':
      case 'inverse_head_and_shoulders':
        return <Target className="h-4 w-4" />;
      case 'cup_and_handle':
        return <BarChart3 className="h-4 w-4" />;
      case 'triple_tops':
      case 'triple_bottoms':
        return <Activity className="h-4 w-4" />;
      case 'wedge':
        return <TrendingUp className="h-4 w-4" />;
      case 'channel':
        return <Zap className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getPatternColor = (patternType: string) => {
    switch (patternType.toLowerCase()) {
      case 'head_and_shoulders':
      case 'triple_tops':
        return 'text-red-600 bg-red-50';
      case 'inverse_head_and_shoulders':
      case 'triple_bottoms':
        return 'text-green-600 bg-green-50';
      case 'cup_and_handle':
        return 'text-blue-600 bg-blue-50';
      case 'wedge':
        return 'text-purple-600 bg-purple-50';
      case 'channel':
        return 'text-orange-600 bg-orange-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getPatternSignificance = (patternType: string) => {
    switch (patternType.toLowerCase()) {
      case 'head_and_shoulders':
        return 'Strong bearish reversal pattern';
      case 'inverse_head_and_shoulders':
        return 'Strong bullish reversal pattern';
      case 'cup_and_handle':
        return 'Bullish continuation pattern';
      case 'triple_tops':
        return 'Bearish reversal pattern';
      case 'triple_bottoms':
        return 'Bullish reversal pattern';
      case 'wedge':
        return 'Trend continuation or reversal';
      case 'channel':
        return 'Price channel pattern';
      default:
        return 'Technical pattern detected';
    }
  };

  const formatPatternData = (patterns: unknown[], patternType: string) => {
    if (!patterns || patterns.length === 0) return null;

    return patterns.map((pattern, index) => {
      const patternName = patternType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      
      return {
        id: `${patternType}_${index}`,
        name: patternName,
        type: patternType,
        data: pattern,
        significance: getPatternSignificance(patternType),
        icon: getPatternIcon(patternType),
        color: getPatternColor(patternType)
      };
    });
  };

  // Filter to ensure cards have meaningful data (non-empty)
  const hasLevels = (p: any) => p && (p.target_level !== undefined || p.stop_level !== undefined);
  const filteredTripleTops = (advanced_patterns.triple_tops || []).filter(hasLevels);
  const filteredTripleBottoms = (advanced_patterns.triple_bottoms || []).filter(hasLevels);
  const filteredChannelPatterns = (advanced_patterns.channel_patterns || []).filter(hasLevels);

  const allPatterns = [
    ...formatPatternData(filteredTripleTops, 'triple_tops') || [],
    ...formatPatternData(filteredTripleBottoms, 'triple_bottoms') || [],
    ...formatPatternData(filteredChannelPatterns, 'channel') || []
  ];

  const basicPatterns = [
    { name: 'Triple Tops', count: filteredTripleTops.length, type: 'triple_top' },
    { name: 'Triple Bottoms', count: filteredTripleBottoms.length, type: 'triple_bottom' },
    { name: 'Channel Patterns', count: filteredChannelPatterns.length, type: 'channel_pattern' }
  ];

  const nonEmptyBasicPatterns = basicPatterns.filter(p => p.count > 0);
  const hasAnyAdvanced = filteredTripleTops.length > 0
    || filteredTripleBottoms.length > 0
    || filteredChannelPatterns.length > 0;

  const supportResistance = {
    support: support_resistance.support.length,
    resistance: support_resistance.resistance.length
  };

  const renderPatternDetails = (pattern: PatternData) => {
    return (
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="font-medium">Start Date:</span>
            <div className="text-xs text-gray-600">
              {new Date(pattern.start_date).toLocaleDateString()}
            </div>
          </div>
          <div>
            <span className="font-medium">End Date:</span>
            <div className="text-xs text-gray-600">
              {new Date(pattern.end_date).toLocaleDateString()}
            </div>
          </div>
          <div>
            <span className="font-medium">Start Price:</span>
            <div className="text-xs text-gray-600">
              {formatCurrency(pattern.start_price)}
            </div>
          </div>
          <div>
            <span className="font-medium">End Price:</span>
            <div className="text-xs text-gray-600">
              {formatCurrency(pattern.end_price)}
            </div>
          </div>
        </div>
        <div className="text-sm">
          <span className="font-medium">Confidence:</span> {formatConfidence(pattern.confidence)}
        </div>
        <div className="text-sm">
          <span className="font-medium">Description:</span> {pattern.description}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Advanced Pattern Recognition */}
      <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-t-lg">
          <div className="flex items-center space-x-2">
            <Activity className="h-6 w-6" />
            <CardTitle className="text-xl">Enhanced Pattern Recognition</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {/* Pattern Summary */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Pattern Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-slate-50 rounded-lg">
                <div className="text-2xl font-bold text-slate-800">{allPatterns.length}</div>
                <div className="text-xs text-slate-600">Advanced Patterns</div>
              </div>
              <div className="text-center p-3 bg-slate-50 rounded-lg">
                <div className="text-2xl font-bold text-slate-800">{basicPatterns.reduce((sum, p) => sum + p.count, 0)}</div>
                <div className="text-xs text-slate-600">Basic Patterns</div>
              </div>
              <div className="text-center p-3 bg-slate-50 rounded-lg">
                <div className="text-2xl font-bold text-slate-800">{supportResistance.support + supportResistance.resistance}</div>
                <div className="text-xs text-slate-600">Support/Resistance</div>
              </div>
              <div className="text-center p-3 bg-slate-50 rounded-lg">
                <div className="text-2xl font-bold text-slate-800">
                  {allPatterns.length > 0 ? 'High' : basicPatterns.reduce((sum, p) => sum + p.count, 0) > 0 ? 'Medium' : 'Low'}
                </div>
                <div className="text-xs text-slate-600">Pattern Activity</div>
              </div>
            </div>
          </div>

          {/* Advanced Pattern Analysis Card */}
          {hasAnyAdvanced && (
            <div className="mb-6">
              <AdvancedPatternAnalysisCard 
                patterns={{
                  triple_tops: filteredTripleTops as any,
                  triple_bottoms: filteredTripleBottoms as any,
                  channel_patterns: filteredChannelPatterns as any
                }}
                symbol={symbol}
              />
            </div>
          )}



          {/* Basic Patterns (curated) */}
          {nonEmptyBasicPatterns.length > 0 && (
            <div className="mb-6">
              <h4 className="font-semibold text-slate-700 mb-3">Key Patterns</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {nonEmptyBasicPatterns.map((pattern) => (
                  <div key={pattern.type} className="p-3 border border-slate-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-700">{pattern.name}</span>
                      <Badge variant={"default"}>
                        {pattern.count}
                      </Badge>
                    </div>
                    <div className="mt-2">
                      <div className="flex items-center space-x-1">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        <span className="text-xs text-green-600">Detected</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Support and Resistance */}
          <div>
            <h4 className="font-semibold text-slate-700 mb-3">Support & Resistance Levels</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <h5 className="font-medium text-green-800">Support Levels</h5>
                </div>
                <div className="space-y-1">
                  {supportResistance.support > 0 ? (
                    support_resistance.support.slice(0, 5).map((level, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-green-700">Level {index + 1}:</span>
                        <span className="font-medium text-green-800">{formatCurrency(level.level)}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-green-600">No support levels detected</p>
                  )}
                </div>
              </div>
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <TrendingDown className="h-4 w-4 text-red-600" />
                  <h5 className="font-medium text-red-800">Resistance Levels</h5>
                </div>
                <div className="space-y-1">
                  {supportResistance.resistance > 0 ? (
                    support_resistance.resistance.slice(0, 5).map((level, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-red-700">Level {index + 1}:</span>
                        <span className="font-medium text-red-800">{formatCurrency(level.level)}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-red-600">No resistance levels detected</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Pattern Insights */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h5 className="font-medium text-blue-800 mb-1">Pattern Analysis Insights</h5>
                <p className="text-sm text-blue-700">
                  {allPatterns.length > 0 
                    ? `Detected ${allPatterns.length} advanced patterns suggesting significant technical activity. Consider these patterns in conjunction with other technical indicators for trading decisions.`
                    : basicPatterns.reduce((sum, p) => sum + p.count, 0) > 0
                    ? 'Basic patterns detected. Monitor for potential trend changes or continuation signals.'
                    : 'Limited pattern activity detected. Consider focusing on other technical indicators for analysis.'
                  }
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedPatternRecognitionCard; 