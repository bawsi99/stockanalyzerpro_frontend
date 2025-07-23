# Charts Page - Live Stock Chart Testing

## Overview
The `/charts` page is a dedicated testing environment for live stock charts with a simple, clean interface designed for testing and debugging chart functionality.

## Features

### 🎯 Core Functionality
- **Stock Input Field**: Enter any stock symbol manually
- **Quick Stock Selection**: Click on available stock badges for instant selection
- **Interval Toggle Buttons**: Switch between different timeframes (1m, 5m, 15m, 1h, 1d)
- **Theme Toggle**: Switch between light and dark themes
- **Live Data**: Real-time streaming data with 1-second updates

### 📊 Chart Features
- **Multi-pane Chart**: Price chart with volume and indicators
- **365 Days Default**: Automatically loads 365 days of historical data for daily intervals
- **Real-time Updates**: Live data streaming when market is open
- **Responsive Design**: Works on desktop and mobile devices

### 🎨 UI Components
- **Clean Interface**: Minimal, focused design for testing
- **Status Indicators**: Shows current stock, token, interval, and theme
- **Interactive Controls**: Easy-to-use buttons and input fields
- **Visual Feedback**: Clear indication of selected options

## Available Stocks
The page includes 20 popular Indian stocks with their Zerodha tokens:
- RELIANCE, TCS, HDFC, INFY, ICICIBANK
- HINDUNILVR, ITC, SBIN, BHARTIARTL, AXISBANK
- WIPRO, HCLTECH, ASIANPAINT, MARUTI, SUNPHARMA
- ULTRACEMCO, TITAN, BAJFINANCE, NESTLEIND, POWERGRID

## Timeframes
- **1 Minute**: Intraday trading
- **5 Minutes**: Short-term analysis
- **15 Minutes**: Medium-term analysis
- **1 Hour**: Hourly analysis
- **1 Day**: Daily analysis (default)

## Usage Instructions

1. **Navigate to Charts**: Go to `/charts` in your browser
2. **Select Stock**: 
   - Type a stock symbol in the input field, or
   - Click on any available stock badge
3. **Choose Interval**: Click on the desired timeframe button
4. **Toggle Theme**: Use the theme button to switch between light/dark
5. **View Chart**: The chart will automatically update with your selections

## Technical Details

### Components Used
- `LiveEnhancedMultiPaneChart`: Main chart component
- `LiveChartProvider`: Data provider and WebSocket management
- UI Components: Card, Button, Input, Badge from shadcn/ui

### Data Flow
1. User selects stock → Token lookup
2. User selects timeframe → Chart re-renders
3. LiveChartProvider connects to WebSocket
4. Real-time data streams to chart
5. Chart updates with new data points

### Configuration
- **Max Data Points**: 1000
- **Update Interval**: 1000ms (1 second)
- **Auto Connect**: Enabled
- **Debug Mode**: Disabled by default

## Development Notes

### Adding New Stocks
To add more stocks, update the `STOCK_TOKENS` object in `Charts.tsx`:
```typescript
const STOCK_TOKENS: { [key: string]: string } = {
  'NEWSTOCK': 'token_id',
  // ... existing stocks
};
```

### Modifying Timeframes
To change available timeframes, update the `TIMEFRAMES` array:
```typescript
const TIMEFRAMES = [
  { label: 'Custom Label', value: 'custom_value' },
  // ... existing timeframes
];
```

### Styling
The page uses Tailwind CSS classes and shadcn/ui components. The layout is responsive and follows the existing design system.

## Testing
This page is ideal for:
- Testing chart rendering performance
- Debugging WebSocket connections
- Validating real-time data flow
- Testing different stock symbols and timeframes
- UI/UX testing for chart controls

## Access
The page is protected and requires authentication. Navigate to `/charts` after logging in. 