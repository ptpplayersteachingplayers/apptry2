/**
 * Trainer Dashboard Screen
 *
 * Overview of today's sessions, quick stats, and actions.
 */

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTrainerUser } from '../../hooks/useAuth';
import { getTrainerSessions, getTrainerStats, getTrainerEarnings } from '../../api/training';
import { TrainingSession, TrainerStats, TrainerEarnings } from '../../types';
import { PTPText, PTPButton, PTPTag, PTPListSkeleton } from '../../components';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

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
          <PTPText variant="heroTitle">HEY {trainerUser?.firstName?.toUpperCase()}!</PTPText>
          <PTPText variant="body" color="gray300">Here's your day at a glance.</PTPText>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <PTPText variant="heroTitle" color="primary">{stats?.thisWeekSessions || 0}</PTPText>
            <PTPText variant="caption" color="gray300">THIS WEEK</PTPText>
          </View>
          <View style={styles.statCard}>
            <PTPText variant="heroTitle" color="primary">{stats?.thisMonthSessions || 0}</PTPText>
            <PTPText variant="caption" color="gray300">THIS MONTH</PTPText>
          </View>
          <View style={styles.statCard}>
            <PTPText variant="heroTitle" color="primary">{stats?.averageRating?.toFixed(1) || '-'}</PTPText>
            <PTPText variant="caption" color="gray300">RATING</PTPText>
          </View>
        </View>

        {/* Earnings Card */}
        <View style={styles.earningsCard}>
          <View style={styles.earningsHeader}>
            <PTPText variant="sectionTitle">EARNINGS</PTPText>
            <TouchableOpacity>
              <PTPText variant="label" color="primary">VIEW DETAILS →</PTPText>
            </TouchableOpacity>
          </View>
          <View style={styles.earningsRow}>
            <View>
              <PTPText variant="caption" color="gray300">This Month</PTPText>
              <PTPText variant="heroTitle" color="success">${earnings?.thisMonth || 0}</PTPText>
            </View>
            <View>
              <PTPText variant="caption" color="gray300">Pending</PTPText>
              <PTPText variant="sectionTitle">${earnings?.pendingPayout || 0}</PTPText>
            </View>
          </View>
        </View>

        {/* Today's Sessions */}
        <View style={styles.section}>
          <PTPText variant="sectionTitle" style={styles.sectionTitle}>TODAY'S SESSIONS</PTPText>
          {todaySessions.length === 0 ? (
            <View style={styles.emptyCard}>
              <PTPText variant="body" color="gray300" center>No sessions scheduled for today.</PTPText>
            </View>
          ) : (
            todaySessions.map((session) => (
              <View key={session.id} style={styles.sessionCard}>
                <View style={styles.sessionTime}>
                  <PTPText variant="label" color="primary">{session.startTime}</PTPText>
                  <PTPText variant="caption" color="gray500">{session.endTime}</PTPText>
                </View>
                <View style={styles.sessionInfo}>
                  <PTPText variant="buttonMedium">{session.child?.firstName?.toUpperCase() || 'PLAYER'}</PTPText>
                  <PTPText variant="bodySmall" color="gray300">{session.location}</PTPText>
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
            <Ionicons name="calendar-outline" size={24} color={colors.black} />
            <PTPText variant="label">SCHEDULE</PTPText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('TrainerMessages' as never)}>
            <Ionicons name="chatbubbles-outline" size={24} color={colors.black} />
            <PTPText variant="label">MESSAGES</PTPText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('TrainerStudents' as never)}>
            <Ionicons name="people-outline" size={24} color={colors.black} />
            <PTPText variant="label">STUDENTS</PTPText>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.black },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: spacing[8] },
  header: { padding: spacing[4], paddingBottom: spacing[2] },
  statsRow: { flexDirection: 'row', paddingHorizontal: spacing[4], gap: spacing[3], marginTop: spacing[4] },
  statCard: { flex: 1, backgroundColor: colors.blackCard, borderRadius: 0, borderWidth: 2, borderColor: colors.gray700, padding: spacing[4], alignItems: 'center' },
  earningsCard: { margin: spacing[4], backgroundColor: colors.blackCard, borderRadius: 0, borderWidth: 2, borderColor: colors.gray700, padding: spacing[4] },
  earningsHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing[3] },
  earningsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  section: { paddingHorizontal: spacing[4], marginTop: spacing[4] },
  sectionTitle: { marginBottom: spacing[3] },
  emptyCard: { backgroundColor: colors.blackCard, borderRadius: 0, borderWidth: 2, borderColor: colors.gray700, padding: spacing[6] },
  sessionCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.blackCard, borderRadius: 0, borderWidth: 2, borderColor: colors.gray700, padding: spacing[4], marginBottom: spacing[3] },
  sessionTime: { marginRight: spacing[4], alignItems: 'center' },
  sessionInfo: { flex: 1 },
  sessionTags: { flexDirection: 'row', gap: spacing[1], marginTop: spacing[2] },
  actionsRow: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: spacing[4], marginTop: spacing[6] },
  actionButton: { alignItems: 'center', backgroundColor: colors.primary, borderRadius: 0, padding: spacing[4], width: 100 },
});

export default TrainerDashboardScreen;
