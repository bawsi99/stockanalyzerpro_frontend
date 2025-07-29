import React, { useState, useEffect } from 'react';
import { apiService } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { useStockAnalyses } from '@/hooks/useStockAnalyses';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface TestResult {
  testName: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  data?: any;
}

export const FrontendDatabaseTest: React.FC = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const { user } = useAuth();
  const { 
    analyses, 
    loading, 
    error, 
    saveAnalysis, 
    getAnalysisById, 
    getAnalysesBySignal, 
    getAnalysesBySector, 
    getHighConfidenceAnalyses,
    fetchAnalyses 
  } = useStockAnalyses();

  const addTestResult = (testName: string, status: 'success' | 'error', message: string, data?: any) => {
    setTestResults(prev => [...prev, { testName, status, message, data }]);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const testBackendHealth = async () => {
    try {
      const response = await apiService.getAnalysisServiceHealth();
      addTestResult(
        'Backend Health Check',
        'success',
        `Backend service is healthy. Status: ${response.status}, Service: ${response.service}`,
        response
      );
    } catch (error) {
      addTestResult(
        'Backend Health Check',
        'error',
        `Backend health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  const testUserAnalyses = async () => {
    if (!user?.id) {
      addTestResult(
        'User Analyses API',
        'error',
        'No authenticated user found'
      );
      return;
    }

    try {
      const response = await apiService.getUserAnalyses(user.id, 5);
      addTestResult(
        'User Analyses API',
        'success',
        `Successfully fetched ${response.count} analyses for user ${user.id}`,
        response
      );
    } catch (error) {
      addTestResult(
        'User Analyses API',
        'error',
        `User analyses API failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  const testAnalysisById = async () => {
    if (!user?.id) {
      addTestResult(
        'Analysis by ID API',
        'error',
        'No authenticated user found'
      );
      return;
    }

    try {
      // First get user analyses to get an analysis ID
      const userAnalyses = await apiService.getUserAnalyses(user.id, 1);
      if (!userAnalyses.analyses || userAnalyses.analyses.length === 0) {
        addTestResult(
          'Analysis by ID API',
          'error',
          'No analyses found for user to test with'
        );
        return;
      }

      const analysisId = userAnalyses.analyses[0].id;
      const response = await apiService.getAnalysisById(analysisId);
      addTestResult(
        'Analysis by ID API',
        'success',
        `Successfully fetched analysis ${analysisId}`,
        response
      );
    } catch (error) {
      addTestResult(
        'Analysis by ID API',
        'error',
        `Analysis by ID API failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  const testAnalysisSummary = async () => {
    if (!user?.id) {
      addTestResult(
        'Analysis Summary API',
        'error',
        'No authenticated user found'
      );
      return;
    }

    try {
      const response = await apiService.getUserAnalysisSummary(user.id);
      addTestResult(
        'Analysis Summary API',
        'success',
        `Successfully fetched analysis summary. Total analyses: ${response.summary.total_analyses}`,
        response
      );
    } catch (error) {
      addTestResult(
        'Analysis Summary API',
        'error',
        `Analysis summary API failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  const testFilteredAnalyses = async () => {
    if (!user?.id) {
      addTestResult(
        'Filtered Analyses APIs',
        'error',
        'No authenticated user found'
      );
      return;
    }

    try {
      const [signalResponse, sectorResponse, confidenceResponse] = await Promise.all([
        apiService.getAnalysesBySignal('bullish', user.id, 5),
        apiService.getAnalysesBySector('energy', user.id, 5),
        apiService.getHighConfidenceAnalyses(70, user.id, 5)
      ]);

      addTestResult(
        'Filtered Analyses APIs',
        'success',
        `Signal filter: ${signalResponse.count}, Sector filter: ${sectorResponse.count}, Confidence filter: ${confidenceResponse.count}`,
        { signalResponse, sectorResponse, confidenceResponse }
      );
    } catch (error) {
      addTestResult(
        'Filtered Analyses APIs',
        'error',
        `Filtered analyses APIs failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  const testHookIntegration = async () => {
    try {
      // Test the useStockAnalyses hook functions
      const fetchedAnalyses = await fetchAnalyses();
      addTestResult(
        'Hook Integration Test',
        'success',
        `Successfully fetched ${fetchedAnalyses.length} analyses using hook`,
        { analyses: fetchedAnalyses }
      );
    } catch (error) {
      addTestResult(
        'Hook Integration Test',
        'error',
        `Hook integration failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  const testCompleteFlow = async () => {
    setIsRunning(true);
    clearResults();

    // Run all tests in sequence
    await testBackendHealth();
    await testUserAnalyses();
    await testAnalysisById();
    await testAnalysisSummary();
    await testFilteredAnalyses();
    await testHookIntegration();

    setIsRunning(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800 border-green-200';
      case 'error': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const passedTests = testResults.filter(r => r.status === 'success').length;
  const totalTests = testResults.length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🧪 Frontend Database Communication Test
            <Badge variant="outline">{passedTests}/{totalTests} Tests Passed</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button 
                onClick={testCompleteFlow} 
                disabled={isRunning}
                className="flex-1"
              >
                {isRunning ? 'Running Tests...' : 'Run All Tests'}
              </Button>
              <Button 
                onClick={clearResults} 
                variant="outline"
                disabled={isRunning}
              >
                Clear Results
              </Button>
            </div>

            {!user && (
              <Alert>
                <AlertDescription>
                  ⚠️ No authenticated user found. Some tests may fail.
                </AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert>
                <AlertDescription>
                  ❌ Hook error: {error}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-3">
              {testResults.map((result, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={getStatusColor(result.status)}>
                      {result.status === 'success' ? '✅' : '❌'} {result.testName}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{result.message}</p>
                  {result.data && (
                    <details className="text-xs">
                      <summary className="cursor-pointer text-blue-600">View Response Data</summary>
                      <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto max-h-40">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>

            {testResults.length > 0 && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold mb-2">Test Summary</h3>
                <p>Total Tests: {totalTests}</p>
                <p>Passed: {passedTests}</p>
                <p>Failed: {totalTests - passedTests}</p>
                {passedTests === totalTests && totalTests > 0 && (
                  <p className="text-green-600 font-semibold mt-2">
                    🎉 All tests passed! Frontend database communication is working!
                  </p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 