import React from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import UserSidebar from '@/components/UserSidebar';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/resources/i18n';
import { ProfileTab } from '@/components/settings/ProfileTab';

const Profile: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gray-950 font-grotesk text-[13px]">
      {user?.role === 'admin' ? (
        <AdminSidebar isOpen={false} />
      ) : (
        <UserSidebar isOpen={false} />
      )}

      <div className="main-container transition-all duration-300 md:ml-[208px] md:collapsed:ml-16 p-4 md:p-6">
        <div className="flex flex-col h-full max-w-6xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-100">{t('settings.tabs.profile.label')}</h1>
            <p className="text-gray-400 mt-1">{t('settings.tabs.profile.description')}</p>
          </div>

          <div>
            <ProfileTab />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
