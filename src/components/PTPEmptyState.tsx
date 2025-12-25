/**
 * PTPEmptyState Component
 *
 * Dark themed empty state display for lists and screens with no content.
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PTPText } from './PTPText';
import { PTPButton } from './PTPButton';
import { colors } from '../theme/colors';
import { spacing, borderRadius, borderWidth } from '../theme/spacing';

interface PTPEmptyStateProps {
  iconName?: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  secondaryActionText?: string;
  onSecondaryAction?: () => void;
  style?: ViewStyle;
}

/**
 * PTPEmptyState - Dark themed empty state
 */
export const PTPEmptyState: React.FC<PTPEmptyStateProps> = ({
  iconName = 'albums-outline',
  title,
  description,
  actionText,
  onAction,
  secondaryActionText,
  onSecondaryAction,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconContainer}>
        <Ionicons name={iconName} size={48} color={colors.primary} />
      </View>
      <PTPText variant="sectionTitle" center style={styles.title}>
        {title}
      </PTPText>
      {description && (
        <PTPText variant="body" color="gray300" center style={styles.description}>
          {description}
        </PTPText>
      )}
      {actionText && onAction && (
        <PTPButton
          title={actionText}
          onPress={onAction}
          style={styles.button}
        />
      )}
      {secondaryActionText && onSecondaryAction && (
        <PTPButton
          title={secondaryActionText}
          variant="ghost"
          onPress={onSecondaryAction}
          style={styles.secondaryButton}
        />
      )}
    </View>
  );
};

/**
 * Common empty states for reuse
 */

export const NoTrainersEmptyState: React.FC<{ onAction?: () => void }> = ({ onAction }) => (
  <PTPEmptyState
    iconName="people-outline"
    title="NO TRAINERS FOUND"
    description="No trainers available in your area yet. Try expanding your search radius."
    actionText="EXPAND SEARCH"
    onAction={onAction}
  />
);

export const NoProgramsEmptyState: React.FC<{ onAction?: () => void }> = ({ onAction }) => (
  <PTPEmptyState
    iconName="football-outline"
    title="NO PROGRAMS FOUND"
    description="No camps or clinics are live yet for this area. Join our priority list to be notified."
    actionText="JOIN PRIORITY LIST"
    onAction={onAction}
  />
);

export const NoBookingsEmptyState: React.FC<{ onAction?: () => void }> = ({ onAction }) => (
  <PTPEmptyState
    iconName="calendar-outline"
    title="NO BOOKINGS YET"
    description="You don't have any training sessions scheduled. Book a session with an elite trainer."
    actionText="FIND A TRAINER"
    onAction={onAction}
  />
);

export const NoSessionsEmptyState: React.FC<{ onAction?: () => void }> = ({ onAction }) => (
  <PTPEmptyState
    iconName="time-outline"
    title="NO UPCOMING SESSIONS"
    description="Your schedule is clear. Ready to train with the best?"
    actionText="BOOK A SESSION"
    onAction={onAction}
  />
);

export const NoMessagesEmptyState: React.FC<{ onAction?: () => void }> = ({ onAction }) => (
  <PTPEmptyState
    iconName="chatbubbles-outline"
    title="NO MESSAGES"
    description="Start a conversation with a trainer to discuss training goals."
    actionText="FIND A TRAINER"
    onAction={onAction}
  />
);

export const NoChildrenEmptyState: React.FC<{ onAction?: () => void }> = ({ onAction }) => (
  <PTPEmptyState
    iconName="person-add-outline"
    title="ADD YOUR PLAYERS"
    description="Add your child's profile to start booking training sessions."
    actionText="ADD PLAYER"
    onAction={onAction}
  />
);

export const NoEarningsEmptyState: React.FC = () => (
  <PTPEmptyState
    iconName="wallet-outline"
    title="NO EARNINGS YET"
    description="Complete training sessions to start earning. Your earnings will appear here."
  />
);

export const NoReviewsEmptyState: React.FC = () => (
  <PTPEmptyState
    iconName="star-outline"
    title="NO REVIEWS YET"
    description="Reviews from parents will appear here after you complete sessions."
  />
);

export const ErrorEmptyState: React.FC<{ onRetry?: () => void }> = ({ onRetry }) => (
  <PTPEmptyState
    iconName="alert-circle-outline"
    title="SOMETHING WENT WRONG"
    description="We couldn't load this content. Please try again."
    actionText="RETRY"
    onAction={onRetry}
  />
);

export const OfflineEmptyState: React.FC<{ onRetry?: () => void }> = ({ onRetry }) => (
  <PTPEmptyState
    iconName="cloud-offline-outline"
    title="YOU'RE OFFLINE"
    description="Check your internet connection and try again."
    actionText="RETRY"
    onAction={onRetry}
  />
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[6],
    backgroundColor: colors.black,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: borderRadius.none,
    borderWidth: borderWidth.base,
    borderColor: colors.gray700,
    backgroundColor: colors.blackCard,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[6],
  },
  title: {
    marginBottom: spacing[2],
  },
  description: {
    marginBottom: spacing[6],
    maxWidth: 300,
    lineHeight: 24,
  },
  button: {
    minWidth: 200,
  },
  secondaryButton: {
    marginTop: spacing[3],
  },
});

export default PTPEmptyState;
