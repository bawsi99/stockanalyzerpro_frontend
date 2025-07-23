import { ChartData } from '@/types/analysis';

// ===== TYPES & INTERFACES =====

export interface PatternState {
  triangles: TrianglePattern[];
  flags: FlagPattern[];
  supportResistance: SupportResistanceLevel[];
  divergences: DivergencePattern[];
  volumeAnomalies: VolumeAnomaly[];
  doubleTops: DoubleTopPattern[];
  doubleBottoms: DoubleBottomPattern[];
  headAndShoulders: HeadAndShouldersPattern[];
  candlestickPatterns: CandlestickPattern[];
}

export interface TrianglePattern {
  type: 'ascending' | 'descending' | 'symmetrical';
  startIndex: number;
  endIndex: number;
  startDate: string;
  endDate: string;
  confidence: number;
  breakoutDirection?: 'up' | 'down' | 'none';
}

export interface FlagPattern {
  type: 'bullish' | 'bearish';
  startIndex: number;
  endIndex: number;
  startDate: string;
  endDate: string;
  confidence: number;
  poleHeight: number;
  flagHeight: number;
}

export interface SupportResistanceLevel {
  level: number;
  type: 'support' | 'resistance';
  strength: number;
  touches: number;
  lastTouchIndex: number;
  lastTouchDate: string;
}

export interface DivergencePattern {
  type: 'bullish' | 'bearish';
  startIndex: number;
  endIndex: number;
  startDate: string;
  endDate: string;
  priceStart: number;
  priceEnd: number;
  indicatorStart: number;
  indicatorEnd: number;
  confidence: number;
}

export interface VolumeAnomaly {
  index: number;
  date: string;
  volume: number;
  price: number;
  ratio: number;
  type: 'spike' | 'dip';
}

export interface DoubleTopPattern {
  peak1Index: number;
  peak2Index: number;
  peak1Date: string;
  peak2Date: string;
  peak1Price: number;
  peak2Price: number;
  neckline: number;
  confidence: number;
}

export interface DoubleBottomPattern {
  bottom1Index: number;
  bottom2Index: number;
  bottom1Date: string;
  bottom2Date: string;
  bottom1Price: number;
  bottom2Price: number;
  neckline: number;
  confidence: number;
}

export interface HeadAndShouldersPattern {
  leftShoulderIndex: number;
  headIndex: number;
  rightShoulderIndex: number;
  leftShoulderDate: string;
  headDate: string;
  rightShoulderDate: string;
  neckline: number;
  confidence: number;
}

export interface CandlestickPattern {
  type: string;
  index: number;
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  confidence: number;
}

// ===== PATTERN DETECTION FUNCTIONS =====

function identifyPeaksLows(prices: number[], order: number = 5): { peaks: number[]; lows: number[] } {
  const peaks: number[] = [];
  const lows: number[] = [];
  
  for (let i = order; i < prices.length - order; i++) {
    let isPeak = true;
    let isLow = true;
    
    for (let j = i - order; j <= i + order; j++) {
      if (j !== i) {
        if (prices[j] >= prices[i]) isPeak = false;
        if (prices[j] <= prices[i]) isLow = false;
      }
    }
    
    if (isPeak) peaks.push(i);
    if (isLow) lows.push(i);
  }
  
  return { peaks, lows };
}

function detectTrianglePatterns(prices: number[], minPoints: number = 5): TrianglePattern[] {
  const patterns: TrianglePattern[] = [];
  
  for (let start = 0; start < prices.length - minPoints; start++) {
    const end = start + minPoints;
    const segment = prices.slice(start, end);
    
    const { peaks, lows } = identifyPeaksLows(segment, Math.max(minPoints / 12, 4));
    
    if (peaks.length < 2 || lows.length < 2) continue;
    
    // Calculate slopes
    const peakSlope = calculateSlope(peaks, segment);
    const lowSlope = calculateSlope(lows, segment);
    
    // Determine pattern type
    let type: 'ascending' | 'descending' | 'symmetrical' = 'symmetrical';
    let confidence = 0;
    
    if (peakSlope < -0.1 && lowSlope > 0.1) {
      type = 'symmetrical';
      confidence = Math.min(Math.abs(peakSlope), Math.abs(lowSlope)) * 10;
    } else if (peakSlope < -0.1 && Math.abs(lowSlope) < 0.05) {
      type = 'descending';
      confidence = Math.abs(peakSlope) * 10;
    } else if (Math.abs(peakSlope) < 0.05 && lowSlope > 0.1) {
      type = 'ascending';
      confidence = Math.abs(lowSlope) * 10;
    }
    
    if (confidence > 0.5) {
      patterns.push({
        type,
        startIndex: start,
        endIndex: end,
        startDate: new Date().toISOString(), // Will be updated with actual date
        endDate: new Date().toISOString(), // Will be updated with actual date
        confidence: Math.min(confidence, 1)
      });
    }
  }
  
  return patterns;
}

