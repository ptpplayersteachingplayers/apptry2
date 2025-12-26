/**
 * Training API Module
 *
 * Handles private training sessions and trainer data.
 * Private training is the follow-up product discovered through camps/clinics.
 *
 * Endpoints (WordPress PTP Training Plugin):
 * - GET /trainers - List trainers with filtering
 * - GET /trainers/:id - Get trainer details
 * - GET /trainers/:id/availability - Get trainer availability slots
 * - POST /training/request - Request a new training session
 * - GET /training/my-sessions - Get user's training sessions
 * - GET /training/sessions/:id - Get session details
 * - POST /training/sessions/:id/cancel - Cancel a session
 */

import { apiClient } from './client';
import { apiConfig } from './config';
import {
  TrainerUser,
  TrainerFilters,
  TrainersResponse,
  TrainerCardData,
  TrainerReview,
  TrainingSession,
  SessionRequest,
  SessionRequestResponse,
  TrainerAvailabilitySlot,
  TrainerEarnings,
  TrainerStats,
  SessionStatus,
} from '../types';
import { heroImages } from '../assets/media';

// ============================================================
// DATE HELPERS FOR DYNAMIC MOCK DATA
// ============================================================

/**
 * Get a date relative to today
 */
const getRelativeDate = (daysFromNow: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().split('T')[0];
};

/**
 * Get current timestamp for mock data
 */
const getCurrentTimestamp = (): string => new Date().toISOString();

/**
 * Get past timestamp for mock data
 */
const getPastTimestamp = (daysAgo: number): string => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString();
};

/**
 * Get list of trainers/mentors
 *
 * GET /wp-json/ptp/v1/trainers
 */
export const getTrainers = async (
  filters?: TrainerFilters,
  page = 1,
  perPage = 10
): Promise<TrainersResponse> => {
  if (apiConfig.demoMode) {
    return getMockTrainers(filters, page, perPage);
  }

  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('per_page', perPage.toString());

  if (filters?.state) params.append('location', filters.state);
  if (filters?.city) params.append('location', filters.city);
  if (filters?.marketSlug) params.append('location', filters.marketSlug);
  if (filters?.specialty) params.append('specialization', filters.specialty);
  if (filters?.priceMax) params.append('max_price', filters.priceMax.toString());
  if (filters?.rating) params.append('min_rating', filters.rating.toString());

  const response = await apiClient.get(`/trainers?${params.toString()}`);

  // Map WordPress response to our format
  const { trainers, total, total_pages } = response.data;
  return {
    trainers: trainers.map(mapWordPressTrainer),
    total,
    page,
    perPage,
    hasMore: page < total_pages,
  };
};

/**
 * Get a single trainer by ID
 *
 * GET /wp-json/ptp/v1/trainers/:id
 */
export const getTrainer = async (trainerId: number): Promise<TrainerUser> => {
  if (apiConfig.demoMode) {
    const trainer = mockTrainers.find((t) => t.id === trainerId);
    if (!trainer) throw new Error('Trainer not found');
    return trainer;
  }

  const response = await apiClient.get(`/trainers/${trainerId}`);
  return mapWordPressTrainer(response.data);
};

/**
 * Map v2 API trainer response to app TrainerUser type
 */
const mapWordPressTrainer = (wpTrainer: any): TrainerUser => {
  // Parse name into first/last
  const nameParts = (wpTrainer.name || '').split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  // Parse location
  const locationParts = (wpTrainer.location || '').split(',').map((s: string) => s.trim());
  const city = locationParts[0] || 'Philadelphia';
  const state = locationParts[1] || 'PA';

  return {
    id: wpTrainer.id,
    email: wpTrainer.email || '',
    role: 'ptp_trainer',
    firstName,
    lastName,
    phone: wpTrainer.phone || '',
    avatarUrl: wpTrainer.photo,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    // Trainer specific
    collegePro: wpTrainer.college || wpTrainer.playing_level || '',
    position: wpTrainer.position || 'midfielder',
    bio: wpTrainer.bio || wpTrainer.headline || '',
    teachingStyle: '',
    specialties: wpTrainer.specialties || [],
    hourlyRate: wpTrainer.hourly_rate || 80,
    serviceLocations: wpTrainer.training_locations?.map((loc: any, idx: number) => ({
      id: idx + 1,
      name: loc.name || loc,
      city: loc.city || city,
      state: loc.state || state,
      marketSlug: 'main-line',
      isHomeBase: idx === 0,
    })) || [{
      id: 1,
      name: wpTrainer.location || 'TBD',
      city,
      state: state as any,
      marketSlug: 'main-line',
      isHomeBase: true,
    }],
    availability: {
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: [],
      sunday: [],
    },
    rating: wpTrainer.rating || 5.0,
    reviewCount: wpTrainer.review_count || 0,
    isVerified: wpTrainer.is_verified || true,
    isBackgroundChecked: true,
    headshotUrl: wpTrainer.photo,
    galleryUrls: [],
  };
};

