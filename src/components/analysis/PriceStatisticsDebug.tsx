import React from 'react';

interface PriceStatisticsDebugProps {
  summaryStats: any;
  latestPrice: number | null;
  timeframe?: string;
}

const PriceStatisticsDebug: React.FC<PriceStatisticsDebugProps> = ({ 
  summaryStats, 
  latestPrice, 
  timeframe = "All Time" 
}) => {
  if (!summaryStats) {
    return (
      <div className="p-4 bg-red-100 border border-red-300 rounded-lg">
        <h3 className="font-semibold text-red-800">Debug: No Summary Stats</h3>
        <p className="text-red-600">summaryStats is null or undefined</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-blue-100 border border-blue-300 rounded-lg mb-4">
      <h3 className="font-semibold text-blue-800">Debug: Price Statistics Data</h3>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p><strong>Timeframe:</strong> {timeframe}</p>
          <p><strong>Latest Price:</strong> {latestPrice}</p>
          <p><strong>Mean:</strong> {summaryStats.mean}</p>
          <p><strong>Max:</strong> {summaryStats.max}</p>
          <p><strong>Min:</strong> {summaryStats.min}</p>
          <p><strong>Current:</strong> {summaryStats.current}</p>
        </div>
        <div>
          <p><strong>Dist from Mean:</strong> {summaryStats.distFromMean}</p>
          <p><strong>Dist from Max:</strong> {summaryStats.distFromMax}</p>
          <p><strong>Dist from Min:</strong> {summaryStats.distFromMin}</p>
          <p><strong>Dist from Mean %:</strong> {summaryStats.distFromMeanPct}</p>
          <p><strong>Dist from Max %:</strong> {summaryStats.distFromMaxPct}</p>
          <p><strong>Dist from Min %:</strong> {summaryStats.distFromMinPct}</p>
        </div>
      </div>
      <div className="mt-2 text-xs text-blue-600">
        <p><strong>Raw Data Type:</strong> {typeof summaryStats}</p>
        <p><strong>Has Technical Indicators:</strong> {summaryStats.technical_indicators ? 'Yes' : 'No'}</p>
        <p><strong>Has Raw Data:</strong> {summaryStats.technical_indicators?.raw_data ? 'Yes' : 'No'}</p>
      </div>
    </div>
  );
};

export default PriceStatisticsDebug;
