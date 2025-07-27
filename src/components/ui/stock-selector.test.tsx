import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { StockSelector } from './stock-selector';
import { performanceMonitor } from '@/utils/performanceMonitor';

// Mock the stock data service
jest.mock('@/services/stockDataService', () => ({
  getPopularStocks: () => [
    { symbol: 'RELIANCE', name: 'Reliance Industries', exchange: 'NSE' },
    { symbol: 'TCS', name: 'Tata Consultancy Services', exchange: 'NSE' },
    { symbol: 'HDFCBANK', name: 'HDFC Bank', exchange: 'NSE' },
  ],
  getAllStocks: () => [
    { symbol: 'RELIANCE', name: 'Reliance Industries', exchange: 'NSE' },
    { symbol: 'TCS', name: 'Tata Consultancy Services', exchange: 'NSE' },
    { symbol: 'HDFCBANK', name: 'HDFC Bank', exchange: 'NSE' },
    { symbol: 'INFY', name: 'Infosys', exchange: 'NSE' },
    { symbol: 'ICICIBANK', name: 'ICICI Bank', exchange: 'NSE' },
  ],
  searchStocks: (query: string) => {
    const allStocks = [
      { symbol: 'RELIANCE', name: 'Reliance Industries', exchange: 'NSE' },
      { symbol: 'TCS', name: 'Tata Consultancy Services', exchange: 'NSE' },
      { symbol: 'HDFCBANK', name: 'HDFC Bank', exchange: 'NSE' },
      { symbol: 'INFY', name: 'Infosys', exchange: 'NSE' },
      { symbol: 'ICICIBANK', name: 'ICICI Bank', exchange: 'NSE' },
    ];
    return allStocks.filter(stock => 
      stock.symbol.toLowerCase().includes(query.toLowerCase()) ||
      stock.name.toLowerCase().includes(query.toLowerCase())
    );
  },
  getStockBySymbol: (symbol: string) => {
    const stocks = [
      { symbol: 'RELIANCE', name: 'Reliance Industries', exchange: 'NSE' },
      { symbol: 'TCS', name: 'Tata Consultancy Services', exchange: 'NSE' },
      { symbol: 'HDFCBANK', name: 'HDFC Bank', exchange: 'NSE' },
    ];
    return stocks.find(stock => stock.symbol === symbol);
  },
  preloadPopularStocks: () => {},
}));

describe('StockSelector Performance', () => {
  beforeEach(() => {
    performanceMonitor.clearMetrics();
  });

  it('should render popular stocks quickly', async () => {
    const onValueChange = jest.fn();
    
    const startTime = performance.now();
    render(
      <StockSelector
        value=""
        onValueChange={onValueChange}
        placeholder="Select a stock"
      />
    );
    const renderTime = performance.now() - startTime;
    
    // Should render quickly (under 100ms)
    expect(renderTime).toBeLessThan(100);
    
    // Open dropdown
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    // Should show popular stocks
    await waitFor(() => {
      expect(screen.getByText('Popular Stocks (3)')).toBeInTheDocument();
      expect(screen.getByText('RELIANCE')).toBeInTheDocument();
      expect(screen.getByText('TCS')).toBeInTheDocument();
      expect(screen.getByText('HDFCBANK')).toBeInTheDocument();
    });
  });

  it('should handle search with debouncing', async () => {
    const onValueChange = jest.fn();
    
    render(
      <StockSelector
        value=""
        onValueChange={onValueChange}
        placeholder="Select a stock"
      />
    );
    
    // Open dropdown
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    // Type search query
    const searchInput = screen.getByPlaceholderText('Search stock by symbol or name...');
    fireEvent.change(searchInput, { target: { value: 'RELIANCE' } });
    
    // Should show search results after debounce
    await waitFor(() => {
      expect(screen.getByText('Search Results (1)')).toBeInTheDocument();
      expect(screen.getByText('RELIANCE')).toBeInTheDocument();
    }, { timeout: 200 }); // Wait for 150ms debounce + some buffer
  });

  it('should load all stocks when requested', async () => {
    const onValueChange = jest.fn();
    
    render(
      <StockSelector
        value=""
        onValueChange={onValueChange}
        placeholder="Select a stock"
      />
    );
    
    // Open dropdown
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    // Click load all stocks
    const loadAllButton = screen.getByText(/Load all/);
    fireEvent.click(loadAllButton);
    
    // Should show loading state
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    
    // Should load all stocks after delay
    await waitFor(() => {
      expect(screen.getByText('INFY')).toBeInTheDocument();
      expect(screen.getByText('ICICIBANK')).toBeInTheDocument();
    }, { timeout: 200 });
  });

  it('should track performance metrics', async () => {
    const onValueChange = jest.fn();
    
    render(
      <StockSelector
        value=""
        onValueChange={onValueChange}
        placeholder="Select a stock"
      />
    );
    
    // Open dropdown and perform some operations
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    const searchInput = screen.getByPlaceholderText('Search stock by symbol or name...');
    fireEvent.change(searchInput, { target: { value: 'TCS' } });
    
    await waitFor(() => {
      expect(screen.getByText('TCS')).toBeInTheDocument();
    });
    
    // Check that performance metrics were recorded
    const metrics = performanceMonitor.getAllMetrics();
    expect(Object.keys(metrics).length).toBeGreaterThan(0);
    
    // Log performance report
    performanceMonitor.logReport();
  });

  it('should handle stock selection', async () => {
    const onValueChange = jest.fn();
    
    render(
      <StockSelector
        value=""
        onValueChange={onValueChange}
        placeholder="Select a stock"
      />
    );
    
    // Open dropdown
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    // Select a stock
    await waitFor(() => {
      const stockItem = screen.getByText('RELIANCE');
      fireEvent.click(stockItem);
    });
    
    // Should call onValueChange
    expect(onValueChange).toHaveBeenCalledWith('RELIANCE');
    
    // Should close dropdown
    expect(screen.queryByText('Popular Stocks (3)')).not.toBeInTheDocument();
  });
}); 