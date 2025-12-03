/**
 * PTPTag Component
 *
 * Small tag/badge component for labels like "Bestseller", "Almost Full", etc.
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { PTPText } from './PTPText';
import { colors } from '../theme/colors';
import { spacing, borderRadius } from '../theme/spacing';

type TagVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
type TagSize = 'small' | 'medium';

interface PTPTagProps {
  /**
   * Tag label text
   */
  label: string;
  /**
   * Tag variant/color
   */
  variant?: TagVariant;
  /**
   * Tag size
   */
  size?: TagSize;
  /**
   * Custom style
   */
  style?: ViewStyle;
}

/**
 * PTPTag - Branded tag/badge component
 *
 * @example
 * <PTPTag label="Bestseller" variant="primary" />
 * <PTPTag label="Almost Full" variant="warning" />
 * <PTPTag label="Confirmed" variant="success" />
 */
export const PTPTag: React.FC<PTPTagProps> = ({
  label,
  variant = 'default',
  size = 'medium',
  style,
}) => {
  const variantStyles = getVariantStyles(variant);

  return (
    <View style={[styles.tag, styles[size], variantStyles.container, style]}>
      <PTPText
        variant={size === 'small' ? 'caption' : 'label'}
        color={variantStyles.textColor}
        weight="semiBold"
      >
        {label}
      </PTPText>
    </View>
  );
};

const getVariantStyles = (variant: TagVariant): { container: ViewStyle; textColor: string } => {
  switch (variant) {
    case 'primary':
      return {
        container: { backgroundColor: colors.primary },
        textColor: colors.inkBlack,
      };
    case 'success':
      return {
        container: { backgroundColor: colors.successLight },
        textColor: colors.success,
      };
    case 'warning':
      return {
        container: { backgroundColor: colors.warningLight },
        textColor: colors.warning,
      };
    case 'danger':
      return {
        container: { backgroundColor: colors.errorLight },
        textColor: colors.error,
      };
    case 'info':
      return {
        container: { backgroundColor: colors.infoLight },
        textColor: colors.info,
      };
    case 'default':
    default:
      return {
        container: { backgroundColor: colors.gray100 },
        textColor: colors.gray700,
      };
  }
};

const styles = StyleSheet.create({
  tag: {
    alignSelf: 'flex-start',
    borderRadius: borderRadius.sm,
  },
  small: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1] / 2,
  },
  medium: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
  },
});

export default PTPTag;
