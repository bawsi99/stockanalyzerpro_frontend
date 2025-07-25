/**
 * @deprecated This hook has been archived and is no longer in use.
 * The chart reset functionality has been integrated into the unified Charts page.
 * See: frontend/src/pages/Charts.tsx for the current implementation.
 * 
 * Archived on: 2024-07-25
 * Reason: Consolidated into unified chart system
 */

import { useRef, useCallback, useMemo } from 'react';

// Chart state interface that matches the existing chart components
export interface ChartState {
  visibleRange?: {
    from: number;
    to: number;
  };
  timeScale?: {
    rightOffset: number;
    barSpacing: number;
    fixLeftEdge: boolean;
    fixRightEdge: boolean;
    lockVisibleTimeRangeOnResize: boolean;
    rightBarStaysOnScroll: boolean;
    borderVisible: boolean;
    visible: boolean;
    timeVisible: boolean;
    secondsVisible: boolean;
  };
  priceScale?: {
    autoScale: boolean;
    scaleMargins: {
      top: number;
      bottom: number;
    };
  };
}

// Default chart state (initial state when chart is first loaded)
export const DEFAULT_CHART_STATE: ChartState = {
  timeScale: {
    rightOffset: 12,
    barSpacing: 3,
    fixLeftEdge: false,
    fixRightEdge: false,
    lockVisibleTimeRangeOnResize: false,
    rightBarStaysOnScroll: true,
    borderVisible: true,
    visible: true,
    timeVisible: true,
    secondsVisible: false,
  },
  priceScale: {
    autoScale: true,
    scaleMargins: {
      top: 0.1,
      bottom: 0.1,
    },
  },
};

export interface UseChartResetOptions {
  debug?: boolean;
  onReset?: () => void;
}

export interface UseChartResetReturn {
  // Chart references
  chartRef: React.MutableRefObject<any | null>;
  chartStateRef: React.MutableRefObject<ChartState>;
  
  // State management
  isInitialState: boolean;
  hasUserInteracted: boolean;
  
  // Functions
  saveChartState: () => void;
  restoreChartState: () => void;
  resetToInitialState: () => void;
  resetToFitContent: () => void;
  
  // Event handlers
  handleUserInteraction: () => void;
  handleChartUpdate: () => void;
}

