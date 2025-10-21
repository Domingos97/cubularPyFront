import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThinkingCube } from "@/components/ui/ThinkingCube";
import { authenticatedFetch } from "@/utils/api";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { useChatSessions } from "@/hooks/useChatSessions";
import { getSnapshot as getChatStoreSnapshot } from '@/hooks/chatSessionsStore';
import { useAuth } from "@/hooks/useAuth";
import { Send, X, BarChart3, MessageCircle, RefreshCw, Copy } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from "@/hooks/use-mobile";
// Panel mode removed - snapshots are always shown inline
import { InlineDataSnapshot } from "@/components/chat/InlineDataSnapshot";
import { Survey } from "@/types/survey";
import { FileSelectionComponent } from "./FileSelectionComponent";
import { useTranslation } from "@/resources/i18n";
import { buildApiUrl, API_CONFIG } from '@/config';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  dataSnapshot?: any;
  confidence?: {
    score: number;
    reliability: 'low' | 'medium' | 'high';
  };
}

interface ChatComponentProps {
  selectedSurvey: Survey | null;
  selectedPersonalityId: string | null;
  onSurveyChange: (survey: Survey) => void;
  onPersonalityChange?: (personalityId: string) => void;
  onOpenNewChatModal?: () => void;
}

export const ChatComponent: React.FC<ChatComponentProps> = ({
  selectedSurvey,
  selectedPersonalityId,
  onSurveyChange,
  onPersonalityChange,
  onOpenNewChatModal
}) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  // Messages are derived from the single source-of-truth in the chat sessions store
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [clickedSuggestion, setClickedSuggestion] = useState<string | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [pendingNewChat, setPendingNewChat] = useState(false);
  // Always show data inline (no side panel)
  const [showDataInline, setShowDataInline] = useState<boolean>(true);

  // Use ref to track personality updates and prevent loops
  const lastSessionPersonalityRef = useRef<string | null>(null);
  // Use ref to track failed survey loads and prevent infinite retry loops
  const failedSurveyLoadsRef = useRef<Set<string>>(new Set());
  // Use ref to indicate we're preparing a new chat so sessionCleared doesn't
  // accidentally hide the suggestions immediately after startNewChat.
  const preparingNewChatRef = useRef<boolean>(false);

  const isMobile = useIsMobile();
  const { t } = useTranslation();
  const { chatSessions, currentSession, currentMessages, setCurrentMessages, saveMessage, loadSession, createNewSession, isLoadingSession, loadChatSessions, clearCurrentSession, clearAllSessions } = useChatSessions();

  // Map store messages into the UI-friendly Message shape and parse snapshots/confidence
  const mappedMessages: Message[] = useMemo(() => {
    if (!currentMessages || currentMessages.length === 0) return [];
    return currentMessages.map((msg, index) => {
      // Parse data_snapshot - handle both string and object formats
      let parsedDataSnapshot = null;
      if ((msg as any).data_snapshot) {
        if (typeof (msg as any).data_snapshot === 'string') {
          const snapshotStr = (msg as any).data_snapshot as string;
          const trimmedSnapshot = snapshotStr.trim();
          if (trimmedSnapshot) {
            try {
              parsedDataSnapshot = JSON.parse(trimmedSnapshot);
            } catch (e) {
              console.warn(`Failed to parse data_snapshot string for message ${index}:`, e);
            }
          }
        } else if (typeof (msg as any).data_snapshot === 'object') {
          parsedDataSnapshot = (msg as any).data_snapshot;
        }
      }

      // Parse confidence - handle both string, number, and object formats
      let parsedConfidence = null;
      if ((msg as any).confidence !== null && (msg as any).confidence !== undefined) {
        if (typeof (msg as any).confidence === 'string') {
          const confidenceStr = (msg as any).confidence as string;
          const trimmedConfidence = confidenceStr.trim();
          if (trimmedConfidence) {
            try {
              parsedConfidence = JSON.parse(trimmedConfidence);
            } catch (e) {
              console.warn(`Failed to parse confidence string for message ${index}:`, e);
            }
          }
        } else if (typeof (msg as any).confidence === 'number') {
          parsedConfidence = {
            score: (msg as any).confidence,
            reliability: (msg as any).confidence > 0.8 ? 'high' : (msg as any).confidence > 0.5 ? 'medium' : 'low'
          } as const;
        } else if (typeof (msg as any).confidence === 'object') {
          parsedConfidence = (msg as any).confidence;
        }
      }

      return {
        id: msg.id,
        content: (msg as any).content,
        sender: (msg as any).sender as 'user' | 'assistant',
        timestamp: new Date((msg as any).timestamp || Date.now()),
        dataSnapshot: parsedDataSnapshot,
        confidence: parsedConfidence
      };
    });
  }, [currentMessages]);

  // Debug current user
  const { user } = useAuth();
  const { toast } = useToast();

  // Stable handler for closing the message details panel to avoid passing inline functions
  const handleCloseMessagePanel = React.useCallback(() => setSelectedMessage(null), []);

  // Load suggestions when component mounts or survey changes
  useEffect(() => {
    if (selectedSurvey?.id) {
      loadSuggestions(selectedSurvey.id);
    }
  }, [selectedSurvey?.id, selectedPersonalityId]);

  // Listen for global startNewChat event: clear current session and preload accessible files
  useEffect(() => {
    const handleStartNewChat = async (ev?: Event) => {
      console.log('ChatComponent: startNewChat event received - preparing new chat');
      try { (window as any).__cubular_pendingNewChat = true; } catch (e) { /* ignore */ }
      // If the event includes a surveyId in detail, proactively load suggestions
      try {
        const anyEv = ev as any;
        const detailSurveyId = anyEv?.detail?.surveyId;
        if (detailSurveyId) {
          // Load suggestions for the provided survey id immediately
          loadSuggestions(detailSurveyId).catch(err => console.warn('ChatComponent: failed to load suggestions from event detail', err));
        }
      } catch (e) {
        // ignore
      }
      // Mark that we're preparing a new chat so sessionCleared handler knows
      // this clear is intentional and shouldn't cancel the pending new-chat UI.
      preparingNewChatRef.current = true;
      // Defer clearing store state to avoid nested synchronous updates that can cause
      // React's "Maximum update depth exceeded" when subscribers also trigger store writes.
      setTimeout(() => {
        clearCurrentSession();
        // Reset the preparing flag shortly after clearing; sessionCleared will
        // be dispatched by the store and the handler below will consult the flag.
        setTimeout(() => { preparingNewChatRef.current = false; }, 500);
      }, 0);
      setSelectedMessage(null);
      setSelectedFiles([]);
      setPendingNewChat(true);

      // Preload accessible processed files for the selected survey (if any)
      if (selectedSurvey?.id) {
        try {
          const res = await authenticatedFetch(buildApiUrl(API_CONFIG.ENDPOINTS.SURVEYS.ACCESS_CHECK(selectedSurvey.id)));
          if (res.ok) {
            const data = await res.json();
            const accessibleFiles = data.accessibleFiles || [];
            const processedIds = accessibleFiles.filter((f: any) => f.isProcessed).map((f: any) => f.id);
            if (processedIds.length) {
              setSelectedFiles(processedIds);
              console.log(`ChatComponent: Preloaded ${processedIds.length} processed files for new chat`);
            }
          } else {
            console.warn('ChatComponent: access-check returned non-ok when preloading files for new chat');
          }
        } catch (err) {
          console.error('ChatComponent: Failed to preload files for new chat', err);
        }
      }
    };

    window.addEventListener('startNewChat', handleStartNewChat as EventListener);
    return () => window.removeEventListener('startNewChat', handleStartNewChat as EventListener);
  }, [selectedSurvey?.id, clearCurrentSession]);

  // Also ensure URL session param is removed when preparing a new chat
  useEffect(() => {
    const handleOpenNewChatParam = () => {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('session')) {
        urlParams.delete('session');
        const newUrl = `${window.location.pathname}${urlParams.toString() ? '?' + urlParams.toString() : ''}`;
        window.history.replaceState({}, '', newUrl);
        console.log('ChatComponent: Removed session param from URL during new chat prep');
      }
    };

    window.addEventListener('startNewChat', handleOpenNewChatParam as EventListener);
    return () => window.removeEventListener('startNewChat', handleOpenNewChatParam as EventListener);
  }, []);

  // Always update messages when currentSession or currentMessages change
  // mappedMessages is derived above via useMemo

  // Clear selected message when switching between chat sessions
  useEffect(() => {
    setSelectedMessage(null);
  }, [currentSession?.id]);

  // Update personality when session changes (e.g., when loading from URL)
  useEffect(() => {
    if (currentSession?.personality_id && 
        currentSession.personality_id !== selectedPersonalityId &&
        currentSession.personality_id !== lastSessionPersonalityRef.current) {
      console.log('ChatComponent: Updating personality from session:', currentSession.personality_id, 'Previous:', selectedPersonalityId);
      lastSessionPersonalityRef.current = currentSession.personality_id;
      onPersonalityChange?.(currentSession.personality_id);
    }
  }, [currentSession?.personality_id, selectedPersonalityId]); // Remove onPersonalityChange from dependencies

  // Update survey when session changes (e.g., when loading from URL on refresh)
  // Only update if session has survey_ids and we have a valid session
  useEffect(() => {
    if (currentSession?.survey_ids?.length > 0 && currentSession.id) {
      const sessionSurveyId = currentSession.survey_ids[0];
      // Only update if the survey is different from currently selected and we haven't failed to load it before
      if (sessionSurveyId !== selectedSurvey?.id && !failedSurveyLoadsRef.current.has(sessionSurveyId)) {
        console.log('ChatComponent: Updating survey from session:', sessionSurveyId, 'Previous:', selectedSurvey?.id);
        // Load survey data to update the selected survey
        const loadSurveyFromSession = async () => {
          try {
            const surveyRes = await authenticatedFetch(buildApiUrl(API_CONFIG.ENDPOINTS.SURVEYS.DETAILS(sessionSurveyId)));
            if (surveyRes.ok) {
              const surveyData = await surveyRes.json();
              onSurveyChange(surveyData);
              // Remove from failed loads if it succeeds
              failedSurveyLoadsRef.current.delete(sessionSurveyId);
            } else {
              console.warn(`ChatComponent: Failed to load survey ${sessionSurveyId}, status: ${surveyRes.status}`);
              // Mark as failed to prevent retry loops
              failedSurveyLoadsRef.current.add(sessionSurveyId);
            }
          } catch (error) {
            console.error('Error loading survey for session:', error);
            // Mark as failed to prevent retry loops
            failedSurveyLoadsRef.current.add(sessionSurveyId);
          }
        };
        loadSurveyFromSession();
      }
    }
  }, [currentSession?.survey_ids, currentSession?.id, selectedSurvey?.id]); // Add currentSession.id to dependencies

  // Validate session category - clear survey builder sessions from survey results
  useEffect(() => {
    if (currentSession && currentSession.category === 'survey_builder') {
      console.log('ChatComponent: Survey builder session detected in survey results, clearing session');
      clearCurrentSession();
      // Clear URL parameter to prevent reload loops
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('session')) {
        urlParams.delete('session');
        const newUrl = `${window.location.pathname}${urlParams.toString() ? '?' + urlParams.toString() : ''}`;
        window.history.replaceState({}, '', newUrl);
      }
    }
  }, [currentSession?.category, currentSession?.id, clearCurrentSession]);

  // Handle session deletion - clear UI state when session becomes null
  useEffect(() => {
    if (!currentSession) {
      // Defer clearing session via the store (store.clearCurrentSession already clears messages)
      setTimeout(() => {
        clearCurrentSession();
      }, 0);
      setSelectedMessage(null);
      setSelectedFiles([]);
      console.log('ChatComponent: Session cleared, resetting UI state');
    }
  }, [currentSession]);

  // Listen for global sessionCleared events to ensure UI resets even if another component cleared the session
  useEffect(() => {
    const handleSessionCleared = () => {
      console.log('ChatComponent: sessionCleared event received, resetting UI state');
      // Only reset local UI state here. Do NOT call clearCurrentSession() again
      // because the store already issued the sessionCleared event and doing so
      // would re-dispatch and cause an infinite loop.
      setSelectedMessage(null);
      setSelectedFiles([]);
      // If we are currently preparing a new chat (startNewChat triggered the clear),
      // keep pendingNewChat true so the suggestions UI remains visible. Otherwise
      // clear pendingNewChat as before.
      if (preparingNewChatRef.current) {
        console.log('ChatComponent: sessionCleared from preparingNewChat - keeping pendingNewChat true');
        // leave pendingNewChat as-is (true)
        return;
      }
      setPendingNewChat(false);
    };

    window.addEventListener('sessionCleared', handleSessionCleared as EventListener);
    return () => window.removeEventListener('sessionCleared', handleSessionCleared as EventListener);
  }, []);

  const loadSuggestions = async (surveyId: string) => {
    try {
      const response = await authenticatedFetch(buildApiUrl(API_CONFIG.ENDPOINTS.SURVEYS.DETAILS(surveyId)), {
        method: 'GET'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch survey data');
      }

      const surveyData = await response.json();

      // If the survey has pre-generated suggestions, use them
      if (surveyData.ai_suggestions && Array.isArray(surveyData.ai_suggestions) && surveyData.ai_suggestions.length > 0) {
        setSuggestions(surveyData.ai_suggestions);
      } else {
        // Fallback to default suggestions
        setSuggestions([t('surveyResults.suggestions.findLookalikeAudiences'), t('surveyResults.suggestions.emotionalTriggers'), t('surveyResults.suggestions.adHook')]);
      }
    } catch (error) {
      console.error('Error loading suggestions:', error);
      // Use default suggestions on error
      setSuggestions([t('surveyResults.suggestions.findLookalikeAudiences'), t('surveyResults.suggestions.emotionalTriggers'), t('surveyResults.suggestions.adHook')]);
    }
  };

  const handleSendMessage = async (content: string, isSuggestion = false) => {
    if (!content.trim() || isSending) return;
    
    if (isSuggestion) {
      setClickedSuggestion(content);
    }
    
    setIsSending(true);
    
    try {
      const sessionId = currentSession?.id;
      const surveyIds = selectedSurvey ? [selectedSurvey.id] : [];

      if (surveyIds.length === 0) {
        throw new Error('Please select a survey first');
      }


      // Add user message to central store immediately for responsiveness (optimistic)
      const userMessage: Message = {
        id: `user-${Date.now()}`,
        content,
        sender: "user",
        timestamp: new Date()
      };
      try {
        // When there's no active session (first message / pending new chat),
        // start optimistic messages from an empty array to avoid leaking
        // messages from a previously-opened session in the store snapshot.
  const storeMsgs = (getChatStoreSnapshot().currentMessages) || [];
  // If we're preparing a new chat (startNewChat was triggered) or the UI
  // is in a pending-new-chat state, or if the global pending flag is set,
  // do NOT reuse the current store messages even if `currentSession`
  // hasn't been cleared yet. This prevents the old session's messages
  // from appearing when the user sends the first message in a new chat.
  const globalPending = typeof window !== 'undefined' && !!(window as any).__cubular_pendingNewChat;
  const isPreparingNewChat = preparingNewChatRef.current || pendingNewChat || globalPending;
  const baseMsgs = (currentSession?.id && !isPreparingNewChat) ? storeMsgs : [];
        const typingMessage: Message = {
          id: `typing-${Date.now()}`,
          content: t('surveyResults.chat.aiThinking'),
          sender: "assistant",
          timestamp: new Date()
        };
        setCurrentMessages([...baseMsgs, userMessage as any, typingMessage as any]);
      } catch (e) { /* noop */ }

      // Call backend API for AI analysis with sessionId
      // Compute a session title from the user's first prompt when starting a new session.
      const computeSessionTitle = (text: string) => {
        if (!text) return 'New Chat';
        // Get first non-empty line
        const firstLine = text.split(/\r?\n/).map(l => l.trim()).find(l => l.length > 0) || text.trim();
        // Normalize punctuation and split into words
        const cleaned = firstLine.replace(/["'`\(\)\[\],.!?;:\-\/]+/g, ' ');
        const rawWords = cleaned.split(/\s+/).filter(Boolean);

        // Common stopwords to remove from short titles
        const stopwords = new Set([
          'the','a','an','and','or','of','in','on','for','to','with','about','is','are','it','this','that','these','those','my','our','your','their','be'
        ]);

        // Prefer meaningful words by filtering stopwords
        const meaningful = rawWords.filter(w => !stopwords.has(w.toLowerCase()));

        // Take up to 4 words; prefer meaningful words but fall back to raw words
        const takeWords = (arr: string[], n: number) => arr.slice(0, n);
        let titleWords: string[] = [];
        if (meaningful.length >= 3) titleWords = takeWords(meaningful, 4);
        else if (meaningful.length > 0) titleWords = takeWords(meaningful, 4);
        else titleWords = takeWords(rawWords, Math.min(4, rawWords.length));

        // If there are still no words (e.g., punctuation-only), fallback to a short prefix
        if (!titleWords || titleWords.length === 0) {
          const fallback = firstLine.trim().slice(0, 40);
          return fallback.length ? fallback : 'New Chat';
        }

        // Capitalize title words
        const title = titleWords.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        return title;
      };

      const chatRequestBody: any = {
        question: content,
        surveyIds: surveyIds,
        selectedFileIds: selectedFiles,  // Include selected file IDs
        createSession: true  // Always allow session creation
      };

      // If there's currently no session, include the derived title so backend can create the session with a meaningful name
      if (!currentSession?.id) {
        chatRequestBody.title = computeSessionTitle(content);
      }

      console.log('📝 Chat request body:', {
        ...chatRequestBody,
        selectedFileIds: selectedFiles?.length ? selectedFiles : 'No files selected'
      });

      // Only include sessionId if we have a valid one
      if (sessionId) {
        chatRequestBody.sessionId = sessionId;
      }

      // Only include personalityId if it's actually selected
      if (selectedPersonalityId) {
        chatRequestBody.personalityId = selectedPersonalityId;
      }

      const response = await authenticatedFetch(buildApiUrl(API_CONFIG.ENDPOINTS.SURVEYS.SEMANTIC_CHAT), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(chatRequestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error calling semantic-chat:', errorData);
        throw new Error(errorData.error || 'Failed to get chat response');
      }

      const data = await response.json();

      // If a new session was created, load it
      let sessionForSaving = currentSession?.id;
      if (data.sessionId && data.sessionId !== currentSession?.id) {
        await loadSession(data.sessionId);
        sessionForSaving = data.sessionId;
        try { if ((window as any).__cubular_pendingNewChat) (window as any).__cubular_pendingNewChat = false; } catch (e) { /* ignore */ }
      }

      const assistantResponse: Message = {
        id: `assistant-${Date.now()}`,
        content: data.response || 'I apologize, but I encountered an error processing your question.',
        sender: "assistant",
        timestamp: new Date(),
        dataSnapshot: data.dataSnapshot,
        confidence: data.confidence ? {
          score: typeof data.confidence === 'object' ? data.confidence.score : data.confidence,
          reliability: typeof data.confidence === 'object' ? data.confidence.reliability : 
            (data.confidence > 0.8 ? 'high' : data.confidence > 0.5 ? 'medium' : 'low')
        } : undefined
      };


      // Remove typing indicator and add response to central store
      try {
        const latestMsgs = (getChatStoreSnapshot().currentMessages) || [];
        const filtered = latestMsgs.filter(msg => !(msg as any).content?.includes(t('surveyResults.chat.aiThinking')));
        // Avoid duplicates: if the backend already saved the assistant message
        // (which can happen when we loaded the session that was just created),
        // skip appending an identical message. Compare by id and content.
        const alreadyExists = filtered.some(msg => (msg as any).id === assistantResponse.id || (msg as any).content === assistantResponse.content);
        if (!alreadyExists) {
          setCurrentMessages(filtered.concat([assistantResponse as any]));
        } else {
          // Backend-provided message already present; just clear typing indicator.
          setCurrentMessages(filtered);
        }
      } catch (e) {
        console.warn('ChatComponent: failed to update central messages after assistant response', e);
      }

      // Messages are automatically saved by the backend API (surveys/semantic-chat endpoint)
      // No need to save them manually here to avoid duplication
      console.log('✅ Messages automatically saved by backend API');

      setInputMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove typing indicator and show error in central store UI
      try {
        const latestMsgs = (getChatStoreSnapshot().currentMessages) || [];
        const filtered = latestMsgs.filter(msg => !(msg as any).content?.includes(t('surveyResults.chat.aiThinking')));
        setCurrentMessages(filtered.concat([{
          id: `error-${Date.now()}`,
          content: t('surveyResults.chat.errorOccurred'),
          sender: "assistant",
          timestamp: new Date()
        } as any]));
      } catch (e) {
        console.warn('ChatComponent: failed to update central messages with error', e);
      }

      // Still log the user message attempt for debugging
      console.log('⚠️ Chat API failed, but messages will be handled by error recovery logic');
    } finally {
      setIsSending(false);
      setClickedSuggestion(null);
      setPendingNewChat(false);
      try { if ((window as any).__cubular_pendingNewChat) (window as any).__cubular_pendingNewChat = false; } catch (e) { /* ignore */ }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputMessage);
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="h-full flex relative">
      {/* Message Details panel removed - snapshots are always inline */}
      
      {/* Chat Sidebar - Left Column */}
      <ChatSidebar 
        selectedSurvey={selectedSurvey}
        onSurveyChange={onSurveyChange}
        selectedPersonalityId={selectedPersonalityId}
        onPersonalityChange={onPersonalityChange || (() => {})}
        selectedFiles={selectedFiles}
        context="ai_chat_integration" // Filter out survey builder personality
        // No categoryFilter - let it show all sessions for the selected survey except survey_builder (will be handled in ChatSidebar)
        onNewChat={async (sessionId) => {
          // Sidebar may signal a 'pending' new-chat flow before a real session id exists.
          // In that case, do not attempt to load a session called 'pending'. Instead
          // mark the UI as a pending new chat so suggestions are shown and session
          // creation will happen on first message send.
          if (sessionId === 'pending') {
            setPendingNewChat(true);
            // Ensure we have the latest sessions list for the selected survey
            if (selectedSurvey?.id) {
              try { loadChatSessions(selectedSurvey.id); } catch (e) { /* ignore */ }
            }
            return;
          }
          try {
            await loadSession(sessionId);
            // Reload sessions to show the new one (only if we have a survey selected)
            if (selectedSurvey?.id) {
              loadChatSessions(selectedSurvey.id);
            }
          } catch (err) {
            console.error('ChatComponent: failed to load session from onNewChat', err);
          }
        }}
        onChatSelect={async (sessionId) => {
          try {
            // Clear file selection when switching to existing session
            setSelectedFiles([]);
            
            const sessionData = await loadSession(sessionId);
    
            if (sessionData?.session) {
              // Update the selected survey if the session has different surveys
              if (sessionData.session.survey_ids?.length > 0 && 
                  sessionData.session.survey_ids[0] !== selectedSurvey?.id &&
                  !failedSurveyLoadsRef.current.has(sessionData.session.survey_ids[0])) {
                // Load survey data to update the selected survey
                try {
                  const surveyRes = await authenticatedFetch(buildApiUrl(API_CONFIG.ENDPOINTS.SURVEYS.DETAILS(sessionData.session.survey_ids[0])));
                  if (surveyRes.ok) {
                    const surveyData = await surveyRes.json();
                    onSurveyChange(surveyData);
                    // Remove from failed loads if it succeeds
                    failedSurveyLoadsRef.current.delete(sessionData.session.survey_ids[0]);
                  } else {
                    console.warn(`ChatComponent onChatSelect: Failed to load survey ${sessionData.session.survey_ids[0]}, status: ${surveyRes.status}`);
                    // Mark as failed to prevent retry loops
                    failedSurveyLoadsRef.current.add(sessionData.session.survey_ids[0]);
                  }
                } catch (error) {
                  console.error('Error loading survey for session:', error);
                  // Mark as failed to prevent retry loops
                  failedSurveyLoadsRef.current.add(sessionData.session.survey_ids[0]);
                }
              }
              
              // If the session has a different personality, switch to it
              if (sessionData.session.personality_id && sessionData.session.personality_id !== selectedPersonalityId) {
                onPersonalityChange?.(sessionData.session.personality_id);
              }
            }
          } catch (error) {
            console.error('Error selecting chat:', error);
          }
        }}
      />
      
      {/* Main Chat Area - Center Column */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${
        selectedMessage && !isMobile && !showDataInline ? 'mr-96' : ''
      }`}>

        {/* Removed Data Visualization toggle - inline snapshots only */}
        
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {!selectedSurvey ? (
            <div className="text-center text-gray-400 mt-20">
              <p>{t('surveyResults.chat.selectSurvey')}</p>
            </div>
          ) : isLoadingSession ? (
            <div className="flex flex-col items-center justify-center h-full space-y-6">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  {t('surveyResults.chat.loadingSession')}
                </h3>
                <p className="text-gray-400">
                  {t('surveyResults.chat.loadingSessionDescription')}
                </p>
              </div>
            </div>
          ) : !currentSession ? (
            // If user started a new chat flow (pending), show the suggestions panel
            // so they can click a suggested question and create the session on send.
            pendingNewChat ? (
              <div className="flex flex-col items-center justify-center h-full space-y-6">
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-white mb-2">{t('surveyResults.chat.chatAbout', { category: selectedSurvey?.category })}</h3>
                  <p className="text-gray-400 mb-4">{t('surveyResults.chat.description')}</p>
                </div>

                {/* Suggestions in center when starting a new chat */}
                {suggestions.length > 0 && (
                  <div className="w-full max-w-2xl">
                    <p className="text-gray-400 text-xs mb-4 text-center">{t('surveyResults.chat.tryAsking')}:</p>
                    <div className="flex flex-col gap-3">
                      {suggestions.map((question, index) => (
                        <Button 
                          key={index}
                          variant="outline" 
                          className={`bg-gray-900 border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white text-xs md:text-sm py-3 h-auto rounded-lg px-4 shadow-sm text-left justify-start min-h-[48px] w-full whitespace-normal break-words leading-relaxed transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${
                            isSending && clickedSuggestion === question 
                              ? 'bg-blue-900/50 border-blue-600 text-blue-300 cursor-not-allowed' 
                              : isSending 
                              ? 'opacity-50 cursor-not-allowed' 
                              : ''
                          }`}
                          onClick={() => handleSendMessage(question, true)}
                          disabled={isSending}
                        >
                          {isSending && clickedSuggestion === question ? (
                            <div className="flex items-center gap-3">
                              <ThinkingCube size="sm" />
                              <span>{t('surveyResults.chat.analyzing')}</span>
                            </div>
                          ) : (
                            question
                          )}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="text-center">
                  <p className="text-gray-400 text-sm">{t('surveyResults.chat.noMessagesYet')}</p>
                  <p className="text-gray-500 text-xs mt-1">{t('surveyResults.chat.startConversation')}</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full space-y-6">
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {chatSessions.length === 0 
                      ? (selectedSurvey 
                          ? `No chats yet for this survey`
                          : `No chat sessions found`)
                      : `Select a chat to continue`
                    }
                  </h3>
                  <p className="text-gray-400 mb-6">
                    {chatSessions.length === 0 
                      ? (selectedSurvey 
                          ? `Start your first conversation to analyze "${selectedSurvey.title || selectedSurvey.filename || selectedSurvey.id}"`
                          : `Create a new chat session to get started with AI-powered survey analysis`)
                      : `Choose a chat session from the sidebar or create a new one`
                    }
                  </p>
                  {/* The "Create New Chat" button was removed from the central chat UI.
                      Use the sidebar "+ new chat" control which dispatches the
                      `startNewChat` event to prepare a new chat and show suggestions
                      for the currently selected survey. */}
                </div>
              </div>
            )
          ) : mappedMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full space-y-6">
              <div className="text-center">
                <h3 className="text-xl font-semibold text-white mb-2">
                  {t('surveyResults.chat.chatAbout', { category: selectedSurvey.category })}
                </h3>
                <p className="text-gray-400 mb-4">
                  {t('surveyResults.chat.description')}
                </p>
              </div>

              {/* Suggestions in center when no messages */}
              {suggestions.length > 0 && (
                <div className="w-full max-w-2xl">
                  <p className="text-gray-400 text-xs mb-4 text-center">{t('surveyResults.chat.tryAsking')}:</p>
                  <div className="flex flex-col gap-3">
                    {suggestions.map((question, index) => (
                      <Button 
                        key={index}
                        variant="outline" 
                        className={`bg-gray-900 border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white text-xs md:text-sm py-3 h-auto rounded-lg px-4 shadow-sm text-left justify-start min-h-[48px] w-full whitespace-normal break-words leading-relaxed transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${
                          isSending && clickedSuggestion === question 
                            ? 'bg-blue-900/50 border-blue-600 text-blue-300 cursor-not-allowed' 
                            : isSending 
                            ? 'opacity-50 cursor-not-allowed' 
                            : ''
                        }`}
                        onClick={() => handleSendMessage(question, true)}
                        disabled={isSending}
                      >
                        {isSending && clickedSuggestion === question ? (
                          <div className="flex items-center gap-3">
                            <ThinkingCube size="sm" />
                            <span>{t('surveyResults.chat.analyzing')}</span>
                          </div>
                        ) : (
                          question
                        )}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Show message for existing session with no history */}
              {currentSession?.id && (
                <div className="text-center">
                  <p className="text-gray-400 text-sm">{t('surveyResults.chat.noMessagesYet')}</p>
                  <p className="text-gray-500 text-xs mt-1">{t('surveyResults.chat.startConversation')}</p>
                </div>
              )}

            </div>
          ) : (
            // Regular messages display
            <div className="space-y-4">
              {mappedMessages.map((message) => (
                <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex ${message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'} items-start gap-3 max-w-[85%]`}>
                    {/* Avatar */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 ${
                      message.sender === 'user' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-700 text-blue-400 border border-gray-600'
                    }`}>
                      {message.sender === 'user' ? 'U' : 'AI'}
                    </div>
                    
                    {/* Message Content */}
                    <div 
                      className={`p-4 rounded-lg transition-all duration-200 ${
                        message.sender === 'user' 
                          ? 'bg-blue-600 text-white rounded-br-sm shadow-lg' 
                          : 'bg-gray-800 text-gray-100 rounded-bl-sm border border-gray-700'
                      }`}
                    >
                      {/* Special handling for thinking/typing indicator */}
                      {message.content.includes(t('surveyResults.chat.aiThinking')) ? (
                        <div className="flex items-center gap-3">
                          <ThinkingCube size="md" />
                          <span className="text-gray-300">{t('surveyResults.chat.aiThinking')}</span>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                      )}
                      
                      {/* Inline Data Snapshot - Show when inline mode is enabled */}
                      {showDataInline && message.sender === 'assistant' && (message.dataSnapshot || message.confidence) && (
                        <div className="mt-4 animate-fade-in">
                          <div className="bg-gray-900/80 border border-blue-600 rounded-lg p-4 shadow-lg">
                            <div className="flex items-center gap-2 mb-3">
                              <BarChart3 className="h-4 w-4 text-blue-400" />
                              <span className="font-semibold text-blue-300 text-sm">{t('surveyResults.chat.aiDataAnalysis')}</span>
                            </div>
                            <InlineDataSnapshot 
                              dataSnapshot={message.dataSnapshot}
                              confidence={message.confidence}
                            />
                          </div>
                        </div>
                      )}
                      
                      {/* Inline footer showing confidence and data availability when present */}
                      {(message.dataSnapshot || message.confidence) && message.sender === 'assistant' && (
                        <div className="mt-3 pt-3 border-t border-gray-600 flex items-center justify-between gap-3 text-xs text-gray-400">
                          <div className="flex items-center gap-3">
                            {message.confidence && (
                              <span className="flex items-center gap-1">
                                📊 {t('surveyResults.chat.confidence')}: {Math.round((message.confidence.score || 0) * 100)}%
                              </span>
                            )}
                            {message.dataSnapshot && message.confidence && <span>•</span>}
                            {message.dataSnapshot && (
                              <span>📈 {t('surveyResults.chat.dataAvailable')}</span>
                            )}
                          </div>

                          {/* Actions: Try again (refresh) and Copy message */}
                          <div className="flex items-center gap-2">
                            <button
                              title={t('surveyResults.chat.tryAgain')}
                              onClick={async () => {
                                try {
                                  // Optimistic UI: set this message to thinking
                                  const storeMsgs = (getChatStoreSnapshot().currentMessages) || [];
                                  const optimistic = storeMsgs.map((m: any) => {
                                    if (m.id === message.id) {
                                      return { ...m, content: t('surveyResults.chat.aiThinking'), data_snapshot: null, confidence: null };
                                    }
                                    return m;
                                  });
                                  setCurrentMessages(optimistic as any);

                                  const res = await authenticatedFetch(buildApiUrl(API_CONFIG.ENDPOINTS.SURVEYS.RETRY_MESSAGE(message.id)), {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ sessionId: currentSession?.id })
                                  });

                                  if (!res.ok) {
                                    const err = await res.json().catch(() => ({}));
                                    throw new Error(err.error || 'Retry failed');
                                  }

                                  const body = await res.json();

                                  // Replace the assistant message with updated content
                                  const updated = (getChatStoreSnapshot().currentMessages || []).map((m: any) => {
                                    if (m.id === message.id) {
                                      return {
                                        ...m,
                                        content: body.response || m.content,
                                        data_snapshot: body.dataSnapshot || null,
                                        confidence: body.confidence || null
                                      };
                                    }
                                    return m;
                                  });

                                  setCurrentMessages(updated as any);
                                  toast({ title: t('surveyResults.chat.retrySent') });
                                } catch (err) {
                                  console.error('Retry failed', err);
                                  toast({ title: t('surveyResults.chat.retryFailed') });
                                  // Restore latest messages from store snapshot if available
                                  try {
                                    const latest = (getChatStoreSnapshot().currentMessages) || [];
                                    setCurrentMessages(latest as any);
                                  } catch (e) { /* ignore */ }
                                }
                              }}
                              className="p-1 rounded hover:bg-gray-800/60"
                            >
                              <RefreshCw className="h-4 w-4 text-gray-300" />
                            </button>

                            <button
                              title={t('surveyResults.chat.copyMessage')}
                              onClick={async () => {
                                try {
                                  let toCopy = message.content || '';
                                  if (message.dataSnapshot) {
                                    toCopy += '\n\nData Snapshot:\n' + JSON.stringify(message.dataSnapshot, null, 2);
                                  }
                                  if (message.confidence) {
                                    toCopy += `\n\nConfidence: ${Math.round((message.confidence.score || 0) * 100)}% (${message.confidence.reliability})`;
                                  }
                                  await navigator.clipboard.writeText(toCopy);
                                  toast({ title: t('surveyResults.chat.copied') });
                                } catch (err) {
                                  console.error('Failed to copy message', err);
                                  toast({ title: t('surveyResults.chat.copyFailed') });
                                }
                              }}
                              className="p-1 rounded hover:bg-gray-800/60"
                            >
                              <Copy className="h-4 w-4 text-gray-300" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Input Area */}
        {selectedSurvey && (
          <div className="border-t border-gray-700 p-6">
            <div className="flex gap-4">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={t('surveyResults.chat.inputPlaceholder')}
                disabled={isSending}
                className="flex-1 bg-gray-800 border-gray-600 text-white placeholder-gray-400"
              />
              <Button
                onClick={() => handleSendMessage(inputMessage)}
                disabled={!inputMessage.trim() || isSending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
