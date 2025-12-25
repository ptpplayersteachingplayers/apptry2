/**
 * PTP Soccer Typography System
 *
 * Headings: Oswald (Bold, Uppercase, Wide letter-spacing)
 * Body: Inter (Regular weight for readability)
 *
 * Design: Bold, athletic, high-energy
 */

// Font families
export const fontFamily = {
  // Headings - Oswald
  heading: 'Oswald_700Bold',
  headingMedium: 'Oswald_500Medium',
  headingLight: 'Oswald_400Regular',

  // Body - Inter
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semiBold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  extraBold: 'Inter_800ExtraBold',
  black: 'Inter_900Black',
} as const;

// Font size scale (in pixels)
export const fontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  '5xl': 48,
} as const;

// Line heights
export const lineHeight = {
  none: 1,
  tight: 1.25,
  normal: 1.5,
  relaxed: 1.75,
} as const;

// Letter spacing
export const letterSpacing = {
  tighter: -1,
  tight: -0.5,
  normal: 0,
  wide: 0.5,
  wider: 1,
  widest: 2,
  heading: 0.05 * 16, // 0.05em for headings
  button: 0.1 * 16,   // 0.1em for buttons
} as const;

// Predefined text styles
export const textStyles = {
  // Hero and display - Oswald uppercase
  heroTitle: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize['5xl'],
    lineHeight: fontSize['5xl'] * lineHeight.tight,
    letterSpacing: letterSpacing.heading,
    textTransform: 'uppercase' as const,
  },
  heroSubtitle: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xl,
    lineHeight: fontSize.xl * lineHeight.normal,
  },

  // Section headers - Oswald uppercase
  sectionTitle: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize['2xl'],
    lineHeight: fontSize['2xl'] * lineHeight.tight,
    letterSpacing: letterSpacing.heading,
    textTransform: 'uppercase' as const,
  },
  sectionSubtitle: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.lg,
    lineHeight: fontSize.lg * lineHeight.normal,
  },

  // Card text
  cardTitle: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize.lg,
    lineHeight: fontSize.lg * lineHeight.tight,
    letterSpacing: letterSpacing.heading,
    textTransform: 'uppercase' as const,
  },
  cardSubtitle: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * lineHeight.normal,
  },

  // Body text - Inter
  body: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.base,
    lineHeight: fontSize.base * lineHeight.normal,
  },
  bodySmall: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * lineHeight.normal,
  },
  bodyLarge: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.lg,
    lineHeight: fontSize.lg * lineHeight.relaxed,
  },

  // Labels - Oswald uppercase small
  label: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * lineHeight.normal,
    letterSpacing: letterSpacing.button,
    textTransform: 'uppercase' as const,
  },
  caption: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    lineHeight: fontSize.xs * lineHeight.normal,
  },

  // Buttons - Oswald bold uppercase
  buttonLarge: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize.lg,
    lineHeight: fontSize.lg * lineHeight.tight,
    letterSpacing: letterSpacing.button,
    textTransform: 'uppercase' as const,
  },
  buttonMedium: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize.base,
    lineHeight: fontSize.base * lineHeight.tight,
    letterSpacing: letterSpacing.button,
    textTransform: 'uppercase' as const,
  },
  buttonSmall: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * lineHeight.tight,
    letterSpacing: letterSpacing.button,
    textTransform: 'uppercase' as const,
  },

  // Navigation
  tabLabel: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
    lineHeight: fontSize.xs * lineHeight.normal,
  },
  navTitle: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize.lg,
    lineHeight: fontSize.lg * lineHeight.tight,
    letterSpacing: letterSpacing.heading,
    textTransform: 'uppercase' as const,
  },

  // Stats and numbers
  statNumber: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize['4xl'],
    lineHeight: fontSize['4xl'] * lineHeight.none,
    letterSpacing: letterSpacing.tight,
  },
  statLabel: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize.xs,
    lineHeight: fontSize.xs * lineHeight.normal,
    letterSpacing: letterSpacing.button,
    textTransform: 'uppercase' as const,
  },

  // Price
  price: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize['2xl'],
    lineHeight: fontSize['2xl'] * lineHeight.tight,
  },
  priceSmall: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize.lg,
    lineHeight: fontSize.lg * lineHeight.tight,
  },
} as const;

export type TextStyleName = keyof typeof textStyles;
export type FontFamilyName = keyof typeof fontFamily;
export type FontSizeName = keyof typeof fontSize;
