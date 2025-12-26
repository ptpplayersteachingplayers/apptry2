/**
 * PTPInput Component
 *
 * Dark themed input with sharp edges and gold focus states.
 * Includes Oswald label styling.
 */

import React, { useState } from 'react';
import {
  View,
  TextInput,
  TextInputProps,
  StyleSheet,
  Pressable,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PTPText } from './PTPText';
import { colors, semanticColors } from '../theme/colors';
import { fontFamily, fontSize } from '../theme/typography';
import { spacing, borderRadius, borderWidth } from '../theme/spacing';

interface PTPInputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
  required?: boolean;
}

/**
 * PTPInput - Dark themed input with gold focus
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
  required,
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
        <View style={styles.labelRow}>
          <PTPText variant="label" color="gray300">
            {label}
          </PTPText>
          {required && (
            <PTPText variant="label" color="error"> *</PTPText>
          )}
        </View>
      )}
      <View style={inputContainerStyle}>
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        <TextInput
          style={[
            styles.input,
            leftIcon ? styles.inputWithLeftIcon : undefined,
            rightIcon ? styles.inputWithRightIcon : undefined,
            style,
          ]}
          placeholderTextColor={colors.gray500}
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
        <Pressable
          onPress={() => setShowPassword(!showPassword)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
        >
          <Ionicons
            name={showPassword ? 'eye-off' : 'eye'}
            size={20}
            color={colors.gray500}
          />
        </Pressable>
      }
    />
  );
};

/**
 * PTPSearchInput - Search input with icon
 */
interface PTPSearchInputProps extends Omit<PTPInputProps, 'leftIcon' | 'label'> {
  onSearch?: (query: string) => void;
  onClear?: () => void;
}

export const PTPSearchInput: React.FC<PTPSearchInputProps> = ({
  onSearch,
  onClear,
  onChangeText,
  value,
  ...props
}) => {
  const handleChangeText = (text: string) => {
    onChangeText?.(text);
    onSearch?.(text);
  };

  const handleClear = () => {
    onChangeText?.('');
    onClear?.();
    onSearch?.('');
  };

  return (
    <PTPInput
      {...props}
      value={value}
      onChangeText={handleChangeText}
      leftIcon={
        <Ionicons name="search" size={20} color={colors.gray500} />
      }
      rightIcon={
        value ? (
          <Pressable onPress={handleClear} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close-circle" size={20} color={colors.gray500} />
          </Pressable>
        ) : undefined
      }
      placeholder={props.placeholder || 'Search...'}
      returnKeyType="search"
    />
  );
};

/**
 * PTPTextArea - Multi-line text input
 */
interface PTPTextAreaProps extends Omit<PTPInputProps, 'multiline' | 'numberOfLines'> {
  rows?: number;
}

export const PTPTextArea: React.FC<PTPTextAreaProps> = ({
  rows = 4,
  style,
  ...props
}) => {
  return (
    <PTPInput
      {...props}
      multiline
      numberOfLines={rows}
      style={[
        { minHeight: rows * 24, textAlignVertical: 'top' },
        style,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing[4],
  },
  labelRow: {
    flexDirection: 'row',
    marginBottom: spacing[2],
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.blackLight,
    borderWidth: borderWidth.base,
    borderColor: colors.gray700,
    borderRadius: borderRadius.none,
    minHeight: 52,
  },
  inputContainerFocused: {
    borderColor: colors.primary,
  },
  inputContainerError: {
    borderColor: colors.error,
  },
  input: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.base,
    color: colors.white,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
    minHeight: 52,
  },
  inputWithLeftIcon: {
    paddingLeft: spacing[2],
  },
  inputWithRightIcon: {
    paddingRight: spacing[2],
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
