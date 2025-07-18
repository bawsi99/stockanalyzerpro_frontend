import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, BarChart3 } from "lucide-react";
import { AnalysisData } from "@/types/analysis";

interface TechnicalAnalysisCardProps {
  indicatorSummary: string;
}

const TechnicalAnalysisCard = ({ indicatorSummary }: TechnicalAnalysisCardProps) => {
  // Simple markdown to HTML conversion for basic formatting
  const formatMarkdown = (text: string) => {
    // Remove the structured data section (HTML comments and JSON)
    const cleanedText = text.replace(/<!-- BEGIN STRUCTURED DATA - NOT FOR DISPLAY -->[\s\S]*?<!-- END STRUCTURED DATA - NOT FOR DISPLAY -->/g, '');
    
    return cleanedText
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/## (.*?)\n/g, '<h2 class="text-lg font-semibold text-slate-800 mt-4 mb-2">$1</h2>')
      .replace(/# (.*?)\n/g, '<h1 class="text-xl font-bold text-slate-800 mt-6 mb-3">$1</h1>')
      .replace(/\n\n/g, '</p><p class="mb-2">')
      .replace(/^\n/, '<p class="mb-2">')
      .replace(/\n$/, '</p>')
      .replace(/^/, '<p class="mb-2">')
      .replace(/$/, '</p>');
  };

  return (
    <div className="space-y-6">
      {/* Indicator Summary */}
      <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center text-slate-800">
            <BarChart3 className="h-5 w-5 mr-2 text-blue-500" />
            Technical Indicator Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div 
            className="prose prose-sm max-w-none text-slate-700"
            dangerouslySetInnerHTML={{ __html: formatMarkdown(indicatorSummary) }}
          />
        </CardContent>
      </Card>


    </div>
  );
};

export default TechnicalAnalysisCard; 