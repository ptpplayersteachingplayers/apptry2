/**
 * Edit Trainer Profile Screen
 *
 * Allows trainers to update their profile information, bio, rates, and specialties.
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { TrainerStackParamList } from '../../types/navigation';
import { TrainerSpecialty } from '../../types';
import { useAuth, useTrainerUser } from '../../hooks/useAuth';
import { updateTrainerProfile } from '../../api/training';
import { PTPText, PTPButton, PTPInput } from '../../components';
import { colors } from '../../theme/colors';
import { spacing, borderRadius, shadows } from '../../theme/spacing';

type EditTrainerProfileNavigationProp = NativeStackNavigationProp<TrainerStackParamList>;

// Specialty options
const SPECIALTIES: { value: TrainerSpecialty; label: string }[] = [
  { value: '1v1', label: '1v1 Moves' },
  { value: 'finishing', label: 'Finishing' },
  { value: 'passing', label: 'Passing' },
  { value: 'dribbling', label: 'Dribbling' },
  { value: 'shooting', label: 'Shooting' },
  { value: 'goalkeeper', label: 'Goalkeeper' },
  { value: 'defense', label: 'Defense' },
  { value: 'midfield', label: 'Midfield Play' },
  { value: 'confidence', label: 'Confidence Building' },
  { value: 'speed-agility', label: 'Speed & Agility' },
  { value: 'game-iq', label: 'Game IQ' },
];

/**
 * EditTrainerProfileScreen - Edit trainer profile
 */
