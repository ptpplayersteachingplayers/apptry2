import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Event, EventRosterEntry, CheckInResult } from '../types/database';

export default function StaffCheckinScreen() {
  const { staffMember } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();

  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [roster, setRoster] = useState<EventRosterEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch today's events for staff
  const fetchEvents = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .lte('start_date', today)
        .gte('end_date', today)
        .order('start_time');

      // Also include events starting today even if no end date
      const { data: singleDayEvents } = await supabase
        .from('events')
        .select('*')
        .eq('start_date', today)
        .is('end_date', null);

      const allEvents = [...(data || []), ...(singleDayEvents || [])];
      const uniqueEvents = Array.from(
        new Map(allEvents.map((e) => [e.id, e])).values()
      );

      setEvents(uniqueEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch roster for selected event
  const fetchRoster = useCallback(async () => {
    if (!selectedEvent) return;

    try {
      const { data, error } = await supabase.rpc('get_event_roster', {
        p_event_id: selectedEvent.id,
      });

      if (error) throw error;
      setRoster(data || []);
    } catch (error) {
      console.error('Error fetching roster:', error);
      Alert.alert('Error', 'Failed to load roster');
    } finally {
      setIsRefreshing(false);
    }
  }, [selectedEvent]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    if (selectedEvent) {
      setIsRefreshing(true);
      fetchRoster();
    }
  }, [selectedEvent, fetchRoster]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchRoster();
  };

  const handleQRScanned = async ({ data }: { data: string }) => {
    if (isProcessing) return;

    setIsProcessing(true);
    setShowScanner(false);

    try {
      const { data: result, error } = await supabase.rpc('check_in_by_qr', {
        p_qr_code: data,
      });

      if (error) throw error;

      const checkInResult = result as CheckInResult;

      if (checkInResult.success) {
        Alert.alert(
          'Check-in Successful',
          `${checkInResult.child_name} has been checked in.`,
          [{ text: 'OK', onPress: () => fetchRoster() }]
        );
      } else {
        Alert.alert('Check-in Failed', checkInResult.error || 'Unknown error');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to process check-in');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualCheckIn = async (entry: EventRosterEntry) => {
    if (entry.checked_in_at) {
      Alert.alert('Already Checked In', 'This participant has already been checked in.');
      return;
    }

    Alert.alert(
      'Confirm Check-in',
      `Check in ${entry.child_first_name} ${entry.child_last_name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Check In',
          onPress: async () => {
            try {
              const { data, error } = await supabase.rpc('check_in_by_qr', {
                p_qr_code: entry.qr_code,
              });

              if (error) throw error;

              const result = data as CheckInResult;
              if (result.success) {
                fetchRoster();
              } else {
                Alert.alert('Error', result.error || 'Failed to check in');
              }
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  const filteredRoster = roster.filter((entry) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      entry.child_first_name.toLowerCase().includes(query) ||
      entry.child_last_name.toLowerCase().includes(query) ||
      entry.parent_name?.toLowerCase().includes(query)
    );
  });

  const checkedInCount = roster.filter((r) => r.checked_in_at).length;

  // Event selection view
  if (!selectedEvent) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Today's Events</Text>
          <Text style={styles.headerSubtitle}>Select an event to manage check-ins</Text>
        </View>

        {isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#1a365d" />
          </View>
        ) : events.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="calendar-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyTitle}>No events today</Text>
            <Text style={styles.emptyText}>Check back when there are scheduled events</Text>
          </View>
        ) : (
          <FlatList
            data={events}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.eventCard}
                onPress={() => setSelectedEvent(item)}
              >
                <Text style={styles.eventTitle}>{item.title}</Text>
                <View style={styles.eventDetails}>
                  <Text style={styles.eventTime}>
                    {item.start_time} - {item.end_time}
                  </Text>
                  <Text style={styles.eventLocation}>
                    {item.venue_name || item.market_slug}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.list}
          />
        )}
      </View>
    );
  }

  // Scanner view
  if (showScanner) {
    if (!permission?.granted) {
      return (
        <View style={styles.centered}>
          <Text style={styles.permissionText}>Camera permission required</Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setShowScanner(false)}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.scannerContainer}>
        <CameraView
          style={styles.camera}
          facing="back"
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
          onBarcodeScanned={handleQRScanned}
        />
        <View style={styles.scannerOverlay}>
          <View style={styles.scannerFrame} />
          <Text style={styles.scannerText}>Scan participant QR code</Text>
        </View>
        <TouchableOpacity
          style={styles.closeScannerButton}
          onPress={() => setShowScanner(false)}
        >
          <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>
      </View>
    );
  }

  // Roster view
  return (
    <View style={styles.container}>
      <View style={styles.rosterHeader}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setSelectedEvent(null)}
        >
          <Ionicons name="arrow-back" size={24} color="#1a365d" />
        </TouchableOpacity>
        <View style={styles.rosterHeaderText}>
          <Text style={styles.rosterTitle} numberOfLines={1}>
            {selectedEvent.title}
          </Text>
          <Text style={styles.rosterStats}>
            {checkedInCount} / {roster.length} checked in
          </Text>
        </View>
        <TouchableOpacity
          style={styles.scanButton}
          onPress={() => setShowScanner(true)}
        >
          <Ionicons name="qr-code" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#9ca3af" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name..."
          placeholderTextColor="#9ca3af"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#9ca3af" />
          </TouchableOpacity>
        ) : null}
      </View>

      <FlatList
        data={filteredRoster}
        keyExtractor={(item) => item.enrollment_id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.rosterItem,
              item.checked_in_at && styles.rosterItemCheckedIn,
            ]}
            onPress={() => handleManualCheckIn(item)}
          >
            <View style={styles.rosterItemContent}>
              <Text style={styles.rosterChildName}>
                {item.child_first_name} {item.child_last_name}
              </Text>
              {item.child_age && (
                <Text style={styles.rosterChildAge}>Age {item.child_age}</Text>
              )}
              <Text style={styles.rosterParentInfo}>
                {item.parent_name} • {item.parent_phone || item.parent_email}
              </Text>
            </View>
            <View style={styles.rosterItemStatus}>
              {item.checked_in_at ? (
                <View style={styles.checkedInBadge}>
                  <Ionicons name="checkmark-circle" size={24} color="#10b981" />
                  <Text style={styles.checkedInTime}>
                    {new Date(item.checked_in_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
              ) : (
                <Ionicons name="ellipse-outline" size={24} color="#9ca3af" />
              )}
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.rosterList}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No registrations yet</Text>
          </View>
        }
      />
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
    padding: 20,
  },
  header: {
    backgroundColor: '#1a365d',
    padding: 20,
    paddingTop: 60,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#93c5fd',
    marginTop: 4,
  },
  list: {
    padding: 16,
  },
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  eventDetails: {
    marginRight: 12,
    alignItems: 'flex-end',
  },
  eventTime: {
    fontSize: 14,
    color: '#6b7280',
  },
  eventLocation: {
    fontSize: 12,
    color: '#9ca3af',
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
  },
  rosterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    marginRight: 12,
  },
  rosterHeaderText: {
    flex: 1,
  },
  rosterTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  rosterStats: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  scanButton: {
    backgroundColor: '#1a365d',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    fontSize: 16,
    color: '#1f2937',
  },
  rosterList: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  rosterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  rosterItemCheckedIn: {
    backgroundColor: '#f0fdf4',
  },
  rosterItemContent: {
    flex: 1,
  },
  rosterChildName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  rosterChildAge: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  rosterParentInfo: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  rosterItemStatus: {
    marginLeft: 12,
  },
  checkedInBadge: {
    alignItems: 'center',
  },
  checkedInTime: {
    fontSize: 10,
    color: '#10b981',
    marginTop: 2,
  },
  scannerContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  scannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: 16,
  },
  scannerText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 24,
  },
  closeScannerButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionText: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 16,
  },
  permissionButton: {
    backgroundColor: '#1a365d',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    marginTop: 16,
    padding: 12,
  },
  cancelButtonText: {
    color: '#6b7280',
    fontSize: 16,
  },
});
