/**
 * Auth Store - Zustand
 *
 * Manages authentication state including user, tokens, and auth status.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';

// Types
export type UserRole = 'PARENT' | 'TRAINER' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  phone?: string;
  role: UserRole;
  emailVerified: boolean;
  phoneVerified: boolean;
  createdAt: string;
}

export interface ParentProfile {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  phone: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode: string;
  profileImage?: string;
  stripeCustomerId?: string;
}

export interface TrainerProfile {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  phone: string;
  bio: string;
  profileImage?: string;
  coverImage?: string;
  currentTeam: string;
  teamLogo?: string;
  position: string;
  yearsExperience: number;
  credentials: string[];
  specialties: string[];
  city: string;
  state: string;
  zipCode: string;
  serviceRadius: number;
  serviceStates: string[];
  hourlyRate: number;
  instantBook: boolean;
  maxGroupSize: number;
  isActive: boolean;
  isVerified: boolean;
  stripeAccountId?: string;
  stripeOnboarded: boolean;
  payoutEnabled: boolean;
  rating?: number;
  totalSessions: number;
}

export interface Child {
  id: string;
  parentId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  skillLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'ELITE';
  position?: string;
  currentTeam?: string;
  notes?: string;
  profileImage?: string;
}

interface AuthState {
  // State
  user: User | null;
  parentProfile: ParentProfile | null;
  trainerProfile: TrainerProfile | null;
  children: Child[];
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isGuest: boolean;
  hasCompletedOnboarding: boolean;

  // Actions
  setUser: (user: User | null) => void;
  setParentProfile: (profile: ParentProfile | null) => void;
  setTrainerProfile: (profile: TrainerProfile | null) => void;
  setChildren: (children: Child[]) => void;
  addChild: (child: Child) => void;
  updateChild: (id: string, updates: Partial<Child>) => void;
  removeChild: (id: string) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setLoading: (loading: boolean) => void;
  setOnboardingComplete: (complete: boolean) => void;
  login: (user: User, accessToken: string, refreshToken: string, profile?: ParentProfile | TrainerProfile) => void;
  continueAsGuest: () => void;
  logout: () => void;
  reset: () => void;
}

// Secure storage adapter for Zustand persist
const secureStorage = {
  getItem: async (name: string) => {
    try {
      const value = await SecureStore.getItemAsync(name);
      return value ?? null;
    } catch {
      return null;
    }
  },
  setItem: async (name: string, value: string) => {
    try {
      await SecureStore.setItemAsync(name, value);
    } catch (error) {
      console.error('Error saving to SecureStore:', error);
    }
  },
  removeItem: async (name: string) => {
    try {
      await SecureStore.deleteItemAsync(name);
    } catch (error) {
      console.error('Error removing from SecureStore:', error);
    }
  },
};

const initialState = {
  user: null,
  parentProfile: null,
  trainerProfile: null,
  children: [],
  accessToken: null,
  refreshToken: null,
  isLoading: true,
  isAuthenticated: false,
  isGuest: false,
  hasCompletedOnboarding: false,
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setUser: (user) => set({ user, isAuthenticated: !!user }),

      setParentProfile: (parentProfile) => set({ parentProfile }),

      setTrainerProfile: (trainerProfile) => set({ trainerProfile }),

      setChildren: (children) => set({ children }),

      addChild: (child) => set((state) => ({ children: [...state.children, child] })),

      updateChild: (id, updates) =>
        set((state) => ({
          children: state.children.map((c) =>
            c.id === id ? { ...c, ...updates } : c
          ),
        })),

      removeChild: (id) =>
        set((state) => ({
          children: state.children.filter((c) => c.id !== id),
        })),

      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),

      setLoading: (isLoading) => set({ isLoading }),

      setOnboardingComplete: (hasCompletedOnboarding) => set({ hasCompletedOnboarding }),

      login: (user, accessToken, refreshToken, profile) => {
        const updates: Partial<AuthState> = {
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
          isLoading: false,
        };

        if (profile) {
          if (user.role === 'PARENT') {
            updates.parentProfile = profile as ParentProfile;
          } else if (user.role === 'TRAINER') {
            updates.trainerProfile = profile as TrainerProfile;
          }
        }

        set(updates);
      },

      continueAsGuest: () => {
        set({
          user: null,
          isLoading: false,
          isAuthenticated: false,
          isGuest: true,
          hasCompletedOnboarding: true,
        });
      },

      logout: () => {
        set(initialState);
        set({ isLoading: false, isGuest: false });
      },

      reset: () => set(initialState),
    }),
    {
      name: 'ptp-auth-storage',
      storage: createJSONStorage(() => secureStorage),
      partialize: (state) => ({
        user: state.user,
        parentProfile: state.parentProfile,
        trainerProfile: state.trainerProfile,
        children: state.children,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        hasCompletedOnboarding: state.hasCompletedOnboarding,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isLoading = false;
          state.isAuthenticated = !!state.user && !!state.accessToken;
        }
      },
    }
  )
);

// Selectors
export const selectUser = (state: AuthState) => state.user;
export const selectIsAuthenticated = (state: AuthState) => state.isAuthenticated;
export const selectUserRole = (state: AuthState) => state.user?.role;
export const selectIsParent = (state: AuthState) => state.user?.role === 'PARENT';
export const selectIsTrainer = (state: AuthState) => state.user?.role === 'TRAINER';
export const selectChildren = (state: AuthState) => state.children;
export const selectParentProfile = (state: AuthState) => state.parentProfile;
export const selectTrainerProfile = (state: AuthState) => state.trainerProfile;
