import React, { useState } from 'react';
import {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command';

// Try to import stockList, fallback to default if it fails
let stockList: any[] = [];
try {
  stockList = require('@/utils/stockList.json');
} catch (error) {
  console.warn('Failed to load stockList.json, using fallback stocks');
  stockList = [
    { symbol: 'RELIANCE', name: 'Reliance Industries Ltd', exchange: 'NSE' },
    { symbol: 'TCS', name: 'Tata Consultancy Services Ltd', exchange: 'NSE' },
    { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd', exchange: 'NSE' },
    { symbol: 'INFY', name: 'Infosys Ltd', exchange: 'NSE' },
    { symbol: 'ICICIBANK', name: 'ICICI Bank Ltd', exchange: 'NSE' },
    { symbol: 'HINDUNILVR', name: 'Hindustan Unilever Ltd', exchange: 'NSE' },
    { symbol: 'ITC', name: 'ITC Ltd', exchange: 'NSE' },
    { symbol: 'SBIN', name: 'State Bank of India', exchange: 'NSE' },
    { symbol: 'BHARTIARTL', name: 'Bharti Airtel Ltd', exchange: 'NSE' },
    { symbol: 'AXISBANK', name: 'Axis Bank Ltd', exchange: 'NSE' },
  ];
}

interface StockSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  label?: string;
}

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

  const selectedStock = stockList.find(s => s.symbol === value);

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
          <CommandEmpty>No stocks found.</CommandEmpty>
          <CommandGroup>
            {stockList
              .filter((s) =>
                (s.symbol + " " + s.name + " " + s.exchange)
                  .toLowerCase()
                  .includes(search.toLowerCase())
              )
              .slice(0, 50)
              .map((s) => (
                <CommandItem
                  key={`${s.symbol}_${s.exchange}`}
                  value={s.symbol}
                  onSelect={() => {
                    onValueChange(s.symbol);
                    setDialogOpen(false);
                    setSearch("");
                  }}
                >
                  <div className="flex items-center justify-between w-full">
                    <div>
                      <span className="font-semibold">{s.symbol}</span>
                      <span className="ml-2 text-slate-600">{s.name}</span>
                    </div>
                    <span className="text-xs text-slate-400">{s.exchange}</span>
                  </div>
                </CommandItem>
              ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </div>
  );
}; 