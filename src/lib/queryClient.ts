import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is considered fresh for 5 minutes
      staleTime: 5 * 60 * 1000,
      // Cache data for 30 minutes
      gcTime: 30 * 60 * 1000,
      // Retry failed requests up to 3 times
      retry: 3,
      // Exponential backoff for retries
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Refetch on window focus (mobile app resume)
      refetchOnWindowFocus: true,
      // Don't refetch on mount if data is fresh
      refetchOnMount: true,
      // Refetch when network reconnects
      refetchOnReconnect: true,
    },
    mutations: {
      // Retry mutations once on failure
      retry: 1,
    },
  },
});

// Query keys factory for type safety and consistency
export const queryKeys = {
  // Auth
  auth: {
    all: ['auth'] as const,
    user: () => [...queryKeys.auth.all, 'user'] as const,
  },

  // Programs (camps & clinics)
  programs: {
    all: ['programs'] as const,
    lists: () => [...queryKeys.programs.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.programs.lists(), filters] as const,
    details: () => [...queryKeys.programs.all, 'detail'] as const,
    detail: (id: number) => [...queryKeys.programs.details(), id] as const,
    featured: () => [...queryKeys.programs.all, 'featured'] as const,
    upcoming: () => [...queryKeys.programs.all, 'upcoming'] as const,
  },

  // Training
  trainers: {
    all: ['trainers'] as const,
    lists: () => [...queryKeys.trainers.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.trainers.lists(), filters] as const,
    details: () => [...queryKeys.trainers.all, 'detail'] as const,
    detail: (id: number) => [...queryKeys.trainers.details(), id] as const,
    availability: (id: number, date: string) => [...queryKeys.trainers.all, 'availability', id, date] as const,
  },

  // Sessions
  sessions: {
    all: ['sessions'] as const,
    lists: () => [...queryKeys.sessions.all, 'list'] as const,
    list: (status?: string) => [...queryKeys.sessions.lists(), status] as const,
    detail: (id: number) => [...queryKeys.sessions.all, 'detail', id] as const,
  },

  // Messages
  messages: {
    all: ['messages'] as const,
    conversations: () => [...queryKeys.messages.all, 'conversations'] as const,
    conversation: (id: number) => [...queryKeys.messages.conversations(), id] as const,
    unreadCount: () => [...queryKeys.messages.all, 'unread'] as const,
  },

  // Events/Schedule
  events: {
    all: ['events'] as const,
    list: (startDate?: string, endDate?: string) => [...queryKeys.events.all, 'list', startDate, endDate] as const,
    upcoming: () => [...queryKeys.events.all, 'upcoming'] as const,
    calendar: (month: number, year: number) => [...queryKeys.events.all, 'calendar', month, year] as const,
  },

  // Children
  children: {
    all: ['children'] as const,
    list: () => [...queryKeys.children.all, 'list'] as const,
    detail: (id: number) => [...queryKeys.children.all, 'detail', id] as const,
  },

  // Trainer-specific
  trainer: {
    dashboard: () => ['trainer', 'dashboard'] as const,
    students: () => ['trainer', 'students'] as const,
    student: (id: number) => ['trainer', 'student', id] as const,
    earnings: (period: string) => ['trainer', 'earnings', period] as const,
  },
};

export default queryClient;
