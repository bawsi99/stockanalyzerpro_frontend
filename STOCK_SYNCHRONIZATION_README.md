# Stock Synchronization Feature

## Overview

The stock synchronization feature ensures that the selected stock in the analysis page is automatically reflected in the charts page, and vice versa. This creates a seamless user experience where users can analyze a stock and then immediately view its charts without having to re-select the stock.

## How It Works

### 1. Global State Management

The feature uses a Zustand store (`selectedStockStore.ts`) to maintain the currently selected stock across the entire application. This store:

- Persists the selected stock in localStorage for page refresh consistency
- Tracks the source of stock selection (analysis, charts, manual, or initial)
- Provides a centralized way to update and retrieve the current stock selection

### 2. Automatic Synchronization

When a user selects a stock in either page:

1. **Analysis Page**: Stock selection updates the global store with source 'analysis'
2. **Charts Page**: Stock selection updates the global store with source 'charts'
3. **Both Pages**: Automatically sync their local state with the global store
4. **Visual Indicators**: Show "Synced" badges when the stock is synchronized

### 3. Navigation Integration

- **Analysis Page**: Added "View Charts" button to navigate to charts page
- **Charts Page**: Added "Back to Analysis" button to return to analysis page
- Both buttons maintain the selected stock context

## Implementation Details

### Store Structure

```typescript
interface SelectedStockState {
  selectedStock: string;                    // Current selected stock symbol
  selectionSource: 'analysis' | 'charts' | 'manual' | 'initial';
  
  setSelectedStock: (stock: string, source: string) => void;
  clearSelection: () => void;
  getCurrentStock: () => string;
}
```

### Key Functions

- `setSelectedStock(stock, source)`: Updates the selected stock and tracks the source
- `clearSelection()`: Clears the current selection
- `getCurrentStock()`: Returns the currently selected stock

### LocalStorage Integration

The store automatically persists the selected stock to localStorage as `'lastAnalyzedStock'`, ensuring the selection persists across page refreshes and browser sessions.

## User Experience

### Visual Feedback

- **Synced Badge**: Shows when the stock selection is synchronized between pages
- **Source Tracking**: Logs the source of each stock selection for debugging
- **Consistent State**: Both pages always show the same stock selection

### Seamless Navigation

1. User selects "RELIANCE" in analysis page
2. User clicks "View Charts" button
3. Charts page automatically loads with "RELIANCE" selected
4. User can modify stock selection in charts page
5. Analysis page automatically updates to reflect the change

## Benefits

1. **Improved UX**: No need to re-select stocks when switching between pages
2. **Consistent State**: Both pages always show the same stock selection
3. **Efficient Workflow**: Users can quickly move between analysis and charts
4. **Persistent Selection**: Stock selection survives page refreshes
5. **Debugging Support**: Clear tracking of selection sources

## Technical Implementation

### Dependencies

- Zustand for state management
- React hooks for local state synchronization
- localStorage for persistence
- React Router for navigation

### Performance Considerations

- Store uses `subscribeWithSelector` for efficient updates
- Local state is synchronized only when necessary
- Minimal re-renders through proper dependency management

## Future Enhancements

1. **Multi-stock Support**: Allow multiple stocks to be selected simultaneously
2. **Watchlist Integration**: Sync with user's watchlist selections
3. **Cross-tab Synchronization**: Share stock selection across browser tabs
4. **Analytics**: Track which stocks are most frequently analyzed together

## Testing

The feature includes comprehensive tests in `selectedStockStore.test.ts` covering:

- Store initialization
- Stock selection and persistence
- Case conversion (uppercase)
- Selection clearing
- Source tracking
- localStorage integration

## Troubleshooting

### Common Issues

1. **Stock not syncing**: Check if both pages are using the store correctly
2. **Persistent selection**: Verify localStorage is working in the browser
3. **Navigation issues**: Ensure React Router is properly configured

### Debug Information

The store logs all stock selection changes to the console with the format:
```
📊 Stock selection changed to: RELIANCE (source: analysis)
🔄 Stock selection updated: NIFTY 50 → RELIANCE
```

This helps track the flow of stock selections and identify any synchronization issues.
