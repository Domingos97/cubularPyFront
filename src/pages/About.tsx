import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import AdminSidebar from "@/components/AdminSidebar";
import UserSidebar from "@/components/UserSidebar";
import { useAuth } from "@/hooks/useAuth";
import UserNotificationsBell from "@/components/notifications/UserNotificationsBell";
import { useTranslation } from "@/resources/i18n";

const About = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
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
        {/* Simple Header for About Page */}
        <div className="sticky top-0 z-10 bg-gray-950 border-b border-gray-800/60">
          <div className="h-[50px] px-3 md:px-6">
            <div className="h-full flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 p-0 rounded-full text-gray-400 hover:text-white" 
                  onClick={toggleSidebar}
                >
                  <Menu className="h-5 w-5" />
                </Button>
                <h2 className="text-xl font-semibold text-white">
                  {t('about.pageTitle')}
                </h2>
              </div>
              
              <div className="flex items-center gap-2">
                {/* User Notifications Bell */}
                {user && (
                  <UserNotificationsBell />
                )}
                
                {/* Cubular logo */}
                <Button 
                  variant="ghost" 
                  className="h-8 p-1 rounded-md text-blue-500 hover:bg-gray-800 transition-colors" 
                  onClick={() => navigate('/')}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium text-gray-100">CUBULAR</span>
                  </div>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-auto bg-gray-900 p-6">
          <div className="max-w-4xl mx-auto">
            {/* Page Header */}
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-white mb-4">
                {t('about.title')}
              </h1>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                {t('about.subtitle')}
              </p>
            </div>

            {/* Mission Section */}
            <div className="bg-gray-800/50 rounded-lg p-8 mb-8">
              <h2 className="text-2xl font-semibold text-gray-100 mb-4">
                {t('about.mission.title')}
              </h2>
              <p className="text-gray-300 leading-relaxed mb-6">
                {t('about.mission.content')}
              </p>
            </div>

            {/* Team Section */}
            <div className="bg-gray-800/50 rounded-lg p-8 mb-8">
              <h2 className="text-2xl font-semibold text-gray-100 mb-4">
                {t('about.team.title')}
              </h2>
              <p className="text-gray-300 leading-relaxed">
                {t('about.team.content')}
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default About;