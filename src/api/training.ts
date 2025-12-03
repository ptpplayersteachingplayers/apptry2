/**
 * Training API Module
 *
 * Handles private training sessions and trainer data.
 * Private training is the follow-up product discovered through camps/clinics.
 *
 * TODO: Wire in real data
 * - Connect trainer profiles to WordPress users with 'ptp_trainer' role
 * - Implement real session request flow with notifications
 * - Add Stripe/WooCommerce payment handling for sessions
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

/**
 * Get list of trainers/mentors
 *
 * GET /wp-json/ptp/v1/training/mentors
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

  if (filters?.state) params.append('state', filters.state);
  if (filters?.city) params.append('city', filters.city);
  if (filters?.marketSlug) params.append('market', filters.marketSlug);
  if (filters?.specialty) params.append('specialty', filters.specialty);

  const response = await apiClient.get(`/training/mentors?${params.toString()}`);
  return response.data;
};

/**
 * Get a single trainer by ID
 *
 * GET /wp-json/ptp/v1/training/mentors/:id
 */
export const getTrainer = async (trainerId: number): Promise<TrainerUser> => {
  if (apiConfig.demoMode) {
    const trainer = mockTrainers.find((t) => t.id === trainerId);
    if (!trainer) throw new Error('Trainer not found');
    return trainer;
  }

  const response = await apiClient.get(`/training/mentors/${trainerId}`);
  return response.data;
};

/**
 * Get trainer reviews
 *
 * GET /wp-json/ptp/v1/training/mentors/:id/reviews
 */
export const getTrainerReviews = async (trainerId: number): Promise<TrainerReview[]> => {
  if (apiConfig.demoMode) {
    return getMockReviews(trainerId);
  }

  const response = await apiClient.get(`/training/mentors/${trainerId}/reviews`);
  return response.data;
};

/**
 * Get trainer availability
 *
 * GET /wp-json/ptp/v1/training/mentors/:id/availability
 */
export const getTrainerAvailability = async (
  trainerId: number,
  dateFrom: string,
  dateTo: string
): Promise<TrainerAvailabilitySlot[]> => {
  if (apiConfig.demoMode) {
    return getMockAvailability(trainerId, dateFrom, dateTo);
  }

  const response = await apiClient.get(
    `/training/mentors/${trainerId}/availability?from=${dateFrom}&to=${dateTo}`
  );
  return response.data;
};

/**
 * Request a training session
 *
 * POST /wp-json/ptp/v1/training/session-request
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

  const response = await apiClient.post('/training/session-request', data);
  return response.data;
};

/**
 * Get user's training sessions (for parents)
 *
 * GET /wp-json/ptp/v1/me/sessions
 */
export const getMySessions = async (): Promise<TrainingSession[]> => {
  if (apiConfig.demoMode) {
    return mockSessions;
  }

  const response = await apiClient.get('/me/sessions');
  return response.data;
};

// ============================================================
// TRAINER-SPECIFIC ENDPOINTS
// ============================================================

/**
 * Get trainer's own sessions
 *
 * GET /wp-json/ptp/v1/trainer/sessions
 */
export const getTrainerSessions = async (
  status?: SessionStatus
): Promise<TrainingSession[]> => {
  if (apiConfig.demoMode) {
    let sessions = mockTrainerSessions;
    if (status) {
      sessions = sessions.filter((s) => s.status === status);
    }
    return sessions;
  }

  const params = status ? `?status=${status}` : '';
  const response = await apiClient.get(`/trainer/sessions${params}`);
  return response.data;
};

/**
 * Update session status
 *
 * POST /wp-json/ptp/v1/trainer/sessions/update-status
 */
export const updateSessionStatus = async (
  sessionId: number,
  status: SessionStatus,
  notes?: string
): Promise<TrainingSession> => {
  if (apiConfig.demoMode) {
    const session = mockTrainerSessions.find((s) => s.id === sessionId);
    if (session) {
      session.status = status;
      if (notes) session.trainerNotes = notes;
    }
    return session!;
  }

  const response = await apiClient.post('/trainer/sessions/update-status', {
    session_id: sessionId,
    status,
    notes,
  });
  return response.data;
};

/**
 * Get trainer earnings
 *
 * GET /wp-json/ptp/v1/trainer/earnings
 */
export const getTrainerEarnings = async (): Promise<TrainerEarnings> => {
  if (apiConfig.demoMode) {
    return mockEarnings;
  }

  const response = await apiClient.get('/trainer/earnings');
  return response.data;
};

/**
 * Get trainer stats
 *
 * GET /wp-json/ptp/v1/trainer/stats
 */
export const getTrainerStats = async (): Promise<TrainerStats> => {
  if (apiConfig.demoMode) {
    return mockStats;
  }

  const response = await apiClient.get('/trainer/stats');
  return response.data;
};

/**
 * Apply to become a trainer
 *
 * POST /wp-json/ptp/v1/trainer/apply
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
    galleryUrls: [heroImages[16], heroImages[17]],
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
    headshotUrl: heroImages[20],
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
    headshotUrl: heroImages[22],
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
    filtered = filtered.filter((t) =>
      t.specialties.includes(filters.specialty as any)
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

const mockSessions: TrainingSession[] = [
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
    date: '2024-12-05',
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
    createdAt: '2024-11-20T10:00:00Z',
    updatedAt: '2024-11-22T14:00:00Z',
  },
];

const mockTrainerSessions: TrainingSession[] = [
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
    date: '2024-12-05',
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
    createdAt: '2024-11-20T10:00:00Z',
    updatedAt: '2024-11-22T14:00:00Z',
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
    date: '2024-12-06',
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
    createdAt: '2024-11-25T10:00:00Z',
    updatedAt: '2024-11-25T10:00:00Z',
  },
];

const mockEarnings: TrainerEarnings = {
  totalEarnings: 4560,
  thisMonth: 640,
  thisWeek: 160,
  pendingPayout: 240,
  lastPayoutDate: '2024-11-15',
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
