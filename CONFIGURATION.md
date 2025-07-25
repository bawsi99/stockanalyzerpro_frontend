# Frontend Configuration Guide

This document explains how to configure the frontend application for different environments.

## Environment Variables

The frontend uses environment variables to configure API endpoints and WebSocket connections. All environment variables should be prefixed with `VITE_` for Vite to expose them to the client-side code.

### Required Environment Variables

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `VITE_DATA_SERVICE_URL` | URL for the data service (port 8000) | `http://localhost:8000` | `https://api.yourdomain.com` |
| `VITE_ANALYSIS_SERVICE_URL` | URL for the analysis service (port 8001) | `http://localhost:8001` | `https://analysis.yourdomain.com` |
| `VITE_WEBSOCKET_URL` | WebSocket URL for real-time data | `ws://localhost:8000/ws/stream` | `wss://api.yourdomain.com/ws/stream` |

### Environment Setup

#### Development Environment

1. Copy the example environment file:
   ```bash
   cp env.example .env.local
   ```

2. Modify `.env.local` with your development settings:
   ```env
   VITE_DATA_SERVICE_URL=http://localhost:8000
   VITE_ANALYSIS_SERVICE_URL=http://localhost:8001
   VITE_WEBSOCKET_URL=ws://localhost:8000/ws/stream
   ```

#### Production Environment

1. Create a production environment file (`.env.production`):
   ```env
   VITE_DATA_SERVICE_URL=https://api.yourdomain.com
   VITE_ANALYSIS_SERVICE_URL=https://analysis.yourdomain.com
   VITE_WEBSOCKET_URL=wss://api.yourdomain.com/ws/stream
   ```

2. Build for production:
   ```bash
   npm run build
   ```

#### Staging Environment

1. Create a staging environment file (`.env.staging`):
   ```env
   VITE_DATA_SERVICE_URL=https://staging-api.yourdomain.com
   VITE_ANALYSIS_SERVICE_URL=https://staging-analysis.yourdomain.com
   VITE_WEBSOCKET_URL=wss://staging-api.yourdomain.com/ws/stream
   ```

2. Build for staging:
   ```bash
   npm run build -- --mode staging
   ```

## Configuration Files

### `src/config.ts`

The main configuration file that:
- Loads environment variables with fallbacks
- Provides centralized URL management
- Exports configuration constants
- Includes environment detection

### `src/utils/configUtils.ts`

Utility functions for:
- Environment configuration management
- WebSocket URL building with authentication
- Configuration validation
- Debug logging

## Usage Examples

### Using Configuration in Components

```typescript
import { CONFIG, ENDPOINTS } from '@/config';
import { buildWebSocketUrl } from '@/utils/configUtils';

// Access configuration
const dataServiceUrl = CONFIG.DATA_SERVICE_URL;
const isProduction = CONFIG.IS_PRODUCTION;

// Build WebSocket URL with token
const wsUrl = buildWebSocketUrl(userToken);

// Use endpoints
const healthCheckUrl = ENDPOINTS.DATA.HEALTH;
```

### Environment Detection

```typescript
import { getEnvironmentConfig } from '@/utils/configUtils';

const config = getEnvironmentConfig();

if (config.isProduction) {
  // Production-specific logic
} else if (config.isDevelopment) {
  // Development-specific logic
}
```

### Configuration Validation

```typescript
import { validateConfiguration } from '@/utils/configUtils';

const validation = validateConfiguration();

if (!validation.isValid) {
  console.error('Configuration errors:', validation.errors);
}
```

## Deployment Considerations

### Docker Deployment

When deploying with Docker, you can pass environment variables:

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

```bash
# docker run command
docker run -p 3000:3000 \
  -e VITE_DATA_SERVICE_URL=https://api.yourdomain.com \
  -e VITE_ANALYSIS_SERVICE_URL=https://analysis.yourdomain.com \
  -e VITE_WEBSOCKET_URL=wss://api.yourdomain.com/ws/stream \
  your-app
```

### Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
spec:
  template:
    spec:
      containers:
      - name: frontend
        image: your-frontend:latest
        env:
        - name: VITE_DATA_SERVICE_URL
          value: "https://api.yourdomain.com"
        - name: VITE_ANALYSIS_SERVICE_URL
          value: "https://analysis.yourdomain.com"
        - name: VITE_WEBSOCKET_URL
          value: "wss://api.yourdomain.com/ws/stream"
```

## Troubleshooting

### Common Issues

1. **Environment variables not loading**
   - Ensure variables are prefixed with `VITE_`
   - Check that the environment file is in the correct location
   - Restart the development server after changing environment variables

2. **WebSocket connection issues**
   - Verify the WebSocket URL is correct
   - Check that the backend service is running
   - Ensure CORS is properly configured on the backend

3. **Production build issues**
   - Verify all required environment variables are set
   - Check that URLs use HTTPS/WSS in production
   - Ensure backend services are accessible from the production domain

### Debug Configuration

In development mode, the application logs configuration details to the console. You can also manually check configuration:

```typescript
import { getConfigurationSummary } from '@/utils/configUtils';

const summary = getConfigurationSummary();
console.log('Configuration:', summary);
```

## Security Considerations

- Never commit `.env` files containing sensitive information
- Use HTTPS/WSS in production environments
- Validate all URLs before making requests
- Implement proper CORS policies on backend services 