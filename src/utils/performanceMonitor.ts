class PerformanceMonitor {
  private metrics = new Map<string, number[]>();
  private alerts = new Map<string, number>();

  startTimer(key: string) {
    this.metrics.set(key, [performance.now()]);
  }

  endTimer(key: string) {
    const times = this.metrics.get(key);
    if (times && times.length > 0) {
      const duration = performance.now() - times[0];
      times.push(duration);
      
      // Keep only last 10 measurements
      if (times.length > 10) {
        times.splice(0, 2); // Remove start time and oldest measurement
      }
      
      console.log(`⏱️ ${key}: ${duration.toFixed(2)}ms`);
      
      // Alert if performance degrades
      const avg = times.slice(1).reduce((a, b) => a + b, 0) / (times.length - 1);
      if (duration > avg * 2) {
        const alertCount = this.alerts.get(key) || 0;
        this.alerts.set(key, alertCount + 1);
        console.warn(`⚠️ Performance degradation detected for ${key} (${alertCount + 1} alerts)`);
      }
    }
  }

  getAverageTime(key: string): number {
    const times = this.metrics.get(key);
    if (!times || times.length < 2) return 0;
    
    return times.slice(1).reduce((a, b) => a + b, 0) / (times.length - 1);
  }

  getMetrics(): Record<string, { avg: number; count: number; alerts: number }> {
    const result: Record<string, { avg: number; count: number; alerts: number }> = {};
    
    for (const [key, times] of this.metrics) {
      result[key] = {
        avg: this.getAverageTime(key),
        count: times.length - 1, // Subtract 1 for start time
        alerts: this.alerts.get(key) || 0
      };
    }
    
    return result;
  }

  clearMetrics(key?: string) {
    if (key) {
      this.metrics.delete(key);
      this.alerts.delete(key);
    } else {
      this.metrics.clear();
      this.alerts.clear();
    }
  }

  // Monitor API calls specifically
  monitorApiCall<T>(key: string, apiCall: () => Promise<T>): Promise<T> {
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

export const performanceMonitor = new PerformanceMonitor(); 