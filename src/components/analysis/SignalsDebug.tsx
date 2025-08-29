import React from 'react';

interface SignalsDebugProps {
  signals: any;
  enhancedData: any;
  analysisData: any;
}

const SignalsDebug: React.FC<SignalsDebugProps> = ({ 
  signals, 
  enhancedData, 
  analysisData 
}) => {
  return (
    <div className="p-4 bg-yellow-100 border border-yellow-300 rounded-lg mb-4">
      <h3 className="font-semibold text-yellow-800">Debug: Signals Data</h3>
      
      <div className="grid grid-cols-1 gap-4 text-sm">
        <div>
          <h4 className="font-medium text-yellow-700">Signals Object:</h4>
          <pre className="text-xs bg-white p-2 rounded overflow-auto max-h-32">
            {JSON.stringify(signals, null, 2)}
          </pre>
        </div>
        
        <div>
          <h4 className="font-medium text-yellow-700">Enhanced Data Keys:</h4>
          <p className="text-xs">
            {enhancedData ? Object.keys(enhancedData).join(', ') : 'No enhanced data'}
          </p>
        </div>
        
        <div>
          <h4 className="font-medium text-yellow-700">Technical Indicators Keys:</h4>
          <p className="text-xs">
            {enhancedData?.technical_indicators ? 
              Object.keys(enhancedData.technical_indicators).join(', ') : 
              'No technical indicators'
            }
          </p>
        </div>
        
        <div>
          <h4 className="font-medium text-yellow-700">Analysis Data Keys:</h4>
          <p className="text-xs">
            {analysisData ? Object.keys(analysisData).join(', ') : 'No analysis data'}
          </p>
        </div>
        
        <div>
          <h4 className="font-medium text-yellow-700">Raw Data Available:</h4>
          <p className="text-xs">
            Raw Data: {enhancedData?.technical_indicators?.raw_data ? 'Yes' : 'No'}<br/>
            Close Prices: {enhancedData?.technical_indicators?.raw_data?.close ? 
              `${enhancedData.technical_indicators.raw_data.close.length} prices` : 'No'
            }<br/>
            Moving Averages: {enhancedData?.technical_indicators?.moving_averages ? 'Yes' : 'No'}<br/>
            RSI: {enhancedData?.technical_indicators?.rsi ? 'Yes' : 'No'}<br/>
            MACD: {enhancedData?.technical_indicators?.macd ? 'Yes' : 'No'}<br/>
            Volatility Analysis: {enhancedData?.technical_indicators?.volatility_analysis ? 'Yes' : 'No'}
          </p>
        </div>
        
        <div>
          <h4 className="font-medium text-yellow-700">Raw Data Structure:</h4>
          <pre className="text-xs bg-white p-2 rounded overflow-auto max-h-32">
            {JSON.stringify(enhancedData?.technical_indicators?.raw_data, null, 2)}
          </pre>
        </div>
        
        <div>
          <h4 className="font-medium text-yellow-700">Moving Averages Structure:</h4>
          <pre className="text-xs bg-white p-2 rounded overflow-auto max-h-32">
            {JSON.stringify(enhancedData?.technical_indicators?.moving_averages, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default SignalsDebug;
