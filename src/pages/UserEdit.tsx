import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/resources/i18n';
import { authenticatedFetch, authenticatedApiRequest } from '@/utils/api';
import { API_CONFIG, buildApiUrl } from '@/config';
import AdminSidebar from '@/components/AdminSidebar';
import UserSidebar from '@/components/UserSidebar';
import { useAuth } from '@/hooks/useAuth';
import { 
  UserIcon as User, 
  Shield, 
  Crown,
  MessageSquare
} from 'lucide-react';

// Import the new components
import UserEditHeader from '@/components/user/UserEditHeader';
import UserProfile from '@/components/user/UserProfile';
import AccessControlManager from '@/components/user/AccessControlManager';
import PlanUsageManager from '@/components/user/PlanUsageManager';
import GrantAccessDialog from '@/components/user/GrantAccessDialog';
import UserRequests from '@/components/user/UserRequests';

// Types
interface UserData {
  id: string;
  email: string;
  username: string;
  password?: string;
  language_preference?: string;  // Changed from language to match backend
  preferred_personality?: string;
  role?: string;
  has_ai_personalities_access?: boolean;
  created_at?: string;
  updated_at?: string;
  last_login?: string;
}

interface UserPlan {
  id: string;
  status: string;
  start_date: string;
  end_date?: string;
  trial_ends_at?: string;
  auto_renew: boolean;
  payment_method_id?: string;
  stripe_subscription_id?: string;
  created_at: string;
  updated_at: string;
  plans: {
    id: string;
    name: string;
    display_name: string;
  };
}

interface SurveyAccess {
  id: string;
  survey_id: string;
  access_type: 'read' | 'write' | 'admin';
  granted_at: string;
  expires_at?: string;
  is_active: boolean;
  surveys: {
    id: string;
    title: string;
    category: string;
  };
}

interface FileAccess {
  id: string;
  survey_file_id: string;
  access_type: 'read' | 'write' | 'admin';
  granted_at: string;
  expires_at?: string;
  is_active: boolean;
  survey_files: {
    id: string;
    filename: string;
    surveys: {
      id: string;
      title: string;
    };
  };
}

interface UserWithAccess extends UserData {
  user_plans?: UserPlan[];
  user_survey_access?: SurveyAccess[];
  user_survey_file_access?: FileAccess[];
}

interface Survey {
  id: string;
  title: string;
  category: string;
  survey_files: Array<{
    id: string;
    filename: string;
  }>;
}

