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

const NewStockAnalysis = () => {
  // Get the selected stock from the global store
  const { selectedStock, setSelectedStock } = useSelectedStockStore();
  
  // Form state
  const [formData, setFormData] = useState({
    stock: "RELIANCE",
    exchange: "NSE",
    period: "365",
    interval: "day",
    sector: null
  });

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [runningAnalyses, setRunningAnalyses] = useState<RunningAnalysisItem[]>([]);
  const [isAnalysisRunning, setIsAnalysisRunning] = useState(false);

  // Sector state
  const [sectors, setSectors] = useState<SectorInfo[]>([]);
  const [detectedSector, setDetectedSector] = useState<string>("");
  const firstSectorLoad = useRef(true);

  // Ref to control the StockSelector imperatively
  const stockSelectorRef = useRef<StockSelectorHandle | null>(null);

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
        if (!formData.sector || firstSectorLoad.current) {
          setFormData(prev => ({ ...prev, sector: data.sector_info.sector }));
          firstSectorLoad.current = false;
        }
      } else {
        setDetectedSector("");
        setFormData(prev => ({ ...prev, sector: null }));
      }
    } catch (error) {
      // console.error('Error fetching stock sector:', error);
      setDetectedSector("");
      setFormData(prev => ({ ...prev, sector: null }));
    }
  }, [formData.sector]);

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
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleSelectAnalysis = (analysis: StoredAnalysis) => {
    localStorage.setItem('analysisResult', JSON.stringify(analysis.analysis_data));
    navigate('/output');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsAnalysisRunning(true);

    try {
      const payload = {
        stock: formData.stock.toUpperCase(),
        exchange: formData.exchange,
        period: parseInt(formData.period),
        interval: formData.interval,
        sector: formData.sector,
        email: user?.email // Include user email for backend user ID mapping
      };

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
            navigate('/output');
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
      
      <div className="container mx-auto px-4 py-8">
        {/* Page Header removed */}

        {/* Main Content */}
        <div className="max-w-7xl mx-auto mt-5">
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 items-stretch">
              
            {/* Prototype Disclaimer */}
            <div className="xl:col-span-4 mb-4 w-full">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex flex-wrap items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-amber-500 mr-2 flex-shrink-0" />
                <p className="text-amber-700 text-center">
                  <span className="font-semibold">Prototype Notice:</span> This system is currently in prototype stage. Responses might be slow or occasionally unresponsive. Thank you for your patience.
                </p>
              </div>
            </div>
            
            {/* Analysis Configuration Panel */}
            <div className="xl:col-span-3 h-full">
              <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm h-[800px] grid grid-rows-[auto,1fr]">
                <CardHeader className="bg-gradient-to-r from-emerald-500 to-blue-600 text-white rounded-t-xl">
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
                </CardHeader>
                
                <CardContent className="p-8 overflow-y-auto min-h-0">
                  <form onSubmit={handleSubmit} className="space-y-8">
                    
                    {/* Stock Selection Section */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-slate-800 flex items-center">
                        <Target className="h-5 w-5 mr-2 text-emerald-500" />
                        Stock Selection
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                          <div className="w-full flex items-center rounded-md border border-input bg-background px-3 py-2 text-slate-700">
                            <span className="font-medium">NSE</span>
                            <span className="ml-2 text-xs text-slate-500">(Fixed)</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Sector Configuration */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-slate-800 flex items-center">
                        <BarChart3 className="h-5 w-5 mr-2 text-blue-500" />
                        Sector Analysis
                      </h3>
                      <div className="space-y-4">
                        <Select
                          value={formData.sector || "none"}
                          onValueChange={(value) => {
                            handleInputChange("sector", value === "none" ? null : value);
                          }}
                        >
                          <SelectTrigger className="border-slate-300 focus:border-emerald-400">
                            <SelectValue placeholder="Select sector for analysis" />
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
                        
                        {detectedSector && formData.sector === detectedSector && (
                          <p className="text-sm text-slate-500">
                            Using sector-specific index for more accurate analysis
                          </p>
                        )}
                      </div>
                    </div>

                    <Separator />

                    {/* Time Configuration */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-slate-800 flex items-center">
                        <Clock className="h-5 w-5 mr-2 text-purple-500" />
                        Time Configuration
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                            className="border-slate-300 focus:border-emerald-400"
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
                            <SelectTrigger id="interval" className="border-slate-300 focus:border-emerald-400">
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
                      </div>
                    </div>

                    <Separator />

                    {/* Analysis Action */}
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          className="w-full border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold py-4 text-lg rounded-xl transition-all duration-300 transform hover:scale-[1.02] shadow-lg"
                        >
                          <div className="flex items-center space-x-2">
                            <BarChart3 className="h-5 w-5" />
                            <span>View Charts</span>
                          </div>
                        </Button>
                      </div>

                      <div className="text-center text-sm text-slate-500">
                        You can start another analysis while the current one runs. Typical duration 3–4 minutes.
                      </div>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Previous Analyses Sidebar */}
            <div className="xl:col-span-1 h-full">
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