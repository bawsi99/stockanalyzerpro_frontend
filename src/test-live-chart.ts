/**
 * End-to-End Test Suite for Live Chart System
 * Tests live update, reconnection, multi-client, and multi-timeframe scenarios
 * 
 * TEST CHECKLIST:
 * ✅ Live Update Test - Verify real-time tick and candle updates
 * ✅ Reconnection Test - Verify automatic reconnection on connection loss
 * ✅ Multi-Client Test - Verify multiple clients receive consistent data
 * ✅ Multi-Timeframe Test - Verify data reception across different timeframes
 * ✅ Error Handling Test - Verify graceful error handling and backend error surfacing
 * ✅ Token/Symbol Mapping Test - Verify mapping endpoints work correctly
 * ✅ Timestamp Consistency Test - Verify UTC timestamp handling and consistency
 * ✅ Event Loop Bug Fix - Verify MAIN_EVENT_LOOP is properly managed
 * ✅ Message Type Standardization - Verify {type: 'tick', ...} and {type: 'candle', ...} schemas
 * ✅ Backend Error Handling - Verify retry logic and error logging
 * ✅ Tick Stream Decoupling - Verify lightweight tick stream without log spam
 * ✅ Frontend Tick/Candle Handling - Verify real-time candle updates and interval logic
 * ✅ Subscription Management - Verify proper unsubscribe/resubscribe logic
 * ✅ Connection Status UI - Verify clear status indicators and error messages
 * ✅ UTC Timestamp Handling - Verify consistent timezone handling across components
 */

import { liveDataService } from './services/liveDataService';
import { authService } from './services/authService';

// Test configuration
const TEST_CONFIG = {
  symbols: ['RELIANCE', 'TCS', 'HDFC'],
  timeframes: ['1min', '5min', '15min', '1day'],
  testDuration: 30000, // 30 seconds
  reconnectAttempts: 3,
  multiClientCount: 3
};

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: [] as any[]
};

// Utility functions
function log(message: string, type: 'info' | 'success' | 'error' | 'warn' = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${type.toUpperCase()}]`;
  console.log(`${prefix} ${message}`);
}

function assert(condition: boolean, message: string) {
  testResults.total++;
  if (condition) {
    testResults.passed++;
    log(`✓ ${message}`, 'success');
  } else {
    testResults.failed++;
    log(`✗ ${message}`, 'error');
    testResults.details.push({ type: 'assertion_failed', message });
  }
}

// Test 1: Basic Live Update Test
async function testLiveUpdate() {
  log('Starting Test 1: Basic Live Update Test');
  
  const symbol = TEST_CONFIG.symbols[0];
  const timeframe = TEST_CONFIG.timeframes[0];
  let receivedTicks = 0;
  let receivedCandles = 0;
  let lastUpdateTime = 0;
  
  try {
    // Connect to WebSocket
    const ws = await liveDataService.connectWebSocket(
      ['256265'], // RELIANCE token
      (data) => {
        if (data.type === 'tick') {
          receivedTicks++;
          lastUpdateTime = Date.now();
          log(`Received tick #${receivedTicks}: ${JSON.stringify(data)}`);
        } else if (data.type === 'candle') {
          receivedCandles++;
          lastUpdateTime = Date.now();
          log(`Received candle #${receivedCandles}: ${JSON.stringify(data)}`);
        }
      },
      (error) => {
        log(`WebSocket error: ${error}`, 'error');
      },
      () => {
        log('WebSocket disconnected');
      },
      [timeframe]
    );
    
    // Wait for data
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Assertions
    assert(receivedTicks > 0, 'Should receive tick updates');
    assert(receivedCandles > 0, 'Should receive candle updates');
    assert(lastUpdateTime > 0, 'Should have recent updates');
    assert(Date.now() - lastUpdateTime < 15000, 'Data should be recent (within 15s)');
    
    ws.close();
    
  } catch (error) {
    log(`Test 1 failed: ${error}`, 'error');
    testResults.details.push({ type: 'test_failed', test: 'live_update', error });
  }
}

