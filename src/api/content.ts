/**
 * Content API Module
 *
 * Comprehensive content management including:
 * - Blog posts
 * - FAQ content
 * - Contact forms
 * - Coach applications
 * - State landing pages
 * - Legal documents
 * - App statistics
 * - Promotional content
 */

import { apiClient } from './client';
import { apiConfig } from './config';
import {
  BlogPost,
  BlogCategory,
  BlogResponse,
  FAQItem,
  ContactFormData,
  CoachApplicationData,
  StateLandingPage,
  Testimonial,
  PromoBanner,
  WelcomePopup,
  LegalDocument,
  LegalDocType,
  AppStats,
} from '../types/content';

// ============================================================
// BLOG API
// ============================================================

/**
 * Get blog posts
 */
export const getBlogPosts = async (
  category?: BlogCategory,
  page = 1,
  perPage = 10,
  search?: string
): Promise<BlogResponse> => {
  if (apiConfig.demoMode) {
    return getMockBlogPosts(category, page, perPage, search);
  }

  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('per_page', perPage.toString());
  if (category && category !== 'all') params.append('category', category);
  if (search) params.append('search', search);

  const response = await apiClient.get(`/blog?${params.toString()}`);
  return response.data;
};

/**
 * Get single blog post
 */
export const getBlogPost = async (slug: string): Promise<BlogPost> => {
  if (apiConfig.demoMode) {
    const post = mockBlogPosts.find(p => p.slug === slug);
    if (!post) throw new Error('Post not found');
    return post;
  }

  const response = await apiClient.get(`/blog/${slug}`);
  return response.data;
};

/**
 * Get trending/featured blog posts
 */
export const getTrendingPosts = async (limit = 5): Promise<BlogPost[]> => {
  if (apiConfig.demoMode) {
    return mockBlogPosts.filter(p => p.isTrending).slice(0, limit);
  }

  const response = await apiClient.get(`/blog/trending?limit=${limit}`);
  return response.data;
};

// ============================================================
// FAQ API
// ============================================================

/**
 * Get FAQ content
 */
export const getFAQ = async (category?: string): Promise<FAQItem[]> => {
  if (apiConfig.demoMode) {
    return category
      ? mockFAQ.filter(f => f.category === category)
      : mockFAQ;
  }

  const params = category ? `?category=${category}` : '';
  const response = await apiClient.get(`/content/faq${params}`);
  return response.data;
};

// ============================================================
// CONTACT & FORMS API
// ============================================================

/**
 * Submit contact form
 */
export const submitContactForm = async (data: ContactFormData): Promise<{ success: boolean; message: string }> => {
  if (apiConfig.demoMode) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      success: true,
      message: 'Thank you for your message! We\'ll get back to you within 24 hours.',
    };
  }

  const response = await apiClient.post('/contact', data);
  return response.data;
};

/**
 * Submit coach application
 */
export const submitCoachApplication = async (
  data: CoachApplicationData
): Promise<{ success: boolean; message: string; applicationId?: string }> => {
  if (apiConfig.demoMode) {
    await new Promise(resolve => setTimeout(resolve, 1500));
    return {
      success: true,
      message: 'Thank you for applying! Our team will review your application and contact you within 3-5 business days.',
      applicationId: `APP-${Date.now()}`,
    };
  }

  const response = await apiClient.post('/coaches/apply', data);
  return response.data;
};

/**
 * Subscribe to newsletter
 */
export const subscribeNewsletter = async (
  email: string,
  source?: string
): Promise<{ success: boolean; message: string; discountCode?: string }> => {
  if (apiConfig.demoMode) {
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      success: true,
      message: 'You\'re subscribed! Check your email for your discount code.',
      discountCode: 'WELCOME10',
    };
  }

  const response = await apiClient.post('/newsletter/subscribe', { email, source });
  return response.data;
};

// ============================================================
// STATE LANDING PAGES API
// ============================================================

/**
 * Get state landing page data
 */
