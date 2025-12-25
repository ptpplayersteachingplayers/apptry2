/**
 * Login Screen
 *
 * Email/password login with link to forgot password.
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

type LoginScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

/**
 * LoginScreen - Email and password authentication
 */
const LoginScreen: React.FC = () => {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { login, isLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validateForm = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    try {
      await login({ email: email.trim(), password });
      // Navigation handled by AppNavigator based on auth state
    } catch (error: any) {
      Alert.alert(
        'Login Failed',
        error.message || 'Please check your credentials and try again.'
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
              WELCOME BACK
            </PTPText>
            <PTPText variant="body" color="gray300">
              Sign in to continue to PTP Soccer
            </PTPText>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <PTPInput
              label="Email"
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              error={errors.email}
            />

            <PTPPasswordInput
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              autoComplete="password"
              error={errors.password}
            />

            <TouchableOpacity
              onPress={() => navigation.navigate('ForgotPassword')}
              style={styles.forgotLink}
              accessibilityLabel="Forgot password"
            >
              <PTPText variant="label" color="primary">
                Forgot Password?
              </PTPText>
            </TouchableOpacity>

            <PTPButton
              title="Sign In"
              variant="primary"
              size="large"
              fullWidth
              loading={isLoading}
              onPress={handleLogin}
              style={styles.submitButton}
            />

            {/* Demo mode hint - only show in development */}
            {__DEV__ && (
              <View style={styles.demoHint}>
                <PTPText variant="caption" color="gray400" center>
                  Demo mode: Use any email/password to log in.
                </PTPText>
                <PTPText variant="caption" color="gray400" center>
                  Use "trainer@" in email to log in as trainer.
                </PTPText>
              </View>
            )}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <PTPText variant="body" color="gray300">
              Don't have an account?{' '}
            </PTPText>
            <TouchableOpacity
              onPress={() => navigation.navigate('SignUp')}
              accessibilityLabel="Create new account"
            >
              <PTPText variant="label" color="primary">
                SIGN UP
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
    backgroundColor: colors.black,
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
    paddingTop: spacing[6],
    paddingBottom: spacing[8],
  },
  logo: {
    width: 140,
    height: 56,
    marginBottom: spacing[6],
  },
  title: {
    marginBottom: spacing[2],
  },
  form: {
    flex: 1,
  },
  forgotLink: {
    alignSelf: 'flex-end',
    marginBottom: spacing[4],
    marginTop: -spacing[2],
  },
  submitButton: {
    marginTop: spacing[4],
  },
  demoHint: {
    marginTop: spacing[4],
    padding: spacing[3],
    backgroundColor: colors.blackCard,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: colors.gray700,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing[6],
  },
});

export default LoginScreen;
