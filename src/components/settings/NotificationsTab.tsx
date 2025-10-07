import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from '@/resources/i18n';
import { NotificationHistory } from '@/components/notifications/NotificationRequestModal';

export const NotificationsTab = () => {
  const { t } = useTranslation();
  
  return (
    <div className="space-y-6">
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">{t('settings.notifications.title')}</CardTitle>
          <CardDescription className="text-gray-400">
            {t('settings.notifications.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-300 text-sm mb-4">
            {t('settings.notifications.content')}
          </p>
        </CardContent>
      </Card>

      {/* Notification History Component */}
      <NotificationHistory />
    </div>
  );
};