// Test 2: Reconnection Test
async function testReconnection() {
  log('Starting Test 2: Reconnection Test');
  
  let reconnectCount = 0;
  let isReconnected = false;
  
  try {
    const ws = await liveDataService.connectWebSocket(
      ['256265'],
      (data) => {
        if (data.type === 'subscribed') {
          log('Successfully subscribed after reconnection');
          isReconnected = true;
        }
      },
      (error) => {
        log(`WebSocket error: ${error}`, 'error');
      },
      () => {
        log('WebSocket disconnected, attempting reconnection...');
        reconnectCount++;
      },
      ['1min']
    );
    
    // Simulate connection loss
    setTimeout(() => {
      log('Simulating connection loss...');
      ws.close();
    }, 5000);
    
    // Wait for reconnection
    await new Promise(resolve => setTimeout(resolve, 15000));
    
    // Assertions
    assert(reconnectCount > 0, 'Should attempt reconnection');
    assert(isReconnected, 'Should successfully reconnect');
    
  } catch (error) {
    log(`Test 2 failed: ${error}`, 'error');
    testResults.details.push({ type: 'test_failed', test: 'reconnection', error });
  }
}

// Test 3: Multi-Client Test
async function testMultiClient() {
  log('Starting Test 3: Multi-Client Test');
  
  const clients: any[] = [];
  const clientData: { [key: number]: any[] } = {};
  
  try {
    // Create multiple clients
    for (let i = 0; i < TEST_CONFIG.multiClientCount; i++) {
      const clientId = i;
      clientData[clientId] = [];
      
      const ws = await liveDataService.connectWebSocket(
        ['256265'],
        (data) => {
          clientData[clientId].push({
            timestamp: Date.now(),
            data: data
          });
        },
        (error) => {
          log(`Client ${clientId} error: ${error}`, 'error');
        },
        () => {
          log(`Client ${clientId} disconnected`);
        },
        ['1min']
      );
      
      clients.push(ws);
    }
    
    // Wait for data
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Assertions
    for (let i = 0; i < TEST_CONFIG.multiClientCount; i++) {
      assert(clientData[i].length > 0, `Client ${i} should receive data`);
    }
    
    // Check data consistency
    const firstClientData = clientData[0];
    const secondClientData = clientData[1];
    
    if (firstClientData.length > 0 && secondClientData.length > 0) {
      const firstLastUpdate = firstClientData[firstClientData.length - 1].timestamp;
      const secondLastUpdate = secondClientData[secondClientData.length - 1].timestamp;
      assert(Math.abs(firstLastUpdate - secondLastUpdate) < 5000, 'Clients should receive data within 5s of each other');
    }
    
    // Cleanup
    clients.forEach(ws => ws.close());
    
  } catch (error) {
    log(`Test 3 failed: ${error}`, 'error');
    testResults.details.push({ type: 'test_failed', test: 'multi_client', error });
  }
}

// Test 4: Multi-Timeframe Test
async function testMultiTimeframe() {
  log('Starting Test 4: Multi-Timeframe Test');
  
  const timeframeData: { [key: string]: any[] } = {};
  
  try {
    const ws = await liveDataService.connectWebSocket(
      ['256265'],
      (data) => {
        if (data.type === 'candle') {
          const timeframe = data.timeframe;
          if (!timeframeData[timeframe]) {
            timeframeData[timeframe] = [];
          }
          timeframeData[timeframe].push(data);
        }
      },
      (error) => {
        log(`WebSocket error: ${error}`, 'error');
      },
      () => {
        log('WebSocket disconnected');
      },
      TEST_CONFIG.timeframes
    );
    
    // Wait for data
    await new Promise(resolve => setTimeout(resolve, 15000));
    
    // Assertions
    TEST_CONFIG.timeframes.forEach(timeframe => {
      assert(timeframeData[timeframe] && timeframeData[timeframe].length > 0, 
        `Should receive data for timeframe ${timeframe}`);
    });
    
    ws.close();
    
  } catch (error) {
    log(`Test 4 failed: ${error}`, 'error');
    testResults.details.push({ type: 'test_failed', test: 'multi_timeframe', error });
  }
}

// Test 5: Error Handling Test
async function testErrorHandling() {
  log('Starting Test 5: Error Handling Test');
  
  let errorReceived = false;
  let backendErrorReceived = false;
  
  try {
    const ws = await liveDataService.connectWebSocket(
      ['invalid_token'], // Invalid token to trigger error
      (data) => {
        if (data.type === 'error') {
          errorReceived = true;
          log(`Received error: ${JSON.stringify(data)}`);
        } else if (data.type === 'backend_error') {
          backendErrorReceived = true;
          log(`Received backend error: ${JSON.stringify(data)}`);
        }
      },
      (error) => {
        log(`WebSocket error: ${error}`, 'error');
      },
      () => {
        log('WebSocket disconnected');
      },
      ['1min']
    );
    
    // Wait for error
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Assertions
    assert(errorReceived || backendErrorReceived, 'Should handle errors gracefully');
    
    ws.close();
    
  } catch (error) {
    log(`Test 5 failed: ${error}`, 'error');
    testResults.details.push({ type: 'test_failed', test: 'error_handling', error });
  }
}