export const UserEdit = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { refreshToken } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();

  // Main state
  const [user, setUser] = useState<UserWithAccess | null>(null);
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  // Access management states
  const [isGrantAccessOpen, setIsGrantAccessOpen] = useState(false);
  const [selectedAccessType, setSelectedAccessType] = useState<'read' | 'write' | 'admin'>('read');
  const [selectedSurveyId, setSelectedSurveyId] = useState('');
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [expiresAt, setExpiresAt] = useState('');
  const [quickGrantSurvey, setQuickGrantSurvey] = useState('');

  useEffect(() => {
    if (userId) {
      fetchUser();
      fetchSurveys();
    }
  }, [userId]);

  const fetchUser = async () => {
    try {
      setIsLoading(true);
      const userData = await authenticatedApiRequest<UserWithAccess>(buildApiUrl(`/users/${userId}`));
      console.log('Fetched updated user data:', userData);
      setUser(userData);
      return userData;
    } catch (error) {
      console.error('Error fetching user:', error);
      toast({
        title: 'Error',
        description: t('user.loadError'),
        variant: 'destructive'
      });
      navigate('/admin');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSurveys = async () => {
    try {
      const data = await authenticatedApiRequest<{surveys: Survey[]}>(buildApiUrl(API_CONFIG.ENDPOINTS.ADMIN.ACCESS_SURVEYS_FILES));
      setSurveys(data?.surveys || []);
    } catch (error) {
      console.error('Error fetching surveys:', error);
      toast({
        title: t('user.error'),
        description: 'Failed to load surveys',
        variant: 'destructive'
      });
    }
  };

  const handleSaveUser = async () => {
    if (!user) return;

    try {
      setIsSaving(true);
      const updateData: any = {
        username: user.username,
        language: user.language_preference  // Use language_preference from user data
      };

      // Include role when changed by admin
      if (user.role) {
        updateData.role = user.role;
      }

      // Include AI personalities access flag if present
      if (typeof user.has_ai_personalities_access !== 'undefined') {
        updateData.has_ai_personalities_access = user.has_ai_personalities_access;
      }

      // Only include preferred_personality if it's not null/undefined
      if (user.preferred_personality) {
        updateData.preferred_personality = user.preferred_personality;
      }

      if (newPassword.trim()) {
        updateData.password = newPassword;
      }

      console.log('Sending update data:', updateData);

      const response = await authenticatedFetch(buildApiUrl(`/users/${user.id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        toast({
          title: t('user.success'),
          description: t('user.updateSuccess')
        });
        setNewPassword('');
        const refreshed = await fetchUser();

        // Notify other admin UI components that this user was updated so they can refresh local state
        try {
          if (refreshed && typeof window !== 'undefined') {
            // Dispatch event for mounted listeners
            try { window.dispatchEvent(new CustomEvent('user-updated', { detail: refreshed })); } catch(e) { console.warn('Failed to dispatch user-updated event', e); }

            // Also store in sessionStorage as a fallback for pages that are not mounted
            try { sessionStorage.setItem('user-updated', JSON.stringify(refreshed)); } catch(e) { /* ignore */ }

            // Clear cached users GET so other pages (Admin list) will fetch fresh data
            try {
              const { clearCache } = await import('@/utils/requestDeduplication');
              clearCache(`API-GET-${buildApiUrl(API_CONFIG.ENDPOINTS.USERS.BASE)}`);
            } catch (e) {
              // try alternative relative import if alias fails
              try {
                const { clearCache } = await import('../utils/requestDeduplication');
                clearCache(`API-GET-${buildApiUrl(API_CONFIG.ENDPOINTS.USERS.BASE)}`);
              } catch (e2) {
                console.warn('Failed to clear users cache', e2);
              }
            }
          }
        } catch (e) {
          console.warn('Failed to notify about user update', e);
        }

        // If we updated the currently logged-in user's permissions, refresh tokens so the frontend gets updated claims
        try {
          if (user.id && currentUser && user.id === currentUser.id) {
            // refreshToken updates local user state in useAuth
            await refreshToken();
          }
        } catch (e) {
          console.warn('Failed to refresh token after updating current user:', e);
        }
      } else {
        const errorData = await response.text();
        console.error('Update failed with status:', response.status, 'Error:', errorData);
        let errorMessage = 'Failed to update user';
        try {
          const parsedError = JSON.parse(errorData);
          errorMessage = parsedError.detail || parsedError.message || errorMessage;
        } catch (e) {
          errorMessage = errorData || errorMessage;
        }
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: t('user.error'),
        description: error instanceof Error ? error.message : t('user.updateError'),
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleGrantAccess = async () => {
    if (!user || !selectedSurveyId) {
      toast({
        title: t('user.missingInformation'),
        description: 'Please select a survey',
        variant: 'destructive'
      });
      return;
    }

    try {
      const selectedSurvey = surveys.find(s => s.id === selectedSurveyId);
      if (!selectedSurvey) {
        throw new Error('Selected survey not found');
      }

      // Always grant survey access
      const surveyResponse = await authenticatedFetch(buildApiUrl(API_CONFIG.ENDPOINTS.ADMIN.SURVEY_GRANT), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: user.id,
          surveyId: selectedSurveyId,
          accessType: selectedAccessType,
          expiresAt: expiresAt || null
        })
      });

      if (!surveyResponse.ok) {
        throw new Error('Failed to grant survey access');
      }

      // Grant access to selected files (if any)
      let fileResponses: Response[] = [];
      if (selectedFileIds.length > 0) {
        fileResponses = await Promise.all(
          selectedFileIds.map(fileId =>
            authenticatedFetch(buildApiUrl(API_CONFIG.ENDPOINTS.ADMIN.FILE_GRANT), {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                userId: user.id,
                surveyFileId: fileId,
                accessType: selectedAccessType,
                expiresAt: expiresAt || null
              })
            })
          )
        );

        // Check if any file access grants failed
        const failedFiles = fileResponses.filter(response => !response.ok);
        if (failedFiles.length > 0) {
          console.warn(`Failed to grant access to ${failedFiles.length} files`);
        }
      }

      // Update user state locally
      setUser(prevUser => {
        if (!prevUser) return prevUser;
        
        const updatedUser = { ...prevUser };
        const now = new Date().toISOString();
        
        // Remove any existing access for this survey
        const filteredSurveyAccess = prevUser.user_survey_access?.filter(access => 
          access.survey_id !== selectedSurveyId
        ) || [];
        
        // Add new survey access
        updatedUser.user_survey_access = [
          ...filteredSurveyAccess,
          {
            id: `temp-survey-${Date.now()}`,
            survey_id: selectedSurveyId,
            access_type: selectedAccessType,
            granted_at: now,
            expires_at: expiresAt || undefined,
            is_active: true,
            surveys: {
              id: selectedSurveyId,
              title: selectedSurvey.title,
              category: selectedSurvey.category
            }
          }
        ];

        // Remove existing file access for selected files and add new ones
        if (selectedFileIds.length > 0) {
          const filteredFileAccess = prevUser.user_survey_file_access?.filter(access => 
            !selectedFileIds.includes(access.survey_file_id)
          ) || [];

          const newFileAccess = selectedFileIds.map(fileId => {
            const file = selectedSurvey.survey_files.find(f => f.id === fileId);
            return {
              id: `temp-file-${fileId}-${Date.now()}`,
              survey_file_id: fileId,
              access_type: selectedAccessType,
              granted_at: now,
              expires_at: expiresAt || undefined,
              is_active: true,
              survey_files: {
                id: fileId,
                filename: file?.filename || 'Unknown File',
                surveys: {
                  id: selectedSurveyId,
                  title: selectedSurvey.title
                }
              }
            };
          });

          updatedUser.user_survey_file_access = [
            ...filteredFileAccess,
            ...newFileAccess
          ];
        }
        
        return updatedUser;
      });

      const message = selectedFileIds.length > 0 
        ? `Access granted to survey "${selectedSurvey.title}" and ${selectedFileIds.length} selected files`
        : `Access granted to survey "${selectedSurvey.title}"`;

      toast({
        title: t('user.success'),
        description: message
      });

      // Reset form
      setIsGrantAccessOpen(false);
      setSelectedSurveyId('');
      setSelectedFileIds([]);
      setExpiresAt('');
      
    } catch (error) {
      console.error('Error granting access:', error);
      toast({
        title: t('user.error'),
        description: error instanceof Error ? error.message : 'Failed to grant access',
        variant: 'destructive'
      });
    }
  };

  const handleRevokeAccess = async (accessType: 'survey' | 'file', itemId: string) => {
    if (!user) return;

    try {
      const endpoint = accessType === 'survey' 
        ? buildApiUrl(API_CONFIG.ENDPOINTS.ADMIN.SURVEY_REVOKE)
        : buildApiUrl(API_CONFIG.ENDPOINTS.ADMIN.FILE_REVOKE);

      const payload = accessType === 'survey' 
        ? { userId: user.id, surveyId: itemId }
        : { userId: user.id, surveyFileId: itemId };

      const response = await authenticatedFetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        // Update user state locally instead of full refresh
        setUser(prevUser => {
          if (!prevUser) return prevUser;
          
          const updatedUser = { ...prevUser };
          
          if (accessType === 'survey') {
            updatedUser.user_survey_access = prevUser.user_survey_access?.map(access => 
              access.survey_id === itemId ? { ...access, is_active: false } : access
            ) || [];
          } else {
            updatedUser.user_survey_file_access = prevUser.user_survey_file_access?.map(access => 
              access.survey_file_id === itemId ? { ...access, is_active: false } : access
            ) || [];
          }
          
          return updatedUser;
        });
        
        toast({
          title: t('user.success'),
          description: t('user.accessRevoked', { type: accessType === 'survey' ? 'Survey' : 'File' })
        });
      } else {
        const error = await response.json();
        throw new Error(error.message || t('user.failedToRevokeAccess'));
      }
    } catch (error) {
      console.error('Error revoking access:', error);
      toast({
        title: t('user.error'),
        description: error instanceof Error ? error.message : t('user.failedToRevokeAccess'),
        variant: 'destructive'
      });
    }
  };

  const handleMatrixGrantAccess = async (type: 'survey' | 'file', itemId: string, accessType: 'read' | 'write' | 'admin', expiresAt?: string | null) => {
    if (!user) return;

    try {
      const endpoint = type === 'survey' 
        ? buildApiUrl(API_CONFIG.ENDPOINTS.ADMIN.SURVEY_GRANT)
        : buildApiUrl(API_CONFIG.ENDPOINTS.ADMIN.FILE_GRANT);

      const payload = type === 'survey' 
        ? {
            userId: user.id,
            surveyId: itemId,
            accessType: accessType,
            expiresAt: expiresAt || null
          }
        : {
            userId: user.id,
            surveyFileId: itemId,
            accessType: accessType,
            expiresAt: expiresAt || null
          };

      const response = await authenticatedFetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const result = await response.json();
        
        // Update user state locally instead of full refresh
        setUser(prevUser => {
          if (!prevUser) return prevUser;
          
          const updatedUser = { ...prevUser };
          const now = new Date().toISOString();
          
          if (type === 'survey') {
            // Remove any existing access for this survey
            const filteredAccess = prevUser.user_survey_access?.filter(access => 
              access.survey_id !== itemId
            ) || [];
            
            // Find survey details
            const survey = surveys.find(s => s.id === itemId);
            
            // Add new access
            updatedUser.user_survey_access = [
              ...filteredAccess,
              {
                id: result.access?.id || `temp-${Date.now()}`,
                survey_id: itemId,
                access_type: accessType,
                granted_at: now,
                expires_at: expiresAt || undefined,
                is_active: true,
                surveys: {
                  id: itemId,
                  title: survey?.title || 'Unknown Survey',
                  category: survey?.category || 'Unknown'
                }
              }
            ];
          } else {
            // Remove any existing access for this file
            const filteredAccess = prevUser.user_survey_file_access?.filter(access => 
              access.survey_file_id !== itemId
            ) || [];
            
            // Find file details
            let fileDetails = null;
            for (const survey of surveys) {
              const file = survey.survey_files.find(f => f.id === itemId);
              if (file) {
                fileDetails = {
                  filename: file.filename,
                  surveyTitle: survey.title
                };
                break;
              }
            }
            
            // Add new access
            updatedUser.user_survey_file_access = [
              ...filteredAccess,
              {
                id: result.access?.id || `temp-${Date.now()}`,
                survey_file_id: itemId,
                access_type: accessType,
                granted_at: now,
                expires_at: expiresAt || undefined,
                is_active: true,
                survey_files: {
                  id: itemId,
                  filename: fileDetails?.filename || 'Unknown File',
                  surveys: {
                    id: 'unknown',
                    title: fileDetails?.surveyTitle || 'Unknown Survey'
                  }
                }
              }
            ];
          }
          
          return updatedUser;
        });
        
        toast({
          title: t('user.success'),
          description: t('user.accessGranted', { type: type === 'survey' ? 'Survey' : 'File' })
        });
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to grant access');
      }
    } catch (error) {
      console.error('Error granting access:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to grant access',
        variant: 'destructive'
      });
    }
  };

  const resetGrantAccessForm = () => {
    setSelectedSurveyId('');
    setSelectedFileIds([]);
    setSelectedAccessType('read');
    setExpiresAt('');
  };

  const handleQuickGrant = () => {
    if (quickGrantSurvey) {
      setSelectedSurveyId(quickGrantSurvey);
      setSelectedFileIds([]);
      setSelectedAccessType('read');
      handleGrantAccess();
      setQuickGrantSurvey('');
    }
  };

  const handleUserChange = (updates: Partial<UserData>) => {
    if (user) {
      setUser({ ...user, ...updates });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="flex">
          {currentUser?.role === 'admin' ? <AdminSidebar /> : <UserSidebar />}
          <div className="flex-1 p-8">
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="flex">
          {currentUser?.role === 'admin' ? <AdminSidebar /> : <UserSidebar />}
          <div className="flex-1 p-8">
            <div className="text-center py-12">
              <h2 className="text-xl font-semibold text-gray-200 mb-2">{t('common.userNotFound')}</h2>
              <p className="text-gray-400">The requested user could not be found.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="flex">
        {currentUser?.role === 'admin' ? <AdminSidebar /> : <UserSidebar />}
        
        <div className="flex-1 p-8">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <UserEditHeader
              username={user.username}
              showSaveButton={false}
              onBack={() => navigate('/admin')}
            />

            <Tabs defaultValue={searchParams.get('tab') || 'profile'} className="space-y-6">
              <TabsList className="grid w-full grid-cols-4 bg-gray-800/80 border-gray-700">
                <TabsTrigger value="profile" className="data-[state=active]:bg-gray-700">
                  <User className="w-4 h-4 mr-2" />
                  {t('admin.userEdit.profile')}
                </TabsTrigger>
                <TabsTrigger value="access" className="data-[state=active]:bg-gray-700">
                  <Shield className="w-4 h-4 mr-2" />
                  {t('admin.userEdit.accessControl')}
                </TabsTrigger>
                <TabsTrigger value="plan" className="data-[state=active]:bg-gray-700">
                  <Crown className="w-4 h-4 mr-2" />
                  {t('admin.userEdit.planUsage')}
                </TabsTrigger>
                <TabsTrigger value="requests" className="data-[state=active]:bg-gray-700">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  {t('admin.userEdit.requests')}
                </TabsTrigger>
              </TabsList>

              {/* Profile Tab */}
              <TabsContent value="profile">
                <UserProfile
                  user={user}
                  newPassword={newPassword}
                  showPassword={showPassword}
                  isSaving={isSaving}
                  onUserChange={handleUserChange}
                  onPasswordChange={setNewPassword}
                  onPasswordVisibilityToggle={() => setShowPassword(!showPassword)}
                  onSave={handleSaveUser}
                />
              </TabsContent>

              {/* Access Control Tab */}
              <TabsContent value="access">
                <AccessControlManager
                  user={user}
                  surveys={surveys}
                  onGrantAccess={handleGrantAccess}
                  onMatrixGrantAccess={handleMatrixGrantAccess}
                  onRevokeAccess={handleRevokeAccess}
                  onOpenGrantDialog={() => setIsGrantAccessOpen(true)}
                  quickGrantSurvey={quickGrantSurvey}
                  onQuickGrantSurveyChange={setQuickGrantSurvey}
                  onQuickGrant={handleQuickGrant}
                />
              </TabsContent>

              {/* Plan & Usage Tab */}
              <TabsContent value="plan">
                <PlanUsageManager 
                  key={`plan-manager-${user.id}-${user.user_plans?.length || 0}`}
                  user={user} 
                  isAdmin={currentUser?.role === 'admin'} 
                  onUserUpdate={fetchUser}
                />
              </TabsContent>

              {/* Requests Tab */}
              <TabsContent value="requests">
                <UserRequests userId={user.id} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Grant Access Dialog */}
      <GrantAccessDialog
        isOpen={isGrantAccessOpen}
        selectedAccessType={selectedAccessType}
        selectedSurveyId={selectedSurveyId}
        selectedFileIds={selectedFileIds}
        expiresAt={expiresAt}
        surveys={surveys}
        onClose={() => setIsGrantAccessOpen(false)}
        onAccessTypeChange={setSelectedAccessType}
        onSurveyIdChange={setSelectedSurveyId}
        onFileIdsChange={setSelectedFileIds}
        onExpiresAtChange={setExpiresAt}
        onGrantAccess={handleGrantAccess}
      />
    </div>
  );
};
