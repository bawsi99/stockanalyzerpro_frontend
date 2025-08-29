# 🚀 Split Services Frontend Configuration

This frontend is now configured to work with **separate backend services** instead of a single consolidated service.

## 🏗️ **Architecture**

```
┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Frontend      │
│   (Vercel)      │    │   (Vercel)      │
└─────────┬───────┘    └─────────┬───────┘
          │                      │
          ▼                      ▼
┌─────────────────┐    ┌─────────────────┐
│ Data + WebSocket│    │  Analysis       │
│ Service         │    │  Service        │
│ (Free Tier)     │    │  (Standard)     │
│ Port: 8001      │    │  Port: 8002     │
└─────────────────┘    └─────────────────┘
```

## 🔧 **Environment Variables**

### **Required Variables**

Add these to your **Vercel Environment Variables**:

```bash
# Service URLs
VITE_DATA_SERVICE_URL=https://your-data-websocket-service.onrender.com
VITE_ANALYSIS_SERVICE_URL=https://your-analysis-service.onrender.com

# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### **Local Development**

For local development, create a `.env.local` file:

```bash
# Local development
VITE_DATA_SERVICE_URL=http://localhost:8001
VITE_ANALYSIS_SERVICE_URL=http://localhost:8002
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 📡 **How to Use**

### **1. Import the Configuration**

```typescript
import { ENDPOINTS, CONFIG } from '@/config';

// Access service URLs
console.log('Data Service:', CONFIG.DATA_SERVICE_URL);
console.log('Analysis Service:', CONFIG.ANALYSIS_SERVICE_URL);
```

### **2. Make API Calls**

#### **Data Service Calls (Stock data, WebSocket)**
```typescript
// Get stock history
const response = await fetch(ENDPOINTS.DATA.STOCK_HISTORY + '/RELIANCE/history');

// WebSocket connection
const ws = new WebSocket(ENDPOINTS.DATA.WEBSOCKET);

// Market status
const marketStatus = await fetch(ENDPOINTS.DATA.MARKET_STATUS);
```

#### **Analysis Service Calls (ML, Patterns, Charts)**
```typescript
// Stock analysis
const analysis = await fetch(ENDPOINTS.ANALYSIS.ANALYZE, {
  method: 'POST',
  body: JSON.stringify({ symbol: 'RELIANCE', interval: '1D' })
});

// Sector list
const sectors = await fetch(ENDPOINTS.ANALYSIS.SECTOR_LIST);

// Technical indicators
const indicators = await fetch(ENDPOINTS.ANALYSIS.STOCK_INDICATORS + '/RELIANCE/indicators');
```

### **3. WebSocket Usage**

```typescript
// WebSocket automatically uses the data service URL
const websocket = new WebSocket(ENDPOINTS.DATA.WEBSOCKET);

websocket.onopen = () => {
  console.log('Connected to data service WebSocket');
  
  // Subscribe to stock data
  websocket.send(JSON.stringify({
    action: 'subscribe',
    symbols: ['RELIANCE', 'TCS']
  }));
};
```

## 🔍 **Available Endpoints**

### **Data Service Endpoints**
- `ENDPOINTS.DATA.STOCK_HISTORY` - Historical stock data
- `ENDPOINTS.DATA.STOCK_INFO` - Stock information
- `ENDPOINTS.DATA.MARKET_STATUS` - Market status
- `ENDPOINTS.DATA.WEBSOCKET` - Real-time data streaming
- `ENDPOINTS.DATA.AUTH_TOKEN` - JWT token creation
- `ENDPOINTS.DATA.AUTH_VERIFY` - Token verification

### **Analysis Service Endpoints**
- `ENDPOINTS.ANALYSIS.ANALYZE` - Stock analysis
- `ENDPOINTS.ANALYSIS.ENHANCED_ANALYZE` - Enhanced analysis
- `ENDPOINTS.ANALYSIS.SECTOR_LIST` - Sector information
- `ENDPOINTS.ANALYSIS.PATTERNS` - Pattern recognition
- `ENDPOINTS.ANALYSIS.CHARTS` - Chart generation
- `ENDPOINTS.ANALYSIS.ML_TRAIN` - ML model training

## 🚨 **Important Notes**

### **1. Service Separation**
- **Data Service**: Handles stock data, WebSocket, authentication
- **Analysis Service**: Handles ML analysis, patterns, charts, sectors

### **2. WebSocket**
- WebSocket connections **always** go to the **Data Service**
- Analysis results are fetched via HTTP calls to the **Analysis Service**

### **3. Error Handling**
```typescript
try {
  const response = await fetch(ENDPOINTS.ANALYSIS.ANALYZE, {
    method: 'POST',
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    throw new Error(`Analysis service error: ${response.status}`);
  }
  
  const result = await response.json();
} catch (error) {
  console.error('Failed to get analysis:', error);
}
```

### **4. CORS**
Both services are configured with CORS to allow your frontend domain.

## 🔄 **Migration from Single Service**

If you were previously using a single service:

### **Before (Single Service)**
```typescript
const API_BASE = 'https://your-single-service.onrender.com';
const response = await fetch(`${API_BASE}/analyze`, { ... });
```

### **After (Split Services)**
```typescript
// Analysis calls go to analysis service
const response = await fetch(ENDPOINTS.ANALYSIS.ANALYZE, { ... });

// Data calls go to data service
const stockData = await fetch(ENDPOINTS.DATA.STOCK_HISTORY + '/RELIANCE/history');
```

## ✅ **Testing**

### **1. Test Data Service**
```bash
curl https://your-data-service.onrender.com/health
curl https://your-data-service.onrender.com/stock/RELIANCE/history
```

### **2. Test Analysis Service**
```bash
curl https://your-analysis-service.onrender.com/health
curl https://your-analysis-service.onrender.com/sector/list
```

### **3. Test Frontend**
- Check browser console for configuration logs
- Verify API calls go to correct services
- Test WebSocket connection to data service

## 🎯 **Next Steps**

1. **Set environment variables** in Vercel
2. **Deploy both backend services** on Render
3. **Update frontend** with new service URLs
4. **Test all endpoints** work correctly
5. **Monitor service performance** separately

---

**🎉 Your frontend is now ready for the split services architecture!**
