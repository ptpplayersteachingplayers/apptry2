/**
 * Notification Provider
 *
 * Provides push notification functionality throughout the app.
 * Automatically requests permissions and registers tokens when user is authenticated.
 */

import React, { createContext, useContext, useEffect, useCallback, useState, ReactNode } from 'react';
import * as Notifications from 'expo-notifications';
import { useNotifications } from '../hooks/useNotifications';
import { useAuth } from '../hooks/useAuth';
import { unregisterPushToken } from '../api/push';

interface NotificationContextType {
  expoPushToken: string | null;
  notification: Notifications.Notification | null;
  isPermissionGranted: boolean;
  requestPermissions: () => Promise<boolean>;
  unreadCount: number;
  setUnreadCount: (count: number) => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

interface NotificationProviderProps {
  children: ReactNode;
}

/**
 * NotificationProvider - Wraps the app with push notification context
 *
 * Automatically initializes push notifications when user is authenticated.
 * Handles token registration/unregistration on login/logout.
 */
export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const {
    expoPushToken,
    notification,
    requestPermissions,
    isPermissionGranted,
  } = useNotifications();

  const [unreadCount, setUnreadCount] = useState(0);
  const [hasRequestedPermission, setHasRequestedPermission] = useState(false);

  // Request permissions when user logs in
  useEffect(() => {
    if (isAuthenticated && user && !hasRequestedPermission) {
      // Small delay to let the app settle after login
      const timer = setTimeout(async () => {
        try {
          await requestPermissions();
          setHasRequestedPermission(true);
        } catch (error) {
          console.error('Failed to request notification permissions:', error);
        }
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, user, hasRequestedPermission, requestPermissions]);

  // Reset permission state on logout
  useEffect(() => {
    if (!isAuthenticated) {
      setHasRequestedPermission(false);
      setUnreadCount(0);
    }
  }, [isAuthenticated]);

  // Unregister token on logout
  useEffect(() => {
    return () => {
      // Cleanup: unregister token if we have one and user logs out
      if (expoPushToken && !isAuthenticated) {
        unregisterPushToken(expoPushToken).catch(console.error);
      }
    };
  }, [expoPushToken, isAuthenticated]);

  // Handle incoming notifications - update unread count
  useEffect(() => {
    if (notification) {
      setUnreadCount((prev) => prev + 1);
    }
  }, [notification]);

  const value: NotificationContextType = {
    expoPushToken,
    notification,
    isPermissionGranted,
    requestPermissions,
    unreadCount,
    setUnreadCount,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

/**
 * useNotificationContext - Hook to access notification context
 *
 * @throws Error if used outside of NotificationProvider
 */
export const useNotificationContext = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationContext must be used within NotificationProvider');
  }
  return context;
};

export default NotificationProvider;
