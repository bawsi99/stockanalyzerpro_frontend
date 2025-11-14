import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import PreviousAnalyses, { RunningAnalysisItem } from "@/components/analysis/PreviousAnalyses";
import PreviousAnalysesSelector from "@/components/analysis/PreviousAnalysesSelector";
import { Play, Settings, TrendingUp, Clock, BarChart3, Target, AlertTriangle } from "lucide-react";
import { useStockAnalyses, StoredAnalysis } from "@/hooks/useStockAnalyses";
import { useAuth } from "@/contexts/AuthContext";
import { AnalysisResponse, ErrorResponse, isAnalysisResponse, isErrorResponse } from "@/types/analysis";
import { apiService } from "@/services/api";
import { authService } from "@/services/authService";
import { StockSelector } from "@/components/ui/stock-selector";
import type { StockSelectorHandle } from "@/components/ui/stock-selector";
import { useSelectedStockStore } from "@/stores/selectedStockStore";


// Type definitions
interface SectorInfo {
  code: string;
  name: string;
  primary_index: string;
}

interface ApiValidationError {
  loc: string[];
  msg: string;
  type: string;
}

// Interval to max period mapping
const intervalMaxPeriod: Record<string, number | undefined> = {
  "1minute": 30,
  "3minute": 90,
  "5minute": 90,
  "10minute": 90,
  "15minute": 180,
  "30minute": 180,
  "60minute": 365,
  "day": 2000,
  "Daily": 2000,
  "week": 2000,
  "month": 2000,
};

const getMaxPeriod = (interval: string) => intervalMaxPeriod[interval];

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

