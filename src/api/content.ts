/**
 * Content API Module
 *
 * Handles app content like FAQ, specialties, and locations.
 * New in v49 Training Platform.
 *
 * Endpoints (PTP Training Platform v2 REST API):
 * - GET /content/faq - Get FAQ content
 * - GET /content/specialties - Get training specialties
 * - GET /content/locations - Get service locations/markets
 */

import { apiClient } from './client';
import { apiConfig } from './config';

/**
 * FAQ item
 */
export interface FAQItem {
  id: number;
  question: string;
  answer: string;
  category: string;
  order: number;
}

/**
 * Training specialty
 */
export interface Specialty {
  id: string;
  name: string;
  description?: string;
  icon?: string;
}

/**
 * Service location/market
 */
export interface ServiceLocation {
  id: number;
  name: string;
  slug: string;
  city: string;
  state: string;
  zipCodes?: string[];
  isActive: boolean;
}

/**
 * Get FAQ content
 *
 * GET /wp-json/ptp/v2/content/faq
 */
export const getFAQ = async (category?: string): Promise<FAQItem[]> => {
  if (apiConfig.demoMode) {
    return category
      ? mockFAQ.filter(f => f.category === category)
      : mockFAQ;
  }

  const params = category ? `?category=${category}` : '';
  const response = await apiClient.get(`/content/faq${params}`);
  return (response.data.faq || response.data || []).map((item: any) => ({
    id: item.id,
    question: item.question,
    answer: item.answer,
    category: item.category,
    order: item.order || 0,
  }));
};

/**
 * Get training specialties
 *
 * GET /wp-json/ptp/v2/content/specialties
 */
export const getSpecialties = async (): Promise<Specialty[]> => {
  if (apiConfig.demoMode) {
    return mockSpecialties;
  }

  const response = await apiClient.get('/content/specialties');
  return (response.data.specialties || response.data || []).map((item: any) => ({
    id: item.id || item.slug,
    name: item.name,
    description: item.description,
    icon: item.icon,
  }));
};

/**
 * Get service locations/markets
 *
 * GET /wp-json/ptp/v2/content/locations
 */
export const getServiceLocations = async (): Promise<ServiceLocation[]> => {
  if (apiConfig.demoMode) {
    return mockLocations;
  }

  const response = await apiClient.get('/content/locations');
  return (response.data.locations || response.data || []).map((item: any) => ({
    id: item.id,
    name: item.name,
    slug: item.slug,
    city: item.city,
    state: item.state,
    zipCodes: item.zip_codes,
    isActive: item.is_active !== false,
  }));
};

// ============================================================
// MOCK DATA FOR DEMO MODE
// ============================================================

const mockFAQ: FAQItem[] = [
  {
    id: 1,
    question: 'How do I book a training session?',
    answer: 'Browse our trainers, select one that matches your needs, choose an available time slot, and complete the booking. You\'ll receive a confirmation email with all the details.',
    category: 'booking',
    order: 1,
  },
  {
    id: 2,
    question: 'What is your cancellation policy?',
    answer: 'You can cancel or reschedule a session up to 24 hours before the scheduled time for a full refund. Cancellations within 24 hours may be subject to a fee.',
    category: 'booking',
    order: 2,
  },
  {
    id: 3,
    question: 'How are trainers vetted?',
    answer: 'All our trainers undergo a thorough vetting process including background checks, verification of their playing experience (college or professional), and an interview with our team.',
    category: 'trainers',
    order: 1,
  },
  {
    id: 4,
    question: 'What should my child bring to a session?',
    answer: 'Players should wear appropriate athletic clothing and cleats, bring a water bottle, and bring their own soccer ball if they have one. Trainers will provide any additional equipment needed.',
    category: 'sessions',
    order: 1,
  },
  {
    id: 5,
    question: 'How do I contact my trainer?',
    answer: 'You can message your trainer directly through the app before and after your sessions. This keeps all communication in one place and allows our support team to assist if needed.',
    category: 'sessions',
    order: 2,
  },
];

const mockSpecialties: Specialty[] = [
  { id: '1v1', name: '1v1 Moves', description: 'Learn to beat defenders with fakes and quick footwork' },
  { id: 'finishing', name: 'Finishing', description: 'Score more goals with proper shooting technique' },
  { id: 'dribbling', name: 'Dribbling', description: 'Improve close ball control and dribbling skills' },
  { id: 'passing', name: 'Passing', description: 'Master short and long range passing' },
  { id: 'shooting', name: 'Shooting', description: 'Develop power and accuracy in your shots' },
  { id: 'defending', name: 'Defending', description: 'Learn positioning, tackling, and defensive awareness' },
  { id: 'goalkeeper', name: 'Goalkeeper', description: 'Specialized training for goalkeepers' },
  { id: 'game-iq', name: 'Game IQ', description: 'Improve tactical awareness and decision-making' },
  { id: 'confidence', name: 'Confidence', description: 'Build mental strength and self-belief' },
  { id: 'speed', name: 'Speed & Agility', description: 'Get faster and more agile on the field' },
];

const mockLocations: ServiceLocation[] = [
  { id: 1, name: 'Main Line', slug: 'main-line', city: 'Wayne', state: 'PA', isActive: true },
  { id: 2, name: 'West Chester', slug: 'west-chester', city: 'West Chester', state: 'PA', isActive: true },
  { id: 3, name: 'King of Prussia', slug: 'kop', city: 'King of Prussia', state: 'PA', isActive: true },
  { id: 4, name: 'Short Hills', slug: 'short-hills', city: 'Short Hills', state: 'NJ', isActive: true },
  { id: 5, name: 'Princeton', slug: 'princeton', city: 'Princeton', state: 'NJ', isActive: true },
  { id: 6, name: 'Philadelphia', slug: 'philly', city: 'Philadelphia', state: 'PA', isActive: true },
];

export { mockFAQ, mockSpecialties, mockLocations };
