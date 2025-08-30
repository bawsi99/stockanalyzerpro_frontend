import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

interface SelectedStockState {
  // Current selected stock
  selectedStock: string;
  
  // Source of the selection (for debugging/tracking)
  selectionSource: 'analysis' | 'charts' | 'manual' | 'initial';
  
  // Actions
  setSelectedStock: (stock: string, source: 'analysis' | 'charts' | 'manual' | 'initial') => void;
  clearSelection: () => void;
  
  // Getter for current stock
  getCurrentStock: () => string;
}

export const useSelectedStockStore = create<SelectedStockState>()(
  subscribeWithSelector((set, get) => ({
    // Initialize with localStorage value or default
    selectedStock: (() => {
      const stored = localStorage.getItem('lastAnalyzedStock');
      return stored || 'NIFTY 50';
    })(),
    
    selectionSource: 'initial',
    
    setSelectedStock: (stock: string, source: 'analysis' | 'charts' | 'manual' | 'initial') => {
      const upperCaseStock = stock.toUpperCase();
      set({ selectedStock: upperCaseStock, selectionSource: source });
      
      // Persist to localStorage for page refresh consistency
      localStorage.setItem('lastAnalyzedStock', upperCaseStock);
      
      // Log for debugging
      console.log(`📊 Stock selection changed to: ${upperCaseStock} (source: ${source})`);
    },
    
    clearSelection: () => {
      set({ selectedStock: '', selectionSource: 'initial' });
      localStorage.removeItem('lastAnalyzedStock');
    },
    
    getCurrentStock: () => {
      return get().selectedStock;
    }
  }))
);

// Subscribe to store changes and log them
useSelectedStockStore.subscribe(
  (state) => state.selectedStock,
  (selectedStock, previousStock) => {
    if (selectedStock !== previousStock) {
      console.log(`🔄 Stock selection updated: ${previousStock} → ${selectedStock}`);
    }
  }
);
