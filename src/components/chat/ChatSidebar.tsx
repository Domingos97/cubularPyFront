import { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import { X, Trash2, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useChatSessions } from '@/hooks/useChatSessions';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { PersonalitySelector } from './PersonalitySelector';
import { usePersonalities } from '@/hooks/usePersonalities';
import { useToast } from '@/hooks/use-toast';
import { Survey } from '@/types/survey';
import { useSurveys } from '@/contexts/SurveyContext';
import { useTranslation } from '@/resources/i18n';




interface ChatSidebarProps {
  selectedSurvey: Survey | null;
  onSurveyChange: (survey: Survey | null) => void;
  onNewChat?: (sessionId: string) => void;
  onChatSelect?: (sessionId: string) => void;
  selectedPersonalityId: string | null;
  onPersonalityChange: (personalityId: string) => void;
  selectedFiles?: string[];
}

export function ChatSidebar({ selectedSurvey, onSurveyChange, onNewChat, onChatSelect, selectedPersonalityId, onPersonalityChange, selectedFiles }: ChatSidebarProps) {
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);
  const [menuSessionId, setMenuSessionId] = useState<string | null>(null);
  const { chatSessions, createNewSession, loadSession, deleteSession, updateSessionSurveys, currentSession, isLoading, isLoadingSession, loadChatSessions, clearCurrentSession, currentMessages } = useChatSessions();
  const { surveys } = useSurveys();
  const { t } = useTranslation();
  // Export chat session as PDF
  const handleExportPDF = async (sessionId: string, sessionTitle: string) => {
    // Load messages for the session
    const result = await loadSession(sessionId);
    const messages = result?.messages || [];
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`Chat Session: ${sessionTitle}`, 10, 20);
    let y = 30;
    messages.forEach((msg: any, idx: number) => {
      const sender = msg.sender === 'user' ? 'User' : 'Assistant';
      doc.setFontSize(12);
      doc.text(`${sender}:`, 10, y);
      y += 7;
      doc.setFontSize(11);
      // Split long messages for PDF
      const lines = doc.splitTextToSize(msg.content, 180);
      lines.forEach((line: string) => {
        doc.text(line, 15, y);
        y += 6;
        if (y > 280) {
          doc.addPage();
          y = 20;
        }
      });
      y += 4;
    });
    doc.save(`${sessionTitle.replace(/[^a-zA-Z0-9]/g, '_')}_chat.pdf`);
  };
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { sessionId } = useParams();
  const { getPersonalityById } = usePersonalities();
  const { toast } = useToast();



  // Load chat sessions filtered by selected survey
  useEffect(() => {
    console.log('📊 SESSION LOADING: Effect triggered for survey:', selectedSurvey?.id);
    if (selectedSurvey?.id) {
      console.log('📊 SESSION LOADING: Loading sessions for survey:', selectedSurvey.id);
      loadChatSessions(selectedSurvey.id);
    } else {
      console.log('📊 SESSION LOADING: No survey selected, loading all sessions');
      // Load all sessions if no survey is selected
      loadChatSessions();
    }
  }, [selectedSurvey?.id, loadChatSessions]);

  // Track when sessions state changes
  useEffect(() => {
    console.log('📋 SESSIONS STATE: Changed for survey:', selectedSurvey?.id, {
      sessionsCount: chatSessions.length,
      sessionTitles: chatSessions.map(s => s.title),
      isLoading
    });
  }, [chatSessions, selectedSurvey?.id, isLoading]);

  // Auto-load the last chat when sessions are loaded for the selected survey
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const sessionIdFromUrl = urlParams.get('session');
    
    // Only auto-load if:
    // 1. We have a selected survey
    // 2. We have sessions for that survey 
    // 3. No current session is active
    // 4. No session ID in URL
    // 5. Not currently loading
    if (selectedSurvey?.id && chatSessions.length > 0 && !currentSession && !sessionIdFromUrl && !isLoadingSession) {
      const lastSession = chatSessions[0]; // Most recent session for this survey
      
      if (onChatSelect) {
        onChatSelect(lastSession.id);
      }
      navigate(`/survey-results?session=${lastSession.id}`, { replace: true });
    }
  }, [selectedSurvey?.id, chatSessions, currentSession, isLoadingSession, onChatSelect, navigate, location.search]);

  const handleNewChat = async () => {
    if (selectedSurvey) {
      console.log('🎯 Creating new session with selected files from sidebar:', selectedFiles);
      const result = await createNewSession([selectedSurvey], selectedSurvey.category, selectedPersonalityId, selectedFiles);
      if (result && onNewChat) {
        onNewChat(result.id);
      }
    }
  };

  const handleSurveySelect = async (surveyId: string) => {
    console.log('🔄 SURVEY CHANGE: Starting survey selection for:', surveyId);
    const survey = surveys.find(s => s.id === surveyId);
    if (!survey) {
      console.log('❌ SURVEY CHANGE: Survey not found:', surveyId);
      return;
    }
    
    const isNewSurvey = survey.id !== selectedSurvey?.id;
    console.log('🔄 SURVEY CHANGE: Is new survey?', isNewSurvey, 'Previous:', selectedSurvey?.id);
    
    if (isNewSurvey) {
      console.log('🔄 SURVEY CHANGE: Processing new survey selection...');
      
      // Clear current session first
      clearCurrentSession();
      console.log('🔄 SURVEY CHANGE: Cleared current session');
      
      // Update the survey selection (this will trigger the useEffect to load sessions)
      onSurveyChange(survey);
      console.log('🔄 SURVEY CHANGE: Updated survey selection to:', survey.title || survey.filename);
      
      // Force immediate reload of chat sessions for the new survey
      console.log('🔄 SURVEY CHANGE: Force loading sessions for survey:', surveyId);
      try {
        await loadChatSessions(surveyId);
        console.log('🔄 SURVEY CHANGE: Sessions loading completed');
      } catch (error) {
        console.error('❌ SURVEY CHANGE: Error loading sessions:', error);
      }
      
      // Navigate without session parameter - auto-load will handle it if sessions exist
      navigate('/survey-results', { replace: true });
      console.log('🔄 SURVEY CHANGE: Navigation completed');
    } else {
      console.log('🔄 SURVEY CHANGE: Same survey selected, just updating selection');
      // Same survey selected, just update the selection
      onSurveyChange(survey);
    }
  };

  const handleChatSelect = (sessionId: string) => {
    console.log('ChatSidebar: handleChatSelect called with sessionId:', sessionId);
    console.log('ChatSidebar: isLoadingSession:', isLoadingSession);
    
    // Prevent clicking if already loading a session
    if (isLoadingSession) {
      console.log('ChatSidebar: Skipping click - already loading session');
      return;
    }
    
    console.log('ChatSidebar: Processing chat selection...');
    
    // Use callback if provided
    if (onChatSelect) {
      console.log('ChatSidebar: Calling onChatSelect callback');
      onChatSelect(sessionId);
    } else {
      console.log('ChatSidebar: No onChatSelect callback provided');
    }
    
    // Also navigate to include session ID in URL for proper state management
    console.log('ChatSidebar: Navigating to URL with session parameter');
    navigate(`/survey-results?session=${sessionId}`, { replace: true });
  };

  const handleLogout = async () => {
    await logout();
    navigate('/auth');
  };

  return (
    <div className="w-80 bg-gray-950/80 backdrop-blur-sm border-r border-gray-800 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-white">{t('chatSidebar.title')}</h2>
        </div>
        
        <div className="mb-4">
          <PersonalitySelector
            onPersonalityChange={onPersonalityChange}
            className="w-full"
            value={selectedPersonalityId || ''}
          />
        </div>
      </div>

      {/* Survey Selection */}
      <div className="p-4 border-b border-gray-800">
        <div className="space-y-3">
          <div className="text-xs text-gray-400 uppercase tracking-wide">{t('chatSidebar.selectSurvey')}</div>
          
          <Select value={selectedSurvey?.id || ""} onValueChange={handleSurveySelect}>
            <SelectTrigger className="h-8 text-xs bg-gray-900 border-gray-700 text-white">
              <SelectValue placeholder={t('chatSidebar.chooseSurvey')} />
            </SelectTrigger>
            <SelectContent className="bg-gray-900 border-gray-700 text-white z-50">
              {surveys.map(survey => (
                <SelectItem key={survey.id} value={survey.id} className="text-white hover:bg-gray-800">
                  {survey.title || survey.filename || survey.id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Chat History */}
      <div className="flex-1 p-4">
        <div className="text-xs text-gray-400 uppercase tracking-wide mb-3">
          {t('chatSidebar.chatHistory')}
          {selectedSurvey && (
            <span className="text-blue-400 ml-2">({selectedSurvey.title || selectedSurvey.filename || selectedSurvey.id})</span>
          )}
        </div>
        <ScrollArea className="h-full">
          <div className="space-y-2">
            {isLoading ? (
              <div className="text-xs text-gray-400">{t('chatSidebar.loadingChats')}</div>
            ) : chatSessions.length === 0 ? (
              <div className="text-center py-6">
                <div className="text-xs text-gray-400 mb-3">
                  {selectedSurvey 
                    ? t('chatSidebar.noHistoryForSurvey') 
                    : t('chatSidebar.noHistory')
                  }
                </div>
                {selectedSurvey && (
                  <div className="space-y-2">
                    <div className="text-xs text-gray-500 mb-2">
                      Start analyzing this survey by creating your first chat
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNewChat}
                      className="text-xs h-7 bg-blue-600/10 border-blue-600/30 text-blue-400 hover:bg-blue-600/20 hover:border-blue-500/50"
                    >
                      <MessageCircle className="h-3 w-3 mr-1" />
                      Create New Chat
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              chatSessions.map(session => {
                const sessionPersonality = getPersonalityById(session.personality_id);
                return (
                <div
                  key={session.id}
                  onClick={() => handleChatSelect(session.id)}
                  className={`flex items-start justify-between p-2 rounded-md cursor-pointer hover:bg-gray-800 transition-colors group ${
                    isLoadingSession ? 'opacity-50 pointer-events-none' : ''
                  } ${
                    currentSession?.id === session.id ? 'bg-blue-600/20 border border-blue-500/30' : ''
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-white truncate">
                      {session.title}
                    </div>
                    <div className="text-xs text-gray-400 truncate">
                      {session.category} • {formatDistanceToNow(new Date(session.created_at), { addSuffix: true })}
                    </div>
                    {sessionPersonality && (
                      <Badge variant="secondary" className="text-xs mt-1 bg-blue-500/20 text-blue-400 border-blue-500/30">
                        🤖 {sessionPersonality.name}
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuSessionId(session.id);
                    }}
                    className={`h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-blue-400`}
                    title={t('chatSidebar.openMenu')}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>
                  </Button>
                  {menuSessionId === session.id && (
                    <div className="absolute z-50 right-8 top-2 bg-gray-900 border border-gray-700 rounded shadow-lg p-3 flex flex-col gap-2 min-w-[140px]">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={deletingSessionId === session.id}
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (deletingSessionId) return;
                          const confirmed = window.confirm(
                            t('chatSidebar.deleteConfirmation', { title: session.title })
                          );
                          if (!confirmed) return;
                          setDeletingSessionId(session.id);
                          try {
                            await deleteSession(session.id);
                            toast({
                              title: t('chatSidebar.deleteSuccess'),
                              description: t('chatSidebar.deleteSuccessDescription', { title: session.title }),
                            });
                          } catch (error) {
                            console.error('Failed to delete session:', error);
                            toast({
                              variant: "destructive",
                              title: t('chatSidebar.deleteError'),
                              description: error instanceof Error ? error.message : t('chatSidebar.deleteErrorDescription'),
                            });
                          } finally {
                            setDeletingSessionId(null);
                            setMenuSessionId(null);
                          }
                        }}
                        className="flex items-center gap-2 text-red-400 hover:bg-red-900/30"
                        title={t('chatSidebar.deleteSession')}
                      >
                        <Trash2 className="h-4 w-4" /> {t('chatSidebar.delete')}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async (e) => {
                          e.stopPropagation();
                          await handleExportPDF(session.id, session.title);
                          setMenuSessionId(null);
                        }}
                        className="flex items-center gap-2 text-blue-400 hover:bg-blue-900/30"
                        title={t('chatSidebar.exportPDF')}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 16v-8m0 8l-4-4m4 4l4-4" /><rect x="4" y="4" width="16" height="16" rx="2" /></svg> {t('chatSidebar.exportPDFText')}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setMenuSessionId(null)}
                        className="flex items-center gap-2 text-gray-400 hover:bg-gray-800/30"
                        title={t('chatSidebar.closeMenu')}
                      >
                        <X className="h-4 w-4" /> {t('chatSidebar.close')}
                      </Button>
                    </div>
                  )}
                </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </div>

    </div>
  );
}