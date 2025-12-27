/**
 * Content-related TypeScript types
 *
 * Defines types for blog posts, FAQ, static content, etc.
 */

/**
 * Blog Post Category
 */
export type BlogCategory =
  | 'all'
  | 'winter-camps'
  | 'summer-camps'
  | 'camp-guides'
  | 'drills'
  | 'nutrition'
  | 'tips'
  | 'pathway';

/**
 * Blog Post
 */
export interface BlogPost {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  featuredImage: string;
  category: BlogCategory;
  tags: string[];
  author: {
    id: number;
    name: string;
    avatar?: string;
    bio?: string;
  };
  readTime: number; // minutes
  publishedAt: string;
  updatedAt: string;
  isTrending?: boolean;
}

/**
 * Blog list response
 */
export interface BlogResponse {
  posts: BlogPost[];
  total: number;
  page: number;
  perPage: number;
  hasMore: boolean;
}

/**
 * FAQ Item
 */
export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  order: number;
}

/**
 * Contact Form Data
 */
export interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
}

/**
 * Coach Application Form Data
 */
export interface CoachApplicationData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  university?: string;
  graduationYear?: number;
  currentTeam?: string;
  position: string;
  yearsPlaying: number;
  credentials: string[];
  bio: string;
  socialLinks?: {
    instagram?: string;
    twitter?: string;
    linkedin?: string;
  };
  availability: string;
  serviceAreas: string[];
  resumeUrl?: string;
  videoUrl?: string;
  referralSource?: string;
}

/**
 * State landing page info
 */
export interface StateLandingPage {
  state: string;
  stateCode: string;
  heroImage: string;
  title: string;
  subtitle: string;
  description: string;
  campCount: number;
  trainerCount: number;
  locations: string[];
  featuredCamps: number[]; // program IDs
  featuredTrainers: string[]; // trainer IDs
  testimonials: Testimonial[];
}

/**
 * Testimonial/Review
 */
export interface Testimonial {
  id: string;
  author: string;
  location?: string;
  rating: number;
  text: string;
  date: string;
  programType?: 'camp' | 'clinic' | 'training';
  verified: boolean;
}

/**
 * Trust badge
 */
export interface TrustBadge {
  id: string;
  icon: string;
  title: string;
  description?: string;
}

/**
 * Promotional banner
 */
export interface PromoBanner {
  id: string;
  type: 'info' | 'warning' | 'success' | 'promo';
  title: string;
  message: string;
  actionText?: string;
  actionUrl?: string;
  dismissible: boolean;
  expiresAt?: string;
  targetPages?: string[];
}

/**
 * First-time visitor popup
 */
export interface WelcomePopup {
  id: string;
  title: string;
  subtitle: string;
  offerText: string;
  discountCode: string;
  discountValue: string;
  imageUrl?: string;
  expiryText?: string;
}

/**
 * Legal document types
 */
export type LegalDocType =
  | 'terms'
  | 'privacy'
  | 'waiver'
  | 'media-release'
  | 'refund-policy'
  | 'code-of-conduct';

/**
 * Legal document
 */
export interface LegalDocument {
  type: LegalDocType;
  title: string;
  content: string;
  version: string;
  effectiveDate: string;
  lastUpdated: string;
}

/**
 * App stats displayed on home/landing pages
 */
export interface AppStats {
  totalCamps: number;
  totalTrainers: number;
  playerToCoachRatio: string;
  averageRating: number;
  totalFamilies: number;
  statesServed: number;
}

/**
 * Social share config
 */
export interface ShareConfig {
  title: string;
  message: string;
  url: string;
  imageUrl?: string;
}
