/**
 * Navigation Service
 *
 * Provides navigation functionality that can be used outside of React components.
 * Useful for handling push notification navigation, deep links, etc.
 */

import { createNavigationContainerRef, CommonActions } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';

// Create a navigation reference
export const navigationRef = createNavigationContainerRef<RootStackParamList>();

/**
 * Check if navigation is ready
 */
export const isNavigationReady = (): boolean => {
  return navigationRef.isReady();
};

/**
 * Navigate to a screen
 */
export const navigate = (name: string, params?: object): void => {
  if (navigationRef.isReady()) {
    // @ts-ignore - dynamic navigation
    navigationRef.navigate(name, params);
  } else {
    console.warn('Navigation is not ready yet');
  }
};

/**
 * Navigate to a nested screen in the Parent stack
 */
export const navigateToParentScreen = (
  screenName: string,
  params?: object
): void => {
  if (!navigationRef.isReady()) {
    console.warn('Navigation is not ready yet');
    return;
  }

  navigationRef.dispatch(
    CommonActions.navigate({
      name: 'Parent',
      params: {
        screen: screenName,
        params,
      },
    })
  );
};

/**
 * Navigate to a nested screen in the Trainer stack
 */
export const navigateToTrainerScreen = (
  screenName: string,
  params?: object
): void => {
  if (!navigationRef.isReady()) {
    console.warn('Navigation is not ready yet');
    return;
  }

  navigationRef.dispatch(
    CommonActions.navigate({
      name: 'Trainer',
      params: {
        screen: screenName,
        params,
      },
    })
  );
};

/**
 * Navigate to a tab in the Parent stack
 */
export const navigateToParentTab = (
  tabName: 'Home' | 'CampsClinics' | 'PrivateTraining' | 'Schedule' | 'Account',
  params?: object
): void => {
  if (!navigationRef.isReady()) {
    console.warn('Navigation is not ready yet');
    return;
  }

  navigationRef.dispatch(
    CommonActions.navigate({
      name: 'Parent',
      params: {
        screen: 'ParentTabs',
        params: {
          screen: tabName,
          params,
        },
      },
    })
  );
};

/**
 * Navigate to a tab in the Trainer stack
 */
export const navigateToTrainerTab = (
  tabName: 'TrainerDashboard' | 'TrainerSchedule' | 'TrainerStudents' | 'TrainerMessages' | 'TrainerProfile',
  params?: object
): void => {
  if (!navigationRef.isReady()) {
    console.warn('Navigation is not ready yet');
    return;
  }

  navigationRef.dispatch(
    CommonActions.navigate({
      name: 'Trainer',
      params: {
        screen: 'TrainerTabs',
        params: {
          screen: tabName,
          params,
        },
      },
    })
  );
};

/**
 * Notification data structure for navigation
 */
export interface NotificationNavigationData {
  screen?: string;
  params?: Record<string, unknown>;
  tab?: string;
  role?: 'parent' | 'trainer';
}

/**
 * Handle notification navigation based on notification data
 */
export const handleNotificationNavigation = (data: NotificationNavigationData): void => {
  if (!navigationRef.isReady()) {
    console.warn('Navigation is not ready yet');
    return;
  }

  const { screen, params, tab, role } = data;

  // Navigate to a specific tab
  if (tab) {
    if (role === 'trainer') {
      navigateToTrainerTab(tab as any, params);
    } else {
      navigateToParentTab(tab as any, params);
    }
    return;
  }

  // Navigate to a specific screen
  if (screen) {
    // Determine which stack based on screen name or role
    const trainerScreens = ['SessionDetail', 'StudentDetail', 'EditTrainerProfile', 'EditAvailability', 'EarningsDetail'];

    if (role === 'trainer' || trainerScreens.includes(screen)) {
      navigateToTrainerScreen(screen, params);
    } else {
      navigateToParentScreen(screen, params);
    }
    return;
  }

  console.log('No valid navigation data in notification:', data);
};