const NewStockAnalysis = () => {
  // Get the selected stock from the global store
  const { selectedStock, setSelectedStock } = useSelectedStockStore();
  
  // Form state
  const [formData, setFormData] = useState({
    stock: "RELIANCE",
    exchange: "NSE",
    period: "365",
    interval: "day",
    end_date: "", // YYYY-MM-DD
    sector: null,
    portfolio_value: "1000000"
  });

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [runningAnalyses, setRunningAnalyses] = useState<RunningAnalysisItem[]>([]);
  const [isAnalysisRunning, setIsAnalysisRunning] = useState(false);
  const [hasCurrentHolding, setHasCurrentHolding] = useState<boolean>(false);
  const [holdingData, setHoldingData] = useState({
    quantity: "",
    entry_price: "",
    position_type: "long" as "long" | "short"
  });

  // Previous analyses state
  const [selectedPreviousAnalyses, setSelectedPreviousAnalyses] = useState<string[]>([]);
  const [availablePreviousAnalyses, setAvailablePreviousAnalyses] = useState<Array<{
    id: string;
    end_date: string | null;
    interval: string | null;
    period_days: number | null;
  }>>([]);
  const [loadingPreviousAnalyses, setLoadingPreviousAnalyses] = useState(false);

  // Sector state
  const [sectors, setSectors] = useState<SectorInfo[]>([]);
  const [detectedSector, setDetectedSector] = useState<string>("");
  const firstSectorLoad = useRef(true);

  // Ref to control the StockSelector imperatively
  const stockSelectorRef = useRef<StockSelectorHandle | null>(null);
  
  // Ref to track current form data to avoid dependency issues
  const formDataRef = useRef(formData);
  formDataRef.current = formData;

  // Sync form data when selected stock changes from other sources (but keep RELIANCE as default)
  useEffect(() => {
    if (selectedStock && selectedStock !== formData.stock && selectedStock !== "RELIANCE") {
      setFormData(prev => ({ ...prev, stock: selectedStock }));
      setDetectedSector("");
      firstSectorLoad.current = true;
    }
  }, [selectedStock]);

  // Global keyboard handler: open selector and type query
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if an input/textarea/select is focused
      const target = e.target as HTMLElement;
      const isEditable = target && (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        (target as any).isContentEditable
      );
      if (isEditable) return;

      // Only handle printable alphanumerics and space; ignore with modifiers
      const key = e.key;
      const isPrintable = key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey;

      if (isPrintable) {
        // Prevent the original event from also typing into the input after focus
        e.preventDefault();
        e.stopPropagation();
        stockSelectorRef.current?.openWithQuery(key);
        return;
      }

      if (key === 'Backspace') {
        e.preventDefault();
        e.stopPropagation();
        stockSelectorRef.current?.open();
      }
    };
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true } as any);
  }, []);

  // Hooks
  const navigate = useNavigate();
  const { toast } = useToast();
  const { saveAnalysis, analyses, loading, error, loadMoreAnalyses, hasMore } = useStockAnalyses();
  const { user } = useAuth();

  // Debounce stock symbol for fetching previous analyses
  const debouncedStock = useDebounce(formData.stock, 300);

  // Persistence helpers for running analyses
  const STORAGE_KEY = 'runningAnalyses_v1';
  const loadRunningFromStorage = (): RunningAnalysisItem[] => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as RunningAnalysisItem[];
      // Optional prune: drop very old entries (> 2 hours)
      const twoHoursMs = 2 * 60 * 60 * 1000;
      const now = Date.now();
      return parsed.filter(item => now - item.startedAt < twoHoursMs);
    } catch {
      return [];
    }
  };
  const saveRunningToStorage = (items: RunningAnalysisItem[]) => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch {}
  };
  const addRunningToStorage = (item: RunningAnalysisItem) => {
    const current = loadRunningFromStorage();
    const updated = [item, ...current.filter(r => r.id !== item.id)];
    saveRunningToStorage(updated);
  };
  const removeRunningFromStorage = (id: string) => {
    const current = loadRunningFromStorage();
    const updated = current.filter(r => r.id !== id);
    saveRunningToStorage(updated);
  };

  // API functions
  const fetchSectors = async () => {
    try {
      const data = await apiService.getSectors();
      if (data.success) {
        setSectors(data.sectors);
      }
    } catch (error) {
      // console.error('Error fetching sectors:', error);
    }
  };

  const fetchStockSector = useCallback(async (symbol: string) => {
    try {
      const data = await apiService.getStockSector(symbol);
      
      if (data.success && data.sector_info && data.sector_info.sector) {
        setDetectedSector(data.sector_info.sector);
        // Always update form data when we have a valid sector, but only if no sector is currently selected
        if (!formDataRef.current.sector || firstSectorLoad.current) {
          setFormData(prev => ({ ...prev, sector: data.sector_info.sector }));
          firstSectorLoad.current = false;
        }
      } else {
        setDetectedSector("");
        // Only clear form data if no sector is currently selected or it's the first load
        if (!formDataRef.current.sector || firstSectorLoad.current) {
          setFormData(prev => ({ ...prev, sector: null }));
          firstSectorLoad.current = false;
        }
      }
    } catch (error) {
      console.error('Error fetching stock sector:', error);
      setDetectedSector("");
      // Only clear form data if no sector is currently selected or it's the first load
      if (!formDataRef.current.sector || firstSectorLoad.current) {
        setFormData(prev => ({ ...prev, sector: null }));
        firstSectorLoad.current = false;
      }
    }
  }, []); // No dependencies to prevent infinite loop

  const fetchPreviousAnalysesForStock = useCallback(async (symbol: string) => {
    if (!user?.id) {
      setAvailablePreviousAnalyses([]);
      setSelectedPreviousAnalyses([]);
      return;
    }

    // Normalize stock symbol to uppercase to match database format
    const normalizedSymbol = symbol?.trim().toUpperCase();
    if (!normalizedSymbol || normalizedSymbol.length === 0) {
      setAvailablePreviousAnalyses([]);
      setSelectedPreviousAnalyses([]);
      setLoadingPreviousAnalyses(false);
      return;
    }

    setLoadingPreviousAnalyses(true);
    try {
      const response = await apiService.getStockAnalysesForUser(normalizedSymbol, user.id, 20);
      if (response.success) {
        // Backend now returns minimal data: id, end_date, interval, period_days
        const transformed = response.analyses.map((a: any) => ({
          id: a.id,
          end_date: a.end_date || null,
          interval: a.interval || null,
          period_days: a.period_days || null,
        }));
        setAvailablePreviousAnalyses(transformed);
        // Clear selections when stock changes
        setSelectedPreviousAnalyses([]);
      } else {
        setAvailablePreviousAnalyses([]);
        setSelectedPreviousAnalyses([]);
      }
    } catch (error) {
      console.error('Error fetching previous analyses:', error);
      setAvailablePreviousAnalyses([]);
      setSelectedPreviousAnalyses([]);
    } finally {
      setLoadingPreviousAnalyses(false);
    }
  }, [user?.id]);

  // Effects

  useEffect(() => {
    fetchSectors();
  }, []);

  // Rehydrate running analyses from storage on mount
  useEffect(() => {
    const hydrated = loadRunningFromStorage();
    if (hydrated.length) {
      setRunningAnalyses(hydrated);
    }
  }, []);

  useEffect(() => {
    if (formData.stock) {
      fetchStockSector(formData.stock);
    }
  }, [formData.stock, fetchStockSector]);

  // Fetch previous analyses when stock symbol changes
  useEffect(() => {
    // Clear immediately when stock changes (before debounced fetch completes)
    setAvailablePreviousAnalyses([]);
    setSelectedPreviousAnalyses([]);
    
    if (debouncedStock && user?.id) {
      const normalizedStock = debouncedStock.trim().toUpperCase();
      if (normalizedStock.length > 0) {
        fetchPreviousAnalysesForStock(normalizedStock);
      }
    }
  }, [debouncedStock, user?.id, fetchPreviousAnalysesForStock]);

  // Set end_date to today's date if empty
  useEffect(() => {
    if (!formData.end_date || formData.end_date.trim() === "") {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const todayStr = `${year}-${month}-${day}`;
      setFormData(prev => ({ ...prev, end_date: todayStr }));
    }
  }, []); // Run only on mount

  // Removed local timer; timers are now shown in PreviousAnalyses for running items

  // Event handlers
  const handleInputChange = (field: string, value: string) => {
    if (field === "stock") {
      setFormData(prev => ({ ...prev, stock: value, sector: null }));
      setDetectedSector("");
      firstSectorLoad.current = true;
      
      // Update the global store when user selects a stock
      setSelectedStock(value, 'analysis');
    } else if (field === "sector") {
      setFormData(prev => ({ ...prev, sector: value }));
    } else if (field === "interval") {
      const max = getMaxPeriod(value);
      setFormData(prev => {
        let newPeriod = prev.period;
        if (max && Number(prev.period) > max) {
          newPeriod = String(max);
        }
        return { ...prev, interval: value, period: newPeriod };
      });
    } else if (field === "period") {
      const max = getMaxPeriod(formData.interval);
      let newValue = value;
      if (max && Number(value) > max) {
        newValue = String(max);
      }
      setFormData(prev => ({ ...prev, [field]: newValue }));
    } else if (field === "portfolio_value") {
      // Only allow numeric input, remove non-numeric characters
      const numericValue = value.replace(/[^0-9]/g, "");
      // Ensure minimum value of 1000
      const validatedValue = numericValue && Number(numericValue) >= 1000 
        ? numericValue 
        : numericValue; // Allow empty for user to type
      setFormData(prev => ({ ...prev, [field]: validatedValue }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleHoldingToggle = (hasHolding: boolean) => {
    setHasCurrentHolding(hasHolding);
    if (!hasHolding) {
      setHoldingData({
        quantity: "",
        entry_price: "",
        position_type: "long"
      });
    }
  };

  const handleHoldingChange = (field: "quantity" | "entry_price" | "position_type", value: string) => {
    setHoldingData(prev => ({
      ...prev,
      [field]: field === "position_type" 
        ? value 
        : field === "quantity" 
          ? value.replace(/[^0-9]/g, "") 
          : value.replace(/[^0-9.]/g, "")
    }));
  };

  const handleSelectAnalysis = (analysis: StoredAnalysis) => {
    // Navigate to shareable URL for this saved analysis
    navigate(`/analysis/${analysis.id}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsAnalysisRunning(true);

    try {
      const payload: any = {
        stock: formData.stock.toUpperCase(),
        exchange: formData.exchange,
        period: parseInt(formData.period),
        interval: formData.interval,
        sector: formData.sector,
        email: user?.email, // Include user email for backend user ID mapping
        portfolio_value: formData.portfolio_value ? parseFloat(formData.portfolio_value) : 1000000
      };
      if (formData.end_date && formData.end_date.trim().length > 0) {
        payload.end_date = formData.end_date.trim(); // YYYY-MM-DD
      }

      // Include current holding if provided
      if (hasCurrentHolding && holdingData.quantity && holdingData.entry_price) {
        payload.current_holding = {
          quantity: parseFloat(holdingData.quantity),
          entry_price: parseFloat(holdingData.entry_price),
          position_type: holdingData.position_type
        };
        console.log("[FRONTEND] Including current holding in request:", payload.current_holding);
      } else {
        payload.current_holding = null;
        console.log("[FRONTEND] No current holding included in request");
      }

      // Include previous analysis IDs if provided
      if (selectedPreviousAnalyses.length > 0) {
        payload.previous_analysis_ids = selectedPreviousAnalyses.slice(0, 5);
        console.log("[FRONTEND] Including previous analysis IDs in request:", payload.previous_analysis_ids);
      }

      // Create a running item and start async request
      const runId = `${payload.stock}-${Date.now()}`;
      const runningItem: RunningAnalysisItem = {
        id: runId,
        stock: payload.stock,
        exchange: payload.exchange,
        period: payload.period,
        interval: payload.interval,
        sector: payload.sector ?? null,
        startedAt: Date.now(),
        status: 'running',
      };
      setRunningAnalyses((prev) => [runningItem, ...prev]);
      addRunningToStorage(runningItem);

      setIsLoading(true);
      apiService
        .enhancedAnalyzeStock(payload)
        .then(async (data) => {
          if (user) {
            try {
              await saveAnalysis(data.stock_symbol, data);
            } catch (_) {}
          }
          localStorage.setItem('analysisResult', JSON.stringify(data));
          try {
            const userId = user?.id || 'anonymous';
            const { token } = await authService.createToken(userId);
            if (token) localStorage.setItem('jwt_token', token);
          } catch (_) {}

          setRunningAnalyses((prev) => prev.filter((r) => r.id !== runId));
          removeRunningFromStorage(runId);

          toast({
            title: "Analysis Complete",
            description: `Analysis completed for ${data.stock_symbol}`,
          });
          // Only navigate if still on analysis page
          if (window.location.pathname.includes('/analysis')) {
            const shareId = (data as any)?.analysis_id;
            navigate(shareId ? `/analysis/${shareId}` : '/output');
          }
        })
        .catch((err: unknown) => {
          const errorMessage = err instanceof Error ? err.message : 'An error occurred during analysis';
          setFormError(errorMessage);
          setRunningAnalyses((prev) => prev.map((r) => (r.id === runId ? { ...r, status: 'error', error: errorMessage } : r)));
          setTimeout(() => {
            setRunningAnalyses((prev) => prev.filter((r) => r.id !== runId));
            removeRunningFromStorage(runId);
          }, 2000);
          toast({ title: 'Analysis Failed', description: errorMessage, variant: 'destructive' });
        })
        .finally(() => {
          setIsLoading(false);
          setIsAnalysisRunning(false);
        });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An error occurred during analysis";
      setFormError(errorMessage);
      toast({
        title: "Analysis Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Header />
      <div className="h-16" />
      
      <div className="container mx-auto px-4 py-8 bg-transparent">
        {/* Page Header removed */}

        {/* Main Content */}
        <div className="max-w-[2200px] mx-auto mt-0 bg-transparent">
          {/* Prototype Disclaimer */}
          <div className="mb-4 flex justify-center w-full -mt-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex flex-wrap items-center justify-center" style={{ width: '100%', maxWidth: '2100px', minWidth: '1900px' }}>
              <p className="text-amber-700 text-center" style={{ width: '100%', maxWidth: '100%' }}>
                <span className="font-semibold">Prototype Notice:</span> This system is currently in prototype stage. Responses might be slow or occasionally unresponsive. Generating new analysis may be inoperational between 5:00AM - 7:30AM IST (4:30PM - 7:00PM PDT). Thank you for your patience.
              </p>
            </div>
          </div>
          
          <div className="flex flex-col xl:flex-row gap-8 items-stretch xl:justify-center">
            {/* Analysis Configuration Panel */}
            <div className="min-w-0 xl:w-[1000px] xl:flex-shrink-0">
              <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm max-h-[800px] flex flex-col overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-emerald-500 to-blue-600 text-white rounded-t-xl flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-white/20 rounded-lg">
                        <TrendingUp className="h-6 w-6" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl">Analysis Configuration</CardTitle>
                        <CardDescription className="text-emerald-100">
                          Set up your stock analysis parameters
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <span className="inline-block bg-white/20 text-white text-sm font-semibold px-3 py-1 rounded-full border border-white/30">
                        🚀 Now 2x faster!
                      </span>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="!pl-4 !pr-0 !pt-3 !pb-0 min-h-0 flex-1 flex flex-col scrollbar-always-visible" style={{ scrollbarWidth: 'thin', paddingRight: 0, marginRight: 0 }}>
                  <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-x-hidden" style={{ marginRight: 0, paddingRight: 0 }}>
                    <div className="flex-1 overflow-y-auto overflow-x-hidden space-y-4" style={{ scrollbarWidth: 'thin', paddingRight: '1rem', marginRight: 0 }}>
                    {/* Stock Selection Section */}
                    <div className="space-y-3">
                      <h3 className="text-base font-semibold text-slate-800 flex items-center">
                        <Target className="h-4 w-4 mr-2 text-emerald-500" />
                        Stock Selection
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <StockSelector
                            ref={stockSelectorRef}
                            value={formData.stock}
                            onValueChange={(value) => handleInputChange("stock", value)}
                            label="Stock Symbol"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-medium mb-2 text-slate-700">Exchange</label>
                          <div className="w-full flex items-center rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-700">
                            <span className="font-medium">NSE</span>
                            <span className="ml-2 text-xs text-slate-500">(Fixed)</span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-medium mb-2 text-slate-700">Sector</label>
                          <Select
                            value={formData.sector || "none"}
                            onValueChange={(value) => {
                              handleInputChange("sector", value === "none" ? null : value);
                            }}
                          >
                            <SelectTrigger className="border-slate-300 focus:ring-0 focus:ring-offset-0">
                              <SelectValue placeholder="Select sector" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">No Sector (Use Market Index)</SelectItem>
                              {sectors.map((sector) => (
                                <SelectItem key={sector.code} value={sector.code}>
                                  {sector.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      {detectedSector && formData.sector === detectedSector && (
                        <p className="text-sm text-slate-500">
                          Using sector-specific index for more accurate analysis
                        </p>
                      )}
                    </div>

                    <Separator />

                    {/* Time Configuration */}
                    <div className="space-y-3">
                      <h3 className="text-base font-semibold text-slate-800 flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-purple-500" />
                        Time Configuration
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="period" className="text-slate-700 font-medium">
                            Analysis Period (days)
                          </Label>
                          <Input
                            id="period"
                            type="number"
                            value={formData.period}
                            onChange={(e) => handleInputChange("period", e.target.value)}
                            placeholder="365"
                            className="border-slate-300 focus-visible:ring-0 focus-visible:ring-offset-0"
                            required
                            min={1}
                            max={getMaxPeriod(formData.interval) || undefined}
                          />
                          {getMaxPeriod(formData.interval) && (
                            <p className="text-xs text-slate-500">
                              Maximum for {formData.interval}: {getMaxPeriod(formData.interval)} days
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="interval" className="text-slate-700 font-medium">
                            Data Interval
                          </Label>
                          <Select 
                            value={formData.interval} 
                            onValueChange={(value) => handleInputChange("interval", value)}
                          >
                            <SelectTrigger id="interval" className="border-slate-300 focus:ring-0 focus:ring-offset-0">
                              <SelectValue placeholder="Select interval" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1minute">1 Minute</SelectItem>
                              <SelectItem value="5minute">5 Minutes</SelectItem>
                              <SelectItem value="15minute">15 Minutes</SelectItem>
                              <SelectItem value="30minute">30 Minutes</SelectItem>
                              <SelectItem value="60minute">1 Hour</SelectItem>
                              <SelectItem value="day">1 Day</SelectItem>
                              <SelectItem value="week">1 Week</SelectItem>
                              <SelectItem value="month">1 Month</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="end_date" className="text-slate-700 font-medium">
                            End Date (optional) - <span className="text-xs text-slate-500">for backtesting</span>
                          </Label>
                          <Input
                            id="end_date"
                            type="date"
                            value={formData.end_date}
                            onChange={(e) => handleInputChange("end_date", e.target.value)}
                            className="border-slate-300 focus-visible:ring-0 focus-visible:ring-offset-0"
                          />
                          <p className="text-xs text-slate-500">
                            Analysis window: [end_date - period, end_date]
                          </p>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Portfolio Configuration */}
                    <div className="space-y-3">
                      <h3 className="text-base font-semibold text-slate-800 flex items-center">
                        <Target className="h-4 w-4 mr-2 text-indigo-500" />
                        Portfolio Configuration
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="portfolio_value" className="text-slate-700 font-medium">
                            Portfolio Value (₹)
                          </Label>
                          <Input
                            id="portfolio_value"
                            type="text"
                            value={formData.portfolio_value}
                            onChange={(e) => handleInputChange("portfolio_value", e.target.value)}
                            placeholder="1000000"
                            className="border-slate-300 focus-visible:ring-0 focus-visible:ring-offset-0"
                            required
                            min={1000}
                          />
                          <p className="text-xs text-slate-500">
                            Total portfolio capital in Indian Rupees. Used for position sizing calculations.
                          </p>
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Currently holding this stock?
                          </label>
                          <div className="flex space-x-4">
                            <button
                              type="button"
                              onClick={() => handleHoldingToggle(true)}
                              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                hasCurrentHolding
                                  ? "bg-blue-600 text-white"
                                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                              }`}
                            >
                              Yes
                            </button>
                            <button
                              type="button"
                              onClick={() => handleHoldingToggle(false)}
                              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                !hasCurrentHolding
                                  ? "bg-blue-600 text-white"
                                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                              }`}
                            >
                              No
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Current Holdings Details */}
                    {hasCurrentHolding && (
                      <div className="space-y-3 p-3 bg-blue-50 rounded-lg border border-blue-200 animate-in slide-in-from-top-2">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Quantity
                            </label>
                            <input
                              type="text"
                              value={holdingData.quantity}
                              onChange={(e) => handleHoldingChange("quantity", e.target.value)}
                              placeholder="e.g., 100"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              required={hasCurrentHolding}
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Entry Price (₹)
                            </label>
                            <input
                              type="text"
                              value={holdingData.entry_price}
                              onChange={(e) => handleHoldingChange("entry_price", e.target.value)}
                              placeholder="e.g., 2450.50"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              required={hasCurrentHolding}
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Position Type
                            </label>
                            <select
                              value={holdingData.position_type}
                              onChange={(e) => handleHoldingChange("position_type", e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              required={hasCurrentHolding}
                            >
                              <option value="long">Long</option>
                              <option value="short">Short</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    )}

                    <Separator />

                    {/* Previous Analyses Attachment Section */}
                    <div className="space-y-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                      <h3 className="text-base font-semibold text-slate-800 flex items-center">
                        <BarChart3 className="h-4 w-4 mr-2 text-purple-500" />
                        Attach Previous Analyses (Optional)
                      </h3>
                      <p className="text-sm text-slate-600">
                        If a previous analysis recommended running another analysis for a different timeframe or period, please attach that analysis here.
                      </p>
                      
                      <PreviousAnalysesSelector
                        availableAnalyses={availablePreviousAnalyses}
                        selectedIds={selectedPreviousAnalyses}
                        onSelectionChange={setSelectedPreviousAnalyses}
                        loading={loadingPreviousAnalyses}
                        maxSelections={5}
                      />
                    </div>

                    </div>

                    {/* Analysis Action - Sticky Bottom */}
                    <div className="sticky bottom-0 bg-white/95 backdrop-blur-sm pt-4 pb-4 border-t border-slate-200 -ml-4 pl-4 pr-4 mt-4 space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                        <Button 
                          type="submit" 
                          className="w-full bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700 text-white font-semibold py-4 text-lg rounded-xl transition-all duration-300 transform hover:scale-[1.02] shadow-lg"
                          disabled={isAnalysisRunning}
                        >
                          <div className="flex items-center space-x-2">
                            <Play className="h-5 w-5" />
                            <span>Start Analysis</span>
                          </div>
                        </Button>

                        <Button 
                          type="button"
                          variant="outline"
                          onClick={() => navigate('/charts')}
                          className="w-full border-slate-300 text-slate-700 bg-white hover:bg-slate-50 font-semibold py-4 text-lg rounded-xl transition-all duration-300 transform hover:scale-[1.02] shadow-lg"
                        >
                          <div className="flex items-center space-x-2">
                            <BarChart3 className="h-5 w-5" />
                            <span>View Charts</span>
                          </div>
                        </Button>
                      </div>

                      <div className="!mt-4 text-center text-sm text-slate-500">
                        Typical duration 1-2 minutes.
                      </div>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Previous Analyses Sidebar */}
            <div className="xl:w-[500px] flex-shrink-0">
              <PreviousAnalyses 
                analyses={analyses}
                onAnalysisSelect={handleSelectAnalysis}
                loading={loading}
                error={error}
                runningAnalyses={runningAnalyses}
                loadMoreAnalyses={loadMoreAnalyses}
                hasMore={hasMore}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewStockAnalysis; 