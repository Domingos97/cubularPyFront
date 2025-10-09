import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Bot, 
  MessageSquare, 
  Activity,
  Clock,
  TrendingUp,
  CheckCircle,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ChatMessage {
  id: string;
  content: string;
  sender: string;
  timestamp: string;
  message_language?: string; // ISO 639-1 language code for message language tracking
  confidence?: any;
  data_snapshot?: any;
}

interface APILog {
  id: string;
  timestamp: string;
  endpoint: string;
  status: string;
  response_time: number;
  error?: string;
}

export const ChatbotManagementPanel = () => {
  const { toast } = useToast();
  const [recentMessages, setRecentMessages] = useState<ChatMessage[]>([]);
  const [apiLogs, setApiLogs] = useState<APILog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecentMessages();
    loadAPILogs();
  }, []);

  const loadRecentMessages = async () => {
    try {
      // In a real implementation, you could create an API endpoint to fetch recent messages
      // For now, we'll use mock data or you can implement /api/admin/recent-messages
      setRecentMessages([]);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const loadAPILogs = async () => {
    // Simulate API logs - in real implementation, you could add logging middleware to track API calls
    const mockLogs: APILog[] = [
      {
        id: '1',
        timestamp: new Date().toISOString(),
        endpoint: '/api/surveys/semantic-chat',
        status: 'success',
        response_time: 1200
      },
      {
        id: '2',
        timestamp: new Date(Date.now() - 300000).toISOString(),
        endpoint: '/api/surveys/:id/suggestions',
        status: 'success',
        response_time: 800
      },
      {
        id: '3',
        timestamp: new Date(Date.now() - 600000).toISOString(),
        endpoint: '/api/surveys/semantic-chat',
        status: 'error',
        response_time: 5000,
        error: 'OpenAI API rate limit exceeded'
      }
    ];
    
    setApiLogs(mockLogs);
    setLoading(false);
  };

  const averageResponseTime = apiLogs.length > 0 
    ? Math.round(apiLogs.reduce((sum, log) => sum + log.response_time, 0) / apiLogs.length)
    : 0;

  const successRate = apiLogs.length > 0 
    ? Math.round((apiLogs.filter(log => log.status === 'success').length / apiLogs.length) * 100)
    : 0;

  return (
    <Card className="bg-gray-800/80 border-gray-700">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Bot className="w-5 h-5 text-blue-500" />
          <CardTitle className="text-white">Chatbot Management</CardTitle>
        </div>
        <CardDescription className="text-gray-400">
          Monitor chatbot performance and recent conversations
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="monitoring" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gray-700">
            <TabsTrigger value="monitoring" className="text-gray-300">Activity Monitoring</TabsTrigger>
            <TabsTrigger value="analytics" className="text-gray-300">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="monitoring" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="bg-gray-700/50 border-gray-600">
                <CardHeader>
                  <CardTitle className="text-white text-lg flex items-center">
                    <MessageSquare className="w-5 h-5 mr-2" />
                    Recent Conversations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-3">
                      {recentMessages.length > 0 ? (
                        recentMessages.map((message) => (
                          <div key={message.id} className="p-3 bg-gray-800 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <Badge variant={message.sender === 'assistant' ? 'default' : 'secondary'}>
                                {message.sender}
                              </Badge>
                              <span className="text-xs text-gray-400">
                                {new Date(message.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                            <p className="text-sm text-gray-300 line-clamp-3">
                              {message.content}
                            </p>
                            {message.confidence && (
                              <div className="mt-2">
                                <Badge variant="outline" className="text-xs">
                                  Confidence: {typeof message.confidence === 'object' ? JSON.stringify(message.confidence) : message.confidence}
                                </Badge>
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-400 italic text-center py-8">No recent conversations</p>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              <Card className="bg-gray-700/50 border-gray-600">
                <CardHeader>
                  <CardTitle className="text-white text-lg flex items-center">
                    <Activity className="w-5 h-5 mr-2" />
                    API Logs
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <Button size="sm" variant="outline" onClick={loadAPILogs}>
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-2">
                      {apiLogs.map((log) => (
                        <div key={log.id} className="p-3 bg-gray-800 rounded-lg">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-300">
                              {log.endpoint}
                            </span>
                            <div className="flex items-center space-x-2">
                              {log.status === 'success' ? (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              ) : (
                                <span className="w-4 h-4 text-red-500">✕</span>
                              )}
                              <span className="text-xs text-gray-400">
                                {log.response_time}ms
                              </span>
                            </div>
                          </div>
                          <div className="text-xs text-gray-400">
                            {new Date(log.timestamp).toLocaleString()}
                          </div>
                          {log.error && (
                            <div className="mt-1 text-xs text-red-400 bg-red-900/20 p-1 rounded">
                              {log.error}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-gray-700/50 border-gray-600">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-5 h-5 text-blue-500" />
                    <div>
                      <p className="text-sm text-gray-400">Avg Response Time</p>
                      <p className="text-2xl font-bold text-white">{averageResponseTime}ms</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-700/50 border-gray-600">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="text-sm text-gray-400">Success Rate</p>
                      <p className="text-2xl font-bold text-white">{successRate}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-700/50 border-gray-600">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <MessageSquare className="w-5 h-5 text-purple-500" />
                    <div>
                      <p className="text-sm text-gray-400">Total Messages</p>
                      <p className="text-2xl font-bold text-white">{recentMessages.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-gray-700/50 border-gray-600">
              <CardHeader>
                <CardTitle className="text-white">System Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">AI Model:</span>
                    <span className="text-white">GPT-4o-mini (OpenAI)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Backend Integration:</span>
                    <span className="text-white">Direct API (No Edge Functions)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Survey Analysis:</span>
                    <span className="text-white">Real-time Processing</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Authentication:</span>
                    <span className="text-white">JWT + PostegreSql</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};