export function useChartReset(options: UseChartResetOptions = {}): UseChartResetReturn {
  const { debug = false, onReset } = options;
  
  // Chart references
  const chartRef = useRef<any | null>(null);
  const chartStateRef = useRef<ChartState>({});
  const initialChartStateRef = useRef<ChartState>({});
  const hasUserInteractedRef = useRef<boolean>(false);
  const isInitialLoadRef = useRef<boolean>(true);

  // Save current chart state
  const saveChartState = useCallback(() => {
    if (!chartRef.current) return;

    try {
      const timeScale = chartRef.current.timeScale();
      const priceScale = chartRef.current.priceScale('right');
      
      const currentState: ChartState = {
        visibleRange: timeScale.getVisibleRange(),
        timeScale: {
          rightOffset: timeScale.options().rightOffset,
          barSpacing: timeScale.options().barSpacing,
          fixLeftEdge: timeScale.options().fixLeftEdge,
          fixRightEdge: timeScale.options().fixRightEdge,
          lockVisibleTimeRangeOnResize: timeScale.options().lockVisibleTimeRangeOnResize,
          rightBarStaysOnScroll: timeScale.options().rightBarStaysOnScroll,
          borderVisible: timeScale.options().borderVisible,
          visible: timeScale.options().visible,
          timeVisible: timeScale.options().timeVisible,
          secondsVisible: timeScale.options().secondsVisible,
        },
        priceScale: {
          autoScale: priceScale.options().autoScale,
          scaleMargins: priceScale.options().scaleMargins,
        }
      };

      chartStateRef.current = currentState;

      // Save initial state on first load
      if (isInitialLoadRef.current) {
        initialChartStateRef.current = { ...currentState };
        isInitialLoadRef.current = false;
        if (debug) {
          console.log('📊 Initial chart state saved:', initialChartStateRef.current);
        }
      }

      if (debug) {
        console.log('💾 Chart state saved:', currentState);
      }
    } catch (error) {
      console.warn('Error saving chart state:', error);
    }
  }, [debug]);

  // Restore chart state
  const restoreChartState = useCallback(() => {
    if (!chartRef.current || !chartStateRef.current.visibleRange) return;

    try {
      const timeScale = chartRef.current.timeScale();
      const priceScale = chartRef.current.priceScale('right');

      // Restore time scale options
      if (chartStateRef.current.timeScale) {
        timeScale.applyOptions(chartStateRef.current.timeScale);
      }

      // Restore price scale options
      if (chartStateRef.current.priceScale) {
        priceScale.applyOptions(chartStateRef.current.priceScale);
      }

      // Restore visible range
      timeScale.setVisibleRange(chartStateRef.current.visibleRange);

      if (debug) {
        console.log('🔄 Chart state restored:', chartStateRef.current);
      }
    } catch (error) {
      console.warn('Error restoring chart state:', error);
    }
  }, [debug]);

  // Reset to initial state (when chart was first loaded)
  const resetToInitialState = useCallback(() => {
    if (!chartRef.current) return;

    try {
      const timeScale = chartRef.current.timeScale();
      const priceScale = chartRef.current.priceScale('right');

      // Apply default chart state
      timeScale.applyOptions(DEFAULT_CHART_STATE.timeScale!);
      priceScale.applyOptions(DEFAULT_CHART_STATE.priceScale!);

      // Fit content to show all data
      timeScale.fitContent();

      // Clear saved state
      chartStateRef.current = {};
      hasUserInteractedRef.current = false;

      if (debug) {
        console.log('🔄 Chart reset to initial state');
      }

      // Call callback if provided
      onReset?.();
    } catch (error) {
      console.error('Error resetting chart to initial state:', error);
    }
  }, [debug, onReset]);

  // Reset to fit content (shows all data)
  const resetToFitContent = useCallback(() => {
    if (!chartRef.current) return;

    try {
      const timeScale = chartRef.current.timeScale();
      const priceScale = chartRef.current.priceScale('right');

      // Reset price scale to auto-scale
      priceScale.applyOptions({
        autoScale: true,
        scaleMargins: {
          top: 0.1,
          bottom: 0.1,
        },
      });

      // Fit content to show all data
      timeScale.fitContent();

      // Clear saved state
      chartStateRef.current = {};
      hasUserInteractedRef.current = false;

      if (debug) {
        console.log('📏 Chart reset to fit content');
      }

      // Call callback if provided
      onReset?.();
    } catch (error) {
      console.error('Error resetting chart to fit content:', error);
    }
  }, [debug, onReset]);

  // Handle user interaction (zoom, pan, etc.)
  const handleUserInteraction = useCallback(() => {
    hasUserInteractedRef.current = true;
    if (debug) {
      console.log('👆 User interaction detected');
    }
  }, [debug]);

  // Handle chart data updates
  const handleChartUpdate = useCallback(() => {
    // Save state before update
    saveChartState();
    
    // Restore state after update (if user has interacted)
    if (hasUserInteractedRef.current) {
      setTimeout(() => {
        restoreChartState();
      }, 0);
    }
  }, [saveChartState, restoreChartState]);

  // Computed values
  const isInitialState = useMemo(() => {
    return !hasUserInteractedRef.current && Object.keys(chartStateRef.current).length === 0;
  }, []);

  const hasUserInteracted = useMemo(() => {
    return hasUserInteractedRef.current;
  }, []);

  return {
    // Chart references
    chartRef,
    chartStateRef,
    
    // State management
    isInitialState,
    hasUserInteracted,
    
    // Functions
    saveChartState,
    restoreChartState,
    resetToInitialState,
    resetToFitContent,
    
    // Event handlers
    handleUserInteraction,
    handleChartUpdate,
  };
} 