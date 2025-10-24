# StockAnalyzer Pro - Frontend

Modern React-based frontend for StockAnalyzer Pro, providing real-time stock market analysis, live charting, technical indicators, and AI-powered insights.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ (recommend using [nvm](https://github.com/nvm-sh/nvm))
- npm or yarn
- Backend services running (see [backend README](../backend/README.md))

### Installation

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server (runs on port 8080)
npm run dev
```

## 🏗️ Architecture

### Tech Stack

- **Build Tool**: Vite 5
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **Routing**: React Router v6
- **Charting**: Lightweight Charts
- **Real-time**: WebSocket connections

### Project Structure

```
src/
├── components/        # React components
│   ├── charts/       # Chart components (Live, Enhanced, etc.)
│   └── ui/           # shadcn/ui components
├── contexts/         # React context providers (Auth, etc.)
├── hooks/            # Custom React hooks
├── pages/            # Route pages
├── services/         # API and WebSocket services
├── stores/           # Zustand state stores
├── types/            # TypeScript type definitions
├── utils/            # Utility functions
└── config.ts         # Service endpoint configuration
```

## ⚙️ Configuration

### Environment Variables

The frontend uses Vite environment variables to configure backend endpoints. Create a `.env.local` file:

```env
# Data Service (default: http://localhost:8001)
VITE_DATA_SERVICE_URL=http://localhost:8001

# Analysis Service (default: http://localhost:8002)
VITE_ANALYSIS_SERVICE_URL=http://localhost:8002

# Database Service (default: http://localhost:8003)
VITE_DATABASE_SERVICE_URL=http://localhost:8003

# WebSocket (optional, derived from DATA_SERVICE_URL if not set)
VITE_WEBSOCKET_URL=ws://localhost:8001/ws/stream
```

### Service Architecture

The frontend communicates with three backend microservices:

- **Data Service (8001)**: Real-time stock data, historical data, WebSocket streams
- **Analysis Service (8002)**: Technical indicators, patterns, chart analysis
- **Database Service (8003)**: User data, saved analyses, authentication

See `src/config.ts` for endpoint configuration details.

## 📜 Available Scripts

```bash
# Development
npm run dev              # Start dev server on :8080

# Build
npm run build            # Production build
npm run build:dev        # Development build
npm run build:staging    # Staging build
npm run build:prod       # Production build

# Preview
npm run preview          # Preview production build
npm run preview:staging  # Preview staging build

# Code Quality
npm run lint             # Run ESLint
npm run lint:fix         # Auto-fix ESLint issues
npx tsc -p tsconfig.app.json  # Type-check
```

## 📊 Key Features

### Real-time Charting

- **LiveSimpleChart**: WebSocket-powered real-time candlestick charts with automatic reconnection
- **EnhancedSimpleChart**: Historical charts with technical indicators and pattern overlays
- Zoom, pan, and crosshair support
- State preservation across updates

### Technical Analysis

- 20+ technical indicators (SMA, EMA, RSI, MACD, Bollinger Bands, etc.)
- Chart pattern detection
- Sector analysis and comparison
- AI-powered insights

### Authentication & User Management

- JWT-based authentication via AuthContext
- Protected routes with ProtectedRoute component
- Local development mode with mock authentication

## 🔌 WebSocket Integration

Real-time data streaming is handled by `src/services/liveDataService.ts`:

- Automatic authentication token injection
- Exponential backoff reconnection strategy
- Historical data fetching and merging
- Error handling and validation

Usage via the `useLiveChart` hook:

```typescript
import { useLiveChart } from '@/hooks/useLiveChart';

const { data, isConnected, error } = useLiveChart(symbol);
```

## 🛠️ Development

### Path Aliases

The project uses `@/` as an alias for `./src`:

```typescript
import { api } from '@/services/api';
import { Button } from '@/components/ui/button';
```

### Adding Components

shadcn/ui components can be added via CLI:

```bash
npx shadcn@latest add <component-name>
```

### Code Style

- ESLint configuration included
- TypeScript strict mode enabled
- Prettier formatting recommended
- Follow existing patterns in the codebase

## 🐛 Troubleshooting

### Backend Connection Issues

1. Ensure all backend services are running
2. Verify environment variables in `.env.local`
3. Check CORS configuration on backend
4. Review browser console for network errors

### WebSocket Connection Failures

1. Verify WebSocket URL format (ws:// or wss://)
2. Check authentication token validity
3. Ensure data service WebSocket endpoint is accessible
4. Review `liveDataService.ts` logs in console

## 📝 License

See [LICENSE](../LICENSE) in the root directory.

## 🤝 Contributing

This is part of a monorepo structure. Please refer to the main repository README for contribution guidelines.
