/**
 * PTPButton Component
 *
 * Branded button component with multiple variants.
 * Ensures minimum touch target of 44x44 points.
 */

import React from 'react';
import {
  TouchableOpacity,
  TouchableOpacityProps,
  StyleSheet,
  ActivityIndicator,
  View,
  ViewStyle,
} from 'react-native';
import { PTPText } from './PTPText';
import { colors } from '../theme/colors';
import { spacing, borderRadius } from '../theme/spacing';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'small' | 'medium' | 'large';

interface PTPButtonProps extends Omit<TouchableOpacityProps, 'style'> {
  /**
   * Button text
   */
  title: string;
  /**
   * Button variant
   */
  variant?: ButtonVariant;
  /**
   * Button size
   */
  size?: ButtonSize;
  /**
   * Show loading indicator
   */
  loading?: boolean;
  /**
   * Disable the button
   */
  disabled?: boolean;
  /**
   * Full width button
   */
  fullWidth?: boolean;
  /**
   * Left icon component
   */
  leftIcon?: React.ReactNode;
  /**
   * Right icon component
   */
  rightIcon?: React.ReactNode;
  /**
   * Custom style
   */
  style?: ViewStyle;
}

/**
 * PTPButton - Branded button with PTP colors
 *
 * @example
 * <PTPButton title="Register" onPress={handleRegister} />
 * <PTPButton title="Cancel" variant="outline" onPress={handleCancel} />
 * <PTPButton title="Loading..." loading />
 */
export const PTPButton: React.FC<PTPButtonProps> = ({
  title,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  style,
  onPress,
  accessibilityLabel,
  ...props
}) => {
  const isDisabled = disabled || loading;

  const buttonStyle = [
    styles.base,
    styles[variant],
    styles[size],
    fullWidth && styles.fullWidth,
    isDisabled && styles.disabled,
    style,
  ];

  const textColor = getTextColor(variant, isDisabled);
  const textVariant = size === 'small' ? 'buttonSmall' : size === 'large' ? 'buttonLarge' : 'buttonMedium';

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      accessibilityLabel={accessibilityLabel || title}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <View style={styles.content}>
          {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
          <PTPText variant={textVariant} color={textColor}>
            {title}
          </PTPText>
          {rightIcon && <View style={styles.iconRight}>{rightIcon}</View>}
        </View>
      )}
    </TouchableOpacity>
  );
};

const getTextColor = (variant: ButtonVariant, disabled: boolean): string => {
  if (disabled) return colors.gray400;

  switch (variant) {
    case 'primary':
      return colors.inkBlack;
    case 'secondary':
      return colors.white;
    case 'outline':
    case 'ghost':
      return colors.inkBlack;
    case 'danger':
      return colors.white;
    default:
      return colors.inkBlack;
  }
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,
    minHeight: 44, // Minimum touch target
  },

  // Variants
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.inkBlack,
  },
  outline: {
    backgroundColor: colors.transparent,
    borderWidth: 2,
    borderColor: colors.inkBlack,
  },
  ghost: {
    backgroundColor: colors.transparent,
  },
  danger: {
    backgroundColor: colors.error,
  },

  // Sizes
  small: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    minHeight: 36,
  },
  medium: {
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[3],
    minHeight: 48,
  },
  large: {
    paddingHorizontal: spacing[8],
    paddingVertical: spacing[4],
    minHeight: 56,
  },

  // States
  fullWidth: {
    width: '100%',
  },
  disabled: {
    backgroundColor: colors.gray200,
    borderColor: colors.gray200,
  },

  // Content
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLeft: {
    marginRight: spacing[2],
  },
  iconRight: {
    marginLeft: spacing[2],
  },
});

export default PTPButton;
