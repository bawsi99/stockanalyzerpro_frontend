import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus, Activity, BarChart3, Volume2, Move, ArrowUpDown, Gauge, Cloud, Layers } from "lucide-react";
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
    supertrend?: {
      line: number;
      direction: string;
      signal: string;
    };
    volatility?: {
      atr: number;
      atr_20_avg?: number | null;
      volatility_ratio: number;
      bb_squeeze: boolean;
      volatility_percentile: number;
      volatility_regime: string;
    };
    stochastic?: {
      stochastic_k: number | null;
      stochastic_d: number | null;
      stochastic_status: string;
    };
    ichimoku?: {
      tenkan_sen: number | null;
      kijun_sen: number | null;
      senkou_span_a: number | null;
      senkou_span_b: number | null;
      chikou_span: number | null;
      signal: string;
    };
    efficiency_ratio?: {
      value: number | null;
      signal: string;
      trend_quality: string;
    };
    keltner?: {
      upper: number | null;
      middle: number | null;
      lower: number | null;
      signal: string;
    };
    donchian?: {
      upper: number | null;
      middle: number | null;
      lower: number | null;
      signal: string;
    };
    dpo?: {
      value: number | null;
      signal: string;
      trend: string;
    };
    relative_strength?: {
      rs_vs_market: number | null;
      rs_vs_sector: number | null;
      trend_market: string;
      trend_sector: string;
    };
    williams_r?: {
      value: number | null;
      status: string;
    };
    stochrsi?: {
      stochrsi_k: number | null;
      stochrsi_d: number | null;
      status: string;
    };
    ad_line?: {
      value: number | null;
      trend: string;
      signal: string;
    };
  };
}