/**
 * Get trainer reviews
 * Reviews are included in the trainer detail response from WordPress
 *
 * GET /wp-json/ptp/v1/trainers/:id (includes reviews)
 */
export const getTrainerReviews = async (trainerId: number): Promise<TrainerReview[]> => {
  if (apiConfig.demoMode) {
    return getMockReviews(trainerId);
  }

  const response = await apiClient.get(`/trainers/${trainerId}`);
  return (response.data.reviews || []).map((r: any) => ({
    id: r.id,
    parentName: r.reviewer_name,
    rating: r.rating,
    comment: r.comment,
    date: r.date,
    sessionId: r.session_id,
  }));
};

/**
 * Get trainer availability for a specific date
 *
 * GET /wp-json/ptp/v1/trainers/:id/availability
 */
export const getTrainerAvailability = async (
  trainerId: number,
  dateFrom: string,
  _dateTo: string
): Promise<TrainerAvailabilitySlot[]> => {
  if (apiConfig.demoMode) {
    return getMockAvailability(trainerId, dateFrom, _dateTo);
  }

  const response = await apiClient.get(`/trainers/${trainerId}/availability?date=${dateFrom}`);
  const { available_slots, date } = response.data;

  return available_slots.map((slot: any, index: number) => ({
    id: index + 1,
    trainerId,
    date,
    startTime: slot.start_time,
    endTime: slot.end_time,
    isAvailable: true,
    price: 80, // Would come from trainer profile
  }));
};

/**
 * Request a training session
 *
 * POST /wp-json/ptp/v1/training/request
 */
export const requestSession = async (data: SessionRequest): Promise<SessionRequestResponse> => {
  if (apiConfig.demoMode) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return {
      success: true,
      requestId: Math.floor(Math.random() * 1000),
      message: 'Your session request has been sent! The trainer will respond within 24 hours.',
    };
  }

  // Map preferred slots to API format
  const primarySlot = data.preferredSlots[0];
  const response = await apiClient.post('/training/request', {
    trainer_id: data.trainerId,
    child_id: data.childId,
    preferred_slots: data.preferredSlots.map(slot => ({
      date: slot.date,
      start_time: slot.startTime,
      end_time: slot.endTime,
    })),
    location_preference: data.locationPreference,
    custom_location: data.customLocation,
    focus: data.focus?.join(', '),
    notes: data.notes,
  });

  return {
    success: response.data.success,
    requestId: response.data.session_id,
    message: response.data.message,
  };
};

/**
 * Get user's training sessions (for parents)
 *
 * GET /wp-json/ptp/v1/training/my-sessions
 */
export const getMySessions = async (status?: 'all' | 'upcoming' | 'past' | 'pending'): Promise<TrainingSession[]> => {
  if (apiConfig.demoMode) {
    return mockSessions;
  }

  // v1 API uses /training/my-sessions endpoint
  const params = status ? `?status=${status}` : '';
  const response = await apiClient.get(`/training/my-sessions${params}`);

  return (response.data.bookings || response.data || []).map(mapWordPressSession);
};

/**
 * Get a single session by ID
 *
 * GET /wp-json/ptp/v1/training/sessions/:id
 */
export const getSession = async (sessionId: number): Promise<TrainingSession> => {
  if (apiConfig.demoMode) {
    const session = mockSessions.find((s) => s.id === sessionId);
    if (!session) throw new Error('Session not found');
    return session;
  }

  // v1 API uses /training/sessions endpoint
  const response = await apiClient.get(`/training/sessions/${sessionId}`);
  return mapWordPressSession(response.data);
};

/**
 * Cancel a training session
 *
 * POST /wp-json/ptp/v1/training/sessions/:id/cancel
 */
export const cancelSession = async (sessionId: number, reason?: string): Promise<{ success: boolean; message: string }> => {
  if (apiConfig.demoMode) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return { success: true, message: 'Session cancelled' };
  }

  // v1 API uses /training/sessions endpoint
  const response = await apiClient.post(`/training/sessions/${sessionId}/cancel`, { reason });
  return response.data;
};

