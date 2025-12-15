/**
 * PTP Soccer App
 *
 * Main entry point for the Expo app.
 * Wraps the app with providers for theme, auth, navigation, and data fetching.
 */

import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import * as SplashScreen from 'expo-splash-screen';

import { PTPThemeProvider } from './src/theme';
import { AuthProvider } from './src/hooks/useAuth';
import { NotificationProvider } from './src/providers';
import { AppNavigator } from './src/navigation';
import { PTPErrorBoundary } from './src/components/PTPErrorBoundary';
import { queryClient } from './src/lib/queryClient';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

/**
 * App - Root component
 *
 * Provider stack:
 * 1. GestureHandlerRootView - Required for react-native-gesture-handler
 * 2. SafeAreaProvider - Safe area insets for different devices
 * 3. QueryClientProvider - React Query for data fetching and caching
 * 4. PTPErrorBoundary - Catch and display errors gracefully
 * 5. PTPThemeProvider - Theme and fonts
 * 6. AuthProvider - Authentication state
 * 7. NotificationProvider - Push notification management
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
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
