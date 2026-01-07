/**
 * PTPLoading Components
 *
 * Dark themed loading indicators and skeleton loaders.
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
  message?: string;
  size?: 'small' | 'large';
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
        <PTPText variant="body" color="gray600" style={styles.message}>
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
          <PTPText variant="body" style={styles.message}>
            {message}
          </PTPText>
        )}
      </View>
    </View>
  );
};

/**
 * PTPLoadingInline - Inline loading for buttons/sections
 */
interface PTPLoadingInlineProps {
  size?: 'small' | 'large';
  color?: string;
}

export const PTPLoadingInline: React.FC<PTPLoadingInlineProps> = ({
  size = 'small',
  color = colors.primary,
}) => {
  return <ActivityIndicator size={size} color={color} />;
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
  borderRadius: customBorderRadius = borderRadius.none,
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
    outputRange: [0.3, 0.6],
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
      <PTPSkeleton height={160} />
      <View style={styles.cardSkeletonContent}>
        <PTPSkeleton width="80%" height={20} />
        <PTPSkeleton width="60%" height={16} style={{ marginTop: spacing[2] }} />
        <PTPSkeleton width="40%" height={16} style={{ marginTop: spacing[1] }} />
      </View>
    </View>
  );
};

/**
 * PTPTrainerCardSkeleton - Skeleton for trainer cards
 */
export const PTPTrainerCardSkeleton: React.FC<{ style?: ViewStyle }> = ({ style }) => {
  return (
    <View style={[styles.trainerCardSkeleton, style]}>
      <PTPSkeleton width={100} height={120} />
      <View style={styles.trainerSkeletonContent}>
        <PTPSkeleton width="70%" height={20} />
        <PTPSkeleton width="50%" height={14} style={{ marginTop: spacing[2] }} />
        <View style={styles.trainerSkeletonTags}>
          <PTPSkeleton width={60} height={20} />
          <PTPSkeleton width={60} height={20} />
          <PTPSkeleton width={60} height={20} />
        </View>
        <View style={styles.trainerSkeletonFooter}>
          <PTPSkeleton width={80} height={16} />
          <PTPSkeleton width={60} height={20} />
        </View>
      </View>
    </View>
  );
};

/**
 * PTPListSkeleton - Skeleton for list loading state
 */
interface PTPListSkeletonProps {
  count?: number;
  type?: 'card' | 'trainer';
  style?: ViewStyle;
}

export const PTPListSkeleton: React.FC<PTPListSkeletonProps> = ({
  count = 3,
  type = 'card',
  style,
}) => {
  const SkeletonComponent = type === 'trainer' ? PTPTrainerCardSkeleton : PTPCardSkeleton;

  return (
    <View style={style}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonComponent key={index} style={{ marginBottom: spacing[3] }} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.black,
  },
  message: {
    marginTop: spacing[4],
    textAlign: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlayDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayContent: {
    backgroundColor: colors.blackCard,
    padding: spacing[6],
    borderRadius: borderRadius.none,
    borderWidth: 2,
    borderColor: colors.gray200,
    alignItems: 'center',
  },
  skeleton: {
    backgroundColor: colors.gray200,
  },
  cardSkeleton: {
    backgroundColor: colors.blackCard,
    borderRadius: borderRadius.none,
    borderWidth: 2,
    borderColor: colors.gray200,
    overflow: 'hidden',
  },
  cardSkeletonContent: {
    padding: spacing[4],
  },
  trainerCardSkeleton: {
    backgroundColor: colors.blackCard,
    borderRadius: borderRadius.none,
    borderWidth: 2,
    borderColor: colors.gray200,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  trainerSkeletonContent: {
    flex: 1,
    padding: spacing[4],
  },
  trainerSkeletonTags: {
    flexDirection: 'row',
    gap: spacing[2],
    marginTop: spacing[3],
  },
  trainerSkeletonFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing[3],
  },
});

export default PTPLoading;
