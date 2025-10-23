import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

export const TechnicalAnalysisCard = () => (
  <Card className="bg-gradient-to-br from-card to-secondary/30 border-primary/20 flex items-center justify-center min-h-[140px] relative">
    {/* LIVE Badge */}
    <div className="absolute top-2 right-2 text-green-400 text-[10px] font-semibold px-2 py-1 rounded-full">
      LIVE
    </div>
    <CardHeader className="pb-2 items-center text-center">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-md bg-primary/10">
          <BarChart3 className="w-5 h-5 text-green-400" />
        </div>
        <CardTitle className="text-xl">Technical Analysis</CardTitle>
      </div>
      <CardDescription>Indicators, patterns, ML scoring, multi-timeframe</CardDescription>
    </CardHeader>
  </Card>
);
