/**
 * Parent Tab Navigator
 *
 * Bottom tab navigator for parent/family users.
 * Tabs: Home, Camps & Clinics, Private Training, Schedule, Account
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ParentTabParamList } from '../types/navigation';
import { colors } from '../theme/colors';
import { fontFamily, fontSize } from '../theme/typography';
import { spacing, layoutSpacing } from '../theme/spacing';
import { PTPText } from '../components/PTPText';

// Parent Screens
import HomeScreen from '../screens/parent/HomeScreen';
import CampsClinicsScreen from '../screens/parent/CampsClinicsScreen';
import PrivateTrainingScreen from '../screens/parent/PrivateTrainingScreen';
import ScheduleScreen from '../screens/parent/ScheduleScreen';
import AccountScreen from '../screens/parent/AccountScreen';

const Tab = createBottomTabNavigator<ParentTabParamList>();

// Tab icons as simple text (replace with proper icons in production)
const TabIcon: React.FC<{ name: string; focused: boolean }> = ({ name, focused }) => {
  const icons: { [key: string]: string } = {
    Home: '🏠',
    CampsClinics: '⚽',
    PrivateTraining: '🎯',
    Schedule: '📅',
    Account: '👤',
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
 * ParentTabNavigator - Bottom tabs for parent users
 */
export const ParentTabNavigator: React.FC = () => {
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

export default ParentTabNavigator;
