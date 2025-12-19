/**
 * Session Request Screen (Parent)
 *
 * Allows parents to request a training session with a trainer.
 * Includes date/time selection, focus areas, and notes.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { ParentStackParamList } from '../../types/navigation';
import { TrainerUser, TrainingFocus, ChildProfile } from '../../types';
import { getTrainer } from '../../api/training';
import { useParentUser } from '../../hooks/useAuth';
import { PTPText, PTPButton, PTPInput, PTPTag, PTPLoading } from '../../components';
import { colors } from '../../theme/colors';
import { spacing, borderRadius, shadows } from '../../theme/spacing';

type SessionRequestNavigationProp = NativeStackNavigationProp<ParentStackParamList>;
type SessionRequestRouteProp = RouteProp<ParentStackParamList, 'SessionRequest'>;

const FOCUS_AREAS: { value: TrainingFocus; label: string }[] = [
  { value: '1v1', label: '1v1 Moves' },
  { value: 'finishing', label: 'Finishing' },
  { value: 'passing', label: 'Passing' },
  { value: 'first-touch', label: 'First Touch' },
  { value: 'dribbling', label: 'Dribbling' },
  { value: 'defending', label: 'Defending' },
  { value: 'heading', label: 'Heading' },
  { value: 'speed', label: 'Speed & Agility' },
  { value: 'conditioning', label: 'Conditioning' },
  { value: 'goalkeeping', label: 'Goalkeeping' },
  { value: 'game-iq', label: 'Game IQ' },
];

const TIME_SLOTS = [
  { label: '9:00 AM', value: '09:00' },
  { label: '10:00 AM', value: '10:00' },
  { label: '11:00 AM', value: '11:00' },
  { label: '12:00 PM', value: '12:00' },
  { label: '1:00 PM', value: '13:00' },
  { label: '2:00 PM', value: '14:00' },
  { label: '3:00 PM', value: '15:00' },
  { label: '4:00 PM', value: '16:00' },
  { label: '5:00 PM', value: '17:00' },
  { label: '6:00 PM', value: '18:00' },
];

const SessionRequestScreen: React.FC = () => {
  const navigation = useNavigation<SessionRequestNavigationProp>();
  const route = useRoute<SessionRequestRouteProp>();
  const { trainerId } = route.params;
  const parentUser = useParentUser();

  const [trainer, setTrainer] = useState<TrainerUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [selectedChild, setSelectedChild] = useState<ChildProfile | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [selectedFocus, setSelectedFocus] = useState<TrainingFocus[]>([]);
  const [locationPreference, setLocationPreference] = useState<'trainer' | 'player' | 'neutral'>('trainer');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadTrainer();
  }, [trainerId]);

  useEffect(() => {
    // Auto-select first child if only one
    if (parentUser?.children?.length === 1) {
      setSelectedChild(parentUser.children[0]);
    }
  }, [parentUser]);

  const loadTrainer = async () => {
    try {
      const data = await getTrainer(trainerId);
      setTrainer(data);
    } catch (error) {
      console.error('Error loading trainer:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFocus = (focus: TrainingFocus) => {
    setSelectedFocus((prev) =>
      prev.includes(focus)
        ? prev.filter((f) => f !== focus)
        : prev.length < 3
        ? [...prev, focus]
        : prev
    );
  };

  const generateDateOptions = () => {
    const dates = [];
    const today = new Date();
    for (let i = 1; i <= 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push({
        value: date.toISOString().split('T')[0],
        label: date.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        }),
        dayOfWeek: date.toLocaleDateString('en-US', { weekday: 'short' }),
      });
    }
    return dates;
  };

  const handleSubmit = async () => {
    if (!selectedChild) {
      Alert.alert('Select Player', 'Please select which player this session is for.');
      return;
    }
    if (!selectedDate) {
      Alert.alert('Select Date', 'Please select your preferred date.');
      return;
    }
    if (!selectedTime) {
      Alert.alert('Select Time', 'Please select your preferred time.');
      return;
    }
    if (selectedFocus.length === 0) {
      Alert.alert('Select Focus Area', 'Please select at least one area to focus on.');
      return;
    }

    setIsSubmitting(true);
    try {
      // In a real app, this would call requestSession API
      await new Promise((resolve) => setTimeout(resolve, 1500));

      Alert.alert(
        'Request Sent!',
        `Your session request has been sent to ${trainer?.firstName}. They'll respond within 24 hours.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to send request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <PTPLoading message="Loading trainer..." />;
  }

  if (!trainer) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <PTPText variant="sectionTitle">Trainer not found</PTPText>
          <PTPButton title="Go Back" variant="outline" onPress={() => navigation.goBack()} />
        </View>
      </SafeAreaView>
    );
  }

  const dateOptions = generateDateOptions();

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Trainer Info */}
          <View style={styles.trainerCard}>
            <View style={styles.trainerInfo}>
              <PTPText variant="sectionTitle">
                {trainer.firstName} {trainer.lastName}
              </PTPText>
              <PTPText variant="body" color="gray500">
                {trainer.collegePro} • {trainer.position}
              </PTPText>
              <View style={styles.priceRow}>
                <PTPText variant="cardTitle" color="primary">
                  ${trainer.hourlyRate}
                </PTPText>
                <PTPText variant="body" color="gray500">
                  /hour
                </PTPText>
              </View>
            </View>
          </View>

          {/* Select Player */}
          {parentUser?.children && parentUser.children.length > 1 && (
            <View style={styles.section}>
              <PTPText variant="label" color="gray500" style={styles.sectionTitle}>
                SELECT PLAYER
              </PTPText>
              <View style={styles.childrenRow}>
                {parentUser.children.map((child) => (
                  <TouchableOpacity
                    key={child.id}
                    style={[
                      styles.childChip,
                      selectedChild?.id === child.id && styles.childChipSelected,
                    ]}
                    onPress={() => setSelectedChild(child)}
                  >
                    <PTPText
                      variant="label"
                      color={selectedChild?.id === child.id ? 'white' : 'inkBlack'}
                    >
                      {child.firstName}
                    </PTPText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Select Date */}
          <View style={styles.section}>
            <PTPText variant="label" color="gray500" style={styles.sectionTitle}>
              PREFERRED DATE
            </PTPText>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.dateScroll}
            >
              {dateOptions.map((date) => (
                <TouchableOpacity
                  key={date.value}
                  style={[
                    styles.dateChip,
                    selectedDate === date.value && styles.dateChipSelected,
                  ]}
                  onPress={() => setSelectedDate(date.value)}
                >
                  <PTPText
                    variant="caption"
                    color={selectedDate === date.value ? 'white' : 'gray500'}
                  >
                    {date.dayOfWeek}
                  </PTPText>
                  <PTPText
                    variant="buttonMedium"
                    color={selectedDate === date.value ? 'white' : 'inkBlack'}
                  >
                    {date.label.split(', ')[0].split(' ')[1]}
                  </PTPText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Select Time */}
          <View style={styles.section}>
            <PTPText variant="label" color="gray500" style={styles.sectionTitle}>
              PREFERRED TIME
            </PTPText>
            <View style={styles.timeGrid}>
              {TIME_SLOTS.map((slot) => (
                <TouchableOpacity
                  key={slot.value}
                  style={[
                    styles.timeChip,
                    selectedTime === slot.value && styles.timeChipSelected,
                  ]}
                  onPress={() => setSelectedTime(slot.value)}
                >
                  <PTPText
                    variant="label"
                    color={selectedTime === slot.value ? 'white' : 'inkBlack'}
                  >
                    {slot.label}
                  </PTPText>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Focus Areas */}
          <View style={styles.section}>
            <PTPText variant="label" color="gray500" style={styles.sectionTitle}>
              FOCUS AREAS (SELECT UP TO 3)
            </PTPText>
            <View style={styles.focusGrid}>
              {FOCUS_AREAS.map((focus) => (
                <TouchableOpacity
                  key={focus.value}
                  style={[
                    styles.focusChip,
                    selectedFocus.includes(focus.value) && styles.focusChipSelected,
                  ]}
                  onPress={() => toggleFocus(focus.value)}
                >
                  <PTPText
                    variant="caption"
                    color={selectedFocus.includes(focus.value) ? 'white' : 'inkBlack'}
                  >
                    {focus.label}
                  </PTPText>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Location Preference */}
          <View style={styles.section}>
            <PTPText variant="label" color="gray500" style={styles.sectionTitle}>
              LOCATION PREFERENCE
            </PTPText>
            <View style={styles.locationRow}>
              {[
                { value: 'trainer', label: 'Trainer\'s Location', icon: 'location' },
                { value: 'player', label: 'Our Location', icon: 'home' },
                { value: 'neutral', label: 'Flexible', icon: 'swap-horizontal' },
              ].map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.locationChip,
                    locationPreference === option.value && styles.locationChipSelected,
                  ]}
                  onPress={() => setLocationPreference(option.value as any)}
                >
                  <Ionicons
                    name={option.icon as any}
                    size={20}
                    color={locationPreference === option.value ? colors.white : colors.inkBlack}
                  />
                  <PTPText
                    variant="caption"
                    color={locationPreference === option.value ? 'white' : 'inkBlack'}
                    style={styles.locationText}
                  >
                    {option.label}
                  </PTPText>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Notes */}
          <View style={styles.section}>
            <PTPText variant="label" color="gray500" style={styles.sectionTitle}>
              NOTES FOR TRAINER (OPTIONAL)
            </PTPText>
            <View style={styles.card}>
              <PTPInput
                value={notes}
                onChangeText={setNotes}
                placeholder="Any goals, injuries, or things the trainer should know..."
                multiline
                numberOfLines={3}
                style={styles.notesInput}
              />
            </View>
          </View>

          {/* Summary */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <PTPText variant="body" color="gray500">Session Duration</PTPText>
              <PTPText variant="buttonMedium">1 hour</PTPText>
            </View>
            <View style={styles.summaryRow}>
              <PTPText variant="body" color="gray500">Rate</PTPText>
              <PTPText variant="buttonMedium" color="primary">${trainer.hourlyRate}</PTPText>
            </View>
            <PTPText variant="caption" color="gray400" style={styles.summaryNote}>
              Payment will be collected after the trainer confirms the session.
            </PTPText>
          </View>

          {/* Submit Button */}
          <View style={styles.buttonContainer}>
            <PTPButton
              title="Send Request"
              onPress={handleSubmit}
              loading={isSubmitting}
              fullWidth
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.offWhite,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing[8],
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[4],
  },
  trainerCard: {
    backgroundColor: colors.white,
    padding: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  trainerInfo: {
    gap: spacing[1],
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: spacing[2],
    gap: spacing[1],
  },
  section: {
    paddingHorizontal: spacing[4],
    marginTop: spacing[6],
  },
  sectionTitle: {
    marginBottom: spacing[3],
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    ...shadows.sm,
  },
  childrenRow: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  childChip: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderRadius: borderRadius.full,
    backgroundColor: colors.gray100,
  },
  childChipSelected: {
    backgroundColor: colors.primary,
  },
  dateScroll: {
    gap: spacing[2],
  },
  dateChip: {
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderRadius: borderRadius.md,
    backgroundColor: colors.white,
    minWidth: 70,
    ...shadows.sm,
  },
  dateChipSelected: {
    backgroundColor: colors.primary,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  timeChip: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.md,
    backgroundColor: colors.white,
    ...shadows.sm,
  },
  timeChipSelected: {
    backgroundColor: colors.primary,
  },
  focusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  focusChip: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
    backgroundColor: colors.gray100,
  },
  focusChipSelected: {
    backgroundColor: colors.primary,
  },
  locationRow: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  locationChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing[3],
    borderRadius: borderRadius.md,
    backgroundColor: colors.white,
    ...shadows.sm,
  },
  locationChipSelected: {
    backgroundColor: colors.primary,
  },
  locationText: {
    marginTop: spacing[1],
    textAlign: 'center',
  },
  notesInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  summaryCard: {
    backgroundColor: colors.white,
    marginHorizontal: spacing[4],
    marginTop: spacing[6],
    padding: spacing[4],
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing[2],
  },
  summaryNote: {
    marginTop: spacing[2],
    textAlign: 'center',
  },
  buttonContainer: {
    paddingHorizontal: spacing[4],
    marginTop: spacing[6],
  },
});

export default SessionRequestScreen;
