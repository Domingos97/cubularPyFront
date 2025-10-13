import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/resources/i18n';
import { 
  Database, 
  FileText, 
  ChevronDown, 
  ChevronRight, 
  Check, 
  X, 
  Minus,
  Eye,
  Edit,
  Shield
} from 'lucide-react';
import AccessExpirationDialog from './AccessExpirationDialog';

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

interface AccessPermissionMatrixProps {
  user: User;
  surveys: Survey[];
  onGrantAccess: (type: 'survey' | 'file', itemId: string, accessType: 'read' | 'write' | 'admin', expiresAt?: string | null) => Promise<void>;
  onRevokeAccess: (type: 'survey' | 'file', itemId: string) => Promise<void>;
}

type AccessType = 'read' | 'write' | 'admin';

const AccessPermissionMatrix: React.FC<AccessPermissionMatrixProps> = ({
  user,
  surveys = [],
  onGrantAccess,
  onRevokeAccess
}) => {
  const { t } = useTranslation();
  const [expandedSurveys, setExpandedSurveys] = useState<string[]>([]);
  const [processingCells, setProcessingCells] = useState<string[]>([]);
  
  // Expiration dialog state
  const [isExpirationDialogOpen, setIsExpirationDialogOpen] = useState(false);
  const [pendingGrantData, setPendingGrantData] = useState<{
    type: 'survey' | 'file';
    itemId: string;
    accessType: AccessType;
    itemName: string;
  } | null>(null);

  const toggleSurveyExpansion = (surveyId: string) => {
    setExpandedSurveys(prev => 
      prev.includes(surveyId) 
        ? prev.filter(id => id !== surveyId)
        : [...prev, surveyId]
    );
  };

  const getSurveyAccess = (surveyId: string): SurveyAccess | null => {
    return user.user_survey_access?.find(access => 
      access.survey_id === surveyId && access.is_active
    ) || null;
  };

  const getFileAccess = (fileId: string): FileAccess | null => {
    return user.user_survey_file_access?.find(access => 
      access.survey_file_id === fileId && access.is_active
    ) || null;
  };

  const handleCellClick = async (
    type: 'survey' | 'file', 
    itemId: string, 
    accessType: AccessType
  ) => {
    const cellId = `${type}-${itemId}-${accessType}`;
    
    if (processingCells.includes(cellId)) return;
    
    const currentAccess = type === 'survey' 
      ? getSurveyAccess(itemId)
      : getFileAccess(itemId);

    if (currentAccess && currentAccess.access_type === accessType) {
      // Revoke if same access type is clicked
      setProcessingCells(prev => [...prev, cellId]);
      try {
        await onRevokeAccess(type, itemId);
      } finally {
        setProcessingCells(prev => prev.filter(id => id !== cellId));
      }
    } else {
      // Show expiration dialog for granting access
      const itemName = getItemName(type, itemId);
      setPendingGrantData({ type, itemId, accessType, itemName });
      setIsExpirationDialogOpen(true);
    }
  };

  const handleExpirationConfirm = async (expiresAt: string | null) => {
    if (!pendingGrantData) return;
    
    const { type, itemId, accessType } = pendingGrantData;
    const cellId = `${type}-${itemId}-${accessType}`;
    
    setProcessingCells(prev => [...prev, cellId]);
    
    try {
      await onGrantAccess(type, itemId, accessType, expiresAt);
    } finally {
      setProcessingCells(prev => prev.filter(id => id !== cellId));
      setPendingGrantData(null);
    }
  };

  const getItemName = (type: 'survey' | 'file', itemId: string): string => {
    if (type === 'survey') {
      const survey = surveys?.find(s => s.id === itemId);
      return survey?.title || 'Unknown Survey';
    } else {
      if (!surveys || !Array.isArray(surveys)) return 'Unknown File';
      for (const survey of surveys) {
        const file = survey.survey_files?.find(f => f.id === itemId);
        if (file) {
          return file.filename;
        }
      }
      return 'Unknown File';
    }
  };

  const getCellState = (
    type: 'survey' | 'file', 
    itemId: string, 
    accessType: AccessType
  ): 'granted' | 'partial' | 'none' => {
    const access = type === 'survey' ? getSurveyAccess(itemId) : getFileAccess(itemId);
    
    if (!access) return 'none';
    
    if (access.access_type === accessType) return 'granted';
    
    // Check for higher permissions (admin > write > read)
    const accessLevels: AccessType[] = ['read', 'write', 'admin'];
    const currentLevel = accessLevels.indexOf(access.access_type);
    const requestedLevel = accessLevels.indexOf(accessType);
    
    return currentLevel > requestedLevel ? 'partial' : 'none';
  };

  const getCellIcon = (state: 'granted' | 'partial' | 'none') => {
    switch (state) {
      case 'granted': return <Check className="h-4 w-4" />;
      case 'partial': return <Minus className="h-4 w-4" />;
      default: return <X className="h-4 w-4" />;
    }
  };

  const getCellStyles = (
    type: 'survey' | 'file', 
    itemId: string, 
    accessType: AccessType
  ) => {
    const state = getCellState(type, itemId, accessType);
    const cellId = `${type}-${itemId}-${accessType}`;
    const isProcessing = processingCells.includes(cellId);
    
    const baseStyles = "relative flex items-center justify-center h-10 w-16 rounded-md border cursor-pointer transition-all duration-200 hover:scale-105";
    
    if (isProcessing) {
      return `${baseStyles} bg-gray-600/50 border-gray-500 animate-pulse`;
    }
    
    switch (state) {
      case 'granted':
        return `${baseStyles} bg-green-600/80 border-green-500 text-green-100 hover:bg-green-600`;
      case 'partial':
        return `${baseStyles} bg-blue-600/60 border-blue-500 text-blue-100 hover:bg-blue-600/80`;
      default:
        return `${baseStyles} bg-gray-700/50 border-gray-600 text-gray-400 hover:bg-gray-600/50`;
    }
  };

  const getAccessTypeIcon = (accessType: AccessType) => {
    switch (accessType) {
      case 'read': return <Eye className="h-4 w-4" />;
      case 'write': return <Edit className="h-4 w-4" />;
      case 'admin': return <Shield className="h-4 w-4" />;
    }
  };

  return (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardHeader>
        <CardTitle className="text-gray-100 flex items-center gap-2">
          <div className="grid grid-cols-3 gap-1 p-1 rounded-lg bg-gray-700/50">
            <div className="h-2 w-2 bg-red-500 rounded-full"></div>
            <div className="h-2 w-2 bg-yellow-500 rounded-full"></div>
            <div className="h-2 w-2 bg-green-500 rounded-full"></div>
          </div>
          {t('admin.matrix.title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Matrix Header */}
          <div className="flex items-center gap-4 mb-4">
            <div className="w-80 flex-shrink-0"></div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 bg-gray-700/30 p-2 rounded-lg">
                {getAccessTypeIcon('read')}
                <span className="text-xs font-medium text-gray-300">{t('admin.matrix.read')}</span>
              </div>
              <div className="flex items-center gap-2 bg-gray-700/30 p-2 rounded-lg">
                {getAccessTypeIcon('write')}
                <span className="text-xs font-medium text-gray-300">{t('admin.matrix.write')}</span>
              </div>
              <div className="flex items-center gap-2 bg-gray-700/30 p-2 rounded-lg">
                {getAccessTypeIcon('admin')}
                <span className="text-xs font-medium text-gray-300">{t('admin.matrix.admin')}</span>
              </div>
            </div>
          </div>

          {/* Matrix Rows */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {surveys && Array.isArray(surveys) ? surveys.map((survey) => (
              <div key={survey.id} className="space-y-1">
                {/* Survey Row */}
                <div className="flex items-center gap-4 p-2 bg-gray-700/20 rounded-lg">
                  <div className="w-80 flex-shrink-0 flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleSurveyExpansion(survey.id)}
                      className="h-6 w-6 p-0 text-gray-400 hover:text-gray-200"
                    >
                      {survey.survey_files && Array.isArray(survey.survey_files) && survey.survey_files.length > 0 && (
                        expandedSurveys.includes(survey.id) ? 
                        <ChevronDown className="h-4 w-4" /> : 
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                    <div className="p-1.5 rounded-md bg-blue-600/20">
                      <Database className="h-4 w-4 text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-white truncate">
                        {survey.title}
                      </h4>
                      <p className="text-xs text-gray-400">{survey.category}</p>
                    </div>
                  </div>
                  
                  {/* Permission Cells */}
                  <div className="flex items-center gap-2">
                    {(['read', 'write', 'admin'] as AccessType[]).map((accessType) => (
                      <button
                        key={accessType}
                        onClick={() => handleCellClick('survey', survey.id, accessType)}
                        className={getCellStyles('survey', survey.id, accessType)}
                        disabled={processingCells.includes(`survey-${survey.id}-${accessType}`)}
                      >
                        {processingCells.includes(`survey-${survey.id}-${accessType}`) ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-400 border-t-transparent"></div>
                        ) : (
                          getCellIcon(getCellState('survey', survey.id, accessType))
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* File Rows (when expanded) */}
                {expandedSurveys.includes(survey.id) && survey.survey_files && Array.isArray(survey.survey_files) && survey.survey_files.map((file) => (
                  <div key={file.id} className="flex items-center gap-4 p-2 pl-12 bg-gray-700/10 rounded-lg ml-4">
                    <div className="w-72 flex-shrink-0 flex items-center gap-2">
                      <div className="p-1.5 rounded-md bg-green-600/20">
                        <FileText className="h-3 w-3 text-green-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h5 className="text-sm text-gray-200 truncate">
                          {file.filename}
                        </h5>
                      </div>
                    </div>
                    
                    {/* Permission Cells */}
                    <div className="flex items-center gap-2">
                      {(['read', 'write', 'admin'] as AccessType[]).map((accessType) => (
                        <button
                          key={accessType}
                          onClick={() => handleCellClick('file', file.id, accessType)}
                          className={getCellStyles('file', file.id, accessType)}
                          disabled={processingCells.includes(`file-${file.id}-${accessType}`)}
                        >
                          {processingCells.includes(`file-${file.id}-${accessType}`) ? (
                            <div className="h-3 w-3 animate-spin rounded-full border-2 border-gray-400 border-t-transparent"></div>
                          ) : (
                            getCellIcon(getCellState('file', file.id, accessType))
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )) : (
              <div className="text-center py-8 text-gray-400">
                No surveys available
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="mt-4 p-3 bg-gray-700/20 rounded-lg">
            <h4 className="text-sm font-medium text-gray-300 mb-2">{t('admin.matrix.legend')}</h4>
            <div className="flex items-center gap-6 text-xs">
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 bg-green-600/80 border border-green-500 rounded flex items-center justify-center">
                  <Check className="h-3 w-3 text-green-100" />
                </div>
                <span className="text-gray-400">{t('admin.matrix.accessGranted')}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 bg-blue-600/60 border border-blue-500 rounded flex items-center justify-center">
                  <Minus className="h-3 w-3 text-blue-100" />
                </div>
                <span className="text-gray-400">{t('admin.matrix.higherPermissionGranted')}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 bg-gray-700/50 border border-gray-600 rounded flex items-center justify-center">
                  <X className="h-3 w-3 text-gray-400" />
                </div>
                <span className="text-gray-400">{t('admin.matrix.noAccess')}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      
      {/* Access Expiration Dialog */}
      <AccessExpirationDialog
        isOpen={isExpirationDialogOpen}
        onClose={() => {
          setIsExpirationDialogOpen(false);
          setPendingGrantData(null);
        }}
        onConfirm={handleExpirationConfirm}
        type={pendingGrantData?.type || 'survey'}
        itemName={pendingGrantData?.itemName || ''}
        accessType={pendingGrantData?.accessType || 'read'}
      />
    </Card>
  );
};

export default AccessPermissionMatrix;
