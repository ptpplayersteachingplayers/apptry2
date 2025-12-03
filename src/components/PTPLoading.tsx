/**
 * PTPLoading Components
 *
 * Loading indicators and skeleton loaders for the app.
 */

import React from 'react';
import {
  View,
  ActivityIndicator,
  StyleSheet,
  Animated,
  Easing,
  ViewStyle,
  DimensionValue,
} from 'react-native';
import { PTPText } from './PTPText';
import { colors } from '../theme/colors';
import { spacing, borderRadius } from '../theme/spacing';

interface PTPLoadingProps {
  /**
   * Loading message
   */
  message?: string;
  /**
   * Size of the indicator
   */
  size?: 'small' | 'large';
  /**
   * Custom style
   */
  style?: ViewStyle;
}

/**
 * PTPLoading - Full screen loading indicator
 */
export const PTPLoading: React.FC<PTPLoadingProps> = ({
  message,
  size = 'large',
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <ActivityIndicator size={size} color={colors.primary} />
      {message && (
        <PTPText variant="body" color="gray500" style={styles.message}>
          {message}
        </PTPText>
      )}
    </View>
  );
};

/**
 * PTPLoadingOverlay - Loading overlay that covers content
 */
export const PTPLoadingOverlay: React.FC<PTPLoadingProps> = ({ message }) => {
  return (
    <View style={styles.overlay}>
      <View style={styles.overlayContent}>
        <ActivityIndicator size="large" color={colors.primary} />
        {message && (
          <PTPText variant="body" color="white" style={styles.message}>
            {message}
          </PTPText>
        )}
      </View>
    </View>
  );
};

/**
 * PTPSkeleton - Skeleton loader for content placeholders
 */
interface PTPSkeletonProps {
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export const PTPSkeleton: React.FC<PTPSkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius: customBorderRadius = borderRadius.base,
  style,
}) => {
  const animatedValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius: customBorderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
};

/**
 * PTPCardSkeleton - Skeleton for card loading state
 */
export const PTPCardSkeleton: React.FC<{ style?: ViewStyle }> = ({ style }) => {
  return (
    <View style={[styles.cardSkeleton, style]}>
      <PTPSkeleton height={160} borderRadius={borderRadius.lg} />
      <View style={styles.cardSkeletonContent}>
        <PTPSkeleton width="80%" height={20} />
        <PTPSkeleton width="60%" height={16} style={{ marginTop: spacing[2] }} />
        <PTPSkeleton width="40%" height={16} style={{ marginTop: spacing[1] }} />
      </View>
    </View>
  );
};

/**
 * PTPListSkeleton - Skeleton for list loading state
 */
interface PTPListSkeletonProps {
  count?: number;
  style?: ViewStyle;
}

export const PTPListSkeleton: React.FC<PTPListSkeletonProps> = ({
  count = 3,
  style,
}) => {
  return (
    <View style={style}>
      {Array.from({ length: count }).map((_, index) => (
        <PTPCardSkeleton key={index} style={{ marginBottom: spacing[3] }} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.offWhite,
  },
  message: {
    marginTop: spacing[4],
    textAlign: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayContent: {
    backgroundColor: colors.inkBlack,
    padding: spacing[6],
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  skeleton: {
    backgroundColor: colors.gray200,
  },
  cardSkeleton: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  cardSkeletonContent: {
    padding: spacing[4],
  },
});

export default PTPLoading;
