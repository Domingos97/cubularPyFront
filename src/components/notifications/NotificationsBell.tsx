import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, MessageSquare, Clock, CheckCircle, XCircle, AlertTriangle, Eye, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { authenticatedApiRequest } from '@/utils/api';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/resources/i18n';
import { buildApiUrl, API_CONFIG } from '@/config';

interface NotificationWithUser {
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
  username?: string;
  user_email?: string;
}

const NotificationsBell = () => {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState<NotificationWithUser[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const statusColors = {
    pending: 'bg-yellow-400 shadow-yellow-400/50',
    in_progress: 'bg-blue-400 shadow-blue-400/50',
    resolved: 'bg-green-400 shadow-green-400/50',
    dismissed: 'bg-gray-400 shadow-gray-400/50',
  };

  const statusIcons = {
    pending: Clock,
    in_progress: AlertTriangle,
    resolved: CheckCircle,
    dismissed: XCircle,
  };

  const priorityColors = {
    1: 'text-gray-400',
    2: 'text-blue-400',
    3: 'text-yellow-400',
    4: 'text-orange-400',
    5: 'text-red-400',
  };

  useEffect(() => {
    fetchNotifications();
    
    // Set up polling for real-time updates every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await authenticatedApiRequest<{data: NotificationWithUser[]}>(buildApiUrl(API_CONFIG.ENDPOINTS.NOTIFICATIONS.ADMIN.ALL + '?limit=100'));
      
      const allNotifications = data.data || [];
      
      // Filter to show only active notifications (pending and in_progress)
      const activeNotifications = allNotifications.filter((n: NotificationWithUser) => 
        n.status === 'pending' || n.status === 'in_progress'
      );
      
      setNotifications(activeNotifications);
      setUnreadCount(allNotifications.filter((n: NotificationWithUser) => n.status === 'pending').length);
    } catch (error) {
      if (isOpen) {
        toast({
          title: t('notifications.error'),
          description: t('notifications.failedToLoadNotifications', { message: error instanceof Error ? error.message : t('notifications.unknownError') }),
          variant: 'destructive'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = (notification: NotificationWithUser) => {
    // Navigate to admin user edit page to view/respond to the notification
    navigate(`/admin/users/${notification.user_id}/edit?tab=requests`);
    setIsOpen(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return diffMins < 1 ? t('notifications.time.justNow') : t('notifications.time.minutesAgo', { count: diffMins });
    } else if (diffHours < 24) {
      return t('notifications.time.hoursAgo', { count: diffHours });
    } else if (diffDays === 1) {
      return t('notifications.time.yesterday');
    } else if (diffDays < 7) {
      return t('notifications.time.daysAgo', { count: diffDays });
    } else {
      return date.toLocaleDateString();
    }
  };

  const truncateMessage = (message: string, maxLength: number = 100) => {
    return message.length > maxLength ? message.substring(0, maxLength) + '...' : message;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) {
            fetchNotifications();
          }
        }}
        className="relative hover:bg-gray-700"
      >
        <Bell className="w-5 h-5 text-gray-300" />
        {unreadCount > 0 && (
          <Badge 
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-red-500 text-white text-xs"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Notifications Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 z-50">
          <Card className="bg-gray-800 border border-gray-700 shadow-2xl">
            <CardHeader className="pb-3 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-white">{t('notifications.title')}</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs border-gray-600 text-gray-300">
                    {unreadCount} {t('notifications.pending')}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={fetchNotifications}
                    disabled={loading}
                    className="h-6 w-6 hover:bg-gray-700 text-gray-300 hover:text-white"
                    title={t('notifications.refreshNotifications')}
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsOpen(false)}
                    className="h-6 w-6 hover:bg-gray-700 text-gray-300 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <CardDescription className="text-gray-400">
                {t('notifications.latestUserRequests')}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-96">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400"></div>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                    <Bell className="w-16 h-16 mb-4 opacity-30" />
                    <p className="text-sm font-medium text-gray-300">{t('notifications.noActiveNotifications')}</p>
                    <p className="text-xs text-gray-500 mb-6">{t('notifications.allCaughtUp')}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={fetchNotifications}
                      disabled={loading}
                      className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Refresh
                    </Button>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-700">
                    {notifications.map((notification) => {
                      const StatusIcon = statusIcons[notification.status];
                      
                      return (
                        <div
                          key={notification.id}
                          onClick={() => handleNotificationClick(notification)}
                          className="p-4 hover:bg-gray-700/50 cursor-pointer transition-all duration-200 hover:shadow-lg"
                        >
                          <div className="flex items-start gap-3">
                            {/* Enhanced status indicator */}
                            <div className={`w-3 h-3 rounded-full mt-1.5 ${statusColors[notification.status]} shadow-lg`} />
                            
                            <div className="flex-1 min-w-0">
                              {/* Header with better spacing */}
                              <div className="flex items-start justify-between mb-2">
                                <h4 className="text-sm font-semibold text-white truncate leading-tight">
                                  {notification.title}
                                </h4>
                                <div className="flex items-center gap-1 ml-2">
                                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${priorityColors[notification.priority as keyof typeof priorityColors]} bg-gray-700`}>
                                    P{notification.priority}
                                  </span>
                                </div>
                              </div>
                              
                              {/* User info with better styling */}
                              <div className="flex items-center gap-2 mb-3">
                                <span className="text-xs text-gray-300 font-medium">
                                  {notification.username || notification.user_email || 'Unknown User'}
                                </span>
                                <Badge 
                                  variant="outline" 
                                  className="text-xs px-2 py-0.5 border-gray-600 text-gray-400 bg-gray-800"
                                >
                                  {notification.type.replace('_', ' ')}
                                </Badge>
                              </div>
                              
                              {/* Message preview with better typography */}
                              <p className="text-xs text-gray-400 mb-3 leading-relaxed">
                                {truncateMessage(notification.message)}
                              </p>
                              
                              {/* Footer with improved layout */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <StatusIcon className="w-3 h-3 text-gray-500" />
                                  <span className="text-xs text-gray-500 capitalize font-medium">
                                    {notification.status.replace('_', ' ')}
                                  </span>
                                </div>
                                <span className="text-xs text-gray-500">
                                  {formatDate(notification.created_at)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
              
              {/* Footer */}
              {notifications.length > 0 && (
                <div className="p-4 border-t border-gray-700 bg-gray-800/50">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/admin')}
                    className="w-full border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white hover:border-gray-500 transition-all"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    {t('common.viewAllInAdmin')}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default NotificationsBell;
