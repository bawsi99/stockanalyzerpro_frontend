import { ChartData } from '@/types/analysis';

// ===== TYPES & INTERFACES =====

export interface IndicatorState {
  sma: { [period: number]: number[] };
  ema: { [period: number]: number[] };
  rsi: number[];
  macd: { line: number[]; signal: number[]; histogram: number[] };
  bollingerBands: { upper: number[]; middle: number[]; lower: number[] };
  stochastic: { k: number[]; d: number[] };
  atr: number[];
  obv: number[];
  volume: { sma: number[] };
}

export interface IndicatorConfig {
  rsiPeriod: number;
  macdFast: number;
  macdSlow: number;
  macdSignal: number;
  bollingerPeriod: number;
  bollingerStdDev: number;
  stochasticK: number;
  stochasticD: number;
  atrPeriod: number;
  volumeSmaPeriod: number;
}

// ===== DEFAULT CONFIGURATION =====

const DEFAULT_CONFIG: IndicatorConfig = {
  rsiPeriod: 14,
  macdFast: 12,
  macdSlow: 26,
  macdSignal: 9,
  bollingerPeriod: 20,
  bollingerStdDev: 2,
  stochasticK: 14,
  stochasticD: 3,
  atrPeriod: 14,
  volumeSmaPeriod: 20
};

// ===== UTILITY FUNCTIONS =====

function calculateSMA(prices: number[], period: number): number[] {
  const sma: number[] = [];
  for (let i = 0; i < prices.length; i++) {
    if (i < period - 1) {
      sma.push(NaN);
    } else {
      const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      sma.push(sum / period);
    }
  }
  return sma;
}

function calculateEMA(prices: number[], period: number): number[] {
  const ema: number[] = [];
  const multiplier = 2 / (period + 1);
  
  for (let i = 0; i < prices.length; i++) {
    if (i === 0) {
      ema.push(prices[0]);
    } else {
      const newEMA = (prices[i] * multiplier) + (ema[i - 1] * (1 - multiplier));
      ema.push(newEMA);
    }
  }
  return ema;
}

function calculateRSI(prices: number[], period: number = 14): number[] {
  const rsi: number[] = [];
  const gains: number[] = [];
  const losses: number[] = [];
  
  // Calculate price changes
  for (let i = 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? -change : 0);
  }
  
  // Calculate RSI
  for (let i = 0; i < prices.length; i++) {
    if (i < period) {
      rsi.push(NaN);
    } else {
      const avgGain = gains.slice(i - period, i).reduce((a, b) => a + b, 0) / period;
      const avgLoss = losses.slice(i - period, i).reduce((a, b) => a + b, 0) / period;
      
      if (avgLoss === 0) {
        rsi.push(100);
      } else {
        const rs = avgGain / avgLoss;
        rsi.push(100 - (100 / (1 + rs)));
      }
    }
  }
  
  return rsi;
}

function calculateMACD(prices: number[], fastPeriod: number = 12, slowPeriod: number = 26, signalPeriod: number = 9): {
  line: number[];
  signal: number[];
  histogram: number[];
} {
  const emaFast = calculateEMA(prices, fastPeriod);
  const emaSlow = calculateEMA(prices, slowPeriod);
  
  const macdLine = emaFast.map((fast, i) => fast - emaSlow[i]);
  const signalLine = calculateEMA(macdLine, signalPeriod);
  const histogram = macdLine.map((line, i) => line - signalLine[i]);
  
  return { line: macdLine, signal: signalLine, histogram };
}

function calculateBollingerBands(prices: number[], period: number = 20, stdDev: number = 2): {
  upper: number[];
  middle: number[];
  lower: number[];
} {
  const sma = calculateSMA(prices, period);
  const upper: number[] = [];
  const middle = sma;
  const lower: number[] = [];
  
  for (let i = 0; i < prices.length; i++) {
    if (i < period - 1) {
      upper.push(NaN);
      lower.push(NaN);
    } else {
      const slice = prices.slice(i - period + 1, i + 1);
      const mean = sma[i];
      const variance = slice.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / period;
      const standardDeviation = Math.sqrt(variance);
      
      upper.push(mean + (stdDev * standardDeviation));
      lower.push(mean - (stdDev * standardDeviation));
    }
  }
  
  return { upper, middle, lower };
}

