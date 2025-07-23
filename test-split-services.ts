/**
 * Test script to verify frontend integration with split backend services
 * Run this script to test connectivity and functionality
 */

import { apiService } from './src/services/api';
import { liveDataService } from './src/services/liveDataService';
import { analysisService } from './src/services/analysisService';

// Mock authentication for testing
const mockAuth = {
  ensureAuthenticated: async () => 'test-token-123'
};

// Override auth service for testing
Object.defineProperty(require('./src/services/authService'), 'authService', {
  value: mockAuth,
  writable: true
});

async function testDataService() {
  console.log('🧪 Testing Data Service (Port 8000)...');
  
  try {
    // Test health check
    const health = await apiService.getDataServiceHealth();
    console.log('✅ Data Service Health:', health);
    
    // Test market status
    const marketStatus = await liveDataService.getMarketStatus();
    console.log('✅ Market Status:', marketStatus);
    
    // Test WebSocket health
    const wsHealth = await apiService.getWebSocketHealth();
    console.log('✅ WebSocket Health:', wsHealth);
    
    console.log('✅ Data Service tests passed!');
    return true;
  } catch (error) {
    console.error('❌ Data Service test failed:', error.message);
    return false;
  }
}

async function testAnalysisService() {
  console.log('🧪 Testing Analysis Service (Port 8001)...');
  
  try {
    // Test health check
    const health = await apiService.getAnalysisServiceHealth();
    console.log('✅ Analysis Service Health:', health);
    
    // Test sector list
    const sectors = await analysisService.getSectors();
    console.log('✅ Sectors:', sectors);
    
    console.log('✅ Analysis Service tests passed!');
    return true;
  } catch (error) {
    console.error('❌ Analysis Service test failed:', error.message);
    return false;
  }
}

async function testEndToEndWorkflow() {
  console.log('🧪 Testing End-to-End Workflow...');
  
  try {
    // Test complete workflow with RELIANCE stock
    const symbol = 'RELIANCE';
    
    // 1. Get historical data (Data Service)
    console.log('📊 Getting historical data...');
    const historicalData = await liveDataService.getHistoricalData(symbol, '1d');
    console.log('✅ Historical data:', historicalData.success ? 'Success' : 'Failed');
    
    // 2. Get stock info (Data Service)
    console.log('📈 Getting stock info...');
    const stockInfo = await liveDataService.getStockInfo(symbol);
    console.log('✅ Stock info:', stockInfo.symbol);
    
    // 3. Get technical indicators (Analysis Service)
    console.log('📊 Getting technical indicators...');
    const indicators = await analysisService.getIndicators(symbol, '1day', 'NSE', 'rsi,macd');
    console.log('✅ Indicators:', indicators.success ? 'Success' : 'Failed');
    
    // 4. Get sector info (Analysis Service)
    console.log('🏭 Getting sector information...');
    const stockSector = await analysisService.getStockSector(symbol);
    console.log('✅ Stock sector:', stockSector.success ? 'Success' : 'Failed');
    
    console.log('✅ End-to-End workflow tests passed!');
    return true;
  } catch (error) {
    console.error('❌ End-to-End workflow test failed:', error.message);
    return false;
  }
}

async function testServiceEndpoints() {
  console.log('🧪 Testing Service Endpoints...');
  
  const endpoints = [
    { name: 'Data Service Health', url: 'http://localhost:8000/health' },
    { name: 'Analysis Service Health', url: 'http://localhost:8001/health' },
    { name: 'Data Service Market Status', url: 'http://localhost:8000/market/status' },
    { name: 'Analysis Service Sectors', url: 'http://localhost:8001/sector/list' },
  ];
  
  const results = [];
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint.url, {
        headers: {
          'Authorization': 'Bearer test-token-123',
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        console.log(`✅ ${endpoint.name}: OK`);
        results.push({ name: endpoint.name, status: 'OK' });
      } else {
        console.log(`⚠️ ${endpoint.name}: ${response.status}`);
        results.push({ name: endpoint.name, status: response.status });
      }
    } catch (error) {
      console.log(`❌ ${endpoint.name}: Connection failed`);
      results.push({ name: endpoint.name, status: 'Connection failed' });
    }
  }
  
  return results;
}

async function runAllTests() {
  console.log('🚀 Starting Frontend Split Architecture Tests...\n');
  
  const results = {
    dataService: false,
    analysisService: false,
    endToEnd: false,
    endpoints: []
  };
  
  // Test individual services
  results.dataService = await testDataService();
  console.log('');
  
  results.analysisService = await testAnalysisService();
  console.log('');
  
  // Test end-to-end workflow
  results.endToEnd = await testEndToEndWorkflow();
  console.log('');
  
  // Test endpoints
  results.endpoints = await testServiceEndpoints();
  console.log('');
  
  // Summary
  console.log('📊 Test Summary:');
  console.log('================');
  console.log(`Data Service: ${results.dataService ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Analysis Service: ${results.analysisService ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`End-to-End Workflow: ${results.endToEnd ? '✅ PASS' : '❌ FAIL'}`);
  
  console.log('\nEndpoint Status:');
  results.endpoints.forEach(endpoint => {
    const status = endpoint.status === 'OK' ? '✅' : '⚠️';
    console.log(`${status} ${endpoint.name}: ${endpoint.status}`);
  });
  
  const allPassed = results.dataService && results.analysisService && results.endToEnd;
  
  if (allPassed) {
    console.log('\n🎉 All tests passed! Frontend is ready for split backend architecture.');
  } else {
    console.log('\n⚠️ Some tests failed. Please check your backend services.');
  }
  
  return allPassed;
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

export { runAllTests, testDataService, testAnalysisService, testEndToEndWorkflow, testServiceEndpoints }; 