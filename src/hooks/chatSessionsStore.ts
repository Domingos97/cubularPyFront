import { Survey } from '@/types/survey';
import { authenticatedFetch } from '@/utils/api';
import { buildApiUrl, API_CONFIG } from '@/config';

export interface ChatSession {
  id: string;
  user_id?: string;
  survey_ids?: string[];
  category?: string;
  title?: string;
  created_at?: string;
  updated_at?: string;
  personality_id?: string;
  selected_file_ids?: string[];
}

export interface ChatMessage {
  id: string;
  session_id?: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp?: string | number | Date;
  data_snapshot?: any;
  confidence?: any;
}

type StoreState = {
  chatSessions: ChatSession[];
  currentSession: ChatSession | null;
  currentMessages: ChatMessage[];
  selectedSessions: Set<string>;
  isLoading: boolean;
  isLoadingSession: boolean;
};

const initialState: StoreState = {
  chatSessions: [],
  currentSession: null,
  currentMessages: [],
  selectedSessions: new Set<string>(),
  isLoading: false,
  isLoadingSession: false,
};

let state: StoreState = { ...initialState };
const subscribers = new Set<() => void>();
let _notify_count = 0;
let _notify_lastTime = 0;
let _notify_scheduled = false;

function notify() {
  // Instrumentation: detect high-frequency notifications which can cause nested update loops
  try {
    _notify_count = _notify_count + 1;
    const now = Date.now();
    const last = _notify_lastTime || now;
    _notify_lastTime = now;
    const delta = now - last;
    // If notifications are happening very rapidly (e.g., < 20ms), log a warning occasionally
    if (delta < 20 && _notify_count % 50 === 0) {
      console.warn(`chatSessionsStore.notify: high-frequency updates detected (count=${_notify_count}, delta=${delta}ms)`);
    }
  } catch (e) {
    /* ignore instrumentation errors */
  }

  // Schedule a single deferred flush to batch multiple rapid notify() calls
  if (!_notify_scheduled) {
    _notify_scheduled = true;
    setTimeout(() => {
      _notify_scheduled = false;
      subscribers.forEach(s => {
        try { s(); } catch (err) { console.error('chatSessionsStore subscriber error', err); }
      });
    }, 0);
  }
}

function setState(patch: Partial<StoreState>) {
  // Shallow-compare patch to current state to avoid redundant notifications
  let changed = false;
  for (const key of Object.keys(patch) as (keyof StoreState)[]) {
    const newVal = patch[key];
    // For Sets, compare entries by size and values
    if (newVal instanceof Set && state[key] instanceof Set) {
      const a = newVal as Set<any>;
      const b = state[key] as Set<any>;
      if (a.size !== b.size) { changed = true; break; }
      for (const v of a) if (!b.has(v)) { changed = true; break; }
      if (changed) break;
    } else if (state[key] !== newVal) {
      changed = true;
      break;
    }
  }

  if (!changed) return; // No-op patch

  state = Object.assign({}, state, patch);
  notify();
}

export function subscribe(listener: () => void) {
  subscribers.add(listener);
  return () => subscribers.delete(listener);
}

export function getSnapshot() {
  // Return the internal state reference rather than creating a new object
  // on every call. useSyncExternalStore expects the snapshot result to be
  // stable (identity-equal) when nothing changed; returning a fresh
  // shallow copy each time can trigger infinite update loops.
  return state;
}

const loadingRef = new Set<string>();

export async function loadChatSessions(surveyId?: string) {
  setState({ isLoading: true });
  try {
    let url = buildApiUrl(API_CONFIG.ENDPOINTS.CHAT.SESSIONS);
    if (surveyId) url += `?surveyId=${surveyId}`;
    const res = await authenticatedFetch(url);
    if (!res.ok) {
      setState({ chatSessions: [] });
      return;
    }
    const data = await res.json();
    const sessions = Array.isArray(data) ? data : data.sessions ?? [];
    setState({ chatSessions: sessions });
  } catch (err) {
    console.error('chatSessionsStore.loadChatSessions', err);
    setState({ chatSessions: [] });
  } finally {
    setState({ isLoading: false });
  }
}

