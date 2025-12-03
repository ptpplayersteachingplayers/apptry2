/**
 * Forgot Password Screen
 *
 * Request password reset via email.
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { PTPText, PTPButton, PTPInput } from '../../components';
import { requestPasswordReset } from '../../api/auth';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

/**
 * ForgotPasswordScreen - Password reset request
 */
const ForgotPasswordScreen: React.FC = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const handleSubmit = async () => {
    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email');
      return;
    }

    setIsLoading(true);
    setError(undefined);

    try {
      await requestPasswordReset(email.trim());
      setIsSubmitted(true);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.content}>
          <View style={styles.successIcon}>
            <PTPText style={{ fontSize: 48 }}>✉️</PTPText>
          </View>
          <PTPText variant="sectionTitle" center style={styles.successTitle}>
            Check Your Email
          </PTPText>
          <PTPText variant="body" color="gray500" center style={styles.successText}>
            We've sent password reset instructions to {email}
          </PTPText>
          <PTPButton
            title="Back to Login"
            variant="primary"
            fullWidth
            onPress={() => navigation.goBack()}
            style={styles.button}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <PTPText variant="body" color="gray500" style={styles.description}>
            Enter your email address and we'll send you instructions to reset your password.
          </PTPText>

          <PTPInput
            label="Email"
            placeholder="Enter your email"
            value={email}
            onChangeText={(v) => {
              setEmail(v);
              setError(undefined);
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            error={error}
          />

          <PTPButton
            title="Send Reset Link"
            variant="primary"
            size="large"
            fullWidth
            loading={isLoading}
            onPress={handleSubmit}
            style={styles.button}
          />
        </View>
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
  content: {
    flex: 1,
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
  },
  description: {
    marginBottom: spacing[6],
  },
  button: {
    marginTop: spacing[4],
  },
  successIcon: {
    alignSelf: 'center',
    marginTop: spacing[10],
    marginBottom: spacing[6],
  },
  successTitle: {
    marginBottom: spacing[3],
  },
  successText: {
    marginBottom: spacing[8],
    paddingHorizontal: spacing[4],
  },
});

export default ForgotPasswordScreen;
