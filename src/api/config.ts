/**
 * API Configuration
 *
 * Environment-based configuration for the PTP API client.
 *
 * Production Deployment:
 * - Set DEMO_MODE=false in .env for live WordPress data
 * - Ensure API_BASE_URL points to your WordPress backend
 * - Configure EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY for payments
 */

import Constants from 'expo-constants';

// Get environment variables from Expo config
const expoConfig = Constants.expoConfig?.extra || {};

/**
 * Determine if demo mode should be enabled
 * Priority: expoConfig > process.env > default (based on __DEV__)
 */
const getDemoMode = (): boolean => {
  // Check Expo config first (set via EAS build profile)
  if (expoConfig.DEMO_MODE !== undefined) {
    return expoConfig.DEMO_MODE === 'true';
  }
  // Check process.env
  if (process.env.DEMO_MODE !== undefined) {
    return process.env.DEMO_MODE === 'true';
  }
  // Default: demo mode in development, live in production
  return __DEV__;
};

/**
 * API Configuration object
 */
export const apiConfig = {
  // Base URL for the WordPress site
  baseUrl: expoConfig.API_BASE_URL || process.env.API_BASE_URL || 'https://ptpsummercamps.com',

  // API namespace for PTP endpoints (v2 for new training platform)
  namespace: expoConfig.MOBILE_API_NAMESPACE || process.env.MOBILE_API_NAMESPACE || '/wp-json/ptp/v2',

  // JWT Auth endpoint (WordPress JWT plugin)
  jwtAuthEndpoint: '/wp-json/jwt-auth/v1/token',

  // Demo mode - use mock data instead of real API
  // Controlled by DEMO_MODE environment variable or EAS build profile
  demoMode: getDemoMode(),

  // Request timeout in milliseconds
  timeout: 30000,

  // Retry configuration
  retryAttempts: 3,
  retryDelay: 1000,
} as const;

// Log configuration in development
if (__DEV__) {
  console.log('[API Config]', {
    baseUrl: apiConfig.baseUrl,
    namespace: apiConfig.namespace,
    demoMode: apiConfig.demoMode,
  });
}

/**
 * Build full API URL for an endpoint
 */
export const buildApiUrl = (endpoint: string): string => {
  const base = apiConfig.baseUrl.replace(/\/$/, '');
  const namespace = apiConfig.namespace.replace(/^\//, '').replace(/\/$/, '');
  const path = endpoint.replace(/^\//, '');
  return `${base}/${namespace}/${path}`;
};

/**
 * Build JWT auth URL
 */
export const buildAuthUrl = (): string => {
  const base = apiConfig.baseUrl.replace(/\/$/, '');
  return `${base}${apiConfig.jwtAuthEndpoint}`;
};

/**
 * Build WooCommerce checkout URL for a product
 */
export const buildCheckoutUrl = (productId: number, token?: string): string => {
  const base = apiConfig.baseUrl.replace(/\/$/, '');
  let url = `${base}/checkout/?add-to-cart=${productId}`;

  // Add mobile app identifier for styling
  url += '&ptp_mobile=1';

  // Add token for auto-login if available
  if (token) {
    url += `&ptp_token=${encodeURIComponent(token)}`;
  }

  return url;
};

export default apiConfig;
