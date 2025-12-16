/**
 * Welcome Screen
 *
 * Brand hero screen with login/signup options.
 * First screen users see when opening the app.
 * Updated: Centered, smaller, white buttons
 */

import React from 'react';
import {
  View,
  StyleSheet,
  ImageBackground,
  Image,
  SafeAreaView,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../types/navigation';
import { PTPText } from '../../components';
import { useAuth } from '../../hooks/useAuth';
import { colors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';
import { LOGO_URL } from '../../assets/logo';
import { featureImages } from '../../assets/media';

type WelcomeScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Welcome'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * WelcomeScreen - Brand hero with PTP imagery
 * Clean, minimal design with white centered buttons
 */
const WelcomeScreen: React.FC = () => {
  const navigation = useNavigation<WelcomeScreenNavigationProp>();
  const { continueAsGuest } = useAuth();

  return (
    <ImageBackground
      source={{ uri: featureImages.welcomeHero }}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <SafeAreaView style={styles.container}>
          {/* Logo and tagline */}
          <View style={styles.header}>
            <Image
              source={{ uri: LOGO_URL }}
              style={styles.logo}
              resizeMode="contain"
            />
            <PTPText variant="heroTitle" color="white" style={styles.title}>
              Train with NCAA Mentors
            </PTPText>
            <PTPText variant="heroSubtitle" color="gray300" style={styles.subtitle}>
              No lines. All reps. Real role models.
            </PTPText>
          </View>

          {/* Trust badges */}
          <View style={styles.badges}>
            <View style={styles.badge}>
              <PTPText variant="caption" color="gray300">
                🎓 College-Athlete Coaches
              </PTPText>
            </View>
            <View style={styles.badge}>
              <PTPText variant="caption" color="gray300">
                ✓ Background-Checked
              </PTPText>
            </View>
            <View style={styles.badge}>
              <PTPText variant="caption" color="gray300">
                🛡️ Fully Insured
              </PTPText>
            </View>
          </View>

          {/* Centered white action buttons */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => navigation.navigate('SignUp')}
              activeOpacity={0.9}
            >
              <PTPText variant="buttonMedium" color="inkBlack">
                Get Started
              </PTPText>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => navigation.navigate('Login')}
              activeOpacity={0.8}
            >
              <PTPText variant="buttonSmall" color="white">
                I Already Have an Account
              </PTPText>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.ghostButton}
              onPress={continueAsGuest}
              activeOpacity={0.7}
            >
              <PTPText variant="buttonSmall" color="gray300">
                Browse as Guest
              </PTPText>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </ImageBackground>
  );
};

const BUTTON_WIDTH = SCREEN_WIDTH * 0.7; // 70% of screen width for smaller buttons

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: colors.overlayDark,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing[4],
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  header: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: spacing[12],
  },
  logo: {
    width: 160,
    height: 64,
    marginBottom: spacing[5],
  },
  title: {
    textAlign: 'center',
    marginBottom: spacing[2],
    fontSize: 28,
  },
  subtitle: {
    textAlign: 'center',
    maxWidth: 260,
    fontSize: 16,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing[2],
    marginBottom: spacing[6],
  },
  badge: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: 16,
  },
  actions: {
    alignItems: 'center',
    paddingBottom: spacing[8],
    width: '100%',
  },
  primaryButton: {
    width: BUTTON_WIDTH,
    backgroundColor: colors.white,
    paddingVertical: spacing[4],
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[3],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  secondaryButton: {
    width: BUTTON_WIDTH,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: spacing[3],
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[2],
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  ghostButton: {
    width: BUTTON_WIDTH,
    paddingVertical: spacing[3],
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default WelcomeScreen;
