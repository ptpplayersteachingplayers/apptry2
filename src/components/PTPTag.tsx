/**
 * PTPTag Component
 *
 * Sharp-edged tag/badge for labels and status indicators.
 * Uppercase styling with Oswald font.
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { PTPText } from './PTPText';
import { colors } from '../theme/colors';
import { spacing, borderRadius, borderWidth } from '../theme/spacing';

type TagVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
type TagSize = 'small' | 'medium' | 'large';

interface PTPTagProps {
  label: string;
  variant?: TagVariant;
  size?: TagSize;
  outline?: boolean;
  style?: ViewStyle;
}

/**
 * PTPTag - Sharp tag with various color variants
 */
export const PTPTag: React.FC<PTPTagProps> = ({
  label,
  variant = 'default',
  size = 'medium',
  outline = false,
  style,
}) => {
  const tagStyles = [
    styles.base,
    styles[size],
    outline ? getOutlineStyle(variant) : styles[variant],
    style,
  ];

  const textColor = getTextColor(variant, outline);

  return (
    <View style={tagStyles}>
      <PTPText
        variant={size === 'large' ? 'label' : 'caption'}
        color={textColor}
        style={styles.text}
      >
        {label}
      </PTPText>
    </View>
  );
};

const getTextColor = (variant: TagVariant, outline: boolean): string => {
  if (outline) {
    switch (variant) {
      case 'primary': return colors.primary;
      case 'success': return colors.success;
      case 'warning': return colors.warning;
      case 'danger': return colors.error;
      case 'info': return colors.info;
      default: return colors.gray300;
    }
  }

  switch (variant) {
    case 'primary': return colors.black;
    case 'success': return colors.black;
    case 'warning': return colors.black;
    case 'danger': return colors.white;
    case 'info': return colors.white;
    default: return colors.white;
  }
};

const getOutlineStyle = (variant: TagVariant): ViewStyle => {
  const colorMap: Record<TagVariant, string> = {
    primary: colors.primary,
    success: colors.success,
    warning: colors.warning,
    danger: colors.error,
    info: colors.info,
    default: colors.gray700,
  };

  return {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colorMap[variant],
  };
};

/**
 * PTPBadge - Numeric badge for counts
 */
interface PTPBadgeProps {
  count: number;
  maxCount?: number;
  variant?: 'primary' | 'danger';
  style?: ViewStyle;
}

export const PTPBadge: React.FC<PTPBadgeProps> = ({
  count,
  maxCount = 99,
  variant = 'primary',
  style,
}) => {
  const displayCount = count > maxCount ? `${maxCount}+` : count.toString();

  return (
    <View style={[styles.badge, variant === 'primary' ? styles.badgePrimary : styles.badgeDanger, style]}>
      <PTPText variant="caption" color={variant === 'primary' ? 'black' : 'white'}>
        {displayCount}
      </PTPText>
    </View>
  );
};

/**
 * PTPStatusIndicator - Dot indicator for status
 */
interface PTPStatusIndicatorProps {
  status: 'online' | 'offline' | 'busy' | 'away';
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
}

export const PTPStatusIndicator: React.FC<PTPStatusIndicatorProps> = ({
  status,
  size = 'medium',
  style,
}) => {
  const statusColors: Record<string, string> = {
    online: colors.success,
    offline: colors.gray500,
    busy: colors.error,
    away: colors.warning,
  };

  const sizes = {
    small: 8,
    medium: 12,
    large: 16,
  };

  return (
    <View
      style={[
        styles.statusIndicator,
        {
          width: sizes[size],
          height: sizes[size],
          backgroundColor: statusColors[status],
          borderRadius: sizes[size] / 2,
        },
        style,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  base: {
    alignSelf: 'flex-start',
    borderRadius: borderRadius.none,
  },

  // Sizes
  small: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
  },
  medium: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
  },
  large: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
  },

  // Solid variants
  default: {
    backgroundColor: colors.gray700,
  },
  primary: {
    backgroundColor: colors.primary,
  },
  success: {
    backgroundColor: colors.success,
  },
  warning: {
    backgroundColor: colors.warning,
  },
  danger: {
    backgroundColor: colors.error,
  },
  info: {
    backgroundColor: colors.info,
  },

  text: {
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Badge styles
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[1],
  },
  badgePrimary: {
    backgroundColor: colors.primary,
  },
  badgeDanger: {
    backgroundColor: colors.error,
  },

  // Status indicator
  statusIndicator: {
    borderWidth: 2,
    borderColor: colors.black,
  },
});

export default PTPTag;
