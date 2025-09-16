import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Network, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface CorrelationMatrixCardProps {
  correlationData: {
    correlation_matrix: Record<string, Record<string, number>>;
    average_correlation: number;
    sector_volatility: number;
    high_correlation_pairs: Array<{sector1: string, sector2: string, correlation: number}>;
    low_correlation_pairs: Array<{sector1: string, sector2: string, correlation: number}>;
    diversification_insights: {
      diversification_quality: string;
      recommendations: Array<{type: string, message: string, priority: string}>;
    };
  };
  currentSector: string;
  className?: string;
}

const CorrelationMatrixCard: React.FC<CorrelationMatrixCardProps> = ({ 
  correlationData, 
  currentSector, 
  className 
}) => {
  if (!correlationData || !correlationData.correlation_matrix) {
    return (
      <Card className={`shadow-xl border-0 bg-white/80 backdrop-blur-sm ${className || ''}`}>
        <CardHeader>
          <CardTitle className="flex items-center text-slate-800">
            <Network className="h-5 w-5 mr-2 text-blue-500" />
            Sector Correlation Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-500">No correlation data available</p>
        </CardContent>
      </Card>
    );
  }

  const { correlation_matrix, average_correlation, sector_volatility, diversification_insights } = correlationData;
  
  // Get all sectors from the correlation matrix
  const sectors = Object.keys(correlation_matrix);
  
  // Get correlations with respect to the current stock's sector
  const currentSectorCorrelations = correlation_matrix[currentSector] || {};
  
  // Sort sectors by correlation with current sector (excluding self and null values)
  const sortedSectorCorrelations = Object.entries(currentSectorCorrelations)
    .filter(([sector, correlation]) => sector !== currentSector && correlation != null && !isNaN(correlation))
    .sort(([, a], [, b]) => Math.abs(b) - Math.abs(a));

  const getCorrelationColor = (correlation: number) => {
    if (correlation == null || isNaN(correlation)) return 'text-gray-600 bg-gray-50 border-gray-200';
    if (correlation > 0.7) return 'text-red-600 bg-red-50 border-red-200';
    if (correlation > 0.3) return 'text-orange-600 bg-orange-50 border-orange-200';
    if (correlation < -0.3) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (correlation < -0.7) return 'text-indigo-600 bg-indigo-50 border-indigo-200';
    return 'text-green-600 bg-green-50 border-green-200';
  };

  const getCorrelationIcon = (correlation: number) => {
    if (correlation == null || isNaN(correlation)) return <Minus className="h-4 w-4" />;
    if (correlation > 0.3) return <TrendingUp className="h-4 w-4" />;
    if (correlation < -0.3) return <TrendingDown className="h-4 w-4" />;
    return <Minus className="h-4 w-4" />;
  };

  const getCorrelationQualityColor = (quality: string) => {
    switch (quality.toLowerCase()) {
      case 'excellent': return 'bg-green-100 text-green-800';
      case 'good': return 'bg-blue-100 text-blue-800';
      case 'moderate': return 'bg-yellow-100 text-yellow-800';
      case 'poor': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className={`shadow-xl border-0 bg-white/80 backdrop-blur-sm ${className || ''}`}>
      <CardHeader>
        <CardTitle className="flex items-center text-slate-800">
          <Network className="h-5 w-5 mr-2 text-blue-500" />
          Sector Correlation Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Summary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-slate-50 rounded-lg">
            <div className="text-2xl font-bold text-slate-800">
              {average_correlation != null ? (average_correlation * 100).toFixed(1) : 'N/A'}%
            </div>
            <div className="text-sm text-slate-600">Average Correlation</div>
          </div>
          <div className="text-center p-4 bg-slate-50 rounded-lg">
            <div className="text-lg font-bold capitalize">
              <Badge className={getCorrelationQualityColor(diversification_insights?.diversification_quality || 'unknown')}>
                {diversification_insights?.diversification_quality || 'unknown'}
              </Badge>
            </div>
            <div className="text-sm text-slate-600">Diversification Quality</div>
          </div>
          <div className="text-center p-4 bg-slate-50 rounded-lg">
            <div className="text-lg font-bold text-slate-800">
              {sector_volatility != null ? sector_volatility.toFixed(1) : 'N/A'}%
            </div>
            <div className="text-sm text-slate-600">Sector Volatility</div>
          </div>
          <div className="text-center p-4 bg-slate-50 rounded-lg">
            <div className="text-lg font-bold text-slate-800">
              {sectors.length}
            </div>
            <div className="text-sm text-slate-600">Sectors Analyzed</div>
          </div>
        </div>

        {/* Current Sector Correlations */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-slate-800">
            Correlations with {currentSector} Sector
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {sortedSectorCorrelations.map(([sector, correlation]) => (
              <div key={sector} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  {getCorrelationIcon(correlation)}
                  <span className="font-medium text-slate-700">{sector.replace(/_/g, ' ')}</span>
                </div>
                <Badge className={getCorrelationColor(correlation)}>
                  {correlation != null && correlation > 0 ? '+' : ''}{correlation != null ? (correlation * 100).toFixed(1) : 'N/A'}%
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Full Correlation Matrix */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-slate-800">Full Correlation Matrix</h4>
          <div className="w-full">
            <div className="grid" style={{
              gridTemplateColumns: `minmax(100px, 1fr) repeat(${sectors.length}, minmax(80px, 1fr))`
            }}>
              {/* Header row */}
              <div className="h-12 flex items-center justify-center font-semibold text-slate-600 bg-slate-50 border-b border-r border-slate-200 px-1">
                Sector
              </div>
              {sectors.map(sector => (
                <div key={sector} className="h-12 flex items-center justify-center text-xs font-medium text-slate-600 bg-slate-50 border-b border-r border-slate-200 px-1">
                  <div className="text-center leading-tight text-[11px]">
                    {sector.replace(/_/g, ' ')}
                  </div>
                </div>
              ))}
              
              {/* Data rows */}
              {sectors.map(sector1 => (
                <React.Fragment key={sector1}>
                  <div className="h-12 flex items-center justify-center text-xs font-medium text-slate-700 bg-slate-50 border-b border-r border-slate-200 px-1">
                    <div className="text-center leading-tight text-[11px]">
                      {sector1.replace(/_/g, ' ')}
                    </div>
                  </div>
                  {sectors.map(sector2 => {
                    const correlation = correlation_matrix[sector1]?.[sector2] || 0;
                    const isCurrentSector = sector1 === currentSector || sector2 === currentSector;
                    const isDiagonal = sector1 === sector2;
                    
                    return (
                      <div 
                        key={sector2} 
                        className={`h-12 flex items-center justify-center text-sm border-b border-r border-slate-200 px-1 ${
                          isDiagonal ? 'bg-slate-100 font-bold' : 
                          isCurrentSector ? 'bg-blue-50 font-medium' : 'bg-white'
                        }`}
                      >
                        {isDiagonal ? '100%' : correlation != null ? `${(correlation * 100).toFixed(0)}%` : 'N/A'}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* Diversification Recommendations */}
        {diversification_insights?.recommendations && diversification_insights.recommendations.length > 0 && (
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-slate-800">Diversification Insights</h4>
            <div className="space-y-2">
              {diversification_insights.recommendations.map((rec, index) => (
                <div key={index} className="p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-700">{rec.message}</span>
                    <Badge variant={rec.priority === 'high' ? 'destructive' : 'secondary'}>
                      {rec.priority}
                    </Badge>
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

export default CorrelationMatrixCard;
