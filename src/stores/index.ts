/**
 * PTP Zustand Stores
 *
 * Central export for all state management stores.
 */

// Auth Store
export {
  useAuthStore,
  selectUser,
  selectIsAuthenticated,
  selectUserRole,
  selectIsParent,
  selectIsTrainer,
  selectChildren,
  selectParentProfile,
  selectTrainerProfile,
} from './authStore';
export type {
  User,
  UserRole,
  ParentProfile,
  TrainerProfile,
  Child,
} from './authStore';

// Booking Store
export {
  useBookingStore,
  selectCart,
  selectPricing,
  selectCurrentStep,
  selectTrainer,
  selectService,
  selectSelectedChildren,
} from './bookingStore';
export type {
  BookingCart,
  BookingLocation,
  LocationType,
  TrainerService,
  TimeSlot,
  PricingDetails,
} from './bookingStore';

// App Store
export {
  useAppStore,
  selectIsOnline,
  selectUserLocation,
  selectTrainerFilters,
  selectCampFilters,
  selectNotifications,
  selectUnreadCount,
  selectFavoriteTrainers,
  selectIsFavoriteTrainer,
} from './appStore';
export type {
  TrainerFilters,
  CampFilters,
  NotificationSettings,
  AppNotification,
  SkillLevel,
} from './appStore';
