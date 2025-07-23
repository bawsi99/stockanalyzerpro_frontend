import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useStockAnalyses, StoredAnalysis, AnalysisSummary, SectorPerformance } from '@/hooks/useStockAnalyses';
import { useAuth } from '@/contexts/AuthContext';

interface EnhancedAnalysisDashboardProps {
  className?: string;
}

export const EnhancedAnalysisDashboard: React.FC<EnhancedAnalysisDashboardProps> = ({ className }) => {
  const { user } = useAuth();
  const { 
    analyses, 
    analysisSummary, 
    sectorPerformance, 
    loading, 
    error,
    getAnalysesBySignal,
    getAnalysesBySector,
    getHighConfidenceAnalyses
  } = useStockAnalyses();

  const [selectedSignal, setSelectedSignal] = useState<string>('all');
  const [selectedSector, setSelectedSector] = useState<string>('all');
  const [filteredAnalyses, setFilteredAnalyses] = useState<StoredAnalysis[]>([]);
  const [highConfidenceAnalyses, setHighConfidenceAnalyses] = useState<StoredAnalysis[]>([]);

  useEffect(() => {
    setFilteredAnalyses(analyses);
  }, [analyses]);

  useEffect(() => {
    const fetchHighConfidence = async () => {
      const highConfidence = await getHighConfidenceAnalyses(80);
      setHighConfidenceAnalyses(highConfidence);
    };
    fetchHighConfidence();
  }, [getHighConfidenceAnalyses]);

  const handleSignalFilter = async (signal: string) => {
    setSelectedSignal(signal);
    if (signal === 'all') {
      setFilteredAnalyses(analyses);
    } else {
      const filtered = await getAnalysesBySignal(signal);
      setFilteredAnalyses(filtered);
    }
  };

  const handleSectorFilter = async (sector: string) => {
    setSelectedSector(sector);
    if (sector === 'all') {
      setFilteredAnalyses(analyses);
    } else {
      const filtered = await getAnalysesBySector(sector);
      setFilteredAnalyses(filtered);
    }
  };

  const getSignalColor = (signal: string | null) => {
    switch (signal?.toLowerCase()) {
      case 'bullish':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'bearish':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'neutral':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getConfidenceColor = (confidence: number | null) => {
    if (!confidence) return 'bg-gray-100 text-gray-800';
    if (confidence >= 80) return 'bg-green-100 text-green-800';
    if (confidence >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getRiskColor = (risk: string | null) => {
    switch (risk?.toLowerCase()) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!user) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <p className="text-center text-gray-500">Please log in to view your analysis dashboard.</p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading analysis dashboard...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <p className="text-center text-red-500">Error loading dashboard: {error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analyses">Analyses</TabsTrigger>
          <TabsTrigger value="sectors">Sectors</TabsTrigger>
          <TabsTrigger value="high-confidence">High Confidence</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Analyses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyses.length}</div>
                <p className="text-xs text-muted-foreground">
                  {analyses.filter(a => a.created_at > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()).length} this week
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Bullish Signals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {analyses.filter(a => a.overall_signal?.toLowerCase() === 'bullish').length}
                </div>
                <p className="text-xs text-muted-foreground">
                  {((analyses.filter(a => a.overall_signal?.toLowerCase() === 'bullish').length / analyses.length) * 100).toFixed(1)}% of total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Confidence</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analyses.length > 0 
                    ? (analyses.reduce((sum, a) => sum + (a.confidence_score || 0), 0) / analyses.length).toFixed(1)
                    : '0'
                  }%
                </div>
                <p className="text-xs text-muted-foreground">
                  Across all analyses
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sectors Analyzed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {new Set(analyses.map(a => a.sector).filter(Boolean)).size}
                </div>
                <p className="text-xs text-muted-foreground">
                  Unique sectors
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent High-Confidence Analyses</CardTitle>
              <CardDescription>Analyses with confidence score ≥ 80%</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {highConfidenceAnalyses.slice(0, 5).map((analysis) => (
                  <div key={analysis.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Badge className={getSignalColor(analysis.overall_signal)}>
                        {analysis.overall_signal || 'Unknown'}
                      </Badge>
                      <span className="font-medium">{analysis.stock_symbol}</span>
                      {analysis.sector && (
                        <Badge variant="outline">{analysis.sector}</Badge>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getConfidenceColor(analysis.confidence_score)}>
                        {analysis.confidence_score}% confidence
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {new Date(analysis.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analyses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analysis Filters</CardTitle>
              <CardDescription>Filter your analyses by signal and sector</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <Select value={selectedSignal} onValueChange={handleSignalFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by signal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Signals</SelectItem>
                    <SelectItem value="Bullish">Bullish</SelectItem>
                    <SelectItem value="Bearish">Bearish</SelectItem>
                    <SelectItem value="Neutral">Neutral</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={selectedSector} onValueChange={handleSectorFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by sector" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sectors</SelectItem>
                    {Array.from(new Set(analyses.map(a => a.sector).filter(Boolean))).map(sector => (
                      <SelectItem key={sector} value={sector!}>{sector}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Filtered Analyses ({filteredAnalyses.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredAnalyses.map((analysis) => (
                  <div key={analysis.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-4">
                      <div className="flex flex-col">
                        <span className="font-semibold">{analysis.stock_symbol}</span>
                        <span className="text-sm text-muted-foreground">
                          {analysis.exchange} • {analysis.interval} • {analysis.period_days} days
                        </span>
                      </div>
                      <Badge className={getSignalColor(analysis.overall_signal)}>
                        {analysis.overall_signal || 'Unknown'}
                      </Badge>
                      {analysis.sector && (
                        <Badge variant="outline">{analysis.sector}</Badge>
                      )}
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge className={getConfidenceColor(analysis.confidence_score)}>
                        {analysis.confidence_score}% confidence
                      </Badge>
                      {analysis.risk_level && (
                        <Badge className={getRiskColor(analysis.risk_level)}>
                          {analysis.risk_level} risk
                        </Badge>
                      )}
                      <span className="text-sm text-muted-foreground">
                        {new Date(analysis.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sectors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sector Performance Overview</CardTitle>
              <CardDescription>Analysis performance by sector</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sectorPerformance.map((sector) => (
                  <div key={sector.sector} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="flex flex-col">
                        <span className="font-semibold">{sector.sector}</span>
                        <span className="text-sm text-muted-foreground">
                          {sector.analysis_count} analyses
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-center">
                        <div className="text-lg font-semibold">{sector.avg_confidence?.toFixed(1)}%</div>
                        <div className="text-xs text-muted-foreground">Avg Confidence</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-green-600">{sector.bullish_count}</div>
                        <div className="text-xs text-muted-foreground">Bullish</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-red-600">{sector.bearish_count}</div>
                        <div className="text-xs text-muted-foreground">Bearish</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-yellow-600">{sector.neutral_count}</div>
                        <div className="text-xs text-muted-foreground">Neutral</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="high-confidence" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>High Confidence Analyses</CardTitle>
              <CardDescription>Analyses with confidence score ≥ 80%</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {highConfidenceAnalyses.map((analysis) => (
                  <div key={analysis.id} className="flex items-center justify-between p-4 border rounded-lg bg-green-50">
                    <div className="flex items-center space-x-4">
                      <div className="flex flex-col">
                        <span className="font-semibold">{analysis.stock_symbol}</span>
                        <span className="text-sm text-muted-foreground">
                          {analysis.exchange} • {analysis.interval} • {analysis.period_days} days
                        </span>
                      </div>
                      <Badge className={getSignalColor(analysis.overall_signal)}>
                        {analysis.overall_signal || 'Unknown'}
                      </Badge>
                      {analysis.sector && (
                        <Badge variant="outline">{analysis.sector}</Badge>
                      )}
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge className="bg-green-100 text-green-800">
                        {analysis.confidence_score}% confidence
                      </Badge>
                      {analysis.risk_level && (
                        <Badge className={getRiskColor(analysis.risk_level)}>
                          {analysis.risk_level} risk
                        </Badge>
                      )}
                      <span className="text-sm text-muted-foreground">
                        {new Date(analysis.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}; 