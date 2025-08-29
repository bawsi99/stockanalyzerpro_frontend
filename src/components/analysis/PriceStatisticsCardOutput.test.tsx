import React from 'react';
import { render, screen } from '@testing-library/react';
import PriceStatisticsCardOutput from './PriceStatisticsCardOutput';

// Mock the number formatter utilities
jest.mock('@/utils/numberFormatter', () => ({
  formatCurrency: jest.fn((value: number) => `₹${value.toFixed(2)}`),
  formatPercentage: jest.fn((value: number) => `${(value * 100).toFixed(2)}%`),
  formatPercentageValue: jest.fn((value: number) => `${value.toFixed(2)}%`),
  formatPriceChange: jest.fn((value: number) => `${value >= 0 ? '+' : ''}₹${value.toFixed(2)}`),
}));

describe('PriceStatisticsCardOutput', () => {
  const mockSummaryStats = {
    mean: 100,
    max: 150,
    min: 50,
    current: 80,
    distFromMean: -20, // Current price is 20 below mean
    distFromMax: -70,  // Current price is 70 below max
    distFromMin: 30,   // Current price is 30 above min
    distFromMeanPct: -20, // -20% from mean
    distFromMaxPct: -46.67, // -46.67% from max
    distFromMinPct: 60, // +60% from min
  };

  it('should display deviation from mean correctly with negative values', () => {
    render(
      <PriceStatisticsCardOutput
        summaryStats={mockSummaryStats}
        latestPrice={80}
        timeframe="1 Day"
      />
    );

    // Check that deviation from mean shows the correct negative value
    expect(screen.getByText('Deviation from Mean')).toBeInTheDocument();
    
    // The value should show -₹20.00 (negative deviation)
    expect(screen.getByText('-₹20.00')).toBeInTheDocument();
    
    // The percentage should show -20.00%
    expect(screen.getByText('-20.00%')).toBeInTheDocument();
  });

  it('should display distance from high correctly', () => {
    render(
      <PriceStatisticsCardOutput
        summaryStats={mockSummaryStats}
        latestPrice={80}
        timeframe="1 Day"
      />
    );

    expect(screen.getByText('Distance from High')).toBeInTheDocument();
    
    // Should show absolute value (70) since distance is always positive
    expect(screen.getByText('₹70.00')).toBeInTheDocument();
    
    // Percentage should show -46.67%
    expect(screen.getByText('-46.67%')).toBeInTheDocument();
  });

  it('should display distance from low correctly', () => {
    render(
      <PriceStatisticsCardOutput
        summaryStats={mockSummaryStats}
        latestPrice={80}
        timeframe="1 Day"
      />
    );

    expect(screen.getByText('Distance from Low')).toBeInTheDocument();
    
    // Should show positive value (30)
    expect(screen.getByText('₹30.00')).toBeInTheDocument();
    
    // Percentage should show +60.00%
    expect(screen.getByText('+60.00%')).toBeInTheDocument();
  });

  it('should handle edge case with zero values', () => {
    const zeroStats = {
      mean: 0,
      max: 0,
      min: 0,
      current: 0,
      distFromMean: 0,
      distFromMax: 0,
      distFromMin: 0,
      distFromMeanPct: 0,
      distFromMaxPct: 0,
      distFromMinPct: 0,
    };

    render(
      <PriceStatisticsCardOutput
        summaryStats={zeroStats}
        latestPrice={0}
        timeframe="1 Day"
      />
    );

    // Should not crash and should display 0 values
    expect(screen.getByText('Deviation from Mean')).toBeInTheDocument();
  });

  it('should show loading state when no summary stats', () => {
    render(
      <PriceStatisticsCardOutput
        summaryStats={null}
        latestPrice={null}
        timeframe="1 Day"
      />
    );

    expect(screen.getByText('Loading price statistics...')).toBeInTheDocument();
  });
});
