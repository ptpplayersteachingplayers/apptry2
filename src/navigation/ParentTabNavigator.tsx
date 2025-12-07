/**
 * Parent Tab Navigator
 *
 * Bottom tab navigator for parent/family users.
 * Tabs: Home, Camps & Clinics, Private Training, Schedule, Account
 */

import React from 'react';
import { StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { ParentTabParamList } from '../types/navigation';
import { colors } from '../theme/colors';
import { fontFamily, fontSize } from '../theme/typography';
import { spacing, layoutSpacing } from '../theme/spacing';

// Parent Screens
import HomeScreen from '../screens/parent/HomeScreen';
import CampsClinicsScreen from '../screens/parent/CampsClinicsScreen';
import PrivateTrainingScreen from '../screens/parent/PrivateTrainingScreen';
import ScheduleScreen from '../screens/parent/ScheduleScreen';
import AccountScreen from '../screens/parent/AccountScreen';

const Tab = createBottomTabNavigator<ParentTabParamList>();

// Tab icon configuration
type IconName = React.ComponentProps<typeof Ionicons>['name'];

const TAB_ICONS: { [key: string]: { outline: IconName; filled: IconName } } = {
  Home: { outline: 'home-outline', filled: 'home' },
  CampsClinics: { outline: 'football-outline', filled: 'football' },
  PrivateTraining: { outline: 'fitness-outline', filled: 'fitness' },
  Schedule: { outline: 'calendar-outline', filled: 'calendar' },
  Account: { outline: 'person-outline', filled: 'person' },
};

/**
 * ParentTabNavigator - Bottom tabs for parent users
 */
export const ParentTabNavigator: React.FC = () => {
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
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarAccessibilityLabel: 'Home tab',
        }}
      />
      <Tab.Screen
        name="CampsClinics"
        component={CampsClinicsScreen}
        options={{
          tabBarLabel: 'Camps',
          tabBarAccessibilityLabel: 'Camps and Clinics tab',
        }}
      />
      <Tab.Screen
        name="PrivateTraining"
        component={PrivateTrainingScreen}
        options={{
          tabBarLabel: 'Training',
          tabBarAccessibilityLabel: 'Private Training tab',
        }}
      />
      <Tab.Screen
        name="Schedule"
        component={ScheduleScreen}
        options={{
          tabBarLabel: 'Schedule',
          tabBarAccessibilityLabel: 'Schedule tab',
        }}
      />
      <Tab.Screen
        name="Account"
        component={AccountScreen}
        options={{
          tabBarLabel: 'Account',
          tabBarAccessibilityLabel: 'Account tab',
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.white,
    borderTopColor: colors.gray200,
    borderTopWidth: 1,
    height: layoutSpacing.tabBarHeight,
    paddingTop: spacing[2],
    paddingBottom: spacing[5],
  },
  tabBarLabel: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
  },
});

export default ParentTabNavigator;
