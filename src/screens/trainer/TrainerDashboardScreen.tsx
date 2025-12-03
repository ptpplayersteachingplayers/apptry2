/**
 * Trainer Dashboard Screen
 *
 * Overview of today's sessions, quick stats, and actions.
 */

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTrainerUser } from '../../hooks/useAuth';
import { getTrainerSessions, getTrainerStats, getTrainerEarnings } from '../../api/training';
import { TrainingSession, TrainerStats, TrainerEarnings } from '../../types';
import { PTPText, PTPButton, PTPTag, PTPListSkeleton } from '../../components';
import { colors } from '../../theme/colors';
import { spacing, borderRadius, shadows } from '../../theme/spacing';

const TrainerDashboardScreen: React.FC = () => {
  const navigation = useNavigation();
  const trainerUser = useTrainerUser();

  const [todaySessions, setTodaySessions] = useState<TrainingSession[]>([]);
  const [stats, setStats] = useState<TrainerStats | null>(null);
  const [earnings, setEarnings] = useState<TrainerEarnings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [sessions, statsData, earningsData] = await Promise.all([
        getTrainerSessions('confirmed'),
        getTrainerStats(),
        getTrainerEarnings(),
      ]);
      // Filter for today's sessions
      const today = new Date().toISOString().split('T')[0];
      setTodaySessions(sessions.filter(s => s.date === today));
      setStats(statsData);
      setEarnings(earningsData);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally { setIsLoading(false); }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <PTPText variant="heroTitle">Dashboard</PTPText>
        </View>
        <PTPListSkeleton count={3} style={{ padding: spacing[4] }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <PTPText variant="heroTitle">Hey {trainerUser?.firstName}! 👋</PTPText>
          <PTPText variant="body" color="gray500">Here's your day at a glance.</PTPText>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <PTPText variant="heroTitle" color="primary">{stats?.thisWeekSessions || 0}</PTPText>
            <PTPText variant="caption" color="gray500">This Week</PTPText>
          </View>
          <View style={styles.statCard}>
            <PTPText variant="heroTitle" color="primary">{stats?.thisMonthSessions || 0}</PTPText>
            <PTPText variant="caption" color="gray500">This Month</PTPText>
          </View>
          <View style={styles.statCard}>
            <PTPText variant="heroTitle" color="primary">{stats?.averageRating?.toFixed(1) || '-'}</PTPText>
            <PTPText variant="caption" color="gray500">Rating</PTPText>
          </View>
        </View>

        {/* Earnings Card */}
        <View style={styles.earningsCard}>
          <View style={styles.earningsHeader}>
            <PTPText variant="sectionTitle">Earnings</PTPText>
            <TouchableOpacity>
              <PTPText variant="label" color="primary">View Details →</PTPText>
            </TouchableOpacity>
          </View>
          <View style={styles.earningsRow}>
            <View>
              <PTPText variant="caption" color="gray500">This Month</PTPText>
              <PTPText variant="heroTitle" color="success">${earnings?.thisMonth || 0}</PTPText>
            </View>
            <View>
              <PTPText variant="caption" color="gray500">Pending</PTPText>
              <PTPText variant="sectionTitle">${earnings?.pendingPayout || 0}</PTPText>
            </View>
          </View>
        </View>

        {/* Today's Sessions */}
        <View style={styles.section}>
          <PTPText variant="sectionTitle" style={styles.sectionTitle}>Today's Sessions</PTPText>
          {todaySessions.length === 0 ? (
            <View style={styles.emptyCard}>
              <PTPText variant="body" color="gray500" center>No sessions scheduled for today.</PTPText>
            </View>
          ) : (
            todaySessions.map((session) => (
              <View key={session.id} style={styles.sessionCard}>
                <View style={styles.sessionTime}>
                  <PTPText variant="label" color="primary">{session.startTime}</PTPText>
                  <PTPText variant="caption" color="gray400">{session.endTime}</PTPText>
                </View>
                <View style={styles.sessionInfo}>
                  <PTPText variant="buttonMedium">{session.child?.firstName || 'Player'}</PTPText>
                  <PTPText variant="bodySmall" color="gray500">{session.location}</PTPText>
                  <View style={styles.sessionTags}>
                    {session.focus.slice(0, 2).map(f => (
                      <PTPTag key={f} label={f} size="small" />
                    ))}
                  </View>
                </View>
                <PTPTag label={session.status} variant={session.status === 'confirmed' ? 'success' : 'warning'} size="small" />
              </View>
            ))
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('TrainerSchedule' as never)}>
            <PTPText style={{ fontSize: 24 }}>📅</PTPText>
            <PTPText variant="label">Schedule</PTPText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('TrainerMessages' as never)}>
            <PTPText style={{ fontSize: 24 }}>💬</PTPText>
            <PTPText variant="label">Messages</PTPText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('TrainerStudents' as never)}>
            <PTPText style={{ fontSize: 24 }}>👥</PTPText>
            <PTPText variant="label">Students</PTPText>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.offWhite },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: spacing[8] },
  header: { padding: spacing[4], paddingBottom: spacing[2] },
  statsRow: { flexDirection: 'row', paddingHorizontal: spacing[4], gap: spacing[3], marginTop: spacing[4] },
  statCard: { flex: 1, backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing[4], alignItems: 'center', ...shadows.sm },
  earningsCard: { margin: spacing[4], backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing[4], ...shadows.sm },
  earningsHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing[3] },
  earningsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  section: { paddingHorizontal: spacing[4], marginTop: spacing[4] },
  sectionTitle: { marginBottom: spacing[3] },
  emptyCard: { backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing[6], ...shadows.sm },
  sessionCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing[4], marginBottom: spacing[3], ...shadows.sm },
  sessionTime: { marginRight: spacing[4], alignItems: 'center' },
  sessionInfo: { flex: 1 },
  sessionTags: { flexDirection: 'row', gap: spacing[1], marginTop: spacing[2] },
  actionsRow: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: spacing[4], marginTop: spacing[6] },
  actionButton: { alignItems: 'center', backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing[4], width: 100, ...shadows.sm },
});

export default TrainerDashboardScreen;
