/**
 * PTP Soccer Spacing & Layout System
 *
 * Sharp edges (border-radius: 0), 2px borders, athletic aesthetic
 * Mobile-first with consistent 4px grid
 */

// Base spacing scale (4px grid)
export const spacing = {
  0: 0,
  1: 4,   // xs - minimal gaps
  2: 8,   // sm - icon gaps, tag padding
  3: 12,  // medium gaps
  4: 16,  // base - standard padding
  5: 20,  // slightly larger
  6: 24,  // lg - section padding
  8: 32,  // xl - section gaps
  10: 40, // large gaps
  12: 48, // extra large
  16: 64, // hero padding
  20: 80, // major sections
  24: 96, // screen margins
} as const;

// Semantic layout spacing
export const layoutSpacing = {
  // Screen padding
  screenHorizontal: spacing[4],
  screenVertical: spacing[4],
  screenTop: spacing[6],
  screenBottom: spacing[8],

  // Section spacing
  sectionGap: spacing[8],
  sectionPadding: spacing[6],

  // Card spacing
  cardPadding: spacing[6],
  cardGap: spacing[3],
  cardMargin: spacing[4],

  // List spacing
  listItemGap: spacing[3],
  listSectionGap: spacing[6],

  // Input/form spacing
  inputHorizontal: spacing[4],
  inputVertical: spacing[4],
  inputGap: spacing[4],
  formGap: spacing[5],

  // Button spacing
  buttonHorizontal: spacing[8],
  buttonVertical: spacing[4],
  buttonGap: spacing[3],

  // Small elements
  tagPadding: spacing[2],
  tagGap: spacing[2],
  iconGap: spacing[2],
  badgePadding: spacing[2],

  // Tab bar
  tabBarHeight: 84,
  tabBarPadding: spacing[2],

  // Navigation
  headerHeight: 56,
  headerPadding: spacing[4],
} as const;

// Border radius - Sharp edges by default
export const borderRadius = {
  none: 0,      // Default - sharp edges for cards, buttons
  sm: 2,        // Subtle rounding
  base: 4,      // Minimal rounding
  md: 8,        // Moderate rounding
  lg: 12,       // Larger rounding
  xl: 16,       // Extra large
  '2xl': 24,    // Very rounded
  full: 9999,   // Circles/pills
} as const;

// Border widths
export const borderWidth = {
  none: 0,
  thin: 1,
  base: 2,      // Standard border width for PTP style
  thick: 3,
  heavy: 4,
} as const;

// Shadow styles
export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  base: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },
  // Gold glow effect
  glow: {
    shadowColor: '#FCB900',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  glowSm: {
    shadowColor: '#FCB900',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
} as const;

// Breakpoints for responsive design
export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const;

// Animation timing
export const timing = {
  fast: 100,
  base: 200,
  slow: 300,
  slower: 500,
} as const;

export type SpacingValue = keyof typeof spacing;
export type BorderRadiusValue = keyof typeof borderRadius;
export type ShadowValue = keyof typeof shadows;
