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

// API Hooks (React Query)
export {
  // Programs
  usePrograms,
  useProgram,
  useFeaturedPrograms,
  useUpcomingPrograms,
  // Trainers
  useTrainers,
  useTrainer,
  useTrainerAvailability,
  // Sessions
  useSessions,
  useSession,
  useRequestSession,
  useCancelSession,
  // Messages
  useConversations,
  useConversation,
  useUnreadCount,
  useSendMessage,
  useMarkAsRead,
  // Events
  useEvents,
  useUpcomingEvents,
  useCalendarData,
  // Children
  useChildren,
  useAddChild,
  useUpdateChild,
  useDeleteChild,
  // Trainer Dashboard
  useTrainerDashboard,
  useTrainerStudents,
  useTrainerStudent,
  useTrainerEarnings,
  useRespondToSession,
  useCompleteSession,
  // Prefetch
  usePrefetchProgram,
  usePrefetchTrainer,
} from './useApi';
