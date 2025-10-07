import { useState } from "react";
import { Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSurveys } from "@/contexts/SurveyContext";
import { useTranslation } from "@/resources/i18n";
import { Button } from "../components/ui/button";
import AdminSidebar from "@/components/AdminSidebar";
import UserSidebar from "@/components/UserSidebar";
import EnhancedSurveyCard from "@/components/ui/EnhancedSurveyCard";
import UserNotificationsBell from "@/components/notifications/UserNotificationsBell";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { Survey } from "@/types/survey";

const SimplifiedIndex = () => {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { surveys: availableSurveys, isLoading: isLoadingSurveys, refreshSurveys } = useSurveys();
  const { t } = useTranslation();

  // Debug: Log user data and admin status - DETAILED
  console.log('🔍 INDEX PAGE DEBUG:', { 
    user: user, 
    userRole: user?.role, 
    isAdmin: isAdmin,
    roleCheck: user?.role === 'admin',
    userKeys: user ? Object.keys(user) : 'no user'
  });
  
  // Simple state management - only what's needed for survey selection
  const [selectedSurveys, setSelectedSurveys] = useState<Survey[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSurveyToggle = (survey: Survey) => {
    setSelectedSurveys(prev => {
      const exists = prev.some(s => s.id === survey.id);
      if (exists) {
        return prev.filter(s => s.id !== survey.id);
      } else {
        return [...prev, survey];
      }
    });
  };



  const handleAnalyzeSurveys = () => {
    if (selectedSurveys.length === 0) return;
    
    // Navigate immediately without generating suggestions (suggestions will be loaded in chat tab when needed)
    const categories = [...new Set(selectedSurveys.map(s => s.category))];
    const categoryText = categories.length === 1 ? categories[0] : `${categories.length} categories`;
    const searchTermText = `${categoryText} - ${selectedSurveys.length} survey${selectedSurveys.length > 1 ? 's' : ''}`;
    
    navigate('/survey-results', {
      state: {
        selectedSurveys,
        searchTerm: searchTermText,
        activeTab: 'audience' // Default to audience tab instead of 'stats'
      }
    });
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="min-h-screen gradient-background font-grotesk">
      {/* Sidebar */}
      {user && user.role === 'admin' ? (
        <AdminSidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />
      ) : (
        <UserSidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />
      )}
      
      {/* Main Content */}
      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 p-0 rounded-full text-gray-400 hover:text-white" 
            onClick={toggleSidebar}
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          {/* User Notifications Bell - Show for all logged-in users for now */}
          {user && (
            <div className="flex items-center gap-2">
              <LanguageSwitcher />
              <UserNotificationsBell />
              {/* Debug info */}
              {process.env.NODE_ENV === 'development' && (
                <div className="text-xs text-gray-500 absolute top-16 right-4">
                  User: {user.email}, Role: {user.role}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Survey Selection Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
          <div className="w-full max-w-4xl">
            <h1 className="text-3xl font-bold text-white/90 mb-4 text-center">
              {t('survey.availableSurveys')}
            </h1>
            <p className="text-xl text-white/70 mb-12 text-center max-w-2xl mx-auto">
              {t('survey.selectToAnalyze')}
            </p>
            
            {/* Survey Grid */}
            <div className="space-y-4 mb-8">
              {isLoadingSurveys ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white/90"></div>
                </div>
              ) : availableSurveys.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-white/60 mb-4">{t('survey.noSurveysAvailable')}</p>
                  <p className="text-white/40 text-sm">{t('survey.requestAccess')}</p>
                </div>
              ) : (
                availableSurveys.map((survey) => (
                  <EnhancedSurveyCard
                    key={survey.id}
                    survey={survey}
                    isSelected={selectedSurveys.some(s => s.id === survey.id)}
                    onToggle={handleSurveyToggle}
                  />
                ))
              )}
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {selectedSurveys.length > 0 && (
                <Button 
                  onClick={handleAnalyzeSurveys}
                  className="px-8 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg font-medium transition-all duration-150 hover:scale-105 active:scale-95"
                  size="lg"
                >
                  {t('survey.analyzeSurveys', { count: selectedSurveys.length }, selectedSurveys.length)}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimplifiedIndex;