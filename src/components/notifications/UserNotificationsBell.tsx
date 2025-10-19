import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { Bell, X, MessageSquare, Clock, CheckCircle, XCircle, AlertTriangle, RefreshCw, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { authenticatedFetch, markNotificationAsRead, getUnreadNotificationCount } from '@/utils/api';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/resources/i18n';
import { useNavigate } from 'react-router-dom';
import { buildApiUrl, API_CONFIG } from '@/config';

interface UserNotification {
  id: string;
  user_id: string;
  type: 'survey_request' | 'feature_request' | 'support_request' | 'feedback' | 'other';
  title: string;
  message: string;
  status: 'pending' | 'in_progress' | 'resolved' | 'dismissed';
  priority: number;
  is_read: boolean;
  admin_response?: string;
  responded_by?: string;
  responded_at?: string;
  created_at: string;
  updated_at: string;
  metadata: Record<string, any>;
}

const UserNotificationsBell = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

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
    if (user?.id) {
      // Only fetch notifications once when user is available
      fetchUserNotifications();
      
      // Set up polling for real-time updates every 60 seconds (less frequent for users)
      // Only set up interval if user has an ID (fully loaded user object)
      const interval = setInterval(() => {
        // Double-check user is still available before fetching
        if (user?.id) {
          fetchUserNotifications();
        }
      }, 60000);
      
      return () => clearInterval(interval);
    }
  }, [user?.id]); // Remove fetchUserNotifications dependency to prevent circular dependency

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchUserNotifications = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
  const response = await authenticatedFetch(buildApiUrl(API_CONFIG.ENDPOINTS.NOTIFICATIONS.MY + '/?limit=50'));
      
      if (response.ok) {
        const data = await response.json();
        const userNotifications = data.data || [];
        
        // Filter to show notifications that have admin responses or are resolved
        const relevantNotifications = userNotifications.filter((n: UserNotification) => 
          n.admin_response || n.status === 'resolved' || n.status === 'in_progress'
        );
        
        setNotifications(relevantNotifications);
        
        // Use the unread_count from the API response
        setUnreadCount(data.unread_count || 0);
        
      } else if (response.status === 404) {
        // Handle case where notification endpoint doesn't exist or user has no notifications
        setNotifications([]);
        setUnreadCount(0);
      } else {
        throw new Error(`Failed to fetch notifications: ${response.status}`);
      }
    } catch (error) {
      // Don't show toast error for background polling - only when user explicitly opens notifications
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
  }, [user?.id, isOpen, toast, t]);

  const markAllNotificationsAsRead = useCallback(async () => {
    if (!user?.id || unreadCount === 0) return;
    
    try {
      const response = await authenticatedFetch(buildApiUrl(API_CONFIG.ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (response.ok) {
        // Update local state immediately
        setNotifications(prev => 
          prev.map(n => ({ ...n, is_read: true }))
        );
        setUnreadCount(0);
        
        console.log('All notifications marked as read');
      } else {
        throw new Error(`Failed to mark notifications as read: ${response.status}`);
      }
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      // Don't show toast error for automatic operations
    }
  }, [user?.id, unreadCount]);

  const handleBellClick = useCallback(async () => {
    const wasOpen = isOpen;
    setIsOpen(!isOpen);
    
    if (!wasOpen) {
      // Bell is being opened - fetch notifications first
      await fetchUserNotifications();
      
      // Then mark all as read if there are unread notifications
      if (unreadCount > 0) {
        await markAllNotificationsAsRead();
      }
    }
  }, [isOpen, fetchUserNotifications, markAllNotificationsAsRead, unreadCount]);

  const handleNotificationClick = async (notification: UserNotification) => {
    try {
      // Mark notification as read if it's not already read
      if (!notification.is_read) {
        await markNotificationAsRead(notification.id);
        
        // Update the local state to reflect the change
        setNotifications(prev => 
          prev.map(n => 
            n.id === notification.id 
              ? { ...n, is_read: true }
              : n
          )
        );
        
        // Update unread count
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
      // Close the dropdown
      setIsOpen(false);
      
      // Navigate to settings with notifications tab active
      navigate('/settings?tab=notifications');
      
    } catch (error) {
      toast({
        title: t('notifications.error'),
        description: t('notifications.failedToMarkAsRead', { message: error instanceof Error ? error.message : t('notifications.unknownError') }),
        variant: 'destructive'
      });
    }
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

  if (!user?.id) {
    return null; // Don't render if user is not properly loaded
  }

  // Only log when user data changes, not on every render
  if (user.email) {
    console.log('UserNotificationsBell: Rendering for user:', user.email, 'Role:', user.role);
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon */}
      <Button
        variant="ghost"
        size="icon"
        onClick={handleBellClick}
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
        <div className="absolute right-0 mt-2 w-80 z-50">
          <Card className="bg-gray-800 border border-gray-700 shadow-2xl">
            <CardHeader className="pb-3 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-white">{t('notifications.myNotifications')}</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs border-gray-600 text-gray-300">
                    {unreadCount} {t('notifications.new')}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={fetchUserNotifications}
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
                {t('notifications.updatesFromAdmin')}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-80">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400"></div>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                    <MessageSquare className="w-16 h-16 mb-4 opacity-30" />
                    <p className="text-sm font-medium text-gray-300">{t('notifications.noNotificationsYet')}</p>
                    <p className="text-xs text-gray-500 mb-6">{t('notifications.adminResponsesWillAppear')}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={fetchUserNotifications}
                      disabled={loading}
                      className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      {t('notifications.checkForUpdates')}
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
                          className={`p-4 hover:bg-gray-700/50 cursor-pointer transition-all duration-200 ${
                            !notification.is_read ? 'bg-blue-900/10 border-l-2 border-blue-500' : ''
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            {/* Status indicator with read/unread styling */}
                            <div className={`w-3 h-3 rounded-full mt-1.5 ${statusColors[notification.status]} shadow-lg ${
                              !notification.is_read ? 'ring-2 ring-blue-400/50' : ''
                            }`} />
                            
                            <div className="flex-1 min-w-0">
                              {/* Header */}
                              <div className="flex items-start justify-between mb-2">
                                <h4 className={`text-sm font-semibold truncate leading-tight ${
                                  !notification.is_read ? 'text-white' : 'text-gray-300'
                                }`}>
                                  {notification.title}
                                  {!notification.is_read && (
                                    <span className="ml-2 w-2 h-2 bg-blue-400 rounded-full inline-block"></span>
                                  )}
                                </h4>
                                <div className="flex items-center gap-1 ml-2">
                                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${priorityColors[notification.priority as keyof typeof priorityColors]} bg-gray-700`}>
                                    P{notification.priority}
                                  </span>
                                </div>
                              </div>
                              
                              {/* Request type */}
                              <div className="flex items-center gap-2 mb-3">
                                <Badge 
                                  variant="outline" 
                                  className="text-xs px-2 py-0.5 border-gray-600 text-gray-400 bg-gray-800"
                                >
                                  {notification.type.replace('_', ' ')}
                                </Badge>
                                <StatusIcon className="w-3 h-3 text-gray-500" />
                                <span className="text-xs text-gray-500 capitalize font-medium">
                                  {notification.status.replace('_', ' ')}
                                </span>
                              </div>
                              
                              {/* Original message */}
                              <p className="text-xs text-gray-400 mb-3 leading-relaxed">
                                <span className="font-medium text-gray-300">{t('notifications.yourRequest')}: </span>
                                {truncateMessage(notification.message)}
                              </p>
                              
                              {/* Admin response */}
                              {notification.admin_response && (
                                <div className="bg-blue-900/30 border border-blue-800/50 rounded-lg p-3 mb-3">
                                  <p className="text-xs font-medium text-blue-300 mb-1 flex items-center gap-1">
                                    <User className="w-3 h-3" />
                                    {t('notifications.adminResponse')}:
                                  </p>
                                  <p className="text-xs text-blue-100 leading-relaxed">
                                    {notification.admin_response}
                                  </p>
                                  {notification.responded_at && (
                                    <p className="text-xs text-blue-400 mt-2">
                                      {t('notifications.responded')} {formatDate(notification.responded_at)}
                                    </p>
                                  )}
                                </div>
                              )}
                              
                              {/* Footer */}
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500">
                                  {t('notifications.submitted')} {formatDate(notification.created_at)}
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
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default memo(UserNotificationsBell);
