import { ChartData } from "@/types/analysis";
import { createChart, IChartApi } from 'lightweight-charts';
import { formatPrice as formatPriceUtil } from './numberFormatter';

export interface ValidatedChartData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timestamp: number;
}

export interface ChartValidationResult {
  isValid: boolean;
  data: ValidatedChartData[];
  errors: string[];
  warnings: string[];
}

/**
 * Validates and processes chart data
 */
export function validateChartData(data: ChartData[]): ChartValidationResult {
  const result: ChartValidationResult = {
    isValid: false,
    data: [],
    errors: [],
    warnings: []
  };

  if (!data || !Array.isArray(data)) {
    result.errors.push('Data is not an array');
    return result;
  }

  if (data.length === 0) {
    result.errors.push('Data array is empty');
    return result;
  }

  const validatedData: ValidatedChartData[] = [];
  let hasErrors = false;

  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    const errors: string[] = [];

    // Check if item exists and is an object
    if (!item || typeof item !== 'object') {
      errors.push(`Item ${i}: Not a valid object`);
      hasErrors = true;
      continue;
    }

    // Validate date
    if (!item.date || typeof item.date !== 'string') {
      errors.push(`Item ${i}: Invalid date format`);
      hasErrors = true;
      continue;
    }

    // Handle different date formats including timezone offsets
    let timestamp: number;
    try {
      // Try parsing as ISO string first
      timestamp = new Date(item.date).getTime();
      
      // If that fails, try parsing without timezone
      if (isNaN(timestamp)) {
        const dateWithoutTz = item.date.replace(/[+-]\d{2}:\d{2}$/, '');
        timestamp = new Date(dateWithoutTz).getTime();
      }
      
      if (isNaN(timestamp)) {
        errors.push(`Item ${i}: Invalid date value: ${item.date}`);
        hasErrors = true;
        continue;
      }
    } catch (error) {
      errors.push(`Item ${i}: Date parsing error: ${item.date}`);
      hasErrors = true;
      continue;
    }

    // Validate numeric fields
    const numericFields = ['open', 'high', 'low', 'close', 'volume'];
    for (const field of numericFields) {
      if (typeof item[field] !== 'number' || !Number.isFinite(item[field])) {
        errors.push(`Item ${i}: Invalid ${field} value: ${item[field]}`);
        hasErrors = true;
        break;
      }
    }

    if (errors.length > 0) {
      result.errors.push(...errors);
      continue;
    }

    // Validate OHLC logic
    if (item.high < item.low) {
      errors.push(`Item ${i}: High (${item.high}) cannot be less than Low (${item.low})`);
      hasErrors = true;
      continue;
    }

    if (item.high < item.open || item.high < item.close) {
      errors.push(`Item ${i}: High (${item.high}) must be >= Open (${item.open}) and Close (${item.close})`);
      hasErrors = true;
      continue;
    }

    if (item.low > item.open || item.low > item.close) {
      errors.push(`Item ${i}: Low (${item.low}) must be <= Open (${item.open}) and Close (${item.close})`);
      hasErrors = true;
      continue;
    }

    // Check for negative values
    if (item.open < 0 || item.high < 0 || item.low < 0 || item.close < 0 || item.volume < 0) {
      result.warnings.push(`Item ${i}: Negative values detected`);
    }

    // Check for zero volume
    if (item.volume === 0) {
      result.warnings.push(`Item ${i}: Zero volume detected`);
    }

    // Check for extreme price movements (more than 50% in one day)
    const priceRange = item.high - item.low;
    const avgPrice = (item.high + item.low) / 2;
    if (avgPrice > 0 && (priceRange / avgPrice) > 0.5) {
      result.warnings.push(`Item ${i}: Extreme price movement detected (>50%)`);
    }

    // Check for future dates (warn but don't fail)
    const currentDate = new Date();
    const itemDate = new Date(timestamp);
    if (itemDate > currentDate) {
      result.warnings.push(`Item ${i}: Future date detected: ${item.date}`);
    }

    validatedData.push({
      date: item.date,
      open: item.open,
      high: item.high,
      low: item.low,
      close: item.close,
      volume: item.volume,
      timestamp
    });
  }

  // Sort by timestamp to ensure chronological order
  validatedData.sort((a, b) => a.timestamp - b.timestamp);

  // Check for duplicate timestamps
  const timestamps = new Set<number>();
  for (const item of validatedData) {
    if (timestamps.has(item.timestamp)) {
      result.warnings.push(`Duplicate timestamp detected: ${item.date}`);
    }
    timestamps.add(item.timestamp);
  }

  // Check for gaps in data
  if (validatedData.length > 1) {
    const timeGaps = [];
    for (let i = 1; i < validatedData.length; i++) {
      const gap = validatedData[i].timestamp - validatedData[i - 1].timestamp;
      const daysGap = gap / (1000 * 60 * 60 * 24);
      if (daysGap > 7) { // More than 7 days gap
        timeGaps.push(`${validatedData[i - 1].date} to ${validatedData[i].date} (${Math.round(daysGap)} days)`);
      }
    }
    if (timeGaps.length > 0) {
      result.warnings.push(`Large time gaps detected: ${timeGaps.join(', ')}`);
    }
  }

  result.data = validatedData;
  result.isValid = !hasErrors && validatedData.length > 0;

  return result;
}

