/**
 * PTPCard Component
 *
 * Sharp-edged card with 2px borders and gold hover states.
 * Dark theme with elevated surfaces.
 */

import React, { useRef } from 'react';
import {
  View,
  Pressable,
  StyleSheet,
  Image,
  ImageBackground,
  ViewStyle,
  Animated,
} from 'react-native';
import { PTPText } from './PTPText';
import { PTPTag } from './PTPTag';
import { colors, semanticColors } from '../theme/colors';
import { spacing, borderRadius, borderWidth, shadows } from '../theme/spacing';

interface PTPCardProps {
  title?: string;
  subtitle?: string;
  imageUrl?: string;
  imageBackground?: boolean;
  imageHeight?: number;
  footer?: React.ReactNode;
  tags?: { label: string; variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' }[];
  rightContent?: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  children?: React.ReactNode;
  elevated?: boolean;
}

/**
 * PTPCard - Sharp-edged card with dark theme
 */
export const PTPCard: React.FC<PTPCardProps> = ({
  title,
  subtitle,
  imageUrl,
  imageBackground = false,
  imageHeight = 200,
  footer,
  tags,
  rightContent,
  onPress,
  style,
  children,
  elevated = false,
}) => {
  const scale = useRef(new Animated.Value(1)).current;
  const borderColor = useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 0.98,
        useNativeDriver: true,
        tension: 100,
        friction: 10,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 10,
      }),
    ]).start();
  };

  const cardStyle = [
    styles.card,
    elevated && styles.elevated,
    style,
  ];

  if (imageBackground && imageUrl) {
    return (
      <Pressable
        onPress={onPress}
        onPressIn={onPress ? handlePressIn : undefined}
        onPressOut={onPress ? handlePressOut : undefined}
        disabled={!onPress}
        accessibilityRole={onPress ? 'button' : undefined}
        accessibilityLabel={title}
      >
        <Animated.View style={[cardStyle, { transform: [{ scale }] }]}>
          <ImageBackground
            source={{ uri: imageUrl }}
            style={[styles.backgroundImage, { height: imageHeight }]}
            imageStyle={styles.backgroundImageStyle}
          >
            <View style={styles.overlay}>
              <View style={styles.backgroundContent}>
                {tags && tags.length > 0 && (
                  <View style={styles.tagsRow}>
                    {tags.map((tag, index) => (
                      <PTPTag key={index} label={tag.label} variant={tag.variant} size="small" />
                    ))}
                  </View>
                )}
                <View style={styles.textContent}>
                  {title && (
                    <PTPText variant="cardTitle" color="white" numberOfLines={2}>
                      {title}
                    </PTPText>
                  )}
                  {subtitle && (
                    <PTPText variant="cardSubtitle" color="gray300" numberOfLines={2} style={styles.subtitle}>
                      {subtitle}
                    </PTPText>
                  )}
                </View>
                {rightContent && <View style={styles.rightContent}>{rightContent}</View>}
              </View>
            </View>
          </ImageBackground>
        </Animated.View>
      </Pressable>
    );
  }

  const content = (
    <Animated.View style={[cardStyle, { transform: [{ scale }] }]}>
      {imageUrl && (
        <Image
          source={{ uri: imageUrl }}
          style={[styles.image, { height: imageHeight }]}
          resizeMode="cover"
        />
      )}
      <View style={styles.content}>
        {tags && tags.length > 0 && (
          <View style={styles.tagsRow}>
            {tags.map((tag, index) => (
              <PTPTag key={index} label={tag.label} variant={tag.variant} size="small" />
            ))}
          </View>
        )}
        {(title || rightContent) && (
          <View style={styles.header}>
            <View style={styles.textContent}>
              {title && (
                <PTPText variant="cardTitle" color="inkBlack" numberOfLines={2}>
                  {title}
                </PTPText>
              )}
              {subtitle && (
                <PTPText variant="cardSubtitle" color="gray600" numberOfLines={2} style={styles.subtitle}>
                  {subtitle}
                </PTPText>
              )}
            </View>
            {rightContent && <View style={styles.rightContent}>{rightContent}</View>}
          </View>
        )}
        {children}
        {footer && <View style={styles.footer}>{footer}</View>}
      </View>
    </Animated.View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityRole="button"
        accessibilityLabel={title}
      >
        {content}
      </Pressable>
    );
  }

  return content;
};

/**
 * PTPSimpleCard - Basic card container without header
 */
interface PTPSimpleCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  elevated?: boolean;
}

export const PTPSimpleCard: React.FC<PTPSimpleCardProps> = ({
  children,
  onPress,
  style,
  elevated = false,
}) => {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const cardStyle = [
    styles.simpleCard,
    elevated && styles.elevated,
    style,
  ];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <Animated.View style={[cardStyle, { transform: [{ scale }] }]}>
          {children}
        </Animated.View>
      </Pressable>
    );
  }

  return <View style={cardStyle}>{children}</View>;
};

/**
 * PTPTrainerCard - Card specifically for trainers
 */
