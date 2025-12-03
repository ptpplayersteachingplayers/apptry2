/**
 * PTP API Client
 *
 * Axios instance configured with:
 * - Base URL from environment
 * - JWT token interceptor
 * - Error handling and retry logic
 * - Response type transformation
 */

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { apiConfig, buildApiUrl, buildAuthUrl } from './config';

// Storage key for JWT token
export const TOKEN_STORAGE_KEY = 'ptp_auth_token';
export const REFRESH_TOKEN_KEY = 'ptp_refresh_token';

// Navigation callback for auth redirects
let onAuthError: (() => void) | null = null;

/**
 * Set callback for authentication errors
 * Called when token is invalid/expired to redirect to login
 */
export const setOnAuthError = (callback: () => void) => {
  onAuthError = callback;
};

/**
 * Get stored JWT token
 */
export const getStoredToken = async (): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(TOKEN_STORAGE_KEY);
  } catch (error) {
    console.error('Error reading token from secure store:', error);
    return null;
  }
};

/**
 * Store JWT token
 */
export const storeToken = async (token: string): Promise<void> => {
  try {
    await SecureStore.setItemAsync(TOKEN_STORAGE_KEY, token);
  } catch (error) {
    console.error('Error storing token:', error);
  }
};

/**
 * Clear stored tokens
 */
export const clearTokens = async (): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(TOKEN_STORAGE_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  } catch (error) {
    console.error('Error clearing tokens:', error);
  }
};

/**
 * Create Axios instance with base configuration
 */
const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: `${apiConfig.baseUrl}${apiConfig.namespace}`,
    timeout: apiConfig.timeout,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });

  // Request interceptor - attach JWT token
  client.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      // Skip token for auth endpoints
      if (config.url?.includes('jwt-auth')) {
        return config;
      }

      const token = await getStoredToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor - handle errors
  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config;

      // Handle 401 Unauthorized
      if (error.response?.status === 401) {
        // Clear tokens and redirect to login
        await clearTokens();

        if (onAuthError) {
          onAuthError();
        }

        return Promise.reject(new ApiError('Session expired. Please log in again.', 401));
      }

      // Handle network errors
      if (!error.response) {
        return Promise.reject(
          new ApiError('Could not connect to PTP servers. Please check your internet connection.', 0)
        );
      }

      // Handle other errors
      const message = extractErrorMessage(error);
      return Promise.reject(new ApiError(message, error.response?.status || 500));
    }
  );

  return client;
};

/**
 * Extract user-friendly error message from API response
 */
const extractErrorMessage = (error: AxiosError): string => {
  const data = error.response?.data as Record<string, unknown>;

  // WordPress REST API error format
  if (data?.message && typeof data.message === 'string') {
    return data.message;
  }

  // WooCommerce error format
  const nestedData = data?.data as Record<string, unknown> | undefined;
  if (nestedData?.message && typeof nestedData.message === 'string') {
    return nestedData.message;
  }

  // Fallback messages based on status
  switch (error.response?.status) {
    case 400:
      return 'Invalid request. Please check your input.';
    case 403:
      return 'You do not have permission to perform this action.';
    case 404:
      return 'The requested resource was not found.';
    case 500:
      return 'Server error. Please try again later.';
    default:
      return 'An unexpected error occurred. Please try again.';
  }
};

/**
 * Custom API Error class
 */
export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/**
 * Main API client instance
 */
export const apiClient = createApiClient();

/**
 * Separate client for JWT auth (different base URL)
 */
export const authClient = axios.create({
  baseURL: apiConfig.baseUrl,
  timeout: apiConfig.timeout,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default apiClient;