function detectFlagPatterns(prices: number[], impulse: number = 15, channel: number = 20): FlagPattern[] {
  const patterns: FlagPattern[] = [];
  
  for (let i = impulse; i < prices.length - channel; i++) {
    const poleReturn = (prices[i] - prices[i - impulse]) / prices[i - impulse];
    
    if (Math.abs(poleReturn) > 0.08) {
      const seg = prices.slice(i, i + channel);
      const maxPullback = Math.abs(poleReturn) * 0.35;
      const retr = poleReturn > 0 
        ? (Math.min(...seg) - prices[i]) / prices[i]
        : (Math.max(...seg) - prices[i]) / prices[i];
      
      if (Math.abs(retr) <= maxPullback && calculateVolatility(seg) < 0.02) {
        patterns.push({
          type: poleReturn > 0 ? 'bullish' : 'bearish',
          startIndex: i - impulse,
          endIndex: i + channel,
          startDate: new Date().toISOString(),
          endDate: new Date().toISOString(),
          confidence: Math.abs(poleReturn) * 5,
          poleHeight: Math.abs(poleReturn),
          flagHeight: Math.abs(retr)
        });
      }
    }
  }
  
  return patterns;
}

function detectSupportResistance(prices: number[], window: number = 20): SupportResistanceLevel[] {
  const levels: SupportResistanceLevel[] = [];
  const { peaks, lows } = identifyPeaksLows(prices);
  
  // Group nearby peaks and lows
  const peakGroups = groupNearbyPoints(peaks, prices, 0.02);
  const lowGroups = groupNearbyPoints(lows, prices, 0.02);
  
  // Create resistance levels from peaks
  peakGroups.forEach(group => {
    const avgPrice = group.reduce((sum, idx) => sum + prices[idx], 0) / group.length;
    levels.push({
      level: avgPrice,
      type: 'resistance',
      strength: group.length,
      touches: group.length,
      lastTouchIndex: Math.max(...group),
      lastTouchDate: new Date().toISOString()
    });
  });
  
  // Create support levels from lows
  lowGroups.forEach(group => {
    const avgPrice = group.reduce((sum, idx) => sum + prices[idx], 0) / group.length;
    levels.push({
      level: avgPrice,
      type: 'support',
      strength: group.length,
      touches: group.length,
      lastTouchIndex: Math.max(...group),
      lastTouchDate: new Date().toISOString()
    });
  });
  
  return levels;
}

function detectDivergences(prices: number[], indicator: number[], order: number = 5): DivergencePattern[] {
  const patterns: DivergencePattern[] = [];
  const { peaks, lows } = identifyPeaksLows(prices, order);
  
  // Bullish divergence: price makes lower lows, indicator makes higher lows
  for (let i = 1; i < lows.length; i++) {
    const l1 = lows[i - 1];
    const l2 = lows[i];
    
    if (prices[l2] < prices[l1] && indicator[l2] > indicator[l1]) {
      patterns.push({
        type: 'bullish',
        startIndex: l1,
        endIndex: l2,
        startDate: new Date().toISOString(),
        endDate: new Date().toISOString(),
        priceStart: prices[l1],
        priceEnd: prices[l2],
        indicatorStart: indicator[l1],
        indicatorEnd: indicator[l2],
        confidence: 0.7
      });
    }
  }
  
  // Bearish divergence: price makes higher highs, indicator makes lower highs
  for (let i = 1; i < peaks.length; i++) {
    const p1 = peaks[i - 1];
    const p2 = peaks[i];
    
    if (prices[p2] > prices[p1] && indicator[p2] < indicator[p1]) {
      patterns.push({
        type: 'bearish',
        startIndex: p1,
        endIndex: p2,
        startDate: new Date().toISOString(),
        endDate: new Date().toISOString(),
        priceStart: prices[p1],
        priceEnd: prices[p2],
        indicatorStart: indicator[p1],
        indicatorEnd: indicator[p2],
        confidence: 0.7
      });
    }
  }
  
  return patterns;
}

