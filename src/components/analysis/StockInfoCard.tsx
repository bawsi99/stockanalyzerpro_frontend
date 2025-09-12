
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StockInfoCardProps {
  symbol: string;
  currentPrice: number | null;
  priceChange: { change: number; changePercent: number } | null;
  exchange?: string;
  metadata?: any;
  summary?: any;
}

const StockInfoCard = ({ symbol, currentPrice, priceChange, exchange, metadata, summary }: StockInfoCardProps) => {
  const getPriceChangeIcon = (changePercent: number) => {
    if (changePercent > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (changePercent < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-gray-600" />;
  };

  const getPriceChangeColor = (changePercent: number) => {
    if (changePercent > 0) return 'text-green-600';
    if (changePercent < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-t-lg">
        <div className="flex items-center space-x-2">
          <CheckCircle className="h-6 w-6" />
          <CardTitle className="text-xl">Stock Information</CardTitle>
        </div>
        <CardDescription className="text-green-100">
          Current market data and analysis details
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Symbol and Exchange */}
          <div className="flex justify-between items-center">
            <span className="text-slate-600">Symbol:</span>
            <span className="font-semibold text-lg">{symbol}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-slate-600">Exchange:</span>
            <span className="font-semibold">{exchange || metadata?.exchange || 'NSE'}</span>
          </div>

          {/* Current Price */}
          <div className="flex justify-between items-center">
            <span className="text-slate-600">Current Price:</span>
            <span className="font-semibold text-slate-800 text-lg">
              ₹{currentPrice?.toFixed(2) || 'N/A'}
            </span>
          </div>

          {/* Price Change */}
          {priceChange && (
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Price Change:</span>
              <div className="flex items-center space-x-2">
                {getPriceChangeIcon(priceChange.changePercent)}
                <span className={`font-semibold ${getPriceChangeColor(priceChange.changePercent)}`}>
                  ₹{priceChange.change.toFixed(2)} ({priceChange.changePercent.toFixed(2)}%)
                </span>
              </div>
            </div>
          )}

          {/* Analysis Period */}
          <div className="flex justify-between items-center">
            <span className="text-slate-600">Analysis Period:</span>
            <span className="font-semibold text-sm">{metadata?.data_period || 'N/A'}</span>
          </div>

          {/* Analysis Date */}
          <div className="flex justify-between items-center">
            <span className="text-slate-600">Analysis Date:</span>
            <span className="font-semibold text-sm">
              {metadata?.analysis_date ? new Date(metadata.analysis_date).toLocaleDateString() : 'N/A'}
            </span>
          </div>

          {/* Risk Level */}
          {summary?.risk_level && (
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Risk Level:</span>
              <Badge 
                variant="outline" 
                className={`${
                  summary.risk_level.toLowerCase() === 'low' ? 'bg-green-100 text-green-700 border-green-200' :
                  summary.risk_level.toLowerCase() === 'medium' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                  'bg-red-100 text-red-700 border-red-200'
                }`}
              >
                {summary.risk_level}
              </Badge>
            </div>
          )}

          {/* Analysis Quality */}
          {summary?.analysis_quality && (
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Analysis Quality:</span>
              <Badge 
                variant="outline" 
                className={`${
                  summary.analysis_quality.toLowerCase() === 'high' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                  summary.analysis_quality.toLowerCase() === 'medium' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                  'bg-red-100 text-red-700 border-red-200'
                }`}
              >
                {summary.analysis_quality}
              </Badge>
            </div>
          )}

          {/* Sector */}
          {metadata?.sector && (
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Sector:</span>
              <span className="font-semibold text-sm">{metadata.sector}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default StockInfoCard;
