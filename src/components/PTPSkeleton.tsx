import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, ViewStyle, Animated, Easing } from 'react-native';
import { colors } from '@theme/colors';
import { spacing, borderRadius } from '@theme/spacing';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius: radius = borderRadius.sm,
  style,
}) => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        { width: width as any, height, borderRadius: radius, opacity },
        style,
      ]}
    />
  );
};

// Skeleton for program cards
export const ProgramCardSkeleton: React.FC = () => (
  <View style={styles.programCard}>
    <Skeleton height={160} borderRadius={borderRadius.lg} />
    <View style={styles.programCardContent}>
      <Skeleton width="70%" height={18} style={styles.marginBottom} />
      <Skeleton width="50%" height={14} style={styles.marginBottom} />
      <View style={styles.row}>
        <Skeleton width={60} height={24} borderRadius={borderRadius.full} />
        <Skeleton width={80} height={14} style={styles.marginLeft} />
      </View>
    </View>
  </View>
);

// Skeleton for trainer cards
export const TrainerCardSkeleton: React.FC = () => (
  <View style={styles.trainerCard}>
    <Skeleton width={80} height={80} borderRadius={40} />
    <View style={styles.trainerCardContent}>
      <Skeleton width="60%" height={18} style={styles.marginBottom} />
      <Skeleton width="80%" height={14} style={styles.marginBottom} />
      <View style={styles.row}>
        <Skeleton width={50} height={14} />
        <Skeleton width={70} height={14} style={styles.marginLeft} />
      </View>
    </View>
  </View>
);

// Skeleton for session cards
export const SessionCardSkeleton: React.FC = () => (
  <View style={styles.sessionCard}>
    <View style={styles.row}>
      <Skeleton width={50} height={50} borderRadius={25} />
      <View style={styles.sessionCardContent}>
        <Skeleton width="50%" height={16} style={styles.marginBottom} />
        <Skeleton width="70%" height={14} />
      </View>
    </View>
    <View style={[styles.row, styles.marginTopMd]}>
      <Skeleton width={100} height={14} />
      <Skeleton width={80} height={14} />
    </View>
  </View>
);

// Skeleton for message list items
export const MessageItemSkeleton: React.FC = () => (
  <View style={styles.messageItem}>
    <Skeleton width={56} height={56} borderRadius={28} />
    <View style={styles.messageContent}>
      <Skeleton width="40%" height={16} style={styles.marginBottom} />
      <Skeleton width="80%" height={14} />
    </View>
  </View>
);

// Skeleton for list screens
interface ListSkeletonProps {
  count?: number;
  type?: 'program' | 'trainer' | 'session' | 'message';
}

export const ListSkeleton: React.FC<ListSkeletonProps> = ({
  count = 3,
  type = 'program',
}) => {
  const SkeletonComponent = {
    program: ProgramCardSkeleton,
    trainer: TrainerCardSkeleton,
    session: SessionCardSkeleton,
    message: MessageItemSkeleton,
  }[type];

  return (
    <View style={styles.listContainer}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonComponent key={index} />
      ))}
    </View>
  );
};

// Skeleton for home screen
export const HomeScreenSkeleton: React.FC = () => (
  <View style={styles.container}>
    {/* Hero skeleton */}
    <Skeleton height={280} borderRadius={0} />

    {/* Quick actions */}
    <View style={styles.section}>
      <Skeleton width={150} height={22} style={styles.marginBottom} />
      <View style={styles.quickActions}>
        <Skeleton width={100} height={100} borderRadius={borderRadius.lg} />
        <Skeleton width={100} height={100} borderRadius={borderRadius.lg} />
        <Skeleton width={100} height={100} borderRadius={borderRadius.lg} />
      </View>
    </View>

    {/* Featured programs */}
    <View style={styles.section}>
      <Skeleton width={180} height={22} style={styles.marginBottom} />
      <ProgramCardSkeleton />
    </View>
  </View>
);

// Skeleton for detail screens
export const DetailScreenSkeleton: React.FC = () => (
  <View style={styles.container}>
    <Skeleton height={300} borderRadius={0} />
    <View style={styles.detailContent}>
      <Skeleton width="80%" height={28} style={styles.marginBottom} />
      <Skeleton width="60%" height={18} style={styles.marginBottom} />
      <View style={[styles.row, styles.marginBottom]}>
        <Skeleton width={80} height={28} borderRadius={borderRadius.full} />
        <Skeleton width={100} height={18} style={styles.marginLeft} />
      </View>
      <Skeleton width="100%" height={100} style={styles.marginBottom} />
      <Skeleton width="100%" height={60} style={styles.marginBottom} />
      <Skeleton width="100%" height={48} borderRadius={borderRadius.lg} />
    </View>
  </View>
);

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: colors.gray200,
  },
  container: {
    flex: 1,
    backgroundColor: colors.offWhite,
  },
  section: {
    padding: spacing[6],
  },
  programCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    marginBottom: spacing[4],
    overflow: 'hidden',
  },
  programCardContent: {
    padding: spacing[4],
  },
  trainerCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    marginBottom: spacing[4],
  },
  trainerCardContent: {
    flex: 1,
    marginLeft: spacing[4],
  },
  sessionCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    marginBottom: spacing[4],
  },
  sessionCardContent: {
    flex: 1,
    marginLeft: spacing[4],
  },
  messageItem: {
    flexDirection: 'row',
    padding: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  messageContent: {
    flex: 1,
    marginLeft: spacing[4],
    justifyContent: 'center',
  },
  listContainer: {
    padding: spacing[6],
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailContent: {
    padding: spacing[6],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  marginBottom: {
    marginBottom: spacing[2],
  },
  marginTopMd: {
    marginTop: spacing[4],
  },
  marginLeft: {
    marginLeft: spacing[2],
  },
});

export default Skeleton;
