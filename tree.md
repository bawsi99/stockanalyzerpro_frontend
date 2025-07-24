# Frontend Call Tree and Architecture Overview

## Main Application (`App.tsx`)

### App Component
- **QueryClientProvider**: Provides React Query for data fetching and caching
- **AuthProvider**: Manages authentication state and user sessions
- **TooltipProvider**: Provides tooltip functionality across the app
- **BrowserRouter**: Handles client-side routing with React Router v6
- **ProtectedRoute**: Wraps protected pages requiring authentication

### Route Structure
- **/** - Index page (landing)
- **/login** - Login page
- **/auth** - Authentication page
- **/dashboard** - Protected dashboard
- **/analysis** - Protected stock analysis form
- **/output** - Protected analysis results display
- **/test** - Protected live chart testing
- **/charts** - Protected chart visualization

---

## Authentication System (`contexts/AuthContext.tsx`)

### AuthProvider
- **useState**: Manages user, session, and loading state
- **useEffect**: Checks for JWT token in localStorage on mount
- **signUp**: User registration (currently stubbed)
- **signIn**: User login (currently stubbed)
- **signInWithGoogle**: Google OAuth (not implemented)
- **signOut**: User logout and token cleanup

### AuthContext Interface
- **User**: { id: string, email: string }
- **Session**: { token: string }
- **AuthError**: { message: string }

---

## API Service Layer (`services/api.ts`)

### ApiService Class
- **analyzeStock**: POST /analyze - Comprehensive stock analysis
- **enhancedAnalyzeStock**: POST /analyze/enhanced - Enhanced analysis with code execution
- **getIndicators**: GET /stock/{symbol}/indicators - Technical indicators
- **getPatterns**: GET /patterns/{symbol} - Pattern recognition
- **getCharts**: GET /charts/{symbol} - Chart generation
- **getSectors**: GET /sector/list - Sector information
- **getSectorBenchmark**: POST /sector/benchmark - Sector benchmarking
- **getSectorStocks**: GET /sector/{sector_name}/stocks - Sector stocks
- **getSectorPerformance**: GET /sector/{sector_name}/performance - Sector performance
- **compareSectors**: POST /sector/compare - Sector comparison
- **getStockSector**: GET /stock/{symbol}/sector - Stock sector information

### Data Service Endpoints
- **getHistoricalData**: GET /stock/{symbol}/history - Historical OHLCV data
- **clearIntervalCache**: POST /market/optimization/clear-interval-cache - Clear cache
- **getStockInfo**: GET /stock/{symbol}/info - Stock information
- **getMarketStatus**: GET /market/status - Market status
- **getTokenToSymbol**: GET /mapping/token-to-symbol - Token to symbol mapping
- **getSymbolToToken**: GET /mapping/symbol-to-token - Symbol to token mapping
- **getOptimizedData**: POST /data/optimized - Optimized data fetching

### Authentication Endpoints
- **getJwtToken**: POST /auth/token - Get JWT token
- **verifyToken**: GET /auth/verify - Verify JWT token

### WebSocket Endpoints
- **getWebSocketHealth**: GET /ws/health - WebSocket health
- **getWebSocketTest**: GET /ws/test - WebSocket test
- **getWebSocketConnections**: GET /ws/connections - WebSocket connections

---

## Data Management (`hooks/useStockAnalyses.ts`)

### useStockAnalyses Hook
- **useState**: Manages analyses, analysisSummary, sectorPerformance, loading, error
- **fetchAnalyses**: Retrieves analysis history for a stock and timeframe
- **fetchSectorPerformance**: Retrieves sector performance data
- **saveAnalysis**: Saves new analysis (currently stubbed)
- **getAnalysisById**: Retrieves analysis by ID (currently stubbed)
- **getAnalysesBySignal**: Filters analyses by signal type (currently stubbed)
- **getAnalysesBySector**: Filters analyses by sector (currently stubbed)
- **getHighConfidenceAnalyses**: Filters high confidence analyses (currently stubbed)

### Data Interfaces
- **StoredAnalysis**: Complete analysis record with normalized fields
- **AnalysisSummary**: Summary view of analysis data
- **SectorPerformance**: Sector-level performance metrics

---

## Page Components

### NewStockAnalysis (`pages/NewStockAnalysis.tsx`)
- **Form State Management**: Stock, exchange, period, interval, sector
- **Stock Search**: Command dialog for stock selection
- **Sector Detection**: Automatic sector detection with override option
- **Timer**: Analysis progress tracking
- **handleSubmit**: Orchestrates analysis workflow
- **handleSelectAnalysis**: Loads previous analysis

