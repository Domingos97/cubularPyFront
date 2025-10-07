import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "@/components/AdminSidebar";
import UserSidebar from "@/components/UserSidebar";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/resources/i18n";
import { Button } from "@/components/ui/button";
import { X, User, CreditCard, Crown, Bell, Menu } from "lucide-react";
import { ProfileTab } from "@/components/settings/ProfileTab";
import { PlanTab } from "@/components/settings/PlanTab";
import { SubscriptionTab } from "@/components/settings/SubscriptionTab";
import { NotificationsTab } from "@/components/settings/NotificationsTab";
import UserNotificationsBell from "@/components/notifications/UserNotificationsBell";

type SettingsTab = 'profile' | 'notifications' | 'plan' | 'subscription';

const Settings = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const tabs = [
    {
      id: 'profile' as SettingsTab,
      label: t('settings.tabs.profile.label'),
      icon: User,
      description: t('settings.tabs.profile.description')
    },
    {
      id: 'notifications' as SettingsTab,
      label: t('settings.tabs.notifications.label'),
      icon: Bell,
      description: t('settings.tabs.notifications.description')
    },
    {
      id: 'plan' as SettingsTab,
      label: t('settings.tabs.plan.label'),
      icon: Crown,
      description: t('settings.tabs.plan.description')
    },
    {
      id: 'subscription' as SettingsTab,
      label: t('settings.tabs.subscription.label'),
      icon: CreditCard,
      description: t('settings.tabs.subscription.description')
    }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return <ProfileTab />;
      case 'notifications':
        return <NotificationsTab />;
      case 'plan':
        return <PlanTab />;
      case 'subscription':
        return <SubscriptionTab />;
      default:
        return <ProfileTab />;
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-950 font-grotesk text-[13px]">
      {user?.role === 'admin' ? (
        <AdminSidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />
      ) : (
        <UserSidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />
      )}
      
      <div className="main-container transition-all duration-300 md:ml-[208px] md:collapsed:ml-16 p-4 md:p-6">
        <div className="flex flex-col h-full max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-6 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 p-0 rounded-full text-gray-400 hover:text-white" 
                onClick={toggleSidebar}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-100">{t('settings.title')}</h1>
                <p className="text-gray-400">{t('settings.subtitle')}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* User Notifications Bell - Show for all logged-in users for debugging */}
              {user && (
                <UserNotificationsBell />
              )}
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleGoBack}
                className="h-8 w-8 p-0 rounded-full text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex gap-6">
            {/* Left Sidebar - Tab Navigation */}
            <div className="w-64 flex-shrink-0">
              <div className="bg-gray-900/40 backdrop-blur-sm rounded-lg border border-gray-800/60 p-1">
                <nav className="space-y-1">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center gap-3 px-3 py-3 text-left rounded-md transition-all duration-200 ${
                          activeTab === tab.id
                            ? 'bg-blue-600/20 text-blue-400 border border-blue-600/30'
                            : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                        }`}
                      >
                        <Icon className="h-5 w-5 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-sm">{tab.label}</div>
                          <div className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                            {tab.description}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>
            
            {/* Right Content Area */}
            <div className="flex-1 min-w-0">
              {renderTabContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;