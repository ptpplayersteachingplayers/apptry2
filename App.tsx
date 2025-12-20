/**
 * PTP Soccer App
 *
 * Main entry point for the Expo app.
 * Wraps the app with providers for theme, auth, navigation, and data fetching.
 */

import React, { useEffect, ReactNode } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import * as SplashScreen from 'expo-splash-screen';
import Constants from 'expo-constants';

import { PTPThemeProvider } from './src/theme';
import { AuthProvider } from './src/hooks/useAuth';
import { NotificationProvider } from './src/providers';
import { AppNavigator } from './src/navigation';
import { PTPErrorBoundary } from './src/components/PTPErrorBoundary';
import { queryClient } from './src/lib/queryClient';
import { stripeConfig } from './src/api/payments';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

// Check if running in Expo Go (no native modules available)
const isExpoGo = Constants.appOwnership === 'expo';

/**
 * Conditional Stripe Provider
 * Only loads Stripe in development/production builds, not Expo Go
 */
const ConditionalStripeProvider = ({ children }: { children: ReactNode }) => {
  if (isExpoGo) {
    // Skip Stripe in Expo Go - native module not available
    console.log('Running in Expo Go - Stripe disabled');
    return <>{children}</>;
  }

  // Dynamically import Stripe only when not in Expo Go
  const { StripeProvider } = require('@stripe/stripe-react-native');
  return (
    <StripeProvider
      publishableKey={stripeConfig.publishableKey}
      merchantIdentifier={stripeConfig.merchantIdentifier}
      urlScheme="ptp"
    >
      {children}
    </StripeProvider>
  );
};

/**
 * App - Root component
 *
 * Provider stack:
 * 1. GestureHandlerRootView - Required for react-native-gesture-handler
 * 2. SafeAreaProvider - Safe area insets for different devices
 * 3. QueryClientProvider - React Query for data fetching and caching
 * 4. StripeProvider - Stripe payment SDK
 * 5. PTPErrorBoundary - Catch and display errors gracefully
 * 6. PTPThemeProvider - Theme and fonts
 * 7. AuthProvider - Authentication state
 * 8. NotificationProvider - Push notification management
 */
export default function App() {
  useEffect(() => {
    // Hide splash screen after fonts are loaded (handled in PTPThemeProvider)
    const hideSplash = async () => {
      // Small delay to ensure everything is loaded
      await new Promise((resolve) => setTimeout(resolve, 500));
      await SplashScreen.hideAsync();
    };

    hideSplash();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ConditionalStripeProvider>
            <PTPErrorBoundary>
              <PTPThemeProvider>
                <AuthProvider>
                  <NotificationProvider>
                    <StatusBar style="light" />
                    <AppNavigator />
                  </NotificationProvider>
                </AuthProvider>
              </PTPThemeProvider>
            </PTPErrorBoundary>
          </ConditionalStripeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
