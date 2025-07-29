
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target, Shield, TrendingUp, AlertTriangle } from "lucide-react";

interface TradingLevelsCardProps {
  supportLevels?: number[];
  resistanceLevels?: number[];
  currentPrice?: number | null;
  symbol: string;
}

const TradingLevelsCard = ({ supportLevels, resistanceLevels, currentPrice, symbol }: TradingLevelsCardProps) => {
  const getLevelStatus = (level: number, isSupport: boolean) => {
    if (!currentPrice) return 'neutral';
    
    const distance = Math.abs(currentPrice - level);
    const percentage = (distance / currentPrice) * 100;
    
    if (percentage <= 2) return 'near';
    if (percentage <= 5) return 'close';
    return 'far';
  };

  const getLevelColor = (level: number, isSupport: boolean) => {
    const status = getLevelStatus(level, isSupport);
    
    if (status === 'near') return isSupport ? 'bg-green-100 border-green-300' : 'bg-red-100 border-red-300';
    if (status === 'close') return isSupport ? 'bg-yellow-100 border-yellow-300' : 'bg-orange-100 border-orange-300';
    return isSupport ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200';
  };

  const getLevelTextColor = (level: number, isSupport: boolean) => {
    const status = getLevelStatus(level, isSupport);
    
    if (status === 'near') return isSupport ? 'text-green-700' : 'text-red-700';
    if (status === 'close') return isSupport ? 'text-yellow-700' : 'text-orange-700';
    return isSupport ? 'text-green-600' : 'text-red-600';
  };

  const getLevelBadge = (level: number, isSupport: boolean) => {
    const status = getLevelStatus(level, isSupport);
    
    if (status === 'near') return <Badge className="bg-red-500 text-white text-xs">Near</Badge>;
    if (status === 'close') return <Badge className="bg-yellow-500 text-white text-xs">Close</Badge>;
    return null;
  };

  const calculateDistance = (level: number) => {
    if (!currentPrice) return null;
    const distance = currentPrice - level;
    const percentage = (distance / currentPrice) * 100;
    return { distance, percentage };
  };

  return (
    <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
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
            {supportLevels && supportLevels.length > 0 ? (
              <div className="space-y-2">
                {supportLevels.map((level, index) => {
                  const distanceInfo = calculateDistance(level);
                  return (
                    <div key={index} className={`flex justify-between items-center p-3 rounded border ${getLevelColor(level, true)}`}>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-slate-600">Support {index + 1}</span>
                          {getLevelBadge(level, true)}
                        </div>
                        <div className="font-medium text-lg text-green-700">₹{Number(level).toFixed(2)}</div>
                        {distanceInfo && (
                          <div className="text-xs text-slate-500">
                            {distanceInfo.distance > 0 ? 'Above' : 'Below'} current price by ₹{Math.abs(distanceInfo.distance).toFixed(2)} ({Math.abs(distanceInfo.percentage).toFixed(1)}%)
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-4 text-slate-500">
                <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-slate-400" />
                <p className="text-sm">No support levels available</p>
              </div>
            )}
          </div>

          {/* Resistance Levels */}
          <div className="space-y-3">
            <h3 className="font-semibold text-slate-700 flex items-center">
              <TrendingUp className="h-4 w-4 mr-2 text-red-500" />
              Resistance Levels
            </h3>
            {resistanceLevels && resistanceLevels.length > 0 ? (
              <div className="space-y-2">
                {resistanceLevels.map((level, index) => {
                  const distanceInfo = calculateDistance(level);
                  return (
                    <div key={index} className={`flex justify-between items-center p-3 rounded border ${getLevelColor(level, false)}`}>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-slate-600">Resistance {index + 1}</span>
                          {getLevelBadge(level, false)}
                        </div>
                        <div className="font-medium text-lg text-red-700">₹{Number(level).toFixed(2)}</div>
                        {distanceInfo && (
                          <div className="text-xs text-slate-500">
                            {distanceInfo.distance > 0 ? 'Below' : 'Above'} current price by ₹{Math.abs(distanceInfo.distance).toFixed(2)} ({Math.abs(distanceInfo.percentage).toFixed(1)}%)
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-4 text-slate-500">
                <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-slate-400" />
                <p className="text-sm">No resistance levels available</p>
              </div>
            )}
          </div>
        </div>

        {/* Current Price Reference */}
        {currentPrice && (
          <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="text-center">
              <div className="text-sm text-slate-600 mb-1">Current Price</div>
              <div className="text-2xl font-bold text-slate-800">₹{currentPrice.toFixed(2)}</div>
              <div className="text-xs text-slate-500 mt-1">
                Reference point for level analysis
              </div>
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="mt-4 p-3 bg-slate-50 rounded-lg">
          <div className="text-xs text-slate-600 mb-2 font-medium">Legend:</div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span>Near Level</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-yellow-500 rounded"></div>
              <span>Close Level</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-gray-400 rounded"></div>
              <span>Far Level</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TradingLevelsCard;
