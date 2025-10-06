# Pattern Chart Feature Documentation

## Overview

The Pattern Chart feature adds a new visual chart section to the Enhanced Pattern Recognition Card within the Technical Tab. This chart displays historical stock data with pattern overlays to help users visualize detected chart patterns.

## Implementation Details

### New Components

#### 1. `PatternChart.tsx`
- **Location**: `frontend/src/components/PatternChart.tsx`
- **Purpose**: Renders candlestick/line charts with pattern overlays using `lightweight-charts`
- **Key Features**:
  - Toggle between candlestick and line chart views
  - Pattern overlays with distinct colors per pattern type
  - Loading, error, and empty states
  - Responsive design (400px height)
  - Pattern legend showing detected patterns with counts

#### 2. Updated `useHistoricalData.ts` Hook
- **Location**: `frontend/src/hooks/useHistoricalData.ts` 
- **Purpose**: Fetches historical OHLCV data from the data service
- **Key Features**:
  - Supports different analysis periods (90 days, 6 months, 1 year)
  - Supports different intervals (1day, 1hour, etc.)
  - Error handling and loading states
  - Data caching via built-in state management

### Integration Points

#### 1. `EnhancedPatternRecognitionCard.tsx`
- **Changes**: Added PatternChart integration after the Pattern Summary section
- **New Props**:
  - `analysisPeriod?: string` - Controls the time period for historical data
  - `interval?: string` - Controls the data interval (1day, 1hour, etc.)
- **Conditional Rendering**: Chart only shows when patterns are detected

#### 2. `NewOutput.tsx` 
- **Changes**: Passes `analysis_period` and `interval` from enhanced data to the pattern card
- **Data Flow**: `enhancedData?.analysis_period` and `enhancedData?.interval` are passed as props

## Pattern Visualization

### Pattern Colors
- **Bullish Patterns** (Green shades):
  - Triple Bottoms: `#22c55e`
  - Inverse Head and Shoulders: `#16a34a`
  - Cup and Handle: `#15803d`

- **Bearish Patterns** (Red shades):
  - Triple Tops: `#ef4444`
  - Head and Shoulders: `#dc2626`

- **Neutral Patterns**:
  - Wedge Patterns: `#eab308` (Yellow)
  - Channel Patterns: `#8b5cf6` (Purple)

### Pattern Markers
- **Start markers**: Arrow up markers indicating pattern start
- **End markers**: Arrow down markers indicating pattern end
- **Pattern legend**: Shows all detected patterns with counts

## Data Flow

```
Backend API → useHistoricalData Hook → PatternChart Component
                ↓
1. Fetches OHLCV data from data service /stock/{symbol}/history
2. Transforms response.candles to chart format
3. Renders chart with lightweight-charts
4. Overlays pattern markers based on start/end dates
```

## Chart Features

### Toggle Functionality
- **Candlestick View**: Shows OHLC data as candlesticks
- **Line View**: Shows closing prices as a line chart
- **Smooth Transitions**: Toggle between views without data reload

### Pattern Overlays
- **Marker Positioning**: Uses pattern start_date and end_date for positioning
- **Color Coding**: Each pattern type has a distinct color
- **Tooltip Information**: Shows pattern type and timing information

## Technical Specifications

### Dependencies
- `lightweight-charts`: For chart rendering
- `react-query` (via useHistoricalData): For data fetching and caching
- `lucide-react`: For icons
- Existing UI components from shadcn/ui

### Performance Considerations
- **Data Caching**: Historical data is cached to avoid redundant API calls
- **Conditional Rendering**: Chart only renders when patterns are detected
- **Optimized Rendering**: Uses React memoization where applicable
- **Data Limits**: Historical data limited to reasonable ranges (500 points max)

## Error Handling

### Loading States
- Shows loading spinner and message while fetching data
- Graceful handling of network delays

### Error States  
- Displays user-friendly error messages
- Handles common errors (symbol not found, network issues, rate limits)

### Empty States
- Shows appropriate message when no data is available
- Conditional rendering prevents empty charts

## Testing

### Unit Tests
- Component rendering tests
- Loading/error/empty state tests  
- Props validation tests
- Pattern legend rendering tests

### Test File
- **Location**: `frontend/src/components/PatternChart.test.tsx`
- **Coverage**: All major component states and functionality

## Usage Example

```tsx
<PatternChart 
  data={historicalData}
  patterns={patternData}
  symbol="RELIANCE"
  loading={false}
  error={null}
  height={400}
/>
```

## Configuration

### Default Values
- **Analysis Period**: "90 days"
- **Interval**: "1day" 
- **Chart Height**: 400px
- **Exchange**: "NSE"

### Customizable Props
- `analysisPeriod`: Controls historical data range
- `interval`: Controls data granularity  
- `height`: Chart container height
- `symbol`: Stock symbol for display and data fetching

## Future Enhancements

### Potential Improvements
1. **Interactive Patterns**: Click on pattern markers for detailed information
2. **Multiple Timeframes**: Support for multiple timeframe analysis in single view
3. **Pattern Confidence**: Visual indication of pattern confidence levels
4. **Export Functionality**: Allow users to export chart images
5. **Advanced Overlays**: Support for support/resistance lines, trendlines
6. **Real-time Updates**: Integration with live data feeds for real-time pattern detection

### Technical Debt
- Consider migrating to a more robust charting solution for advanced features
- Implement proper error boundary for chart component
- Add accessibility improvements for screen readers
- Optimize chart rendering for large datasets

## Conclusion

The Pattern Chart feature successfully integrates historical data visualization with pattern detection results, providing users with an intuitive way to understand detected chart patterns in the context of historical price movements. The implementation is robust, well-tested, and follows existing code patterns in the application.