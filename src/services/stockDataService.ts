import { ENDPOINTS } from '@/config';

// Will be populated from backend API
let stockList: Array<{symbol: string; name: string; exchange: string}> = [];
let stockListFetched = false;

// Popular stocks that should be shown first
const POPULAR_STOCKS = [
  'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK', 'HINDUNILVR', 'ITC', 'SBIN',
  'BHARTIARTL', 'KOTAKBANK', 'AXISBANK', 'ASIANPAINT', 'MARUTI', 'HCLTECH', 'SUNPHARMA',
  'TMPV', 'WIPRO', 'ULTRACEMCO', 'TITAN', 'BAJFINANCE', 'NESTLEIND', 'POWERGRID',
  'ADANIENT', 'ADANIPORTS', 'JSWSTEEL', 'TECHM', 'HINDALCO', 'ONGC', 'COALINDIA',
  'NTPC', 'TATASTEEL', 'GRASIM', 'CIPLA', 'SHREECEM', 'DIVISLAB', 'BRITANNIA',
  'EICHERMOT', 'HEROMOTOCO', 'DRREDDY', 'BAJAJFINSV', 'INDUSINDBK', 'TATACONSUM',
  'APOLLOHOSP', 'BAJAJ-AUTO', 'VEDL', 'SBILIFE', 'HDFCLIFE', 'UPL', 'BPCL'
];

// Fetch stock list from backend API (only once at startup)
const fetchStockListFromBackend = async () => {
  if (stockListFetched) {
    return stockList;
  }
  
  try {
    const response = await fetch(ENDPOINTS.ANALYSIS.STOCKS_LIST);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    
    if (data.success && data.stocks && Array.isArray(data.stocks)) {
      stockList = data.stocks;
      stockListFetched = true;
      console.log(`✅ Loaded ${stockList.length} stocks from backend (cached for session)`);
      return stockList;
    }
  } catch (error) {
    console.error('❌ Failed to fetch stock list from backend:', error);
  }
  
  return stockList;
};

// Initialize stock list on module load (fires once when module is imported)
const initPromise = fetchStockListFromBackend();
initPromise.catch(err => console.error('Failed to initialize stock list:', err));

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
let searchIndex: ReturnType<typeof createSearchIndex> = createSearchIndex();

// Rebuild search index when stock list is loaded
const rebuildSearchIndex = () => {
  searchIndex = createSearchIndex();
};

// Update the init promise to rebuild index after fetch
initPromise.then(() => {
  rebuildSearchIndex();
  console.log(`✅ Search index rebuilt with ${stockList.length} stocks`);
});

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
let lastStockListLength = 0;

// Get all stocks (memoized) - ensures backend data is loaded
export const getAllStocks = () => {
  // Rebuild cache if stockList has changed (new data loaded)
  if (stockList.length !== lastStockListLength) {
    lastStockListLength = stockList.length;
    
    // Sort the stock list
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
  return sortedStockList || [];
};

// Search stocks with caching and indexing
export const searchStocks = (query: string): typeof stockList => {
  const normalizedQuery = query.toLowerCase().trim();
  
  // If no query, return all stocks (for showing in dropdown when focused)
  if (!normalizedQuery) {
    return getAllStocks();
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

// Get stock by symbol - waits briefly for data if not yet loaded
export const getStockBySymbol = (symbol: string) => {
  if (!symbol) return undefined;
  const stock = stockList.find(stock => stock.symbol === symbol);
  // If stock not found and list not yet fetched, it will return undefined
  // Component will show just the symbol until list loads
  return stock;
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

// Wait for stock list to be loaded from backend
export const waitForStockList = async (timeout = 5000) => {
  const startTime = Date.now();
  while (!stockListFetched && Date.now() - startTime < timeout) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  if (!stockListFetched) {
    console.warn('⚠️ Stock list failed to load within timeout');
  }
  return stockList;
};
