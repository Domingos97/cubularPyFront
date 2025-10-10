import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/resources/i18n';
import { authenticatedFetch, authenticatedApiRequest } from '@/utils/api';
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
  language?: string;
  roleId: string;
  preferred_personality?: string;
  created_at?: string;
  updated_at?: string;
  last_login?: string;
  is_active?: boolean;
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
  const [grantAccessType, setGrantAccessType] = useState<'survey' | 'file'>('survey');
  const [selectedAccessType, setSelectedAccessType] = useState<'read' | 'write' | 'admin'>('read');
  const [selectedSurveyId, setSelectedSurveyId] = useState('');
  const [selectedFileId, setSelectedFileId] = useState('');
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
      const userData = await authenticatedApiRequest<UserWithAccess>(`http://localhost:3000/api/users/${userId}`);
      console.log('Fetched updated user data:', userData);
      setUser(userData);
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
      const data = await authenticatedApiRequest(`http://localhost:3000/api/admin/access/surveys-files`);
      setSurveys(data);
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
        email: user.email,
        language: user.language,
        roleId: user.roleId,
        preferred_personality: user.preferred_personality,
        is_active: user.is_active
      };

      if (newPassword.trim()) {
        updateData.password = newPassword;
      }

      const response = await authenticatedFetch(`http://localhost:3000/api/users/${user.id}`, {
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
        await fetchUser();
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update user');
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
    if (!user || (!selectedSurveyId && !selectedFileId)) {
      toast({
        title: t('user.missingInformation'),
        description: t('user.selectSurveyOrFile'),
        variant: 'destructive'
      });
      return;
    }

    try {
      const endpoint = grantAccessType === 'survey' 
        ? 'http://localhost:3000/api/admin/access/survey/grant' 
        : 'http://localhost:3000/api/admin/access/file/grant';

      const payload = grantAccessType === 'survey' 
        ? {
            userId: user.id,
            surveyId: selectedSurveyId,
            accessType: selectedAccessType,
            expiresAt: expiresAt || null
          }
        : {
            userId: user.id,
            surveyFileId: selectedFileId,
            accessType: selectedAccessType,
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
          
          if (grantAccessType === 'survey') {
            // Remove any existing access for this survey
            const filteredAccess = prevUser.user_survey_access?.filter(access => 
              access.survey_id !== selectedSurveyId
            ) || [];
            
            // Find survey details
            const survey = surveys.find(s => s.id === selectedSurveyId);
            
            // Add new access
            updatedUser.user_survey_access = [
              ...filteredAccess,
              {
                id: result.access?.id || `temp-${Date.now()}`,
                survey_id: selectedSurveyId,
                access_type: selectedAccessType,
                granted_at: now,
                expires_at: expiresAt || undefined,
                is_active: true,
                surveys: {
                  id: selectedSurveyId,
                  title: survey?.title || 'Unknown Survey',
                  category: survey?.category || 'Unknown'
                }
              }
            ];
          } else {
            // Remove any existing access for this file
            const filteredAccess = prevUser.user_survey_file_access?.filter(access => 
              access.survey_file_id !== selectedFileId
            ) || [];
            
            // Find file details
            let fileDetails = null;
            for (const survey of surveys) {
              const file = survey.survey_files.find(f => f.id === selectedFileId);
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
                survey_file_id: selectedFileId,
                access_type: selectedAccessType,
                granted_at: now,
                expires_at: expiresAt || undefined,
                is_active: true,
                survey_files: {
                  id: selectedFileId,
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
          description: t('user.accessGranted', { type: grantAccessType === 'survey' ? 'Survey' : 'File' })
        });
        setIsGrantAccessOpen(false);
        resetGrantAccessForm();
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

  const handleRevokeAccess = async (accessType: 'survey' | 'file', itemId: string) => {
    if (!user) return;

    try {
      const endpoint = accessType === 'survey' 
        ? 'http://localhost:3000/api/admin/access/survey/revoke' 
        : 'http://localhost:3000/api/admin/access/file/revoke';

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
        ? 'http://localhost:3000/api/admin/access/survey/grant' 
        : 'http://localhost:3000/api/admin/access/file/grant';

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
    setSelectedFileId('');
    setSelectedAccessType('read');
    setExpiresAt('');
  };

  const handleQuickGrant = () => {
    if (quickGrantSurvey) {
      setSelectedSurveyId(quickGrantSurvey);
      setGrantAccessType('survey');
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
              isSaving={isSaving}
              onBack={() => navigate('/admin')}
              onSave={handleSaveUser}
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
                  onUserChange={handleUserChange}
                  onPasswordChange={setNewPassword}
                  onPasswordVisibilityToggle={() => setShowPassword(!showPassword)}
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
        grantAccessType={grantAccessType}
        selectedAccessType={selectedAccessType}
        selectedSurveyId={selectedSurveyId}
        selectedFileId={selectedFileId}
        expiresAt={expiresAt}
        surveys={surveys}
        onClose={() => setIsGrantAccessOpen(false)}
        onGrantAccessTypeChange={setGrantAccessType}
        onAccessTypeChange={setSelectedAccessType}
        onSurveyIdChange={setSelectedSurveyId}
        onFileIdChange={setSelectedFileId}
        onExpiresAtChange={setExpiresAt}
        onGrantAccess={handleGrantAccess}
      />
    </div>
  );
};