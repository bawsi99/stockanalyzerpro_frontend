# Archive Folder

This folder contains deprecated files that were part of the chart system refactoring completed on 2024-07-25.

## 📁 Contents

### `/charts/` - Deprecated Chart Components
All chart components have been consolidated into the unified `Charts.tsx` page and `LiveSimpleChart.tsx` component.

**Archived Components:**
- `ChartDebugger.tsx` - Debug functionality integrated
- `ChartIndicatorsPanel.tsx` - Panel functionality integrated  
- `ChartsMultiPaneChart.tsx` - Multi-pane functionality integrated
- `ChartTest.tsx` - Testing functionality integrated
- `DataTester.tsx` - Data testing functionality integrated
- `EnhancedChartsMultiPaneChart.tsx` - Enhanced functionality integrated
- `EnhancedMultiPaneChart.tsx` - Enhanced functionality integrated
- `EnhancedSimpleChart.tsx` - Simple chart functionality integrated
- `LiveChartExample.tsx` - Example functionality integrated
- `LiveChartProvider.tsx` - Provider functionality integrated
- `LiveChartSection.tsx` - Section functionality integrated
- `LiveEnhancedMultiPaneChart.tsx` - Live enhanced functionality integrated
- `MultiPaneChart.tsx` - Multi-pane functionality integrated
- `OptimizedChart.tsx` - Optimization functionality integrated

### `/hooks/` - Deprecated Hooks
- `useChartReset.ts` - Reset functionality integrated into main components

## 🔄 Migration

All functionality from these archived files has been integrated into:

- **`/pages/Charts.tsx`** - Unified chart page with tabbed interface
- **`/components/charts/LiveSimpleChart.tsx`** - Core chart component
- **`/hooks/useLiveChart.ts`** - WebSocket management hook

## 📋 Deprecation Notices

All archived files have been marked with `@deprecated` notices indicating:
- The file is no longer in use
- Where the functionality has been moved
- The date of archiving
- The reason for deprecation

## 🗑️ Cleanup

These files can be safely removed after:
1. The new unified chart system has been thoroughly tested
2. All functionality has been validated
3. No references to these files remain in the codebase

## 📖 Documentation

See `CHART_REFACTORING_DOCUMENTATION.md` for detailed information about the refactoring process and new architecture. 