export const getStateLandingPage = async (stateCode: string): Promise<StateLandingPage> => {
  if (apiConfig.demoMode) {
    const state = mockStateLandingPages.find(s => s.stateCode === stateCode);
    if (!state) throw new Error('State not found');
    return state;
  }

  const response = await apiClient.get(`/states/${stateCode}`);
  return response.data;
};

/**
 * Get all available states
 */
export const getAvailableStates = async (): Promise<{ stateCode: string; name: string; campCount: number }[]> => {
  if (apiConfig.demoMode) {
    return mockStateLandingPages.map(s => ({
      stateCode: s.stateCode,
      name: s.state,
      campCount: s.campCount,
    }));
  }

  const response = await apiClient.get('/states');
  return response.data;
};

// ============================================================
// TESTIMONIALS API
// ============================================================

/**
 * Get testimonials
 */
export const getTestimonials = async (limit = 10): Promise<Testimonial[]> => {
  if (apiConfig.demoMode) {
    return mockTestimonials.slice(0, limit);
  }

  const response = await apiClient.get(`/testimonials?limit=${limit}`);
  return response.data;
};

// ============================================================
// PROMOTIONAL CONTENT API
// ============================================================

/**
 * Get active promo banners
 */
export const getPromoBanners = async (): Promise<PromoBanner[]> => {
  if (apiConfig.demoMode) {
    return mockPromoBanners.filter(b => !b.expiresAt || new Date(b.expiresAt) > new Date());
  }

  const response = await apiClient.get('/promo/banners');
  return response.data;
};

/**
 * Get welcome popup for first-time visitors
 */
export const getWelcomePopup = async (): Promise<WelcomePopup | null> => {
  if (apiConfig.demoMode) {
    return mockWelcomePopup;
  }

  const response = await apiClient.get('/promo/welcome-popup');
  return response.data;
};

// ============================================================
// LEGAL DOCUMENTS API
// ============================================================

/**
 * Get legal document
 */
export const getLegalDocument = async (type: LegalDocType): Promise<LegalDocument> => {
  if (apiConfig.demoMode) {
    const doc = mockLegalDocs.find(d => d.type === type);
    if (!doc) throw new Error('Document not found');
    return doc;
  }

  const response = await apiClient.get(`/legal/${type}`);
  return response.data;
};

// ============================================================
// APP STATISTICS API
// ============================================================

/**
 * Get app statistics for display
 */
export const getAppStats = async (): Promise<AppStats> => {
  if (apiConfig.demoMode) {
    return mockAppStats;
  }

  const response = await apiClient.get('/stats');
  return response.data;
};

// ============================================================
// SPECIALTIES & LOCATIONS (existing)
// ============================================================

export interface Specialty {
  id: string;
  name: string;
  description?: string;
  icon?: string;
}

export interface ServiceLocation {
  id: number;
  name: string;
  slug: string;
  city: string;
  state: string;
  zipCodes?: string[];
  isActive: boolean;
}

export const getSpecialties = async (): Promise<Specialty[]> => {
  return mockSpecialties;
};

export const getServiceLocations = async (): Promise<ServiceLocation[]> => {
  return mockLocations;
};

// ============================================================
// MOCK DATA
// ============================================================

