/**
 * PTPSectionHeader Component
 *
 * Section header with title and optional action button.
 */

import React from 'react';
import { View, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { PTPText } from './PTPText';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

interface PTPSectionHeaderProps {
  /**
   * Section title
   */
  title: string;
  /**
   * Optional subtitle
   */
  subtitle?: string;
  /**
   * Action button text (e.g., "See All")
   */
  actionText?: string;
  /**
   * Action button handler
   */
  onAction?: () => void;
  /**
   * Custom style
   */
  style?: ViewStyle;
}

/**
 * PTPSectionHeader - Section header with optional action
 *
 * @example
 * <PTPSectionHeader
 *   title="Winter Clinics"
 *   subtitle="Train with NCAA mentors"
 *   actionText="See All"
 *   onAction={() => navigate('CampsClinics')}
 * />
 */
export const PTPSectionHeader: React.FC<PTPSectionHeaderProps> = ({
  title,
  subtitle,
  actionText,
  onAction,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.textContainer}>
        <PTPText variant="sectionTitle">{title}</PTPText>
        {subtitle && (
          <PTPText variant="bodySmall" color="gray500" style={styles.subtitle}>
            {subtitle}
          </PTPText>
        )}
      </View>
      {actionText && onAction && (
        <TouchableOpacity
          onPress={onAction}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel={actionText}
          accessibilityRole="button"
        >
          <PTPText variant="label" color="primary">
            {actionText}
          </PTPText>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing[3],
  },
  textContainer: {
    flex: 1,
    marginRight: spacing[2],
  },
  subtitle: {
    marginTop: spacing[1],
  },
});

export default PTPSectionHeader;
