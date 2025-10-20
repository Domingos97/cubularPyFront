import { useState, useEffect, useRef } from 'react';
import jsPDF from 'jspdf';
import { X, Trash2, MessageCircle, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
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
  categoryFilter?: string | string[]; // Filter sessions by category
  context?: 'ai_chat_integration' | 'survey_builder' | 'all'; // Context for personality filtering
}

export function ChatSidebar({ selectedSurvey, onSurveyChange, onNewChat, onChatSelect, selectedPersonalityId, onPersonalityChange, selectedFiles, categoryFilter, context = 'all' }: ChatSidebarProps) {
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);
  const [menuSessionId, setMenuSessionId] = useState<string | null>(null);
  // When a new chat is requested, we temporarily suppress auto-loading the
  // most recent session so that the UI shows suggestions instead of
  // immediately loading the last session.
  const preparingNewChatRef = useRef<boolean>(false);
  const { chatSessions, createNewSession, loadSession, deleteSession, updateSessionSurveys, currentSession, isLoading, isLoadingSession, loadChatSessions, clearCurrentSession, clearAllSessions, currentMessages } = useChatSessions();
  
  // Add filtering logic for chat sessions
  const filteredChatSessions = chatSessions.filter(session => {
    // Always exclude survey_builder sessions in survey-results context
    if (session.category === 'survey_builder') {
      return false;
    }
    
    // Apply additional category filter if provided
    if (!categoryFilter) return true; // No additional filter applied
    
    if (Array.isArray(categoryFilter)) {
      return categoryFilter.includes(session.category);
    } else {
      return session.category === categoryFilter;
    }
  });
  const { surveys } = useSurveys();
  const { t } = useTranslation();
  
  // Export chat session as PDF
  const handleExportPDF = async (sessionId: string, sessionTitle: string) => {
    try {
      // Load messages for the session
      const result = await loadSession(sessionId);
      const messages = result?.messages || [];
      const doc = new jsPDF();
      
      // Set up PDF styling
      doc.setFontSize(16);
      doc.text(`Chat Session: ${sessionTitle}`, 10, 20);
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 10, 28);
      
      let y = 40;
      const pageHeight = 280; // Available height per page
      const margin = 10;
      const contentWidth = 190; // Page width minus margins
      
      messages.forEach((msg: any, idx: number) => {
        // Check if we need a new page
        if (y > pageHeight) {
          doc.addPage();
          y = 20;
        }
        
        const sender = msg.sender === 'user' ? 'User' : 'Assistant';
        
        // Message header
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text(`${sender}:`, margin, y);
        y += 8;
        
        // Message content
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        const contentLines = doc.splitTextToSize(msg.content, contentWidth - 10);
        contentLines.forEach((line: string) => {
          if (y > pageHeight) {
            doc.addPage();
            y = 20;
          }
          doc.text(line, margin + 5, y);
          y += 5;
        });
        
        // Add data snapshot if available
        if (msg.data_snapshot && msg.sender === 'assistant') {
          y += 5; // Add some spacing
          
          // Check if we need a new page for the snapshot
          if (y > pageHeight - 40) {
            doc.addPage();
            y = 20;
          }
          
          // Snapshot header
          doc.setFontSize(11);
          doc.setFont(undefined, 'bold');
          doc.text('Data Insights:', margin + 5, y);
          y += 8;
          
          // Handle different snapshot formats
          if (msg.data_snapshot.summary && msg.data_snapshot.insights) {
            // New format - UserFriendlySnapshot
            const snapshot = msg.data_snapshot;
            
            // Summary
            doc.setFontSize(9);
            doc.setFont(undefined, 'normal');
            if (snapshot.summary.searchTerm) {
              doc.text(`Search Term: ${snapshot.summary.searchTerm}`, margin + 10, y);
              y += 6;
            }
            
            // Confidence
            if (snapshot.confidence) {
              doc.text(`Confidence: ${snapshot.confidence.level}`, margin + 10, y);
              y += 6;
              if (snapshot.confidence.explanation) {
                const explanationLines = doc.splitTextToSize(snapshot.confidence.explanation, contentWidth - 20);
                explanationLines.forEach((line: string) => {
                  if (y > pageHeight) {
                    doc.addPage();
                    y = 20;
                  }
                  doc.text(line, margin + 10, y);
                  y += 5;
                });
              }
              y += 3;
            }
            
            // Insights
            if (snapshot.insights && snapshot.insights.length > 0) {
              doc.setFont(undefined, 'bold');
              doc.text('Key Insights:', margin + 10, y);
              y += 6;
              doc.setFont(undefined, 'normal');
              
              snapshot.insights.forEach((insight: any) => {
                if (y > pageHeight) {
                  doc.addPage();
                  y = 20;
                }
                // Remove emojis from insight text to avoid encoding issues
                const cleanIcon = insight.icon ? insight.icon.replace(/[^\x00-\x7F]/g, "•") : '•';
                const insightText = `${cleanIcon} ${insight.title}: ${insight.value}`;
                const insightLines = doc.splitTextToSize(insightText, contentWidth - 20);
                insightLines.forEach((line: string) => {
                  if (y > pageHeight) {
                    doc.addPage();
                    y = 20;
                  }
                  doc.text(line, margin + 15, y);
                  y += 5;
                });
                y += 2;
              });
            }
          } else if (msg.data_snapshot.stats) {
            // Legacy format with stats array
            const stats = msg.data_snapshot.stats;
            doc.setFontSize(9);
            doc.setFont(undefined, 'normal');
            
            stats.forEach((stat: any) => {
              if (y > pageHeight) {
                doc.addPage();
                y = 20;
              }
              
              // Category header
              doc.setFont(undefined, 'bold');
              doc.text(`${stat.icon || '📊'} ${stat.category}:`, margin + 10, y);
              y += 6;
              doc.setFont(undefined, 'normal');
              
              // Category items
              if (stat.items && stat.items.length > 0) {
                stat.items.forEach((item: any) => {
                  if (y > pageHeight) {
                    doc.addPage();
                    y = 20;
                  }
                  const itemText = `• ${item.label}: ${item.percentage}% (${item.count})`;
                  const itemLines = doc.splitTextToSize(itemText, contentWidth - 25);
                  itemLines.forEach((line: string) => {
                    if (y > pageHeight) {
                      doc.addPage();
                      y = 20;
                    }
                    doc.text(line, margin + 15, y);
                    y += 5;
                  });
                });
              }
              y += 3;
            });
          } else {
            // Generic object format
            doc.setFontSize(9);
            doc.setFont(undefined, 'normal');
            Object.entries(msg.data_snapshot).forEach(([key, value]: [string, any]) => {
              if (y > pageHeight) {
                doc.addPage();
                y = 20;
              }
              const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
              const snapshotText = `${formattedKey}: ${typeof value === 'object' ? JSON.stringify(value, null, 2) : value}`;
              const snapshotLines = doc.splitTextToSize(snapshotText, contentWidth - 20);
              snapshotLines.forEach((line: string) => {
                if (y > pageHeight) {
                  doc.addPage();
                  y = 20;
                }
                doc.text(line, margin + 10, y);
                y += 5;
              });
              y += 2;
            });
          }
        }
        
        // Add confidence info if available (and not already included in snapshot)
        if (msg.confidence && msg.sender === 'assistant' && (!msg.data_snapshot || !msg.data_snapshot.confidence)) {
          y += 3;
          if (y > pageHeight) {
            doc.addPage();
            y = 20;
          }
          
          doc.setFontSize(9);
          doc.setFont(undefined, 'italic');
          let confidenceText = `Confidence: ${msg.confidence.score ? Math.round(msg.confidence.score * 100) + '%' : 'N/A'}`;
          if (msg.confidence.reliability) {
            confidenceText += ` (${msg.confidence.reliability})`;
          }
          doc.text(confidenceText, margin + 5, y);
          y += 6;
        }
        
        y += 8; // Add spacing between messages
      });
      
      // Save the PDF
      doc.save(`${sessionTitle.replace(/[^a-zA-Z0-9]/g, '_')}_chat_with_insights.pdf`);
      
      // Show success message
      toast({
        title: t('chatSidebar.exportComplete'),
        description: t('chatSidebar.exportCompleteDesc'),
      });
      
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast({
        variant: "destructive",
        title: t('chatSidebar.exportFailed'),
        description: t('chatSidebar.exportFailedDesc'),
      });
    }
  };
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { sessionId } = useParams();
  const { getPersonalityById } = usePersonalities();
  const { toast } = useToast();



  // Load chat sessions filtered by selected survey
  useEffect(() => {
    console.log('🔍 ChatSidebar: useEffect triggered, selectedSurvey:', selectedSurvey?.id, 'loadChatSessions available:', !!loadChatSessions);
    
    if (!loadChatSessions || !clearAllSessions) {
      console.warn('🔍 ChatSidebar: Functions not available yet, skipping');
      return;
    }
    
    if (selectedSurvey?.id) {
      console.log('🔍 ChatSidebar: Loading sessions for survey:', selectedSurvey.id);
      loadChatSessions(selectedSurvey.id).catch(error => {
        console.error('🔍 ChatSidebar: Error loading sessions:', error);
      });
    } else {
      // Clear sessions when no survey is selected
      console.log('🔍 ChatSidebar: No survey selected, clearing sessions');
      clearAllSessions();
    }
  }, [selectedSurvey?.id]); // Removed function dependencies to prevent infinite loops

  // Track when sessions state changes
  useEffect(() => {
  }, [chatSessions, selectedSurvey?.id, isLoading]);

  // Auto-load the last chat when sessions are loaded for the selected survey
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const sessionIdFromUrl = urlParams.get('session');
    
    // Only auto-load if:
    // 1. We have a selected survey
    // 2. We have filtered sessions for that survey 
    // 3. No current session is active
    // 4. No session ID in URL
    // 5. Not currently loading
    // Do not auto-load if a new chat is being prepared (user clicked New Chat)
    if (selectedSurvey?.id && filteredChatSessions.length > 0 && !currentSession && !sessionIdFromUrl && !isLoadingSession && !preparingNewChatRef.current) {
      const lastSession = filteredChatSessions[0]; // Most recent filtered session for this survey
      
      if (onChatSelect) {
        onChatSelect(lastSession.id);
      }
      navigate(`/?session=${lastSession.id}`, { replace: true });
    }
  }, [selectedSurvey?.id, filteredChatSessions, currentSession, isLoadingSession, onChatSelect, navigate, location.search]);

  // Listen for startNewChat events and temporarily prevent auto-loading
  useEffect(() => {
    const handler = () => {
      preparingNewChatRef.current = true;
      // Reset after a short period to allow normal auto-load again
      setTimeout(() => { preparingNewChatRef.current = false; }, 1500);
    };
    window.addEventListener('startNewChat', handler as EventListener);
    return () => window.removeEventListener('startNewChat', handler as EventListener);
  }, []);

  const handleNewChat = async () => {
    // Instead of creating a session immediately, dispatch an event so the chat UI
    // prepares a new session and the server-side session will be created when the user
    // sends the first message (or clicks a suggestion).
    console.log('🔍 ChatSidebar: Requesting new chat UI (session will be created on first message)');
    // Set a short-lived global flag so freshly-mounted components (or those that
    // missed the startNewChat event) can still detect a pending new-chat flow
    // and avoid auto-loading the last session. This helps avoid race conditions
    // when navigating between views.
    try { (window as any).__cubular_pendingNewChat = true; } catch (e) { /* ignore */ }
    window.dispatchEvent(new CustomEvent('startNewChat'));
    // Clear the sidebar's current session state so the active session is closed immediately
    try {
      clearCurrentSession();
      // Also remove any session query param from the URL so other components don't auto-load it
      const newUrl = new URL(window.location.href);
      if (newUrl.searchParams.get('session')) {
        newUrl.searchParams.delete('session');
        navigate(newUrl.pathname + newUrl.search, { replace: true });
      }
    } catch (err) {
      console.warn('ChatSidebar: Failed to clear current session during New Chat flow', err);
    }

    if (onNewChat) {
      // Notify parent that a new chat flow was requested
      onNewChat('pending');
    }
    // Ensure the global pending flag is cleared after a short timeout in case
    // nobody else clears it (safety net). Real clearing will happen when a
    // session is created or sessionCleared is dispatched.
    setTimeout(() => { try { if ((window as any).__cubular_pendingNewChat) (window as any).__cubular_pendingNewChat = false; } catch(e){} }, 5000);
  };

  const handleSurveySelect = async (surveyId: string) => {
    // Handle deselecting survey ("none" value)
    if (surveyId === "none") {
      clearCurrentSession();
      onSurveyChange(null);
      clearAllSessions();
      // Navigate without session parameter to reset URL
      navigate('/', { replace: true });
      return;
    }

    // Handle add new data stream action
    if (surveyId === "add_new") {
      // Don't change the selected survey; navigate to settings > notifications (contact page)
      navigate('/Contact');
      return;
    }

    const survey = surveys.find(s => s.id === surveyId);
    if (!survey) {
      return;
    }
    
    const isNewSurvey = survey.id !== selectedSurvey?.id;
    
    if (isNewSurvey) {
      
      // Clear current session first
      clearCurrentSession();
      
      // Update the survey selection (this will trigger the useEffect to load sessions)
      onSurveyChange(survey);
      
      // Force immediate reload of chat sessions for the new survey to ensure it's loaded
      loadChatSessions(surveyId);
      
      // Navigate without session parameter - auto-load will handle it if sessions exist
      navigate('/', { replace: true });
    } else {
      // Same survey selected, just update the selection
      onSurveyChange(survey);
    }
  };

  const handleChatSelect = (sessionId: string) => {
    
    // Prevent clicking if already loading a session
    if (isLoadingSession) {
      return;
    }
    
    
    // Use callback if provided
    if (onChatSelect) {
      onChatSelect(sessionId);
    } else {
    }
    
    // Also navigate to include session ID in URL for proper state management
    navigate(`/?session=${sessionId}`, { replace: true });
  };

  const handleLogout = async () => {
    await logout();
    navigate('/auth');
  };

  return (
  <div className="w-80 bg-gray-950/80 backdrop-blur-sm border-r border-gray-800 flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-white">{t('chatSidebar.title')}</h2>
        </div>
        
        <div className="mb-4">
          {user?.has_ai_personalities_access ? (
            <PersonalitySelector
              onPersonalityChange={onPersonalityChange}
              className="w-full"
              value={selectedPersonalityId || ''}
              context={context}
            />
          ) : null}
        </div>
      </div>

      {/* Survey Selection */}
      <div className="p-4 border-b border-gray-800">
        <div className="space-y-3">
          <div className="text-xs text-gray-400 uppercase tracking-wide">{t('chatSidebar.selectSurvey')}</div>
          
          <Select value={selectedSurvey?.id || "none"} onValueChange={handleSurveySelect}>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <SelectTrigger className="h-8 text-xs bg-gray-900 border-gray-700 text-white">
                    <SelectValue placeholder={t('chatSidebar.chooseSurvey')} />
                  </SelectTrigger>
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-xs">
                  <div className="text-left text-xs text-gray-100">
                    {t('chatSidebar.dropdownTooltip.text')}{' '}
                    <button
                      className="text-blue-400 underline ml-1"
                      onClick={(e) => { e.stopPropagation(); navigate('/about'); }}
                    >
                      {t('chatSidebar.dropdownTooltip.readMore')}
                    </button>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <SelectContent className="bg-gray-900 border-gray-700 text-white z-50">
              <SelectItem value="none" className="text-gray-400 hover:bg-gray-800">
                {t('chatSidebar.noSurveySelected') || 'No survey selected'}
              </SelectItem>
              {surveys.map(survey => (
                <SelectItem key={survey.id} value={survey.id} className="text-white hover:bg-gray-800">
                  {survey.title || survey.filename || survey.id}
                </SelectItem>
              ))}
              <SelectItem value="add_new" className="text-blue-400 hover:bg-gray-800 font-medium">
                + Add new Data Stream
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Chat History */}
  <div className="flex-1 p-4 flex flex-col min-h-0">
        <div className="text-xs text-gray-400 uppercase tracking-wide mb-3">
          {t('chatSidebar.chatHistory')}
          {selectedSurvey && (
            <span className="text-blue-400 ml-2">({selectedSurvey.title || selectedSurvey.filename || selectedSurvey.id})</span>
          )}
        </div>
        <ScrollArea className="flex-1 min-h-0 relative z-0">
          <div className="space-y-2 pb-16">
            {isLoading ? (
              <div className="text-xs text-gray-400">{t('chatSidebar.loadingChats')}</div>
            ) : filteredChatSessions.length === 0 ? (
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
              filteredChatSessions.map(session => {
                const sessionPersonality = getPersonalityById(session.personality_id);
                return (
                <div
                  key={session.id}
                  onClick={() => handleChatSelect(session.id)}
                  className={`relative flex items-center justify-between py-1.5 px-2 rounded-md cursor-pointer hover:bg-gray-800 transition-colors group ${
                    isLoadingSession ? 'opacity-50 pointer-events-none' : ''
                  } ${
                    currentSession?.id === session.id ? 'bg-blue-600/20 border border-blue-500/30' : ''
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate leading-5">
                      {session.title}
                    </div>
                    <div className="text-xs text-gray-400 truncate leading-4">
                      {/* Show the first survey title associated with the session (if available) */}
                      {(() => {
                        const surveyId = session.survey_ids && session.survey_ids.length > 0 ? session.survey_ids[0] : null;
                        const survey = surveyId ? surveys.find(s => s.id === surveyId) : null;
                        return survey ? (survey.title || survey.filename || survey.id) : 'Unknown Survey';
                      })()}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuSessionId(session.id);
                    }}
                    className={`h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-blue-400 ml-2`}
                    title={t('chatSidebar.openMenu')}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>
                  </Button>
                  {menuSessionId === session.id && (
                    <div className="absolute z-40 right-2 top-2 bg-gray-900 border border-gray-700 rounded shadow-lg p-3 flex flex-col gap-2 min-w-[140px]">
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
                            
                            // If deleting the current session, clear URL parameters to prevent infinite loading
                            if (currentSession?.id === session.id) {
                              const newUrl = new URL(window.location.href);
                              newUrl.searchParams.delete('session');
                              navigate(newUrl.pathname + newUrl.search, { replace: true });
                            }
                            
                            // Reload sessions after deletion
                            if (selectedSurvey?.id) {
                              loadChatSessions(selectedSurvey.id);
                            } else {
                              clearAllSessions();
                            }
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

      {/* Footer - anchored to bottom */}
      <div className="sticky bottom-0 z-50 bg-gray-950 p-4 border-t border-gray-800">
        <div className="flex flex-col items-stretch gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/contact')}
            className="w-full flex items-center justify-center gap-2 text-gray-200 hover:bg-gray-800"
          >
            <MessageCircle className="h-4 w-4" />
            <span className="text-xs">{t('navigation.contactUs')}</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 text-red-400 hover:bg-red-900/20"
          >
            <LogOut className="h-4 w-4" />
            <span className="text-xs">{t('navigation.logout')}</span>
          </Button>
        </div>
      </div>

    </div>
  );
}
