import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { ChartData } from '@/types/analysis';
import { useLiveData } from '@/services/liveDataService';
import { useLiveIndicators } from '@/utils/liveIndicators';
import { useLivePatterns } from '@/utils/livePatternRecognition';

// ===== TYPES & INTERFACES =====

export interface LiveChartContextValue {
  // Data
  chartData: ChartData[];
  indicators: any;
  patterns: any;
  latestValues: any;
  latestPatterns: any;
  
  // State
  isLive: boolean;
  isConnected: boolean;
  isLoading: boolean;
  isCalculating: boolean;
  isDetecting: boolean;
  error: string | null;
  
  // Actions
  refetch: () => void;
  recalculate: () => void;
  redetect: () => void;
  
  // Metadata
  token: string;
  timeframe: string;
  lastUpdate: number;
}

export interface LiveChartProviderProps {
  token: string;
  timeframe: string;
  children: ReactNode;
  autoConnect?: boolean;
  maxDataPoints?: number;
  updateInterval?: number;
}

// ===== CONTEXT =====

const LiveChartContext = createContext<LiveChartContextValue | null>(null);

function useLiveChart() {
  const context = useContext(LiveChartContext);
  if (!context) {
    throw new Error('useLiveChart must be used within a LiveChartProvider');
  }
  return context;
}

// ===== PROVIDER COMPONENT =====

export function LiveChartProvider({ 
  token, 
  timeframe, 
  children, 
  autoConnect = true,
  maxDataPoints = 1000,
  updateInterval = 1000
}: LiveChartProviderProps) {
  // Live data hook
  const {
    data: chartData,
    isLive,
    isConnected,
    error,
    isLoading,
    refetch
  } = useLiveData(token, timeframe);

  // Local state
  const [lastUpdate, setLastUpdate] = useState(0);
  const [optimizedData, setOptimizedData] = useState<ChartData[]>([]);

  // Optimize data for performance
  useEffect(() => {
    if (chartData.length > maxDataPoints) {
      setOptimizedData(chartData.slice(-maxDataPoints));
    } else {
      setOptimizedData(chartData);
    }
    setLastUpdate(Date.now());
  }, [chartData, maxDataPoints]);

  // Live indicators hook
  const {
    indicators,
    latestValues,
    isCalculating,
    recalculate
  } = useLiveIndicators(token, optimizedData);

  // Live patterns hook
  const {
    patterns,
    latestPatterns,
    isDetecting,
    redetect
  } = useLivePatterns(token, optimizedData);

  // Optimize data for performance
  useEffect(() => {
    if (chartData.length > maxDataPoints) {
      setOptimizedData(chartData.slice(-maxDataPoints));
    } else {
      setOptimizedData(chartData);
    }
    setLastUpdate(Date.now());
  }, [chartData, maxDataPoints]);

  // Auto-connect if enabled
  useEffect(() => {
    if (autoConnect && !isConnected && !isLoading) {
      refetch();
    }
  }, [autoConnect, isConnected, isLoading, refetch]);

  // Periodic updates for live data
  useEffect(() => {
    if (!isLive || !isConnected) return;

    const interval = setInterval(() => {
      setLastUpdate(Date.now());
    }, updateInterval);

    return () => clearInterval(interval);
  }, [isLive, isConnected, updateInterval]);

  // Error handling
  useEffect(() => {
    if (error) {
      console.error('LiveChartProvider error:', error);
    }
  }, [error]);

  // Context value
  const contextValue: LiveChartContextValue = {
    // Data
    chartData: optimizedData,
    indicators,
    patterns,
    latestValues,
    latestPatterns,
    
    // State
    isLive,
    isConnected,
    isLoading,
    isCalculating,
    isDetecting,
    error,
    
    // Actions
    refetch,
    recalculate,
    redetect,
    
    // Metadata
    token,
    timeframe,
    lastUpdate
  };

  return (
    <LiveChartContext.Provider value={contextValue}>
      {children}
    </LiveChartContext.Provider>
  );
}

// ===== HOOKS FOR SPECIFIC DATA =====
// Note: useLiveIndicators and useLivePatterns are imported from their respective utility files
// to avoid circular dependencies with the LiveChartProvider context

// ===== UTILITY COMPONENTS =====

interface LiveChartStatusProps {
  className?: string;
}

function LiveChartStatus({ className = '' }: LiveChartStatusProps) {
  const { isLive, isConnected, isLoading, error } = useLiveChart();

  if (isLoading) {
    return (
      <div className={`flex items-center space-x-2 text-yellow-600 ${className}`}>
        <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
        <span className="text-sm">Connecting...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center space-x-2 text-red-600 ${className}`}>
        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
        <span className="text-sm">Error: {error}</span>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className={`flex items-center space-x-2 text-gray-600 ${className}`}>
        <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
        <span className="text-sm">Disconnected</span>
      </div>
    );
  }

  if (isLive) {
    return (
      <div className={`flex items-center space-x-2 text-green-600 ${className}`}>
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <span className="text-sm">Live</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-2 text-blue-600 ${className}`}>
      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
      <span className="text-sm">Connected</span>
    </div>
  );
}

interface LiveChartControlsProps {
  className?: string;
}

function LiveChartControls({ className = '' }: LiveChartControlsProps) {
  const { refetch, recalculate, redetect, isConnected } = useLiveChart();

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <button
        onClick={refetch}
        disabled={!isConnected}
        className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Refresh
      </button>
      <button
        onClick={recalculate}
        disabled={!isConnected}
        className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Recalc
      </button>
      <button
        onClick={redetect}
        disabled={!isConnected}
        className="px-2 py-1 text-xs bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Patterns
      </button>
    </div>
  );
}

// ===== HIGHER-ORDER COMPONENT =====

function withLiveChart<P extends object>(
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

// ===== EXPORT ALL =====

export {
  LiveChartProvider as default,
  useLiveChart,
  LiveChartStatus,
  LiveChartControls
}; 