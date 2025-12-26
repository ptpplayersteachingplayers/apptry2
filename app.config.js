/**
 * Expo App Configuration
 *
 * This file provides dynamic configuration for the Expo app.
 * Environment variables are loaded from .env file or process.env
 *
 * Required for production:
 * - EXPO_PUBLIC_PROJECT_ID: Your EAS project ID (get from expo.dev)
 * - API_BASE_URL: Your WordPress backend URL
 */

const IS_DEV = process.env.APP_VARIANT === 'development';
const IS_PREVIEW = process.env.APP_VARIANT === 'preview';

// Get the app variant name for bundle identifier
const getAppName = () => {
  if (IS_DEV) return 'PTP (Dev)';
  if (IS_PREVIEW) return 'PTP (Preview)';
  return 'PTP';
};

const getBundleIdentifier = () => {
  if (IS_DEV) return 'com.ptpsoccer.app.dev';
  if (IS_PREVIEW) return 'com.ptpsoccer.app.preview';
  return 'com.ptpsoccer.app';
};

export default ({ config }) => {
  // EAS Project ID - hardcoded for build reliability
  const easProjectId = '68d2492c-c447-441d-8bf3-99413f385ed4';

  return {
    ...config,
    name: getAppName(),
    slug: 'ptp-soccer',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    scheme: 'ptp',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#0E0F11',
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
      bundleIdentifier: getBundleIdentifier(),
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        NSLocationWhenInUseUsageDescription:
          'PTP uses your location to find camps and clinics near you.',
        NSCameraUsageDescription:
          'PTP uses your camera to upload photos and videos.',
        NSPhotoLibraryUsageDescription:
          'PTP accesses your photo library to upload images.',
        UIBackgroundModes: ['remote-notification'],
      },
      entitlements: {
        'aps-environment': IS_DEV ? 'development' : 'production',
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#0E0F11',
      },
      package: getBundleIdentifier(),
      permissions: [
        'ACCESS_FINE_LOCATION',
        'ACCESS_COARSE_LOCATION',
        'CAMERA',
        'READ_EXTERNAL_STORAGE',
        'RECEIVE_BOOT_COMPLETED',
        'VIBRATE',
        'WAKE_LOCK',
      ],
      googleServicesFile: process.env.GOOGLE_SERVICES_JSON || './google-services.json',
    },
    web: {
      favicon: './assets/favicon.png',
    },
    plugins: [
      'expo-font',
      'expo-secure-store',
      'expo-updates',
      [
        'expo-notifications',
        {
          icon: './assets/notification-icon.png',
          color: '#FCB900',
          defaultChannel: 'default',
        },
      ],
      [
        'expo-location',
        {
          locationWhenInUsePermission:
            'PTP uses your location to find camps and clinics near you.',
        },
      ],
    ],
    extra: {
      // API Configuration
      API_BASE_URL: process.env.API_BASE_URL || 'https://ptpsummercamps.com',
      MOBILE_API_NAMESPACE: process.env.MOBILE_API_NAMESPACE || '/wp-json/ptp/v1',
      // DEMO_MODE: Set to 'false' for live API data, 'true' for mock data
      DEMO_MODE: process.env.DEMO_MODE || 'false',
            // Legal URLs for App Store compliance
            PRIVACY_POLICY_URL: 'https://ptpsummercamps.com/privacy-policy',
            TERMS_OF_SERVICE_URL: 'https://ptpsummercamps.com/terms-of-service',
            SUPPORT_EMAIL: 'luke@ptpsummercamps.com',
            // Sentry crash reporting - get DSN from https://sentry.io
            SENTRY_DSN: process.env.SENTRY_DSN || '',
      // Stripe Configuration
      STRIPE_PUBLISHABLE_KEY:
        process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ||
        process.env.STRIPE_PUBLISHABLE_KEY ||
        'pk_test_placeholder',
      // EAS Configuration
      eas: {
        projectId: easProjectId,
      },
    },
    owner: 'lmartelli',
    updates: {
      enabled: true,
      fallbackToCacheTimeout: 0,
      url: `https://u.expo.dev/${easProjectId}`,
    },
    runtimeVersion: {
      policy: 'sdkVersion',
    },
  };
};