/**
 * Map WordPress session response to app TrainingSession type
 */
const mapWordPressSession = (wpSession: any): TrainingSession => ({
  id: wpSession.id,
  trainerId: wpSession.trainer?.id,
  trainer: {
    id: wpSession.trainer?.id || 0,
    firstName: wpSession.trainer?.name?.split(' ')[0] || 'Unknown',
    lastName: wpSession.trainer?.name?.split(' ').slice(1).join(' ') || 'Trainer',
    collegePro: '',
    position: 'midfielder',
    headshotUrl: wpSession.trainer?.avatar_url,
    rating: 5.0,
  },
  parentId: wpSession.parent?.id,
  childId: wpSession.child?.id,
  child: wpSession.child ? {
    id: wpSession.child.id,
    firstName: wpSession.child.name?.split(' ')[0] || wpSession.child.first_name || '',
    ageBand: wpSession.child.age_band,
    skillLevel: wpSession.child.skill_level,
    position: wpSession.child.position,
  } : undefined,
  date: wpSession.date,
  startTime: wpSession.start_time,
  endTime: wpSession.end_time,
  duration: 60,
  location: wpSession.location,
  city: wpSession.location?.split(',')[0] || '',
  state: 'PA',
  focus: wpSession.focus?.split(', ') || [],
  notes: wpSession.player_notes,
  playerNotes: wpSession.player_notes,
  status: wpSession.status,
  price: wpSession.price,
  isPaid: wpSession.is_paid,
  createdAt: wpSession.created_at,
  updatedAt: wpSession.updated_at,
});

// ============================================================
// TRAINER-SPECIFIC ENDPOINTS
// ============================================================

/**
 * Get trainer dashboard data
 * Aggregates data from multiple endpoints:
 * - GET /wp-json/ptp/v1/trainer/stats
 * - GET /wp-json/ptp/v1/trainer/bookings
 * - GET /wp-json/ptp/v1/trainer/earnings
 */
export const getTrainerDashboard = async (): Promise<{
  todaysSessions: TrainingSession[];
  pendingRequests: number;
  weeklySessions: number;
  monthlyEarnings: number;
  totalStudents: number;
  nextSession: TrainingSession | null;
  rating: number;
  totalReviews: number;
}> => {
  if (apiConfig.demoMode) {
    return {
      todaysSessions: mockTrainerSessions.filter(s => s.date === getRelativeDate(0)),
      pendingRequests: mockTrainerSessions.filter(s => s.status === 'pending').length,
      weeklySessions: mockTrainerSessions.length,
      monthlyEarnings: mockEarnings.thisMonth,
      totalStudents: 5,
      nextSession: mockTrainerSessions[0] || null,
      rating: 4.9,
      totalReviews: 12,
    };
  }

  // Fetch data from multiple endpoints
  const [statsRes, bookingsRes, earningsRes] = await Promise.all([
    apiClient.get('/trainer/stats'),
    apiClient.get('/trainer/sessions'),
    apiClient.get('/trainer/earnings'),
  ]);

  const stats = statsRes.data;
  const bookings = bookingsRes.data.bookings || [];
  const earnings = earningsRes.data;

  // Filter today's sessions and pending
  const today = getRelativeDate(0);
  const todaysSessions = bookings.filter((b: any) => b.date === today).map(mapWordPressSession);
  const pendingRequests = bookings.filter((b: any) => b.status === 'pending').length;

  return {
    todaysSessions,
    pendingRequests,
    weeklySessions: stats.sessions_this_week || 0,
    monthlyEarnings: earnings.total_earnings || 0,
    totalStudents: stats.total_students || 0,
    nextSession: bookings.length > 0 ? mapWordPressSession(bookings[0]) : null,
    rating: stats.average_rating || 5.0,
    totalReviews: stats.total_reviews || 0,
  };
};

/**
 * Get trainer's own bookings/sessions
 *
 * GET /wp-json/ptp/v1/trainer/bookings
 */
export const getTrainerSessions = async (
  status?: SessionStatus,
  date?: string
): Promise<TrainingSession[]> => {
  if (apiConfig.demoMode) {
    let sessions = mockTrainerSessions;
    if (status) {
      sessions = sessions.filter((s) => s.status === status);
    }
    return sessions;
  }

  const params = new URLSearchParams();
  if (status) params.append('status', status);
  if (date) params.append('date', date);

  const queryString = params.toString();
  const response = await apiClient.get(`/trainer/sessions${queryString ? '?' + queryString : ''}`);
  return (response.data.sessions || response.data.bookings || []).map(mapWordPressSession);
};

