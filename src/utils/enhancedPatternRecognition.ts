export interface EnhancedDivergenceData {
  startIndex: number;
  endIndex: number;
  type: 'bullish' | 'bearish';
  startDate: string;
  endDate: string;
  startPrice: number;
  endPrice: number;
  startIndicator: number;
  endIndicator: number;
  strength: 'weak' | 'moderate' | 'strong';
  confidence: number;
  priceChange: number;
  indicatorChange: number;
  duration: number;
}

export interface DivergencePattern {
  priceDirection: 'up' | 'down';
  indicatorDirection: 'up' | 'down';
  divergenceType: 'bullish' | 'bearish';
  strength: number;
}

export class EnhancedPatternRecognition {
  private static findPeaksLows(data: number[], order: number, type: 'peaks' | 'lows'): number[] {
    const result: number[] = [];
    for (let i = order; i < data.length - order; i++) {
      let isPeak = true;
      for (let j = 1; j <= order; j++) {
        if (type === 'peaks') {
          if (data[i] <= data[i - j] || data[i] <= data[i + j]) {
            isPeak = false;
            break;
          }
        } else {
          if (data[i] >= data[i - j] || data[i] >= data[i + j]) {
            isPeak = false;
            break;
          }
        }
      }
      if (isPeak) {
        result.push(i);
      }
    }
    return result;
  }

  private static findClosestPeak(peaks: number[], targetIndex: number, window: number): number {
    let closest = -1;
    let minDiff = window;
    
    for (const peak of peaks) {
      const diff = Math.abs(peak - targetIndex);
      if (diff < minDiff) {
        minDiff = diff;
        closest = peak;
      }
    }
    
    return closest;
  }

  private static calculateDivergenceStrength(priceChange: number, indicatorChange: number, basePrice: number, baseIndicator: number): number {
    const pricePercent = Math.abs(priceChange) / basePrice;
    const indicatorPercent = Math.abs(indicatorChange) / baseIndicator;
    return pricePercent + indicatorPercent;
  }

  private static classifyStrength(strength: number): 'weak' | 'moderate' | 'strong' {
    if (strength > 0.05) return 'strong';
    if (strength > 0.02) return 'moderate';
    return 'weak';
  }

  private static calculateConfidence(priceChange: number, indicatorChange: number): number {
    // Calculate confidence based on the magnitude and consistency of the divergence
    const priceMagnitude = Math.abs(priceChange);
    const indicatorMagnitude = Math.abs(indicatorChange);
    
    // Normalize the changes to a 0-100 scale
    const normalizedPrice = Math.min(priceMagnitude * 100, 100);
    const normalizedIndicator = Math.min(indicatorMagnitude * 100, 100);
    
    // Calculate confidence as the average of normalized values
    return (normalizedPrice + normalizedIndicator) / 2;
  }

  static detectEnhancedDivergences(
    prices: number[],
    indicator: number[],
    dates: string[],
    order: number = 3,
    minDivergenceStrength: number = 0.01,
    window_size: number = 5
  ): EnhancedDivergenceData[] {
    const divergences: EnhancedDivergenceData[] = [];
    const minLength = Math.min(prices.length, indicator.length);
    
    // Find all local peaks and lows with improved sensitivity
    const pricePeaks = this.findPeaksLows(prices, order, 'peaks');
    const priceLows = this.findPeaksLows(prices, order, 'lows');
    const indicatorPeaks = this.findPeaksLows(indicator, order, 'peaks');
    const indicatorLows = this.findPeaksLows(indicator, order, 'lows');
    
    // Check for bearish divergences (price higher highs, indicator lower highs)
    for (let i = 1; i < pricePeaks.length; i++) {
      const p1Index = pricePeaks[i - 1];
      const p2Index = pricePeaks[i];
      
      if (p1Index >= minLength || p2Index >= minLength || p1Index >= p2Index) continue;
      
      // Find corresponding indicator peaks within a configurable window
      const indPeak1 = this.findClosestPeak(indicatorPeaks, p1Index, window_size);
      const indPeak2 = this.findClosestPeak(indicatorPeaks, p2Index, window_size);
      
      if (indPeak1 !== -1 && indPeak2 !== -1) {
        const priceChange = prices[p2Index] - prices[p1Index];
        const indicatorChange = indicator[indPeak2] - indicator[indPeak1];
        
        // Bearish divergence: price goes up, indicator goes down
        if (priceChange > 0 && indicatorChange < 0) {
          const strength = this.calculateDivergenceStrength(priceChange, indicatorChange, prices[p1Index], indicator[indPeak1]);
          
          if (Math.abs(strength) > minDivergenceStrength) {
            divergences.push({
              startIndex: p1Index,
              endIndex: p2Index,
              type: 'bearish',
              startDate: dates[p1Index],
              endDate: dates[p2Index],
              startPrice: prices[p1Index],
              endPrice: prices[p2Index],
              startIndicator: indicator[indPeak1],
              endIndicator: indicator[indPeak2],
              strength: this.classifyStrength(strength),
              confidence: this.calculateConfidence(priceChange, indicatorChange),
              priceChange,
              indicatorChange,
              duration: p2Index - p1Index
            });
          }
        }
      }
    }
    
    // Check for bullish divergences (price lower lows, indicator higher lows)
    for (let i = 1; i < priceLows.length; i++) {
      const l1Index = priceLows[i - 1];
      const l2Index = priceLows[i];
      
      if (l1Index >= minLength || l2Index >= minLength || l1Index >= l2Index) continue;
      
      const indLow1 = this.findClosestPeak(indicatorLows, l1Index, window_size);
      const indLow2 = this.findClosestPeak(indicatorLows, l2Index, window_size);
      
      if (indLow1 !== -1 && indLow2 !== -1) {
        const priceChange = prices[l2Index] - prices[l1Index];
        const indicatorChange = indicator[indLow2] - indicator[indLow1];
        
        // Bullish divergence: price goes down, indicator goes up
        if (priceChange < 0 && indicatorChange > 0) {
          const strength = this.calculateDivergenceStrength(priceChange, indicatorChange, prices[l1Index], indicator[indLow1]);
          
          if (Math.abs(strength) > minDivergenceStrength) {
            divergences.push({
              startIndex: l1Index,
              endIndex: l2Index,
              type: 'bullish',
              startDate: dates[l1Index],
              endDate: dates[l2Index],
              startPrice: prices[l1Index],
              endPrice: prices[l2Index],
              startIndicator: indicator[indLow1],
              endIndicator: indicator[indLow2],
              strength: this.classifyStrength(strength),
              confidence: this.calculateConfidence(Math.abs(priceChange), Math.abs(indicatorChange)),
              priceChange,
              indicatorChange,
              duration: l2Index - l1Index
            });
          }
        }
      }
    }
    
    return divergences.sort((a, b) => a.startIndex - b.startIndex);
  }
}