function detectVolumeAnomalies(volumes: number[], threshold: number = 2.0): VolumeAnomaly[] {
  const anomalies: VolumeAnomaly[] = [];
  const avgVolume = volumes.reduce((sum, vol) => sum + vol, 0) / volumes.length;
  
  volumes.forEach((volume, index) => {
    const ratio = volume / avgVolume;
    if (ratio > threshold) {
      anomalies.push({
        index,
        date: new Date().toISOString(),
        volume,
        price: 0, // Will be updated with actual price
        ratio,
        type: 'spike'
      });
    } else if (ratio < 1 / threshold) {
      anomalies.push({
        index,
        date: new Date().toISOString(),
        volume,
        price: 0, // Will be updated with actual price
        ratio,
        type: 'dip'
      });
    }
  });
  
  return anomalies;
}

function detectDoubleTops(prices: number[], threshold: number = 0.02): DoubleTopPattern[] {
  const patterns: DoubleTopPattern[] = [];
  const { peaks } = identifyPeaksLows(prices);
  
  for (let i = 1; i < peaks.length; i++) {
    const p1 = peaks[i - 1];
    const p2 = peaks[i];
    const priceDiff = Math.abs(prices[p2] - prices[p1]) / prices[p1];
    
    if (priceDiff < threshold) {
      const valley = Math.min(...prices.slice(p1, p2 + 1));
      patterns.push({
        peak1Index: p1,
        peak2Index: p2,
        peak1Date: new Date().toISOString(),
        peak2Date: new Date().toISOString(),
        peak1Price: prices[p1],
        peak2Price: prices[p2],
        neckline: valley,
        confidence: 1 - priceDiff
      });
    }
  }
  
  return patterns;
}

function detectDoubleBottoms(prices: number[], threshold: number = 0.02): DoubleBottomPattern[] {
  const patterns: DoubleBottomPattern[] = [];
  const { lows } = identifyPeaksLows(prices);
  
  for (let i = 1; i < lows.length; i++) {
    const l1 = lows[i - 1];
    const l2 = lows[i];
    const priceDiff = Math.abs(prices[l2] - prices[l1]) / prices[l1];
    
    if (priceDiff < threshold) {
      const peak = Math.max(...prices.slice(l1, l2 + 1));
      patterns.push({
        bottom1Index: l1,
        bottom2Index: l2,
        bottom1Date: new Date().toISOString(),
        bottom2Date: new Date().toISOString(),
        bottom1Price: prices[l1],
        bottom2Price: prices[l2],
        neckline: peak,
        confidence: 1 - priceDiff
      });
    }
  }
  
  return patterns;
}

function detectCandlestickPatterns(data: ChartData[]): CandlestickPattern[] {
  const patterns: CandlestickPattern[] = [];
  
  for (let i = 1; i < data.length; i++) {
    const current = data[i];
    const previous = data[i - 1];
    
    const body = Math.abs(current.close - current.open);
    const upperShadow = current.high - Math.max(current.close, current.open);
    const lowerShadow = Math.min(current.close, current.open) - current.low;
    const range = current.high - current.low;
    
    if (range === 0) continue;
    
    const bodyPct = body / range;
    const upperShadowPct = upperShadow / range;
    const lowerShadowPct = lowerShadow / range;
    
    // Doji
    if (bodyPct < 0.1 && upperShadowPct > 0.2 && lowerShadowPct > 0.2) {
      patterns.push({
        type: 'doji',
        index: i,
        date: current.date,
        open: current.open,
        high: current.high,
        low: current.low,
        close: current.close,
        confidence: 1 - bodyPct
      });
    }
    
    // Hammer
    else if (bodyPct < 0.3 && lowerShadowPct > 0.5 && upperShadowPct < 0.2 && current.close > current.open) {
      patterns.push({
        type: 'hammer',
        index: i,
        date: current.date,
        open: current.open,
        high: current.high,
        low: current.low,
        close: current.close,
        confidence: lowerShadowPct - bodyPct
      });
    }
    
    // Shooting Star
    else if (bodyPct < 0.3 && upperShadowPct > 0.5 && lowerShadowPct < 0.2 && current.close < current.open) {
      patterns.push({
        type: 'shooting_star',
        index: i,
        date: current.date,
        open: current.open,
        high: current.high,
        low: current.low,
        close: current.close,
        confidence: upperShadowPct - bodyPct
      });
    }
  }
  
  return patterns;
}

// ===== UTILITY FUNCTIONS =====

function calculateSlope(indices: number[], values: number[]): number {
  if (indices.length < 2) return 0;
  
  const x1 = indices[0];
  const y1 = values[x1];
  const x2 = indices[indices.length - 1];
  const y2 = values[x2];
  
  return (y2 - y1) / (x2 - x1);
}

