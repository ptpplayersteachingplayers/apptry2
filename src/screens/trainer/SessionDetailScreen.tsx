/**
 * Session Detail Screen (Trainer)
 *
 * Shows detailed information about a training session.
 * Allows trainers to respond to requests, add notes, and mark complete.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { TrainerStackParamList } from '../../types/navigation';
import { TrainingSession } from '../../types';
import { getSession, respondToSessionRequest, completeSession, cancelSession } from '../../api/training';
import { PTPText, PTPButton, PTPLoading } from '../../components';
import { colors } from '../../theme/colors';
import { spacing, borderRadius, shadows } from '../../theme/spacing';

type SessionDetailRouteProp = RouteProp<TrainerStackParamList, 'SessionDetail'>;
type SessionDetailNavigationProp = NativeStackNavigationProp<TrainerStackParamList>;

/**
 * SessionDetailScreen - View and manage a training session
 */
const SessionDetailScreen: React.FC = () => {
  const navigation = useNavigation<SessionDetailNavigationProp>();
  const route = useRoute<SessionDetailRouteProp>();
  const { sessionId } = route.params;

  const [session, setSession] = useState<TrainingSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);

  useEffect(() => {
    loadSession();
  }, [sessionId]);

  const loadSession = async () => {
    try {
      const data = await getSession(sessionId);
      setSession(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load session details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = async () => {
    setIsActionLoading(true);
    try {
      await respondToSessionRequest(sessionId, 'accepted');
      Alert.alert('Success', 'Session accepted! The parent will be notified.');
      loadSession();
    } catch (error) {
      Alert.alert('Error', 'Failed to accept session');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDecline = () => {
    Alert.alert(
      'Decline Session',
      'Are you sure you want to decline this session request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            setIsActionLoading(true);
            try {
              await respondToSessionRequest(sessionId, 'declined', 'Unable to accommodate this time');
              Alert.alert('Session Declined', 'The parent will be notified.');
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', 'Failed to decline session');
            } finally {
              setIsActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleComplete = () => {
    Alert.alert(
      'Complete Session',
      'Mark this session as completed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: async () => {
            setIsActionLoading(true);
            try {
              await completeSession(sessionId);
              Alert.alert('Success', 'Session marked as complete!');
              loadSession();
            } catch (error) {
              Alert.alert('Error', 'Failed to complete session');
            } finally {
              setIsActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Session',
      'Are you sure you want to cancel this session? The parent will be notified.',
      [
        { text: 'Keep Session', style: 'cancel' },
        {
          text: 'Cancel Session',
          style: 'destructive',
          onPress: async () => {
            setIsActionLoading(true);
            try {
              await cancelSession(sessionId, 'Cancelled by trainer');
              Alert.alert('Session Cancelled', 'The parent has been notified.');
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel session');
            } finally {
              setIsActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleContactParent = () => {
    if (session?.child) {
      navigation.navigate('ConversationDetail', { conversationId: session.id });
    }
  };

  const handleOpenMaps = () => {
    if (session?.address) {
      const url = `https://maps.google.com/?q=${encodeURIComponent(session.address)}`;
      Linking.openURL(url);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (startTime: string, endTime: string) => {
    return `${startTime} - ${endTime}`;
  };

  if (isLoading) {
    return <PTPLoading message="Loading session..." />;
  }

  if (!session) {
    return (
      <View style={styles.errorContainer}>
        <PTPText variant="sectionTitle">Session Not Found</PTPText>
        <PTPButton title="Go Back" onPress={() => navigation.goBack()} />
      </View>
    );
  }

  const isPending = session.status === 'pending';
  const isConfirmed = session.status === 'confirmed';
  const isCompleted = session.status === 'completed';

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Banner */}
        <View style={[styles.statusBanner, styles[`status_${session.status}`]]}>
          <PTPText variant="label" color="white">
            {session.status.toUpperCase()}
          </PTPText>
        </View>

        {/* Date & Time */}
        <View style={styles.section}>
          <View style={styles.card}>
            <View style={styles.cardRow}>
              <Ionicons name="calendar" size={24} color={colors.primary} />
              <View style={styles.cardContent}>
                <PTPText variant="buttonMedium">{formatDate(session.date)}</PTPText>
                <PTPText variant="body" color="gray500">
                  {formatTime(session.startTime, session.endTime)} ({session.duration} min)
                </PTPText>
              </View>
            </View>
          </View>
        </View>

        {/* Player Info */}
        <View style={styles.section}>
          <PTPText variant="label" color="gray500" style={styles.sectionTitle}>
            PLAYER
          </PTPText>
          <View style={styles.card}>
            <View style={styles.cardRow}>
              <View style={styles.playerAvatar}>
                <PTPText color="white" weight="semiBold">
                  {session.child?.firstName?.[0] || 'P'}
                </PTPText>
              </View>
              <View style={styles.cardContent}>
                <PTPText variant="buttonMedium">
                  {session.child?.firstName || 'Player'}
                </PTPText>
                <PTPText variant="caption" color="gray500">
                  {session.child?.ageBand} | {session.child?.skillLevel} | {session.child?.position || 'No position'}
                </PTPText>
              </View>
            </View>
            {session.notes && (
              <View style={styles.notesSection}>
                <PTPText variant="label" color="gray500">Parent Notes:</PTPText>
                <PTPText variant="body" color="gray600" style={styles.notesText}>
                  {session.notes}
                </PTPText>
              </View>
            )}
          </View>
        </View>

        {/* Location */}
        <View style={styles.section}>
          <PTPText variant="label" color="gray500" style={styles.sectionTitle}>
            LOCATION
          </PTPText>
          <TouchableOpacity style={styles.card} onPress={handleOpenMaps}>
            <View style={styles.cardRow}>
              <Ionicons name="location" size={24} color={colors.primary} />
              <View style={styles.cardContent}>
                <PTPText variant="buttonMedium">{session.location}</PTPText>
                {session.address && (
                  <PTPText variant="caption" color="gray500">{session.address}</PTPText>
                )}
                <PTPText variant="caption" color="primary">
                  Open in Maps
                </PTPText>
              </View>
              <Ionicons name="open-outline" size={20} color={colors.gray400} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Focus Areas */}
        {session.focus && session.focus.length > 0 && (
          <View style={styles.section}>
            <PTPText variant="label" color="gray500" style={styles.sectionTitle}>
              FOCUS AREAS
            </PTPText>
            <View style={styles.card}>
              <View style={styles.focusTags}>
                {session.focus.map((area) => (
                  <View key={area} style={styles.focusTag}>
                    <PTPText variant="caption" color="primary">
                      {area.replace('-', ' ')}
                    </PTPText>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Earnings */}
        <View style={styles.section}>
          <PTPText variant="label" color="gray500" style={styles.sectionTitle}>
            EARNINGS
          </PTPText>
          <View style={styles.card}>
            <View style={styles.earningsRow}>
              <PTPText variant="body" color="gray600">Session Rate</PTPText>
              <PTPText variant="sectionTitle">${session.price || 80}</PTPText>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          {isPending && (
            <>
              <PTPButton
                title="Accept Session"
                onPress={handleAccept}
                loading={isActionLoading}
                fullWidth
              />
              <PTPButton
                title="Decline"
                variant="outline"
                onPress={handleDecline}
                fullWidth
                style={styles.secondaryButton}
              />
            </>
          )}

          {isConfirmed && (
            <>
              <PTPButton
                title="Mark Complete"
                onPress={handleComplete}
                loading={isActionLoading}
                fullWidth
              />
              <PTPButton
                title="Message Parent"
                variant="outline"
                onPress={handleContactParent}
                fullWidth
                style={styles.secondaryButton}
              />
              <TouchableOpacity style={styles.cancelLink} onPress={handleCancel}>
                <PTPText variant="label" color="error">Cancel Session</PTPText>
              </TouchableOpacity>
            </>
          )}

          {isCompleted && (
            <View style={styles.completedMessage}>
              <Ionicons name="checkmark-circle" size={48} color={colors.success} />
              <PTPText variant="body" color="gray500" center style={styles.completedText}>
                This session has been completed
              </PTPText>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.offWhite,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing[8],
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[4],
  },
  statusBanner: {
    paddingVertical: spacing[2],
    alignItems: 'center',
  },
  status_pending: {
    backgroundColor: colors.warning,
  },
  status_confirmed: {
    backgroundColor: colors.success,
  },
  status_completed: {
    backgroundColor: colors.gray500,
  },
  status_cancelled: {
    backgroundColor: colors.error,
  },
  section: {
    paddingHorizontal: spacing[4],
    marginTop: spacing[5],
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
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardContent: {
    flex: 1,
    marginLeft: spacing[3],
  },
  playerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.inkBlack,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notesSection: {
    marginTop: spacing[4],
    paddingTop: spacing[4],
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
  },
  notesText: {
    marginTop: spacing[1],
  },
  focusTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  focusTag: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
  },
  earningsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actions: {
    paddingHorizontal: spacing[4],
    marginTop: spacing[6],
  },
  secondaryButton: {
    marginTop: spacing[3],
  },
  cancelLink: {
    alignItems: 'center',
    paddingVertical: spacing[4],
    marginTop: spacing[2],
  },
  completedMessage: {
    alignItems: 'center',
    paddingVertical: spacing[4],
  },
  completedText: {
    marginTop: spacing[2],
  },
});

export default SessionDetailScreen;