/**
 * Calculates basic statistics for chart data
 */
export function calculateChartStats(data: ValidatedChartData[]) {
  if (data.length === 0) return null;

  const prices = data.map(d => d.close);
  const volumes = data.map(d => d.volume);
  const returns = [];

  for (let i = 1; i < prices.length; i++) {
    returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
  }

  const stats = {
    dataPoints: data.length,
    dateRange: {
      start: data[0].date,
      end: data[data.length - 1].date,
      days: Math.ceil((data[data.length - 1].timestamp - data[0].timestamp) / (1000 * 60 * 60 * 24))
    },
    price: {
      min: Math.min(...prices),
      max: Math.max(...prices),
      current: prices[prices.length - 1],
      avg: prices.reduce((a, b) => a + b, 0) / prices.length
    },
    volume: {
      min: Math.min(...volumes),
      max: Math.max(...volumes),
      avg: volumes.reduce((a, b) => a + b, 0) / volumes.length,
      total: volumes.reduce((a, b) => a + b, 0)
    },
    returns: {
      min: Math.min(...returns),
      max: Math.max(...returns),
      avg: returns.reduce((a, b) => a + b, 0) / returns.length,
      volatility: Math.sqrt(returns.reduce((sum, r) => sum + Math.pow(r - returns.reduce((a, b) => a + b, 0) / returns.length, 2), 0) / returns.length)
    }
  };

  return stats;
}

/**
 * Filters data by date range
 */
export function filterDataByDateRange(
  data: ValidatedChartData[], 
  startDate: string, 
  endDate: string
): ValidatedChartData[] {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();

  return data.filter(item => {
    const timestamp = new Date(item.date).getTime();
    return timestamp >= start && timestamp <= end;
  });
}

/**
 * Filters data by number of days from the end
 */
export function filterDataByDays(data: ValidatedChartData[], days: number): ValidatedChartData[] {
  if (data.length === 0) return [];

  const endDate = new Date(data[data.length - 1].date);
  const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

  return data.filter(item => {
    const timestamp = new Date(item.date).getTime();
    return timestamp >= startDate.getTime();
  });
}

/**
 * Filters any array of objects with a date field by a timeframe string (e.g., '7d', '30d', 'all').
 * @param data Array of objects with a 'date' field (string)
 * @param timeframe One of '7d', '30d', '90d', '180d', '1y', or 'all'
 * @returns Filtered array, or original array if 'all'
 */
export function filterDataByTimeframe<T extends { date: string }>(data: T[], timeframe: string): T[] {
  if (timeframe === 'all') return data;
  const days = {
    '7d': 7,
    '30d': 30,
    '90d': 90,
    '180d': 180,
    '1y': 365,
  }[timeframe] || 0;
  if (!days) return data;
  const now = new Date();
  const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  return data.filter(item => new Date(item.date) >= cutoffDate);
}

/**
 * Formats price for display
 */
export function formatPrice(price: number, currency: string = '₹'): string {
  return formatPriceUtil(price, currency);
}

/**
 * Formats volume for display
 */
export function formatVolume(volume: number): string {
  if (volume >= 1000000000) {
    return `${(volume / 1000000000).toFixed(1)}B`;
  } else if (volume >= 1000000) {
    return `${(volume / 1000000).toFixed(1)}M`;
  } else if (volume >= 1000) {
    return `${(volume / 1000).toFixed(1)}K`;
  } else {
    return volume.toString();
  }
}

/**
 * Formats percentage change
 */