const mockBlogPosts: BlogPost[] = [
  {
    id: 1,
    slug: 'preparing-for-winter-soccer-camp',
    title: 'How to Prepare Your Child for Winter Soccer Camp',
    excerpt: 'Get your young athlete ready for an amazing winter camp experience with these essential tips.',
    content: `
# How to Prepare Your Child for Winter Soccer Camp

Winter soccer camps offer a fantastic opportunity for young players to develop their skills during the off-season. Here's everything you need to know to get your child ready.

## What to Pack

- Indoor soccer shoes or clean sneakers
- Comfortable athletic wear (layers recommended)
- Water bottle
- Healthy snacks
- Positive attitude!

## Setting Expectations

Talk to your child about what to expect. Camps focus on skill development in a fun environment. It's okay to make mistakes - that's how we learn!

## Night Before Checklist

1. Pack bag the night before
2. Get a good night's sleep
3. Eat a healthy breakfast
4. Arrive 15 minutes early

We can't wait to see your player on the field!
    `,
    featuredImage: 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800',
    category: 'camp-guides',
    tags: ['winter-camps', 'preparation', 'tips'],
    author: {
      id: 1,
      name: 'Coach Sarah',
      avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
      bio: 'Former D1 soccer player and camp director',
    },
    readTime: 5,
    publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    isTrending: true,
  },
  {
    id: 2,
    slug: '5-drills-to-practice-at-home',
    title: '5 Soccer Drills Your Child Can Practice at Home',
    excerpt: 'Keep skills sharp between sessions with these simple at-home drills.',
    content: `
# 5 Soccer Drills Your Child Can Practice at Home

You don't need a full field to improve. Here are five drills that can be done in your backyard or even indoors.

## 1. Ball Mastery - Toe Taps
Alternate tapping the top of the ball with each foot. Start slow and increase speed.

## 2. Wall Passes
Find a wall and practice passing and receiving. Work on both feet!

## 3. Cone Dribbling
Set up cones (or any objects) and weave through them as quickly as possible while maintaining control.

## 4. Juggling
Start with your thigh, then progress to feet. Count your touches and try to beat your record!

## 5. Shooting Practice
Set up a target (trash can, goal, etc.) and practice hitting it from different angles.

Practice these for 15-20 minutes daily and watch your skills improve!
    `,
    featuredImage: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800',
    category: 'drills',
    tags: ['drills', 'practice', 'home-training'],
    author: {
      id: 2,
      name: 'Coach Mike',
      avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
    },
    readTime: 4,
    publishedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    isTrending: true,
  },
  {
    id: 3,
    slug: 'nutrition-for-young-athletes',
    title: 'Nutrition Tips for Young Soccer Players',
    excerpt: 'Fuel your young athlete for peak performance on and off the field.',
    content: `
# Nutrition Tips for Young Soccer Players

What your child eats directly impacts their energy, focus, and recovery. Here's a guide to proper nutrition for young athletes.

## Pre-Game Meals

Eat 2-3 hours before:
- Complex carbs (pasta, rice, whole grain bread)
- Lean protein
- Fruits and vegetables

## During Play

- Water, water, water!
- Sports drinks only for games over 60 minutes

## Post-Game Recovery

Within 30 minutes:
- Protein for muscle recovery
- Carbs to replenish energy
- Chocolate milk is a great option!

## Foods to Avoid

- Heavy, greasy foods before playing
- Sugary snacks that cause crashes
- Caffeine

Remember: proper nutrition is just as important as practice!
    `,
    featuredImage: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800',
    category: 'nutrition',
    tags: ['nutrition', 'health', 'performance'],
    author: {
      id: 3,
      name: 'Dr. Amanda Chen',
      avatar: 'https://randomuser.me/api/portraits/women/65.jpg',
      bio: 'Sports nutritionist specializing in youth athletes',
    },
    readTime: 6,
    publishedAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
    isTrending: false,
  },
  {
    id: 4,
    slug: 'choosing-right-summer-camp',
    title: 'How to Choose the Right Summer Soccer Camp',
    excerpt: 'A comprehensive guide to finding the perfect summer camp for your child.',
    content: `
# How to Choose the Right Summer Soccer Camp

With so many options available, finding the right summer camp can feel overwhelming. Here's what to consider.

## Age-Appropriate Programming

Make sure the camp offers groups tailored to your child's age and skill level.

## Coach Qualifications

Look for:
- College or professional playing experience
- Coaching certifications
- Background checks
- CPR/First Aid certified

## Location & Schedule

Consider:
- Distance from home
- Half-day vs full-day options
- Indoor/outdoor facilities

## What to Ask

1. What's the coach-to-player ratio?
2. What's included (lunch, shirt, etc.)?
3. What's the cancellation policy?
4. Can I see reviews from other families?

At PTP, we check all these boxes and more!
    `,
    featuredImage: 'https://images.unsplash.com/photo-1526232761682-d26e03ac148e?w=800',
    category: 'summer-camps',
    tags: ['summer-camps', 'guide', 'choosing-camps'],
    author: {
      id: 1,
      name: 'Coach Sarah',
      avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
    },
    readTime: 7,
    publishedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    isTrending: false,
  },
  {
    id: 5,
    slug: 'building-confidence-young-players',
    title: 'Building Confidence in Young Soccer Players',
    excerpt: 'Mental strength is just as important as physical skills. Here\'s how to help your child develop confidence.',
    content: `
# Building Confidence in Young Soccer Players

Confidence on the field leads to better performance and more enjoyment of the game.

## Celebrate Effort, Not Just Results

Praise hard work and improvement, regardless of the score.

## Set Realistic Goals

Work with your child to set achievable goals they can work toward.

## Encourage Mistakes

Mistakes are learning opportunities. The best players make the most mistakes because they're trying new things.

## Positive Self-Talk

Teach your child to replace "I can't" with "I'm learning to."

## Lead by Example

Show enthusiasm and positivity when watching games. Avoid criticism from the sidelines.

A confident player is a better player!
    `,
    featuredImage: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=800',
    category: 'tips',
    tags: ['confidence', 'mental-game', 'parenting'],
    author: {
      id: 4,
      name: 'Dr. James Wilson',
      avatar: 'https://randomuser.me/api/portraits/men/52.jpg',
      bio: 'Sports psychologist',
    },
    readTime: 5,
    publishedAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    isTrending: true,
  },
];

