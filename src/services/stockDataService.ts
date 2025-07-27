import stockList from '@/utils/stockList.json';

// Popular stocks that should be shown first
const POPULAR_STOCKS = [
  'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK', 'HINDUNILVR', 'ITC', 'SBIN',
  'BHARTIARTL', 'KOTAKBANK', 'AXISBANK', 'ASIANPAINT', 'MARUTI', 'HCLTECH', 'SUNPHARMA',
  'TATAMOTORS', 'WIPRO', 'ULTRACEMCO', 'TITAN', 'BAJFINANCE', 'NESTLEIND', 'POWERGRID',
  'ADANIENT', 'ADANIPORTS', 'JSWSTEEL', 'TECHM', 'HINDALCO', 'ONGC', 'COALINDIA',
  'NTPC', 'TATASTEEL', 'GRASIM', 'CIPLA', 'SHREECEM', 'DIVISLAB', 'BRITANNIA',
  'EICHERMOT', 'HEROMOTOCO', 'DRREDDY', 'BAJAJFINSV', 'INDUSINDBK', 'TATACONSUM',
  'APOLLOHOSP', 'BAJAJ-AUTO', 'VEDL', 'SBILIFE', 'HDFCLIFE', 'UPL', 'BPCL'
];

// Create search index for faster filtering
const createSearchIndex = () => {
  const index = new Map<string, number[]>();
  
  stockList.forEach((stock, idx) => {
    const searchableText = `${stock.symbol} ${stock.name} ${stock.exchange}`.toLowerCase();
    const words = searchableText.split(/\s+/);
    
    words.forEach(word => {
      if (word.length >= 2) { // Only index words with 2+ characters
        if (!index.has(word)) {
          index.set(word, []);
        }
        index.get(word)!.push(idx);
      }
    });
  });
  
  return index;
};

// Cache for search results
const searchCache = new Map<string, typeof stockList>();
const searchIndex = createSearchIndex();

// Get popular stocks
export const getPopularStocks = () => {
  return stockList.filter(stock => 
    POPULAR_STOCKS.includes(stock.symbol)
  ).sort((a, b) => 
    POPULAR_STOCKS.indexOf(a.symbol) - POPULAR_STOCKS.indexOf(b.symbol)
  );
};

// Get all stocks
export const getAllStocks = () => {
  return stockList;
};

// Search stocks with caching and indexing
export const searchStocks = (query: string): typeof stockList => {
  const normalizedQuery = query.toLowerCase().trim();
  
  if (!normalizedQuery) {
    return [];
  }
  
  // Check cache first
  if (searchCache.has(normalizedQuery)) {
    return searchCache.get(normalizedQuery)!;
  }
  
  // Use search index for faster filtering
  const queryWords = normalizedQuery.split(/\s+/).filter(word => word.length >= 2);
  const matchingIndices = new Set<number>();
  
  if (queryWords.length > 0) {
    // Find stocks that match any of the query words
    queryWords.forEach(word => {
      const indices = searchIndex.get(word) || [];
      indices.forEach(idx => matchingIndices.add(idx));
    });
  }
  
  // Convert indices back to stocks
  const results = Array.from(matchingIndices)
    .map(idx => stockList[idx])
    .filter(stock => {
      // Additional filtering for exact matches
      const searchableText = `${stock.symbol} ${stock.name} ${stock.exchange}`.toLowerCase();
      return searchableText.includes(normalizedQuery);
    })
    .sort((a, b) => {
      // Prioritize exact symbol matches
      const aExactSymbol = a.symbol.toLowerCase() === normalizedQuery;
      const bExactSymbol = b.symbol.toLowerCase() === normalizedQuery;
      
      if (aExactSymbol && !bExactSymbol) return -1;
      if (!aExactSymbol && bExactSymbol) return 1;
      
      // Then prioritize popular stocks
      const aPopular = POPULAR_STOCKS.includes(a.symbol);
      const bPopular = POPULAR_STOCKS.includes(b.symbol);
      
      if (aPopular && !bPopular) return -1;
      if (!aPopular && bPopular) return 1;
      
      return 0;
    });
  
  // Cache the result (limit cache size)
  if (searchCache.size > 100) {
    const firstKey = searchCache.keys().next().value;
    searchCache.delete(firstKey);
  }
  searchCache.set(normalizedQuery, results);
  
  return results;
};

// Get stock by symbol
export const getStockBySymbol = (symbol: string) => {
  return stockList.find(stock => stock.symbol === symbol);
};

// Preload popular stocks for instant access
export const preloadPopularStocks = () => {
  // This ensures popular stocks are immediately available
  return getPopularStocks();
};

// Clear cache (useful for memory management)
export const clearSearchCache = () => {
  searchCache.clear();
};

// Get statistics
export const getStockStats = () => {
  return {
    total: stockList.length,
    popular: POPULAR_STOCKS.length,
    exchanges: [...new Set(stockList.map(s => s.exchange))],
    cacheSize: searchCache.size
  };
}; 