### NewOutput (`pages/NewOutput.tsx`)
- **Analysis Display**: Comprehensive analysis results presentation
- **Chart Integration**: Live chart section with real-time data
- **Tab Management**: Overview, technical, patterns, risk tabs
- **State Management**: Analysis data, loading states, error handling
- **Chart Controls**: Chart type, shortcuts, timeframe selection

### Charts (`pages/Charts.tsx`)
- **Real-time Charts**: Live chart visualization
- **Stock Selection**: Stock picker with search functionality
- **Data Loading**: Historical and real-time data integration
- **Chart Management**: Multiple chart instances and controls

### Dashboard (`pages/Dashboard.tsx`)
- **Overview**: User dashboard with analysis summaries
- **Quick Actions**: Fast access to common functions

### LiveChartTest (`pages/LiveChartTest.tsx`)
- **Testing Interface**: Comprehensive chart testing
- **Test Results**: Status tracking and reporting
- **Performance Metrics**: Chart performance analysis

---

## Analysis Components (`components/analysis/`)

### Core Analysis Cards
- **ConsensusSummaryCard**: Overall analysis consensus and signals
- **AITradingAnalysisOverviewCard**: AI-powered trading analysis
- **TechnicalAnalysisCard**: Technical indicator summaries
- **PriceStatisticsCard**: Price statistics and positioning
- **TradingLevelsCard**: Support/resistance levels
- **VolumeAnalysisCard**: Volume pattern analysis
- **StockInfoCard**: Basic stock information

### Advanced Analysis Cards
- **AdvancedPatternAnalysisCard**: Complex pattern recognition
- **AdvancedRiskAssessmentCard**: Comprehensive risk metrics
- **AdvancedRiskMetricsCard**: Risk stress testing and scenarios
- **ComplexPatternAnalysisCard**: Triple tops/bottoms, wedges, channels
- **MultiTimeframeAnalysisCard**: Multi-timeframe consensus
- **EnhancedPatternRecognitionCard**: Enhanced pattern overlays

### Sector Analysis Cards
- **SectorAnalysisCard**: Sector context and rotation
- **SectorBenchmarkingCard**: Sector performance benchmarking
- **SectorRotationCard**: Sector rotation patterns and recommendations

### Utility Components
- **ActionButtonsSection**: Analysis action buttons
- **DisclaimerCard**: Legal disclaimers
- **PreviousAnalyses**: Historical analysis browser
- **VolumeDataAlert**: Volume data warnings

---

## Chart Components (`components/charts/`)

### Core Chart Components
- **EnhancedMultiPaneChart**: Advanced multi-pane chart with indicators
- **EnhancedSimpleChart**: Simplified chart with basic indicators
- **SimpleChart**: Basic candlestick chart
- **MultiPaneChart**: Multi-pane chart layout

### Live Chart Components
- **LiveChartSection**: Real-time chart section
- **LiveEnhancedMultiPaneChart**: Live multi-pane chart
- **LiveSimpleChart**: Live simple chart
- **LiveChartProvider**: Context provider for live data
- **LiveChartExample**: Live chart example implementation

### Chart Utilities
- **ChartDebugger**: Chart debugging and validation
- **ChartTest**: Chart testing interface
- **DataTester**: Data validation and testing

---

## UI Components (`components/ui/`)

### Form Components
- **Button**: Various button variants and sizes
- **Input**: Text input with validation
- **Label**: Form labels
- **Select**: Dropdown selection
- **Textarea**: Multi-line text input
- **Checkbox**: Checkbox input
- **RadioGroup**: Radio button groups
- **Switch**: Toggle switch
- **Slider**: Range slider

### Layout Components
- **Card**: Content cards with headers
- **Dialog**: Modal dialogs
- **Sheet**: Side sheets and drawers
- **Tabs**: Tabbed interfaces
- **Accordion**: Collapsible sections
- **Separator**: Visual separators
- **ScrollArea**: Scrollable areas
- **Resizable**: Resizable panels

### Navigation Components
- **Breadcrumb**: Navigation breadcrumbs
- **NavigationMenu**: Navigation menus
- **Command**: Command palette
- **Menubar**: Menu bars
- **DropdownMenu**: Dropdown menus
- **ContextMenu**: Context menus

### Feedback Components
- **Alert**: Alert messages
- **Toast**: Toast notifications
- **Progress**: Progress indicators
- **Skeleton**: Loading skeletons
- **Badge**: Status badges
- **Tooltip**: Tooltips

### Data Display Components
- **Table**: Data tables
- **Calendar**: Date picker
- **Avatar**: User avatars
- **AspectRatio**: Aspect ratio containers
- **Carousel**: Image carousels

