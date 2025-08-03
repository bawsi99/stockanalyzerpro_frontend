// Performance monitoring utility for stock selector
class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();
  private timers: Map<string, number> = new Map();

  // Start timing an operation
  startTimer(operation: string): void {
    this.timers.set(operation, performance.now());
  }

  // End timing and record the duration
  endTimer(operation: string): number {
    const startTime = this.timers.get(operation);
    if (!startTime) {
      // Don't log warning for operations that might have been cleared due to component unmount
      // Only log if it's a genuine issue (operation exists but no start time)
      if (this.timers.has(operation)) {
        // console.warn(`Timer for operation "${operation}" was not started`);
      }
      return 0;
    }

    const duration = performance.now() - startTime;
    this.timers.delete(operation);

    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, []);
    }
    this.metrics.get(operation)!.push(duration);

    return duration;
  }

  // Get average time for an operation
  getAverageTime(operation: string): number {
    const times = this.metrics.get(operation);
    if (!times || times.length === 0) return 0;
    
    return times.reduce((sum, time) => sum + time, 0) / times.length;
  }

  // Get all metrics
  getAllMetrics(): Record<string, { avg: number; count: number; min: number; max: number }> {
    const result: Record<string, { avg: number; count: number; min: number; max: number }> = {};
    
    this.metrics.forEach((times, operation) => {
      const avg = times.reduce((sum, time) => sum + time, 0) / times.length;
      const min = Math.min(...times);
      const max = Math.max(...times);
      
      result[operation] = {
        avg: Math.round(avg * 100) / 100,
        count: times.length,
        min: Math.round(min * 100) / 100,
        max: Math.round(max * 100) / 100
      };
    });
    
    return result;
  }

  // Clear all metrics
  clearMetrics(): void {
    this.metrics.clear();
    this.timers.clear();
  }

  // Clear timer for a specific operation (useful for cleanup)
  clearTimer(operation: string): void {
    this.timers.delete(operation);
  }

  // Clear timers for operations matching a pattern (useful for cleanup)
  clearTimersByPattern(pattern: string): void {
    const operationsToDelete: string[] = [];
    this.timers.forEach((_, operation) => {
      if (operation.includes(pattern)) {
        operationsToDelete.push(operation);
      }
    });
    operationsToDelete.forEach(operation => this.timers.delete(operation));
  }

  // Log performance report
  logReport(): void {
    const metrics = this.getAllMetrics();
    // console.group('🚀 Stock Selector Performance Report');
    
    Object.entries(metrics).forEach(([operation, data]) => {
      // console.log(`${operation}:`, {
      //   average: `${data.avg}ms`,
      //   count: data.count,
      //   min: `${data.min}ms`,
      //   max: `${data.max}ms`
      // });
    });
    
    // console.groupEnd();
  }

  // Monitor API calls specifically
  monitorApiCall<T>(key: string, apiCall: () => Promise<T>): Promise<T> {
    // Check if timer already exists (race condition)
    if (this.timers.has(key)) {
      // console.warn(`Timer for operation "${key}" already exists, clearing previous timer`);
      this.timers.delete(key);
    }
    
    this.startTimer(key);
    
    return apiCall()
      .then(result => {
        this.endTimer(key);
        return result;
      })
      .catch(error => {
        this.endTimer(key);
        throw error;
      });
  }
}

// Create singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Performance decorator for functions
export function measurePerformance(operation: string) {
  return function (target: unknown, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = function (...args: unknown[]) {
      performanceMonitor.startTimer(operation);
      const result = method.apply(this, args);
      performanceMonitor.endTimer(operation);
      return result;
    };
  };
}

// React hook for measuring component performance
export function usePerformanceMonitor(componentName: string) {
  const startRender = () => {
    performanceMonitor.startTimer(`${componentName}_render`);
  };

  const endRender = () => {
    performanceMonitor.endTimer(`${componentName}_render`);
  };

  return { startRender, endRender };
}

// Utility to measure async operations
export async function measureAsync<T>(
  operation: string, 
  asyncFn: () => Promise<T>
): Promise<T> {
  performanceMonitor.startTimer(operation);
  try {
    const result = await asyncFn();
    return result;
  } finally {
    performanceMonitor.endTimer(operation);
  }
} 