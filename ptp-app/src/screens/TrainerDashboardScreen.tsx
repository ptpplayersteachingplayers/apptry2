import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { TrainerDashboard, sessionStatusColors } from '../types/training';

interface TrainerSession {
  session_id: string;
  session_date: string;
  start_time: string;
  end_time: string;
  status: string;
  price_cents: number;
  location_name: string;
  child_first_name: string | null;
  child_last_name: string | null;
  parent_name: string;
  parent_phone: string | null;
}

export default function TrainerDashboardScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [dashboard, setDashboard] = useState<TrainerDashboard | null>(null);
  const [todaySessions, setTodaySessions] = useState<TrainerSession[]>([]);
  const [pendingRequests, setPendingRequests] = useState<TrainerSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchDashboard = useCallback(async () => {
    if (!user) return;

    try {
      // Get trainer's dashboard stats
      const { data: dashData, error: dashError } = await supabase.rpc(
        'get_trainer_dashboard'
      );

      if (dashError) throw dashError;
      setDashboard(dashData);

      // Get today's sessions
      const today = new Date().toISOString().split('T')[0];
      const { data: sessionsData } = await supabase
        .from('trainer_session_dashboard')
        .select('*')
        .eq('session_date', today)
        .eq('status', 'confirmed')
        .order('start_time');

      setTodaySessions(sessionsData || []);

      // Get pending requests
      const { data: pendingData } = await supabase
        .from('trainer_session_dashboard')
        .select('*')
        .in('status', ['requested', 'pending'])
        .order('created_at', { ascending: false });

      setPendingRequests(pendingData || []);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchDashboard();
  };

  const handleRespondToRequest = async (
    sessionId: string,
    action: 'confirm' | 'decline'
  ) => {
    const actionLabel = action === 'confirm' ? 'accept' : 'decline';

    Alert.alert(
      `${action === 'confirm' ? 'Accept' : 'Decline'} Request`,
      `Are you sure you want to ${actionLabel} this session request?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: action === 'confirm' ? 'Accept' : 'Decline',
          style: action === 'confirm' ? 'default' : 'destructive',
          onPress: async () => {
            try {
              const { data, error } = await supabase.rpc('respond_to_session', {
                p_session_id: sessionId,
                p_action: action,
              });

              if (error) throw error;

              const result = data as { success: boolean; message: string };
              if (result.success) {
                Alert.alert('Success', result.message);
                fetchDashboard();
              } else {
                throw new Error(result.message);
              }
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to respond');
            }
          },
        },
      ]
    );
  };

  const handleCompleteSession = async (sessionId: string) => {
    Alert.alert('Complete Session', 'Mark this session as completed?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Complete',
        onPress: async () => {
          try {
            const { data, error } = await supabase.rpc('complete_session', {
              p_session_id: sessionId,
            });

            if (error) throw error;

            const result = data as { success: boolean; message: string };
            if (result.success) {
              Alert.alert('Success', result.message);
              fetchDashboard();
            } else {
              throw new Error(result.message);
            }
          } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to complete session');
          }
        },
      },
    ]);
  };

  const formatTime = (timeStr: string): string => {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1a365d" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Stats Cards */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{dashboard?.today_sessions || 0}</Text>
          <Text style={styles.statLabel}>Today</Text>
        </View>
        <View style={[styles.statCard, styles.pendingCard]}>
          <Text style={styles.statValue}>{dashboard?.pending_requests || 0}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{dashboard?.week_sessions || 0}</Text>
          <Text style={styles.statLabel}>This Week</Text>
        </View>
        <View style={[styles.statCard, styles.earningsCard]}>
          <Text style={styles.statValueSmall}>
            ${((dashboard?.month_earnings || 0) / 100).toFixed(0)}
          </Text>
          <Text style={styles.statLabel}>This Month</Text>
        </View>
      </View>

      {/* Next Session */}
      {dashboard?.next_session && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Next Session</Text>
          <View style={styles.nextSessionCard}>
            <View style={styles.nextSessionInfo}>
              <Text style={styles.nextSessionPlayer}>
                {dashboard.next_session.child_first_name}{' '}
                {dashboard.next_session.child_last_name}
              </Text>
              <View style={styles.nextSessionDetails}>
                <Ionicons name="calendar" size={14} color="#6b7280" />
                <Text style={styles.nextSessionText}>
                  {formatDate(dashboard.next_session.session_date)}
                </Text>
              </View>
              <View style={styles.nextSessionDetails}>
                <Ionicons name="time" size={14} color="#6b7280" />
                <Text style={styles.nextSessionText}>
                  {formatTime(dashboard.next_session.start_time)}
                </Text>
              </View>
              <View style={styles.nextSessionDetails}>
                <Ionicons name="location" size={14} color="#6b7280" />
                <Text style={styles.nextSessionText}>
                  {dashboard.next_session.location_name}
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Pending Requests ({pendingRequests.length})
          </Text>
          {pendingRequests.map((request) => (
            <View key={request.session_id} style={styles.requestCard}>
              <View style={styles.requestInfo}>
                <Text style={styles.requestPlayer}>
                  {request.child_first_name
                    ? `${request.child_first_name} ${request.child_last_name}`
                    : request.parent_name}
                </Text>
                <Text style={styles.requestDate}>
                  {formatDate(request.session_date)} at{' '}
                  {formatTime(request.start_time)}
                </Text>
                <Text style={styles.requestLocation}>{request.location_name}</Text>
                <Text style={styles.requestPrice}>
                  ${(request.price_cents / 100).toFixed(0)}
                </Text>
              </View>
              <View style={styles.requestActions}>
                <TouchableOpacity
                  style={styles.acceptButton}
                  onPress={() =>
                    handleRespondToRequest(request.session_id, 'confirm')
                  }
                >
                  <Ionicons name="checkmark" size={20} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.declineButton}
                  onPress={() =>
                    handleRespondToRequest(request.session_id, 'decline')
                  }
                >
                  <Ionicons name="close" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Today's Sessions */}
      {todaySessions.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Sessions</Text>
          {todaySessions.map((session) => (
            <View key={session.session_id} style={styles.sessionCard}>
              <View style={styles.sessionTime}>
                <Text style={styles.sessionTimeText}>
                  {formatTime(session.start_time)}
                </Text>
              </View>
              <View style={styles.sessionInfo}>
                <Text style={styles.sessionPlayer}>
                  {session.child_first_name} {session.child_last_name}
                </Text>
                <Text style={styles.sessionLocation}>{session.location_name}</Text>
                {session.parent_phone && (
                  <Text style={styles.sessionPhone}>{session.parent_phone}</Text>
                )}
              </View>
              <TouchableOpacity
                style={styles.completeButton}
                onPress={() => handleCompleteSession(session.session_id)}
              >
                <Text style={styles.completeButtonText}>Complete</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/trainer/schedule' as any)}
          >
            <Ionicons name="calendar" size={24} color="#1a365d" />
            <Text style={styles.actionLabel}>Schedule</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/trainer/availability' as any)}
          >
            <Ionicons name="time" size={24} color="#1a365d" />
            <Text style={styles.actionLabel}>Availability</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/trainer/earnings' as any)}
          >
            <Ionicons name="wallet" size={24} color="#1a365d" />
            <Text style={styles.actionLabel}>Earnings</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/trainer/profile' as any)}
          >
            <Ionicons name="person" size={24} color="#1a365d" />
            <Text style={styles.actionLabel}>Profile</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    paddingBottom: 0,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    marginRight: '4%',
    alignItems: 'center',
  },
  pendingCard: {
    marginRight: 0,
    backgroundColor: '#fef3c7',
  },
  earningsCard: {
    marginRight: 0,
    backgroundColor: '#d1fae5',
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  statValueSmall: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  section: {
    padding: 16,
    paddingTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  nextSessionCard: {
    backgroundColor: '#1a365d',
    borderRadius: 12,
    padding: 16,
  },
  nextSessionInfo: {},
  nextSessionPlayer: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  nextSessionDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  nextSessionText: {
    fontSize: 14,
    color: '#93c5fd',
    marginLeft: 8,
  },
  requestCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  requestInfo: {
    flex: 1,
  },
  requestPlayer: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  requestDate: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  requestLocation: {
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 2,
  },
  requestPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a365d',
    marginTop: 8,
  },
  requestActions: {
    justifyContent: 'center',
  },
  acceptButton: {
    backgroundColor: '#10b981',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  declineButton: {
    backgroundColor: '#ef4444',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  sessionTime: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 12,
  },
  sessionTimeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a365d',
  },
  sessionInfo: {
    flex: 1,
  },
  sessionPlayer: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  sessionLocation: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  sessionPhone: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  completeButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  completeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  actionCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    marginRight: '4%',
    alignItems: 'center',
  },
  actionLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
  },
  bottomPadding: {
    height: 32,
  },
});
