import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { runAllTests } from '@/test-live-chart';
import LiveEnhancedMultiPaneChart from '@/components/charts/LiveEnhancedMultiPaneChart';
import { LiveChartProvider } from '@/components/charts/LiveChartProvider';

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  message?: string;
  duration?: number;
}

export default function LiveChartTest() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [overallStatus, setOverallStatus] = useState<'idle' | 'running' | 'passed' | 'failed'>('idle');
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);

  const tests = [
    { name: 'LiveDataService', key: 'liveDataService' },
    { name: 'LiveIndicatorCalculator', key: 'liveIndicatorCalculator' },
    { name: 'LivePatternRecognition', key: 'livePatternRecognition' },
    { name: 'DataValidation', key: 'dataValidation' },
    { name: 'Performance', key: 'performance' }
  ];

  const runTests = async () => {
    setIsRunning(true);
    setOverallStatus('running');
    setProgress(0);
    setLogs([]);
    
    // Initialize test results
    const initialResults = tests.map(test => ({
      name: test.name,
      status: 'pending' as const
    }));
    setTestResults(initialResults);

    // Capture console logs
    const originalLog = console.log;
    const originalError = console.error;
    const capturedLogs: string[] = [];

    console.log = (...args) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      capturedLogs.push(`[LOG] ${message}`);
      setLogs(prev => [...prev, `[LOG] ${message}`]);
      originalLog(...args);
    };

    console.error = (...args) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      capturedLogs.push(`[ERROR] ${message}`);
      setLogs(prev => [...prev, `[ERROR] ${message}`]);
      originalError(...args);
    };

    try {
      // Run the comprehensive test
      const startTime = performance.now();
      const success = await runAllTests();
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Update results based on captured logs
      const updatedResults = tests.map(test => {
        const testLogs = capturedLogs.filter(log => 
          log.includes(test.name) || log.includes(test.key)
        );
        
        const hasError = testLogs.some(log => log.includes('[ERROR]'));
        const hasSuccess = testLogs.some(log => log.includes('✅') && log.includes(test.name));
        
        return {
          name: test.name,
          status: hasError ? 'failed' : hasSuccess ? 'passed' : 'failed',
          message: hasError ? 'Test failed' : hasSuccess ? 'Test passed' : 'Test incomplete',
          duration: duration / tests.length
        };
      });

      setTestResults(updatedResults);
      setProgress(100);
      setOverallStatus(success ? 'passed' : 'failed');

    } catch (error) {
      console.error('Test execution failed:', error);
      setOverallStatus('failed');
      setLogs(prev => [...prev, `[ERROR] Test execution failed: ${error}`]);
    } finally {
      // Restore console functions
      console.log = originalLog;
      console.error = originalError;
      setIsRunning(false);
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'passed': return 'bg-green-500';
      case 'failed': return 'bg-red-500';
      case 'running': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: TestResult['status']) => {
    switch (status) {
      case 'passed': return 'PASSED';
      case 'failed': return 'FAILED';
      case 'running': return 'RUNNING';
      default: return 'PENDING';
    }
  };

  const getOverallStatusColor = () => {
    switch (overallStatus) {
      case 'passed': return 'bg-green-500';
      case 'failed': return 'bg-red-500';
      case 'running': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const passedTests = testResults.filter(r => r.status === 'passed').length;
  const totalTests = testResults.length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Live Chart Implementation Test</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Comprehensive testing of live chart functionality
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Badge className={getOverallStatusColor()}>
            {overallStatus.toUpperCase()}
          </Badge>
          <Button 
            onClick={runTests} 
            disabled={isRunning}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isRunning ? 'Running Tests...' : 'Run All Tests'}
          </Button>
        </div>
      </div>

      {/* Progress */}
      {isRunning && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Test Progress</span>
                <span>{progress.toFixed(0)}%</span>
              </div>
              <Progress value={progress} className="w-full" />
              <div className="text-sm text-gray-600">
                {passedTests} / {totalTests} tests passed
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Test Results */}
      <Card>
        <CardHeader>
          <CardTitle>Test Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {testResults.map((result, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(result.status)}`} />
                  <div>
                    <div className="font-medium">{result.name}</div>
                    {result.message && (
                      <div className="text-sm text-gray-600">{result.message}</div>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {result.duration && (
                    <span className="text-sm text-gray-500">
                      {result.duration.toFixed(2)}ms
                    </span>
                  )}
                  <Badge variant={result.status === 'passed' ? 'default' : 'destructive'}>
                    {getStatusText(result.status)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Live Chart Demo */}
      <Card>
        <CardHeader>
          <CardTitle>Live Chart Demo</CardTitle>
          <p className="text-sm text-gray-600">
            Test the live chart component with RELIANCE stock data
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="h-[500px] w-full">
            <LiveChartProvider
              token="256265"
              timeframe="1d"
              autoConnect={false}
              maxDataPoints={100}
              updateInterval={1000}
            >
              <LiveEnhancedMultiPaneChart
                token="256265"
                timeframe="1d"
                theme="light"
                height={500}
                debug={true}
                autoConnect={false}
                maxDataPoints={100}
                updateInterval={1000}
              />
            </LiveChartProvider>
          </div>
        </CardContent>
      </Card>

      {/* Test Logs */}
      {logs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-y-auto bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm">
              {logs.map((log, index) => (
                <div key={index} className="whitespace-pre-wrap">
                  {log}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      {overallStatus !== 'idle' && (
        <Alert className={overallStatus === 'passed' ? 'border-green-500' : 'border-red-500'}>
          <AlertDescription>
            {overallStatus === 'passed' ? (
              <div className="space-y-2">
                <div className="font-semibold text-green-700">✅ All Tests Passed!</div>
                <div>Live Chart Implementation is production-ready with:</div>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Real-time data streaming via WebSocket</li>
                  <li>Live indicator calculations</li>
                  <li>Live pattern detection</li>
                  <li>Automatic reconnection and error handling</li>
                  <li>Performance optimization</li>
                </ul>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="font-semibold text-red-700">❌ Some Tests Failed</div>
                <div>Please check the logs above for details on what needs to be fixed.</div>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
} 