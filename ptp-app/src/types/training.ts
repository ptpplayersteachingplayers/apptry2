// Training Platform Types

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
  | 'speed_agility'
  | 'game_iq'
  | 'general';

export type SessionStatus =
  | 'requested'
  | 'pending'
  | 'confirmed'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export type PlayerPosition =
  | 'goalkeeper'
  | 'defender'
  | 'midfielder'
  | 'forward'
  | 'any';

export interface Trainer {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  college_pro: string;
  position: PlayerPosition;
  bio: string | null;
  tagline: string | null;
  teaching_style: string | null;
  specialties: TrainingFocus[];
  hourly_rate: number;
  headshot_url: string | null;
  gallery_urls: string[];
  rating: number;
  review_count: number;
  total_sessions: number;
  is_verified: boolean;
  is_accepting_students: boolean;
  created_at: string;
}

export interface TrainerCard {
  id: string;
  first_name: string;
  last_name: string;
  college_pro: string;
  position: PlayerPosition;
  tagline: string | null;
  specialties: TrainingFocus[];
  hourly_rate: number;
  rating: number;
  review_count: number;
  headshot_url: string | null;
  is_verified: boolean;
  is_accepting_students: boolean;
  home_location: {
    city: string;
    state: string;
    market_slug: string;
  } | null;
  markets_served: string[];
}

export interface TrainerLocation {
  id: string;
  trainer_id: string;
  name: string;
  address: string | null;
  city: string;
  state: string;
  market_slug: string;
  is_home_base: boolean;
  travel_radius_miles: number;
}

export interface TrainerAvailabilitySlot {
  available_date: string;
  start_time: string;
  end_time: string;
  is_booked: boolean;
  location_name: string | null;
}

export interface TrainingSession {
  id: string;
  trainer_id: string;
  parent_id: string;
  child_id: string | null;
  session_date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  location_name: string;
  city: string;
  state: string;
  focus: TrainingFocus[];
  player_notes: string | null;
  trainer_notes: string | null;
  homework: string | null;
  status: SessionStatus;
  price_cents: number;
  is_paid: boolean;
  effort_rating: number | null;
  attitude_rating: number | null;
  created_at: string;
}

export interface MyTrainingSession {
  session_id: string;
  session_date: string;
  start_time: string;
  end_time: string;
  status: SessionStatus;
  price_cents: number;
  is_paid: boolean;
  location_name: string;
  city: string;
  state: string;
  focus: TrainingFocus[];
  player_notes: string | null;
  trainer_notes: string | null;
  child_id: string | null;
  child_first_name: string | null;
  child_last_name: string | null;
  trainer_id: string;
  trainer_first_name: string;
  trainer_last_name: string;
  trainer_college: string;
  trainer_headshot: string | null;
  trainer_rating: number;
  parent_id: string;
  created_at: string;
}

export interface TrainerReview {
  id: string;
  trainer_id: string;
  parent_id: string;
  session_id: string | null;
  rating: number;
  comment: string | null;
  trainer_response: string | null;
  created_at: string;
}

export interface SessionRequest {
  trainer_id: string;
  child_id?: string;
  preferred_slots: {
    date: string;
    start_time: string;
    end_time: string;
  }[];
  focus: TrainingFocus[];
  notes?: string;
}

export interface TrainerDashboard {
  success: boolean;
  today_sessions: number;
  pending_requests: number;
  week_sessions: number;
  month_earnings: number;
  total_students: number;
  next_session: {
    id: string;
    session_date: string;
    start_time: string;
    end_time: string;
    location_name: string;
    child_first_name: string;
    child_last_name: string;
  } | null;
}

// Focus area display helpers
export const focusLabels: Record<TrainingFocus, string> = {
  '1v1': '1v1 Moves',
  finishing: 'Finishing',
  passing: 'Passing',
  dribbling: 'Dribbling',
  shooting: 'Shooting',
  goalkeeper: 'Goalkeeper',
  defense: 'Defense',
  midfield: 'Midfield Play',
  confidence: 'Confidence',
  speed_agility: 'Speed & Agility',
  game_iq: 'Game IQ',
  general: 'General Training',
};

export const positionLabels: Record<PlayerPosition, string> = {
  goalkeeper: 'Goalkeeper',
  defender: 'Defender',
  midfielder: 'Midfielder',
  forward: 'Forward',
  any: 'All Positions',
};

export const sessionStatusLabels: Record<SessionStatus, string> = {
  requested: 'Requested',
  pending: 'Pending',
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
  no_show: 'No Show',
};

export const sessionStatusColors: Record<SessionStatus, string> = {
  requested: '#f59e0b',
  pending: '#f59e0b',
  confirmed: '#10b981',
  completed: '#3b82f6',
  cancelled: '#ef4444',
  no_show: '#6b7280',
};