/**
 * Respond to a session request (accept/decline)
 *
 * POST /wp-json/ptp/v1/bookings/:id/confirm (accept)
 * POST /wp-json/ptp/v1/bookings/:id/cancel (decline)
 */
export const respondToSessionRequest = async (
  sessionId: number,
  action: 'accept' | 'decline',
  message?: string
): Promise<{ success: boolean; status: string; message: string }> => {
  if (apiConfig.demoMode) {
    const session = mockTrainerSessions.find((s) => s.id === sessionId);
    if (session) {
      session.status = action === 'accept' ? 'confirmed' : 'cancelled';
    }
    return {
      success: true,
      status: action === 'accept' ? 'confirmed' : 'declined',
      message: `Session request ${action === 'accept' ? 'accepted' : 'declined'}`,
    };
  }

  const endpoint = action === 'accept' ? 'confirm' : 'cancel';
  const response = await apiClient.post(`/training/sessions/${sessionId}/${endpoint}`, {
    message,
  });
  return response.data;
};

/**
 * Complete a session
 *
 * POST /wp-json/ptp/v1/bookings/:id/complete
 */
export const completeSession = async (
  sessionId: number,
  notes?: string
): Promise<{ success: boolean; message: string }> => {
  if (apiConfig.demoMode) {
    const session = mockTrainerSessions.find((s) => s.id === sessionId);
    if (session) {
      session.status = 'completed';
      if (notes) session.trainerNotes = notes;
    }
    return { success: true, message: 'Session marked as completed' };
  }

  const response = await apiClient.post(`/training/sessions/${sessionId}/complete`, { notes });
  return response.data;
};

/**
 * Update session status (legacy - use respondToSessionRequest or completeSession)
 */
export const updateSessionStatus = async (
  sessionId: number,
  status: SessionStatus,
  notes?: string
): Promise<TrainingSession> => {
  if (status === 'confirmed' || status === 'cancelled') {
    await respondToSessionRequest(sessionId, status === 'confirmed' ? 'accept' : 'decline', notes);
  } else if (status === 'completed') {
    await completeSession(sessionId, notes);
  }

  // Return the updated session
  return getSession(sessionId);
};

/**
 * Get trainer earnings
 *
 * GET /wp-json/ptp/v1/trainer/earnings
 */
export const getTrainerEarnings = async (
  period: 'week' | 'month' | 'year' | 'all' = 'month'
): Promise<TrainerEarnings> => {
  if (apiConfig.demoMode) {
    return mockEarnings;
  }

  const response = await apiClient.get(`/trainer/earnings?period=${period}`);
  const data = response.data;

  return {
    totalEarnings: data.total_earnings,
    thisMonth: data.total_earnings,
    thisWeek: period === 'week' ? data.total_earnings : 0,
    pendingPayout: data.pending_earnings,
    lastPayoutDate: getRelativeDate(-15),
    lastPayoutAmount: data.paid_earnings,
  };
};

/**
 * Get trainer stats (from dashboard)
 *
 * GET /wp-json/ptp/v1/trainer/dashboard
 */
export const getTrainerStats = async (): Promise<TrainerStats> => {
  if (apiConfig.demoMode) {
    return mockStats;
  }

  const dashboard = await getTrainerDashboard();
  return {
    totalSessions: dashboard.weeklySessions * 4, // Approximate
    thisWeekSessions: dashboard.weeklySessions,
    thisMonthSessions: dashboard.weeklySessions * 4,
    completionRate: 96,
    averageRating: dashboard.rating,
  };
};

/**
 * Update trainer profile
 *
 * PUT /wp-json/ptp/v1/trainer/profile
 */
export const updateTrainerProfile = async (
  data: Partial<TrainerUser>
): Promise<{ success: boolean; message: string }> => {
  if (apiConfig.demoMode) {
    return { success: true, message: 'Profile updated' };
  }

  const response = await apiClient.put('/trainer/profile', {
    first_name: data.firstName,
    last_name: data.lastName,
    phone: data.phone,
    location: data.serviceLocations?.[0]?.city,
    avatar_url: data.avatarUrl,
    bio: data.bio,
    hourly_rate: data.hourlyRate,
    specializations: data.specialties,
  });
  return response.data;
};

/**
 * Get trainer's players/students
 *
 * GET /wp-json/ptp/v1/trainer/players
 */
export const getTrainerStudents = async (): Promise<any[]> => {
  if (apiConfig.demoMode) {
    return [];
  }

  const response = await apiClient.get('/trainer/players');
  return response.data.players || [];
};

