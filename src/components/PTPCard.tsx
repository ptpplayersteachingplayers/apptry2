/**
 * PTPCard Component
 *
 * Branded card component for displaying content with optional image.
 * Used for program cards, trainer cards, and event cards.
 */

import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Image,
  ImageBackground,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PTPText } from './PTPText';
import { PTPTag } from './PTPTag';
import { colors } from '../theme/colors';
import { spacing, borderRadius, shadows } from '../theme/spacing';

interface PTPCardProps {
  /**
   * Card title
   */
  title: string;
  /**
   * Card subtitle
   */
  subtitle?: string;
  /**
   * Image URL for card header
   */
  imageUrl?: string;
  /**
   * Use image as full background
   */
  imageBackground?: boolean;
  /**
   * Card footer content
   */
  footer?: React.ReactNode;
  /**
   * Tags to display
   */
  tags?: { label: string; variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' }[];
  /**
   * Right side content (e.g., price)
   */
  rightContent?: React.ReactNode;
  /**
   * Press handler
   */
  onPress?: () => void;
  /**
   * Custom style
   */
  style?: ViewStyle;
  /**
   * Children content
   */
  children?: React.ReactNode;
}

/**
 * PTPCard - Branded card component
 *
 * @example
 * <PTPCard
 *   title="Winter Skills Intensive"
 *   subtitle="Dec 28 • 9:00 AM – 12:00 PM"
 *   imageUrl={heroImage}
 *   tags={[{ label: 'Almost Full', variant: 'warning' }]}
 *   onPress={() => navigate('ProgramDetail', { programId: 1 })}
 * />
 */
export const PTPCard: React.FC<PTPCardProps> = ({
  title,
  subtitle,
  imageUrl,
  imageBackground = false,
  footer,
  tags,
  rightContent,
  onPress,
  style,
  children,
}) => {
  const Wrapper = onPress ? TouchableOpacity : View;

  if (imageBackground && imageUrl) {
    return (
      <Wrapper
        onPress={onPress}
        activeOpacity={0.9}
        style={[styles.card, style]}
        accessibilityRole={onPress ? 'button' : undefined}
        accessibilityLabel={title}
      >
        <ImageBackground
          source={{ uri: imageUrl }}
          style={styles.backgroundImage}
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
                <PTPText variant="cardTitle" color="white" numberOfLines={2}>
                  {title}
                </PTPText>
                {subtitle && (
                  <PTPText variant="cardSubtitle" color="gray300" numberOfLines={1} style={styles.subtitle}>
                    {subtitle}
                  </PTPText>
                )}
              </View>
              {rightContent && <View style={styles.rightContent}>{rightContent}</View>}
            </View>
          </View>
        </ImageBackground>
      </Wrapper>
    );
  }

  return (
    <Wrapper
      onPress={onPress}
      activeOpacity={0.9}
      style={[styles.card, styles.cardWithShadow, style]}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={title}
    >
      {imageUrl && (
        <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
      )}
      <View style={styles.content}>
        {tags && tags.length > 0 && (
          <View style={styles.tagsRow}>
            {tags.map((tag, index) => (
              <PTPTag key={index} label={tag.label} variant={tag.variant} size="small" />
            ))}
          </View>
        )}
        <View style={styles.header}>
          <View style={styles.textContent}>
            <PTPText variant="cardTitle" numberOfLines={2}>
              {title}
            </PTPText>
            {subtitle && (
              <PTPText variant="cardSubtitle" color="gray500" numberOfLines={2} style={styles.subtitle}>
                {subtitle}
              </PTPText>
            )}
          </View>
          {rightContent && <View style={styles.rightContent}>{rightContent}</View>}
        </View>
        {children}
        {footer && <View style={styles.footer}>{footer}</View>}
      </View>
    </Wrapper>
  );
};

/**
 * PTPProgramCard - Card specifically for camps/clinics
 */
interface PTPProgramCardProps {
  title: string;
  date: string;
  time: string;
  location: string;
  price: number;
  imageUrl: string;
  almostFull?: boolean;
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
  almostFull,
  bestseller,
  onPress,
  style,
}) => {
  const tags = [];
  if (bestseller) tags.push({ label: 'Bestseller', variant: 'primary' as const });
  if (almostFull) tags.push({ label: 'Almost Full', variant: 'warning' as const });

  return (
    <PTPCard
      title={title}
      subtitle={`${date} • ${time}\n${location}`}
      imageUrl={imageUrl}
      tags={tags}
      rightContent={
        <View style={styles.priceContainer}>
          <PTPText variant="cardTitle" color="primary">
            ${price}
          </PTPText>
        </View>
      }
      onPress={onPress}
      style={style}
    />
  );
};

/**
 * PTPTrainerCard - Card specifically for trainers
 */
interface PTPTrainerCardProps {
  name: string;
  collegePro: string;
  specialties: string[];
  hourlyRate: number;
  rating?: number;
  headshotUrl?: string;
  onPress?: () => void;
  style?: ViewStyle;
}

export const PTPTrainerCard: React.FC<PTPTrainerCardProps> = ({
  name,
  collegePro,
  specialties,
  hourlyRate,
  rating,
  headshotUrl,
  onPress,
  style,
}) => {
  const tagline = `${collegePro} • ${specialties.slice(0, 2).join(', ')}`;

  return (
    <PTPCard
      title={name}
      subtitle={tagline}
      imageUrl={headshotUrl}
      rightContent={
        <View style={styles.trainerRight}>
          <PTPText variant="cardTitle" color="primary">
            ${hourlyRate}/hr
          </PTPText>
          {rating && (
            <View style={styles.trainerRating}>
              <Ionicons name="star" size={12} color={colors.primary} />
              <PTPText variant="caption" color="gray500">
                {rating.toFixed(1)}
              </PTPText>
            </View>
          )}
        </View>
      }
      onPress={onPress}
      style={style}
    />
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  cardWithShadow: {
    ...shadows.md,
  },
  image: {
    width: '100%',
    height: 160,
    backgroundColor: colors.gray100,
  },
  backgroundImage: {
    height: 200,
    justifyContent: 'flex-end',
  },
  backgroundImageStyle: {
    borderRadius: borderRadius.lg,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlayDark,
    borderRadius: borderRadius.lg,
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
    borderTopColor: colors.gray100,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  trainerRight: {
    alignItems: 'flex-end',
  },
  trainerRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
});

export default PTPCard;
