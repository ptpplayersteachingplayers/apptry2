/**
 * App Navigator
 *
 * Root navigator that handles:
 * - Auth state routing (logged in vs logged out)
 * - Role-based routing (parent vs trainer)
 * - Deep linking configuration
 */

import React from 'react';
import { NavigationContainer, LinkingOptions } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Linking from 'expo-linking';
import { RootStackParamList } from '../types/navigation';
import { colors } from '../theme/colors';
import { fontFamily } from '../theme/typography';
import { useAuth } from '../hooks/useAuth';
import { PTPLoading } from '../components/PTPLoading';
import { navigationRef } from '../services/navigation';

// Navigators
import AuthNavigator from './AuthNavigator';
import ParentTabNavigator from './ParentTabNavigator';
import TrainerTabNavigator from './TrainerTabNavigator';

// Modal/Detail Screens (shared across tabs)
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
              CampsClinics: 'camps',
              PrivateTraining: 'training',
              Schedule: 'schedule',
              Account: 'account',
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
              TrainerDashboard: 'dashboard',
              TrainerSchedule: 'trainer-schedule',
              TrainerStudents: 'students',
              TrainerMessages: 'trainer-messages',
              TrainerProfile: 'profile',
            },
          },
        },
      },
    },
  },
};

/**
 * ParentStackNavigator - Stack for parent users with nested tabs
 */
const ParentStackNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.offWhite },
      }}
    >
      <Stack.Screen name="ParentTabs" component={ParentTabNavigator} />
      <Stack.Screen
        name="ProgramDetail"
        component={ProgramDetailScreen}
        options={{
          presentation: 'card',
          headerShown: true,
          headerTitle: '',
          headerTransparent: true,
          headerTintColor: colors.white,
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen
        name="TrainerDetail"
        component={TrainerDetailScreen}
        options={{
          presentation: 'card',
          headerShown: true,
          headerTitle: '',
          headerTransparent: true,
          headerTintColor: colors.white,
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen
        name="Checkout"
        component={CheckoutScreen}
        options={{
          presentation: 'modal',
          headerShown: true,
          headerTitle: 'Checkout',
          headerTintColor: colors.inkBlack,
          headerStyle: { backgroundColor: colors.offWhite },
          headerTitleStyle: { fontFamily: fontFamily.semiBold },
        }}
      />
      <Stack.Screen
        name="Messages"
        component={MessagesScreen}
        options={{
          headerShown: true,
          headerTitle: 'Messages',
          headerTintColor: colors.inkBlack,
          headerStyle: { backgroundColor: colors.offWhite },
          headerTitleStyle: { fontFamily: fontFamily.semiBold },
        }}
      />
      <Stack.Screen
        name="ConversationDetail"
        component={ConversationDetailScreen}
        options={{
          headerShown: true,
          headerTitle: 'Conversation',
          headerTintColor: colors.inkBlack,
          headerStyle: { backgroundColor: colors.offWhite },
          headerTitleStyle: { fontFamily: fontFamily.semiBold },
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{
          headerShown: true,
          headerTitle: 'Edit Profile',
          headerTintColor: colors.inkBlack,
          headerStyle: { backgroundColor: colors.offWhite },
          headerTitleStyle: { fontFamily: fontFamily.semiBold },
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen
        name="EditChild"
        component={EditChildScreen}
        options={{
          headerShown: true,
          headerTitle: 'Player Profile',
          headerTintColor: colors.inkBlack,
          headerStyle: { backgroundColor: colors.offWhite },
          headerTitleStyle: { fontFamily: fontFamily.semiBold },
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen
        name="PaymentMethods"
        component={PaymentMethodsScreen}
        options={{
          headerShown: true,
          headerTitle: 'Payment Methods',
          headerTintColor: colors.inkBlack,
          headerStyle: { backgroundColor: colors.offWhite },
          headerTitleStyle: { fontFamily: fontFamily.semiBold },
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen
        name="NotificationSettings"
        component={NotificationSettingsScreen}
        options={{
          headerShown: true,
          headerTitle: 'Notification Settings',
          headerTintColor: colors.inkBlack,
          headerStyle: { backgroundColor: colors.offWhite },
          headerTitleStyle: { fontFamily: fontFamily.semiBold },
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen
        name="NotificationCenter"
        component={NotificationCenterScreen}
        options={{
          headerShown: true,
          headerTitle: 'Notifications',
          headerTintColor: colors.inkBlack,
          headerStyle: { backgroundColor: colors.offWhite },
          headerTitleStyle: { fontFamily: fontFamily.semiBold },
          headerBackTitle: 'Back',
        }}
      />
    </Stack.Navigator>
  );
};

/**
 * TrainerStackNavigator - Stack for trainer users with nested tabs
 */
const TrainerStackNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.offWhite },
      }}
    >
      <Stack.Screen name="TrainerTabs" component={TrainerTabNavigator} />
      <Stack.Screen
        name="ConversationDetail"
        component={ConversationDetailScreen}
        options={{
          headerShown: true,
          headerTitle: 'Conversation',
          headerTintColor: colors.inkBlack,
          headerStyle: { backgroundColor: colors.offWhite },
          headerTitleStyle: { fontFamily: fontFamily.semiBold },
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen
        name="SessionDetail"
        component={SessionDetailScreen}
        options={{
          headerShown: true,
          headerTitle: 'Session Details',
          headerTintColor: colors.inkBlack,
          headerStyle: { backgroundColor: colors.offWhite },
          headerTitleStyle: { fontFamily: fontFamily.semiBold },
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen
        name="StudentDetail"
        component={StudentDetailScreen}
        options={{
          headerShown: true,
          headerTitle: 'Student Profile',
          headerTintColor: colors.inkBlack,
          headerStyle: { backgroundColor: colors.offWhite },
          headerTitleStyle: { fontFamily: fontFamily.semiBold },
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen
        name="EditTrainerProfile"
        component={EditTrainerProfileScreen}
        options={{
          headerShown: true,
          headerTitle: 'Edit Profile',
          headerTintColor: colors.inkBlack,
          headerStyle: { backgroundColor: colors.offWhite },
          headerTitleStyle: { fontFamily: fontFamily.semiBold },
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen
        name="EditAvailability"
        component={EditAvailabilityScreen}
        options={{
          headerShown: true,
          headerTitle: 'Availability',
          headerTintColor: colors.inkBlack,
          headerStyle: { backgroundColor: colors.offWhite },
          headerTitleStyle: { fontFamily: fontFamily.semiBold },
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen
        name="EarningsDetail"
        component={EarningsDetailScreen}
        options={{
          headerShown: true,
          headerTitle: 'Earnings',
          headerTintColor: colors.inkBlack,
          headerStyle: { backgroundColor: colors.offWhite },
          headerTitleStyle: { fontFamily: fontFamily.semiBold },
          headerBackTitle: 'Back',
        }}
      />
    </Stack.Navigator>
  );
};

/**
 * AppNavigator - Root navigation component
 */
export const AppNavigator: React.FC = () => {
  const { isLoading, isAuthenticated, isOnboarded, isGuest, user } = useAuth();

  // Show loading screen while checking auth state
  if (isLoading) {
    return <PTPLoading message="Loading..." />;
  }

  // Determine which navigator to show
  const isTrainer = user?.role === 'ptp_trainer';

  return (
    <NavigationContainer ref={navigationRef} linking={linking}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isGuest ? (
          // Guest user - can browse but not checkout
          <Stack.Screen name="Parent" component={ParentStackNavigator} />
        ) : !isAuthenticated ? (
          // Not logged in - show auth flow
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : !isOnboarded && !isTrainer ? (
          // Logged in but not onboarded (parents only) - show onboarding
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