interface PTPTrainerCardProps {
  name: string;
  team: string;
  position: string;
  specialties: string[];
  hourlyRate: number;
  rating?: number;
  totalSessions?: number;
  imageUrl?: string;
  verified?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}

export const PTPTrainerCard: React.FC<PTPTrainerCardProps> = ({
  name,
  team,
  position,
  specialties,
  hourlyRate,
  rating,
  totalSessions,
  imageUrl,
  verified = false,
  onPress,
  style,
}) => {
  return (
    <PTPCard
      onPress={onPress}
      style={style}
    >
      <View style={styles.trainerContent}>
        {imageUrl && (
          <Image
            source={{ uri: imageUrl }}
            style={styles.trainerImage}
            resizeMode="cover"
          />
        )}
        <View style={styles.trainerInfo}>
          <View style={styles.trainerHeader}>
            <PTPText variant="cardTitle">{name}</PTPText>
            {verified && <PTPTag label="VERIFIED" variant="success" size="small" />}
          </View>
          <PTPText variant="bodySmall" color="gray300">
            {position} • {team}
          </PTPText>
          <View style={styles.trainerSpecialties}>
            {specialties.slice(0, 3).map((specialty, index) => (
              <PTPTag key={index} label={specialty} size="small" />
            ))}
          </View>
          <View style={styles.trainerFooter}>
            <View style={styles.trainerStats}>
              {rating && (
                <PTPText variant="bodySmall" color="primary">
                  ★ {rating.toFixed(1)}
                </PTPText>
              )}
              {totalSessions && (
                <PTPText variant="bodySmall" color="gray500">
                  {totalSessions} sessions
                </PTPText>
              )}
            </View>
            <PTPText variant="priceSmall" color="primary">
              ${hourlyRate}/hr
            </PTPText>
          </View>
        </View>
      </View>
    </PTPCard>
  );
};

/**
 * PTPProgramCard - Card for camps/clinics
 */
interface PTPProgramCardProps {
  title: string;
  date: string;
  time: string;
  location: string;
  price: number;
  imageUrl: string;
  spotsLeft?: number;
  almostFull?: boolean;
  soldOut?: boolean;
  bestseller?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}

export const PTPProgramCard: React.FC<PTPProgramCardProps> = ({
  title,
  date,
  time,
  location,
  price,
  imageUrl,
  spotsLeft,
  almostFull,
  soldOut,
  bestseller,
  onPress,
  style,
}) => {
  const tags = [];
  if (bestseller) tags.push({ label: 'BESTSELLER', variant: 'primary' as const });
  if (soldOut) tags.push({ label: 'SOLD OUT', variant: 'danger' as const });
  else if (almostFull) tags.push({ label: 'ALMOST FULL', variant: 'warning' as const });

  return (
    <PTPCard
      title={title}
      subtitle={`${date} • ${time}\n${location}`}
      imageUrl={imageUrl}
      imageBackground
      tags={tags}
      rightContent={
        !soldOut && (
          <View style={styles.priceContainer}>
            <PTPText variant="price" color="primary">
              ${price}
            </PTPText>
            {spotsLeft && spotsLeft < 10 && (
              <PTPText variant="caption" color="warning">
                {spotsLeft} spots left
              </PTPText>
            )}
          </View>
        )
      }
      onPress={onPress}
      style={style}
    />
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.blackCard,
    borderRadius: borderRadius.none,
    borderWidth: borderWidth.base,
    borderColor: colors.gray200,
    overflow: 'hidden',
  },
  simpleCard: {
    backgroundColor: colors.blackCard,
    borderRadius: borderRadius.none,
    borderWidth: borderWidth.base,
    borderColor: colors.gray200,
    padding: spacing[6],
  },
  elevated: {
    ...shadows.md,
  },
  image: {
    width: '100%',
    backgroundColor: colors.blackLight,
  },
  backgroundImage: {
    justifyContent: 'flex-end',
  },
  backgroundImageStyle: {
    borderRadius: borderRadius.none,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlayDark,
    justifyContent: 'flex-end',
  },
  backgroundContent: {
    padding: spacing[4],
  },
  content: {
    padding: spacing[4],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  textContent: {
    flex: 1,
    marginRight: spacing[2],
  },
  subtitle: {
    marginTop: spacing[1],
  },
  rightContent: {
    alignItems: 'flex-end',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing[2],
    gap: spacing[1],
  },
  footer: {
    marginTop: spacing[3],
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  // Trainer Card Styles
  trainerContent: {
    flexDirection: 'row',
  },
  trainerImage: {
    width: 100,
    height: 120,
    backgroundColor: colors.blackLight,
  },
  trainerInfo: {
    flex: 1,
    padding: spacing[4],
  },
  trainerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[1],
  },
  trainerSpecialties: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[1],
    marginTop: spacing[2],
  },
  trainerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing[3],
  },
  trainerStats: {
    flexDirection: 'row',
    gap: spacing[3],
  },
});

export default PTPCard;
