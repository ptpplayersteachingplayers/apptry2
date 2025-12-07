/**
 * Edit Profile Screen (Parent)
 *
 * Allows parents to update their profile information.
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ParentStackParamList } from '../../types/navigation';
import { USState } from '../../types';
import { useAuth, useParentUser } from '../../hooks/useAuth';
import { updateProfile } from '../../api/auth';
import { PTPText, PTPButton, PTPInput } from '../../components';
import { colors } from '../../theme/colors';
import { spacing, borderRadius, shadows } from '../../theme/spacing';

type EditProfileNavigationProp = NativeStackNavigationProp<ParentStackParamList>;

// US States where PTP operates
const US_STATES: { value: USState; label: string }[] = [
  { value: 'PA', label: 'Pennsylvania' },
  { value: 'NJ', label: 'New Jersey' },
  { value: 'DE', label: 'Delaware' },
  { value: 'MD', label: 'Maryland' },
  { value: 'NY', label: 'New York' },
  { value: 'CT', label: 'Connecticut' },
];

/**
 * EditProfileScreen - Edit parent profile information
 */
const EditProfileScreen: React.FC = () => {
  const navigation = useNavigation<EditProfileNavigationProp>();
  const { refreshUser } = useAuth();
  const parentUser = useParentUser();

  // Form state
  const [firstName, setFirstName] = useState(parentUser?.firstName || '');
  const [lastName, setLastName] = useState(parentUser?.lastName || '');
  const [phone, setPhone] = useState(parentUser?.phone || '');
  const [city, setCity] = useState(parentUser?.preferredLocation?.city || '');
  const [state, setState] = useState<USState>(parentUser?.preferredLocation?.state || 'PA');
  const [zipCode, setZipCode] = useState(parentUser?.preferredLocation?.zipCode || '');
  const [isLoading, setIsLoading] = useState(false);

  // Validation
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (phone && !/^[\d\s\-().+]+$/.test(phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    if (zipCode && !/^\d{5}(-\d{4})?$/.test(zipCode)) {
      newErrors.zipCode = 'Please enter a valid ZIP code';
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
      await updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim() || undefined,
        preferredLocation: city || zipCode ? {
          state,
          city: city.trim(),
          zipCode: zipCode.trim() || undefined,
        } : undefined,
      });

      // Refresh user data
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
          {/* Personal Information */}
          <View style={styles.section}>
            <PTPText variant="label" color="gray500" style={styles.sectionTitle}>
              PERSONAL INFORMATION
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
                  error={errors.phone}
                />
              </View>
            </View>
          </View>

          {/* Location Preferences */}
          <View style={styles.section}>
            <PTPText variant="label" color="gray500" style={styles.sectionTitle}>
              LOCATION PREFERENCES
            </PTPText>
            <View style={styles.card}>
              <View style={styles.inputGroup}>
                <PTPText variant="label" color="gray600" style={styles.inputLabel}>
                  City
                </PTPText>
                <PTPInput
                  value={city}
                  onChangeText={setCity}
                  placeholder="Enter city"
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.inputGroup}>
                <PTPText variant="label" color="gray600" style={styles.inputLabel}>
                  State
                </PTPText>
                <View style={styles.stateSelector}>
                  {US_STATES.map((s) => (
                    <View
                      key={s.value}
                      style={[
                        styles.stateChip,
                        state === s.value && styles.stateChipSelected,
                      ]}
                    >
                      <PTPText
                        variant="caption"
                        color={state === s.value ? 'white' : 'gray600'}
                        onPress={() => setState(s.value)}
                      >
                        {s.value}
                      </PTPText>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <PTPText variant="label" color="gray600" style={styles.inputLabel}>
                  ZIP Code
                </PTPText>
                <PTPInput
                  value={zipCode}
                  onChangeText={setZipCode}
                  placeholder="12345"
                  keyboardType="number-pad"
                  maxLength={10}
                  error={errors.zipCode}
                />
              </View>
            </View>
          </View>

          {/* Email (Read-only) */}
          <View style={styles.section}>
            <PTPText variant="label" color="gray500" style={styles.sectionTitle}>
              ACCOUNT
            </PTPText>
            <View style={styles.card}>
              <View style={styles.inputGroup}>
                <PTPText variant="label" color="gray600" style={styles.inputLabel}>
                  Email Address
                </PTPText>
                <View style={styles.readOnlyField}>
                  <PTPText variant="body" color="gray500">
                    {parentUser?.email}
                  </PTPText>
                </View>
                <PTPText variant="caption" color="gray400" style={styles.helperText}>
                  Contact support@ptpsoccer.com to change your email
                </PTPText>
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
  readOnlyField: {
    backgroundColor: colors.gray100,
    borderRadius: borderRadius.md,
    padding: spacing[3],
  },
  helperText: {
    marginTop: spacing[1],
  },
  stateSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  stateChip: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
    backgroundColor: colors.gray100,
  },
  stateChipSelected: {
    backgroundColor: colors.primary,
  },
  buttonContainer: {
    paddingHorizontal: spacing[4],
    marginTop: spacing[6],
  },
  cancelButton: {
    marginTop: spacing[3],
  },
});

export default EditProfileScreen;
