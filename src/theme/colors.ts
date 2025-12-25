/**
 * PTP Soccer Brand Colors
 *
 * Design inspiration: Nike Training Club x Flex Work x Uber-style booking
 * Dark mode first with bold gold accents
 */

export const colors = {
  // Primary - PTP Gold
  primary: '#FCB900',
  primaryHover: '#E5A800',
  primaryLight: 'rgba(252, 185, 0, 0.1)',
  primaryGlow: 'rgba(252, 185, 0, 0.3)',

  // Backgrounds - Dark Mode First
  black: '#0A0A0A',
  blackLight: '#111111',
  blackCard: '#1A1A1A',
  blackElevated: '#222222',

  // Text Colors
  white: '#FFFFFF',
  gray100: '#F5F5F5',
  gray300: '#A0A0A0',
  gray500: '#6B6B6B',
  gray700: '#333333',

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

// Semantic color mappings for the dark theme
export const semanticColors = {
  // Backgrounds
  backgroundPrimary: colors.black,
  backgroundSecondary: colors.blackLight,
  backgroundCard: colors.blackCard,
  backgroundElevated: colors.blackElevated,

  // Text
  textPrimary: colors.white,
  textSecondary: colors.gray300,
  textMuted: colors.gray500,
  textAccent: colors.primary,
  textInverse: colors.black,

  // Borders
  border: colors.gray700,
  borderFocused: colors.primary,
  borderCard: colors.gray700,

  // Buttons
  buttonPrimary: colors.primary,
  buttonPrimaryHover: colors.primaryHover,
  buttonPrimaryText: colors.black,
  buttonSecondary: colors.transparent,
  buttonSecondaryBorder: colors.primary,
  buttonSecondaryText: colors.white,
  buttonDisabled: colors.gray700,
  buttonDisabledText: colors.gray500,

  // Inputs
  inputBackground: colors.blackLight,
  inputBorder: colors.gray700,
  inputBorderFocus: colors.primary,
  inputText: colors.white,
  inputPlaceholder: colors.gray500,

  // Cards
  cardBackground: colors.blackCard,
  cardBorder: colors.gray700,
  cardBorderHover: colors.primary,

  // Tab Bar
  tabBarActive: colors.primary,
  tabBarInactive: colors.gray500,
  tabBarBackground: colors.black,

  // Navigation
  navBackground: colors.black,
  navBorder: colors.gray700,
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
  --ptp-black: #0A0A0A;
  --ptp-black-light: #111111;
  --ptp-black-card: #1A1A1A;
  --ptp-black-elevated: #222222;

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
