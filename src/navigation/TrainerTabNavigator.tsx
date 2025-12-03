/**
 * Trainer Tab Navigator
 *
 * Bottom tab navigator for trainer/mentor users.
 * Tabs: Dashboard, Schedule, Students, Messages, Profile
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { TrainerTabParamList } from '../types/navigation';
import { colors } from '../theme/colors';
import { fontFamily, fontSize } from '../theme/typography';
import { spacing, layoutSpacing } from '../theme/spacing';
import { PTPText } from '../components/PTPText';

// Trainer Screens
import TrainerDashboardScreen from '../screens/trainer/TrainerDashboardScreen';
import TrainerScheduleScreen from '../screens/trainer/TrainerScheduleScreen';
import TrainerStudentsScreen from '../screens/trainer/TrainerStudentsScreen';
import TrainerMessagesScreen from '../screens/trainer/TrainerMessagesScreen';
import TrainerProfileScreen from '../screens/trainer/TrainerProfileScreen';

const Tab = createBottomTabNavigator<TrainerTabParamList>();

// Tab icons as simple text (replace with proper icons in production)
const TabIcon: React.FC<{ name: string; focused: boolean }> = ({ name, focused }) => {
  const icons: { [key: string]: string } = {
    TrainerDashboard: '📊',
    TrainerSchedule: '📅',
    TrainerStudents: '👥',
    TrainerMessages: '💬',
    TrainerProfile: '⚙️',
  };

  return (
    <View style={styles.iconContainer}>
      <PTPText style={[styles.icon, focused && styles.iconFocused]}>
        {icons[name] || '•'}
      </PTPText>
    </View>
  );
};

/**
 * TrainerTabNavigator - Bottom tabs for trainer users
 */
export const TrainerTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused }) => <TabIcon name={route.name} focused={focused} />,
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
          tabBarLabel: 'Dashboard',
          tabBarAccessibilityLabel: 'Dashboard tab',
        }}
      />
      <Tab.Screen
        name="TrainerSchedule"
        component={TrainerScheduleScreen}
        options={{
          tabBarLabel: 'Schedule',
          tabBarAccessibilityLabel: 'Schedule tab',
        }}
      />
      <Tab.Screen
        name="TrainerStudents"
        component={TrainerStudentsScreen}
        options={{
          tabBarLabel: 'Students',
          tabBarAccessibilityLabel: 'Students tab',
        }}
      />
      <Tab.Screen
        name="TrainerMessages"
        component={TrainerMessagesScreen}
        options={{
          tabBarLabel: 'Messages',
          tabBarAccessibilityLabel: 'Messages tab',
        }}
      />
      <Tab.Screen
        name="TrainerProfile"
        component={TrainerProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarAccessibilityLabel: 'Profile and Settings tab',
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
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 24,
    opacity: 0.6,
  },
  iconFocused: {
    opacity: 1,
  },
});

export default TrainerTabNavigator;