function calculateVolatility(prices: number[]): number {
  if (prices.length < 2) return 0;
  
  const returns = [];
  for (let i = 1; i < prices.length; i++) {
    returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
  }
  
  const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
  
  return Math.sqrt(variance);
}

function groupNearbyPoints(indices: number[], prices: number[], threshold: number): number[][] {
  const groups: number[][] = [];
  
  indices.forEach(index => {
    let added = false;
    
    for (const group of groups) {
      const groupPrice = prices[group[0]];
      const currentPrice = prices[index];
      const priceDiff = Math.abs(currentPrice - groupPrice) / groupPrice;
      
      if (priceDiff < threshold) {
        group.push(index);
        added = true;
        break;
      }
    }
    
    if (!added) {
      groups.push([index]);
    }
  });
  
  return groups;
}

// ===== LIVE PATTERN RECOGNITION CLASS =====

export class LivePatternRecognition {
  private patternState: Map<string, PatternState> = new Map();
  private config: {
    triangleMinPoints: number;
    flagImpulse: number;
    flagChannel: number;
    supportResistanceWindow: number;
    divergenceOrder: number;
    volumeThreshold: number;
    doubleTopThreshold: number;
    doubleBottomThreshold: number;
  };

  constructor(config: Partial<typeof LivePatternRecognition.prototype.config> = {}) {
    this.config = {
      triangleMinPoints: 5,
      flagImpulse: 15,
      flagChannel: 20,
      supportResistanceWindow: 20,
      divergenceOrder: 5,
      volumeThreshold: 2.0,
      doubleTopThreshold: 0.02,
      doubleBottomThreshold: 0.02,
      ...config
    };
  }

  // ===== INITIALIZATION =====

  initializePatterns(token: string, historicalData: ChartData[]): void {
    if (historicalData.length === 0) return;

    const prices = historicalData.map(d => d.close);
    const highs = historicalData.map(d => d.high);
    const lows = historicalData.map(d => d.low);
    const volumes = historicalData.map(d => d.volume);

    const state: PatternState = {
      triangles: [],
      flags: [],
      supportResistance: [],
      divergences: [],
      volumeAnomalies: [],
      doubleTops: [],
      doubleBottoms: [],
      headAndShoulders: [],
      candlestickPatterns: []
    };

    // Detect all patterns
    state.triangles = detectTrianglePatterns(prices, this.config.triangleMinPoints);
    state.flags = detectFlagPatterns(prices, this.config.flagImpulse, this.config.flagChannel);
    state.supportResistance = detectSupportResistance(prices, this.config.supportResistanceWindow);
    state.volumeAnomalies = detectVolumeAnomalies(volumes, this.config.volumeThreshold);
    state.doubleTops = detectDoubleTops(prices, this.config.doubleTopThreshold);
    state.doubleBottoms = detectDoubleBottoms(prices, this.config.doubleBottomThreshold);
    state.candlestickPatterns = detectCandlestickPatterns(historicalData);

    // Update dates with actual data
    this.updatePatternDates(state, historicalData);

    this.patternState.set(token, state);
  }

  // ===== INCREMENTAL UPDATES =====

  updatePatterns(token: string, newCandle: ChartData): void {
    const state = this.patternState.get(token);
    if (!state) {
      console.warn('LivePatternRecognition: No state found for token', token);
      return;
    }

    // Add new candle to existing data for pattern detection
    // This is a simplified approach - in a real implementation, you'd maintain
    // the full price series and update patterns incrementally
    
    // For now, we'll trigger a full recalculation when we have enough new data
    // In a production system, you'd implement more efficient incremental updates
    
    // Update support/resistance levels
    this.updateSupportResistance(state, newCandle);
    
    // Update volume anomalies
    this.updateVolumeAnomalies(state, newCandle);
    
    // Update candlestick patterns
    this.updateCandlestickPatterns(state, newCandle);
  }

  private updateSupportResistance(state: PatternState, newCandle: ChartData): void {
    // Check if new candle touches existing levels
    state.supportResistance.forEach(level => {
      const priceDiff = Math.abs(newCandle.close - level.level) / level.level;
      if (priceDiff < 0.01) { // 1% tolerance
        level.touches++;
        level.lastTouchIndex = state.supportResistance.length; // Simplified
        level.lastTouchDate = newCandle.date;
        level.strength = Math.min(level.strength + 1, 10);
      }
    });
  }

