/**
 * PTPEmptyState Component
 *
 * Empty state display for lists and screens with no content.
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PTPText } from './PTPText';
import { PTPButton } from './PTPButton';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

interface PTPEmptyStateProps {
  /**
   * Ionicon name to display
   */
  iconName?: keyof typeof Ionicons.glyphMap;
  /**
   * Main title
   */
  title: string;
  /**
   * Description text
   */
  description?: string;
  /**
   * Action button text
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
  /**
   * @deprecated Use iconName instead
   */
  icon?: string;
}

/**
 * PTPEmptyState - Empty state display
 *
 * @example
 * <PTPEmptyState
 *   iconName="football-outline"
 *   title="No camps found"
 *   description="No camps are live yet for this city."
 *   actionText="Join the priority list"
 *   onAction={() => handleJoinList()}
 * />
 */
export const PTPEmptyState: React.FC<PTPEmptyStateProps> = ({
  iconName = 'albums-outline',
  title,
  description,
  actionText,
  onAction,
  style,
  icon,
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconContainer}>
        <Ionicons name={iconName} size={40} color={colors.gray500} />
      </View>
      <PTPText variant="sectionTitle" center style={styles.title}>
        {title}
      </PTPText>
      {description && (
        <PTPText variant="body" color="gray500" center style={styles.description}>
          {description}
        </PTPText>
      )}
      {actionText && onAction && (
        <PTPButton
          title={actionText}
          variant="outline"
          onPress={onAction}
          style={styles.button}
        />
      )}
    </View>
  );
};

/**
 * Common empty states for reuse
 */

export const NoProgramsEmptyState: React.FC<{ onAction?: () => void }> = ({ onAction }) => (
  <PTPEmptyState
    iconName="football-outline"
    title="No programs found"
    description="No camps or clinics are live yet for this area. Tap below to join our priority list."
    actionText="Join Priority List"
    onAction={onAction}
  />
);

export const NoSessionsEmptyState: React.FC<{ onAction?: () => void }> = ({ onAction }) => (
  <PTPEmptyState
    iconName="calendar-outline"
    title="No upcoming sessions"
    description="You don't have any training sessions scheduled yet."
    actionText="Find a Trainer"
    onAction={onAction}
  />
);

export const NoMessagesEmptyState: React.FC<{ onAction?: () => void }> = ({ onAction }) => (
  <PTPEmptyState
    iconName="chatbubbles-outline"
    title="No messages yet"
    description="Start a conversation with a trainer or contact PTP support."
    actionText="Start a Conversation"
    onAction={onAction}
  />
);

export const NoOrdersEmptyState: React.FC<{ onAction?: () => void }> = ({ onAction }) => (
  <PTPEmptyState
    iconName="receipt-outline"
    title="No orders yet"
    description="You haven't registered for any programs yet."
    actionText="Browse Programs"
    onAction={onAction}
  />
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[6],
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  icon: {
    fontSize: 40,
  },
  title: {
    marginBottom: spacing[2],
  },
  description: {
    marginBottom: spacing[6],
    maxWidth: 280,
  },
  button: {
    minWidth: 200,
  },
});

export default PTPEmptyState;
