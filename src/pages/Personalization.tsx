import React, { useState } from 'react';
import AppHeader from '@/components/AppHeader';
import AdminSidebar from '@/components/AdminSidebar';
import UserSidebar from '@/components/UserSidebar';
import { AIPersonalityManager } from '@/components/admin/AIPersonalityManager';
import { UserAIPersonalityManager } from '@/components/personal/UserAIPersonalityManager';
import GlassCard from '@/components/ui/GlassCard';
import { useTranslation } from '@/resources/i18n';
import { useAuth } from '@/hooks/useAuth';

const Personalization = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen(s => !s);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      {user?.role === 'admin' ? (
        <AdminSidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />
      ) : (
        <UserSidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />
      )}

  <AppHeader onToggleSidebar={toggleSidebar} large />

      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">{t('navigation.personalization')}</h1>
          <p className="text-lg text-gray-300 max-w-3xl mx-auto">{t('personalization.subtitle') || 'Customize AI personalities and behavior for your workspace.'}</p>
        </div>

        <GlassCard title={t('personalization.managerTitle') || ''} className="mb-8">
            <UserAIPersonalityManager />
        </GlassCard>
      </div>
    </div>
  );
};

export default Personalization;
