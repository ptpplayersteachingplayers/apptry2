/**
 * Onboarding Age Screen
 *
 * Select player age band during onboarding.
 */

import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../types/navigation';
import { AgeBand } from '../../types';
import { PTPText, PTPButton } from '../../components';
import { colors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';
import { featureImages } from '../../assets/media';

type OnboardingAgeNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  'OnboardingAge'
>;

const ageBands: { value: AgeBand; label: string; description: string }[] = [
  { value: '6-8', label: 'Ages 6-8', description: 'Little Kickers' },
  { value: '9-11', label: 'Ages 9-11', description: 'Rising Players' },
  { value: '12-14', label: 'Ages 12-14', description: 'Competitive Players' },
  { value: '15-17', label: 'Ages 15-17', description: 'High School Athletes' },
  { value: '18+', label: 'Ages 18+', description: 'Adult Players' },
];

/**
 * OnboardingAgeScreen - Select player age band
 */
const OnboardingAgeScreen: React.FC = () => {
  const navigation = useNavigation<OnboardingAgeNavigationProp>();
  const [selectedAge, setSelectedAge] = useState<AgeBand | null>(null);

  const handleContinue = () => {
    if (selectedAge) {
      navigation.navigate('OnboardingSkill');
    }
  };

  return (
    <ImageBackground
      source={{ uri: featureImages.onboarding2 }}
      style={styles.background}
    >
      <View style={styles.overlay}>
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
          {/* Header */}
          <View style={styles.header}>
            <PTPText variant="caption" color="gray300" style={styles.step}>
              Step 2 of 4
            </PTPText>
            <PTPText variant="heroTitle" color="white" style={styles.title}>
              How old is your player?
            </PTPText>
            <PTPText variant="body" color="gray300">
              We'll recommend age-appropriate programs.
            </PTPText>
          </View>

          {/* Age Selection */}
          <View style={styles.options}>
            {ageBands.map((age) => (
              <TouchableOpacity
                key={age.value}
                style={[
                  styles.option,
                  selectedAge === age.value && styles.optionSelected,
                ]}
                onPress={() => setSelectedAge(age.value)}
                accessibilityLabel={`${age.label} - ${age.description}`}
                accessibilityState={{ selected: selectedAge === age.value }}
              >
                <View style={styles.optionContent}>
                  <PTPText
                    variant="buttonLarge"
                    color={selectedAge === age.value ? 'inkBlack' : 'white'}
                  >
                    {age.label}
                  </PTPText>
                  <PTPText
                    variant="caption"
                    color={selectedAge === age.value ? 'gray600' : 'gray400'}
                  >
                    {age.description}
                  </PTPText>
                </View>
                {selectedAge === age.value && (
                  <PTPText style={styles.checkmark}>✓</PTPText>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <PTPButton
              title="Continue"
              variant="primary"
              size="large"
              fullWidth
              disabled={!selectedAge}
              onPress={handleContinue}
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
    justifyContent: 'space-between',
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

export default OnboardingAgeScreen;
