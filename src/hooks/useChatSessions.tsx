import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'react-router-dom';
import { Survey } from '@/types/survey';
import { authenticatedFetch } from '@/utils/api';

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

  const loadChatSessions = useCallback(async (surveyId?: string) => {
    if (!user?.id) return;
    console.log('🌐 API CALL: Starting loadChatSessions for user:', user.id, 'survey:', surveyId);
    setIsLoading(true);
    try {
      let url = `/api/chat/sessions?userId=${user.id}`;
      if (surveyId) {
        url += `&surveyId=${surveyId}`;
      }
      console.log('🌐 API CALL: Fetching from URL:', url);
      const response = await authenticatedFetch(url);
      
      if (!response.ok) {
        console.error('❌ API ERROR: Failed to load chat sessions:', response.status, response.statusText);
        setChatSessions([]);
        return;
      }
      
      const data = await response.json();
      console.log('✅ API SUCCESS: Received data:', data);
      // Ensure data is always an array
      const sessions = Array.isArray(data) ? data : [];
      console.log('✅ API SUCCESS: Setting sessions:', sessions.length, 'sessions');
      setChatSessions(sessions);
    } catch (error) {
      console.error('❌ API ERROR: Failed to load chat sessions:', error);
      setChatSessions([]);
    } finally {
      setIsLoading(false);
      console.log('🌐 API CALL: Completed loadChatSessions');
    }
  }, [user?.id]);

  const createNewSession = async (surveys: Survey[], category: string, selectedPersonalityId?: string | null, selectedFileIds?: string[]) => {
    if (!user?.id || surveys.length === 0) return null;
    
    try {
  const surveyIds = surveys.map(s => s.id);
      const sessionTitle = surveys.length === 1 
        ? `Chat about ${surveys[0].filename}` 
        : `Chat about ${surveys.length} surveys`;
      
      console.log('🎯 Creating new session with selected files:', selectedFileIds);
      
      const response = await authenticatedFetch('/api/chat/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
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
        await loadChatSessions();
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
  };

  const loadSession = async (sessionId: string) => {
    setIsLoadingSession(true);
    try {
      const sessionRes = await authenticatedFetch(`/api/chat/sessions/${sessionId}`);
      
      if (!sessionRes.ok) {
        throw new Error(`Session API failed with status ${sessionRes.status}`);
      }
      
      const session = await sessionRes.json();
      
      const messagesRes = await authenticatedFetch(`/api/chat/sessions/${sessionId}/messages`);
      
      if (!messagesRes.ok) {
        throw new Error(`Messages API failed with status ${messagesRes.status}`);
      }
      
      const messages = await messagesRes.json();
      setCurrentSession(session);
      setCurrentMessages(messages || []);
      
      return { session, messages };
    } catch (error) {
      // Clear state on error
      setCurrentSession(null);
      setCurrentMessages([]);
      return null;
    } finally {
      setIsLoadingSession(false);
    }
  };

  // Handle URL parameters for automatic session loading
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const sessionId = urlParams.get('session');
    
    if (sessionId && sessionId !== currentSession?.id && chatSessions.length > 0) {
      console.log('useChatSessions: Auto-loading session from URL:', sessionId);
      loadSession(sessionId);
    }
  }, [location.search, currentSession?.id, chatSessions.length]);

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
      const response = await authenticatedFetch(`/api/chat/sessions/${sessionId}/messages`, {
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
      
      await loadChatSessions();
      return savedMessage;
    } catch (error) {
      console.error('Error saving message:', error);
      throw error;
    }
  };

  const deleteSession = async (sessionId: string) => {
    try {
      
      const response = await authenticatedFetch(`/api/chat/sessions/${sessionId}`, { 
        method: 'DELETE' 
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to delete session: ${response.status}`);
      }
            
      // Reload sessions to refresh the UI
      await loadChatSessions();
      
      // If we deleted the currently active session, clear it
      if (currentSession?.id === sessionId) {
        setCurrentSession(null);
        setCurrentMessages([]);
      }
      
    } catch (error) {
      console.error('Error deleting session:', error);
      throw error; // Re-throw to allow calling component to handle the error
    }
  };

  const updateSessionTitle = async (sessionId: string, newTitle: string) => {
    try {
      await authenticatedFetch(`/api/chat/sessions/${sessionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle })
      });
      await loadChatSessions();
    } catch (error) {
      console.error('Error updating session title:', error);
    }
  };

  const updateSessionSurveys = async (sessionId: string, surveys: Survey[], category: string) => {
    try {
      // Clear existing messages
      await authenticatedFetch(`/api/chat/sessions/${sessionId}/messages`, { method: 'DELETE' });
      
  const surveyIds = surveys.map(s => s.id);
      const newTitle = surveys.length === 1 
        ? `Chat about ${surveys[0].filename}` 
        : `Chat about ${surveys.length} surveys`;
      
      // Update session with new surveys
      await authenticatedFetch(`/api/chat/sessions/${sessionId}`, {
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
          authenticatedFetch(`/api/chat/sessions/${sessionId}`, { method: 'DELETE' })
        )
      );
      
      await loadChatSessions();
      
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

  const clearCurrentSession = () => {
    setCurrentSession(null);
    setCurrentMessages([]);
  };

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
    // Selection management
    toggleSessionSelection,
    selectAllSessions,
    deselectAllSessions,
    isSessionSelected,
    getSelectedSessionsCount,
    deleteSelectedSessions,
  };
}