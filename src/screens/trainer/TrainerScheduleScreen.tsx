/**
 * Trainer Schedule Screen
 *
 * Calendar view of trainer's sessions.
 */

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getTrainerSessions, updateSessionStatus } from '../../api/training';
import { TrainingSession } from '../../types';
import { PTPText, PTPButton, PTPTag, PTPListSkeleton, PTPEmptyState } from '../../components';
import { colors } from '../../theme/colors';
import { spacing, borderRadius, shadows } from '../../theme/spacing';

const TrainerScheduleScreen: React.FC = () => {
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => { loadSessions(); }, []);

  const loadSessions = async () => {
    try {
      const data = await getTrainerSessions();
      setSessions(data);
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally { setIsLoading(false); }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadSessions();
    setIsRefreshing(false);
  };

  const handleUpdateStatus = async (sessionId: number, status: 'confirmed' | 'completed' | 'cancelled') => {
    try {
      await updateSessionStatus(sessionId, status);
      loadSessions();
    } catch (error) {
      console.error('Error updating session:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  // Group sessions by date
  const groupedSessions = sessions.reduce((acc, session) => {
    if (!acc[session.date]) acc[session.date] = [];
    acc[session.date].push(session);
    return acc;
  }, {} as Record<string, TrainingSession[]>);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}><PTPText variant="heroTitle">My Schedule</PTPText></View>
        <PTPListSkeleton count={4} style={{ padding: spacing[4] }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <PTPText variant="heroTitle">My Schedule</PTPText>
        <PTPText variant="body" color="gray500">Manage your training sessions</PTPText>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
      >
        {sessions.length === 0 ? (
          <PTPEmptyState icon="📅" title="No sessions scheduled" description="When parents request sessions with you, they'll appear here." />
        ) : (
          Object.entries(groupedSessions).sort().map(([date, daySessions]) => (
            <View key={date} style={styles.dateGroup}>
              <PTPText variant="label" color="gray500" style={styles.dateHeader}>{formatDate(date).toUpperCase()}</PTPText>
              {daySessions.map((session) => (
                <View key={session.id} style={styles.sessionCard}>
                  <View style={styles.sessionHeader}>
                    <View>
                      <PTPText variant="buttonMedium">{session.child?.firstName || 'Player'}</PTPText>
                      <PTPText variant="caption" color="gray500">{session.startTime} - {session.endTime}</PTPText>
                    </View>
                    <PTPTag label={session.status} variant={session.status === 'confirmed' ? 'success' : session.status === 'pending' ? 'warning' : 'default'} size="small" />
                  </View>
                  <PTPText variant="bodySmall" color="gray500" style={styles.location}>📍 {session.location}</PTPText>
                  <View style={styles.focusTags}>
                    {session.focus.map(f => <PTPTag key={f} label={f} size="small" />)}
                  </View>
                  {session.playerNotes && (
                    <View style={styles.notes}>
                      <PTPText variant="caption" color="gray500">Player notes: {session.playerNotes}</PTPText>
                    </View>
                  )}
                  {session.status === 'pending' && (
                    <View style={styles.actions}>
                      <PTPButton title="Confirm" variant="primary" size="small" onPress={() => handleUpdateStatus(session.id, 'confirmed')} />
                      <PTPButton title="Decline" variant="outline" size="small" onPress={() => handleUpdateStatus(session.id, 'cancelled')} style={{ marginLeft: spacing[2] }} />
                    </View>
                  )}
                  {session.status === 'confirmed' && (
                    <View style={styles.actions}>
                      <PTPButton title="Mark Complete" variant="secondary" size="small" onPress={() => handleUpdateStatus(session.id, 'completed')} />
                    </View>
                  )}
                </View>
              ))}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.offWhite },
  header: { padding: spacing[4] },
  scrollView: { flex: 1 },
  scrollContent: { padding: spacing[4], paddingTop: 0, paddingBottom: spacing[8] },
  dateGroup: { marginBottom: spacing[4] },
  dateHeader: { marginBottom: spacing[2] },
  sessionCard: { backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing[4], marginBottom: spacing[3], ...shadows.sm },
  sessionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  location: { marginTop: spacing[2] },
  focusTags: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[1], marginTop: spacing[2] },
  notes: { marginTop: spacing[2], padding: spacing[2], backgroundColor: colors.gray50, borderRadius: borderRadius.sm },
  actions: { flexDirection: 'row', marginTop: spacing[3] },
});

export default TrainerScheduleScreen;
