import React, { memo, useRef, useEffect, useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ViewStyle,
  Platform,
  Animated,
} from 'react-native';
import { colors } from '@theme/colors';
import { spacing, borderRadius } from '@theme/spacing';
import { useDebouncedSearch } from '@hooks/useDebounce';
import { useHaptics } from '@hooks/useHaptics';

interface PTPSearchBarProps {
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  onSearch?: (text: string) => void;
  onClear?: () => void;
  autoFocus?: boolean;
  debounceMs?: number;
  showLoading?: boolean;
  style?: ViewStyle;
}

export const PTPSearchBar: React.FC<PTPSearchBarProps> = memo(({
  placeholder = 'Search...',
  value: externalValue,
  onChangeText,
  onSearch,
  onClear,
  autoFocus = false,
  debounceMs = 300,
  showLoading = false,
  style,
}) => {
  const inputRef = useRef<TextInput>(null);
  const { selection } = useHaptics();
  const [isFocused, setIsFocused] = useState(false);
  const borderColorAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Use internal debounced search or external value
  const {
    searchTerm,
    setSearchTerm,
    debouncedSearchTerm,
    isSearching,
    clearSearch,
  } = useDebouncedSearch(debounceMs);

  const currentValue = externalValue !== undefined ? externalValue : searchTerm;
  const isLoading = showLoading || isSearching;

  // Trigger search when debounced value changes
  useEffect(() => {
    if (externalValue === undefined && onSearch) {
      onSearch(debouncedSearchTerm);
    }
  }, [debouncedSearchTerm]);

  // Animate border color on focus
  useEffect(() => {
    Animated.timing(borderColorAnim, {
      toValue: isFocused ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isFocused]);

  // Animate fade for loading/clear
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: isLoading || currentValue.length > 0 ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [isLoading, currentValue]);

  const handleChangeText = (text: string) => {
    if (externalValue !== undefined) {
      onChangeText?.(text);
    } else {
      setSearchTerm(text);
      onChangeText?.(text);
    }
  };

  const handleClear = () => {
    selection();
    if (externalValue !== undefined) {
      onChangeText?.('');
    } else {
      clearSearch();
    }
    onClear?.();
    inputRef.current?.focus();
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const borderColor = borderColorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.gray200, colors.primary],
  });

  return (
    <Animated.View style={[styles.container, { borderColor }, style]}>
      {/* Search Icon */}
      <View style={styles.iconContainer}>
        <SearchIcon />
      </View>

      {/* Input */}
      <TextInput
        ref={inputRef}
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={colors.gray400}
        value={currentValue}
        onChangeText={handleChangeText}
        onFocus={handleFocus}
        onBlur={handleBlur}
        autoFocus={autoFocus}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        onSubmitEditing={() => onSearch?.(currentValue)}
      />

      {/* Loading or Clear button */}
      {isLoading ? (
        <Animated.View style={[styles.iconContainer, { opacity: fadeAnim }]}>
          <ActivityIndicator size="small" color={colors.gray400} />
        </Animated.View>
      ) : currentValue.length > 0 ? (
        <Animated.View style={{ opacity: fadeAnim }}>
          <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
            <ClearIcon />
          </TouchableOpacity>
        </Animated.View>
      ) : null}
    </Animated.View>
  );
});

// Simple SVG-like icons using Views
const SearchIcon: React.FC = () => (
  <View style={styles.searchIcon}>
    <View style={styles.searchIconCircle} />
    <View style={styles.searchIconHandle} />
  </View>
);

const ClearIcon: React.FC = () => (
  <View style={styles.clearIcon}>
    <View style={[styles.clearIconLine, { transform: [{ rotate: '45deg' }] }]} />
    <View style={[styles.clearIconLine, { transform: [{ rotate: '-45deg' }] }]} />
  </View>
);

PTPSearchBar.displayName = 'PTPSearchBar';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.gray200,
    paddingHorizontal: spacing[4],
    height: 48,
  },
  iconContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.inkBlack,
    paddingHorizontal: spacing[2],
    paddingVertical: 0,
    ...Platform.select({
      web: {
        outlineStyle: 'none',
      } as any,
    }),
  },
  clearButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchIcon: {
    width: 18,
    height: 18,
    position: 'relative',
  },
  searchIconCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.gray400,
    position: 'absolute',
    top: 0,
    left: 0,
  },
  searchIconHandle: {
    width: 6,
    height: 2,
    backgroundColor: colors.gray400,
    position: 'absolute',
    bottom: 2,
    right: 0,
    transform: [{ rotate: '45deg' }],
  },
  clearIcon: {
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.gray300,
    borderRadius: 8,
  },
  clearIconLine: {
    position: 'absolute',
    width: 8,
    height: 2,
    backgroundColor: colors.gray600,
    borderRadius: 1,
  },
});

export default PTPSearchBar;
