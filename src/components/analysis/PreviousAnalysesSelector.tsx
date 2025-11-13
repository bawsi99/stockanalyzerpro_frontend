import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Loader2, X, FileText } from 'lucide-react';
import { format } from 'date-fns';

interface MinimalAnalysis {
  id: string;
  end_date: string | null;
  interval: string | null;
  period_days: number | null;
}

interface PreviousAnalysesSelectorProps {
  availableAnalyses: MinimalAnalysis[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  loading: boolean;
  maxSelections?: number;
}

const PreviousAnalysesSelector: React.FC<PreviousAnalysesSelectorProps> = ({
  availableAnalyses,
  selectedIds,
  onSelectionChange,
  loading,
  maxSelections = 5,
}) => {
  const handleToggleSelection = (analysisId: string) => {
    if (selectedIds.includes(analysisId)) {
      // Deselect
      onSelectionChange(selectedIds.filter(id => id !== analysisId));
    } else {
      // Select (only if under max)
      if (selectedIds.length < maxSelections) {
        onSelectionChange([...selectedIds, analysisId]);
      }
    }
  };

  const handleRemoveSelection = (analysisId: string) => {
    onSelectionChange(selectedIds.filter(id => id !== analysisId));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 text-purple-500 animate-spin mr-2" />
        <span className="text-slate-600">Loading previous analyses...</span>
      </div>
    );
  }

  if (availableAnalyses.length === 0) {
    return (
      <div className="text-center py-6">
        <FileText className="h-8 w-8 text-slate-300 mx-auto mb-2" />
        <p className="text-sm text-slate-500">No previous analyses found for this stock</p>
      </div>
    );
  }

  const selectedCount = selectedIds.length;
  const isMaxSelected = selectedCount >= maxSelections;

  return (
    <div className="space-y-4">
      {/* Selection counter */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-700">
          {selectedCount} of {maxSelections} selected
        </span>
        {isMaxSelected && (
          <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
            Maximum reached
          </Badge>
        )}
      </div>

      {/* Analyses list */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {availableAnalyses.map((analysis) => {
          const isSelected = selectedIds.includes(analysis.id);
          const interval = analysis.interval || 'N/A';
          const periodDays = analysis.period_days || 'N/A';
          
          // Format end_date
          let endDateDisplay = 'N/A';
          if (analysis.end_date) {
            try {
              endDateDisplay = format(new Date(analysis.end_date), 'MMM dd, yyyy');
            } catch (e) {
              // If parsing fails, try to use the raw value
              endDateDisplay = analysis.end_date;
            }
          }

          return (
            <div
              key={analysis.id}
              className={`rounded-lg border p-3 transition-colors ${
                isSelected
                  ? 'bg-purple-50 border-purple-300'
                  : 'bg-white border-slate-200 hover:border-purple-200 hover:bg-purple-50/50'
              }`}
            >
              <div className="flex items-start space-x-3">
                {/* Checkbox */}
                <div className="pt-1">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => handleToggleSelection(analysis.id)}
                    disabled={!isSelected && isMaxSelected}
                    className="border-purple-300 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                  />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-2">
                  {/* Display: Interval, Period, and End Date */}
                  <div className="flex items-center space-x-2 flex-wrap">
                    <Badge variant="outline" className="text-xs bg-slate-50 text-slate-700 border-slate-200">
                      {interval}
                    </Badge>
                    <Badge variant="outline" className="text-xs bg-slate-50 text-slate-700 border-slate-200">
                      {periodDays} {typeof periodDays === 'number' ? 'days' : ''}
                    </Badge>
                    <span className="text-xs text-slate-500">{endDateDisplay}</span>
                  </div>

                  {/* Remove button for selected items */}
                  {isSelected && (
                    <button
                      onClick={() => handleRemoveSelection(analysis.id)}
                      className="flex items-center text-xs text-purple-600 hover:text-purple-700 mt-1"
                      type="button"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PreviousAnalysesSelector;

