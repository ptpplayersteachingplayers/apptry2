/**
 * Onboarding Interest Screen
 *
 * Select main interest during onboarding (final step).
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ImageBackground, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MainInterest } from '../../types';
import { useAuth, useOnboarding } from '../../hooks';
import { PTPText, PTPButton } from '../../components';
import { colors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';
import { featureImages } from '../../assets/media';

const interests: { value: MainInterest; label: string; emoji: string; description: string }[] = [
  {
    value: 'winter-clinics',
    label: 'Winter Clinics',
    emoji: '❄️',
    description: 'Half-day skill-building sessions',
  },
  {
    value: 'summer-camps',
    label: 'Summer Camps',
    emoji: '☀️',
    description: 'Full week immersive experiences',
  },
  {
    value: 'private-training',
    label: 'Private Training',
    emoji: '🎯',
    description: '1-on-1 with NCAA mentors',
  },
  {
    value: 'all',
    label: 'All of the Above',
    emoji: '⚽',
    description: 'Show me everything!',
  },
];

/**
 * OnboardingInterestScreen - Select main interest
 */
const OnboardingInterestScreen: React.FC = () => {
  const navigation = useNavigation();
  const { finishOnboarding, isLoading } = useAuth();
  const { data, setMainInterest, getOnboardingData, resetOnboarding } = useOnboarding();
  const [selectedInterest, setSelectedInterest] = useState<MainInterest | null>(data.mainInterest);

  // Sync local state with context on mount
  useEffect(() => {
    if (data.mainInterest) setSelectedInterest(data.mainInterest);
  }, []);

  const handleFinish = async () => {
    if (!selectedInterest) return;

    // Store interest in context
    setMainInterest(selectedInterest);

    // Get all collected onboarding data
    const onboardingData = getOnboardingData();

    if (!onboardingData) {
      // If somehow data is missing, use the current interest with defaults
      // This shouldn't happen in normal flow
      Alert.alert(
        'Missing Information',
        'Some onboarding data is missing. Please go back and complete all steps.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
      return;
    }

    try {
      // Use actual collected data from all previous screens
      await finishOnboarding({
        state: onboardingData.state,
        city: onboardingData.city,
        ageBand: onboardingData.ageBand,
        skillLevel: onboardingData.skillLevel,
        mainInterest: selectedInterest,
      });

      // Reset onboarding context after successful completion
      resetOnboarding();

      // Navigation handled by AppNavigator after isOnboarded becomes true
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Something went wrong. Please try again.');
    }
  };

  return (
    <ImageBackground
      source={{ uri: featureImages.onboarding3 }}
      style={styles.background}
    >
      <View style={styles.overlay}>
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
          {/* Header */}
          <View style={styles.header}>
            <PTPText variant="caption" color="gray300" style={styles.step}>
              Step 4 of 4
            </PTPText>
            <PTPText variant="heroTitle" color="white" style={styles.title}>
              What are you most interested in?
            </PTPText>
            <PTPText variant="body" color="gray300">
              We'll personalize your experience.
            </PTPText>
          </View>

          {/* Interest Selection */}
          <View style={styles.options}>
            {interests.map((interest) => (
              <TouchableOpacity
                key={interest.value}
                style={[
                  styles.option,
                  selectedInterest === interest.value && styles.optionSelected,
                ]}
                onPress={() => setSelectedInterest(interest.value)}
                accessibilityLabel={`${interest.label} - ${interest.description}`}
                accessibilityState={{ selected: selectedInterest === interest.value }}
              >
                <View style={styles.emojiContainer}>
                  <PTPText style={styles.emoji}>{interest.emoji}</PTPText>
                </View>
                <View style={styles.optionContent}>
                  <PTPText
                    variant="buttonMedium"
                    color={selectedInterest === interest.value ? 'inkBlack' : 'white'}
                  >
                    {interest.label}
                  </PTPText>
                  <PTPText
                    variant="caption"
                    color={selectedInterest === interest.value ? 'gray600' : 'gray400'}
                  >
                    {interest.description}
                  </PTPText>
                </View>
                {selectedInterest === interest.value && (
                  <PTPText style={styles.checkmark}>✓</PTPText>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <PTPButton
              title="Let's Go!"
              variant="primary"
              size="large"
              fullWidth
              disabled={!selectedInterest}
              loading={isLoading}
              onPress={handleFinish}
            />
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <PTPText variant="label" color="gray400">
                Go Back
              </PTPText>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: colors.overlayDark,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing[4],
  },
  header: {
    paddingTop: spacing[6],
    paddingBottom: spacing[6],
  },
  step: {
    marginBottom: spacing[2],
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    marginBottom: spacing[2],
  },
  options: {
    flex: 1,
    gap: spacing[3],
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[4],
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: borderRadius.md,
  },
  optionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  emojiContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[3],
  },
  emoji: {
    fontSize: 24,
  },
  optionContent: {
    flex: 1,
  },
  checkmark: {
    fontSize: 20,
    color: colors.inkBlack,
    marginLeft: spacing[2],
  },
  footer: {
    paddingVertical: spacing[4],
    alignItems: 'center',
  },
  backButton: {
    marginTop: spacing[4],
    padding: spacing[2],
  },
});

export default OnboardingInterestScreen;
