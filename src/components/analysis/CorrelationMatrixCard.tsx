import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Network, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { getDiversificationInterpretation, getDiversificationQualityColor } from '@/utils/diversificationUtils';

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

  // Using utility functions for diversification interpretation

  return (
    <Card className={`shadow-xl border-0 bg-white/80 backdrop-blur-sm ${className || ''}`}>
      <CardHeader>
        <CardTitle className="flex items-center text-slate-800">
          <Network className="h-5 w-5 mr-2 text-blue-500" />
          Sector Correlation Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Summary Metrics & Top Correlations */}
        <div className="flex justify-center">
          <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-6 max-w-full px-4">
            {/* Summary Metrics */}
            <div className="flex flex-col items-center justify-center p-3 bg-white border border-slate-200 shadow-sm rounded-lg min-h-[100px] min-w-[140px]">
              <div className="text-xl font-bold text-slate-800 mb-1">
                {average_correlation != null ? (average_correlation * 100).toFixed(1) : 'N/A'}%
              </div>
              <div className="text-sm text-slate-600 text-center leading-tight">Average Correlation</div>
            </div>
            <div className="flex flex-col items-center justify-center p-3 bg-white border border-slate-200 shadow-sm rounded-lg min-h-[100px] min-w-[140px]">
              <div className="mb-1">
                <Badge className={getDiversificationQualityColor(diversification_insights?.diversification_quality || 'unknown')}>
                  {diversification_insights?.diversification_quality || 'unknown'}
                </Badge>
              </div>
              <div className="text-sm text-slate-600 text-center mb-1">Diversification Quality</div>
              <div className="text-xs text-slate-500 italic leading-tight text-center whitespace-pre-line">
                {getDiversificationInterpretation(diversification_insights?.diversification_quality || 'unknown')}
              </div>
            </div>
            <div className="flex flex-col items-center justify-center p-3 bg-white border border-slate-200 shadow-sm rounded-lg min-h-[100px] min-w-[140px]">
              <div className="text-xl font-bold text-slate-800 mb-1">
                {sector_volatility != null ? sector_volatility.toFixed(1) : 'N/A'}%
              </div>
              <div className="text-sm text-slate-600 text-center leading-tight">Sector Volatility</div>
            </div>
            <div className="flex flex-col items-center justify-center p-3 bg-white border border-slate-200 shadow-sm rounded-lg min-h-[100px] min-w-[140px]">
              <div className="text-xl font-bold text-slate-800 mb-1">
                {sectors.length}
              </div>
              <div className="text-sm text-slate-600 text-center leading-tight">Sectors Analyzed</div>
            </div>
            
            {/* Top 4 Sector Correlations */}
            {sortedSectorCorrelations.slice(0, 4).map(([sector, correlation]) => (
              <div key={sector} className="flex flex-col items-center justify-center p-3 bg-white border border-slate-200 shadow-sm rounded-lg min-h-[100px] min-w-[140px]">
                <div className="flex items-center mb-1">
                  {getCorrelationIcon(correlation)}
                </div>
                <div className="text-lg font-bold text-slate-800 mb-1">
                  <Badge className={getCorrelationColor(correlation)} variant="secondary">
                    {correlation != null && correlation > 0 ? '+' : ''}{correlation != null ? (correlation * 100).toFixed(1) : 'N/A'}%
                  </Badge>
                </div>
                <div className="text-sm text-slate-600 text-center leading-tight">
                  vs {sector.replace(/_/g, ' ')}
                </div>
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
