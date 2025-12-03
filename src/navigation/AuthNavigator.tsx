/**
 * Auth Navigator
 *
 * Stack navigator for authentication screens.
 * Includes welcome, login, signup, and onboarding flows.
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../types/navigation';
import { colors } from '../theme/colors';
import { fontFamily } from '../theme/typography';

// Auth Screens
import WelcomeScreen from '../screens/auth/WelcomeScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import SignUpScreen from '../screens/auth/SignUpScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import OnboardingLocationScreen from '../screens/auth/OnboardingLocationScreen';
import OnboardingAgeScreen from '../screens/auth/OnboardingAgeScreen';
import OnboardingSkillScreen from '../screens/auth/OnboardingSkillScreen';
import OnboardingInterestScreen from '../screens/auth/OnboardingInterestScreen';

const Stack = createNativeStackNavigator<AuthStackParamList>();

/**
 * AuthNavigator - Authentication flow navigator
 */
export const AuthNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.offWhite },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
      <Stack.Screen
        name="ForgotPassword"
        component={ForgotPasswordScreen}
        options={{
          headerShown: true,
          headerTitle: 'Reset Password',
          headerBackTitle: 'Back',
          headerTintColor: colors.inkBlack,
          headerStyle: { backgroundColor: colors.offWhite },
          headerTitleStyle: { fontFamily: fontFamily.semiBold },
        }}
      />
      <Stack.Screen name="OnboardingLocation" component={OnboardingLocationScreen} />
      <Stack.Screen name="OnboardingAge" component={OnboardingAgeScreen} />
      <Stack.Screen name="OnboardingSkill" component={OnboardingSkillScreen} />
      <Stack.Screen name="OnboardingInterest" component={OnboardingInterestScreen} />
    </Stack.Navigator>
  );
};

export default AuthNavigator;
