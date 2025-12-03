/**
 * Authentication API Module
 *
 * Handles login, signup, and token management.
 * Uses WordPress JWT Authentication plugin.
 */

import { authClient, storeToken, clearTokens } from './client';
import { apiConfig } from './config';
import {
  LoginRequest,
  LoginResponse,
  SignUpRequest,
  User,
  OnboardingData,
  ParentUser,
  TrainerUser,
} from '../types';

/**
 * Login with email and password
 *
 * Uses WordPress JWT Authentication plugin endpoint.
 * POST /wp-json/jwt-auth/v1/token
 */
export const login = async (credentials: LoginRequest): Promise<LoginResponse> => {
  // In demo mode, return mock user
  if (apiConfig.demoMode) {
    return mockLogin(credentials);
  }

  const response = await authClient.post(apiConfig.jwtAuthEndpoint, {
    username: credentials.email,
    password: credentials.password,
  });

  const { token, user_email, user_nicename, user_display_name } = response.data;

  // Store the token
  await storeToken(token);

  // Fetch full user profile
  const user = await getCurrentUser();

  return {
    token,
    user,
  };
};

/**
 * Sign up a new user
 *
 * POST /wp-json/ptp/v1/auth/register
 */
export const signUp = async (data: SignUpRequest): Promise<LoginResponse> => {
  // In demo mode, return mock user
  if (apiConfig.demoMode) {
    return mockSignUp(data);
  }

  const response = await authClient.post(`${apiConfig.namespace}/auth/register`, {
    email: data.email,
    password: data.password,
    first_name: data.firstName,
    last_name: data.lastName,
    phone: data.phone,
    role: data.role || 'ptp_parent',
  });

  const { token, user } = response.data;

  // Store the token
  await storeToken(token);

  return { token, user };
};

/**
 * Get current logged-in user
 *
 * GET /wp-json/ptp/v1/me
 */
export const getCurrentUser = async (): Promise<User> => {
  // In demo mode, return mock user
  if (apiConfig.demoMode) {
    return getMockCurrentUser();
  }

  const response = await authClient.get(`${apiConfig.namespace}/me`);
  return response.data;
};

/**
 * Update user profile
 *
 * PUT /wp-json/ptp/v1/profile
 */
export const updateProfile = async (
  data: Partial<ParentUser | TrainerUser>
): Promise<User> => {
  if (apiConfig.demoMode) {
    return { ...getMockCurrentUser(), ...data } as User;
  }

  const response = await authClient.put(`${apiConfig.namespace}/profile`, data);
  return response.data;
};

/**
 * Complete onboarding and save preferences
 *
 * POST /wp-json/ptp/v1/profile
 */
export const completeOnboarding = async (data: OnboardingData): Promise<void> => {
  if (apiConfig.demoMode) {
    console.log('Demo mode: Onboarding data saved', data);
    return;
  }

  await authClient.post(`${apiConfig.namespace}/profile`, {
    preferred_state: data.state,
    preferred_city: data.city,
    player_age_band: data.ageBand,
    player_skill_level: data.skillLevel,
    main_interest: data.mainInterest,
  });
};

/**
 * Logout and clear tokens
 */
export const logout = async (): Promise<void> => {
  await clearTokens();
};

/**
 * Request password reset
 *
 * POST /wp-json/ptp/v1/auth/forgot-password
 */
export const requestPasswordReset = async (email: string): Promise<void> => {
  if (apiConfig.demoMode) {
    console.log('Demo mode: Password reset requested for', email);
    return;
  }

  await authClient.post(`${apiConfig.namespace}/auth/forgot-password`, { email });
};

/**
 * Delete user account
 *
 * DELETE /wp-json/ptp/v1/me
 */
export const deleteAccount = async (): Promise<void> => {
  if (apiConfig.demoMode) {
    await clearTokens();
    return;
  }

  await authClient.delete(`${apiConfig.namespace}/me`);
  await clearTokens();
};

