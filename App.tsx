/**
 * PTP Soccer App
 *
 * Main entry point for the Expo app.
 * Wraps the app with providers for theme, auth, navigation, and data fetching.
 */

import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import * as SplashScreen from 'expo-splash-screen';

import { PTPThemeProvider } from './src/theme';
import { AuthProvider } from './src/hooks/useAuth';
import { AppNavigator } from './src/navigation';
import { PTPErrorBoundary } from './src/components/PTPErrorBoundary';
import { queryClient } from './src/lib/queryClient';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync().catch(() => {
  // Ignore errors - splash screen might already be hidden
});

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
 */
export default function App() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Small delay to ensure everything is loaded
    const prepare = async () => {
      try {
        await new Promise((resolve) => setTimeout(resolve, 100));
        setIsReady(true);
      } catch (e) {
        console.warn(e);
        setIsReady(true);
      } finally {
        await SplashScreen.hideAsync().catch(() => {});
      }
    };

    prepare();
  }, []);

  if (!isReady) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <PTPErrorBoundary>
            <PTPThemeProvider>
              <AuthProvider>
                <StatusBar style="light" />
                <AppNavigator />
              </AuthProvider>
            </PTPThemeProvider>
          </PTPErrorBoundary>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
