/**
 * Favorites API Module
 *
 * Handles favorite trainers for parents.
 * New in v49 Training Platform.
 *
 * Endpoints (PTP Training Platform v2 REST API):
 * - GET /favorites - Get all favorite trainers
 * - POST /favorites/:trainer_id - Add trainer to favorites
 * - DELETE /favorites/:trainer_id - Remove trainer from favorites
 */

import { apiClient } from './client';
import { apiConfig } from './config';
import { TrainerUser } from '../types';

/**
 * Favorite trainer summary
 */
export interface FavoriteTrainer {
  id: number;
  trainerId: number;
  name: string;
  photo: string;
  location: string;
  rating: number;
  reviewCount: number;
  hourlyRate: number;
  specialties: string[];
  addedAt: string;
}

/**
 * Get all favorite trainers for the current user
 *
 * GET /wp-json/ptp/v2/favorites
 */
export const getFavorites = async (): Promise<FavoriteTrainer[]> => {
  if (apiConfig.demoMode) {
    return mockFavorites;
  }

  const response = await apiClient.get('/favorites');
  return (response.data.favorites || response.data || []).map(mapFavorite);
};

/**
 * Add a trainer to favorites
 *
 * POST /wp-json/ptp/v2/favorites/:trainer_id
 */
export const addFavorite = async (trainerId: number): Promise<{ success: boolean; message: string }> => {
  if (apiConfig.demoMode) {
    // Add to mock if not already there
    const exists = mockFavorites.find(f => f.trainerId === trainerId);
    if (!exists) {
      mockFavorites.push({
        id: Date.now(),
        trainerId,
        name: 'Trainer',
        photo: '',
        location: 'Philadelphia, PA',
        rating: 5.0,
        reviewCount: 0,
        hourlyRate: 80,
        specialties: [],
        addedAt: new Date().toISOString(),
      });
    }
    return { success: true, message: 'Trainer added to favorites' };
  }

  const response = await apiClient.post(`/favorites/${trainerId}`);
  return response.data;
};

/**
 * Remove a trainer from favorites
 *
 * DELETE /wp-json/ptp/v2/favorites/:trainer_id
 */
export const removeFavorite = async (trainerId: number): Promise<{ success: boolean; message: string }> => {
  if (apiConfig.demoMode) {
    const index = mockFavorites.findIndex(f => f.trainerId === trainerId);
    if (index !== -1) {
      mockFavorites.splice(index, 1);
    }
    return { success: true, message: 'Trainer removed from favorites' };
  }

  const response = await apiClient.delete(`/favorites/${trainerId}`);
  return response.data;
};

/**
 * Check if a trainer is in favorites
 */
export const isFavorite = async (trainerId: number): Promise<boolean> => {
  const favorites = await getFavorites();
  return favorites.some(f => f.trainerId === trainerId);
};

/**
 * Map API response to FavoriteTrainer
 */
const mapFavorite = (data: any): FavoriteTrainer => ({
  id: data.id,
  trainerId: data.trainer_id || data.id,
  name: data.name,
  photo: data.photo || data.avatar_url,
  location: data.location,
  rating: data.rating || 5.0,
  reviewCount: data.review_count || 0,
  hourlyRate: data.hourly_rate || 80,
  specialties: data.specialties || [],
  addedAt: data.added_at || data.created_at,
});

// ============================================================
// MOCK DATA FOR DEMO MODE
// ============================================================

const mockFavorites: FavoriteTrainer[] = [
  {
    id: 1,
    trainerId: 101,
    name: 'Marcus Williams',
    photo: 'https://ptpsummercamps.com/wp-content/uploads/2025/12/BG7A1915.jpg',
    location: 'King of Prussia, PA',
    rating: 4.9,
    reviewCount: 47,
    hourlyRate: 80,
    specialties: ['1v1', 'finishing', 'shooting'],
    addedAt: '2024-11-15T10:00:00Z',
  },
];

export { mockFavorites };
