import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'react-router-dom';
import { Survey } from '@/types/survey';
import { authenticatedFetch } from '@/utils/api';
import { buildApiUrl, API_CONFIG } from '@/config';

interface ChatSession {
  id: string;
  user_id: string;
  survey_ids: string[];
  category: string;
  title: string;
  created_at: string;
  updated_at: string;
  personality_id?: string;
  selected_file_ids?: string[];
}

interface ChatMessage {
  id: string;
  session_id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: string;
  message_language?: string; // ISO 639-1 language code for message language tracking
  data_snapshot?: any;
  confidence?: number;
  personality_used?: string;
}

export function useChatSessions() {
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [currentMessages, setCurrentMessages] = useState<ChatMessage[]>([]);
  const [selectedSessions, setSelectedSessions] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const { user } = useAuth();
  const location = useLocation();
  const loadingRef = useRef<Set<string>>(new Set()); // Track loading sessions to prevent duplicates
  const failedSessionsRef = useRef<Set<string>>(new Set()); // Track failed sessions to prevent retry loops

  const loadChatSessions = useCallback(async (surveyId?: string) => {
    console.log('🔍 loadChatSessions: Called with user:', user, 'surveyId:', surveyId);
    if (!user?.id) {
      console.log('🔍 loadChatSessions: No user ID, skipping. User object:', user);
      return;
    }
    setIsLoading(true);
    console.log('🔍 loadChatSessions: Starting with user:', user.id, 'surveyId:', surveyId);
    try {
      let url = buildApiUrl(API_CONFIG.ENDPOINTS.CHAT.SESSIONS);
      if (surveyId) {
        url += `?surveyId=${surveyId}`;
      }
      console.log('🔍 loadChatSessions: API URL:', url);
      console.log('🔍 loadChatSessions: Making authenticated request...');
      
      const response = await authenticatedFetch(url);
      
      console.log('🔍 loadChatSessions: Response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API ERROR: Failed to load chat sessions:', response.status, response.statusText, errorText);
        setChatSessions([]);
        return;
      }
      
      const data = await response.json();
      console.log('🔍 loadChatSessions: Raw response data:', data);
      
      // Extract sessions from the response object
      const sessions = Array.isArray(data) ? data : (data.sessions || []);
      console.log('🔍 loadChatSessions: Processed sessions:', sessions.length, sessions);
      setChatSessions(sessions);
    } catch (error) {
      console.error('🔍 loadChatSessions: Error occurred:', error);
      setChatSessions([]);
    } finally {
      setIsLoading(false);
      console.log('🔍 loadChatSessions: Finished loading');
    }
  }, [user?.id]);

  const createNewSession = useCallback(async (surveys: Survey[], category: string, selectedPersonalityId?: string | null, selectedFileIds?: string[]) => {
    if (!user?.id) return null;
    
    // Allow empty surveys for survey_builder category
    if (surveys.length === 0 && category !== 'survey_builder') {
      console.log('🎯 No surveys provided for non-survey-builder session');
      return null;
    }
    
    try {
      const surveyIds = surveys.map(s => s.id);
      const sessionTitle = `New Chat`; // Use placeholder title that will be updated by first message
      
      console.log('🎯 Creating new session with:');
      console.log('  - surveyIds:', surveyIds);
      console.log('  - category:', category);
      console.log('  - selectedPersonalityId:', selectedPersonalityId);
      console.log('  - selectedFiles:', selectedFileIds);
      
      console.log('🎯 Creating new session with selected files:', selectedFileIds);
      
      const response = await authenticatedFetch(buildApiUrl(API_CONFIG.ENDPOINTS.CHAT.SESSIONS), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          survey_ids: surveyIds,
          category,
          title: sessionTitle,
          personality_id: selectedPersonalityId || null,
          selected_file_ids: selectedFileIds || []
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create session');
      }

      const newSession = await response.json();
      
      if (newSession) {
        // Don't automatically reload all sessions - let components handle their own reloading
        return {
          success: true,
          session: newSession,
          id: newSession.id
        };
      }
    } catch (error) {
      console.error('Failed to create new session:', error);
    }
    return null;
  }, [user?.id]);

  const loadSession = useCallback(async (sessionId: string) => {
    // Prevent duplicate loads
    if (loadingRef.current.has(sessionId)) {
      console.log('🔍 useChatSessions: Session already loading, skipping:', sessionId);
      return null;
    }
    
    loadingRef.current.add(sessionId);
    setIsLoadingSession(true);
    try {
      console.log('🔍 useChatSessions: Loading session:', sessionId);
      
      // Use the quick endpoint that returns both session and messages
      const response = await authenticatedFetch(buildApiUrl(`${API_CONFIG.ENDPOINTS.CHAT.SESSIONS}/${sessionId}/quick`));
      
      if (!response.ok) {
        // If session is not found (404), clear URL parameters to prevent infinite loops
        if (response.status === 404) {
          console.warn('🔍 useChatSessions: Session not found, clearing URL parameters:', sessionId);
          failedSessionsRef.current.add(sessionId); // Mark as failed
          const currentUrl = new URL(window.location.href);
          if (currentUrl.searchParams.get('session') === sessionId) {
            currentUrl.searchParams.delete('session');
            window.history.replaceState({}, '', currentUrl.toString());
          }
        }
        throw new Error(`Session API failed with status ${response.status}`);
      }
      
      const data = await response.json();
      console.log('🔍 useChatSessions: Loaded session data:', data);
      
      // Extract session and messages from the response
      const session = data.session || data;
      const messages = data.messages || [];
      
      console.log('🔍 useChatSessions: Session:', session);
      console.log('🔍 useChatSessions: Messages count:', messages.length);
      console.log('🔍 useChatSessions: Session personality_id:', session.personality_id);
      
      // Set current session and messages
      setCurrentSession(session);
      setCurrentMessages(messages || []);
      
      return { session, messages };
    } catch (error) {
      console.error('🔍 useChatSessions: Error loading session:', error);
      // Clear state on error
      setCurrentSession(null);
      setCurrentMessages([]);
      return null;
    } finally {
      loadingRef.current.delete(sessionId);
      setIsLoadingSession(false);
    }
  }, []);

  // Handle URL parameters for automatic session loading
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const sessionId = urlParams.get('session');
    
    if (sessionId && 
        sessionId !== currentSession?.id && 
        !isLoadingSession && 
        !loadingRef.current.has(sessionId) &&
        !failedSessionsRef.current.has(sessionId)) {
      console.log('useChatSessions: Auto-loading session from URL:', sessionId);
      loadSession(sessionId).catch(error => {
        console.error('useChatSessions: Failed to auto-load session:', error);
        // Mark session as failed to prevent retry loops
        failedSessionsRef.current.add(sessionId);
        // Clear URL parameter on error to prevent infinite loops
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('session');
        window.history.replaceState({}, '', newUrl.toString());
      });
    }
  }, [location.search, currentSession?.id, isLoadingSession]); // Removed loadSession from dependencies to prevent infinite loop

  const saveMessage = async (
    content: string, 
    sender: 'user' | 'assistant', 
    dataSnapshot: any = undefined, 
    targetSessionId?: string,
    confidence?: number,
    personalityUsed?: string
  ) => {
    const sessionId = targetSessionId || currentSession?.id;
    if (!sessionId) return;
    
    try {
      const response = await authenticatedFetch(buildApiUrl(`${API_CONFIG.ENDPOINTS.CHAT.SESSIONS}/${sessionId}/messages`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          content,
          sender,
          data_snapshot: dataSnapshot,
          confidence,
          personality_used: personalityUsed
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save message');
      }

      const savedMessage = await response.json();
      
      if (sessionId === currentSession?.id) {
        setCurrentMessages(prev => [...prev, savedMessage]);
      }
      
      // Update the session in the local state to reflect the new message
      // This avoids a full reload but keeps the sidebar updated
      setChatSessions(prev => prev.map(session => {
        if (session.id === sessionId) {
          return {
            ...session,
            updated_at: new Date().toISOString(),
            // Optionally update other fields that might have changed
          };
        }
        return session;
      }));
      
      return savedMessage;
    } catch (error) {
      console.error('Error saving message:', error);
      throw error;
    }
  };

  const deleteSession = async (sessionId: string) => {
    try {
      console.log('🗑️ Deleting session:', sessionId, 'Current session:', currentSession?.id);
      
      const response = await authenticatedFetch(buildApiUrl(`${API_CONFIG.ENDPOINTS.CHAT.SESSIONS}/${sessionId}`), { 
        method: 'DELETE' 
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to delete session: ${response.status}`);
      }
            
      // If we deleted the currently active session, clear it first
      if (currentSession?.id === sessionId) {
        console.log('🗑️ Clearing current session because it was deleted');
        setCurrentSession(null);
        setCurrentMessages([]);
      }
      
      // Clear from failed sessions in case it was marked as failed before
      failedSessionsRef.current.delete(sessionId);
      
      // Don't automatically reload sessions after deletion - let components handle it
      console.log('🗑️ Session deletion completed, components should reload as needed');
      
    } catch (error) {
      console.error('Error deleting session:', error);
      throw error; // Re-throw to allow calling component to handle the error
    }
  };

  const updateSessionTitle = async (sessionId: string, newTitle: string) => {
    try {
      await authenticatedFetch(buildApiUrl(`${API_CONFIG.ENDPOINTS.CHAT.SESSIONS}/${sessionId}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle })
      });
      // Don't automatically reload - let components handle it
    } catch (error) {
      console.error('Error updating session title:', error);
    }
  };

  const updateSessionSurveys = async (sessionId: string, surveys: Survey[], category: string) => {
    try {
      // Clear existing messages
      await authenticatedFetch(buildApiUrl(`${API_CONFIG.ENDPOINTS.CHAT.SESSIONS}/${sessionId}/messages`), { method: 'DELETE' });
      
  const surveyIds = surveys.map(s => s.id);
      const newTitle = surveys.length === 1 
        ? `Chat about ${surveys[0].filename}` 
        : `Chat about ${surveys.length} surveys`;
      
      // Update session with new surveys
      await authenticatedFetch(buildApiUrl(`${API_CONFIG.ENDPOINTS.CHAT.SESSIONS}/${sessionId}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          survey_ids: surveyIds,
          category,
          title: newTitle
        })
      });
      
      await loadChatSessions();
      if (currentSession?.id === sessionId) {
        setCurrentMessages([]);
      }
    } catch (error) {
      console.error('Error updating session surveys:', error);
    }
  };

  // Selection management functions
  const toggleSessionSelection = (sessionId: string) => {
    setSelectedSessions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sessionId)) {
        newSet.delete(sessionId);
      } else {
        newSet.add(sessionId);
      }
      return newSet;
    });
  };

  const selectAllSessions = () => {
    const allSessionIds = chatSessions.map(session => session.id);
    setSelectedSessions(new Set(allSessionIds));
  };

  const deselectAllSessions = () => {
    setSelectedSessions(new Set());
  };

  const isSessionSelected = (sessionId: string) => {
    return selectedSessions.has(sessionId);
  };

  const getSelectedSessionsCount = () => {
    return selectedSessions.size;
  };

  const deleteSelectedSessions = async () => {
    const sessionsToDelete = Array.from(selectedSessions);
    try {
      await Promise.all(
        sessionsToDelete.map(sessionId =>
          authenticatedFetch(buildApiUrl(`${API_CONFIG.ENDPOINTS.CHAT.SESSIONS}/${sessionId}`), { method: 'DELETE' })
        )
      );
      
      // Don't automatically reload - let components handle it
      
      // Clear selection and current session if it was deleted
      setSelectedSessions(new Set());
      if (currentSession && selectedSessions.has(currentSession.id)) {
        setCurrentSession(null);
        setCurrentMessages([]);
      }
    } catch (error) {
      console.error('Error deleting selected sessions:', error);
    }
  };

  const clearCurrentSession = useCallback(() => {
    setCurrentSession(null);
    setCurrentMessages([]);
  }, []);

  const clearAllSessions = useCallback(() => {
    setChatSessions([]);
    setCurrentSession(null);
    setCurrentMessages([]);
  }, []);

  return {
    chatSessions,
    currentSession,
    currentMessages,
    setCurrentMessages,
    isLoading,
    isLoadingSession,
    selectedSessions,
    loadChatSessions,
    createNewSession,
    loadSession,
    saveMessage,
    deleteSession,
    updateSessionTitle,
    updateSessionSurveys,
    clearCurrentSession,
    clearAllSessions,
    // Selection management
    toggleSessionSelection,
    selectAllSessions,
    deselectAllSessions,
    isSessionSelected,
    getSelectedSessionsCount,
    deleteSelectedSessions,
  };
}
