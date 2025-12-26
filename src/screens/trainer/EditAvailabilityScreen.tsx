/**
 * Edit Availability Screen (Trainer)
 *
 * Allows trainers to manage their weekly availability schedule.
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { TrainerStackParamList } from '../../types/navigation';
import { WeeklyAvailability, TimeSlot } from '../../types';
import { useAuth, useTrainerUser } from '../../hooks/useAuth';
import { PTPText, PTPButton } from '../../components';
import { colors } from '../../theme/colors';
import { spacing, borderRadius, shadows } from '../../theme/spacing';

type EditAvailabilityNavigationProp = NativeStackNavigationProp<TrainerStackParamList>;

type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

const DAYS: { key: DayOfWeek; label: string; short: string }[] = [
  { key: 'monday', label: 'Monday', short: 'Mon' },
  { key: 'tuesday', label: 'Tuesday', short: 'Tue' },
  { key: 'wednesday', label: 'Wednesday', short: 'Wed' },
  { key: 'thursday', label: 'Thursday', short: 'Thu' },
  { key: 'friday', label: 'Friday', short: 'Fri' },
  { key: 'saturday', label: 'Saturday', short: 'Sat' },
  { key: 'sunday', label: 'Sunday', short: 'Sun' },
];

const TIME_OPTIONS = [
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00',
];

const formatTime = (time: string) => {
  const [hours] = time.split(':');
  const h = parseInt(hours, 10);
  if (h === 0) return '12:00 AM';
  if (h === 12) return '12:00 PM';
  if (h < 12) return `${h}:00 AM`;
  return `${h - 12}:00 PM`;
};

interface DayAvailability {
  enabled: boolean;
  slots: TimeSlot[];
}

/**
 * EditAvailabilityScreen - Manage weekly schedule
 */
