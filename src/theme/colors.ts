/**
 * PTP Soccer Brand Colors
 *
 * Use these colors consistently across all screens and components.
 * Primary colors create the high-energy soccer feel with bold accents.
 */

export const colors = {
  // Primary Brand Colors
  primary: '#FCB900', // PTP Yellow - main accent color
  primaryDark: '#D9A000', // Darker yellow for pressed states
  primaryLight: '#FFD54F', // Lighter yellow for highlights

  // Neutrals
  inkBlack: '#0E0F11', // Primary dark background
  offWhite: '#F4F3F0', // Primary light background
  white: '#FFFFFF',
  black: '#000000',

  // Grays
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB', // Border Gray
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280', // Muted Gray - secondary text
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',

  // Semantic Colors
  success: '#10B981',
  successLight: '#D1FAE5',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  error: '#EF4444',
  errorLight: '#FEE2E2',
  info: '#3B82F6',
  infoLight: '#DBEAFE',

  // Camp/Clinic Status Colors
  almostFull: '#F97316', // Orange for urgency
  bestseller: '#8B5CF6', // Purple for bestseller badge
  available: '#10B981', // Green for available

  // Overlay Colors (for hero images)
  overlayDark: 'rgba(14, 15, 17, 0.6)',
  overlayLight: 'rgba(14, 15, 17, 0.3)',
  overlayGradientStart: 'rgba(14, 15, 17, 0.8)',
  overlayGradientEnd: 'rgba(14, 15, 17, 0)',

  // Transparent
  transparent: 'transparent',
} as const;

// Type for accessing color keys
export type ColorName = keyof typeof colors;

// Semantic color mappings for common use cases
export const semanticColors = {
  // Backgrounds
  backgroundPrimary: colors.offWhite,
  backgroundSecondary: colors.white,
  backgroundDark: colors.inkBlack,

  // Text
  textPrimary: colors.inkBlack,
  textSecondary: colors.gray500,
  textInverse: colors.white,
  textAccent: colors.primary,

  // Borders
  border: colors.gray200,
  borderFocused: colors.primary,

  // Buttons
  buttonPrimary: colors.primary,
  buttonPrimaryText: colors.inkBlack,
  buttonSecondary: colors.inkBlack,
  buttonSecondaryText: colors.white,
  buttonDisabled: colors.gray300,

  // Cards
  cardBackground: colors.white,
  cardBorder: colors.gray200,

  // Tab Bar
  tabBarActive: colors.primary,
  tabBarInactive: colors.gray500,
  tabBarBackground: colors.white,
} as const;
