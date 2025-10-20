import React from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import UserSidebar from '@/components/UserSidebar';
import AppHeader from '@/components/AppHeader';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/resources/i18n';
import { NotificationsTab } from '@/components/settings/NotificationsTab';

const Contact: React.FC = () => {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen(s => !s);
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gray-950 font-grotesk text-[13px]">
      {user?.role === 'admin' ? (
        <AdminSidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />
      ) : (
        <UserSidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />
      )}

      <AppHeader onToggleSidebar={toggleSidebar} />

      <div className="main-container transition-all duration-300 md:ml-[208px] md:collapsed:ml-16 p-4 md:p-6">
        <div className="flex flex-col h-full max-w-6xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-100">{t('navigation.contactUs')}</h1>
            <p className="text-gray-400 mt-1">{t('contact.subtitle') || 'Support and contact options'}</p>
          </div>

          <div className="space-y-6">
            <NotificationsTab />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
