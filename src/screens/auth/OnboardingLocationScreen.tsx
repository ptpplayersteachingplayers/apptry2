/**
 * Onboarding Location Screen
 *
 * Select state and city during onboarding.
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../types/navigation';
import { USState } from '../../types';
import { PTPText, PTPButton } from '../../components';
import { colors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';
import { featureImages } from '../../assets/media';

type OnboardingLocationNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  'OnboardingLocation'
>;

const states: { value: USState; label: string }[] = [
  { value: 'PA', label: 'Pennsylvania' },
  { value: 'NJ', label: 'New Jersey' },
  { value: 'DE', label: 'Delaware' },
  { value: 'MD', label: 'Maryland' },
  { value: 'NY', label: 'New York' },
  { value: 'CT', label: 'Connecticut' },
];

const citiesByState: { [key in USState]: string[] } = {
  PA: ['Main Line', 'West Chester', 'King of Prussia', 'Philadelphia', 'Doylestown'],
  NJ: ['Short Hills', 'Princeton', 'Morristown', 'Cherry Hill'],
  DE: ['Wilmington', 'Newark'],
  MD: ['Baltimore', 'Bethesda'],
  NY: ['New York City', 'Westchester'],
  CT: ['Greenwich', 'Stamford'],
};

/**
 * OnboardingLocationScreen - Select location preference
 */
const OnboardingLocationScreen: React.FC = () => {
  const navigation = useNavigation<OnboardingLocationNavigationProp>();
  const [selectedState, setSelectedState] = useState<USState | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);

  const handleContinue = () => {
    if (selectedState && selectedCity) {
      // Store in temp state and pass to next screen
      // In real app, use context or route params
      navigation.navigate('OnboardingAge');
    }
  };

  const cities = selectedState ? citiesByState[selectedState] : [];

  return (
    <ImageBackground
      source={{ uri: featureImages.onboarding1 }}
      style={styles.background}
    >
      <View style={styles.overlay}>
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
          {/* Header */}
          <View style={styles.header}>
            <PTPText variant="caption" color="gray300" style={styles.step}>
              Step 1 of 4
            </PTPText>
            <PTPText variant="heroTitle" color="white" style={styles.title}>
              Where are you located?
            </PTPText>
            <PTPText variant="body" color="gray300">
              We'll show you camps and clinics near you.
            </PTPText>
          </View>

          {/* Selection */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* State Selection */}
            <PTPText variant="label" color="white" style={styles.sectionLabel}>
              Select your state
            </PTPText>
            <View style={styles.optionsGrid}>
              {states.map((state) => (
                <TouchableOpacity
                  key={state.value}
                  style={[
                    styles.option,
                    selectedState === state.value && styles.optionSelected,
                  ]}
                  onPress={() => {
                    setSelectedState(state.value);
                    setSelectedCity(null);
                  }}
                  accessibilityLabel={state.label}
                  accessibilityState={{ selected: selectedState === state.value }}
                >
                  <PTPText
                    variant="buttonMedium"
                    color={selectedState === state.value ? 'inkBlack' : 'white'}
                  >
                    {state.value}
                  </PTPText>
                </TouchableOpacity>
              ))}
            </View>

            {/* City Selection */}
            {cities.length > 0 && (
              <>
                <PTPText variant="label" color="white" style={styles.sectionLabel}>
                  Select your area
                </PTPText>
                <View style={styles.optionsGrid}>
                  {cities.map((city) => (
                    <TouchableOpacity
                      key={city}
                      style={[
                        styles.optionWide,
                        selectedCity === city && styles.optionSelected,
                      ]}
                      onPress={() => setSelectedCity(city)}
                      accessibilityLabel={city}
                      accessibilityState={{ selected: selectedCity === city }}
                    >
                      <PTPText
                        variant="buttonMedium"
                        color={selectedCity === city ? 'inkBlack' : 'white'}
                      >
                        {city}
                      </PTPText>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <PTPButton
              title="Continue"
              variant="primary"
              size="large"
              fullWidth
              disabled={!selectedState || !selectedCity}
              onPress={handleContinue}
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing[4],
  },
  sectionLabel: {
    marginBottom: spacing[3],
    marginTop: spacing[4],
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  option: {
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: borderRadius.md,
    minWidth: 80,
    alignItems: 'center',
  },
  optionWide: {
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: borderRadius.md,
  },
  optionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  footer: {
    paddingVertical: spacing[4],
  },
});

export default OnboardingLocationScreen;
