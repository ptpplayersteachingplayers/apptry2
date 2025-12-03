/**
 * Auth Context and Hook
 *
 * Manages authentication state across the app.
 * Provides login, logout, and user profile management.
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import {
  User,
  ParentUser,
  TrainerUser,
  LoginRequest,
  SignUpRequest,
  OnboardingData,
} from '../types';
import {
  login as apiLogin,
  signUp as apiSignUp,
  logout as apiLogout,
  getCurrentUser,
  completeOnboarding,
  setMockUserRole,
} from '../api/auth';
import { TOKEN_STORAGE_KEY, setOnAuthError } from '../api/client';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isOnboarded: boolean;
}

interface AuthContextType extends AuthState {
  login: (credentials: LoginRequest) => Promise<void>;
  signUp: (data: SignUpRequest) => Promise<void>;
  logout: () => Promise<void>;
  finishOnboarding: (data: OnboardingData) => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * AuthProvider - Wraps the app and provides auth context
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    isOnboarded: false,
  });

  // Check for stored token on mount
  useEffect(() => {
    checkAuthState();
  }, []);

  // Set up auth error callback
  useEffect(() => {
    setOnAuthError(() => {
      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        isOnboarded: false,
      });
    });
  }, []);

  const checkAuthState = async () => {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_STORAGE_KEY);

      if (token) {
        // Verify token by fetching user
        const user = await getCurrentUser();
        const isOnboarded = checkOnboardingComplete(user);

        setState({
          user,
          isLoading: false,
          isAuthenticated: true,
          isOnboarded,
        });
      } else {
        setState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
          isOnboarded: false,
        });
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        isOnboarded: false,
      });
    }
  };

  const checkOnboardingComplete = (user: User): boolean => {
    // For parents, check if they have set preferred location
    if (user.role === 'ptp_parent') {
      const parent = user as ParentUser;
      return !!(parent.preferredLocation?.state && parent.mainInterest);
    }
    // Trainers are considered onboarded if they have a bio
    if (user.role === 'ptp_trainer') {
      const trainer = user as TrainerUser;
      return !!trainer.bio;
    }
    return true;
  };

  const login = async (credentials: LoginRequest) => {
    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      const response = await apiLogin(credentials);
      const isOnboarded = checkOnboardingComplete(response.user);

      setState({
        user: response.user,
        isLoading: false,
        isAuthenticated: true,
        isOnboarded,
      });
    } catch (error) {
      setState((prev) => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  const signUp = async (data: SignUpRequest) => {
    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      const response = await apiSignUp(data);

      setState({
        user: response.user,
        isLoading: false,
        isAuthenticated: true,
        isOnboarded: false, // New users need onboarding
      });
    } catch (error) {
      setState((prev) => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  const logout = async () => {
    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      await apiLogout();
      // Reset mock user role for demo mode
      setMockUserRole('ptp_parent');

      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        isOnboarded: false,
      });
    } catch (error) {
      console.error('Logout error:', error);
      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        isOnboarded: false,
      });
    }
  };

  const finishOnboarding = async (data: OnboardingData) => {
    try {
      await completeOnboarding(data);
      setState((prev) => ({ ...prev, isOnboarded: true }));
    } catch (error) {
      throw error;
    }
  };

  const refreshUser = async () => {
    try {
      const user = await getCurrentUser();
      setState((prev) => ({ ...prev, user }));
    } catch (error) {
      console.error('Refresh user error:', error);
    }
  };

  const updateUser = (updates: Partial<User>) => {
    setState((prev) => ({
      ...prev,
      user: prev.user ? { ...prev.user, ...updates } : null,
    }));
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        signUp,
        logout,
        finishOnboarding,
        refreshUser,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

/**
 * useAuth - Hook to access auth context
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/**
 * Helper hooks for specific user types
 */
export const useParentUser = (): ParentUser | null => {
  const { user } = useAuth();
  if (user?.role === 'ptp_parent') {
    return user as ParentUser;
  }
  return null;
};

export const useTrainerUser = (): TrainerUser | null => {
  const { user } = useAuth();
  if (user?.role === 'ptp_trainer') {
    return user as TrainerUser;
  }
  return null;
};

export const useIsTrainer = (): boolean => {
  const { user } = useAuth();
  return user?.role === 'ptp_trainer';
};

export default useAuth;
