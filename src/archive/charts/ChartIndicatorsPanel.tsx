/**
 * @deprecated This component has been archived and is no longer in use.
 * The indicators panel functionality has been integrated into the unified Charts page.
 * See: frontend/src/pages/Charts.tsx for the current implementation.
 * 
 * Archived on: 2024-07-25
 * Reason: Consolidated into unified chart system
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Target,
  AlertTriangle,
  CheckCircle,
  XCircle,
  BarChart3,
  Zap,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';

interface Indicators {
  sma20?: number;
  sma50?: number;
  ema12?: number;
  ema26?: number;
  rsi14?: number;
  macd?: number;
  macdSignal?: number;
  macdHistogram?: number;
  bollingerBands?: {
    upper: number;
    middle: number;
    lower: number;
  };
  stochastic?: {
    k: number;
    d: number;
  };
  atr?: number;
  obv?: number;
}

interface Patterns {
  doubleTops?: Array<{
    type: 'double_top';
    price: number;
    date: string;
  }>;
  doubleBottoms?: Array<{
    type: 'double_bottom';
    price: number;
    date: string;
  }>;
  triangles?: Array<{
    type: 'ascending' | 'descending' | 'symmetrical';
    breakout: 'up' | 'down';
    price: number;
    date: string;
  }>;
  flags?: Array<{
    type: 'bull_flag' | 'bear_flag';
    price: number;
    date: string;
  }>;
  support?: Array<{
    level: number;
    strength: number;
  }>;
  resistance?: Array<{
    level: number;
    strength: number;
  }>;
}

interface ChartIndicatorsPanelProps {
  indicators: Indicators;
  patterns: Patterns;
  symbol: string;
  currentPrice: number;
  theme?: 'light' | 'dark';
}

const ChartIndicatorsPanel: React.FC<ChartIndicatorsPanelProps> = ({ 
  indicators, 
  patterns, 
  symbol, 
  currentPrice,
  theme = 'light'
}) => {
  if (!indicators) {
    return (
      <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-t-lg">
          <CardTitle className="flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Technical Indicators & Patterns
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center py-8 text-gray-500">
            <p>No indicator data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getSignalIcon = (signal: string) => {
    switch (signal?.toLowerCase()) {
      case 'bullish':
      case 'up':
      case 'buy':
        return <ArrowUp className="h-4 w-4 text-green-600" />;
      case 'bearish':
      case 'down':
      case 'sell':
        return <ArrowDown className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const getSignalColor = (signal: string) => {
    switch (signal?.toLowerCase()) {
      case 'bullish':
      case 'up':
      case 'buy':
        return 'text-green-600 bg-green-50';
      case 'bearish':
      case 'down':
      case 'sell':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getRSIStatus = (rsi: number) => {
    if (rsi > 70) return { status: 'Overbought', color: 'text-red-600 bg-red-50' };
    if (rsi < 30) return { status: 'Oversold', color: 'text-green-600 bg-green-50' };
    if (rsi > 60) return { status: 'Near Overbought', color: 'text-orange-600 bg-orange-50' };
    if (rsi < 40) return { status: 'Near Oversold', color: 'text-yellow-600 bg-yellow-50' };
    return { status: 'Neutral', color: 'text-gray-600 bg-gray-50' };
  };

  const getMACDSignal = (macd: number, signal: number) => {
    if (macd > signal) return { signal: 'Bullish', color: 'text-green-600 bg-green-50' };
    return { signal: 'Bearish', color: 'text-red-600 bg-red-50' };
  };

  const getBollingerPosition = (price: number, upper: number, lower: number) => {
    if (price > upper) return { position: 'Above Upper Band', color: 'text-red-600 bg-red-50' };
    if (price < lower) return { position: 'Below Lower Band', color: 'text-green-600 bg-green-50' };
    return { position: 'Within Bands', color: 'text-gray-600 bg-gray-50' };
  };

  return (
    <div className="space-y-6">
      {/* Moving Averages Section */}
      <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-t-lg">
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Moving Averages
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {indicators.sma20 && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-800">SMA 20</span>
                  <Badge variant="outline" className="text-blue-600 border-blue-200">
                    ₹{indicators.sma20[indicators.sma20.length - 1]?.toFixed(2) || 'N/A'}
                  </Badge>
                </div>
                <div className="mt-1">
                  {getSignalIcon(currentPrice > indicators.sma20[indicators.sma20.length - 1] ? 'bullish' : 'bearish')}
                  <span className="text-xs text-gray-600 ml-1">
                    {currentPrice > indicators.sma20[indicators.sma20.length - 1] ? 'Above' : 'Below'}
                  </span>
                </div>
              </div>
            )}

            {indicators.sma50 && (
              <div className="p-3 bg-purple-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-purple-800">SMA 50</span>
                  <Badge variant="outline" className="text-purple-600 border-purple-200">
                    ₹{indicators.sma50[indicators.sma50.length - 1]?.toFixed(2) || 'N/A'}
                  </Badge>
                </div>
                <div className="mt-1">
                  {getSignalIcon(currentPrice > indicators.sma50[indicators.sma50.length - 1] ? 'bullish' : 'bearish')}
                  <span className="text-xs text-gray-600 ml-1">
                    {currentPrice > indicators.sma50[indicators.sma50.length - 1] ? 'Above' : 'Below'}
                  </span>
                </div>
              </div>
            )}

            {indicators.sma200 && (
              <div className="p-3 bg-indigo-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-indigo-800">SMA 200</span>
                  <Badge variant="outline" className="text-indigo-600 border-indigo-200">
                    ₹{indicators.sma200[indicators.sma200.length - 1]?.toFixed(2) || 'N/A'}
                  </Badge>
                </div>
                <div className="mt-1">
                  {getSignalIcon(currentPrice > indicators.sma200[indicators.sma200.length - 1] ? 'bullish' : 'bearish')}
                  <span className="text-xs text-gray-600 ml-1">
                    {currentPrice > indicators.sma200[indicators.sma200.length - 1] ? 'Above' : 'Below'}
                  </span>
                </div>
              </div>
            )}

            {indicators.ema12 && (
              <div className="p-3 bg-pink-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-pink-800">EMA 12</span>
                  <Badge variant="outline" className="text-pink-600 border-pink-200">
                    ₹{indicators.ema12[indicators.ema12.length - 1]?.toFixed(2) || 'N/A'}
                  </Badge>
                </div>
                <div className="mt-1">
                  {getSignalIcon(currentPrice > indicators.ema12[indicators.ema12.length - 1] ? 'bullish' : 'bearish')}
                  <span className="text-xs text-gray-600 ml-1">
                    {currentPrice > indicators.ema12[indicators.ema12.length - 1] ? 'Above' : 'Below'}
                  </span>
                </div>
              </div>
            )}

            {indicators.ema26 && (
              <div className="p-3 bg-orange-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-orange-800">EMA 26</span>
                  <Badge variant="outline" className="text-orange-600 border-orange-200">
                    ₹{indicators.ema26[indicators.ema26.length - 1]?.toFixed(2) || 'N/A'}
                  </Badge>
                </div>
                <div className="mt-1">
                  {getSignalIcon(currentPrice > indicators.ema26[indicators.ema26.length - 1] ? 'bullish' : 'bearish')}
                  <span className="text-xs text-gray-600 ml-1">
                    {currentPrice > indicators.ema26[indicators.ema26.length - 1] ? 'Above' : 'Below'}
                  </span>
                </div>
              </div>
            )}

            {indicators.ema50 && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-800">EMA 50</span>
                  <Badge variant="outline" className="text-blue-600 border-blue-200">
                    ₹{indicators.ema50[indicators.ema50.length - 1]?.toFixed(2) || 'N/A'}
                  </Badge>
                </div>
                <div className="mt-1">
                  {getSignalIcon(currentPrice > indicators.ema50[indicators.ema50.length - 1] ? 'bullish' : 'bearish')}
                  <span className="text-xs text-gray-600 ml-1">
                    {currentPrice > indicators.ema50[indicators.ema50.length - 1] ? 'Above' : 'Below'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Technical Indicators Section */}
      <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-t-lg">
          <CardTitle className="flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            Technical Indicators
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {/* RSI */}
            {indicators.rsi && (
              <div className="p-3 bg-purple-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-purple-800">RSI (14)</span>
                  <Badge variant="outline" className="text-purple-600 border-purple-200">
                    {indicators.rsi[indicators.rsi.length - 1]?.toFixed(2) || 'N/A'}
                  </Badge>
                </div>
                <div className="mt-1">
                  {(() => {
                    const rsi = indicators.rsi[indicators.rsi.length - 1];
                    const status = getRSIStatus(rsi);
                    return (
                      <Badge className={status.color}>
                        {status.status}
                      </Badge>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* MACD */}
            {indicators.macd && (
              <div className="p-3 bg-indigo-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-indigo-800">MACD</span>
                  <Badge variant="outline" className="text-indigo-600 border-indigo-200">
                    {indicators.macd.macd[indicators.macd.macd.length - 1]?.toFixed(4) || 'N/A'}
                  </Badge>
                </div>
                <div className="mt-1">
                  {(() => {
                    const macd = indicators.macd.macd[indicators.macd.macd.length - 1];
                    const signal = indicators.macd.signal[indicators.macd.signal.length - 1];
                    const macdSignal = getMACDSignal(macd, signal);
                    return (
                      <Badge className={macdSignal.color}>
                        {macdSignal.signal}
                      </Badge>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* Bollinger Bands */}
            {indicators.bollingerBands && (
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-green-800">Bollinger Bands</span>
                  <Badge variant="outline" className="text-green-600 border-green-200">
                    {(() => {
                      const upper = indicators.bollingerBands.upper[indicators.bollingerBands.upper.length - 1];
                      const lower = indicators.bollingerBands.lower[indicators.bollingerBands.lower.length - 1];
                      const position = getBollingerPosition(currentPrice, upper, lower);
                      return position.position;
                    })()}
                  </Badge>
                </div>
                <div className="mt-1 text-xs text-gray-600">
                  Upper: ₹{indicators.bollingerBands.upper[indicators.bollingerBands.upper.length - 1]?.toFixed(2) || 'N/A'}
                  <br />
                  Lower: ₹{indicators.bollingerBands.lower[indicators.bollingerBands.lower.length - 1]?.toFixed(2) || 'N/A'}
                </div>
              </div>
            )}

            {/* Stochastic */}
            {indicators.stochastic && (
              <div className="p-3 bg-teal-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-teal-800">Stochastic</span>
                  <Badge variant="outline" className="text-teal-600 border-teal-200">
                    K: {indicators.stochastic.k[indicators.stochastic.k.length - 1]?.toFixed(2) || 'N/A'}
                  </Badge>
                </div>
                <div className="mt-1 text-xs text-gray-600">
                  D: {indicators.stochastic.d[indicators.stochastic.d.length - 1]?.toFixed(2) || 'N/A'}
                </div>
              </div>
            )}

            {/* ATR */}
            {indicators.atr && (
              <div className="p-3 bg-red-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-red-800">ATR (14)</span>
                  <Badge variant="outline" className="text-red-600 border-red-200">
                    {indicators.atr[indicators.atr.length - 1]?.toFixed(2) || 'N/A'}
                  </Badge>
                </div>
                <div className="mt-1 text-xs text-gray-600">
                  Volatility Measure
                </div>
              </div>
            )}

            {/* OBV */}
            {indicators.obv && (
              <div className="p-3 bg-purple-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-purple-800">OBV</span>
                  <Badge variant="outline" className="text-purple-600 border-purple-200">
                    {indicators.obv[indicators.obv.length - 1]?.toLocaleString() || 'N/A'}
                  </Badge>
                </div>
                <div className="mt-1">
                  {getSignalIcon(
                    indicators.obv[indicators.obv.length - 1] > indicators.obv[indicators.obv.length - 2] ? 'bullish' : 'bearish'
                  )}
                  <span className="text-xs text-gray-600 ml-1">
                    {indicators.obv[indicators.obv.length - 1] > indicators.obv[indicators.obv.length - 2] ? 'Rising' : 'Falling'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Patterns Section */}
      <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-t-lg">
          <CardTitle className="flex items-center">
            <Target className="h-5 w-5 mr-2" />
            Pattern Recognition
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {/* Volume Anomalies */}
            {patterns?.volumeAnomalies && patterns.volumeAnomalies.length > 0 && (
              <div className="p-3 bg-orange-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-orange-800">Volume Anomalies</span>
                  <Badge variant="outline" className="text-orange-600 border-orange-200">
                    {patterns.volumeAnomalies.length}
                  </Badge>
                </div>
                <div className="mt-1 text-xs text-gray-600">
                  Unusual volume spikes detected
                </div>
              </div>
            )}

            {/* Double Tops */}
            {patterns?.doubleTops && patterns.doubleTops.length > 0 && (
              <div className="p-3 bg-red-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-red-800">Double Tops</span>
                  <Badge variant="outline" className="text-red-600 border-red-200">
                    {patterns.doubleTops.length}
                  </Badge>
                </div>
                <div className="mt-1 text-xs text-gray-600">
                  Bearish reversal pattern
                </div>
              </div>
            )}

            {/* Double Bottoms */}
            {patterns?.doubleBottoms && patterns.doubleBottoms.length > 0 && (
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-green-800">Double Bottoms</span>
                  <Badge variant="outline" className="text-green-600 border-green-200">
                    {patterns.doubleBottoms.length}
                  </Badge>
                </div>
                <div className="mt-1 text-xs text-gray-600">
                  Bullish reversal pattern
                </div>
              </div>
            )}

            {/* Support Levels */}
            {patterns?.supportResistance && patterns.supportResistance.length > 0 && (
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-green-800">Support Levels</span>
                  <Badge variant="outline" className="text-green-600 border-green-200">
                    {patterns.supportResistance.filter((s: { type: string }) => s.type === 'support').length}
                  </Badge>
                </div>
                <div className="mt-1 text-xs text-gray-600">
                  Key support zones identified
                </div>
              </div>
            )}

            {/* Resistance Levels */}
            {patterns?.supportResistance && patterns.supportResistance.length > 0 && (
              <div className="p-3 bg-red-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-red-800">Resistance Levels</span>
                  <Badge variant="outline" className="text-red-600 border-red-200">
                    {patterns.supportResistance.filter((s: { type: string }) => s.type === 'resistance').length}
                  </Badge>
                </div>
                <div className="mt-1 text-xs text-gray-600">
                  Key resistance zones identified
                </div>
              </div>
            )}

            {/* Triangles */}
            {patterns?.triangles && patterns.triangles.length > 0 && (
              <div className="p-3 bg-purple-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-purple-800">Triangle Patterns</span>
                  <Badge variant="outline" className="text-purple-600 border-purple-200">
                    {patterns.triangles.length}
                  </Badge>
                </div>
                <div className="mt-1 text-xs text-gray-600">
                  Consolidation patterns
                </div>
              </div>
            )}

            {/* Flags */}
            {patterns?.flags && patterns.flags.length > 0 && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-800">Flag Patterns</span>
                  <Badge variant="outline" className="text-blue-600 border-blue-200">
                    {patterns.flags.length}
                  </Badge>
                </div>
                <div className="mt-1 text-xs text-gray-600">
                  Continuation patterns
                </div>
              </div>
            )}

            {/* Divergences */}
            {patterns?.divergences && patterns.divergences.length > 0 && (
              <div className="p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-yellow-800">RSI Divergences</span>
                  <Badge variant="outline" className="text-yellow-600 border-yellow-200">
                    {patterns.divergences.length}
                  </Badge>
                </div>
                <div className="mt-1 text-xs text-gray-600">
                  Price/RSI divergences
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary Section */}
      <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-gray-500 to-slate-500 text-white rounded-t-lg">
          <CardTitle className="flex items-center">
            <Zap className="h-5 w-5 mr-2" />
            Technical Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Current Price */}
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-blue-800">{symbol}</span>
                <span className="text-2xl font-bold text-blue-900">
                  ₹{currentPrice.toFixed(2)}
                </span>
              </div>
              <div className="mt-2 text-sm text-blue-700">
                Current Market Price
              </div>
            </div>

            {/* Overall Signal */}
            <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-green-800">Overall Signal</span>
                {(() => {
                  // Simple signal calculation based on multiple indicators
                  let bullishCount = 0;
                  let bearishCount = 0;

                  // Check moving averages
                  if (indicators.sma20 && currentPrice > indicators.sma20[indicators.sma20.length - 1]) bullishCount++;
                  else bearishCount++;
                  
                  if (indicators.sma50 && currentPrice > indicators.sma50[indicators.sma50.length - 1]) bullishCount++;
                  else bearishCount++;

                  // Check RSI
                  if (indicators.rsi) {
                    const rsi = indicators.rsi[indicators.rsi.length - 1];
                    if (rsi < 30) bullishCount++;
                    else if (rsi > 70) bearishCount++;
                  }

                  // Check MACD
                  if (indicators.macd) {
                    const macd = indicators.macd.macd[indicators.macd.macd.length - 1];
                    const signal = indicators.macd.signal[indicators.macd.signal.length - 1];
                    if (macd > signal) bullishCount++;
                    else bearishCount++;
                  }

                  const signal = bullishCount > bearishCount ? 'Bullish' : bearishCount > bullishCount ? 'Bearish' : 'Neutral';
                  const color = bullishCount > bearishCount ? 'text-green-600' : bearishCount > bullishCount ? 'text-red-600' : 'text-gray-600';
                  
                  return (
                    <Badge className={`${color} bg-white border-2`}>
                      {signal}
                    </Badge>
                  );
                })()}
              </div>
              <div className="mt-2 text-sm text-green-700">
                Based on multiple indicators
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChartIndicatorsPanel; 