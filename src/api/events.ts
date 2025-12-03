/**
 * Events API Module
 *
 * Handles schedule events for the user (camps, clinics, training sessions).
 * Provides unified event data for calendar and list views.
 */

import { apiClient } from './client';
import { apiConfig } from './config';
import {
  ScheduleEvent,
  EventsResponse,
  EventsByDate,
  CalendarDayData,
  EventFilters,
  PostEventRecommendation,
} from '../types';
import { heroImages } from '../assets/media';

/**
 * Get user's events (camps, clinics, training sessions)
 *
 * GET /wp-json/ptp/v1/me/events
 */
export const getMyEvents = async (filters?: EventFilters): Promise<EventsResponse> => {
  if (apiConfig.demoMode) {
    return getMockEvents(filters);
  }

  const params = new URLSearchParams();
  if (filters?.type) params.append('type', filters.type);
  if (filters?.status) params.append('status', filters.status);
  if (filters?.dateFrom) params.append('date_from', filters.dateFrom);
  if (filters?.dateTo) params.append('date_to', filters.dateTo);
  if (filters?.childId) params.append('child_id', filters.childId.toString());

  const response = await apiClient.get(`/me/events?${params.toString()}`);
  return response.data;
};

/**
 * Get event details
 *
 * GET /wp-json/ptp/v1/me/events/:id
 */
export const getEvent = async (eventId: number): Promise<ScheduleEvent> => {
  if (apiConfig.demoMode) {
    const event = mockEvents.find((e) => e.id === eventId);
    if (!event) throw new Error('Event not found');
    return event;
  }

  const response = await apiClient.get(`/me/events/${eventId}`);
  return response.data;
};

/**
 * Get calendar data (dots/markers for each day)
 */
export const getCalendarData = async (
  year: number,
  month: number
): Promise<CalendarDayData[]> => {
  if (apiConfig.demoMode) {
    return getMockCalendarData(year, month);
  }

  const response = await apiClient.get(`/me/events/calendar?year=${year}&month=${month}`);
  return response.data;
};

/**
 * Get post-event recommendations
 * Shows upsell for private training after camp/clinic
 */
export const getPostEventRecommendations = async (
  eventId: number
): Promise<PostEventRecommendation | null> => {
  if (apiConfig.demoMode) {
    return getMockRecommendation(eventId);
  }

  const response = await apiClient.get(`/me/events/${eventId}/recommendations`);
  return response.data;
};

/**
 * Group events by date for list display
 */
export const groupEventsByDate = (events: ScheduleEvent[]): EventsByDate[] => {
  const grouped: { [key: string]: ScheduleEvent[] } = {};

  events.forEach((event) => {
    if (!grouped[event.date]) {
      grouped[event.date] = [];
    }
    grouped[event.date].push(event);
  });

  const today = new Date().toISOString().split('T')[0];

  return Object.entries(grouped)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, dayEvents]) => ({
      date,
      dateFormatted: formatDate(date),
      isToday: date === today,
      events: dayEvents.sort((a, b) => a.startTime.localeCompare(b.startTime)),
    }));
};

/**
 * Format date for display
 */
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  };
  return date.toLocaleDateString('en-US', options);
};

// ============================================================
// MOCK DATA FOR DEMO MODE
// ============================================================

const mockEvents: ScheduleEvent[] = [
  {
    id: 1,
    type: 'clinic',
    title: 'Winter Skills Intensive',
    subtitle: 'Steelyard Sports',
    date: '2024-12-28',
    startTime: '09:00',
    endTime: '12:00',
    location: 'Steelyard Sports – KOP, PA',
    address: '400 American Ave, King of Prussia, PA',
    coordinates: { lat: 40.0879, lng: -75.3825 },
    status: 'upcoming',
    programId: 1,
    programType: 'clinic',
    childId: 1,
    childName: 'Jake',
    whatToBring: ['Cleats', 'Shin guards', 'Water bottle'],
    imageUrl: heroImages[0],
    color: '#FCB900',
  },
  {
    id: 2,
    type: 'training',
    title: 'Private Training Session',
    subtitle: 'Marcus Williams',
    date: '2024-12-05',
    startTime: '16:00',
    endTime: '17:00',
    location: 'Steelyard Sports',
    address: '400 American Ave, King of Prussia, PA',
    status: 'upcoming',
    sessionStatus: 'confirmed',
    trainerId: 101,
    trainerName: 'Marcus Williams',
    trainerHeadshotUrl: heroImages[15],
    childId: 1,
    childName: 'Jake',
    notes: 'Focus on weak foot finishing',
    color: '#10B981',
  },
  {
    id: 3,
    type: 'camp',
    title: 'PTP Summer Soccer Camp',
    subtitle: 'Haverford School',
    date: '2025-06-23',
    startTime: '09:00',
    endTime: '15:00',
    isMultiDay: true,
    endDate: '2025-06-27',
    location: 'Haverford School, PA',
    address: '450 Lancaster Ave, Haverford, PA',
    status: 'upcoming',
    programId: 5,
    programType: 'camp',
    childId: 1,
    childName: 'Jake',
    whatToBring: ['Cleats', 'Shin guards', 'Water bottle', 'Lunch', 'Sunscreen'],
    imageUrl: heroImages[10],
    color: '#FCB900',
  },
];

const getMockEvents = async (filters?: EventFilters): Promise<EventsResponse> => {
  await new Promise((resolve) => setTimeout(resolve, 200));

  let filtered = [...mockEvents];

  if (filters?.type) {
    filtered = filtered.filter((e) => e.type === filters.type);
  }
  if (filters?.status) {
    filtered = filtered.filter((e) => e.status === filters.status);
  }
  if (filters?.childId) {
    filtered = filtered.filter((e) => e.childId === filters.childId);
  }

  return {
    events: filtered,
    total: filtered.length,
  };
};

const getMockCalendarData = (year: number, month: number): CalendarDayData[] => {
  const data: CalendarDayData[] = [];

  mockEvents.forEach((event) => {
    const eventDate = new Date(event.date);
    if (eventDate.getFullYear() === year && eventDate.getMonth() + 1 === month) {
      data.push({
        date: event.date,
        hasEvents: true,
        eventTypes: [event.type],
        eventCount: 1,
      });
    }
  });

  return data;
};

const getMockRecommendation = (eventId: number): PostEventRecommendation | null => {
  const event = mockEvents.find((e) => e.id === eventId);
  if (!event || event.type === 'training') return null;

  return {
    eventId,
    eventType: event.type,
    message: 'Keep the momentum going! Book 1v1 training to continue building on what Jake learned.',
    ctaText: 'Book Training',
    ctaAction: 'book-training',
    trainerId: 101,
    trainerName: 'Marcus Williams',
    trainerHeadshotUrl: heroImages[15],
  };
};

export { mockEvents };
