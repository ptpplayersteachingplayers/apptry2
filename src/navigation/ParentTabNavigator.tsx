/**
 * Parent Tab Navigator
 *
 * Dark themed bottom tab navigator for parent/family users.
 * Tabs: Home, Trainers, Camps, Bookings, Profile
 */

import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { ParentTabParamList } from '../types/navigation';
import { useAppStore } from '../stores';
import { colors } from '../theme/colors';
import { fontFamily, fontSize } from '../theme/typography';
import { spacing, layoutSpacing, borderRadius } from '../theme/spacing';

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
  Trainers: { outline: 'people-outline', filled: 'people' },
  Camps: { outline: 'football-outline', filled: 'football' },
  Bookings: { outline: 'calendar-outline', filled: 'calendar' },
  Profile: { outline: 'person-outline', filled: 'person' },
};

/**
 * ParentTabNavigator - Dark themed bottom tabs
 */
export const ParentTabNavigator: React.FC = () => {
  const { unreadCount } = useAppStore();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          const icons = TAB_ICONS[route.name] || { outline: 'ellipse-outline', filled: 'ellipse' };
          const iconName = focused ? icons.filled : icons.outline;

          // Show badge on Profile tab for notifications
          if (route.name === 'Profile' && unreadCount > 0) {
            return (
              <View>
                <Ionicons name={iconName} size={size} color={color} />
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Text>
                </View>
              </View>
            );
          }

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
          tabBarLabel: 'HOME',
          tabBarAccessibilityLabel: 'Home tab',
        }}
      />
      <Tab.Screen
        name="Trainers"
        component={PrivateTrainingScreen}
        options={{
          tabBarLabel: 'TRAINERS',
          tabBarAccessibilityLabel: 'Browse Trainers tab',
        }}
      />
      <Tab.Screen
        name="Camps"
        component={CampsClinicsScreen}
        options={{
          tabBarLabel: 'CAMPS',
          tabBarAccessibilityLabel: 'Camps and Clinics tab',
        }}
      />
      <Tab.Screen
        name="Bookings"
        component={ScheduleScreen}
        options={{
          tabBarLabel: 'BOOKINGS',
          tabBarAccessibilityLabel: 'My Bookings tab',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={AccountScreen}
        options={{
          tabBarLabel: 'PROFILE',
          tabBarAccessibilityLabel: 'Profile tab',
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.blackCard,
    borderTopColor: colors.gray200,
    borderTopWidth: 1,
    height: layoutSpacing.tabBarHeight,
    paddingTop: spacing[2],
    paddingBottom: spacing[5],
  },
  tabBarLabel: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize.xs,
    letterSpacing: 0.5,
  },
  badge: {
    position: 'absolute',
    right: -8,
    top: -4,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: colors.black,
    fontSize: 10,
    fontFamily: fontFamily.heading,
    fontWeight: '700',
  },
});

export default ParentTabNavigator;
