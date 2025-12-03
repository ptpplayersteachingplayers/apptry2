/**
 * PTP Soccer Hooks
 *
 * Central export for all custom hooks.
 */

// Auth
export { AuthProvider, useAuth, useParentUser, useTrainerUser, useIsTrainer } from './useAuth';

// Notifications
export { useNotifications, scheduleLocalNotification } from './useNotifications';

// Haptic Feedback
export { useHaptics } from './useHaptics';

// Debounce
export { useDebounce, useDebouncedCallback, useDebouncedSearch } from './useDebounce';

// Pull to Refresh
export { useRefresh } from './useRefresh';