---

## Utility Functions (`utils/`)

### Chart Utilities (`utils/chartUtils.ts`)
- **validateChartData**: Chart data validation
- **calculateChartStats**: Chart statistics calculation
- **detectVolumeAnomalies**: Volume anomaly detection
- **detectDoubleTop/Bottom**: Double top/bottom pattern detection
- **detectSupportResistance**: Support/resistance level detection
- **detectTriangles**: Triangle pattern detection
- **detectFlags**: Flag pattern detection
- **filterDataByTimeframe**: Data filtering by timeframe

### Pattern Recognition (`utils/patternRecognition.ts`)
- **Pattern detection algorithms**: Technical pattern recognition
- **Pattern validation**: Pattern quality assessment
- **Pattern visualization**: Pattern overlay generation

### Live Data Utilities (`utils/liveIndicators.ts`, `utils/livePatternRecognition.ts`)
- **Real-time indicators**: Live technical indicator calculation
- **Live pattern detection**: Real-time pattern recognition
- **Data streaming**: WebSocket data handling

### Enhanced Utilities (`utils/enhancedPatternRecognition.ts`, `utils/enhancedTestData.ts`)
- **Advanced patterns**: Complex pattern recognition
- **Test data generation**: Synthetic data for testing
- **Performance optimization**: Optimized algorithms

### Text Processing (`utils/textCleaner.ts`)
- **Text cleaning**: Data sanitization
- **Format normalization**: Consistent formatting

---

## Configuration and Types

### Configuration (`config.ts`)
- **ENDPOINTS**: API endpoint configuration
- **Environment variables**: Environment-specific settings

### Type Definitions (`types/analysis.ts`)
- **AnalysisData**: Complete analysis data structure
- **ApiResponse**: API response types
- **ChartData**: Chart data structures
- **EnhancedOverlays**: Advanced chart overlays
- **SectorContext**: Sector analysis context
- **SectorBenchmarking**: Sector benchmarking data

---

## Call Flow

### Analysis Workflow
1. **NewStockAnalysis.handleSubmit()**
   ├─ validateFormData()
   ├─ apiService.analyzeStock()
   ├─ saveAnalysis()
   └─ navigate to /output

### Data Loading Flow
1. **NewOutput.useEffect()**
   ├─ loadAnalysisFromStorage()
   ├─ apiService.getRealtimeAnalysis()
   ├─ setAnalysisData()
   └─ initializeChart()

### Chart Rendering Flow
1. **EnhancedMultiPaneChart.useEffect()**
   ├─ validateChartData()
   ├─ createChart()
   ├─ addSeries()
   ├─ calculateIndicators()
   ├─ detectPatterns()
   └─ drawOverlays()

### Authentication Flow
1. **AuthProvider.useEffect()**
   ├─ checkLocalStorage()
   ├─ setUser()
   └─ setSession()

---

## Data Flow

### Input Data
- Stock symbol and exchange
- Analysis parameters (period, interval)
- User authentication credentials
- Real-time market data

### Processing Steps
1. **Data Validation**: Form validation and data sanitization
2. **API Communication**: Backend service calls
3. **State Management**: React state and context management
4. **Chart Rendering**: Chart library integration
5. **Pattern Detection**: Technical pattern recognition
6. **Analysis Display**: Results presentation and visualization

### Output Data
- Interactive charts with overlays
- Analysis results and recommendations
- Real-time data updates
- User interface components

---

## State Management

### Global State
- **AuthContext**: User authentication and session
- **QueryClient**: Data fetching and caching
- **Router State**: Navigation and routing

### Local State
- **Component State**: Individual component state
- **Form State**: Form data and validation
- **UI State**: Loading, error, and display states

### Data Persistence
- **localStorage**: User preferences and tokens
- **React Query Cache**: API response caching
- **Session Storage**: Temporary session data

---

## Performance Optimizations

### Chart Optimizations
- **Responsive Design**: Mobile and tablet adaptations
- **Data Limiting**: Maximum data point limits
- **Lazy Loading**: On-demand component loading
- **Memoization**: React.memo and useMemo usage

### Data Optimizations
- **Caching**: React Query caching strategies
- **Debouncing**: Input debouncing for search
- **Throttling**: Real-time data throttling
- **Pagination**: Large dataset pagination

### UI Optimizations
- **Virtual Scrolling**: Large list virtualization
- **Code Splitting**: Route-based code splitting
- **Bundle Optimization**: Tree shaking and minification
- **Image Optimization**: Chart image compression 