  private updateVolumeAnomalies(state: PatternState, newCandle: ChartData): void {
    // Check if new candle has volume anomaly
    const avgVolume = state.volumeAnomalies.length > 0 
      ? state.volumeAnomalies.reduce((sum, a) => sum + a.volume, 0) / state.volumeAnomalies.length
      : newCandle.volume;
    
    const ratio = newCandle.volume / avgVolume;
    
    if (ratio > this.config.volumeThreshold || ratio < 1 / this.config.volumeThreshold) {
      state.volumeAnomalies.push({
        index: state.volumeAnomalies.length,
        date: newCandle.date,
        volume: newCandle.volume,
        price: newCandle.close,
        ratio,
        type: ratio > this.config.volumeThreshold ? 'spike' : 'dip'
      });
    }
  }

  private updateCandlestickPatterns(state: PatternState, newCandle: ChartData): void {
    // Add new candlestick pattern if detected
    const patterns = detectCandlestickPatterns([newCandle]);
    if (patterns.length > 0) {
      state.candlestickPatterns.push(...patterns);
    }
  }

  // ===== DATA RETRIEVAL =====

  getCurrentPatterns(token: string): PatternState | null {
    return this.patternState.get(token) || null;
  }

  getLatestPatterns(token: string, count: number = 5): {
    triangles: TrianglePattern[];
    flags: FlagPattern[];
    supportResistance: SupportResistanceLevel[];
    volumeAnomalies: VolumeAnomaly[];
    candlestickPatterns: CandlestickPattern[];
  } | null {
    const state = this.patternState.get(token);
    if (!state) return null;

    return {
      triangles: state.triangles.slice(-count),
      flags: state.flags.slice(-count),
      supportResistance: state.supportResistance.slice(-count),
      volumeAnomalies: state.volumeAnomalies.slice(-count),
      candlestickPatterns: state.candlestickPatterns.slice(-count)
    };
  }

  // ===== STATE MANAGEMENT =====

  resetPatterns(token: string): void {
    this.patternState.delete(token);
  }

  hasPatterns(token: string): boolean {
    return this.patternState.has(token);
  }

  // ===== UTILITY METHODS =====

  private updatePatternDates(state: PatternState, data: ChartData[]): void {
    // Update triangle dates
    state.triangles.forEach(pattern => {
      if (pattern.startIndex < data.length) {
        pattern.startDate = data[pattern.startIndex].date;
      }
      if (pattern.endIndex < data.length) {
        pattern.endDate = data[pattern.endIndex].date;
      }
    });

    // Update flag dates
    state.flags.forEach(pattern => {
      if (pattern.startIndex < data.length) {
        pattern.startDate = data[pattern.startIndex].date;
      }
      if (pattern.endIndex < data.length) {
        pattern.endDate = data[pattern.endIndex].date;
      }
    });

    // Update divergence dates
    state.divergences.forEach(pattern => {
      if (pattern.startIndex < data.length) {
        pattern.startDate = data[pattern.startIndex].date;
      }
      if (pattern.endIndex < data.length) {
        pattern.endDate = data[pattern.endIndex].date;
      }
    });

    // Update volume anomaly dates
    state.volumeAnomalies.forEach(anomaly => {
      if (anomaly.index < data.length) {
        anomaly.date = data[anomaly.index].date;
        anomaly.price = data[anomaly.index].close;
      }
    });
  }
}

// ===== SINGLETON INSTANCE =====

export const livePatternRecognition = new LivePatternRecognition();

// ===== REACT HOOK =====

import { useEffect, useState, useCallback } from 'react';

export function useLivePatterns(token: string, data: ChartData[]) {
  const [patterns, setPatterns] = useState<PatternState | null>(null);
  const [latestPatterns, setLatestPatterns] = useState<any>(null);
  const [isDetecting, setIsDetecting] = useState(false);

  const detectPatterns = useCallback(() => {
    if (data.length === 0) return;

    setIsDetecting(true);
    
    try {
      // Initialize patterns if not exists
      if (!livePatternRecognition.hasPatterns(token)) {
        livePatternRecognition.initializePatterns(token, data);
      } else {
        // Update with latest candle
        const latestCandle = data[data.length - 1];
        livePatternRecognition.updatePatterns(token, latestCandle);
      }

      // Get current state
      const currentPatterns = livePatternRecognition.getCurrentPatterns(token);
      const currentLatest = livePatternRecognition.getLatestPatterns(token);

      setPatterns(currentPatterns);
      setLatestPatterns(currentLatest);

    } catch (error) {
      console.error('Error detecting live patterns:', error);
    } finally {
      setIsDetecting(false);
    }
  }, [token, data]);

  useEffect(() => {
    detectPatterns();
  }, [detectPatterns]);

  return {
    patterns,
    latestPatterns,
    isDetecting,
    redetect: detectPatterns
  };
} 