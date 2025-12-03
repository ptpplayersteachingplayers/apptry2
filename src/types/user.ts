/**
 * User-related TypeScript types
 *
 * Defines types for authentication, user profiles, and child profiles.
 */

// User roles in the PTP system
export type UserRole = 'ptp_parent' | 'ptp_trainer' | 'admin';

// States where PTP operates
export type USState = 'PA' | 'NJ' | 'DE' | 'MD' | 'NY' | 'CT';

// Player age bands
export type AgeBand = '6-8' | '9-11' | '12-14' | '15-17' | '18+';

// Skill levels
export type SkillLevel = 'rec' | 'travel' | 'elite';

// Main interests for onboarding
export type MainInterest = 'winter-clinics' | 'summer-camps' | 'private-training' | 'all';

/**
 * Base user interface
 * Common fields for all user types
 */
export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Parent user profile
 * Extends base user with parent-specific fields
 */
export interface ParentUser extends User {
  role: 'ptp_parent';
  children: ChildProfile[];
  preferredLocation?: {
    state: USState;
    city: string;
    zipCode?: string;
  };
  mainInterest?: MainInterest;
  notificationsEnabled: boolean;
  pushToken?: string;
}

/**
 * Child profile
 * Represents a player/child managed by a parent
 */
export interface ChildProfile {
  id: number;
  firstName: string;
  lastName?: string;
  dateOfBirth?: string;
  ageBand: AgeBand;
  skillLevel: SkillLevel;
  position?: PlayerPosition;
  team?: string;
  notes?: string;
  avatarUrl?: string;
}

/**
 * Player positions
 */
export type PlayerPosition =
  | 'goalkeeper'
  | 'defender'
  | 'midfielder'
  | 'forward'
  | 'all-around'
  | 'undecided';

/**
 * Trainer/Mentor user profile
 * Extends base user with trainer-specific fields
 */
export interface TrainerUser extends User {
  role: 'ptp_trainer';
  collegePro: string; // College or pro team affiliation
  position: PlayerPosition;
  bio: string;
  teachingStyle?: string;
  specialties: TrainerSpecialty[];
  hourlyRate: number;
  serviceLocations: ServiceLocation[];
  availability: WeeklyAvailability;
  rating?: number;
  reviewCount?: number;
  isVerified: boolean;
  isBackgroundChecked: boolean;
  headshotUrl?: string;
  galleryUrls?: string[];
}

/**
 * Trainer specialties
 */
export type TrainerSpecialty =
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
  | 'game-iq';

/**
 * Service location for trainers
 */
export interface ServiceLocation {
  id: number;
  name: string;
  address?: string;
  city: string;
  state: USState;
  marketSlug: string; // e.g., 'main-line', 'short-hills'
  isHomeBase: boolean;
}

/**
 * Weekly availability
 */
export interface WeeklyAvailability {
  monday: TimeSlot[];
  tuesday: TimeSlot[];
  wednesday: TimeSlot[];
  thursday: TimeSlot[];
  friday: TimeSlot[];
  saturday: TimeSlot[];
  sunday: TimeSlot[];
}

/**
 * Time slot for availability
 */
export interface TimeSlot {
  start: string; // e.g., "09:00"
  end: string; // e.g., "12:00"
}

/**
 * Authentication tokens
 */
export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
}

/**
 * Login request payload
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Login response from backend
 */
export interface LoginResponse {
  token: string;
  user: User;
}

/**
 * Sign up request payload
 */
export interface SignUpRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role?: UserRole;
}

/**
 * Onboarding data collected during initial setup
 */
export interface OnboardingData {
  state: USState;
  city: string;
  ageBand: AgeBand;
  skillLevel: SkillLevel;
  mainInterest: MainInterest;
}

/**
 * Profile update request
 */
export interface ProfileUpdateRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  preferredLocation?: {
    state: USState;
    city: string;
    zipCode?: string;
  };
  notificationsEnabled?: boolean;
}
