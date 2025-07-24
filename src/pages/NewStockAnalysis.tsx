import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import PreviousAnalyses from "@/components/analysis/PreviousAnalyses";
import { Play, Settings, TrendingUp, Clock, BarChart3, Target, AlertTriangle } from "lucide-react";
import { useStockAnalyses, StoredAnalysis } from "@/hooks/useStockAnalyses";
import { useAuth } from "@/contexts/AuthContext";
import { AnalysisResponse, ErrorResponse, isAnalysisResponse, isErrorResponse } from "@/types/analysis";
import { apiService } from "@/services/api";
import stockList from "@/utils/stockList.json";
import {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";

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
  // Form state
  const [formData, setFormData] = useState({
    stock: "RELIANCE",
    exchange: "NSE",
    period: "365",
    interval: "1day",
    sector: "none"
  });

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stockDialogOpen, setStockDialogOpen] = useState(false);
  const [stockSearch, setStockSearch] = useState("");
  const [timer, setTimer] = useState(0);

  // Sector state
  const [sectors, setSectors] = useState<SectorInfo[]>([]);
  const [detectedSector, setDetectedSector] = useState<string>("");
  const [sectorLoading, setSectorLoading] = useState(false);
  const [showSectorOverride, setShowSectorOverride] = useState(false);
  const firstSectorLoad = useRef(true);

  // Hooks
  const navigate = useNavigate();
  const { toast } = useToast();
  const { saveAnalysis } = useStockAnalyses();
  const { user } = useAuth();

  // Effects
  useEffect(() => {
    fetchSectors();
  }, []);

  useEffect(() => {
    if (formData.stock) {
      fetchStockSector(formData.stock);
    }
  }, [formData.stock]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isLoading) {
      setTimer(0);
      interval = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    } else {
      if (interval) clearInterval(interval);
      setTimer(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLoading]);

  // API functions
  const fetchSectors = async () => {
    try {
      const data = await apiService.getSectors();
      if (data.success) {
        setSectors(data.sectors);
      }
    } catch (error) {
      console.error('Error fetching sectors:', error);
    }
  };

  const fetchStockSector = async (symbol: string) => {
    setSectorLoading(true);
    try {
      const data = await apiService.getStockSector(symbol);
      if (data.success && data.sector_info) {
        setDetectedSector(data.sector_info.sector || "");
        if (!formData.sector || formData.sector === "none" || firstSectorLoad.current) {
          setFormData(prev => ({ ...prev, sector: data.sector_info.sector || "none" }));
          firstSectorLoad.current = false;
        }
      } else {
        setDetectedSector("");
        setFormData(prev => ({ ...prev, sector: "none" }));
      }
    } catch (error) {
      console.error('Error fetching stock sector:', error);
      setDetectedSector("");
    } finally {
      setSectorLoading(false);
    }
  };

  // Event handlers
  const handleInputChange = (field: string, value: string) => {
    if (field === "stock") {
      setFormData(prev => ({ ...prev, stock: value, sector: "none" }));
      setDetectedSector("");
      firstSectorLoad.current = true;
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
    setIsLoading(true);
    setError(null);

    try {
      const payload = {
        stock: formData.stock.toUpperCase(),
        exchange: formData.exchange,
        period: parseInt(formData.period),
        interval: formData.interval,
        sector: formData.sector === "none" ? null : formData.sector || null
      };

      const data = await apiService.analyzeStock(payload);

      if (user) {
        try {
          // The saveAnalysis function now handles the normalized data extraction
          await saveAnalysis(data.stock_symbol, data);
        } catch (saveError) {
          console.error("Error saving analysis to Supabase:", saveError);
        }
      }

      localStorage.setItem('analysisResult', JSON.stringify(data));

      // Request JWT token for WebSocket authentication and store in localStorage
      try {
        const userId = formData.stock || 'user';
        const resp = await fetch(`/auth/token?user_id=${encodeURIComponent(userId)}`, {
          method: 'POST'
        });
        if (resp.ok) {
          const tokenData = await resp.json();
          if (tokenData.token) {
            localStorage.setItem('jwt_token', tokenData.token);
          }
        }
      } catch (err) {
        // Ignore token errors for now
      }

      toast({
        title: "Analysis Complete",
        description: `Analysis completed for ${data.stock_symbol}`,
      });

      navigate('/output');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An error occurred during analysis";
      setError(errorMessage);
      toast({
        title: "Analysis Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-800 mb-4">
            Stock Analysis Dashboard
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Configure your technical analysis parameters and run comprehensive stock analysis
          </p>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
            
            {/* Analysis Configuration Panel */}
            <div className="xl:col-span-3">
              <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
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
                
                <CardContent className="p-8">
                  <form onSubmit={handleSubmit} className="space-y-8">
                    
                    {/* Stock Selection Section */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-slate-800 flex items-center">
                        <Target className="h-5 w-5 mr-2 text-emerald-500" />
                        Stock Selection
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="stock" className="text-slate-700 font-medium">
                            Stock Symbol
                          </Label>
                          <button
                            id="stock"
                            type="button"
                            className="w-full flex items-center justify-between rounded-lg border border-slate-300 bg-white px-4 py-3 text-left shadow-sm hover:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-colors"
                            onClick={() => setStockDialogOpen(true)}
                          >
                            {formData.stock ? (
                              (() => {
                                const selected = stockList.find(s => s.symbol === formData.stock);
                                return selected
                                  ? `${selected.symbol} – ${selected.name}`
                                  : formData.stock;
                              })()
                            ) : (
                              "Select a stock"
                            )}
                            <span className="text-slate-400">▼</span>
                          </button>
                          
                          <CommandDialog open={stockDialogOpen} onOpenChange={setStockDialogOpen}>
                            <CommandInput
                              placeholder="Search stock by symbol or name..."
                              value={stockSearch}
                              onValueChange={setStockSearch}
                              autoFocus
                            />
                            <CommandList>
                              <CommandEmpty>No stocks found.</CommandEmpty>
                              <CommandGroup>
                                {stockList
                                  .filter((s) =>
                                    (s.symbol + " " + s.name + " " + s.exchange)
                                      .toLowerCase()
                                      .includes(stockSearch.toLowerCase())
                                  )
                                  .slice(0, 50)
                                  .map((s) => (
                                    <CommandItem
                                      key={`${s.symbol}_${s.exchange}`}
                                      value={s.symbol}
                                      onSelect={() => {
                                        handleInputChange("stock", s.symbol);
                                        setStockDialogOpen(false);
                                        setStockSearch("");
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

                        <div className="space-y-2">
                          <Label className="text-slate-700 font-medium">Exchange</Label>
                          <div className="w-full flex items-center rounded-lg border border-slate-300 bg-slate-50 px-4 py-3 text-slate-700">
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
                        {detectedSector && !showSectorOverride && (
                          <div className="flex items-center space-x-3">
                            <div className="flex-1 p-4 bg-green-50 border border-green-200 rounded-lg">
                              <div className="flex items-center justify-between">
                                <div>
                                  <span className="font-semibold text-green-800">
                                    {sectors.find(s => s.code === detectedSector)?.name || detectedSector}
                                  </span>
                                  <span className="text-green-600 ml-2 text-sm">(Auto-detected)</span>
                                </div>
                                {sectorLoading && (
                                  <div className="text-xs text-blue-600">Detecting...</div>
                                )}
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setShowSectorOverride(true)}
                            >
                              Change
                            </Button>
                          </div>
                        )}
                        
                        {(showSectorOverride || !detectedSector) && (
                          <Select
                            value={formData.sector}
                            onValueChange={(value) => {
                              handleInputChange("sector", value);
                              setShowSectorOverride(false);
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
                        )}
                        
                        {detectedSector && !showSectorOverride && (
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
                      <Button 
                        type="submit" 
                        className="w-full bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700 text-white font-semibold py-4 text-lg rounded-xl transition-all duration-300 transform hover:scale-[1.02] shadow-lg"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <div className="flex items-center space-x-2">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            <span>Running Analysis...</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <Play className="h-5 w-5" />
                            <span>Start Analysis</span>
                          </div>
                        )}
                      </Button>
                      
                      {isLoading && (
                        <div className="text-center space-y-2">
                          <div className="text-lg font-medium text-slate-700">
                            Elapsed Time: {String(Math.floor(timer / 60)).padStart(2, '0')}:{String(timer % 60).padStart(2, '0')}
                          </div>
                          <div className="text-sm text-slate-500">
                            Analysis typically takes 3-4 minutes to complete
                          </div>
                        </div>
                      )}
                      
                      {!isLoading && (
                        <div className="text-center text-sm text-slate-500">
                          Analysis typically takes 3-4 minutes to complete
                        </div>
                      )}
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Previous Analyses Sidebar */}
            <div className="xl:col-span-1">
              <div className="sticky top-8">
                <PreviousAnalyses onSelectAnalysis={handleSelectAnalysis} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewStockAnalysis; 