const getMockBlogPosts = async (
  category?: BlogCategory,
  page = 1,
  perPage = 10,
  search?: string
): Promise<BlogResponse> => {
  await new Promise(resolve => setTimeout(resolve, 300));

  let filtered = [...mockBlogPosts];

  if (category && category !== 'all') {
    filtered = filtered.filter(p => p.category === category);
  }

  if (search) {
    const searchLower = search.toLowerCase();
    filtered = filtered.filter(
      p =>
        p.title.toLowerCase().includes(searchLower) ||
        p.excerpt.toLowerCase().includes(searchLower) ||
        p.tags.some(t => t.includes(searchLower))
    );
  }

  const total = filtered.length;
  const start = (page - 1) * perPage;
  const posts = filtered.slice(start, start + perPage);

  return {
    posts,
    total,
    page,
    perPage,
    hasMore: start + perPage < total,
  };
};

const mockFAQ: FAQItem[] = [
  {
    id: '1',
    question: 'What age groups do you serve?',
    answer: 'We offer programs for players ages 6-17, with age-appropriate groups and training tailored to each developmental stage.',
    category: 'general',
    order: 1,
  },
  {
    id: '2',
    question: 'How do I register for a camp?',
    answer: 'Simply browse our available camps, select the one that works for you, and complete the checkout process. You\'ll receive a confirmation email with all the details.',
    category: 'registration',
    order: 1,
  },
  {
    id: '3',
    question: 'What is your cancellation policy?',
    answer: 'You can cancel up to 48 hours before the camp starts for a full refund. Cancellations within 48 hours may be eligible for credit toward a future camp.',
    category: 'registration',
    order: 2,
  },
  {
    id: '4',
    question: 'What should my child bring to camp?',
    answer: 'Players should bring: cleats (or indoor shoes), shin guards, a water bottle, sunscreen, and a positive attitude! Lunch is required for full-day camps.',
    category: 'camps',
    order: 1,
  },
  {
    id: '5',
    question: 'Who are the coaches?',
    answer: 'All PTP coaches are current or former NCAA Division I, II, or III players. They are background-checked, CPR certified, and trained in age-appropriate coaching methods.',
    category: 'coaches',
    order: 1,
  },
  {
    id: '6',
    question: 'What is the coach-to-player ratio?',
    answer: 'We maintain an 8:1 player-to-coach ratio at all camps to ensure personalized attention and quality instruction.',
    category: 'camps',
    order: 2,
  },
  {
    id: '7',
    question: 'Do you offer private training?',
    answer: 'Yes! Our private training program connects you with NCAA-level mentors for 1-on-1 or small group sessions. Book directly through the app.',
    category: 'training',
    order: 1,
  },
  {
    id: '8',
    question: 'What if it rains?',
    answer: 'Many of our camps are held at indoor facilities. For outdoor camps, we have backup indoor locations or will communicate any weather-related changes via email.',
    category: 'camps',
    order: 3,
  },
  {
    id: '9',
    question: 'Can I get a refund if my child is sick?',
    answer: 'Yes, we understand that kids get sick. Contact us as soon as possible and we\'ll work with you to either refund or credit your registration.',
    category: 'registration',
    order: 3,
  },
  {
    id: '10',
    question: 'How do I contact you?',
    answer: 'You can reach us via email at info@ptpsummercamps.com, by phone at (610) 555-0123, or through the in-app messaging feature.',
    category: 'general',
    order: 2,
  },
];

