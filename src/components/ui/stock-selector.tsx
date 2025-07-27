import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
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
  getPopularStocks, 
  getAllStocks, 
  searchStocks, 
  getStockBySymbol,
  preloadPopularStocks 
} from '@/services/stockDataService';

import { usePerformanceMonitor } from '@/utils/performanceMonitor';

interface StockSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  label?: string;
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

// Virtualized list component
const VirtualizedStockList: React.FC<{
  stocks: ReturnType<typeof getAllStocks>;
  search: string;
  onSelect: (symbol: string) => void;
}> = ({ stocks, search, onSelect }) => {
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 50 });
  const containerRef = useRef<HTMLDivElement>(null);
  const itemHeight = 48; // Height of each stock item
  const visibleCount = 50; // Number of items to render at once

  // Calculate visible range based on scroll position
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    const start = Math.floor(scrollTop / itemHeight);
    const end = Math.min(start + visibleCount, stocks.length);
    setVisibleRange({ start, end });
  }, [stocks.length, itemHeight, visibleCount]);

  // Get visible stocks
  const visibleStocks = useMemo(() => {
    return stocks.slice(visibleRange.start, visibleRange.end);
  }, [stocks, visibleRange]);

  // Calculate total height for scroll container
  const totalHeight = stocks.length * itemHeight;

  return (
    <div 
      ref={containerRef}
      className="max-h-[400px] overflow-y-auto"
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ 
          position: 'absolute', 
          top: visibleRange.start * itemHeight,
          left: 0,
          right: 0
        }}>
          {visibleStocks.map((stock, index) => (
            <CommandItem
              key={`${stock.symbol}_${stock.exchange}`}
              value={stock.symbol}
              onSelect={() => onSelect(stock.symbol)}
              className="h-12"
            >
              <div className="flex items-center justify-between w-full">
                <div>
                  <span className="font-semibold">{stock.symbol}</span>
                  <span className="ml-2 text-slate-600">{stock.name}</span>
                </div>
                <span className="text-xs text-slate-400">{stock.exchange}</span>
              </div>
            </CommandItem>
          ))}
        </div>
      </div>
    </div>
  );
};

export const StockSelector: React.FC<StockSelectorProps> = ({
  value,
  onValueChange,
  placeholder = "Select a stock",
  disabled = false,
  className = "",
  label
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [showAllStocks, setShowAllStocks] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Performance monitoring
  const { startRender, endRender } = usePerformanceMonitor('StockSelector');
  
  // Debounce search to reduce filtering operations
  const debouncedSearch = useDebounce(search, 150);

  // Memoize popular stocks
  const popularStocks = useMemo(() => {
    return getPopularStocks();
  }, []);

  // Memoize filtered stocks
  const filteredStocks = useMemo(() => {
    if (!debouncedSearch.trim()) {
      return showAllStocks ? getAllStocks() : popularStocks;
    }
    return searchStocks(debouncedSearch);
  }, [debouncedSearch, showAllStocks, popularStocks]);

  const selectedStock = useMemo(() => 
    getStockBySymbol(value), 
    [value]
  );

  const handleSelect = useCallback((symbol: string) => {
    onValueChange(symbol);
    setDialogOpen(false);
    setSearch("");
    setShowAllStocks(false);
  }, [onValueChange]);

  const handleLoadAllStocks = useCallback(() => {
    setIsLoading(true);
    // Simulate loading delay for better UX
    setTimeout(() => {
      setShowAllStocks(true);
      setIsLoading(false);
    }, 100);
  }, []);

  // Preload popular stocks on component mount
  useEffect(() => {
    preloadPopularStocks();
  }, []);

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
        className="w-full flex items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-left shadow-sm hover:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-colors disabled:opacity-50"
        onClick={() => setDialogOpen(true)}
        disabled={disabled}
      >
        {value ? (
          selectedStock
            ? `${selectedStock.symbol} – ${selectedStock.name}`
            : value
        ) : (
          placeholder
        )}
        <span className="text-slate-400">▼</span>
      </button>
      
      <CommandDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <CommandInput
          placeholder="Search stock by symbol or name..."
          value={search}
          onValueChange={setSearch}
          autoFocus
        />
        <CommandList>
          <CommandEmpty>
            {isLoading ? "Loading..." : "No stocks found."}
          </CommandEmpty>
          <CommandGroup>
            {!debouncedSearch.trim() && !showAllStocks && (
              <div className="px-2 py-1 text-xs text-slate-500 border-b">
                Popular Stocks ({popularStocks.length})
              </div>
            )}
            
            {!debouncedSearch.trim() && !showAllStocks && (
              <>
                {popularStocks.map((stock) => (
                  <CommandItem
                    key={`${stock.symbol}_${stock.exchange}`}
                    value={stock.symbol}
                    onSelect={() => handleSelect(stock.symbol)}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div>
                        <span className="font-semibold">{stock.symbol}</span>
                        <span className="ml-2 text-slate-600">{stock.name}</span>
                      </div>
                      <span className="text-xs text-slate-400">{stock.exchange}</span>
                    </div>
                  </CommandItem>
                ))}
                <div className="px-2 py-2 border-t">
                  <button
                    onClick={handleLoadAllStocks}
                    disabled={isLoading}
                    className="w-full text-left text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
                  >
                    {isLoading ? "Loading..." : `Load all ${getAllStocks().length.toLocaleString()} stocks...`}
                  </button>
                </div>
              </>
            )}
            
            {(debouncedSearch.trim() || showAllStocks) && (
              <>
                {debouncedSearch.trim() && (
                  <div className="px-2 py-1 text-xs text-slate-500 border-b">
                    Search Results ({filteredStocks.length})
                  </div>
                )}
                <VirtualizedStockList
                  stocks={filteredStocks}
                  search={debouncedSearch}
                  onSelect={handleSelect}
                />
              </>
            )}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </div>
  );
}; 