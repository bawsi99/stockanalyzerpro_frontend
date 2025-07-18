
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import { AnalysisData } from "@/types/analysis";

interface StockInfoCardProps {
  stockData: AnalysisData['stock_data'];
}

const StockInfoCard = ({ stockData }: StockInfoCardProps) => {
  return (
    <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-t-lg">
        <div className="flex items-center space-x-2">
          <CheckCircle className="h-6 w-6" />
          <CardTitle className="text-xl">Stock Information</CardTitle>
        </div>
        <CardDescription className="text-green-100">
          Current market data and analysis period
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-slate-600">Symbol:</span>
            <span className="font-semibold">{stockData.symbol}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Exchange:</span>
            <span className="font-semibold">{stockData.exchange}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Current Price:</span>
            <span className="font-semibold text-slate-800">₹{stockData.current_price}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Period:</span>
            <span className="font-semibold text-sm">{stockData.period}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Date Range:</span>
            <span className="font-semibold text-sm">{stockData.date_range}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StockInfoCard;
