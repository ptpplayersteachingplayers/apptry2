/**
 * App Navigator
 *
 * Root navigator with dark theme styling.
 * Uses Zustand for auth state management.
 */

import React from 'react';
import { NavigationContainer, LinkingOptions, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Linking from 'expo-linking';
import { RootStackParamList } from '../types/navigation';
import { colors } from '../theme/colors';
import { fontFamily } from '../theme/typography';
import { useAuthStore } from '../stores';
import { PTPLoading } from '../components/PTPLoading';
import { navigationRef } from '../services/navigation';

// Navigators
import AuthNavigator from './AuthNavigator';
import ParentTabNavigator from './ParentTabNavigator';
import TrainerTabNavigator from './TrainerTabNavigator';

// Modal/Detail Screens (shared)
import ProgramDetailScreen from '../screens/parent/ProgramDetailScreen';
import TrainerDetailScreen from '../screens/parent/TrainerDetailScreen';
import CheckoutScreen from '../screens/parent/CheckoutScreen';
import MessagesScreen from '../screens/parent/MessagesScreen';
import ConversationDetailScreen from '../screens/parent/ConversationDetailScreen';
import EditProfileScreen from '../screens/parent/EditProfileScreen';
import EditChildScreen from '../screens/parent/EditChildScreen';
import PaymentMethodsScreen from '../screens/parent/PaymentMethodsScreen';
import NotificationSettingsScreen from '../screens/parent/NotificationSettingsScreen';
import NotificationCenterScreen from '../screens/parent/NotificationCenterScreen';

// Trainer Detail Screens
import SessionDetailScreen from '../screens/trainer/SessionDetailScreen';
import StudentDetailScreen from '../screens/trainer/StudentDetailScreen';
import EditTrainerProfileScreen from '../screens/trainer/EditTrainerProfileScreen';
import EditAvailabilityScreen from '../screens/trainer/EditAvailabilityScreen';
import EarningsDetailScreen from '../screens/trainer/EarningsDetailScreen';

const Stack = createNativeStackNavigator();

// Dark theme for navigation
const PTPDarkTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    background: colors.black,
    card: colors.blackCard,
    text: colors.white,
    border: colors.gray700,
    notification: colors.primary,
  },
};

// Deep linking configuration
const prefix = Linking.createURL('/');

const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [prefix, 'ptp://'],
  config: {
    screens: {
      Auth: {
        screens: {
          Welcome: 'welcome',
          Login: 'login',
          SignUp: 'signup',
        },
      },
      Parent: {
        screens: {
          ParentTabs: {
            screens: {
              Home: 'home',
              Trainers: 'trainers',
              Camps: 'camps',
              Bookings: 'bookings',
              Profile: 'profile',
            },
          },
          ProgramDetail: 'program/:programId',
          TrainerDetail: 'trainer/:trainerId',
          Checkout: 'checkout',
        },
      },
      Trainer: {
        screens: {
          TrainerTabs: {
            screens: {
              Dashboard: 'dashboard',
              Schedule: 'trainer-schedule',
              Bookings: 'trainer-bookings',
              Earnings: 'earnings',
              Profile: 'trainer-profile',
            },
          },
        },
      },
    },
  },
};

// Default screen options with dark theme
const defaultScreenOptions = {
  headerShown: false,
  contentStyle: { backgroundColor: colors.black },
  gestureEnabled: true,
};

const modalScreenOptions = {
  headerShown: true,
  headerTintColor: colors.white,
  headerStyle: { backgroundColor: colors.blackCard },
  headerTitleStyle: { fontFamily: fontFamily.heading, color: colors.white },
  headerBackTitle: 'Back',
};

/**
 * ParentStackNavigator - Stack for parent users
 */