/**
 * Apply to become a trainer
 *
 * POST /wp-json/ptp/v2/trainer/apply
 */
export const applyAsTrainer = async (
  data: Partial<TrainerUser>
): Promise<{ success: boolean; message: string }> => {
  if (apiConfig.demoMode) {
    return {
      success: true,
      message: 'Your application has been submitted! We will review and get back to you within 48 hours.',
    };
  }

  const response = await apiClient.post('/trainer/apply', data);
  return response.data;
};

// ============================================================
// TRAINER STRIPE CONNECT (v49)
// ============================================================

/**
 * Stripe Connect response
 */
export interface StripeConnectResponse {
  success: boolean;
  accountId?: string;
  onboardingUrl?: string;
  dashboardUrl?: string;
  chargesEnabled?: boolean;
  payoutsEnabled?: boolean;
  message?: string;
}

/**
 * Connect trainer Stripe account
 * Creates a Stripe Connect account or returns onboarding URL
 *
 * POST /wp-json/ptp/v2/trainer/stripe/connect
 */
export const connectTrainerStripe = async (): Promise<StripeConnectResponse> => {
  if (apiConfig.demoMode) {
    return {
      success: true,
      accountId: 'acct_demo123',
      onboardingUrl: 'https://connect.stripe.com/setup/demo',
      chargesEnabled: false,
      payoutsEnabled: false,
      message: 'Demo mode: Stripe Connect would redirect to onboarding',
    };
  }

  const response = await apiClient.post('/trainer/stripe/connect');
  return {
    success: response.data.success,
    accountId: response.data.account_id,
    onboardingUrl: response.data.onboarding_url,
    chargesEnabled: response.data.charges_enabled,
    payoutsEnabled: response.data.payouts_enabled,
    message: response.data.message,
  };
};

/**
 * Get trainer Stripe dashboard link
 *
 * GET /wp-json/ptp/v2/trainer/stripe/dashboard
 */
export const getTrainerStripeDashboard = async (): Promise<{ url: string }> => {
  if (apiConfig.demoMode) {
    return { url: 'https://dashboard.stripe.com/demo' };
  }

  const response = await apiClient.get('/trainer/stripe/dashboard');
  return { url: response.data.url };
};

// ============================================================
// SESSION NOTES (v49)
// ============================================================

/**
 * Session notes data
 */
export interface SessionNotes {
  skillsWorked: string[];
  progressNotes: string;
  homework?: string;
  nextFocus?: string;
  effortRating?: number;
  attitudeRating?: number;
}

/**
 * Add session notes after completing a session
 *
 * POST /wp-json/ptp/v2/bookings/:id/notes
 */
export const addSessionNotes = async (
  sessionId: number,
  notes: SessionNotes
): Promise<{ success: boolean; message: string }> => {
  if (apiConfig.demoMode) {
    return { success: true, message: 'Session notes saved' };
  }

  const response = await apiClient.post(`/training/sessions/${sessionId}/notes`, {
    skills_worked: notes.skillsWorked.join(', '),
    progress_notes: notes.progressNotes,
    homework: notes.homework,
    next_focus: notes.nextFocus,
    effort_rating: notes.effortRating,
    attitude_rating: notes.attitudeRating,
  });
  return response.data;
};

/**
 * Submit a review for a completed session
 *
 * POST /wp-json/ptp/v2/bookings/:id/review
 */
export const submitSessionReview = async (
  sessionId: number,
  rating: number,
  comment: string
): Promise<{ success: boolean; message: string }> => {
  if (apiConfig.demoMode) {
    return { success: true, message: 'Review submitted. Thank you!' };
  }

  const response = await apiClient.post(`/training/sessions/${sessionId}/review`, {
    rating,
    comment,
  });
  return response.data;
};

// ============================================================
// TRAINER GALLERY (v49)
// ============================================================

/**
 * Get trainer gallery images
 *
 * GET /wp-json/ptp/v2/trainers/:id/gallery
 */
export const getTrainerGallery = async (trainerId: number): Promise<string[]> => {
  if (apiConfig.demoMode) {
    return [
      'https://ptpsummercamps.com/wp-content/uploads/2025/12/BG7A1915.jpg',
      'https://ptpsummercamps.com/wp-content/uploads/2025/12/BG7A1920.jpg',
    ];
  }

  const response = await apiClient.get(`/trainers/${trainerId}/gallery`);
  return response.data.images || response.data || [];
};

