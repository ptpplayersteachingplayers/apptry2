/**
 * Sign Up Screen
 *
 * New user registration form.
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../types/navigation';
import { useAuth } from '../../hooks/useAuth';
import { PTPText, PTPButton, PTPInput, PTPPasswordInput } from '../../components';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { LOGO_URL } from '../../assets/logo';

type SignUpScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'SignUp'>;

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
}

/**
 * SignUpScreen - New user registration
 */
const SignUpScreen: React.FC = () => {
  const navigation = useNavigation<SignUpScreenNavigationProp>();
  const { signUp, isLoading } = useAuth();

  const [form, setForm] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const updateField = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!form.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!form.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!form.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!form.password) {
      newErrors.password = 'Password is required';
    } else if (form.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = async () => {
    if (!validateForm()) return;

    try {
      await signUp({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        password: form.password,
      });
      // After signup, navigate to onboarding
      navigation.navigate('OnboardingLocation');
    } catch (error: any) {
      Alert.alert(
        'Sign Up Failed',
        error.message || 'Please try again.'
      );
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Image
              source={{ uri: LOGO_URL }}
              style={styles.logo}
              resizeMode="contain"
            />
            <PTPText variant="heroTitle" style={styles.title}>
              Join PTP Soccer
            </PTPText>
            <PTPText variant="body" color="gray500" center>
              Create your account to register for camps, clinics, and private training.
            </PTPText>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.row}>
              <View style={styles.halfInput}>
                <PTPInput
                  label="First Name"
                  placeholder="First name"
                  value={form.firstName}
                  onChangeText={(v) => updateField('firstName', v)}
                  autoCapitalize="words"
                  error={errors.firstName}
                />
              </View>
              <View style={styles.halfInput}>
                <PTPInput
                  label="Last Name"
                  placeholder="Last name"
                  value={form.lastName}
                  onChangeText={(v) => updateField('lastName', v)}
                  autoCapitalize="words"
                  error={errors.lastName}
                />
              </View>
            </View>

            <PTPInput
              label="Email"
              placeholder="Enter your email"
              value={form.email}
              onChangeText={(v) => updateField('email', v)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              error={errors.email}
            />

            <PTPInput
              label="Phone (optional)"
              placeholder="(555) 123-4567"
              value={form.phone}
              onChangeText={(v) => updateField('phone', v)}
              keyboardType="phone-pad"
              autoComplete="tel"
            />

            <PTPPasswordInput
              label="Password"
              placeholder="Create a password"
              value={form.password}
              onChangeText={(v) => updateField('password', v)}
              error={errors.password}
              helperText="Must be at least 8 characters"
            />

            <PTPPasswordInput
              label="Confirm Password"
              placeholder="Confirm your password"
              value={form.confirmPassword}
              onChangeText={(v) => updateField('confirmPassword', v)}
              error={errors.confirmPassword}
            />

            <PTPButton
              title="Create Account"
              variant="primary"
              size="large"
              fullWidth
              loading={isLoading}
              onPress={handleSignUp}
              style={styles.submitButton}
            />

            <PTPText variant="caption" color="gray500" center style={styles.terms}>
              By creating an account, you agree to our Terms of Service and Privacy Policy.
            </PTPText>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <PTPText variant="body" color="gray500">
              Already have an account?{' '}
            </PTPText>
            <TouchableOpacity
              onPress={() => navigation.navigate('Login')}
              accessibilityLabel="Sign in to existing account"
            >
              <PTPText variant="label" color="primary">
                Sign In
              </PTPText>
            </TouchableOpacity>
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
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing[4],
  },
  header: {
    alignItems: 'center',
    paddingTop: spacing[4],
    paddingBottom: spacing[6],
  },
  logo: {
    width: 100,
    height: 40,
    marginBottom: spacing[4],
  },
  title: {
    marginBottom: spacing[2],
  },
  form: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  halfInput: {
    flex: 1,
  },
  submitButton: {
    marginTop: spacing[2],
  },
  terms: {
    marginTop: spacing[4],
    paddingHorizontal: spacing[4],
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing[6],
  },
});

export default SignUpScreen;
