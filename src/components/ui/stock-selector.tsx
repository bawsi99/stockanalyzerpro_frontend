import React, { useState, useMemo, useCallback, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command';

import { 
  getAllStocks, 
  searchStocks, 
  getStockBySymbol,
  waitForStockList
} from '@/services/stockDataService';

import { usePerformanceMonitor } from '@/utils/performanceMonitor';

export interface StockSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  label?: string;
}

export interface StockSelectorHandle {
  open: () => void;
  openWithQuery: (query: string) => void;
}

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Optimized stock list component with memoization
const StockList = React.memo<{
  stocks: ReturnType<typeof getAllStocks>;
  search: string;
  onSelect: (symbol: string) => void;
}>(({ stocks, search, onSelect }) => {
  return (
    <>
      {stocks.map((stock) => (
        <CommandItem
          key={`${stock.symbol}_${stock.exchange}`}
          value={stock.symbol}
          onSelect={() => onSelect(stock.symbol)}
          className="h-12"
        >
          <div className="flex items-center justify-between w-full">
            <div>
              <span className="font-semibold text-black">{stock.symbol}</span>
              <span className="ml-2 text-slate-600">{stock.name}</span>
            </div>
            <span className="text-xs text-slate-400">{stock.exchange}</span>
          </div>
        </CommandItem>
      ))}
    </>
  );
});

StockList.displayName = 'StockList';

export const StockSelector = forwardRef<StockSelectorHandle, StockSelectorProps>(({ 
  value,
  onValueChange,
  placeholder = "Select a stock",
  disabled = false,
  className = "",
  label
}, ref) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const inputRef = useRef<HTMLInputElement | null>(null);
  
  // Performance monitoring
  const { startRender, endRender } = usePerformanceMonitor('StockSelector');
  
  // Debounce search to reduce filtering operations (reduced delay for better responsiveness)
  const debouncedSearch = useDebounce(search, 100);

  // Memoize filtered stocks with better caching
  const filteredStocks = useMemo(() => {
    // Don't show stocks while loading
    if (isLoading) {
      return [];
    }
    if (!debouncedSearch.trim()) {
      return getAllStocks();
    }
    return searchStocks(debouncedSearch);
  }, [debouncedSearch, isLoading]);

  // Pre-load all stocks on component mount and wait for backend data
  useEffect(() => {
    const initializeStocks = async () => {
      try {
        await waitForStockList(5000);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading stocks:', error);
        setIsLoading(false);
      }
    };
    initializeStocks();
  }, []);

  // Get search results count (only when actually searching)
  const searchResultsCount = useMemo(() => {
    if (debouncedSearch.trim()) {
      return searchStocks(debouncedSearch).length;
    }
    return 0;
  }, [debouncedSearch]);

  const [selectedStock, setSelectedStock] = useState<{symbol: string; name: string; exchange: string} | undefined>(undefined);
  
  // Update selected stock when value changes or after stocks load
  useEffect(() => {
    const stock = getStockBySymbol(value);
    setSelectedStock(stock);
  }, [value, isLoading]);

  const handleSelect = useCallback((symbol: string) => {
    onValueChange(symbol);
    setDialogOpen(false);
    setSearch("");
  }, [onValueChange]);

  // Expose imperative API to parent
  useImperativeHandle(ref, () => ({
    open: () => {
      setDialogOpen(true);
      // Ensure focus happens after dialog opens
      setTimeout(() => inputRef.current?.focus(), 0);
    },
    openWithQuery: (query: string) => {
      setSearch(query);
      setDialogOpen(true);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }), []);

  // Performance monitoring for render
  useEffect(() => {
    startRender();
    const timer = setTimeout(() => {
      endRender();
    }, 0);
    return () => clearTimeout(timer);
  });

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium mb-2">{label}</label>
      )}
      <button
        type="button"
        className="w-full flex items-center justify-between rounded-md border bg-white text-black px-3 py-2 text-left ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 border-slate-300 focus:border-emerald-400"
        onClick={() => !isLoading && setDialogOpen(true)}
        disabled={disabled || isLoading}
        title={isLoading ? "Loading stocks..." : ""}
      >
        {value ? (
          selectedStock
            ? `${selectedStock.symbol} – ${selectedStock.name}`
            : value
        ) : (
          placeholder
        )}
        {isLoading && <span className="text-slate-400 text-xs ml-1">●</span>}
        <span className="text-slate-400">▼</span>
      </button>
      
      <CommandDialog open={dialogOpen && !isLoading} onOpenChange={setDialogOpen}>
        <CommandInput
          placeholder="Search stock by symbol or name..."
          value={search}
          onValueChange={setSearch}
          autoFocus
          ref={inputRef as any}
        />
        <CommandList className="max-h-[400px] overflow-y-auto">
          <CommandEmpty>
            {isLoading ? 'Loading stocks...' : 'No stocks found.'}
          </CommandEmpty>
          <CommandGroup>
            {!isLoading && (
              <StockList
                stocks={filteredStocks}
                search={debouncedSearch}
                onSelect={handleSelect}
              />
            )}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </div>
  );
});