const EditAvailabilityScreen: React.FC = () => {
  const navigation = useNavigation<EditAvailabilityNavigationProp>();
  const { refreshUser } = useAuth();
  const trainerUser = useTrainerUser();

  // Initialize availability from user data or defaults
  const initializeAvailability = (): { [key in DayOfWeek]: DayAvailability } => {
    const defaultSlot: TimeSlot = { start: '09:00', end: '17:00' };
    const result: { [key in DayOfWeek]: DayAvailability } = {
      monday: { enabled: true, slots: [defaultSlot] },
      tuesday: { enabled: true, slots: [defaultSlot] },
      wednesday: { enabled: true, slots: [defaultSlot] },
      thursday: { enabled: true, slots: [defaultSlot] },
      friday: { enabled: true, slots: [defaultSlot] },
      saturday: { enabled: true, slots: [{ start: '09:00', end: '15:00' }] },
      sunday: { enabled: false, slots: [] },
    };

    // Override with user's actual availability
    if (trainerUser?.availability) {
      DAYS.forEach(({ key }) => {
        const slots = trainerUser.availability[key];
        if (slots && slots.length > 0) {
          result[key] = { enabled: true, slots };
        } else {
          result[key] = { enabled: false, slots: [] };
        }
      });
    }

    return result;
  };

  const [availability, setAvailability] = useState(initializeAvailability);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedDay, setExpandedDay] = useState<DayOfWeek | null>(null);

  const toggleDay = (day: DayOfWeek) => {
    setAvailability((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        enabled: !prev[day].enabled,
        slots: !prev[day].enabled ? [{ start: '09:00', end: '17:00' }] : [],
      },
    }));
  };

  const toggleExpand = (day: DayOfWeek) => {
    setExpandedDay(expandedDay === day ? null : day);
  };

  const updateSlot = (day: DayOfWeek, index: number, field: 'start' | 'end', value: string) => {
    setAvailability((prev) => {
      const newSlots = [...prev[day].slots];
      newSlots[index] = { ...newSlots[index], [field]: value };
      return {
        ...prev,
        [day]: { ...prev[day], slots: newSlots },
      };
    });
  };

  const addSlot = (day: DayOfWeek) => {
    const lastSlot = availability[day].slots[availability[day].slots.length - 1];
    const newStart = lastSlot ? lastSlot.end : '09:00';
    const newEnd = TIME_OPTIONS[Math.min(TIME_OPTIONS.indexOf(newStart) + 2, TIME_OPTIONS.length - 1)];

    setAvailability((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        slots: [...prev[day].slots, { start: newStart, end: newEnd }],
      },
    }));
  };

  const removeSlot = (day: DayOfWeek, index: number) => {
    setAvailability((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        slots: prev[day].slots.filter((_, i) => i !== index),
      },
    }));
  };

  const handleSave = async () => {
    setIsLoading(true);

    try {
      // Convert to WeeklyAvailability format
      const weeklyAvailability: WeeklyAvailability = {
        monday: availability.monday.enabled ? availability.monday.slots : [],
        tuesday: availability.tuesday.enabled ? availability.tuesday.slots : [],
        wednesday: availability.wednesday.enabled ? availability.wednesday.slots : [],
        thursday: availability.thursday.enabled ? availability.thursday.slots : [],
        friday: availability.friday.enabled ? availability.friday.slots : [],
        saturday: availability.saturday.enabled ? availability.saturday.slots : [],
        sunday: availability.sunday.enabled ? availability.sunday.slots : [],
      };

      // In a real app, call API to save availability
      // await updateTrainerAvailability(weeklyAvailability);

      await refreshUser();

      Alert.alert('Success', 'Your availability has been updated.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to update availability. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderTimeSelector = (
    day: DayOfWeek,
    slotIndex: number,
    field: 'start' | 'end',
    value: string
  ) => (
    <View style={styles.timeSelector}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.timeSelectorContent}
      >
        {TIME_OPTIONS.map((time) => (
          <TouchableOpacity
            key={time}
            style={[
              styles.timeOption,
              value === time && styles.timeOptionSelected,
            ]}
            onPress={() => updateSlot(day, slotIndex, field, time)}
          >
            <PTPText
              variant="caption"
              color={value === time ? 'white' : 'gray600'}
            >
              {formatTime(time)}
            </PTPText>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderDayCard = (day: { key: DayOfWeek; label: string }) => {
    const dayData = availability[day.key];
    const isExpanded = expandedDay === day.key;

    return (
      <View key={day.key} style={styles.dayCard}>
        <TouchableOpacity
          style={styles.dayHeader}
          onPress={() => dayData.enabled && toggleExpand(day.key)}
        >
          <View style={styles.dayInfo}>
            <Switch
              value={dayData.enabled}
              onValueChange={() => toggleDay(day.key)}
              trackColor={{ false: colors.gray300, true: colors.primary }}
              thumbColor={colors.white}
            />
            <PTPText
              variant="buttonMedium"
              color={dayData.enabled ? 'inkBlack' : 'gray400'}
              style={styles.dayLabel}
            >
              {day.label}
            </PTPText>
          </View>
          {dayData.enabled && (
            <View style={styles.dayPreview}>
              {dayData.slots.length > 0 ? (
                <PTPText variant="caption" color="gray500">
                  {dayData.slots.map((s) => `${formatTime(s.start)} - ${formatTime(s.end)}`).join(', ')}
                </PTPText>
              ) : (
                <PTPText variant="caption" color="gray400">No times set</PTPText>
              )}
              <Ionicons
                name={isExpanded ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={colors.gray400}
                style={styles.chevron}
              />
            </View>
          )}
        </TouchableOpacity>

        {isExpanded && dayData.enabled && (
          <View style={styles.daySlots}>
            {dayData.slots.map((slot, index) => (
              <View key={index} style={styles.slotRow}>
                <View style={styles.slotTimes}>
                  <View style={styles.slotTime}>
                    <PTPText variant="caption" color="gray500">Start</PTPText>
                    {renderTimeSelector(day.key, index, 'start', slot.start)}
                  </View>
                  <PTPText variant="body" color="gray400" style={styles.slotDash}>-</PTPText>
                  <View style={styles.slotTime}>
                    <PTPText variant="caption" color="gray500">End</PTPText>
                    {renderTimeSelector(day.key, index, 'end', slot.end)}
                  </View>
                </View>
                {dayData.slots.length > 1 && (
                  <TouchableOpacity
                    style={styles.removeSlot}
                    onPress={() => removeSlot(day.key, index)}
                  >
                    <Ionicons name="close-circle" size={24} color={colors.error} />
                  </TouchableOpacity>
                )}
              </View>
            ))}
            <TouchableOpacity style={styles.addSlot} onPress={() => addSlot(day.key)}>
              <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
              <PTPText variant="label" color="primary" style={styles.addSlotText}>
                Add Time Slot
              </PTPText>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Instructions */}
        <View style={styles.instructions}>
          <Ionicons name="information-circle-outline" size={20} color={colors.gray500} />
          <PTPText variant="caption" color="gray500" style={styles.instructionsText}>
            Set your availability for each day. Parents will only be able to request sessions during these times.
          </PTPText>
        </View>

        {/* Days */}
        <View style={styles.daysContainer}>
          {DAYS.map((day) => renderDayCard(day))}
        </View>

        {/* Save Button */}
        <View style={styles.buttonContainer}>
          <PTPButton
            title="Save Availability"
            onPress={handleSave}
            loading={isLoading}
            fullWidth
          />
          <PTPButton
            title="Cancel"
            variant="outline"
            onPress={() => navigation.goBack()}
            fullWidth
            style={styles.cancelButton}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing[8],
  },
  instructions: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing[4],
    backgroundColor: colors.gray700,
    margin: spacing[4],
    borderRadius: 0,
  },
  instructionsText: {
    flex: 1,
    marginLeft: spacing[2],
  },
  daysContainer: {
    paddingHorizontal: spacing[4],
  },
  dayCard: {
    backgroundColor: colors.blackCard,
    borderRadius: 0,
    marginBottom: spacing[3],
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.gray700,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing[4],
  },
  dayInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dayLabel: {
    marginLeft: spacing[3],
  },
  dayPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },
  chevron: {
    marginLeft: spacing[2],
  },
  daySlots: {
    padding: spacing[4],
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: colors.gray700,
  },
  slotRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing[3],
  },
  slotTimes: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  slotTime: {
    flex: 1,
  },
  slotDash: {
    marginHorizontal: spacing[2],
    marginTop: spacing[4],
  },
  timeSelector: {
    marginTop: spacing[1],
  },
  timeSelectorContent: {
    paddingRight: spacing[4],
  },
  timeOption: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: 0,
    backgroundColor: colors.gray700,
    marginRight: spacing[1],
  },
  timeOptionSelected: {
    backgroundColor: colors.primary,
  },
  removeSlot: {
    marginLeft: spacing[2],
    marginTop: spacing[4],
  },
  addSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[3],
    marginTop: spacing[2],
  },
  addSlotText: {
    marginLeft: spacing[1],
  },
  buttonContainer: {
    paddingHorizontal: spacing[4],
    marginTop: spacing[6],
  },
  cancelButton: {
    marginTop: spacing[3],
  },
});

export default EditAvailabilityScreen;
