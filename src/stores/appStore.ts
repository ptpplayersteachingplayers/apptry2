/**
 * App Store - Zustand
 *
 * Manages global app state including UI, notifications, and filters.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Types
export type SkillLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'ELITE';

export interface TrainerFilters {
  zipCode: string;
  radius: number;
  state?: string;
  specialties: string[];
  minRating?: number;
  maxPrice?: number;
  instantBook?: boolean;
  sortBy: 'rating' | 'price_low' | 'price_high' | 'distance' | 'sessions';
}

export interface CampFilters {
  state?: string;
  city?: string;
  zipCode?: string;
  startDate?: string;
  endDate?: string;
  ageMin?: number;
  ageMax?: number;
  skillLevel?: SkillLevel;
  maxPrice?: number;
  sortBy: 'date' | 'price_low' | 'price_high' | 'distance';
}

export interface NotificationSettings {
  pushEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  bookingReminders: boolean;
  promotions: boolean;
  newMessages: boolean;
}

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: string;
}

interface AppState {
  // UI State
  isOnline: boolean;
  isAppReady: boolean;
  activeTab: string;

  // Location
  userLocation: {
    zipCode: string;
    city?: string;
    state?: string;
    latitude?: number;
    longitude?: number;
  } | null;

  // Filters
  trainerFilters: TrainerFilters;
  campFilters: CampFilters;

  // Notifications
  notifications: AppNotification[];
  unreadCount: number;
  notificationSettings: NotificationSettings;
  pushToken: string | null;

  // Favorites
  favoriteTrainers: string[];
  favoriteCamps: string[];

  // Search history
  recentSearches: string[];

  // Actions
  setOnline: (online: boolean) => void;
  setAppReady: (ready: boolean) => void;
  setActiveTab: (tab: string) => void;
  setUserLocation: (location: AppState['userLocation']) => void;
  setTrainerFilters: (filters: Partial<TrainerFilters>) => void;
  resetTrainerFilters: () => void;
  setCampFilters: (filters: Partial<CampFilters>) => void;
  resetCampFilters: () => void;
  addNotification: (notification: AppNotification) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  clearNotifications: () => void;
  setNotificationSettings: (settings: Partial<NotificationSettings>) => void;
  setPushToken: (token: string | null) => void;
  toggleFavoriteTrainer: (trainerId: string) => void;
  toggleFavoriteCamp: (campId: string) => void;
  addRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;
  reset: () => void;
}

const defaultTrainerFilters: TrainerFilters = {
  zipCode: '',
  radius: 25,
  specialties: [],
  sortBy: 'rating',
};

const defaultCampFilters: CampFilters = {
  sortBy: 'date',
};

const defaultNotificationSettings: NotificationSettings = {
  pushEnabled: true,
  emailEnabled: true,
  smsEnabled: false,
  bookingReminders: true,
  promotions: true,
  newMessages: true,
};

const initialState = {
  isOnline: true,
  isAppReady: false,
  activeTab: 'Home',
  userLocation: null,
  trainerFilters: defaultTrainerFilters,
  campFilters: defaultCampFilters,
  notifications: [],
  unreadCount: 0,
  notificationSettings: defaultNotificationSettings,
  pushToken: null,
  favoriteTrainers: [],
  favoriteCamps: [],
  recentSearches: [],
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setOnline: (isOnline) => set({ isOnline }),

      setAppReady: (isAppReady) => set({ isAppReady }),

      setActiveTab: (activeTab) => set({ activeTab }),

      setUserLocation: (userLocation) => set({ userLocation }),

      setTrainerFilters: (filters) =>
        set((state) => ({
          trainerFilters: { ...state.trainerFilters, ...filters },
        })),

      resetTrainerFilters: () => set({ trainerFilters: defaultTrainerFilters }),

      setCampFilters: (filters) =>
        set((state) => ({
          campFilters: { ...state.campFilters, ...filters },
        })),

      resetCampFilters: () => set({ campFilters: defaultCampFilters }),

      addNotification: (notification) =>
        set((state) => ({
          notifications: [notification, ...state.notifications].slice(0, 100),
          unreadCount: state.unreadCount + 1,
        })),

      markNotificationRead: (id) =>
        set((state) => {
          const notification = state.notifications.find((n) => n.id === id);
          if (!notification || notification.isRead) return state;
          return {
            notifications: state.notifications.map((n) =>
              n.id === id ? { ...n, isRead: true } : n
            ),
            unreadCount: Math.max(0, state.unreadCount - 1),
          };
        }),

      markAllNotificationsRead: () =>
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
          unreadCount: 0,
        })),

      clearNotifications: () => set({ notifications: [], unreadCount: 0 }),

      setNotificationSettings: (settings) =>
        set((state) => ({
          notificationSettings: { ...state.notificationSettings, ...settings },
        })),

      setPushToken: (pushToken) => set({ pushToken }),

      toggleFavoriteTrainer: (trainerId) =>
        set((state) => {
          const isFavorite = state.favoriteTrainers.includes(trainerId);
          return {
            favoriteTrainers: isFavorite
              ? state.favoriteTrainers.filter((id) => id !== trainerId)
              : [...state.favoriteTrainers, trainerId],
          };
        }),

      toggleFavoriteCamp: (campId) =>
        set((state) => {
          const isFavorite = state.favoriteCamps.includes(campId);
          return {
            favoriteCamps: isFavorite
              ? state.favoriteCamps.filter((id) => id !== campId)
              : [...state.favoriteCamps, campId],
          };
        }),

      addRecentSearch: (query) =>
        set((state) => {
          const filtered = state.recentSearches.filter((s) => s !== query);
          return {
            recentSearches: [query, ...filtered].slice(0, 10),
          };
        }),

      clearRecentSearches: () => set({ recentSearches: [] }),

      reset: () => set(initialState),
    }),
    {
      name: 'ptp-app-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        userLocation: state.userLocation,
        notificationSettings: state.notificationSettings,
        pushToken: state.pushToken,
        favoriteTrainers: state.favoriteTrainers,
        favoriteCamps: state.favoriteCamps,
        recentSearches: state.recentSearches,
      }),
    }
  )
);

// Selectors
export const selectIsOnline = (state: AppState) => state.isOnline;
export const selectUserLocation = (state: AppState) => state.userLocation;
export const selectTrainerFilters = (state: AppState) => state.trainerFilters;
export const selectCampFilters = (state: AppState) => state.campFilters;
export const selectNotifications = (state: AppState) => state.notifications;
export const selectUnreadCount = (state: AppState) => state.unreadCount;
export const selectFavoriteTrainers = (state: AppState) => state.favoriteTrainers;
export const selectIsFavoriteTrainer = (trainerId: string) => (state: AppState) =>
  state.favoriteTrainers.includes(trainerId);
