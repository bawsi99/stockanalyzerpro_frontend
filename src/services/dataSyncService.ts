// Remove the circular import
// import { useDataStore } from '@/stores/dataStore';

class DataSyncService {
  private syncIntervals = new Map<string, NodeJS.Timeout>();
  private readonly SYNC_INTERVALS = {
    '1min': 30 * 1000,    // 30 seconds
    '5min': 2 * 60 * 1000, // 2 minutes
    '15min': 5 * 60 * 1000, // 5 minutes
    '1h': 15 * 60 * 1000,   // 15 minutes
    '1d': 60 * 60 * 1000    // 1 hour
  };

  // Add a callback function to avoid circular dependency
  private fetchDataCallback?: (params: {
    symbol: string;
    timeframe: string;
    exchange: string;
    limit: number;
    forceRefresh?: boolean;
  }) => Promise<void>;

  setFetchDataCallback(callback: (params: {
    symbol: string;
    timeframe: string;
    exchange: string;
    limit: number;
    forceRefresh?: boolean;
  }) => Promise<void>) {
    this.fetchDataCallback = callback;
  }

  startSync(symbol: string, timeframe: string, exchange: string = 'NSE') {
    const key = `${symbol}-${timeframe}-${exchange}`;
    
    if (this.syncIntervals.has(key)) {
      return; // Already syncing
    }

    if (!this.fetchDataCallback) {
      // console.warn('DataSyncService: fetchDataCallback not set, cannot start sync');
      return;
    }

    const interval = this.SYNC_INTERVALS[timeframe as keyof typeof this.SYNC_INTERVALS] || 60 * 1000;
    
    const syncInterval = setInterval(async () => {
      try {
        await this.fetchDataCallback!({
          symbol,
          timeframe,
          exchange,
          limit: 1000,
          forceRefresh: true
        });
      } catch (error) {
        // console.error(`Background sync failed for ${key}:`, error);
      }
    }, interval);

    this.syncIntervals.set(key, syncInterval);
    // console.log(`🔄 Started background sync for ${key} (${interval}ms)`);
  }

  stopSync(symbol: string, timeframe: string, exchange: string = 'NSE') {
    const key = `${symbol}-${timeframe}-${exchange}`;
    const interval = this.syncIntervals.get(key);
    
    if (interval) {
      clearInterval(interval);
      this.syncIntervals.delete(key);
      // console.log(`⏹️ Stopped background sync for ${key}`);
    }
  }

  stopAllSync() {
    this.syncIntervals.forEach((interval, key) => {
      clearInterval(interval);
      // console.log(`⏹️ Stopped background sync for ${key}`);
    });
    this.syncIntervals.clear();
  }

  getActiveSyncs(): string[] {
    return Array.from(this.syncIntervals.keys());
  }

  isSyncing(symbol: string, timeframe: string, exchange: string = 'NSE'): boolean {
    const key = `${symbol}-${timeframe}-${exchange}`;
    return this.syncIntervals.has(key);
  }
}

export const dataSyncService = new DataSyncService(); 