/**
 * PTP Soccer Spacing System
 *
 * Consistent spacing scale for margins, paddings, and gaps.
 * Based on a 4px base unit for pixel-perfect alignment.
 */

export const spacing = {
  0: 0,
  1: 4, // xs
  2: 8, // sm
  3: 12,
  4: 16, // base
  5: 20,
  6: 24, // lg
  8: 32, // xl
  10: 40,
  12: 48,
  16: 64,
  20: 80,
  24: 96,
} as const;

// Semantic spacing for common use cases
export const layoutSpacing = {
  // Screen padding
  screenHorizontal: spacing[4],
  screenVertical: spacing[4],

  // Section spacing
  sectionGap: spacing[8],
  sectionPadding: spacing[6],

  // Card padding
  cardPadding: spacing[4],
  cardGap: spacing[3],

  // List item spacing
  listItemGap: spacing[3],

  // Input/button padding
  inputHorizontal: spacing[4],
  inputVertical: spacing[3],
  buttonHorizontal: spacing[6],
  buttonVertical: spacing[4],

  // Small elements
  tagPadding: spacing[2],
  iconGap: spacing[2],

  // Tab bar
  tabBarHeight: 84,
  tabBarPadding: spacing[2],
} as const;

// Border radius values
export const borderRadius = {
  none: 0,
  sm: 4,
  base: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

// Shadow styles
export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  base: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;

export type SpacingValue = keyof typeof spacing;
export type BorderRadiusValue = keyof typeof borderRadius;
export type ShadowValue = keyof typeof shadows;
