import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import AppHeader from "@/components/AppHeader";
import AdminSidebar from "@/components/AdminSidebar";
import UserSidebar from "@/components/UserSidebar";
import { Survey } from "@/types/survey";
import { useTranslation } from "@/resources/i18n";

// New modular components
import { ChatComponent } from "@/components/survey-results/ChatComponent";
import { PreChatSetupModal } from "@/components/chat/PreChatSetupModal";

const SurveyResults = () => {
  // State management
  const [activeTab, setActiveTab] = useState<'chat'>('chat');
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPersonalityId, setSelectedPersonalityId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showPreChatModal, setShowPreChatModal] = useState(false);

  // Hooks
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  // Handler for sidebar personality selection
  const handleSidebarPersonalityChange = (personalityId: string) => {
    setSelectedPersonalityId(personalityId);
  };

  // Handle URL parameters for chat session loading
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const sessionId = urlParams.get('session');
    
    if (sessionId) {
      // Switch to chat tab when session ID is in URL
      setActiveTab('chat');
      console.log('SurveyResults: detected session ID in URL:', sessionId);
    }
  }, [location.search]);

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

  // Survey change handler
  const handleSurveyChange = async (survey: Survey) => {
    setIsLoading(true);
    
    // Clear any previous state
    setSelectedSurvey(survey);
    setSearchTerm(survey ? `${survey.category} - ${survey.filename || survey.id}` : '');
    
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
    setShowPreChatModal(true);
  };

  // Listen for custom event from ChatComponent to open new chat modal
  useEffect(() => {
    const handleOpenNewChatModal = () => {
      setShowPreChatModal(true);
    };

    window.addEventListener('openNewChatModal', handleOpenNewChatModal);
    return () => {
      window.removeEventListener('openNewChatModal', handleOpenNewChatModal);
    };
  }, []);

  const handleChatCreated = (sessionId: string, surveyId: string, selectedFiles: string[]) => {
    // Navigate to the new chat session with pre-selected survey and files
    navigate(`/survey-results?session=${sessionId}`, { 
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
        onOpenNewChatModal={() => setShowPreChatModal(true)}
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
      
      {/* Pre-Chat Setup Modal */}
      <PreChatSetupModal
        isOpen={showPreChatModal}
        onClose={() => setShowPreChatModal(false)}
        onChatCreated={handleChatCreated}
        initialSurvey={selectedSurvey}
        selectedPersonalityId={selectedPersonalityId}
      />
    </div>
  );
};

export default SurveyResults;