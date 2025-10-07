import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { useSurveys } from '@/contexts/SurveyContext';
import { Survey } from '@/types/survey';
import { authenticatedFetch } from '@/utils/api';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/resources/i18n';
import { MessageCircle, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface SurveyFile {
  id: string;
  filename: string;
  fileSize: number;
  isProcessed: boolean;
  processingStatus: 'completed' | 'processing' | 'failed' | 'not_started';
}

interface PreChatSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChatCreated: (sessionId: string, surveyId: string, selectedFiles: string[]) => void;
  initialSurvey?: Survey | null;
}

export const PreChatSetupModal: React.FC<PreChatSetupModalProps> = ({
  isOpen,
  onClose,
  onChatCreated,
  initialSurvey
}) => {
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);
  const [availableFiles, setAvailableFiles] = useState<SurveyFile[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [isValidatingAccess, setIsValidatingAccess] = useState(false);
  const [isPreloading, setIsPreloading] = useState(false);
  const [accessError, setAccessError] = useState<string | null>(null);
  const [preloadingProgress, setPreloadingProgress] = useState({ current: 0, total: 0 });

  const { surveys } = useSurveys();
  const { user } = useAuth();
  const { t } = useTranslation();

  // Reset state when modal opens/closes
  useEffect(() => {
    console.log('🔍 FRONTEND: Modal open useEffect triggered. isOpen:', isOpen, 'initialSurvey:', initialSurvey);
    if (isOpen) {
      // Pre-select the initial survey if provided
      setSelectedSurvey(initialSurvey || null);
      setAvailableFiles([]);
      setSelectedFiles([]);
      setAccessError(null);
      
      // If we have an initial survey, start loading its files
      if (initialSurvey) {
        console.log('🔍 FRONTEND: Initial survey provided, calling loadSurveyFiles with:', initialSurvey.id);
        loadSurveyFiles(initialSurvey.id);
      }
    }
  }, [isOpen, initialSurvey]);

  // Load files when survey is selected
  useEffect(() => {
    console.log('🔍 FRONTEND: Survey selection useEffect triggered. selectedSurvey:', selectedSurvey);
    if (selectedSurvey?.id) {
      console.log('🔍 FRONTEND: About to call loadSurveyFiles with ID:', selectedSurvey.id);
      loadSurveyFiles(selectedSurvey.id);
    }
  }, [selectedSurvey]);

  const loadSurveyFiles = async (surveyId: string) => {
    console.log('🔍 FRONTEND: loadSurveyFiles called with surveyId:', surveyId);
    setIsLoadingFiles(true);
    setAccessError(null);

    try {
      // Validate access using the implemented endpoint
      setIsValidatingAccess(true);
      
      console.log('🔍 FRONTEND: Making API call to:', `/api/surveys/${surveyId}/access-check`);
      const accessResponse = await authenticatedFetch(`/api/surveys/${surveyId}/access-check`, {
        method: 'GET'
      });

      if (!accessResponse.ok) {
        if (accessResponse.status === 403) {
          setAccessError(t('preChatModal.errors.accessDenied') || 'You do not have access to this survey');
        } else {
          setAccessError(t('preChatModal.errors.accessValidationFailed') || 'Failed to validate survey access');
        }
        setIsValidatingAccess(false);
        setIsLoadingFiles(false);
        return;
      }

      const accessData = await accessResponse.json();
      
      // Use the accessible files from the access check response
      const accessibleFiles = accessData.accessibleFiles || [];
      
      if (accessibleFiles.length === 0) {
        setAccessError(t('preChatModal.errors.noAccessibleFiles') || 'No accessible files found for this survey');
        setIsValidatingAccess(false);
        setIsLoadingFiles(false);
        return;
      }
      
      setIsValidatingAccess(false);

      // Use accessible files from access check (they already include processing status)
      const enhancedFiles = accessibleFiles.map((file: any, index: number) => ({
        id: file.id || file.fileId || `file-${index}`, // Handle both id and fileId from backend, with fallback
        filename: file.filename,
        fileSize: file.file_size || 0,
        isProcessed: file.isProcessed, // This comes from backend file system check
        processingStatus: file.processingStatus || 'not_started'
      }));

      console.log('🔍 PreChatModal: Raw accessibleFiles from backend:', accessibleFiles);
      console.log('🔍 PreChatModal: Enhanced files with processing status:', enhancedFiles);
      console.log('🔍 PreChatModal: Processed files count:', enhancedFiles.filter(f => f.isProcessed).length);
      console.log('🔍 PreChatModal: Total files count:', enhancedFiles.length);
      
      // Debug individual file details
      enhancedFiles.forEach((file, index) => {
        console.log(`🔍 PreChatModal: File ${index + 1}:`, {
          id: file.id,
          filename: file.filename,
          isProcessed: file.isProcessed,
          processingStatus: file.processingStatus
        });
      });

      setAvailableFiles(enhancedFiles);
      
      // Auto-select processed files
      const processedFileIds = enhancedFiles
        .filter(file => file.isProcessed)
        .map(file => file.id);
      setSelectedFiles(processedFileIds);

    } catch (error) {
      console.error('Error loading survey files:', error);
      setAccessError(t('preChatModal.errors.loadingFailed') || 'Failed to load survey files');
    } finally {
      setIsLoadingFiles(false);
      setIsValidatingAccess(false);
    }
  };

  const handleFileToggle = (fileId: string) => {
    setSelectedFiles(prev => 
      prev.includes(fileId) 
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  };

  const handleSelectAll = () => {
    const processedFiles = availableFiles.filter(file => file.isProcessed);
    setSelectedFiles(processedFiles.map(file => file.id));
  };

  const handleSelectNone = () => {
    setSelectedFiles([]);
  };

  const handleCreateChat = async () => {
    if (!selectedSurvey || selectedFiles.length === 0) return;

    setIsPreloading(true);
    setPreloadingProgress({ current: 0, total: 3 });

    try {
      // Step 1: Pre-load selected files using the batch endpoint
      setPreloadingProgress({ current: 1, total: 3 });
      
      const preloadResponse = await authenticatedFetch(`/api/surveys/${selectedSurvey.id}/files/preload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileIds: selectedFiles
        })
      });

      if (!preloadResponse.ok) {
        throw new Error(t('preChatModal.errors.preloadFailed') || 'Failed to preload files');
      }

      const preloadData = await preloadResponse.json();
      
      // Check if all files were successfully preloaded
      const failedFiles = preloadData.results?.filter((result: any) => result.status === 'error') || [];
      if (failedFiles.length > 0) {
        throw new Error((t('preChatModal.errors.someFilesFailedPreload') || 'Some files failed to preload') + `: ${failedFiles.map((f: any) => f.fileId).join(', ')}`);
      }

      // Step 2: Create optimized chat session
      setPreloadingProgress({ current: 2, total: 3 });
      
      const sessionResponse = await authenticatedFetch('/api/chat/sessions/create-optimized', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          surveyId: selectedSurvey.id,
          fileIds: selectedFiles,
          title: `${t('preChatModal.chatTitle') || 'Optimized Chat'}: ${selectedSurvey.title || selectedSurvey.filename}`
        })
      });

      if (!sessionResponse.ok) {
        const errorData = await sessionResponse.json().catch(() => ({}));
        throw new Error(errorData.error || t('preChatModal.errors.sessionCreationFailed') || 'Failed to create chat session');
      }

      const sessionData = await sessionResponse.json();
      setPreloadingProgress({ current: 3, total: 3 });
      
      // Notify parent component with the session ID from the response
      const sessionId = sessionData.session?.id || sessionData.sessionId;
      if (!sessionId) {
        throw new Error(t('preChatModal.errors.invalidSessionResponse') || 'Invalid session response - no session ID received');
      }
      
      onChatCreated(sessionId, selectedSurvey.id, selectedFiles);
      
      // Close modal
      onClose();

    } catch (error) {
      console.error('Error creating chat:', error);
      setAccessError(
        error instanceof Error 
          ? error.message 
          : (t('preChatModal.errors.chatCreationFailed') || 'Failed to create chat session')
      );
    } finally {
      setIsPreloading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'processing':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const processedFiles = availableFiles.filter(file => file.isProcessed);
  const canCreateChat = selectedSurvey && selectedFiles.length > 0 && !isPreloading;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-2xl bg-gray-900 border-gray-700 text-white"
        aria-describedby="prechat-modal-description"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <MessageCircle className="h-5 w-5 text-blue-400" />
            {t('preChatModal.title') || 'Start New Chat'}
          </DialogTitle>
          <div 
            id="prechat-modal-description" 
            className="sr-only"
          >
            Modal to configure a new chat session by selecting a survey and files for analysis
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Survey Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">
              {t('preChatModal.selectSurvey') || 'Select Survey'}
            </label>
            <Select 
              value={selectedSurvey?.id || ""} 
              onValueChange={(surveyId) => {
                console.log('🔍 FRONTEND: Survey dropdown changed. SurveyId:', surveyId);
                const survey = surveys.find(s => s.id === surveyId);
                console.log('🔍 FRONTEND: Found survey object:', survey);
                setSelectedSurvey(survey || null);
              }}
            >
              <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                <SelectValue placeholder={t('preChatModal.chooseSurvey') || "Choose a survey..."} />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600 text-white">
                {surveys.map(survey => (
                  <SelectItem key={survey.id} value={survey.id}>
                    {survey.title || survey.filename || survey.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Access Validation Status */}
          {isValidatingAccess && (
            <div className="flex items-center gap-2 p-3 bg-blue-900/30 border border-blue-600/30 rounded-lg">
              <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
              <span className="text-sm text-blue-300">
                {t('preChatModal.progress.validatingAccess') || 'Validating survey access...'}
              </span>
            </div>
          )}

          {/* Access Error */}
          {accessError && (
            <div className="flex items-center gap-2 p-3 bg-red-900/30 border border-red-600/30 rounded-lg">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <span className="text-sm text-red-300">{accessError}</span>
            </div>
          )}

          {/* File Selection */}
          {selectedSurvey && !accessError && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-300">
                  {t('preChatModal.selectFiles') || 'Select Files'} {selectedFiles.length > 0 && `(${selectedFiles.length} selected)`}
                </label>
                <div className="flex gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleSelectAll}
                    disabled={processedFiles.length === 0}
                    className="text-xs"
                  >
                    {t('preChatModal.allProcessed') || 'All Processed'}
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleSelectNone}
                    className="text-xs"
                  >
                    {t('preChatModal.none') || 'None'}
                  </Button>
                </div>
              </div>

              {isLoadingFiles ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
                  <span className="ml-2 text-sm text-gray-400">
                    {t('preChatModal.progress.loadingFiles') || 'Loading files...'}
                  </span>
                </div>
              ) : (
                <ScrollArea className="h-48 border border-gray-700 rounded-lg p-3">
                  <div className="space-y-2">
                    {availableFiles.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-4">
                        {t('preChatModal.noFiles') || 'No files available for this survey'}
                      </p>
                    ) : (
                      availableFiles.map((file, index) => (
                        <div 
                          key={file.id || `file-${index}`} 
                          className="flex items-center space-x-3 p-2 hover:bg-gray-800/50 rounded"
                        >
                          <Checkbox
                            checked={selectedFiles.includes(file.id)}
                            onCheckedChange={() => handleFileToggle(file.id)}
                            disabled={!file.isProcessed}
                            className="data-[state=checked]:bg-blue-600"
                          />
                          <FileText className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-white truncate">
                                {file.filename}
                              </p>
                              {getStatusIcon(file.processingStatus)}
                            </div>
                            <div className="flex items-center gap-3 mt-1">
                              <p className="text-xs text-gray-400">
                                {formatFileSize(file.fileSize)}
                              </p>
                              <Badge 
                                variant={file.isProcessed ? "default" : "secondary"} 
                                className={`text-xs px-2 py-0 ${
                                  file.isProcessed 
                                    ? 'bg-green-600/20 text-green-300 border-green-600/30' 
                                    : 'bg-gray-600/20 text-gray-400 border-gray-600/30'
                                }`}
                              >
                                {file.processingStatus}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              )}

              {processedFiles.length === 0 && availableFiles.length > 0 && (
                <div className="p-3 bg-orange-900/30 border border-orange-600/30 rounded-lg">
                  <p className="text-sm text-orange-300">
                    {t('preChatModal.noProcessedFiles') || 'No processed files available. Files need to be processed before they can be used in chat.'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Pre-loading Progress */}
          {isPreloading && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
                <span className="text-sm text-blue-300">
                  {t('preChatModal.progress.preloading') || 'Pre-loading files'} ({preloadingProgress.current}/{preloadingProgress.total})...
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${(preloadingProgress.current / preloadingProgress.total) * 100}%` 
                  }}
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-3 border-t border-gray-700">
            <Button 
              variant="ghost" 
              onClick={onClose}
              disabled={isPreloading}
            >
              {t('preChatModal.cancel') || 'Cancel'}
            </Button>
            <Button 
              onClick={handleCreateChat}
              disabled={!canCreateChat}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isPreloading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {t('preChatModal.creatingChat') || 'Creating Chat...'}
                </>
              ) : (
                <>
                  <MessageCircle className="h-4 w-4 mr-2" />
                  {t('preChatModal.startChat') || 'Start Chat'} ({selectedFiles.length} files)
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};