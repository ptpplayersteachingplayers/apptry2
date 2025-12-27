import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Linking from 'expo-linking';
import { AuthProvider, useAuth } from '../src/context/AuthContext';

function RootLayoutNav() {
  const { isLoading, user } = useAuth();

  // Handle deep links
  useEffect(() => {
    const handleDeepLink = (event: { url: string }) => {
      const { path, queryParams } = Linking.parse(event.url);
      console.log('Deep link received:', path, queryParams);

      // Handle checkout success return
      if (path === 'checkout/success' && queryParams?.order_id) {
        // Navigate to tickets or show success
        console.log('Order completed:', queryParams.order_id);
      }

      // Handle auth callback
      if (path === 'auth/callback') {
        // Supabase will handle the token exchange
        console.log('Auth callback received');
      }
    };

    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Check if app was opened from a deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  if (isLoading) {
    return null; // Or a loading screen
  }

  return (
    <>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        {!user ? (
          <Stack.Screen name="auth" options={{ headerShown: false }} />
        ) : (
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        )}
        <Stack.Screen
          name="event/[id]"
          options={{
            headerShown: true,
            title: 'Event Details',
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen
          name="trainer/[id]"
          options={{
            headerShown: true,
            title: 'Trainer',
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen
          name="book-session/[id]"
          options={{
            headerShown: true,
            title: 'Book Session',
            headerBackTitle: 'Back',
          }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
