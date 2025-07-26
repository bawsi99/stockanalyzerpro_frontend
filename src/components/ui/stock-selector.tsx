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

// Import stockList using ES6 import syntax
import stockList from '@/utils/stockList.json';

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