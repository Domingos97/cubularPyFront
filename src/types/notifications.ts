// Types for user notifications system

export type NotificationType = 'survey_request' | 'feature_request' | 'support_request' | 'feedback' | 'other';

export type NotificationStatus = 'pending' | 'in_progress' | 'resolved' | 'dismissed';

// Admin response interface for hierarchical notifications
export interface AdminResponse {
  id: string;
  notification_id: string;
  admin_id: string;
  admin_name?: string;
  response_message: string;
  response_type: 'reply' | 'status_update' | 'resolution';
  parent_response_id?: string; // For threaded responses
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
}

export interface UserNotification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  status: NotificationStatus;
  priority: number; // 1-5, where 5 is highest priority
  is_read: boolean; // Whether the notification has been read by the user
  admin_response?: string; // Legacy field for backward compatibility
  responded_by?: string;
  responded_at?: string;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
  // New hierarchical response fields
  admin_responses?: AdminResponse[];
  thread_count?: number;
  last_response_at?: string;
}

export interface NotificationWithUserInfo extends UserNotification {
  username?: string;
  user_email?: string;
}

export interface CreateNotificationRequest {
  type: NotificationType;
  title: string;
  message: string;
  priority?: number;
  metadata?: Record<string, any>;
}

export interface UpdateNotificationRequest {
  status?: NotificationStatus;
  admin_response?: string;
  priority?: number;
}

export interface NotificationStats {
  total: number;
  pending: number;
  in_progress: number;
  resolved: number;
  dismissed: number;
  high_priority: number;
}