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
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { TrainerCard, TrainingFocus, focusLabels } from '../types/training';
import { Market } from '../types/database';

const specialties: TrainingFocus[] = [
  '1v1',
  'finishing',
  'passing',
  'shooting',
  'goalkeeper',
  'defense',
  'confidence',
  'game_iq',
];

export default function TrainersScreen() {
  const router = useRouter();
  const [trainers, setTrainers] = useState<TrainerCard[]>([]);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Filters
  const [selectedMarket, setSelectedMarket] = useState<string>('all');
  const [selectedSpecialty, setSelectedSpecialty] = useState<TrainingFocus | 'all'>('all');

  const fetchMarkets = useCallback(async () => {
    const { data } = await supabase
      .from('markets')
      .select('*')
      .eq('is_active', true)
      .order('display_name');
    setMarkets(data || []);
  }, []);

  const fetchTrainers = useCallback(async () => {
    try {
      let query = supabase
        .from('trainer_cards')
        .select('*')
        .eq('is_accepting_students', true);

      if (selectedMarket !== 'all') {
        query = query.contains('markets_served', [selectedMarket]);
      }

      if (selectedSpecialty !== 'all') {
        query = query.contains('specialties', [selectedSpecialty]);
      }

      const { data, error } = await query.order('rating', { ascending: false });

      if (error) throw error;

      let filtered = data || [];

      // Client-side search filter
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter(
          (t) =>
            t.first_name.toLowerCase().includes(q) ||
            t.last_name.toLowerCase().includes(q) ||
            t.college_pro.toLowerCase().includes(q) ||
            t.specialties.some((s: string) => s.toLowerCase().includes(q))
        );
      }

      setTrainers(filtered);
    } catch (error) {
      console.error('Error fetching trainers:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedMarket, selectedSpecialty, searchQuery]);

  useEffect(() => {
    fetchMarkets();
  }, [fetchMarkets]);

  useEffect(() => {
    setIsLoading(true);
    fetchTrainers();
  }, [fetchTrainers]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchTrainers();
  };

  const renderTrainerCard = ({ item }: { item: TrainerCard }) => (
    <TouchableOpacity
      style={styles.trainerCard}
      onPress={() => router.push(`/trainer/${item.id}` as any)}
    >
      <View style={styles.cardHeader}>
        {item.headshot_url ? (
          <Image source={{ uri: item.headshot_url }} style={styles.headshot} />
        ) : (
          <View style={styles.headshotPlaceholder}>
            <Text style={styles.headshotInitial}>
              {item.first_name.charAt(0)}
            </Text>
          </View>
        )}
        <View style={styles.cardHeaderInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.trainerName}>
              {item.first_name} {item.last_name}
            </Text>
            {item.is_verified && (
              <Ionicons name="checkmark-circle" size={16} color="#10b981" />
            )}
          </View>
          <Text style={styles.trainerCollege}>{item.college_pro}</Text>
          {item.tagline && (
            <Text style={styles.tagline} numberOfLines={1}>
              {item.tagline}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.specialtiesRow}>
        {item.specialties.slice(0, 3).map((specialty) => (
          <View key={specialty} style={styles.specialtyBadge}>
            <Text style={styles.specialtyText}>
              {focusLabels[specialty as TrainingFocus] || specialty}
            </Text>
          </View>
        ))}
        {item.specialties.length > 3 && (
          <View style={styles.specialtyBadge}>
            <Text style={styles.specialtyText}>+{item.specialties.length - 3}</Text>
          </View>
        )}
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.ratingContainer}>
          <Ionicons name="star" size={16} color="#f59e0b" />
          <Text style={styles.rating}>{item.rating.toFixed(1)}</Text>
          <Text style={styles.reviewCount}>({item.review_count} reviews)</Text>
        </View>
        <View style={styles.priceContainer}>
          <Text style={styles.price}>${item.hourly_rate}</Text>
          <Text style={styles.priceLabel}>/hour</Text>
        </View>
      </View>

      {item.home_location && (
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={14} color="#6b7280" />
          <Text style={styles.locationText}>
            {item.home_location.city}, {item.home_location.state}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#9ca3af" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search trainers, skills..."
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

      {/* Filters */}
      <View style={styles.filters}>
        {/* Market Filter */}
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[{ slug: 'all', display_name: 'All Areas' }, ...markets]}
          keyExtractor={(item) => item.slug}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterChip,
                selectedMarket === item.slug && styles.filterChipActive,
              ]}
              onPress={() => setSelectedMarket(item.slug)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedMarket === item.slug && styles.filterChipTextActive,
                ]}
              >
                {item.display_name}
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.filterList}
        />

        {/* Specialty Filter */}
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[{ value: 'all', label: 'All Skills' }, ...specialties.map((s) => ({ value: s, label: focusLabels[s] }))]}
          keyExtractor={(item) => item.value}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.specialtyChip,
                selectedSpecialty === item.value && styles.specialtyChipActive,
              ]}
              onPress={() => setSelectedSpecialty(item.value as TrainingFocus | 'all')}
            >
              <Text
                style={[
                  styles.specialtyChipText,
                  selectedSpecialty === item.value && styles.specialtyChipTextActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.filterList}
        />
      </View>

      {/* Trainers List */}
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#1a365d" />
        </View>
      ) : (
        <FlatList
          data={trainers}
          keyExtractor={(item) => item.id}
          renderItem={renderTrainerCard}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="people-outline" size={64} color="#d1d5db" />
              <Text style={styles.emptyTitle}>No trainers found</Text>
              <Text style={styles.emptyText}>
                Try adjusting your filters or search
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
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
  filters: {
    backgroundColor: '#fff',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  filterList: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#1a365d',
  },
  filterChipText: {
    fontSize: 14,
    color: '#6b7280',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  specialtyChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginRight: 8,
  },
  specialtyChipActive: {
    backgroundColor: '#1a365d',
    borderColor: '#1a365d',
  },
  specialtyChipText: {
    fontSize: 13,
    color: '#6b7280',
  },
  specialtyChipTextActive: {
    color: '#fff',
  },
  list: {
    padding: 16,
  },
  trainerCard: {
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
  headshot: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginRight: 12,
  },
  headshotPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#1a365d',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headshotInitial: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  cardHeaderInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trainerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginRight: 6,
  },
  trainerCollege: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  tagline: {
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 2,
    fontStyle: 'italic',
  },
  specialtiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  specialtyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  specialtyText: {
    fontSize: 12,
    color: '#1a365d',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginLeft: 4,
  },
  reviewCount: {
    fontSize: 12,
    color: '#9ca3af',
    marginLeft: 4,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  price: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a365d',
  },
  priceLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  locationText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4,
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
});
