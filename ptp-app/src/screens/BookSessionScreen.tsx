import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import {
  Trainer,
  TrainerAvailabilitySlot,
  TrainingFocus,
  focusLabels,
} from '../types/training';
import { Child } from '../types/database';

const allFocusAreas: TrainingFocus[] = [
  '1v1',
  'finishing',
  'passing',
  'dribbling',
  'shooting',
  'goalkeeper',
  'defense',
  'midfield',
  'confidence',
  'speed_agility',
  'game_iq',
  'general',
];

export default function BookSessionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [trainer, setTrainer] = useState<Trainer | null>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [availability, setAvailability] = useState<TrainerAvailabilitySlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [selectedChild, setSelectedChild] = useState<string | null>(null);
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]); // "date|time"
  const [selectedFocus, setSelectedFocus] = useState<TrainingFocus[]>([]);
  const [notes, setNotes] = useState('');

  const fetchData = useCallback(async () => {
    try {
      // Fetch trainer
      const { data: trainerData, error: trainerError } = await supabase
        .from('trainers')
        .select('*')
        .eq('id', id)
        .single();

      if (trainerError) throw trainerError;
      setTrainer(trainerData);

      // Pre-select trainer's specialties
      if (trainerData.specialties?.length > 0) {
        setSelectedFocus(trainerData.specialties.slice(0, 2));
      }

      // Fetch children
      if (user) {
        const { data: childrenData } = await supabase
          .from('children')
          .select('*')
          .eq('parent_id', user.id)
          .order('first_name');

        setChildren(childrenData || []);

        // Auto-select if only one child
        if (childrenData?.length === 1) {
          setSelectedChild(childrenData[0].id);
        }
      }

      // Fetch availability for next 14 days
      const today = new Date().toISOString().split('T')[0];
      const twoWeeksOut = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

      const { data: availData } = await supabase.rpc('get_trainer_availability', {
        p_trainer_id: id,
        p_date_from: today,
        p_date_to: twoWeeksOut,
      });

      // Filter out booked slots
      const available = (availData || []).filter(
        (slot: TrainerAvailabilitySlot) => !slot.is_booked
      );
      setAvailability(available);
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to load booking data');
    } finally {
      setIsLoading(false);
    }
  }, [id, user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleSlot = (date: string, time: string) => {
    const key = `${date}|${time}`;
    if (selectedSlots.includes(key)) {
      setSelectedSlots(selectedSlots.filter((s) => s !== key));
    } else if (selectedSlots.length < 3) {
      setSelectedSlots([...selectedSlots, key]);
    } else {
      Alert.alert('Limit Reached', 'You can select up to 3 preferred times');
    }
  };

  const toggleFocus = (focus: TrainingFocus) => {
    if (selectedFocus.includes(focus)) {
      setSelectedFocus(selectedFocus.filter((f) => f !== focus));
    } else if (selectedFocus.length < 4) {
      setSelectedFocus([...selectedFocus, focus]);
    }
  };

  const handleSubmit = async () => {
    if (!selectedChild && children.length > 0) {
      Alert.alert('Select Child', 'Please select which child this session is for');
      return;
    }

    if (selectedSlots.length === 0) {
      Alert.alert('Select Time', 'Please select at least one preferred time');
      return;
    }

    if (selectedFocus.length === 0) {
      Alert.alert('Select Focus', 'Please select what you want to work on');
      return;
    }

    setIsSubmitting(true);

    try {
      // Build preferred slots
      const preferredSlots = selectedSlots.map((slot) => {
        const [date, startTime] = slot.split('|');
        // Assume 1-hour sessions
        const [hours, minutes] = startTime.split(':');
        const endHour = (parseInt(hours, 10) + 1).toString().padStart(2, '0');
        return {
          date,
          start_time: startTime,
          end_time: `${endHour}:${minutes}`,
        };
      });

      const { data, error } = await supabase.rpc('request_training_session', {
        p_trainer_id: id,
        p_child_id: selectedChild,
        p_preferred_slots: JSON.stringify(preferredSlots),
        p_focus: selectedFocus,
        p_notes: notes || null,
      });

      if (error) throw error;

      const result = data as { success: boolean; message: string; session_id?: string };

      if (result.success) {
        Alert.alert('Request Sent!', result.message, [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]);
      } else {
        throw new Error(result.message || 'Failed to send request');
      }
    } catch (error: any) {
      console.error('Error submitting request:', error);
      Alert.alert('Error', error.message || 'Failed to send request');
    } finally {
      setIsSubmitting(false);
    }
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

  // Group availability by date
  const groupedAvailability = availability.reduce((acc, slot) => {
    if (!acc[slot.available_date]) {
      acc[slot.available_date] = [];
    }
    acc[slot.available_date].push(slot);
    return acc;
  }, {} as Record<string, TrainerAvailabilitySlot[]>);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1a365d" />
      </View>
    );
  }

  if (!trainer) {
    return (
      <View style={styles.centered}>
        <Text>Trainer not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Trainer Summary */}
        <View style={styles.trainerSummary}>
          <Text style={styles.trainerName}>
            Book with {trainer.first_name} {trainer.last_name}
          </Text>
          <Text style={styles.trainerPrice}>${trainer.hourly_rate}/hour</Text>
        </View>

        {/* Step 1: Select Child */}
        {children.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>1. Who is this session for?</Text>
            <View style={styles.childGrid}>
              {children.map((child) => (
                <TouchableOpacity
                  key={child.id}
                  style={[
                    styles.childOption,
                    selectedChild === child.id && styles.childOptionSelected,
                  ]}
                  onPress={() => setSelectedChild(child.id)}
                >
                  <Text
                    style={[
                      styles.childName,
                      selectedChild === child.id && styles.childNameSelected,
                    ]}
                  >
                    {child.first_name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Step 2: Select Times */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            2. Select preferred times (up to 3)
          </Text>
          <Text style={styles.sectionHint}>
            Pick multiple options to improve your chances of booking
          </Text>

          {Object.keys(groupedAvailability).length === 0 ? (
            <View style={styles.noAvailability}>
              <Ionicons name="calendar-outline" size={32} color="#9ca3af" />
              <Text style={styles.noAvailabilityText}>
                No availability in the next 2 weeks
              </Text>
            </View>
          ) : (
            Object.entries(groupedAvailability).map(([date, slots]) => (
              <View key={date} style={styles.dateGroup}>
                <Text style={styles.dateLabel}>{formatDate(date)}</Text>
                <View style={styles.timeSlots}>
                  {slots.map((slot, index) => {
                    const key = `${date}|${slot.start_time}`;
                    const isSelected = selectedSlots.includes(key);
                    return (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.timeSlot,
                          isSelected && styles.timeSlotSelected,
                        ]}
                        onPress={() => toggleSlot(date, slot.start_time)}
                      >
                        <Text
                          style={[
                            styles.timeSlotText,
                            isSelected && styles.timeSlotTextSelected,
                          ]}
                        >
                          {formatTime(slot.start_time)}
                        </Text>
                        {isSelected && (
                          <Ionicons name="checkmark" size={14} color="#fff" />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))
          )}
        </View>

        {/* Step 3: Select Focus Areas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. What do you want to work on?</Text>
          <View style={styles.focusGrid}>
            {allFocusAreas.map((focus) => {
              const isSelected = selectedFocus.includes(focus);
              const isTrainerSpecialty = trainer.specialties.includes(focus);
              return (
                <TouchableOpacity
                  key={focus}
                  style={[
                    styles.focusOption,
                    isSelected && styles.focusOptionSelected,
                    isTrainerSpecialty && !isSelected && styles.focusOptionRecommended,
                  ]}
                  onPress={() => toggleFocus(focus)}
                >
                  <Text
                    style={[
                      styles.focusText,
                      isSelected && styles.focusTextSelected,
                    ]}
                  >
                    {focusLabels[focus]}
                  </Text>
                  {isTrainerSpecialty && !isSelected && (
                    <Text style={styles.recommendedBadge}>★</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Step 4: Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Anything else to share?</Text>
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            placeholder="E.g., skill level, specific goals, injuries to be aware of..."
            placeholderTextColor="#9ca3af"
            multiline
            numberOfLines={4}
          />
        </View>
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.footer}>
        <View style={styles.summary}>
          <Text style={styles.summaryLabel}>Total</Text>
          <Text style={styles.summaryPrice}>${trainer.hourly_rate}</Text>
        </View>
        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Send Request</Text>
          )}
        </TouchableOpacity>
      </View>
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
    paddingBottom: 100,
  },
  trainerSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  trainerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  trainerPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a365d',
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  sectionHint: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 12,
  },
  childGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  childOption: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    marginRight: 10,
    marginBottom: 8,
  },
  childOptionSelected: {
    backgroundColor: '#1a365d',
  },
  childName: {
    fontSize: 15,
    color: '#1f2937',
    fontWeight: '500',
  },
  childNameSelected: {
    color: '#fff',
  },
  noAvailability: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  noAvailabilityText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
  },
  dateGroup: {
    marginBottom: 16,
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  timeSlots: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  timeSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  timeSlotSelected: {
    backgroundColor: '#10b981',
  },
  timeSlotText: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: '500',
  },
  timeSlotTextSelected: {
    color: '#fff',
    marginRight: 4,
  },
  focusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  focusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  focusOptionSelected: {
    backgroundColor: '#1a365d',
  },
  focusOptionRecommended: {
    borderWidth: 1,
    borderColor: '#1a365d',
  },
  focusText: {
    fontSize: 14,
    color: '#4b5563',
  },
  focusTextSelected: {
    color: '#fff',
  },
  recommendedBadge: {
    fontSize: 12,
    color: '#1a365d',
    marginLeft: 4,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: '#1f2937',
    minHeight: 100,
    textAlignVertical: 'top',
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
  summary: {},
  summaryLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  summaryPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  submitButton: {
    backgroundColor: '#1a365d',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 8,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