const EditTrainerProfileScreen: React.FC = () => {
  const navigation = useNavigation<EditTrainerProfileNavigationProp>();
  const { refreshUser } = useAuth();
  const trainerUser = useTrainerUser();

  // Form state
  const [firstName, setFirstName] = useState(trainerUser?.firstName || '');
  const [lastName, setLastName] = useState(trainerUser?.lastName || '');
  const [phone, setPhone] = useState(trainerUser?.phone || '');
  const [bio, setBio] = useState(trainerUser?.bio || '');
  const [collegePro, setCollegePro] = useState(trainerUser?.collegePro || '');
  const [hourlyRate, setHourlyRate] = useState(trainerUser?.hourlyRate?.toString() || '80');
  const [teachingStyle, setTeachingStyle] = useState(trainerUser?.teachingStyle || '');
  const [specialties, setSpecialties] = useState<TrainerSpecialty[]>(
    trainerUser?.specialties || []
  );
  const [isLoading, setIsLoading] = useState(false);

  // Validation
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const toggleSpecialty = (specialty: TrainerSpecialty) => {
    if (specialties.includes(specialty)) {
      setSpecialties(specialties.filter((s) => s !== specialty));
    } else {
      setSpecialties([...specialties, specialty]);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!bio.trim()) {
      newErrors.bio = 'Bio is required';
    }

    const rate = parseFloat(hourlyRate);
    if (isNaN(rate) || rate < 0) {
      newErrors.hourlyRate = 'Please enter a valid hourly rate';
    }

    if (specialties.length === 0) {
      newErrors.specialties = 'Select at least one specialty';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      await updateTrainerProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim() || undefined,
        bio: bio.trim(),
        collegePro: collegePro.trim(),
        hourlyRate: parseFloat(hourlyRate),
        teachingStyle: teachingStyle.trim() || undefined,
        specialties,
      });

      await refreshUser();

      Alert.alert('Success', 'Your profile has been updated.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Basic Information */}
          <View style={styles.section}>
            <PTPText variant="label" color="gray500" style={styles.sectionTitle}>
              BASIC INFORMATION
            </PTPText>
            <View style={styles.card}>
              <View style={styles.inputGroup}>
                <PTPText variant="label" color="gray600" style={styles.inputLabel}>
                  First Name *
                </PTPText>
                <PTPInput
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="Enter first name"
                  autoCapitalize="words"
                  error={errors.firstName}
                />
              </View>

              <View style={styles.inputGroup}>
                <PTPText variant="label" color="gray600" style={styles.inputLabel}>
                  Last Name *
                </PTPText>
                <PTPInput
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Enter last name"
                  autoCapitalize="words"
                  error={errors.lastName}
                />
              </View>

              <View style={styles.inputGroup}>
                <PTPText variant="label" color="gray600" style={styles.inputLabel}>
                  Phone Number
                </PTPText>
                <PTPInput
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="(555) 555-5555"
                  keyboardType="phone-pad"
                />
              </View>
            </View>
          </View>

          {/* Background */}
          <View style={styles.section}>
            <PTPText variant="label" color="gray500" style={styles.sectionTitle}>
              BACKGROUND
            </PTPText>
            <View style={styles.card}>
              <View style={styles.inputGroup}>
                <PTPText variant="label" color="gray600" style={styles.inputLabel}>
                  College/Pro Experience
                </PTPText>
                <PTPInput
                  value={collegePro}
                  onChangeText={setCollegePro}
                  placeholder="e.g., Villanova University, Philadelphia Union"
                />
              </View>

              <View style={styles.inputGroup}>
                <PTPText variant="label" color="gray600" style={styles.inputLabel}>
                  Bio *
                </PTPText>
                <PTPInput
                  value={bio}
                  onChangeText={setBio}
                  placeholder="Tell parents about your background and what makes you a great trainer..."
                  multiline
                  numberOfLines={4}
                  style={styles.textArea}
                  error={errors.bio}
                />
              </View>

              <View style={styles.inputGroup}>
                <PTPText variant="label" color="gray600" style={styles.inputLabel}>
                  Teaching Style
                </PTPText>
                <PTPInput
                  value={teachingStyle}
                  onChangeText={setTeachingStyle}
                  placeholder="Describe your approach to training..."
                  multiline
                  numberOfLines={2}
                  style={styles.textAreaSmall}
                />
              </View>
            </View>
          </View>

          {/* Specialties */}
          <View style={styles.section}>
            <PTPText variant="label" color="gray500" style={styles.sectionTitle}>
              SPECIALTIES *
            </PTPText>
            <View style={styles.card}>
              <View style={styles.specialtiesGrid}>
                {SPECIALTIES.map((spec) => (
                  <TouchableOpacity
                    key={spec.value}
                    style={[
                      styles.specialtyChip,
                      specialties.includes(spec.value) && styles.specialtyChipSelected,
                    ]}
                    onPress={() => toggleSpecialty(spec.value)}
                  >
                    <PTPText
                      variant="caption"
                      color={specialties.includes(spec.value) ? 'white' : 'gray600'}
                    >
                      {spec.label}
                    </PTPText>
                  </TouchableOpacity>
                ))}
              </View>
              {errors.specialties && (
                <PTPText variant="caption" color="error" style={styles.errorText}>
                  {errors.specialties}
                </PTPText>
              )}
            </View>
          </View>

          {/* Pricing */}
          <View style={styles.section}>
            <PTPText variant="label" color="gray500" style={styles.sectionTitle}>
              PRICING
            </PTPText>
            <View style={styles.card}>
              <View style={styles.inputGroup}>
                <PTPText variant="label" color="gray600" style={styles.inputLabel}>
                  Hourly Rate ($) *
                </PTPText>
                <View style={styles.rateInput}>
                  <PTPText variant="body" color="gray500" style={styles.dollarSign}>
                    $
                  </PTPText>
                  <PTPInput
                    value={hourlyRate}
                    onChangeText={setHourlyRate}
                    placeholder="80"
                    keyboardType="numeric"
                    style={styles.rateInputField}
                    error={errors.hourlyRate}
                  />
                  <PTPText variant="body" color="gray500" style={styles.perHour}>
                    /hour
                  </PTPText>
                </View>
              </View>
            </View>
          </View>

          {/* Save Button */}
          <View style={styles.buttonContainer}>
            <PTPButton
              title="Save Changes"
              onPress={handleSave}
              loading={isLoading}
              fullWidth
            />
            <PTPButton
              title="Cancel"
              variant="outline"
              onPress={() => navigation.goBack()}
              fullWidth
              style={styles.cancelButton}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.offWhite,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing[8],
  },
  section: {
    paddingHorizontal: spacing[4],
    marginTop: spacing[6],
  },
  sectionTitle: {
    marginBottom: spacing[2],
    marginLeft: spacing[1],
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    ...shadows.sm,
  },
  inputGroup: {
    marginBottom: spacing[4],
  },
  inputLabel: {
    marginBottom: spacing[1],
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  textAreaSmall: {
    height: 60,
    textAlignVertical: 'top',
  },
  specialtiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  specialtyChip: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
    backgroundColor: colors.gray100,
  },
  specialtyChipSelected: {
    backgroundColor: colors.primary,
  },
  errorText: {
    marginTop: spacing[2],
  },
  rateInput: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dollarSign: {
    marginRight: spacing[1],
    fontSize: 18,
  },
  rateInputField: {
    flex: 1,
    maxWidth: 100,
  },
  perHour: {
    marginLeft: spacing[2],
  },
  buttonContainer: {
    paddingHorizontal: spacing[4],
    marginTop: spacing[6],
  },
  cancelButton: {
    marginTop: spacing[3],
  },
});

export default EditTrainerProfileScreen;
