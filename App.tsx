/**
 * PTP Soccer App
 *
 * Main entry point for the Expo app.
 * Wraps the app with providers for theme, auth, and navigation.
 */

import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';

import { PTPThemeProvider } from './src/theme';
import { AuthProvider } from './src/hooks/useAuth';
import { AppNavigator } from './src/navigation';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

/**
 * App - Root component
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
        <PTPThemeProvider>
          <AuthProvider>
            <StatusBar style="light" />
            <AppNavigator />
          </AuthProvider>
        </PTPThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
