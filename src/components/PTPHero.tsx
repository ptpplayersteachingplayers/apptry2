/**
 * PTPHero Component
 *
 * Hero section with background image, overlay, and content.
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
} from 'react-native';
import { PTPText } from './PTPText';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { LOGO_URL } from '../assets/logo';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface PTPHeroProps {
  /**
   * Background image URL
   */
  imageUrl: string;
  /**
   * Hero title
   */
  title?: string;
  /**
   * Hero subtitle
   */
  subtitle?: string;
  /**
   * Show PTP logo
   */
  showLogo?: boolean;
  /**
   * Height of the hero section
   */
  height?: number;
  /**
   * Custom overlay content
   */
  children?: React.ReactNode;
  /**
   * Custom style
   */
  style?: ViewStyle;
}

/**
 * PTPHero - Hero section with background image
 *
 * @example
 * <PTPHero
 *   imageUrl={featureImages.homeHero}
 *   title="Train with NCAA mentors"
 *   subtitle="No lines. All reps."
 *   showLogo
 * />
 */
export const PTPHero: React.FC<PTPHeroProps> = ({
  imageUrl,
  title,
  subtitle,
  showLogo = false,
  height = 280,
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
        <View style={styles.overlay}>
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
            {children}
          </View>
        </View>
      </ImageBackground>
    </View>
  );
};

/**
 * PTPHeroCard - Hero card with gradient overlay
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
  const Wrapper = onPress ? require('react-native').TouchableOpacity : View;

  return (
    <Wrapper
      onPress={onPress}
      activeOpacity={0.9}
      style={[styles.heroCard, { height }, style]}
    >
      <ImageBackground
        source={{ uri: imageUrl }}
        style={styles.heroCardBackground}
        imageStyle={styles.heroCardImage}
      >
        <View style={styles.heroCardGradient}>
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
        </View>
      </ImageBackground>
    </Wrapper>
  );
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
      height={320}
      style={style}
    />
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
  overlay: {
    flex: 1,
    backgroundColor: colors.overlayDark,
    justifyContent: 'flex-end',
  },
  content: {
    padding: spacing[4],
    paddingBottom: spacing[6],
  },
  logo: {
    width: 120,
    height: 48,
    marginBottom: spacing[4],
  },
  title: {
    marginBottom: spacing[2],
  },
  subtitle: {
    maxWidth: '80%',
  },
  heroCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  heroCardBackground: {
    flex: 1,
  },
  heroCardImage: {
    borderRadius: 16,
  },
  heroCardGradient: {
    flex: 1,
    backgroundColor: colors.overlayDark,
    justifyContent: 'flex-end',
  },
  heroCardContent: {
    padding: spacing[4],
  },
  heroCardSubtitle: {
    marginTop: spacing[1],
  },
});

export default PTPHero;
