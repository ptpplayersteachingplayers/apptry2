import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { queryKeys } from '@lib/queryClient';
import * as authApi from '@api/auth';
import * as programsApi from '@api/programs';
import * as trainingApi from '@api/training';
import * as messagesApi from '@api/messages';
import * as eventsApi from '@api/events';
import { Program, ProgramFilters } from '@types/program';
import { Trainer, TrainerFilters, TrainingSession } from '@types/training';
import { Conversation, Message } from '@types/message';
import { CalendarEvent } from '@types/event';

// ============ Programs (Camps & Clinics) ============

export function usePrograms(filters?: ProgramFilters) {
  return useQuery({
    queryKey: queryKeys.programs.list(filters || {}),
    queryFn: () => programsApi.getPrograms(filters),
  });
}

export function useProgram(id: number) {
  return useQuery({
    queryKey: queryKeys.programs.detail(id),
    queryFn: () => programsApi.getProgramById(id),
    enabled: !!id,
  });
}

export function useFeaturedPrograms() {
  return useQuery({
    queryKey: queryKeys.programs.featured(),
    queryFn: () => programsApi.getFeaturedPrograms(),
  });
}

export function useUpcomingPrograms() {
  return useQuery({
    queryKey: queryKeys.programs.upcoming(),
    queryFn: () => programsApi.getUpcomingPrograms(),
  });
}

// ============ Trainers ============

export function useTrainers(filters?: TrainerFilters) {
  return useQuery({
    queryKey: queryKeys.trainers.list(filters || {}),
    queryFn: () => trainingApi.getTrainers(filters),
  });
}

export function useTrainer(id: number) {
  return useQuery({
    queryKey: queryKeys.trainers.detail(id),
    queryFn: () => trainingApi.getTrainerById(id),
    enabled: !!id,
  });
}

export function useTrainerAvailability(trainerId: number, date: string) {
  return useQuery({
    queryKey: queryKeys.trainers.availability(trainerId, date),
    queryFn: () => trainingApi.getTrainerAvailability(trainerId, date),
    enabled: !!trainerId && !!date,
  });
}

// ============ Sessions ============

export function useSessions(status?: string) {
  return useQuery({
    queryKey: queryKeys.sessions.list(status),
    queryFn: () => trainingApi.getMySessions(status),
  });
}

export function useSession(id: number) {
  return useQuery({
    queryKey: queryKeys.sessions.detail(id),
    queryFn: () => trainingApi.getSessionById(id),
    enabled: !!id,
  });
}

export function useRequestSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: trainingApi.requestSession,
    onSuccess: () => {
      // Invalidate sessions list
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.all });
      // Invalidate events/schedule
      queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
    },
  });
}

export function useCancelSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sessionId, reason }: { sessionId: number; reason?: string }) =>
      trainingApi.cancelSession(sessionId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
    },
  });
}

// ============ Messages ============

export function useConversations() {
  return useQuery({
    queryKey: queryKeys.messages.conversations(),
    queryFn: () => messagesApi.getConversations(),
  });
}

export function useConversation(id: number) {
  return useQuery({
    queryKey: queryKeys.messages.conversation(id),
    queryFn: () => messagesApi.getConversationMessages(id),
    enabled: !!id,
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: queryKeys.messages.unreadCount(),
    queryFn: () => messagesApi.getUnreadCount(),
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: messagesApi.sendMessage,
    onSuccess: (_, variables) => {
      // Invalidate specific conversation
      if (variables.conversationId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.messages.conversation(variables.conversationId),
        });
      }
      // Invalidate conversations list
      queryClient.invalidateQueries({
        queryKey: queryKeys.messages.conversations(),
      });
    },
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: messagesApi.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.messages.unreadCount() });
    },
  });
}

// ============ Events/Schedule ============

export function useEvents(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: queryKeys.events.list(startDate, endDate),
    queryFn: () => eventsApi.getEvents(startDate, endDate),
  });
}

export function useUpcomingEvents() {
  return useQuery({
    queryKey: queryKeys.events.upcoming(),
    queryFn: () => eventsApi.getUpcomingEvents(),
  });
}

export function useCalendarData(month: number, year: number) {
  return useQuery({
    queryKey: queryKeys.events.calendar(month, year),
    queryFn: () => eventsApi.getCalendarData(month, year),
  });
}

// ============ Children ============

export function useChildren() {
  return useQuery({
    queryKey: queryKeys.children.list(),
    queryFn: () => trainingApi.getChildren(),
  });
}

export function useAddChild() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: trainingApi.addChild,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.children.all });
    },
  });
}

export function useUpdateChild() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ childId, data }: { childId: number; data: any }) =>
      trainingApi.updateChild(childId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.children.all });
    },
  });
}

export function useDeleteChild() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: trainingApi.deleteChild,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.children.all });
    },
  });
}

// ============ Trainer Dashboard ============

export function useTrainerDashboard() {
  return useQuery({
    queryKey: queryKeys.trainer.dashboard(),
    queryFn: () => trainingApi.getTrainerDashboard(),
  });
}

export function useTrainerStudents() {
  return useQuery({
    queryKey: queryKeys.trainer.students(),
    queryFn: () => trainingApi.getTrainerStudents(),
  });
}

export function useTrainerStudent(id: number) {
  return useQuery({
    queryKey: queryKeys.trainer.student(id),
    queryFn: () => trainingApi.getTrainerStudent(id),
    enabled: !!id,
  });
}

export function useTrainerEarnings(period: string = 'month') {
  return useQuery({
    queryKey: queryKeys.trainer.earnings(period),
    queryFn: () => trainingApi.getTrainerEarnings(period),
  });
}

export function useRespondToSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sessionId, action, message }: { sessionId: number; action: 'accept' | 'decline'; message?: string }) =>
      trainingApi.respondToSession(sessionId, action, message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.trainer.dashboard() });
      queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
    },
  });
}

export function useCompleteSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sessionId, notes }: { sessionId: number; notes?: string }) =>
      trainingApi.completeSession(sessionId, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.trainer.dashboard() });
      queryClient.invalidateQueries({ queryKey: queryKeys.trainer.earnings('month') });
    },
  });
}

// ============ Prefetch Helpers ============

export function usePrefetchProgram() {
  const queryClient = useQueryClient();

  return (id: number) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.programs.detail(id),
      queryFn: () => programsApi.getProgramById(id),
    });
  };
}

export function usePrefetchTrainer() {
  const queryClient = useQueryClient();

  return (id: number) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.trainers.detail(id),
      queryFn: () => trainingApi.getTrainerById(id),
    });
  };
}

export default {
  usePrograms,
  useProgram,
  useFeaturedPrograms,
  useUpcomingPrograms,
  useTrainers,
  useTrainer,
  useTrainerAvailability,
  useSessions,
  useSession,
  useRequestSession,
  useCancelSession,
  useConversations,
  useConversation,
  useUnreadCount,
  useSendMessage,
  useMarkAsRead,
  useEvents,
  useUpcomingEvents,
  useCalendarData,
  useChildren,
  useAddChild,
  useUpdateChild,
  useDeleteChild,
  useTrainerDashboard,
  useTrainerStudents,
  useTrainerStudent,
  useTrainerEarnings,
  useRespondToSession,
  useCompleteSession,
};