const mockStateLandingPages: StateLandingPage[] = [
  {
    state: 'Pennsylvania',
    stateCode: 'PA',
    heroImage: 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=1200',
    title: 'Soccer Camps in Pennsylvania',
    subtitle: 'Train with NCAA mentors in the Keystone State',
    description: 'PTP offers premier soccer camps throughout Pennsylvania, from the Main Line to West Chester and beyond.',
    campCount: 12,
    trainerCount: 18,
    locations: ['Main Line', 'West Chester', 'King of Prussia', 'Philadelphia', 'Phoenixville'],
    featuredCamps: [1, 5],
    featuredTrainers: ['t1', 't2'],
    testimonials: [],
  },
  {
    state: 'New Jersey',
    stateCode: 'NJ',
    heroImage: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1200',
    title: 'Soccer Camps in New Jersey',
    subtitle: 'Elite training in the Garden State',
    description: 'Find top-quality soccer camps in Short Hills, Princeton, and throughout New Jersey.',
    campCount: 8,
    trainerCount: 12,
    locations: ['Short Hills', 'Princeton', 'Summit', 'Montclair'],
    featuredCamps: [3, 7],
    featuredTrainers: ['t3', 't4'],
    testimonials: [],
  },
  {
    state: 'Delaware',
    stateCode: 'DE',
    heroImage: 'https://images.unsplash.com/photo-1526232761682-d26e03ac148e?w=1200',
    title: 'Soccer Camps in Delaware',
    subtitle: 'First State soccer excellence',
    description: 'Quality soccer training in Wilmington and surrounding areas.',
    campCount: 3,
    trainerCount: 5,
    locations: ['Wilmington', 'Newark', 'Hockessin'],
    featuredCamps: [],
    featuredTrainers: [],
    testimonials: [],
  },
  {
    state: 'Maryland',
    stateCode: 'MD',
    heroImage: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=1200',
    title: 'Soccer Camps in Maryland',
    subtitle: 'Premier training in the Old Line State',
    description: 'Coming soon to Baltimore and the DC suburbs.',
    campCount: 2,
    trainerCount: 4,
    locations: ['Baltimore', 'Bethesda'],
    featuredCamps: [],
    featuredTrainers: [],
    testimonials: [],
  },
  {
    state: 'New York',
    stateCode: 'NY',
    heroImage: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=1200',
    title: 'Soccer Camps in New York',
    subtitle: 'World-class training in the Empire State',
    description: 'Expanding to Westchester and Long Island.',
    campCount: 2,
    trainerCount: 3,
    locations: ['Westchester', 'Long Island'],
    featuredCamps: [],
    featuredTrainers: [],
    testimonials: [],
  },
];

