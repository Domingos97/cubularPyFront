import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSurveys } from '@/contexts/SurveyContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Database, Settings, Brain, Cog, FileText, Crown, MessageSquare } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { AdminSettings } from '@/components/admin/AdminSettings';
import { AIPersonalityManager } from '@/components/admin/AIPersonalityManager';
import { AdminUsersManagement } from '@/components/admin/AdminUsersManagement';
import { AdminSurveysManagement } from '@/components/admin/AdminSurveysManagement';
import { API_CONFIG, buildApiUrl } from '@/config';
import { ModelConfigurationPanel } from '@/components/admin/ModelConfigurationPanel';
import { SurveyBuilderPanel } from '@/components/admin/NewSurveyBuilderPanel';

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

type AdminSection = 'dashboard' | 'users' | 'surveys' | 'survey-builder' | 'plans' | 'ai-personalities' | 'model-config' | 'settings' | 'logs';

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
  const [activeSection, setActiveSection] = useState<AdminSection>('users');

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
      const usersData = await authenticatedApiRequest<User[]>(buildApiUrl(API_CONFIG.ENDPOINTS.USERS.BASE));
      setUsers(usersData || []);

      // Fetch surveys - using admin access endpoint for all surveys and files
      const surveysResponse = await authenticatedApiRequest<{surveys: Survey[]}>(buildApiUrl(API_CONFIG.ENDPOINTS.ADMIN.ACCESS_SURVEYS_FILES));
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
    clearCache(`API-GET-${buildApiUrl(API_CONFIG.ENDPOINTS.ADMIN.ACCESS_SURVEYS_FILES)}`);
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

  // Enhanced user deletion handler with optimistic updates
  const handleUserDeleted = async (userId?: string) => {
    if (userId) {
      // Optimistically remove the user from the local state immediately
      setUsers(prev => prev.filter(user => user.id !== userId));
    }
    
    // Clear cache and refresh data from server
    const { clearCache } = await import('../utils/requestDeduplication');
    clearCache(`API-GET-${buildApiUrl(API_CONFIG.ENDPOINTS.USERS.BASE)}`);
    await fetchData();
  };

  const handleLogout = async () => {
    await logout();
    navigate('/auth');
  };

  const adminSections = [
    {
      id: 'users' as AdminSection,
      title: t('admin.tabs.users'),
      description: 'Manage user accounts',
      icon: Users,
      color: 'text-blue-400'
    },
    {
      id: 'surveys' as AdminSection,
      title: t('admin.tabs.surveys'),
      description: 'Manage survey data',
      icon: Database,
      color: 'text-green-400'
    },
    {
      id: 'survey-builder' as AdminSection,
      title: 'Survey Builder',
      description: 'Create new surveys',
      icon: MessageSquare,
      color: 'text-purple-400'
    },
    {
      id: 'plans' as AdminSection,
      title: t('admin.tabs.plans'),
      description: 'Manage subscription plans',
      icon: Crown,
      color: 'text-yellow-400'
    },
    {
      id: 'ai-personalities' as AdminSection,
      title: t('admin.tabs.aiPersonalities'),
      description: 'Configure AI personalities',
      icon: Brain,
      color: 'text-pink-400'
    },
    {
      id: 'model-config' as AdminSection,
      title: t('admin.tabs.modelConfig'),
      description: 'Configure LLM models',
      icon: Cog,
      color: 'text-indigo-400'
    },
    {
      id: 'settings' as AdminSection,
      title: t('admin.tabs.settings'),
      description: 'System settings',
      icon: Settings,
      color: 'text-gray-400'
    },
    {
      id: 'logs' as AdminSection,
      title: 'Logs',
      description: 'View system logs',
      icon: FileText,
      color: 'text-orange-400'
    }
  ];

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'users':
        return (
          <AdminUsersManagement 
            users={users} 
            onUserAdded={fetchData} 
            onUserDeleted={handleUserDeleted} 
          />
        );
      case 'surveys':
        return (
          <AdminSurveysManagement 
            surveys={surveys} 
            onSurveyAdded={clearCacheAndRefetch} 
            onSurveyDeleted={handleSurveyDeleted} 
          />
        );
      case 'survey-builder':
        return <SurveyBuilderPanel />;
      case 'plans':
        return <AdminPlansManagement />;
      case 'ai-personalities':
        return <AIPersonalityManager />;
      case 'model-config':
        return <ModelConfigurationPanel />;
      case 'settings':
        return <AdminSettings />;
      case 'logs':
        return <AdminLogsManagement />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
      <div className="w-full">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
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

        {/* Two Panel Layout */}
        <div className="flex gap-6 h-[calc(100vh-10rem)] max-w-full overflow-hidden">
          {/* Left Panel - Admin Options */}
          <div className="w-80 min-w-[18rem] max-w-[22rem] flex-shrink-0">
            <Card className="bg-gray-800/80 border-gray-700 h-full flex flex-col overflow-hidden">
              <CardHeader className="flex-shrink-0">
                <CardTitle className="text-white text-lg">Admin Functions</CardTitle>
                <CardDescription className="text-gray-400">
                  Select an option to manage
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 overflow-auto pr-2">
                {adminSections.map((section) => {
                  const IconComponent = section.icon;
                  const isActive = activeSection === section.id;
                  return (
                    <div
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`
                        flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-all duration-200
                        ${isActive 
                          ? 'bg-blue-600/20 border border-blue-500/30 text-white' 
                          : 'hover:bg-gray-700/50 text-gray-300 hover:text-white'
                        }
                      `}
                    >
                      <IconComponent className={`w-5 h-5 ${isActive ? section.color : 'text-gray-400'}`} />
                      <div className="flex-1">
                        <div className="font-medium text-sm">{section.title}</div>
                        <div className="text-xs text-gray-400">{section.description}</div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Content Area */}
          <div className="flex-1 min-w-0">
            <Card className="bg-gray-800/80 border-gray-700 h-full flex flex-col">
              <CardHeader className="flex-shrink-0">
                <CardTitle className="text-white text-lg flex items-center space-x-2">
                  {(() => {
                    const activeConfig = adminSections.find(s => s.id === activeSection);
                    const IconComponent = activeConfig?.icon || Settings;
                    return (
                      <>
                        <IconComponent className={`w-5 h-5 ${activeConfig?.color || 'text-gray-400'}`} />
                        <span>{activeConfig?.title || 'Select an Option'}</span>
                      </>
                    );
                  })()}
                </CardTitle>
                <CardDescription className="text-gray-400">
                  {adminSections.find(s => s.id === activeSection)?.description || 'Choose an admin function from the left panel'}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 overflow-auto min-h-0 p-4">
                {activeSection === 'dashboard' ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Settings className="w-8 h-8 text-blue-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-white mb-2">Welcome to Admin Dashboard</h3>
                      <p className="text-gray-400 max-w-md">
                        Select an option from the left panel to manage different aspects of your application.
                      </p>
                    </div>
                  </div>
                ) : (
                  renderActiveSection()
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;