// ============================================================
// FEATURED & NEARBY TRAINERS (v49)
// ============================================================

/**
 * Get featured trainers
 *
 * GET /wp-json/ptp/v2/trainers/featured
 */
export const getFeaturedTrainers = async (limit = 5): Promise<TrainerUser[]> => {
  if (apiConfig.demoMode) {
    return mockTrainers.slice(0, limit);
  }

  const response = await apiClient.get(`/trainers/featured?limit=${limit}`);
  return (response.data.trainers || response.data || []).map(mapWordPressTrainer);
};

/**
 * Get nearby trainers based on location
 *
 * GET /wp-json/ptp/v2/trainers/nearby
 */
export const getNearbyTrainers = async (
  lat: number,
  lng: number,
  radius = 25
): Promise<TrainerUser[]> => {
  if (apiConfig.demoMode) {
    return mockTrainers;
  }

  const response = await apiClient.get(
    `/trainers/nearby?lat=${lat}&lng=${lng}&radius=${radius}`
  );
  return (response.data.trainers || response.data || []).map(mapWordPressTrainer);
};

/**
 * Search trainers by query
 *
 * GET /wp-json/ptp/v2/trainers/search
 */
export const searchTrainers = async (
  query: string,
  filters?: TrainerFilters
): Promise<TrainerUser[]> => {
  if (apiConfig.demoMode) {
    const q = query.toLowerCase();
    return mockTrainers.filter(t =>
      t.firstName.toLowerCase().includes(q) ||
      t.lastName.toLowerCase().includes(q) ||
      t.specialties.some(s => s.toLowerCase().includes(q))
    );
  }

  const params = new URLSearchParams();
  params.append('q', query);
  if (filters?.state) params.append('location', filters.state);
  if (filters?.specialty) params.append('specialty', filters.specialty);

  const response = await apiClient.get(`/trainers/search?${params.toString()}`);
  return (response.data.trainers || response.data || []).map(mapWordPressTrainer);
};

// ============================================================
// MOCK DATA FOR DEMO MODE
// ============================================================