const mockTestimonials: Testimonial[] = [
  {
    id: '1',
    author: 'Jennifer M.',
    location: 'Wayne, PA',
    rating: 5,
    text: 'My son absolutely loved the winter clinic. The coaches were amazing and he learned so much in just one day!',
    date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    programType: 'clinic',
    verified: true,
  },
  {
    id: '2',
    author: 'Michael R.',
    location: 'Short Hills, NJ',
    rating: 5,
    text: 'The private training sessions have been a game-changer for my daughter. Her confidence on the field has skyrocketed.',
    date: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
    programType: 'training',
    verified: true,
  },
  {
    id: '3',
    author: 'Sarah K.',
    location: 'West Chester, PA',
    rating: 5,
    text: 'Best summer camp experience ever! Both of my kids can\'t wait to go back next year.',
    date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    programType: 'camp',
    verified: true,
  },
  {
    id: '4',
    author: 'David L.',
    location: 'Princeton, NJ',
    rating: 5,
    text: 'The NCAA-level coaches really know how to connect with kids. Professional yet fun atmosphere.',
    date: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    programType: 'camp',
    verified: true,
  },
  {
    id: '5',
    author: 'Emily T.',
    location: 'King of Prussia, PA',
    rating: 4,
    text: 'Great organization and communication. My only suggestion would be more shade at the outdoor facilities!',
    date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    programType: 'camp',
    verified: true,
  },
];

const mockPromoBanners: PromoBanner[] = [
  {
    id: '1',
    type: 'promo',
    title: 'Limited Spots Available!',
    message: 'Winter clinics are filling up fast. Register today!',
    actionText: 'View Clinics',
    actionUrl: '/camps?filter=clinic',
    dismissible: true,
  },
  {
    id: '2',
    type: 'info',
    title: 'Bundle & Save',
    message: 'Register for 2+ camps and get 10% off!',
    dismissible: true,
  },
];

const mockWelcomePopup: WelcomePopup = {
  id: 'welcome-10',
  title: 'Welcome to PTP!',
  subtitle: 'Join our family of soccer players',
  offerText: 'Get $10 OFF your first camp',
  discountCode: 'WELCOME10',
  discountValue: '$10',
  expiryText: 'Use within 30 days',
};

const mockLegalDocs: LegalDocument[] = [
  {
    type: 'terms',
    title: 'Terms of Service',
    content: 'These Terms of Service govern your use of the PTP Soccer mobile application...',
    version: '1.0',
    effectiveDate: '2024-01-01',
    lastUpdated: '2024-01-01',
  },
  {
    type: 'privacy',
    title: 'Privacy Policy',
    content: 'This Privacy Policy describes how PTP Soccer collects, uses, and protects your information...',
    version: '1.0',
    effectiveDate: '2024-01-01',
    lastUpdated: '2024-01-01',
  },
  {
    type: 'waiver',
    title: 'Liability Waiver',
    content: 'By registering for PTP Soccer camps and programs, you acknowledge the inherent risks...',
    version: '1.0',
    effectiveDate: '2024-01-01',
    lastUpdated: '2024-01-01',
  },
  {
    type: 'refund-policy',
    title: 'Refund Policy',
    content: 'PTP Soccer offers a 48-hour cancellation policy for full refunds...',
    version: '1.0',
    effectiveDate: '2024-01-01',
    lastUpdated: '2024-01-01',
  },
];

const mockAppStats: AppStats = {
  totalCamps: 19,
  totalTrainers: 25,
  playerToCoachRatio: '5:1',
  averageRating: 4.9,
  totalFamilies: 1500,
  statesServed: 5,
};

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
  { id: 7, name: 'Wilmington', slug: 'wilmington', city: 'Wilmington', state: 'DE', isActive: true },
];

export {
  mockBlogPosts,
  mockFAQ,
  mockStateLandingPages,
  mockTestimonials,
  mockPromoBanners,
  mockWelcomePopup,
  mockLegalDocs,
  mockAppStats,
  mockSpecialties,
  mockLocations,
};