function calculateStochastic(highs: number[], lows: number[], closes: number[], kPeriod: number = 14, dPeriod: number = 3): {
  k: number[];
  d: number[];
} {
  const k: number[] = [];
  
  for (let i = 0; i < closes.length; i++) {
    if (i < kPeriod - 1) {
      k.push(NaN);
    } else {
      const slice = {
        high: highs.slice(i - kPeriod + 1, i + 1),
        low: lows.slice(i - kPeriod + 1, i + 1),
        close: closes.slice(i - kPeriod + 1, i + 1)
      };
      
      const highestHigh = Math.max(...slice.high);
      const lowestLow = Math.min(...slice.low);
      const currentClose = slice.close[slice.close.length - 1];
      
      k.push(((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100);
    }
  }
  
  const d = calculateSMA(k, dPeriod);
  
  return { k, d };
}

function calculateATR(highs: number[], lows: number[], closes: number[], period: number = 14): number[] {
  const tr: number[] = [];
  
  for (let i = 0; i < highs.length; i++) {
    if (i === 0) {
      tr.push(highs[i] - lows[i]);
    } else {
      const highLow = highs[i] - lows[i];
      const highClose = Math.abs(highs[i] - closes[i - 1]);
      const lowClose = Math.abs(lows[i] - closes[i - 1]);
      tr.push(Math.max(highLow, highClose, lowClose));
    }
  }
  
  return calculateEMA(tr, period);
}

function calculateOBV(closes: number[], volumes: number[]): number[] {
  const obv: number[] = [];
  
  for (let i = 0; i < closes.length; i++) {
    if (i === 0) {
      obv.push(volumes[i]);
    } else {
      if (closes[i] > closes[i - 1]) {
        obv.push(obv[i - 1] + volumes[i]);
      } else if (closes[i] < closes[i - 1]) {
        obv.push(obv[i - 1] - volumes[i]);
      } else {
        obv.push(obv[i - 1]);
      }
    }
  }
  
  return obv;
}

// ===== LIVE INDICATOR CALCULATOR =====

export class LiveIndicatorCalculator {
  private indicatorState: Map<string, IndicatorState> = new Map();
  private config: IndicatorConfig;

  constructor(config: Partial<IndicatorConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // ===== INITIALIZATION =====

  initializeIndicators(token: string, historicalData: ChartData[]): void {
    if (historicalData.length === 0) return;

    const prices = historicalData.map(d => d.close);
    const highs = historicalData.map(d => d.high);
    const lows = historicalData.map(d => d.low);
    const volumes = historicalData.map(d => d.volume);

    const state: IndicatorState = {
      sma: {},
      ema: {},
      rsi: [],
      macd: { line: [], signal: [], histogram: [] },
      bollingerBands: { upper: [], middle: [], lower: [] },
      stochastic: { k: [], d: [] },
      atr: [],
      obv: [],
      volume: { sma: [] }
    };

    // Calculate all indicators
    state.sma[20] = calculateSMA(prices, 20);
    state.sma[50] = calculateSMA(prices, 50);
    state.sma[200] = calculateSMA(prices, 200);
    
    state.ema[12] = calculateEMA(prices, 12);
    state.ema[26] = calculateEMA(prices, 26);
    state.ema[50] = calculateEMA(prices, 50);
    
    state.rsi = calculateRSI(prices, this.config.rsiPeriod);
    
    const macd = calculateMACD(prices, this.config.macdFast, this.config.macdSlow, this.config.macdSignal);
    state.macd = macd;
    
    const bollinger = calculateBollingerBands(prices, this.config.bollingerPeriod, this.config.bollingerStdDev);
    state.bollingerBands = bollinger;
    
    const stochastic = calculateStochastic(highs, lows, prices, this.config.stochasticK, this.config.stochasticD);
    state.stochastic = stochastic;
    
    state.atr = calculateATR(highs, lows, prices, this.config.atrPeriod);
    state.obv = calculateOBV(prices, volumes);
    state.volume.sma = calculateSMA(volumes, this.config.volumeSmaPeriod);

    this.indicatorState.set(token, state);
  }

  // ===== INCREMENTAL UPDATES =====

  updateIndicators(token: string, newCandle: ChartData): void {
    const state = this.indicatorState.get(token);
    if (!state) {
      // console.warn('LiveIndicatorCalculator: No state found for token', token);
      return;
    }

    // Add new candle data to existing arrays
    const prices = [...state.sma[20].map((_, i) => i < state.sma[20].length ? state.sma[20][i] : NaN), newCandle.close];
    const highs = [...state.bollingerBands.upper.map((_, i) => i < state.bollingerBands.upper.length ? state.bollingerBands.upper[i] : NaN), newCandle.high];
    const lows = [...state.bollingerBands.lower.map((_, i) => i < state.bollingerBands.lower.length ? state.bollingerBands.lower[i] : NaN), newCandle.low];
    const volumes = [...state.volume.sma.map((_, i) => i < state.volume.sma.length ? state.volume.sma[i] : NaN), newCandle.volume];

    // Update all indicators
    this.updateSMA(state, prices);
    this.updateEMA(state, prices);
    this.updateRSI(state, prices);
    this.updateMACD(state, prices);
    this.updateBollingerBands(state, prices);
    this.updateStochastic(state, highs, lows, prices);
    this.updateATR(state, highs, lows, prices);
    this.updateOBV(state, prices, volumes);
    this.updateVolumeSMA(state, volumes);
  }

  private updateSMA(state: IndicatorState, prices: number[]): void {
    state.sma[20] = calculateSMA(prices, 20);
    state.sma[50] = calculateSMA(prices, 50);
    state.sma[200] = calculateSMA(prices, 200);
  }

  private updateEMA(state: IndicatorState, prices: number[]): void {
    state.ema[12] = calculateEMA(prices, 12);
    state.ema[26] = calculateEMA(prices, 26);
    state.ema[50] = calculateEMA(prices, 50);
  }

  private updateRSI(state: IndicatorState, prices: number[]): void {
    state.rsi = calculateRSI(prices, this.config.rsiPeriod);
  }

  private updateMACD(state: IndicatorState, prices: number[]): void {
    const macd = calculateMACD(prices, this.config.macdFast, this.config.macdSlow, this.config.macdSignal);
    state.macd = macd;
  }

  private updateBollingerBands(state: IndicatorState, prices: number[]): void {
    const bollinger = calculateBollingerBands(prices, this.config.bollingerPeriod, this.config.bollingerStdDev);
    state.bollingerBands = bollinger;
  }

  private updateStochastic(state: IndicatorState, highs: number[], lows: number[], prices: number[]): void {
    const stochastic = calculateStochastic(highs, lows, prices, this.config.stochasticK, this.config.stochasticD);
    state.stochastic = stochastic;
  }

  private updateATR(state: IndicatorState, highs: number[], lows: number[], prices: number[]): void {
    state.atr = calculateATR(highs, lows, prices, this.config.atrPeriod);
  }

  private updateOBV(state: IndicatorState, prices: number[], volumes: number[]): void {
    state.obv = calculateOBV(prices, volumes);
  }

  private updateVolumeSMA(state: IndicatorState, volumes: number[]): void {
    state.volume.sma = calculateSMA(volumes, this.config.volumeSmaPeriod);
  }

  // ===== DATA RETRIEVAL =====

  getCurrentIndicators(token: string): IndicatorState | null {
    return this.indicatorState.get(token) || null;
  }

  getLatestValues(token: string): {
    sma20: number;
    sma50: number;
    sma200: number;
    ema12: number;
    ema26: number;
    ema50: number;
    rsi: number;
    macd: { line: number; signal: number; histogram: number };
    bollingerBands: { upper: number; middle: number; lower: number };
    stochastic: { k: number; d: number };
    atr: number;
    obv: number;
    volumeSma: number;
  } | null {
    const state = this.indicatorState.get(token);
    if (!state) return null;

    const lastIndex = state.sma[20].length - 1;
    if (lastIndex < 0) return null;

    return {
      sma20: state.sma[20][lastIndex],
      sma50: state.sma[50][lastIndex],
      sma200: state.sma[200][lastIndex],
      ema12: state.ema[12][lastIndex],
      ema26: state.ema[26][lastIndex],
      ema50: state.ema[50][lastIndex],
      rsi: state.rsi[lastIndex],
      macd: {
        line: state.macd.line[lastIndex],
        signal: state.macd.signal[lastIndex],
        histogram: state.macd.histogram[lastIndex]
      },
      bollingerBands: {
        upper: state.bollingerBands.upper[lastIndex],
        middle: state.bollingerBands.middle[lastIndex],
        lower: state.bollingerBands.lower[lastIndex]
      },
      stochastic: {
        k: state.stochastic.k[lastIndex],
        d: state.stochastic.d[lastIndex]
      },
      atr: state.atr[lastIndex],
      obv: state.obv[lastIndex],
      volumeSma: state.volume.sma[lastIndex]
    };
  }

  // ===== STATE MANAGEMENT =====

  resetIndicators(token: string): void {
    this.indicatorState.delete(token);
  }

  hasIndicators(token: string): boolean {
    return this.indicatorState.has(token);
  }

  // ===== PERFORMANCE OPTIMIZATION =====

  trimData(token: string, maxLength: number = 1000): void {
    const state = this.indicatorState.get(token);
    if (!state) return;

    // Trim all indicator arrays to maxLength
    Object.keys(state.sma).forEach(period => {
      const periodNum = parseInt(period);
      if (state.sma[periodNum].length > maxLength) {
        state.sma[periodNum] = state.sma[periodNum].slice(-maxLength);
      }
    });

    Object.keys(state.ema).forEach(period => {
      const periodNum = parseInt(period);
      if (state.ema[periodNum].length > maxLength) {
        state.ema[periodNum] = state.ema[periodNum].slice(-maxLength);
      }
    });

    if (state.rsi.length > maxLength) {
      state.rsi = state.rsi.slice(-maxLength);
    }

    if (state.macd.line.length > maxLength) {
      state.macd.line = state.macd.line.slice(-maxLength);
      state.macd.signal = state.macd.signal.slice(-maxLength);
      state.macd.histogram = state.macd.histogram.slice(-maxLength);
    }

    if (state.bollingerBands.upper.length > maxLength) {
      state.bollingerBands.upper = state.bollingerBands.upper.slice(-maxLength);
      state.bollingerBands.middle = state.bollingerBands.middle.slice(-maxLength);
      state.bollingerBands.lower = state.bollingerBands.lower.slice(-maxLength);
    }

    if (state.stochastic.k.length > maxLength) {
      state.stochastic.k = state.stochastic.k.slice(-maxLength);
      state.stochastic.d = state.stochastic.d.slice(-maxLength);
    }

    if (state.atr.length > maxLength) {
      state.atr = state.atr.slice(-maxLength);
    }

    if (state.obv.length > maxLength) {
      state.obv = state.obv.slice(-maxLength);
    }

    if (state.volume.sma.length > maxLength) {
      state.volume.sma = state.volume.sma.slice(-maxLength);
    }
  }
}

// ===== SINGLETON INSTANCE =====

export const liveIndicatorCalculator = new LiveIndicatorCalculator();

// ===== REACT HOOK =====

import { useEffect, useState, useCallback, useRef } from 'react';

export function useLiveIndicators(token: string, data: ChartData[]) {
  const [indicators, setIndicators] = useState<IndicatorState | null>(null);
  const [latestValues, setLatestValues] = useState<{
    sma20: number;
    sma50: number;
    sma200: number;
    ema12: number;
    ema26: number;
    ema50: number;
    rsi: number;
    macd: { line: number; signal: number; histogram: number };
    bollingerBands: { upper: number; middle: number; lower: number };
    stochastic: { k: number; d: number };
    atr: number;
    obv: number;
    volumeSma: number;
  } | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const calculateIndicators = useCallback(() => {
    if (data.length === 0) return;

    setIsCalculating(true);
    
    try {
      // Initialize indicators if not exists
      if (!liveIndicatorCalculator.hasIndicators(token)) {
        liveIndicatorCalculator.initializeIndicators(token, data);
      } else {
        // Update with latest candle
        const latestCandle = data[data.length - 1];
        liveIndicatorCalculator.updateIndicators(token, latestCandle);
      }

      // Get current state
      const currentIndicators = liveIndicatorCalculator.getCurrentIndicators(token);
      const currentValues = liveIndicatorCalculator.getLatestValues(token);

      setIndicators(currentIndicators);
      setLatestValues(currentValues);

      // Trim data periodically for performance
      if (data.length > 1000) {
        liveIndicatorCalculator.trimData(token, 1000);
      }

    } catch (error) {
      // console.error('Error calculating live indicators:', error);
    } finally {
      setIsCalculating(false);
    }
  }, [token, data]);

  useEffect(() => {
    calculateIndicators();
  }, [calculateIndicators]);

  return {
    indicators,
    latestValues,
    isCalculating,
    recalculate: calculateIndicators
  };
} 