const mockTrainers: TrainerUser[] = [
  {
    id: 101,
    email: 'marcus@ptpsoccer.com',
    firstName: 'Marcus',
    lastName: 'Williams',
    phone: '(215) 555-9876',
    role: 'ptp_trainer',
    collegePro: 'Villanova University',
    position: 'forward',
    bio: 'Former Villanova forward with 4 years of collegiate experience. Passionate about developing young players\' technical skills and building their confidence on the field. Specializes in 1v1 moves and finishing.',
    teachingStyle: 'High-energy, positive reinforcement with focus on fundamentals and game situations.',
    specialties: ['1v1', 'finishing', 'shooting', 'confidence'],
    hourlyRate: 80,
    serviceLocations: [
      {
        id: 1,
        name: 'Steelyard Sports',
        address: '123 Sports Way',
        city: 'King of Prussia',
        state: 'PA',
        marketSlug: 'main-line',
        isHomeBase: true,
      },
      {
        id: 2,
        name: 'Wayne Sports Complex',
        city: 'Wayne',
        state: 'PA',
        marketSlug: 'main-line',
        isHomeBase: false,
      },
    ],
    availability: {
      monday: [{ start: '16:00', end: '20:00' }],
      tuesday: [{ start: '16:00', end: '20:00' }],
      wednesday: [{ start: '16:00', end: '20:00' }],
      thursday: [{ start: '16:00', end: '20:00' }],
      friday: [{ start: '15:00', end: '19:00' }],
      saturday: [{ start: '09:00', end: '15:00' }],
      sunday: [{ start: '10:00', end: '14:00' }],
    },
    rating: 4.9,
    reviewCount: 47,
    isVerified: true,
    isBackgroundChecked: true,
    headshotUrl: heroImages[15],
    galleryUrls: [heroImages[0], heroImages[1]],
    createdAt: '2023-06-01T10:00:00Z',
    updatedAt: '2024-11-25T09:00:00Z',
  },
  {
    id: 102,
    email: 'alex@ptpsoccer.com',
    firstName: 'Alex',
    lastName: 'Chen',
    phone: '(610) 555-4321',
    role: 'ptp_trainer',
    collegePro: 'Penn State University',
    position: 'midfielder',
    bio: 'Penn State midfielder who led the team in assists. Expert in passing, vision, and midfield play. Love working with players who want to control the game from the middle of the park.',
    teachingStyle: 'Tactical and technical, focusing on decision-making and game intelligence.',
    specialties: ['passing', 'midfield', 'game-iq', 'dribbling'],
    hourlyRate: 75,
    serviceLocations: [
      {
        id: 3,
        name: 'West Chester Indoor',
        city: 'West Chester',
        state: 'PA',
        marketSlug: 'west-chester',
        isHomeBase: true,
      },
    ],
    availability: {
      monday: [{ start: '17:00', end: '21:00' }],
      tuesday: [],
      wednesday: [{ start: '17:00', end: '21:00' }],
      thursday: [],
      friday: [{ start: '16:00', end: '20:00' }],
      saturday: [{ start: '08:00', end: '14:00' }],
      sunday: [{ start: '09:00', end: '13:00' }],
    },
    rating: 4.8,
    reviewCount: 32,
    isVerified: true,
    isBackgroundChecked: true,
    headshotUrl: heroImages[4],
    createdAt: '2023-08-15T10:00:00Z',
    updatedAt: '2024-11-20T11:00:00Z',
  },
  {
    id: 103,
    email: 'jordan@ptpsoccer.com',
    firstName: 'Jordan',
    lastName: 'Taylor',
    phone: '(856) 555-7890',
    role: 'ptp_trainer',
    collegePro: 'Rutgers University',
    position: 'goalkeeper',
    bio: 'Former Rutgers starting goalkeeper. Specialized in developing young keepers with proper technique, positioning, and mental toughness. Also work with field players on finishing against goalkeepers.',
    teachingStyle: 'Patient and detail-oriented. Focus on proper technique and building good habits early.',
    specialties: ['goalkeeper', 'confidence', 'finishing'],
    hourlyRate: 85,
    serviceLocations: [
      {
        id: 4,
        name: 'Short Hills Athletic Club',
        city: 'Short Hills',
        state: 'NJ',
        marketSlug: 'short-hills',
        isHomeBase: true,
      },
      {
        id: 5,
        name: 'Princeton Day School',
        city: 'Princeton',
        state: 'NJ',
        marketSlug: 'princeton',
        isHomeBase: false,
      },
    ],
    availability: {
      monday: [{ start: '15:00', end: '19:00' }],
      tuesday: [{ start: '15:00', end: '19:00' }],
      wednesday: [{ start: '15:00', end: '19:00' }],
      thursday: [{ start: '15:00', end: '19:00' }],
      friday: [],
      saturday: [{ start: '09:00', end: '16:00' }],
      sunday: [{ start: '10:00', end: '15:00' }],
    },
    rating: 4.95,
    reviewCount: 28,
    isVerified: true,
    isBackgroundChecked: true,
    headshotUrl: heroImages[6],
    createdAt: '2023-09-01T10:00:00Z',
    updatedAt: '2024-11-22T14:00:00Z',
  },
];

const getMockTrainers = async (
  filters?: TrainerFilters,
  page = 1,
  perPage = 10
): Promise<TrainersResponse> => {
  await new Promise((resolve) => setTimeout(resolve, 300));

  let filtered = [...mockTrainers];

  if (filters?.state) {
    filtered = filtered.filter((t) =>
      t.serviceLocations.some((loc) => loc.state === filters.state)
    );
  }
  if (filters?.marketSlug) {
    filtered = filtered.filter((t) =>
      t.serviceLocations.some((loc) => loc.marketSlug === filters.marketSlug)
    );
  }
  if (filters?.specialty) {
    const specialty = filters.specialty;
    filtered = filtered.filter((t) =>
      t.specialties.includes(specialty)
    );
  }

  const total = filtered.length;
  const start = (page - 1) * perPage;
  const trainers = filtered.slice(start, start + perPage);

  return {
    trainers,
    total,
    page,
    perPage,
    hasMore: start + perPage < total,
  };
};

const getMockReviews = (trainerId: number): TrainerReview[] => [
  {
    id: 1,
    trainerId,
    parentId: 1,
    parentName: 'Sarah J.',
    rating: 5,
    comment: 'Amazing experience! My son improved so much in just a few sessions. Marcus really knows how to connect with kids and make learning fun.',
    createdAt: '2024-11-15T10:00:00Z',
  },
  {
    id: 2,
    trainerId,
    parentId: 2,
    parentName: 'Mike T.',
    rating: 5,
    comment: 'Highly recommend. Professional, punctual, and great with technique. My daughter\'s confidence has skyrocketed.',
    createdAt: '2024-11-01T14:00:00Z',
  },
  {
    id: 3,
    trainerId,
    parentId: 3,
    parentName: 'Lisa R.',
    rating: 4,
    comment: 'Great trainer, very patient. Would love more flexibility in scheduling but overall excellent experience.',
    createdAt: '2024-10-20T09:00:00Z',
  },
];

