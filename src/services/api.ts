import { 
  AnalysisRequest, 
  AnalysisResponse, 
  ErrorResponse,
  SectorListResponse,
  SectorStocksResponse,
  SectorPerformanceResponse,
  SectorComparisonResponse,
  StockSectorResponse,
  isAnalysisResponse,
  isErrorResponse
} from '@/types/analysis';

const API_BASE_URL = 'http://127.0.0.1:8000';

class ApiService {
  private async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      ...options,
    };

    try {
      const response = await fetch(url, defaultOptions);
      
      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          if (response.status === 422) {
            // Handle validation errors
            if (Array.isArray(errorData.detail)) {
              errorMessage = errorData.detail.map((err: any) => err.msg).join(', ');
            } else {
              errorMessage = errorData.detail;
            }
          } else {
            errorMessage = errorData.detail || errorData.message || errorMessage;
          }
        } catch (e) {
          console.error("Error parsing error response:", e);
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      return data as T;
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Main Analysis Endpoint
  async analyzeStock(request: AnalysisRequest): Promise<AnalysisResponse> {
    const data = await this.makeRequest<AnalysisResponse | ErrorResponse>('/analyze', {
      method: 'POST',
      body: JSON.stringify(request),
    });

    if (isErrorResponse(data)) {
      throw new Error(data.error);
    }

    if (!isAnalysisResponse(data)) {
      throw new Error('Invalid API response format');
    }

    return data;
  }

  // Sector Benchmarking Endpoint
  async getSectorBenchmarking(request: AnalysisRequest): Promise<AnalysisResponse> {
    const data = await this.makeRequest<AnalysisResponse | ErrorResponse>('/sector/benchmark', {
      method: 'POST',
      body: JSON.stringify(request),
    });

    if (isErrorResponse(data)) {
      throw new Error(data.error);
    }

    if (!isAnalysisResponse(data)) {
      throw new Error('Invalid API response format');
    }

    return data;
  }

  // Sector List Endpoint
  async getSectors(): Promise<SectorListResponse> {
    return this.makeRequest<SectorListResponse>('/sector/list');
  }

  // Sector Stocks Endpoint
  async getSectorStocks(sectorName: string): Promise<SectorStocksResponse> {
    return this.makeRequest<SectorStocksResponse>(`/sector/${encodeURIComponent(sectorName)}/stocks`);
  }

  // Sector Performance Endpoint
  async getSectorPerformance(sectorName: string, period: number = 365): Promise<SectorPerformanceResponse> {
    return this.makeRequest<SectorPerformanceResponse>(`/sector/${encodeURIComponent(sectorName)}/performance?period=${period}`);
  }

  // Sector Comparison Endpoint
  async compareSectors(sectors: string[], period: number = 365): Promise<SectorComparisonResponse> {
    return this.makeRequest<SectorComparisonResponse>('/sector/compare', {
      method: 'POST',
      body: JSON.stringify({ sectors, period }),
    });
  }

  // Stock Sector Info Endpoint
  async getStockSector(symbol: string): Promise<StockSectorResponse> {
    return this.makeRequest<StockSectorResponse>(`/stock/${encodeURIComponent(symbol)}/sector`);
  }

  // Stock Info Endpoint
  async getStockInfo(symbol: string, exchange: string = 'NSE'): Promise<any> {
    return this.makeRequest<any>(`/stock/${encodeURIComponent(symbol)}/info?exchange=${exchange}`);
  }

  // Health Check Endpoint
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.makeRequest<{ status: string; timestamp: string }>('/health');
  }
}

// Export a singleton instance
export const apiService = new ApiService();

// Export individual functions for convenience
export const {
  analyzeStock,
  getSectorBenchmarking,
  getSectors,
  getSectorStocks,
  getSectorPerformance,
  compareSectors,
  getStockSector,
  getStockInfo,
  healthCheck,
} = apiService; 