export function formatPercentageChange(change: number): string {
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(2)}%`;
} 

/**
 * Detects volume anomalies where volume exceeds a threshold times the rolling mean.
 * Returns an array of anomaly objects with index, volume, and ratio.
 */
export interface VolumeAnomaly {
  index: number;
  volume: number;
  ratio: number;
}

export function detectVolumeAnomalies(
  volume: number[],
  threshold = 2.0,
  window = 20
): VolumeAnomaly[] {
  const anomalies: VolumeAnomaly[] = [];
  for (let i = window; i < volume.length; i++) {
    const rollingMean =
      volume.slice(i - window, i).reduce((a, b) => a + b, 0) / window;
    if (volume[i] > threshold * rollingMean) {
      anomalies.push({
        index: i,
        volume: volume[i],
        ratio: volume[i] / rollingMean,
      });
    }
  }
  return anomalies;
} 

export interface DoubleTopBottomPattern {
  indices: [number, number];
  values: [number, number];
}

export function detectDoubleTop(prices: number[], threshold = 0.02, order = 5): DoubleTopBottomPattern[] {
  const { peaks } = identifyPeaksLows(prices, order);
  const patterns: DoubleTopBottomPattern[] = [];
  for (let i = 1; i < peaks.length; i++) {
    const priceDiff = Math.abs(prices[peaks[i]] - prices[peaks[i-1]]);
    if (priceDiff / prices[peaks[i]] < threshold) {
      patterns.push({
        indices: [peaks[i-1], peaks[i]],
        values: [prices[peaks[i-1]], prices[peaks[i]]]
      });
    }
  }
  return patterns;
}

export function detectDoubleBottom(prices: number[], threshold = 0.02, order = 5): DoubleTopBottomPattern[] {
  const { lows } = identifyPeaksLows(prices, order);
  const patterns: DoubleTopBottomPattern[] = [];
  for (let i = 1; i < lows.length; i++) {
    const first = lows[i-1];
    const second = lows[i];
    if (Math.abs(prices[first] - prices[second]) / prices[first] < threshold) {
      // Check if there's a peak between the two lows
      const segment = prices.slice(first, second + 1);
      const peakIdx = first + segment.indexOf(Math.max(...segment));
      if (peakIdx > first && peakIdx < second) {
        patterns.push({
          indices: [first, second],
          values: [prices[first], prices[second]]
        });
      }
    }
  }
  return patterns;
} 

// Export identifyPeaksLows for use in other modules
export function identifyPeaksLows(prices: number[], order = 5) {
  const peaks: number[] = [];
  const lows: number[] = [];
  for (let i = order; i < prices.length - order; i++) {
    let isPeak = true;
    for (let j = i - order; j <= i + order; j++) {
      if (j !== i && prices[j] >= prices[i]) {
        isPeak = false;
        break;
      }
    }
    if (isPeak) peaks.push(i);
    let isLow = true;
    for (let j = i - order; j <= i + order; j++) {
      if (j !== i && prices[j] <= prices[i]) {
        isLow = false;
        break;
      }
    }
    if (isLow) lows.push(i);
  }
  return { peaks, lows };
} 

// ---- New Pattern Detection Functions ---- //

export interface SupportResistanceLevel {
  price: number;
  strength: number; // Number of touches
  indices: number[]; // Indices where this level was touched
  type: 'support' | 'resistance';
}

export interface TrianglePattern {
  startIndex: number;
  endIndex: number;
  upperSlope: number;
  lowerSlope: number;
  confidence: number;
  type: 'symmetrical' | 'ascending' | 'descending';
}

export interface FlagPattern {
  startIndex: number;
  endIndex: number;
  poleStartIndex: number;
  poleEndIndex: number;
  flagStartIndex: number;
  flagEndIndex: number;
  direction: 'bullish' | 'bearish';
  confidence: number;
}

/**
 * Detect support and resistance levels from peaks and lows
 */
export function detectSupportResistance(
  prices: number[], 
  order = 5, 
  clusterThreshold = 0.02
): SupportResistanceLevel[] {
  const { peaks, lows } = identifyPeaksLows(prices, order);
  
  // Collect all potential levels
  const resistanceLevels = peaks.map(i => prices[i]);
  const supportLevels = lows.map(i => prices[i]);
  
  // Cluster similar levels
  const clusterLevels = (levels: number[], threshold: number): SupportResistanceLevel[] => {
    const clusters: SupportResistanceLevel[] = [];
    
    for (const level of levels) {
      let foundCluster = false;
      
      for (const cluster of clusters) {
        const priceDiff = Math.abs(level - cluster.price) / cluster.price;
        if (priceDiff <= threshold) {
          // Add to existing cluster
          cluster.indices.push(level);
          cluster.strength += 1;
          foundCluster = true;
          break;
        }
      }
      
      if (!foundCluster) {
        // Create new cluster
        clusters.push({
          price: level,
          strength: 1,
          indices: [level],
          type: 'resistance'
        });
      }
    }
    
    return clusters;
  };
  
  const resistance = clusterLevels(resistanceLevels, clusterThreshold);
  const support = clusterLevels(supportLevels, clusterThreshold);
  
  // Calculate average price for each cluster
  resistance.forEach(r => {
    r.price = r.indices.reduce((sum, price) => sum + price, 0) / r.indices.length;
  });
  support.forEach(s => {
    s.price = s.indices.reduce((sum, price) => sum + price, 0) / s.indices.length;
    s.type = 'support';
  });
  
  return [...resistance, ...support].filter(level => level.strength >= 2);
}

/**
 * Simple linear regression helper
 */
function linearRegression(x: number[], y: number[]): { slope: number; intercept: number } {
  const n = x.length;
  if (n < 2) return { slope: 0, intercept: 0 };
  
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  return { slope, intercept };
}

/**
 * Detect triangle patterns (symmetrical, ascending, descending)
 */
export function detectTriangles(
  prices: number[], 
  minPoints = 5, 
  maxPoints = 20,
  slopeThreshold = 0.35
): TrianglePattern[] {
  const patterns: TrianglePattern[] = [];
  const { peaks, lows } = identifyPeaksLows(prices, 3);
  
  for (let start = 0; start < prices.length - minPoints; start++) {
    for (let length = minPoints; length <= Math.min(maxPoints, prices.length - start); length++) {
      const end = start + length;
      const segment = prices.slice(start, end);
      
      // Find peaks and lows within this segment
      const segmentPeaks = peaks.filter(p => p >= start && p < end);
      const segmentLows = lows.filter(l => l >= start && l < end);
      
      if (segmentPeaks.length < 2 || segmentLows.length < 2) continue;
      
      // Convert to relative indices within segment
      const peakIndices = segmentPeaks.map(p => p - start);
      const lowIndices = segmentLows.map(l => l - start);
      const peakPrices = segmentPeaks.map(p => prices[p]);
      const lowPrices = segmentLows.map(l => prices[l]);
      
      // Fit regression lines
      const upperRegression = linearRegression(peakIndices, peakPrices);
      const lowerRegression = linearRegression(lowIndices, lowPrices);
      
      const upperSlope = upperRegression.slope;
      const lowerSlope = lowerRegression.slope;
      
      // Check for triangle conditions
      const slopeDiff = Math.abs(Math.abs(upperSlope) - Math.abs(lowerSlope));
      const maxSlope = Math.max(Math.abs(upperSlope), Math.abs(lowerSlope));
      const normalizedDiff = maxSlope > 0 ? slopeDiff / maxSlope : 0;
      
      let triangleType: 'symmetrical' | 'ascending' | 'descending' | null = null;
      let confidence = 0;
      
      // Symmetrical triangle: converging lines
      if (upperSlope < 0 && lowerSlope > 0 && normalizedDiff <= slopeThreshold) {
        triangleType = 'symmetrical';
        confidence = 1 - normalizedDiff;
      }
      // Ascending triangle: flat top, rising bottom
      else if (Math.abs(upperSlope) < 0.001 && lowerSlope > 0.001) {
        triangleType = 'ascending';
        confidence = Math.min(1, lowerSlope * 100);
      }
      // Descending triangle: falling top, flat bottom
      else if (upperSlope < -0.001 && Math.abs(lowerSlope) < 0.001) {
        triangleType = 'descending';
        confidence = Math.min(1, Math.abs(upperSlope) * 100);
      }
      
      if (triangleType && confidence > 0.3) {
        patterns.push({
          startIndex: start,
          endIndex: end,
          upperSlope,
          lowerSlope,
          confidence,
          type: triangleType
        });
      }
    }
  }
  
  return patterns;
}

/**
 * Detect flag patterns (flagpole + consolidation)
 */
export function detectFlags(
  prices: number[],
  impulsePeriod = 15,
  channelPeriod = 20,
  pullbackRatio = 0.35,
  volatilityThreshold = 0.02
): FlagPattern[] {
  const patterns: FlagPattern[] = [];
  
  for (let i = impulsePeriod; i < prices.length - channelPeriod; i++) {
    // Calculate flagpole (strong move)
    const poleStart = i - impulsePeriod;
    const poleEnd = i;
    const poleReturn = (prices[poleEnd] - prices[poleStart]) / prices[poleStart];
    
    // Check if pole is significant (at least 8% move)
    if (Math.abs(poleReturn) < 0.08) continue;
    
    // Calculate flag (consolidation period)
    const flagStart = i;
    const flagEnd = i + channelPeriod;
    const flagSegment = prices.slice(flagStart, flagEnd);
    
    // Calculate retracement
    const flagMin = Math.min(...flagSegment);
    const flagMax = Math.max(...flagSegment);
    let retracement: number;
    
    if (poleReturn > 0) {
      // Bullish flag: check pullback from high
      retracement = (flagMin - prices[poleEnd]) / prices[poleEnd];
    } else {
      // Bearish flag: check bounce from low
      retracement = (flagMax - prices[poleEnd]) / prices[poleEnd];
    }
    
    // Check retracement condition
    if (Math.abs(retracement) > Math.abs(poleReturn) * pullbackRatio) continue;
    
    // Check volatility (flag should have low volatility)
    const flagReturns = [];
    for (let j = 1; j < flagSegment.length; j++) {
      flagReturns.push(Math.abs((flagSegment[j] - flagSegment[j-1]) / flagSegment[j-1]));
    }
    const avgVolatility = flagReturns.reduce((a, b) => a + b, 0) / flagReturns.length;
    
    if (avgVolatility > volatilityThreshold) continue;
    
    // Calculate confidence based on pole strength and flag quality
    const poleStrength = Math.abs(poleReturn);
    const flagQuality = 1 - (avgVolatility / volatilityThreshold);
    const confidence = (poleStrength * 0.7 + flagQuality * 0.3);
    
    patterns.push({
      startIndex: poleStart,
      endIndex: flagEnd,
      poleStartIndex: poleStart,
      poleEndIndex: poleEnd,
      flagStartIndex: flagStart,
      flagEndIndex: flagEnd,
      direction: poleReturn > 0 ? 'bullish' : 'bearish',
      confidence: Math.min(1, confidence)
    });
  }
  
  return patterns;
} 

export interface ChartContainer {
  current: HTMLDivElement | null;
}

export interface ChartInitOptions {
  width?: number;
  height?: number;
  theme?: 'light' | 'dark';
  timeframe?: string;
  debug?: boolean;
}

export interface ChartConfig {
  width?: number;
  height?: number;
  layout?: {
    background?: { color: string };
    textColor?: string;
  };
  grid?: {
    vertLines?: { color: string };
    horzLines?: { color: string };
  };
  timeScale?: {
    timeVisible?: boolean;
    secondsVisible?: boolean;
    rightOffset?: number;
    barSpacing?: number;
  };
  rightPriceScale?: {
    autoScale?: boolean;
    scaleMargins?: { top: number; bottom: number };
  };
  crosshair?: {
    mode?: number;
  };
  watermark?: {
    visible?: boolean;
    fontSize?: number;
    text?: string;
    color?: string;
    horzAlign?: string;
    vertAlign?: string;
  };
}

/**
 * Robust chart initialization with retry mechanism and proper error handling
 */
export const initializeChartWithRetry = async (
  containerRef: ChartContainer,
  options: ChartInitOptions,
  chartConfig: ChartConfig,
  maxRetries: number = 5
): Promise<IChartApi | null> => {
  const { debug = false } = options;
  
  const attemptInitialization = async (retryCount: number = 0): Promise<IChartApi | null> => {
    try {
      // Check if container exists and has proper dimensions
      const container = containerRef.current;
      if (!container) {
        // if (debug) console.log('Container ref is null');
        return null;
      }

      if (!container.clientWidth || !container.clientHeight) {
        // if (debug) {
        //   console.log('Container not properly sized, retrying...', {
        //     retryCount,
        //     width: container.clientWidth,
        //     height: container.clientHeight
        //   });
        // }
        
        // Retry after a short delay
        if (retryCount < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 200)); // Increased delay
          return attemptInitialization(retryCount + 1);
        } else {
          throw new Error('Failed to initialize chart: container not properly sized after maximum retries');
        }
      }

      // Import the library dynamically
      const { createChart } = await import('lightweight-charts');
      
      // if (debug) console.log('Library imported successfully');

      // Ensure container is clean before creating chart
      if (container.children.length > 0) {
        // if (debug) console.log('Cleaning container before chart creation');
        container.innerHTML = '';
      }

      // Create chart with actual container dimensions
      const finalConfig = {
        ...chartConfig,
        width: container.clientWidth,
        height: container.clientHeight
      };
      
      // if (debug) console.log('Final chart config:', finalConfig);

      // Create chart
      const chart = createChart(container, finalConfig);
      
      // if (debug) console.log('Chart created successfully:', chart);
      
      return chart;

    } catch (error) {
      // if (debug) console.error('Error in chart initialization attempt:', error);
      
      if (retryCount < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 200)); // Increased delay
        return attemptInitialization(retryCount + 1);
      } else {
        throw error;
      }
    }
  };

  return attemptInitialization();
};

/**
 * Create common chart theme configuration
 */
export const createChartTheme = (isDark: boolean, options: ChartInitOptions = {}) => {
  const { timeframe = '1d' } = options;
  
  return {
    layout: {
      background: { color: isDark ? '#1a1a1a' : '#ffffff' },
      textColor: isDark ? '#ffffff' : '#000000',
    },
    grid: {
      vertLines: { color: isDark ? '#2a2a2a' : '#e1e1e1' },
      horzLines: { color: isDark ? '#2a2a2a' : '#e1e1e1' },
    },
    timeScale: {
      timeVisible: true,
      secondsVisible: false,
      borderColor: isDark ? '#2a2a2a' : '#e1e1e1',
      tickMarkFormatter: createTickMarkFormatter(timeframe),
    },
    rightPriceScale: {
      borderColor: isDark ? '#2a2a2a' : '#e1e1e1',
    },
    localization: {
      timeFormatter: createTickMarkFormatter(timeframe),
      priceFormatter: (price: number) => {
        return price >= 1 ? price.toFixed(2) : price.toPrecision(4);
      },
    },
  };
};

/**
 * Safely cleanup chart instance
 */
export const safeChartCleanup = (chartRef: React.MutableRefObject<IChartApi | null>) => {
  if (chartRef.current) {
    try {
      const chart = chartRef.current;
      
      // Lightweight Charts automatically removes all series when the chart is removed
      // Just remove the chart instance
      chart.remove();
      chartRef.current = null;
    } catch (error) {
      // console.warn('Error during chart cleanup:', error);
      // Force null even if cleanup fails
      chartRef.current = null;
    }
  }
};

/**
 * Check if chart container is ready for initialization
 */
export const isChartContainerReady = (containerRef: ChartContainer): boolean => {
  if (!containerRef.current) {
    return false;
  }
  
  const container = containerRef.current;
  const hasDimensions = container.clientWidth > 0 && container.clientHeight > 0;
  const hasMinimumSize = container.clientWidth >= 100 && container.clientHeight >= 100;
  
  return hasDimensions && hasMinimumSize;
};

// ===== TIMESTAMP UTILITIES =====

/**
 * Convert any timestamp to UTC timestamp for consistent chart placement
 * All chart data should use UTC timestamps to ensure correct candle placement
 * regardless of user's local timezone
 */
export function toUTCTimestamp(input: string | number | Date): number {
  let timestamp: number;
  
  try {
    if (typeof input === 'number') {
      // Check if it's a valid Unix timestamp (not too small)
      if (input < 1000000000) { // Less than 2001-09-09 (reasonable minimum)
        // console.warn(`Suspiciously small timestamp: ${input}, using current time as fallback`);
        return Math.floor(Date.now() / 1000);
      }
      // If it's already a Unix timestamp (seconds), convert to milliseconds
      timestamp = input * 1000;
    } else if (typeof input === 'string') {
      // Parse ISO string or other date formats
      timestamp = Date.parse(input);
      
      // If parsing fails, try without timezone offset
      if (isNaN(timestamp)) {
        const dateWithoutTz = input.replace(/[+-]\d{2}:\d{2}$/, '');
        timestamp = Date.parse(dateWithoutTz);
      }
    } else if (input instanceof Date) {
      timestamp = input.getTime();
    } else {
      throw new Error(`Invalid timestamp input: ${input}`);
    }
    
    if (isNaN(timestamp)) {
      // console.warn(`Invalid timestamp format: ${input}, using current time as fallback`);
      return Math.floor(Date.now() / 1000);
    }
    
    // Return UTC timestamp in seconds (chart library format)
    return Math.floor(timestamp / 1000);
  } catch (error) {
    // console.warn(`Error parsing timestamp: ${input}, using current time as fallback`, error);
    return Math.floor(Date.now() / 1000);
  }
}

/**
 * Convert UTC timestamp to ISO string for storage/transmission
 * Always returns UTC ISO string regardless of local timezone
 */
export function fromUTCTimestamp(utcTimestamp: number): string {
  try {
    const date = new Date(utcTimestamp * 1000);
    return date.toISOString();
  } catch (error) {
    // console.warn(`Error converting UTC timestamp: ${utcTimestamp}`, error);
    return new Date().toISOString();
  }
}

/**
 * Sort chart data by timestamp in ascending order (oldest first)
 * This is required by TradingView Lightweight Charts library
 */
export function sortChartDataByTime<T extends { date: string; time?: number }>(data: T[]): T[] {
  return [...data].sort((a, b) => {
    // Use time field if available, otherwise fall back to date
    const timeA = (a as any).time || new Date(a.date).getTime() / 1000;
    const timeB = (b as any).time || new Date(b.date).getTime() / 1000;
    return timeA - timeB;
  });
}

/**
 * Validate and clean chart data for TradingView Lightweight Charts
 * Ensures data is properly sorted and formatted
 */
export function validateChartDataForTradingView<T extends { date: string; open: number; high: number; low: number; close: number }>(data: T[]): T[] {
  if (!data || data.length === 0) {
    return [];
  }

  // Filter out invalid data points
  const validData = data.filter(item => {
    const isValidDate = !isNaN(new Date(item.date).getTime());
    const isValidOHLC = !isNaN(item.open) && !isNaN(item.high) && !isNaN(item.low) && !isNaN(item.close);
    const isValidRange = item.high >= Math.max(item.open, item.close) && item.low <= Math.min(item.open, item.close);
    
    if (!isValidDate || !isValidOHLC || !isValidRange) {
      // console.warn('Invalid data point filtered out:', item);
      return false;
    }
    return true;
  });

  // Sort by timestamp
  const sortedData = sortChartDataByTime(validData);

  // Remove duplicates based on timestamp
  const uniqueData = sortedData.filter((item, index, array) => {
    if (index === 0) return true;
    // Use time field for comparison instead of date field
    const currentTime = (item as any).time || new Date(item.date).getTime() / 1000;
    const previousTime = (array[index - 1] as any).time || new Date(array[index - 1].date).getTime() / 1000;
    return currentTime !== previousTime;
  });

  // console.log(`Chart data validation: ${data.length} input -> ${uniqueData.length} valid points`);
  return uniqueData;
}

/**
 * Format timestamp for display in user's local timezone
 * This is for UI display only, not for chart data
 */
export function formatTimestampForDisplay(utcTimestamp: number, timeframe: string = '1d'): string {
  try {
    const date = new Date(utcTimestamp * 1000);
    
    // Normalize timeframe for consistent comparison
    const normalizedTimeframe = timeframe.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    // For daily intervals, show date only
    if (normalizedTimeframe === '1d' || normalizedTimeframe === '1day' || normalizedTimeframe === 'day') {
      return date.toLocaleDateString('en-IN', { 
        timeZone: 'Asia/Kolkata',
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });
    } else if (normalizedTimeframe === '1h' || normalizedTimeframe === '60min' || normalizedTimeframe === '60minute') {
      // For hourly intervals, show date and full time
      return date.toLocaleDateString('en-IN', { 
        timeZone: 'Asia/Kolkata',
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    } else {
      // For minute intervals, show date and time
      return date.toLocaleDateString('en-IN', { 
        timeZone: 'Asia/Kolkata',
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    }
  } catch (error) {
    // console.warn(`Error formatting timestamp: ${utcTimestamp}`, error);
    return 'Invalid';
  }
}

/**
 * Create a comprehensive tick mark formatter for chart time scales
 * Handles all timeframes with appropriate formatting
 */
export function createTickMarkFormatter(timeframe: string) {
  return (time: number) => {
    try {
      const date = new Date(time * 1000);
      const normalizedTimeframe = timeframe.toLowerCase().replace(/[^a-z0-9]/g, '');
      
      // For daily intervals, show date only
      if (normalizedTimeframe === '1d' || normalizedTimeframe === '1day' || normalizedTimeframe === 'day') {
        return date.toLocaleDateString('en-IN', { 
          timeZone: 'Asia/Kolkata',
          month: 'short', 
          day: 'numeric',
          year: 'numeric'
        });
      } else if (normalizedTimeframe === '1h' || normalizedTimeframe === '60min' || normalizedTimeframe === '60minute') {
        // For hourly intervals, show date and full time
        return date.toLocaleDateString('en-IN', { 
          timeZone: 'Asia/Kolkata',
          month: 'short', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });
      } else {
        // For minute intervals, show date and time
        return date.toLocaleDateString('en-IN', { 
          timeZone: 'Asia/Kolkata',
          month: 'short', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });
      }
    } catch (error) {
      // console.warn(`Error formatting tick mark: ${time}`, error);
      return 'Invalid';
    }
  };
} 

// === Indicator Calculation Functions (moved from EnhancedSimpleChart) ===

export function calcSMA(values: number[], period: number): (number | null)[] {
  if (values.length < period) return new Array(values.length).fill(null);
  const sma: (number | null)[] = [];
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) {
      sma.push(null);
      sum += values[i];
    } else {
      if (i === period - 1) {
        sum += values[i];
      } else {
        sum = sum - values[i - period] + values[i];
      }
      sma.push(sum / period);
    }
  }
  return sma;
}

export function calcEMA(values: number[], period: number): (number | null)[] {
  if (values.length < period) return new Array(values.length).fill(null);
  const ema: (number | null)[] = [];
  const k = 2 / (period + 1);
  let prevEma: number | null = null;
  for (let i = 0; i < values.length; i++) {
    const price = values[i];
    if (prevEma === null) {
      prevEma = price;
    } else {
      prevEma = price * k + prevEma * (1 - k);
    }
    ema.push(i >= period - 1 ? prevEma : null);
  }
  return ema;
}

export function calcRSI(values: number[], period = 14): (number | null)[] {
  if (values.length < period + 1) return new Array(values.length).fill(null);
  const rsi: (number | null)[] = [];
  let gains = 0;
  let losses = 0;
  for (let i = 1; i <= period; i++) {
    const change = values[i] - values[i - 1];
    if (change > 0) {
      gains += change;
    } else {
      losses -= change;
    }
  }
  let avgGain = gains / period;
  let avgLoss = losses / period;
  const rs = avgGain / avgLoss;
  const firstRsi = 100 - (100 / (1 + rs));
  rsi.push(...new Array(period).fill(null));
  rsi.push(firstRsi);
  for (let i = period + 1; i < values.length; i++) {
    const change = values[i] - values[i - 1];
    let currentGain = 0;
    let currentLoss = 0;
    if (change > 0) {
      currentGain = change;
    } else {
      currentLoss = -change;
    }
    avgGain = (avgGain * (period - 1) + currentGain) / period;
    avgLoss = (avgLoss * (period - 1) + currentLoss) / period;
    const rs = avgGain / avgLoss;
    const rsiValue = 100 - (100 / (1 + rs));
    rsi.push(rsiValue);
  }
  return rsi;
}

export function calcBollingerBands(values: number[], period = 20, stdDev = 2): {
  upper: (number | null)[];
  middle: (number | null)[];
  lower: (number | null)[];
} {
  const sma = calcSMA(values, period);
  const upper: (number | null)[] = [];
  const middle: (number | null)[] = [];
  const lower: (number | null)[] = [];
  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) {
      upper.push(null);
      middle.push(null);
      lower.push(null);
      continue;
    }
    const smaValue = sma[i];
    if (smaValue === null) {
      upper.push(null);
      middle.push(null);
      lower.push(null);
      continue;
    }
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) {
      sum += Math.pow(values[j] - smaValue, 2);
    }
    const standardDeviation = Math.sqrt(sum / period);
    middle.push(smaValue);
    upper.push(smaValue + (standardDeviation * stdDev));
    lower.push(smaValue - (standardDeviation * stdDev));
  }
  return { upper, middle, lower };
}

export function calcMACD(values: number[], fastPeriod = 12, slowPeriod = 26, signalPeriod = 9): {
  macd: (number | null)[];
  signal: (number | null)[];
  histogram: (number | null)[];
} {
  const fastEMA = calcEMA(values, fastPeriod);
  const slowEMA = calcEMA(values, slowPeriod);
  const macd: (number | null)[] = [];
  for (let i = 0; i < values.length; i++) {
    if (fastEMA[i] !== null && slowEMA[i] !== null) {
      macd.push(fastEMA[i]! - slowEMA[i]!);
    } else {
      macd.push(null);
    }
  }
  const signal = calcEMA(macd.map(v => v || 0), signalPeriod);
  const histogram: (number | null)[] = [];
  for (let i = 0; i < values.length; i++) {
    if (macd[i] !== null && signal[i] !== null) {
      histogram.push(macd[i]! - signal[i]!);
    } else {
      histogram.push(null);
    }
  }
  return { macd, signal, histogram };
}

export function calcStochastic(highs: number[], lows: number[], closes: number[], kPeriod = 14, dPeriod = 3): {
  k: (number | null)[];
  d: (number | null)[];
} {
  const k: (number | null)[] = [];
  const d: (number | null)[] = [];
  for (let i = 0; i < closes.length; i++) {
    if (i < kPeriod - 1) {
      k.push(null);
      d.push(null);
      continue;
    }
    const highestHigh = Math.max(...highs.slice(i - kPeriod + 1, i + 1));
    const lowestLow = Math.min(...lows.slice(i - kPeriod + 1, i + 1));
    if (highestHigh === lowestLow) {
      k.push(50);
    } else {
      const kValue = ((closes[i] - lowestLow) / (highestHigh - lowestLow)) * 100;
      k.push(kValue);
    }
  }
  for (let i = 0; i < k.length; i++) {
    if (i < dPeriod - 1) {
      d.push(null);
      continue;
    }
    const sum = k.slice(i - dPeriod + 1, i + 1).reduce((acc, val) => acc + (val || 0), 0);
    d.push(sum / dPeriod);
  }
  return { k, d };
}

export function calcATR(highs: number[], lows: number[], closes: number[], period = 14): (number | null)[] {
  const atr: (number | null)[] = [];
  const trueRanges: number[] = [];
  for (let i = 0; i < highs.length; i++) {
    if (i === 0) {
      trueRanges.push(highs[i] - lows[i]);
      atr.push(null);
      continue;
    }
    const tr1 = highs[i] - lows[i];
    const tr2 = Math.abs(highs[i] - closes[i - 1]);
    const tr3 = Math.abs(lows[i] - closes[i - 1]);
    const trueRange = Math.max(tr1, tr2, tr3);
    trueRanges.push(trueRange);
    if (i < period - 1) {
      atr.push(null);
    } else if (i === period - 1) {
      const sum = trueRanges.slice(0, period).reduce((acc, val) => acc + val, 0);
      atr.push(sum / period);
    } else {
      const prevAtr = atr[i - 1]!;
      const currentTr = trueRanges[i];
      const newAtr = ((prevAtr * (period - 1)) + currentTr) / period;
      atr.push(newAtr);
    }
  }
  return atr;
}

export function calcOBV(closes: number[], volumes: number[]): (number | null)[] {
  const obv: (number | null)[] = [];
  for (let i = 0; i < closes.length; i++) {
    if (i === 0) {
      obv.push(volumes[i]);
      continue;
    }
    const prevObv = obv[i - 1]!;
    const currentClose = closes[i];
    const prevClose = closes[i - 1];
    const currentVolume = volumes[i];
    if (currentClose > prevClose) {
      obv.push(prevObv + currentVolume);
    } else if (currentClose < prevClose) {
      obv.push(prevObv - currentVolume);
    } else {
      obv.push(prevObv);
    }
  }
  return obv;
}

export interface DivergenceData {
  type: 'bullish' | 'bearish';
  priceIndices: [number, number];
  indicatorIndices: [number, number];
  priceValues: [number, number];
  indicatorValues: [number, number];
}

export function detectDivergence(prices: number[], indicator: number[], order = 5): DivergenceData[] {
  const { peaks, lows } = identifyPeaksLows(prices, order);
  const { peaks: indicatorPeaks, lows: indicatorLows } = identifyPeaksLows(indicator, order);
  const divergences: DivergenceData[] = [];
  
  // Bullish divergence: price makes lower lows, indicator makes higher lows
  for (let i = 0; i < lows.length - 1; i++) {
    for (let j = i + 1; j < lows.length; j++) {
      const priceLow1 = prices[lows[i]];
      const priceLow2 = prices[lows[j]];
      const indicatorLow1 = indicator[lows[i]];
      const indicatorLow2 = indicator[lows[j]];
      if (priceLow2 < priceLow1 && indicatorLow2 > indicatorLow1) {
        divergences.push({
          type: 'bullish',
          priceIndices: [lows[i], lows[j]],
          indicatorIndices: [lows[i], lows[j]],
          priceValues: [priceLow1, priceLow2],
          indicatorValues: [indicatorLow1, indicatorLow2]
        });
      }
    }
  }
  
  // Bearish divergence: price makes higher highs, indicator makes lower highs
  for (let i = 0; i < peaks.length - 1; i++) {
    for (let j = i + 1; j < peaks.length; j++) {
      const priceHigh1 = prices[peaks[i]];
      const priceHigh2 = prices[peaks[j]];
      const indicatorHigh1 = indicator[peaks[i]];
      const indicatorHigh2 = indicator[peaks[j]];
      if (priceHigh2 > priceHigh1 && indicatorHigh2 < indicatorHigh1) {
        divergences.push({
          type: 'bearish',
          priceIndices: [peaks[i], peaks[j]],
          indicatorIndices: [peaks[i], peaks[j]],
          priceValues: [priceHigh1, priceHigh2],
          indicatorValues: [indicatorHigh1, indicatorHigh2]
        });
      }
    }
  }
  
  return divergences;
} 