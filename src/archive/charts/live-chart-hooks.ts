import { useContext } from 'react';
import { LiveChartContext } from './LiveChartProvider';

export function useLiveChart() {
  const context = useContext(LiveChartContext);
  if (!context) {
    throw new Error('useLiveChart must be used within a LiveChartProvider');
  }
  return context;
} 