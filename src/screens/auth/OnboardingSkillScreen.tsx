/**
 * Onboarding Skill Screen
 *
 * Select player skill level during onboarding.
 */

import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../types/navigation';
import { SkillLevel } from '../../types';
import { PTPText, PTPButton } from '../../components';
import { colors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';
import { featureImages } from '../../assets/media';

type OnboardingSkillNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  'OnboardingSkill'
>;

const skillLevels: { value: SkillLevel; label: string; description: string }[] = [
  {
    value: 'rec',
    label: 'Recreational',
    description: 'Just starting out or playing for fun',
  },
  {
    value: 'travel',
    label: 'Travel / Club',
    description: 'Playing competitively on a travel team',
  },
  {
    value: 'elite',
    label: 'Elite / Academy',
    description: 'High-level competitive play, aiming for college or beyond',
  },
];

/**
 * OnboardingSkillScreen - Select player skill level
 */
const OnboardingSkillScreen: React.FC = () => {
  const navigation = useNavigation<OnboardingSkillNavigationProp>();
  const [selectedSkill, setSelectedSkill] = useState<SkillLevel | null>(null);

  const handleContinue = () => {
    if (selectedSkill) {
      navigation.navigate('OnboardingInterest');
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
              Step 3 of 4
            </PTPText>
            <PTPText variant="heroTitle" color="white" style={styles.title}>
              What's their skill level?
            </PTPText>
            <PTPText variant="body" color="gray300">
              This helps us match them with the right programs.
            </PTPText>
          </View>

          {/* Skill Selection */}
          <View style={styles.options}>
            {skillLevels.map((skill) => (
              <TouchableOpacity
                key={skill.value}
                style={[
                  styles.option,
                  selectedSkill === skill.value && styles.optionSelected,
                ]}
                onPress={() => setSelectedSkill(skill.value)}
                accessibilityLabel={`${skill.label} - ${skill.description}`}
                accessibilityState={{ selected: selectedSkill === skill.value }}
              >
                <View style={styles.optionContent}>
                  <PTPText
                    variant="buttonLarge"
                    color={selectedSkill === skill.value ? 'inkBlack' : 'white'}
                  >
                    {skill.label}
                  </PTPText>
                  <PTPText
                    variant="bodySmall"
                    color={selectedSkill === skill.value ? 'gray600' : 'gray400'}
                    style={styles.optionDescription}
                  >
                    {skill.description}
                  </PTPText>
                </View>
                {selectedSkill === skill.value && (
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
              disabled={!selectedSkill}
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
  optionDescription: {
    marginTop: spacing[1],
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

export default OnboardingSkillScreen;
