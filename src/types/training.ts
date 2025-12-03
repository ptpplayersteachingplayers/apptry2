/**
 * Training-related TypeScript types
 *
 * Defines types for private training sessions, requests, and trainer details.
 * Private training is the follow-up product after camps/clinics.
 */

import { AgeBand, ChildProfile, TrainerUser, USState } from './user';

// Training session status
export type SessionStatus =
  | 'requested'
  | 'pending'
  | 'confirmed'
  | 'completed'
  | 'cancelled'
  | 'no-show';

// Focus areas for training
export type TrainingFocus =
  | '1v1'
  | 'finishing'
  | 'passing'
  | 'dribbling'
  | 'shooting'
  | 'goalkeeper'
  | 'defense'
  | 'midfield'
  | 'confidence'
  | 'speed-agility'
  | 'game-iq'
  | 'general';

/**
 * Training session
 * Represents a private training session between trainer and player
 */
export interface TrainingSession {
  id: number;
  trainerId: number;
  trainer: TrainerSummary;
  parentId: number;
  childId?: number;
  child?: ChildProfile;

  // Scheduling
  date: string; // ISO date
  startTime: string; // e.g., "14:00"
  endTime: string; // e.g., "15:00"
  duration: number; // minutes

  // Location
  location: string;
  address?: string;
  city: string;
  state: USState;
  coordinates?: {
    lat: number;
    lng: number;
  };

  // Session details
  focus: TrainingFocus[];
  notes?: string;
  playerNotes?: string; // Notes from parent about player
  trainerNotes?: string; // Notes from trainer after session

  // Status and meta
  status: SessionStatus;
  price: number;
  isPaid: boolean;
  orderId?: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Trainer summary for session displays
 */
export interface TrainerSummary {
  id: number;
  firstName: string;
  lastName: string;
  collegePro: string;
  position: string;
  headshotUrl?: string;
  rating?: number;
}

/**
 * Training session request
 * Sent when parent requests a session with a trainer
 */
export interface SessionRequest {
  trainerId: number;
  childId?: number;

  // Preferred dates/times (up to 3 options)
  preferredSlots: PreferredSlot[];

  // Location preference
  locationPreference: 'trainer' | 'custom';
  customLocation?: string;

  // Session details
  focus: TrainingFocus[];
  notes?: string;
}

/**
 * Preferred time slot for session request
 */
export interface PreferredSlot {
  date: string; // ISO date
  startTime: string; // e.g., "14:00"
  endTime: string; // e.g., "15:00"
}

/**
 * Session request response
 */
export interface SessionRequestResponse {
  success: boolean;
  requestId: number;
  message: string;
}

/**
 * Trainer filter options
 */
export interface TrainerFilters {
  state?: USState;
  city?: string;
  marketSlug?: string;
  ageBand?: AgeBand;
  specialty?: TrainingFocus;
  priceMin?: number;
  priceMax?: number;
  rating?: number;
  isVerified?: boolean;
}

/**
 * Trainers API response
 */
export interface TrainersResponse {
  trainers: TrainerUser[];
  total: number;
  page: number;
  perPage: number;
  hasMore: boolean;
}

/**
 * Trainer card display data
 */
export interface TrainerCardData {
  id: number;
  firstName: string;
  lastName: string;
  collegePro: string;
  position: string;
  specialties: string[];
  hourlyRate: number;
  rating?: number;
  reviewCount?: number;
  headshotUrl?: string;
  tagline?: string; // e.g., "Villanova forward | 1v1 & finishing"
}

/**
 * Trainer review
 */
export interface TrainerReview {
  id: number;
  trainerId: number;
  parentId: number;
  parentName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

/**
 * Trainer availability for booking
 */
export interface TrainerAvailabilitySlot {
  date: string;
  slots: {
    start: string;
    end: string;
    isAvailable: boolean;
  }[];
}

/**
 * Training session for schedule display
 */
export interface ScheduledSession {
  id: number;
  type: 'training';
  title: string;
  subtitle: string; // Trainer name
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  status: SessionStatus;
  trainerId: number;
  trainerHeadshotUrl?: string;
}

/**
 * Trainer earnings summary
 */
export interface TrainerEarnings {
  totalEarnings: number;
  thisMonth: number;
  thisWeek: number;
  pendingPayout: number;
  lastPayoutDate?: string;
  lastPayoutAmount?: number;
}

/**
 * Trainer session stats
 */
export interface TrainerStats {
  totalSessions: number;
  thisWeekSessions: number;
  thisMonthSessions: number;
  completionRate: number; // percentage
  averageRating: number;
}
