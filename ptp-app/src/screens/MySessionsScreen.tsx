import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import {
  MyTrainingSession,
  sessionStatusLabels,
  sessionStatusColors,
  focusLabels,
  TrainingFocus,
} from '../types/training';

type FilterStatus = 'all' | 'upcoming' | 'past' | 'pending';

export default function MySessionsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [sessions, setSessions] = useState<MyTrainingSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterStatus>('upcoming');

  const fetchSessions = useCallback(async () => {
    if (!user) return;

    try {
      let query = supabase
        .from('my_training_sessions')
        .select('*')
        .eq('parent_id', user.id);

      const today = new Date().toISOString().split('T')[0];

      if (filter === 'upcoming') {
        query = query
          .gte('session_date', today)
          .in('status', ['confirmed', 'requested', 'pending'])
          .order('session_date', { ascending: true });
      } else if (filter === 'past') {
        query = query
          .or(`session_date.lt.${today},status.eq.completed`)
          .order('session_date', { ascending: false });
      } else if (filter === 'pending') {
        query = query
          .in('status', ['requested', 'pending'])
          .order('created_at', { ascending: false });
      } else {
        query = query.order('session_date', { ascending: false });
      }

      const { data, error } = await query;

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user, filter]);

  useEffect(() => {
    setIsLoading(true);
    fetchSessions();
  }, [fetchSessions]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchSessions();
  };

  const handleCancelSession = async (session: MyTrainingSession) => {
    Alert.alert(
      'Cancel Session',
      'Are you sure you want to cancel this session request?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('training_sessions')
                .update({
                  status: 'cancelled',
                  cancelled_at: new Date().toISOString(),
                })
                .eq('id', session.session_id)
                .eq('parent_id', user?.id);

              if (error) throw error;
              fetchSessions();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to cancel session');
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (timeStr: string): string => {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const renderSession = ({ item }: { item: MyTrainingSession }) => {
    const statusColor = sessionStatusColors[item.status];
    const canCancel = ['requested', 'pending'].includes(item.status);
    const canReview = item.status === 'completed' && !item.trainer_notes;

    return (
      <TouchableOpacity
        style={styles.sessionCard}
        onPress={() => router.push(`/session/${item.session_id}` as any)}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>
              {sessionStatusLabels[item.status]}
            </Text>
          </View>
          {!item.is_paid && item.status === 'confirmed' && (
            <View style={styles.unpaidBadge}>
              <Text style={styles.unpaidText}>Payment Due</Text>
            </View>
          )}
        </View>

        <View style={styles.sessionInfo}>
          <View style={styles.trainerRow}>
            {item.trainer_headshot ? (
              <Image
                source={{ uri: item.trainer_headshot }}
                style={styles.trainerImage}
              />
            ) : (
              <View style={styles.trainerImagePlaceholder}>
                <Text style={styles.trainerInitial}>
                  {item.trainer_first_name.charAt(0)}
                </Text>
              </View>
            )}
            <View style={styles.trainerInfo}>
              <Text style={styles.trainerName}>
                {item.trainer_first_name} {item.trainer_last_name}
              </Text>
              <Text style={styles.trainerCollege}>{item.trainer_college}</Text>
            </View>
          </View>

          <View style={styles.dateTimeRow}>
            <View style={styles.dateTime}>
              <Ionicons name="calendar-outline" size={16} color="#6b7280" />
              <Text style={styles.dateTimeText}>{formatDate(item.session_date)}</Text>
            </View>
            <View style={styles.dateTime}>
              <Ionicons name="time-outline" size={16} color="#6b7280" />
              <Text style={styles.dateTimeText}>
                {formatTime(item.start_time)} - {formatTime(item.end_time)}
              </Text>
            </View>
          </View>

          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={16} color="#6b7280" />
            <Text style={styles.locationText}>
              {item.location_name}, {item.city}
            </Text>
          </View>

          {item.child_first_name && (
            <View style={styles.childRow}>
              <Ionicons name="person-outline" size={16} color="#1a365d" />
              <Text style={styles.childText}>
                {item.child_first_name} {item.child_last_name}
              </Text>
            </View>
          )}

          {item.focus && item.focus.length > 0 && (
            <View style={styles.focusRow}>
              {item.focus.slice(0, 3).map((f: TrainingFocus) => (
                <View key={f} style={styles.focusBadge}>
                  <Text style={styles.focusText}>{focusLabels[f] || f}</Text>
                </View>
              ))}
            </View>
          )}

          {item.trainer_notes && (
            <View style={styles.notesCard}>
              <Text style={styles.notesLabel}>Trainer Notes:</Text>
              <Text style={styles.notesText} numberOfLines={2}>
                {item.trainer_notes}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.price}>${(item.price_cents / 100).toFixed(0)}</Text>
          {canCancel && (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => handleCancelSession(item)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          )}
          {canReview && (
            <TouchableOpacity
              style={styles.reviewButton}
              onPress={() => router.push(`/review-session/${item.session_id}` as any)}
            >
              <Text style={styles.reviewButtonText}>Leave Review</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Filter Tabs */}
      <View style={styles.filters}>
        {(['upcoming', 'pending', 'past', 'all'] as FilterStatus[]).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterTab, filter === f && styles.filterTabActive]}
            onPress={() => setFilter(f)}
          >
            <Text
              style={[
                styles.filterTabText,
                filter === f && styles.filterTabTextActive,
              ]}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Sessions List */}
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#1a365d" />
        </View>
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={(item) => item.session_id}
          renderItem={renderSession}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="calendar-outline" size={64} color="#d1d5db" />
              <Text style={styles.emptyTitle}>No sessions found</Text>
              <Text style={styles.emptyText}>
                {filter === 'upcoming'
                  ? 'Book a session with a trainer to get started'
                  : 'No sessions match this filter'}
              </Text>
            </View>
          }
        />
      )}
    </View>
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
  filters: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  filterTabActive: {
    backgroundColor: '#1a365d',
  },
  filterTabText: {
    fontSize: 14,
    color: '#6b7280',
  },
  filterTabTextActive: {
    color: '#fff',
    fontWeight: '500',
  },
  list: {
    padding: 16,
  },
  sessionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  unpaidBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#fef3c7',
    marginLeft: 8,
  },
  unpaidText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#d97706',
  },
  sessionInfo: {},
  trainerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  trainerImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  trainerImagePlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1a365d',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  trainerInitial: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  trainerInfo: {},
  trainerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  trainerCollege: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  dateTimeRow: {
    marginBottom: 8,
  },
  dateTime: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  dateTimeText: {
    fontSize: 14,
    color: '#4b5563',
    marginLeft: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
  },
  childRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  childText: {
    fontSize: 13,
    color: '#1a365d',
    fontWeight: '500',
    marginLeft: 6,
  },
  focusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  focusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  focusText: {
    fontSize: 12,
    color: '#6b7280',
  },
  notesCard: {
    backgroundColor: '#f9fafb',
    padding: 10,
    borderRadius: 8,
    marginTop: 4,
  },
  notesLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 13,
    color: '#4b5563',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  price: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#ef4444',
    borderRadius: 6,
  },
  cancelButtonText: {
    fontSize: 14,
    color: '#ef4444',
    fontWeight: '500',
  },
  reviewButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#1a365d',
    borderRadius: 6,
  },
  reviewButtonText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
