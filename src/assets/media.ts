/**
 * PTP Soccer Media Assets
 *
 * Remote URLs for hero images, backgrounds, and gallery photos.
 * Use these for:
 * - Hero backgrounds on Home and Camps/Clinics screens
 * - Cards showcasing winter clinics, summer camps, and private training
 * - Small galleries on profile screens
 */

// Base URL for PTP media assets
const MEDIA_BASE_URL = 'https://ptpsummercamps.com/wp-content/uploads/2025/12';

/**
 * Main hero and action photos
 * High-energy soccer photography for brand feel
 */
export const heroImages = [
  `${MEDIA_BASE_URL}/BG7A1915.jpg`,
  `${MEDIA_BASE_URL}/BG7A1899.jpg`,
  `${MEDIA_BASE_URL}/BG7A1874.jpg`,
  `${MEDIA_BASE_URL}/BG7A1847.jpg`,
  `${MEDIA_BASE_URL}/BG7A1797.jpg`,
  `${MEDIA_BASE_URL}/BG7A1790.jpg`,
  `${MEDIA_BASE_URL}/BG7A1595.jpg`,
  `${MEDIA_BASE_URL}/BG7A1563.jpg`,
  `${MEDIA_BASE_URL}/BG7A1539.jpg`,
  `${MEDIA_BASE_URL}/BG7A1520.jpg`,
  `${MEDIA_BASE_URL}/BG7A1393.jpg`,
  `${MEDIA_BASE_URL}/BG7A1356.jpg`,
  `${MEDIA_BASE_URL}/BG7A1288.jpg`,
  `${MEDIA_BASE_URL}/BG7A1283.jpg`,
  `${MEDIA_BASE_URL}/BG7A1281.jpg`,
  `${MEDIA_BASE_URL}/BG7A1279.jpg`,
  `${MEDIA_BASE_URL}/BG7A1278.jpg`,
  `${MEDIA_BASE_URL}/BG7A1272.jpg`,
  `${MEDIA_BASE_URL}/BG7A1886.jpg`,
  `${MEDIA_BASE_URL}/BG7A1804.jpg`,
  `${MEDIA_BASE_URL}/BG7A1787.jpg`,
  `${MEDIA_BASE_URL}/BG7A1730.jpg`,
  `${MEDIA_BASE_URL}/BG7A1642.jpg`,
  `${MEDIA_BASE_URL}/BG7A1596.jpg`,
  `${MEDIA_BASE_URL}/BG7A1463.jpg`,
  `${MEDIA_BASE_URL}/BG7A1403.jpg`,
] as const;

/**
 * Specific use case images
 * Pre-selected images for consistent UX across screens
 */
export const featureImages = {
  // Home screen hero
  homeHero: heroImages[0],

  // Camps & Clinics screen
  campsHero: heroImages[1],
  winterClinic: heroImages[5],
  summerCamp: heroImages[10],

  // Private training
  trainingHero: heroImages[3],
  oneOnOne: heroImages[15],

  // Schedule
  scheduleHero: heroImages[7],

  // Trainer screens
  trainerHero: heroImages[12],
  trainerProfile: heroImages[20],

  // Onboarding
  onboarding1: heroImages[2],
  onboarding2: heroImages[8],
  onboarding3: heroImages[14],

  // Welcome/Auth screen
  welcomeHero: heroImages[4],
} as const;

/**
 * Card background images
 * Used for program cards and featured sections
 */
export const cardBackgrounds = {
  winterClinics: [heroImages[5], heroImages[6], heroImages[7]],
  summerCamps: [heroImages[10], heroImages[11], heroImages[12]],
  privateTraining: [heroImages[15], heroImages[16], heroImages[17]],
  featured: [heroImages[0], heroImages[3], heroImages[8]],
} as const;

/**
 * Gallery images for profile screens
 * Show variety of training and camp moments
 */
export const galleryImages = heroImages.slice(18, 26);

/**
 * Get a random hero image
 * Useful for variety in repeated elements
 */
export const getRandomHeroImage = (): string => {
  const index = Math.floor(Math.random() * heroImages.length);
  return heroImages[index];
};

/**
 * Get hero image by index (with wraparound)
 */
export const getHeroImageByIndex = (index: number): string => {
  return heroImages[index % heroImages.length];
};

export default {
  heroImages,
  featureImages,
  cardBackgrounds,
  galleryImages,
  getRandomHeroImage,
  getHeroImageByIndex,
};
