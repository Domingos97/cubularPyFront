import { useSyncExternalStore } from 'react';
import * as store from './chatSessionsStore';

export function useChatSessions() {
  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot);

  return {
    chatSessions: snapshot.chatSessions,
    currentSession: snapshot.currentSession,
    currentMessages: snapshot.currentMessages,
  setCurrentMessages: store.setCurrentMessages,
    isLoading: snapshot.isLoading,
    isLoadingSession: snapshot.isLoadingSession,
    selectedSessions: snapshot.selectedSessions,
    loadChatSessions: store.loadChatSessions,
    createNewSession: store.createNewSession,
    loadSession: store.loadSession,
    saveMessage: store.saveMessage,
    deleteSession: store.deleteSession,
    updateSessionTitle: store.updateSessionTitle,
    updateSessionSurveys: store.updateSessionSurveys,
    clearCurrentSession: store.clearCurrentSession,
    clearAllSessions: store.clearAllSessions,
    toggleSessionSelection: store.toggleSessionSelection,
    selectAllSessions: store.selectAllSessions,
    deselectAllSessions: store.deselectAllSessions,
    isSessionSelected: store.isSessionSelected,
    getSelectedSessionsCount: store.getSelectedSessionsCount,
    deleteSelectedSessions: store.deleteSelectedSessions,
  };
}
