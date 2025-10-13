import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSurveys } from '@/contexts/SurveyContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Database, Settings, BarChart3, Brain, Cog, FileText, Crown } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { AdminSettings } from '@/components/admin/AdminSettings';
import { AIPersonalityManager } from '@/components/admin/AIPersonalityManager';
import { AdminUsersManagement } from '@/components/admin/AdminUsersManagement';
import { AdminSurveysManagement } from '@/components/admin/AdminSurveysManagement';
import { ModelConfigurationPanel } from '@/components/admin/ModelConfigurationPanel';
import AdminLogsManagement from '@/components/admin/AdminLogsManagement';
import AdminPlansManagement from '@/components/admin/AdminPlansManagement';
import { authenticatedApiRequest } from '@/utils/api';
import { useTranslation } from '@/resources/i18n';
import LanguageSwitcher from '@/components/LanguageSwitcher';


interface User {
  id: string;
  username: string;
  email: string;
  role: string;
}

interface Survey {
  id: string;
  title?: string;
  filename?: string;
  created_at: string;
  category?: string;
}

const Admin = () => {
  const { user, logout } = useAuth();
  const { refreshSurveys } = useSurveys();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [users, setUsers] = useState<User[]>([]);
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  console.log('🔍 ADMIN COMPONENT DEBUG:', { 
    hasUser: !!user,
    userRole: user?.role, 
    loading: loading,
    error: error
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch users
      const usersData = await authenticatedApiRequest<User[]>('http://localhost:8000/api/users');
      setUsers(usersData || []);

      // Fetch surveys - using admin access endpoint for all surveys and files
      const surveysResponse = await authenticatedApiRequest<{surveys: Survey[]}>('http://localhost:8000/api/admin/access/surveys-files');
      setSurveys(surveysResponse?.surveys || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(t('admin.failedToLoadData'));
    } finally {
      setLoading(false);
    }
  };

  // Helper to clear surveys cache and refresh data
  const clearCacheAndRefetch = async () => {
    const { clearCache } = await import('../utils/requestDeduplication');
    clearCache('API-GET-http://localhost:8000/api/admin/access/surveys-files');
    // Also refresh the SurveyContext so the Index page shows updated surveys
    await refreshSurveys();
    await fetchData();
  };

  // Enhanced survey deletion handler with optimistic updates
  const handleSurveyDeleted = async (surveyId?: string) => {
    if (surveyId) {
      // Optimistically remove the survey from the local state immediately
      setSurveys(prev => prev.filter(survey => survey.id !== surveyId));
    }
    
    // Clear cache and refresh data from server
    await clearCacheAndRefetch();
  };

  const handleLogout = async () => {
    await logout();
    navigate('/auth');
  };
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">{t('admin.dashboard')}</h1>
            <p className="text-gray-400 mt-1">{t('admin.welcome', { email: user?.email })}</p>
          </div>
          <div className="flex items-center space-x-4">
            <LanguageSwitcher />
            <Button
              variant="outline"
              onClick={() => {
                sessionStorage.removeItem('searchTerm');
                sessionStorage.removeItem('selectedSurveys');
                navigate('/', { state: { resetSearch: true } });
              }}
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              {t('admin.backToApp')}
            </Button>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              {t('admin.logout')}
            </Button>
          </div>
        </div>

        {error && (
          <Alert className="bg-red-900/50 border-red-700 mb-6">
            <AlertDescription className="text-red-200">{error}</AlertDescription>
          </Alert>
        )}

        {/* Admin Tabs */}
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-8 bg-gray-800/80 border-gray-700">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-gray-700">
              <BarChart3 className="w-4 h-4 mr-2" />
              {t('admin.tabs.dashboard')}
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-gray-700">
              <Users className="w-4 h-4 mr-2" />
              {t('admin.tabs.users')}
            </TabsTrigger>
            <TabsTrigger value="surveys" className="data-[state=active]:bg-gray-700">
              <Database className="w-4 h-4 mr-2" />
              {t('admin.tabs.surveys')}
            </TabsTrigger>
            <TabsTrigger value="plans" className="data-[state=active]:bg-gray-700">
              <Crown className="w-4 h-4 mr-2" />
              {t('admin.tabs.plans')}
            </TabsTrigger>
            <TabsTrigger value="ai-personalities" className="data-[state=active]:bg-gray-700">
              <Brain className="w-4 h-4 mr-2" />
              {t('admin.tabs.aiPersonalities')}
            </TabsTrigger>
            <TabsTrigger value="model-config" className="data-[state=active]:bg-gray-700">
              <Cog className="w-4 h-4 mr-2" />
              {t('admin.tabs.modelConfig')}
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-gray-700">
              <Settings className="w-4 h-4 mr-2" />
              {t('admin.tabs.settings')}
            </TabsTrigger>
            <TabsTrigger value="logs" className="data-[state=active]:bg-gray-700">
              <FileText className="w-4 h-4 mr-2" />
              Logs
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard">
            <AdminDashboard users={users} surveys={surveys} />
          </TabsContent>

          {/* Users Management Tab */}
          <TabsContent value="users">
            <AdminUsersManagement 
              users={users} 
              onUserAdded={fetchData} 
              onUserDeleted={fetchData} 
            />
          </TabsContent>

          {/* Surveys Management Tab */}
          <TabsContent value="surveys">
            <AdminSurveysManagement 
              surveys={surveys} 
              onSurveyAdded={clearCacheAndRefetch} 
              onSurveyDeleted={handleSurveyDeleted} 
            />
          </TabsContent>

          {/* Plans Management Tab */}
          <TabsContent value="plans">
            <AdminPlansManagement />
          </TabsContent>

          {/* AI Personalities Management Tab */}
          <TabsContent value="ai-personalities">
            <AIPersonalityManager />
          </TabsContent>

          {/* Model Configuration Tab */}
          <TabsContent value="model-config">
            <ModelConfigurationPanel />
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <AdminSettings />
          </TabsContent>

          {/* Logs Tab */}
          <TabsContent value="logs">
            <AdminLogsManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
