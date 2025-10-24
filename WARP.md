# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Commands

- Install: npm i
- Dev server (Vite on :8080): npm run dev
- Build: npm run build
  - Envs: npm run build:dev, npm run build:staging, npm run build:prod
- Preview build: npm run preview (or npm run preview:staging)
- Lint: npm run lint | Auto-fix: npm run lint:fix
- Type-check: npx tsc -p tsconfig.app.json
- Tests: no test runner is configured in this package.

## Environment and configuration

Vite env vars (VITE_*) drive backend endpoints. Defaults are applied in code when not set.
- VITE_DATA_SERVICE_URL (default http://localhost:8001)
- VITE_ANALYSIS_SERVICE_URL (default http://localhost:8002)
- VITE_DATABASE_SERVICE_URL (default http://localhost:8003)
- VITE_WEBSOCKET_URL (optional; otherwise derived from the data service URL)
- Legacy (still read in api.ts): VITE_BASE_SERVICE_URL
- Alternative unified-backend setup (see config-unified.ts): VITE_UNIFIED_SERVICE_URL

Path alias: import from "@/..." maps to ./src (see vite.config.ts and tsconfig.json).

## High-level architecture

- Build/runtime: Vite + React (SWC). Vite server listens on host "::" and port 8080; alias @ -> ./src; dev-only plugin lovable-tagger.
- App shell and routing: src/App.tsx wraps QueryClientProvider, AuthProvider, and UI providers. Routes via react-router-dom for /, /login, /auth, /dashboard, /analysis, /output, /charts; most are protected by src/components/ProtectedRoute.tsx.
- Configuration and endpoints: src/config.ts is the active configuration for a distributed backend topology. It constructs ENDPOINTS for Data (8001), Analysis (8002), and Database (8003) services and derives the WebSocket URL. An alternative single-backend template exists in config-unified.ts.
- Service layer (HTTP): src/services/api.ts centralizes typed calls to all HTTP endpoints (historical data, indicators/patterns/charts, sector APIs, auth, health, user analyses), consuming ENDPOINTS from config.ts.
- Realtime and charting:
  - src/services/liveDataService.ts manages authentication-backed WebSocket connections to the data service (/ws/stream), historical data fetch, reconnection/backoff, and conversion to chart-friendly data.
  - src/hooks/useLiveChart.ts composes historical + live updates into React state with reconnection and validation logic.
  - src/components/charts/LiveSimpleChart.tsx renders candlesticks using lightweight-charts and preserves chart zoom/pan state.
- State management: zustand stores under src/stores/ cache historical/live data and track the currently selected stock symbol.
- Auth: src/contexts/AuthContext.tsx provides a minimal localStorage-based auth context used by ProtectedRoute; for local development it seeds a default user and token.

## Notes for agents

- Backends: By default the app expects separate services on 8001 (data), 8002 (analysis), 8003 (database). Switch to config-unified.ts and set VITE_UNIFIED_SERVICE_URL if using a single backend that mounts routes under /data and /database.
- WebSocket auth: liveDataService obtains a JWT via authService and app AuthProvider seeds a dummy token/user for local dev.
- Frontend port: Dev server runs on :8080 (see vite.config.ts).