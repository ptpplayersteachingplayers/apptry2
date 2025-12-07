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
  if (IS_DEV) return 'PTP Soccer (Dev)';
  if (IS_PREVIEW) return 'PTP Soccer (Preview)';
  return 'PTP Soccer';
};

const getBundleIdentifier = () => {
  if (IS_DEV) return 'com.ptpsoccer.app.dev';
  if (IS_PREVIEW) return 'com.ptpsoccer.app.preview';
  return 'com.ptpsoccer.app';
};

export default ({ config }) => {
  // Get EAS project ID from environment or use placeholder
  const easProjectId = process.env.EXPO_PUBLIC_PROJECT_ID || process.env.EAS_PROJECT_ID;

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
        NSLocationWhenInUseUsageDescription:
          'PTP Soccer uses your location to find camps and clinics near you.',
        NSCameraUsageDescription:
          'PTP Soccer uses your camera to upload photos and videos.',
        NSPhotoLibraryUsageDescription:
          'PTP Soccer accesses your photo library to upload images.',
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
      ],
    },
    web: {
      favicon: './assets/favicon.png',
    },
    plugins: [
      'expo-font',
      'expo-secure-store',
      [
        'expo-notifications',
        {
          icon: './assets/notification-icon.png',
          color: '#FCB900',
        },
      ],
      [
        'expo-location',
        {
          locationWhenInUsePermission:
            'PTP Soccer uses your location to find camps and clinics near you.',
        },
      ],
    ],
    extra: {
      // API Configuration
      API_BASE_URL: process.env.API_BASE_URL || 'https://ptpsummercamps.com',
      MOBILE_API_NAMESPACE: process.env.MOBILE_API_NAMESPACE || '/wp-json/ptp/v1',
      DEMO_MODE: process.env.DEMO_MODE || 'false',
      // EAS Configuration
      eas: {
        projectId: easProjectId,
      },
    },
    owner: 'ptpsoccer',
    updates: {
      fallbackToCacheTimeout: 0,
    },
    runtimeVersion: {
      policy: 'sdkVersion',
    },
  };
};