const ParentStackNavigator: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={defaultScreenOptions}>
      <Stack.Screen name="ParentTabs" component={ParentTabNavigator} />
      <Stack.Screen
        name="ProgramDetail"
        component={ProgramDetailScreen}
        options={{
          ...modalScreenOptions,
          headerTitle: '',
          headerTransparent: true,
        }}
      />
      <Stack.Screen
        name="TrainerDetail"
        component={TrainerDetailScreen}
        options={{
          ...modalScreenOptions,
          headerTitle: '',
          headerTransparent: true,
        }}
      />
      <Stack.Screen
        name="Checkout"
        component={CheckoutScreen}
        options={{
          ...modalScreenOptions,
          presentation: 'modal',
          headerTitle: 'CHECKOUT',
        }}
      />
      <Stack.Screen
        name="Messages"
        component={MessagesScreen}
        options={{
          ...modalScreenOptions,
          headerTitle: 'MESSAGES',
        }}
      />
      <Stack.Screen
        name="ConversationDetail"
        component={ConversationDetailScreen}
        options={{
          ...modalScreenOptions,
          headerTitle: 'CONVERSATION',
        }}
      />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{
          ...modalScreenOptions,
          headerTitle: 'EDIT PROFILE',
        }}
      />
      <Stack.Screen
        name="EditChild"
        component={EditChildScreen}
        options={{
          ...modalScreenOptions,
          headerTitle: 'PLAYER PROFILE',
        }}
      />
      <Stack.Screen
        name="PaymentMethods"
        component={PaymentMethodsScreen}
        options={{
          ...modalScreenOptions,
          headerTitle: 'PAYMENT METHODS',
        }}
      />
      <Stack.Screen
        name="NotificationSettings"
        component={NotificationSettingsScreen}
        options={{
          ...modalScreenOptions,
          headerTitle: 'NOTIFICATIONS',
        }}
      />
      <Stack.Screen
        name="NotificationCenter"
        component={NotificationCenterScreen}
        options={{
          ...modalScreenOptions,
          headerTitle: 'NOTIFICATIONS',
        }}
      />
    </Stack.Navigator>
  );
};

/**
 * TrainerStackNavigator - Stack for trainer users
 */
const TrainerStackNavigator: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={defaultScreenOptions}>
      <Stack.Screen name="TrainerTabs" component={TrainerTabNavigator} />
      <Stack.Screen
        name="ConversationDetail"
        component={ConversationDetailScreen}
        options={{
          ...modalScreenOptions,
          headerTitle: 'CONVERSATION',
        }}
      />
      <Stack.Screen
        name="SessionDetail"
        component={SessionDetailScreen}
        options={{
          ...modalScreenOptions,
          headerTitle: 'SESSION DETAILS',
        }}
      />
      <Stack.Screen
        name="StudentDetail"
        component={StudentDetailScreen}
        options={{
          ...modalScreenOptions,
          headerTitle: 'STUDENT PROFILE',
        }}
      />
      <Stack.Screen
        name="EditTrainerProfile"
        component={EditTrainerProfileScreen}
        options={{
          ...modalScreenOptions,
          headerTitle: 'EDIT PROFILE',
        }}
      />
      <Stack.Screen
        name="EditAvailability"
        component={EditAvailabilityScreen}
        options={{
          ...modalScreenOptions,
          headerTitle: 'AVAILABILITY',
        }}
      />
      <Stack.Screen
        name="EarningsDetail"
        component={EarningsDetailScreen}
        options={{
          ...modalScreenOptions,
          headerTitle: 'EARNINGS',
        }}
      />
    </Stack.Navigator>
  );
};

/**
 * AppNavigator - Root navigation component
 */
export const AppNavigator: React.FC = () => {
  const { isLoading, isAuthenticated, user, hasCompletedOnboarding } = useAuthStore();

  // Show loading screen while checking auth state
  if (isLoading) {
    return <PTPLoading message="Loading..." />;
  }

  // Determine which navigator to show
  const isTrainer = user?.role === 'TRAINER';

  return (
    <NavigationContainer ref={navigationRef} linking={linking} theme={PTPDarkTheme}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.black },
          gestureEnabled: false,
        }}
      >
        {!isAuthenticated ? (
          // Not logged in - show auth flow
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : !hasCompletedOnboarding && !isTrainer ? (
          // Logged in but not onboarded (parents only)
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : isTrainer ? (
          // Logged in as trainer
          <Stack.Screen name="Trainer" component={TrainerStackNavigator} />
        ) : (
          // Logged in as parent
          <Stack.Screen name="Parent" component={ParentStackNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