// ============================================================
// MOCK DATA FOR DEMO MODE
// ============================================================

let mockCurrentUserRole: 'ptp_parent' | 'ptp_trainer' = 'ptp_parent';

export const setMockUserRole = (role: 'ptp_parent' | 'ptp_trainer') => {
  mockCurrentUserRole = role;
};

const mockLogin = async (credentials: LoginRequest): Promise<LoginResponse> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Check for trainer login
  if (credentials.email.includes('trainer') || credentials.email.includes('coach')) {
    mockCurrentUserRole = 'ptp_trainer';
    return {
      token: 'demo_trainer_token_12345',
      user: getMockTrainerUser(),
    };
  }

  mockCurrentUserRole = 'ptp_parent';
  return {
    token: 'demo_parent_token_12345',
    user: getMockParentUser(),
  };
};

const mockSignUp = async (data: SignUpRequest): Promise<LoginResponse> => {
  await new Promise((resolve) => setTimeout(resolve, 500));

  const user: ParentUser = {
    id: 1,
    email: data.email,
    firstName: data.firstName,
    lastName: data.lastName,
    phone: data.phone,
    role: 'ptp_parent',
    children: [],
    notificationsEnabled: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return {
    token: 'demo_token_new_user',
    user,
  };
};

const getMockCurrentUser = (): User => {
  return mockCurrentUserRole === 'ptp_trainer' ? getMockTrainerUser() : getMockParentUser();
};

const getMockParentUser = (): ParentUser => ({
  id: 1,
  email: 'parent@example.com',
  firstName: 'Sarah',
  lastName: 'Johnson',
  phone: '(610) 555-1234',
  role: 'ptp_parent',
  children: [
    {
      id: 1,
      firstName: 'Jake',
      ageBand: '9-11',
      skillLevel: 'travel',
      position: 'midfielder',
      team: 'Main Line United',
    },
    {
      id: 2,
      firstName: 'Emma',
      ageBand: '6-8',
      skillLevel: 'rec',
      position: 'undecided',
    },
  ],
  preferredLocation: {
    state: 'PA',
    city: 'Wayne',
    zipCode: '19087',
  },
  mainInterest: 'all',
  notificationsEnabled: true,
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-11-20T14:30:00Z',
});

const getMockTrainerUser = (): TrainerUser => ({
  id: 100,
  email: 'trainer@example.com',
  firstName: 'Marcus',
  lastName: 'Williams',
  phone: '(215) 555-9876',
  role: 'ptp_trainer',
  collegePro: 'Villanova University',
  position: 'forward',
  bio: 'Former Villanova forward with 4 years of collegiate experience. Passionate about developing young players\' technical skills and building their confidence on the field.',
  teachingStyle: 'High-energy, positive reinforcement with focus on fundamentals and game situations.',
  specialties: ['1v1', 'finishing', 'shooting', 'confidence'],
  hourlyRate: 80,
  serviceLocations: [
    {
      id: 1,
      name: 'Steelyard Sports',
      address: '123 Sports Way',
      city: 'King of Prussia',
      state: 'PA',
      marketSlug: 'main-line',
      isHomeBase: true,
    },
  ],
  availability: {
    monday: [{ start: '16:00', end: '20:00' }],
    tuesday: [{ start: '16:00', end: '20:00' }],
    wednesday: [{ start: '16:00', end: '20:00' }],
    thursday: [{ start: '16:00', end: '20:00' }],
    friday: [{ start: '15:00', end: '19:00' }],
    saturday: [{ start: '09:00', end: '15:00' }],
    sunday: [{ start: '10:00', end: '14:00' }],
  },
  rating: 4.9,
  reviewCount: 47,
  isVerified: true,
  isBackgroundChecked: true,
  headshotUrl: 'https://ptpsummercamps.com/wp-content/uploads/2025/12/BG7A1915.jpg',
  createdAt: '2023-06-01T10:00:00Z',
  updatedAt: '2024-11-25T09:00:00Z',
});
