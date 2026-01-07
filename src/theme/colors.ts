/**
 * PTP Soccer Brand Colors
 *
 * Design inspiration: PTP marketing site (clean light canvas with black + gold)
 * Light-first surfaces that mirror the website, with bold gold accents
 */

export const colors = {
  // Primary - PTP Gold
  primary: '#FCB900',
  primaryHover: '#E5A800',
  primaryLight: 'rgba(252, 185, 0, 0.1)',
  primaryGlow: 'rgba(252, 185, 0, 0.3)',

  // Backgrounds - Light-first to match the website
  black: '#F4F3F0', // Base canvas (light warm white)
  blackLight: '#ECE8E0', // Muted surface
  blackCard: '#FFFFFF', // Card/paper
  blackElevated: '#FFFFFF',

  // Text Colors
  white: '#FFFFFF',
  offWhite: '#FAFAFA',
  gray50: '#F9F9F9',
  gray100: '#F5F5F5',
  gray200: '#E5E5E5',
  gray300: '#A0A0A0',
  gray400: '#8A8A8A',
  gray500: '#6B6B6B',
  gray600: '#525252',
  gray700: '#333333',
  inkBlack: '#0E0F11',

  // Status Colors
  success: '#22C55E',
  successLight: 'rgba(34, 197, 94, 0.1)',
  error: '#EF4444',
  errorLight: 'rgba(239, 68, 68, 0.1)',
  warning: '#F59E0B',
  warningLight: 'rgba(245, 158, 11, 0.1)',
  info: '#3B82F6',
  infoLight: 'rgba(59, 130, 246, 0.1)',

  // Camp/Clinic Status
  almostFull: '#F97316',
  bestseller: '#8B5CF6',
  available: '#22C55E',

  // Overlays
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayDark: 'rgba(10, 10, 10, 0.8)',
  overlayLight: 'rgba(10, 10, 10, 0.4)',

  // Transparent
  transparent: 'transparent',
} as const;

export type ColorName = keyof typeof colors;

// Semantic color mappings for the light theme
export const semanticColors = {
  // Backgrounds
  backgroundPrimary: colors.black,
  backgroundSecondary: colors.blackLight,
  backgroundCard: colors.blackCard,
  backgroundElevated: colors.blackElevated,

  // Text
  textPrimary: colors.inkBlack,
  textSecondary: colors.gray600,
  textMuted: colors.gray500,
  textAccent: colors.primary,
  textInverse: colors.white,

  // Borders
  border: colors.gray200,
  borderFocused: colors.primary,
  borderCard: colors.gray200,

  // Buttons
  buttonPrimary: colors.primary,
  buttonPrimaryHover: colors.primaryHover,
  buttonPrimaryText: colors.inkBlack,
  buttonSecondary: colors.white,
  buttonSecondaryBorder: colors.inkBlack,
  buttonSecondaryText: colors.inkBlack,
  buttonDisabled: colors.gray200,
  buttonDisabledText: colors.gray500,

  // Inputs
  inputBackground: colors.white,
  inputBorder: colors.gray200,
  inputBorderFocus: colors.primary,
  inputText: colors.inkBlack,
  inputPlaceholder: colors.gray500,

  // Cards
  cardBackground: colors.blackCard,
  cardBorder: colors.gray200,
  cardBorderHover: colors.primaryLight,

  // Tab Bar
  tabBarActive: colors.primary,
  tabBarInactive: colors.gray500,
  tabBarBackground: colors.white,

  // Navigation
  navBackground: colors.white,
  navBorder: colors.gray200,
} as const;

// CSS-style color tokens for reference
export const cssColors = `
:root {
  /* Primary */
  --ptp-gold: #FCB900;
  --ptp-gold-hover: #E5A800;
  --ptp-gold-light: rgba(252, 185, 0, 0.1);
  --ptp-gold-glow: rgba(252, 185, 0, 0.3);

  /* Backgrounds */
  --ptp-black: #F4F3F0;
  --ptp-black-light: #ECE8E0;
  --ptp-black-card: #FFFFFF;
  --ptp-black-elevated: #FFFFFF;

  /* Text */
  --ptp-white: #FFFFFF;
  --ptp-gray-100: #F5F5F5;
  --ptp-gray-300: #A0A0A0;
  --ptp-gray-500: #6B6B6B;
  --ptp-gray-700: #333333;

  /* Status */
  --ptp-success: #22C55E;
  --ptp-error: #EF4444;
  --ptp-warning: #F59E0B;
  --ptp-info: #3B82F6;
}
`;
