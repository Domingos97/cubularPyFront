import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, Send, Clock, CheckCircle, XCircle, AlertTriangle, MessageSquare, Plus, FileText, Settings, HelpCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { NotificationType, NotificationStatus, CreateNotificationRequest, UserNotification } from '@/types/notifications';
import { authenticatedFetch } from '@/utils/api';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/resources/i18n';

interface NotificationRequestModalProps {
  onNotificationSent?: () => void;
}

const NotificationRequestModal = ({ onNotificationSent }: NotificationRequestModalProps) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateNotificationRequest>({
    type: 'survey_request',
    title: '',
    message: '',
    priority: 2,
  });

  const { toast } = useToast();
  const { user } = useAuth();

  const notificationTypes = [
    { value: 'survey_request', label: t('notifications.requestMoreSurveys'), icon: FileText, description: t('notifications.requestMoreSurveysDesc') },
    { value: 'feature_request', label: t('notifications.featureRequest'), icon: Plus, description: t('notifications.featureRequestDesc') },
    { value: 'support_request', label: t('notifications.technicalSupport'), icon: Settings, description: t('notifications.technicalSupportDesc') },
    { value: 'feedback', label: t('notifications.generalFeedback'), icon: MessageSquare, description: t('notifications.generalFeedbackDesc') },
    { value: 'other', label: t('notifications.other'), icon: HelpCircle, description: t('notifications.otherDesc') },
  ];

  const priorityLevels = [
    { value: 1, label: t('notifications.priority.low'), color: 'bg-gray-500' },
    { value: 2, label: t('notifications.priority.normal'), color: 'bg-blue-500' },
    { value: 3, label: t('notifications.priority.medium'), color: 'bg-yellow-500' },
    { value: 4, label: t('notifications.priority.high'), color: 'bg-orange-500' },
    { value: 5, label: t('notifications.priority.urgent'), color: 'bg-red-500' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: t('auth.authenticationRequired'),
        description: t('notifications.pleaseLoginToSend'),
        variant: 'destructive',
      });
      return;
    }

    if (!formData.title.trim() || !formData.message.trim()) {
      toast({
        title: t('form.validation.missingInformation'),
        description: t('form.validation.fillTitleAndMessage'),
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const response = await authenticatedFetch('http://localhost:3000/api/notifications', {
        method: 'POST',
        body: JSON.stringify({
          type: formData.type,
          title: formData.title.trim(),
          message: formData.message.trim(),
          priority: formData.priority,
          metadata: formData.metadata || {},
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send notification');
      }

      toast({
        title: 'Notification sent!',
        description: 'Your request has been sent to the administrators. You will receive a response soon.',
      });

      // Reset form
      setFormData({
        type: 'survey_request',
        title: '',
        message: '',
        priority: 2,
      });

      setOpen(false);
      onNotificationSent?.();

    } catch (error) {
      console.error('Error sending notification:', error);
      toast({
        title: t('notifications.failedToSend'),
        description: t('notifications.errorSendingRequest'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedType = notificationTypes.find(t => t.value === formData.type);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Bell className="w-4 h-4 mr-2" />
          {t('notifications.contactAdmin')}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl bg-gray-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white">{t('notifications.sendRequest')}</DialogTitle>
          <DialogDescription className="text-gray-300">
            {t('notifications.sendRequestDesc')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Notification Type Selection */}
          <div className="space-y-3">
            <Label className="text-white">{t('notifications.requestType')}</Label>
            <div className="grid grid-cols-1 gap-2">
              {notificationTypes.map((type) => {
                const Icon = type.icon;
                const isSelected = formData.type === type.value;
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, type: type.value as NotificationType })}
                    className={`flex items-start space-x-3 p-3 rounded-lg border-2 transition-colors text-left ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-600/20' 
                        : 'border-gray-600 hover:border-gray-500 bg-gray-800/50'
                    }`}
                  >
                    <Icon className={`w-5 h-5 mt-0.5 ${isSelected ? 'text-blue-400' : 'text-gray-400'}`} />
                    <div className="flex-1">
                      <div className={`font-medium ${isSelected ? 'text-blue-300' : 'text-white'}`}>
                        {type.label}
                      </div>
                      <div className="text-sm text-gray-400 mt-0.5">
                        {type.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Priority Level */}
          <div className="space-y-2">
            <Label className="text-white">{t('notifications.priorityLevel')}</Label>
            <Select value={formData.priority.toString()} onValueChange={(value) => setFormData({ ...formData, priority: parseInt(value) })}>
              <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {priorityLevels.map((level) => (
                  <SelectItem key={level.value} value={level.value.toString()}>
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${level.color}`} />
                      <span>{level.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-white">{t('form.label.title')} *</Label>
            <Input
              id="title"
              placeholder={
                formData.type === 'survey_request' 
                  ? t('notifications.titlePlaceholderSurvey')
                  : t('notifications.titlePlaceholder')
              }
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
              maxLength={200}
            />
            <div className="text-sm text-gray-400">{formData.title.length}/200 {t('form.characters')}</div>
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message" className="text-white">{t('form.label.message')} *</Label>
            <Textarea
              id="message"
              placeholder={
                formData.type === 'survey_request'
                  ? t('notifications.messagePlaceholderSurvey')
                  : t('notifications.messagePlaceholder')
              }
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 min-h-[120px]"
              maxLength={1000}
            />
            <div className="text-sm text-gray-400">{formData.message.length}/1000 {t('form.characters')}</div>
          </div>

          {/* Preview */}
          {(formData.title.trim() || formData.message.trim()) && (
            <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-4">
              <h4 className="text-white font-medium mb-2 flex items-center">
                {selectedType && <selectedType.icon className="w-4 h-4 mr-2" />}
                {t('notifications.preview')}
              </h4>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className="text-xs">
                    {selectedType?.label}
                  </Badge>
                  <div className={`w-2 h-2 rounded-full ${priorityLevels.find(p => p.value === formData.priority)?.color}`} />
                  <span className="text-xs text-gray-400">
                    {priorityLevels.find(p => p.value === formData.priority)?.label} {t('notifications.priority.label')}
                  </span>
                </div>
                {formData.title.trim() && (
                  <div className="text-white font-medium">{formData.title}</div>
                )}
                {formData.message.trim() && (
                  <div className="text-gray-300 text-sm whitespace-pre-wrap">{formData.message}</div>
                )}
              </div>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData.title.trim() || !formData.message.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                  {t('notifications.sending')}
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  {t('notifications.sendRequest')}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Component to show user's notification history
interface NotificationHistoryProps {
  className?: string;
}

export const NotificationHistory = ({ className = '' }: NotificationHistoryProps) => {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const loadNotifications = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const response = await authenticatedFetch('http://localhost:3000/api/notifications/my');
      
      if (!response.ok) {
        throw new Error('Failed to load notifications');
      }
      
      const result = await response.json();
      setNotifications(result.data || []);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadNotifications();
  }, [user]);

  const getStatusIcon = (status: NotificationStatus) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'in_progress': return <AlertTriangle className="w-4 h-4 text-blue-500" />;
      case 'resolved': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'dismissed': return <XCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: NotificationStatus) => {
    switch (status) {
      case 'pending': return 'bg-yellow-600/20 text-yellow-300 border-yellow-600/30';
      case 'in_progress': return 'bg-blue-600/20 text-blue-300 border-blue-600/30';
      case 'resolved': return 'bg-green-600/20 text-green-300 border-green-600/30';
      case 'dismissed': return 'bg-gray-600/20 text-gray-300 border-gray-600/30';
    }
  };

  if (loading) {
    return (
      <Card className={`bg-gray-800/50 border-gray-700 ${className}`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 animate-spin rounded-full border-2 border-blue-500/20 border-t-blue-500" />
            <span className="ml-3 text-gray-300">Loading notifications...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`bg-gray-800/50 border-gray-700 ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white">{t('notifications.yourRequests')}</CardTitle>
            <CardDescription className="text-gray-400">
              {t('notifications.trackStatus')}
            </CardDescription>
          </div>
          <NotificationRequestModal onNotificationSent={loadNotifications} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {notifications.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Bell className="w-12 h-12 mx-auto mb-4 text-gray-500" />
            <p className="text-lg font-medium">{t('notifications.noRequestsYet')}</p>
            <p className="text-sm">{t('notifications.sendFirstRequest')}</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="text-white font-medium">{notification.title}</h4>
                    <Badge className={`text-xs ${getStatusColor(notification.status)}`}>
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(notification.status)}
                        <span className="capitalize">{notification.status.replace('_', ' ')}</span>
                      </div>
                    </Badge>
                  </div>
                  <p className="text-gray-300 text-sm mb-2">{notification.message}</p>
                  
                  {notification.admin_response && (
                    <div className="bg-blue-900/20 border border-blue-600/30 rounded-lg p-3 mt-3">
                      <div className="flex items-center space-x-2 mb-1">
                        <MessageSquare className="w-4 h-4 text-blue-400" />
                        <span className="text-blue-300 font-medium text-sm">Admin Response</span>
                      </div>
                      <p className="text-blue-100 text-sm">{notification.admin_response}</p>
                      {notification.responded_at && (
                        <p className="text-blue-400 text-xs mt-1">
                          Responded on {new Date(notification.responded_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span className="capitalize">{notification.type.replace('_', ' ')}</span>
                <span>{new Date(notification.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default NotificationRequestModal;