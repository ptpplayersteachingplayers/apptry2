/**
 * Trainer Detail Screen (Parent)
 *
 * Full trainer profile with session request CTA.
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  ImageBackground,
  Alert,
  Modal,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { ParentStackParamList } from '../../types/navigation';
import { TrainerUser, TrainerReview, TrainerSpecialty } from '../../types';
import { getTrainer, getTrainerReviews, requestSession } from '../../api/training';
import { PTPText, PTPButton, PTPTag, PTPLoading } from '../../components';
import { colors } from '../../theme/colors';
import { spacing, borderRadius, shadows } from '../../theme/spacing';

// Available time slots for session requests
const TIME_SLOTS = [
  { label: 'Morning (8am-12pm)', value: 'morning' },
  { label: 'Afternoon (12pm-4pm)', value: 'afternoon' },
  { label: 'Evening (4pm-8pm)', value: 'evening' },
];

// Location preferences
const LOCATION_OPTIONS = [
  { label: "Trainer's location", value: 'trainer' },
  { label: 'My location', value: 'parent' },
  { label: 'Flexible', value: 'flexible' },
];

// Focus areas based on trainer specialties
const FOCUS_AREAS: { label: string; value: TrainerSpecialty }[] = [
  { label: '1v1 Moves', value: '1v1' },
  { label: 'Finishing', value: 'finishing' },
  { label: 'Passing', value: 'passing' },
  { label: 'Dribbling', value: 'dribbling' },
  { label: 'Shooting', value: 'shooting' },
  { label: 'Goalkeeper', value: 'goalkeeper' },
  { label: 'Defense', value: 'defense' },
  { label: 'Speed & Agility', value: 'speed-agility' },
  { label: 'Game IQ', value: 'game-iq' },
];

type TrainerDetailNavigationProp = NativeStackNavigationProp<ParentStackParamList, 'TrainerDetail'>;
type TrainerDetailRouteProp = RouteProp<ParentStackParamList, 'TrainerDetail'>;

const TrainerDetailScreen: React.FC = () => {
  const navigation = useNavigation<TrainerDetailNavigationProp>();
  const route = useRoute<TrainerDetailRouteProp>();
  const { trainerId } = route.params;

  const [trainer, setTrainer] = useState<TrainerUser | null>(null);
  const [reviews, setReviews] = useState<TrainerReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRequesting, setIsRequesting] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);

  // Session request form state
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<string[]>([]);
  const [locationPreference, setLocationPreference] = useState<string>('flexible');
  const [selectedFocusAreas, setSelectedFocusAreas] = useState<TrainerSpecialty[]>([]);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadTrainer();
  }, [trainerId]);

  const loadTrainer = async () => {
    try {
      const [trainerData, reviewsData] = await Promise.all([
        getTrainer(trainerId),
        getTrainerReviews(trainerId),
      ]);
      setTrainer(trainerData);
      setReviews(reviewsData);

      // Pre-select focus areas that match trainer's specialties
      if (trainerData?.specialties) {
        const matchingAreas = FOCUS_AREAS.filter((area) =>
          trainerData.specialties.includes(area.value)
        ).map((area) => area.value);
        setSelectedFocusAreas(matchingAreas.slice(0, 2)); // Pre-select first 2
      }
    } catch (error) {
      console.error('Error loading trainer:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTimeSlot = useCallback((slot: string) => {
    setSelectedTimeSlots((prev) =>
      prev.includes(slot) ? prev.filter((s) => s !== slot) : [...prev, slot]
    );
  }, []);

  const toggleFocusArea = useCallback((area: TrainerSpecialty) => {
    setSelectedFocusAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    );
  }, []);

  const resetForm = useCallback(() => {
    setSelectedTimeSlots([]);
    setLocationPreference('flexible');
    setSelectedFocusAreas([]);
    setNotes('');
  }, []);

  const handleOpenRequestModal = () => {
    // Reset form and open modal
    resetForm();
    // Pre-select focus areas from trainer specialties
    if (trainer?.specialties) {
      const matchingAreas = FOCUS_AREAS.filter((area) =>
        trainer.specialties.includes(area.value)
      ).map((area) => area.value);
      setSelectedFocusAreas(matchingAreas.slice(0, 2));
    }
    setShowRequestModal(true);
  };

  const handleSubmitRequest = async () => {
    if (!trainer) return;

    // Validate form
    if (selectedTimeSlots.length === 0) {
      Alert.alert('Missing Information', 'Please select at least one preferred time slot.');
      return;
    }

    if (selectedFocusAreas.length === 0) {
      Alert.alert('Missing Information', 'Please select at least one focus area.');
      return;
    }

    setIsRequesting(true);
    try {
      // Convert time slots to preferred slots format
      const today = new Date();
      const preferredSlots = selectedTimeSlots.map((slot) => {
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 7);
        const dateStr = nextWeek.toISOString().split('T')[0];

        let startTime = '08:00';
        let endTime = '12:00';
        if (slot === 'afternoon') {
          startTime = '12:00';
          endTime = '16:00';
        } else if (slot === 'evening') {
          startTime = '16:00';
          endTime = '20:00';
        }

        return { date: dateStr, startTime, endTime };
      });

      const response = await requestSession({
        trainerId: trainer.id,
        preferredSlots,
        locationPreference: locationPreference as 'trainer' | 'parent' | 'flexible',
        focus: selectedFocusAreas,
        notes: notes || undefined,
      });

      setShowRequestModal(false);
      Alert.alert('Request Sent!', response.message, [
        { text: 'View Schedule', onPress: () => navigation.navigate('ParentTabs', { screen: 'Schedule' }) },
        { text: 'Done', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send request. Please try again.');
    } finally {
      setIsRequesting(false);
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

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Hero */}
        <ImageBackground source={{ uri: trainer.headshotUrl }} style={styles.heroImage}>
          <View style={styles.heroOverlay}>
            {trainer.isVerified && <PTPTag label="Verified ✓" variant="success" />}
          </View>
        </ImageBackground>

        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <PTPText variant="heroTitle">
              {trainer.firstName} {trainer.lastName}
            </PTPText>
            <PTPText variant="body" color="gray500">
              {trainer.collegePro} • {trainer.position}
            </PTPText>
            {trainer.rating && (
              <View style={styles.rating}>
                <PTPText variant="body" color="primary">★ {trainer.rating.toFixed(1)}</PTPText>
                <PTPText variant="bodySmall" color="gray500"> ({trainer.reviewCount} reviews)</PTPText>
              </View>
            )}
          </View>

          {/* Price */}
          <View style={styles.priceCard}>
            <PTPText variant="sectionTitle" color="primary">${trainer.hourlyRate}</PTPText>
            <PTPText variant="body" color="gray500">per hour</PTPText>
          </View>

          {/* Bio */}
          <View style={styles.section}>
            <PTPText variant="sectionTitle" style={styles.sectionTitle}>About</PTPText>
            <PTPText variant="body" color="gray600">{trainer.bio}</PTPText>
          </View>

          {/* Specialties */}
          <View style={styles.section}>
            <PTPText variant="sectionTitle" style={styles.sectionTitle}>Specialties</PTPText>
            <View style={styles.specialties}>
              {trainer.specialties.map((s) => (
                <PTPTag key={s} label={s.replace('-', ' ')} variant="default" />
              ))}
            </View>
          </View>

          {/* Teaching Style */}
          {trainer.teachingStyle && (
            <View style={styles.section}>
              <PTPText variant="sectionTitle" style={styles.sectionTitle}>Teaching Style</PTPText>
              <PTPText variant="body" color="gray600">{trainer.teachingStyle}</PTPText>
            </View>
          )}

          {/* Reviews */}
          {reviews.length > 0 && (
            <View style={styles.section}>
              <PTPText variant="sectionTitle" style={styles.sectionTitle}>Reviews</PTPText>
              {reviews.slice(0, 3).map((review) => (
                <View key={review.id} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <PTPText variant="label">{review.parentName}</PTPText>
                    <PTPText variant="bodySmall" color="primary">★ {review.rating}</PTPText>
                  </View>
                  <PTPText variant="bodySmall" color="gray600">{review.comment}</PTPText>
                </View>
              ))}
            </View>
          )}

          {/* Trust Badges */}
          <View style={styles.trustSection}>
            {trainer.isBackgroundChecked && (
              <View style={styles.trustBadge}>
                <PTPText style={{ fontSize: 24 }}>✓</PTPText>
                <PTPText variant="caption">Background Checked</PTPText>
              </View>
            )}
            <View style={styles.trustBadge}>
              <PTPText style={{ fontSize: 24 }}>🎓</PTPText>
              <PTPText variant="caption">NCAA Athlete</PTPText>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <SafeAreaView edges={['bottom']} style={styles.bottomBar}>
        <View style={styles.bottomBarContent}>
          <PTPButton
            title="Request a Session"
            variant="primary"
            size="large"
            fullWidth
            onPress={handleOpenRequestModal}
          />
        </View>
      </SafeAreaView>

      {/* Session Request Modal */}
      <Modal
        visible={showRequestModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowRequestModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <SafeAreaView style={styles.modalContent} edges={['top', 'bottom']}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() => setShowRequestModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color={colors.gray600} />
              </TouchableOpacity>
              <PTPText variant="sectionTitle">Request a Session</PTPText>
              <View style={styles.modalCloseButton} />
            </View>

            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Trainer Info */}
              {trainer && (
                <View style={styles.modalTrainerInfo}>
                  <PTPText variant="label" color="gray500">
                    Request session with
                  </PTPText>
                  <PTPText variant="cardTitle">
                    {trainer.firstName} {trainer.lastName}
                  </PTPText>
                  <PTPText variant="bodySmall" color="primary">
                    ${trainer.hourlyRate}/hr
                  </PTPText>
                </View>
              )}

              {/* Preferred Time Slots */}
              <View style={styles.formSection}>
                <PTPText variant="label" style={styles.formLabel}>
                  Preferred Time Slots *
                </PTPText>
                <PTPText variant="caption" color="gray500" style={styles.formHint}>
                  Select all that work for you
                </PTPText>
                <View style={styles.optionsGrid}>
                  {TIME_SLOTS.map((slot) => (
                    <TouchableOpacity
                      key={slot.value}
                      style={[
                        styles.optionButton,
                        selectedTimeSlots.includes(slot.value) && styles.optionButtonSelected,
                      ]}
                      onPress={() => toggleTimeSlot(slot.value)}
                    >
                      <PTPText
                        variant="bodySmall"
                        color={selectedTimeSlots.includes(slot.value) ? 'inkBlack' : 'gray600'}
                      >
                        {slot.label}
                      </PTPText>
                      {selectedTimeSlots.includes(slot.value) && (
                        <Ionicons name="checkmark" size={16} color={colors.inkBlack} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Location Preference */}
              <View style={styles.formSection}>
                <PTPText variant="label" style={styles.formLabel}>
                  Location Preference
                </PTPText>
                <View style={styles.optionsGrid}>
                  {LOCATION_OPTIONS.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.optionButton,
                        locationPreference === option.value && styles.optionButtonSelected,
                      ]}
                      onPress={() => setLocationPreference(option.value)}
                    >
                      <PTPText
                        variant="bodySmall"
                        color={locationPreference === option.value ? 'inkBlack' : 'gray600'}
                      >
                        {option.label}
                      </PTPText>
                      {locationPreference === option.value && (
                        <Ionicons name="checkmark-circle" size={16} color={colors.inkBlack} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Focus Areas */}
              <View style={styles.formSection}>
                <PTPText variant="label" style={styles.formLabel}>
                  What do you want to work on? *
                </PTPText>
                <PTPText variant="caption" color="gray500" style={styles.formHint}>
                  Based on {trainer?.firstName}'s specialties
                </PTPText>
                <View style={styles.focusGrid}>
                  {FOCUS_AREAS.filter(
                    (area) => trainer?.specialties?.includes(area.value) || selectedFocusAreas.includes(area.value)
                  ).map((area) => (
                    <TouchableOpacity
                      key={area.value}
                      style={[
                        styles.focusChip,
                        selectedFocusAreas.includes(area.value) && styles.focusChipSelected,
                      ]}
                      onPress={() => toggleFocusArea(area.value)}
                    >
                      <PTPText
                        variant="caption"
                        color={selectedFocusAreas.includes(area.value) ? 'inkBlack' : 'gray600'}
                      >
                        {area.label}
                      </PTPText>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Notes */}
              <View style={styles.formSection}>
                <PTPText variant="label" style={styles.formLabel}>
                  Additional Notes
                </PTPText>
                <TextInput
                  style={styles.notesInput}
                  placeholder="Any specific goals, concerns, or preferences..."
                  placeholderTextColor={colors.gray400}
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              {/* Info Banner */}
              <View style={styles.infoBanner}>
                <Ionicons name="information-circle-outline" size={20} color={colors.info} />
                <PTPText variant="caption" color="gray600" style={styles.infoBannerText}>
                  Our team will coordinate with {trainer?.firstName} to find a mutually available time. You'll receive a confirmation within 24-48 hours.
                </PTPText>
              </View>
            </ScrollView>

            {/* Modal Footer */}
            <View style={styles.modalFooter}>
              <PTPButton
                title="Send Request"
                variant="primary"
                size="large"
                fullWidth
                loading={isRequesting}
                disabled={selectedTimeSlots.length === 0 || selectedFocusAreas.length === 0}
                onPress={handleSubmitRequest}
              />
            </View>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.offWhite },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 120 },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing[4] },
  heroImage: { height: 350, justifyContent: 'flex-end' },
  heroOverlay: { padding: spacing[4], backgroundColor: colors.overlayLight },
  content: { padding: spacing[4], backgroundColor: colors.white, marginTop: -spacing[4], borderTopLeftRadius: borderRadius.xl, borderTopRightRadius: borderRadius.xl },
  header: { marginBottom: spacing[4] },
  rating: { flexDirection: 'row', alignItems: 'center', marginTop: spacing[2] },
  priceCard: { flexDirection: 'row', alignItems: 'baseline', gap: spacing[2], backgroundColor: colors.gray50, padding: spacing[4], borderRadius: borderRadius.md, marginBottom: spacing[4] },
  section: { marginBottom: spacing[4] },
  sectionTitle: { marginBottom: spacing[3] },
  specialties: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  reviewCard: { backgroundColor: colors.gray50, padding: spacing[3], borderRadius: borderRadius.md, marginBottom: spacing[2] },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing[2] },
  trustSection: { flexDirection: 'row', justifyContent: 'space-around', paddingTop: spacing[4], borderTopWidth: 1, borderTopColor: colors.gray100 },
  trustBadge: { alignItems: 'center' },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.gray200, ...shadows.lg },
  bottomBarContent: { padding: spacing[4] },

  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: colors.white,
  },
  modalContent: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  modalCloseButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScroll: {
    flex: 1,
  },
  modalScrollContent: {
    padding: spacing[4],
    paddingBottom: spacing[8],
  },
  modalTrainerInfo: {
    backgroundColor: colors.gray50,
    padding: spacing[4],
    borderRadius: borderRadius.md,
    marginBottom: spacing[6],
  },
  formSection: {
    marginBottom: spacing[5],
  },
  formLabel: {
    marginBottom: spacing[2],
  },
  formHint: {
    marginBottom: spacing[3],
  },
  optionsGrid: {
    gap: spacing[2],
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.gray50,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.gray100,
  },
  optionButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  focusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  focusChip: {
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    borderRadius: borderRadius.full,
    backgroundColor: colors.gray100,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  focusChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  notesInput: {
    backgroundColor: colors.gray50,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.gray200,
    padding: spacing[3],
    minHeight: 100,
    fontSize: 14,
    color: colors.inkBlack,
  },
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: colors.infoLight,
    padding: spacing[3],
    borderRadius: borderRadius.md,
    gap: spacing[2],
  },
  infoBannerText: {
    flex: 1,
  },
  modalFooter: {
    padding: spacing[4],
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
    backgroundColor: colors.white,
  },
});

export default TrainerDetailScreen;
