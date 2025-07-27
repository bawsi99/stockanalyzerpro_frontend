import React from 'react';
import { LiveChartProvider, LiveChartContextValue } from './LiveChartProvider';

// ===== HIGHER-ORDER COMPONENT =====

export function withLiveChart<P extends object>(
  WrappedComponent: React.ComponentType<P & LiveChartContextValue>
) {
  return function WithLiveChartComponent(props: P) {
    return (
      <LiveChartProvider token="" timeframe="">
        <WrappedComponent {...props} />
      </LiveChartProvider>
    );
  };
} 