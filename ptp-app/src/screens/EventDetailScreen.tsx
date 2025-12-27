import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { EventWithAvailability, Child } from '../types/database';

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [event, setEvent] = useState<EventWithAvailability | null>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showChildPicker, setShowChildPicker] = useState(false);
  const [selectedChildren, setSelectedChildren] = useState<string[]>([]);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      // Fetch event
      const { data: eventData, error: eventError } = await supabase
        .from('events_with_availability')
        .select('*')
        .eq('id', id)
        .single();

      if (eventError) throw eventError;
      setEvent(eventData);

      // Fetch children
      if (user) {
        const { data: childrenData } = await supabase
          .from('children')
          .select('*')
          .eq('parent_id', user.id)
          .order('first_name');

        setChildren(childrenData || []);
      }
    } catch (error) {
      console.error('Error fetching event:', error);
      Alert.alert('Error', 'Failed to load event details');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
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

  const handleRegister = () => {
    if (children.length === 0) {
      Alert.alert(
        'No Children',
        'Please add a child to your account before registering.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Add Child', onPress: () => router.push('/kids' as any) },
        ]
      );
      return;
    }

    if (children.length === 1) {
      // Auto-select single child
      openCheckout([children[0].id]);
    } else {
      // Show child picker
      setShowChildPicker(true);
    }
  };

  const openCheckout = async (childIds: string[]) => {
    if (!event?.woo_product_url) {
      Alert.alert('Error', 'Registration is not available for this event');
      return;
    }

    // Build checkout URL with child IDs
    const childIdsParam = encodeURIComponent(JSON.stringify(childIds));
    const checkoutUrl = `${event.woo_product_url}?add-to-cart=${event.woo_product_id}&ptp_children=${childIdsParam}`;

    try {
      // Open checkout in in-app browser
      const result = await WebBrowser.openBrowserAsync(checkoutUrl, {
        dismissButtonStyle: 'done',
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
      });

      if (result.type === 'dismiss') {
        // User closed browser - check for new enrollments
        Alert.alert(
          'Registration',
          'If you completed your purchase, your ticket will appear in the Tickets tab shortly.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error opening checkout:', error);
      Alert.alert('Error', 'Failed to open registration page');
    }
  };

  const toggleChildSelection = (childId: string) => {
    setSelectedChildren((prev) =>
      prev.includes(childId)
        ? prev.filter((id) => id !== childId)
        : [...prev, childId]
    );
  };

  const confirmChildSelection = () => {
    if (selectedChildren.length === 0) {
      Alert.alert('Error', 'Please select at least one child');
      return;
    }
    setShowChildPicker(false);
    openCheckout(selectedChildren);
    setSelectedChildren([]);
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1a365d" />
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.centered}>
        <Text>Event not found</Text>
      </View>
    );
  }

  const isWinter = event.program === 'winter_clinic';

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Header Badge */}
        <View style={styles.badgeRow}>
          <View style={[styles.badge, { backgroundColor: isWinter ? '#3b82f6' : '#f59e0b' }]}>
            <Text style={styles.badgeText}>
              {isWinter ? 'Winter Clinic' : 'Summer Camp'}
            </Text>
          </View>
          {event.is_bestseller && (
            <View style={[styles.badge, styles.bestsellerBadge]}>
              <Text style={styles.badgeText}>Bestseller</Text>
            </View>
          )}
        </View>

        {/* Title */}
        <Text style={styles.title}>{event.title}</Text>

        {/* Quick Info */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="calendar" size={20} color="#1a365d" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Date</Text>
              <Text style={styles.infoValue}>
                {formatDate(event.start_date)}
                {event.end_date && event.end_date !== event.start_date && (
                  ` - ${formatDate(event.end_date)}`
                )}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="time" size={20} color="#1a365d" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Time</Text>
              <Text style={styles.infoValue}>
                {formatTime(event.start_time)} - {formatTime(event.end_time)}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="location" size={20} color="#1a365d" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Location</Text>
              <Text style={styles.infoValue}>
                {event.venue_name || event.market_slug}
              </Text>
              {event.venue_address && (
                <Text style={styles.infoSubValue}>{event.venue_address}</Text>
              )}
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="people" size={20} color="#1a365d" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Ages</Text>
              <Text style={styles.infoValue}>
                {event.age_min} - {event.age_max} years old
              </Text>
            </View>
          </View>
        </View>

        {/* Availability */}
        <View style={styles.availabilityCard}>
          {event.is_sold_out ? (
            <>
              <Ionicons name="close-circle" size={24} color="#ef4444" />
              <Text style={styles.soldOutText}>Sold Out</Text>
              {event.waitlist_capacity && event.waitlist_capacity > 0 && (
                <Text style={styles.waitlistText}>Waitlist available</Text>
              )}
            </>
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={24} color="#10b981" />
              <Text style={styles.availableText}>
                {event.seats_left} spots available
              </Text>
              {event.computed_almost_full && (
                <Text style={styles.hurryText}>Register soon!</Text>
              )}
            </>
          )}
        </View>

        {/* Description */}
        {event.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About This Event</Text>
            <Text style={styles.description}>{event.description}</Text>
          </View>
        )}
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.footer}>
        <View style={styles.priceContainer}>
          {event.price_cents && (
            <Text style={styles.price}>${(event.price_cents / 100).toFixed(0)}</Text>
          )}
          <Text style={styles.priceLabel}>per child</Text>
        </View>
        <TouchableOpacity
          style={[
            styles.registerButton,
            event.is_sold_out && styles.registerButtonDisabled,
          ]}
          onPress={handleRegister}
          disabled={event.is_sold_out}
        >
          <Text style={styles.registerButtonText}>
            {event.is_sold_out ? 'Join Waitlist' : 'Register Now'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Child Picker Modal */}
      <Modal
        visible={showChildPicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowChildPicker(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => {
              setShowChildPicker(false);
              setSelectedChildren([]);
            }}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select Children</Text>
            <TouchableOpacity onPress={confirmChildSelection}>
              <Text style={styles.doneText}>Done</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.modalSubtitle}>
            Select which children to register for this event
          </Text>

          <FlatList
            data={children}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.childOption}
                onPress={() => toggleChildSelection(item.id)}
              >
                <View style={styles.childOptionInfo}>
                  <Text style={styles.childOptionName}>
                    {item.first_name} {item.last_name}
                  </Text>
                  {item.birthdate && (
                    <Text style={styles.childOptionAge}>
                      Born {item.birthdate}
                    </Text>
                  )}
                </View>
                <Ionicons
                  name={selectedChildren.includes(item.id) ? 'checkbox' : 'square-outline'}
                  size={24}
                  color={selectedChildren.includes(item.id) ? '#1a365d' : '#9ca3af'}
                />
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.childList}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  badgeRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
    marginRight: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  bestsellerBadge: {
    backgroundColor: '#10b981',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 20,
  },
  infoCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  infoContent: {
    marginLeft: 12,
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '500',
  },
  infoSubValue: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  availabilityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  soldOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
    marginLeft: 8,
  },
  availableText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10b981',
    marginLeft: 8,
  },
  hurryText: {
    fontSize: 14,
    color: '#f59e0b',
    marginLeft: 8,
  },
  waitlistText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#4b5563',
    lineHeight: 24,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  priceContainer: {},
  price: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  priceLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  registerButton: {
    backgroundColor: '#1a365d',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 8,
  },
  registerButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  registerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
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
  cancelText: {
    fontSize: 16,
    color: '#6b7280',
  },
  doneText: {
    fontSize: 16,
    color: '#1a365d',
    fontWeight: '600',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  childList: {
    padding: 16,
  },
  childOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    marginBottom: 12,
  },
  childOptionInfo: {},
  childOptionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  childOptionAge: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
});
