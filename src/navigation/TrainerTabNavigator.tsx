/**
 * Trainer Tab Navigator
 *
 * Bottom tab navigator for trainer/mentor users.
 * Tabs: Dashboard, Schedule, Students, Messages, Profile
 */

import React from 'react';
import { StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { TrainerTabParamList } from '../types/navigation';
import { colors } from '../theme/colors';
import { fontFamily, fontSize } from '../theme/typography';
import { spacing, layoutSpacing } from '../theme/spacing';

// Trainer Screens
import TrainerDashboardScreen from '../screens/trainer/TrainerDashboardScreen';
import TrainerScheduleScreen from '../screens/trainer/TrainerScheduleScreen';
import TrainerStudentsScreen from '../screens/trainer/TrainerStudentsScreen';
import TrainerMessagesScreen from '../screens/trainer/TrainerMessagesScreen';
import TrainerProfileScreen from '../screens/trainer/TrainerProfileScreen';

const Tab = createBottomTabNavigator<TrainerTabParamList>();

// Tab icon configuration
type IconName = React.ComponentProps<typeof Ionicons>['name'];

const TAB_ICONS: { [key: string]: { outline: IconName; filled: IconName } } = {
  TrainerDashboard: { outline: 'stats-chart-outline', filled: 'stats-chart' },
  TrainerSchedule: { outline: 'calendar-outline', filled: 'calendar' },
  TrainerStudents: { outline: 'people-outline', filled: 'people' },
  TrainerMessages: { outline: 'chatbubbles-outline', filled: 'chatbubbles' },
  TrainerProfile: { outline: 'settings-outline', filled: 'settings' },
};

/**
 * TrainerTabNavigator - Bottom tabs for trainer users
 */
export const TrainerTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          const icons = TAB_ICONS[route.name] || { outline: 'ellipse-outline', filled: 'ellipse' };
          const iconName = focused ? icons.filled : icons.outline;
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.gray500,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarHideOnKeyboard: true,
      })}
    >
      <Tab.Screen
        name="TrainerDashboard"
        component={TrainerDashboardScreen}
        options={{
          tabBarLabel: 'DASHBOARD',
          tabBarAccessibilityLabel: 'Dashboard tab',
        }}
      />
      <Tab.Screen
        name="TrainerSchedule"
        component={TrainerScheduleScreen}
        options={{
          tabBarLabel: 'SCHEDULE',
          tabBarAccessibilityLabel: 'Schedule tab',
        }}
      />
      <Tab.Screen
        name="TrainerStudents"
        component={TrainerStudentsScreen}
        options={{
          tabBarLabel: 'STUDENTS',
          tabBarAccessibilityLabel: 'Students tab',
        }}
      />
      <Tab.Screen
        name="TrainerMessages"
        component={TrainerMessagesScreen}
        options={{
          tabBarLabel: 'MESSAGES',
          tabBarAccessibilityLabel: 'Messages tab',
        }}
      />
      <Tab.Screen
        name="TrainerProfile"
        component={TrainerProfileScreen}
        options={{
          tabBarLabel: 'PROFILE',
          tabBarAccessibilityLabel: 'Profile and Settings tab',
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.black,
    borderTopColor: colors.gray700,
    borderTopWidth: 1,
    height: layoutSpacing.tabBarHeight,
    paddingTop: spacing[2],
    paddingBottom: spacing[5],
  },
  tabBarLabel: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize.xs,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});

export default TrainerTabNavigator;
