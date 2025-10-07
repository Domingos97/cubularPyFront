
/*
COMMENTED OUT - UNUSED BACKUP FILE
=====================================
This is a backup version of Settings.tsx that is not used anywhere in the application.
The main Settings.tsx file is used instead. This file can be safely removed.

Commented out on: October 7, 2025
Reason: Identified as unused backup file in frontend code analysis

Original file content has been commented out below:

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "@/components/AdminSidebar";
import UserSidebar from "@/components/UserSidebar";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { X, User, CreditCard, Crown, Bell } from "lucide-react";
import { ProfileTab } from "@/components/settings/ProfileTab";
import { PlanTab } from "@/components/settings/PlanTab";
import { SubscriptionTab } from "@/components/settings/SubscriptionTab";
import { NotificationsTab } from "@/components/settings/NotificationsTab";
import UserNotificationsBell from "@/components/notifications/UserNotificationsBell";

type SettingsTab = 'profile' | 'notifications' | 'plan' | 'subscription';

const Settings = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const handleGoBack = () => {
    navigate(-1);
  };

  const tabs = [
    {
      id: 'profile' as SettingsTab,
      label: 'Profile',
      icon: User,
      description: 'Personal information and account details'
    },
    {
      id: 'notifications' as SettingsTab,
      label: 'Notifications',
      icon: Bell,
      description: 'Survey requests and communication with admins'
    },
    {
      id: 'plan' as SettingsTab,
      label: 'Plan',
      icon: Crown,
      description: 'Subscription plans and usage'
    },
    {
      id: 'subscription' as SettingsTab,
      label: 'Subscription',
      icon: CreditCard,
      description: 'Billing and payment information'
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
      {user?.role === 'admin' ? <AdminSidebar /> : <UserSidebar />}
      
      <div className="main-container transition-all duration-300 md:ml-[208px] md:collapsed:ml-16 p-4 md:p-6">
        <div className="flex flex-col h-full max-w-6xl mx-auto">
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-100">Settings</h1>
              <p className="text-gray-400">Manage your account settings and preferences.</p>
            </div>
            <div className="flex items-center gap-2">
              {user && (
                <UserNotificationsBell />
              )}
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleGoBack}
                className="h-8 w-8 rounded-full text-gray-400 hover:text-white hover:bg-gray-800"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="lg:w-64 flex-shrink-0">
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-2">
                <nav className="space-y-1">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                          isActive
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

END OF COMMENTED CODE
*/

// This file has been commented out as it's an unused backup file.
// The main Settings.tsx file should be used instead.
export {};
