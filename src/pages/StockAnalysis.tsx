import { useState, useEffect } from "react";
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
import { SectorAnalysisCard } from "@/components/analysis/SectorAnalysisCard";
import SectorBenchmarkingCard from "@/components/analysis/SectorBenchmarkingCard";
import { Play, Settings, TrendingUp } from "lucide-react";
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
import { useRef } from "react";

// Type for API validation error details
interface ApiValidationError {
  loc: string[];
  msg: string;
  type: string;
}

interface SectorInfo {
  code: string;
  name: string;
  primary_index: string;
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

// Helper to get max period for current interval
const getMaxPeriod = (interval: string) => intervalMaxPeriod[interval];

const StockAnalysis = () => {
  const [formData, setFormData] = useState({
    stock: "RELIANCE",
    exchange: "NSE",
    period: "365",
    interval: "day",
    sector: "none"
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { saveAnalysis } = useStockAnalyses();
  const { user } = useAuth();
  const [stockDialogOpen, setStockDialogOpen] = useState(false);
  const [stockSearch, setStockSearch] = useState("");
  const [timer, setTimer] = useState(0);
  // New state for sector logic
  const [sectors, setSectors] = useState<SectorInfo[]>([]);
  const [detectedSector, setDetectedSector] = useState<string>("");
  const [sectorLoading, setSectorLoading] = useState(false);
  const [showSectorOverride, setShowSectorOverride] = useState(false);
  const firstSectorLoad = useRef(true);

  // Fetch sectors on mount
  useEffect(() => {
    fetchSectors();
  }, []);

  // Fetch detected sector when stock changes
  useEffect(() => {
    if (formData.stock) {
      fetchStockSector(formData.stock);
    }
    // eslint-disable-next-line
  }, [formData.stock]);

  const fetchSectors = async () => {
    try {
      const data = await apiService.getSectors();
      if (data.success) {
        // The API returns an array of objects with code, name, and primary_index
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
        // Only auto-set sector if not already set or on first load
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

  // Timer effect: start when isLoading is true, stop/reset when false
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

  const handleInputChange = (field: string, value: string) => {
    if (field === "stock") {
      setFormData(prev => ({ ...prev, stock: value, sector: "none" }));
      setDetectedSector("");
      firstSectorLoad.current = true;
    } else if (field === "sector") {
      setFormData(prev => ({ ...prev, sector: value }));
    } else if (field === "interval") {
      // If changing interval, clamp period if needed
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
    // Store the selected analysis data in localStorage and navigate to output
    localStorage.setItem('analysisResult', JSON.stringify(analysis.analysis_data));
    navigate('/output');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submission started");
    setIsLoading(true);
    setError(null);

    try {
      // Use exact fields as specified in the new API
      const payload = {
        stock: formData.stock.toUpperCase(),
        exchange: formData.exchange,
        period: parseInt(formData.period),
        interval: formData.interval,
        sector: formData.sector === "none" ? null : formData.sector || null
      };

      console.log("Form data:", formData);
      console.log("Submitting analysis request with payload:", payload);

      const apiUrl = 'http://127.0.0.1:8000/analyze';
      console.log("Making request to API service...");

      try {
        console.log("Initiating API request...");
        const data = await apiService.analyzeStock(payload);
        console.log("API request completed");
        console.log("Raw API response:", data);

        // Save analysis to Supabase if user is authenticated
        if (user) {
          try {
            await saveAnalysis(data.stock_symbol, data);
            console.log("Analysis saved to Supabase");
          } catch (saveError) {
            console.error("Error saving analysis to Supabase:", saveError);
            // Don't block the user flow if saving fails
          }
        }

        // Store the analysis result
        console.log("Storing data in localStorage...");
        localStorage.setItem('analysisResult', JSON.stringify(data));
        console.log("Data being stored in localStorage:", data);

        // Verify the data was stored correctly
        const storedData = localStorage.getItem('analysisResult');
        const parsedStoredData = storedData ? JSON.parse(storedData) : null;
        console.log("Verified stored data:", parsedStoredData);

        if (!parsedStoredData) {
          throw new Error("Failed to store analysis data");
        }

        toast({
          title: "Analysis Complete",
          description: `Analysis completed for ${data.stock_symbol}`,
        });

        console.log("Navigation to output page...");
        navigate('/output');
      } catch (error) {
        console.error("API request error:", error);
        throw new Error(`API request failed: ${error.message}`);
      }
    } catch (error) {
      console.error("Error during analysis:", error);
      const errorMessage = error instanceof Error ? error.message : "An error occurred during analysis";
      setError(errorMessage);
      toast({
        title: "Analysis Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      console.log("Form submission completed");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-slate-800 mb-4">Stock Analysis Configuration</h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Analysis Form */}
            <div className="lg:col-span-2">
              <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm h-full flex flex-col">
                <CardHeader className="bg-gradient-to-r from-emerald-500 to-blue-500 text-white rounded-t-lg flex-shrink-0">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-6 w-6" />
                    <CardTitle className="text-xl">Analysis Parameters</CardTitle>
                  </div>
                  <CardDescription className="text-emerald-100">
                    Set up your stock analysis with custom parameters
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="p-8 flex-1 overflow-y-auto">
                  <form onSubmit={handleSubmit} className="space-y-8">
                    <div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="stock" className="text-slate-700 font-medium">Stock Symbol</Label>
                          <button
                            id="stock"
                            type="button"
                            className="w-full flex items-center justify-between rounded-md border border-slate-300 bg-background px-3 py-2 text-base md:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                            onClick={() => setStockDialogOpen(true)}
                            aria-haspopup="listbox"
                            aria-expanded={stockDialogOpen}
                            role="combobox"
                            aria-controls="stock-listbox"
                            aria-label="Select stock symbol"
                          >
                            {formData.stock
                              ? (() => {
                                  const selected = stockList.find(
                                    (s) => s.symbol === formData.stock
                                  );
                                  return selected
                                    ? `${selected.symbol} – ${selected.name} (${selected.exchange})`
                                    : formData.stock;
                                })()
                              : "Select a stock"}
                            <span className="ml-2 text-slate-400">▼</span>
                          </button>
                          <CommandDialog open={stockDialogOpen} onOpenChange={setStockDialogOpen}>
                            <CommandInput
                              placeholder="Search stock by symbol or name..."
                              value={stockSearch}
                              onValueChange={setStockSearch}
                              autoFocus
                            />
                            <CommandList id="stock-listbox">
                              <CommandEmpty>No stocks found.</CommandEmpty>
                              <CommandGroup>
                                {stockList
                                  .filter((s) =>
                                    (s.symbol + " " + s.name + " " + s.exchange)
                                      .toLowerCase()
                                      .includes(stockSearch.toLowerCase())
                                  )
                                  .slice(0, 50) // limit for performance
                                  .map((s) => (
                                    <CommandItem
                                      key={`${s.symbol}_${s.exchange}`}
                                      value={s.symbol}
                                      onSelect={() => {
                                        handleInputChange("stock", s.symbol);
                                        setStockDialogOpen(false);
                                        setStockSearch("");
                                      }}
                                      role="option"
                                      aria-selected={formData.stock === s.symbol}
                                    >
                                      <span className="font-semibold">{s.symbol}</span>
                                      <span className="ml-2 text-slate-600">{s.name}</span>
                                      <span className="ml-auto text-xs text-slate-400">{s.exchange}</span>
                                    </CommandItem>
                                  ))}
                              </CommandGroup>
                            </CommandList>
                          </CommandDialog>
                        </div>
                        <div className="space-y-2">
                          <span className="text-slate-700 font-medium">Exchange</span>
                          <div
                            id="exchange"
                            className="w-full flex items-center rounded-md border border-slate-300 bg-gray-100 px-3 py-2 text-base md:text-sm text-slate-700 cursor-not-allowed opacity-70"
                            aria-readonly="true"
                            tabIndex={-1}
                          >
                            NSE
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="sector" className="text-slate-700 font-medium">
                            Sector Classification
                            {sectorLoading && <span className="ml-2 text-xs text-blue-600">(Detecting...)</span>}
                          </Label>
                          {detectedSector && !showSectorOverride && (
                            <div className="flex items-center space-x-2">
                              <div className="flex-1 p-2 bg-green-50 border border-green-200 rounded-md text-sm">
                                <span className="font-medium text-green-800">
                                  {sectors.find(s => s.code === detectedSector)?.name || detectedSector}
                                </span>
                                <span className="text-green-600 ml-2">(Auto-detected)</span>
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setShowSectorOverride(true)}
                                className="text-xs"
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
                              <SelectTrigger id="sector" className="border-slate-300 focus:border-emerald-400">
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
                          )}
                          {detectedSector && !showSectorOverride && (
                            <div className="text-xs text-slate-500 mt-1">
                              Using sector-specific index for more accurate analysis
                            </div>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="period" className="text-slate-700 font-medium">Period (days)</Label>
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
                            <div className="text-xs text-slate-500 mt-1">
                              Max for this interval: {getMaxPeriod(formData.interval)} days
                            </div>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="interval" className="text-slate-700 font-medium">Data Interval</Label>
                          <Select value={formData.interval} onValueChange={(value) => handleInputChange("interval", value)}>
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
                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white font-semibold py-4 text-lg rounded-lg transition-all duration-300 transform hover:scale-105"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        "Running Analysis..."
                      ) : (
                        <>
                          <Play className="h-5 w-5 mr-2" />
                          Start Analysis
                        </>
                      )}
                    </Button>
                    <div className="mt-2 text-center text-slate-500 text-sm">
                      Note: The analysis typically takes 3-4 minutes to complete.
                    </div>
                    {isLoading && (
                      <div className="mt-4 text-center text-slate-700 text-lg font-medium">
                        Elapsed Time: {String(Math.floor(timer / 60)).padStart(2, '0')}:{String(timer % 60).padStart(2, '0')}
                      </div>
                    )}
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Previous Analyses Sidebar */}
            <div className="lg:col-span-1">
              <div className="h-full">
                <PreviousAnalyses onSelectAnalysis={handleSelectAnalysis} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockAnalysis;