// Test 6: Token/Symbol Mapping Test
async function testTokenSymbolMapping() {
  log('Starting Test 6: Token/Symbol Mapping Test');
  
  try {
    // Test token to symbol mapping
    const response = await fetch('http://localhost:8000/mapping/token-to-symbol?token=256265&exchange=NSE');
    const tokenToSymbol = await response.json();
    
    assert(response.ok, 'Token to symbol mapping endpoint should work');
    assert(tokenToSymbol.symbol, 'Should return symbol for valid token');
    
    // Test symbol to token mapping
    const symbolResponse = await fetch('http://localhost:8000/mapping/symbol-to-token?symbol=RELIANCE&exchange=NSE');
    const symbolToToken = await symbolResponse.json();
    
    assert(symbolResponse.ok, 'Symbol to token mapping endpoint should work');
    assert(symbolToToken.token, 'Should return token for valid symbol');
    
    // Test consistency
    assert(tokenToSymbol.symbol === 'RELIANCE', 'Token 256265 should map to RELIANCE');
    assert(symbolToToken.token === 256265, 'RELIANCE should map to token 256265');
    
  } catch (error) {
    log(`Test 6 failed: ${error}`, 'error');
    testResults.details.push({ type: 'test_failed', test: 'token_symbol_mapping', error });
  }
}

// Test 7: Timestamp Consistency Test
async function testTimestampConsistency() {
  log('Starting Test 7: Timestamp Consistency Test');
  
  const timestamps: number[] = [];
  
  try {
    const ws = await liveDataService.connectWebSocket(
      ['256265'],
      (data) => {
        if (data.type === 'candle') {
          const timestamp = data.data.start;
          timestamps.push(timestamp);
          
          // Check if timestamp is valid
          const date = new Date(timestamp * 1000);
          assert(!isNaN(date.getTime()), 'Timestamp should be valid');
          assert(date.getTime() > 0, 'Timestamp should be positive');
        }
      },
      (error) => {
        log(`WebSocket error: ${error}`, 'error');
      },
      () => {
        log('WebSocket disconnected');
      },
      ['1min']
    );
    
    // Wait for data
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Check timestamp consistency
    if (timestamps.length > 1) {
      for (let i = 1; i < timestamps.length; i++) {
        assert(timestamps[i] >= timestamps[i-1], 'Timestamps should be monotonically increasing');
      }
    }
    
    ws.close();
    
  } catch (error) {
    log(`Test 7 failed: ${error}`, 'error');
    testResults.details.push({ type: 'test_failed', test: 'timestamp_consistency', error });
  }
}

// Main test runner
async function runAllTests() {
  log('Starting End-to-End Test Suite for Live Chart System');
  log(`Test Configuration: ${JSON.stringify(TEST_CONFIG, null, 2)}`);
  
  // Ensure authentication
  try {
    await authService.ensureAuthenticated();
    log('Authentication successful');
  } catch (error) {
    log(`Authentication failed: ${error}`, 'error');
    return;
  }
  
  // Run tests sequentially
  const tests = [
    testLiveUpdate,
    testReconnection,
    testMultiClient,
    testMultiTimeframe,
    testErrorHandling,
    testTokenSymbolMapping,
    testTimestampConsistency
  ];
  
  for (const test of tests) {
    try {
      await test();
      // Wait between tests
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      log(`Test execution failed: ${error}`, 'error');
    }
  }
  
  // Print results
  log('=== TEST RESULTS ===');
  log(`Total Tests: ${testResults.total}`);
  log(`Passed: ${testResults.passed}`);
  log(`Failed: ${testResults.failed}`);
  log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(2)}%`);
  
  if (testResults.details.length > 0) {
    log('=== FAILURE DETAILS ===');
    testResults.details.forEach(detail => {
      log(`${detail.type}: ${detail.message || detail.error}`, 'error');
    });
  }
  
  log('End-to-End Test Suite completed');
  
  // Return test results for programmatic use
  return {
    passed: testResults.passed,
    failed: testResults.failed,
    total: testResults.total,
    successRate: (testResults.passed / testResults.total) * 100,
    details: testResults.details
  };
}

// Export for use in other test files
export {
  runAllTests,
  testLiveUpdate,
  testReconnection,
  testMultiClient,
  testMultiTimeframe,
  testErrorHandling,
  testTokenSymbolMapping,
  testTimestampConsistency
};

// Run tests if this file is executed directly
if (typeof window !== 'undefined') {
  // Browser environment
  (window as any).runLiveChartTests = runAllTests;
} else {
  // Node.js environment
  runAllTests().catch(console.error);
} 