import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus, Activity, BarChart3, Volume2, Move } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TechnicalIndicatorsCardsProps {
  indicators: {
    adx?: {
      adx: number;
      plus_di: number;
      minus_di: number;
      trend_direction: string;
    };
    rsi?: {
      trend: string;
      rsi_14: number;
      status: string;
    };
    macd?: {
      histogram: number;
      macd_line: number;
      signal_line: number;
    };
    volume?: {
      obv: number;
      obv_trend: string;
      volume_ratio: number;
    };
    bollinger_bands?: {
      bandwidth: number;
      percent_b: number;
      lower_band: number;
      upper_band: number;
      middle_band: number;
    };
    moving_averages?: {
      ema_20: number;
      ema_50: number;
      sma_20: number;
      sma_50: number;
      sma_200: number;
      death_cross: boolean;
      golden_cross: boolean;
      price_to_sma_200: number;
      sma_20_to_sma_50: number;
    };
    trend_data?: {
      adx: number;
      plus_di: number;
      minus_di: number;
      strength: string;
      direction: string;
    };
  };
}

const TechnicalIndicatorsCards: React.FC<TechnicalIndicatorsCardsProps> = ({ indicators }) => {
  const getSignalColor = (signal: string) => {
    switch (signal.toLowerCase()) {
      case 'bullish':
      case 'up':
      case 'strong':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'bearish':
      case 'down':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'neutral':
      case 'sideways':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getSignalIcon = (signal: string) => {
    switch (signal.toLowerCase()) {
      case 'bullish':
      case 'up':
        return <TrendingUp className="h-4 w-4" />;
      case 'bearish':
      case 'down':
        return <TrendingDown className="h-4 w-4" />;
      default:
        return <Minus className="h-4 w-4" />;
    }
  };

  const formatNumber = (num: number | null | undefined, decimals: number = 2) => {
    if (num === null || num === undefined || isNaN(num)) {
      return 'N/A';
    }
    return Number(num.toFixed(decimals)).toLocaleString();
  };

  return (
    <div className="grid grid-cols-1 gap-4">
      {/* ADX Card */}
      {indicators.adx && (
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Activity className="h-4 w-4" />
              ADX (Average Directional Index)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">ADX Value:</span>
              <span className="font-semibold">{formatNumber(indicators.adx.adx)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">+DI:</span>
              <span className="font-semibold">{formatNumber(indicators.adx.plus_di)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">-DI:</span>
              <span className="font-semibold">{formatNumber(indicators.adx.minus_di)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Direction:</span>
              <Badge className={getSignalColor(indicators.adx.trend_direction)}>
                {getSignalIcon(indicators.adx.trend_direction)}
                <span className="ml-1 capitalize">{indicators.adx.trend_direction}</span>
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* RSI Card */}
      {indicators.rsi && (
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <BarChart3 className="h-4 w-4" />
              RSI (Relative Strength Index)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">RSI Value:</span>
              <span className="font-semibold">{formatNumber(indicators.rsi.rsi_14)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Trend:</span>
              <Badge className={getSignalColor(indicators.rsi.trend)}>
                {getSignalIcon(indicators.rsi.trend)}
                <span className="ml-1 capitalize">{indicators.rsi.trend}</span>
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Status:</span>
              <Badge variant="outline" className="capitalize">
                {indicators.rsi.status.replace('_', ' ')}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* MACD Card */}
      {indicators.macd && (
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Move className="h-4 w-4" />
              MACD
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">MACD Line:</span>
              <span className="font-semibold">{formatNumber(indicators.macd.macd_line)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Signal Line:</span>
              <span className="font-semibold">{formatNumber(indicators.macd.signal_line)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Histogram:</span>
              <span className={`font-semibold ${indicators.macd.histogram > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatNumber(indicators.macd.histogram)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Signal:</span>
              <Badge className={getSignalColor(indicators.macd.histogram > 0 ? 'bullish' : 'bearish')}>
                {getSignalIcon(indicators.macd.histogram > 0 ? 'bullish' : 'bearish')}
                <span className="ml-1">{indicators.macd.histogram > 0 ? 'Bullish' : 'Bearish'}</span>
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Volume Card */}
      {indicators.volume && (
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Volume2 className="h-4 w-4" />
              Volume Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">OBV:</span>
              <span className="font-semibold">{formatNumber(indicators.volume.obv)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Volume Ratio:</span>
              <span className="font-semibold">{formatNumber(indicators.volume.volume_ratio, 3)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">OBV Trend:</span>
              <Badge className={getSignalColor(indicators.volume.obv_trend)}>
                {getSignalIcon(indicators.volume.obv_trend)}
                <span className="ml-1 capitalize">{indicators.volume.obv_trend}</span>
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bollinger Bands Card */}
      {indicators.bollinger_bands && (
        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <BarChart3 className="h-4 w-4" />
              Bollinger Bands
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Upper Band:</span>
              <span className="font-semibold">{formatNumber(indicators.bollinger_bands.upper_band)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Middle Band:</span>
              <span className="font-semibold">{formatNumber(indicators.bollinger_bands.middle_band)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Lower Band:</span>
              <span className="font-semibold">{formatNumber(indicators.bollinger_bands.lower_band)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">%B:</span>
              <span className="font-semibold">{formatNumber(indicators.bollinger_bands.percent_b, 3)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Bandwidth:</span>
              <span className="font-semibold">{formatNumber(indicators.bollinger_bands.bandwidth, 3)}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Moving Averages Card */}
      {indicators.moving_averages && (
        <Card className="border-l-4 border-l-indigo-500">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <TrendingUp className="h-4 w-4" />
              Moving Averages
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">SMA 20:</span>
              <span className="font-semibold">{formatNumber(indicators.moving_averages.sma_20)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">SMA 50:</span>
              <span className="font-semibold">{formatNumber(indicators.moving_averages.sma_50)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">SMA 200:</span>
              <span className="font-semibold">{formatNumber(indicators.moving_averages.sma_200)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">EMA 20:</span>
              <span className="font-semibold">{formatNumber(indicators.moving_averages.ema_20)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">EMA 50:</span>
              <span className="font-semibold">{formatNumber(indicators.moving_averages.ema_50)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Price/SMA200:</span>
              <span className={`font-semibold ${indicators.moving_averages.price_to_sma_200 > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatNumber(indicators.moving_averages.price_to_sma_200 * 100, 2)}%
              </span>
            </div>
            {(indicators.moving_averages.golden_cross || indicators.moving_averages.death_cross) && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Signal:</span>
                <Badge className={indicators.moving_averages.golden_cross ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'}>
                  {indicators.moving_averages.golden_cross ? 'Golden Cross' : 'Death Cross'}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      )}


    </div>
  );
};

export default TechnicalIndicatorsCards;
