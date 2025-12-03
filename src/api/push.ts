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
