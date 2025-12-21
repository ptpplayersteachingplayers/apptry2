/**
 * Push Notifications Hook
 *
 * Handles push notification registration and handling.
 * Uses expo-notifications.
 */

import { useEffect, useRef, useState } from 'react';
import { Platform, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { registerPushToken, unregisterPushToken } from '../api/push';
import {
  handleNotificationNavigation,
  NotificationNavigationData,
  isNavigationReady,
} from '../services/navigation';

// Configure notification handling
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

interface UseNotificationsResult {
  expoPushToken: string | null;
  notification: Notifications.Notification | null;
  requestPermissions: () => Promise<boolean>;
  isPermissionGranted: boolean;
}

/**
 * useNotifications - Hook for push notification management
 *
 * @example
 * const { expoPushToken, notification, requestPermissions } = useNotifications();
 */
export const useNotifications = (): UseNotificationsResult => {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const [isPermissionGranted, setIsPermissionGranted] = useState(false);

  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    // Set up notification listeners
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      setNotification(notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      handleNotificationResponse(response);
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  const requestPermissions = async (): Promise<boolean> => {
    if (!Device.isDevice) {
      console.log('Push notifications require a physical device');
      return false;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        Alert.alert(
          'Notifications Disabled',
          'Enable notifications in Settings to receive updates about your sessions and messages.'
        );
        setIsPermissionGranted(false);
        return false;
      }

      setIsPermissionGranted(true);

      // Get EAS project ID from config
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;

      if (!projectId) {
        console.warn(
          'Push notifications: EAS project ID not configured. ' +
          'Set EXPO_PUBLIC_PROJECT_ID in your .env file for push notification support.'
        );
        // Still return true since permissions were granted - push tokens just won't work
        return true;
      }

      // Get Expo push token
      const token = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      if (!token?.data) {
        console.error('Failed to get push token');
        return true; // Permissions granted, but token failed
      }

      setExpoPushToken(token.data);

      // Register token with backend
      const platform = Platform.OS as 'ios' | 'android';
      try {
        await registerPushToken(token.data, platform);
      } catch (registerError) {
        console.error('Failed to register push token with backend:', registerError);
        // Don't fail the whole flow - token can be registered later
      }

      // Configure Android channel
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FCB900',
        });
      }

      return true;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  };

  const handleNotificationResponse = (response: Notifications.NotificationResponse) => {
    const data = response.notification.request.content.data as NotificationNavigationData;

    console.log('Notification tapped:', data);

    // Handle navigation based on notification type
    // Expected data format from backend:
    // - { screen: 'ConversationDetail', params: { conversationId: 123 } }
    // - { screen: 'ProgramDetail', params: { programId: 456 } }
    // - { tab: 'Schedule' } - navigate to a specific tab
    // - { screen: 'Messages' } - navigate to messages screen

    if (!data) {
      console.log('No navigation data in notification');
      return;
    }

    // Wait for navigation to be ready (might take a moment after app opens)
    const attemptNavigation = (retries = 5) => {
      if (isNavigationReady()) {
        handleNotificationNavigation(data);
      } else if (retries > 0) {
        // Retry after a short delay
        setTimeout(() => attemptNavigation(retries - 1), 200);
      } else {
        console.warn('Navigation not ready after retries');
      }
    };

    attemptNavigation();
  };

  return {
    expoPushToken,
    notification,
    requestPermissions,
    isPermissionGranted,
  };
};

/**
 * Schedule a local notification (for testing)
 */
export const scheduleLocalNotification = async (
  title: string,
  body: string,
  data?: Record<string, unknown>
) => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 2,
      repeats: false,
    },
  });
};

export default useNotifications;
