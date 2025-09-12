import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle } from 'lucide-react';

interface SectorRotationData {
  timeframe: string;
  sector_performance: Record<string, {
    total_return: number;
    momentum: number;
    relative_strength: number;
    current_price: number;
    start_price: number;
  }>;
  sector_rankings: Record<string, {
    rank: number;
    // OPTIMIZED: performance data removed to eliminate duplication
    // Performance data is available in sector_performance[sector]
  }>;
  rotation_patterns: {
    leading_sectors: Array<{
      sector: string;
      relative_strength: number;
      momentum: number;
    }>;
    lagging_sectors: Array<{
      sector: string;
      relative_strength: number;
      momentum: number;
    }>;
    rotation_strength: string;
  };
  recommendations: Array<{
    type: string;
    sector?: string;
    reason?: string;
    confidence: string;
    message?: string;
  }>;
}

interface SectorRotationCardProps {
  data: SectorRotationData;
  currentSector?: string;
}

const SectorRotationCard: React.FC<SectorRotationCardProps> = ({ data, currentSector }) => {
  if (!data) return null;

  const getRotationStrengthColor = (strength: string) => {
    switch (strength) {
      case 'strong': return 'text-green-600 bg-green-100';
      case 'moderate': return 'text-yellow-600 bg-yellow-100';
      case 'weak': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'overweight':
      case 'positive':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'underweight':
      case 'warning':
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      default:
        return <Minus className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Sector Rotation Analysis
        </CardTitle>
        <CardDescription>
          {data.timeframe} sector performance and rotation patterns
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Rotation Strength */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Rotation Strength</span>
            <Badge className={getRotationStrengthColor(data.rotation_patterns.rotation_strength)}>
              {data.rotation_patterns.rotation_strength.toUpperCase()}
            </Badge>
          </div>
          <Progress 
            value={
              data.rotation_patterns.rotation_strength === 'strong' ? 80 :
              data.rotation_patterns.rotation_strength === 'moderate' ? 50 : 20
            } 
            className="h-2"
          />
        </div>

        {/* Current Sector Performance - OPTIMIZED: Use sector_performance instead of sector_rankings.performance */}
        {currentSector && data.sector_rankings[currentSector] && data.sector_performance[currentSector] && (
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Your Sector: {currentSector}</h4>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Rank</span>
                <div className="font-semibold">#{data.sector_rankings[currentSector].rank}</div>
              </div>
              <div>
                <span className="text-gray-600">Return</span>
                <div className={`font-semibold ${
                  data.sector_performance[currentSector].total_return > 0 
                    ? 'text-green-600' : 'text-red-600'
                }`}>
                  {data.sector_performance[currentSector].total_return.toFixed(1)}%
                </div>
              </div>
              <div>
                <span className="text-gray-600">Momentum</span>
                <div className={`font-semibold ${
                  data.sector_performance[currentSector].momentum > 0 
                    ? 'text-green-600' : 'text-red-600'
                }`}>
                  {data.sector_performance[currentSector].momentum.toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Leading Sectors */}
        <div className="space-y-2">
          <h4 className="font-medium text-green-700 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Leading Sectors
          </h4>
          <div className="space-y-2">
            {data.rotation_patterns.leading_sectors.map((sector, index) => (
              <div key={sector.sector} className="flex items-center justify-between p-2 bg-green-50 rounded">
                <span className="font-medium">{sector.sector}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-green-600">
                    +{sector.relative_strength.toFixed(1)}%
                  </span>
                  <Badge variant="outline" className="text-xs">
                    #{index + 1}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Lagging Sectors */}
        <div className="space-y-2">
          <h4 className="font-medium text-red-700 flex items-center gap-2">
            <TrendingDown className="w-4 h-4" />
            Lagging Sectors
          </h4>
          <div className="space-y-2">
            {data.rotation_patterns.lagging_sectors.map((sector, index) => (
              <div key={sector.sector} className="flex items-center justify-between p-2 bg-red-50 rounded">
                <span className="font-medium">{sector.sector}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-red-600">
                    {sector.relative_strength.toFixed(1)}%
                  </span>
                  <Badge variant="outline" className="text-xs">
                    #{data.rotation_patterns.leading_sectors.length + index + 1}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recommendations */}
        {data.recommendations.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">Trading Recommendations</h4>
            <div className="space-y-2">
              {data.recommendations.map((rec, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  {getRecommendationIcon(rec.type)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium capitalize">{rec.type}</span>
                      {rec.sector && (
                        <Badge variant="outline" className="text-xs">{rec.sector}</Badge>
                      )}
                      <Badge className={`text-xs ${getConfidenceColor(rec.confidence)}`}>
                        {rec.confidence} confidence
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">
                      {rec.reason || rec.message}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SectorRotationCard; 