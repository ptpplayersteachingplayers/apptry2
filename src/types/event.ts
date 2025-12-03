/**
 * Event-related TypeScript types
 *
 * Defines types for schedule events (camps, clinics, training sessions).
 * Used in the Schedule tab for calendar and list views.
 */

import { ProgramType } from './program';
import { SessionStatus } from './training';

// Event type for schedule display
export type EventType = 'camp' | 'clinic' | 'training';

// Event status
export type EventStatus = 'upcoming' | 'today' | 'in-progress' | 'completed' | 'cancelled';

/**
 * Schedule event
 * Unified type for all calendar events
 */
export interface ScheduleEvent {
  id: number;
  type: EventType;
  title: string;
  subtitle?: string;

  // Timing
  date: string; // ISO date
  startTime: string; // e.g., "09:00"
  endTime: string; // e.g., "15:00"
  isMultiDay?: boolean;
  endDate?: string; // For multi-day camps

  // Location
  location: string;
  address?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };

  // Status
  status: EventStatus;
  sessionStatus?: SessionStatus; // For training sessions

  // Related entities
  programId?: number;
  programType?: ProgramType;
  trainerId?: number;
  trainerName?: string;
  trainerHeadshotUrl?: string;
  childId?: number;
  childName?: string;

  // Additional info
  whatToBring?: string[];
  notes?: string;
  coachNotes?: string;

  // Visual
  imageUrl?: string;
  color?: string; // For calendar dot
}

/**
 * Events API response
 */
export interface EventsResponse {
  events: ScheduleEvent[];
  total: number;
}

/**
 * Events grouped by date
 * For list view display
 */
export interface EventsByDate {
  date: string;
  dateFormatted: string;
  isToday: boolean;
  events: ScheduleEvent[];
}

/**
 * Calendar day data
 * For calendar view dots/markers
 */
export interface CalendarDayData {
  date: string;
  hasEvents: boolean;
  eventTypes: EventType[];
  eventCount: number;
}

/**
 * Event filters
 */
export interface EventFilters {
  type?: EventType;
  status?: EventStatus;
  dateFrom?: string;
  dateTo?: string;
  childId?: number;
}

/**
 * Post-event recommendation
 * Shown after camp/clinic to upsell training
 */
export interface PostEventRecommendation {
  eventId: number;
  eventType: EventType;
  message: string;
  ctaText: string;
  ctaAction: 'book-training' | 'view-trainer';
  trainerId?: number;
  trainerName?: string;
  trainerHeadshotUrl?: string;
}

/**
 * Event detail actions
 */
export type EventAction =
  | 'open-maps'
  | 'message-coach'
  | 'add-to-calendar'
  | 'view-program'
  | 'book-again';
