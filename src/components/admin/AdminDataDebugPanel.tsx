import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { authenticatedApiRequest } from '@/utils/api';
import {  buildApiUrl } from '@/config';
import { useAuth } from '@/hooks/useAuth';

export const AdminDataDebugPanel = () => {
  const { user, isAdmin } = useAuth();
  const [debugData, setDebugData] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testEndpoint = async (endpoint: string, description: string) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log(`🔄 Testing ${description}...`);
      const data = await authenticatedApiRequest(`${buildApiUrl('')}${endpoint}`);
      console.log(`✅ ${description} success:`, data);
      
      setDebugData(prev => ({
        ...prev,
        [endpoint]: {
          success: true,
          data: data,
          count: Array.isArray(data) ? data.length : 'Not array',
          timestamp: new Date().toISOString()
        }
      }));
    } catch (err: any) {
      console.error(`❌ ${description} error:`, err);
      setError(err.message);
      
      setDebugData(prev => ({
        ...prev,
        [endpoint]: {
          success: false,
          error: err.message,
          timestamp: new Date().toISOString()
        }
      }));
    } finally {
      setLoading(false);
    }
  };

  const testAllEndpoints = async () => {
    const endpoints = [
      { path: '/llm-settings', desc: 'LLM Settings' },
      { path: '/llm-settings/active/list', desc: 'Active LLM Settings' },
      { path: '/module-configurations', desc: 'Module Configurations' },
      { path: '/personalities', desc: 'AI Personalities' }
    ];

    for (const endpoint of endpoints) {
      await testEndpoint(endpoint.path, endpoint.desc);
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  };

  return (
    <Card className="bg-gray-800/80 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white">Admin Data Debug Panel</CardTitle>
        <CardDescription className="text-gray-400">
          Debug panel to test API connectivity and data retrieval
        </CardDescription>
        <div className="flex gap-2 items-center">
          <Badge variant={user ? "default" : "destructive"}>
            User: {user ? "Logged in" : "Not logged in"}
          </Badge>
          <Badge variant={isAdmin ? "default" : "destructive"}>
            Admin: {isAdmin ? "Yes" : "No"}
          </Badge>
          <Badge variant="outline">
            Role: {user?.role || "None"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button 
            onClick={() => testEndpoint('/llm-settings', 'LLM Settings')}
            disabled={loading}
            variant="outline"
            size="sm"
          >
            Test LLM Settings
          </Button>
          
          <Button 
            onClick={() => testEndpoint('/module-configurations', 'Module Configurations')}
            disabled={loading}
            variant="outline"
            size="sm"
          >
            Test Module Configs
          </Button>
          
          <Button 
            onClick={testAllEndpoints}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? 'Testing...' : 'Test All Endpoints'}
          </Button>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-500 rounded p-2">
            <p className="text-red-400 text-sm">Error: {error}</p>
          </div>
        )}

        <div className="space-y-2">
          <h4 className="text-white font-medium">Debug Results:</h4>
          {Object.entries(debugData).map(([endpoint, result]: [string, any]) => (
            <div key={endpoint} className="bg-gray-700/50 p-3 rounded">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant={result.success ? "default" : "destructive"}>
                  {endpoint}
                </Badge>
                <span className="text-xs text-gray-400">{result.timestamp}</span>
              </div>
              
              {result.success ? (
                <div className="text-sm">
                  <p className="text-green-400">✅ Success</p>
                  <p className="text-gray-300">Count: {result.count}</p>
                  <details className="mt-2">
                    <summary className="text-gray-400 cursor-pointer hover:text-white">
                      View Data
                    </summary>
                    <pre className="text-xs text-gray-300 mt-2 overflow-auto max-h-40">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </details>
                </div>
              ) : (
                <div className="text-sm">
                  <p className="text-red-400">❌ Error</p>
                  <p className="text-red-300">{result.error}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};