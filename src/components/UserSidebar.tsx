import { useState, useEffect } from 'react';
import { Info, Settings, MessageCircle, X, LogOut, Database, Brain, Mail } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { SidebarHeader } from './sidebar/SidebarHeader';
import { NavigationMenu } from './sidebar/NavigationMenu';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/resources/i18n';
import { Button } from './ui/button';
import { MenuItem } from '@/types/sidebar';
import LanguageSwitcher from './LanguageSwitcher';

const UserSidebar = ({
  isOpen = false,
  onToggle
}: {
  isOpen?: boolean;
  onToggle?: () => void;
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(isOpen);
  const mobileInfo = useIsMobile();
  const isMobile = mobileInfo.isMobile;
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { t } = useTranslation();

  useEffect(() => {
    setSidebarOpen(isOpen);
  }, [isOpen]);

  const handleLogout = async () => {
    try {
      await logout();
      if (isMobile && onToggle) {
        onToggle();
      }
    } catch (error) {
      console.error('Logout failed:', error);
      navigate('/auth');
      if (isMobile && onToggle) {
        onToggle();
      }
    }
  };

  const menuItems: MenuItem[] = [
    {
      title: t('navigation.aboutUs'),
      icon: <Info className="w-4 h-4" />,
      path: "/about"
    }, 
    {
      title: t('navigation.contactUs'),
      icon: <Mail className="w-4 h-4" />,
      path: "/contact"
    },
    {
      title: t('navigation.personalization'),
      icon: <Brain className="w-4 h-4" />,
      path: "/personalization"
    },
    {
      title: t('navigation.profile'),
      icon: <Settings className="w-4 h-4" />,
      path: "/profile"
    }
  ];

  if (!sidebarOpen) return null;
  
  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-[100]" 
        onClick={onToggle}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full bg-gray-900 shadow-lg transition-all duration-300 z-[101] w-64 md:w-72">
        <div className="p-6 flex flex-col h-full">
          {/* Header with close button */}
          <div className="flex items-center justify-between mb-8">
            <SidebarHeader isOpen={true} isMobile={isMobile} onToggle={onToggle} />
            
            <div className="flex items-center gap-2">
              <LanguageSwitcher />
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={onToggle} 
                className="h-8 w-8 p-0 rounded-full text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Navigation Menu */}
          <div className="flex-1 flex flex-col">
            <NavigationMenu items={menuItems} isOpen={true} isMobile={isMobile} onMobileItemClick={onToggle} />
            
            {/* Logout button */}
            <Button 
              variant="ghost" 
              size="sm"
              className="w-full flex items-center justify-start text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg px-3 py-3 mt-4 transition-colors"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-3" />
              <span className="text-sm">{t('navigation.logout')}</span>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default UserSidebar;