/**
 * PTPHero Component
 *
 * Bold hero section with background image, dark overlay, and Oswald typography.
 * Used for screen headers and featured sections.
 */

import React from 'react';
import {
  View,
  ImageBackground,
  StyleSheet,
  Dimensions,
  ViewStyle,
  Image,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PTPText } from './PTPText';
import { PTPButton } from './PTPButton';
import { colors } from '../theme/colors';
import { spacing, borderRadius } from '../theme/spacing';
import { LOGO_URL } from '../assets/logo';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface PTPHeroProps {
  imageUrl: string;
  title?: string;
  subtitle?: string;
  showLogo?: boolean;
  height?: number;
  actionText?: string;
  onAction?: () => void;
  children?: React.ReactNode;
  style?: ViewStyle;
}

/**
 * PTPHero - Bold hero section with gradient overlay
 */
export const PTPHero: React.FC<PTPHeroProps> = ({
  imageUrl,
  title,
  subtitle,
  showLogo = false,
  height = 320,
  actionText,
  onAction,
  children,
  style,
}) => {
  return (
    <View style={[styles.container, { height }, style]}>
      <ImageBackground
        source={{ uri: imageUrl }}
        style={styles.background}
        resizeMode="cover"
      >
        <LinearGradient
          colors={['transparent', 'rgba(10, 10, 10, 0.6)', 'rgba(10, 10, 10, 0.95)']}
          locations={[0, 0.5, 1]}
          style={styles.gradient}
        >
          <View style={styles.content}>
            {showLogo && (
              <Image
                source={{ uri: LOGO_URL }}
                style={styles.logo}
                resizeMode="contain"
              />
            )}
            {title && (
              <PTPText variant="heroTitle" color="white" style={styles.title}>
                {title}
              </PTPText>
            )}
            {subtitle && (
              <PTPText variant="heroSubtitle" color="gray300" style={styles.subtitle}>
                {subtitle}
              </PTPText>
            )}
            {actionText && onAction && (
              <PTPButton
                title={actionText}
                onPress={onAction}
                style={styles.actionButton}
              />
            )}
            {children}
          </View>
        </LinearGradient>
      </ImageBackground>
    </View>
  );
};

/**
 * PTPHeroCard - Sharp-edged hero card with gradient overlay
 */
interface PTPHeroCardProps {
  imageUrl: string;
  title: string;
  subtitle?: string;
  height?: number;
  onPress?: () => void;
  style?: ViewStyle;
}

export const PTPHeroCard: React.FC<PTPHeroCardProps> = ({
  imageUrl,
  title,
  subtitle,
  height = 200,
  onPress,
  style,
}) => {
  const content = (
    <ImageBackground
      source={{ uri: imageUrl }}
      style={[styles.heroCardBackground, { height }]}
      imageStyle={styles.heroCardImage}
    >
      <LinearGradient
        colors={['transparent', 'rgba(10, 10, 10, 0.9)']}
        locations={[0.3, 1]}
        style={styles.heroCardGradient}
      >
        <View style={styles.heroCardContent}>
          <PTPText variant="cardTitle" color="white" numberOfLines={2}>
            {title}
          </PTPText>
          {subtitle && (
            <PTPText
              variant="cardSubtitle"
              color="gray300"
              numberOfLines={1}
              style={styles.heroCardSubtitle}
            >
              {subtitle}
            </PTPText>
          )}
        </View>
      </LinearGradient>
    </ImageBackground>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={[styles.heroCard, style]}>
        {content}
      </Pressable>
    );
  }

  return <View style={[styles.heroCard, style]}>{content}</View>;
};

/**
 * PTPScreenHero - Full-width hero for screen headers
 */
interface PTPScreenHeroProps {
  imageUrl: string;
  title: string;
  subtitle?: string;
  style?: ViewStyle;
}

export const PTPScreenHero: React.FC<PTPScreenHeroProps> = ({
  imageUrl,
  title,
  subtitle,
  style,
}) => {
  return (
    <PTPHero
      imageUrl={imageUrl}
      title={title}
      subtitle={subtitle}
      showLogo
      height={360}
      style={style}
    />
  );
};

/**
 * PTPStatHero - Hero with stats display
 */
interface PTPStatHeroProps {
  imageUrl: string;
  stats: { value: string; label: string }[];
  style?: ViewStyle;
}

export const PTPStatHero: React.FC<PTPStatHeroProps> = ({
  imageUrl,
  stats,
  style,
}) => {
  return (
    <View style={[styles.container, { height: 280 }, style]}>
      <ImageBackground
        source={{ uri: imageUrl }}
        style={styles.background}
        resizeMode="cover"
      >
        <LinearGradient
          colors={['transparent', 'rgba(10, 10, 10, 0.95)']}
          locations={[0.3, 1]}
          style={styles.gradient}
        >
          <View style={styles.statsContainer}>
            {stats.map((stat, index) => (
              <View key={index} style={styles.stat}>
                <PTPText variant="statNumber" color="primary">
                  {stat.value}
                </PTPText>
                <PTPText variant="statLabel" color="gray300">
                  {stat.label}
                </PTPText>
              </View>
            ))}
          </View>
        </LinearGradient>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    overflow: 'hidden',
  },
  background: {
    flex: 1,
    width: '100%',
  },
  gradient: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  content: {
    padding: spacing[4],
    paddingBottom: spacing[8],
  },
  logo: {
    width: 140,
    height: 56,
    marginBottom: spacing[4],
  },
  title: {
    marginBottom: spacing[2],
  },
  subtitle: {
    maxWidth: '85%',
  },
  actionButton: {
    marginTop: spacing[6],
    alignSelf: 'flex-start',
  },
  // Hero Card styles
  heroCard: {
    borderRadius: borderRadius.none,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.gray200,
  },
  heroCardBackground: {
    flex: 1,
  },
  heroCardImage: {
    borderRadius: borderRadius.none,
  },
  heroCardGradient: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  heroCardContent: {
    padding: spacing[4],
  },
  heroCardSubtitle: {
    marginTop: spacing[1],
  },
  // Stats
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: spacing[6],
    paddingBottom: spacing[8],
  },
  stat: {
    alignItems: 'center',
  },
});

export default PTPHero;
