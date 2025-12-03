/**
 * Program-related TypeScript types
 *
 * Defines types for camps, clinics, and program details.
 * Programs are the core offering in the PTP flow.
 */

import { AgeBand, USState } from './user';

// Program types
export type ProgramType = 'camp' | 'clinic';

// Program status
export type ProgramStatus = 'upcoming' | 'active' | 'completed' | 'cancelled';

/**
 * Program (Camp or Clinic)
 *
 * Represents a camp or clinic product from WooCommerce
 * with custom meta fields for program-specific data.
 */
export interface Program {
  id: number;
  title: string;
  type: ProgramType;
  description: string;
  shortDescription?: string;

  // Dates and times
  date: string; // ISO date, e.g., "2025-06-15"
  endDate?: string; // For multi-day camps
  time: string; // e.g., "9:00 AM – 3:00 PM"
  timeStart?: string; // e.g., "09:00"
  timeEnd?: string; // e.g., "15:00"

  // Location
  location: string; // e.g., "Steelyard Sports – KOP, PA"
  venue?: string;
  address?: string;
  city: string;
  state: USState;
  marketSlug: string; // e.g., "main-line", "west-chester"
  coordinates?: {
    lat: number;
    lng: number;
  };

  // Pricing and availability
  price: number;
  regularPrice?: number;
  salePrice?: number;
  stock: number;
  stockStatus: 'instock' | 'outofstock' | 'onbackorder';
  almostFull: boolean;
  bestseller: boolean;

  // Target audience
  ageBands: AgeBand[];
  minAge?: number;
  maxAge?: number;
  skillLevels?: string[];

  // Media
  mainImageUrl: string;
  galleryUrls?: string[];

  // Additional info
  whatToBring?: string[];
  schedule?: ProgramScheduleItem[];
  highlights?: string[];
  coaches?: ProgramCoach[];

  // Meta
  status: ProgramStatus;
  wooProductId: number;
  categorySlug: 'winter-clinics' | 'summer';
  createdAt: string;
  updatedAt: string;
}

/**
 * Program schedule item
 * For displaying daily/hourly schedules
 */
export interface ProgramScheduleItem {
  time: string;
  activity: string;
  description?: string;
}

/**
 * Program coach info
 * Brief coach/mentor info for program details
 */
export interface ProgramCoach {
  id: number;
  name: string;
  title: string; // e.g., "Villanova Forward"
  headshotUrl?: string;
}

/**
 * Program filter options
 * Used for filtering programs list
 */
export interface ProgramFilters {
  type?: ProgramType;
  state?: USState;
  city?: string;
  marketSlug?: string;
  ageBand?: AgeBand;
  dateFrom?: string;
  dateTo?: string;
  priceMin?: number;
  priceMax?: number;
  bestseller?: boolean;
  almostFull?: boolean;
}

/**
 * Programs API response
 */
export interface ProgramsResponse {
  programs: Program[];
  total: number;
  page: number;
  perPage: number;
  hasMore: boolean;
}

/**
 * Program card display data
 * Subset of Program for card rendering
 */
export interface ProgramCardData {
  id: number;
  title: string;
  type: ProgramType;
  date: string;
  time: string;
  location: string;
  city: string;
  state: USState;
  price: number;
  almostFull: boolean;
  bestseller: boolean;
  mainImageUrl: string;
}

/**
 * Market/Location for filtering
 */
export interface Market {
  slug: string;
  name: string; // e.g., "Main Line, PA"
  city: string;
  state: USState;
  programCount?: number;
}

/**
 * Trust badges shown on program details
 */
export const TRUST_BADGES = [
  {
    id: 'mentors',
    title: 'College-Athlete Mentors',
    icon: 'school',
  },
  {
    id: 'background',
    title: 'Background-Checked',
    icon: 'verified-user',
  },
  {
    id: 'insured',
    title: 'Fully Insured',
    icon: 'security',
  },
] as const;