export async function createNewSession(surveys: Survey[], category: string, selectedPersonalityId?: string | null, selectedFileIds?: string[]) {
  try {
    const survey_ids = surveys.map(s => s.id);
    const response = await authenticatedFetch(buildApiUrl(API_CONFIG.ENDPOINTS.CHAT.SESSIONS), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ survey_ids, category, title: 'New Chat', personality_id: selectedPersonalityId || null, selected_file_ids: selectedFileIds || [] }),
    });
    if (!response.ok) throw new Error('Failed to create session');
    const newSession = await response.json();
    setState({ chatSessions: [newSession, ...state.chatSessions] });
    return { success: true, session: newSession, id: newSession.id };
  } catch (err) {
    console.error('chatSessionsStore.createNewSession', err);
    return null;
  }
}

export async function loadSession(sessionId: string) {
  if (loadingRef.has(sessionId)) return null;
  loadingRef.add(sessionId);
  setState({ isLoadingSession: true });
  try {
    const res = await authenticatedFetch(buildApiUrl(`${API_CONFIG.ENDPOINTS.CHAT.SESSIONS}/${sessionId}/quick`));
    if (!res.ok) {
      if (res.status === 404) {
        const cur = new URL(window.location.href);
        if (cur.searchParams.get('session') === sessionId) {
          cur.searchParams.delete('session');
          window.history.replaceState({}, '', cur.toString());
        }
      }
      throw new Error('Session load failed');
    }
    const data = await res.json();
    const session = data.session || data;
    const messages = data.messages || [];
    setState({ currentSession: session, currentMessages: messages });
    return { session, messages };
  } catch (err) {
    console.error('chatSessionsStore.loadSession', err);
    setState({ currentSession: null, currentMessages: [] });
    return null;
  } finally {
    loadingRef.delete(sessionId);
    setState({ isLoadingSession: false });
  }
}

export async function saveMessage(content: string, sender: 'user' | 'assistant', dataSnapshot?: any, targetSessionId?: string, confidence?: number, personalityUsed?: string) {
  const sessionId = targetSessionId || state.currentSession?.id;
  if (!sessionId) return;
  try {
    const res = await authenticatedFetch(buildApiUrl(`${API_CONFIG.ENDPOINTS.CHAT.SESSIONS}/${sessionId}/messages`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId, content, sender, data_snapshot: dataSnapshot, confidence, personality_used: personalityUsed }),
    });
    if (!res.ok) throw new Error('Failed to save message');
    const saved = await res.json();
    if (sessionId === state.currentSession?.id) setState({ currentMessages: [...state.currentMessages, saved] });
    setState({ chatSessions: state.chatSessions.map(s => (s.id === sessionId ? { ...s, updated_at: new Date().toISOString() } : s)) });
    return saved;
  } catch (err) {
    console.error('chatSessionsStore.saveMessage', err);
    throw err;
  }
}

