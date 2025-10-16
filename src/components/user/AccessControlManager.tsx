import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/resources/i18n';
import { 
  Shield, 
  Plus, 
  History, 
  Database, 
  FileText, 
  Clock, 
  Search, 
  List, 
  Zap, 
  RefreshCw, 
  Trash2
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import AccessPermissionMatrix from '@/components/AccessPermissionMatrix';

interface Survey {
  id: string;
  title: string;
  category: string;
  survey_files: Array<{
    id: string;
    filename: string;
  }>;
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

interface User {
  id: string;
  username: string;
  user_survey_access?: SurveyAccess[];
  user_survey_file_access?: FileAccess[];
}

interface AccessControlManagerProps {
  user: User;
  surveys: Survey[];
  onGrantAccess: () => Promise<void>;
  onMatrixGrantAccess?: (type: 'survey' | 'file', itemId: string, accessType: 'read' | 'write' | 'admin', expiresAt?: string | null) => Promise<void>;
  onRevokeAccess: (type: 'survey' | 'file', itemId: string) => Promise<void>;
  onOpenGrantDialog: () => void;
  quickGrantSurvey: string;
  onQuickGrantSurveyChange: (surveyId: string) => void;
  onQuickGrant: () => void;
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getAccessTypeColor = (accessType: 'read' | 'write' | 'admin') => {
  switch (accessType) {
    case 'read': return 'text-blue-400 border-blue-600';
    case 'write': return 'text-green-400 border-green-600';
    case 'admin': return 'text-purple-400 border-purple-600';
    default: return 'text-gray-400 border-gray-600';
  }
};

const AccessControlManager: React.FC<AccessControlManagerProps> = ({
  user,
  surveys,
  onGrantAccess,
  onMatrixGrantAccess,
  onRevokeAccess,
  onOpenGrantDialog,
  quickGrantSurvey,
  onQuickGrantSurveyChange,
  onQuickGrant
}) => {
  // Enhanced UX states
  const [accessFilter, setAccessFilter] = useState<'all' | 'active' | 'expired' | 'expiring-soon'>('active');
  const [selectedAccessItems, setSelectedAccessItems] = useState<string[]>([]);
  const [showAccessHistory, setShowAccessHistory] = useState(false);
  const [accessSearchQuery, setAccessSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'matrix'>('list');

  const handleMatrixGrantAccess = async (type: 'survey' | 'file', itemId: string, accessType: 'read' | 'write' | 'admin', expiresAt?: string | null) => {
    if (onMatrixGrantAccess) {
      await onMatrixGrantAccess(type, itemId, accessType, expiresAt);
    } else {
      // Fallback to opening the grant dialog
      onOpenGrantDialog();
    }
  };
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      {/* Enhanced Access Control Header */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-gray-100 flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-500" />
                {t('admin.accessControl.title')}
              </CardTitle>
              <CardDescription className="text-gray-400">
                {t('admin.accessControl.description', { username: user.username })}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {/* View Mode Toggle */}
              <div className="flex items-center bg-gray-700/50 rounded-lg p-1">
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="text-xs h-8"
                >
                  <List className="h-4 w-4 mr-1" />
                  {t('admin.accessControl.list')}
                </Button>
                <Button
                  variant={viewMode === 'matrix' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('matrix')}
                  className="text-xs h-8"
                >
                  <div className="grid grid-cols-2 gap-0.5 mr-1">
                    <div className="h-1 w-1 bg-current rounded-full"></div>
                    <div className="h-1 w-1 bg-current rounded-full"></div>
                    <div className="h-1 w-1 bg-current rounded-full"></div>
                    <div className="h-1 w-1 bg-current rounded-full"></div>
                  </div>
                  {t('admin.accessControl.matrix')}
                </Button>
              </div>
              

              <Button
                onClick={onOpenGrantDialog}
                className="bg-green-600 hover:bg-green-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                {t('admin.accessControl.grantAccess')}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Access Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gray-800/30 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-400">{t('admin.accessControl.surveyAccess')}</p>
                <p className="text-lg font-semibold text-white">
                  {user.user_survey_access?.filter(a => a.is_active).length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-800/30 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-400">{t('admin.accessControl.fileAccess')}</p>
                <p className="text-lg font-semibold text-white">
                  {user.user_survey_file_access?.filter(a => a.is_active).length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-800/30 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm text-gray-400">{t('admin.accessControl.expiringSoon')}</p>
                <p className="text-lg font-semibold text-white">
                  {[...user.user_survey_access || [], ...user.user_survey_file_access || []]
                    .filter(a => a.is_active && a.expires_at && new Date(a.expires_at) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))
                    .length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-800/30 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-gray-400">{t('admin.accessControl.adminAccess')}</p>
                <p className="text-lg font-semibold text-white">
                  {[...user.user_survey_access || [], ...user.user_survey_file_access || []]
                    .filter(a => a.is_active && a.access_type === 'admin')
                    .length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      {viewMode === 'list' && (
        <Card className="bg-gray-800/30 border-gray-700">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-3 flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder={t('admin.accessControl.searchPlaceholder')}
                    value={accessSearchQuery}
                    onChange={(e) => setAccessSearchQuery(e.target.value)}
                    className="pl-10 bg-gray-700 border-gray-600 text-gray-100 w-full sm:w-64"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={accessFilter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setAccessFilter('all')}
                    className="text-xs"
                  >
                    {t('admin.accessControl.all')}
                  </Button>
                  <Button
                    variant={accessFilter === 'active' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setAccessFilter('active')}
                    className="text-xs"
                  >
                    {t('admin.accessControl.active')}
                  </Button>
                  <Button
                    variant={accessFilter === 'expired' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setAccessFilter('expired')}
                    className="text-xs"
                  >
                    {t('admin.accessControl.expired')}
                  </Button>
                  <Button
                    variant={accessFilter === 'expiring-soon' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setAccessFilter('expiring-soon')}
                    className="text-xs"
                  >
                    <Clock className="h-3 w-3 mr-1" />
                    {t('admin.accessControl.expiringSoon')}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Grant Access */}
      {surveys.length > 0 && viewMode === 'list' && (
        <Card className="bg-gradient-to-r from-green-900/20 to-blue-900/20 border-green-700/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-600/20">
                  <Zap className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-white">{t('admin.accessControl.quickGrant')}</h4>
                  <p className="text-xs text-gray-400">{t('admin.accessControl.quickGrantDescription')}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Select value={quickGrantSurvey} onValueChange={onQuickGrantSurveyChange}>
                  <SelectTrigger className="w-48 bg-gray-700 border-gray-600">
                    <SelectValue placeholder={t('admin.accessControl.selectSurvey')} />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600">
                    {surveys
                      .filter(survey => !user.user_survey_access?.some(access => 
                        access.survey_id === survey.id && access.is_active
                      ))
                      .map((survey) => (
                        <SelectItem key={survey.id} value={survey.id}>
                          {survey.title}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={onQuickGrant}
                  disabled={!quickGrantSurvey}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Zap className="h-4 w-4 mr-1" />
                  {t('admin.accessControl.grant')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Matrix View */}
      {viewMode === 'matrix' && (
        <AccessPermissionMatrix
          user={user}
          surveys={surveys}
          onGrantAccess={handleMatrixGrantAccess}
          onRevokeAccess={onRevokeAccess}
        />
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-gray-100 flex items-center gap-2">
                <List className="h-5 w-5" />
                Access Permissions
              </CardTitle>
              {selectedAccessItems.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedAccessItems([])}
                  className="text-gray-400"
                >
                  Clear Selection
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {/* Survey Access Items */}
              {user.user_survey_access
                ?.filter(access => {
                  const matchesSearch = !accessSearchQuery || 
                    access.surveys.title.toLowerCase().includes(accessSearchQuery.toLowerCase()) ||
                    access.surveys.category.toLowerCase().includes(accessSearchQuery.toLowerCase());
                  
                  const now = new Date();
                  const expiresAt = access.expires_at ? new Date(access.expires_at) : null;
                  const isExpiringSoon = expiresAt && expiresAt <= new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
                  
                  switch (accessFilter) {
                    case 'active': return access.is_active && matchesSearch;
                    case 'expired': return !access.is_active && matchesSearch;
                    case 'expiring-soon': return access.is_active && isExpiringSoon && matchesSearch;
                    default: return matchesSearch;
                  }
                })
                .map((access) => {
                  const isExpired = access.expires_at && new Date(access.expires_at) < new Date();
                  const isExpiringSoon = access.expires_at && 
                    new Date(access.expires_at) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) &&
                    new Date(access.expires_at) > new Date();
                  
                  return (
                    <div 
                      key={`survey-${access.id}`} 
                      className="flex items-center gap-3 p-4 rounded-lg border bg-gray-700/30 border-gray-600/30 hover:bg-gray-700/50 transition-colors"
                    >
                      <div className="flex-shrink-0">
                        <div className="p-2 rounded-lg bg-blue-600/20">
                          <Database className="h-4 w-4 text-blue-400" />
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-medium text-white truncate">
                            {access.surveys.title}
                          </h4>
                          <Badge variant="outline" className={`text-xs ${getAccessTypeColor(access.access_type)}`}>
                            {access.access_type}
                          </Badge>
                          {!access.is_active && (
                            <Badge variant="outline" className="text-xs text-red-400 border-red-600">
                              Revoked
                            </Badge>
                          )}
                          {isExpired && (
                            <Badge variant="outline" className="text-xs text-orange-400 border-orange-600">
                              Expired
                            </Badge>
                          )}
                          {isExpiringSoon && (
                            <Badge variant="outline" className="text-xs text-yellow-400 border-yellow-600">
                              <Clock className="h-3 w-3 mr-1" />
                              Expiring Soon
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-400">
                          <span>Category: {access.surveys.category}</span>
                          <span>Granted: {formatDate(access.granted_at)}</span>
                          {access.expires_at && (
                            <span className={isExpiringSoon ? 'text-yellow-400' : ''}>
                              Expires: {formatDate(access.expires_at)}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        {access.is_active ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-400 hover:text-red-300"
                            onClick={() => onRevokeAccess('survey', access.survey_id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-green-400 hover:text-green-300"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}

              {/* File Access Items */}
              {user.user_survey_file_access
                ?.filter(access => {
                  const matchesSearch = !accessSearchQuery || 
                    access.survey_files.filename.toLowerCase().includes(accessSearchQuery.toLowerCase()) ||
                    access.survey_files.surveys.title.toLowerCase().includes(accessSearchQuery.toLowerCase());
                  
                  const now = new Date();
                  const expiresAt = access.expires_at ? new Date(access.expires_at) : null;
                  const isExpiringSoon = expiresAt && expiresAt <= new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
                  
                  switch (accessFilter) {
                    case 'active': return access.is_active && matchesSearch;
                    case 'expired': return !access.is_active && matchesSearch;
                    case 'expiring-soon': return access.is_active && isExpiringSoon && matchesSearch;
                    default: return matchesSearch;
                  }
                })
                .map((access) => {
                  const isExpired = access.expires_at && new Date(access.expires_at) < new Date();
                  const isExpiringSoon = access.expires_at && 
                    new Date(access.expires_at) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) &&
                    new Date(access.expires_at) > new Date();
                  
                  return (
                    <div 
                      key={`file-${access.id}`} 
                      className="flex items-center gap-3 p-4 rounded-lg border bg-gray-700/30 border-gray-600/30 hover:bg-gray-700/50 transition-colors"
                    >
                      <div className="flex-shrink-0">
                        <div className="p-2 rounded-lg bg-green-600/20">
                          <FileText className="h-4 w-4 text-green-400" />
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-medium text-white truncate">
                            {access.survey_files.filename}
                          </h4>
                          <Badge variant="outline" className={`text-xs ${getAccessTypeColor(access.access_type)}`}>
                            {access.access_type}
                          </Badge>
                          {!access.is_active && (
                            <Badge variant="outline" className="text-xs text-red-400 border-red-600">
                              Revoked
                            </Badge>
                          )}
                          {isExpired && (
                            <Badge variant="outline" className="text-xs text-orange-400 border-orange-600">
                              Expired
                            </Badge>
                          )}
                          {isExpiringSoon && (
                            <Badge variant="outline" className="text-xs text-yellow-400 border-yellow-600">
                              <Clock className="h-3 w-3 mr-1" />
                              Expiring Soon
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-400">
                          <span>From: {access.survey_files.surveys.title}</span>
                          <span>Granted: {formatDate(access.granted_at)}</span>
                          {access.expires_at && (
                            <span className={isExpiringSoon ? 'text-yellow-400' : ''}>
                              Expires: {formatDate(access.expires_at)}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        {access.is_active ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-400 hover:text-red-300"
                            onClick={() => onRevokeAccess('file', access.survey_file_id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-green-400 hover:text-green-300"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}

              {/* Empty State */}
              {(!user.user_survey_access?.length && !user.user_survey_file_access?.length) && (
                <div className="text-center py-12">
                  <div className="mx-auto w-24 h-24 bg-gray-700/30 rounded-full flex items-center justify-center mb-4">
                    <Shield className="h-10 w-10 text-gray-500" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-300 mb-2">No Access Permissions</h3>
                  <p className="text-gray-500 mb-6 max-w-md mx-auto">
                    {user.username} doesn't have access to any surveys or files yet. 
                    Grant access to get them started.
                  </p>
                  <div className="flex justify-center gap-3">
                    <Button
                      onClick={() => onOpenGrantDialog()}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Database className="h-4 w-4 mr-2" />
                      Grant Survey Access
                    </Button>
                    <Button
                      onClick={() => onOpenGrantDialog()}
                      variant="outline"
                      className="border-gray-600"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Grant File Access
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AccessControlManager;