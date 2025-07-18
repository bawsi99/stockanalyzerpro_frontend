
export interface PeakLowData {
  peaks: number[];
  lows: number[];
  peakValues: number[];
  lowValues: number[];
}

export interface DivergenceData {
  startIndex: number;
  endIndex: number;
  type: 'bullish' | 'bearish';
  startDate: string;
  endDate: string;
  startPrice: number;
  endPrice: number;
  startIndicator: number;
  endIndicator: number;
}

export interface PriceStats {
  currentPrice: number;
  allTimeHigh: number;
  allTimeLow: number;
  distanceFromHigh: number;
  distanceFromLow: number;
  distanceFromHighPercent: number;
  distanceFromLowPercent: number;
}

export class PatternRecognition {
  static identifyPeaksLows(prices: number[], order: number = 5): PeakLowData {
    const peaks: number[] = [];
    const lows: number[] = [];
    const peakValues: number[] = [];
    const lowValues: number[] = [];

    // Find local peaks
    for (let i = order; i < prices.length - order; i++) {
      let isPeak = true;
      let isLow = true;
      
      // Check if current point is higher than surrounding points (peak)
      for (let j = i - order; j <= i + order; j++) {
        if (j !== i && prices[j] >= prices[i]) {
          isPeak = false;
        }
        if (j !== i && prices[j] <= prices[i]) {
          isLow = false;
        }
      }
      
      if (isPeak) {
        peaks.push(i);
        peakValues.push(prices[i]);
      }
      
      if (isLow) {
        lows.push(i);
        lowValues.push(prices[i]);
      }
    }

    return { peaks, lows, peakValues, lowValues };
  }

  static detectDivergence(
    prices: number[], 
    indicator: number[], 
    dates: string[], 
    order: number = 5
  ): DivergenceData[] {
    const divergences: DivergenceData[] = [];
    
    // Find peaks and lows for both price and indicator
    const pricePeaksLows = this.identifyPeaksLows(prices, order);
    const indicatorPeaksLows = this.identifyPeaksLows(indicator, order);
    
    // Check for bearish divergence: Price makes higher high, indicator makes lower high
    for (let i = 1; i < pricePeaksLows.peaks.length; i++) {
      const p1 = pricePeaksLows.peaks[i - 1];
      const p2 = pricePeaksLows.peaks[i];
      
      // Find corresponding indicator peaks
      const ind1 = this.findClosestIndex(indicatorPeaksLows.peaks, p1);
      const ind2 = this.findClosestIndex(indicatorPeaksLows.peaks, p2);
      
      if (ind1 !== -1 && ind2 !== -1) {
        const priceHigh1 = prices[p1];
        const priceHigh2 = prices[p2];
        const indHigh1 = indicator[indicatorPeaksLows.peaks[ind1]];
        const indHigh2 = indicator[indicatorPeaksLows.peaks[ind2]];
        
        if (priceHigh2 > priceHigh1 && indHigh2 < indHigh1) {
          divergences.push({
            startIndex: p1,
            endIndex: p2,
            type: 'bearish',
            startDate: dates[p1],
            endDate: dates[p2],
            startPrice: priceHigh1,
            endPrice: priceHigh2,
            startIndicator: indHigh1,
            endIndicator: indHigh2
          });
        }
      }
    }
    
    // Check for bullish divergence: Price makes lower low, indicator makes higher low
    for (let i = 1; i < pricePeaksLows.lows.length; i++) {
      const l1 = pricePeaksLows.lows[i - 1];
      const l2 = pricePeaksLows.lows[i];
      
      // Find corresponding indicator lows
      const ind1 = this.findClosestIndex(indicatorPeaksLows.lows, l1);
      const ind2 = this.findClosestIndex(indicatorPeaksLows.lows, l2);
      
      if (ind1 !== -1 && ind2 !== -1) {
        const priceLow1 = prices[l1];
        const priceLow2 = prices[l2];
        const indLow1 = indicator[indicatorPeaksLows.lows[ind1]];
        const indLow2 = indicator[indicatorPeaksLows.lows[ind2]];
        
        if (priceLow2 < priceLow1 && indLow2 > indLow1) {
          divergences.push({
            startIndex: l1,
            endIndex: l2,
            type: 'bullish',
            startDate: dates[l1],
            endDate: dates[l2],
            startPrice: priceLow1,
            endPrice: priceLow2,
            startIndicator: indLow1,
            endIndicator: indLow2
          });
        }
      }
    }
    
    return divergences;
  }
  
  static calculatePriceStats(prices: number[]): PriceStats {
    const currentPrice = prices[prices.length - 1];
    const allTimeHigh = Math.max(...prices);
    const allTimeLow = Math.min(...prices);
    
    const distanceFromHigh = currentPrice - allTimeHigh;
    const distanceFromLow = currentPrice - allTimeLow;
    const distanceFromHighPercent = ((currentPrice - allTimeHigh) / allTimeHigh) * 100;
    const distanceFromLowPercent = ((currentPrice - allTimeLow) / allTimeLow) * 100;
    
    return {
      currentPrice,
      allTimeHigh,
      allTimeLow,
      distanceFromHigh,
      distanceFromLow,
      distanceFromHighPercent,
      distanceFromLowPercent
    };
  }
  
  private static findClosestIndex(array: number[], target: number): number {
    let closest = -1;
    let minDistance = Infinity;
    
    for (let i = 0; i < array.length; i++) {
      const distance = Math.abs(array[i] - target);
      if (distance < minDistance) {
        minDistance = distance;
        closest = i;
      }
    }
    
    return closest;
  }
}
