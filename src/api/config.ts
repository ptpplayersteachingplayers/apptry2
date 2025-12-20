/**
 * API Configuration
 *
 * Environment-based configuration for the PTP API client.
 * Set DEMO_MODE=true to use mock data without a backend.
 */

import Constants from 'expo-constants';

// Get environment variables from Expo config
const expoConfig = Constants.expoConfig?.extra || {};

/**
 * API Configuration object
 */
export const apiConfig = {
  // Base URL for the WordPress site
  baseUrl: expoConfig.API_BASE_URL || process.env.API_BASE_URL || 'https://ptpsummercamps.com',

  // API namespace for PTP endpoints
  namespace: expoConfig.MOBILE_API_NAMESPACE || process.env.MOBILE_API_NAMESPACE || '/wp-json/ptp/v1',

  // JWT Auth endpoint (WordPress JWT plugin)
  jwtAuthEndpoint: '/wp-json/jwt-auth/v1/token',

  // Demo mode - use mock data instead of real API
  // Set DEMO_MODE=false in environment to connect to live WordPress
  // Default is TRUE until WordPress plugin is installed
  demoMode: expoConfig.DEMO_MODE === 'false' || process.env.DEMO_MODE === 'false' ? false : true,

  // Request timeout in milliseconds
  timeout: 30000,

  // Retry configuration
  retryAttempts: 3,
  retryDelay: 1000,
} as const;

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
