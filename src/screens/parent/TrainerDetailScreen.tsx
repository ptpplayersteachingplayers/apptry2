/**
 * Trainer Detail Screen (Parent)
 *
 * Full trainer profile with session request CTA.
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  ImageBackground,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { ParentStackParamList } from '../../types/navigation';
import { TrainerUser, TrainerReview } from '../../types';
import { getTrainer, getTrainerReviews } from '../../api/training';
import { PTPText, PTPButton, PTPTag, PTPLoading } from '../../components';
import { colors } from '../../theme/colors';
import { spacing, borderRadius, shadows } from '../../theme/spacing';

type TrainerDetailNavigationProp = NativeStackNavigationProp<ParentStackParamList, 'TrainerDetail'>;
type TrainerDetailRouteProp = RouteProp<ParentStackParamList, 'TrainerDetail'>;

const TrainerDetailScreen: React.FC = () => {
  const navigation = useNavigation<TrainerDetailNavigationProp>();
  const route = useRoute<TrainerDetailRouteProp>();
  const { trainerId } = route.params;

  const [trainer, setTrainer] = useState<TrainerUser | null>(null);
  const [reviews, setReviews] = useState<TrainerReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
    } catch (error) {
      console.error('Error loading trainer:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestSession = () => {
    if (!trainer) return;
    navigation.navigate('SessionRequest', { trainerId: trainer.id });
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
            {trainer.isVerified && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                  <PTPText variant="caption" color="success" style={styles.verifiedText}>Verified</PTPText>
                </View>
              )}
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
                <Ionicons name="star" size={18} color={colors.primary} />
                <PTPText variant="body" color="primary" style={styles.ratingText}>{trainer.rating.toFixed(1)}</PTPText>
                <PTPText variant="bodySmall" color="gray500">({trainer.reviewCount} reviews)</PTPText>
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
                    <View style={styles.reviewRating}>
                      <Ionicons name="star" size={14} color={colors.primary} />
                      <PTPText variant="bodySmall" color="primary">{review.rating}</PTPText>
                    </View>
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
                <View style={styles.trustIconContainer}>
                  <Ionicons name="shield-checkmark" size={28} color={colors.success} />
                </View>
                <PTPText variant="caption" weight="medium">Background Checked</PTPText>
              </View>
            )}
            <View style={styles.trustBadge}>
              <View style={styles.trustIconContainer}>
                <Ionicons name="school" size={28} color={colors.primary} />
              </View>
              <PTPText variant="caption" weight="medium">NCAA Athlete</PTPText>
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
            onPress={handleRequestSession}
          />
        </View>
      </SafeAreaView>
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
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.md,
    gap: spacing[1],
  },
  verifiedText: { marginLeft: spacing[1] },
  content: { padding: spacing[4], backgroundColor: colors.white, marginTop: -spacing[4], borderTopLeftRadius: borderRadius.xl, borderTopRightRadius: borderRadius.xl },
  header: { marginBottom: spacing[4] },
  rating: { flexDirection: 'row', alignItems: 'center', marginTop: spacing[2], gap: spacing[1] },
  ratingText: { marginLeft: spacing[1] },
  priceCard: { flexDirection: 'row', alignItems: 'baseline', gap: spacing[2], backgroundColor: colors.gray50, padding: spacing[4], borderRadius: borderRadius.md, marginBottom: spacing[4] },
  section: { marginBottom: spacing[4] },
  sectionTitle: { marginBottom: spacing[3] },
  specialties: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  reviewCard: { backgroundColor: colors.gray50, padding: spacing[3], borderRadius: borderRadius.md, marginBottom: spacing[2] },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[2] },
  reviewRating: { flexDirection: 'row', alignItems: 'center', gap: spacing[1] },
  trustSection: { flexDirection: 'row', justifyContent: 'space-around', paddingTop: spacing[4], borderTopWidth: 1, borderTopColor: colors.gray100 },
  trustBadge: { alignItems: 'center', gap: spacing[2] },
  trustIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.gray50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.gray200, ...shadows.lg },
  bottomBarContent: { padding: spacing[4] },
});

export default TrainerDetailScreen;
