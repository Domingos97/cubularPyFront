import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useSurveys } from '@/contexts/SurveyContext';
import { Survey } from '@/types/survey';
import { authenticatedFetch } from '@/utils/api';
import { useAuth } from '@/hooks/useAuth';
import { usePersonalities } from '@/hooks/usePersonalities';
import { useTranslation } from '@/resources/i18n';
import { MessageCircle, FileText, CheckCircle, AlertCircle, Loader2, Brain } from 'lucide-react';
import { buildApiUrl, API_CONFIG } from '@/config';

interface SurveyFile {
  id: string;
  filename: string;
  fileSize: number;
  isProcessed: boolean;
  processingStatus: 'completed' | 'processing' | 'failed' | 'not_started';
}

interface AIPersonality {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
}

interface PreChatSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChatCreated: (sessionId: string, surveyId: string, selectedFiles: string[]) => void;
  initialSurvey?: Survey | null;
  selectedPersonalityId?: string | null;
}

export const PreChatSetupModal: React.FC<PreChatSetupModalProps> = ({
  isOpen,
  onClose,
  onChatCreated,
  initialSurvey,
  selectedPersonalityId
}) => {
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);
  const [availableFiles, setAvailableFiles] = useState<SurveyFile[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [selectedPersonality, setSelectedPersonality] = useState<string | null>(null);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [isValidatingAccess, setIsValidatingAccess] = useState(false);
  const [isPreloading, setIsPreloading] = useState(false);
  const [accessError, setAccessError] = useState<string | null>(null);
  const [preloadingProgress, setPreloadingProgress] = useState({ current: 0, total: 0 });

  const { surveys } = useSurveys();
  const { user } = useAuth();
  const { t } = useTranslation();
  
  // Use the personalities hook to get the user's preferred personality
  const { 
    personalities: availablePersonalities, 
    selectedPersonality: userPreferredPersonality,
    isLoading: isLoadingPersonalities 
  } = usePersonalities('ai_chat_integration');

  // Use refs to track initialized state and prevent infinite loops
  const initializedRef = useRef(false);
  const lastInitialSurveyIdRef = useRef<string | null>(null);
  const lastSelectedPersonalityIdRef = useRef<string | null>(null);
  const loadedSurveyFilesRef = useRef<string | null>(null); // Track which survey's files we've loaded

  // Reset state when modal opens/closes - use a more defensive approach
  useEffect(() => {
    if (isOpen) {
      const currentSurveyId = initialSurvey?.id || null;
      const currentPersonalityId = selectedPersonalityId || null;
      
      // Only initialize if this is the first time opening OR if we haven't initialized yet
      // Ignore personality changes after initial load to prevent loops
      const shouldInitialize = !initializedRef.current;

      if (shouldInitialize) {
        console.log('🔍 FRONTEND: First-time modal initialization. Survey ID:', currentSurveyId, 'Personality ID:', currentPersonalityId);
        console.log('🔍 FRONTEND: Available surveys:', surveys.map(s => ({ id: s.id, title: s.title })));
        
        // Pre-select the initial survey if provided
        setSelectedSurvey(initialSurvey || null);
        setAvailableFiles([]);
        setSelectedFiles([]);
        setAccessError(null);
        
        // Set initial personality from parent or use user's preferred personality
        if (currentPersonalityId) {
          setSelectedPersonality(currentPersonalityId);
        } else if (userPreferredPersonality) {
          // Use user's preferred personality as default
          setSelectedPersonality(userPreferredPersonality.id);
        }
        
        // Mark as initialized
        initializedRef.current = true;
        lastInitialSurveyIdRef.current = currentSurveyId;
        lastSelectedPersonalityIdRef.current = currentPersonalityId;
        
        // If we have an initial survey, start loading its files
        if (initialSurvey) {
          loadSurveyFiles(initialSurvey.id);
        }
      } else {
        // Modal is already initialized, only handle survey changes (not personality changes)
        if (currentSurveyId !== lastInitialSurveyIdRef.current) {
          console.log('🔍 FRONTEND: Survey changed during modal session:', currentSurveyId);
          setSelectedSurvey(initialSurvey || null);
          lastInitialSurveyIdRef.current = currentSurveyId;
          loadedSurveyFilesRef.current = null; // Reset file loading tracker for new survey
          
          if (initialSurvey) {
            loadSurveyFiles(initialSurvey.id);
          }
        }
        // Ignore personality changes to prevent infinite loops
      }
    } else {
      // Reset when modal closes
      initializedRef.current = false;
      lastInitialSurveyIdRef.current = null;
      lastSelectedPersonalityIdRef.current = null;
      loadedSurveyFilesRef.current = null; // Reset file loading tracker
    }
  }, [isOpen, initialSurvey?.id]); // Remove selectedPersonalityId from dependencies to break the loop

  // Handle initial personality selection separately to avoid loops
  useEffect(() => {
    if (isOpen && initializedRef.current && !selectedPersonality && selectedPersonalityId) {
      console.log('🔍 FRONTEND: Setting initial personality after modal opened:', selectedPersonalityId);
      setSelectedPersonality(selectedPersonalityId);
    }
  }, [isOpen, selectedPersonalityId, selectedPersonality]); // Separate effect for personality

  // Set personality to user's preferred when it becomes available (and no personality is already selected)
  useEffect(() => {
    if (isOpen && !selectedPersonality && userPreferredPersonality && availablePersonalities.length > 0) {
      console.log('🔍 FRONTEND: Setting user preferred personality:', userPreferredPersonality.id);
      setSelectedPersonality(userPreferredPersonality.id);
    }
  }, [isOpen, userPreferredPersonality, availablePersonalities, selectedPersonality]);

  // Load files when survey is selected (only if different from current)
  useEffect(() => {
    console.log('🔍 FRONTEND: Survey selection effect triggered:', {
      surveyId: selectedSurvey?.id,
      lastInitialSurveyId: lastInitialSurveyIdRef.current,
      loadedSurveyFiles: loadedSurveyFilesRef.current,
      shouldLoad: selectedSurvey?.id && 
        selectedSurvey.id !== lastInitialSurveyIdRef.current && 
        selectedSurvey.id !== loadedSurveyFilesRef.current
    });
    
    if (selectedSurvey?.id && 
        selectedSurvey.id !== lastInitialSurveyIdRef.current && 
        selectedSurvey.id !== loadedSurveyFilesRef.current) {
      console.log('🔍 FRONTEND: Loading files for newly selected survey:', selectedSurvey.id);
      loadSurveyFiles(selectedSurvey.id);
    }
  }, [selectedSurvey?.id]); // Only depend on the ID since we have proper guards

  const loadSurveyFiles = useCallback(async (surveyId: string) => {
    console.log('🔍 FRONTEND: loadSurveyFiles called with surveyId:', surveyId, {
      isLoadingFiles,
      loadedSurveyFilesRef: loadedSurveyFilesRef.current,
      shouldEarlyReturn: isLoadingFiles || loadedSurveyFilesRef.current === surveyId
    });
    
    if (isLoadingFiles || loadedSurveyFilesRef.current === surveyId) return; // Prevent concurrent calls and duplicate loads
    
    setIsLoadingFiles(true);
    setAccessError(null);
    loadedSurveyFilesRef.current = surveyId; // Mark this survey as being loaded

    try {
      // Validate access using the implemented endpoint
      setIsValidatingAccess(true);
      
  console.log('🔍 FRONTEND: Making API call to:', buildApiUrl(API_CONFIG.ENDPOINTS.SURVEYS.ACCESS_CHECK(surveyId)));
      const accessResponse = await authenticatedFetch(buildApiUrl(`${API_CONFIG.ENDPOINTS.SURVEYS.BASE}/${surveyId}/access-check`), {
        method: 'GET'
      });

      if (!accessResponse.ok) {
        if (accessResponse.status === 403) {
          setAccessError(t('preChatModal.errors.accessDenied') || 'You do not have access to this survey');
        } else if (accessResponse.status === 404) {
          setAccessError(t('preChatModal.errors.surveyNotFound') || 'This survey no longer exists');
        } else {
          setAccessError(t('preChatModal.errors.accessValidationFailed') || 'Failed to validate survey access');
        }
        setIsValidatingAccess(false);
        setIsLoadingFiles(false);
        return;
      }

      const accessData = await accessResponse.json();
      console.log('🔍 FRONTEND: Access check response data:', accessData);
      
      // Use the accessible files from the access check response
      const accessibleFiles = accessData.accessibleFiles || [];
      console.log('🔍 FRONTEND: Accessible files found:', accessibleFiles.length, accessibleFiles);
      
      setIsValidatingAccess(false);

      // Use accessible files from access check (they already include processing status)
      const enhancedFiles = accessibleFiles.map((file: any, index: number) => ({
        id: file.id || file.fileId || `file-${index}`, // Handle both id and fileId from backend, with fallback
        filename: file.filename,
        fileSize: file.file_size || 0,
        isProcessed: file.isProcessed, // This comes from backend file system check
        processingStatus: file.processingStatus || 'not_started'
      }));

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
      console.log('🔍 FRONTEND: Files set in state, total count:', enhancedFiles.length);
      
      // Auto-select processed files
      const processedFileIds = enhancedFiles
        .filter(file => file.isProcessed)
        .map(file => file.id);
      setSelectedFiles(processedFileIds);

    } catch (error) {
      console.error('🔍 FRONTEND: Error loading survey files:', error);
      console.error('🔍 FRONTEND: Error details:', error instanceof Error ? error.message : String(error));
      setAccessError(t('preChatModal.errors.loadingFailed') || 'Failed to load survey files');
      loadedSurveyFilesRef.current = null; // Reset on error so we can retry
    } finally {
      setIsLoadingFiles(false);
      setIsValidatingAccess(false);
    }
  }, [isLoadingFiles, t]); // Add dependency array for useCallback

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
    if (!selectedSurvey || selectedFiles.length === 0 || !selectedPersonality) return;

    setIsPreloading(true);
    setPreloadingProgress({ current: 0, total: 3 });

    try {
      console.log('🔍 PreChatSetupModal: Creating session with personality:', selectedPersonality);
      
      const sessionResponse = await authenticatedFetch(buildApiUrl(`${API_CONFIG.ENDPOINTS.CHAT.SESSIONS}/create-optimized`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          survey_ids: [selectedSurvey.id], // Use snake_case to match backend
          selected_file_ids: selectedFiles, // Use snake_case to match backend
          title: `New Chat`, // Use placeholder title that will be updated by first message
          personality_id: selectedPersonality, // Use snake_case to match backend
          category: selectedSurvey.category || 'survey-analysis' // Include category
        })
      });

      if (!sessionResponse.ok) {
        const errorData = await sessionResponse.json().catch(() => ({}));
        throw new Error(errorData.error || t('preChatModal.errors.sessionCreationFailed') || 'Failed to create chat session');
      }

      const sessionData = await sessionResponse.json();
      
      // Get session ID from the consistent response format
      const sessionId = sessionData.session?.id;
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
  const canCreateChat = selectedSurvey && selectedFiles.length > 0 && selectedPersonality && !isPreloading;

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

          {/* AI Personality Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
              <Brain className="h-4 w-4" />
              AI Personality
            </label>
            {isLoadingPersonalities ? (
              <div className="flex items-center gap-2 p-3 bg-gray-800 border border-gray-600 rounded-lg">
                <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
                <span className="text-sm text-gray-300">Loading personalities...</span>
              </div>
            ) : (
              <Select 
                value={selectedPersonality || ""} 
                onValueChange={setSelectedPersonality}
              >
                <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                  <SelectValue placeholder="Choose an AI personality..." />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600 text-white">
                  {availablePersonalities.map(personality => (
                    <SelectItem key={personality.id} value={personality.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{personality.name}</span>
                        <span className="text-xs text-gray-400">{personality.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {selectedPersonality && availablePersonalities.length > 0 && (
              <div className="p-2 bg-gray-800/50 border border-gray-600/50 rounded text-xs text-gray-400">
                <strong>Selected:</strong> {availablePersonalities.find(p => p.id === selectedPersonality)?.description}
              </div>
            )}
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
          {selectedSurvey && !(accessError?.includes('não tem acesso') || accessError?.includes('access denied') || accessError?.includes('Access denied') || accessError?.includes('não existe mais') || accessError?.includes('no longer exists')) && (
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
          <div className="flex flex-col gap-3 pt-3 border-t border-gray-700">
            {/* Validation feedback */}
            {!canCreateChat && !isPreloading && (
              <div className="text-xs text-gray-400 text-center">
                {!selectedSurvey && "Please select a survey"}
                {selectedSurvey && selectedFiles.length === 0 && "Please select at least one file"}
                {selectedSurvey && selectedFiles.length > 0 && !selectedPersonality && "Please select an AI personality"}
              </div>
            )}
            
            <div className="flex justify-end gap-3">
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
        </div>
      </DialogContent>
    </Dialog>
  );
};
