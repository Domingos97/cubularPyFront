import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Clock, Activity } from 'lucide-react';

interface EdgeFunctionLog {
  id: string;
  timestamp: string;
  function_name: string;
  status: string;
  execution_time: number;
  error?: string;
}

interface FunctionAnalyticsProps {
  functionLogs: EdgeFunctionLog[];
}

export const FunctionAnalytics = ({ functionLogs }: FunctionAnalyticsProps) => {
  const averageResponseTime = functionLogs.length > 0 
    ? Math.round(functionLogs.reduce((sum, log) => sum + log.execution_time, 0) / functionLogs.length)
    : 0;

  const successRate = functionLogs.length > 0 
    ? Math.round((functionLogs.filter(log => log.status === 'success').length / functionLogs.length) * 100)
    : 0;

  const totalCalls = functionLogs.length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <Card className="p-4 bg-gray-700/50 border-gray-600">
        <div className="flex items-center space-x-2">
          <Activity className="w-5 h-5 text-blue-500" />
          <div>
            <p className="text-sm text-gray-400">Total Calls</p>
            <p className="text-2xl font-bold text-white">{totalCalls}</p>
          </div>
        </div>
      </Card>
      
      <Card className="p-4 bg-gray-700/50 border-gray-600">
        <div className="flex items-center space-x-2">
          <TrendingUp className="w-5 h-5 text-green-500" />
          <div>
            <p className="text-sm text-gray-400">Success Rate</p>
            <p className="text-2xl font-bold text-white">{successRate}%</p>
          </div>
        </div>
      </Card>
      
      <Card className="p-4 bg-gray-700/50 border-gray-600">
        <div className="flex items-center space-x-2">
          <Clock className="w-5 h-5 text-orange-500" />
          <div>
            <p className="text-sm text-gray-400">Avg Response Time</p>
            <p className="text-2xl font-bold text-white">{averageResponseTime}ms</p>
          </div>
        </div>
      </Card>
    </div>
  );
};
