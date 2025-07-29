import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Charts from './Charts';

// Mock the dependencies
jest.mock('@/hooks/useLiveChart', () => ({
  useLiveChart: () => ({
    data: [],
    isConnected: true,
    isLive: false,
    isLoading: false,
    error: null,
    lastUpdate: null,
    connectionStatus: 'connected',
    lastTickPrice: null,
    lastTickTime: null,
    connect: jest.fn(),
    disconnect: jest.fn(),
    refetch: jest.fn(),
    updateSymbol: jest.fn(),
    updateTimeframe: jest.fn(),
  }),
}));

jest.mock('@/services/authService', () => ({
  authService: {
    ensureAuthenticated: jest.fn().mockResolvedValue('mock-token'),
  },
}));

jest.mock('@/services/api', () => ({
  apiService: {
    getHistoricalData: jest.fn().mockResolvedValue({
      success: true,
      candles: [],
    }),
  },
}));

jest.mock('@/hooks/useStockAnalyses', () => ({
  useStockAnalyses: () => ({
    analyses: [],
    loading: false,
    error: null,
    saveAnalysis: jest.fn(),
  }),
}));

jest.mock('@/stores/dataStore', () => ({
  useDataStore: () => ({
    data: null,
    loading: false,
    error: null,
  }),
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user' },
    login: jest.fn(),
    logout: jest.fn(),
  }),
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('Charts Page - Stock Symbol Integration', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
  });

  it('should use stock symbol from localStorage when available', () => {
    // Mock localStorage to return a stock symbol
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'lastAnalyzedStock') {
        return 'RELIANCE';
      }
      return null;
    });

    renderWithRouter(<Charts />);

    // Should display the stock symbol from localStorage
    expect(screen.getByDisplayValue('RELIANCE')).toBeInTheDocument();
  });

  it('should use default stock symbol when localStorage is empty', () => {
    // Mock localStorage to return null
    localStorageMock.getItem.mockReturnValue(null);

    renderWithRouter(<Charts />);

    // Should display the default stock symbol
    expect(screen.getByDisplayValue('NIFTY 50')).toBeInTheDocument();
  });

  it('should clear localStorage when user manually changes stock symbol', async () => {
    // Mock localStorage to return a stock symbol
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'lastAnalyzedStock') {
        return 'RELIANCE';
      }
      return null;
    });

    renderWithRouter(<Charts />);

    // Find the stock selector and change the value
    const stockSelector = screen.getByDisplayValue('RELIANCE');
    fireEvent.change(stockSelector, { target: { value: 'TCS' } });

    // Should clear the localStorage value
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('lastAnalyzedStock');
  });

  it('should maintain functionality when no localStorage value exists', () => {
    // Mock localStorage to return null
    localStorageMock.getItem.mockReturnValue(null);

    renderWithRouter(<Charts />);

    // Should still render the chart controls
    expect(screen.getByText('Chart Controls')).toBeInTheDocument();
    expect(screen.getByText('Stock Symbol')).toBeInTheDocument();
    expect(screen.getByText('Timeframe')).toBeInTheDocument();
  });
}); 