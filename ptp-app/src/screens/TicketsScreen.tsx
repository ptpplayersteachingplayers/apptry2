import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { MyUpcomingEnrollment } from '../types/database';

export default function TicketsScreen() {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<MyUpcomingEnrollment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<MyUpcomingEnrollment | null>(null);

  const fetchEnrollments = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('my_upcoming_enrollments')
        .select('*')
        .eq('parent_id', user.id);

      if (error) throw error;
      setEnrollments(data || []);
    } catch (error) {
      console.error('Error fetching enrollments:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    fetchEnrollments();
  }, [fetchEnrollments]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchEnrollments();
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
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

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'active':
        return '#10b981';
      case 'waitlist':
        return '#f59e0b';
      case 'cancelled':
      case 'refunded':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'active':
        return 'Confirmed';
      case 'waitlist':
        return 'Waitlist';
      case 'cancelled':
        return 'Cancelled';
      case 'refunded':
        return 'Refunded';
      case 'pending':
        return 'Pending';
      default:
        return status;
    }
  };

  const renderTicket = ({ item }: { item: MyUpcomingEnrollment }) => {
    const statusColor = getStatusColor(item.enrollment_status);
    const isWinter = item.program === 'winter_clinic';

    return (
      <TouchableOpacity
        style={styles.ticketCard}
        onPress={() => setSelectedTicket(item)}
        disabled={item.enrollment_status !== 'active'}
      >
        <View style={styles.ticketHeader}>
          <View style={[styles.programBadge, { backgroundColor: isWinter ? '#3b82f6' : '#f59e0b' }]}>
            <Text style={styles.badgeText}>
              {isWinter ? 'Winter' : 'Summer'}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.badgeText}>
              {getStatusLabel(item.enrollment_status)}
            </Text>
          </View>
        </View>

        <Text style={styles.ticketTitle}>{item.event_title}</Text>

        <View style={styles.ticketChild}>
          <Ionicons name="person" size={16} color="#1a365d" />
          <Text style={styles.ticketChildName}>
            {item.child_first_name} {item.child_last_name}
          </Text>
        </View>

        <View style={styles.ticketDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={16} color="#6b7280" />
            <Text style={styles.detailText}>
              {formatDate(item.start_date)}
              {item.end_date && item.end_date !== item.start_date && ` - ${formatDate(item.end_date)}`}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={16} color="#6b7280" />
            <Text style={styles.detailText}>
              {formatTime(item.start_time)} - {formatTime(item.end_time)}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={16} color="#6b7280" />
            <Text style={styles.detailText}>
              {item.venue_name || item.market_slug}, {item.state}
            </Text>
          </View>
        </View>

        {item.enrollment_status === 'active' && (
          <View style={styles.ticketFooter}>
            <Text style={styles.viewTicketText}>Tap to view QR code</Text>
            <Ionicons name="qr-code-outline" size={20} color="#1a365d" />
          </View>
        )}

        {item.checked_in_at && (
          <View style={styles.checkedInBanner}>
            <Ionicons name="checkmark-circle" size={16} color="#10b981" />
            <Text style={styles.checkedInText}>Checked in</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1a365d" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={enrollments}
        keyExtractor={(item) => item.enrollment_id}
        renderItem={renderTicket}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="ticket-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyTitle}>No upcoming registrations</Text>
            <Text style={styles.emptyText}>
              Browse events to register your children
            </Text>
          </View>
        }
      />

      {/* QR Code Modal */}
      <Modal
        visible={!!selectedTicket}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedTicket(null)}
      >
        {selectedTicket && (
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setSelectedTicket(null)}>
                <Text style={styles.closeText}>Close</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Check-in Ticket</Text>
              <View style={{ width: 50 }} />
            </View>

            <View style={styles.qrContainer}>
              <View style={styles.qrCard}>
                <QRCode
                  value={selectedTicket.qr_code}
                  size={200}
                  backgroundColor="#fff"
                  color="#1a365d"
                />
              </View>

              <Text style={styles.qrChildName}>
                {selectedTicket.child_first_name} {selectedTicket.child_last_name}
              </Text>

              <Text style={styles.qrEventTitle}>{selectedTicket.event_title}</Text>

              <View style={styles.qrDetails}>
                <Text style={styles.qrDetailText}>
                  {formatDate(selectedTicket.start_date)}
                </Text>
                <Text style={styles.qrDetailText}>
                  {formatTime(selectedTicket.start_time)}
                </Text>
                <Text style={styles.qrDetailText}>
                  {selectedTicket.venue_name || selectedTicket.market_slug}
                </Text>
              </View>

              <Text style={styles.qrInstructions}>
                Show this QR code to staff when you arrive
              </Text>
            </View>
          </View>
        )}
      </Modal>
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
  list: {
    padding: 16,
  },
  ticketCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  ticketHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  programBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  ticketTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  ticketChild: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  ticketChildName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a365d',
    marginLeft: 8,
  },
  ticketDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
  },
  ticketFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 12,
  },
  viewTicketText: {
    fontSize: 14,
    color: '#1a365d',
    fontWeight: '500',
  },
  checkedInBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 12,
  },
  checkedInText: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: '500',
    marginLeft: 6,
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
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1f2937',
  },
  closeText: {
    fontSize: 16,
    color: '#6b7280',
  },
  qrContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  qrCard: {
    padding: 24,
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 24,
  },
  qrChildName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  qrEventTitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 16,
    textAlign: 'center',
  },
  qrDetails: {
    alignItems: 'center',
    marginBottom: 24,
  },
  qrDetailText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  qrInstructions: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
});
