
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";
import { AnalysisData } from "@/types/analysis";

interface CurrentStatusCardProps {
  stockData: AnalysisData['stock_data'];
  indicators: AnalysisData['indicators'];
}

const CurrentStatusCard = ({ stockData, indicators }: CurrentStatusCardProps) => {
  return (
    <Card className="mb-8 shadow-xl border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-t-lg">
        <div className="flex items-center space-x-2">
          <BarChart3 className="h-6 w-6" />
          <CardTitle className="text-xl">Current Status</CardTitle>
        </div>
        <CardDescription className="text-blue-100">
          Current market position and key levels
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex justify-between items-center bg-slate-50 p-3 rounded">
            <span className="text-sm text-slate-600">Current Price</span>
            <span className="font-medium text-slate-800">₹{stockData.current_price.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center bg-blue-50 p-3 rounded">
            <span className="text-sm text-slate-600">Pivot</span>
            <span className="font-medium text-blue-700">
              {indicators?.support_resistance?.pivot_points?.pivot ? 
                `₹${indicators.support_resistance.pivot_points.pivot.toFixed(2)}` :
                "Not available"}
            </span>
          </div>
          <div className="flex justify-between items-center bg-emerald-50 p-3 rounded">
            <span className="text-sm text-slate-600">Target</span>
            <span className="font-medium text-emerald-700">
              {indicators?.support_resistance?.pivot_points?.resistance_3 ? 
                `₹${indicators.support_resistance.pivot_points.resistance_3.toFixed(2)}` :
                "Not available"}
            </span>
          </div>
          <div className="flex justify-between items-center bg-red-50 p-3 rounded">
            <span className="text-sm text-slate-600">Stop Loss</span>
            <span className="font-medium text-red-700">
              {indicators?.support_resistance?.pivot_points?.support_3 ? 
                `₹${indicators.support_resistance.pivot_points.support_3.toFixed(2)}` :
                "Not available"}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CurrentStatusCard;
