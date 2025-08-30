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

// Pre-sorted stock list for performance
let sortedStockList: typeof stockList | null = null;

// Get all stocks (memoized)
export const getAllStocks = () => {
  if (!sortedStockList) {
    // Sort once and cache the result
    const startsWithLetter = (s: string) => /^[A-Za-z]/.test(s);
    sortedStockList = [...stockList].sort((a, b) => {
      const aIsLetter = startsWithLetter(a.symbol);
      const bIsLetter = startsWithLetter(b.symbol);
      if (aIsLetter !== bIsLetter) {
        return aIsLetter ? -1 : 1;
      }
      return a.symbol.localeCompare(b.symbol);
    });
  }
  return sortedStockList;
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
  
  // Simple substring matching with priority scoring
  const results = stockList
    .filter(stock => {
      const searchableText = `${stock.symbol} ${stock.name} ${stock.exchange}`.toLowerCase();
      return searchableText.includes(normalizedQuery);
    })
    .map(stock => {
      const symbolLower = stock.symbol.toLowerCase();
      const nameLower = stock.name.toLowerCase();
      
      // Calculate priority score based on where the match occurs
      let score = 0;
      
      // Exact symbol match gets highest priority
      if (symbolLower === normalizedQuery) {
        score += 1000;
      }
      // Symbol starts with query
      else if (symbolLower.startsWith(normalizedQuery)) {
        score += 500;
      }
      // Symbol contains query
      else if (symbolLower.includes(normalizedQuery)) {
        score += 300;
      }
      
      // Name starts with query
      if (nameLower.startsWith(normalizedQuery)) {
        score += 200;
      }
      // Name contains query
      else if (nameLower.includes(normalizedQuery)) {
        score += 100;
      }
      
      // Popular stocks get bonus
      if (POPULAR_STOCKS.includes(stock.symbol)) {
        score += 50;
      }
      
      return { ...stock, _score: score };
    })
    .sort((a, b) => {
      // Sort by score (descending), then alphabetically
      if (a._score !== b._score) {
        return b._score - a._score;
      }
      return a.symbol.localeCompare(b.symbol);
    })
    .map(({ _score, ...stock }) => stock); // Remove score from final result
  
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