const TechnicalIndicatorsCards: React.FC<TechnicalIndicatorsCardsProps> = ({ indicators }) => {
  const getSignalColor = (signal: string) => {
    switch (signal.toLowerCase()) {
      case 'bullish':
      case 'up':
      case 'strong':
      case 'accumulation':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'bearish':
      case 'down':
      case 'distribution':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'overbought':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'oversold':
        return 'bg-blue-100 text-blue-800 border-blue-200';
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
      case 'accumulation':
        return <TrendingUp className="h-4 w-4" />;
      case 'bearish':
      case 'down':
      case 'distribution':
        return <TrendingDown className="h-4 w-4" />;
      case 'overbought':
        return <TrendingUp className="h-4 w-4" />;
      case 'oversold':
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
    <div className="grid grid-cols-2 gap-4">
      {/* ========== SECTION 1: TREND FOUNDATION ========== */}
      
      {/* Moving Averages Card - 1. Foundation of trend analysis */}
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

      {/* SuperTrend Card - 2. Trend direction */}
      {indicators.supertrend && indicators.supertrend.line !== undefined && indicators.supertrend.line !== null && (
        <Card className="border-l-4 border-l-cyan-500">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <ArrowUpDown className="h-4 w-4" />
              SuperTrend
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">SuperTrend Value:</span>
              <span className="font-semibold">{formatNumber(indicators.supertrend.line)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Direction:</span>
              <Badge className={getSignalColor(indicators.supertrend.direction || indicators.supertrend.signal || 'neutral')}>
                {getSignalIcon(indicators.supertrend.direction || indicators.supertrend.signal || 'neutral')}
                <span className="ml-1 capitalize">
                  {indicators.supertrend.direction === 'up' ? 'Bullish' : 
                   indicators.supertrend.direction === 'down' ? 'Bearish' : 
                   indicators.supertrend.signal || 'Neutral'}
                </span>
              </Badge>
            </div>
            {indicators.supertrend.signal && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Signal:</span>
                <Badge className={getSignalColor(indicators.supertrend.signal)}>
                  {getSignalIcon(indicators.supertrend.signal)}
                  <span className="ml-1 capitalize">{indicators.supertrend.signal}</span>
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ADX Card - 3. Trend strength */}
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

      {/* Ichimoku Cloud Card - 4. Comprehensive trend analysis */}
      {indicators.ichimoku && (
        <Card className="border-l-4 border-l-teal-500">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Cloud className="h-4 w-4" />
              Ichimoku Cloud
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {indicators.ichimoku.tenkan_sen !== null && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Tenkan-sen:</span>
                <span className="font-semibold">{formatNumber(indicators.ichimoku.tenkan_sen)}</span>
              </div>
            )}
            {indicators.ichimoku.kijun_sen !== null && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Kijun-sen:</span>
                <span className="font-semibold">{formatNumber(indicators.ichimoku.kijun_sen)}</span>
              </div>
            )}
            {indicators.ichimoku.senkou_span_a !== null && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Senkou Span A:</span>
                <span className="font-semibold">{formatNumber(indicators.ichimoku.senkou_span_a)}</span>
              </div>
            )}
            {indicators.ichimoku.senkou_span_b !== null && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Senkou Span B:</span>
                <span className="font-semibold">{formatNumber(indicators.ichimoku.senkou_span_b)}</span>
              </div>
            )}
            {indicators.ichimoku.chikou_span !== null && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Chikou Span:</span>
                <span className="font-semibold">{formatNumber(indicators.ichimoku.chikou_span)}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Signal:</span>
              <Badge className={getSignalColor(indicators.ichimoku.signal)}>
                {getSignalIcon(indicators.ichimoku.signal)}
                <span className="ml-1 capitalize">{indicators.ichimoku.signal}</span>
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ========== SECTION 2: MOMENTUM INDICATORS ========== */}
      
      {/* RSI Card - 5. Most important momentum indicator */}
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

      {/* MACD Card - 6. Momentum confirmation */}
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

      {/* Stochastic Oscillator Card - 7. Momentum oscillator */}
      {indicators.stochastic && (indicators.stochastic.stochastic_k !== null || indicators.stochastic.stochastic_d !== null) && (
        <Card className="border-l-4 border-l-pink-500">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <BarChart3 className="h-4 w-4" />
              Stochastic Oscillator
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {indicators.stochastic.stochastic_k !== null && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">%K:</span>
                <span className="font-semibold">{formatNumber(indicators.stochastic.stochastic_k)}</span>
              </div>
            )}
            {indicators.stochastic.stochastic_d !== null && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">%D:</span>
                <span className="font-semibold">{formatNumber(indicators.stochastic.stochastic_d)}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Status:</span>
              <Badge className={getSignalColor(indicators.stochastic.stochastic_status)}>
                {getSignalIcon(indicators.stochastic.stochastic_status)}
                <span className="ml-1 capitalize">{indicators.stochastic.stochastic_status}</span>
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* StochRSI Card - 8. Refined momentum */}
      {indicators.stochrsi && (indicators.stochrsi.stochrsi_k !== null || indicators.stochrsi.stochrsi_d !== null) && (
        <Card className="border-l-4 border-l-indigo-500">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Activity className="h-4 w-4" />
              StochRSI
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {indicators.stochrsi.stochrsi_k !== null && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">%K:</span>
                <span className="font-semibold">{formatNumber(indicators.stochrsi.stochrsi_k)}</span>
              </div>
            )}
            {indicators.stochrsi.stochrsi_d !== null && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">%D:</span>
                <span className="font-semibold">{formatNumber(indicators.stochrsi.stochrsi_d)}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Status:</span>
              <Badge className={getSignalColor(indicators.stochrsi.status)}>
                {getSignalIcon(indicators.stochrsi.status)}
                <span className="ml-1 capitalize">{indicators.stochrsi.status}</span>
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Williams %R Card - 9. Momentum oscillator */}
      {indicators.williams_r && indicators.williams_r.value !== null && (
        <Card className="border-l-4 border-l-fuchsia-500">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <BarChart3 className="h-4 w-4" />
              Williams %R
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">%R Value:</span>
              <span className="font-semibold">{formatNumber(indicators.williams_r.value)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Status:</span>
              <Badge className={getSignalColor(indicators.williams_r.status)}>
                {getSignalIcon(indicators.williams_r.status)}
                <span className="ml-1 capitalize">{indicators.williams_r.status}</span>
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ========== SECTION 3: VOLATILITY & PRICE POSITION ========== */}
      
      {/* Bollinger Bands Card - 10. Volatility and price position */}
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

      {/* Volatility (ATR) Card - 11. Volatility context */}
      {indicators.volatility && (
        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Gauge className="h-4 w-4" />
              Volatility (ATR)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">ATR Value:</span>
              <span className="font-semibold">{formatNumber(indicators.volatility.atr)}</span>
            </div>
            {indicators.volatility.atr_20_avg !== null && indicators.volatility.atr_20_avg !== undefined && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">ATR 20 Avg:</span>
                <span className="font-semibold">{formatNumber(indicators.volatility.atr_20_avg)}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Volatility Ratio:</span>
              <span className="font-semibold">{formatNumber(indicators.volatility.volatility_ratio, 3)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Volatility Regime:</span>
              <Badge variant="outline" className="capitalize">
                {indicators.volatility.volatility_regime}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">BB Squeeze:</span>
              <Badge className={indicators.volatility.bb_squeeze ? 'bg-yellow-100 text-yellow-800 border-yellow-200' : 'bg-gray-100 text-gray-800 border-gray-200'}>
                {indicators.volatility.bb_squeeze ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Volatility Percentile:</span>
              <span className="font-semibold">{formatNumber(indicators.volatility.volatility_percentile, 1)}%</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Keltner Channels Card - 12. Volatility bands */}
      {indicators.keltner && (indicators.keltner.upper !== null || indicators.keltner.middle !== null || indicators.keltner.lower !== null) && (
        <Card className="border-l-4 border-l-rose-500">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Layers className="h-4 w-4" />
              Keltner Channels
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {indicators.keltner.upper !== null && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Upper Band:</span>
                <span className="font-semibold">{formatNumber(indicators.keltner.upper)}</span>
              </div>
            )}
            {indicators.keltner.middle !== null && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Middle Band:</span>
                <span className="font-semibold">{formatNumber(indicators.keltner.middle)}</span>
              </div>
            )}
            {indicators.keltner.lower !== null && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Lower Band:</span>
                <span className="font-semibold">{formatNumber(indicators.keltner.lower)}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Signal:</span>
              <Badge className={getSignalColor(indicators.keltner.signal)}>
                {getSignalIcon(indicators.keltner.signal)}
                <span className="ml-1 capitalize">{indicators.keltner.signal.replace('_', ' ')}</span>
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Donchian Channels Card - 13. Breakout levels */}
      {indicators.donchian && (indicators.donchian.upper !== null || indicators.donchian.middle !== null || indicators.donchian.lower !== null) && (
        <Card className="border-l-4 border-l-violet-500">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Layers className="h-4 w-4" />
              Donchian Channels
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {indicators.donchian.upper !== null && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Upper Band:</span>
                <span className="font-semibold">{formatNumber(indicators.donchian.upper)}</span>
              </div>
            )}
            {indicators.donchian.middle !== null && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Middle Band:</span>
                <span className="font-semibold">{formatNumber(indicators.donchian.middle)}</span>
              </div>
            )}
            {indicators.donchian.lower !== null && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Lower Band:</span>
                <span className="font-semibold">{formatNumber(indicators.donchian.lower)}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Signal:</span>
              <Badge className={getSignalColor(indicators.donchian.signal)}>
                {getSignalIcon(indicators.donchian.signal)}
                <span className="ml-1 capitalize">{indicators.donchian.signal.replace('_', ' ')}</span>
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ========== SECTION 4: VOLUME CONFIRMATION ========== */}
      
      {/* Volume Analysis Card - 14. Volume confirmation */}
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

      {/* A/D Line Card - 15. Accumulation/Distribution */}
      {indicators.ad_line && indicators.ad_line.value !== null && (
        <Card className="border-l-4 border-l-lime-500">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <TrendingUp className="h-4 w-4" />
              A/D Line (Accumulation/Distribution)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">A/D Value:</span>
              <span className="font-semibold">{formatNumber(indicators.ad_line.value)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Trend:</span>
              <Badge className={getSignalColor(indicators.ad_line.trend)}>
                {getSignalIcon(indicators.ad_line.trend)}
                <span className="ml-1 capitalize">{indicators.ad_line.trend}</span>
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Signal:</span>
              <Badge className={getSignalColor(indicators.ad_line.signal)}>
                {getSignalIcon(indicators.ad_line.signal)}
                <span className="ml-1 capitalize">{indicators.ad_line.signal}</span>
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ========== SECTION 5: ADVANCED OSCILLATORS ========== */}
      
      {/* DPO Card - 16. Advanced oscillator */}
      {indicators.dpo && indicators.dpo.value !== null && (
        <Card className="border-l-4 border-l-slate-500">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Activity className="h-4 w-4" />
              DPO (Detrended Price Oscillator)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Value:</span>
              <span className="font-semibold">{formatNumber(indicators.dpo.value)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Signal:</span>
              <Badge className={getSignalColor(indicators.dpo.signal)}>
                {getSignalIcon(indicators.dpo.signal)}
                <span className="ml-1 capitalize">{indicators.dpo.signal.replace('_', ' ')}</span>
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Trend:</span>
              <Badge className={getSignalColor(indicators.dpo.trend)}>
                {getSignalIcon(indicators.dpo.trend)}
                <span className="ml-1 capitalize">{indicators.dpo.trend}</span>
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Efficiency Ratio Card - 17. Trend quality */}
      {indicators.efficiency_ratio && indicators.efficiency_ratio.value !== null && (
        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <TrendingUp className="h-4 w-4" />
              Efficiency Ratio
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Value:</span>
              <span className="font-semibold">{formatNumber(indicators.efficiency_ratio.value, 3)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Signal:</span>
              <Badge className={getSignalColor(indicators.efficiency_ratio.signal)}>
                {getSignalIcon(indicators.efficiency_ratio.signal)}
                <span className="ml-1 capitalize">{indicators.efficiency_ratio.signal}</span>
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Trend Quality:</span>
              <Badge variant="outline" className="text-xs">
                {indicators.efficiency_ratio.trend_quality}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Relative Strength Card - 18. Market/sector comparison */}
      {indicators.relative_strength && (
        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <ArrowUpDown className="h-4 w-4" />
              Relative Strength
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {indicators.relative_strength.rs_vs_market !== null && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">RS vs Market:</span>
                <span className="font-semibold">{formatNumber(indicators.relative_strength.rs_vs_market, 2)}</span>
              </div>
            )}
            {indicators.relative_strength.rs_vs_sector !== null && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">RS vs Sector:</span>
                <span className="font-semibold">{formatNumber(indicators.relative_strength.rs_vs_sector, 2)}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Trend (Market):</span>
              <Badge className={getSignalColor(indicators.relative_strength.trend_market)}>
                {getSignalIcon(indicators.relative_strength.trend_market)}
                <span className="ml-1 capitalize">{indicators.relative_strength.trend_market}</span>
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Trend (Sector):</span>
              <Badge className={getSignalColor(indicators.relative_strength.trend_sector)}>
                {getSignalIcon(indicators.relative_strength.trend_sector)}
                <span className="ml-1 capitalize">{indicators.relative_strength.trend_sector}</span>
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  );
};

export default TechnicalIndicatorsCards;


