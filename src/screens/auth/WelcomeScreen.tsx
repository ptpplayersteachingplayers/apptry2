/**
 * Welcome Screen
 *
 * Brand hero screen with login/signup options.
 * First screen users see when opening the app.
 */

import React from 'react';
import {
  View,
  StyleSheet,
  ImageBackground,
  Image,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { AuthStackParamList } from '../../types/navigation';
import { PTPText, PTPButton } from '../../components';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { LOGO_URL } from '../../assets/logo';
import { featureImages } from '../../assets/media';

type WelcomeScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Welcome'>;

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * WelcomeScreen - Brand hero with PTP imagery
 */
const WelcomeScreen: React.FC = () => {
  const navigation = useNavigation<WelcomeScreenNavigationProp>();

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
              <Ionicons name="school" size={14} color={colors.gray300} style={styles.badgeIcon} />
              <PTPText variant="caption" color="gray300">
                College-Athlete Coaches
              </PTPText>
            </View>
            <View style={styles.badge}>
              <Ionicons name="checkmark-circle" size={14} color={colors.gray300} style={styles.badgeIcon} />
              <PTPText variant="caption" color="gray300">
                Background-Checked
              </PTPText>
            </View>
            <View style={styles.badge}>
              <Ionicons name="shield-checkmark" size={14} color={colors.gray300} style={styles.badgeIcon} />
              <PTPText variant="caption" color="gray300">
                Fully Insured
              </PTPText>
            </View>
          </View>

          {/* Action buttons */}
          <View style={styles.actions}>
            <PTPButton
              title="Get Started"
              variant="primary"
              size="large"
              fullWidth
              onPress={() => navigation.navigate('SignUp')}
              accessibilityLabel="Get started with PTP Soccer"
            />
            <PTPButton
              title="I Already Have an Account"
              variant="ghost"
              size="medium"
              fullWidth
              onPress={() => navigation.navigate('Login')}
              accessibilityLabel="Log in to your account"
              style={styles.loginButton}
            />
          </View>
        </SafeAreaView>
      </View>
    </ImageBackground>
  );
};

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
  },
  header: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: SCREEN_HEIGHT * 0.1,
  },
  logo: {
    width: 180,
    height: 72,
    marginBottom: spacing[6],
  },
  title: {
    textAlign: 'center',
    marginBottom: spacing[3],
  },
  subtitle: {
    textAlign: 'center',
    maxWidth: 280,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing[3],
    marginBottom: spacing[8],
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: 20,
  },
  badgeIcon: {
    marginRight: spacing[1],
  },
  actions: {
    paddingBottom: spacing[6],
  },
  loginButton: {
    marginTop: spacing[3],
  },
});

export default WelcomeScreen;