const getMockAvailability = (
  _trainerId: number,
  dateFrom: string,
  dateTo: string
): TrainerAvailabilitySlot[] => {
  // Generate mock availability for the date range
  const slots: TrainerAvailabilitySlot[] = [];
  const start = new Date(dateFrom);
  const end = new Date(dateTo);

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dayOfWeek = d.getDay();
    // Skip if Sunday (less availability)
    if (dayOfWeek !== 0) {
      slots.push({
        date: d.toISOString().split('T')[0],
        slots: [
          { start: '16:00', end: '17:00', isAvailable: Math.random() > 0.3 },
          { start: '17:00', end: '18:00', isAvailable: Math.random() > 0.3 },
          { start: '18:00', end: '19:00', isAvailable: Math.random() > 0.5 },
        ],
      });
    }
  }

  return slots;
};

/**
 * Generate mock sessions with dynamic dates
 */
const generateMockSessions = (): TrainingSession[] => [
  {
    id: 1,
    trainerId: 101,
    trainer: {
      id: 101,
      firstName: 'Marcus',
      lastName: 'Williams',
      collegePro: 'Villanova University',
      position: 'forward',
      headshotUrl: heroImages[15],
      rating: 4.9,
    },
    parentId: 1,
    childId: 1,
    date: getRelativeDate(3), // 3 days from now
    startTime: '16:00',
    endTime: '17:00',
    duration: 60,
    location: 'Steelyard Sports',
    city: 'King of Prussia',
    state: 'PA',
    focus: ['1v1', 'finishing'],
    status: 'confirmed',
    price: 80,
    isPaid: true,
    createdAt: getPastTimestamp(7),
    updatedAt: getPastTimestamp(5),
  },
];

const mockSessions: TrainingSession[] = generateMockSessions();

/**
 * Generate mock trainer sessions with dynamic dates
 */
const generateMockTrainerSessions = (): TrainingSession[] => [
  {
    id: 1,
    trainerId: 101,
    trainer: {
      id: 101,
      firstName: 'Marcus',
      lastName: 'Williams',
      collegePro: 'Villanova University',
      position: 'forward',
      rating: 4.9,
    },
    parentId: 1,
    childId: 1,
    child: {
      id: 1,
      firstName: 'Jake',
      ageBand: '9-11',
      skillLevel: 'travel',
      position: 'midfielder',
    },
    date: getRelativeDate(3), // 3 days from now
    startTime: '16:00',
    endTime: '17:00',
    duration: 60,
    location: 'Steelyard Sports',
    city: 'King of Prussia',
    state: 'PA',
    focus: ['1v1', 'finishing'],
    playerNotes: 'Jake wants to work on his weak foot finishing',
    status: 'confirmed',
    price: 80,
    isPaid: true,
    createdAt: getPastTimestamp(7),
    updatedAt: getPastTimestamp(5),
  },
  {
    id: 2,
    trainerId: 101,
    trainer: {
      id: 101,
      firstName: 'Marcus',
      lastName: 'Williams',
      collegePro: 'Villanova University',
      position: 'forward',
      rating: 4.9,
    },
    parentId: 2,
    childId: 3,
    child: {
      id: 3,
      firstName: 'Sophia',
      ageBand: '12-14',
      skillLevel: 'elite',
      position: 'forward',
    },
    date: getRelativeDate(4), // 4 days from now
    startTime: '17:00',
    endTime: '18:00',
    duration: 60,
    location: 'Wayne Sports Complex',
    city: 'Wayne',
    state: 'PA',
    focus: ['shooting', 'confidence'],
    status: 'pending',
    price: 80,
    isPaid: false,
    createdAt: getPastTimestamp(2),
    updatedAt: getPastTimestamp(2),
  },
];

const mockTrainerSessions: TrainingSession[] = generateMockTrainerSessions();

const mockEarnings: TrainerEarnings = {
  totalEarnings: 4560,
  thisMonth: 640,
  thisWeek: 160,
  pendingPayout: 240,
  lastPayoutDate: getRelativeDate(-15), // 15 days ago
  lastPayoutAmount: 480,
};

const mockStats: TrainerStats = {
  totalSessions: 57,
  thisWeekSessions: 2,
  thisMonthSessions: 8,
  completionRate: 96,
  averageRating: 4.9,
};

export { mockTrainers };
