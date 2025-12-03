/**
 * PTPInput Component
 *
 * Branded text input with label and error handling.
 */

import React, { useState } from 'react';
import {
  View,
  TextInput,
  TextInputProps,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { PTPText } from './PTPText';
import { colors } from '../theme/colors';
import { fontFamily, fontSize } from '../theme/typography';
import { spacing, borderRadius } from '../theme/spacing';

interface PTPInputProps extends TextInputProps {
  /**
   * Input label
   */
  label?: string;
  /**
   * Error message
   */
  error?: string;
  /**
   * Helper text
   */
  helperText?: string;
  /**
   * Left icon component
   */
  leftIcon?: React.ReactNode;
  /**
   * Right icon component or toggle button
   */
  rightIcon?: React.ReactNode;
  /**
   * Container style
   */
  containerStyle?: ViewStyle;
}

/**
 * PTPInput - Branded text input
 *
 * @example
 * <PTPInput
 *   label="Email"
 *   placeholder="Enter your email"
 *   value={email}
 *   onChangeText={setEmail}
 *   keyboardType="email-address"
 *   error={errors.email}
 * />
 */
export const PTPInput: React.FC<PTPInputProps> = ({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  containerStyle,
  style,
  onFocus,
  onBlur,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const inputContainerStyle = [
    styles.inputContainer,
    isFocused && styles.inputContainerFocused,
    error && styles.inputContainerError,
  ];

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <PTPText variant="label" style={styles.label}>
          {label}
        </PTPText>
      )}
      <View style={inputContainerStyle}>
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        <TextInput
          style={[styles.input, leftIcon ? styles.inputWithLeftIcon : undefined, style]}
          placeholderTextColor={colors.gray400}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />
        {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
      </View>
      {error && (
        <PTPText variant="caption" color="error" style={styles.errorText}>
          {error}
        </PTPText>
      )}
      {!error && helperText && (
        <PTPText variant="caption" color="gray500" style={styles.helperText}>
          {helperText}
        </PTPText>
      )}
    </View>
  );
};

/**
 * PTPPasswordInput - Password input with show/hide toggle
 */
interface PTPPasswordInputProps extends Omit<PTPInputProps, 'secureTextEntry' | 'rightIcon'> {}

export const PTPPasswordInput: React.FC<PTPPasswordInputProps> = (props) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <PTPInput
      {...props}
      secureTextEntry={!showPassword}
      rightIcon={
        <TouchableOpacity
          onPress={() => setShowPassword(!showPassword)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
        >
          <PTPText variant="caption" color="gray500">
            {showPassword ? 'Hide' : 'Show'}
          </PTPText>
        </TouchableOpacity>
      }
    />
  );
};

/**
 * PTPSearchInput - Search input with icon
 */
interface PTPSearchInputProps extends Omit<PTPInputProps, 'leftIcon'> {
  onSearch?: (query: string) => void;
}

export const PTPSearchInput: React.FC<PTPSearchInputProps> = ({
  onSearch,
  onChangeText,
  ...props
}) => {
  const handleChangeText = (text: string) => {
    onChangeText?.(text);
    onSearch?.(text);
  };

  return (
    <PTPInput
      {...props}
      onChangeText={handleChangeText}
      leftIcon={
        <PTPText color="gray400">🔍</PTPText>
      }
      placeholder={props.placeholder || 'Search...'}
      returnKeyType="search"
    />
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing[4],
  },
  label: {
    marginBottom: spacing[2],
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: borderRadius.md,
    minHeight: 48,
  },
  inputContainerFocused: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  inputContainerError: {
    borderColor: colors.error,
  },
  input: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.base,
    color: colors.inkBlack,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    minHeight: 48,
  },
  inputWithLeftIcon: {
    paddingLeft: spacing[2],
  },
  leftIcon: {
    paddingLeft: spacing[4],
  },
  rightIcon: {
    paddingRight: spacing[4],
  },
  errorText: {
    marginTop: spacing[1],
  },
  helperText: {
    marginTop: spacing[1],
  },
});

export default PTPInput;
