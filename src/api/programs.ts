/**
 * Programs API Module
 *
 * Handles fetching camps and clinics from WooCommerce.
 * Programs are the core offering in the PTP flow.
 *
 * TODO: Wire in real WooCommerce product queries
 * - Map WooCommerce products with categories 'winter-clinics' and 'summer'
 * - Read custom meta fields: _camp_date, _camp_time, _camp_location, etc.
 */

import { apiClient } from './client';
import { apiConfig } from './config';
import {
  Program,
  ProgramFilters,
  ProgramsResponse,
  ProgramCardData,
  Market,
} from '../types';
import { heroImages } from '../assets/media';

// ============================================================
// V2 API MAPPER - Convert camps response to Program format
// ============================================================

/**
 * Map v2 API camp response to app Program type
 */
const mapCampToProgram = (camp: any): Program => ({
  id: camp.id,
  title: camp.name,
  type: camp.type || 'camp',
  description: camp.description || camp.short_description || '',
  shortDescription: camp.short_description || '',
  date: camp.start_date,
  endDate: camp.end_date,
  time: camp.daily_times ? `${camp.daily_times.start} - ${camp.daily_times.end}` : '',
  timeStart: camp.daily_times?.start,
  timeEnd: camp.daily_times?.end,
  location: camp.location?.name || '',
  venue: camp.location?.name || '',
  address: camp.location?.address || '',
  city: camp.location?.city || '',
  state: camp.location?.state || '',
  marketSlug: '',
  price: camp.price,
  regularPrice: camp.regular_price,
  salePrice: camp.sale_price,
  stock: camp.capacity?.available || 0,
  stockStatus: camp.capacity?.is_sold_out ? 'outofstock' : 'instock',
  almostFull: (camp.capacity?.available || 0) < 5,
  bestseller: camp.is_featured,
  ageBands: camp.age_groups || [],
  mainImageUrl: camp.featured_image,
  galleryUrls: camp.gallery || [],
  whatToBring: camp.what_to_bring ? camp.what_to_bring.split('\n') : [],
  schedule: camp.schedule?.map((s: any) => ({
    time: s.start_time,
    activity: `Day ${s.day}: ${s.day_name}`,
  })) || [],
  highlights: [],
  status: 'upcoming',
  wooProductId: camp.id,
  categorySlug: camp.type,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

// ============================================================
// DATE HELPERS FOR DYNAMIC MOCK DATA
// ============================================================

/**
 * Get a date relative to today
 * @param daysFromNow - Number of days from today (positive = future)
 */
const getRelativeDate = (daysFromNow: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().split('T')[0];
};

/**
 * Get the next occurrence of a specific day of week
 * @param dayOfWeek - 0 = Sunday, 1 = Monday, etc.
 * @param weeksFromNow - Additional weeks to add
 */
const getNextDayOfWeek = (dayOfWeek: number, weeksFromNow = 0): string => {
  const date = new Date();
  const currentDay = date.getDay();
  const daysUntil = (dayOfWeek - currentDay + 7) % 7 || 7;
  date.setDate(date.getDate() + daysUntil + weeksFromNow * 7);
  return date.toISOString().split('T')[0];
};

/**
 * Get a date in the upcoming summer (June-August)
 * @param monthOffset - 0 = June, 1 = July, 2 = August
 * @param weekOfMonth - 1-4, which week of the month
 */
const getUpcomingSummerDate = (monthOffset: number, weekOfMonth: number): string => {
  const now = new Date();
  let year = now.getFullYear();
  const month = 5 + monthOffset; // June = 5

  // If we're past August, use next year's summer
  if (now.getMonth() > 7) {
    year++;
  }

  const date = new Date(year, month, 1 + (weekOfMonth - 1) * 7);
  return date.toISOString().split('T')[0];
};

/**
 * Get end date for a camp (typically 4-5 days after start)
 */
const getCampEndDate = (startDate: string, days = 4): string => {
  const date = new Date(startDate);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
};

/**
 * Get programs (camps and clinics)
 *
 * GET /wp-json/ptp/v1/programs
 *
 * @param filters - Optional filters for type, state, city, date range, etc.
 */
export const getPrograms = async (
  filters?: ProgramFilters,
  page = 1,
  perPage = 10
): Promise<ProgramsResponse> => {
  if (apiConfig.demoMode) {
    return getMockPrograms(filters, page, perPage);
  }

  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('limit', perPage.toString());

  if (filters?.type) params.append('type', filters.type);
  if (filters?.state) params.append('state', filters.state);
  if (filters?.city) params.append('city', filters.city);
  if (filters?.marketSlug) params.append('market', filters.marketSlug);
  if (filters?.ageBand) params.append('age_group', filters.ageBand);
  if (filters?.dateFrom) params.append('date_from', filters.dateFrom);
  if (filters?.dateTo) params.append('date_to', filters.dateTo);

  // v1 API uses /programs endpoint
  const response = await apiClient.get(`/programs?${params.toString()}`);

  // Map v1 response format to app format
  const { programs: camps, pagination } = response.data;
  return {
    programs: camps.map(mapCampToProgram),
    total: pagination?.total || camps.length,
    page: pagination?.page || page,
    perPage: pagination?.per_page || perPage,
    hasMore: pagination ? pagination.page < pagination.pages : false,
  };
};

/**
 * Get a single program by ID
 *
 * GET /wp-json/ptp/v1/programs/:id
 */
export const getProgram = async (programId: number): Promise<Program> => {
  if (apiConfig.demoMode) {
    const program = mockPrograms.find((p) => p.id === programId);
    if (!program) throw new Error('Program not found');
    return program;
  }

  // v1 API uses /programs endpoint
  const response = await apiClient.get(`/programs/${programId}`);
  return mapCampToProgram(response.data);
};

/**
 * Get available markets (locations)
 *
 * GET /wp-json/ptp/v1/markets
 */
export const getMarkets = async (): Promise<Market[]> => {
  if (apiConfig.demoMode) {
    return mockMarkets;
  }

  const response = await apiClient.get('/markets');
  return response.data;
};

/**
 * Get featured/bestseller programs
 *
 * GET /wp-json/ptp/v1/programs/featured
 */
export const getFeaturedPrograms = async (): Promise<Program[]> => {
  if (apiConfig.demoMode) {
    return mockPrograms.filter((p) => p.bestseller).slice(0, 3);
  }

  // v1 API uses /programs/featured endpoint
  const response = await apiClient.get('/programs/featured');
  return (response.data || []).map(mapCampToProgram);
};

/**
 * Get upcoming programs for a specific market
 */
export const getProgramsByMarket = async (
  marketSlug: string,
  type?: 'camp' | 'clinic'
): Promise<Program[]> => {
  const response = await getPrograms({ marketSlug, type });
  return response.programs;
};

// ============================================================
// MOCK DATA FOR DEMO MODE
// ============================================================

const mockMarkets: Market[] = [
  { slug: 'main-line', name: 'Main Line, PA', city: 'Wayne', state: 'PA', programCount: 8 },
  { slug: 'west-chester', name: 'West Chester, PA', city: 'West Chester', state: 'PA', programCount: 5 },
  { slug: 'king-of-prussia', name: 'King of Prussia, PA', city: 'King of Prussia', state: 'PA', programCount: 6 },
  { slug: 'short-hills', name: 'Short Hills, NJ', city: 'Short Hills', state: 'NJ', programCount: 4 },
  { slug: 'princeton', name: 'Princeton, NJ', city: 'Princeton', state: 'NJ', programCount: 3 },
  { slug: 'wilmington', name: 'Wilmington, DE', city: 'Wilmington', state: 'DE', programCount: 2 },
];

/**
 * Generate mock programs with dynamic dates
 * This ensures programs are always in the future relative to the current date
 */
const generateMockPrograms = (): Program[] => {
  const now = new Date();
  const createdAt = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString(); // 60 days ago
  const updatedAt = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days ago

  // Clinic dates - upcoming weekends
  const clinic1Date = getNextDayOfWeek(6, 1); // Next Saturday + 1 week
  const clinic2Date = getNextDayOfWeek(6, 2); // Next Saturday + 2 weeks
  const clinic3Date = getNextDayOfWeek(6, 3); // Next Saturday + 3 weeks
  const clinic4Date = getNextDayOfWeek(6, 4); // Next Saturday + 4 weeks

  // Camp dates - summer dates
  const camp1Start = getUpcomingSummerDate(0, 4); // Late June
  const camp2Start = getUpcomingSummerDate(1, 2); // Early July
  const camp3Start = getUpcomingSummerDate(1, 1); // First week of July
  const camp4Start = getUpcomingSummerDate(1, 3); // Mid July

  return [
    // Winter Clinics
    {
      id: 1,
      title: 'Winter Skills Intensive',
      type: 'clinic',
      description: 'Master the fundamentals with our intensive winter skills program. Perfect for players looking to sharpen their technique during the off-season. Train with NCAA-level mentors in small group settings.',
      shortDescription: 'Intensive skills training with college-athlete mentors',
      date: clinic1Date,
      time: '9:00 AM – 12:00 PM',
      timeStart: '09:00',
      timeEnd: '12:00',
      location: 'Steelyard Sports – KOP, PA',
      venue: 'Steelyard Sports',
      address: '400 American Ave',
      city: 'King of Prussia',
      state: 'PA',
      marketSlug: 'main-line',
      price: 175,
      stock: 4,
      stockStatus: 'instock',
      almostFull: true,
      bestseller: true,
      ageBands: ['9-11', '12-14'],
      minAge: 9,
      maxAge: 14,
      mainImageUrl: heroImages[0],
      galleryUrls: [heroImages[1], heroImages[2], heroImages[3]],
      whatToBring: ['Cleats', 'Shin guards', 'Water bottle', 'Soccer ball (if you have one)'],
      schedule: [
        { time: '9:00 AM', activity: 'Warm-up & Dynamic Stretching' },
        { time: '9:30 AM', activity: 'Ball Mastery Drills' },
        { time: '10:15 AM', activity: '1v1 Attacking Skills' },
        { time: '11:00 AM', activity: 'Small-Sided Games' },
        { time: '11:45 AM', activity: 'Cool-down & Takeaways' },
      ],
      highlights: ['8:1 player-to-coach ratio', 'NCAA-level coaching', 'Skills assessment included'],
      status: 'upcoming',
      wooProductId: 1001,
      categorySlug: 'winter-clinics',
      createdAt,
      updatedAt,
    },
    {
      id: 2,
      title: 'Finishing & Shooting Clinic',
      type: 'clinic',
      description: 'Become a lethal finisher. This clinic focuses exclusively on scoring: shooting technique, positioning, composure in front of goal, and reading the keeper.',
      shortDescription: 'Learn to finish like a pro',
      date: clinic2Date,
      time: '1:00 PM – 4:00 PM',
      timeStart: '13:00',
      timeEnd: '16:00',
      location: 'Wayne Sports Complex, PA',
      venue: 'Wayne Sports Complex',
      city: 'Wayne',
      state: 'PA',
      marketSlug: 'main-line',
      price: 150,
      stock: 12,
      stockStatus: 'instock',
      almostFull: false,
      bestseller: false,
      ageBands: ['12-14', '15-17'],
      minAge: 12,
      maxAge: 17,
      mainImageUrl: heroImages[4],
      whatToBring: ['Cleats', 'Shin guards', 'Water bottle'],
      status: 'upcoming',
      wooProductId: 1002,
      categorySlug: 'winter-clinics',
      createdAt,
      updatedAt,
    },
    {
      id: 3,
      title: 'Goalkeeper Academy',
      type: 'clinic',
      description: 'Specialized training for goalkeepers. Work on positioning, diving technique, distribution, and shot-stopping with our experienced GK coaches.',
      shortDescription: 'Elite goalkeeper training',
      date: clinic3Date,
      time: '10:00 AM – 1:00 PM',
      timeStart: '10:00',
      timeEnd: '13:00',
      location: 'Short Hills Athletic Club, NJ',
      venue: 'Short Hills Athletic Club',
      city: 'Short Hills',
      state: 'NJ',
      marketSlug: 'short-hills',
      price: 165,
      stock: 6,
      stockStatus: 'instock',
      almostFull: false,
      bestseller: false,
      ageBands: ['9-11', '12-14'],
      minAge: 9,
      maxAge: 14,
      mainImageUrl: heroImages[5],
      status: 'upcoming',
      wooProductId: 1003,
      categorySlug: 'winter-clinics',
      createdAt,
      updatedAt,
    },
    {
      id: 4,
      title: '1v1 Attacking Moves Clinic',
      type: 'clinic',
      description: 'Beat any defender. Learn the moves that create space, draw fouls, and leave defenders behind. Perfect for wingers, forwards, and attacking midfielders.',
      shortDescription: 'Master 1v1 attacking moves',
      date: clinic4Date,
      time: '9:00 AM – 12:00 PM',
      timeStart: '09:00',
      timeEnd: '12:00',
      location: 'West Chester Indoor, PA',
      venue: 'West Chester Indoor Facility',
      city: 'West Chester',
      state: 'PA',
      marketSlug: 'west-chester',
      price: 155,
      stock: 8,
      stockStatus: 'instock',
      almostFull: false,
      bestseller: true,
      ageBands: ['9-11', '12-14', '15-17'],
      mainImageUrl: heroImages[6],
      status: 'upcoming',
      wooProductId: 1004,
      categorySlug: 'winter-clinics',
      createdAt,
      updatedAt,
    },

    // Summer Camps
    {
      id: 5,
      title: 'PTP Summer Soccer Camp - Main Line',
      type: 'camp',
      description: 'Our flagship summer camp experience. A full week of intensive training, games, and fun. Train with college-athlete mentors and make lifelong soccer memories. All skill levels welcome.',
      shortDescription: 'Week-long summer soccer adventure',
      date: camp1Start,
      endDate: getCampEndDate(camp1Start, 4),
      time: '9:00 AM – 3:00 PM',
      timeStart: '09:00',
      timeEnd: '15:00',
      location: 'Haverford School, PA',
      venue: 'Haverford School Fields',
      address: '450 Lancaster Ave',
      city: 'Haverford',
      state: 'PA',
      marketSlug: 'main-line',
      price: 495,
      regularPrice: 550,
      salePrice: 495,
      stock: 15,
      stockStatus: 'instock',
      almostFull: false,
      bestseller: true,
      ageBands: ['6-8', '9-11', '12-14'],
      minAge: 6,
      maxAge: 14,
      mainImageUrl: heroImages[10],
      galleryUrls: [heroImages[11], heroImages[12], heroImages[13], heroImages[14]],
      whatToBring: ['Cleats', 'Shin guards', 'Water bottle', 'Lunch', 'Sunscreen', 'Extra clothes'],
      schedule: [
        { time: '9:00 AM', activity: 'Check-in & Warm-up' },
        { time: '9:30 AM', activity: 'Technical Training' },
        { time: '10:30 AM', activity: 'Position-Specific Work' },
        { time: '11:30 AM', activity: 'Lunch Break' },
        { time: '12:30 PM', activity: 'Tactical Sessions' },
        { time: '1:30 PM', activity: 'Scrimmages & Games' },
        { time: '2:45 PM', activity: 'Cool-down & Dismissal' },
      ],
      highlights: [
        'Full week of training (Mon-Fri)',
        'Age-appropriate groups',
        'End-of-week showcase for parents',
        'PTP t-shirt included',
      ],
      status: 'upcoming',
      wooProductId: 2001,
      categorySlug: 'summer',
      createdAt,
      updatedAt,
    },
    {
      id: 6,
      title: 'PTP Elite Camp - West Chester',
      type: 'camp',
      description: 'For travel and elite-level players looking to take their game to the next level. Advanced tactical training, video analysis, and competitive play.',
      shortDescription: 'Advanced training for competitive players',
      date: camp2Start,
      endDate: getCampEndDate(camp2Start, 4),
      time: '9:00 AM – 3:00 PM',
      timeStart: '09:00',
      timeEnd: '15:00',
      location: 'Rustin Sports Complex, PA',
      venue: 'Rustin Sports Complex',
      city: 'West Chester',
      state: 'PA',
      marketSlug: 'west-chester',
      price: 595,
      stock: 10,
      stockStatus: 'instock',
      almostFull: false,
      bestseller: false,
      ageBands: ['12-14', '15-17'],
      minAge: 12,
      maxAge: 17,
      mainImageUrl: heroImages[15],
      status: 'upcoming',
      wooProductId: 2002,
      categorySlug: 'summer',
      createdAt,
      updatedAt,
    },
    {
      id: 7,
      title: 'PTP Half-Day Camp - Short Hills',
      type: 'camp',
      description: 'Perfect for younger players or busy schedules. All the PTP training quality in a convenient half-day format.',
      shortDescription: 'Half-day camp for flexible schedules',
      date: camp3Start,
      endDate: getCampEndDate(camp3Start, 3),
      time: '9:00 AM – 12:00 PM',
      timeStart: '09:00',
      timeEnd: '12:00',
      location: 'Millburn High School, NJ',
      venue: 'Millburn High School Fields',
      city: 'Short Hills',
      state: 'NJ',
      marketSlug: 'short-hills',
      price: 295,
      stock: 20,
      stockStatus: 'instock',
      almostFull: false,
      bestseller: false,
      ageBands: ['6-8', '9-11'],
      minAge: 6,
      maxAge: 11,
      mainImageUrl: heroImages[18],
      status: 'upcoming',
      wooProductId: 2003,
      categorySlug: 'summer',
      createdAt,
      updatedAt,
    },
    {
      id: 8,
      title: 'PTP Summer Camp - Princeton',
      type: 'camp',
      description: 'Train on the beautiful Princeton campus. Full week of skill development, games, and fun with NCAA-caliber coaching.',
      shortDescription: 'Summer camp at Princeton',
      date: camp4Start,
      endDate: getCampEndDate(camp4Start, 4),
      time: '9:00 AM – 3:00 PM',
      timeStart: '09:00',
      timeEnd: '15:00',
      location: 'Princeton Day School, NJ',
      venue: 'Princeton Day School',
      city: 'Princeton',
      state: 'NJ',
      marketSlug: 'princeton',
      price: 525,
      stock: 18,
      stockStatus: 'instock',
      almostFull: false,
      bestseller: false,
      ageBands: ['6-8', '9-11', '12-14'],
      mainImageUrl: heroImages[20],
      status: 'upcoming',
      wooProductId: 2004,
      categorySlug: 'summer',
      createdAt,
      updatedAt,
    },
  ];
};

// Generate mock programs on module load (dates are computed dynamically)
const mockPrograms: Program[] = generateMockPrograms();

const getMockPrograms = async (
  filters?: ProgramFilters,
  page = 1,
  perPage = 10
): Promise<ProgramsResponse> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  let filtered = [...mockPrograms];

  if (filters?.type) {
    filtered = filtered.filter((p) => p.type === filters.type);
  }
  if (filters?.state) {
    filtered = filtered.filter((p) => p.state === filters.state);
  }
  if (filters?.city) {
    filtered = filtered.filter((p) =>
      p.city.toLowerCase().includes(filters.city!.toLowerCase())
    );
  }
  if (filters?.marketSlug) {
    filtered = filtered.filter((p) => p.marketSlug === filters.marketSlug);
  }
  if (filters?.ageBand) {
    filtered = filtered.filter((p) => p.ageBands.includes(filters.ageBand!));
  }
  if (filters?.bestseller) {
    filtered = filtered.filter((p) => p.bestseller);
  }

  const total = filtered.length;
  const start = (page - 1) * perPage;
  const programs = filtered.slice(start, start + perPage);

  return {
    programs,
    total,
    page,
    perPage,
    hasMore: start + perPage < total,
  };
};

/**
 * Join waitlist for a sold-out program
 *
 * POST /wp-json/ptp/v1/programs/:id/waitlist
 */
export interface WaitlistRequest {
  programId: number;
  email?: string;
  phone?: string;
  childId?: number;
  notes?: string;
}

export interface WaitlistResponse {
  success: boolean;
  message: string;
  position?: number;
  estimatedAvailability?: string;
}

export const joinWaitlist = async (data: WaitlistRequest): Promise<WaitlistResponse> => {
  if (apiConfig.demoMode) {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Mock successful waitlist join
    const position = Math.floor(Math.random() * 5) + 1; // Position 1-5
    return {
      success: true,
      message: `You've been added to the waitlist! You're #${position} in line.`,
      position,
      estimatedAvailability: 'We typically see openings 1-2 weeks before the program starts.',
    };
  }

  const response = await apiClient.post(`/programs/${data.programId}/waitlist`, data);
  return response.data;
};

/**
 * Check waitlist status for a program
 *
 * GET /wp-json/ptp/v1/programs/:id/waitlist/status
 */
export const getWaitlistStatus = async (programId: number): Promise<{
  isOnWaitlist: boolean;
  position?: number;
  totalWaiting?: number;
}> => {
  if (apiConfig.demoMode) {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return { isOnWaitlist: false };
  }

  const response = await apiClient.get(`/programs/${programId}/waitlist/status`);
  return response.data;
};

export { mockPrograms, mockMarkets };
