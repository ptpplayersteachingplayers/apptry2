import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Only import Sentry on native platforms (not web)
let Sentry: typeof import('@sentry/react-native') | null = null;
if (Platform.OS !== 'web') {
  Sentry = require('@sentry/react-native');
}

/**
 * Sentry crash reporting initialization
 * Configure with your Sentry DSN in app.config.js extra.SENTRY_DSN
 */
export function initSentry(): void {
  // Skip Sentry on web
  if (Platform.OS === 'web' || !Sentry) {
    return;
  }

  const dsn = Constants.expoConfig?.extra?.SENTRY_DSN;

  if (!dsn) {
    // Only warn in production - expected to be missing in development
    if (!__DEV__) {
      console.warn('Sentry DSN not configured. Crash reporting disabled.');
    }
    return;
  }

  Sentry.init({
        dsn,
        // Set environment based on release channel
        environment: __DEV__ ? 'development' : 'production',
        // Enable automatic breadcrumbs
        enableAutoSessionTracking: true,
        // Session tracking interval in ms
        sessionTrackingIntervalMillis: 30000,
        // Debug mode for development
        debug: __DEV__,
        // Sample rate for performance monitoring (0.0 to 1.0)
        tracesSampleRate: __DEV__ ? 1.0 : 0.2,
        // Attach stack traces to all messages
        attachStacktrace: true,
        // Maximum breadcrumbs
        maxBreadcrumbs: 100,
        // Ignore specific errors (optional)
        beforeSend(event) {
                // Filter out network errors in development
          if (__DEV__ && event.exception?.values?.[0]?.type === 'NetworkError') {
                    return null;
          }
                return event;
        },
  });
}

/**
 * Set user context for crash reports
 */
export function setSentryUser(userId: string, email?: string): void {
    if (!Sentry) return;
    Sentry.setUser({
          id: userId,
          email,
    });
}

/**
 * Clear user context (on logout)
 */
export function clearSentryUser(): void {
    if (!Sentry) return;
    Sentry.setUser(null);
}

/**
 * Capture a custom error
 */
export function captureError(error: Error, context?: Record<string, unknown>): void {
    if (!Sentry) return;
    if (context) {
          Sentry.setContext('additional', context);
    }
    Sentry.captureException(error);
}

/**
 * Add a breadcrumb for tracking user actions
 */
export function addBreadcrumb(
    category: string,
    message: string,
    level: 'fatal' | 'error' | 'warning' | 'log' | 'info' | 'debug' = 'info'
  ): void {
    if (!Sentry) return;
    Sentry.addBreadcrumb({
          category,
          message,
          level,
    });
}

export { Sentry };
