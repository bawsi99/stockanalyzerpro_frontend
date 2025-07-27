import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { liveDataService, RealCandlestickData, ChartDataPoint } from '@/services/liveDataService';

interface DataState {
  // Historical data cache
  historicalData: Map<string, HistoricalDataCache>;
  
  // Live data state
  liveData: Map<string, LiveDataCache>;
  
  // Loading states
  loadingStates: Map<string, boolean>;
  
  // Error states
  errors: Map<string, string | null>;
  
  // Actions
  fetchHistoricalData: (params: FetchParams) => Promise<void>;
  updateLiveData: (symbol: string, data: RealCandlestickData) => void;
  clearCache: (symbol?: string) => void;
  setLoading: (key: string, loading: boolean) => void;
  setError: (key: string, error: string | null) => void;
}

interface HistoricalDataCache {
  data: RealCandlestickData[];
  timestamp: number;
  timeframe: string;
  symbol: string;
  exchange: string;
}

interface LiveDataCache {
  data: RealCandlestickData[];
  lastUpdate: number;
  isConnected: boolean;
}

interface FetchParams {
  symbol: string;
  timeframe: string;
  exchange: string;
  limit: number;
  forceRefresh?: boolean;
}

export const useDataStore = create<DataState>()(
  subscribeWithSelector((set, get) => ({
    historicalData: new Map(),
    liveData: new Map(),
    loadingStates: new Map(),
    errors: new Map(),

    fetchHistoricalData: async (params) => {
      const { symbol, timeframe, exchange, limit, forceRefresh = false } = params;
      const cacheKey = `${symbol}-${timeframe}-${exchange}-${limit}`;
      
      const state = get();
      const cached = state.historicalData.get(cacheKey);
      
      // Check if we have valid cached data
      const isCacheValid = cached && 
        Date.now() - cached.timestamp < 5 * 60 * 1000 && // 5 minutes
        !forceRefresh;
      
      if (isCacheValid) {
        console.log(`📦 Using cached data for ${symbol}`);
        return;
      }
      
      // Set loading state
      set(state => {
        const newLoadingStates = new Map(state.loadingStates);
        newLoadingStates.set(cacheKey, true);
        return { loadingStates: newLoadingStates };
      });
      
      try {
        const data = await liveDataService.getHistoricalData(symbol, timeframe, exchange, limit);
        
        // Update cache
        set(state => {
          const newHistoricalData = new Map(state.historicalData);
          newHistoricalData.set(cacheKey, {
            data,
            timestamp: Date.now(),
            timeframe,
            symbol,
            exchange
          });
          
          const newLoadingStates = new Map(state.loadingStates);
          newLoadingStates.set(cacheKey, false);
          
          const newErrors = new Map(state.errors);
          newErrors.set(cacheKey, null);
          
          return {
            historicalData: newHistoricalData,
            loadingStates: newLoadingStates,
            errors: newErrors
          };
        });
        
      } catch (error) {
        set(state => {
          const newLoadingStates = new Map(state.loadingStates);
          newLoadingStates.set(cacheKey, false);
          
          const newErrors = new Map(state.errors);
          newErrors.set(cacheKey, error instanceof Error ? error.message : 'Unknown error');
          
          return {
            loadingStates: newLoadingStates,
            errors: newErrors
          };
        });
      }
    },

    updateLiveData: (symbol, data) => {
      set(state => {
        const newLiveData = new Map(state.liveData);
        newLiveData.set(symbol, {
          data,
          lastUpdate: Date.now(),
          isConnected: true
        });
        return { liveData: newLiveData };
      });
    },

    clearCache: (symbol) => {
      set(state => {
        const newHistoricalData = new Map(state.historicalData);
        const newLiveData = new Map(state.liveData);
        
        if (symbol) {
          // Clear specific symbol
          for (const [key] of newHistoricalData) {
            if (key.startsWith(symbol)) {
              newHistoricalData.delete(key);
            }
          }
          newLiveData.delete(symbol);
        } else {
          // Clear all
          newHistoricalData.clear();
          newLiveData.clear();
        }
        
        return {
          historicalData: newHistoricalData,
          liveData: newLiveData
        };
      });
    },

    setLoading: (key, loading) => {
      set(state => {
        const newLoadingStates = new Map(state.loadingStates);
        newLoadingStates.set(key, loading);
        return { loadingStates: newLoadingStates };
      });
    },

    setError: (key, error) => {
      set(state => {
        const newErrors = new Map(state.errors);
        newErrors.set(key, error);
        return { errors: newErrors };
      });
    }
  }))
); 