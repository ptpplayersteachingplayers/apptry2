/**
 * Push Notifications API Module
 *
 * Handles push notification registration and preferences.
 */

import { apiClient } from './client';
import { apiConfig } from './config';

/**
 * Register push notification token
 *
 * POST /wp-json/ptp/v1/push/register
 */
export const registerPushToken = async (
  token: string,
  platform: 'ios' | 'android'
): Promise<void> => {
  if (apiConfig.demoMode) {
    console.log('Demo mode: Push token registered', { token, platform });
    return;
  }

  await apiClient.post('/push/register', {
    token,
    platform,
  });
};

/**
 * Unregister push notification token
 *
 * POST /wp-json/ptp/v1/push/unregister
 */
export const unregisterPushToken = async (token: string): Promise<void> => {
  if (apiConfig.demoMode) {
    console.log('Demo mode: Push token unregistered', { token });
    return;
  }

  await apiClient.post('/push/unregister', { token });
};

/**
 * Update notification preferences
 *
 * PUT /wp-json/ptp/v1/push/preferences
 */
export const updateNotificationPreferences = async (
  preferences: NotificationPreferences
): Promise<void> => {
  if (apiConfig.demoMode) {
    console.log('Demo mode: Notification preferences updated', preferences);
    return;
  }

  await apiClient.put('/push/preferences', preferences);
};

/**
 * Get notification preferences
 *
 * GET /wp-json/ptp/v1/push/preferences
 */
export const getNotificationPreferences = async (): Promise<NotificationPreferences> => {
  if (apiConfig.demoMode) {
    return {
      enabled: true,
      sessionReminders: true,
      newMessages: true,
      newPrograms: true,
      promotions: false,
      reminderTime: 60, // minutes before
    };
  }

  const response = await apiClient.get('/push/preferences');
  return response.data;
};

/**
 * Notification preferences type
 */
export interface NotificationPreferences {
  enabled: boolean;
  sessionReminders: boolean;
  newMessages: boolean;
  newPrograms: boolean;
  promotions: boolean;
  reminderTime: number; // minutes before session
}

/**
 * Notification types for handling
 */
export type NotificationType =
  | 'session_reminder'
  | 'new_message'
  | 'session_request'
  | 'session_confirmed'
  | 'session_cancelled'
  | 'new_program'
  | 'promotion';

/**
 * Notification payload from backend
 */
export interface NotificationPayload {
  type: NotificationType;
  title: string;
  body: string;
  data: {
    screenName?: string;
    screenParams?: Record<string, unknown>;
    conversationId?: number;
    sessionId?: number;
    programId?: number;
  };
}

/**
 * Stored notification item
 */
export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  type: NotificationType | 'general';
  data: Record<string, unknown> | null;
  isRead: boolean;
  createdAt: string;
}

/**
 * Notifications list response
 */
export interface NotificationsResponse {
  notifications: NotificationItem[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

/**
 * Get notifications list
 *
 * GET /wp-json/ptp/v1/push/notifications
 */
export const getNotifications = async (
  page: number = 1,
  perPage: number = 20
): Promise<NotificationsResponse> => {
  if (apiConfig.demoMode) {
    return {
      notifications: [
        {
          id: 1,
          title: 'Session Reminder',
          message: 'Your training session with Coach John is in 1 hour',
          type: 'session_reminder',
          data: { sessionId: 123 },
          isRead: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: 2,
          title: 'New Message',
          message: 'Coach Sarah sent you a message',
          type: 'new_message',
          data: { conversationId: 456 },
          isRead: true,
          createdAt: new Date(Date.now() - 86400000).toISOString(),
        },
      ],
      total: 2,
      page: 1,
      perPage: 20,
      totalPages: 1,
    };
  }

  const response = await apiClient.get('/push/notifications', {
    params: { page, per_page: perPage },
  });
  return response.data;
};

/**
 * Mark notification as read
 *
 * POST /wp-json/ptp/v1/push/notifications/:id/read
 */
export const markNotificationAsRead = async (notificationId: number): Promise<void> => {
  if (apiConfig.demoMode) {
    console.log('Demo mode: Notification marked as read', { notificationId });
    return;
  }

  await apiClient.post(`/push/notifications/${notificationId}/read`);
};

/**
 * Mark all notifications as read
 *
 * POST /wp-json/ptp/v1/push/notifications/read-all
 */
export const markAllNotificationsAsRead = async (): Promise<void> => {
  if (apiConfig.demoMode) {
    console.log('Demo mode: All notifications marked as read');
    return;
  }

  await apiClient.post('/push/notifications/read-all');
};

/**
 * Get unread notification count
 *
 * GET /wp-json/ptp/v1/push/unread-count
 */
export const getUnreadNotificationCount = async (): Promise<number> => {
  if (apiConfig.demoMode) {
    return 2;
  }

  const response = await apiClient.get('/push/unread-count');
  return response.data.count;
};
