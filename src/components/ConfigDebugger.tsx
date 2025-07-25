import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getConfigurationSummary, validateConfiguration } from '@/utils/configUtils';
import { CONFIG } from '@/config';
import { Settings, AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface ConfigDebuggerProps {
  show?: boolean;
}

const ConfigDebugger: React.FC<ConfigDebuggerProps> = ({ show = false }) => {
  // Only show in development mode
  if (!CONFIG.IS_DEVELOPMENT || !show) {
    return null;
  }

  const summary = getConfigurationSummary();
  const validation = validateConfiguration();

  return (
    <Card className="w-full max-w-4xl mx-auto mb-6 border-orange-200 bg-orange-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-orange-800">
          <Settings className="h-5 w-5" />
          Configuration Debugger (Development Only)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Environment Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <h4 className="font-semibold text-sm text-gray-700">Environment</h4>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600">Mode:</span>
                <Badge variant={summary.environment.mode === 'development' ? 'default' : 'secondary'}>
                  {summary.environment.mode}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600">Production:</span>
                <Badge variant={summary.environment.isProduction ? 'destructive' : 'default'}>
                  {summary.environment.isProduction ? 'Yes' : 'No'}
                </Badge>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-sm text-gray-700">Data Service</h4>
            <div className="text-xs text-gray-600 break-all">
              {summary.urls.dataService}
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-sm text-gray-700">Analysis Service</h4>
            <div className="text-xs text-gray-600 break-all">
              {summary.urls.analysisService}
            </div>
          </div>
        </div>

        {/* WebSocket URL */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm text-gray-700">WebSocket URL</h4>
          <div className="text-xs text-gray-600 break-all bg-white p-2 rounded border">
            {summary.urls.websocket}
          </div>
        </div>

        {/* Validation Status */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm text-gray-700">Configuration Status</h4>
          {validation.isValid ? (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Configuration is valid
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                Configuration has issues:
                <ul className="mt-2 list-disc list-inside text-sm">
                  {validation.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Environment Variables Info */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm text-gray-700">Environment Variables</h4>
          <Alert className="border-blue-200 bg-blue-50">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800 text-sm">
              To configure URLs, create a <code className="bg-blue-100 px-1 rounded">.env.local</code> file with:
              <pre className="mt-2 bg-blue-100 p-2 rounded text-xs overflow-x-auto">
{`VITE_DATA_SERVICE_URL=http://localhost:8000
VITE_ANALYSIS_SERVICE_URL=http://localhost:8001
VITE_WEBSOCKET_URL=ws://localhost:8000/ws/stream`}
              </pre>
            </AlertDescription>
          </Alert>
        </div>
      </CardContent>
    </Card>
  );
};

export default ConfigDebugger; 