/**
 * PTP Theme Provider
 *
 * Wraps the app with:
 * - Inter font loading
 * - Theme context with colors, typography, and spacing
 * - Safe area handling
 */

import React, { createContext, useContext, ReactNode } from 'react';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
  Inter_900Black,
} from '@expo-google-fonts/inter';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { colors, semanticColors } from './colors';
import { fontFamily, fontSize, textStyles, lineHeight, letterSpacing } from './typography';
import { spacing, layoutSpacing, borderRadius, shadows } from './spacing';

// Theme object containing all design tokens
export const theme = {
  colors,
  semanticColors,
  fontFamily,
  fontSize,
  textStyles,
  lineHeight,
  letterSpacing,
  spacing,
  layoutSpacing,
  borderRadius,
  shadows,
} as const;

export type Theme = typeof theme;

// Theme context
const ThemeContext = createContext<Theme>(theme);

// Hook to access theme
export const useTheme = (): Theme => {
  const themeContext = useContext(ThemeContext);
  if (!themeContext) {
    throw new Error('useTheme must be used within a PTPThemeProvider');
  }
  return themeContext;
};

interface PTPThemeProviderProps {
  children: ReactNode;
}

/**
 * PTP Theme Provider Component
 *
 * Handles font loading and provides theme context to all children.
 * Shows a loading screen while fonts are being loaded.
 */
export const PTPThemeProvider: React.FC<PTPThemeProviderProps> = ({ children }) => {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    Inter_900Black,
  });

  // Show loading screen while fonts are loading
  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.inkBlack,
  },
});

export default PTPThemeProvider;