export async function deleteSession(sessionId: string) {
  try {
    const res = await authenticatedFetch(buildApiUrl(`${API_CONFIG.ENDPOINTS.CHAT.SESSIONS}/${sessionId}`), { method: 'DELETE' });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to delete session: ${res.status}`);
    }
    if (state.currentSession?.id === sessionId) setState({ currentSession: null, currentMessages: [] });
    setState({ chatSessions: state.chatSessions.filter(s => s.id !== sessionId) });
  } catch (err) {
    console.error('chatSessionsStore.deleteSession', err);
    throw err;
  }
}

export async function updateSessionTitle(sessionId: string, newTitle: string) {
  try {
    await authenticatedFetch(buildApiUrl(`${API_CONFIG.ENDPOINTS.CHAT.SESSIONS}/${sessionId}`), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: newTitle }) });
  } catch (err) {
    console.error('chatSessionsStore.updateSessionTitle', err);
  }
}

export async function updateSessionSurveys(sessionId: string, surveys: Survey[], category: string) {
  try {
    await authenticatedFetch(buildApiUrl(`${API_CONFIG.ENDPOINTS.CHAT.SESSIONS}/${sessionId}/messages`), { method: 'DELETE' });
    const surveyIds = surveys.map(s => s.id);
    const newTitle = surveys.length === 1 ? `Chat about ${surveys[0].filename}` : `Chat about ${surveys.length} surveys`;
    await authenticatedFetch(buildApiUrl(`${API_CONFIG.ENDPOINTS.CHAT.SESSIONS}/${sessionId}`), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ survey_ids: surveyIds, category, title: newTitle }) });
    await loadChatSessions();
    if (state.currentSession?.id === sessionId) setState({ currentMessages: [] });
  } catch (err) {
    console.error('chatSessionsStore.updateSessionSurveys', err);
  }
}

export function clearCurrentSession() {
  // Avoid creating a new empty array when currentMessages is already empty to prevent
  // repeated notifications/infinite update loops in subscribers.
  const patch: Partial<StoreState> = {};
  if (state.currentSession !== null) patch.currentSession = null;
  if (state.currentMessages && state.currentMessages.length > 0) patch.currentMessages = [];
  if (Object.keys(patch).length > 0) setState(patch);
  try {
    const currentUrl = new URL(window.location.href);
    if (currentUrl.searchParams.get('session')) {
      currentUrl.searchParams.delete('session');
      const newUrl = `${currentUrl.pathname}${currentUrl.searchParams.toString() ? '?' + currentUrl.searchParams.toString() : ''}`;
      window.history.replaceState({}, '', newUrl);
    }
  } catch (err) {
    console.warn('chatSessionsStore.clearCurrentSession failed to remove session param', err);
  }
  try { setTimeout(() => { window.dispatchEvent(new CustomEvent('sessionCleared')); }, 0); } catch (e) { /* ignore */ }
}

export function clearAllSessions() {
  setState({ chatSessions: [], currentSession: null, currentMessages: [] });
}

export function setCurrentMessages(messages: ChatMessage[]) {
  // No-op when messages are effectively the same to avoid redundant notifications.
  const a = state.currentMessages || [];
  const b = messages || [];
  if (a === b) return;
  if (Array.isArray(a) && Array.isArray(b) && a.length === b.length) {
    let same = true;
    for (let i = 0; i < a.length; i++) {
      // Compare by id when available, fallback to shallow equality
      if ((a[i] && b[i] && ((a[i] as any).id !== (b[i] as any).id))) { same = false; break; }
      if (a[i] !== b[i]) { same = false; break; }
    }
    if (same) return;
  }
  setState({ currentMessages: messages });
}

// Selection helpers
export function toggleSessionSelection(sessionId: string) {
  const copy = new Set(state.selectedSessions);
  if (copy.has(sessionId)) copy.delete(sessionId); else copy.add(sessionId);
  setState({ selectedSessions: copy });
}

export function selectAllSessions() { setState({ selectedSessions: new Set(state.chatSessions.map(s => s.id)) }); }
export function deselectAllSessions() { setState({ selectedSessions: new Set<string>() }); }
export function isSessionSelected(sessionId: string) { return state.selectedSessions.has(sessionId); }
export function getSelectedSessionsCount() { return state.selectedSessions.size; }

export async function deleteSelectedSessions() {
  const sessionsToDelete = Array.from(state.selectedSessions);
  try {
    await Promise.all(sessionsToDelete.map(id => authenticatedFetch(buildApiUrl(`${API_CONFIG.ENDPOINTS.CHAT.SESSIONS}/${id}`), { method: 'DELETE' })));
    setState({ selectedSessions: new Set() });
    if (state.currentSession && sessionsToDelete.includes(state.currentSession.id)) setState({ currentSession: null, currentMessages: [] });
  } catch (err) {
    console.error('chatSessionsStore.deleteSelectedSessions', err);
  }
}
