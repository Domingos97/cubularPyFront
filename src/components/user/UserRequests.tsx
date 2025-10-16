import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/resources/i18n';
import { authenticatedFetch, authenticatedApiRequest } from '@/utils/api';
import { buildApiUrl, API_CONFIG } from '@/config';
import { 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  FileText, 
  Plus, 
  Settings, 
  HelpCircle,
  RefreshCw
} from 'lucide-react';

interface UserNotification {
  id: string;
  user_id: string;
  type: 'survey_request' | 'feature_request' | 'support_request' | 'feedback' | 'other';
  title: string;
  message: string;
  status: 'pending' | 'in_progress' | 'resolved' | 'dismissed';
  priority: number;
  admin_response?: string;
  responded_by?: string;
  responded_at?: string;
  created_at: string;
  updated_at: string;
  metadata: Record<string, any>;
}

interface UserRequestsProps {
  userId: string;
}

const UserRequests = ({ userId }: UserRequestsProps) => {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState<string | null>(null);
  const [adminResponse, setAdminResponse] = useState('');
  const [newStatus, setNewStatus] = useState<string>('');
  const { toast } = useToast();

  const typeIcons = {
    survey_request: FileText,
    feature_request: Plus,
    support_request: Settings,
    feedback: MessageSquare,
    other: HelpCircle,
  };

  const statusColors = {
    pending: 'bg-yellow-500',
    in_progress: 'bg-blue-500',
    resolved: 'bg-green-500',
    dismissed: 'bg-gray-500',
  };

  const statusIcons = {
    pending: Clock,
    in_progress: AlertTriangle,
    resolved: CheckCircle,
    dismissed: XCircle,
  };

  const priorityColors = {
    1: 'border-gray-300',
    2: 'border-blue-300',
    3: 'border-yellow-300',
    4: 'border-orange-300',
    5: 'border-red-300',
  };

  useEffect(() => {
    fetchUserNotifications();
  }, [userId]);

  const fetchUserNotifications = async () => {
    try {
      setLoading(true);
      const data = await authenticatedApiRequest<UserNotification[]>(buildApiUrl(API_CONFIG.ENDPOINTS.NOTIFICATIONS.ADMIN.USER(userId) + '?limit=1000'));
      
      // No need to filter since the endpoint already returns notifications for the specific user
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching user notifications:', error);
      toast({
        title: t('admin.toast.error'),
        description: t('admin.userRequests.noRequests'),
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateNotification = async (notificationId: string) => {
    if (!adminResponse.trim() && !newStatus) {
      toast({
        title: 'No changes',
        description: 'Please add a response or change the status',
        variant: 'destructive'
      });
      return;
    }

    try {
      setResponding(notificationId);
      
      const updateData: any = {};
      if (newStatus) updateData.status = newStatus;
      if (adminResponse.trim()) updateData.admin_response = adminResponse.trim();

      const response = await authenticatedFetch(buildApiUrl(`${API_CONFIG.ENDPOINTS.NOTIFICATIONS.BASE}/${notificationId}`), {
        method: 'PUT',
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Notification updated successfully'
        });
        
        // Reset form state
        setAdminResponse('');
        setNewStatus('');
        setResponding(null);
        
        // Refresh notifications
        fetchUserNotifications();
      } else {
        throw new Error('Failed to update notification');
      }
    } catch (error) {
      console.error('Error updating notification:', error);
      toast({
        title: 'Error',
        description: 'Failed to update notification',
        variant: 'destructive'
      });
    } finally {
      setResponding(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            {t('admin.userRequests.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          {t('admin.userRequests.title')} ({notifications.length})
        </CardTitle>
        <CardDescription>
          {t('admin.userRequests.description')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {notifications.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>{t('admin.userRequests.noRequestsDescription')}</p>
          </div>
        ) : (
          notifications.map((notification) => {
            const TypeIcon = typeIcons[notification.type];
            const StatusIcon = statusIcons[notification.status];
            
            return (
              <div
                key={notification.id}
                className={`border rounded-lg p-4 space-y-3 ${priorityColors[notification.priority as keyof typeof priorityColors]}`}
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <TypeIcon className="w-5 h-5 text-gray-500 mt-1" />
                    <div>
                      <h4 className="font-semibold text-gray-900">{notification.title}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge 
                          className={`${statusColors[notification.status]} text-white text-xs`}
                        >
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {notification.status.replace('_', ' ')}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          Priority: {notification.priority}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatDate(notification.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Message */}
                <div className="bg-gray-50 rounded p-3">
                  <p className="text-sm text-gray-700">{notification.message}</p>
                </div>

                {/* Admin Response */}
                {notification.admin_response && (
                  <div className="bg-blue-50 border border-blue-200 rounded p-3">
                    <p className="text-sm font-medium text-blue-800 mb-1">Admin Response:</p>
                    <p className="text-sm text-blue-700">{notification.admin_response}</p>
                    {notification.responded_at && (
                      <p className="text-xs text-blue-600 mt-2">
                        Responded on {formatDate(notification.responded_at)}
                      </p>
                    )}
                  </div>
                )}

                {/* Response Form */}
                {notification.status !== 'resolved' && notification.status !== 'dismissed' && (
                  <div className="border-t pt-3 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1">
                          {t('admin.userRequests.status')}
                        </label>
                        <Select
                          value={responding === notification.id ? newStatus : notification.status}
                          onValueChange={(value) => {
                            setNewStatus(value);
                            if (responding !== notification.id) {
                              setResponding(notification.id);
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">{t('admin.userRequests.pending')}</SelectItem>
                            <SelectItem value="in_progress">{t('admin.userRequests.inProgress')}</SelectItem>
                            <SelectItem value="resolved">{t('admin.userRequests.resolved')}</SelectItem>
                            <SelectItem value="dismissed">{t('admin.userRequests.dismissed')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1">
                        {t('admin.userRequests.adminResponse')}
                      </label>
                      <Textarea
                        value={responding === notification.id ? adminResponse : ''}
                        onChange={(e) => {
                          setAdminResponse(e.target.value);
                          if (responding !== notification.id) {
                            setResponding(notification.id);
                          }
                        }}
                        placeholder={t('admin.userRequests.adminResponse')}
                        className="min-h-[80px]"
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleUpdateNotification(notification.id)}
                        disabled={responding === notification.id && !adminResponse.trim() && !newStatus}
                        size="sm"
                      >
                        {t('admin.userRequests.update')}
                      </Button>
                      {responding === notification.id && (
                        <Button
                          onClick={() => {
                            setResponding(null);
                            setAdminResponse('');
                            setNewStatus('');
                          }}
                          variant="outline"
                          size="sm"
                        >
                          {t('admin.userRequests.cancel')}
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}

        <Button
          onClick={fetchUserNotifications}
          variant="outline"
          size="sm"
          className="w-full"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          {t('admin.userRequests.refresh')}
        </Button>
      </CardContent>
    </Card>
  );
};

export default UserRequests;
