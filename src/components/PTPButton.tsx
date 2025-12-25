/**
 * PTPButton Component
 *
 * Bold, athletic button with sharp edges and gold accents.
 * Uses Oswald font with uppercase styling.
 */

import React, { useCallback, memo, useRef } from 'react';
import {
  Pressable,
  PressableProps,
  StyleSheet,
  ActivityIndicator,
  View,
  ViewStyle,
  Animated,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { PTPText } from './PTPText';
import { colors, semanticColors } from '../theme/colors';
import { spacing, borderRadius, borderWidth } from '../theme/spacing';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'small' | 'medium' | 'large';

interface PTPButtonProps extends Omit<PressableProps, 'style'> {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  haptic?: boolean;
  style?: ViewStyle;
}

/**
 * PTPButton - Bold, sharp-edged button with gold accents
 *
 * @example
 * <PTPButton title="BOOK NOW" onPress={handleBook} />
 * <PTPButton title="CANCEL" variant="secondary" onPress={handleCancel} />
 */
export const PTPButton: React.FC<PTPButtonProps> = memo(({
  title,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  haptic = true,
  style,
  onPress,
  accessibilityLabel,
  ...props
}) => {
  const isDisabled = disabled || loading;
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(scale, {
      toValue: 0.98,
      useNativeDriver: true,
      tension: 100,
      friction: 10,
    }).start();
  }, [scale]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 10,
    }).start();
  }, [scale]);

  const handlePress = useCallback((event: any) => {
    if (haptic) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onPress?.(event);
  }, [haptic, onPress]);

  const buttonStyle = [
    styles.base,
    styles[variant],
    styles[size],
    fullWidth && styles.fullWidth,
    isDisabled && styles.disabled,
    isDisabled && variant === 'primary' && styles.disabledPrimary,
    isDisabled && variant === 'secondary' && styles.disabledSecondary,
    style,
  ];

  const textColor = getTextColor(variant, isDisabled);
  const textVariant = size === 'small' ? 'buttonSmall' : size === 'large' ? 'buttonLarge' : 'buttonMedium';

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isDisabled}
      accessibilityLabel={accessibilityLabel || title}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      {...props}
    >
      <Animated.View style={[buttonStyle, { transform: [{ scale }] }]}>
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
      </Animated.View>
    </Pressable>
  );
});

PTPButton.displayName = 'PTPButton';

const getTextColor = (variant: ButtonVariant, disabled: boolean): string => {
  if (disabled) return colors.gray500;

  switch (variant) {
    case 'primary':
      return colors.black;
    case 'secondary':
    case 'outline':
      return colors.white;
    case 'ghost':
      return colors.primary;
    case 'danger':
      return colors.white;
    default:
      return colors.black;
  }
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.none, // Sharp edges
    minHeight: 44,
  },

  // Variants
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.transparent,
    borderWidth: borderWidth.base,
    borderColor: colors.primary,
  },
  outline: {
    backgroundColor: colors.transparent,
    borderWidth: borderWidth.base,
    borderColor: colors.gray700,
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
    minHeight: 40,
  },
  medium: {
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[4],
    minHeight: 52,
  },
  large: {
    paddingHorizontal: spacing[8],
    paddingVertical: spacing[5],
    minHeight: 60,
  },

  // States
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  disabledPrimary: {
    backgroundColor: colors.gray700,
  },
  disabledSecondary: {
    borderColor: colors.gray700,
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
