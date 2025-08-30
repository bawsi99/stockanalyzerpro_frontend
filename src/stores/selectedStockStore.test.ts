import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useSelectedStockStore } from './selectedStockStore';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('SelectedStockStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store to initial state
    useSelectedStockStore.getState().clearSelection();
  });

  it('should initialize with default stock when localStorage is empty', () => {
    localStorageMock.getItem.mockReturnValue(null);
    
    const store = useSelectedStockStore.getState();
    expect(store.getCurrentStock()).toBe('NIFTY 50');
  });

  it('should initialize with stored stock from localStorage', () => {
    localStorageMock.getItem.mockReturnValue('RELIANCE');
    
    const store = useSelectedStockStore.getState();
    expect(store.getCurrentStock()).toBe('RELIANCE');
  });

  it('should set selected stock and persist to localStorage', () => {
    const store = useSelectedStockStore.getState();
    
    store.setSelectedStock('INFY', 'analysis');
    
    expect(store.getCurrentStock()).toBe('INFY');
    expect(store.selectionSource).toBe('analysis');
    expect(localStorageMock.setItem).toHaveBeenCalledWith('lastAnalyzedStock', 'INFY');
  });

  it('should convert stock symbols to uppercase', () => {
    const store = useSelectedStockStore.getState();
    
    store.setSelectedStock('tcs', 'charts');
    
    expect(store.getCurrentStock()).toBe('TCS');
    expect(localStorageMock.setItem).toHaveBeenCalledWith('lastAnalyzedStock', 'TCS');
  });

  it('should clear selection and remove from localStorage', () => {
    const store = useSelectedStockStore.getState();
    
    // First set a stock
    store.setSelectedStock('HDFC', 'manual');
    expect(store.getCurrentStock()).toBe('HDFC');
    
    // Then clear it
    store.clearSelection();
    
    expect(store.getCurrentStock()).toBe('');
    expect(store.selectionSource).toBe('initial');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('lastAnalyzedStock');
  });

  it('should track selection source correctly', () => {
    const store = useSelectedStockStore.getState();
    
    store.setSelectedStock('WIPRO', 'analysis');
    expect(store.selectionSource).toBe('analysis');
    
    store.setSelectedStock('WIPRO', 'charts');
    expect(store.selectionSource).toBe('charts');
    
    store.setSelectedStock('WIPRO', 'manual');
    expect(store.selectionSource).toBe('manual');
  });
});
