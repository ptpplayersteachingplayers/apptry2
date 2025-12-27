import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import {
  Trainer,
  TrainerLocation,
  TrainerReview,
  TrainerAvailabilitySlot,
  focusLabels,
  positionLabels,
  TrainingFocus,
} from '../types/training';

export default function TrainerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [trainer, setTrainer] = useState<Trainer | null>(null);
  const [locations, setLocations] = useState<TrainerLocation[]>([]);
  const [reviews, setReviews] = useState<TrainerReview[]>([]);
  const [availability, setAvailability] = useState<TrainerAvailabilitySlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);

  const fetchTrainer = useCallback(async () => {
    try {
      // Fetch trainer
      const { data: trainerData, error: trainerError } = await supabase
        .from('trainers')
        .select('*')
        .eq('id', id)
        .single();

      if (trainerError) throw trainerError;
      setTrainer(trainerData);

      // Fetch locations
      const { data: locationsData } = await supabase
        .from('trainer_locations')
        .select('*')
        .eq('trainer_id', id)
        .order('is_home_base', { ascending: false });

      setLocations(locationsData || []);

      // Fetch reviews
      const { data: reviewsData } = await supabase
        .from('trainer_reviews')
        .select('*')
        .eq('trainer_id', id)
        .eq('is_visible', true)
        .order('created_at', { ascending: false })
        .limit(10);

      setReviews(reviewsData || []);

      // Fetch availability for next 7 days
      const today = new Date().toISOString().split('T')[0];
      const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

      const { data: availData } = await supabase.rpc('get_trainer_availability', {
        p_trainer_id: id,
        p_date_from: today,
        p_date_to: weekFromNow,
      });

      setAvailability(availData || []);

      // Check if favorited
      if (user) {
        const { data: favData } = await supabase
          .from('trainer_favorites')
          .select('id')
          .eq('parent_id', user.id)
          .eq('trainer_id', id)
          .single();

        setIsFavorite(!!favData);
      }
    } catch (error) {
      console.error('Error fetching trainer:', error);
      Alert.alert('Error', 'Failed to load trainer details');
    } finally {
      setIsLoading(false);
    }
  }, [id, user]);

  useEffect(() => {
    fetchTrainer();
  }, [fetchTrainer]);

  const toggleFavorite = async () => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to save favorites');
      return;
    }

    try {
      if (isFavorite) {
        await supabase
          .from('trainer_favorites')
          .delete()
          .eq('parent_id', user.id)
          .eq('trainer_id', id);
      } else {
        await supabase.from('trainer_favorites').insert({
          parent_id: user.id,
          trainer_id: id,
        });
      }
      setIsFavorite(!isFavorite);
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleBook = () => {
    router.push(`/book-session/${id}` as any);
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

  const homeLocation = locations.find((l) => l.is_home_base);
  const availableSlots = availability.filter((s) => !s.is_booked);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          {trainer.headshot_url ? (
            <Image source={{ uri: trainer.headshot_url }} style={styles.headshot} />
          ) : (
            <View style={styles.headshotPlaceholder}>
              <Text style={styles.headshotInitial}>
                {trainer.first_name.charAt(0)}
              </Text>
            </View>
          )}

          <TouchableOpacity style={styles.favoriteButton} onPress={toggleFavorite}>
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={24}
              color={isFavorite ? '#ef4444' : '#6b7280'}
            />
          </TouchableOpacity>
        </View>

        {/* Name & Badges */}
        <View style={styles.nameSection}>
          <View style={styles.nameRow}>
            <Text style={styles.trainerName}>
              {trainer.first_name} {trainer.last_name}
            </Text>
            {trainer.is_verified && (
              <Ionicons name="checkmark-circle" size={20} color="#10b981" />
            )}
          </View>
          <Text style={styles.trainerCollege}>{trainer.college_pro}</Text>
          <Text style={styles.trainerPosition}>
            {positionLabels[trainer.position]}
          </Text>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <View style={styles.statValue}>
              <Ionicons name="star" size={16} color="#f59e0b" />
              <Text style={styles.statNumber}>{trainer.rating.toFixed(1)}</Text>
            </View>
            <Text style={styles.statLabel}>{trainer.review_count} reviews</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{trainer.total_sessions}</Text>
            <Text style={styles.statLabel}>sessions</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statNumber}>${trainer.hourly_rate}</Text>
            <Text style={styles.statLabel}>per hour</Text>
          </View>
        </View>

        {/* Specialties */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Specialties</Text>
          <View style={styles.specialtiesGrid}>
            {trainer.specialties.map((specialty) => (
              <View key={specialty} style={styles.specialtyBadge}>
                <Text style={styles.specialtyText}>
                  {focusLabels[specialty as TrainingFocus] || specialty}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Bio */}
        {trainer.bio && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.bioText}>{trainer.bio}</Text>
          </View>
        )}

        {/* Teaching Style */}
        {trainer.teaching_style && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Teaching Style</Text>
            <Text style={styles.bioText}>{trainer.teaching_style}</Text>
          </View>
        )}

        {/* Locations */}
        {locations.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Training Locations</Text>
            {locations.map((location) => (
              <View key={location.id} style={styles.locationCard}>
                <Ionicons
                  name={location.is_home_base ? 'home' : 'location'}
                  size={20}
                  color="#1a365d"
                />
                <View style={styles.locationInfo}>
                  <Text style={styles.locationName}>{location.name}</Text>
                  <Text style={styles.locationAddress}>
                    {location.city}, {location.state}
                  </Text>
                </View>
                {location.is_home_base && (
                  <View style={styles.homeBaseBadge}>
                    <Text style={styles.homeBaseText}>Home Base</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Availability Preview */}
        {availableSlots.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Upcoming Availability</Text>
            <View style={styles.availabilityGrid}>
              {availableSlots.slice(0, 6).map((slot, index) => (
                <View key={index} style={styles.availabilitySlot}>
                  <Text style={styles.slotDate}>{formatDate(slot.available_date)}</Text>
                  <Text style={styles.slotTime}>{formatTime(slot.start_time)}</Text>
                </View>
              ))}
            </View>
            {availableSlots.length > 6 && (
              <Text style={styles.moreSlots}>
                +{availableSlots.length - 6} more times available
              </Text>
            )}
          </View>
        )}

        {/* Reviews */}
        {reviews.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Reviews</Text>
            {reviews.slice(0, 3).map((review) => (
              <View key={review.id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <View style={styles.reviewStars}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Ionicons
                        key={star}
                        name={star <= review.rating ? 'star' : 'star-outline'}
                        size={14}
                        color="#f59e0b"
                      />
                    ))}
                  </View>
                  <Text style={styles.reviewDate}>
                    {new Date(review.created_at).toLocaleDateString()}
                  </Text>
                </View>
                {review.comment && (
                  <Text style={styles.reviewText}>{review.comment}</Text>
                )}
                {review.trainer_response && (
                  <View style={styles.trainerResponse}>
                    <Text style={styles.responseLabel}>Trainer Response:</Text>
                    <Text style={styles.responseText}>{review.trainer_response}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Book CTA */}
      <View style={styles.footer}>
        <View style={styles.priceInfo}>
          <Text style={styles.footerPrice}>${trainer.hourly_rate}</Text>
          <Text style={styles.footerPriceLabel}>per hour</Text>
        </View>
        <TouchableOpacity
          style={[
            styles.bookButton,
            !trainer.is_accepting_students && styles.bookButtonDisabled,
          ]}
          onPress={handleBook}
          disabled={!trainer.is_accepting_students}
        >
          <Text style={styles.bookButtonText}>
            {trainer.is_accepting_students ? 'Request Session' : 'Not Available'}
          </Text>
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
  header: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 16,
    position: 'relative',
  },
  headshot: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#fff',
  },
  headshotPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#1a365d',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headshotInitial: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
  },
  favoriteButton: {
    position: 'absolute',
    right: 20,
    top: 20,
    padding: 8,
  },
  nameSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trainerName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginRight: 8,
  },
  trainerCollege: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 4,
  },
  trainerPosition: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    marginHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  stat: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  statValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginLeft: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#e5e7eb',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  specialtiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  specialtyBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#eff6ff',
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  specialtyText: {
    fontSize: 14,
    color: '#1a365d',
    fontWeight: '500',
  },
  bioText: {
    fontSize: 15,
    color: '#4b5563',
    lineHeight: 22,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  locationInfo: {
    flex: 1,
    marginLeft: 12,
  },
  locationName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1f2937',
  },
  locationAddress: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  homeBaseBadge: {
    backgroundColor: '#1a365d',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  homeBaseText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
  availabilityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  availabilitySlot: {
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  slotDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  slotTime: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
  },
  moreSlots: {
    fontSize: 13,
    color: '#1a365d',
    marginTop: 4,
  },
  reviewCard: {
    backgroundColor: '#f9fafb',
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewStars: {
    flexDirection: 'row',
  },
  reviewDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  reviewText: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
  },
  trainerResponse: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  responseLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  responseText: {
    fontSize: 13,
    color: '#4b5563',
    fontStyle: 'italic',
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
  priceInfo: {},
  footerPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  footerPriceLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  bookButton: {
    backgroundColor: '#1a365d',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 8,
  },
  bookButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  bookButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
