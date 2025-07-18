
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, Shield, TrendingUp } from "lucide-react";
import { AnalysisData } from "@/types/analysis";

interface TradingLevelsCardProps {
  indicators: AnalysisData['indicators'];
}

const TradingLevelsCard = ({ indicators }: TradingLevelsCardProps) => {
  return (
    <Card className="mb-8 shadow-xl border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-t-lg">
        <div className="flex items-center space-x-2">
          <Target className="h-6 w-6" />
          <CardTitle className="text-xl">Key Trading Levels</CardTitle>
        </div>
        <CardDescription className="text-blue-100">
          Important price levels for trading decisions
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Support Levels */}
          <div className="space-y-3">
            <h3 className="font-semibold text-slate-700 flex items-center">
              <Shield className="h-4 w-4 mr-2 text-green-500" />
              Support Levels
            </h3>
            <div className="space-y-2">
              {indicators?.support_resistance?.support_levels?.map((level: number, index: number) => (
                <div key={index} className="flex justify-between items-center bg-green-50 p-3 rounded">
                  <span className="text-sm text-slate-600">Level {index + 1}</span>
                  <span className="font-medium text-green-700">₹{Number(level).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Resistance Levels */}
          <div className="space-y-3">
            <h3 className="font-semibold text-slate-700 flex items-center">
              <TrendingUp className="h-4 w-4 mr-2 text-red-500" />
              Resistance Levels
            </h3>
            <div className="space-y-2">
              {indicators?.support_resistance?.resistance_levels?.map((level: number, index: number) => (
                <div key={index} className="flex justify-between items-center bg-red-50 p-3 rounded">
                  <span className="text-sm text-slate-600">Level {index + 1}</span>
                  <span className="font-medium text-red-700">₹{Number(level).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TradingLevelsCard;
