import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { usePersonalities } from "@/hooks/usePersonalities";
import AppHeader from "@/components/AppHeader";
import AdminSidebar from "@/components/AdminSidebar";
import UserSidebar from "@/components/UserSidebar";
import { Survey } from "@/types/survey";
import { useTranslation } from "@/resources/i18n";
import { authenticatedFetch } from "@/utils/api";
import { API_CONFIG, buildApiUrl } from '@/config';

// New modular components
import { ChatComponent } from "@/components/survey-results/ChatComponent";

const Index = () => {
  // State management
  const [activeTab, setActiveTab] = useState<'chat'>('chat');
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPersonalityId, setSelectedPersonalityId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // No modal: we now start chats directly from the UI

  // Track loading sessions to prevent duplicates
  const loadingSessionsRef = useRef<Set<string>>(new Set());

  // Hooks
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  
  // Get user's preferred personality
  const { selectedPersonality: userPreferredPersonality } = usePersonalities('ai_chat_integration');

  // Handler for sidebar personality selection
  const handleSidebarPersonalityChange = (personalityId: string) => {
    setSelectedPersonalityId(personalityId);
  };

  // Handle URL parameters for chat session loading and survey restoration
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const sessionId = urlParams.get('session');
    
    if (sessionId && !loadingSessionsRef.current.has(sessionId)) {
      // Switch to chat tab when session ID is in URL
      setActiveTab('chat');
      console.log('SurveyResults: detected session ID in URL:', sessionId);
      
      // Add to loading set to prevent duplicates
      loadingSessionsRef.current.add(sessionId);
      
      // Load session to get survey information and restore survey selection
      const loadSessionForSurvey = async () => {
        try {
          setIsLoading(true);
          const response = await authenticatedFetch(buildApiUrl(API_CONFIG.ENDPOINTS.CHAT.SESSION_DETAILS(sessionId)));
          if (response.ok) {
            const sessionData = await response.json();
            console.log('SurveyResults: loaded session data for survey restoration:', sessionData);
            
            // Extract survey_id from session and load the survey
            if (sessionData.survey_ids && sessionData.survey_ids.length > 0) {
              const surveyId = sessionData.survey_ids[0];
              console.log('SurveyResults: restoring survey from session:', surveyId);
              
              const surveyResponse = await authenticatedFetch(buildApiUrl(API_CONFIG.ENDPOINTS.SURVEYS.DETAILS(surveyId)));
              if (surveyResponse.ok) {
                const surveyData = await surveyResponse.json();
                console.log('SurveyResults: restored survey data:', surveyData);
                setSelectedSurvey(surveyData);
                setSearchTerm(`${surveyData.category} - ${surveyData.filename || surveyData.id}`);
              } else {
                console.warn(`SurveyResults: Failed to load survey ${surveyId}, status: ${surveyResponse.status}. User may not have access.`);
                // Don't set survey if we can't access it
              }
            }
          } else {
            console.warn('SurveyResults: Session not found, clearing URL parameters');
            // Clear URL parameter when session is not found to prevent infinite loops
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.delete('session');
            window.history.replaceState({}, '', newUrl.toString());
          }
        } catch (error) {
          console.error('SurveyResults: Error loading session for survey restoration:', error);
          // Clear URL parameter on error to prevent infinite loops
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.delete('session');
          window.history.replaceState({}, '', newUrl.toString());
        } finally {
          setIsLoading(false);
          // Remove from loading set
          loadingSessionsRef.current.delete(sessionId);
        }
      };
      
      // Only load if we don't already have a selected survey
      if (!selectedSurvey) {
        loadSessionForSurvey();
      } else {
        // If we already have a survey, still remove from loading set
        loadingSessionsRef.current.delete(sessionId);
      }
    }
  }, [location.search, selectedSurvey]);

  // Ensure default tab is selected on mount
  useEffect(() => {
    // Always ensure we have a default tab selected
    if (!activeTab) {
      setActiveTab('chat');
    }
  }, [activeTab]);

  // Load initial state from navigation
  useEffect(() => {
    const state = location.state as any;
    if (state) {
      if (state.searchTerm) setSearchTerm(state.searchTerm);
      if (state.selectedSurvey) setSelectedSurvey(state.selectedSurvey);
      if (state.activeTab) setActiveTab(state.activeTab);
      
      // Handle selectedSurveys array from Index page - auto-select first survey
      if (state.selectedSurveys && Array.isArray(state.selectedSurveys) && state.selectedSurveys.length > 0) {
        const firstSurvey = state.selectedSurveys[0];
        setSelectedSurvey(firstSurvey);
        setSearchTerm(`${firstSurvey.category} - ${firstSurvey.filename || firstSurvey.id}`);
      }
    }
  }, [location.state]);

  // Initialize selectedPersonalityId with user's preferred personality
  useEffect(() => {
    if (!selectedPersonalityId && userPreferredPersonality) {
      console.log('SurveyResults: Setting user preferred personality:', userPreferredPersonality.id);
      setSelectedPersonalityId(userPreferredPersonality.id);
    }
  }, [userPreferredPersonality, selectedPersonalityId]);

  // Survey change handler
  const handleSurveyChange = async (survey: Survey) => {
    setIsLoading(true);
    
    // Clear any previous state
    setSelectedSurvey(survey);
    setSearchTerm(survey ? `${survey.category} - ${survey.filename || survey.id}` : '');
    // If there's no active session in the URL, trigger the new-chat flow so
    // the ChatComponent displays the suggestion messages for the selected survey.
    try {
      const urlParams = new URLSearchParams(window.location.search);
      if (!urlParams.get('session')) {
        // Defer dispatching the global `startNewChat` event to the next
        // tick so that the parent state update for `selectedSurvey` has
        // a chance to propagate to child components. Include the surveyId
        // in the event detail so listeners can load suggestions immediately
        // even if props haven't propagated yet.
        setTimeout(() => {
          try {
            window.dispatchEvent(new CustomEvent('startNewChat', { detail: { surveyId: survey?.id } }));
          } catch (e) {
            // Fallback to simple dispatch if CustomEvent can't be constructed
            window.dispatchEvent(new CustomEvent('startNewChat'));
          }
        }, 0);
      }
    } catch (err) {
      console.warn('Index: Failed to dispatch startNewChat event', err);
    }

    setIsLoading(false);
  };

  const handleResetSearch = () => {
    navigate('/', {
      state: {
        resetSearch: true
      }
    });
  };

  const handleTabChange = (tab: 'chat') => {
    // Immediate tab change for better UX
    if (tab !== activeTab) {
      setActiveTab(tab);
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleNewChat = () => {
    // Ensure any session query param is removed synchronously so components don't auto-load it again
    try {
      const currentUrl = new URL(window.location.href);
      if (currentUrl.searchParams.get('session')) {
        currentUrl.searchParams.delete('session');
        const newUrl = `${currentUrl.pathname}${currentUrl.searchParams.toString() ? '?' + currentUrl.searchParams.toString() : ''}`;
        // Synchronously replace browser URL to avoid race with listeners reading location.search
        window.history.replaceState({}, '', newUrl);
      }
    } catch (err) {
      console.warn('Failed to remove session param from URL synchronously', err);
    }

    // Dispatch a global event that chat components listen to and will clear/create session on first message
    window.dispatchEvent(new CustomEvent('startNewChat'));
  };

  const handleChatCreated = (sessionId: string, surveyId: string, selectedFiles: string[]) => {
    // Navigate to the new chat session with pre-selected survey and files
    navigate(`/?session=${sessionId}`, { 
      state: {
        selectedSurvey: selectedSurvey,
        preloadedFiles: selectedFiles,
        surveyId: surveyId
      }
    });
  };

  const renderTabContent = () => {
    return (
      <ChatComponent
        selectedSurvey={selectedSurvey}
        selectedPersonalityId={selectedPersonalityId}
        onSurveyChange={handleSurveyChange}
        onPersonalityChange={setSelectedPersonalityId}
        onOpenNewChatModal={handleNewChat}
      />
    );
  };

  return (
    <div className="flex h-screen bg-gray-900">
      {/* Sidebar */}
      {user?.role === 'admin' ? (
        <AdminSidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />
      ) : (
        <UserSidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <AppHeader 
          searchTerm={searchTerm}
          currentTab='chat'
          onResetSearch={handleResetSearch}
          onToggleSidebar={toggleSidebar}
          onNewChat={handleNewChat}
        />
        
        {/* Main Content */}
        <main className="flex-1 overflow-hidden bg-gray-900">
          <div className="h-full flex flex-col">
            {/* Enhanced Tab Content Area */}
            <div className="flex-1 overflow-hidden relative">
              {isLoading ? (
                <div className="flex items-center justify-center h-full bg-gray-900">
                  <div className="text-center p-8">
                    <div className="relative">
                      <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-600 border-t-blue-500 mx-auto mb-4"></div>
                      <div className="absolute inset-0 rounded-full h-12 w-12 border-2 border-gray-700 mx-auto animate-pulse"></div>
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">{t('surveyResults.loading.title')}</h3>
                    <p className="text-gray-400">{t('surveyResults.loading.subtitle')}</p>
                  </div>
                </div>
              ) : (
                <div 
                  key={activeTab} 
                  className="h-full transition-all duration-300 ease-in-out animate-fade-in"
                >
                  {renderTabContent()}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
      
      {/* Pre-chat modal removed — chat is started directly. Components listen for 'startNewChat' events. */}
    </div>
  );
};

export default Index;
