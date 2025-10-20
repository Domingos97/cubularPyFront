import React from 'react';
import { AIPersonalityManager } from '@/components/admin/AIPersonalityManager';
import { useTranslation } from '@/resources/i18n';

const Personalization = () => {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="w-full">
        <h1 className="text-3xl font-bold text-white mb-4">{t('navigation.personalization')}</h1>
        <AIPersonalityManager />
      </div>
    </div>
  );
};

export default Personalization;
